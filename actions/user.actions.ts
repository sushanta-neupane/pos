"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "SALES"]),
  name: z.string().trim().min(1).optional(),
});

export async function adminCreateUser(input: z.infer<typeof createUserSchema>) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }

  const data = createUserSchema.parse(input);
  const email = data.email.toLowerCase();

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: data.role,
      name: data.name ?? null,
    },
    create: {
      email,
      passwordHash,
      role: data.role,
      name: data.name ?? null,
    },
  });

  revalidatePath("/dashboard/users");
  return { id: user.id, email: user.email, role: user.role, name: user.name };
}

const updateUserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["ADMIN", "SALES"]),
  name: z.string().trim().min(1).optional(),
  password: z.string().min(6).optional(),
});

export async function adminUpdateUser(input: z.infer<typeof updateUserSchema>) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }

  const data = updateUserSchema.parse(input);
  const email = data.email.toLowerCase();

  const update: {
    email: string;
    role: "ADMIN" | "SALES";
    name: string | null;
    passwordHash?: string;
  } = {
    email,
    role: data.role,
    name: data.name ?? null,
  };
  if (data.password) {
    update.passwordHash = await bcrypt.hash(data.password, 10);
  }

  const user = await prisma.user.update({
    where: { id: data.id },
    data: update,
  });

  revalidatePath("/dashboard/users");
  revalidatePath(`/dashboard/users/${data.id}`);
  return { id: user.id, email: user.email, role: user.role, name: user.name };
}

const deleteUserSchema = z.object({ id: z.string().min(1) });

export async function adminDeleteUser(input: z.infer<typeof deleteUserSchema>) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }

  const data = deleteUserSchema.parse(input);
  if (data.id === session.user.id) throw new Error("You can't delete your own user");

  await prisma.user.delete({ where: { id: data.id } });
  revalidatePath("/dashboard/users");
  return { ok: true };
}

// Self-registration intentionally disabled for POS deployments.
