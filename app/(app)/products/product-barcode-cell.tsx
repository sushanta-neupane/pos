"use client";

import * as React from "react";
import { Code39Barcode } from "@/components/barcode/code39";

type Variant = {
  id: string;
  size: string | null;
  colorName: string | null;
  colorHex: string | null;
  key: string;
  barcode: string;
};

function unique(values: Array<string>) {
  return Array.from(new Set(values));
}

function colorValue(v: Variant) {
  return (v.colorHex || v.colorName || "").trim();
}

export function ProductBarcodeCell({
  barcode,
  variants,
}: {
  barcode: string;
  variants?: Variant[];
}) {
  const hasVariants = (variants?.length ?? 0) > 0;

  const sizes = React.useMemo(
    () => unique((variants ?? []).map((v) => v.size).filter((v): v is string => Boolean(v))),
    [variants]
  );
  const colors = React.useMemo(() => {
    const all = (variants ?? []).map((v) => colorValue(v)).filter(Boolean);
    return unique(all);
  }, [variants]);

  const [size, setSize] = React.useState(() => sizes[0] ?? "");
  const [color, setColor] = React.useState(() => colors[0] ?? "");

  const selected = React.useMemo(() => {
    if (!hasVariants) return null;
    if (!variants) return null;
    if (sizes.length > 0 && colors.length > 0) {
      return (
        variants.find((v) => v.size === size && colorValue(v) === color) ?? variants[0] ?? null
      );
    }
    if (sizes.length > 0) return variants.find((v) => v.size === size) ?? variants[0] ?? null;
    if (colors.length > 0)
      return variants.find((v) => colorValue(v) === color) ?? variants[0] ?? null;
    return variants[0] ?? null;
  }, [color, hasVariants, size, sizes.length, colors.length, variants]);

  const value = selected?.barcode ?? barcode;

  return (
    <div className="grid gap-1">
      {hasVariants ? (
        <div className="flex flex-wrap items-center gap-2">
          {sizes.length > 0 ? (
            <select
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="h-8 rounded-sm border bg-background px-2 text-xs"
            >
              {sizes.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          ) : null}
          {colors.length > 0 ? (
            <div className="flex items-center gap-2">
              {/^#[0-9a-fA-F]{6}$/.test(color) ? (
                <span
                  className="h-4 w-4 rounded-sm border"
                  style={{ backgroundColor: color }}
                  aria-hidden
                />
              ) : null}
              <select
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-8 rounded-sm border bg-background px-2 text-xs"
              >
                {colors.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="overflow-hidden">
        <div className="origin-left scale-[0.7]">
          <Code39Barcode value={value} height={44} narrow={2} wide={5} quiet={10} title={value} />
        </div>
      </div>
      <div className="font-mono text-[11px] text-muted-foreground">{value}</div>
    </div>
  );
}
