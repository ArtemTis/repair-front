import express, { ErrorRequestHandler, Request, Response } from 'express';
import userRouter from './routes/user.routers';
import skillRouter from './routes/skill.routers';
import toolRouter from './routes/tool.routes';
import deviceRouter from './routes/device.routes';
import repairGuide from './routes/repair_guide.routes';
import repairHistory from './routes/repair_history.routes';
import userTools from './routes/user_tools.routes';
import repairGuideTools from './routes/repair_guide_tool.routes';
import authRouter from './routes/auth.routes';
import assistantChats from './routes/assistant_chat.routes';
import articleRouter from './routes/article.routes';
import adminRouter from './routes/admin.routes';

const PORT = process.env.PORT || 8080;
const JSON_BODY_LIMIT = process.env.JSON_BODY_LIMIT || '100mb';

const app = express();
app.use((req: Request, res: Response, next) => {
    const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:3000,http://localhost:3001')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
    const requestOrigin = req.header('Origin');
    const responseOrigin =
        requestOrigin && allowedOrigins.includes(requestOrigin)
            ? requestOrigin
            : allowedOrigins[0];

    res.header('Access-Control-Allow-Origin', responseOrigin);
    res.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');

    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }

    return next();
});
app.use(express.json({ limit: JSON_BODY_LIMIT }));

app.get('/', (req: Request, res: Response) => {
    res.status(200).json({ message: 'API is running' });
});

app.use('/api', authRouter);
app.use('/api', userRouter);
app.use('/api', skillRouter);
app.use('/api', toolRouter);
app.use('/api', deviceRouter);
app.use('/api', repairGuide);
app.use('/api', repairHistory);
app.use('/api', assistantChats);
app.use('/api', userTools);
app.use('/api', repairGuideTools);
app.use('/api', articleRouter);
app.use('/api', adminRouter);

const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    if (err?.type === 'entity.too.large') {
        return res.status(413).json({
            message: 'Размер запроса слишком большой',
            details: `Уменьшите файл или увеличьте JSON_BODY_LIMIT (текущий лимит: ${JSON_BODY_LIMIT})`,
        });
    }

    return next(err);
};

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});