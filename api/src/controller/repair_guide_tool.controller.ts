import db from '../db';
import { Request, Response } from 'express';
import { QueryResult } from 'pg';
import { IRepairGuideTool } from '../types';


type CreateRepairGuideToolBody = Pick<IRepairGuideTool, 'repair_guide_id' | 'tool_id' | 'user_id'> &
  Partial<Pick<IRepairGuideTool, 'is_required' | 'notes'>>;

type UpdateRepairGuideToolBody = Partial<Pick<IRepairGuideTool, 'is_required' | 'notes'>>;

type RepairGuideIdParam = { repair_guide_id: string };
type ToolIdParam = { tool_id: string };
type RepairGuideToolParams = { repair_guide_id: string; tool_id: string };

class RepairGuideToolController {
  // Добавить инструмент к руководству
  async addToolToGuide(req: Request<{}, {}, CreateRepairGuideToolBody>, res: Response): Promise<Response> {
    try {
      let { repair_guide_id, tool_id, is_required, notes, user_id } = req.body;

      if (!repair_guide_id || !tool_id || !user_id) {
        return res.status(400).json({
          message: 'Поля repair_guide_id, user_id и tool_id обязательны'
        });
      }

      if (is_required === undefined) is_required = true;

      // Используем INSERT с проверкой на конфликт (можно просто INSERT, т.к. PK уникален)
      // ON CONFLICT DO NOTHING или DO UPDATE — выберем DO NOTHING, чтобы не дублировать.
      const result: QueryResult<IRepairGuideTool> = await db.query(
        `
        INSERT INTO repair_guide_tools (repair_guide_id, tool_id, is_required, notes, user_id)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (repair_guide_id, tool_id) DO NOTHING
        RETURNING *
        `,
        [repair_guide_id, tool_id, is_required, notes ?? null, user_id]
      );

      if (result.rows.length === 0) {
        return res.status(409).json({
          message: 'Связь уже существует'
        });
      }

      return res.status(201).json(result.rows[0]);
    } catch (error: any) {
      return res.status(500).json({
        message: 'Ошибка при добавлении инструмента к руководству',
        details: error.message
      });
    }
  }

  // Получить все связи
  async getAllRepairGuideTools(req: Request, res: Response): Promise<Response> {
    try {
      const result: QueryResult<IRepairGuideTool[]> = await db.query(
        'SELECT * FROM repair_guide_tools ORDER BY repair_guide_id, tool_id'
      );
      return res.json(result.rows);
    } catch (error: any) {
      return res.status(500).json({
        message: 'Ошибка при получении списка связей',
        details: error.message
      });
    }
  }

  // Получить все инструменты для конкретного руководства
  async getToolsByGuide(req: Request<RepairGuideIdParam>, res: Response): Promise<Response> {
    try {
      const { repair_guide_id } = req.params;
      const result: QueryResult<IRepairGuideTool[]> = await db.query(
        'SELECT * FROM repair_guide_tools WHERE repair_guide_id = $1 ORDER BY tool_id',
        [repair_guide_id]
      );
      return res.json(result.rows);
    } catch (error: any) {
      return res.status(500).json({
        message: 'Ошибка при получении инструментов для руководства',
        details: error.message
      });
    }
  }

  // Получить все руководства, использующие конкретный инструмент
  async getGuidesByTool(req: Request<ToolIdParam>, res: Response): Promise<Response> {
    try {
      const { tool_id } = req.params;
      const result: QueryResult<IRepairGuideTool[]> = await db.query(
        'SELECT * FROM repair_guide_tools WHERE tool_id = $1 ORDER BY repair_guide_id',
        [tool_id]
      );
      return res.json(result.rows);
    } catch (error: any) {
      return res.status(500).json({
        message: 'Ошибка при получении руководств для инструмента',
        details: error.message
      });
    }
  }

  // Получить конкретную связь по двум ID
  async getRepairGuideToolByIds(req: Request<RepairGuideToolParams>, res: Response): Promise<Response> {
    try {
      const { repair_guide_id, tool_id } = req.params;
      const result: QueryResult<IRepairGuideTool> = await db.query(
        'SELECT * FROM repair_guide_tools WHERE repair_guide_id = $1 AND tool_id = $2',
        [repair_guide_id, tool_id]
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

  // Обновить поля is_required и/или notes для связи
  async updateRepairGuideTool(req: Request<RepairGuideToolParams, {}, UpdateRepairGuideToolBody>, res: Response): Promise<Response> {
    try {
      const { repair_guide_id, tool_id } = req.params;
      const { is_required, notes } = req.body;

      const result: QueryResult<IRepairGuideTool> = await db.query(
        `
        UPDATE repair_guide_tools
        SET
          is_required = COALESCE($1, is_required),
          notes = COALESCE($2, notes)
        WHERE repair_guide_id = $3 AND tool_id = $4
        RETURNING *
        `,
        [is_required ?? null, notes ?? null, repair_guide_id, tool_id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Связь не найдена' });
      }

      return res.json(result.rows[0]);
    } catch (error: any) {
      return res.status(500).json({
        message: 'Ошибка при обновлении связи',
        details: error.message
      });
    }
  }

  // Удалить связь (убрать инструмент из руководства)
  async deleteRepairGuideTool(req: Request<RepairGuideToolParams>, res: Response): Promise<Response> {
    try {
      const { repair_guide_id, tool_id } = req.params;
      const result: QueryResult<{ repair_guide_id: number; tool_id: number }> = await db.query(
        'DELETE FROM repair_guide_tools WHERE repair_guide_id = $1 AND tool_id = $2 RETURNING repair_guide_id, tool_id',
        [repair_guide_id, tool_id]
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

export default new RepairGuideToolController();