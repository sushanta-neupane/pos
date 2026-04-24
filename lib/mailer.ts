import nodemailer from "nodemailer";
import type { Product } from "@prisma/client";

export async function sendLowStockAlertEmail(product: Product) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  const from = process.env.ALERT_EMAIL_FROM ?? "alerts@pos.local";
  const to = process.env.ALERT_EMAIL_TO;

  if (!host || !to) return;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
  });

  await transporter.sendMail({
    from,
    to,
    subject: `LOW STOCK: ${product.name} (${product.barcode})`,
    text: [
      `Product: ${product.name}`,
      `Barcode: ${product.barcode}`,
      `Stock: ${product.stock}`,
      `Threshold: ${product.lowStockThreshold}`,
      "",
      "Action: Replenish stock.",
    ].join("\n"),
  });
}

