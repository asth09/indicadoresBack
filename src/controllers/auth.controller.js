import User from '../models/user.model.js'
import Audit from "../models/audit.model.js";
import bcrypt from 'bcryptjs'
import { createAccessToken } from '../libs/jwt.js'
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config.js';
import { connectDB } from '../db.js';

const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;

const cookieOptions = {
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction ? true : false,
};

export const register = async (req, res) => {
    const {usuario, password, role} = req.body

    try {
        const passwordHash = await bcrypt.hash(password, 10)
        const newUser = new User({
            usuario,
            password: passwordHash,
            role,
        })
        
        const userSaved = await newUser.save()
        const token = await createAccessToken({id: userSaved._id, role: userSaved.role})
        res.cookie('token', token)
            res.json({
                message:"User created successfully",
            })
        //res.send('registrando')
    } catch (error) {
        console.log(error)
    }
};

export const login = async (req, res) => {
    // 1. Conexión a Base de Datos
    try {
        await connectDB();
    } catch (dbError) {
        console.error("Fallo conexión MongoDB:", dbError);
        return res.status(500).json({ message: "Error conectando a la base de datos", error: dbError.message });
    }

    const { usuario, password } = req.body;

    try {
        // 2. Busqueda de usuario
        const userFound = await User.findOne({ usuario });
        if (!userFound) {
            return res.status(400).json({ message: "Usuario o contraseña incorrecta" });
        }

        // 3. Comparación de contraseña
        const isMatch = await bcrypt.compare(password, userFound.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Usuario o contraseña incorrecta" });
        }

        // 4. Generación de Token JWT
        let token;
        try {
            token = await createAccessToken({ id: userFound._id, role: userFound.role });
        } catch (jwtErr) {
            console.error("Error al crear JWT token:", jwtErr);
            return res.status(500).json({ message: "Error al generar el token de sesión", error: jwtErr.message });
        }

        // 5. Auditoría (Opcional - Silenciosa)
        try {
            const loginLog = new Audit({
                usuarioId: userFound._id,
                accion: 'LOGIN',
                detalles: `El usuario ${userFound.usuario} ha iniciado sesión en el sistema.`
            });
            await loginLog.save();
        } catch (auditError) {
            console.error("Error al guardar auditoría (login ignorará este error):", auditError.message);
        }

        // 6. Asignación de Cookie y Respuesta
        res.cookie('token', token, {
            ...cookieOptions,
            maxAge: 24 * 60 * 60 * 1000
        });

        return res.json({
            id: userFound._id,
            usuario: userFound.usuario,
            role: userFound.role,
            message: "Bienvenido al sistema"
        });

    } catch (error) {
        console.error("Error no esperado en login:", error);
        return res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};

export const logout = (req, res) => {
    res.cookie('token', "", {
        expires: new Date(0)
    });
    return res.sendStatus(200);
}

export const verifyToken = (req, res) => {
    const {token} = req.cookies
    await connectDB();

    if (!token) return res.status(401).json({ message: "unauthorized"});

    jwt.verify(token, JWT_SECRET, async (err, user) => {
        if (err) return res.status(401).json({ message: "unauthorized"});

        const userFound = await User.findById(user.id)
        if (!userFound) return res.status(401).json({message: "Unauthorized" });

        return res.json({
            id: userFound._id,
            role: userFound.role,
        });
    });
};

