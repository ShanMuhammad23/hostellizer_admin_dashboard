"use client";

import { useId, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export type LocalUploadFolder = "students" | "hostel" | "documents";

interface LocalImageUploadProps {
  onUploadSuccess: (publicPath: string) => void;
  folder: LocalUploadFolder;
  label?: string;
  disabled?: boolean;
  /** Defaults to common image MIME types; use e.g. images + PDF for documents */
  accept?: string;
}

export function LocalImageUpload({
  onUploadSuccess,
  folder,
  label = "Upload Image",
  disabled = false,
  accept = "image/jpeg,image/png,image/webp,image/gif",
}: LocalImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const inputId = useId();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const response = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }
      if (data.path) {
        onUploadSuccess(data.path as string);
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        error instanceof Error ? error.message : "Upload failed. Try again."
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        id={inputId}
        disabled={disabled || isUploading}
      />
      <label
        htmlFor={inputId}
        className={`rounded-md px-2.5 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 cursor-pointer inline-flex items-center gap-2 ${
          isUploading || disabled
            ? "bg-indigo-400 cursor-not-allowed"
            : "bg-indigo-600 hover:bg-indigo-500"
        }`}
      >
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          label
        )}
      </label>
    </div>
  );
}
