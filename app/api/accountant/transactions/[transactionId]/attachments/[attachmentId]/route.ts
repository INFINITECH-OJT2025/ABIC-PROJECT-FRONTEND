import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ transactionId: string; attachmentId: string }> }
) {
    try {
        const resolvedParams = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        const backendUrl = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";
        const url = `${backendUrl}/api/accountant/transactions/${resolvedParams.transactionId}/attachments/${resolvedParams.attachmentId}`;

        const backendRes = await fetch(url, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!backendRes.ok) {
            return new NextResponse("File not found", { status: backendRes.status });
        }

        const buffer = await backendRes.arrayBuffer();
        const contentType = backendRes.headers.get("Content-Type") || "application/octet-stream";
        const contentDisposition = backendRes.headers.get("Content-Disposition");

        const responseHeaders = new Headers({
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=3600",
        });

        if (contentDisposition) {
            responseHeaders.set("Content-Disposition", contentDisposition);
        }

        return new NextResponse(buffer, {
            status: 200,
            headers: responseHeaders,
        });
    } catch (err) {
        console.error("Proxy error fetching attachment:", err);
        return new NextResponse("Proxy error", { status: 500 });
    }
}
