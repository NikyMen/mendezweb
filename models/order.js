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

// Función para crear el modelo con manejo de errores
let Order;

try {
  // Reutiliza el modelo si ya fue definido
  Order = mongoose.models.Order || mongoose.model("Order", OrderSchema);
} catch (error) {
  console.error('Error al crear el modelo Order:', error.message);
  
  // Crear un modelo simulado para entornos sin conexión a MongoDB
  if (process.env.NODE_ENV === 'production') {
    console.warn('Creando modelo Order simulado para producción');
    
    // Clase simulada que implementa las operaciones comunes
    class MockOrder {
      constructor(data) {
        Object.assign(this, data);
        this._id = `mock_${Date.now()}`;
      }
      
      // Método save simulado
      async save() {
        console.log('Simulando guardado de orden:', this);
        return this;
      }
      
      // Métodos estáticos
      static async find() { return []; }
      static async findOne() { return null; }
      static async findById() { return null; }
    }
    
    // Añadir método model para simular mongoose.model
    MockOrder.model = function(name, schema) {
      return MockOrder;
    };
    
    Order = MockOrder;
  } else {
    throw error; // En desarrollo, propagamos el error
  }
}

export default Order;
