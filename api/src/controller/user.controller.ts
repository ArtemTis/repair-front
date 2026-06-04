import db from '../db'; 
import { Request, Response } from 'express';
import { QueryResult } from 'pg';
import { IdParam, IUser } from '../types';

type AuthUser = Omit<IUser, 'password'>;

const toAuthUser = (user: IUser): AuthUser => {
  const { password: _password, ...safeUser } = user;
  return safeUser;
};

class UserController {
  async createUser(req: Request<Pick<IUser, 'full_name' | 'email' | 'skill_level_id' | 'password'>>, res: Response): Promise<Response> {
    return res.status(410).json({
      message: 'Создание пользователя через /user отключено. Используйте /auth/register.'
    });
  }

  async getUsers(req: Request, res: Response): Promise<Response> {
    return res.status(403).json({ message: 'Получение списка пользователей недоступно' });
  }

  async getUserById(req: Request<IdParam>, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ message: 'Необходима авторизация' });
      }

      if (Number(id) !== userId) {
        return res.status(403).json({ message: 'Нет доступа к этому пользователю' });
      }

      const user: QueryResult<IUser> = await db.query('SELECT * FROM users WHERE id = $1', [userId]);

      if (!user.rows[0]) {
        return res.status(404).json({ message: 'Пользователь не найден' });
      }

      return res.json(toAuthUser(user.rows[0]));
    } catch (error: any) {
      return res.status(500).json({
        message: 'Ошибка при получении пользователя',
        details: error.message
      });
    }
  }

  async updateUser(req: Request<Partial<IUser>>, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const { full_name, skill_level_id } = req.body;

      if (!userId) {
        return res.status(401).json({ message: 'Необходима авторизация' });
      }

      if (Number(id) !== userId) {
        return res.status(403).json({ message: 'Нет доступа к этому пользователю' });
      }

      const user: QueryResult<IUser> = await db.query(
        `
        UPDATE users
        SET
          full_name = COALESCE($1, full_name),
          skill_level_id = COALESCE($2, skill_level_id),
          updated_at = NOW()
        WHERE id = $3
        RETURNING *
        `,
        [full_name ?? null, skill_level_id ?? null, userId]
      );

      if (!user.rows[0]) {
        return res.status(404).json({ message: 'Пользователь не найден' });
      }

      return res.json(toAuthUser(user.rows[0]));
    } catch (error: any) {
      return res.status(500).json({
        message: 'Ошибка при обновлении пользователя',
        details: error.message
      });
    }
  }

  async deleteUser(req: Request<IdParam>, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ message: 'Необходима авторизация' });
      }

      if (Number(id) !== userId) {
        return res.status(403).json({ message: 'Нет доступа к этому пользователю' });
      }

      const deletedUser: QueryResult<{ id: number }> = await db.query(
        'DELETE FROM users WHERE id = $1 RETURNING id',
        [userId]
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