"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [goAdmin, setGoAdmin] = useState(false);
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const username = String(formData.get("username") || "");
    const password = String(formData.get("password") || "");

    try {
      const body = new URLSearchParams({ username, password });
      const resp = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });
      console.log(resp);

      const data = await resp.json();
      if (!resp.ok) {
        setErrorMsg(data?.error || "Falha no login");
        setLoading(false);
        return;
      }

      // Persistir dados localmente
      if (data?.fullName) localStorage.setItem("fullName", data.fullName);
      if (data?.token) localStorage.setItem("token", data.token);
      if (data?.username) localStorage.setItem("username", data.username);

      // Garantir compatibilidade com o middleware: definir cookie auth_token
      if (data?.token) {
        try {
          const maxAgeSeconds = 7 * 24 * 60 * 60; // 7 dias
          document.cookie = `auth_token=${data.token}; Path=/; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
        } catch (cookieErr) {
          console.warn("Falha ao definir cookie auth_token", cookieErr);
        }
      }

      // Fluxo de navegação
      if (goAdmin) {
        if (data?.isAdmin === true) {
          console.log("Admin login success, redirecting to /admin");
          // Usar window.location.href para garantir que o middleware receba o cookie fresco
          window.location.href = "/admin";
        } else {
          console.warn("User is not admin, redirecting to /infoFormulario");
          setErrorMsg("Seu perfil não tem acesso ao painel administrador.");
          setLoading(false);
          router.push("/infoFormulario");
        }
      } else {
        router.push("/infoFormulario");
      }
    } catch (err) {
      console.error("Login error detail:", err);
      setErrorMsg("Erro de rede ou servidor indisponível");
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Entrar</CardTitle>
        <CardDescription>Acesse sua conta para continuar</CardDescription>
      </CardHeader>

      <form className="grid gap-6" onSubmit={handleSubmit}>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="username">Usuário (AD)</Label>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="seu_usuario"
              required
              autoComplete="username"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="adminPanel"
              type="checkbox"
              checked={goAdmin}
              onChange={(e) => setGoAdmin(e.target.checked)}
            />
            <Label htmlFor="adminPanel">
              Ir direto ao painel administrador
            </Label>
          </div>

          {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
          <Button
            variant="link"
            className="w-full justify-center hover:via-blue-950"
            type="button"
          >
            Esqueci minha senha
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
