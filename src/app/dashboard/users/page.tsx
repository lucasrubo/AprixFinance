"use client";

export const dynamic = "force-dynamic";

import {
  createUser,
  deleteUser,
  getUsers,
} from "@/features/admin/actions/user-actions";
import { UserManagement } from "@/features/admin/components/user-management";
import type { User } from "@/shared/types";
import { useEffect, useState } from "react";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    const result = await getUsers();
    if (result.success) {
      setUsers(result.users || []);
    }
    setIsLoading(false);
  };

  const handleCreateUser = async (
    email: string,
    name?: string,
    password?: string,
  ) => {
    const result = await createUser(email, name, password);
    if (result.success) {
      await loadUsers();
    } else {
      alert(result.error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const result = await deleteUser(userId);
    if (result.success) {
      await loadUsers();
    } else {
      alert(result.error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gerenciamento de Usuários</h1>
        <p className="text-muted-foreground">
          Crie e gerencie usuários do sistema.
        </p>
      </div>

      <UserManagement
        users={users}
        isLoading={isLoading}
        onCreateUser={handleCreateUser}
        onDeleteUser={handleDeleteUser}
      />
    </div>
  );
}
