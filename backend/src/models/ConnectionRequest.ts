
import mongoose, { Schema, Document } from 'mongoose';

export interface IConnectionRequest extends Document {
  requesterId: string;
  requestedId: string;
  approverId: string;
  status: 'pending' | 'approved' | 'rejected';
  hangoutId: mongoose.Types.ObjectId;
}

const connectionRequestSchema = new Schema<IConnectionRequest>({
  requesterId: { type: String, required: true },
  requestedId: { type: String, required: true },
  approverId: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  hangoutId: { type: Schema.Types.ObjectId, ref: 'Hangout', required: true },
}, {
    timestamps: true
});

const ConnectionRequest = mongoose.model<IConnectionRequest>('ConnectionRequest', connectionRequestSchema);
export default ConnectionRequest;