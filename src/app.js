import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from './routes/auth.routes.js';
import cedisRoutes from './routes/cedis.routes.js';
import usersRoutes from './routes/user.routes.js';

dotenv.config();

const app = express();

const ALLOWED_ORIGINS = [
    'https://indicadores-front.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
];

const corsOptions = {
    origin: ALLOWED_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    optionsSuccessStatus: 200 // Compatibilidad con navegadores antiguos/legacy
};

// 1. Aplicar CORS a todas las rutas
app.use(cors(corsOptions));

// 2. Responder explícitamente a las peticiones Preflight (OPTIONS)
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(cookieParser());

app.use("/api", authRoutes);
app.use("/api", cedisRoutes);
app.use("/api", usersRoutes);

export default app;