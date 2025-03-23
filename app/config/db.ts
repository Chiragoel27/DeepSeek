// database.ts
import mongoose from "mongoose";


const MONGODB_URI = process.env.NEXT_PUBLIC_MONGODB_URI;

let isConnected: boolean = false; // Track connection status

if (!MONGODB_URI) throw new Error("MONGODB_URI is missing");

export const connectDB = async (): Promise<void> => {
	if (isConnected) return;

	try {
		await mongoose.connect(MONGODB_URI || "", {
			dbName: "flash",
			bufferCommands: false,
			connectTimeoutMS: 10000,
			socketTimeoutMS: 60000,
			minPoolSize: 5,
		});
		isConnected = true;
		console.log("Database connected successfully");
	} catch (error) {
		console.error("Database connection error:", error);
		throw new Error("Failed to connect to the database");
	}
};
