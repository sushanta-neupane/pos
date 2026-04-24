import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/money";
import { authOptions } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Code39Barcode } from "@/components/barcode/code39";
import { ProductRowActions } from "./product-row-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await getServerSession(authOptions);

  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const products = await prisma.product.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { barcode: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Products</div>
          <div className="text-xs text-muted-foreground">
            {query ? `Results for “${query}”` : "All products"}
          </div>
        </div>
        <Button asChild>
          <Link href="/products/new">New product</Link>
        </Button>
      </div>

      <div className="rounded-sm border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Barcode</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead>Trending</TableHead>
              <TableHead className="text-right">Low</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => {
              const low = p.stock < p.lowStockThreshold;
              return (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>
                    <div className="grid gap-1">
                      <div className="overflow-hidden">
                        <div className="origin-left scale-[0.7]">
                          <Code39Barcode
                            value={p.barcode}
                            height={44}
                            narrow={2}
                            wide={5}
                            quiet={10}
                            title={p.barcode}
                          />
                        </div>
                      </div>
                      <div className="font-mono text-[11px] text-muted-foreground">
                        {p.barcode}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{formatCents(p.priceCents)}</TableCell>
                  <TableCell className="text-right">{formatCents(p.costCents)}</TableCell>
                  <TableCell className={low ? "text-right text-red-600" : "text-right"}>
                    {p.stock}
                  </TableCell>
                  <TableCell>{p.isTrending ? "Yes" : "No"}</TableCell>
                  <TableCell className="text-right">{p.lowStockThreshold}</TableCell>
                  <TableCell className="text-right">
                    <ProductRowActions id={p.id} />
                  </TableCell>
                </TableRow>
              );
            })}
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
                  No products
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
