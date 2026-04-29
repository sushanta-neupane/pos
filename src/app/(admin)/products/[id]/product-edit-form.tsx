"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Product, ProductVariant } from "@prisma/client";
import { updateProduct } from "@/actions/product.actions";
import { formatCents, fromCents, toCents } from "@/lib/money";
import { getErrorMessage } from "@/lib/errors";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormCard, PageTitle } from "@/components/form-shell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ProductWithVariants = Product & {
  variants: ProductVariant[];
};

type VariantEdit = {
  id?: string;
  rowKey: string;
  size: string;
  colorName: string;
  colorHex: string;
  barcode: string;
  price: string;
  cost: string;
  stock: number;
  isNew: boolean;
};

export function ProductEditForm({ product }: { product: ProductWithVariants }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const [name, setName] = React.useState(product.name);
  const [price, setPrice] = React.useState(fromCents(product.priceCents));
  const [cost, setCost] = React.useState(fromCents(product.costCents));
  const [isTrending, setIsTrending] = React.useState(product.isTrending);
  const [lowStockThreshold, setLowStockThreshold] = React.useState(
    String(product.lowStockThreshold)
  );
  const [variantEdits, setVariantEdits] = React.useState<VariantEdit[]>(() =>
    product.variants.map((variant) => ({
      id: variant.id,
      rowKey: variant.id,
      size: variant.size ?? "",
      colorName: variant.colorName ?? "",
      colorHex: variant.colorHex ?? "",
      barcode: variant.barcode,
      price: fromCents(variant.priceCents),
      cost: fromCents(variant.costCents ?? product.costCents),
      stock: variant.stock,
      isNew: false,
    }))
  );

  const variantTotals = React.useMemo(() => {
    return variantEdits.reduce(
      (sum, variant) => ({
        priceCents: sum.priceCents + toCents(variant.price),
        costCents: sum.costCents + toCents(variant.cost),
        stock: sum.stock + variant.stock,
      }),
      { priceCents: 0, costCents: 0, stock: 0 }
    );
  }, [variantEdits]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProduct({
        id: product.id,
        name: name.trim(),
        priceCents: toCents(price),
        costCents: toCents(cost),
        isTrending,
        lowStockThreshold: Number(lowStockThreshold) || 0,
        variants: variantEdits.map((variant) => ({
          ...(variant.id ? { id: variant.id } : {}),
          size: variant.size.trim() || undefined,
          colorName: variant.colorName.trim() || undefined,
          colorHex: variant.colorHex.trim() || undefined,
          barcode: variant.barcode.trim(),
          priceCents: toCents(variant.price),
          costCents: toCents(variant.cost),
          stock: variant.stock,
        })),
      });
      toast.success("Saved");
      router.refresh();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to save"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageTitle
        title="Edit Product"
        subtitle="Update pricing, thresholds, and flags."
        right={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => window.open(`/products/${product.id}/print`, "_blank")}
            >
              Print
            </Button>
            <Button variant="outline" onClick={() => router.push("/products")}>
              Back
            </Button>
          </div>
        }
      />

      <FormCard
        title="Product details"
        description={
          product.variants.length > 0
            ? `Base barcode: ${product.barcode} · ${product.variants.length} variants`
            : `Barcode: ${product.barcode}`
        }
      >
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <div className="text-sm font-medium">Name of Product</div>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 rounded-md"
            />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Selling Price (Rs)</div>
            <Input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="h-11 rounded-md"
            />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Cost Price (Rs)</div>
            <Input
              type="number"
              step="0.01"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className="h-11 rounded-md"
            />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Current Stock</div>
            <Input value={String(product.stock)} disabled className="h-11 rounded-md" />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Low Stock Threshold</div>
            <Input
              type="number"
              step="1"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(e.target.value)}
              className="h-11 rounded-md"
            />
          </div>

          {variantEdits.length > 0 ? (
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">Variants</div>
                  <div className="text-xs text-muted-foreground">
                    Edit existing variants and add new ones here. New rows can include starting stock.
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setVariantEdits((prev) => [
                      ...prev,
                      {
                        rowKey: `new-${Date.now()}-${prev.length}`,
                        size: "",
                        colorName: "",
                        colorHex: "#000000",
                        barcode: "",
                        price: price,
                        cost: cost,
                        stock: 0,
                        isNew: true,
                      },
                    ])
                  }
                >
                  Add variant
                </Button>
              </div>
              <div className="rounded-sm border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Size</TableHead>
                      <TableHead>Color Name</TableHead>
                      <TableHead>Color</TableHead>
                      <TableHead>Variant Code</TableHead>
                      <TableHead className="text-right">Price (Rs)</TableHead>
                      <TableHead className="text-right">Cost (Rs)</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {variantEdits.map((variant, index) => (
                      <TableRow key={variant.rowKey}>
                        <TableCell>
                          <Input
                            value={variant.size}
                            onChange={(e) =>
                              setVariantEdits((prev) =>
                                prev.map((item, itemIndex) =>
                                  itemIndex === index ? { ...item, size: e.target.value } : item
                                )
                              )
                            }
                            className="h-9 min-w-24"
                            placeholder="Size"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={variant.colorName}
                            onChange={(e) =>
                              setVariantEdits((prev) =>
                                prev.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? { ...item, colorName: e.target.value }
                                    : item
                                )
                              )
                            }
                            className="h-9 min-w-32"
                            placeholder="Color name"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={variant.colorHex || "#000000"}
                              onChange={(e) =>
                                setVariantEdits((prev) =>
                                  prev.map((item, itemIndex) =>
                                    itemIndex === index
                                      ? { ...item, colorHex: e.target.value }
                                      : item
                                  )
                                )
                              }
                              className="h-9 w-12 rounded-sm border bg-background p-1"
                              aria-label={`Variant ${index + 1} color`}
                            />
                            <span className="font-mono text-xs text-muted-foreground">
                              {(variant.colorHex || "#000000").toUpperCase()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={variant.barcode}
                            onChange={(e) =>
                              setVariantEdits((prev) =>
                                prev.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? { ...item, barcode: e.target.value }
                                    : item
                                )
                              )
                            }
                            className="h-9 min-w-40"
                            placeholder="Variant code"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end">
                            <Input
                              type="number"
                              step="0.01"
                              value={variant.price}
                              onChange={(e) =>
                                setVariantEdits((prev) =>
                                  prev.map((item, itemIndex) =>
                                    itemIndex === index ? { ...item, price: e.target.value } : item
                                  )
                                )
                              }
                              className="h-9 w-28 text-right"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end">
                            <Input
                              type="number"
                              step="0.01"
                              value={variant.cost}
                              onChange={(e) =>
                                setVariantEdits((prev) =>
                                  prev.map((item, itemIndex) =>
                                    itemIndex === index ? { ...item, cost: e.target.value } : item
                                  )
                                )
                              }
                              className="h-9 w-28 text-right"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {variant.isNew ? (
                            <div className="flex justify-end">
                              <Input
                                type="number"
                                step="1"
                                value={String(variant.stock)}
                                onChange={(e) =>
                                  setVariantEdits((prev) =>
                                    prev.map((item, itemIndex) =>
                                      itemIndex === index
                                        ? { ...item, stock: Number(e.target.value) || 0 }
                                        : item
                                    )
                                  )
                                }
                                className="h-9 w-24 text-right"
                              />
                            </div>
                          ) : (
                            <div className="font-medium">{variant.stock}</div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {variant.isNew ? (
                            <div className="flex justify-end">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                  setVariantEdits((prev) =>
                                    prev.filter((item) => item.rowKey !== variant.rowKey)
                                  )
                                }
                              >
                                Remove
                              </Button>
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground">Existing</div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-gray-50 dark:bg-white/[0.03]">
                      <TableCell colSpan={4}>
                        <div className="text-sm font-semibold">Total</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-medium">{formatCents(variantTotals.priceCents)}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-medium">{formatCents(variantTotals.costCents)}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-medium">{variantTotals.stock}</div>
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">Variants</div>
                  <div className="text-xs text-muted-foreground">
                    This product has no variants yet. Add one or more variant rows here.
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setVariantEdits([
                      {
                        rowKey: `new-${Date.now()}`,
                        size: "",
                        colorName: "",
                        colorHex: "#000000",
                        barcode: "",
                        price: price,
                        cost: cost,
                        stock: 0,
                        isNew: true,
                      },
                    ])
                  }
                >
                  Add variant
                </Button>
              </div>
            </div>
          )}

          <div className="md:col-span-2 flex items-center justify-between gap-3 pt-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isTrending}
                onChange={(e) => setIsTrending(e.target.checked)}
              />
              Trending
            </label>

            <div className="flex items-center gap-2">
              <Button disabled={loading} type="submit">
                {loading ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </div>
        </form>
      </FormCard>
    </div>
  );
}
