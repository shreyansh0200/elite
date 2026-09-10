import MarketListing from '../models/MarketListing.js';
import Slot from '../models/Slot.js';
import TokenRequest from '../models/TokenRequest.js';
import User from '../models/User.js';
import { notify } from '../utils/notify.js';
import { pnr } from '../utils/token.js';
import { computeFare, toQuintal } from '../utils/fare.js';

// ---------------------------------------------------------------------------
// Slots — the hub manager's "train schedule". Farmers book against these
// instead of submitting a request and waiting for a manually granted token.
// ---------------------------------------------------------------------------

export async function listOpenSlots(req, res) {
  const today = new Date().toISOString().slice(0, 10);
  const managerFilter = req.user.city
    ? { city: { $regex: `^${String(req.user.city).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }, role: 'hubmanager', active: true }
    : { role: 'hubmanager', active: true };
  const managers = await User.find(managerFilter).select('_id');
  const managerIds = managers.map((manager) => manager._id);

  const slots = await Slot.find({
    status: 'open',
    date: { $gte: today },
    hubManagerId: { $in: managerIds },
  }).sort({ date: 1, startTime: 1 });
  return res.json(slots);
}

export async function createSlot(req, res) {
  const { date, startTime, endTime, capacityQuintal, location } = req.body;

  const cleanDate = String(date || '').trim();
  const cleanStart = String(startTime || '').trim();
  const cleanEnd = String(endTime || '').trim();
  const capacity = Number(capacityQuintal);

  if (!cleanDate || !cleanStart || !cleanEnd) {
    return res.status(400).json({ message: 'Date, start time and end time are required' });
  }

  if (!Number.isFinite(capacity) || capacity <= 0) {
    return res.status(400).json({ message: 'Capacity must be a positive number of quintals' });
  }

  const slot = await Slot.create({
    hubManagerId: req.user._id,
    date: cleanDate,
    startTime: cleanStart,
    endTime: cleanEnd,
    location: String(location || `${req.user.city || 'AgriSync'} Hub`).trim(),
    city: req.user.city || '',
    capacityQuintal: capacity,
  });

  return res.status(201).json(slot);
}

export async function managerSlots(req, res) {
  const slots = await Slot.find({ hubManagerId: req.user._id }).sort({
    date: -1,
    startTime: 1,
  });
  return res.json(slots);
}

export async function closeSlot(req, res) {
  const slot = await Slot.findOneAndUpdate(
    { _id: req.params.id, hubManagerId: req.user._id },
    { status: 'closed' },
    { new: true },
  );

  if (!slot) {
    return res.status(404).json({ message: 'Slot not found' });
  }

  return res.json(slot);
}

// ---------------------------------------------------------------------------
// Tickets — booking against a slot's remaining quintal capacity.
// ---------------------------------------------------------------------------

async function renumberWaitlist(slotId) {
  const waiting = await TokenRequest.find({ slotId, status: 'waitlisted' }).sort({
    waitlistPosition: 1,
    createdAt: 1,
  });

  await Promise.all(
    waiting.map((wl, idx) => {
      const position = idx + 1;
      if (wl.waitlistPosition === position && wl.tokenNumber === `WL/${position}`) return null;
      wl.waitlistPosition = position;
      wl.tokenNumber = `WL/${position}`;
      return wl.save();
    }),
  );
}

// Frees a confirmed ticket's capacity (or removes a waitlisted one) and, like
// IRCTC auto-clearing a waitlist after a cancellation, promotes whichever
// waitlisted tickets now fit into the freed space.
async function releaseTicket(ticket, newStatus, message) {
  const wasConfirmed = ticket.status === 'confirmed';
  const { slotId } = ticket;

  ticket.status = newStatus;
  ticket.waitlistPosition = 0;
  await ticket.save();

  await MarketListing.findOneAndUpdate({ sourceRequestId: ticket._id }, { status: 'inactive' });
  await notify(ticket.farmerId, message, 'error');

  if (!slotId) return;
  const slot = await Slot.findById(slotId);
  if (!slot) return;

  if (wasConfirmed) {
    slot.bookedQuintal = Math.max(0, slot.bookedQuintal - ticket.quintalEquivalent);

    const waitlisted = await TokenRequest.find({ slotId, status: 'waitlisted' }).sort({
      waitlistPosition: 1,
      createdAt: 1,
    });

    for (const wl of waitlisted) {
      const available = slot.capacityQuintal - slot.bookedQuintal;
      if (available < wl.quintalEquivalent) continue; // doesn't fit yet, stays on the waitlist

      slot.bookedQuintal += wl.quintalEquivalent;

      wl.status = 'confirmed';
      wl.tokenNumber = pnr();
      wl.waitlistPosition = 0;
      wl.remainingQuantity = wl.quantity;
      wl.marketStatus = 'pending';
      await wl.save();

      await notify(
        wl.farmerId,
        `Good news — your waitlisted ticket for ${wl.cropType} is now CONFIRMED. PNR ${wl.tokenNumber}, slot ${wl.timeSlot}.`,
        'success',
      );
    }

    await slot.save();
  }

  await renumberWaitlist(slotId);
}

export async function bookSlot(req, res) {
  const {
    cropType,
    quantity,
    quantityUnit,
    expectedPrice,
    location,
    notes,
    photoUrl,
    slotId,
  } = req.body;

  const cleanCrop = String(cropType || '').trim();
  const numericQuantity = Number(quantity);
  const numericPrice = Number(expectedPrice || 0);
  const unit = quantityUnit || 'Quintal';

  if (!cleanCrop || !Number.isFinite(numericQuantity) || numericQuantity <= 0) {
    return res.status(400).json({ message: 'Enter a valid crop name and quantity' });
  }

  if (!Number.isFinite(numericPrice) || numericPrice < 0) {
    return res.status(400).json({ message: 'Expected price must be valid' });
  }

  if (!slotId) {
    return res.status(400).json({ message: 'Choose a pickup slot to book' });
  }

  const slot = await Slot.findOne({ _id: slotId, status: 'open' });

  if (!slot) {
    return res.status(404).json({ message: 'That slot is no longer available. Please pick another.' });
  }

  if (req.user.city && slot.city && req.user.city.trim().toLowerCase() !== slot.city.trim().toLowerCase()) {
    return res.status(403).json({ message: 'This pickup slot belongs to another city hub.' });
  }

  const quintalEquivalent = toQuintal(numericQuantity, unit);
  const fare = computeFare(quintalEquivalent);
  const available = slot.capacityQuintal - slot.bookedQuintal;
  const willConfirm = available >= quintalEquivalent;
  const timeSlotLabel = `${slot.date}, ${slot.startTime} - ${slot.endTime}`;

  const ticket = await TokenRequest.create({
    farmerId: req.user._id,
    farmerName: req.user.name,
    farmerPhone: req.user.phone,
    city: slot.city || req.user.city || '',
    cropType: cleanCrop,
    quantity: numericQuantity,
    quantityUnit: unit,
    expectedPrice: numericPrice,
    location: String(location || req.user.location || '').trim(),
    notes: String(notes || '').trim(),
    photoUrl: photoUrl || '',
    slotId: slot._id,
    hubManagerId: slot.hubManagerId,
    timeSlot: timeSlotLabel,
    fare,
    quintalEquivalent,
  });

  if (willConfirm) {
    slot.bookedQuintal += quintalEquivalent;
    await slot.save();

    ticket.status = 'confirmed';
    ticket.tokenNumber = pnr();
    ticket.remainingQuantity = ticket.quantity;
    ticket.marketStatus = 'pending';
    ticket.submissionSource = 'farmer_online';
    await ticket.save();

    await notify(
      ticket.farmerId,
      `Ticket CONFIRMED for ${ticket.cropType} — PNR ${ticket.tokenNumber}, slot ${timeSlotLabel}. Fare ₹${fare}.`,
      'success',
    );
  } else {
    const waitlistCount = await TokenRequest.countDocuments({ slotId: slot._id, status: 'waitlisted' });
    const position = waitlistCount + 1;

    ticket.status = 'waitlisted';
    ticket.tokenNumber = `WL/${position}`;
    ticket.waitlistPosition = position;
    await ticket.save();

    await notify(
      ticket.farmerId,
      `Slot full — you're WAITLISTED (${ticket.tokenNumber}) for ${ticket.cropType}, slot ${timeSlotLabel}. Fare ₹${fare} on confirmation.`,
      'info',
    );
  }

  if (slot.hubManagerId) {
    await notify(
      slot.hubManagerId,
      `${req.user.name} booked ${numericQuantity} ${unit} ${cleanCrop} — ${ticket.status.toUpperCase()} (${ticket.tokenNumber}).`,
      'info',
    );
  }

  return res.status(201).json(ticket);
}

export async function listRequests(req, res) {
  const requests = await TokenRequest.find({ farmerId: req.user._id }).sort({ createdAt: -1 });
  return res.json(requests);
}

export async function managerRequests(req, res) {
  const requests = await TokenRequest.find({ hubManagerId: req.user._id }).sort({ createdAt: -1 });
  return res.json(requests);
}

export async function managerStocks(req, res) {
  const stocks = await MarketListing.find({ hubManagerId: req.user._id })
    .sort({ status: 1, createdAt: -1 })
    .lean();
  return res.json(stocks.map((stock) => ({
    ...stock,
    soldQuantity: Math.max(0, Number(stock.totalQuantity || 0) - Number(stock.availableQuantity || 0)),
  })));
}

export async function cancelBooking(req, res) {
  const ticket = await TokenRequest.findOne({
    _id: req.params.id,
    farmerId: req.user._id,
    status: { $in: ['confirmed', 'waitlisted'] },
  });

  if (!ticket) {
    return res.status(404).json({ message: 'Active ticket not found' });
  }

  await releaseTicket(
    ticket,
    'cancelled',
    `Your ${ticket.cropType} ticket (${ticket.tokenNumber}) has been cancelled.`,
  );

  return res.json(ticket);
}

export async function rejectFarmer(req, res) {
  const ticket = await TokenRequest.findOne({
    _id: req.params.id,
    hubManagerId: req.user._id,
    status: { $in: ['confirmed', 'waitlisted'] },
  });

  if (!ticket) {
    return res.status(404).json({ message: 'Active ticket not found' });
  }

  await releaseTicket(
    ticket,
    'rejected',
    `Your ${ticket.cropType} ticket (${ticket.tokenNumber}) was cancelled by the hub.`,
  );

  return res.json(ticket);
}

// ---------------------------------------------------------------------------
// Physical crop receipt — the farmer must bring the confirmed ticket number
// to the hub. The hub manager verifies the ticket, records the actual
// received quantity, and only then creates/updates the hub stock listing.
// ---------------------------------------------------------------------------

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function findTicketForPhysicalSubmission(req, res) {
  const ticketNumber = String(req.query.ticketNumber || '').trim();
  if (!ticketNumber) {
    return res.status(400).json({ message: 'Enter the farmer ticket number.' });
  }

  const ticket = await TokenRequest.findOne({
    hubManagerId: req.user._id,
    tokenNumber: { $regex: `^${escapeRegex(ticketNumber)}$`, $options: 'i' },
    status: 'confirmed',
  }).lean();

  if (!ticket) {
    return res.status(404).json({
      message: 'No confirmed ticket with this number was found in your hub. Verify the ticket number and city hub.',
    });
  }

  return res.json({
    _id: ticket._id,
    tokenNumber: ticket.tokenNumber,
    status: ticket.status,
    farmerName: ticket.farmerName,
    farmerPhone: ticket.farmerPhone,
    farmerId: ticket.farmerId,
    city: ticket.city,
    cropType: ticket.cropType,
    bookedQuantity: ticket.quantity,
    bookedQuantityUnit: ticket.quantityUnit,
    expectedPrice: ticket.expectedPrice,
    timeSlot: ticket.timeSlot,
    location: ticket.location,
    notes: ticket.notes,
  });
}

export async function receivePhysicalSubmission(req, res) {
  const {
    ticketNumber,
    receivedQuantity,
    receivedQuantityUnit,
    qualityGrade,
    submissionNotes,
  } = req.body;

  const cleanTicketNumber = String(ticketNumber || '').trim();
  const numericReceived = Number(receivedQuantity);
  const unit = String(receivedQuantityUnit || 'Quintal').trim();

  if (!cleanTicketNumber) {
    return res.status(400).json({ message: 'Ticket number is required.' });
  }
  if (!Number.isFinite(numericReceived) || numericReceived <= 0) {
    return res.status(400).json({ message: 'Enter a valid received quantity.' });
  }
  if (!unit) {
    return res.status(400).json({ message: 'Received quantity unit is required.' });
  }

  const ticket = await TokenRequest.findOne({
    hubManagerId: req.user._id,
    tokenNumber: { $regex: `^${escapeRegex(cleanTicketNumber)}$`, $options: 'i' },
    status: 'confirmed',
  });

  if (!ticket) {
    return res.status(404).json({
      message: 'Confirmed ticket not found, or this ticket is not assigned to your hub.',
    });
  }

  const listing = await MarketListing.findOneAndUpdate(
    { sourceRequestId: ticket._id },
    {
      $set: {
        farmerId: ticket.farmerId,
        farmerName: ticket.farmerName,
        hubManagerId: req.user._id,
        city: ticket.city || req.user.city || '',
        cropType: ticket.cropType,
        description: String(submissionNotes || ticket.notes || `Received ${ticket.cropType} lot`).trim(),
        totalQuantity: numericReceived,
        availableQuantity: numericReceived,
        quantityUnit: unit,
        pricePerUnit: Number(ticket.expectedPrice || 0),
        photoUrl: ticket.photoUrl,
        location: ticket.location,
        status: 'active',
      },
      $setOnInsert: { sourceRequestId: ticket._id },
    },
    { upsert: true, new: true },
  );

  ticket.status = 'received';
  ticket.submissionSource = 'hub_manager_physical';
  ticket.receivedQuantity = numericReceived;
  ticket.receivedQuantityUnit = unit;
  ticket.qualityGrade = String(qualityGrade || '').trim();
  ticket.submissionNotes = String(submissionNotes || '').trim();
  ticket.receivedAt = new Date();
  ticket.receivedBy = req.user._id;
  ticket.marketListingId = listing._id;
  ticket.remainingQuantity = numericReceived;
  ticket.marketStatus = 'active';
  await ticket.save();

  await notify(
    ticket.farmerId,
    `Your crop has been RECEIVED at the ${ticket.city || req.user.city || ''} hub against ticket ${ticket.tokenNumber}. Received ${numericReceived} ${unit}.`,
    'success',
  );

  return res.json({
    message: 'Physical crop submission recorded successfully. The crop is now in hub stock.',
    ticket,
    listing,
  });
}

