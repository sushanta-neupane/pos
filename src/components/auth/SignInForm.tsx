"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";

export default function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? undefined;
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (!res || res.error) {
      toast.error(res?.error === "CredentialsSignin" ? "Invalid credentials" : res?.error ?? "Sign in failed");
      return;
    }
    router.push(next ?? "/");
    router.refresh();
  }

  return (
    <div className="flex w-full flex-1 flex-col lg:w-1/2">
      <div className="mx-auto mb-5 w-full max-w-md sm:pt-10">
        <Link href="/" className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
          <ChevronLeftIcon />
          Back to dashboard
        </Link>
      </div>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <div className="mb-5 sm:mb-8">
          <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">Sign In</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Enter your email and password to sign in.</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <Label>Email <span className="text-error-500">*</span></Label>
            <Input type="email" placeholder="admin@local.test" defaultValue={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label>Password <span className="text-error-500">*</span></Label>
            <div className="relative">
              <Input type={showPassword ? "text" : "password"} placeholder="Enter your password" defaultValue={password} onChange={(e) => setPassword(e.target.value)} />
              <span onClick={() => setShowPassword((value) => !value)} className="absolute right-4 top-1/2 z-30 -translate-y-1/2 cursor-pointer">
                {showPassword ? <EyeIcon className="fill-gray-500 dark:fill-gray-400" /> : <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />}
              </span>
            </div>
          </div>
          <button disabled={loading} className="flex w-full items-center justify-center rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <div className="mt-5">
          <p className="text-center text-sm font-normal text-gray-700 dark:text-gray-400 sm:text-start">
            Don&apos;t have an account? <Link href="/signup" className="text-brand-500 hover:text-brand-600 dark:text-brand-400">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
