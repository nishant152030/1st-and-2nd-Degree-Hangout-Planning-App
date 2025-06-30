import { Request, Response } from 'express';
import Hangout, { IHangout } from '../models/Hangout';
import User from '../models/User';
import ConnectionRequest from '../models/ConnectionRequest';

const populateHangout = async (hangout: IHangout) => {
    const participantUserIds = hangout.participants.map(p => p.userId);
    const allMemberIds = [hangout.hostId, ...participantUserIds];
    const users = await User.find({ _id: { $in: allMemberIds } }).select('_id name profileImageUrl');
    const userMap = new Map(users.map(u => [String(u._id), { id: String(u._id), name: u.name, profileImageUrl: u.profileImageUrl }]));
    
    return {
        ...hangout.toObject(),
        id: String(hangout._id),
        participants: hangout.participants.map(p => userMap.get(String(p.userId))).filter(Boolean),
        host: userMap.get(String(hangout.hostId))
    };
};

export const getHangouts = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const hangouts = await Hangout.find({
        $and: [
            { status: { $ne: 'cancelled' } },
            { $or: [{ hostId: userId }, { 'participants.userId': userId }] }
        ]
    }).sort({ createdAt: -1 });

    const populatedHangouts = await Promise.all(hangouts.map(populateHangout));
    res.json(populatedHangouts);
};

export const createHangout = async (req: Request, res: Response) => {
    const { participants, activityDescription, details } = req.body; // Add details from request body
    const hostId = req.user!.id;

    const host = await User.findById(hostId);
    if (!host) return res.status(404).json({ message: 'Host user not found' });

    const participantIds = participants.map((p: { id: string }) => p.id);
    const newHangout = new Hangout({
        hostId,
        participants: participantIds.map((id: string) => ({ userId: id })),
        activityDescription,
        details, // Save details to DB
        status: 'pending' // Default status
    });

    newHangout.acceptedBy.push(hostId);
    const updatedHangout = await newHangout.save();
    await populateHangout(updatedHangout);
    
    const secondDegreeConnectionRequests: any[] = [];
    for (const participantId of participantIds) {
        // If participant is not a 1st degree friend...
        if (!host.firstDegreeFriendIds.includes(participantId)) {
            // ... and has not been previously approved...
            if (!host.approvedSecondDegreeConnections.includes(participantId)) {
                // Find the mutual friend who can approve
                const secondDegreeUser = await User.findById(participantId);
                if (!secondDegreeUser) continue;

                const mutualFriendId = host.firstDegreeFriendIds.find(friendId =>
                    secondDegreeUser.firstDegreeFriendIds.includes(friendId)
                );

                if (mutualFriendId) {
                    secondDegreeConnectionRequests.push({
                        requesterId: hostId,
                        requestedId: participantId,
                        approverId: mutualFriendId,
                        hangoutId: newHangout._id
                    });
                }
            }
        }
    }

    if (secondDegreeConnectionRequests.length > 0) {
        newHangout.status = 'pending_approval';
        await ConnectionRequest.insertMany(secondDegreeConnectionRequests);
    }

    await newHangout.save();
    // Ensure response is only sent once
    return res.status(201).json(await populateHangout(newHangout));
};

export const cancelHangout = async (req: Request, res: Response) => {
    const hangout = await Hangout.findById(req.params.id);
    if (!hangout) return res.status(404).json({ message: 'Hangout not found' });

    if (hangout.hostId.toString() !== req.user!.id) {
        return res.status(403).json({ message: 'Only the host can cancel a hangout' });
    }
    
    hangout.status = 'cancelled';
    await hangout.save();

    // Also cancel any associated pending connection requests
    await ConnectionRequest.updateMany(
        { hangoutId: hangout._id, status: 'pending' },
        { status: 'rejected' }
    );

    res.status(204).send();
};


const handleHangoutResponse = async (req: Request, res: Response, action: 'accept' | 'reject') => {
    const hangoutId = req.params.id;
    const userId = req.user!.id;

    const hangout = await Hangout.findById(hangoutId);
    if (!hangout) return res.status(404).json({ message: 'Hangout not found' });

    // Remove user from both lists to allow changing response
    hangout.acceptedBy = hangout.acceptedBy.filter(id => id.toString() !== userId);
    hangout.rejectedBy = hangout.rejectedBy.filter(id => id.toString() !== userId);

    if (action === 'accept') {
        hangout.acceptedBy.push(userId);
    } else {
        hangout.rejectedBy.push(userId);
    }

    // If all participants have accepted, confirm the hangout
    if (hangout.acceptedBy.length === hangout.participants.length+1) {
        hangout.status = 'confirmed';
    }

    const updatedHangout = await hangout.save();
    res.json(await populateHangout(updatedHangout));
};

export const acceptHangout = (req: Request, res: Response) => handleHangoutResponse(req, res, 'accept');
export const rejectHangout = (req: Request, res: Response) => handleHangoutResponse(req, res, 'reject');