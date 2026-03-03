import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const page = searchParams.get("page");
    const perPage = searchParams.get("per_page");
    const sortBy = searchParams.get("sort_by");
    const sortOrder = searchParams.get("sort_order");

    const backendUrl =
      process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

    const url = new URL(`${backendUrl}/api/accountant/maintenance/banks`);
    if (search) {
      url.searchParams.append("search", search);
    }
    if (status) {
      url.searchParams.append("status", status);
    }
    if (page) {
      url.searchParams.append("page", page);
    }
    if (perPage) {
      url.searchParams.append("per_page", perPage);
    }
    if (sortBy) {
      url.searchParams.append("sort_by", sortBy);
    }
    if (sortOrder) {
      url.searchParams.append("sort_order", sortOrder);
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

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    const body = await req.json();

    const backendUrl =
      process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

    const backendRes = await fetch(
      `${backendUrl}/api/accountant/maintenance/banks`,
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
