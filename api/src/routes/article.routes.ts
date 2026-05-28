import { Router } from 'express';
import articleController from '../controller/article.controller';

const router = Router();

router.get('/articles', articleController.getArticles);
router.get('/articles/:id', articleController.getArticleById);

export default router;
