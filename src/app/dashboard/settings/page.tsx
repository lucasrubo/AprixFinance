import { SettingsForm } from "@/features/settings/components/settings-form";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie suas informações pessoais e preferências
        </p>
      </div>

      <div className="max-w-2xl">
        <SettingsForm />
      </div>
    </div>
  );
}

export const metadata = {
  title: "Configurações - Finance AI",
  description: "Gerencie suas configurações pessoais",
};
