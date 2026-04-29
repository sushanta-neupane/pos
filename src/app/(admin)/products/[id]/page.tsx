import { notFound } from "next/navigation";
import { getProductById } from "@/data/products";
import { ProductEditForm } from "./product-edit-form";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();
  return <ProductEditForm product={product} />;
}
