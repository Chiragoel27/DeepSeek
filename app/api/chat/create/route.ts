import connectDB from "@/app/config/db";
import Chat from "@/app/models/Chat";
import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { userId } = getAuth(req);

        if (!userId) {
            return NextResponse.json({
                success: false,
                message: "User not authenticated"
            });
        }

        const chatData = {
            userId,
            message: [],
            name: "New Chat",
        }

        await connectDB();
        await Chat.create(chatData);

        return NextResponse.json({ success: true, message: "Chat created" });
    } catch (error: unknown) {
        if (error instanceof Error) {
            return NextResponse.json({ success: false, error: error.message });
        }
        return NextResponse.json({ success: false, error: "Unknown error" });
    }
}