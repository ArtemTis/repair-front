import db from '../db';
import { Request, Response } from 'express';
import { QueryResult } from 'pg';
import { IRepairHistory } from '../types';

type CreateRepairHistoryBody = Pick<IRepairHistory, 'user_id' | 'device_id' | 'issue_description'> &
  Partial<Pick<IRepairHistory, 'repair_guide_id' | 'started_at' | 'finished_at' | 'status' | 'work_performed' | 'result_notes' | 'recommendation_used' | 'complexity_skill_level_id'>>;

type UpdateRepairHistoryBody = Partial<Pick<IRepairHistory, 'user_id' | 'device_id' | 'repair_guide_id' | 'finished_at' | 'status' | 'issue_description' | 'work_performed' | 'result_notes' | 'recommendation_used' | 'complexity_skill_level_id'>>;

type IdParam = { id: string };

const validStatuses = ['in_progress', 'success', 'failed', 'cancelled'];

class RepairHistoryController {
  async createRepairHistory(req: Request<{}, {}, CreateRepairHistoryBody>, res: Response): Promise<Response> {
    try {
      let {
        user_id,
        device_id,
        issue_description,
        repair_guide_id,
        started_at,
        finished_at,
        status,
        work_performed,
        result_notes,
        recommendation_used,
        complexity_skill_level_id
      } = req.body;

      // Проверка обязательных полей
      if (!user_id || !device_id || !issue_description) {
        return res.status(400).json({
          message: 'Поля user_id, device_id и issue_description обязательны'
        });
      }

      // Проверка статуса, если передан
      if (status && !validStatuses.includes(status)) {
        return res.status(400).json({
          message: `Недопустимое значение status. Допустимые: ${validStatuses.join(', ')}`
        });
      }

      // Установка значений по умолчанию
      if (!status) status = 'in_progress';
      if (!started_at) started_at = new Date();

      const newRecord: QueryResult<IRepairHistory> = await db.query(
        `
        INSERT INTO repair_history (
          id, user_id, device_id, repair_guide_id, started_at, finished_at,
          status, issue_description, work_performed, result_notes,
          recommendation_used, complexity_skill_level_id, created_at, updated_at
        )
        VALUES (
          nextval(pg_get_serial_sequence('repair_history', 'id')),
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()
        )
        RETURNING *
        `,
        [
          user_id,
          device_id,
          repair_guide_id ?? null,
          started_at,
          finished_at ?? null,
          status,
          issue_description,
          work_performed ?? null,
          result_notes ?? null,
          recommendation_used ?? null,
          complexity_skill_level_id ?? null
        ]
      );

      return res.status(201).json(newRecord.rows[0]);
    } catch (error: any) {
      return res.status(500).json({
        message: 'Ошибка при создании записи о ремонте',
        details: error.message
      });
    }
  }

  async getRepairHistoryByUserId(req: Request<Pick<IRepairHistory, 'user_id' >>, res: Response): Promise<Response> {
    try {
      const { user_id } = req.params;
      const records: QueryResult<IRepairHistory[]> = await db.query(
        `SELECT * FROM repair_history
         WHERE user_id = $1
         ORDER BY COALESCE(finished_at, started_at) DESC, id DESC`,
        [user_id]
      );

      return res.json(records.rows);
    } catch (error: any) {
      return res.status(500).json({
        message: 'Ошибка при получении списка ремонтов',
        details: error.message
      });
    }
  }

  async getRepairHistoryById(req: Request<IdParam>, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const record: QueryResult<IRepairHistory> = await db.query(
        'SELECT * FROM repair_history WHERE id = $1',
        [id]
      );

      if (!record.rows[0]) {
        return res.status(404).json({ message: 'Запись о ремонте не найдена' });
      }

      return res.json(record.rows[0]);
    } catch (error: any) {
      return res.status(500).json({
        message: 'Ошибка при получении записи о ремонте',
        details: error.message
      });
    }
  }

  async updateRepairHistory(req: Request<IdParam, {}, UpdateRepairHistoryBody>, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const {
        user_id,
        device_id,
        repair_guide_id,
        finished_at,
        status,
        issue_description,
        work_performed,
        result_notes,
        recommendation_used,
        complexity_skill_level_id
      } = req.body;

      // Проверка статуса, если передан
      if (status && !validStatuses.includes(status)) {
        return res.status(400).json({
          message: `Недопустимое значение status. Допустимые: ${validStatuses.join(', ')}`
        });
      }

      const patchFinishedAt = Object.prototype.hasOwnProperty.call(req.body, 'finished_at');

      const updatedRecord: QueryResult<IRepairHistory> = await db.query(
        `
        UPDATE repair_history
        SET
          user_id = COALESCE($1, user_id),
          device_id = COALESCE($2, device_id),
          repair_guide_id = COALESCE($3, repair_guide_id),
          finished_at = CASE WHEN $12::boolean THEN $4 ELSE finished_at END,
          status = COALESCE($5, status),
          issue_description = COALESCE($6, issue_description),
          work_performed = COALESCE($7, work_performed),
          result_notes = COALESCE($8, result_notes),
          recommendation_used = COALESCE($9, recommendation_used),
          complexity_skill_level_id = COALESCE($10, complexity_skill_level_id),
          updated_at = NOW()
        WHERE id = $11
        RETURNING *
        `,
        [
          user_id ?? null,
          device_id ?? null,
          repair_guide_id ?? null,
          finished_at ?? null,
          status ?? null,
          issue_description ?? null,
          work_performed ?? null,
          result_notes ?? null,
          recommendation_used ?? null,
          complexity_skill_level_id ?? null,
          id,
          patchFinishedAt
        ]
      );

      if (!updatedRecord.rows[0]) {
        return res.status(404).json({ message: 'Запись о ремонте не найдена' });
      }

      return res.json(updatedRecord.rows[0]);
    } catch (error: any) {
      return res.status(500).json({
        message: 'Ошибка при обновлении записи о ремонте',
        details: error.message
      });
    }
  }

  async deleteRepairHistory(req: Request<IdParam>, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const deletedRecord: QueryResult<{ id: number }> = await db.query(
        'DELETE FROM repair_history WHERE id = $1 RETURNING id',
        [id]
      );

      if (!deletedRecord.rows[0]) {
        return res.status(404).json({ message: 'Запись о ремонте не найдена' });
      }

      return res.status(204).send();
    } catch (error: any) {
      return res.status(500).json({
        message: 'Ошибка при удалении записи о ремонте',
        details: error.message
      });
    }
  }
}

export default new RepairHistoryController();