import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const imageUrl = searchParams.get("url");

  if (!imageUrl) {
    return NextResponse.json({ success: false, message: "URL is required" }, { status: 400 });
  }

  try {
    const backendRes = await fetch(imageUrl, {
      method: "GET",
    });

    if (!backendRes.ok) {
      return NextResponse.json(
        { success: false, message: "Failed to fetch image from remote server" },
        { status: backendRes.status }
      );
    }

    const blob = await backendRes.blob();
    
    // Create new headers including CORS and proper content-type
    const headers = new Headers();
    headers.set("Content-Type", backendRes.headers.get("Content-Type") || "image/png");
    headers.set("Access-Control-Allow-Origin", "*");

    return new NextResponse(blob, {
        status: 200,
        headers,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Proxy error" },
      { status: 500 }
    );
  }
}
