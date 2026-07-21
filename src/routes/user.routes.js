import { Router } from 'express';
import { getUsers, getUserById, updateUser } from '../controllers/user.controller.js';
import { authRequired, validateUserRoles, validateUserRole } from '../middlewares/validateToken.js'; // Tu middleware de sesión

const router = Router();

// Protegida: Solo usuarios autenticados pueden pedir la lista
router.get('/users', validateUserRoles, getUsers);

router.get('/user/:id', validateUserRole, getUserById);

router.put('/user/:id', validateUserRole, updateUser)

export default router;