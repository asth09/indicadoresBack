import { Router } from "express";
import { login, register, logout, verifyToken } from '../controllers/auth.controller.js';
import { validateUserRole, validateUserRoles, authRequired } from "../middlewares/validateToken.js";

const router = Router();

router.post("/register", register);

router.post("/login", login);

router.post("/logout", logout);

router.get("/verify", verifyToken);

export default router;