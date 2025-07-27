// user-repository.js
import DBLocal from "db-local"  // guarda los datos en archivos locales
import crypto from "crypto"     // genera UUID para los IDs
import bcrypt from "bcryptjs"   // encripta y compara contraseñas
import {SALT_ROUNDS, isProduction} from "./config.js"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

// Configuración para obtener __dirname en ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Inicializa la DB con ruta absoluta para compatibilidad con Vercel
const dbPath = path.join(__dirname, "db")

// Asegurarse de que el directorio de la base de datos exista
if (!fs.existsSync(dbPath) && !isProduction) {
  fs.mkdirSync(dbPath, { recursive: true })
}

// Inicializa la DB
const { Schema } = new DBLocal({ path: dbPath })

// Define el modelo User
const User = Schema("User", {
  _id: { type: String, required: true },
  username: { type: String, required: true },
  password: { type: String, required: true }
})

// Clase con métodos para manejar usuarios
export class UserRepository {
  static async create({ username, password }) {
    Validation.username(username)
    Validation.password(password)

    // Verifica si ya existe el usuario
    if (User.findOne({ username })) {
      throw new Error("Username already exists")
    }

    const id = crypto.randomUUID()
    const hashedPassword = bcrypt.hashSync(password, SALT_ROUNDS)

    // Crea y guarda el nuevo usuario
    User.create({
      _id: id,
      username,
      password: hashedPassword
    }).save()

    return id
    
    
  }
  
  // Método para iniciar sesión
  // Verifica si el usuario y la contraseña son válidos
  static async login({ username, password }) {
    
    Validation.username(username)
    Validation.password(password)

    const user = User.findOne({ username })
    if (!user) throw new Error("username does not exist")

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) throw new Error("password is invalid")

    const { password: _, ...publicUser } = user

    return publicUser
  }
}

// Clase de validaciones reutilizable
class Validation {
  static username(username) {
    if (typeof username !== 'string') {
      throw new Error('username must be a string')
    }
    if (username.length < 3) {
      throw new Error('username must be at least 3 characters long')
    }
  }

  static password(password) {
    if (typeof password !== 'string') {
      throw new Error('password must be a string')
    }
    if (password.length < 6) {
      throw new Error('password must be at least 6 characters long')
    }
  }
}
