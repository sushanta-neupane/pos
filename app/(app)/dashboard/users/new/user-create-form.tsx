"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { adminCreateUser } from "@/actions/user.actions";
import { getErrorMessage } from "@/lib/errors";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormCard, PageTitle } from "@/components/form-shell";

export function UserCreateForm() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<"ADMIN" | "SALES">("SALES");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await adminCreateUser({
        email: email.trim(),
        name: name.trim() ? name.trim() : undefined,
        password,
        role,
      });
      toast.success("User saved");
      router.push("/dashboard/users");
      router.refresh();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to create user"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageTitle
        title="New User"
        subtitle="Create an account for staff."
        right={
          <Button variant="outline" onClick={() => router.push("/dashboard/users")}>
            Back
          </Button>
        }
      />

      <FormCard title="User onboarding" description="Admins can access dashboard and alerts.">
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <div className="text-sm font-medium">Email</div>
            <Input
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 rounded-md"
            />
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">Name (optional)</div>
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
          <div className="space-y-2 md:col-span-2">
            <div className="text-sm font-medium">Password</div>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              className="h-11 rounded-md"
            />
          </div>
          <div className="md:col-span-2 flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => router.push("/dashboard/users")}
            >
              Cancel
            </Button>
            <Button disabled={loading} type="submit" className="h-11 px-6">
              {loading ? "Saving..." : "Create user"}
            </Button>
          </div>
        </form>
      </FormCard>
    </div>
  );
}
