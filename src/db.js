import mongoose from "mongoose";

export const connectDB = async () => {
    // 1. Si ya existe una conexión activa (1 = connected, 2 = connecting)
    if (mongoose.connection.readyState >= 1) {
        return;
    }

    // 2. Verificar que la variable existe en Vercel
    if (!process.env.MONGODB_URI) {
        console.error("CRÍTICO: La variable MONGODB_URI no está definida en process.env");
        throw new Error("MONGODB_URI no está configurada en las variables de entorno");
    }

    try {
        // Desactivar buffering para que las consultas fallen rápido si no hay conexión en lugar de congelar por 10s
        mongoose.set('bufferCommands', false);

        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000, // Timeout de conexión a 5 segundos máx
        });

        console.log("Base de datos conectada correctamente");
    } catch (error) {
        console.error("Error fatal al conectar a MongoDB:", error.message);
        throw error; // Lanza el error para que el controller de Login lo capture de inmediato
    }
};