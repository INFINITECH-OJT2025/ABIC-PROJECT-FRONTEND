import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ transactionId: string; attachmentId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    const { transactionId, attachmentId } = await params;

    const backendUrl = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

    const url = `${backendUrl}/api/accountant/transactions/${transactionId}/attachments/${attachmentId}`;

    const backendRes = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "*/*",
      },
    });

    if (!backendRes.ok) {
      return NextResponse.json(
        { success: false, message: "Failed to fetch attachment" },
        { status: backendRes.status }
      );
    }

    // Get the content type from the backend response
    const contentType = backendRes.headers.get("content-type") || "application/octet-stream";
    const contentDisposition = backendRes.headers.get("content-disposition");

    // Get the file buffer
    const buffer = await backendRes.arrayBuffer();

    // Return the file with proper headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        ...(contentDisposition && { "Content-Disposition": contentDisposition }),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Proxy error" },
      { status: 500 }
    );
  }
}
