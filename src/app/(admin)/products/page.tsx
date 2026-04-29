import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { Button } from "@/components/ui/button";
import { FormCard } from "@/components/form-shell";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { getProductsPageData } from "@/data/products";
import { authOptions } from "@/lib/auth";
import { ProductTableRow } from "./product-table-row";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
	searchParams,
}: {
	searchParams: Promise<{ q?: string; page?: string }>;
}) {
	await getServerSession(authOptions);

	const { q, page: pageParam } = await searchParams;
	const page = Math.max(1, Number(pageParam) || 1);
	const pageSize = 25;
	const { total, items, query } = await getProductsPageData({ q, page, pageSize });

	const totalPages = Math.max(1, Math.ceil(total / pageSize));

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between gap-3">
				<div>
					<div className="text-sm font-semibold">Products</div>
					<div className="text-xs text-muted-foreground">
						{query ? `Results for “${query}”` : "All products"}
					</div>
				</div>
				<Button asChild>
					<Link href="/products/new">New product</Link>
				</Button>
			</div>

			<FormCard
				title="All products"
				description={query ? `Filtered by “${query}”` : "Browse and manage your inventory."}
			>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Barcode</TableHead>
							<TableHead className="text-right">Price</TableHead>
							<TableHead className="text-right">Cost</TableHead>
							<TableHead className="text-right"> Stock</TableHead>
							<TableHead>Trending</TableHead>
							<TableHead className="text-right">Low</TableHead>
							<TableHead className="text-right">Action</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{items.map((p) => (
							<ProductTableRow key={p.id} product={p} />
						))}
						{items.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={8}
									className="text-center text-sm text-muted-foreground"
								>
									No products
								</TableCell>
							</TableRow>
						) : null}
					</TableBody>
				</Table>
				<div className="mt-4 flex items-center justify-between text-sm">
					<div className="text-xs text-muted-foreground">
						Page {page} of {totalPages} · {total} total
					</div>
					<div className="flex items-center gap-2">
						{page <= 1 ? (
							<Button variant="outline" disabled>
								Prev
							</Button>
						) : (
							<Button asChild variant="outline">
								<Link
									href={{
										pathname: "/products",
										query: {
											...(query ? { q: query } : {}),
											page: String(Math.max(1, page - 1)),
										},
									}}
								>
									Prev
								</Link>
							</Button>
						)}
						{page >= totalPages ? (
							<Button variant="outline" disabled>
								Next
							</Button>
						) : (
							<Button asChild variant="outline">
								<Link
									href={{
										pathname: "/products",
										query: {
											...(query ? { q: query } : {}),
											page: String(Math.min(totalPages, page + 1)),
										},
									}}
								>
									Next
								</Link>
							</Button>
						)}
					</div>
				</div>
			</FormCard>
		</div>
	);
}
