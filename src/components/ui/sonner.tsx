"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": theme === "dark" ? "#1f2937" : "#ffffff",
          "--normal-text": theme === "dark" ? "#f9fafb" : "#111827",
          "--normal-border": theme === "dark" ? "#374151" : "#d1d5db",
          zIndex: 9999,
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "group toast border group-[.toaster]:border-border " +
            "data-[type=success]:bg-emerald-600 data-[type=success]:text-white " +
            "data-[type=error]:bg-red-600 data-[type=error]:text-white " +
            "data-[type=warning]:bg-amber-400 data-[type=warning]:text-zinc-900 " +
            "dark:data-[type=warning]:text-zinc-900 " +
            "data-[type=info]:bg-blue-600 data-[type=info]:text-white " +
            "data-[type=loading]:bg-zinc-700 data-[type=loading]:text-white " +
            "dark:data-[type=loading]:bg-black " +
            "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700",
          description: "group-[.toast]:opacity-90 text-gray-700 dark:text-gray-300",
          icon: "group-[.toast]:text-current",
          actionButton:
            "group-[.toast]:bg-transparent group-[.toast]:text-current underline underline-offset-2",
          cancelButton:
            "group-[.toast]:bg-transparent group-[.toast]:text-current opacity-80 hover:opacity-100",
        },
      }}

      position="top-center"
      {...props}
    />
  )
}

export { Toaster }
