import mongoose, { Schema, Document } from 'mongoose';

export interface IHangout extends Document {
  hostId: string;
  participants: { userId: string }[];
  acceptedBy: string[];
  rejectedBy: string[];
  activityDescription: string;
  details?: string; // Optional details field
  timestamp: Date;
  status: 'pending_approval' | 'pending' | 'confirmed' | 'cancelled';
}

const hangoutSchema = new Schema<IHangout>({
  hostId: { type: String, required: true },
  participants: [{
      userId: { type: String, required: true }
  }],
  acceptedBy: [{ type: String }],
  rejectedBy: [{ type: String }],
  activityDescription: { type: String, required: true },
  details: { type: String }, // Add details to schema
  timestamp: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['pending_approval', 'pending', 'confirmed', 'cancelled'],
    default: 'pending',
  },
}, {
    timestamps: true
});

const Hangout = mongoose.model<IHangout>('Hangout', hangoutSchema);
export default Hangout;
