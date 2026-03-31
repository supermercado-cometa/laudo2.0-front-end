"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type GlpiPasswordModalProps = {
  open: boolean;
  onCancel: () => void;
  onConfirm: (password: string) => void | Promise<void>;
  title?: string;
  description?: string;
};

export default function GlpiPasswordModal({
  open,
  onCancel,
  onConfirm,
  title = "Enviar para GLPI",
  description = "Informe sua senha GLPI/AD para registrar o acompanhamento no ticket.",
}: GlpiPasswordModalProps) {
  const [password, setPassword] = useState("");

  if (!open) return null;

  const handleConfirm = async () => {
    await onConfirm(password);
    setPassword("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-md shadow-lg w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-2">{title}</h2>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>

        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha"
        />

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!password}>
            Enviar
          </Button>
        </div>
      </div>
    </div>
  );
}
