import mongoose from 'mongoose';

// NOTE: model/collection name kept as "TokenRequest" so existing production
// data isn't orphaned by a rename. Functionally this now represents an
// IRCTC-style hub pickup TICKET: farmers book a Slot themselves and get an
// instant CONFIRMED or WAITLISTED ticket instead of waiting for a
// hub-manager-issued token.
const schema = new mongoose.Schema(
  {
    farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    farmerName: String,
    farmerPhone: String,
    city: { type: String, trim: true, index: true },
    cropType: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0.01 },
    quantityUnit: { type: String, default: 'Quintal' },
    expectedPrice: { type: Number, default: 0 },
    photoUrl: { type: String, default: '' },
    location: String,
    notes: String,

    // 'confirmed'  -> capacity was available at booking time (CNF)
    // 'waitlisted' -> slot was full at booking time (WL)
    // 'rejected'   -> hub manager cancelled the ticket
    // 'cancelled'  -> farmer cancelled the ticket
    // 'received'   -> manager physically verified the ticket and accepted crop
    // 'completed'  -> final completed state (kept for compatibility)
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'waitlisted', 'granted', 'rejected', 'cancelled', 'received', 'completed'],
      default: 'pending',
      index: true,
    },

    // A ticket reserves a hub slot; it does NOT mean the crop has been
    // physically delivered. The crop is submitted only when the farmer
    // reaches the hub and the manager verifies the ticket number.
    submissionSource: {
      type: String,
      enum: ['farmer_online', 'hub_manager_physical'],
      default: 'farmer_online',
      index: true,
    },
    receivedQuantity: { type: Number, default: 0, min: 0 },
    receivedQuantityUnit: { type: String, default: 'Quintal' },
    qualityGrade: { type: String, default: '' },
    submissionNotes: { type: String, default: '' },
    receivedAt: { type: Date, default: null, index: true },
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    marketListingId: { type: mongoose.Schema.Types.ObjectId, ref: 'MarketListing', default: null, index: true },

    tokenNumber: String, // PNR-style ticket number (e.g. 2609051234, or "WL/3")
    slotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot', index: true },
    timeSlot: String, // human-readable snapshot, e.g. "05 Sep 2026, 10:00 AM - 11:00 AM"
    fare: { type: Number, default: 0 }, // ₹100 per 36 quintal, computed at booking time
    quintalEquivalent: { type: Number, default: 0 }, // quantity converted to quintal, reserved against the slot
    waitlistPosition: { type: Number, default: 0 }, // WL position within the slot, 0 once confirmed

    hubManagerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    soldQuantity: { type: Number, default: 0 },
    remainingQuantity: { type: Number, default: 0 },
    marketStatus: { type: String, default: 'pending' },
  },
  { timestamps: true },
);

export default mongoose.model('TokenRequest', schema);
