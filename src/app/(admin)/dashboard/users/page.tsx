import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FormCard } from "@/components/form-shell";
import { getUsers } from "@/data/users";
import { UserRowActions } from "./user-row-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Users</div>
          <div className="text-xs text-muted-foreground">Admins and sales accounts</div>
        </div>
        <Button asChild>
          <Link href="/dashboard/users/new">New user</Link>
        </Button>
      </div>

      <FormCard title="All users" description="Admins and sales accounts.">
          <div className="rounded-sm border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.email}</TableCell>
                    <TableCell>{u.name ?? "—"}</TableCell>
                    <TableCell>{u.role}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {u.createdAt.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <UserRowActions id={u.id} email={u.email} />
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                      No users
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
      </FormCard>
    </div>
  );
}
