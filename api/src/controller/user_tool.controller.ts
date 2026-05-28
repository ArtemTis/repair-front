import db from '../db';
import { Request, Response } from 'express';
import { QueryResult } from 'pg';
import { IdParam, IUserTool } from '../types';

type CreateUserToolBody = Pick<IUserTool, 'user_id' | 'tool_id'> &
  Partial<Pick<IUserTool, 'quantity'>>;

type UpdateUserToolBody = Partial<Pick<IUserTool, 'quantity'>>;

type UserToolParams = { user_id: string; tool_id: string };

class UserToolController {
  // Добавить инструмент пользователю (или увеличить количество)
  async addUserTool(req: Request<{}, {}, CreateUserToolBody>, res: Response): Promise<Response> {
    try {
      let { user_id, tool_id, quantity } = req.body;

      if (!user_id || !tool_id) {
        return res.status(400).json({
          message: 'Поля user_id и tool_id обязательны'
        });
      }

      if (quantity === undefined) quantity = 1;
      if (quantity < 0) {
        return res.status(400).json({
          message: 'Количество не может быть отрицательным'
        });
      }


      // Используем INSERT ... ON CONFLICT DO UPDATE для upsert
      const result: QueryResult<IUserTool> = await db.query(
        `
        INSERT INTO user_tools (user_id, tool_id, quantity)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, tool_id)
        DO UPDATE SET quantity = user_tools.quantity + EXCLUDED.quantity
        RETURNING *
        `,
        [user_id, tool_id, quantity]
      );

      return res.status(201).json(result.rows[0]);
    } catch (error: any) {
      return res.status(500).json({
        message: 'Ошибка при добавлении инструмента пользователю',
        details: error.message
      });
    }
  }

  // Получить все связи
  async getAllUserTools(req: Request, res: Response): Promise<Response> {
    try {
      const result: QueryResult<IUserTool[]> = await db.query(
        'SELECT * FROM user_tools ORDER BY user_id, tool_id'
      );
      return res.json(result.rows);
    } catch (error: any) {
      return res.status(500).json({
        message: 'Ошибка при получении списка связей',
        details: error.message
      });
    }
  }

  // Получить все инструменты конкретного пользователя
  async getUserToolsByUser(req: Request<{user_id: string}>, res: Response): Promise<Response> {
    try {
      const { user_id } = req.params;
      const result: QueryResult<IUserTool[]> = await db.query(
        'SELECT * FROM user_tools WHERE user_id = $1 ORDER BY tool_id',
        [user_id]
      );
      return res.json(result.rows);
    } catch (error: any) {
      return res.status(500).json({
        message: 'Ошибка при получении инструментов пользователя',
        details: error.message
      });
    }
  }

  // Получить всех пользователей, использующих конкретный инструмент
  async getUserToolsByTool(req: Request<{tool_id: string}>, res: Response): Promise<Response> {
    try {
      const { tool_id } = req.params;
      const result: QueryResult<IUserTool[]> = await db.query(
        'SELECT * FROM user_tools WHERE tool_id = $1 ORDER BY user_id',
        [tool_id]
      );
      return res.json(result.rows);
    } catch (error: any) {
      return res.status(500).json({
        message: 'Ошибка при получении пользователей инструмента',
        details: error.message
      });
    }
  }

  // Получить конкретную связь по user_id и tool_id
  async getUserToolByIds(req: Request<UserToolParams>, res: Response): Promise<Response> {
    try {
      const { user_id, tool_id } = req.params;
      const result: QueryResult<IUserTool> = await db.query(
        'SELECT * FROM user_tools WHERE user_id = $1 AND tool_id = $2',
        [user_id, tool_id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Связь не найдена' });
      }

      return res.json(result.rows[0]);
    } catch (error: any) {
      return res.status(500).json({
        message: 'Ошибка при получении связи',
        details: error.message
      });
    }
  }

  // Обновить количество для конкретной связи
  async updateUserToolQuantity(req: Request<UserToolParams, {}, UpdateUserToolBody>, res: Response): Promise<Response> {
    try {
      const { user_id, tool_id } = req.params;
      let { quantity } = req.body;

      if (quantity === undefined) {
        return res.status(400).json({ message: 'Поле quantity обязательно' });
      }
      if (quantity < 0) {
        return res.status(400).json({ message: 'Количество не может быть отрицательным' });
      }

      const result: QueryResult<IUserTool> = await db.query(
        `
        UPDATE user_tools
        SET quantity = $1
        WHERE user_id = $2 AND tool_id = $3
        RETURNING *
        `,
        [quantity, user_id, tool_id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Связь не найдена' });
      }

      return res.json(result.rows[0]);
    } catch (error: any) {
      return res.status(500).json({
        message: 'Ошибка при обновлении количества',
        details: error.message
      });
    }
  }

  // Удалить связь (убрать инструмент у пользователя)
  async deleteUserTool(req: Request<UserToolParams>, res: Response): Promise<Response> {
    try {
      const { user_id, tool_id } = req.params;
      const result: QueryResult<{ user_id: number; tool_id: number }> = await db.query(
        'DELETE FROM user_tools WHERE user_id = $1 AND tool_id = $2 RETURNING user_id, tool_id',
        [user_id, tool_id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Связь не найдена' });
      }

      return res.status(204).send();
    } catch (error: any) {
      return res.status(500).json({
        message: 'Ошибка при удалении связи',
        details: error.message
      });
    }
  }
}

export default new UserToolController();