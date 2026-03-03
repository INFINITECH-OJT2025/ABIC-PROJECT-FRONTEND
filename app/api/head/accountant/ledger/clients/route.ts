import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    const { searchParams } = new URL(req.url);
    const ownerId = searchParams.get("owner_id");
    const unitId = searchParams.get("unit_id");
    const sort = searchParams.get("sort");

    const backendUrl = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

    const url = new URL(`${backendUrl}/api/accountant/ledger/clients`);
    if (ownerId) {
      url.searchParams.append("owner_id", ownerId);
    }
    if (unitId) {
      url.searchParams.append("unit_id", unitId);
    }
    if (sort) {
      url.searchParams.append("sort", sort);
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
