import { Request, Response } from 'express';
import { QueryResult, QueryResultRow } from 'pg';
import db from '../db';

type RepairStatus = 'in_progress' | 'success' | 'failed' | 'cancelled';

type CountRow = QueryResultRow & {
  count: string;
};

type SkillLevelStatRow = QueryResultRow & {
  skill_level_id: number;
  skill_level_code: string;
  skill_level_name: string;
  users_count: string;
};

type StatusStatRow = QueryResultRow & {
  status: RepairStatus;
  count: string;
};

type AdminUserRow = QueryResultRow & {
  id: number;
  full_name: string;
  email: string;
  skill_level_id: number;
  skill_level_code: string;
  skill_level_name: string;
  devices_count: string;
  chats_count: string;
  messages_count: string;
  repair_history_count: string;
  successful_repairs_count: string;
  created_at: string;
  updated_at: string;
};

type TopUserRow = QueryResultRow &
  Pick<
    AdminUserRow,
    | 'id'
    | 'full_name'
    | 'email'
    | 'skill_level_name'
    | 'chats_count'
    | 'messages_count'
    | 'repair_history_count'
    | 'successful_repairs_count'
  >;

type SkillLevelUpdateBody = {
  skill_level_id?: number;
};

const repairStatuses: RepairStatus[] = ['in_progress', 'success', 'failed', 'cancelled'];

const toNumber = (value: string | number | null | undefined): number => Number(value ?? 0);

const query = <T extends QueryResultRow>(text: string, params?: unknown[]): Promise<QueryResult<T>> =>
  db.query(text, params);

class AdminController {
  async getStats(_req: Request, res: Response): Promise<Response> {
    try {
      const [
        usersTotal,
        usersLast7Days,
        usersBySkillLevel,
        chatsTotal,
        activeChatsLast7Days,
        messagesTotal,
        repairHistoryTotal,
        repairHistoryByStatus,
        devicesTotal,
        topUsers,
      ] = await Promise.all([
        query<CountRow>('SELECT COUNT(*)::int AS count FROM users'),
        query<CountRow>(
          `SELECT COUNT(*)::int AS count
           FROM users
           WHERE created_at >= NOW() - INTERVAL '7 days'`
        ),
        query<SkillLevelStatRow>(
          `
          SELECT
            sl.id AS skill_level_id,
            sl.code AS skill_level_code,
            sl.name AS skill_level_name,
            COUNT(u.id)::int AS users_count
          FROM skill_levels sl
          LEFT JOIN users u ON u.skill_level_id = sl.id
          GROUP BY sl.id, sl.code, sl.name
          ORDER BY sl.id
          `
        ),
        query<CountRow>('SELECT COUNT(*)::int AS count FROM assistant_chats'),
        query<CountRow>(
          `SELECT COUNT(*)::int AS count
           FROM assistant_chats
           WHERE updated_at >= NOW() - INTERVAL '7 days'`
        ),
        query<CountRow>('SELECT COUNT(*)::int AS count FROM assistant_chat_messages'),
        query<CountRow>('SELECT COUNT(*)::int AS count FROM repair_history'),
        query<StatusStatRow>(
          `
          SELECT status, COUNT(*)::int AS count
          FROM repair_history
          GROUP BY status
          `
        ),
        query<CountRow>('SELECT COUNT(*)::int AS count FROM devices'),
        query<TopUserRow>(
          `
          SELECT
            u.id,
            u.full_name,
            u.email,
            sl.name AS skill_level_name,
            COUNT(DISTINCT ac.id)::int AS chats_count,
            COUNT(DISTINCT acm.id)::int AS messages_count,
            COUNT(DISTINCT rh.id)::int AS repair_history_count,
            COUNT(DISTINCT rh.id) FILTER (WHERE rh.status = 'success')::int AS successful_repairs_count
          FROM users u
          JOIN skill_levels sl ON sl.id = u.skill_level_id
          LEFT JOIN assistant_chats ac ON ac.user_id = u.id
          LEFT JOIN assistant_chat_messages acm ON acm.chat_id = ac.id
          LEFT JOIN repair_history rh ON rh.user_id = u.id
          GROUP BY u.id, u.full_name, u.email, sl.name
          ORDER BY
            COUNT(DISTINCT acm.id) DESC,
            COUNT(DISTINCT rh.id) DESC,
            u.created_at DESC
          LIMIT 5
          `
        ),
      ]);

      const statusCounts = repairStatuses.reduce<Record<RepairStatus, number>>((acc, status) => {
        acc[status] = 0;
        return acc;
      }, {} as Record<RepairStatus, number>);

      repairHistoryByStatus.rows.forEach((row) => {
        statusCounts[row.status] = toNumber(row.count);
      });

      const completedRepairs =
        statusCounts.success + statusCounts.failed + statusCounts.cancelled;

      const chatsCount = toNumber(chatsTotal.rows[0]?.count);
      const messagesCount = toNumber(messagesTotal.rows[0]?.count);

      return res.json({
        users: {
          total: toNumber(usersTotal.rows[0]?.count),
          last7Days: toNumber(usersLast7Days.rows[0]?.count),
          bySkillLevel: usersBySkillLevel.rows.map((row) => ({
            skillLevelId: row.skill_level_id,
            code: row.skill_level_code,
            name: row.skill_level_name,
            usersCount: toNumber(row.users_count),
          })),
        },
        chats: {
          total: chatsCount,
          activeLast7Days: toNumber(activeChatsLast7Days.rows[0]?.count),
          messagesTotal: messagesCount,
          avgMessagesPerChat: chatsCount > 0 ? Number((messagesCount / chatsCount).toFixed(1)) : 0,
        },
        repairHistory: {
          total: toNumber(repairHistoryTotal.rows[0]?.count),
          byStatus: statusCounts,
          successRate:
            completedRepairs > 0
              ? Number((statusCounts.success / completedRepairs).toFixed(2))
              : 0,
        },
        devices: {
          total: toNumber(devicesTotal.rows[0]?.count),
        },
        topUsers: topUsers.rows.map((row) => ({
          id: row.id,
          fullName: row.full_name,
          email: row.email,
          skillLevelName: row.skill_level_name,
          chatsCount: toNumber(row.chats_count),
          messagesCount: toNumber(row.messages_count),
          repairHistoryCount: toNumber(row.repair_history_count),
          successfulRepairsCount: toNumber(row.successful_repairs_count),
        })),
      });
    } catch (error: any) {
      return res.status(500).json({
        message: 'Ошибка при получении статистики админ-панели',
        details: error.message,
      });
    }
  }

  async getUsers(_req: Request, res: Response): Promise<Response> {
    try {
      const users: QueryResult<AdminUserRow> = await db.query(
        `
        SELECT
          u.id,
          u.full_name,
          u.email,
          u.skill_level_id,
          sl.code AS skill_level_code,
          sl.name AS skill_level_name,
          COUNT(DISTINCT d.id)::int AS devices_count,
          COUNT(DISTINCT ac.id)::int AS chats_count,
          COUNT(DISTINCT acm.id)::int AS messages_count,
          COUNT(DISTINCT rh.id)::int AS repair_history_count,
          COUNT(DISTINCT rh.id) FILTER (WHERE rh.status = 'success')::int AS successful_repairs_count,
          u.created_at,
          u.updated_at
        FROM users u
        JOIN skill_levels sl ON sl.id = u.skill_level_id
        LEFT JOIN devices d ON d.user_id = u.id
        LEFT JOIN assistant_chats ac ON ac.user_id = u.id
        LEFT JOIN assistant_chat_messages acm ON acm.chat_id = ac.id
        LEFT JOIN repair_history rh ON rh.user_id = u.id
        GROUP BY u.id, sl.code, sl.name
        ORDER BY u.created_at DESC, u.id DESC
        `
      );

      return res.json(
        users.rows.map((user) => ({
          id: user.id,
          fullName: user.full_name,
          email: user.email,
          skillLevelId: user.skill_level_id,
          skillLevelCode: user.skill_level_code,
          skillLevelName: user.skill_level_name,
          devicesCount: toNumber(user.devices_count),
          chatsCount: toNumber(user.chats_count),
          messagesCount: toNumber(user.messages_count),
          repairHistoryCount: toNumber(user.repair_history_count),
          successfulRepairsCount: toNumber(user.successful_repairs_count),
          createdAt: user.created_at,
          updatedAt: user.updated_at,
        }))
      );
    } catch (error: any) {
      return res.status(500).json({
        message: 'Ошибка при получении пользователей админ-панели',
        details: error.message,
      });
    }
  }

  async updateUserSkillLevel(
    req: Request<{ id: string }, {}, SkillLevelUpdateBody>,
    res: Response
  ): Promise<Response> {
    try {
      const { id } = req.params;
      const { skill_level_id } = req.body;

      if (!Number.isInteger(skill_level_id)) {
        return res.status(400).json({
          message: 'Поле skill_level_id обязательно и должно быть целым числом',
        });
      }

      const updatedUser: QueryResult<AdminUserRow> = await db.query(
        `
        UPDATE users
        SET skill_level_id = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING
          id,
          full_name,
          email,
          skill_level_id,
          created_at,
          updated_at,
          '' AS skill_level_code,
          '' AS skill_level_name,
          0::int AS devices_count,
          0::int AS chats_count,
          0::int AS messages_count,
          0::int AS repair_history_count,
          0::int AS successful_repairs_count
        `,
        [skill_level_id, id]
      );

      if (!updatedUser.rows[0]) {
        return res.status(404).json({ message: 'Пользователь не найден' });
      }

      const enrichedUser: QueryResult<AdminUserRow> = await db.query(
        `
        SELECT
          u.id,
          u.full_name,
          u.email,
          u.skill_level_id,
          sl.code AS skill_level_code,
          sl.name AS skill_level_name,
          COUNT(DISTINCT d.id)::int AS devices_count,
          COUNT(DISTINCT ac.id)::int AS chats_count,
          COUNT(DISTINCT acm.id)::int AS messages_count,
          COUNT(DISTINCT rh.id)::int AS repair_history_count,
          COUNT(DISTINCT rh.id) FILTER (WHERE rh.status = 'success')::int AS successful_repairs_count,
          u.created_at,
          u.updated_at
        FROM users u
        JOIN skill_levels sl ON sl.id = u.skill_level_id
        LEFT JOIN devices d ON d.user_id = u.id
        LEFT JOIN assistant_chats ac ON ac.user_id = u.id
        LEFT JOIN assistant_chat_messages acm ON acm.chat_id = ac.id
        LEFT JOIN repair_history rh ON rh.user_id = u.id
        WHERE u.id = $1
        GROUP BY u.id, sl.code, sl.name
        `,
        [id]
      );

      const user = enrichedUser.rows[0];

      return res.json({
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        skillLevelId: user.skill_level_id,
        skillLevelCode: user.skill_level_code,
        skillLevelName: user.skill_level_name,
        devicesCount: toNumber(user.devices_count),
        chatsCount: toNumber(user.chats_count),
        messagesCount: toNumber(user.messages_count),
        repairHistoryCount: toNumber(user.repair_history_count),
        successfulRepairsCount: toNumber(user.successful_repairs_count),
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      });
    } catch (error: any) {
      if (error?.code === '23503') {
        return res.status(400).json({ message: 'Уровень навыков не найден' });
      }

      return res.status(500).json({
        message: 'Ошибка при изменении уровня навыков пользователя',
        details: error.message,
      });
    }
  }
}

export default new AdminController();
