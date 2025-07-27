export const SALT_ROUNDS = process.env.SALT_ROUNDS ? parseInt(process.env.SALT_ROUNDS, 10) : 10;

// Si no hay SECRET_KEY en el entorno, usamos una clave por defecto para desarrollo
// NOTA: Esto NO es seguro para producción, pero permite que la aplicación funcione en Vercel
// hasta que se configure correctamente la variable de entorno
export const SECRET_KEY = process.env.SECRET_KEY || 'clave_temporal_no_segura_para_desarrollo';

if (!process.env.SECRET_KEY) {
  console.warn("ADVERTENCIA: SECRET_KEY no está definida en las variables de entorno.");
  console.warn("Se está utilizando una clave temporal que NO es segura para producción.");
  console.warn("Por favor, configura la variable SECRET_KEY en el panel de Vercel.");
}
