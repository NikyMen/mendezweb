import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('ADVERTENCIA: La variable de entorno MONGODB_URI no está definida.');
  // En producción, no detenemos la aplicación para que Vercel pueda manejar el error
  if (process.env.NODE_ENV === 'development') {
    throw new Error('FATAL ERROR: La variable de entorno MONGODB_URI no está definida.');
  }
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    console.log('Intentando conectar a MongoDB...');
    
    // Si no hay URI de MongoDB en producción, devolvemos una conexión simulada
    if (!MONGODB_URI && process.env.NODE_ENV === 'production') {
      console.warn('Ejecutando en modo sin base de datos en producción');
      cached.conn = { isConnected: false };
      return cached.conn;
    }
    
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: true, // Cambiado a true para permitir operaciones en espera
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    }).then((mongoose) => {
      console.log('Conexión con MongoDB exitosa.');
      return mongoose;
    }).catch((err) => {
      console.error('Fallo la conexión a MongoDB:', err.message);
      
      // En producción, no detenemos la aplicación para que Vercel pueda manejar el error
      if (process.env.NODE_ENV === 'development') {
        throw err;
      } else {
        console.warn('Continuando sin conexión a la base de datos en producción');
        return { isConnected: false };
      }
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    console.error('Error al esperar la conexión a MongoDB:', error.message);
    
    // En producción, devolvemos una conexión simulada
    if (process.env.NODE_ENV !== 'development') {
      return { isConnected: false };
    }
    throw error;
  }
}