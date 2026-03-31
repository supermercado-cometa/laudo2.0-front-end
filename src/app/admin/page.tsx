"use client";

import React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminHomePage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Painel Administrativo</CardTitle>
      </CardHeader>
      <CardContent className="flex gap-2">
        <Link href="/admin/equipamentos">
          <Button>Gerenciar Equipamentos</Button>
        </Link>
        <Link href="/admin/modelos">
          <Button>Gerenciar Modelos</Button>
        </Link>
        <Link href="/admin/lojas">
          <Button>Gerenciar Lojas</Button>
        </Link>
        <Link href="/admin/setores">
          <Button>Gerenciar Setores</Button>
        </Link>
        <Link href="/admin/glpi-monitor">
          <Button>Monitoramento GLPI</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
