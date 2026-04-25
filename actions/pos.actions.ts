"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { maybeSendLowStockTrendingAlert } from "@/lib/alerts";

export async function getProductByBarcode(barcode: string) {
  const code = z.string().min(1).parse(barcode.trim());
  const product = await prisma.product.findUnique({ where: { barcode: code } });
  if (product) return { product, barcode: code };

  const variant = await prisma.productVariant.findUnique({
    where: { barcode: code },
    include: { product: true },
  });
  if (!variant) return null;
  return { product: variant.product, barcode: code, variant };
}

export async function searchProducts(query: string) {
  const q = z.string().trim().min(1).parse(query);
  const [products, variants] = await Promise.all([
    prisma.product.findMany({
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
    }),
    prisma.productVariant.findMany({
      where: { barcode: { contains: q, mode: "insensitive" } },
      take: 10,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            costCents: true,
          },
        },
      },
    }),
  ]);

  const out: Array<{
    id: string;
    name: string;
    barcode: string;
    priceCents: number;
    costCents: number;
    stock: number;
  }> = [...products];

  for (const v of variants) {
    const color = v.colorName ?? v.colorHex;
    const suffix = [v.size, color].filter(Boolean).join(" / ");
    const costCents = v.costCents ?? v.product.costCents;
    out.push({
      id: v.product.id,
      name: suffix ? `${v.product.name} (${suffix})` : v.product.name,
      barcode: v.barcode,
      priceCents: v.priceCents,
      costCents,
      stock: v.stock,
    });
  }

  return out.slice(0, 10);
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
  const [products, variants] = await Promise.all([
    prisma.product.findMany({ where: { barcode: { in: barcodes } } }),
    prisma.productVariant.findMany({
      where: { barcode: { in: barcodes } },
      include: { product: true },
    }),
  ]);

  const byBarcode = new Map<
    string,
    { kind: "product"; product: (typeof products)[number] } | { kind: "variant"; variant: (typeof variants)[number] }
  >();
  for (const p of products) byBarcode.set(p.barcode, { kind: "product", product: p });
  for (const v of variants) byBarcode.set(v.barcode, { kind: "variant", variant: v });

  const lineItems = data.items.map((i) => {
    const hit = byBarcode.get(i.barcode);
    if (!hit) throw new Error(`Unknown barcode: ${i.barcode}`);

    const product = hit.kind === "product" ? hit.product : hit.variant.product;
    const priceCents = hit.kind === "product" ? hit.product.priceCents : hit.variant.priceCents;
    const costCents =
      hit.kind === "product" ? hit.product.costCents : (hit.variant.costCents ?? hit.variant.product.costCents);
    const availableStock = hit.kind === "product" ? hit.product.stock : hit.variant.stock;

    const variantLabel =
      hit.kind === "variant"
        ? [hit.variant.size, hit.variant.colorName ?? hit.variant.colorHex].filter(Boolean).join(" / ")
        : "";
    const name = variantLabel ? `${product.name} (${variantLabel})` : product.name;

    if (availableStock < i.quantity) throw new Error(`Insufficient stock for ${name}`);

    const lineSubtotalCents = priceCents * i.quantity;
    const discountCents = Math.min(i.discountCents ?? 0, lineSubtotalCents);
    const totalCents = lineSubtotalCents - discountCents;
    const profitCents = (priceCents - costCents) * i.quantity - discountCents;
    return {
      product,
      name,
      priceCents,
      costCents,
      kind: hit.kind,
      variantId: hit.kind === "variant" ? hit.variant.id : null,
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
    const touchedVariantProductIds = new Set<string>();
    for (const li of lineItems) {
      if (li.kind === "variant" && li.variantId) {
        touchedVariantProductIds.add(li.product.id);
        await db.productVariant.update({
          where: { id: li.variantId },
          data: { stock: { decrement: li.quantity } },
        });
      } else {
        await db.product.update({
          where: { id: li.product.id },
          data: { stock: { decrement: li.quantity } },
        });
      }
    }

    for (const productId of touchedVariantProductIds) {
      const all = await db.productVariant.findMany({
        where: { productId },
        select: { stock: true },
      });
      const sumStock = all.reduce((sum, v) => sum + (v.stock ?? 0), 0);
      await db.product.update({ where: { id: productId }, data: { stock: sumStock } });
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
            name: li.name,
            barcode: li.barcode,
            quantity: li.quantity,
            priceCents: li.priceCents,
            costCents: li.costCents,
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

  const changedIds = [...new Set(lineItems.map((li) => li.product.id))];
  const changed = await prisma.product.findMany({ where: { id: { in: changedIds } } });
  await Promise.all(changed.map((p) => maybeSendLowStockTrendingAlert(p)));

  revalidatePath("/dashboard");
  revalidatePath("/products");
  revalidatePath("/alerts");

  return tx;
}
