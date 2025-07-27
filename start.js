
import dotenv from 'dotenv';

// Cargar variables de entorno
// Primero intentamos cargar .env.local (desarrollo), luego .env (producción)
try {
  const result = dotenv.config({ path: '.env.local' });
  if (result.error) {
    console.log('No se encontró .env.local, intentando con .env');
    dotenv.config(); // Carga .env si existe
  }
} catch (error) {
  console.warn('Error al cargar variables de entorno:', error.message);
}

async function main() {
  try {
    // 1. Conectar a la base de datos PRIMERO
    // Se importa dinámicamente DESPUÉS de cargar las variables de entorno
    const { connect } = await import('./lib/db.js');
    await connect();

    // 2. Si la conexión es exitosa, importar e iniciar el servidor Express
    console.log('Iniciando el servidor Express...');
    const { default: app } = await import('./index.js');
    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error al iniciar la aplicación:', error.message);
    // En producción, es mejor no detener la aplicación para que Vercel pueda manejar el error
    if (process.env.NODE_ENV === 'development') {
      process.exit(1);
    }
  }
}

// Ejecutar la función principal
main();
