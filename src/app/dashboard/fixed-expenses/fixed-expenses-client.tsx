"use client";

import React, { useState, useEffect } from "react";
import { Plus, Calendar, DollarSign, AlertTriangle } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { FixedExpenseCard } from "@/features/fixed-expenses/components/fixed-expense-card";
import { FixedExpenseForm } from "@/features/fixed-expenses/components/fixed-expense-form";
import {
  getFixedExpensesAction,
  createFixedExpenseAction,
  updateFixedExpenseAction,
  deleteFixedExpenseAction,
  toggleFixedExpenseStatusAction,
} from "@/features/fixed-expenses/actions/fixed-expense-actions";
import {
  FixedExpense,
  CreateFixedExpenseData,
} from "@/features/fixed-expenses/types";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export function FixedExpensesClient({
  initialExpenses,
}: {
  initialExpenses: FixedExpense[];
}) {
  const [expenses, setExpenses] = useState<FixedExpense[]>(initialExpenses);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<
    FixedExpense | undefined
  >();
  const [isLoading, setIsLoading] = useState(false);

  const activeExpenses = expenses.filter((exp) => exp.status === "ativo");
  const pausedExpenses = expenses.filter((exp) => exp.status === "pausado");
  const totalMonthly = activeExpenses.reduce(
    (sum, exp) => sum + exp.valor_parcela,
    0,
  );

  const refreshExpenses = async () => {
    const result = await getFixedExpensesAction();
    if (result.success && result.data) {
      setExpenses(result.data);
    }
  };

  const handleSubmit = async (data: CreateFixedExpenseData) => {
    setIsLoading(true);
    try {
      if (editingExpense) {
        const result = await updateFixedExpenseAction(editingExpense.id, data);
        if (result.success) {
          await refreshExpenses();
        }
      } else {
        const result = await createFixedExpenseAction(data);
        if (result.success) {
          await refreshExpenses();
        }
      }
      setIsFormOpen(false);
      setEditingExpense(undefined);
    } catch (error) {
      console.error("Erro ao salvar gasto fixo:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (expense: FixedExpense) => {
    setEditingExpense(expense);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este gasto fixo?")) {
      const result = await deleteFixedExpenseAction(id);
      if (result.success) {
        await refreshExpenses();
      }
    }
  };

  const handleToggleStatus = async (
    id: string,
    status: "ativo" | "pausado",
  ) => {
    const result = await toggleFixedExpenseStatusAction(id, status);
    if (result.success) {
      await refreshExpenses();
    }
  };

  const handleNewExpense = () => {
    setEditingExpense(undefined);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingExpense(undefined);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gastos Fixos</h1>
          <p className="text-muted-foreground">
            Gerencie seus gastos recorrentes e assinaturas
          </p>
        </div>
        <Button onClick={handleNewExpense}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Gasto Fixo
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Total Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(totalMonthly)}
            </p>
            <p className="text-sm text-muted-foreground">
              {activeExpenses.length} gastos ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Gastos Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {activeExpenses.length}
            </p>
            <p className="text-sm text-muted-foreground">Em vigor este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Gastos Pausados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">
              {pausedExpenses.length}
            </p>
            <p className="text-sm text-muted-foreground">
              Temporariamente inativos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Gastos Fixos */}
      {expenses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhum gasto fixo cadastrado
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              Comece adicionando seus gastos recorrentes como aluguel,
              assinaturas e outras despesas fixas.
            </p>
            <Button onClick={handleNewExpense}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Primeiro Gasto
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Gastos Ativos */}
          {activeExpenses.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Gastos Ativos ({activeExpenses.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {activeExpenses.map((expense) => (
                  <FixedExpenseCard
                    key={expense.id}
                    expense={expense}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleStatus={handleToggleStatus}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Gastos Pausados */}
          {pausedExpenses.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Gastos Pausados ({pausedExpenses.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {pausedExpenses.map((expense) => (
                  <FixedExpenseCard
                    key={expense.id}
                    expense={expense}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleStatus={handleToggleStatus}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal do Formulário */}
      <FixedExpenseForm
        expense={editingExpense}
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
