import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const productListSelect = {
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
} satisfies Prisma.ProductSelect;

type ProductWithVariantStocks = {
  id: string;
  stock: number;
  variants: Array<{ stock: number }>;
};

export type ProductListItem = Prisma.ProductGetPayload<{ select: typeof productListSelect }>;

function buildProductSearchWhere(query: string): Prisma.ProductWhereInput | undefined {
  if (!query) return undefined;

  return {
    OR: [
      { name: { contains: query, mode: "insensitive" } },
      { barcode: { contains: query, mode: "insensitive" } },
      { variants: { some: { barcode: { contains: query, mode: "insensitive" } } } },
    ],
  };
}

export async function reconcileProductsWithVariantStock<T extends ProductWithVariantStocks>(
  products: T[],
): Promise<T[]> {
  const mismatches = products
    .filter((product) => product.variants.length > 0)
    .map((product) => ({
      id: product.id,
      stock: product.stock,
      totalStock: product.variants.reduce((sum, variant) => sum + (variant.stock ?? 0), 0),
    }))
    .filter((product) => product.stock !== product.totalStock);

  if (mismatches.length > 0) {
    await prisma.$transaction(
      mismatches.map((product) =>
        prisma.product.update({
          where: { id: product.id },
          data: { stock: product.totalStock },
        }),
      ),
    );
  }

  const totalById = new Map(mismatches.map((product) => [product.id, product.totalStock]));

  return products.map((product) =>
    totalById.has(product.id)
      ? {
          ...product,
          stock: totalById.get(product.id) ?? product.stock,
        }
      : product,
  );
}

export async function getProductsPageData(input: {
  q?: string;
  page: number;
  pageSize: number;
}) {
  const query = (input.q ?? "").trim();
  const where = buildProductSearchWhere(query);

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
      select: productListSelect,
    }),
  ]);

  const items = await reconcileProductsWithVariantStock(products);

  return {
    total,
    items,
    query,
    page: input.page,
    pageSize: input.pageSize,
  };
}

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: {
        orderBy: [{ size: "asc" }, { colorName: "asc" }, { colorHex: "asc" }],
      },
    },
  });

  if (!product) return null;

  const [normalizedProduct] = await reconcileProductsWithVariantStock([product]);
  return normalizedProduct;
}

export async function getProductForPrint(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: {
      variants: true,
    },
  });
}
