import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Enable dynamic route params
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    const backendUrl = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

    const { searchParams } = new URL(req.url);
    const queryString = searchParams.toString();
    const url = `${backendUrl}/api/accountant/vouchers${queryString ? `?${queryString}` : ""}`;

    const backendRes = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendRes.status });
  } catch {
    return NextResponse.json(
      { success: false, message: "Proxy error" },
      { status: 500 }
    );
  }
}

// Handle PUT requests for individual vouchers
export async function PUT(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    const backendUrl = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

    // Extract ID from URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const id = pathParts[pathParts.length - 1];

    if (!id || id === "vouchers") {
      return NextResponse.json(
        { success: false, message: "Voucher ID is required" },
        { status: 400 }
      );
    }

    const body = await req.json();

    const backendRes = await fetch(`${backendUrl}/api/accountant/vouchers/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendRes.status });
  } catch {
    return NextResponse.json(
      { success: false, message: "Proxy error" },
      { status: 500 }
    );
  }
}
