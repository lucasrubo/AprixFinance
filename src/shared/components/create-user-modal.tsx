"use client";

import React, { useState, useEffect } from "react";
import { X, Plus } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function CreateUserModal({
  isOpen,
  onClose,
  onSuccess,
  trigger,
}: CreateUserModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(isOpen);
  const [formData, setFormData] = useState({
    email: "",
    nome: "",
    password: "user123",
  });

  useEffect(() => {
    setOpen(isOpen);
  }, [isOpen]);

  useEffect(() => {
    if (open) {
      setFormData({ email: "", nome: "", password: "user123" });
    }
  }, [open]);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          nome: formData.nome.trim() || undefined,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create user");
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error creating user:", error);
      alert("Erro ao criar usuário. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const ModalContent = () => (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Criar Novo Usuário</DialogTitle>
        <DialogDescription>
          Adicione um novo usuário ao sistema com acesso às funcionalidades.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            placeholder="usuario@exemplo.com"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="nome">Nome</Label>
          <Input
            id="nome"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            placeholder="Nome completo (opcional)"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Senha Padrão</Label>
          <Input
            id="password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            placeholder="Senha inicial"
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            type="submit"
            disabled={!formData.email.trim() || isLoading}
            className="flex-1"
          >
            {isLoading ? "Criando..." : "Criar Usuário"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </DialogContent>
  );

  if (trigger) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <ModalContent />
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <ModalContent />
    </Dialog>
  );
}
