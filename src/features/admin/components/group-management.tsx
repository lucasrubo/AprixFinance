"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Label } from "@/shared/components/ui/label";
import { Plus, Users, Settings, UserPlus, Trash2 } from "lucide-react";
import { Group, User, GroupMember } from "@/shared/types";
import { CreateGroupModal } from "@/shared/components/create-group-modal";

interface GroupManagementProps {
  groups?: (Group & { members: GroupMember[] })[];
  users?: User[];
  isLoading?: boolean;
  onCreateGroup?: (name: string, description?: string) => void;
  onAddUserToGroup?: (userId: string, groupId: string) => void;
  onRemoveUserFromGroup?: (userGroupId: string) => void;
}

export function GroupManagement({
  groups = [],
  users = [],
  isLoading = false,
  onCreateGroup,
  onAddUserToGroup,
  onRemoveUserFromGroup,
}: GroupManagementProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddUserForm, setShowAddUserForm] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState("");

  const handleAddUser = async (groupId: string) => {
    if (!selectedUser || !onAddUserToGroup) return;

    await onAddUserToGroup(selectedUser, groupId);
    setSelectedUser("");
    setShowAddUserForm(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Gerenciar Grupos</h2>
          <Badge variant="outline" className="bg-muted/60">
            {groups.length} grupos
          </Badge>
        </div>

        <CreateGroupModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            // Refresh groups list
            window.location.reload();
          }}
          trigger={
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Novo Grupo
            </Button>
          }
        />
      </div>

      <div className="grid gap-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Card key={i} className="  animate-pulse">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="h-6 w-40 bg-muted rounded mb-2"></div>
                      <div className="h-4 w-64 bg-muted rounded"></div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[1, 2].map((j) => (
                      <div
                        key={j}
                        className="flex items-center gap-3 p-3 bg-muted/30 rounded-md"
                      >
                        <div className="w-8 h-8 bg-muted rounded-full"></div>
                        <div className="h-4 w-32 bg-muted rounded"></div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <Card className=" ">
            <CardContent className="text-center py-12">
              <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Nenhum grupo criado
              </h3>
              <p className="text-muted-foreground mb-4">
                Crie seu primeiro grupo para começar a organizar as finanças
              </p>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Grupo
              </Button>
            </CardContent>
          </Card>
        ) : (
          groups.map((group) => (
            <Card key={group.id} className=" ">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-foreground text-xl">
                      {group.nome}
                    </CardTitle>
                    <Badge
                      variant="secondary"
                      className="mt-2 bg-muted text-muted-foreground"
                    >
                      {group.members.length}{" "}
                      {group.members.length === 1 ? "membro" : "membros"}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        setShowAddUserForm(
                          showAddUserForm === group.id ? null : group.id,
                        )
                      }
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground hover:text-foreground hover:bg-muted"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {showAddUserForm === group.id && (
                  <div className="mt-4 p-4 bg-muted/30 rounded-md space-y-3">
                    <Label>Adicionar Usuário ao Grupo</Label>
                    <div className="flex gap-2">
                      <select
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                        className="flex-1 bg-background border border-border text-foreground rounded-md px-3 py-2"
                      >
                        <option value="">Selecione um usuário</option>
                        {users
                          .filter(
                            (user) =>
                              !group.members.some((m) => m.user_id === user.id),
                          )
                          .map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.nome || user.email}
                            </option>
                          ))}
                      </select>
                      <Button
                        onClick={() => handleAddUser(group.id)}
                        disabled={!selectedUser}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        Adicionar
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowAddUserForm(null)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </CardHeader>

              <CardContent>
                {group.members.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhum membro neste grupo
                  </p>
                ) : (
                  <div className="space-y-2">
                    {group.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-md hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                            <span className="text-primary text-sm font-medium">
                              {member.user?.nome?.[0] ||
                                member.user?.email[0].toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-foreground font-medium">
                              {member.user?.nome ||
                                member.user?.email.split("@")[0]}
                            </p>
                            <p className="text-muted-foreground text-sm">
                              {member.user?.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              member.user?.tipo === "admin"
                                ? "default"
                                : "secondary"
                            }
                            className={
                              member.user?.tipo === "admin"
                                ? "bg-orange-900/50 text-orange-300 border-orange-700"
                                : "bg-muted text-muted-foreground"
                            }
                          >
                            {member.user?.tipo === "admin" ? "Admin" : "Membro"}
                          </Badge>

                          {member.user?.tipo !== "admin" &&
                            onRemoveUserFromGroup && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onRemoveUserFromGroup(member.id)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/20"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
