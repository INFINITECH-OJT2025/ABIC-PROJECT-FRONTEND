import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        const backendUrl = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

        const backendRes = await fetch(
            `${backendUrl}/api/accountant/transaction-receipts/${resolvedParams.id}/file`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        if (!backendRes.ok) {
            return new NextResponse("File not found", { status: backendRes.status });
        }

        const buffer = await backendRes.arrayBuffer();
        const contentType = backendRes.headers.get("Content-Type") || "application/octet-stream";

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                "Content-Type": contentType,
            },
        });
    } catch (err) {
        return new NextResponse("Proxy error", { status: 500 });
    }
}
