"use client";

import Image from "next/image";
import { User } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { getUploadServeUrl, isPrivateUploadPath } from "@/lib/upload-url";

type UploadAvatarProps = {
  path?: string | null;
  alt?: string;
  size?: number;
  className?: string;
};

export function UploadAvatar({
  path,
  alt = "",
  size = 40,
  className,
}: UploadAvatarProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(path) && !failed;

  if (!showImage) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-slate-100 text-slate-400",
          className
        )}
        style={{ width: size, height: size }}
      >
        <User className="h-[45%] w-[45%]" aria-hidden />
      </div>
    );
  }

  return (
    <Image
      src={getUploadServeUrl(path)}
      alt={alt}
      width={size}
      height={size}
      className={cn("object-cover", className)}
      unoptimized={isPrivateUploadPath(path)}
      onError={() => setFailed(true)}
    />
  );
}
