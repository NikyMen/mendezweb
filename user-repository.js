// user-repository.js
import crypto from "crypto";     // genera UUID para los IDs
import bcrypt from "bcryptjs";   // encripta y compara contraseñas
import { SALT_ROUNDS } from "./config.js"; // Asegúrate que config.js esté correcto
import prisma from "./lib/db.js"; // Importa el cliente de Prisma

// Clase con métodos para manejar usuarios
export class UserRepository {
  static async create({ username, password }) {
    Validation.username(username);
    Validation.password(password);

    // Verifica si ya existe el usuario usando Prisma
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      throw new Error("Username already exists");
    }

    const id = crypto.randomUUID(); // id será un string
    const hashedPassword = bcrypt.hashSync(password, SALT_ROUNDS);

    // Crea y guarda el nuevo usuario usando Prisma
    const newUser = await prisma.user.create({
      data: {
        id,
        username,
        password: hashedPassword
      }
    });
    return newUser.id;
  }
  
  // Método para iniciar sesión
  // Verifica si el usuario y la contraseña son válidos
  static async login({ username, password }) {
    Validation.username(username);
    Validation.password(password);

    // Busca el usuario usando Prisma
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) throw new Error("username does not exist");

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new Error("password is invalid");

    // Devuelve un objeto sin la contraseña
    // Prisma ya devuelve objetos planos, no es necesario .toObject()
    const { password: _, ...publicUser } = user; 
    return publicUser;
  }
}

// Clase de validaciones reutilizable
class Validation {
  static username(username) {
    if (typeof username !== 'string') {
      throw new Error('username must be a string');
    }
    if (username.length < 3) {
      throw new Error('username must be at least 3 characters long');
    }
  }

  static password(password) {
    if (typeof password !== 'string') {
      throw new Error('password must be a string');
    }
    if (password.length < 6) {
      throw new Error('password must be at least 6 characters long');
    }
  }
}