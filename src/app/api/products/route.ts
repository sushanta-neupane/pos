import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { getProductsPageData } from "@/data/products";
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

  const { total, items } = await getProductsPageData({
    q: parsed.q,
    page: parsed.page,
    pageSize: parsed.pageSize,
  });

  return NextResponse.json({
    page: parsed.page,
    pageSize: parsed.pageSize,
    total,
    items,
  });
}
