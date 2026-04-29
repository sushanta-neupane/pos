import * as React from "react";
import { cn } from "@/lib/utils";

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="w-full overflow-x-auto">
    <table ref={ref} className={cn("min-w-full text-sm", className)} {...props} />
  </div>
));
Table.displayName = "Table";

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn("border-b border-gray-100 dark:border-white/[0.05]", className)}
    {...props}
  />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("divide-y divide-gray-100 dark:divide-white/[0.05]", className)}
    {...props}
  />
));
TableBody.displayName = "TableBody";

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => <tr ref={ref} className={cn(className)} {...props} />);
TableRow.displayName = "TableRow";

type TableCellProps = React.TdHTMLAttributes<HTMLTableCellElement> & {
  isHeader?: boolean;
};

const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, isHeader = false, ...props }, ref) => {
    if (isHeader) {
      return (
        <th
          ref={ref as React.Ref<HTMLTableCellElement>}
          className={cn(
            "px-5 py-3 text-left text-theme-xs font-medium text-gray-500 dark:text-gray-400",
            className,
          )}
          {...(props as React.ThHTMLAttributes<HTMLTableCellElement>)}
        />
      );
    }

    return (
      <td
        ref={ref}
        className={cn(
          "px-5 py-4 align-middle text-theme-sm text-gray-700 dark:text-gray-300",
          className,
        )}
        {...props}
      />
    );
  },
);
TableCell.displayName = "TableCell";

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "px-5 py-3 text-left text-theme-xs font-medium text-gray-500 dark:text-gray-400",
      className,
    )}
    {...props}
  />
));
TableHead.displayName = "TableHead";

export { Table, TableBody, TableCell, TableHead, TableHeader, TableRow };
