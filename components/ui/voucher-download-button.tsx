"use client";

import { PrintableData } from "@/components/app/super/voucher/CashVoucher/types";
import * as htmlToImage from "html-to-image";
import { useCallback, useState } from "react";
import ConfirmationModal from "@/components/app/ConfirmationModal";
import { toast } from "sonner";
import { Download } from "lucide-react";

const ACCENT = "#7a0f1f";

interface DownloadButtonProps {
  formData: PrintableData;
  onValidate?: () => boolean;
  disabled?: boolean;
  onSave?: (base64Image: string) => Promise<void>;
  onSuccess?: () => void;
  imageUrl?: string | null;
}

export default function DownloadButton({
  formData,
  onValidate,
  disabled,
  onSave,
  onSuccess,
  imageUrl,
}: DownloadButtonProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleDownload = useCallback(() => {
    if (disabled) return;
    if (onValidate && !onValidate()) return;
    setIsConfirmOpen(true);
  }, [disabled, onValidate]);

  const confirmDownload = useCallback(async () => {
    try {
      setIsExporting(true);

      if (imageUrl && !onSave) {
        try {
          // Bypassing CORS with Next.js local proxy
          const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
          const response = await fetch(proxyUrl);
          if (!response.ok) throw new Error("Network response was not ok");
          const blob = await response.blob();
          const objectUrl = URL.createObjectURL(blob);
          
          const link = document.createElement("a");
          link.download = `${formData.voucherNo || "voucher"}.png`;
          link.href = objectUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          URL.revokeObjectURL(objectUrl);
          
          setIsConfirmOpen(false);
          toast.success("Image downloaded successfully.");
          if (onSuccess) onSuccess();
          return;
        } catch (err) {
          console.error("Failed to fetch existing image, falling back to HTML capture if available.", err);
          // If fetch fails, we can fall through and try to capture IF the element exists... but if we don't have the element, it will fail.
        }
      }

      const element = document.getElementById("printable-content");
      if (!element) throw new Error("Printable content was not found to export.");

      const originalDataUrl = await htmlToImage.toPng(element, {
        cacheBust: true,
        pixelRatio: 2,
      });

      const img = new Image();

      const finalImage = await new Promise<string>((resolve, reject) => {
        img.onload = () => {
          try {
            const ORIGINAL_WIDTH = img.width;
            const ORIGINAL_HEIGHT = img.height;

            const TARGET_WIDTH = ORIGINAL_WIDTH;
            const TARGET_HEIGHT = ORIGINAL_HEIGHT;

            const canvas = document.createElement("canvas");
            canvas.width = TARGET_WIDTH;
            canvas.height = TARGET_HEIGHT;

            const ctx = canvas.getContext("2d");
            if (!ctx) {
              reject(new Error("Canvas context could not be created."));
              return;
            }

            ctx.drawImage(
              img,
              0,
              0,
              ORIGINAL_WIDTH,
              ORIGINAL_HEIGHT,
              0,
              0,
              TARGET_WIDTH,
              TARGET_HEIGHT
            );

            resolve(canvas.toDataURL("image/png"));
          } catch (e) {
            reject(e);
          }
        };

        img.onerror = () => reject(new Error("Failed to generate image."));
        img.src = originalDataUrl;
      });

      if (onSave) {
        await onSave(finalImage);
      }

      const link = document.createElement("a");
      link.download = `${formData.voucherNo || "voucher"}.png`;
      link.href = finalImage;
      link.click();

      setIsConfirmOpen(false);
      toast.success(onSave ? "Voucher saved and exported successfully." : "Image exported successfully.");
      if (onSuccess) onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to export image.";
      toast.error(message);
    } finally {
      setIsExporting(false);
    }
  }, [formData.voucherNo, onSave]);

  return (
    <>
      <ConfirmationModal
        open={isConfirmOpen}
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={confirmDownload}
        title={onSave ? "Save and Export Voucher" : "Export Voucher"}
        message={onSave ? "Are you sure you want to save and export this voucher as an image?" : "Are you sure you want to export this voucher as an image?"}
        confirmLabel={onSave ? "Save & Export" : "Export"}
        cancelLabel="Cancel"
        isConfirming={isExporting}
        icon={Download}
      />
      <button
        type="button"
        onClick={handleDownload}
        disabled={disabled}
      className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold transition-colors bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 flex-shrink-0"
      style={{backgroundColor: ACCENT, color: "white"}}
      >
        <Download className="w-4 h-4" />
        {onSave ? "Save & Export Voucher" : "Download Voucher"}
      </button>
    </>
  );
}
