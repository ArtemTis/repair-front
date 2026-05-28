import db from '../db';
import { Request, Response } from 'express';
import { QueryResult } from 'pg';
import { IdParam, ITool } from '../types';

type CreateToolBody = Pick<ITool, 'name'> & Partial<Pick<ITool, 'description'>>;
type UpdateToolBody = Partial<CreateToolBody>;

class ToolController {
  async createTool(req: Request<{}, {}, CreateToolBody>, res: Response): Promise<Response> {
    try {
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({
          message: 'Поле name обязательно для заполнения'
        });
      }

      const newTool: QueryResult<ITool> = await db.query(
        `
        INSERT INTO tools (id, name, description, created_at, updated_at)
        VALUES (
          nextval(pg_get_serial_sequence('tools', 'id')),
          $1, $2, NOW(), NOW()
        )
        RETURNING *
        `,
        [name, description || null]
      );

      return res.status(201).json(newTool.rows[0]);
    } catch (error: any) {
      return res.status(500).json({
        message: 'Ошибка при создании инструмента',
        details: error.message
      });
    }
  }

  async getTools(req: Request, res: Response): Promise<Response> {
    try {
      const tools: QueryResult<ITool[]> = await db.query('SELECT * FROM tools ORDER BY id');
      return res.json(tools.rows);
    } catch (error: any) {
      return res.status(500).json({
        message: 'Ошибка при получении списка инструментов',
        details: error.message
      });
    }
  }

  async getToolById(req: Request<IdParam>, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const tool: QueryResult<ITool> = await db.query('SELECT * FROM tools WHERE id = $1', [id]);

      if (!tool.rows[0]) {
        return res.status(404).json({ message: 'Инструмент не найден' });
      }

      return res.json(tool.rows[0]);
    } catch (error: any) {
      return res.status(500).json({
        message: 'Ошибка при получении инструмента',
        details: error.message
      });
    }
  }

  async updateTool(req: Request<IdParam, {}, UpdateToolBody>, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      const tool: QueryResult<ITool> = await db.query(
        `
        UPDATE tools
        SET
          name = COALESCE($1, name),
          description = COALESCE($2, description),
          updated_at = NOW()
        WHERE id = $3
        RETURNING *
        `,
        [name ?? null, description ?? null, id]
      );

      if (!tool.rows[0]) {
        return res.status(404).json({ message: 'Инструмент не найден' });
      }

      return res.json(tool.rows[0]);
    } catch (error: any) {
      return res.status(500).json({
        message: 'Ошибка при обновлении инструмента',
        details: error.message
      });
    }
  }

  async deleteTool(req: Request<IdParam>, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const deletedTool: QueryResult<{ id: number }> = await db.query(
        'DELETE FROM tools WHERE id = $1 RETURNING id',
        [id]
      );

      if (!deletedTool.rows[0]) {
        return res.status(404).json({ message: 'Инструмент не найден' });
      }

      return res.status(204).send();
    } catch (error: any) {
      return res.status(500).json({
        message: 'Ошибка при удалении инструмента',
        details: error.message
      });
    }
  }
}

export default new ToolController();