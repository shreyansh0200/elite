import BuyRequest from '../models/BuyRequest.js';
import MarketListing from '../models/MarketListing.js';
import SaleRecord from '../models/SaleRecord.js';
import User from '../models/User.js';
import { notify } from '../utils/notify.js';
import { token } from '../utils/token.js';

async function resolveHubManagerForListing(listing) {
  if (listing.hubManagerId) {
    const direct = await User.findOne({ _id: listing.hubManagerId, role: 'hubmanager', active: true }).select('_id city');
    if (direct) return direct;
  }

  const city = String(listing.city || '').trim();
  if (!city) return null;

  return User.findOne({
    role: 'hubmanager',
    active: true,
    city: { $regex: `^${city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
  }).select('_id city');
}

export async function createBuy(req, res) {
  const { listingId, quantity, notes } = req.body;
  const numericQuantity = Number(quantity);

  const listing = await MarketListing.findOne({
    _id: listingId,
    status: 'active',
  });

  if (!listing) {
    return res.status(404).json({ message: 'Listing is unavailable' });
  }

  if (
    !Number.isFinite(numericQuantity) ||
    numericQuantity <= 0 ||
    numericQuantity > listing.availableQuantity
  ) {
    return res.status(400).json({ message: 'Invalid purchase quantity' });
  }

  const hub = await resolveHubManagerForListing(listing);

  if (!hub) {
    return res.status(409).json({
      message: `No active hub manager is configured for ${listing.city || 'this listing city'}.`,
    });
  }

  const request = await BuyRequest.create({
    listingId: listing._id,
    sourceRequestId: listing.sourceRequestId,
    consumerId: req.user._id,
    consumerName: req.user.name,
    consumerPhone: req.user.phone,
    cropType: listing.cropType,
    quantity: numericQuantity,
    quantityUnit: listing.quantityUnit,
    pricePerUnit: listing.pricePerUnit,
    estimatedValue: numericQuantity * listing.pricePerUnit,
    farmerId: listing.farmerId,
    farmerName: listing.farmerName,
    pickupLocation: listing.location,
    city: listing.city || hub.city,
    notes: String(notes || '').trim(),
    hubManagerId: hub._id,
  });

  await notify(
    hub._id,
    `New buy request from ${req.user.name} for ${numericQuantity} ${listing.quantityUnit} ${listing.cropType} in ${listing.city || hub.city}.`,
    'info',
  );

  return res.status(201).json(request);
}

export async function myBuys(req, res) {
  const requests = await BuyRequest.find({
    consumerId: req.user._id,
  })
    .sort({ createdAt: -1 })
    .populate('listingId');

  return res.json(requests);
}

export async function managerBuys(req, res) {
  const requests = await BuyRequest.find({ hubManagerId: req.user._id }).sort({ createdAt: -1 });
  return res.json(requests);
}

export async function grantBuy(req, res) {
  const { timeSlot } = req.body;

  const request = await BuyRequest.findOne({
    _id: req.params.id,
    hubManagerId: req.user._id,
    status: 'pending',
  });

  if (!request) {
    return res.status(404).json({ message: 'Pending request not found for your hub' });
  }

  const listing = await MarketListing.findOneAndUpdate(
    {
      _id: request.listingId,
      hubManagerId: req.user._id,
      status: 'active',
      availableQuantity: { $gte: request.quantity },
    },
    [
      {
        $set: {
          availableQuantity: {
            $subtract: ['$availableQuantity', request.quantity],
          },
        },
      },
      {
        $set: {
          status: {
            $cond: [
              { $gt: ['$availableQuantity', 0] },
              'active',
              'sold_out',
            ],
          },
        },
      },
    ],
    { new: true },
  );

  if (!listing) {
    return res.status(409).json({ message: 'Insufficient inventory at your hub' });
  }

  request.status = 'granted';
  request.buyerToken = token('BUY');
  request.timeSlot = timeSlot || '12:00 PM - 01:00 PM';

  await request.save();

  await SaleRecord.create({
    buyRequestId: request._id,
    listingId: listing._id,
    farmerId: request.farmerId,
    customerId: request.consumerId,
    cropType: request.cropType,
    quantity: request.quantity,
    unit: request.quantityUnit,
    amount: request.estimatedValue,
    token: request.buyerToken,
  });

  await notify(
    request.consumerId,
    `Purchase approved by ${request.city || 'your hub'} hub. Token ${request.buyerToken}, slot ${request.timeSlot}.`,
    'success',
  );

  await notify(
    request.farmerId,
    `${request.quantity} ${request.quantityUnit} of your ${request.cropType} has been reserved for buyer ${request.consumerName}.`,
    'info',
  );

  return res.json(request);
}


export async function findReceiverToken(req, res) {
  const buyerToken = String(req.query.buyerToken || '').trim();
  if (!buyerToken) {
    return res.status(400).json({ message: 'Enter the receiver token shown on the customer ticket.' });
  }

  const request = await BuyRequest.findOne({
    hubManagerId: req.user._id,
    buyerToken: { $regex: `^${buyerToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
    status: 'granted',
  });

  if (!request) {
    return res.status(404).json({
      message: 'No active receiver ticket with this token was found for your hub.',
    });
  }

  return res.json({
    _id: request._id,
    buyerToken: request.buyerToken,
    status: request.status,
    consumerId: request.consumerId,
    consumerName: request.consumerName,
    consumerPhone: request.consumerPhone,
    cropType: request.cropType,
    quantity: request.quantity,
    quantityUnit: request.quantityUnit,
    estimatedValue: request.estimatedValue,
    pickupLocation: request.pickupLocation,
    city: request.city,
    timeSlot: request.timeSlot,
    notes: request.notes,
  });
}

export async function matchReceiverToken(req, res) {
  const buyerToken = String(req.body.buyerToken || '').trim();
  if (!buyerToken) {
    return res.status(400).json({ message: 'Receiver token is required.' });
  }

  const request = await BuyRequest.findOne({
    hubManagerId: req.user._id,
    buyerToken: { $regex: `^${buyerToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
    status: 'granted',
  });

  if (!request) {
    return res.status(404).json({
      message: 'No active receiver ticket with this token was found for your hub.',
    });
  }

  request.status = 'completed';
  request.physicalMatchedAt = new Date();
  request.physicalMatchedBy = req.user._id;
  await request.save();

  await notify(
    request.consumerId,
    `Receiver token ${request.buyerToken} has been physically verified at the ${request.city || 'hub'} hub. Your pickup is marked completed.`,
    'success',
  );

  return res.json({
    message: 'Receiver token physically matched successfully. Pickup marked completed.',
    request,
  });
}

export async function rejectBuy(req, res) {
  const request = await BuyRequest.findOneAndUpdate(
    { _id: req.params.id, hubManagerId: req.user._id, status: 'pending' },
    { status: 'rejected' },
    { new: true },
  );

  if (!request) {
    return res.status(404).json({ message: 'Pending request not found for your hub' });
  }

  await notify(
    request.consumerId,
    `Your purchase request for ${request.cropType} was rejected by the ${request.city || 'hub'} hub.`,
    'error',
  );

  return res.json(request);
}
