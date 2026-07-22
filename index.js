import app from './app.js';
import { connectDB } from './db.js';

// Intentar conectar a la base de datos
connectDB();

// Solo iniciar el listener de puerto si NO estamos en Vercel (entorno local)
if (!process.env.VERCEL) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Servidor local corriendo en el puerto ${PORT}`);
    });
}

// OBLIGATORIO PARA VERCEL SERVERLESS:
export default app;