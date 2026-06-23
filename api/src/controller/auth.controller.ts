import { Request, Response } from 'express';
import { QueryResult } from 'pg';
import db from '../db';
import { IUser } from '../types';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { JwtPayload, SignOptions } from 'jsonwebtoken';

type AuthUser = Omit<IUser, 'password'>;

type LoginBody = {
  email?: string;
  password?: string;
};

type RegisterBody = {
  full_name?: string;
  email?: string;
  password?: string;
  skill_level_id?: number;
};

type AuthResponse = {
  user: AuthUser;
  accessToken: string;
};

type JwtUserPayload = JwtPayload & {
  userId: number;
};

const getJwtSecret = (name: 'JWT_ACCESS_SECRET' | 'JWT_REFRESH_SECRET') => {
  const secret = process.env[name];

  if (!secret) {
    throw new Error(`${name} is not configured`);
  }

  return secret;
};

const signAccessToken = (user: IUser) => {
  const expiresIn = (process.env.JWT_ACCESS_EXPIRES_IN ?? '15m') as SignOptions['expiresIn'];

  return jwt.sign(
    { userId: user.id },
    getJwtSecret('JWT_ACCESS_SECRET'),
    { expiresIn }
  );
};

const signRefreshToken = (user: IUser) => {
  const expiresIn = (process.env.JWT_REFRESH_EXPIRES_IN ?? '30d') as SignOptions['expiresIn'];

  return jwt.sign(
    { userId: user.id },
    getJwtSecret('JWT_REFRESH_SECRET'),
    { expiresIn }
  );
};

const verifyRefreshToken = (token: string): JwtUserPayload => {
  const decoded = jwt.verify(token, getJwtSecret('JWT_REFRESH_SECRET'));

  if (typeof decoded === 'string' || typeof decoded.userId !== 'number') {
    throw new Error('Invalid refresh token payload');
  }

  return decoded as JwtUserPayload;
};

const toAuthUser = (user: IUser): AuthUser => {
  const { password: _password, ...safeUser } = user;
  return safeUser;
};

class AuthController {
  async login(req: Request<{}, {}, LoginBody>, res: Response): Promise<Response> {
    try {
      const email = req.body.email?.trim().toLowerCase();
      const password = req.body.password;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email и password обязательны' });
      }

      const result: QueryResult<IUser> = await db.query(
        'SELECT * FROM users WHERE LOWER(email) = $1 LIMIT 1',
        [email]
      );
      const user = result.rows[0];

      if (!user) {
        return res.status(401).json({ message: 'Неверный email или пароль' });
      }

      const isBcryptHash = user.password.startsWith('$2a$') || user.password.startsWith('$2b$');
      const isPasswordValid = isBcryptHash
        ? await bcrypt.compare(password, user.password)
        : password === user.password;

      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Неверный email или пароль' });
      }

      if (!isBcryptHash) {
        const passwordHash = await bcrypt.hash(password, 12);
        await db.query('UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2', [
          passwordHash,
          user.id,
        ]);
      }

      const refreshToken = signRefreshToken(user);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      const response: AuthResponse = {
        user: toAuthUser(user),
        accessToken: signAccessToken(user),
      };

      return res.json(response);
    } catch (error: any) {
      return res.status(500).json({
        message: 'Ошибка при авторизации',
        details: error.message,
      });
    }
  }

  async register(req: Request<{}, {}, RegisterBody>, res: Response): Promise<Response> {
    try {
      const fullName = req.body.full_name?.trim();
      const email = req.body.email?.trim().toLowerCase();
      const password = req.body.password;
      const skillLevelId = req.body.skill_level_id;

      if (!fullName || !email || !password || !skillLevelId) {
        return res.status(400).json({
          message: 'Поля full_name, email, password и skill_level_id обязательны',
        });
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const existingUser: QueryResult<{ id: number }> = await db.query(
        'SELECT id FROM users WHERE LOWER(email) = $1 LIMIT 1',
        [email]
      );

      if (existingUser.rows[0]) {
        return res.status(409).json({ message: 'Пользователь с таким email уже существует' });
      }

      const result: QueryResult<IUser> = await db.query(
        `
        INSERT INTO users (id, full_name, email, password, skill_level_id, created_at, updated_at)
        VALUES (
          nextval(pg_get_serial_sequence('users', 'id')),
          $1, $2, $3, $4, NOW(), NOW()
        )
        RETURNING *
        `,
        [fullName, email, passwordHash, skillLevelId]
      );

      const createdUser = result.rows[0];

      const response: AuthResponse = {
        user: toAuthUser(createdUser),
        accessToken: signAccessToken(createdUser),
      };

      const refreshToken = signRefreshToken(createdUser);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      return res.status(201).json(response);
    } catch (error: any) {
      return res.status(500).json({
        message: 'Ошибка при регистрации пользователя',
        details: error.message,
      });
    }
  }

  async refresh(req: Request, res: Response): Promise<Response> {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        return res.status(401).json({ message: 'Необходима авторизация' });
      }
      const decoded = verifyRefreshToken(refreshToken);
      const userId = decoded.userId;
      const result: QueryResult<IUser> = await db.query(
        'SELECT * FROM users WHERE id = $1 LIMIT 1',
        [userId]
      );

      const user = result.rows[0];

      if (!user) {
        return res.status(401).json({ message: 'Пользователь не найден' });
      }

      return res.status(200).json({
        user: toAuthUser(user),
        accessToken: signAccessToken(user),
      });
    } catch (error: any) {
      return res.status(500).json({
        message: 'Ошибка при обновлении токена',
        details: error.message,
      });
    }

  }

  async logout(req: Request, res: Response): Promise<Response> {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        return res.status(401).json({ message: 'Необходима авторизация' });
      }
      const decoded = verifyRefreshToken(refreshToken);
      const userId = decoded.userId;
      const result: QueryResult<IUser> = await db.query(
        'SELECT * FROM users WHERE id = $1 LIMIT 1',
        [userId]
      );

      const user = result.rows[0];

      if (!user) {
        return res.status(401).json({ message: 'Пользователь не найден' });
      }

      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });

      return res.status(200).json({ message: 'Выход из системы успешно выполнен' });
    } catch (error: any) {
      return res.status(500).json({
        message: 'Ошибка при выходе из системы',
        details: error.message,
      });
    }
  }

  async me(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Необходима авторизация' });
      }

      const result: QueryResult<IUser> = await db.query(
        'SELECT * FROM users WHERE id = $1 LIMIT 1',
        [userId]
      );
      const user = result.rows[0];

      if (!user) {
        return res.status(401).json({ message: 'Пользователь не найден' });
      }
      return res.status(200).json({ user: toAuthUser(user) });
    } catch (error: any) {
      return res.status(500).json({
        message: 'Ошибка при получении информации о пользователе',
        details: error.message,
      });
    }
  }
}

export default new AuthController();
