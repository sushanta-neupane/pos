import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getLowStockAlerts } from "@/data/alerts";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await getLowStockAlerts(8);

  return NextResponse.json({
    items: items.map((item) => ({
      ...item,
      updatedAt: item.updatedAt.toISOString(),
    })),
  });
}
