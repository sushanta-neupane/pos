"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="top-right"
      toastOptions={{
        classNames: {
          toast:
            "rounded-sm border bg-background text-foreground shadow-none",
          title: "text-sm font-medium",
          description: "text-xs text-muted-foreground",
          actionButton: "rounded-sm",
          cancelButton: "rounded-sm",
        },
      }}
    />
  );
}

