import { NextResponse } from "next/server";
import { cookies } from "next/headers";

async function getAuthToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get("token")?.value || null;
  } catch (error) {
    console.error("Error getting cookies:", error);
    return null;
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getAuthToken();
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const backendUrl = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";
    const pageUrl = req.headers.get('X-Page-URL') || req.headers.get('Referer') || '';
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (pageUrl) {
      headers['X-Page-URL'] = pageUrl;
    }

    const backendRes = await fetch(
      `${backendUrl}/api/accountant/${id}/revert-to-employee`,
      {
        method: "POST",
        headers,
      }
    );

    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendRes.status });
  } catch (err) {
    console.error("Revert to employee error:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
