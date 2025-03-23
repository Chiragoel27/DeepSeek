import { Webhook } from "svix";
import User from "@/app/models/User";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { connectDB } from "@/app/config/db";

// Define the structure of the webhook data
interface EmailAddress {
    email_address: string;
}

interface WebhookPayload {
    id: string;
    email_addresses: EmailAddress[];
    first_name: string;
    last_name: string;
    image_url: string;
}

interface VerifiedWebhook {
    data: WebhookPayload;
    type: string;
}

export async function POST(req: Request): Promise<NextResponse> {
    try {
        // Ensure SIGNING_SECRET is defined
        if (!process.env.NEXT_PUBLIC_SIGNING_SCERET) {
            throw new Error("SIGNING_SECRET is not defined.");
        }

        const wh = new Webhook(process.env.NEXT_PUBLIC_SIGNING_SCERET);
        
        // ✅ Await headers() before calling .get()
        const headerPayload = await headers(); 

        // Convert headers into a valid string record
        const svixHeaders: Record<string, string> = {
            "svix-id": headerPayload.get("svix-id") || "",
            "svix-timestamp": headerPayload.get("svix-timestamp") || "",
            "svix-signature": headerPayload.get("svix-signature") || "",
        };

        if (!svixHeaders["svix-id"] || !svixHeaders["svix-signature"] || !svixHeaders["svix-timestamp"]) {
            return NextResponse.json({ error: "Missing Svix headers" }, { status: 400 });
        }

        // Get and verify payload
        const payload: WebhookPayload = await req.json();
        const body = JSON.stringify(payload);
        const { data, type } = wh.verify(body, svixHeaders) as VerifiedWebhook;

        if (!data) {
            return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
        }

        // Prepare the user data
        const userData = {
            _id: data.id,
            email: data.email_addresses?.[0]?.email_address || "",
            name: `${data.first_name} ${data.last_name}`.trim(),
            image: data.image_url,
        };

        await connectDB();

        switch (type) {
            case "user.created":
                await User.create(userData);
                break;
            case "user.updated":
                await User.findByIdAndUpdate(data.id, userData);
                break;
            case "user.deleted":
                await User.findByIdAndDelete(data.id);
                break;
            default:
                console.warn(`Unhandled event type: ${type}`);
                break;
        }

        return NextResponse.json({ message: "Event received" }, { status: 200 });
    } catch (error) {
        console.error("Error handling webhook:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
