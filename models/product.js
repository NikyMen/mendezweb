// models/Product.js
import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  codigo: { type: String, required: true, unique: true },
  nombre: { type: String, required: true },
  precio: { type: Number, required: true },
  descripcion: { type: String },
  imagen: { type: String }
});

// Función para crear el modelo con manejo de errores
let Product;

try {
  // Reutiliza el modelo si ya fue definido
  Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
} catch (error) {
  console.error('Error al crear el modelo Product:', error.message);
  
  // Crear un modelo simulado para entornos sin conexión a MongoDB
  if (process.env.NODE_ENV === 'production') {
    console.warn('Creando modelo Product simulado para producción');
    
    // Clase simulada que devuelve arrays vacíos o null para las operaciones comunes
    class MockProduct {
      static async find() { return []; }
      static async findOne() { return null; }
      static async findById() { return null; }
      static async countDocuments() { return 0; }
    }
    
    Product = MockProduct;
  } else {
    throw error; // En desarrollo, propagamos el error
  }
}

export default Product;