import db from '../db';
import { Request, Response } from 'express';
import { QueryResult } from 'pg';
import { IRepairHistory } from '../types';

type CreateRepairHistoryBody = Pick<IRepairHistory, 'device_id' | 'issue_description'> &
  Partial<Pick<IRepairHistory, 'repair_guide_id' | 'started_at' | 'finished_at' | 'status' | 'work_performed' | 'result_notes' | 'recommendation_used' | 'complexity_skill_level_id'>>;

type UpdateRepairHistoryBody = Partial<Pick<IRepairHistory, 'device_id' | 'repair_guide_id' | 'finished_at' | 'status' | 'issue_description' | 'work_performed' | 'result_notes' | 'recommendation_used' | 'complexity_skill_level_id'>>;

type IdParam = { id: string };

const validStatuses = ['in_progress', 'success', 'failed', 'cancelled'];

class RepairHistoryController {
  async createRepairHistory(req: Request<{}, {}, CreateRepairHistoryBody>, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      let {
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

      if (!userId) {
        return res.status(401).json({ message: 'Необходима авторизация' });
      }

      // Проверка обязательных полей
      if (!device_id || !issue_description) {
        return res.status(400).json({
          message: 'Поля device_id и issue_description обязательны'
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

      const device: QueryResult<{ id: number }> = await db.query(
        'SELECT id FROM devices WHERE id = $1 AND user_id = $2 LIMIT 1',
        [device_id, userId]
      );

      if (!device.rows[0]) {
        return res.status(400).json({ message: 'Устройство не найдено или недоступно' });
      }

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
          userId,
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
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Необходима авторизация' });
      }

      const records: QueryResult<IRepairHistory[]> = await db.query(
        `SELECT * FROM repair_history
         WHERE user_id = $1
         ORDER BY COALESCE(finished_at, started_at) DESC, id DESC`,
        [userId]
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
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ message: 'Необходима авторизация' });
      }

      const record: QueryResult<IRepairHistory> = await db.query(
        'SELECT * FROM repair_history WHERE id = $1 AND user_id = $2',
        [id, userId]
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
      const userId = req.user?.id;
      const { id } = req.params;
      const {
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

      if (!userId) {
        return res.status(401).json({ message: 'Необходима авторизация' });
      }

      // Проверка статуса, если передан
      if (status && !validStatuses.includes(status)) {
        return res.status(400).json({
          message: `Недопустимое значение status. Допустимые: ${validStatuses.join(', ')}`
        });
      }

      const patchFinishedAt = Object.prototype.hasOwnProperty.call(req.body, 'finished_at');

      if (device_id) {
        const device: QueryResult<{ id: number }> = await db.query(
          'SELECT id FROM devices WHERE id = $1 AND user_id = $2 LIMIT 1',
          [device_id, userId]
        );

        if (!device.rows[0]) {
          return res.status(400).json({ message: 'Устройство не найдено или недоступно' });
        }
      }

      const updatedRecord: QueryResult<IRepairHistory> = await db.query(
        `
        UPDATE repair_history
        SET
          device_id = COALESCE($1, device_id),
          repair_guide_id = COALESCE($2, repair_guide_id),
          finished_at = CASE WHEN $11::boolean THEN $3 ELSE finished_at END,
          status = COALESCE($4, status),
          issue_description = COALESCE($5, issue_description),
          work_performed = COALESCE($6, work_performed),
          result_notes = COALESCE($7, result_notes),
          recommendation_used = COALESCE($8, recommendation_used),
          complexity_skill_level_id = COALESCE($9, complexity_skill_level_id),
          updated_at = NOW()
        WHERE id = $10 AND user_id = $12
        RETURNING *
        `,
        [
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
          patchFinishedAt,
          userId
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
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ message: 'Необходима авторизация' });
      }

      const deletedRecord: QueryResult<{ id: number }> = await db.query(
        'DELETE FROM repair_history WHERE id = $1 AND user_id = $2 RETURNING id',
        [id, userId]
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