import mongoose from "mongoose";

export const connectDB = async () => {
    // Si ya existe una conexión activa, no creamos una nueva (Optimización para Vercel)
    if (mongoose.connection.readyState >= 1) {
        return;
    }

    try {
        // Lee la variable MONGODB_URI definida en tu .env o en el Dashboard de Vercel
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Base de datos conectada correctamente");
    } catch (error) {
        console.error("Error al conectar a MongoDB:", error);
    }
};