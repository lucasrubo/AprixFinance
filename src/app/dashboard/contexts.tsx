"use client";

import type { TransactionItemProps } from "@/features/dashboard/types";
import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";

// Contexto para o modal de transação
interface TransactionModalContextType {
  openTransactionModal: (transaction: TransactionItemProps) => void;
}

// Contexto para o modal de criação de receipt
interface CreateReceiptModalContextType {
  openCreateReceiptModal: () => void;
}

// Contexto para busca global
interface SearchContextType {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

// Contexto para transações
interface TransactionsContextType {
  transactions: TransactionItemProps[];
  setTransactions: (transactions: TransactionItemProps[]) => void;
}

// Criação dos contextos
export const TransactionModalContext =
  createContext<TransactionModalContextType | null>(null);
export const CreateReceiptModalContext =
  createContext<CreateReceiptModalContextType | null>(null);
export const SearchContext = createContext<SearchContextType | null>(null);
export const TransactionsContext =
  createContext<TransactionsContextType | null>(null);

// Hooks personalizados
export function useTransactionModal(): TransactionModalContextType {
  const context = useContext(TransactionModalContext);
  if (!context) {
    throw new Error(
      "useTransactionModal must be used within a TransactionModalProvider",
    );
  }
  return context;
}

export function useCreateReceiptModal(): CreateReceiptModalContextType {
  const context = useContext(CreateReceiptModalContext);
  if (!context) {
    throw new Error(
      "useCreateReceiptModal must be used within a CreateReceiptModalProvider",
    );
  }
  return context;
}

export function useSearch(): SearchContextType {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
}

export function useTransactions(): TransactionsContextType {
  const context = useContext(TransactionsContext);
  if (!context) {
    throw new Error(
      "useTransactions must be used within a TransactionsProvider",
    );
  }
  return context;
}

// Provider para transações
export function TransactionsProvider({
  children,
  transactions,
}: {
  children: React.ReactNode;
  transactions: TransactionItemProps[];
}) {
  const [transactionsState, setTransactionsState] = useState(transactions);

  useEffect(() => {
    setTransactionsState(transactions);
  }, [transactions]);

  return (
    <TransactionsContext.Provider
      value={{
        transactions: transactionsState,
        setTransactions: setTransactionsState,
      }}
    >
      {children}
    </TransactionsContext.Provider>
  );
}
