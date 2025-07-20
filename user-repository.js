// user-repository.js
import mongoose from "mongoose"; // Importa Mongoose
import crypto from "crypto";     // genera UUID para los IDs
import bcrypt from "bcryptjs";   // encripta y compara contraseñas
import { SALT_ROUNDS } from "./config.js"; // Asegúrate que config.js esté correcto
import connectToDatabase from "./lib/db.js";

// Define el esquema de usuario con Mongoose
const UserSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  username: { type: String, required: true, unique: true }, // Asegura que el username sea único
  password: { type: String, required: true }
});

// Crea el modelo User a partir del esquema
const User = mongoose.model("User", UserSchema);

// Clase con métodos para manejar usuarios
export class UserRepository {
  // No es necesario conectar en cada método si el modelo ya está asociado a una conexión
  // Mongoose gestiona esto internamente una vez que la conexión se establece.
  static async create({ username, password }) {
    Validation.username(username);
    Validation.password(password);

    // Verifica si ya existe el usuario usando Mongoose
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      throw new Error("Username already exists");
    }

    const id = crypto.randomUUID(); // _id será un string
    const hashedPassword = bcrypt.hashSync(password, SALT_ROUNDS);

    // Crea y guarda el nuevo usuario usando Mongoose
    const newUser = new User({
      _id: id,
      username,
      password: hashedPassword
    });
    await newUser.save(); // Guarda el documento en MongoDB
    return id;
  }
  
  // Método para iniciar sesión
  // Verifica si el usuario y la contraseña son válidos
  static async login({ username, password }) {
    Validation.username(username);
    Validation.password(password);

    // Busca el usuario usando Mongoose
    const user = await User.findOne({ username });
    if (!user) throw new Error("username does not exist");

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new Error("password is invalid");

    // Devuelve un objeto sin la contraseña
    const { password: _, ...publicUser } = user.toObject(); // .toObject() para obtener un objeto JS plano
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