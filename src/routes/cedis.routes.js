import { Router } from "express";
import { validateUserRole, validateUserRoles, authRequired } from "../middlewares/validateToken.js";
import { getCedisAll,
    createCedis,
    getCedisById,
    updateCedis,
    deleteCedis,
    getCedisByRegion,
    getDelegadosVencidos,
    getDelegadosProximos,
    getCedisBrechas,
    getDashboardStats,
    getComitesAlertas,
    getCedisByName,
    getNationalReportData,
    getRegionReportData} from "../controllers/cedis.controller.js";   

const router = Router()

router.get('/cedis', authRequired, getCedisAll)

router.get('/cedi/:id', authRequired, getCedisById)

router.post('/cedis', authRequired, createCedis)

router.delete('/cedi/:id', validateUserRole, deleteCedis)

router.put('/cedi/:id',  updateCedis)

router.get('/cedis/region/:region', authRequired, getCedisByRegion)

router.get("/delegados/vencidos", authRequired, getDelegadosVencidos);

router.get('/delegados/proximos', authRequired, getDelegadosProximos)

router.get('/cedis/brechas', authRequired, getCedisBrechas);

router.get('/cedis/stats', authRequired, getDashboardStats);

router.get('/cedis/comites-alertas', authRequired, getComitesAlertas);

router.get('/cedis/:nombre',authRequired, getCedisByName);

router.get("/reporte-nacional", authRequired, getNationalReportData);

router.get('/reporte-regional', authRequired, getRegionReportData);


export default router