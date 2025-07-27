// Configuración para entornos de desarrollo y producción
export const {
    PORT = 3000,
    SALT_ROUNDS = 10,
    NODE_ENV = 'development'
} = process.env

// Vercel utiliza el puerto que asigna automáticamente en producción
export const isProduction = NODE_ENV === 'production'

