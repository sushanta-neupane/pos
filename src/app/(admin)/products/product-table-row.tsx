"use client";

import * as React from "react";
import { formatCents } from "@/lib/money";
import { ProductBarcodeCell } from "./product-barcode-cell";
import { ProductRowActions } from "./product-row-actions";
import { TableCell, TableRow } from "@/components/ui/table";

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

export function ProductTableRow({
  product,
}: {
  product: {
    id: string;
    name: string;
    barcode: string;
    priceCents: number;
    costCents: number;
    stock: number;
    isTrending: boolean;
    lowStockThreshold: number;
    variants: Variant[];
  };
}) {
  const [selectedVariant, setSelectedVariant] = React.useState<Variant | null>(
    product.variants[0] ?? null
  );

  const displayPrice = selectedVariant?.priceCents ?? product.priceCents;
  const displayCost = selectedVariant?.costCents ?? product.costCents;
  const displayStock = product.stock;
  const low = displayStock < product.lowStockThreshold;

  return (
    <TableRow>
      <TableCell className="font-medium">{product.name}</TableCell>
      <TableCell>
        <ProductBarcodeCell
          barcode={product.barcode}
          variants={product.variants}
          onVariantChange={setSelectedVariant}
        />
      </TableCell>
      <TableCell className="text-right">{formatCents(displayPrice)}</TableCell>
      <TableCell className="text-right">{formatCents(displayCost)}</TableCell>
      <TableCell className={low ? "text-right text-red-600" : "text-right"}>
        {displayStock}
      </TableCell>
      <TableCell>{product.isTrending ? "Yes" : "No"}</TableCell>
      <TableCell className="text-right">{product.lowStockThreshold}</TableCell>
      <TableCell className="text-right">
        <ProductRowActions
          id={product.id}
          name={product.name}
          selectedVariantId={selectedVariant?.id ?? null}
        />
      </TableCell>
    </TableRow>
  );
}
