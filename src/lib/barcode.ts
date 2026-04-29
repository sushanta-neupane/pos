import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

export async function generateBarcode(prefix = "PRD") {
	for (let i = 0; i < 6; i++) {
		const raw = randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
		const barcode = `${prefix}-${raw}`;
		const [existsProduct, existsVariant] = await Promise.all([
			prisma.product.findUnique({ where: { barcode } }),
			prisma.productVariant.findUnique({ where: { barcode } }),
		]);
		if (!existsProduct && !existsVariant) return barcode;
	}
	return `${prefix}-${Date.now()}`;
}
