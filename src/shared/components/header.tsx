"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Menu,
  Moon,
  Sun,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { TransactionItemProps } from "@/features/dashboard/types";
import { searchItemsAction } from "@/features/search/actions/search-actions";
import { NotificationDropdown } from "@/features/notifications/components/notification-dropdown";

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  onTransactionSelect: (transaction: TransactionItemProps) => void;
}

export function Header({
  sidebarOpen,
  setSidebarOpen,
  onTransactionSelect,
}: HeaderProps) {
  const [isDark, setIsDark] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<TransactionItemProps[]>(
    [],
  );
  const [isSearching, setIsSearching] = useState(false);
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
    const newDark = !isDark;
    setIsDark(newDark);
    document.documentElement.classList.toggle("dark", newDark);
    localStorage.setItem("theme", newDark ? "dark" : "light");
  };

  // Função de busca assíncrona
  const performSearch = async (term: string) => {
    if (term.length < 2) {
      setSearchResults([]);
      setIsSearchDropdownOpen(false);
      return;
    }

    setIsSearching(true);
    try {
      const result = await searchItemsAction(term);
      if (result.success && result.data) {
        setSearchResults(result.data);
        setIsSearchDropdownOpen(true);
      } else {
        setSearchResults([]);
        setIsSearchDropdownOpen(false);
      }
    } catch (error) {
      console.error("Erro na busca:", error);
      setSearchResults([]);
      setIsSearchDropdownOpen(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);

    // Debounce da busca
    const timeoutId = setTimeout(() => {
      performSearch(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const handleTransactionSelect = (transaction: TransactionItemProps) => {
    onTransactionSelect(transaction);
    setIsSearchDropdownOpen(false);
    setSearchTerm("");
    setSearchResults([]);
  };

  return (
    <header className="h-20 px-8 flex items-center justify-between sticky top-0 z-10 border-b border-border bg-[hsl(var(--sidebar))]/60 backdrop-blur-md transition-colors">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 lg:hidden rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <Menu size={20} />
        </button>
        <div className="relative hidden md:block group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors text-muted-foreground group-focus-within:text-accent-foreground" />
          <input
            type="text"
            placeholder="Buscar transações, grupos..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => searchTerm && setIsSearchDropdownOpen(true)}
            onBlur={() => setTimeout(() => setIsSearchDropdownOpen(false), 200)}
            className="pl-10 pr-4 py-2.5 border-none rounded-xl text-sm w-80 transition-all outline-none bg-muted focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
          />

          {/* Lista de resultados de busca */}
          {isSearchDropdownOpen && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg max-h-80 overflow-y-auto z-50">
              {searchResults.map((transaction, index) => (
                <div
                  key={`${transaction.itemType}-${transaction.id}`}
                  onClick={() => handleTransactionSelect(transaction)}
                  className="flex items-center justify-between p-4 hover:bg-accent cursor-pointer border-b border-border last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
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
                        <h4 className="font-semibold text-foreground text-sm">
                          {transaction.title}
                        </h4>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {transaction.itemType === "receipt"
                            ? "Recibo"
                            : "Gasto Fixo"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {transaction.group} • {transaction.date}
                      </p>
                      {transaction.description && (
                        <p className="text-xs text-muted-foreground mt-1 truncate max-w-xs">
                          {transaction.description}
                        </p>
                      )}
                      {transaction.category && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          {transaction.category === "assinatura"
                            ? "Assinatura"
                            : transaction.category === "servico"
                              ? "Serviço"
                              : "Gasto Fixo"}
                        </p>
                      )}
                    </div>
                  </div>
                  <span
                    className={`font-bold text-sm whitespace-nowrap ${
                      transaction.type === "expense"
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {transaction.type === "expense" ? "-" : "+"}
                    {transaction.amount}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Indicador de carregamento */}
          {isSearching && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg p-4 z-50">
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-muted-foreground">Buscando...</p>
              </div>
            </div>
          )}

          {/* Mensagem quando não há resultados */}
          {isSearchDropdownOpen &&
            searchTerm &&
            !isSearching &&
            searchResults.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg p-4 z-50">
                <p className="text-sm text-muted-foreground text-center">
                  Nenhum resultado encontrado para &quot;{searchTerm}&quot;
                </p>
              </div>
            )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Theme Toggle Desktop */}
        <button
          onClick={toggleTheme}
          className="hidden lg:flex p-2.5 rounded-xl transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          title={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <NotificationDropdown
          isOpen={isNotificationDropdownOpen}
          onToggle={() =>
            setIsNotificationDropdownOpen(!isNotificationDropdownOpen)
          }
          onClose={() => setIsNotificationDropdownOpen(false)}
        />
        <div className="h-8 w-[1px] mx-1 hidden sm:block bg-border"></div>
        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-foreground">Lucas Rubo</p>
            <p className="text-xs text-muted-foreground">Premium Plan</p>
          </div>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
            LU
          </div>
        </div>
      </div>
    </header>
  );
}
