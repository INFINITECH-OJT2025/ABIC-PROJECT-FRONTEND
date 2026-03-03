import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:8000";

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = searchParams.get("page");
    const perPage = searchParams.get("per_page");
    const activityType = searchParams.get("activity_type");
    const action = searchParams.get("action");
    const status = searchParams.get("status");
    const pageUrl = searchParams.get("page_url");
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");

    const url = new URL(`${BACKEND_URL}/api/accountant/activity-logs`);
    if (page) url.searchParams.append("page", page);
    if (perPage) url.searchParams.append("per_page", perPage);
    if (activityType) url.searchParams.append("activity_type", activityType);
    if (action) url.searchParams.append("action", action);
    if (status) url.searchParams.append("status", status);
    if (pageUrl) url.searchParams.append("page_url", pageUrl);
    if (dateFrom) url.searchParams.append("date_from", dateFrom);
    if (dateTo) url.searchParams.append("date_to", dateTo);

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
