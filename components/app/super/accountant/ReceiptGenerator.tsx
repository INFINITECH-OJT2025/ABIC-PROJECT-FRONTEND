import React from "react";
import { pdf } from "@react-pdf/renderer";
import * as pdfjsLib from "pdfjs-dist";
import { SuccessTransactionData } from "./types";
import { ReceiptPDF } from "./ReceiptPDF";

// Export ReceiptPDF for use in other components if needed
export { ReceiptPDF };

// Set up pdfjs worker - disable worker for now to avoid CDN issues
// We'll upload PDF directly instead of converting to image
if (typeof window !== "undefined") {
  try {
    // Try to use a local worker path first
    // If that fails, we'll fall back to uploading PDF directly
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  } catch (error) {
    console.warn("Failed to set up pdfjs worker:", error);
    // Worker will use default fallback
  }
}

/**
 * Generate PDF blob from transaction data
 */
export const generateReceiptPDF = async (
  transactionData: SuccessTransactionData,
  transactionType: "DEPOSIT" | "WITHDRAWAL"
): Promise<Blob> => {
  const pdfDoc = <ReceiptPDF transactionData={transactionData} transactionType={transactionType} />;

  // ReceiptPDF returns Document; pdf() expects DocumentProps - types are compatible at runtime
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const instance = pdf(pdfDoc as any);
  const blob = await instance.toBlob();
  return blob;
};

/**
 * Convert PDF blob to image blob
 */
const pdfToImage = async (pdfBlob: Blob): Promise<Blob> => {
  try {
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ 
      data: arrayBuffer,
      verbosity: 0, // Suppress warnings
    }).promise;
    const page = await pdf.getPage(1);

    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Could not get canvas context");
    }

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext: any = {
      canvasContext: context,
      viewport: viewport,
    };

    await page.render(renderContext).promise;

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to convert canvas to blob"));
          }
        },
        "image/png",
        0.95
      );
    });
  } catch (error) {
    console.warn("Error converting PDF to image, worker may not be loaded:", error);
    // If PDF to image conversion fails, we can still proceed without saving the image
    // The transaction will still be created successfully
    throw error;
  }
};

/**
 * Save receipt (uploads PDF directly to Firebase Storage, or converts to image if worker is available)
 */
export const saveReceiptAsImage = async (
  transactionData: SuccessTransactionData,
  transactionId: number | null,
  transactionType: "DEPOSIT" | "WITHDRAWAL"
): Promise<void> => {
  if (!transactionData) {
    console.warn("No transaction data provided for receipt saving");
    return;
  }

  if (!transactionId) {
    console.warn("No transaction ID provided for receipt saving");
    return;
  }

  try {
    console.log("Starting receipt generation for transaction:", transactionId);
    
    // Generate PDF
    const pdfBlob = await generateReceiptPDF(transactionData, transactionType);
    console.log("PDF generated, size:", pdfBlob.size, "bytes");

    // Try to convert PDF to image, but fallback to PDF if worker fails
    let fileBlob: Blob;
    let fileName: string;
    let fileType: string;

    try {
      // Try to convert PDF to image
      const imageBlob = await pdfToImage(pdfBlob);
      console.log("Image converted, size:", imageBlob.size, "bytes");
      fileBlob = imageBlob;
      fileName = `receipt_${transactionId}_${Date.now()}.png`;
      fileType = "image/png";
    } catch (imageError) {
      // If image conversion fails, upload PDF directly
      console.warn("PDF to image conversion failed, uploading PDF directly:", imageError);
      fileBlob = pdfBlob;
      fileName = `receipt_${transactionId}_${Date.now()}.pdf`;
      fileType = "application/pdf";
    }

    // Create FormData and upload
    const formDataToSend = new FormData();
    formDataToSend.append("receipt_image", fileBlob, fileName);
    formDataToSend.append("transaction_type", transactionType);
    formDataToSend.append("transaction_id", transactionId.toString());
    formDataToSend.append("receipt_data", JSON.stringify(transactionData));

    console.log("Uploading receipt to backend...", { fileName, fileType, size: fileBlob.size });
    const response = await fetch("/api/accountant/saved-receipts", {
      method: "POST",
      body: formDataToSend,
    });

    const responseData = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      console.error("Failed to save receipt:", {
        status: response.status,
        statusText: response.statusText,
        error: responseData.message || responseData.error || "Unknown error",
        data: responseData
      });
      throw new Error(responseData.message || responseData.error || `Failed to save receipt: ${response.status}`);
    }
    
    console.log("Receipt saved successfully:", {
      receiptId: responseData.data?.id,
      filePath: responseData.data?.file_path,
      transactionId: transactionId,
      fileType: fileType
    });
  } catch (error) {
    console.error("Error in saveReceiptAsImage:", {
      error: error instanceof Error ? error.message : String(error),
      transactionId: transactionId,
      transactionType: transactionType
    });
    // Don't throw - receipt saving failure shouldn't affect transaction creation
  }
};

/**
 * Generate receipt HTML for printing (legacy - kept for compatibility)
 * Now generates a simple HTML page that embeds the PDF
 */
export const generateReceiptHTML = (
  transactionData: SuccessTransactionData,
  transactionType: "DEPOSIT" | "WITHDRAWAL"
): string => {
  // This is a fallback - ideally we should use PDF directly for printing
  // But keeping this for backward compatibility
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Transaction Summary</title>
        <style>
          body {
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: #f5f5f5;
          }
          .pdf-container {
            width: 100%;
            max-width: 800px;
            height: 100vh;
          }
          iframe {
            width: 100%;
            height: 100%;
            border: none;
          }
        </style>
      </head>
      <body>
        <div class="pdf-container">
          <p style="text-align: center; padding: 20px;">
            Generating PDF... Please use the Print button in the success modal for better results.
          </p>
        </div>
      </body>
    </html>
  `;
};
