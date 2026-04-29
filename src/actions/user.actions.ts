"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
	if (data.id === session.user.id)
		throw new Error("You can't delete your own user");

	await prisma.user.delete({ where: { id: data.id } });
	revalidatePath("/dashboard/users");
	return { ok: true };
}

const publicRegisterSchema = z.object({
	email: z.string().email(),
	password: z.string().min(6),
	name: z.string().trim().min(1).optional(),
});

function allowPublicRegister() {
	const flag = (process.env.ALLOW_REGISTER ?? "").toLowerCase();
	if (flag === "true" || flag === "1" || flag === "yes") return true;
	if (flag === "false" || flag === "0" || flag === "no") return false;
	return process.env.NODE_ENV !== "production";
}

export async function publicRegisterUser(
	input: z.infer<typeof publicRegisterSchema>,
) {
	if (!allowPublicRegister()) {
		throw new Error("Registration is disabled");
	}

	const data = publicRegisterSchema.parse(input);
	const email = data.email.toLowerCase().trim();

	const existing = await prisma.user.findUnique({ where: { email } });
	if (existing) throw new Error("Email already exists");

	const count = await prisma.user.count();
	const role: "ADMIN" | "SALES" = count === 0 ? "ADMIN" : "SALES";

	const passwordHash = await bcrypt.hash(data.password, 10);
	const user = await prisma.user.create({
		data: {
			email,
			passwordHash,
			role,
			name: data.name ?? null,
		},
	});

	return { id: user.id, email: user.email, role: user.role, name: user.name };
}
