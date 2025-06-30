import { Request, Response } from 'express';
import User, { IUser } from '../models/User';
import jwt from 'jsonwebtoken';
import process from 'process';

const generateToken = (userId: string) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET!, {
        expiresIn: '30d',
    });
};

export const signupUser = async (req: Request, res: Response) => {
    const { name, bio, profileImageUrl, phoneNumber, password, firstDegreeFriendIds } = req.body;

    const userExists = await User.findOne({ phoneNumber });

    if (userExists) {
        return res.status(400).json({ message: 'User with this phone number already exists' });
    }

    try {
        const user = new User({
            // The frontend assigns a temporary 'userX' id, but mongo will create its own.
            // We use phone number to link friends during signup.
            id: phoneNumber, // temporary ID for friend linking
            name,
            bio,
            profileImageUrl,
            phoneNumber,
            password,
            firstDegreeFriendIds // these are phoneNumbers initially
        });

        const createdUser = await user.save();

        const idString = createdUser._id ? createdUser._id.toString() : '';
        res.status(201).json({
            _id: createdUser._id,
            name: createdUser.name,
            bio: createdUser.bio,
            profileImageUrl: createdUser.profileImageUrl,
            phoneNumber: createdUser.phoneNumber,
            firstDegreeFriendIds: createdUser.firstDegreeFriendIds,
            approvedSecondDegreeConnections: createdUser.approvedSecondDegreeConnections,
            token: generateToken(idString),
        });
    } catch (error: any) {
        res.status(400).json({ message: 'Invalid user data', details: error.message });
    }
};

export const loginUser = async (req: Request, res: Response) => {
    const { phoneNumber, password } = req.body;

    const user: IUser | null = await User.findOne({ phoneNumber });

    if (user && (await user.matchPassword(password))) {
        const idString = user._id ? user._id.toString() : '';
        res.json({
            _id: user._id,
            id: user._id, // Frontend uses 'id'
            name: user.name,
            bio: user.bio,
            profileImageUrl: user.profileImageUrl,
            phoneNumber: user.phoneNumber,
            firstDegreeFriendIds: user.firstDegreeFriendIds,
            approvedSecondDegreeConnections: user.approvedSecondDegreeConnections,
            token: generateToken(idString),
        });
    } else {
        res.status(401).json({ message: 'Invalid phone number or password' });
    }
};


export const getSessionUser = async (req: Request, res: Response) => {
    if (req.user) {
        const user = await User.findById(req.user.id).select('-password');
        if (user) {
             res.json({
                _id: user._id,
                id: user._id, // Frontend uses 'id'
                name: user.name,
                bio: user.bio,
                profileImageUrl: user.profileImageUrl,
                phoneNumber: user.phoneNumber,
                firstDegreeFriendIds: user.firstDegreeFriendIds,
                approvedSecondDegreeConnections: user.approvedSecondDegreeConnections,
             });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized' });
    }
};

export const logoutUser = (req: Request, res: Response) => {
    // In a stateless JWT setup, logout is typically handled on the client-side
    // by clearing the token. A server endpoint can be used for things like
    // blacklisting tokens if needed, but for this app it's not necessary.
    res.status(204).send();
};