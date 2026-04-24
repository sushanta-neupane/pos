import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { UserEditForm } from "./user-edit-form";

export const dynamic = "force-dynamic";

export default async function UserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) notFound();
  return <UserEditForm user={user} />;
}

