import { notFound } from "next/navigation";
import type * as React from "react";
import { Code39Barcode } from "@/components/barcode/code39";
import { getProductForPrint } from "@/data/products";
import { formatCents } from "@/lib/money";
import { PrintClient } from "./print-client";

export const dynamic = "force-dynamic";

export default async function PrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ variantId?: string }>;
}) {
  const { id } = await params;
  const { variantId } = await searchParams;

  const product = await getProductForPrint(id);

  if (!product) notFound();

  const labelW = "50mm";
  const labelH = "25mm";
  const selectedVariant =
    variantId && product.variants.length > 0
      ? product.variants.find((variant) => variant.id === variantId) ?? null
      : null;
  const variantToPrint = selectedVariant ?? product.variants[0] ?? null;

  const labels =
    variantToPrint
      ? [
          {
            id: variantToPrint.id,
            name: product.name,
            barcode: variantToPrint.barcode || product.barcode,
            priceCents: variantToPrint.priceCents ?? product.priceCents,
            size: variantToPrint.size,
            colorName: variantToPrint.colorName,
          },
        ]
      : [
          {
            id: product.id,
            name: product.name,
            barcode: product.barcode,
            priceCents: product.priceCents,
            size: null,
            colorName: null,
          },
        ];
  const singleLabel = labels.length === 1;

  return (
    <div className="min-h-screen bg-white text-black p-6 print:p-0">
      <PrintClient />

      <div className="mx-auto w-[420px] border p-6 print:border-0 print:p-0">
        <div className="print:hidden">
          <div className="text-lg font-semibold leading-tight">
            {product.name}
          </div>

          <div className="mt-1 text-sm text-gray-700">
            Price: {formatCents(product.priceCents)}
          </div>

          <div className="mt-2 text-xs text-muted-foreground">
            Label size: 50mm × 25mm
          </div>

          {product.variants.length > 0 && (
            <div className="mt-2 text-xs text-muted-foreground">
              {selectedVariant
                ? "Printing selected variant barcode label"
                : "Printing one variant barcode label"}
            </div>
          )}
        </div>

        <div className="mt-4 border-t pt-4 print:mt-0 print:border-0 print:p-0">
          <div className="print:hidden text-[11px] font-medium text-gray-600">
            BARCODE
          </div>

          <div className="grid gap-4 print:block">
            {labels.map((label) => (
              <div
                key={label.id}
                className={`barcode-print mt-2 flex flex-col items-center justify-center print:mt-0 ${
                  singleLabel ? "single-label" : ""
                }`}
                style={
                  {
                    ["--label-w"]: labelW,
                    ["--label-h"]: labelH,
                    ["--page-break-after"]: singleLabel ? "auto" : "always",
                    ["--break-after"]: singleLabel ? "auto" : "page",
                  } as React.CSSProperties
                }
              >
                <div className="barcode-inner">
                  <Code39Barcode
                    value={label.barcode}
                    height={52}
                    narrow={1}
                    wide={3}
                    quiet={10}
                  />
                </div>

                <div className="barcode-number font-mono">
                  {label.barcode}
                </div>

                <div className="barcode-price">
                  {formatCents(label.priceCents)}
                </div>

                {(label.size || label.colorName) && (
                  <div className="barcode-variant">
                    {[label.size, label.colorName].filter(Boolean).join(" / ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-gray-500 print:hidden">
        Printing… (If dialog doesn’t open, press Ctrl/Cmd+P)
      </div>

      <style>{`
        @media print {
          @page {
            margin: 0;
            size: 50mm 25mm;
          }

          .print\\:hidden {
            display: none !important;
          }

          body {
            margin: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          body * {
            visibility: hidden;
          }

          html,
          body {
            width: 50mm;
            height: 25mm;
            overflow: hidden;
          }

          .barcode-print,
          .barcode-print * {
            visibility: visible;
          }

          .barcode-print {
            width: var(--label-w);
            height: var(--label-h);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            padding: 1.5mm;
            box-sizing: border-box;
            page-break-after: var(--page-break-after);
            break-after: var(--break-after);
          }

          .barcode-print.single-label {
            position: fixed;
            inset: 0;
            margin: auto;
          }

          .barcode-print:last-child {
            page-break-after: auto;
            break-after: auto;
          }

          .barcode-inner {
            width: 100%;
            height: 13mm;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .barcode-inner svg {
            width: 100%;
            height: 100%;
          }

          .barcode-number {
            margin-top: 0.5mm;
            font-size: 7px;
            line-height: 1;
            letter-spacing: 0.8px;
          }

          .barcode-price {
            margin-top: 0.8mm;
            font-size: 9px;
            font-weight: 700;
            line-height: 1;
          }

          .barcode-variant {
            margin-top: 0.6mm;
            font-size: 6px;
            line-height: 1;
            max-width: 100%;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }
      `}</style>
    </div>
  );
}
