import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Brain,
  MessageSquare,
  Receipt,
  Smartphone,
  TrendingUp,
  Shield,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { redirect, RedirectType } from "next/navigation";

export default function Home() {
  return redirect("/auth/login", RedirectType.replace);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold">Finance AI</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button asChild>
              <Link href="/auth/login">Entrar</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 container mx-auto px-4 py-20">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Gerencie suas finanças com
            <span className="text-blue-600"> Inteligência Artificial</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Sistema de gestão financeira pessoal com IA integrada.
            <br />
            <span className="text-cyan-400">
              Acesso controlado pelo administrador.
            </span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              asChild
              className="px-8 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Link href="/auth/login">Entrar no Sistema</Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-20">
          <Card className="text-center">
            <CardHeader>
              <Smartphone className="h-12 w-12 mx-auto text-blue-600 mb-4" />
              <CardTitle>WhatsApp Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Envie fotos das suas notas fiscais diretamente pelo WhatsApp.
                Nossa IA processa automaticamente.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Brain className="h-12 w-12 mx-auto text-green-600 mb-4" />
              <CardTitle>IA Inteligente</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Análises avançadas com BigModel AI. Extraia dados, categorize
                gastos e obtenha insights financeiros.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <MessageSquare className="h-12 w-12 mx-auto text-purple-600 mb-4" />
              <CardTitle>Chat Assistente</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                &quot;Posso sair hoje?&quot; &quot;Posso viajar esse mês?&quot;
                Pergunte qualquer coisa sobre suas finanças.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Receipt className="h-12 w-12 mx-auto text-orange-600 mb-4" />
              <CardTitle>OCR Avançado</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Reconhecimento automático de texto em notas fiscais. Extração
                precisa de produtos, valores e categorias.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <TrendingUp className="h-12 w-12 mx-auto text-red-600 mb-4" />
              <CardTitle>Análises Visuais</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Gráficos interativos, relatórios mensais e projeções de gastos
                para controle total.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Zap className="h-12 w-12 mx-auto text-yellow-600 mb-4" />
              <CardTitle>Tempo Real</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Notificações instantâneas, alertas de gastos e sincronização em
                tempo real entre dispositivos.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center space-y-6">
          <h2 className="text-3xl font-bold">
            Pronto para transformar suas finanças?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Junte-se a milhares de usuários que já estão usando IA para tomar
            decisões financeiras mais inteligentes.
          </p>
          <Button size="lg" asChild className="px-12">
            <Link href="/auth/signup">Começar Agora - É Grátis</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Brain className="h-6 w-6 text-blue-600" />
              <span className="font-bold">Finance AI</span>
            </div>
            <p className="text-muted-foreground text-sm">
              © 2026 Finance AI. Feito com ❤️ para suas finanças.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
