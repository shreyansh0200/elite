import mongoose from 'mongoose';

// A Slot is a hub pickup window with a fixed quintal capacity — the
// equivalent of a train/class in an IRCTC-style booking system. Farmers
// book against this capacity instead of receiving a hub-manager-assigned
// token.
const schema = new mongoose.Schema(
  {
    hubManagerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    city: { type: String, trim: true, index: true },
    date: { type: String, required: true }, // 'YYYY-MM-DD'
    startTime: { type: String, required: true }, // e.g. '10:00 AM'
    endTime: { type: String, required: true }, // e.g. '11:00 AM'
    location: { type: String, default: '' },
    capacityQuintal: { type: Number, required: true, min: 1 },
    bookedQuintal: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['open', 'closed'], default: 'open', index: true },
  },
  { timestamps: true },
);

schema.virtual('availableQuintal').get(function availableQuintal() {
  return Math.max(0, this.capacityQuintal - this.bookedQuintal);
});

schema.set('toJSON', { virtuals: true });
schema.set('toObject', { virtuals: true });

export default mongoose.model('Slot', schema);
