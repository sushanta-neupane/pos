"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Product } from "@prisma/client";
import { updateProduct } from "@/actions/product.actions";
import { fromCents, toCents } from "@/lib/money";
import { getErrorMessage } from "@/lib/errors";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormCard, PageTitle } from "@/components/form-shell";

export function ProductEditForm({ product }: { product: Product }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const [name, setName] = React.useState(product.name);
  const [price, setPrice] = React.useState(fromCents(product.priceCents));
  const [cost, setCost] = React.useState(fromCents(product.costCents));
  const [isTrending, setIsTrending] = React.useState(product.isTrending);
  const [lowStockThreshold, setLowStockThreshold] = React.useState(
    String(product.lowStockThreshold)
  );

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
        description={`Barcode: ${product.barcode}`}
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
