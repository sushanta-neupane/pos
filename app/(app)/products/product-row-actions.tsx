"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function ProductRowActions({ id }: { id: string }) {
  return (
    <div className="inline-flex items-center justify-end gap-2">
      <Button asChild variant="outline" size="sm">
        <Link href={`/products/${id}`}>Edit</Link>
      </Button>
      <Button asChild variant="outline" size="sm">
        <Link href={`/products/${id}/print`} prefetch={false}>
          Print
        </Link>
      </Button>
    </div>
  );
}
