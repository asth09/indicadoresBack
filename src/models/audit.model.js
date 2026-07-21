// models/audit.model.js
import mongoose from 'mongoose';

const auditSchema = new mongoose.Schema({
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    accion: { type: String, required: true }, // Ej: 'LOGIN', 'DELETE_ITEM'
    detalles: { type: String }, // Información extra (ej: "Eliminó el registro X")
    fecha: { type: Date, default: Date.now }
});

export default mongoose.model('Audit', auditSchema);