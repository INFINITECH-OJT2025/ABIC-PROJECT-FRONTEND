import { NextResponse } from "next/server";

const ALLOWED_ORIGINS = [
  "https://storage.googleapis.com",
  "https://firebasestorage.googleapis.com",
  "https://abic-admin-accounting.firebasestorage.app",
];

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      ALLOWED_ORIGINS.some(
        (origin) =>
          parsed.origin === origin ||
          parsed.hostname.endsWith(".firebasestorage.app")
      ) || parsed.hostname.includes("storage.googleapis.com")
    );
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        { success: false, message: "Missing url parameter" },
        { status: 400 }
      );
    }

    const decodedUrl = decodeURIComponent(url);

    if (!isAllowedUrl(decodedUrl)) {
      return NextResponse.json(
        { success: false, message: "URL not allowed" },
        { status: 403 }
      );
    }

    const response = await fetch(decodedUrl, {
      headers: {
        Accept: "image/*",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: "Failed to fetch image" },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    if (!contentType.startsWith("image/")) {
      return NextResponse.json(
        { success: false, message: "Not an image" },
        { status: 400 }
      );
    }

    const blob = await response.blob();

    return new NextResponse(blob, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to proxy image" },
      { status: 500 }
    );
  }
}
