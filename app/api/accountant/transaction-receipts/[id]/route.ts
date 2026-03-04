import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        const backendUrl = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

        const backendRes = await fetch(
            `${backendUrl}/api/accountant/transaction-receipts/${resolvedParams.id}`,
            {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            }
        );

        const data = await backendRes.json().catch(() => ({}));
        return NextResponse.json(data, { status: backendRes.status });
    } catch (err) {
        return NextResponse.json(
            { success: false, message: "Proxy error" },
            { status: 500 }
        );
    }
}
