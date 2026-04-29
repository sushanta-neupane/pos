import { notFound } from "next/navigation";
import { getUserById } from "@/data/users";
import { UserEditForm } from "./user-edit-form";

export const dynamic = "force-dynamic";

export default async function UserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUserById(id);
  if (!user) notFound();
  return <UserEditForm user={user} />;
}
