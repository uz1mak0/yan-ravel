import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { mode, ...payload } = body;

        const n8nBaseUrl = (
            process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'http://localhost:5678'
        ).replace(/\/$/, '');

        const useTestWebhook =
            process.env.NEXT_PUBLIC_N8N_USE_TEST_WEBHOOK === 'true';

        const prefix = useTestWebhook ? '/webhook-test' : '/webhook';
        const path = mode === 'signup' ? 'auth/signup' : 'auth/signin';
        const targetUrl = `${n8nBaseUrl}${prefix}/${path}`;

        console.log(`[auth] → ${targetUrl} (mode=${mode}, test=${useTestWebhook})`);

        const n8nResponse = await fetch(targetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const data = await n8nResponse.json().catch(() => ({}));

        if (!n8nResponse.ok) {
            return NextResponse.json(
                {
                    success: false,
                    message: data.message || data.hint || 'Webhook execution failed',
                },
                { status: n8nResponse.status }
            );
        }

        return NextResponse.json({ success: true, ...data }, { status: 200 });
    } catch (error: any) {
        console.error('Auth proxy error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Proxy server error' },
            { status: 500 }
        );
    }
}