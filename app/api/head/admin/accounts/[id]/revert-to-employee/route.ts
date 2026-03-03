import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;
        const { id } = await params;

        const backendUrl =
            process.env.BACKEND_URL ?? "http://127.0.0.1:8000";
        const pageUrl = req.headers.get('X-Page-URL') || req.headers.get('Referer') || '';
        const headers: Record<string, string> = {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
        };
        if (pageUrl) {
            headers['X-Page-URL'] = pageUrl;
        }

        const backendRes = await fetch(`${backendUrl}/api/admin/accounts/${id}/revert-to-employee`, {
            method: "POST",
            headers,
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
