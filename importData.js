// C:/Users/nikom/Dev/web/importData.js
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" }); // Carga las variables desde .env.local

import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import connectToDatabase from "./lib/db.js";
import Product from "./models/Product.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const importData = async () => {
  try {
    await connectToDatabase();
    console.log("Conectado a MongoDB Atlas para importación.");

    try {
      // Eliminar datos existentes para evitar duplicados en cada ejecución
      await Product.deleteMany({});
      console.log("Datos de productos existentes eliminados.");

      // Importar productos
      const productosPath = path.join(__dirname, "data", "productos.json");
      const productosData = JSON.parse(fs.readFileSync(productosPath, "utf-8"));
      await Product.insertMany(productosData);
      console.log(`Se importaron ${productosData.length} productos.`);

      // Importar ofertas (usando el mismo modelo Product ya que tienen la misma estructura)
      const ofertasPath = path.join(__dirname, "data", "ofertas.json");
      const ofertasData = JSON.parse(fs.readFileSync(ofertasPath, "utf-8"));
      // Puedes decidir si quieres que las ofertas sean una colección separada o parte de los productos
      // Por simplicidad, las importaremos a la misma colección 'products' por ahora.
      // Si necesitas diferenciarlas, podrías añadir un campo 'isOffer: Boolean' al esquema.
      await Product.insertMany(ofertasData);
      console.log(`Se importaron ${ofertasData.length} ofertas.`);

      console.log("Importación de datos completada.");
    } catch (error) {
      console.error("Error durante la importación de datos:", error);
    } finally {
      // En un script que se ejecuta una sola vez como este, no es necesario desconectar manualmente.
      // El proceso de Node.js se cerrará y la conexión se terminará de forma natural.
      // De hecho, llamar a `mongoose.disconnect()` aquí es problemático porque cierra la conexión
      // global en caché que tu aplicación principal (index.js) intenta reutilizar, causando errores.
      console.log("Importación finalizada. La conexión se cerrará al terminar el proceso.");
    }
  } catch (err) {
    console.error("Error al conectar a MongoDB Atlas para importación:", err);
    process.exit(1);
  }
};

importData();
