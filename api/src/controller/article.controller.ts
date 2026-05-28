import db from '../db';
import { Request, Response } from 'express';
import { QueryResult } from 'pg';
import { IArticle, IdParam } from '../types';

class ArticleController {
  async getArticles(_req: Request, res: Response): Promise<Response> {
    try {
      const articles: QueryResult<IArticle> = await db.query(
        `
        SELECT *
        FROM articles
        WHERE is_published = TRUE
        ORDER BY COALESCE(published_at, created_at) DESC, id DESC
        `
      );

      return res.json(articles.rows);
    } catch (error: any) {
      return res.status(500).json({
        message: 'Ошибка при получении списка статей',
        details: error.message
      });
    }
  }

  async getArticleById(req: Request<IdParam>, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const article: QueryResult<IArticle> = await db.query(
        `
        SELECT *
        FROM articles
        WHERE id = $1 AND is_published = TRUE
        `,
        [id]
      );

      if (!article.rows[0]) {
        return res.status(404).json({ message: 'Статья не найдена' });
      }

      return res.json(article.rows[0]);
    } catch (error: any) {
      return res.status(500).json({
        message: 'Ошибка при получении статьи',
        details: error.message
      });
    }
  }
}

export default new ArticleController();
