import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    const backendUrl = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

    // Forward FormData (with files) to backend - preserve raw body and Content-Type for multipart
    const contentType = req.headers.get("content-type") ?? "";
    const body = await req.arrayBuffer();

    const backendRes = await fetch(`${backendUrl}/api/accountant/transactions/deposit`, {
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
