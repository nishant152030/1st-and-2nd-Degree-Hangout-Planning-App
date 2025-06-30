import { Request, Response } from 'express';
import User from '../models/User';

// @desc    Get all users
// @route   GET /api/users
// @access  Private
export const getAllUsers = async (req: Request, res: Response) => {
    const users = await User.find({}).select('-password');
    // The frontend expects the 'id' field to be the mongo _id
    const formattedUsers = users.map(u => ({
        ...u.toObject(),
        id: String(u._id)
    }));
    res.json(formattedUsers);
};

// @desc    Update user profile
// @route   PUT /api/users/:id
// @access  Private
export const updateUserProfile = async (req: Request, res: Response) => {
    if (req.user?.id !== req.params.id) {
        return res.status(403).json({ message: 'User not authorized to update this profile' });
    }

    const user = await User.findById(req.params.id);

    if (user) {
        const { profileData, friendIds } = req.body;

        if (profileData) {
            user.name = profileData.name || user.name;
            user.bio = profileData.bio ?? user.bio; // Allow empty bio
            user.profileImageUrl = profileData.profileImageUrl || user.profileImageUrl;
        }

        if (friendIds) {
            // Need to find users by ID to ensure they exist before adding.
            const friends = await User.find({ '_id': { $in: friendIds }});
            user.firstDegreeFriendIds = friends.map(f => String(f._id));
        }

        const updatedUser = await user.save();

        res.json({
            _id: String(updatedUser._id),
            id: String(updatedUser._id), // frontend expects 'id'
            name: updatedUser.name,
            bio: updatedUser.bio,
            profileImageUrl: updatedUser.profileImageUrl,
            phoneNumber: updatedUser.phoneNumber,
            firstDegreeFriendIds: updatedUser.firstDegreeFriendIds,
            approvedSecondDegreeConnections: updatedUser.approvedSecondDegreeConnections,
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};