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
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="text-2xl font-semibold tracking-tight text-primary">
          {title}
        </div>
        {subtitle ? (
          <div className="mt-1 text-sm text-muted-foreground">{subtitle}</div>
        ) : null}
      </div>
      {right ? <div className="pt-1">{right}</div> : null}
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
        <div className="px-8 pt-8 text-center">
          <div className="text-lg font-semibold tracking-tight text-primary">{title}</div>
          {description ? (
            <div className="mt-1 text-sm text-muted-foreground">{description}</div>
          ) : null}
        </div>
      ) : null}
      <div className={cn("px-8 pb-8", title ? "pt-6" : "pt-8")}>{children}</div>
    </div>
  );
}
