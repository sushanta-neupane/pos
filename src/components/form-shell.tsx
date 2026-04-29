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
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">{title}</h2>
        {subtitle ? (
          <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</div>
        ) : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
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
    <div
      className={cn(
        "rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]",
        className,
      )}
    >
      {title ? (
        <div className="px-6 py-5">
          <div className="text-base font-medium text-gray-800 dark:text-white/90">{title}</div>
          {description ? (
            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</div>
          ) : null}
        </div>
      ) : null}
      <div
        className={cn(
          "p-4 sm:p-6",
          title ? "border-t border-gray-100 dark:border-gray-800" : "",
        )}
      >
        {children}
      </div>
    </div>
  );
}
