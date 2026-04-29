import { prisma } from "@/lib/prisma";
import type { ActivityItem } from "@/app/(admin)/dashboard/activities-card";

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeek(date: Date) {
  const next = startOfDay(date);
  const day = next.getDay();
  next.setDate(next.getDate() - day);
  return next;
}

function startOfYear(date: Date) {
  return new Date(date.getFullYear(), 0, 1);
}

export async function getDashboardPageData() {
  const now = new Date();
  const dailyStart = startOfDay(now);
  const weeklyStart = startOfWeek(now);
  const yearlyStart = startOfYear(now);

  const stockEntry = prisma as typeof prisma & {
    stockEntry?: {
      aggregate: (args: unknown) => Promise<{ _sum: { quantity: number | null } }>;
      findMany: (args: unknown) => Promise<
        Array<{
          id: string;
          name: string;
          barcode: string;
          quantity: number;
          costCents: number;
          totalCostCents: number;
          createdAt: Date;
        }>
      >;
    };
  };

  const [salesAgg, profitAgg, users, products, transactions, stockAgg, stockEntries] =
    await Promise.all([
      prisma.transaction.aggregate({ _sum: { totalCents: true } }),
      prisma.transaction.aggregate({ _sum: { profitCents: true } }),
      prisma.user.count(),
      prisma.product.findMany({
        orderBy: { stock: "asc" },
        select: {
          id: true,
          name: true,
          barcode: true,
          priceCents: true,
          stock: true,
          lowStockThreshold: true,
          costCents: true,
          isTrending: true,
          createdAt: true,
          updatedAt: true,
          variants: {
            select: {
              id: true,
              size: true,
              colorName: true,
              colorHex: true,
              stock: true,
              costCents: true,
            },
          },
        },
      }),
      prisma.transaction.findMany({
        where: { createdAt: { gte: yearlyStart } },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          subtotalCents: true,
          totalCents: true,
          profitCents: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          items: {
            select: {
              name: true,
              quantity: true,
            },
          },
        },
      }),
      stockEntry.stockEntry
        ? stockEntry.stockEntry.aggregate({ _sum: { quantity: true } })
        : Promise.resolve({ _sum: { quantity: 0 } }),
      stockEntry.stockEntry
        ? stockEntry.stockEntry.findMany({
            where: { createdAt: { gte: yearlyStart } },
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              name: true,
              barcode: true,
              quantity: true,
              costCents: true,
              totalCostCents: true,
              createdAt: true,
            },
          })
        : Promise.resolve([]),
    ]);

  return {
    dailyStart,
    weeklyStart,
    salesAgg,
    profitAgg,
    users,
    products,
    transactions,
    stockAgg,
    stockEntries,
  };
}

export function buildDashboardActivities(data: Awaited<ReturnType<typeof getDashboardPageData>>): ActivityItem[] {
  const activities = [
    ...data.products.map((product) => ({
      id: `product-created-${product.id}`,
      type: "add-product" as const,
      label: "Add Product",
      name: product.name,
      details: `Created with code ${product.barcode}`,
      createdAt: product.createdAt.toISOString(),
      amount: product.costCents,
    })),
    ...data.products
      .filter((product) => product.updatedAt.getTime() > product.createdAt.getTime())
      .map((product) => ({
        id: `product-updated-${product.id}`,
        type: "update-product" as const,
        label: "Update Product",
        name: product.name,
        details: `Latest stock ${product.stock}`,
        createdAt: product.updatedAt.toISOString(),
        amount: product.priceCents,
      })),
    ...data.stockEntries.map((entry) => ({
      id: `stock-entry-${entry.id}`,
      type: "add-stock" as const,
      label: "Add Stock",
      name: entry.name,
      details: `${entry.quantity} item(s) added to stock`,
      createdAt: entry.createdAt.toISOString(),
      amount: entry.totalCostCents,
    })),
    ...data.transactions.map((transaction) => ({
      id: `sale-${transaction.id}`,
      type: "sell-product" as const,
      label: "Sell Product",
      name: transaction.items[0]?.name ?? "Sale",
      details: `${transaction.items.reduce((sum, item) => sum + item.quantity, 0)} item(s) sold by ${transaction.user?.name || "Unknown"}`,
      createdAt: transaction.createdAt.toISOString(),
      amount: transaction.totalCents,
    })),
  ];

  return activities
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 12);
}
