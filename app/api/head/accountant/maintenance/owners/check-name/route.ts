import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name");
    const excludeId = searchParams.get("exclude_id");

    if (!name) {
      return NextResponse.json(
        { success: false, message: "Name parameter is required" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    const backendUrl =
      process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

    const url = new URL(`${backendUrl}/api/accountant/maintenance/owners/check-name`);
    url.searchParams.append("name", name);
    if (excludeId) {
      url.searchParams.append("exclude_id", excludeId);
    }

    const backendRes = await fetch(url.toString(), {
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
