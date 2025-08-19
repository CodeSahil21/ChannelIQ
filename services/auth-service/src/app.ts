import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import authRouter from './routes/auth.routes'; 

const app = express();
app.use(helmet());
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.get('/health',(_req,res)=>{
    res.status(200).json({ status: 'ok', message: 'Server is running' });
})
app.use('/api/v1/auth', authRouter);

// 404 handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ msg: 'Internal Server Error' });
});

export default app;