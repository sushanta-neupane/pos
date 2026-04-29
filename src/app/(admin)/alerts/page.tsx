import { FormCard } from "@/components/form-shell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getLowStockAlerts } from "@/data/alerts";

export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  const alerts = await getLowStockAlerts(200);

  return (
    <div className="max-w-3xl space-y-3">
      <FormCard
        title="Alerts"
        description="Real low-stock notifications for trending products below threshold."
      >
          <div className="rounded-sm border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Threshold</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="font-mono text-xs">{p.barcode}</TableCell>
                    <TableCell className="text-right text-red-600">{p.stock}</TableCell>
                    <TableCell className="text-right">{p.lowStockThreshold}</TableCell>
                  </TableRow>
                ))}
                {alerts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                      No alerts
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
      </FormCard>
    </div>
  );
}
