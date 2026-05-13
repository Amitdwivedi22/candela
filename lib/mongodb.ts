/**
 * Example .env.local:
 * MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.example.mongodb.net/candela?retryWrites=true&w=majority
 */

import mongoose from 'mongoose';

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose; // eslint-disable-line @typescript-eslint/no-explicit-any

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null }; // eslint-disable-line @typescript-eslint/no-explicit-any
}

async function connectToDatabase() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(mongoUri, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectToDatabase;
