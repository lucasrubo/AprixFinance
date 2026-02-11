"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CreateReceiptModal } from "@/shared/components/create-receipt-modal";
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
import { Plus, Trash2, DollarSign, Calendar, Loader2 } from "lucide-react";
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
  const searchParams = useSearchParams();
  const [receipts, setReceipts] = useState<any[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadData();
    // Check if should open create modal
    if (searchParams.get("create") === "true") {
      setShowCreateModal(true);
    }
  }, [searchParams]);

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
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Recibo
        </Button>
      </div>

      {showCreateModal && (
        <CreateReceiptModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadData();
          }}
        />
      )}
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
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
