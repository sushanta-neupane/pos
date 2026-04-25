"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createProduct } from "@/actions/product.actions";
import { formatCents, fromCents, toCents } from "@/lib/money";
import { getErrorMessage } from "@/lib/errors";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormCard, PageTitle } from "@/components/form-shell";
import { MultiSelect } from "@/components/ui/multi-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const [name, setName] = React.useState("");
  const [price, setPrice] = React.useState("0");
  const [cost, setCost] = React.useState("0");
  const [stock, setStock] = React.useState("0");
  const [isTrending, setIsTrending] = React.useState(false);
  const [lowStockThreshold, setLowStockThreshold] = React.useState("5");
  const [hasVariants, setHasVariants] = React.useState(false);
  const [selectedSizes, setSelectedSizes] = React.useState<string[]>([]);
  const [availableSizes, setAvailableSizes] = React.useState<string[]>(["S", "M", "L", "XL"]);
  const [colors, setColors] = React.useState<Array<{ name: string; hex: string }>>([]);
  const [colorName, setColorName] = React.useState("");
  const [colorHex, setColorHex] = React.useState("#000000");
  const [variantEdits, setVariantEdits] = React.useState<
    Record<
      string,
      { price: string; cost: string; stock: string; size?: string; colorName?: string; colorHex?: string }
    >
  >({});

  const defaultVariantPrice = React.useMemo(() => fromCents(toCents(price)), [price]);
  const defaultVariantCost = React.useMemo(() => fromCents(toCents(cost)), [cost]);
  const [applyAllPrice, setApplyAllPrice] = React.useState(() => fromCents(toCents(price)));
  const [applyAllCost, setApplyAllCost] = React.useState(() => fromCents(toCents(cost)));
  const [applyAllStock, setApplyAllStock] = React.useState("0");

  const combos = React.useMemo(() => {
    if (!hasVariants) return [];
    const sizes = selectedSizes.length ? selectedSizes : [""];
    const cols = colors.length ? colors : [{ name: "", hex: "" }];
    const out: Array<{ key: string; size?: string; colorName?: string; colorHex?: string }> = [];
    for (const s of sizes) {
      for (const c of cols) {
        const colorKey = (c.hex || c.name || "").toLowerCase();
        out.push({
          key: `${(s || "").toLowerCase()}|${colorKey}`,
          size: s || undefined,
          colorName: c.name || undefined,
          colorHex: c.hex || undefined,
        });
      }
    }
    return out;
  }, [colors, hasVariants, selectedSizes]);

  function reconcile(nextCombos: typeof combos) {
    const next: typeof variantEdits = {};
    for (const c of nextCombos) {
      next[c.key] = variantEdits[c.key] ?? {
        price: defaultVariantPrice,
        cost: defaultVariantCost,
        stock: "0",
        size: c.size,
        colorName: c.colorName,
        colorHex: c.colorHex,
      };
      next[c.key] = {
        ...next[c.key],
        size: c.size,
        colorName: c.colorName,
        colorHex: c.colorHex,
      };
    }
    setVariantEdits(next);
  }

  function onSizesChange(next: string[]) {
    setSelectedSizes(next);
    const merged = Array.from(new Set([...availableSizes, ...next]));
    setAvailableSizes(merged);
    if (hasVariants) {
      const nextCombos = (() => {
        const sizes = next.length ? next : [""];
        const cols = colors.length ? colors : [{ name: "", hex: "" }];
        const out: Array<{ key: string; size?: string; colorName?: string; colorHex?: string }> = [];
        for (const s of sizes) {
          for (const c of cols) {
            const colorKey = (c.hex || c.name || "").toLowerCase();
            out.push({
              key: `${(s || "").toLowerCase()}|${colorKey}`,
              size: s || undefined,
              colorName: c.name || undefined,
              colorHex: c.hex || undefined,
            });
          }
        }
        return out;
      })();
      reconcile(nextCombos);
    }
  }

  function addColor() {
    const name = colorName.trim();
    const hex = colorHex.trim().toLowerCase();
    if (!hex) return;
    const exists = colors.some((c) => c.hex.toLowerCase() === hex);
    if (exists) return;
    const next = [...colors, { name, hex }];
    setColors(next);
    setColorName("");
    if (hasVariants) {
      const nextCombos = (() => {
        const sizes = selectedSizes.length ? selectedSizes : [""];
        const cols = next.length ? next : [{ name: "", hex: "" }];
        const out: Array<{ key: string; size?: string; colorName?: string; colorHex?: string }> = [];
        for (const s of sizes) {
          for (const c of cols) {
            const colorKey = (c.hex || c.name || "").toLowerCase();
            out.push({
              key: `${(s || "").toLowerCase()}|${colorKey}`,
              size: s || undefined,
              colorName: c.name || undefined,
              colorHex: c.hex || undefined,
            });
          }
        }
        return out;
      })();
      reconcile(nextCombos);
    }
  }

  function removeColor(hex: string) {
    const next = colors.filter((c) => c.hex !== hex);
    setColors(next);
    if (hasVariants) {
      const nextCombos = (() => {
        const sizes = selectedSizes.length ? selectedSizes : [""];
        const cols = next.length ? next : [{ name: "", hex: "" }];
        const out: Array<{ key: string; size?: string; colorName?: string; colorHex?: string }> = [];
        for (const s of sizes) {
          for (const c of cols) {
            const colorKey = (c.hex || c.name || "").toLowerCase();
            out.push({
              key: `${(s || "").toLowerCase()}|${colorKey}`,
              size: s || undefined,
              colorName: c.name || undefined,
              colorHex: c.hex || undefined,
            });
          }
        }
        return out;
      })();
      reconcile(nextCombos);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const variants = hasVariants
        ? combos.map((c) => {
            const edit = variantEdits[c.key] ?? {
              price: defaultVariantPrice,
              cost: defaultVariantCost,
              stock: "0",
            };
            return {
              size: c.size,
              colorName: c.colorName,
              colorHex: c.colorHex,
              priceCents: toCents(edit.price),
              costCents: toCents(edit.cost),
              stock: Number(edit.stock) || 0,
            };
          })
        : [];

      const product = await createProduct({
        name: name.trim(),
        priceCents: toCents(price),
        costCents: toCents(cost),
        stock: Number(stock) || 0,
        isTrending,
        lowStockThreshold: Number(lowStockThreshold) || 0,
        ...(hasVariants ? { variants } : {}),
      });
      toast.success("Product created");
      router.push(`/products/${product.id}`);
      router.refresh();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to create product"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageTitle
        title="New Product"
        subtitle="Add a new product to your inventory."
        right={
          <Button variant="outline" onClick={() => router.push("/products")}>
            Back
          </Button>
        }
      />

      <FormCard
        title="Product onboarding"
        description="Barcode is generated automatically on create. If variants are enabled, each size/color combination gets its own barcode."
      >
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <div className="text-sm font-medium">Name of Product</div>
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Product name"
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
            <div className="text-sm font-medium">Initial Stock</div>
            <Input
              type="number"
              step="1"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              disabled={hasVariants}
              className="h-11 rounded-md"
            />
            {hasVariants ? (
              <div className="text-[11px] text-muted-foreground">
                Set stock per-variant below.
              </div>
            ) : null}
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

          <div className="space-y-2 md:col-span-2">
            <div className="text-sm font-medium">Variants</div>
            <div className="flex items-center gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="variants"
                  checked={!hasVariants}
                  onChange={() => {
                    setHasVariants(false);
                    setSelectedSizes([]);
                    setColors([]);
                    setVariantEdits({});
                  }}
                />
                No variants
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="variants"
                  checked={hasVariants}
                  onChange={() => {
                    setHasVariants(true);
                    setApplyAllPrice(defaultVariantPrice);
                    setApplyAllCost(defaultVariantCost);
                    setApplyAllStock("0");
                    const nextCombos = (() => {
                      const sizes = selectedSizes.length ? selectedSizes : [""];
                      const cols = colors.length ? colors : [{ name: "", hex: "" }];
                      const out: Array<{
                        key: string;
                        size?: string;
                        colorName?: string;
                        colorHex?: string;
                      }> = [];
                      for (const s of sizes) {
                        for (const c of cols) {
                          const colorKey = (c.hex || c.name || "").toLowerCase();
                          out.push({
                            key: `${(s || "").toLowerCase()}|${colorKey}`,
                            size: s || undefined,
                            colorName: c.name || undefined,
                            colorHex: c.hex || undefined,
                          });
                        }
                      }
                      return out;
                    })();
                    reconcile(nextCombos);
                  }}
                />
                Has variants (Size / Color)
              </label>
            </div>
            {hasVariants ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">Sizes (multi-select)</div>
                  <MultiSelect
                    options={availableSizes}
                    value={selectedSizes}
                    onChange={onSizesChange}
                    placeholder="Select sizes"
                    customPlaceholder="Add size (e.g. XXL)"
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">Colors (picker)</div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={colorHex}
                      onChange={(e) => setColorHex(e.target.value)}
                      className="h-11 w-14 rounded-sm border bg-background p-1"
                      aria-label="Pick color"
                    />
                    <Input
                      value={colorName}
                      onChange={(e) => setColorName(e.target.value)}
                      placeholder="Name (optional)"
                      className="h-11 rounded-md"
                    />
                    <Button type="button" onClick={addColor} className="h-11">
                      Add
                    </Button>
                  </div>
                  {colors.length ? (
                    <div className="flex flex-wrap gap-2">
                      {colors.map((c) => (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => removeColor(c.hex)}
                          className="inline-flex items-center gap-2 rounded-sm border bg-background px-2 py-1 text-xs hover:bg-muted/50"
                          title="Click to remove"
                        >
                          <span
                            className="h-3 w-3 rounded-sm border"
                            style={{ backgroundColor: c.hex }}
                          />
                          <span className="font-mono">{c.hex.toUpperCase()}</span>
                          {c.name ? <span className="text-muted-foreground">{c.name}</span> : null}
                          <span className="text-muted-foreground">×</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      Add one or more colors to generate combinations.
                    </div>
                  )}
                </div>

                <div className="md:col-span-2 rounded-sm border">
                  <div className="border-b px-3 py-2">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="text-sm font-medium">Variant pricing & stock</div>
                        <div className="text-xs text-muted-foreground">
                          {combos.length} combinations · default price {formatCents(toCents(price))}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          value={applyAllPrice}
                          onChange={(e) => setApplyAllPrice(e.target.value)}
                          className="h-9 w-28 text-right"
                          placeholder="Price"
                        />
                        <Input
                          type="number"
                          step="0.01"
                          value={applyAllCost}
                          onChange={(e) => setApplyAllCost(e.target.value)}
                          className="h-9 w-28 text-right"
                          placeholder="Cost"
                        />
                        <Input
                          type="number"
                          step="1"
                          value={applyAllStock}
                          onChange={(e) => setApplyAllStock(e.target.value)}
                          className="h-9 w-24 text-right"
                          placeholder="Stock"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          disabled={combos.length === 0}
                          onClick={() => {
                            const next: typeof variantEdits = { ...variantEdits };
                            for (const c of combos) {
                              next[c.key] = {
                                ...(next[c.key] ?? {
                                  price: defaultVariantPrice,
                                  cost: defaultVariantCost,
                                  stock: "0",
                                }),
                                price: applyAllPrice,
                                cost: applyAllCost,
                                stock: applyAllStock,
                                size: c.size,
                                colorName: c.colorName,
                                colorHex: c.colorHex,
                              };
                            }
                            setVariantEdits(next);
                          }}
                          className="h-9"
                        >
                          Apply to all
                        </Button>
                      </div>
                    </div>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Variant</TableHead>
                        <TableHead className="text-right">Price (Rs)</TableHead>
                        <TableHead className="text-right">Cost (Rs)</TableHead>
                        <TableHead className="text-right">Stock</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {combos.map((c) => {
                        const edit = variantEdits[c.key] ?? {
                          price: defaultVariantPrice,
                          cost: defaultVariantCost,
                          stock: "0",
                        };
                        const label = [c.size, c.colorName ?? c.colorHex]
                          .filter(Boolean)
                          .join(" / ");
                        return (
                          <TableRow key={c.key}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {c.colorHex ? (
                                  <span
                                    className="h-3 w-3 rounded-sm border"
                                    style={{ backgroundColor: c.colorHex }}
                                  />
                                ) : null}
                                <div className="text-sm font-medium">{label || "Default"}</div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={edit.price}
                                  onChange={(e) =>
                                    setVariantEdits((prev) => ({
                                      ...prev,
                                      [c.key]: {
                                        ...(prev[c.key] ?? {
                                          price: defaultVariantPrice,
                                          cost: defaultVariantCost,
                                          stock: "0",
                                        }),
                                        price: e.target.value,
                                      },
                                    }))
                                  }
                                  className="h-9 w-32 text-right"
                                />
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={edit.cost}
                                  onChange={(e) =>
                                    setVariantEdits((prev) => ({
                                      ...prev,
                                      [c.key]: {
                                        ...(prev[c.key] ?? {
                                          price: defaultVariantPrice,
                                          cost: defaultVariantCost,
                                          stock: "0",
                                        }),
                                        cost: e.target.value,
                                      },
                                    }))
                                  }
                                  className="h-9 w-32 text-right"
                                />
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end">
                                <Input
                                  type="number"
                                  step="1"
                                  value={edit.stock}
                                  onChange={(e) =>
                                    setVariantEdits((prev) => ({
                                      ...prev,
                                      [c.key]: {
                                        ...(prev[c.key] ?? {
                                          price: defaultVariantPrice,
                                          cost: defaultVariantCost,
                                          stock: "0",
                                        }),
                                        stock: e.target.value,
                                      },
                                    }))
                                  }
                                  className="h-9 w-24 text-right"
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {combos.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                            Select sizes and/or add colors to generate variants.
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : null}
          </div>

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
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/products")}
              >
                Cancel
              </Button>
              <Button disabled={loading} type="submit">
                {loading ? "Creating..." : "Create product"}
              </Button>
            </div>
          </div>
        </form>
      </FormCard>
    </div>
  );
}
