"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { GroupManagement } from "@/features/admin/components/group-management";
import {
  getGroups,
  createGroup,
  addUserToGroup,
  removeUserFromGroup,
  getUsers,
} from "@/features/admin/actions/group-actions";
import { Group, User, GroupMember } from "@/shared/types";

export default function GroupsPage() {
  const [groups, setGroups] = useState<(Group & { members: GroupMember[] })[]>(
    [],
  );
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [groupsResult, usersResult] = await Promise.all([
      getGroups(),
      getUsers(),
    ]);

    if (groupsResult.success) {
      setGroups(groupsResult.groups || []);
    }
    if (usersResult.success) {
      setUsers(usersResult.users || []);
    }
    setIsLoading(false);
  };

  const handleCreateGroup = async (name: string) => {
    const result = await createGroup(name);
    if (result.success) {
      await loadData();
    } else {
      alert(result.error);
    }
  };

  const handleAddUserToGroup = async (userId: string, groupId: string) => {
    const result = await addUserToGroup(userId, groupId);
    if (result.success) {
      await loadData();
    } else {
      alert(result.error);
    }
  };

  const handleRemoveUserFromGroup = async (memberId: string) => {
    const result = await removeUserFromGroup(memberId);
    if (result.success) {
      await loadData();
    } else {
      alert(result.error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gerenciamento de Grupos</h1>
        <p className="text-muted-foreground">
          Crie e gerencie grupos de usuários para organizar seus recibos.
        </p>
      </div>

      <GroupManagement
        groups={groups}
        users={users}
        isLoading={isLoading}
        onCreateGroup={handleCreateGroup}
        onAddUserToGroup={handleAddUserToGroup}
        onRemoveUserFromGroup={handleRemoveUserFromGroup}
      />
    </div>
  );
}
