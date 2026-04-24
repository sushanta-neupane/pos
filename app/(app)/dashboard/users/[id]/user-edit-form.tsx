"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { User } from "@prisma/client";
import { adminUpdateUser } from "@/actions/user.actions";
import { getErrorMessage } from "@/lib/errors";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormCard, PageTitle } from "@/components/form-shell";

export function UserEditForm({ user }: { user: User }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const [email, setEmail] = React.useState(user.email);
  const [name, setName] = React.useState(user.name ?? "");
  const [role, setRole] = React.useState<"ADMIN" | "SALES">(user.role);
  const [password, setPassword] = React.useState("");
  const [changePassword, setChangePassword] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await adminUpdateUser({
        id: user.id,
        email: email.trim(),
        name: name.trim() ? name.trim() : undefined,
        role,
        password: changePassword && password.trim() ? password : undefined,
      });
      toast.success("User updated");
      setPassword("");
      setChangePassword(false);
      router.push("/dashboard/users");
      router.refresh();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to update user"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageTitle
        title="Edit User"
        subtitle="Update role, email, and password."
        right={
          <Button variant="outline" onClick={() => router.push("/dashboard/users")}>
            Back
          </Button>
        }
      />

      <FormCard title="User details" description={`User ID: ${user.id}`}>
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <div className="text-sm font-medium">Email</div>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-md" />
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">Name</div>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-11 rounded-md" />
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">Role</div>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "ADMIN" | "SALES")}
              className="h-11 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--ring))]"
            >
              <option value="SALES">SALES</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
          <div className="md:col-span-2 space-y-2 pt-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={changePassword}
                onChange={(e) => setChangePassword(e.target.checked)}
              />
              Change password
            </label>
            {changePassword ? (
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="h-11 rounded-md"
              />
            ) : null}
          </div>
          <div className="md:col-span-2 flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/users")}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button disabled={loading} type="submit" className="h-11 px-6">
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </FormCard>
    </div>
  );
}
