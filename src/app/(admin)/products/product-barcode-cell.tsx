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
  stock: number;
  priceCents: number;
  costCents: number | null;
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
  onVariantChange,
}: {
  barcode: string;
  variants?: Variant[];
  onVariantChange?: (variant: Variant | null) => void;
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
    if (!hasVariants || !variants) return null;

    if (sizes.length > 0 && colors.length > 0) {
      return (
        variants.find((v) => v.size === size && colorValue(v) === color) ??
        variants[0] ??
        null
      );
    }

    if (sizes.length > 0) {
      return variants.find((v) => v.size === size) ?? variants[0] ?? null;
    }

    if (colors.length > 0) {
      return variants.find((v) => colorValue(v) === color) ?? variants[0] ?? null;
    }

    return variants[0] ?? null;
  }, [color, hasVariants, size, sizes.length, colors.length, variants]);

  const value = selected?.barcode ?? barcode;

  const colorOptions = React.useMemo(() => {
    if (!variants) return [];
    return colors.map((currentColor) => {
      const matching =
        sizes.length > 0
          ? variants.find((v) => v.size === size && colorValue(v) === currentColor)
          : variants.find((v) => colorValue(v) === currentColor);
      return {
        color: currentColor,
        stock: matching?.stock ?? 0,
      };
    });
  }, [colors, size, sizes.length, variants]);

  const sizeOptions = React.useMemo(() => {
    if (!variants) return [];
    return sizes.map((currentSize) => {
      const matching =
        colors.length > 0
          ? variants.find((v) => v.size === currentSize && colorValue(v) === color)
          : variants.find((v) => v.size === currentSize);
      return {
        size: currentSize,
        stock: matching?.stock ?? 0,
      };
    });
  }, [color, colors.length, sizes, variants]);

  const currentColorStock = colorOptions.find((o) => o.color === color)?.stock ?? 0;

  React.useEffect(() => {
    onVariantChange?.(selected);
  }, [onVariantChange, selected]);

  return (
    <div className="grid gap-1">
      {hasVariants && (
        <div className="flex flex-wrap items-center gap-3">
          {/* Size Selector */}
          {sizes.length > 0 && (
            <div className="flex items-center gap-2">
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="h-8 rounded-sm border bg-background px-2 text-xs"
              >
                {sizeOptions.map((option) => (
                  <option key={option.size} value={option.size}>
                    {option.size}
                  </option>
                ))}
              </select>
             
            </div>
          )}

          {/* Color Selector */}
          {colors.length > 0 && (
            <div className="flex items-center gap-2">
              {/^#[0-9a-fA-F]{6}$/.test(color) && (
                <span
                  className="h-4 w-4 rounded-sm border"
                  style={{ backgroundColor: color }}
                  aria-hidden
                />
              )}

              <select
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-8 rounded-sm border bg-background px-2 text-xs"
              >
                {colorOptions.map((option) => (
                  <option key={option.color} value={option.color}>
                    {option.color}
                  </option>
                ))}
              </select>

              <span
                className={`text-xs ${
                  currentColorStock === 0 ? "text-red-500" : "text-muted-foreground"
                }`}
              >
                Stock: {currentColorStock}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Barcode */}
      <div className="overflow-hidden">
        <div className="origin-left scale-[0.7]">
          <Code39Barcode
            value={value}
            height={44}
            narrow={2}
            wide={5}
            quiet={10}
            title={value}
          />
        </div>
      </div>

      <div className="font-mono text-[11px] text-muted-foreground">{value}</div>
    </div>
  );
}
