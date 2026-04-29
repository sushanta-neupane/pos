import { prisma } from "@/lib/prisma";

export type LowStockAlertItem = {
  id: string;
  name: string;
  barcode: string;
  stock: number;
  lowStockThreshold: number;
  isTrending: boolean;
  updatedAt: Date;
};

export async function getLowStockAlerts(limit = 50): Promise<LowStockAlertItem[]> {
  const items = await prisma.product.findMany({
    where: {
      isTrending: true,
    },
    orderBy: { updatedAt: "desc" },
    take: Math.max(limit * 3, limit),
    select: {
      id: true,
      name: true,
      barcode: true,
      stock: true,
      lowStockThreshold: true,
      isTrending: true,
      updatedAt: true,
    },
  });

  return items
    .filter((item) => item.stock < item.lowStockThreshold)
    .sort((a, b) => {
      const deficitA = a.lowStockThreshold - a.stock;
      const deficitB = b.lowStockThreshold - b.stock;
      if (deficitB !== deficitA) return deficitB - deficitA;
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    })
    .slice(0, limit);
}
