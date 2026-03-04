import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const { id } = await params;

    const backendUrl = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

    const backendRes = await fetch(
      `${backendUrl}/api/accountant/saved-receipts/${id}/file`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "*/*",
        },
        redirect: "follow",
      }
    );

    // If backend returns redirect (e.g. to Firebase URL), pass it through
    if (backendRes.redirected && backendRes.url) {
      return NextResponse.redirect(backendRes.url);
    }

    const contentType = backendRes.headers.get("Content-Type");
    const contentDisposition = backendRes.headers.get("Content-Disposition");
    const body = await backendRes.arrayBuffer();

    const headers = new Headers();
    if (contentType) headers.set("Content-Type", contentType);
    if (contentDisposition) headers.set("Content-Disposition", contentDisposition);

    return new NextResponse(body, {
      status: backendRes.status,
      headers,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Proxy error" },
      { status: 500 }
    );
  }
}
