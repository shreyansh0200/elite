import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'MarketListing', required: true },
    sourceRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'TokenRequest' },
    consumerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    consumerName: String,
    consumerPhone: String,
    cropType: String,
    quantity: Number,
    quantityUnit: String,
    pricePerUnit: Number,
    estimatedValue: Number,
    farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    farmerName: String,
    pickupLocation: String,
    city: { type: String, trim: true, index: true },
    notes: String,
    status: { type: String, enum: ['pending', 'granted', 'rejected', 'completed'], default: 'pending' },
    buyerToken: { type: String, unique: true, sparse: true },
    timeSlot: String,
    physicalMatchedAt: Date,
    physicalMatchedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    hubManagerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  },
  { timestamps: true },
);

export default mongoose.model('BuyRequest', schema);
