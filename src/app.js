import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from './routes/auth.routes.js';
import cedisRoutes from './routes/cedis.routes.js';
import usersRoutes from './routes/user.routes.js';

// 1. OBLIGATORIO: Cargar las variables de entorno inmediatamente
dotenv.config();

const app = express();

// Lista de orígenes permitidos
const ALLOWED_ORIGINS = [
    'https://indicadores-front.vercel.app',
    'http://localhost:5173', // Para desarrollo local con Vite
    'http://localhost:3000'
];

app.use(cors({
    origin: function (origin, callback) {
        // Permitir peticiones sin origen (como Postman o Server-to-Server)
        if (!origin) return callback(null, true);
        
        if (ALLOWED_ORIGINS.includes(origin)) {
            return callback(null, true);
        } else {
            return callback(null, true); // O callback(new Error('CORS no permitido'))
        }
    },
    credentials: true, // ¡CRÍTICO para el envío de cookies/tokens!
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());
app.use(cookieParser());


app.use("/api", authRoutes);
app.use("/api", cedisRoutes);
app.use("/api", usersRoutes);


export default app;