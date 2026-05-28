import db from '../db'; 
import { Request, Response } from 'express';
import { QueryResult } from 'pg';
import { IdParam, IUser } from '../types';

class UserController {
  async createUser(req: Request<Pick<IUser, 'full_name' | 'email' | 'skill_level_id' | 'password'>>, res: Response): Promise<Response> {
    try {
      const { full_name, email, skill_level_id, password } = req.body;

      if (!full_name || !email || !skill_level_id) {
        return res.status(400).json({
          message: 'Поля full_name, email и skill_level_id обязательны'
        });
      }

      const newUser: QueryResult<IUser> = await db.query(
        `
        INSERT INTO users (id, full_name, email, password, skill_level_id, created_at, updated_at)
        VALUES (
          nextval(pg_get_serial_sequence('users', 'id')),
          $1, $2, $3, $4, NOW(), NOW()
        )
        RETURNING *
        `,
        [full_name, email, password, skill_level_id]
      );

      return res.status(201).json(newUser.rows[0]);
    } catch (error: any) {
      return res.status(500).json({
        message: 'Ошибка при создании пользователя',
        details: error.message
      });
    }
  }

  async getUsers(req: Request, res: Response): Promise<Response> {
    try {
      const users: QueryResult<IUser[]> = await db.query('SELECT * FROM users ORDER BY id');
      return res.json(users.rows);
    } catch (error: any) {
      return res.status(500).json({
        message: 'Ошибка при получении списка пользователей',
        details: error.message
      });
    }
  }

  async getUserById(req: Request<IdParam>, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const user: QueryResult<IUser> = await db.query('SELECT * FROM users WHERE id = $1', [id]);

      if (!user.rows[0]) {
        return res.status(404).json({ message: 'Пользователь не найден' });
      }

      return res.json(user.rows[0]);
    } catch (error: any) {
      return res.status(500).json({
        message: 'Ошибка при получении пользователя',
        details: error.message
      });
    }
  }

  async updateUser(req: Request<Partial<IUser>>, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { full_name, email, skill_level_id } = req.body;

      const user: QueryResult<IUser> = await db.query(
        `
        UPDATE users
        SET
          full_name = COALESCE($1, full_name),
          email = COALESCE($2, email),
          skill_level_id = COALESCE($3, skill_level_id),
          updated_at = NOW()
        WHERE id = $4
        RETURNING *
        `,
        [full_name ?? null, email ?? null, skill_level_id ?? null, id]
      );

      if (!user.rows[0]) {
        return res.status(404).json({ message: 'Пользователь не найден' });
      }

      return res.json(user.rows[0]);
    } catch (error: any) {
      return res.status(500).json({
        message: 'Ошибка при обновлении пользователя',
        details: error.message
      });
    }
  }

  async deleteUser(req: Request<IdParam>, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const deletedUser: QueryResult<{ id: number }> = await db.query(
        'DELETE FROM users WHERE id = $1 RETURNING id',
        [id]
      );

      if (!deletedUser.rows[0]) {
        return res.status(404).json({ message: 'Пользователь не найден' });
      }

      return res.status(204).send();
    } catch (error: any) {
      return res.status(500).json({
        message: 'Ошибка при удалении пользователя',
        details: error.message
      });
    }
  }
}

export default new UserController();