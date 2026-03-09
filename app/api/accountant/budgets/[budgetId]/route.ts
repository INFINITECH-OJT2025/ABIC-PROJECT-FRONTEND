import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ budgetId: string }> }
) {
    try {
        const { budgetId } = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;
        const body = await req.json();
        const pageUrl = req.headers.get("X-Page-URL") || req.headers.get("Referer") || "";

        const backendUrl = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

        const backendRes = await fetch(
            `${backendUrl}/api/accountant/budgets/${budgetId}`,
            {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    ...(pageUrl && { "X-Page-URL": pageUrl }),
                },
                body: JSON.stringify(body),
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
