import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/money";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [salesAgg, profitAgg, lowStockCandidates, trending] = await Promise.all([
    prisma.transaction.aggregate({ _sum: { totalCents: true } }),
    prisma.transaction.aggregate({ _sum: { profitCents: true } }),
    prisma.product.findMany({
      orderBy: { stock: "asc" },
      take: 60,
    }),
    prisma.product.findMany({
      where: { isTrending: true },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
  ]);
  const lowStock = lowStockCandidates.filter((p) => p.stock < p.lowStockThreshold).slice(0, 20);

  const totalSales = salesAgg._sum.totalCents ?? 0;
  const totalProfit = profitAgg._sum.profitCents ?? 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-primary">Overview</div>
        <Link
          href="/dashboard/users"
          className="text-sm underline underline-offset-4 text-primary/80 hover:text-primary"
        >
          Manage users
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-4 sm:grid-cols-2">
        <Card className="rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Total Revenue</div>
                <div className="text-2xl font-semibold tracking-tight">{formatCents(totalSales)}</div>
              </div>
              <div className="h-10 w-10 rounded-xl border bg-background grid place-items-center text-muted-foreground">
                Rs
              </div>
            </div>
            <div className="mt-3">
              <Badge variant="success">+—%</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Profit</div>
                <div className="text-2xl font-semibold tracking-tight">{formatCents(totalProfit)}</div>
              </div>
              <div className="h-10 w-10 rounded-xl border bg-background grid place-items-center text-muted-foreground">
                P
              </div>
            </div>
            <div className="mt-3">
              <Badge variant="neutral">—</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Low stock</div>
                <div className="text-2xl font-semibold tracking-tight">{lowStock.length}</div>
              </div>
              <div className="h-10 w-10 rounded-xl border bg-background grid place-items-center text-muted-foreground">
                !
              </div>
            </div>
            <div className="mt-3">
              <Badge variant={lowStock.length ? "danger" : "success"}>
                {lowStock.length ? "Needs attention" : "OK"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Trending</div>
                <div className="text-2xl font-semibold tracking-tight">{trending.length}</div>
              </div>
              <div className="h-10 w-10 rounded-xl border bg-background grid place-items-center text-muted-foreground">
                T
              </div>
            </div>
            <div className="mt-3">
              <Badge variant="neutral">Last updated</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Low stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-sm border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Threshold</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStock.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-right text-red-600">{p.stock}</TableCell>
                      <TableCell className="text-right">{p.lowStockThreshold}</TableCell>
                    </TableRow>
                  ))}
                  {lowStock.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                        No low-stock items
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Trending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-sm border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trending.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-right">{p.stock}</TableCell>
                    </TableRow>
                  ))}
                  {trending.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-sm text-muted-foreground">
                        No trending products
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
