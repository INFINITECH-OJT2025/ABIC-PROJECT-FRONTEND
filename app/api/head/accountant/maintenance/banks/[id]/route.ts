import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    const backendUrl =
      process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

    const backendRes = await fetch(
      `${backendUrl}/api/accountant/maintenance/banks/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );

    const data = await backendRes.json().catch(() => ({}));

    return NextResponse.json(data, { status: backendRes.status });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Proxy GET error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const body = await req.json();

    const backendUrl =
      process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

    const backendRes = await fetch(
      `${backendUrl}/api/accountant/maintenance/banks/${id}`,
      {
        method: "PUT",
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
      { success: false, message: "Proxy PUT error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    const backendUrl =
      process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

    const backendRes = await fetch(
      `${backendUrl}/api/accountant/maintenance/banks/${id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );

    const data = await backendRes.json().catch(() => ({}));

    return NextResponse.json(data, { status: backendRes.status });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Proxy DELETE error" },
      { status: 500 }
    );
  }
}
