import jwt from "jsonwebtoken"; 
import { JWT_SECRET } from "../config.js"; 
 
export const authRequired = (req, res, next) => { 
    try {
        const { token } = req.cookies; 

        if (!token) {
            return res.status(401).json({ message: "No hay token, autorización denegada" }); 
        }

        jwt.verify(token, JWT_SECRET, (error, user) => { 
            if (error) {
                return res.status(403).json({ message: "Token inválido" }); 
            }
            // Establecer la cookie en la respuesta
            //res.cookie('token', token);
            req.user = user;
            console.log(user);
            next(); 
        });
    } catch (error) {
        console.error("Error al verificar el token:", error);
        return res.status(500).json({ message: "Error interno del servidor" });
    }
};

export const validateUserRole = (req, res, next) => {
    try {
        const { token } = req.cookies;

        if (!token) {
            return res.status(401).json({ message: "No hay token, autorización denegada" });
        }

        jwt.verify(token, JWT_SECRET, (error, user) => {
            if (error) {
                return res.status(403).json({ message: "Token inválido" });
            }

            // Verificar el rol del usuario desde el token
            const { role } = user;
            if (role !== 'ADMIN') {
                return res.status(403).json({ message: "No tienes permisos para acceder a esta funcionalidad" });
            }

            req.user = user;
            console.log(user);
            next();
        });
    } catch (error) {
        console.error("Error al verificar el token:", error);
        return res.status(500).json({ message: "Error interno del servidor" });
    }
};

export const validateUserRoles = (req, res, next) => {
    try {
        const { token } = req.cookies;

        if (!token) {
            return res.status(401).json({ message: "No hay token, autorización denegada" });
        }

        jwt.verify(token, JWT_SECRET, (error, user) => {
            if (error) {
                return res.status(403).json({ message: "Token inválido" });
            }

            // Verificar el rol del usuario desde el token
            const { role } = user;
            if (role !== 'ADMIN' && role !== 'Gerente') {
                return res.status(403).json({ message: "No tienes permisos para acceder a esta funcionalidad" });
            }

            req.user = user;
            console.log(user);
            next();
        });
    } catch (error) {
        console.error("Error al verificar el token:", error);
        return res.status(500).json({ message: "Error interno del servidor" });
    }
};

export const validateEmpleado = (req, res, next) => {
    try {
        const { token } = req.cookies;

        if (!token) {
            return res.status(401).json({ message: "No hay token, autorización denegada" });
        }

        jwt.verify(token, JWT_SECRET, (error, user) => {
            if (error) {
                return res.status(403).json({ message: "Token inválido" });
            }

            // Verificar el rol del usuario desde el token
            const { role } = user;
            if (role !== 'ADMIN' && role !== 'empleado') {
                return res.status(403).json({ message: "No tienes permisos para acceder a esta funcionalidad" });
            }

            req.user = user;
            console.log(user);
            next();
        });
    } catch (error) {
        console.error("Error al verificar el token:", error);
        return res.status(500).json({ message: "Error interno del servidor" });
    }
};