import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    const { searchParams } = new URL(req.url);
    const ownerId = searchParams.get("owner_id");
    const propertyId = searchParams.get("property_id");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = searchParams.get("page");
    const perPage = searchParams.get("per_page");

    const backendUrl =
      process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

    const url = new URL(`${backendUrl}/api/accountant/maintenance/units`);
    if (ownerId) {
      url.searchParams.append("owner_id", ownerId);
    }
    if (status) {
      url.searchParams.append("status", status);
    }
    if (search) {
      url.searchParams.append("search", search);
    }
    if (page) {
      url.searchParams.append("page", page);
    }
    if (perPage) {
      url.searchParams.append("per_page", perPage);
    }
    if (propertyId) {
      url.searchParams.append("property_id", propertyId);
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

    const pageUrl = req.headers.get("X-Page-URL") || req.headers.get("Referer") || "";

    const backendRes = await fetch(
      `${backendUrl}/api/accountant/maintenance/units`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(pageUrl && { "X-Page-URL": pageUrl }),
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
