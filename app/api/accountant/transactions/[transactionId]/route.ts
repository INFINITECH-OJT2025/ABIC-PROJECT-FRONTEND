import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ transactionId: string }> }
) {
    try {
        const resolvedParams = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        const backendUrl = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

        const backendRes = await fetch(`${backendUrl}/api/accountant/transactions/${resolvedParams.transactionId}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
            },
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

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ transactionId: string }> }
) {
    try {
        const resolvedParams = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        const backendUrl = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";
        const contentType = req.headers.get("content-type") ?? "";

        // PHP doesn't natively parse multipart on PUT, so use POST + _method=PUT
        const isMultipart = contentType.includes("multipart/form-data");

        if (isMultipart) {
            // Clone the request body as FormData, append _method=PUT
            const formData = await req.formData();
            formData.append("_method", "PUT");

            const backendRes = await fetch(`${backendUrl}/api/accountant/transactions/${resolvedParams.transactionId}`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                    // Do NOT set Content-Type — fetch will auto-set it with the correct boundary
                },
                body: formData,
            });

            const data = await backendRes.json().catch(() => ({}));
            return NextResponse.json(data, { status: backendRes.status });
        } else {
            // JSON body — use regular PUT
            const body = await req.arrayBuffer();

            const backendRes = await fetch(`${backendUrl}/api/accountant/transactions/${resolvedParams.transactionId}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                    ...(contentType && { "Content-Type": contentType }),
                },
                body,
            });

            const data = await backendRes.json().catch(() => ({}));
            return NextResponse.json(data, { status: backendRes.status });
        }
    } catch (err) {
        return NextResponse.json(
            { success: false, message: "Proxy error" },
            { status: 500 }
        );
    }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ transactionId: string }> }
) {
    try {
        const resolvedParams = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        const backendUrl = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

        const contentType = req.headers.get("content-type") ?? "";
        const body = await req.arrayBuffer();

        const backendRes = await fetch(`${backendUrl}/api/accountant/transactions/${resolvedParams.transactionId}`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
                ...(contentType && { "Content-Type": contentType }),
            },
            body,
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
