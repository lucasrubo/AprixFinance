"use client";

import React, { useEffect, useState } from "react";
import {
  Moon,
  Search,
  Sun,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { TransactionItemProps } from "@/features/dashboard/types";
import { searchItemsAction } from "@/features/search/actions/search-actions";
import { NotificationDropdown } from "@/features/notifications/components/notification-dropdown";
import { SidebarTrigger } from "@/shared/components/ui/sidebar";

interface HeaderProps {
  onTransactionSelect: (transaction: TransactionItemProps) => void;
}

export function Header({ onTransactionSelect }: HeaderProps) {
  const router = useRouter();
  const [isDark, setIsDark] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<TransactionItemProps[]>(
    [],
  );
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] =
    useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const initialDark = savedTheme ? savedTheme === "dark" : prefersDark;
    setIsDark(initialDark);
    document.documentElement.classList.toggle("dark", initialDark);
  }, []);

  const toggleTheme = () => {
    const nextValue = !isDark;
    setIsDark(nextValue);
    document.documentElement.classList.toggle("dark", nextValue);
    localStorage.setItem("theme", nextValue ? "dark" : "light");
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const performSearch = async (term: string) => {
    if (term.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    try {
      const result = await searchItemsAction(term);
      if (result.success && result.data) {
        setSearchResults(result.data);
        setShowDropdown(true);
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    } catch (error) {
      console.error("Erro na busca:", error);
      setSearchResults([]);
      setShowDropdown(false);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (!searchTerm) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      void performSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleTransactionSelect = (transaction: TransactionItemProps) => {
    onTransactionSelect(transaction);
    setSearchTerm("");
    setSearchResults([]);
    setShowDropdown(false);
  };

  const shouldShowEmptyState =
    showDropdown && searchTerm && !isSearching && searchResults.length === 0;

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:h-20 lg:px-8 lg:rounded-t-xl">
      <div className="flex flex-1 items-center gap-3">
        <SidebarTrigger className="lg:-ml-4" />
        <div className="relative hidden flex-1 items-center md:flex">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar transações, grupos..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            className="h-11 w-full rounded-xl border border-border bg-muted/60 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring"
          />

          {showDropdown && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 mt-2 max-h-80 overflow-y-auto rounded-xl border border-border bg-card shadow-lg">
              {searchResults.map((transaction) => (
                <button
                  key={`${transaction.itemType}-${transaction.id}`}
                  type="button"
                  onClick={() => handleTransactionSelect(transaction)}
                  className="flex w-full items-center justify-between border-b border-border px-4 py-3 text-left last:border-b-0 hover:bg-accent"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        transaction.type === "expense"
                          ? "bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
                          : "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                      }`}
                    >
                      {transaction.type === "expense" ? (
                        <TrendingDown size={16} />
                      ) : (
                        <TrendingUp size={16} />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          {transaction.title}
                        </span>
                        <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                          {transaction.itemType === "receipt"
                            ? "Recibo"
                            : "Gasto Fixo"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {transaction.group} • {transaction.date}
                      </p>
                      {transaction.description && (
                        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                          {transaction.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      transaction.type === "expense"
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {transaction.type === "expense" ? "-" : "+"}
                    {transaction.amount}
                  </span>
                </button>
              ))}
            </div>
          )}

          {isSearching && (
            <div className="absolute top-full left-0 right-0 z-50 mt-2 rounded-xl border border-border bg-card p-4 shadow-lg">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <div className="h-4 w-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                Buscando...
              </div>
            </div>
          )}

          {shouldShowEmptyState && (
            <div className="absolute top-full left-0 right-0 z-50 mt-2 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground shadow-lg">
              Nenhum resultado encontrado para “{searchTerm}”
            </div>
          )}
        </div>{" "}
      </div>

      <div className="ml-auto flex items-center gap-3">
        <button
          type="button"
          onClick={toggleTheme}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-transparent text-muted-foreground transition-colors hover:border-border hover:text-foreground"
          title={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-transparent text-muted-foreground transition-colors hover:border-border hover:text-foreground disabled:opacity-50"
          title="Atualizar página"
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw size={18} />
          )}
        </button>
        <NotificationDropdown
          isOpen={isNotificationDropdownOpen}
          onToggle={() =>
            setIsNotificationDropdownOpen(!isNotificationDropdownOpen)
          }
          onClose={() => setIsNotificationDropdownOpen(false)}
        />
      </div>
    </header>
  );
}
