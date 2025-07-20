export const SALT_ROUNDS = process.env.SALT_ROUNDS ? parseInt(process.env.SALT_ROUNDS, 10) : 10;
export const SECRET_KEY = process.env.SECRET_KEY;

if (!SECRET_KEY) {
  console.error("FATAL ERROR: SECRET_KEY is not defined in environment variables.");
  // En un entorno de producción, es una buena práctica detener la aplicación si falta la clave.
  // process.exit(1);
}
