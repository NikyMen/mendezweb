
import dotenv from 'dotenv';
import { connect } from './lib/db.js';

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

async function main() {
  // 1. Conectar a la base de datos PRIMERO
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
