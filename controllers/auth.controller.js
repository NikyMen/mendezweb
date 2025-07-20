// c:/Users/nikom/Dev/web/controllers/auth.controller.js
import { UserRepository } from "../user-repository.js";
import jwt from "jsonwebtoken";
import { SECRET_KEY } from "../config.js";

export const showLoginPage = (req, res) => {
    res.render("login", { title: "Iniciar sesión", user: res.locals.user, termino: "" });
};

export const showRegisterPage = (req, res) => {
    res.render("register", { user: res.locals.user, termino: "" });
};

export const loginUser = async (req, res) => {
    const { username, password } = req.body;
    const user = await UserRepository.login({ username, password });
    const token = jwt.sign({ id: user._id, username: user.username }, SECRET_KEY, { expiresIn: "2h" });
    res.cookie("user", token, { httpOnly: true });
    res.redirect("/");
};

export const registerUser = async (req, res) => {
    const { username, password } = req.body;
    const id = await UserRepository.create({ username, password });
    res.send({ id });
};

export const logoutUser = (req, res) => {
    res.clearCookie("user");
    res.redirect("/");
};