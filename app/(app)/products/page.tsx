import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { formatCents } from "@/lib/money";
import { authOptions } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ProductRowActions } from "./product-row-actions";
import { ProductBarcodeCell } from "./product-barcode-cell";
import { prisma } from "@/lib/prisma";
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
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  await getServerSession(authOptions);

  const { q, page: pageParam } = await searchParams;
  const query = (q ?? "").trim();

  const page = Math.max(1, Number(pageParam) || 1);
  const pageSize = 25;

  const where = query
    ? {
        OR: [
          { name: { contains: query, mode: "insensitive" as const } },
          { barcode: { contains: query, mode: "insensitive" as const } },
          { variants: { some: { barcode: { contains: query, mode: "insensitive" as const } } } },
        ],
      }
    : undefined;

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        barcode: true,
        priceCents: true,
        costCents: true,
        stock: true,
        isTrending: true,
        lowStockThreshold: true,
        variants: {
          select: {
            id: true,
            size: true,
            colorName: true,
            colorHex: true,
            key: true,
            barcode: true,
          },
        },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

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
                    <ProductBarcodeCell barcode={p.barcode} variants={p.variants} />
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

      <div className="flex items-center justify-between text-sm">
        <div className="text-xs text-muted-foreground">
          Page {page} of {totalPages} · {total} total
        </div>
        <div className="flex items-center gap-2">
          {page <= 1 ? (
            <Button variant="outline" disabled>
              Prev
            </Button>
          ) : (
            <Button asChild variant="outline">
              <Link
                href={{
                  pathname: "/products",
                  query: {
                    ...(query ? { q: query } : {}),
                    page: String(Math.max(1, page - 1)),
                  },
                }}
              >
                Prev
              </Link>
            </Button>
          )}
          {page >= totalPages ? (
            <Button variant="outline" disabled>
              Next
            </Button>
          ) : (
            <Button asChild variant="outline">
              <Link
                href={{
                  pathname: "/products",
                  query: {
                    ...(query ? { q: query } : {}),
                    page: String(Math.min(totalPages, page + 1)),
                  },
                }}
              >
                Next
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
