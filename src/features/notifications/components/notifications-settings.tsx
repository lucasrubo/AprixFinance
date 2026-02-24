"use client";

import { usePushNotifications } from "@/features/notifications/hooks/use-push-notifications";
import {
  getNotificationSettingsAction,
  updateNotificationSettingsAction,
} from "@/features/settings/actions/settings-actions";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Bell, BellOff, Loader2, Mail, MailX } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

export function NotificationsSettings() {
  const { state: pushState, subscribe, unsubscribe } = usePushNotifications();
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  useEffect(() => {
    getNotificationSettingsAction().then((res) => {
      if (!("error" in res)) {
        setEmailEnabled(res.email_notifications);
      }
      setLoadingSettings(false);
    });
  }, []);

  const showFeedback = (type: "success" | "error", msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handlePushToggle = async () => {
    if (pushState === "granted") {
      await unsubscribe();
      startTransition(async () => {
        await updateNotificationSettingsAction({ push_notifications: false });
        showFeedback("success", "Notificações push desativadas.");
      });
    } else {
      const result = await subscribe();
      if (result?.success) {
        startTransition(async () => {
          await updateNotificationSettingsAction({ push_notifications: true });
          showFeedback("success", "Notificações push ativadas!");
        });
      } else {
        showFeedback(
          "error",
          result?.error ?? "Não foi possível ativar as notificações.",
        );
      }
    }
  };

  const handleEmailToggle = () => {
    const newValue = !emailEnabled;
    setEmailEnabled(newValue);
    startTransition(async () => {
      const result = await updateNotificationSettingsAction({
        email_notifications: newValue,
      });
      if (result.error) {
        setEmailEnabled(!newValue);
        showFeedback("error", result.error);
      } else {
        showFeedback(
          "success",
          newValue
            ? "Notificações por e-mail ativadas!"
            : "Notificações por e-mail desativadas.",
        );
      }
    });
  };

  const pushIsLoading = pushState === "loading" || isPending;
  const pushIsGranted = pushState === "granted";
  const pushUnsupported = pushState === "unsupported";

  if (loadingSettings) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        <div>
          <h3 className="text-sm font-semibold mb-1">Notificações</h3>
          <p className="text-xs text-muted-foreground">
            Receba lembretes quando seus gastos fixos estiverem para vencer.
          </p>
        </div>

        {/* Push */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            {pushIsGranted ? (
              <Bell className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            ) : (
              <BellOff className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            )}
            <div>
              <p className="text-sm font-medium">Push (navegador / PWA)</p>
              <p className="text-xs text-muted-foreground">
                {pushUnsupported
                  ? "Não suportado neste dispositivo/navegador."
                  : pushIsGranted
                    ? "Ativo — você receberá alertas no navegador."
                    : "Inativo — clique para ativar."}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant={pushIsGranted ? "destructive" : "default"}
            size="sm"
            disabled={pushIsLoading || pushUnsupported}
            onClick={handlePushToggle}
          >
            {pushIsLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : pushIsGranted ? (
              "Desativar"
            ) : (
              "Ativar"
            )}
          </Button>
        </div>

        {/* Email */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            {emailEnabled ? (
              <Mail className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            ) : (
              <MailX className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            )}
            <div>
              <p className="text-sm font-medium">E-mail</p>
              <p className="text-xs text-muted-foreground">
                {emailEnabled
                  ? "Ativo — você receberá um resumo diário por e-mail."
                  : "Inativo — clique para ativar."}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant={emailEnabled ? "destructive" : "default"}
            size="sm"
            disabled={isPending}
            onClick={handleEmailToggle}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : emailEnabled ? (
              "Desativar"
            ) : (
              "Ativar"
            )}
          </Button>
        </div>

        {/* Feedback */}
        {feedback && (
          <div
            className={`p-3 rounded-lg text-sm ${
              feedback.type === "success"
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-destructive/10 border border-destructive/20 text-destructive"
            }`}
          >
            {feedback.msg}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
