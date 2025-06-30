import { Request, Response } from 'express';
import ConnectionRequest from '../models/ConnectionRequest';
import User from '../models/User';
import Hangout from '../models/Hangout';
 
export const getMyConnectionRequests = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const requests = await ConnectionRequest.find({
        approverId: userId,
        status: 'pending'
    });
    // Frontend expects 'id'
    const formattedRequests = requests.map(r => ({ ...r.toObject(), id: String(r._id) }));
    res.json(formattedRequests);
};

export const handleConnectionApproval = async (req: Request, res: Response) => {
    const { decision } = req.body;
    const requestId = req.params.id;
    const approverId = req.user!.id;

    const request = await ConnectionRequest.findById(requestId);

    if (!request) {
        return res.status(404).json({ message: 'Connection request not found' });
    }
    if (request.approverId.toString() !== approverId) {
        return res.status(403).json({ message: 'Not authorized to handle this request' });
    }
    if (request.status !== 'pending') {
        return res.status(400).json({ message: 'This request has already been handled' });
    }

    request.status = decision;
    await request.save();

    if (decision === 'approved') {
        // Add the approved user to the requester's list of approved connections
        await User.findByIdAndUpdate(request.requesterId, {
            $addToSet: { approvedSecondDegreeConnections: request.requestedId.toString() }
        });
    }

    // Check if the associated hangout can now be moved to 'pending'
    const remainingRequests = await ConnectionRequest.countDocuments({
        hangoutId: request.hangoutId,
        status: 'pending'
    });

    if (remainingRequests === 0) {
        const hangout = await Hangout.findById(request.hangoutId);
        // Only update if it was pending approval. If it was cancelled, do nothing.
        if (hangout && hangout.status === 'pending_approval') {
            hangout.status = 'pending';
            await hangout.save();
        }
    }

    res.status(204).send();
};