import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const querySchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(25),
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const parsed = querySchema.parse({
    q: url.searchParams.get("q") ?? undefined,
    page: url.searchParams.get("page") ?? undefined,
    pageSize: url.searchParams.get("pageSize") ?? undefined,
  });

  const query = (parsed.q ?? "").trim();
  const where = query
    ? {
        OR: [
          { name: { contains: query, mode: "insensitive" as const } },
          { barcode: { contains: query, mode: "insensitive" as const } },
          { variants: { some: { barcode: { contains: query, mode: "insensitive" as const } } } },
        ],
      }
    : undefined;

  const [total, items] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (parsed.page - 1) * parsed.pageSize,
      take: parsed.pageSize,
      select: {
        id: true,
        name: true,
        barcode: true,
        priceCents: true,
        costCents: true,
        stock: true,
        isTrending: true,
        lowStockThreshold: true,
        updatedAt: true,
        variants: {
          select: {
            id: true,
            size: true,
            colorName: true,
            colorHex: true,
            key: true,
            barcode: true,
            priceCents: true,
            costCents: true,
            stock: true,
          },
        },
      },
    }),
  ]);

  return NextResponse.json({
    page: parsed.page,
    pageSize: parsed.pageSize,
    total,
    items,
  });
}
