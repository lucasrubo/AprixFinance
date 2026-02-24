"use client";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { CurrencyInput } from "@/shared/components/ui/currency-input";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { DollarSign, Loader2, Phone } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { updateUserProfileAction } from "../actions/settings-actions";
import { useUserProfile } from "../hooks/use-user-profile";

export function SettingsForm() {
  const {
    user,
    loading: userLoading,
    error: userError,
    refetch,
  } = useUserProfile();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Estado local para os valores dos campos
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [salario, setSalario] = useState("");

  // Atualizar estado local quando user carrega
  useEffect(() => {
    if (user) {
      setNome(user.nome);
      setTelefone(user.telefone || "");
      setSalario(user.salario?.toString() || "");
    }
  }, [user]);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await updateUserProfileAction(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        // Recarregar dados do usuário após sucesso
        await refetch();
      }
    });
  }

  if (userLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (userError || !user) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-destructive">
            Erro ao carregar dados do usuário
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <form action={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="nome" className="text-sm font-medium">
              Nome Completo
            </Label>
            <Input
              id="nome"
              name="nome"
              type="text"
              placeholder="Digite seu nome completo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              disabled={isPending}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="telefone"
              className="text-sm font-medium flex items-center gap-2"
            >
              <Phone className="h-4 w-4" />
              Telefone
            </Label>
            <Input
              id="telefone"
              name="telefone"
              type="tel"
              placeholder="(11) 99999-9999"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              disabled={isPending}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="salario"
              className="text-sm font-medium flex items-center gap-2"
            >
              <DollarSign className="h-4 w-4" />
              Salário Mensal
            </Label>
            <CurrencyInput
              id="salario"
              name="salario"
              value={salario}
              onValueChange={setSalario}
              placeholder="5000,00"
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              Informe seu salário mensal para melhor controle financeiro
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Email</Label>
            <Input
              type="email"
              value={user.email}
              disabled
              className="h-11 bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              O email não pode ser alterado
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-800">
              Perfil atualizado com sucesso!
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-11 text-base font-medium"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar Alterações"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
