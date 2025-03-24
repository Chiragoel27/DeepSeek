export const maxDuration = 60;
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/app/config/db";
import Chat from "@/app/models/Chat";
import { getAuth } from "@clerk/nextjs/server";
import OpenAI from "openai";

const openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY,
});

export async function POST(req: NextRequest) {
    try {
        const { userId } = getAuth(req);
        const { prompt, chatId } = await req.json();

        if (!userId) {
            return NextResponse.json({
                success: false,
                message: "User not authenticated"
            });
        }

        await connectDB();
        const data = await Chat.findOne({ userId, _id: chatId });
        if (!data) {
            return NextResponse.json({ success: false, message: "Chat not found" });
        }

        const userPrompt = {
            role: "user",
            content: prompt,
            timestamp: Date.now()
        };

        data.messages.push(userPrompt);

        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "deepseek-chat",
            store: true,
        });

        const message: any = completion.choices[0].message;
        message.timestamp = Date.now();
        data.messages.push(message);

        await data.save();
        return NextResponse.json({ success: true, data: message });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message });
    }
}
