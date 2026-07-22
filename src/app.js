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

app.use(cors({
    origin: [
    'http://localhost:5173',               // Tu entorno de desarrollo local
    'https://indicadores-front.vercel.app'       // URL real de tu Frontend en Vercel
  ],
    credentials: true, // Permitir credenciales
    methods: "PUT, POST, GET, DELETE, PATCH, OPTIONS",
    allowedHeaders: "content-type"
}));
app.use(express.json());
app.use(cookieParser());


app.use("/api", authRoutes);
app.use("/api", cedisRoutes);
app.use("/api", usersRoutes);


export default app;