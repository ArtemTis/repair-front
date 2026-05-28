import db from '../db';
import { Request, Response } from 'express';
import { QueryResult } from 'pg';
import { IDevice, IdParam } from '../types';

type CreateDeviceBody = Pick<IDevice, 'user_id' | 'device_type' | 'model'> &
  Partial<Pick<IDevice, 'brand' | 'serial_number' | 'notes'>>;

type UpdateDeviceBody = Partial<Pick<IDevice, 'user_id' | 'device_type' | 'brand' | 'model' | 'serial_number' | 'notes'>>;

class DeviceController {
  async createDevice(req: Request<{}, {}, CreateDeviceBody>, res: Response): Promise<Response> {
    try {
      const { user_id, device_type, model, brand, serial_number, notes } = req.body;

      if (!user_id || !device_type || !model) {
        return res.status(400).json({
          message: 'Поля user_id, device_type и model обязательны'
        });
      }

      const newDevice: QueryResult<IDevice> = await db.query(
        `
        INSERT INTO devices (id, user_id, device_type, brand, model, serial_number, notes, created_at, updated_at)
        VALUES (
          nextval(pg_get_serial_sequence('devices', 'id')),
          $1, $2, $3, $4, $5, $6, NOW(), NOW()
        )
        RETURNING *
        `,
        [user_id, device_type, brand ?? null, model, serial_number ?? null, notes ?? null]
      );

      return res.status(201).json(newDevice.rows[0]);
    } catch (error: any) {
      return res.status(500).json({
        message: 'Ошибка при создании устройства',
        details: error.message
      });
    }
  }

  async getDevicesByUserId(req: Request<Pick<IDevice, 'user_id'>>, res: Response): Promise<Response> {
    try {
      const { user_id } = req.params;
      const devices: QueryResult<IDevice[]> = await db.query('SELECT * FROM devices WHERE user_id = $1', [user_id]);

      return res.json(devices.rows);
    } catch (error: any) {
      return res.status(500).json({
        message: 'Ошибка при получении списка устройств',
        details: error.message
      });
    }
  }

  async getDeviceById(req: Request<IdParam>, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const device: QueryResult<IDevice> = await db.query('SELECT * FROM devices WHERE id = $1', [id]);

      if (!device.rows[0]) {
        return res.status(404).json({ message: 'Устройство не найдено' });
      }

      return res.json(device.rows[0]);
    } catch (error: any) {
      return res.status(500).json({
        message: 'Ошибка при получении устройства',
        details: error.message
      });
    }
  }

  async updateDevice(req: Request<IdParam, {}, UpdateDeviceBody>, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { user_id, device_type, brand, model, serial_number, notes } = req.body;

      const device: QueryResult<IDevice> = await db.query(
        `
        UPDATE devices
        SET
          user_id = COALESCE($1, user_id),
          device_type = COALESCE($2, device_type),
          brand = COALESCE($3, brand),
          model = COALESCE($4, model),
          serial_number = COALESCE($5, serial_number),
          notes = COALESCE($6, notes),
          updated_at = NOW()
        WHERE id = $7
        RETURNING *
        `,
        [user_id ?? null, device_type ?? null, brand ?? null, model ?? null, serial_number ?? null, notes ?? null, id]
      );

      if (!device.rows[0]) {
        return res.status(404).json({ message: 'Устройство не найдено' });
      }

      return res.json(device.rows[0]);
    } catch (error: any) {
      return res.status(500).json({
        message: 'Ошибка при обновлении устройства',
        details: error.message
      });
    }
  }

  async deleteDevice(req: Request<IdParam>, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const deletedDevice: QueryResult<{ id: number }> = await db.query(
        'DELETE FROM devices WHERE id = $1 RETURNING id',
        [id]
      );

      if (!deletedDevice.rows[0]) {
        return res.status(404).json({ message: 'Устройство не найдено' });
      }

      return res.status(204).send();
    } catch (error: any) {
      return res.status(500).json({
        message: 'Ошибка при удалении устройства',
        details: error.message
      });
    }
  }
}

export default new DeviceController();