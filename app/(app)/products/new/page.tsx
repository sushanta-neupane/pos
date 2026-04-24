"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createProduct } from "@/actions/product.actions";
import { toCents } from "@/lib/money";
import { getErrorMessage } from "@/lib/errors";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormCard, PageTitle } from "@/components/form-shell";

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const [name, setName] = React.useState("");
  const [price, setPrice] = React.useState("0");
  const [cost, setCost] = React.useState("0");
  const [stock, setStock] = React.useState("0");
  const [isTrending, setIsTrending] = React.useState(false);
  const [lowStockThreshold, setLowStockThreshold] = React.useState("5");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const product = await createProduct({
        name: name.trim(),
        priceCents: toCents(price),
        costCents: toCents(cost),
        stock: Number(stock) || 0,
        isTrending,
        lowStockThreshold: Number(lowStockThreshold) || 0,
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
        description="Barcode is generated automatically on create."
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
              className="h-11 rounded-md"
            />
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
