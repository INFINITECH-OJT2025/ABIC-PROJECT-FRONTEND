import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const backendUrl = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:8000";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const propertyType = searchParams.get("property_type");
    const page = searchParams.get("page");
    const perPage = searchParams.get("per_page");
    const sortBy = searchParams.get("sort_by");
    const sortOrder = searchParams.get("sort_order");

    const url = new URL(`${backendUrl}/api/accountant/maintenance/properties`);
    if (search) {
      url.searchParams.append("search", search);
    }
    if (status) {
      url.searchParams.append("status", status);
    }
    if (propertyType) {
      url.searchParams.append("property_type", propertyType);
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

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Error fetching properties:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const res = await fetch(`${backendUrl}/api/accountant/maintenance/properties/create-property`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Error creating property:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
