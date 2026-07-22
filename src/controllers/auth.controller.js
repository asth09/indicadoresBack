import User from '../models/user.model.js'
import Audit from "../models/audit.model.js";
import bcrypt from 'bcryptjs'
import { createAccessToken } from '../libs/jwt.js'
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config.js';

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
    const { usuario, password } = req.body;

    try {
        // 1. Verificar si el usuario existe y NO está marcado como eliminado
        const userFound = await User.findOne({ usuario });
        
        if (!userFound) {
            return res.status(400).json({ message: "Usuario o contraseña incorrecta" });
        }

        // 2. Comparar la contraseña
        const isMatch = await bcrypt.compare(password, userFound.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Usuario o contraseña incorrecta" });
        }

        // 3. Generar el Token de acceso
        const token = await createAccessToken({ 
            id: userFound._id, 
            role: userFound.role 
        });

        const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;

        // 4. REGISTRO EN AUDITORÍA (Inicio de sesión)
        // Guardamos quién entró y en qué fecha/hora
        const loginLog = new Audit({
            usuarioId: userFound._id,
            accion: 'LOGIN',
            detalles: `El usuario ${userFound.usuario} ha iniciado sesión en el sistema.`
        });
        await loginLog.save();

        // 5. Configurar cookie y enviar respuesta
        res.cookie('token', token, {
            // Configuración recomendada para desarrollo local
            sameSite: isProduction ? 'none' : 'lax',
            secure: isProduction ? true : false, 
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000 // 1 día
        });

        return res.json({
            id: userFound._id,
            usuario: userFound.usuario,
            role: userFound.role,
            message: "Bienvenido al sistema"
        });

    } catch (error) {
        console.error("Error en el login:", error);
        return res.status(500).json({ message: "Error interno del servidor" });
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

