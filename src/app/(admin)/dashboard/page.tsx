import Link from "next/link";
import { getDashboardPageData } from "@/data/dashboard";
import { formatCents } from "@/lib/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const {
    dailyStart,
    weeklyStart,
    salesAgg,
    profitAgg,
    users,
    products,
    transactions,
    stockAgg,
    stockEntries,
  } = await getDashboardPageData();

  const lowStock = products
    .filter((product) => product.stock < product.lowStockThreshold)
    .slice(0, 8);

  const totalInvestment = products.reduce((sum, product) => {
    if (product.variants.length > 0) {
      return (
        sum +
        product.variants.reduce(
          (variantSum, variant) =>
            variantSum + (variant.costCents ?? product.costCents) * variant.stock,
          0
        )
      );
    }
    return sum + product.costCents * product.stock;
  }, 0);

  const salesMetrics = {
    daily: transactions
      .filter((row) => row.createdAt >= dailyStart)
      .reduce((sum, row) => sum + row.totalCents, 0),
    weekly: transactions
      .filter((row) => row.createdAt >= weeklyStart)
      .reduce((sum, row) => sum + row.totalCents, 0),
    yearly: transactions.reduce((sum, row) => sum + row.totalCents, 0),
  };

  const stockMetrics = {
    dailyUnits: stockEntries
      .filter((row) => row.createdAt >= dailyStart)
      .reduce((sum, row) => sum + row.quantity, 0),
    weeklyUnits: stockEntries
      .filter((row) => row.createdAt >= weeklyStart)
      .reduce((sum, row) => sum + row.quantity, 0),
    yearlyUnits: stockEntries.reduce((sum, row) => sum + row.quantity, 0),
    dailyInvestment: stockEntries
      .filter((row) => row.createdAt >= dailyStart)
      .reduce((sum, row) => sum + row.totalCostCents, 0),
    weeklyInvestment: stockEntries
      .filter((row) => row.createdAt >= weeklyStart)
      .reduce((sum, row) => sum + row.totalCostCents, 0),
    yearlyInvestment: stockEntries.reduce((sum, row) => sum + row.totalCostCents, 0),
  };

  const overviewCards = [
    {
      label: "Total Sales",
      value: formatCents(salesAgg._sum.totalCents ?? 0),
      className: "bg-brand-600 text-white",
    },
    {
      label: "Total Profit",
      value: formatCents(profitAgg._sum.profitCents ?? 0),
      className: "bg-success-600 text-white",
    },
    {
      label: "Total Investment",
      value: formatCents(totalInvestment),
      className: "bg-warning-500 text-white",
    },
    {
      label: "Users",
      value: String(users),
      className: "bg-brand-900 text-white",
    },
  ];

  const salesCards = [
    { label: "Daily Sales", value: formatCents(salesMetrics.daily) },
    { label: "Weekly Sales", value: formatCents(salesMetrics.weekly) },
    { label: "Yearly Sales", value: formatCents(salesMetrics.yearly) },
  ];

  const stockCards = [
    { label: "Total Stock Added", value: String(stockAgg._sum.quantity ?? 0) },
    { label: "Daily Stock Added", value: String(stockMetrics.dailyUnits) },
    { label: "Weekly Stock Added", value: String(stockMetrics.weeklyUnits) },
    { label: "Yearly Stock Added", value: String(stockMetrics.yearlyUnits) },
  ];

  const investmentCards = [
    { label: "Daily Investment", value: formatCents(stockMetrics.dailyInvestment) },
    { label: "Weekly Investment", value: formatCents(stockMetrics.weeklyInvestment) },
    { label: "Yearly Investment", value: formatCents(stockMetrics.yearlyInvestment) },
  ];

  const metricPanelStyles = {
    sales: "bg-brand-600 text-white",
    stock: "bg-success-600 text-white",
    investment: "bg-warning-500 text-white",
  };

  const recentTransactions = transactions.slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Inventory Dashboard
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Live POS analytics with sales, stock, and investment visibility.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {overviewCards.map((card) => (
          <Card
            key={card.label}
            className={`rounded-2xl border-0 shadow-theme-sm ${card.className}`}
          >
            <CardHeader className="border-0 pb-2">
              <CardTitle className="text-xs uppercase tracking-wide text-white/80">
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-white">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="rounded-2xl border-0 shadow-theme-sm">
          <CardHeader className="border-b border-gray-100 dark:border-gray-800">
            <CardTitle className="text-base text-gray-800 dark:text-white/90">
              Sales Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {salesCards.map((card) => (
              <div
                key={card.label}
                className={`flex items-center justify-between rounded-xl px-4 py-3 ${metricPanelStyles.sales}`}
              >
                <div className="text-sm text-white/85">{card.label}</div>
                <div className="text-base font-semibold text-white">{card.value}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-theme-sm">
          <CardHeader className="border-b border-gray-100 dark:border-gray-800">
            <CardTitle className="text-base text-gray-800 dark:text-white/90">
              Stock Added
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {stockCards.map((card) => (
              <div
                key={card.label}
                className={`flex items-center justify-between rounded-xl px-4 py-3 ${metricPanelStyles.stock}`}
              >
                <div className="text-sm text-white/85">{card.label}</div>
                <div className="text-base font-semibold text-white">{card.value}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-theme-sm">
          <CardHeader className="border-b border-gray-100 dark:border-gray-800">
            <CardTitle className="text-base text-gray-800 dark:text-white/90">
              Investment Added
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {investmentCards.map((card) => (
              <div
                key={card.label}
                className={`flex items-center justify-between rounded-xl px-4 py-3 ${metricPanelStyles.investment}`}
              >
                <div className="text-sm text-white/90">{card.label}</div>
                <div className="text-base font-semibold text-white">{card.value}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="rounded-2xl border-0 shadow-theme-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 dark:border-gray-800">
            <CardTitle className="text-base text-gray-800 dark:text-white/90">
              Low Stock
            </CardTitle>
            <Link href="/alerts" className="text-sm text-brand-500 hover:text-brand-600">
              Open alerts
            </Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Threshold</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStock.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-sm text-gray-500">
                      No alerts
                    </TableCell>
                  </TableRow>
                ) : (
                  lowStock.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-right text-error-600">{product.stock}</TableCell>
                      <TableCell className="text-right">{product.lowStockThreshold}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-theme-sm">
          <CardHeader className="border-b border-gray-100 dark:border-gray-800">
            <CardTitle className="text-base text-gray-800 dark:text-white/90">
              Recent Sales History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead>Sold items</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-sm text-gray-500">
                      No transactions
                    </TableCell>
                  </TableRow>
                ) : (
                  recentTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-mono text-xs">
                        {transaction.id.slice(-8)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium text-gray-800 dark:text-white/90">
                          {transaction.user?.name || "Unknown"}
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400">
                          {transaction.user?.email || "No user"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[260px] space-y-1">
                          {transaction.items.slice(0, 3).map((item, index) => (
                            <div
                              key={`${transaction.id}-${index}-${item.name}`}
                              className="truncate text-xs text-gray-600 dark:text-gray-300"
                            >
                              {item.name} x{item.quantity}
                            </div>
                          ))}
                          {transaction.items.length > 3 ? (
                            <div className="text-[11px] text-gray-500 dark:text-gray-400">
                              +{transaction.items.length - 3} more
                            </div>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {transaction.items.reduce((sum, item) => sum + item.quantity, 0)}
                      </TableCell>
                      <TableCell>{transaction.createdAt.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        {formatCents(transaction.subtotalCents)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            transaction.profitCents >= 0
                              ? "text-success-600"
                              : "text-error-600"
                          }
                        >
                          {formatCents(transaction.profitCents)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCents(transaction.totalCents)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
