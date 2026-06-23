import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

type AccessTokenPayload = JwtPayload & {
    userId: number;
};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.header('Authorization');

    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Необходима авторизация' });
    }

    const token = authHeader.slice('Bearer '.length);

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_ACCESS_SECRET as string
        ) as AccessTokenPayload;

        req.user = { id: decoded.userId };
        return next();
    } catch {
        return res.status(401).json({ message: 'Недействительный токен' });
    }
};