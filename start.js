
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

async function main() {
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
}

// Ejecutar la función principal
main();
