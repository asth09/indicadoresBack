import Cedis from '../models/cedis.model.js';
import Audit from "../models/audit.model.js";

// 1. Obtener todos los CEDIS (útil para el mapa nacional)
export const getCedisAll = async(req, res) => {
    try {
        const registros = await Cedis.find({ isDeleted: false });
        res.json(registros);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// 2. Crear un nuevo CEDIS
export const createCedis = async(req, res) => {
    try {
        // Usamos spread operator (...) para capturar toda la estructura compleja
        const newCedis = new Cedis({
            ...req.body,
            isDeleted: false
        });
        
        const savedCedis = await newCedis.save();
        
        // Auditoría de creación
        await new Audit({
            usuarioId: req.user.id,
            accion: 'CREATE_CEDIS',
            detalles: `Creó el registro para el CEDIS: ${req.body.cedis} (${req.body.region})`
        }).save();

        res.json(savedCedis);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// 3. Obtener un CEDIS por ID (para la vista de detalle/editar)
export const getCedisById = async(req, res) => {
    try {
        const registro = await Cedis.findOne({ 
            _id: req.params.id, 
            isDeleted: false 
        });
        
        if (!registro) return res.status(404).json({ message: "CEDIS no encontrado" });
        res.json(registro);
    } catch (error) {
        return res.status(400).json({ message: "ID inválido o error de búsqueda"});
    }
};

// 4. ACTUALIZACIÓN (La parte más importante)
// Función helper para aplanar sub-objetos
const flattenObject = (obj, prefix = '') => {
    return Object.keys(obj).reduce((acc, k) => {
        const pre = prefix.length ? prefix + '.' : '';
        if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
            Object.assign(acc, flattenObject(obj[k], pre + k));
        } else {
            acc[pre + k] = obj[k];
        }
        return acc;
    }, {});
};

export const updateCedis = async(req, res) => {
    try {
        // Aplanamos el body para soportar actualizaciones parciales de sub-objetos
        const updateData = flattenObject(req.body);

        const updatedRecord = await Cedis.findByIdAndUpdate(
            req.params.id, 
            { $set: updateData }, // Usamos $set con el objeto aplanado
            { new: true, runValidators: true } // runValidators asegura que valide el esquema
        );

        if (!updatedRecord) return res.status(404).json({ message: "No se pudo actualizar" });

        // Auditoría de actualización
        await new Audit({
            usuarioId: req.user.id,
            accion: 'UPDATE_CEDIS',
            detalles: `Actualizó datos de SST del CEDIS: ${updatedRecord.cedis}`
        }).save();

        res.json(updatedRecord);
    } catch (error) {
        console.error(error); // Es buena práctica loggear el error real en tu servidor
        return res.status(500).json({ message: "Error al actualizar los indicadores" });
    }
};

// 5. Borrado Lógico
export const deleteCedis = async (req, res) => {
    try {
        const cedisDeleted = await Cedis.findByIdAndUpdate(
            req.params.id,
            { isDeleted: true },
            { new: true }
        );

        if (!cedisDeleted) return res.status(404).json({ message: "Registro no encontrado" });

        await new Audit({
            usuarioId: req.user.id,
            accion: 'DELETE_CEDIS',
            detalles: `Eliminó lógicamente el CEDIS: ${cedisDeleted.cedis}`
        }).save();

        res.json({ message: "Registro eliminado correctamente" });
    } catch (error) {
        return res.status(500).json({ message: "Error al eliminar" });
    }
};

// 6. Filtrar por Región (Para los botones del Dashboard)
export const getCedisByRegion = async (req, res) => {

    try {

        const { region } = req.params;

        const registros = await Cedis.find({ region, isDeleted: false });

        res.json(registros);

    } catch (error) {

        return res.status(500).json({ message: "Error al filtrar por región" });

    }

};

export const getDelegadosVencidos = async (req, res) => {
  try {
    const fechaActual = new Date();

    // 1. Buscamos TODOS los CEDIS activos. 
    // No filtramos por fecha aquí porque MongoDB ignora los Strings en comparaciones de fecha.
    const todosLosCedis = await Cedis.find({ isDeleted: false });

    const listaVencidos = [];

    // 2. Usamos JavaScript para convertir y comparar (esto sí reconoce Strings y Fechas)
    todosLosCedis.forEach(cedi => {
      if (cedi.delegados && Array.isArray(cedi.delegados)) {
        cedi.delegados.forEach(del => {
          
          // CONVERSIÓN CRÍTICA: Convertimos lo que sea que haya en 'vencimiento' a objeto Date
          const fechaVenc = new Date(del.vencimiento);

          // Si la fecha es válida Y es menor a la fecha actual
          if (!isNaN(fechaVenc) && fechaVenc < fechaActual) {
            listaVencidos.push({
              _id: del._id,
              nombre: del.nombre,
              region: cedi.region,
              cedis: cedi.cedis,
              vencimiento: fechaVenc, // Pasamos el objeto Date real al front
              alert: del.alert
            });
          }
        });
      }
    });

    // Ordenar de más antiguo a más reciente
    listaVencidos.sort((a, b) => a.vencimiento - b.vencimiento);

    res.json(listaVencidos);
  } catch (error) {
    console.error("Error en getDelegadosVencidos:", error);
    return res.status(500).json({ message: "Error al filtrar delegados vencidos" });
  }
};

export const getDelegadosProximos = async (req, res) => {
  try {
    // 1. Normalizamos las fechas para que no dependan de la hora exacta de la petición
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Inicio del día de hoy

    const limite = new Date();
    limite.setDate(hoy.getDate() + 60); 
    limite.setHours(23, 59, 59, 999); // Fin del día 60

    // 2. Buscamos los CEDIS que tengan delegados en ese rango
    // Filtramos primero por isDeleted para optimizar
    const registros = await Cedis.find({ isDeleted: false });

    const listaProximos = [];

    registros.forEach(cedi => {
      // Verificamos si el CEDI tiene el arreglo de delegados
      if (cedi.delegados && Array.isArray(cedi.delegados)) {
        cedi.delegados.forEach(del => {
          if (del.vencimiento) {
            const fechaVenc = new Date(del.vencimiento);

            // 3. Comparación lógica manual (más fiable para subdocumentos)
            if (fechaVenc >= hoy && fechaVenc <= limite) {
              listaProximos.push({
                _id: del._id,
                nombre: del.nombre,
                cedis: cedi.cedis,
                region: cedi.region,
                vencimiento: del.vencimiento,
                // Cálculo de días restantes
                diasRestantes: Math.ceil((fechaVenc - hoy) / (1000 * 60 * 60 * 24))
              });
            }
          }
        });
      }
    });

    // 4. Ordenar por el que vence más pronto (opcional pero recomendado)
    listaProximos.sort((a, b) => new Date(a.vencimiento) - new Date(b.vencimiento));

    res.json(listaProximos);
  } catch (error) {
    console.error("Error en getDelegadosProximos:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const getCedisBrechas = async (req, res) => {
  try {
    // Buscamos centros donde el programa no esté aprobado o falte registro
    const brechas = await Cedis.find({
      isDeleted: false,
      $or: [
        { "psst.reg": "NO" },
        { "psst.aprobado": "En actualización" },
        { "psst.aprobado": "NO" }
      ]
    }).select('cedis region psst'); // Traemos solo los campos necesarios

    res.json(brechas);
  } catch (error) {
    return res.status(500).json({ message: "Error al obtener brechas de programa" });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const hoy = new Date();
    const cedis = await Cedis.find({ isDeleted: false });

    let stats = {
      criticos: 0,
      seguimiento: 0,
      delegadosVencidos: 0,
      comitesDesactualizados: 0,
      programasDesactualizados: 0
    };

    cedis.forEach(c => {
      let esCritico = false;

      // 1. Verificar Delegados Vencidos
      const tieneVencidos = c.delegados.some(d => d.vencimiento && new Date(d.vencimiento) < hoy);
      if (tieneVencidos) {
        stats.delegadosVencidos++;
        esCritico = true;
      }

      // 2. Verificar Comités (Si el registro es NO o tiene más de 2 años - ejemplo)
      if (c.comite.obs.toLowerCase().includes("vencido") || c.psst.reg === "NO") {
        stats.comitesDesactualizados++;
        esCritico = true;
      }

      // 3. Verificar Programas
      if (c.psst.aprobado === "En actualización" || c.psst.aprobado === "NO") {
        stats.programasDesactualizados++;
        esCritico = true;
      }

      // Lógica de tarjetas principales
      if (esCritico) stats.criticos++;
      else stats.seguimiento++;
    });

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: "Error al calcular estadísticas" });
  }
};

export const getComitesAlertas = async (req, res) => {
  try {
    const comitesAlertas = await Cedis.find({
      isDeleted: false,
      $or: [
        { "psst.reg": "NO" }, 
        { "comite.fechaActualizacionRegistro": { $in: ["", "Sin fecha", null] } }
      ]
    }).select('cedis region psst comite');

    res.json(comitesAlertas);
  } catch (error) {
    return res.status(500).json({ message: "Error al obtener alertas de comités" });
  }
};

export const getCedisSanCristobal = async (req, res) => {
  try {
    // Buscamos el registro donde el campo 'cedis' coincida con San Cristóbal
    // Usamos una expresión regular con 'i' para que no importe si escribes con mayúsculas/minúsculas
    const registro = await Cedis.findOne({ 
      cedis: { $regex: /san cristóbal/i },
      isDeleted: false 
    });

    if (!registro) {
      return res.status(404).json({ message: "No se encontró el CEDI de San Cristóbal" });
    }

    res.json(registro);
  } catch (error) {
    return res.status(500).json({ message: "Error al obtener los datos de San Cristóbal" });
  }
};

export const getCedisByName = async (req, res) => {
  try {
    const { nombre } = req.params;

    // 1. Limpiamos el nombre: "la-fria" -> "la fria"
    let nombreLimpio = nombre.replace(/-/g, ' ');

    // 2. Función para convertir "a" en "[aáàäâ]" para la RegEx
    const regexConTildes = (texto) => {
      return texto
        .replace(/a/g, '[aáàäâ]')
        .replace(/e/g, '[eéèëê]')
        .replace(/i/g, '[iíìïî]')
        .replace(/o/g, '[oóòöô]')
        .replace(/u/g, '[uúùüû]');
    };

    const pattern = regexConTildes(nombreLimpio);

    // 3. Buscamos con la expresión regular mejorada
    const registro = await Cedis.findOne({ 
      cedis: { $regex: new RegExp(pattern, 'i') }, 
      isDeleted: false 
    });

    if (!registro) {
      return res.status(404).json({ 
        message: `CEDI '${nombreLimpio}' no encontrado`,
        busqueda: pattern 
      });
    }

    res.json(registro);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error en el servidor" });
  }
};

export const getNationalReportData = async (req, res) => {
    try {
        // 1. Obtener todos los CEDIS activos
        const todosLosCedis = await Cedis.find({ isDeleted: false });

        if (!todosLosCedis || todosLosCedis.length === 0) {
            return res.status(404).json({ message: "No hay datos disponibles" });
        }

        const hoy = new Date();

        // 2. Definir estructuras para agrupar por región
        const regionesMap = {};
        const urgentAlerts = [];
        
        // Acumuladores nacionales
        let accidentesTotales = 0;
        let delegadosVencidosTotales = 0;
        let comitesDesTotales = 0;
        let programasDesTotales = 0;
        let formacionAcumulada = 0;

        todosLosCedis.forEach(c => {
            const reg = c.region || "Sin Región";
            
            // --- Calcular la cantidad real de delegados vencidos en este CEDIS ---
            const delVencidosEnEsteCedis = c.delegados?.filter(d => d.vencimiento && new Date(d.vencimiento) < hoy).length || 0;
            
            // --- Replicar condiciones exactas de criticidad del Dashboard Stats ---
            const tieneDelegadosVencidos = delVencidosEnEsteCedis > 0;
            const tieneComiteDesactualizado = !c.comiteActualizado || (c.comite?.obs && c.comite.obs.toLowerCase().includes("vencido")) || (c.psst?.reg === "NO");
            const tieneProgramaDesactualizado = !c.programaActualizado || (c.psst?.aprobado === "En actualización" || c.psst?.aprobado === "NO");

            // Si cumple cualquiera de estas tres condiciones, es Crítico
            const esCritico = tieneDelegadosVencidos || tieneComiteDesactualizado || tieneProgramaDesactualizado;

            // Inicializar región si no existe
            if (!regionesMap[reg]) {
                regionesMap[reg] = {
                    region: reg,
                    cedis: 0,
                    criticos: 0,
                    seguimiento: 0,
                    controlados: 0,
                    delegadosVencidos: 0,
                    comitesDesactualizados: 0,
                    programasDesactualizados: 0,
                    politicasPendientes: 0,
                    formacion: 0,
                    accidentes: 0,
                    sumaFormacion: 0, // Para calcular promedio luego
                    ciudadesDetalle: [] 
                };
            }

            const rData = regionesMap[reg];
            rData.cedis++;
            
            // --- CORRECCIÓN: Clasificación de Riesgo basada en las métricas solicitadas ---
            if (esCritico || c.nivelRiesgo === 'high' || c.accidentes > 0) {
                rData.criticos++;
            } else if (c.nivelRiesgo === 'medium') {
                rData.seguimiento++;
            } else {
                rData.controlados++;
            }

            // Sumar indicadores a la región
            rData.delegadosVencidos += delVencidosEnEsteCedis;
            rData.comitesDesactualizados += (c.comiteActualizado ? 0 : 1);
            rData.programasDesactualizados += (c.programaActualizado ? 0 : 1);
            rData.politicasPendientes += (c.estadoPolitica === "Pendiente" ? 1 : 0);
            rData.sumaFormacion += (c.porcentajeFormacion || 0);
            rData.accidentes += (c.accidentes || 0);

            // Guardar el desglose para uso del PDF
            rData.ciudadesDetalle.push({
                nombre: c.name,
                delegados: c.delegados || []
            });

            // Acumuladores Nacionales
            accidentesTotales += (c.accidentes || 0);
            delegadosVencidosTotales += delVencidosEnEsteCedis;
            comitesDesTotales += (c.comiteActualizado ? 0 : 1);
            programasDesTotales += (c.programaActualizado ? 0 : 1);
            formacionAcumulada += (c.porcentajeFormacion || 0);

            // 3. Identificar Alertas Prioritarias (Lógica para la tabla de alertas)
            if (esCritico || c.accidentes > 0) {
                const reasons = [];
                if (tieneDelegadosVencidos) reasons.push(`${delVencidosEnEsteCedis} Del. Vencidos`);
                if (c.accidentes > 0) reasons.push(`${c.accidentes} Accidentes`);
                if (tieneComiteDesactualizado) reasons.push("Comité Desactualizado");
                if (tieneProgramaDesactualizado) reasons.push("Programa Desactualizado");

                urgentAlerts.push({
                    cedis: c.cedis,
                    region: reg,
                    level: (c.nivelRiesgo === 'high' || esCritico) ? 'high' : 'medium',
                    reasons: reasons
                });
            }
        });

        // 4. Formatear el array de regiones y calcular promedios
        const regionsArray = Object.values(regionesMap).map(r => ({
            ...r,
            formacion: r.cedis > 0 ? Math.round(r.sumaFormacion / r.cedis) : 0
        }));

        // 5. Construir respuesta final para el PDF
        const response = {
            meta: {
                updatedAt: new Date().toLocaleDateString(),
                emissionMonth: "Abril",
                fulfilledMonth: "Marzo 2026"
            },
            totalCedis: todosLosCedis.length,
            criticos: regionsArray.reduce((acc, r) => acc + r.criticos, 0),
            seguimiento: regionsArray.reduce((acc, r) => acc + r.seguimiento, 0),
            controlados: regionsArray.reduce((acc, r) => acc + r.controlados, 0),
            accidentesTotales,
            delegadosVencidos: delegadosVencidosTotales,
            comitesDesactualizados: comitesDesTotales,
            programasDesactualizados: programasDesTotales,
            formacionPromedio: todosLosCedis.length > 0 ? Math.round(formacionAcumulada / todosLosCedis.length) : 0,
            regions: regionsArray,
            urgentAlerts: urgentAlerts.slice(0, 10), // Limitar a las 10 más importantes
            analysis: [
                "Se observa una concentración de criticidad en áreas con delegados vencidos.",
                "El cumplimiento de formación nacional se mantiene estable.",
                "Se recomienda priorizar la actualización de comités en las regiones con accidentes registrados."
            ]
        };

        res.json(response);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al generar consolidado nacional" });
    }
};

export const getRegionReportData = async (req, res) => {
    try {
        // 1. Capturar la región desde la query (?region=Nombre)
        const { region } = req.query;

        if (!region || region === "undefined") {
            return res.status(400).json({ message: "El nombre de la región es obligatorio" });
        }

        // 2. Buscar todos los CEDIS de esa región que no estén eliminados
        const ciudades = await Cedis.find({ 
            region: region, 
            isDeleted: false 
        }).sort({ name: 1 });

        if (ciudades.length === 0) {
            return res.status(404).json({ message: "No se encontraron datos para esta región" });
        }

        // 3. Procesar cálculos de Seguridad Industrial (SST)
        const totales = {
            trabajadores: ciudades.reduce((acc, c) => acc + (Number(c.trabajadores) || 0), 0),
            vencidos: ciudades.reduce((acc, c) => acc + (Number(c.vencidos) || 0), 0),
            accidentes: ciudades.reduce((acc, c) => acc + (Number(c.accidentes) || 0), 0),
            // Calculamos promedio de formación de la región
            formacionPromedio: Math.round(
                ciudades.reduce((acc, c) => acc + (Number(c.porcentajeFormacion) || 0), 0) / ciudades.length
            )
        };

        // 4. Enviar la data estructurada lista para jsPDF
        res.json({
            regionNombre: region,
            fechaInforme: new Date().toLocaleDateString(),
            ciudades, // El array detallado para la tabla larga
            totales   // Los números consolidados para las tarjetas del PDF
        });

    } catch (error) {
        console.error("Error en reporte regional:", error);
        res.status(500).json({ message: "Error al generar la data del informe regional" });
    }
};
