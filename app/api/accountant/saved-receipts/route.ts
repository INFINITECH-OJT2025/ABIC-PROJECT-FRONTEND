import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    const { searchParams } = new URL(req.url);
    const transactionType = searchParams.get("transaction_type");
    const ownerId = searchParams.get("owner_id");
    const ownerName = searchParams.get("owner_name");
    const voucherNo = searchParams.get("voucher_no");
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");
    const page = searchParams.get("page");
    const perPage = searchParams.get("per_page");

    const backendUrl = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

    const url = new URL(`${backendUrl}/api/accountant/saved-receipts`);
    if (transactionType) url.searchParams.append("transaction_type", transactionType);
    if (ownerId) url.searchParams.append("owner_id", ownerId);
    if (ownerName) url.searchParams.append("owner_name", ownerName);
    if (voucherNo) url.searchParams.append("voucher_no", voucherNo);
    if (dateFrom) url.searchParams.append("date_from", dateFrom);
    if (dateTo) url.searchParams.append("date_to", dateTo);
    if (page) url.searchParams.append("page", page);
    if (perPage) url.searchParams.append("per_page", perPage);

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

    const backendUrl = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

    // Forward multipart form data to backend
    const formData = await req.formData();

    const backendRes = await fetch(`${backendUrl}/api/accountant/saved-receipts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: formData,
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
