"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { publicRegisterUser } from "@/actions/user.actions";
import { getErrorMessage } from "@/lib/errors";
import { FormCard } from "@/components/form-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function RegisterForm() {
  const router = useRouter();

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await publicRegisterUser({
        name: name.trim() ? name.trim() : undefined,
        email,
        password,
      });

      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!res || res.error) {
        toast.success(`Created ${user.email} (${user.role}). Please sign in.`);
        router.push("/login");
        return;
      }

      toast.success(`Welcome ${user.role === "ADMIN" ? "Admin" : "User"}`);
      router.push(user.role === "ADMIN" ? "/dashboard" : "/pos");
      router.refresh();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to register"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <FormCard
      title="Create account"
      description="Temporary registration (first user becomes Admin)."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <div className="text-sm font-medium">Name (optional)</div>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            autoComplete="name"
            className="h-11 rounded-md"
          />
        </div>
        <div className="space-y-2">
          <div className="text-sm font-medium">Email</div>
          <Input
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            autoComplete="email"
            className="h-11 rounded-md"
          />
        </div>
        <div className="space-y-2">
          <div className="text-sm font-medium">Password</div>
          <Input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="new-password"
            className="h-11 rounded-md"
          />
          <div className="text-xs text-muted-foreground">Minimum 6 characters.</div>
        </div>
        <Button className="w-full h-11" disabled={loading} type="submit">
          {loading ? "Creating..." : "Create account"}
        </Button>
        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary underline underline-offset-4">
            Sign in
          </Link>
        </div>
      </form>
    </FormCard>
  );
}

