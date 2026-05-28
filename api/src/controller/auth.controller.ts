import { Request, Response } from 'express';
import { QueryResult } from 'pg';
import db from '../db';
import { IUser } from '../types';

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
  // Позже сюда можно без изменения контракта добавить token/refreshToken/expiresAt.
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

      if (!user || user.password !== password) {
        return res.status(401).json({ message: 'Неверный email или пароль' });
      }

      const response: AuthResponse = { user: toAuthUser(user) };
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
        [fullName, email, password, skillLevelId]
      );

      const response: AuthResponse = { user: toAuthUser(result.rows[0]) };
      return res.status(201).json(response);
    } catch (error: any) {
      return res.status(500).json({
        message: 'Ошибка при регистрации пользователя',
        details: error.message,
      });
    }
  }
}

export default new AuthController();
