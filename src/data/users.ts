import { prisma } from "@/lib/prisma";

export async function getUsers(limit = 200) {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}
