/* eslint-disable no-var */
import mongoose, { Mongoose } from "mongoose";

interface MongooseCache {
    conn: Mongoose | null;
    promise: Promise<Mongoose> | null;
}

// Ensure `mongooseCache` is globally available
declare global {
    var mongooseCache: MongooseCache | undefined;
}

/* eslint-enable no-var */

// Use an existing cache or initialize a new one
const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };

export default async function connectDB(): Promise<Mongoose | null> {
    if (cached.conn) return cached.conn; // Return existing connection

    if (!cached.promise) {
        cached.promise = mongoose.connect(process.env.NEXT_PUBLIC_MONGODB_URI as string, {
            bufferCommands: true, // ✅ Allows queuing commands until connected
            serverSelectionTimeoutMS: 5000, // ✅ Prevents long connection delays
        }).then((mongoose) => {
            console.log("✅ Connected to MongoDB:", mongoose.connection?.db?.databaseName || "Unknown DB");
            return mongoose;
        }).catch((err) => {
            console.error("❌ MongoDB Connection Error:", err);
            cached.promise = null; // Prevents retrying a failed promise
            throw err; // Ensures failure is properly handled
        });
    }

    try {
        cached.conn = await cached.promise;
        global.mongooseCache = cached;
    } catch (error) {
        console.error("❌ MongoDB Connection Failed:", error);
        cached.conn = null;
    }

    return cached.conn;
}
