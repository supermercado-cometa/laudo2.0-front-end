"use client";

import { Label } from "@/components/ui/label";
import { useState } from "react";

export function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

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
      localStorage.setItem("isAdmin", data?.isAdmin === true ? "true" : "false");

      // Garantir compatibilidade com o middleware: definir cookie auth_token
      if (data?.token) {
        try {
          const maxAgeSeconds = 7 * 24 * 60 * 60; // 7 dias
          document.cookie = `auth_token=${data.token}; Path=/; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
        } catch (cookieErr) {
          console.warn("Falha ao definir cookie auth_token", cookieErr);
        }
      }

      // Fluxo de navegação unificado para /admin
      console.log(`Login success, redirecting to /admin. Admin: ${data?.isAdmin === true}`);
      window.location.href = "/admin";
    } catch (err) {
      console.error("Login error detail:", err);
      setErrorMsg("Erro de rede ou servidor indisponível");
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <form className="flex flex-col" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-[20px] md:gap-[24px]">
          <div className="grid gap-2">
            <Label 
              htmlFor="username" 
              className="text-[14px] font-[500] text-foreground/80"
            >
              Usuário (AD)
            </Label>
            <input
              id="username"
              name="username"
              type="text"
              placeholder="seu_usuario"
              required
              autoComplete="username"
              className="input-custom"
            />
          </div>

          <div className="grid gap-2">
            <Label 
              htmlFor="password" 
              className="text-[14px] font-[500] text-foreground/80"
            >
              Senha
            </Label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="input-custom"
            />
          </div>

          {errorMsg && (
            <div className="p-4 bg-red-50 border-l-4 border-red-600 rounded-r-lg">
              <p className="text-sm font-semibold text-red-600">{errorMsg}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 mt-[48px] md:mt-[40px]">
          <button 
            type="submit" 
            className="btn-entrar rounded-[16px] md:rounded-[8px] text-[15px]" 
            disabled={loading}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </div>
      </form>
    </div>
  );
}
