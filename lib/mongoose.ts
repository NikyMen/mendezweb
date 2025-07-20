// lib/mongoose.ts
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) throw new Error('Define MONGODB_URI');

declare global {
  var mongooseConn: Promise<typeof mongoose> | undefined;
}

let cached = global.mongooseConn;

async function dbConnect() {
  if (cached) return cached;

  cached = global.mongooseConn = mongoose
    .connect(MONGODB_URI, {
      bufferCommands: false, // <- Desactiva el buffering
      maxPoolSize: 1,        // <- Funciones serverless
      serverSelectionTimeoutMS: 5000,
    })
    .then((mongoose) => mongoose);

  await cached;
  return cached;
}

export default dbConnect;