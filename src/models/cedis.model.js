import mongoose from "mongoose";

const sstSchema = new mongoose.Schema({
  region: String,
  cedis: { type: String, required: true },
  trabajadores: Number,
  delegados: [{
    nombre: String,
    cargo: String,
    ci: String,
    telefono: String,
    fechaEleccion: Date,
    vencimiento: Date,
    alert: { type: String, default: 'ok' },
    obs: String
  }],
  patronos: [{
    nombre: String,
    cargo: String,
    ci: String,
    telefono: String,
    alert: String,
    obs: String
  }],
  ssst: { tipo: String, reg: String },
  psst: { norma: String, aprobado: String, reg: String },
  politica: { firmada: String, libro: String, divulgada: String },
  comite: { fechaActualizacionRegistro: String, obs: String },
  // Seguimiento mensual (Ene-Dic)
  formacion: { type: [Number], default: [0,0,0,0,0,0,0,0,0,0,0,0] },
  informes: { type: [Number], default: [0,0,0,0,0,0,0,0,0,0,0,0] },
  estadisticas: { type: [Number], default: [0,0,0,0,0,0,0,0,0,0,0,0] },
  form_extra: { cronograma: String, pct: Number },
  // Datos para indicadores de accidentabilidad (IFN, IFB, IS)
  accidentabilidad: {
    hhe: [Number],
    nlt: [Number],
    nlpt: [Number]
  },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });
export default mongoose.model('Cedis', sstSchema);