import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-white/[0.03] dark:text-gray-300",
        success: "border-success-200 bg-success-50 text-success-700 dark:border-success-900/50 dark:bg-success-500/10 dark:text-success-300",
        danger: "border-error-200 bg-error-50 text-error-700 dark:border-error-900/50 dark:bg-error-500/10 dark:text-error-300",
        neutral: "border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-white/[0.03] dark:text-gray-300",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
