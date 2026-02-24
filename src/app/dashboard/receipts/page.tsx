"use client";

export const dynamic = "force-dynamic";

import { getGroups } from "@/features/admin/actions/group-actions";
import {
  deleteReceiptAction,
  getReceiptsAction,
} from "@/features/receipts/actions/receipt-actions";
import { ReceiptCard } from "@/features/receipts/components/receipt-card";
import { CreateReceiptModal } from "@/shared/components/create-receipt-modal";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import type { Group, Receipt } from "@/shared/types";
import { Plus, ReceiptText } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

// ─── Skeleton ────────────────────────────────────────────────────────────────

function ReceiptCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-7 w-1/2" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 w-10" />
      </div>
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
      <div className="rounded-full bg-muted p-6">
        <ReceiptText className="h-10 w-10 text-muted-foreground" />
      </div>
      <div>
        <p className="font-semibold text-base">Nenhum recibo ainda</p>
        <p className="text-sm text-muted-foreground mt-1">
          Adicione seu primeiro recibo para começar a controlar suas finanças.
        </p>
      </div>
      <Button onClick={onNew}>
        <Plus className="h-4 w-4 mr-2" />
        Novo Recibo
      </Button>
    </div>
  );
}

// ─── Page content ─────────────────────────────────────────────────────────────

function ReceiptsPageContent() {
  const searchParams = useSearchParams();

  const [receipts, setReceipts] = useState<
    (Receipt & { groups?: { nome: string } | null })[]
  >([]);
  const [_groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadData();
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
      const mapped = (receiptsResult.data ?? []).map((r: any) => ({
        ...r,
        created_by: r.users ?? undefined,
      }));
      setReceipts(mapped);
    }

    if (groupsResult.success) {
      setGroups(groupsResult.groups ?? []);
    }

    setIsLoading(false);
  };

  const handleDelete = async (receiptId: string) => {
    if (!confirm("Tem certeza que deseja excluir este recibo?")) return;
    const result = await deleteReceiptAction(receiptId);
    if (result.success) {
      await loadData();
    } else {
      alert(result.error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Recibos</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie suas entradas e despesas.
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Recibo
        </Button>
      </div>

      {/* Modal */}
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

      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ReceiptCardSkeleton key={i} />
          ))}
        </div>
      ) : receipts.length === 0 ? (
        <EmptyState onNew={() => setShowCreateModal(true)} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {receipts.map((receipt) => (
            <ReceiptCard
              key={receipt.id}
              receipt={receipt}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReceiptsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="flex flex-col gap-1">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-4 w-56" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ReceiptCardSkeleton key={i} />
            ))}
          </div>
        </div>
      }
    >
      <ReceiptsPageContent />
    </Suspense>
  );
}
