"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteProduct } from "@/actions/product.actions";
import { getErrorMessage } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

export function ProductRowActions({
	id,
	name,
	selectedVariantId,
}: {
	id: string;
	name: string;
	selectedVariantId?: string | null;
}) {
	const router = useRouter();
	const [open, setOpen] = React.useState(false);
	const [loading, setLoading] = React.useState(false);
	const printHref = selectedVariantId
		? {
				pathname: `/products/${id}/print`,
				query: { variantId: selectedVariantId },
			}
		: `/products/${id}/print`;

	async function onDelete() {
		setLoading(true);
		try {
			await deleteProduct({ id });
			toast.success("Product deleted");
			setOpen(false);
			router.refresh();
		} catch (err: unknown) {
			toast.error(getErrorMessage(err, "Failed to delete product"));
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="inline-flex items-center justify-end gap-2">
			<Button asChild variant="outline" size="sm">
				<Link href={`/products/${id}`}>Edit</Link>
			</Button>
			<Button asChild variant="outline" size="sm">
				<Link href={printHref} prefetch={false}>
					Print
				</Link>
			</Button>
			<Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
				Delete
			</Button>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete product</DialogTitle>
						<DialogDescription>
							This will permanently delete{" "}
							<span className="font-medium">{name}</span>.
						</DialogDescription>
					</DialogHeader>
					<div className="flex justify-end gap-2">
						<DialogClose asChild>
							<Button variant="outline" disabled={loading}>
								Cancel
							</Button>
						</DialogClose>
						<Button variant="destructive" onClick={onDelete} disabled={loading}>
							{loading ? "Deleting..." : "Delete"}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
