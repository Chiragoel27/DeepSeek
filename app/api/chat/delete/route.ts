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

        const { chatId } = await req.json();

        await connectDB();
        await Chat.deleteOne({ _id: chatId, userId });

        return NextResponse.json({ success: true, message: "Chat Deleted" });
    } catch (error: unknown) {
        if (error instanceof Error) {
            return NextResponse.json({ success: false, error: error.message });
        }
        return NextResponse.json({ success: false, error: "Unknown error" });
    }
}