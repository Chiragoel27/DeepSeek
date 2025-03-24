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

        const {chatId, name} = await req.json();

        await connectDB();
        await Chat.findOneAndUpdate({_id: chatId, userId}, {name});

        return NextResponse.json({ success: true, message: "Chat Renamed" });
    } catch (error: unknown) {
        if (error instanceof Error) {
            return NextResponse.json({ success: false, error: error.message });
        }
        return NextResponse.json({ success: false, error: "Unknown error" });    }
}