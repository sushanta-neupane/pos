import * as React from "react";
import { cn } from "@/lib/utils";

export function PageTitle({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="text-2xl font-semibold tracking-tight text-primary">
          {title}
        </div>
        {subtitle ? (
          <div className="mt-1 text-sm text-muted-foreground">{subtitle}</div>
        ) : null}
      </div>
      {right ? <div className="pt-1 sm:shrink-0">{right}</div> : null}
    </div>
  );
}

export function FormCard({
  title,
  description,
  children,
  className,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border bg-background", className)}>
      {title ? (
        <div className="px-4 pt-6 text-center sm:px-8 sm:pt-8">
          <div className="text-lg font-semibold tracking-tight text-primary">{title}</div>
          {description ? (
            <div className="mt-1 text-sm text-muted-foreground">{description}</div>
          ) : null}
        </div>
      ) : null}
      <div className={cn("px-4 pb-6 sm:px-8 sm:pb-8", title ? "pt-4 sm:pt-6" : "pt-6 sm:pt-8")}>
        {children}
      </div>
    </div>
  );
}
