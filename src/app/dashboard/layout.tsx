"use client";

import { TransactionModal } from "@/features/dashboard/components/transaction-modal";
import type { TransactionItemProps } from "@/features/dashboard/types";
import { CreateReceiptModal } from "@/shared/components/create-receipt-modal";
import { Header } from "@/shared/components/header";
import { Sidebar as AppSidebar } from "@/shared/components/sidebar";
import { SidebarInset, SidebarProvider } from "@/shared/components/ui/sidebar";
import type React from "react";
import { useState } from "react";
import {
  CreateReceiptModalContext,
  SearchContext,
  TransactionModalContext,
  TransactionsProvider,
  useTransactionModal,
  useTransactions,
} from "./contexts";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionItemProps | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateReceiptModalOpen, setIsCreateReceiptModalOpen] =
    useState(false);

  const openTransactionModal = (transaction: TransactionItemProps) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const openCreateReceiptModal = () => {
    setIsCreateReceiptModalOpen(true);
  };

  const closeTransactionModal = () => {
    setIsModalOpen(false);
    setSelectedTransaction(null);
  };

  const closeCreateReceiptModal = () => {
    setIsCreateReceiptModalOpen(false);
  };

  return (
    <TransactionModalContext.Provider value={{ openTransactionModal }}>
      <CreateReceiptModalContext.Provider value={{ openCreateReceiptModal }}>
        <TransactionsProvider transactions={[]}>
          <DashboardLayoutClient
            selectedTransaction={selectedTransaction}
            isModalOpen={isModalOpen}
            isCreateReceiptModalOpen={isCreateReceiptModalOpen}
            closeTransactionModal={closeTransactionModal}
            closeCreateReceiptModal={closeCreateReceiptModal}
          >
            {children}
          </DashboardLayoutClient>
        </TransactionsProvider>
      </CreateReceiptModalContext.Provider>
    </TransactionModalContext.Provider>
  );
}

// Componente cliente que contém toda a lógica do layout
function DashboardLayoutClient({
  children,
  selectedTransaction,
  isModalOpen,
  isCreateReceiptModalOpen,
  closeTransactionModal,
  closeCreateReceiptModal,
}: {
  children: React.ReactNode;
  selectedTransaction: TransactionItemProps | null;
  isModalOpen: boolean;
  isCreateReceiptModalOpen: boolean;
  closeTransactionModal: () => void;
  closeCreateReceiptModal: () => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  useTransactions();
  const { openTransactionModal } = useTransactionModal();

  const handleTransactionSelect = (transaction: TransactionItemProps) => {
    openTransactionModal(transaction);
  };

  return (
    <SearchContext.Provider value={{ searchTerm, setSearchTerm }}>
      <SidebarProvider>
        <div className="flex min-h-screen bg-muted/20 text-foreground w-full">
          <AppSidebar />
          <SidebarInset className="font-sans lg:rounded-[32px] lg:border lg:border-border/50 lg:bg-card/80 lg:shadow-lg">
            <Header onTransactionSelect={handleTransactionSelect} />
            <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-12 lg:py-10">
              <div className="mx-auto w-full max-w-6xl">{children}</div>
            </div>
          </SidebarInset>
        </div>
        <TransactionModal
          transaction={selectedTransaction}
          isOpen={isModalOpen}
          onClose={closeTransactionModal}
        />
        <CreateReceiptModal
          isOpen={isCreateReceiptModalOpen}
          onClose={closeCreateReceiptModal}
          onSuccess={() => {
            closeCreateReceiptModal();
          }}
          trigger={
            <button
              type="button"
              style={{ display: "none" }}
              id="create-receipt-trigger"
            >
              Trigger
            </button>
          }
        />
      </SidebarProvider>
    </SearchContext.Provider>
  );
}
