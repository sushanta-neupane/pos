"use client";

import * as React from "react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { completeSale, getProductByBarcode, searchProducts } from "@/actions/pos.actions";
import { formatCents, toCents } from "@/lib/money";
import { getErrorMessage } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { FormCard } from "@/components/form-shell";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Code39Barcode } from "@/components/barcode/code39";
import { ScanDialog } from "./scan-dialog";

type CartItem = {
  barcode: string;
  name: string;
  priceCents: number;
  costCents: number;
  stock: number;
  quantity: number;
  discountCents: number;
};

export default function POSPage() {
  const { data } = useSession();
  const barcodeRef = React.useRef<HTMLInputElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);

  const [barcode, setBarcode] = React.useState("");
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [scannerOpen, setScannerOpen] = React.useState(false);

  const [q, setQ] = React.useState("");
  const [results, setResults] = React.useState<Awaited<ReturnType<typeof searchProducts>>>([]);
  const [resultsOpen, setResultsOpen] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  const subtotalCents = cart.reduce((sum, i) => {
    const lineSubtotal = i.priceCents * i.quantity;
    const lineDiscount = Math.min(i.discountCents, lineSubtotal);
    return sum + (lineSubtotal - lineDiscount);
  }, 0);
  const totalCents = subtotalCents;

  React.useEffect(() => {
    const query = q.trim();
    if (query.length < 2) return;

    let cancelled = false;
    const handle = window.setTimeout(() => {
      searchProducts(query)
        .then((r) => {
          if (cancelled) return;
          setResults(r);
          setResultsOpen(true);
          setSelectedIndex(0);
        })
        .catch(() => {
          if (cancelled) return;
          setResults([]);
          setResultsOpen(false);
        });
    }, 150);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [q]);

  async function addByBarcode(code: string) {
    const trimmed = code.trim();
    if (!trimmed) return;

    const existing = cart.find((c) => c.barcode === trimmed);
    if (existing) {
      if (existing.stock <= 0) {
        toast.error("Out of stock");
        return;
      }
      if (existing.quantity + 1 > existing.stock) {
        toast.error(`Only ${existing.stock} in stock`);
        return;
      }
      setCart((prev) =>
        prev.map((c) => (c.barcode === trimmed ? { ...c, quantity: c.quantity + 1 } : c))
      );
      return;
    }

    const product = await getProductByBarcode(trimmed);
    if (!product) {
      toast.error("Product not found");
      return;
    }
    const p = product.product;
    const variantLabel = product.variant
      ? [product.variant.size, product.variant.colorName ?? product.variant.colorHex]
          .filter(Boolean)
          .join(" / ")
      : "";
    const displayName = variantLabel ? `${p.name} (${variantLabel})` : p.name;
    const priceCents = product.variant ? product.variant.priceCents : p.priceCents;
    const stockValue = product.variant ? product.variant.stock : p.stock;

    if (stockValue <= 0) {
      toast.error("Out of stock");
      return;
    }
    setCart((prev) => [
      ...prev,
      {
        barcode: trimmed,
        name: displayName,
        priceCents,
        costCents: p.costCents,
        stock: stockValue,
        quantity: 1,
        discountCents: 0,
      },
    ]);
  }

  async function onBarcodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await addByBarcode(barcode);
      setBarcode("");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to add"));
    } finally {
      barcodeRef.current?.focus();
    }
  }

  async function onCompleteSale() {
    if (cart.length === 0) return;
    setLoading(true);
    try {
      await completeSale({
        userId: data?.user?.id,
        items: cart.map((c) => ({
          barcode: c.barcode,
          quantity: c.quantity,
          discountCents: Math.min(c.discountCents, c.priceCents * c.quantity),
        })),
      });
      toast.success("Sale completed");
      setCart([]);
      setBarcode("");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Sale failed"));
    } finally {
      setLoading(false);
      barcodeRef.current?.focus();
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Sell</div>
          <div className="text-xs text-muted-foreground">
            Scan barcode → Enter → complete sale.
          </div>
        </div>
        <Button variant="outline" onClick={() => setScannerOpen(true)}>
          Camera scan
        </Button>
      </div>

      <FormCard title="Sell items" description="Scan barcode, search items, and complete the sale from one place.">
        <form onSubmit={onBarcodeSubmit} className="flex items-center gap-2">
          <Input
            ref={barcodeRef}
            autoFocus
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder="Barcode"
            className="font-mono"
          />
          <Button type="submit">Add</Button>
        </form>

        <div className="relative mt-4">
          <div className="mb-1 text-xs text-muted-foreground">Search product</div>
          <Input
            ref={searchRef}
            value={q}
            onChange={(e) => {
              const value = e.target.value;
              setQ(value);
              if (value.trim().length < 2) {
                setResults([]);
                setResultsOpen(false);
                setSelectedIndex(0);
              }
            }}
            onFocus={() => {
              if (results.length > 0) setResultsOpen(true);
            }}
            onKeyDown={(e) => {
              if (!resultsOpen) return;
              if (e.key === "Escape") {
                setResultsOpen(false);
                return;
              }
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex((i) => Math.min(i + 1, Math.max(0, results.length - 1)));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((i) => Math.max(i - 1, 0));
              }
              if (e.key === "Enter") {
                e.preventDefault();
                const picked = results[selectedIndex];
                if (!picked) return;
                if (picked.stock <= 0) {
                  toast.error("Out of stock");
                  return;
                }
                addByBarcode(picked.barcode)
                  .then(() => {
                    setQ("");
                    setResults([]);
                    setResultsOpen(false);
                    barcodeRef.current?.focus();
                  })
                  .catch((err: unknown) => toast.error(getErrorMessage(err, "Failed to add")));
              }
            }}
            placeholder="Type name or barcode (min 2 chars)"
          />
          {resultsOpen ? (
            <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border bg-white">
            {results.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">No results</div>
            ) : (
              <div className="max-h-64 overflow-auto">
                {results.map((r, idx) => {
                  const active = idx === selectedIndex;
                  const lowStock = r.stock <= 0;
                  return (
                    <button
                      key={r.barcode}
                      type="button"
                      className={[
                        "flex w-full items-center justify-between gap-3 border-b px-3 py-2 text-left last:border-b-0",
                        active ? "bg-muted" : "hover:bg-muted/50",
                      ].join(" ")}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      onClick={() => {
                        if (r.stock <= 0) {
                          toast.error("Out of stock");
                          return;
                        }
                        addByBarcode(r.barcode)
                          .then(() => {
                            setQ("");
                            setResults([]);
                            setResultsOpen(false);
                            barcodeRef.current?.focus();
                          })
                          .catch((err: unknown) =>
                            toast.error(getErrorMessage(err, "Failed to add"))
                          );
                      }}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="truncate text-sm font-medium">{r.name}</div>
                          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                            {r.kind === "variant" ? "Variant" : "Product"}
                          </span>
                        </div>
                        {r.variantLabel ? (
                          <div className="mt-0.5 text-[11px] text-muted-foreground">
                            Option: {r.variantLabel}
                          </div>
                        ) : null}
                        <div className="mt-1 flex items-center gap-2">
                          <div className="origin-left scale-[0.65]">
                            <Code39Barcode value={r.barcode} height={38} narrow={2} wide={5} quiet={10} />
                          </div>
                          <div className="truncate font-mono text-[11px] text-muted-foreground">
                            {r.barcode}
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0 text-right text-xs text-muted-foreground">
                        <div>{formatCents(r.priceCents)}</div>
                        <div className={lowStock ? "mt-0.5 text-sm font-semibold text-red-600" : "mt-0.5 text-sm font-semibold text-foreground"}>
                          {r.stock}
                        </div>
                        <div>Stock</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            </div>
          ) : null}
        </div>

        <div className="mt-4 rounded-sm border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Disc</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cart.map((item) => (
                <TableRow key={item.barcode}>
                  <TableCell>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{item.barcode}</div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      In stock: {item.stock}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() =>
                          setCart((prev) =>
                            prev
                              .map((c) =>
                                c.barcode === item.barcode
                                  ? { ...c, quantity: Math.max(1, c.quantity - 1) }
                                  : c
                              )
                              .filter((c) => c.quantity > 0)
                          )
                        }
                        type="button"
                      >
                        -
                      </Button>
                    <Input
                      value={String(item.quantity)}
                      onChange={(e) => {
                        const raw = Number(e.target.value) || 1;
                        const n = Math.max(1, Math.min(item.stock || 1, raw));
                        if (raw > item.stock) toast.error(`Only ${item.stock} in stock`);
                        setCart((prev) =>
                          prev.map((c) => (c.barcode === item.barcode ? { ...c, quantity: n } : c))
                        );
                      }}
                      className="h-8 w-16 text-right"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      disabled={item.quantity >= item.stock}
                      onClick={() =>
                        setCart((prev) => {
                          const current = prev.find((c) => c.barcode === item.barcode);
                          if (!current) return prev;
                          if (current.quantity + 1 > current.stock) {
                            toast.error(`Only ${current.stock} in stock`);
                            return prev;
                          }
                          return prev.map((c) =>
                            c.barcode === item.barcode ? { ...c, quantity: c.quantity + 1 } : c
                          );
                        })
                      }
                      type="button"
                    >
                      +
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="text-right">{formatCents(item.priceCents)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end">
                    <Input
                      type="number"
                      step="0.01"
                      value={(item.discountCents / 100).toFixed(2)}
                      onChange={(e) => {
                        const cents = toCents(e.target.value);
                        const max = item.priceCents * item.quantity;
                        setCart((prev) =>
                          prev.map((c) =>
                            c.barcode === item.barcode
                              ? { ...c, discountCents: Math.min(Math.max(0, cents), max) }
                              : c
                          )
                        );
                      }}
                      className="h-8 w-24 text-right"
                    />
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {formatCents(
                    item.priceCents * item.quantity -
                      Math.min(item.discountCents, item.priceCents * item.quantity)
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => setCart((prev) => prev.filter((c) => c.barcode !== item.barcode))}
                  >
                    Remove
                  </Button>
                </TableCell>
              </TableRow>
            ))}
              {cart.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                    Cart is empty
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div />
          <div className="space-y-1 text-right">
            <div className="text-xs text-muted-foreground">Total</div>
            <div className="text-lg font-semibold">{formatCents(totalCents)}</div>
            <Button disabled={loading || cart.length === 0} onClick={onCompleteSale}>
              {loading ? "Processing..." : "Complete sale"}
            </Button>
          </div>
        </div>
      </FormCard>

      <ScanDialog
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onScan={(code) => {
          addByBarcode(code).catch(() => {});
          toast.success("Scanned");
        }}
      />
    </div>
  );
}
