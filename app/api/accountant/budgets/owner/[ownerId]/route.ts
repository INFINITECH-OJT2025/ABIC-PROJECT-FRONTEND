import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
    req: Request,
    context: { params: Promise<{ ownerId: string }> }
) {
    try {
        const { ownerId } = await context.params;

        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        const backendUrl = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

        const backendRes = await fetch(
            `${backendUrl}/api/accountant/budgets/owner/${ownerId}`,
            {
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
            { success: false, message: "Proxy GET error" },
            { status: 500 }
        );
    }
}

export async function POST(
    req: Request,
    context: { params: Promise<{ ownerId: string }> }
) {
    try {
        const { ownerId } = await context.params;

        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;
        const body = await req.json();

        const backendUrl = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

        const backendRes = await fetch(
            `${backendUrl}/api/accountant/budgets/owner/${ownerId}`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            }
        );

        const data = await backendRes.json().catch(() => ({}));

        return NextResponse.json(data, { status: backendRes.status });
    } catch (err) {
        return NextResponse.json(
            { success: false, message: "Proxy POST error" },
            { status: 500 }
        );
    }
}
