import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        const backendUrl = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

        // Forward the query string (instrument_no=...) to the backend
        const { searchParams } = new URL(req.url);
        const instrumentNo = searchParams.get("instrument_no") ?? "";

        const backendRes = await fetch(
            `${backendUrl}/api/accountant/transactions/check-instrument-no?instrument_no=${encodeURIComponent(instrumentNo)}`,
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
