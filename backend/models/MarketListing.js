import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    sourceRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'TokenRequest', index: true },
    farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    farmerName: String,
    hubManagerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    city: { type: String, trim: true, index: true },
    cropType: { type: String, required: true, trim: true, index: true },
    description: String,
    totalQuantity: { type: Number, min: 0 },
    availableQuantity: { type: Number, min: 0, index: true },
    quantityUnit: { type: String, default: 'Quintal' },
    pricePerUnit: { type: Number, min: 0, default: 0 },
    photoUrl: String,
    location: String,
    status: {
      type: String,
      enum: ['active', 'sold_out', 'inactive'],
      default: 'active',
      index: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model('MarketListing', schema);
