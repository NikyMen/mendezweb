// C:/Users/nikom/Dev/web/models/Order.js
import mongoose from "mongoose";

const OrderItemSchema = new mongoose.Schema({
  codigo: { type: String, required: true },
  nombre: { type: String, required: true },
  precio: { type: Number, required: true },
  cantidad: { type: Number, required: true },
  subtotal: { type: Number, required: true }
}, { _id: false }); // No necesitamos un _id para cada item del pedido

const OrderSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  telefono: { type: String, required: true },
  productos: [OrderItemSchema], // Array de OrderItemSchema
  total: { type: Number, required: true },
  fecha: { type: Date, default: Date.now }
});

const Order = mongoose.model("Order", OrderSchema);

export default Order;
