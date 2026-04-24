"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { maybeSendLowStockTrendingAlert } from "@/lib/alerts";

export async function getProductByBarcode(barcode: string) {
  const code = z.string().min(1).parse(barcode.trim());
  return prisma.product.findUnique({ where: { barcode: code } });
}

export async function searchProducts(query: string) {
  const q = z.string().trim().min(1).parse(query);
  return prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { barcode: { contains: q, mode: "insensitive" } },
      ],
    },
    orderBy: { name: "asc" },
    take: 10,
    select: {
      id: true,
      name: true,
      barcode: true,
      priceCents: true,
      costCents: true,
      stock: true,
    },
  });
}

const itemSchema = z.object({
  barcode: z.string().min(1),
  quantity: z.number().int().positive(),
  discountCents: z.number().int().nonnegative().optional(),
});

const saleSchema = z.object({
  userId: z.string().optional(),
  items: z.array(itemSchema).min(1),
});

export async function completeSale(input: z.infer<typeof saleSchema>) {
  const data = saleSchema.parse(input);

  const barcodes = [...new Set(data.items.map((i) => i.barcode))];
  const products = await prisma.product.findMany({ where: { barcode: { in: barcodes } } });
  const byBarcode = new Map(products.map((p) => [p.barcode, p]));

  const lineItems = data.items.map((i) => {
    const p = byBarcode.get(i.barcode);
    if (!p) throw new Error(`Unknown barcode: ${i.barcode}`);
    if (p.stock < i.quantity) throw new Error(`Insufficient stock for ${p.name}`);
    const lineSubtotalCents = p.priceCents * i.quantity;
    const discountCents = Math.min(i.discountCents ?? 0, lineSubtotalCents);
    const totalCents = lineSubtotalCents - discountCents;
    const profitCents = (p.priceCents - p.costCents) * i.quantity - discountCents;
    return {
      product: p,
      ...i,
      discountCents,
      totalCents,
      profitCents,
    };
  });

  const subtotalCents = lineItems.reduce((sum, li) => sum + li.totalCents, 0);
  const discountCents = 0;
  const totalCents = subtotalCents;
  const profitCents = lineItems.reduce((sum, li) => sum + li.profitCents, 0);

  const tx = await prisma.$transaction(async (db) => {
    for (const li of lineItems) {
      await db.product.update({
        where: { id: li.product.id },
        data: { stock: { decrement: li.quantity } },
      });
    }

    const transaction = await db.transaction.create({
      data: {
        userId: data.userId,
        discountCents,
        subtotalCents,
        totalCents,
        profitCents,
        items: {
          create: lineItems.map((li) => ({
            product: { connect: { id: li.product.id } },
            name: li.product.name,
            barcode: li.product.barcode,
            quantity: li.quantity,
            priceCents: li.product.priceCents,
            costCents: li.product.costCents,
            discountCents: li.discountCents,
            totalCents: li.totalCents,
            profitCents: li.profitCents,
          })),
        },
      },
      include: { items: true },
    });

    return transaction;
  });

  const changed = await prisma.product.findMany({ where: { barcode: { in: barcodes } } });
  await Promise.all(changed.map((p) => maybeSendLowStockTrendingAlert(p)));

  revalidatePath("/dashboard");
  revalidatePath("/products");
  revalidatePath("/alerts");

  return tx;
}
