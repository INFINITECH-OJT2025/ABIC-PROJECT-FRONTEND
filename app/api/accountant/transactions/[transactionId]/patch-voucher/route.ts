import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Proxy for PATCH /api/accountant/transactions/{id}/patch-voucher
 * The frontend sends POST with FormData (multipart) + X-HTTP-Method-Override: PATCH
 * because multipart/form-data doesn't play well with PATCH in some environments.
 * We forward as PATCH to the Laravel backend (which handles method override).
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

        // Forward the FormData body as-is
        const formData = await req.formData();

        // Build a new FormData to forward
        const forwardForm = new FormData();
        for (const [key, value] of formData.entries()) {
            forwardForm.append(key, value);
        }

        const backendRes = await fetch(
            `${backendUrl}/api/accountant/transactions/${resolvedParams.transactionId}/patch-voucher`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                    "X-HTTP-Method-Override": "PATCH",
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
