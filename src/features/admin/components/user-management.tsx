"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Badge } from "@/shared/components/ui/badge";
import { Plus, Users, Trash2 } from "lucide-react";
import { User } from "@/shared/types";

interface UserManagementProps {
  users?: User[];
  isLoading?: boolean;
  onCreateUser?: (email: string, name?: string, password?: string) => void;
  onDeleteUser?: (userId: string) => void;
}

export function UserManagement({
  users = [],
  isLoading = false,
  onCreateUser,
  onDeleteUser,
}: UserManagementProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    nome: "",
    password: "user123",
  });
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateUser = async () => {
    if (!newUser.email || !onCreateUser) return;

    setIsCreating(true);
    try {
      await onCreateUser(
        newUser.email,
        newUser.nome || undefined,
        newUser.password,
      );
      setNewUser({ email: "", nome: "", password: "user123" });
      setShowCreateForm(false);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (
      onDeleteUser &&
      confirm("Tem certeza que deseja excluir este usuário?")
    ) {
      onDeleteUser(userId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-cyan-400" />
          <Badge variant="outline" className="text-cyan-300 border-cyan-300">
            {users.length} usuários
          </Badge>
        </div>

        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      {showCreateForm && (
        <Card className=" ">
          <CardHeader>
            <CardTitle>Criar Novo Usuário</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
                placeholder="usuario@exemplo.com"
              />
            </div>

            <div>
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={newUser.nome}
                onChange={(e) =>
                  setNewUser({ ...newUser, nome: e.target.value })
                }
                placeholder="Nome completo (opcional)"
              />
            </div>

            <div>
              <Label htmlFor="password">Senha Padrão</Label>
              <Input
                id="password"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
                placeholder="Senha inicial"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleCreateUser}
                disabled={!newUser.email || isCreating}
                className="bg-green-600 hover:bg-green-700 text-primary-foreground"
              >
                {isCreating ? "Criando..." : "Criar Usuário"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(false)}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className=" ">
        <CardHeader>
          <CardTitle>Usuários Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-md animate-pulse"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded-full"></div>
                    <div className="space-y-2">
                      <div className="w-40 h-4 bg-muted rounded"></div>
                      <div className="w-24 h-3 bg-muted rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum usuário cadastrado</p>
              <p className="text-sm">
                Clique em &quot;Novo Usuário&quot; para começar
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-md hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                      <span className="text-primary font-medium">
                        {user.nome?.[0] || user.email[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-foreground font-medium">
                          {user.nome || user.email.split("@")[0]}
                        </span>
                        <Badge
                          variant={
                            user.tipo === "admin" ? "default" : "secondary"
                          }
                          className={
                            user.tipo === "admin"
                              ? "bg-orange-900/50 text-orange-300 border-orange-700"
                              : "bg-muted text-muted-foreground"
                          }
                        >
                          {user.tipo === "admin" ? "Admin" : "Usuário"}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  {user.tipo !== "admin" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
