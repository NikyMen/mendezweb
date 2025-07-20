// c:/Users/nikom/Dev/web/routes/auth.routes.js
import { Router } from "express";
import { showLoginPage, showRegisterPage, loginUser, registerUser, logoutUser } from "../controllers/auth.controller.js";

const router = Router();

router.get("/login", showLoginPage);
router.get("/register", showRegisterPage);
router.post("/login", loginUser);
router.post("/register", registerUser);
router.post("/logout", logoutUser);

export default router;