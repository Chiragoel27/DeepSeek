import mongoose, { Mongoose } from "mongoose";

interface MongooseCache {
    conn: Mongoose | null;
    promise: Promise<Mongoose> | null;
}

// Ensure the `cached` variable is globally available to prevent multiple connections
declare global {
    var mongooseCache: MongooseCache | undefined;
}

// Use existing global cache or initialize a new one
const cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

export default async function connectDB(): Promise<Mongoose | null> {
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        cached.promise = mongoose.connect(process.env.NEXT_PUBLIC_MONGODB_URI as string, {
            bufferCommands: false, // Optional for performance
        });
    }

    try {
        cached.conn = await cached.promise;
        global.mongooseCache = cached; // Store in global to prevent duplicate connections
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        cached.conn = null;
    }

    return cached.conn;
}
