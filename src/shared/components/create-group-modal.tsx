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

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function CreateGroupModal({
  isOpen,
  onClose,
  onSuccess,
  trigger,
}: CreateGroupModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(isOpen);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    setOpen(isOpen);
  }, [isOpen]);

  useEffect(() => {
    if (open) {
      setFormData({ name: "", description: "" });
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

    if (!formData.name.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: formData.name.trim(),
          description: formData.description.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create group");
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error creating group:", error);
      alert("Erro ao criar grupo. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const ModalContent = () => (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Criar Novo Grupo</DialogTitle>
        <DialogDescription>
          Crie um novo grupo para organizar suas finanças compartilhadas.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome do Grupo *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Finanças da Família"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Input
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Descrição opcional do grupo"
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            type="submit"
            disabled={!formData.name.trim() || isLoading}
            className="flex-1"
          >
            {isLoading ? "Criando..." : "Criar Grupo"}
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
