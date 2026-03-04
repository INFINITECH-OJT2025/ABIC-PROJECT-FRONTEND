import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const searchParams = url.search;

        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        const backendUrl = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

        const backendRes = await fetch(`${backendUrl}/api/accountant/transaction-receipts${searchParams}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
            },
            cache: 'no-store'
        });

        const data = await backendRes.json().catch(() => ({}));
        return NextResponse.json(data, { status: backendRes.status });
    } catch (err) {
        return NextResponse.json(
            { success: false, message: "Proxy error" },
            { status: 500 }
        );
    }
}
