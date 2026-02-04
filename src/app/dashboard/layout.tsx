"use client";

import React, { useState } from "react";
import { Sidebar } from "@/shared/components/sidebar";
import { Header } from "@/shared/components/header";
import { TransactionModal } from "@/features/dashboard/components/transaction-modal";
import { CreateReceiptModal } from "@/shared/components/create-receipt-modal";
import { TransactionItemProps } from "@/features/dashboard/types";
import {
  TransactionModalContext,
  CreateReceiptModalContext,
  SearchContext,
  useTransactions,
  useTransactionModal,
  useCreateReceiptModal,
  TransactionsProvider,
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { transactions } = useTransactions();
  const { openTransactionModal } = useTransactionModal();

  const handleTransactionSelect = (transaction: TransactionItemProps) => {
    openTransactionModal(transaction);
  };

  return (
    <SearchContext.Provider value={{ searchTerm, setSearchTerm }}>
      <div
        className={`min-h-screen font-sans flex overflow-hidden transition-colors duration-300 bg-background text-foreground`}
      >
        {/* Sidebar Overlay Mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`
        fixed lg:static inset-y-0 left-0 z-30
        transform transition-all duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
        >
          <Sidebar />
        </div>

        {/* Main Content */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
          {/* Header */}
          <Header
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            onTransactionSelect={handleTransactionSelect}
          />

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-8 pb-20">
            <div className="max-w-7xl mx-auto">{children}</div>
          </div>
        </main>

        {/* Transaction Modal */}
        <TransactionModal
          transaction={selectedTransaction}
          isOpen={isModalOpen}
          onClose={closeTransactionModal}
        />

        {/* Create Receipt Modal */}
        <CreateReceiptModal
          isOpen={isCreateReceiptModalOpen}
          onClose={closeCreateReceiptModal}
          onSuccess={() => {
            closeCreateReceiptModal();
            // TODO: Implementar atualização assíncrona dos dados do dashboard
            // Por enquanto, apenas fechar o modal
          }}
        />
      </div>
    </SearchContext.Provider>
  );
}
