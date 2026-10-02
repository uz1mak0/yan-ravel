import { NextResponse } from "next/server";

const cleanVal = (val: any) => {
    if (typeof val === "string") {
        let trimmed = val.trim();
        while (trimmed.startsWith("=")) {
            trimmed = trimmed.slice(1).trim();
        }
        return trimmed;
    }
    return val ? String(val) : "";
};

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { mode } = body;

        const n8nBaseUrl = (
            process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || "http://localhost:5678"
        ).replace(/\/$/, "");
        const useTestWebhook = process.env.NEXT_PUBLIC_N8N_USE_TEST_WEBHOOK === "true";
        const webhookPath = useTestWebhook ? "/webhook-test" : "/webhook";

        const endpoint =
            mode === "signup"
                ? `${n8nBaseUrl}${webhookPath}/auth/signup`
                : `${n8nBaseUrl}${webhookPath}/auth/signin`;

        const res = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-webhook-secret": process.env.NEXT_PUBLIC_N8N_WEBHOOK_SECRET || "",
            },
            body: JSON.stringify(body),
        });

        const resText = await res.text();
        let data;
        try {
            data = JSON.parse(resText);
        } catch {
            data = { message: resText };
        }

        if (!res.ok) {
            return NextResponse.json(
                { success: false, message: data.message || "Authentication failed" },
                { status: res.status }
            );
        }

        const rawUser = data.user || data.record || data;
        const cleanedUser = {
            name: cleanVal(rawUser.name || rawUser.full_name || rawUser.fullName),
            email: cleanVal(rawUser.email),
            phone: cleanVal(rawUser.phone || rawUser.phone_number || rawUser.mobile),
            country: cleanVal(rawUser.country || rawUser.location),
            profilePicture: cleanVal(rawUser.profilePicture || rawUser.avatar_url || rawUser.profile_picture),
            subscriptionTier: cleanVal(rawUser.subscriptionTier || rawUser.subscription_tier || "Basic"),
        };

        return NextResponse.json({
            success: true,
            user: cleanedUser,
        });
    } catch (error) {
        console.error("Auth API Route Error:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}