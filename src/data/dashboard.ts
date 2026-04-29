import { prisma } from "@/lib/prisma";

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
          quantity: number;
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
          stock: true,
          lowStockThreshold: true,
          costCents: true,
          isTrending: true,
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
            select: { quantity: true, totalCostCents: true, createdAt: true },
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
