import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

export async function generateBarcode(prefix = "PRD") {
  for (let i = 0; i < 6; i++) {
    const raw = randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
    const barcode = `${prefix}-${raw}`;
    const exists = await prisma.product.findUnique({ where: { barcode } });
    if (!exists) return barcode;
  }
  return `${prefix}-${Date.now()}`;
}

