import db from '../db';
import { Request, Response } from 'express';
import { QueryResult } from 'pg';
import { IdParam, IRepairGuide } from '../types';

type CreateRepairGuideBody = Pick<IRepairGuide, 'title' | 'problem_description' | 'instructions' | 'min_skill_level_id' | 'user_id'> &
  Partial<Pick<IRepairGuide, 'recommendation'>>;

type UpdateRepairGuideBody = Partial<Pick<IRepairGuide, 'title' | 'problem_description' | 'instructions' | 'recommendation' | 'min_skill_level_id'>>;


class RepairGuideController {
  async createRepairGuide(req: Request<{}, {}, CreateRepairGuideBody>, res: Response): Promise<Response> {
    try {
      const { title, problem_description, instructions, min_skill_level_id, recommendation, user_id } = req.body;

      if (!title || !problem_description || !instructions || !min_skill_level_id || !user_id) {
        return res.status(400).json({
          message: 'Поля title, problem_description, instructions и min_skill_level_id обязательны'
        });
      }

      const newGuide: QueryResult<IRepairGuide> = await db.query(
        `
        INSERT INTO repair_guides (id, title, problem_description, instructions, recommendation, min_skill_level_id, user_id, created_at, updated_at)
        VALUES (
          nextval(pg_get_serial_sequence('repair_guides', 'id')),
          $1, $2, $3, $4, $5, $6, NOW(), NOW()
        )
        RETURNING *
        `,
        [title, problem_description, instructions, recommendation ?? null, min_skill_level_id, user_id]
      );

      return res.status(201).json(newGuide.rows[0]);
    } catch (error: any) {
      return res.status(500).json({
        message: 'Ошибка при создании руководства по ремонту',
        details: error.message
      });
    }
  }

  async getRepairGuidesByUserId(req: Request<Pick<IRepairGuide, 'user_id'>>, res: Response): Promise<Response> {
    try {
      const { user_id } = req.params;

      const guides: QueryResult<IRepairGuide[]> = await db.query('SELECT * FROM repair_guides WHERE user_id = $1', [user_id]);

      return res.json(guides.rows);
    } catch (error: any) {
      return res.status(500).json({
        message: 'Ошибка при получении списка руководств по ремонту',
        details: error.message
      });
    }
  }

  async getRepairGuideById(req: Request<IdParam>, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const guide: QueryResult<IRepairGuide> = await db.query('SELECT * FROM repair_guides WHERE id = $1', [id]);

      if (!guide.rows[0]) {
        return res.status(404).json({ message: 'Руководство по ремонту не найдено' });
      }

      return res.json(guide.rows[0]);
    } catch (error: any) {
      return res.status(500).json({
        message: 'Ошибка при получении руководства по ремонту',
        details: error.message
      });
    }
  }

  async updateRepairGuide(req: Request<IdParam, {}, UpdateRepairGuideBody>, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { title, problem_description, instructions, recommendation, min_skill_level_id } = req.body;

      const guide: QueryResult<IRepairGuide> = await db.query(
        `
        UPDATE repair_guides
        SET
          title = COALESCE($1, title),
          problem_description = COALESCE($2, problem_description),
          instructions = COALESCE($3, instructions),
          recommendation = COALESCE($4, recommendation),
          min_skill_level_id = COALESCE($5, min_skill_level_id),
          updated_at = NOW()
        WHERE id = $6
        RETURNING *
        `,
        [title ?? null, problem_description ?? null, instructions ?? null, recommendation ?? null, min_skill_level_id ?? null, id]
      );

      if (!guide.rows[0]) {
        return res.status(404).json({ message: 'Руководство по ремонту не найдено' });
      }

      return res.json(guide.rows[0]);
    } catch (error: any) {
      return res.status(500).json({
        message: 'Ошибка при обновлении руководства по ремонту',
        details: error.message
      });
    }
  }

  async deleteRepairGuide(req: Request<IdParam>, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const deletedGuide: QueryResult<{ id: number }> = await db.query(
        'DELETE FROM repair_guides WHERE id = $1 RETURNING id',
        [id]
      );

      if (!deletedGuide.rows[0]) {
        return res.status(404).json({ message: 'Руководство по ремонту не найдено' });
      }

      return res.status(204).send();
    } catch (error: any) {
      return res.status(500).json({
        message: 'Ошибка при удалении руководства по ремонту',
        details: error.message
      });
    }
  }
}

export default new RepairGuideController();