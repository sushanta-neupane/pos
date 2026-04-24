import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  const items = await prisma.product.findMany({
    where: {
      isTrending: true,
      // Prisma Mongo can't compare two fields; we filter in JS for correctness.
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  const alerts = items.filter((p) => p.stock < p.lowStockThreshold);

  return (
    <div className="max-w-3xl space-y-3">
      <Card>
        <CardHeader>
          <CardTitle>Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground mb-3">
            Trending products below low-stock threshold.
          </div>
          <div className="rounded-sm border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Threshold</TableHead>
                  <TableHead>Last email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="font-mono text-xs">{p.barcode}</TableCell>
                    <TableCell className="text-right text-red-600">{p.stock}</TableCell>
                    <TableCell className="text-right">{p.lowStockThreshold}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {p.lastLowStockAlertAt ? p.lastLowStockAlertAt.toLocaleString() : "—"}
                    </TableCell>
                  </TableRow>
                ))}
                {alerts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                      No alerts
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
          <div className="text-xs text-muted-foreground mt-3">
            Configure SMTP env vars to enable email.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
