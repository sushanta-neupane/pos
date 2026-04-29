import type { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const credentialsSchema = z.object({
	email: z.string().email(),
	password: z.string().min(1),
});

export const authOptions: NextAuthOptions = {
	secret: process.env.NEXTAUTH_SECRET,
	session: { strategy: "jwt" },
	pages: { signIn: "/signin" },
	providers: [
		CredentialsProvider({
			name: "Credentials",
			credentials: {
				email: { label: "Email", type: "email" },
				password: { label: "Password", type: "password" },
			},
			async authorize(credentials) {
				const parsed = credentialsSchema.safeParse(credentials);
				if (!parsed.success) return null;

				const user = await prisma.user.findUnique({
					where: { email: parsed.data.email.toLowerCase() },
				});
				if (!user) return null;

				const ok = await bcrypt.compare(
					parsed.data.password,
					user.passwordHash,
				);
				if (!ok) return null;

				return {
					id: user.id,
					email: user.email,
					name: user.name ?? undefined,
					role: user.role as Role,
				};
			},
		}),
	],
	callbacks: {
		async jwt({ token, user }) {
			if (user) {
				token.uid = user.id;
				token.role = user.role as Role;
			}
			return token;
		},
		async session({ session, token }) {
			if (session.user) {
				if (token.uid) session.user.id = token.uid;
				if (token.role) session.user.role = token.role as Role;
			}
			return session;
		},
	},
};
