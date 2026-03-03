import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    const { searchParams } = new URL(req.url);
    const bankId = searchParams.get("bank_id");

    const backendUrl =
      process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

    const url = bankId
      ? `${backendUrl}/api/accountant/maintenance/bank-contacts?bank_id=${bankId}`
      : `${backendUrl}/api/accountant/maintenance/bank-contacts`;

    const backendRes = await fetch(url, {
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

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    const body = await req.json();

    const backendUrl =
      process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

    const backendRes = await fetch(
      `${backendUrl}/api/accountant/maintenance/bank-contacts`,
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
      { success: false, message: "Proxy error" },
      { status: 500 }
    );
  }
}
