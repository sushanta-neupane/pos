import { prisma } from "@/lib/prisma";
import { sendLowStockAlertEmail } from "@/lib/mailer";
import type { Product } from "@prisma/client";

const COOLDOWN_MS = 6 * 60 * 60 * 1000;

function alertsConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.ALERT_EMAIL_TO);
}

export async function maybeSendLowStockTrendingAlert(product: Product) {
  if (!alertsConfigured()) return;
  if (!product.isTrending) return;
  if (product.stock >= product.lowStockThreshold) return;

  const last = product.lastLowStockAlertAt?.getTime() ?? 0;
  if (Date.now() - last < COOLDOWN_MS) return;

  await sendLowStockAlertEmail(product);
  await prisma.product.update({
    where: { id: product.id },
    data: { lastLowStockAlertAt: new Date() },
  });
}

