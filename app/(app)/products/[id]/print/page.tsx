import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/money";
import { Code39Barcode } from "@/components/barcode/code39";
import { PrintClient } from "./print-client";

export const dynamic = "force-dynamic";

type PrintSize = "3x1" | "5x1.5";

function getPrintSize(size?: string): PrintSize {
  if (size === "3x1") return "3x1";
  if (size === "5x1.5") return "5x1.5";
  return "5x1.5";
}

export default async function PrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ size?: string }>;
}) {
  const { id } = await params;
  const sp = (await searchParams) ?? {};
  const size = getPrintSize(sp.size);

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) notFound();

  const labelW = size === "3x1" ? "30mm" : "50mm";
  const labelH = size === "3x1" ? "10mm" : "15mm";

  return (
    <div className="min-h-screen bg-white text-black p-6 print:p-0">
      <PrintClient />
      <div className="mx-auto w-[420px] border p-6 print:border-0 print:p-0">
        <div className="print:hidden">
          <div className="text-lg font-semibold leading-tight">{product.name}</div>
          <div className="mt-1 text-sm text-gray-700">
            Price: {formatCents(product.priceCents)}
          </div>
          <div className="mt-4 flex items-center gap-2">
            <a
              className={
                size === "3x1"
                  ? "rounded-sm border bg-muted px-3 py-1.5 text-xs font-medium"
                  : "rounded-sm border px-3 py-1.5 text-xs hover:bg-muted/50"
              }
              href={`/products/${product.id}/print?size=3x1`}
            >
              3 × 1 cm
            </a>
            <a
              className={
                size === "5x1.5"
                  ? "rounded-sm border bg-muted px-3 py-1.5 text-xs font-medium"
                  : "rounded-sm border px-3 py-1.5 text-xs hover:bg-muted/50"
              }
              href={`/products/${product.id}/print?size=5x1.5`}
            >
              5 × 1.5 cm
            </a>
            <div className="text-xs text-muted-foreground">
              Selected: {size === "3x1" ? "3×1 cm" : "5×1.5 cm"}
            </div>
          </div>
        </div>

        <div className="mt-4 border-t pt-4 print:mt-0 print:border-0 print:p-0">
          <div className="print:hidden text-[11px] font-medium text-gray-600">BARCODE</div>
          <div
            className="barcode-print mt-2 flex justify-center print:mt-0"
            style={
              {
                ["--label-w"]: labelW,
                ["--label-h"]: labelH,
              } as React.CSSProperties
            }
          >
            <Code39Barcode
              value={product.barcode}
              height={64}
              narrow={1}
              wide={3}
              quiet={12}
            />
          </div>
          <div className="print:hidden mt-2 text-center font-mono text-base tracking-widest">
            {product.barcode}
          </div>
        </div>
      </div>
      <div className="mt-6 text-center text-xs text-gray-500 print:hidden">
        Printing… (If dialog doesn’t open, press Ctrl/Cmd+P)
      </div>
      <style>{`
        @media print {
          @page { margin: 0; }
          .print\\:hidden { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body { margin: 0; }
          body * { visibility: hidden; }
          .barcode-print, .barcode-print * { visibility: visible; }
          .barcode-print {
            position: fixed;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: var(--label-w);
            height: var(--label-h);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .barcode-print svg { width: 100%; height: 100%; }
        }
      `}</style>
    </div>
  );
}
