import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoutes from './routes/auth.routes.js';
import cedisRoutes from './routes/cedis.routes.js';
import usersRoutes from './routes/user.routes.js';

const app = express();

app.use(cors({
    origin: 'http://localhost:5173', // Especifica el origen
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