import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';

export const getUsers = async (req, res) => {
    try {
        // Traemos todos los usuarios pero excluimos el password por seguridad
        const users = await User.find().select('-password');
        return res.json(users);
    } catch (error) {
        console.error("Error al obtener usuarios:", error);
        return res.status(500).json({ message: "Error interno del servidor" });
    }
};

// 2. Obtener un usuario por su ID (útil para cargar los datos en el formulario de edición)
export const getUserById = async (req, res) => {
    const { id } = req.params;
    try {
        const userFound = await User.findById(id).select('-password');
        
        if (!userFound) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        return res.json(userFound);
    } catch (error) {
        console.error("Error al obtener el usuario por ID:", error);
        // Si el ID de Mongoose no es válido caerá en este catch
        return res.status(500).json({ message: "Error interno del servidor o ID inválido" });
    }
};

// 3. Actualizar un usuario por su ID
export const updateUser = async (req, res) => {
    const { id } = req.params;
    const { usuario, password, role } = req.body;

    try {
        // Creamos un objeto con los campos que se van a actualizar obligatoriamente
        const updateData = { usuario, role };

        // 🔐 Seguridad: Si el usuario envió una nueva contraseña, la encriptamos primero
        if (password && password.trim() !== "") {
            const passwordHash = await bcrypt.hash(password, 10);
            updateData.password = passwordHash;
        }

        // Buscamos y actualizamos. { new: true } devuelve el usuario ya modificado
        const userUpdated = await User.findByIdAndUpdate(
            id, 
            updateData, 
            { new: true }
        ).select('-password');

        if (!userUpdated) {
            return res.status(404).json({ message: "Usuario no encontrado para actualizar" });
        }

        return res.json({
            message: "Usuario actualizado con éxito",
            user: userUpdated
        });

    } catch (error) {
        console.error("Error al actualizar el usuario:", error);
        return res.status(500).json({ message: "Error interno del servidor" });
    }
};