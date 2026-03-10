import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ transactionId: string }> }
) {
    try {
        const resolvedParams = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        const backendUrl = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";
        
        const contentType = req.headers.get("content-type") || "";

        // If it's a JSON request (no file upload)
        if (contentType.includes("application/json")) {
            const body = await req.text();
            const backendRes = await fetch(
                `${backendUrl}/api/accountant/transactions/${resolvedParams.transactionId}/patch-trans-type`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                        "Content-Type": "application/json",
                    },
                    body,
                }
            );
            const data = await backendRes.json().catch(() => ({}));
            return NextResponse.json(data, { status: backendRes.status });
        } 
        
        // If it's a Multipart FormData request (with file upload)
        // Note: We use POST + X-HTTP-Method-Override because PHP doesn't natively parse multipart/form-data on PATCH
        if (contentType.includes("multipart/form-data")) {
            // Do NOT parse it with req.formData() as it strips boundaries/causes Next.js parsing crashes.
            // Just forward the exact exact headers and raw body.
            const backendRes = await fetch(
                `${backendUrl}/api/accountant/transactions/${resolvedParams.transactionId}/patch-trans-type`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                        "Content-Type": contentType, // MUST include the original boundary=...
                        "X-HTTP-Method-Override": "PATCH",
                    },
                    // Send the raw stream directly
                    body: req.body, 
                    // @ts-ignore - Required for Node.js fetch with ReadableStream bodies
                    duplex: "half",
                }
            );

            let data;
            const resText = await backendRes.text();
            
            try {
                data = JSON.parse(resText);
            } catch (e) {
                // Return the raw text if JSON parsing fails to help with debugging
                return NextResponse.json(
                    { success: false, message: `Backend error (Not JSON): ${resText.substring(0, 500)}` },
                    { status: backendRes.status === 200 ? 500 : backendRes.status }
                );
            }

            return NextResponse.json(data, { status: backendRes.status });
        }

        return NextResponse.json(
            { success: false, message: "Unsupported content type" },
            { status: 415 }
        );
    } catch (e: any) {
        return NextResponse.json(
            { success: false, message: `Proxy error: ${e?.message || String(e)}` },
            { status: 500 }
        );
    }
}

// Export POST as well to handle FormData requests, which must be sent as POST
// to work around PHP's multipart/form-data limitations for PATCH method.
export async function POST(
    req: Request,
    { params }: { params: Promise<{ transactionId: string }> }
) {
    return PATCH(req, { params });
}
