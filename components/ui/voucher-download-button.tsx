"use client";

import { PrintableData } from "@/components/app/super/voucher/CashVoucher/types";
import * as htmlToImage from "html-to-image";
import { useCallback, useState } from "react";
import ConfirmationModal from "@/components/app/ConfirmationModal";
import { toast } from "sonner";
import { Download } from "lucide-react";

interface DownloadButtonProps {
  formData: PrintableData;
  onValidate?: () => boolean;
  disabled?: boolean;
  onSave?: () => Promise<void>;
  onSuccess?: () => void;
}

export default function DownloadButton({
  formData,
  onValidate,
  disabled,
  onSave,
  onSuccess,
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

      if (onSave) {
        await onSave();
      }

      const element = document.getElementById("printable-content");
      if (!element) throw new Error("Printable content was not found.");

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
        className="w-full px-8 py-2.5 text-sm font-semibold text-white bg-[#7a0f1f] rounded-md hover:bg-[#8b1535] transition-all shadow-md hover:shadow-lg"
      >
        {onSave ? "Save & Export Voucher" : "Download Voucher Image"}
      </button>
    </>
  );
}
