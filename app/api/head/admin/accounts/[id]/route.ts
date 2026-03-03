import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;
        const { id } = await params;
        const body = await req.json();

        const backendUrl =
            process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

        const backendRes = await fetch(`${backendUrl}/api/admin/accounts/${id}`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
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

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;
        const { id } = await params;

        const backendUrl =
            process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

        const backendRes = await fetch(`${backendUrl}/api/admin/accounts/${id}`, {
            method: "DELETE",
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
