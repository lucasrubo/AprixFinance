"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { CurrencyInput } from "@/shared/components/ui/currency-input";
import { Label } from "@/shared/components/ui/label";
import { Plus, Edit, Trash2, DollarSign, Calendar } from "lucide-react";
import {
  getReceiptsAction,
  createReceiptAction,
  updateReceiptAction,
  deleteReceiptAction,
  getMonthlyStatsAction,
} from "@/features/receipts/actions/receipt-actions";
import { getGroups } from "@/features/admin/actions/group-actions";
import { Receipt, Group } from "@/shared/types";

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<any>(null);
  const [formData, setFormData] = useState({
    titulo: "",
    valor: "",
    descricao: "",
    data: new Date().toISOString().split("T")[0],
    groupId: "",
    tipo: "saida" as "entrada" | "saida",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [receiptsResult, groupsResult] = await Promise.all([
      getReceiptsAction(),
      getGroups(),
    ]);

    if (receiptsResult.success) {
      // Mapear os dados para incluir created_by
      const mappedReceipts = (receiptsResult.data || []).map(
        (receipt: any) => ({
          ...receipt,
          created_by: receipt.users,
        }),
      );
      setReceipts(mappedReceipts);
    }
    if (groupsResult.success) {
      setGroups(groupsResult.groups || []);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = new FormData();
    data.append("titulo", formData.titulo);
    data.append("valor", formData.valor);
    data.append("descricao", formData.descricao);
    data.append("data", formData.data);
    data.append("tipo", formData.tipo);
    if (formData.groupId) {
      data.append("groupId", formData.groupId);
    }

    let result;
    if (editingReceipt) {
      result = await updateReceiptAction(editingReceipt.id, data);
    } else {
      result = await createReceiptAction(data);
    }

    if (result.success) {
      await loadData();
      setShowCreateForm(false);
      setEditingReceipt(null);
      setFormData({
        titulo: "",
        valor: "",
        descricao: "",
        data: new Date().toISOString().split("T")[0],
        groupId: "",
        tipo: "saida",
      });
    } else {
      alert(result.error);
    }
  };

  const handleEdit = (receipt: any) => {
    setEditingReceipt(receipt);
    setFormData({
      titulo: receipt.titulo,
      valor: receipt.valor.toString(),
      descricao: receipt.descricao || "",
      data: receipt.data,
      groupId: receipt.group_id || "",
      tipo: receipt.tipo || "saida",
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (receiptId: string) => {
    if (confirm("Tem certeza que deseja excluir este recibo?")) {
      const result = await deleteReceiptAction(receiptId);
      if (result.success) {
        await loadData();
      } else {
        alert(result.error);
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    // Assumir que a string está no formato YYYY-MM-DD e formatar diretamente
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Recibos</h1>
          <p className="text-muted-foreground">
            Gerencie seus recibos e despesas.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingReceipt(null);
            setFormData({
              titulo: "",
              valor: "",
              descricao: "",
              data: new Date().toISOString().split("T")[0],
              groupId: "",
              tipo: "saida",
            });
            setShowCreateForm(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Recibo
        </Button>
      </div>

      {showCreateForm && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>
              {editingReceipt ? "Editar Recibo" : "Novo Recibo"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="titulo">Título</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) =>
                    setFormData({ ...formData, titulo: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="valor">Valor</Label>
                <CurrencyInput
                  id="valor"
                  value={formData.valor}
                  onValueChange={(value) =>
                    setFormData({ ...formData, valor: value })
                  }
                  placeholder="0,00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="tipo">Tipo</Label>
                <select
                  id="tipo"
                  value={formData.tipo}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tipo: e.target.value as "entrada" | "saida",
                    })
                  }
                  className="w-full p-2 border border-border rounded-md bg-background text-foreground"
                >
                  <option value="saida">Saída (Despesa)</option>
                  <option value="entrada">Entrada (Receita)</option>
                </select>
              </div>
              <div>
                <Label htmlFor="data">Data</Label>
                <Input
                  id="data"
                  type="date"
                  value={formData.data}
                  onChange={(e) =>
                    setFormData({ ...formData, data: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="groupId">Grupo (opcional)</Label>
                <select
                  id="groupId"
                  value={formData.groupId}
                  onChange={(e) =>
                    setFormData({ ...formData, groupId: e.target.value })
                  }
                  className="w-full p-2 border border-border rounded-md bg-background text-foreground"
                >
                  <option value="">Nenhum</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) =>
                    setFormData({ ...formData, descricao: e.target.value })
                  }
                  className="w-full p-2 border border-border rounded-md bg-background text-foreground"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingReceipt ? "Atualizar" : "Criar"} Recibo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      {isLoading ? (
        <div>Carregando...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {receipts.map((receipt) => (
            <Card
              key={receipt.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{receipt.titulo}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {formatDate(receipt.data)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  {formatCurrency(receipt.valor)}
                </div>
                {receipt.descricao && (
                  <p className="text-sm text-muted-foreground">
                    {receipt.descricao}
                  </p>
                )}
                {receipt.groups && (
                  <div className="text-sm">
                    <span className="font-medium">Grupo:</span>{" "}
                    {receipt.groups.nome}
                  </div>
                )}
                {receipt.created_by && (
                  <div className="text-sm text-muted-foreground">
                    Criado por {receipt.created_by.nome}
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(receipt)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(receipt.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
