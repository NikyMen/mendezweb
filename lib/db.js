import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('FATAL ERROR: La variable de entorno MONGODB_URI no está definida.');
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
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    }).then((mongoose) => {
      console.log('Conexión con MongoDB exitosa.');
      return mongoose;
    }).catch((err) => {
      console.error('Fallo la conexión a MongoDB:', err.message);
      throw err;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}