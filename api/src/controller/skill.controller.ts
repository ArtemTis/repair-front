import { Request, Response } from 'express';
import { QueryResult } from 'pg';
import db from '../db'; 
import { ISkills } from '../types';

class SkillsController {
  async getSkills(req: Request, res: Response): Promise<Response> {
    try {
      const skills: QueryResult<ISkills[]> = await db.query('SELECT * FROM skill_levels ORDER BY id');
      return res.json(skills.rows);
    } catch (error: any) {
      return res.status(500).json({
        message: 'Ошибка при получении списка уровней навыков',
        details: error.message
      });
    }
  }


  async getSkillById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const skill: QueryResult<ISkills> = await db.query('SELECT * FROM skill_levels WHERE id = $1', [id]);

      if (!skill.rows[0]) {
        return res.status(404).json({ message: 'Уровень навыка не найден' });
      }

      return res.json(skill.rows[0]);
    } catch (error: any) {
      return res.status(500).json({
        message: 'Ошибка при получении уровня навыков',
        details: error.message
      });
    }
  }

  async getSkillByUserId(req: Request<{ user_id: string }>, res: Response): Promise<Response> {
    try {
      const { user_id } = req.params;
  
      const skill: QueryResult<ISkills> = await db.query(
        `SELECT sl.*
         FROM skill_levels sl
         INNER JOIN users u ON u.skill_level_id = sl.id
         WHERE u.id = $1`,
        [user_id]
      );
  
      if (!skill.rows[0]) {
        return res.status(404).json({ message: 'Уровень навыка для этого пользователя не найден' });
      }
  
      return res.json(skill.rows[0]);
    } catch (error: any) {
      return res.status(500).json({
        message: 'Ошибка при получении уровня навыков пользователя',
        details: error.message
      });
    }
  }

}

export default new SkillsController();