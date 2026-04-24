"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generateBarcode } from "@/lib/barcode";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
	name: z.string().min(1),
	priceCents: z.number().int().nonnegative(),
	costCents: z.number().int().nonnegative(),
	stock: z.number().int().nonnegative().default(0),
	isTrending: z.boolean().default(false),
	lowStockThreshold: z.number().int().nonnegative().default(5),
});

export async function createProduct(input: z.infer<typeof createSchema>) {
	const data = createSchema.parse(input);
	const barcode = await generateBarcode();

	const product = await prisma.product.create({
		data: { ...data, barcode },
	});

	revalidatePath("/products");
	return product;
}

const updateSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	priceCents: z.number().int().nonnegative(),
	costCents: z.number().int().nonnegative(),
	isTrending: z.boolean(),
	lowStockThreshold: z.number().int().nonnegative(),
});

export async function updateProduct(input: z.infer<typeof updateSchema>) {
	const data = updateSchema.parse(input);
	const product = await prisma.product.update({
		where: { id: data.id },
		data: {
			name: data.name,
			priceCents: data.priceCents,
			costCents: data.costCents,
			isTrending: data.isTrending,
			lowStockThreshold: data.lowStockThreshold,
		},
	});
	revalidatePath("/products");
	revalidatePath(`/products/${data.id}`);
	return product;
}

const stockSchema = z.object({
	barcode: z.string().min(1),
	add: z.number().int().positive(),
});

export async function addStock(input: z.infer<typeof stockSchema>) {
	const data = stockSchema.parse(input);
	const product = await prisma.product.findUnique({
		where: { barcode: data.barcode },
	});
	if (!product) throw new Error("Product not found");

	const updated = await prisma.product.update({
		where: { id: product.id },
		data: { stock: { increment: data.add } },
	});

	revalidatePath("/stock");
	revalidatePath("/products");
	return updated;
}
