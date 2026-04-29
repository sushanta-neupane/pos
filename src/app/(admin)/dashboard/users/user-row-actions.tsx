"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { adminDeleteUser } from "@/actions/user.actions";
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

export function UserRowActions({ id, email }: { id: string; email: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function onDelete() {
    setLoading(true);
    try {
      await adminDeleteUser({ id });
      toast.success("User deleted");
      setOpen(false);
      router.refresh();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to delete user"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex items-center gap-2">
      <Button asChild variant="outline" size="sm">
        <Link href={`/dashboard/users/${id}`}>Edit</Link>
      </Button>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Delete
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete user</DialogTitle>
            <DialogDescription>
              This will permanently delete <span className="font-medium">{email}</span>.
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

