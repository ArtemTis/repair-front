import db from '../db';
import { Request, Response } from 'express';
import { QueryResult } from 'pg';
import {
  AssistantMessageAuthor,
  IAssistantChat,
  IAssistantChatMessage,
  IAssistantChatWithMessages,
  IdParam
} from '../types';

type UserIdParam = { user_id: string };

type CreateChatBody = {
  user_id: number;
  title?: string;
  messages?: Array<{
    author: AssistantMessageAuthor;
    text: string;
    created_at?: string;
  }>;
};

type UpdateChatBody = Partial<Pick<IAssistantChat, 'title'>>;

type AddMessageBody = {
  author: AssistantMessageAuthor;
  text: string;
  created_at?: string;
};

const validAuthors: AssistantMessageAuthor[] = ['me', 'companion'];

let tablesReady: Promise<void> | null = null;

const ensureTables = async () => {
  if (!tablesReady) {
    tablesReady = (async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS assistant_chats (
          id SERIAL PRIMARY KEY,
          user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(160) NOT NULL DEFAULT 'Новый чат',
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS assistant_chat_messages (
          id SERIAL PRIMARY KEY,
          chat_id INT NOT NULL REFERENCES assistant_chats(id) ON DELETE CASCADE,
          author VARCHAR(20) NOT NULL,
          text TEXT NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          CHECK (author IN ('me', 'companion'))
        )
      `);

      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_assistant_chats_user_updated
        ON assistant_chats (user_id, updated_at DESC)
      `);

      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_assistant_chat_messages_chat_created
        ON assistant_chat_messages (chat_id, created_at ASC, id ASC)
      `);
    })();
  }

  return tablesReady;
};

const titleFromText = (text: string) => {
  const firstLine = text.trim().split(/\r?\n/)[0] ?? '';
  if (!firstLine) return 'Новый чат';
  return firstLine.length > 72 ? `${firstLine.slice(0, 72)}...` : firstLine;
};

const assertAuthor = (author: AssistantMessageAuthor) => validAuthors.includes(author);

class AssistantChatController {
  async getChatsByUserId(req: Request<UserIdParam>, res: Response): Promise<Response> {
    try {
      await ensureTables();

      const { user_id } = req.params;
      const chats: QueryResult<IAssistantChat> = await db.query(
        `
        SELECT id, user_id, title, created_at, updated_at
        FROM assistant_chats
        WHERE user_id = $1
        ORDER BY updated_at DESC, id DESC
        `,
        [user_id]
      );

      return res.json(chats.rows);
    } catch (error: any) {
      return res.status(500).json({
        message: 'Ошибка при получении списка чатов',
        details: error.message
      });
    }
  }

  async getChatById(req: Request<IdParam>, res: Response): Promise<Response> {
    try {
      await ensureTables();

      const { id } = req.params;
      const chat: QueryResult<IAssistantChat> = await db.query(
        'SELECT id, user_id, title, created_at, updated_at FROM assistant_chats WHERE id = $1',
        [id]
      );

      if (!chat.rows[0]) {
        return res.status(404).json({ message: 'Чат не найден' });
      }

      const messages: QueryResult<IAssistantChatMessage> = await db.query(
        `
        SELECT id, chat_id, author, text, created_at
        FROM assistant_chat_messages
        WHERE chat_id = $1
        ORDER BY created_at ASC, id ASC
        `,
        [id]
      );

      const result: IAssistantChatWithMessages = {
        ...chat.rows[0],
        messages: messages.rows
      };

      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({
        message: 'Ошибка при получении чата',
        details: error.message
      });
    }
  }

  async createChat(req: Request<{}, {}, CreateChatBody>, res: Response): Promise<Response> {
    try {
      await ensureTables();

      const { user_id, messages = [] } = req.body;
      let { title } = req.body;

      if (!user_id) {
        return res.status(400).json({ message: 'Поле user_id обязательно' });
      }

      for (const message of messages) {
        if (!message.text?.trim() || !assertAuthor(message.author)) {
          return res.status(400).json({ message: 'Некорректное сообщение чата' });
        }
      }

      const firstUserMessage = messages.find((message) => message.author === 'me');
      title = title?.trim() || (firstUserMessage ? titleFromText(firstUserMessage.text) : 'Новый чат');

      const client = await db.connect();
      try {
        await client.query('BEGIN');

        const chat: QueryResult<IAssistantChat> = await client.query(
          `
          INSERT INTO assistant_chats (id, user_id, title, created_at, updated_at)
          VALUES (
            nextval(pg_get_serial_sequence('assistant_chats', 'id')),
            $1, $2, NOW(), NOW()
          )
          RETURNING id, user_id, title, created_at, updated_at
          `,
          [user_id, title]
        );

        const chatId = chat.rows[0].id;
        const insertedMessages: IAssistantChatMessage[] = [];

        for (const message of messages) {
          const inserted: QueryResult<IAssistantChatMessage> = await client.query(
            `
            INSERT INTO assistant_chat_messages (id, chat_id, author, text, created_at)
            VALUES (
              nextval(pg_get_serial_sequence('assistant_chat_messages', 'id')),
              $1, $2, $3, COALESCE($4, NOW())
            )
            RETURNING id, chat_id, author, text, created_at
            `,
            [chatId, message.author, message.text.trim(), message.created_at ?? null]
          );
          insertedMessages.push(inserted.rows[0]);
        }

        await client.query('COMMIT');

        return res.status(201).json({
          ...chat.rows[0],
          messages: insertedMessages
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error: any) {
      return res.status(500).json({
        message: 'Ошибка при создании чата',
        details: error.message
      });
    }
  }

  async updateChat(req: Request<IdParam, {}, UpdateChatBody>, res: Response): Promise<Response> {
    try {
      await ensureTables();

      const { id } = req.params;
      const { title } = req.body;

      if (!title?.trim()) {
        return res.status(400).json({ message: 'Поле title обязательно' });
      }

      const chat: QueryResult<IAssistantChat> = await db.query(
        `
        UPDATE assistant_chats
        SET title = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id, user_id, title, created_at, updated_at
        `,
        [title.trim(), id]
      );

      if (!chat.rows[0]) {
        return res.status(404).json({ message: 'Чат не найден' });
      }

      return res.json(chat.rows[0]);
    } catch (error: any) {
      return res.status(500).json({
        message: 'Ошибка при обновлении чата',
        details: error.message
      });
    }
  }

  async addMessage(req: Request<IdParam, {}, AddMessageBody>, res: Response): Promise<Response> {
    try {
      await ensureTables();

      const { id } = req.params;
      const { author, text, created_at } = req.body;

      if (!text?.trim() || !assertAuthor(author)) {
        return res.status(400).json({ message: 'Поля author и text обязательны' });
      }

      const client = await db.connect();
      try {
        await client.query('BEGIN');

        const chatExists: QueryResult<{ id: number }> = await client.query(
          'SELECT id FROM assistant_chats WHERE id = $1',
          [id]
        );

        if (!chatExists.rows[0]) {
          await client.query('ROLLBACK');
          return res.status(404).json({ message: 'Чат не найден' });
        }

        const message: QueryResult<IAssistantChatMessage> = await client.query(
          `
          INSERT INTO assistant_chat_messages (id, chat_id, author, text, created_at)
          VALUES (
            nextval(pg_get_serial_sequence('assistant_chat_messages', 'id')),
            $1, $2, $3, COALESCE($4, NOW())
          )
          RETURNING id, chat_id, author, text, created_at
          `,
          [id, author, text.trim(), created_at ?? null]
        );

        await client.query(
          `
          UPDATE assistant_chats
          SET
            title = CASE
              WHEN title = 'Новый чат' AND $2 = 'me' THEN $3
              ELSE title
            END,
            updated_at = NOW()
          WHERE id = $1
          `,
          [id, author, titleFromText(text)]
        );

        await client.query('COMMIT');
        return res.status(201).json(message.rows[0]);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error: any) {
      return res.status(500).json({
        message: 'Ошибка при добавлении сообщения',
        details: error.message
      });
    }
  }

  async deleteChat(req: Request<IdParam>, res: Response): Promise<Response> {
    try {
      await ensureTables();

      const { id } = req.params;
      const deleted: QueryResult<{ id: number }> = await db.query(
        'DELETE FROM assistant_chats WHERE id = $1 RETURNING id',
        [id]
      );

      if (!deleted.rows[0]) {
        return res.status(404).json({ message: 'Чат не найден' });
      }

      return res.status(204).send();
    } catch (error: any) {
      return res.status(500).json({
        message: 'Ошибка при удалении чата',
        details: error.message
      });
    }
  }
}

export default new AssistantChatController();
