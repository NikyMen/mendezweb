// models/Product.js
import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  codigo: { type: String, required: true, unique: true },
  nombre: { type: String, required: true },
  precio: { type: Number, required: true },
  descripcion: { type: String },
  imagen: { type: String }
});

// Reutiliza el modelo si ya fue definido
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

export default Product;