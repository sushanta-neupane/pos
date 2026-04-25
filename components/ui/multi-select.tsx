"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function normalize(values: string[]) {
  const out: string[] = [];
  for (const v of values) {
    const trimmed = v.trim();
    if (!trimmed) continue;
    if (out.some((x) => x.toLowerCase() === trimmed.toLowerCase())) continue;
    out.push(trimmed);
  }
  return out;
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select…",
  className,
  allowCustom = true,
  customPlaceholder = "Add option",
}: {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  className?: string;
  allowCustom?: boolean;
  customPlaceholder?: string;
}) {
  const allOptions = React.useMemo(() => normalize([...options, ...value]), [options, value]);
  const selected = React.useMemo(() => normalize(value), [value]);
  const [custom, setCustom] = React.useState("");

  function toggle(opt: string) {
    const exists = selected.some((v) => v.toLowerCase() === opt.toLowerCase());
    if (exists) onChange(selected.filter((v) => v.toLowerCase() !== opt.toLowerCase()));
    else onChange(normalize([...selected, opt]));
  }

  function addCustom() {
    const next = normalize([...selected, custom]);
    onChange(next);
    setCustom("");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn("h-11 justify-between gap-2", className)}
        >
          <span className="truncate text-left">
            {selected.length ? selected.join(", ") : placeholder}
          </span>
          <span className="text-xs text-muted-foreground">{selected.length || ""}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[18rem]">
        {allowCustom ? (
          <div className="p-2">
            <div className="flex items-center gap-2">
              <input
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder={customPlaceholder}
                className="h-9 w-full rounded-sm border bg-background px-2 text-sm outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustom();
                  }
                }}
              />
              <Button type="button" size="sm" onClick={addCustom} disabled={!custom.trim()}>
                Add
              </Button>
            </div>
          </div>
        ) : null}
        {allowCustom ? <DropdownMenuSeparator /> : null}
        <div className="max-h-64 overflow-auto p-1">
          {allOptions.length === 0 ? (
            <div className="px-2 py-2 text-sm text-muted-foreground">No options</div>
          ) : (
            allOptions.map((opt) => {
              const checked = selected.some((v) => v.toLowerCase() === opt.toLowerCase());
              return (
                <button
                  key={opt}
                  type="button"
                  className={cn(
                    "flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-muted/50",
                    checked ? "bg-muted" : ""
                  )}
                  onClick={() => toggle(opt)}
                >
                  <span className="truncate">{opt}</span>
                  <span className="text-xs text-muted-foreground">{checked ? "✓" : ""}</span>
                </button>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

