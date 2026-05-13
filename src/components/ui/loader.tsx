"use client"

import { cn } from "@/lib/utils"

interface LoaderProps {
  className?: string
  text?: string
}

export function Loader({ className, text = "Loading..." }: LoaderProps) {
  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
      <p className="text-emerald-300/70">{text}</p>
    </div>
  )
} 