import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const response = await fetch(`${BACKEND_URL}/api/accountant/saved-receipts/${id}/file`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "image/*",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Failed to fetch receipt file" }));
      return NextResponse.json(
        { success: false, message: errorData.message || "Failed to fetch receipt file" },
        { status: response.status }
      );
    }

    // Check if response is actually an image
    const contentType = response.headers.get("content-type") || "image/png";
    if (!contentType.startsWith("image/")) {
      const errorData = await response.json().catch(() => ({ message: "Invalid file type" }));
      return NextResponse.json(
        { success: false, message: errorData.message || "Invalid file type" },
        { status: 400 }
      );
    }

    const blob = await response.blob();
    const contentDisposition = response.headers.get("content-disposition") || "";

    return new NextResponse(blob, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": contentDisposition,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch receipt file" },
      { status: 500 }
    );
  }
}
