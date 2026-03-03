import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Handle PUT requests for updating a specific voucher by ID
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const { path } = await params;
    const id = path[0];

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Voucher ID is required" },
        { status: 400 }
      );
    }

    const backendUrl = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";
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

// Handle POST requests for canceling a specific voucher by ID
export async function POST(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const { path } = await params;
    const id = path[0];
    const action = path[1]; // e.g., "cancel", "approve"

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Voucher ID is required" },
        { status: 400 }
      );
    }

    const backendUrl = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

    // Build the backend URL based on the action
    let backendEndpoint: string;
    if (action === "cancel") {
      backendEndpoint = `${backendUrl}/api/accountant/vouchers/${id}/cancel`;
    } else if (action === "approve") {
      backendEndpoint = `${backendUrl}/api/accountant/vouchers/${id}/approve`;
    } else {
      return NextResponse.json(
        { success: false, message: "Invalid action" },
        { status: 400 }
      );
    }

    const backendRes = await fetch(backendEndpoint, {
      method: "POST",
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
