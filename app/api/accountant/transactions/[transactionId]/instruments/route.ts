import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Proxy for POST /api/accountant/transactions/{id}/instruments
 * Forwards FormData (cheque file upload) to the Laravel backend.
 */
export async function POST(
    req: Request,
    { params }: { params: Promise<{ transactionId: string }> }
) {
    try {
        const resolvedParams = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        const backendUrl = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";
        const formData = await req.formData();

        const forwardForm = new FormData();
        for (const [key, value] of formData.entries()) {
            forwardForm.append(key, value);
        }

        const backendRes = await fetch(
            `${backendUrl}/api/accountant/transactions/${resolvedParams.transactionId}/instruments`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
                body: forwardForm,
            }
        );

        const data = await backendRes.json().catch(() => ({}));
        return NextResponse.json(data, { status: backendRes.status });
    } catch (e: any) {
        return NextResponse.json(
            { success: false, message: "Proxy error: " + (e?.message ?? "Unknown") },
            { status: 500 }
        );
    }
}

export async function GET(
    req: Request,
    { params }: { params: Promise<{ transactionId: string }> }
) {
    try {
        const resolvedParams = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        const backendUrl = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

        const backendRes = await fetch(
            `${backendUrl}/api/accountant/transactions/${resolvedParams.transactionId}/instruments`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            }
        );

        const data = await backendRes.json().catch(() => ({}));
        return NextResponse.json(data, { status: backendRes.status });
    } catch {
        return NextResponse.json(
            { success: false, message: "Proxy error" },
            { status: 500 }
        );
    }
}
