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
	variants: z
		.array(
			z.object({
				size: z.string().trim().min(1).optional(),
				colorName: z.string().trim().min(1).optional(),
				colorHex: z
					.string()
					.trim()
					.regex(/^#([0-9a-fA-F]{6})$/, "Invalid color hex")
					.optional(),
				priceCents: z.number().int().nonnegative(),
				costCents: z.number().int().nonnegative().optional(),
				stock: z.number().int().nonnegative().default(0),
			})
		)
		.optional(),
	// Backward compatible inputs (older UI)
	variantSizes: z.array(z.string()).optional(),
	variantColors: z.array(z.string()).optional(),
});

export async function createProduct(input: z.infer<typeof createSchema>) {
	const data = createSchema.parse(input);
	const { variants, variantSizes, variantColors, ...productData } = data;
	const barcode = await generateBarcode();

	const product = await prisma.product.create({ data: { ...productData, barcode } });

	let nextVariants = variants ?? [];
	if (nextVariants.length === 0) {
		const normalize = (values?: string[]) => {
			const out: string[] = [];
			for (const v of values ?? []) {
				const trimmed = v.trim();
				if (!trimmed) continue;
				if (out.some((x) => x.toLowerCase() === trimmed.toLowerCase())) continue;
				out.push(trimmed);
			}
			return out;
		};

		const sizes = normalize(variantSizes);
		const colors = normalize(variantColors);
		if (sizes.length > 0 || colors.length > 0) {
			const sizeValues = sizes.length > 0 ? sizes : [""];
			const colorValues = colors.length > 0 ? colors : [""];
			nextVariants = [];
			for (const size of sizeValues) {
				for (const colorName of colorValues) {
					nextVariants.push({
						size: size || undefined,
						colorName: colorName || undefined,
						priceCents: productData.priceCents,
						stock: 0,
					});
				}
			}
		}
	}

	if (nextVariants.length > 0) {
		const rows: Array<{
			productId: string;
			size?: string;
			colorName?: string;
			colorHex?: string;
			key: string;
			barcode: string;
			priceCents: number;
			costCents?: number;
			stock: number;
		}> = [];

		const seen = new Set<string>();
		for (const v of nextVariants) {
			const size = v.size?.trim() || "";
			const colorKey = (v.colorHex ?? v.colorName ?? "").trim();
			const key = `${size.toLowerCase()}|${colorKey.toLowerCase()}`;
			if (seen.has(key)) continue;
			seen.add(key);
			rows.push({
				productId: product.id,
				size: size || undefined,
				colorName: v.colorName?.trim() || undefined,
				colorHex: v.colorHex?.trim() || undefined,
				key,
				barcode: await generateBarcode("VAR"),
				priceCents: v.priceCents,
				costCents: v.costCents ?? productData.costCents,
				stock: v.stock ?? 0,
			});
		}

		await prisma.productVariant.createMany({ data: rows });

		const sumStock = rows.reduce((sum, r) => sum + (r.stock ?? 0), 0);
		await prisma.product.update({ where: { id: product.id }, data: { stock: sumStock } });
	}

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
	const updated = await prisma.$transaction(async (db) => {
		const product = await db.product.findUnique({ where: { barcode: data.barcode } });
		if (product) {
			return db.product.update({
				where: { id: product.id },
				data: { stock: { increment: data.add } },
			});
		}

		const variant = await db.productVariant.findUnique({
			where: { barcode: data.barcode },
			include: { product: true },
		});
		if (!variant) throw new Error("Product not found");

		await db.productVariant.update({
			where: { id: variant.id },
			data: { stock: { increment: data.add } },
		});

		const all = await db.productVariant.findMany({
			where: { productId: variant.productId },
			select: { stock: true },
		});
		const sumStock = all.reduce((sum, v) => sum + (v.stock ?? 0), 0);

		return db.product.update({
			where: { id: variant.productId },
			data: { stock: sumStock },
		});
	});

	revalidatePath("/stock");
	revalidatePath("/products");
	return updated;
}
