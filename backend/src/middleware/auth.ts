
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import process from 'process';

declare global {
    namespace Express {
        export interface Request {
            user?: { id: string };
        }
    }
}

const auth = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
        req.user = { id: decoded.userId };
        next();
    } catch (error) {
        res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

export default auth;