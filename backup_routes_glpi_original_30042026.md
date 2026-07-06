# Backup Original de api-laudo/src/routes/glpi.ts (30/04/2026)

Este arquivo contém a versão original do código antes da remoção da atribuição de categoria no chamado pai para resolver a dupla validação no GLPI.

```typescript
import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { createTicketFollowup, LaudoInfoForGlpi } from "../services/glpi";

const router = Router();
console.log("[DEBUG] Carregando arquivo de rotas GLPI...");

/**
 * GET /glpi/diagnostico
 * Rota pública de diagnóstico — testa se as credenciais master do .env conseguem autenticar no GLPI.
 * Remova ou proteja esta rota após o diagnóstico.
 */
router.get("/diagnostico", async (_req, res) => {
  const GLPI_BASE_URL = process.env.GLPI_BASE_URL || "";
  const GLPI_APP_TOKEN = process.env.GLPI_APP_TOKEN || "";
  const GLPI_USER_LOGIN = process.env.GLPI_USER_LOGIN || "";
  const GLPI_USER_PASSWORD = process.env.GLPI_USER_PASSWORD || "";
  const GLPI_USER_TOKEN = process.env.GLPI_USER_TOKEN || "";

  const resultado: Record<string, any> = {
    env: {
      GLPI_BASE_URL,
      GLPI_APP_TOKEN: GLPI_APP_TOKEN ? `${GLPI_APP_TOKEN.slice(0, 6)}...` : "(vazio)",
      GLPI_USER_LOGIN: GLPI_USER_LOGIN || "(vazio)",
      GLPI_USER_PASSWORD: GLPI_USER_PASSWORD ? "***configurado***" : "(vazio)",
      GLPI_USER_TOKEN: GLPI_USER_TOKEN ? "***configurado***" : "(vazio)",
    },
  };

  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (GLPI_APP_TOKEN) headers["App-Token"] = GLPI_APP_TOKEN;

    if (GLPI_USER_TOKEN) {
      headers["User-Token"] = GLPI_USER_TOKEN;
      resultado.metodo = "User-Token";
    } else if (GLPI_USER_LOGIN && GLPI_USER_PASSWORD) {
      const basic = Buffer.from(`${GLPI_USER_LOGIN}:${GLPI_USER_PASSWORD}`).toString("base64");
      headers["Authorization"] = `Basic ${basic}`;
      resultado.metodo = "Basic Auth (login:senha)";
    } else {
      resultado.metodo = "NENHUM — credenciais não configuradas";
    }

    const resp = await fetch(`${GLPI_BASE_URL}/initSession`, { method: "GET", headers });
    const body = await resp.json().catch(async () => await resp.text());

    resultado.glpi_status = resp.status;
    resultado.glpi_ok = resp.ok;
    resultado.glpi_resposta = body;

    if (resp.ok) {
      resultado.conclusao = "✅ Autenticação master funcionando! Operações administrativas estão ativas.";
    } else {
      resultado.conclusao = "❌ Falha na autenticação master. Verifique login/senha ou habilite o acesso via API para este usuário no GLPI (Configuração > Usuários > [root] > Ficha > Acesso remoto).";
    }
  } catch (err: any) {
    resultado.erro = err.message;
    resultado.conclusao = "❌ Não foi possível conectar ao servidor GLPI. Verifique se a URL está acessível a partir do servidor onde a API está rodando.";
  }


  return res.status(200).json(resultado);
});

/**
 * GET /glpi/test-connection
 * Testa puramente a conectividade HTTP com o servidor GLPI.
 */
router.get("/test-connection", async (_req, res) => {
  const target = process.env.GLPI_BASE_URL || "http://192.168.7.181/apirest.php";
  const results: any = {
    target,
    timestamp: new Date().toISOString(),
    steps: []
  };

  try {
    results.steps.push(`Tentando conexão simples via fetch para ${target}...`);
    // Timeout curto de 5 segundos
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const resp = await fetch(target, { 
      method: "GET", 
      signal: controller.signal 
    });
    clearTimeout(timeout);
    
    results.status = resp.status;
    results.ok = resp.ok;
    results.steps.push("Conexão bem sucedida!");
  } catch (err: any) {
    results.error = err.message;
    results.code = err.code;
    results.steps.push("Falha na conexão.");
    results.diagnostico = "O servidor recusou a conexão (ECONNREFUSED). Isso confirma que o Apache/Nginx no 192.168.7.181 está desligado ou bloqueando a porta 80.";
  }

  return res.status(200).json(results);
});

/**
 * POST /glpi/followup
 * Body: {
 *   numeroChamado: number | string,
 *   glpiPassword: string,
 *   laudo: LaudoInfoForGlpi
 * }
 * Usa o username do usuário autenticado (JWT) e a senha informada para abrir sessão no GLPI e registrar o acompanhamento.
 */
router.post("/followup", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const numeroChamadoRaw = (req.body?.numeroChamado ?? "").toString();
    const glpiPassword = (req.body?.glpiPassword || user?.glpiPassword || "").toString();
    const laudo = (req.body?.laudo ?? {}) as LaudoInfoForGlpi;

    const tickets_id = Number(numeroChamadoRaw);
    if (!tickets_id || Number.isNaN(tickets_id)) {
      return res.status(400).json({ error: "numeroChamado inválido" });
    }
    // glpiPassword é opcional para permitir automação via .env
    if (!user?.username) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const result = await createTicketFollowup(
      user.username,
      glpiPassword,
      tickets_id,
      laudo
    );

    return res
      .status(200)
      .json({ success: true, followupId: result.id, raw: result.raw });
  } catch (err: any) {
    console.error("Erro GLPI followup:", err);
    return res
      .status(500)
      .json({ error: err?.message || "Erro interno ao integrar com GLPI" });
  }
});

// Nova rota para relacionar dados e registrar follow-up com cabeçalho
router.post("/relacionar", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const numeroChamadoRaw = (req.body?.numeroChamado ?? "").toString();
    const glpiPassword = (req.body?.glpiPassword || user?.glpiPassword || "").toString();
    const laudo = (req.body?.laudo ?? {}) as LaudoInfoForGlpi;
    const relacao = (req.body?.relacao ?? {}) as {
      titulo?: string;
      localizacao?: string;
      tecnicoAtribuido?: string;
      grupo?: string;
      categoria?: string;
      requerente?: string;
    };

    const tickets_id = Number(numeroChamadoRaw);
    if (!tickets_id || Number.isNaN(tickets_id)) {
      return res.status(400).json({ error: "numeroChamado inválido" });
    }
    // glpiPassword é opcional para permitir automação via .env
    if (!user?.username) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const { createTicketFollowupWithHeader } = await import("../services/glpi");
    const result = await createTicketFollowupWithHeader(
      user.username,
      glpiPassword,
      tickets_id,
      laudo,
      relacao
    );

    return res
      .status(200)
      .json({ success: true, followupId: result.id, raw: result.raw });
  } catch (err: any) {
    console.error("Erro GLPI relacionar:", err);
    return res
      .status(500)
      .json({ error: err?.message || "Erro interno ao integrar com GLPI" });
  }
});
// Nova rota: listar categorias diretamente do DB do GLPI
router.get("/lookup/categories-db", requireAuth, async (_req, res) => {
  try {
    const { listItilCategories } = await import("../services/glpiDb");
    const categorias = await listItilCategories();
    return res.status(200).json(categorias);
  } catch (err: any) {
    console.error("Erro ao listar categorias GLPI via DB:", err);
    return res
      .status(500)
      .json({ error: err?.message || "Erro interno ao consultar DB GLPI" });
  }
});

// Nova rota: listar localizações diretamente do DB do GLPI
router.get("/lookup/locations-db", requireAuth, async (_req, res) => {
  try {
    const { listLocations } = await import("../services/glpiDb");
    const locais = await listLocations();
    return res.status(200).json(locais);
  } catch (err: any) {
    console.error("Erro ao listar localizações GLPI via DB:", err);
    return res
      .status(500)
      .json({ error: err?.message || "Erro interno ao consultar DB GLPI" });
  }
});

// Nova rota: listar grupos diretamente do DB do GLPI
router.get("/lookup/groups-db", requireAuth, async (_req, res) => {
  try {
    const { listGroups } = await import("../services/glpiDb");
    const grupos = await listGroups();
    return res.status(200).json(grupos);
  } catch (err: any) {
    console.error("Erro ao listar grupos GLPI via DB:", err);
    return res
      .status(500)
      .json({ error: err?.message || "Erro interno ao consultar DB GLPI" });
  }
});

// Nova rota: buscar Ativo por Tombo
router.get("/lookup/asset/:tombo", requireAuth, async (req, res) => {
  try {
    const { tombo } = req.params;
    const { findItemByTombo } = await import("../services/glpiDb");
    const item = await findItemByTombo(tombo);
    
    if (!item) {
      return res.status(404).json({ error: "Patrimônio não encontrado no GLPI" });
    }
    
    return res.status(200).json(item);
  } catch (err: any) {
    console.error("Erro ao buscar ativo GLPI:", err);
    return res.status(500).json({ error: err?.message || "Erro ao consultar ativo" });
  }
});

// Nova rota: listar gerentes para validação
router.get("/lookup/managers", requireAuth, async (_req, res) => {
  try {
    const { listManagers } = await import("../services/glpiDb");
    const managers = await listManagers();
    return res.status(200).json(managers);
  } catch (err: any) {
    console.error("Erro ao listar gerentes GLPI:", err);
    return res.status(500).json({ error: err?.message || "Erro ao listar gerentes" });
  }
});

// Criar Ticket no GLPI com dados do modal de relação
router.post("/ticket/create", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const glpiPassword = (req.body?.glpiPassword || user?.glpiPassword || "").toString();
    const laudo = (req.body?.laudo ?? {}) as LaudoInfoForGlpi;
    const relacao = (req.body?.relacao ?? {}) as {
      titulo?: string;
      categoriaId?: number | null;
      localizacaoId?: number | null;
      grupoId?: number | null;
    };

    // glpiPassword é opcional para permitir automação via .env
    if (!user?.username) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const { createTicket, setTicketRequester } = await import(
      "../services/glpi"
    );
    const { findGlpiUserByLogin } = await import("../services/glpiDb");

    // 1) Cria o ticket com base no laudo (sem cabeçalho extra)
    const result = await createTicket(
      user.username,
      glpiPassword,
      laudo,
      relacao
    );
    const ticketId = result.id;

    // 2) Obtém o users_id do criador (via glpi_users.name = login)
    let requesterSet: boolean | undefined = undefined;
    let requesterUserId: number | undefined = undefined;

    if (ticketId) {
      const userRow = await findGlpiUserByLogin(user.username).catch(
        () => null
      );
      if (userRow?.id) {
        requesterUserId = userRow.id;
        // 3) Define o requerente do ticket
        try {
          await setTicketRequester(
            user.username,
            glpiPassword,
            ticketId,
            requesterUserId,
            1
          );
        } catch (reqErr: any) {
          console.warn(`[GLPI] Não foi possível definir o requerente no novo chamado: ${reqErr.message}`);
        }
        requesterSet = true;
      } else {
        requesterSet = false;
      }
    }

    return res.status(200).json({
      success: true,
      ticketId,
      requesterSet,
      requesterUserId,
      raw: result.raw,
    });
  } catch (err: any) {
    console.error("Erro GLPI criar ticket:", err);
    return res
      .status(500)
      .json({ error: err?.message || "Erro interno ao criar Ticket no GLPI" });
  }
});
router.post("/ticket/link", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const glpiPassword = (req.body?.glpiPassword || user?.glpiPassword || "").toString();
    const t1 = Number(req.body?.tickets_id_1);
    const t2 = Number(req.body?.tickets_id_2);
    const linkType = Number(req.body?.link ?? 1);

    // glpiPassword é opcional para permitir automação via .env
    if (!user?.username) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }
    if (!t1 || Number.isNaN(t1) || !t2 || Number.isNaN(t2)) {
      return res.status(400).json({ error: "IDs de tickets inválidos" });
    }

    const { linkTickets } = await import("../services/glpi");
    const raw = await linkTickets(
      user.username,
      glpiPassword,
      t1,
      t2,
      linkType
    );
    return res.status(200).json({ success: true, raw });
  } catch (err: any) {
    console.error("Erro GLPI relacionar tickets:", err);
    return res
      .status(500)
      .json({ error: err?.message || "Erro interno ao relacionar Tickets" });
  }
});

/**
 * Nova rota: Promover Chamado (Orquestração Complexa)
 * Body: {
 *   parentTicketId: number,
 *   glpiPassword?: string,
 *   laudo: LaudoInfoForGlpi,
 *   relacao: { titulo, categoriaId, localizacaoId, grupoId },
 *   asset: { id, itemtype },
 *   managerIds: number[]
 * }
 */
router.post("/ticket/promote", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { parentTicketId, laudo, relacao: relacaoRaw, asset, managerIds, mensagemPai, categoriaId: categoriaIdTop } = req.body;
    const glpiPassword = (req.body?.glpiPassword || user?.glpiPassword || "").toString();
    // Mescla categoriaId do body raiz no relacao (compatibilidade com frontend)
    const relacao = relacaoRaw
      ? { ...relacaoRaw, categoriaId: relacaoRaw.categoriaId ?? categoriaIdTop ?? null }
      : { titulo: req.body.titulo, categoriaId: categoriaIdTop ?? null };
    
    if (!user?.username) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const { 
      createTicket, 
      linkTickets, 
      linkItemToTicket, 
      requestTicketValidation,
      setTicketRequester,
      addSimpleFollowup,
      buildFollowupHtml,
      updateTicketStatus,
      updateTicket
    } = await import("../services/glpi");
    const { findGlpiUserByLogin, findGroupIdByName, findLocationIdByName } = await import("../services/glpiDb");

    // 0. Automação da Localização (resolver ID da loja pelo nome)
    if (!relacao.localizacaoId && laudo?.loja) {
      const locId = await findLocationIdByName(laudo.loja);
      if (locId) {
        relacao.localizacaoId = locId;
      }
    }

    // 1. Criar o novo chamado (Sub-chamado)
    const createResult = await createTicket(user.username, glpiPassword, laudo, relacao);
    const subTicketId = createResult.id;

    if (!subTicketId) {
      throw new Error("Falha ao obter ID do sub-chamado criado");
    }

    // 2. Definir o requerente do sub-chamado
    const userRow = await findGlpiUserByLogin(user.username).catch(() => null);
    if (userRow?.id) {
      try {
        await setTicketRequester(user.username, glpiPassword, subTicketId, userRow.id, 1);
      } catch (reqErr: any) {
        console.warn(`[GLPI] Não foi possível definir o requerente: ${reqErr.message}`);
      }
    }

    // 3. Vincular como FILHO (link: 3) do chamado pai
    try {
      await linkTickets(user.username, glpiPassword, Number(parentTicketId), subTicketId, 3);
      console.log(`[GLPI] Vínculo entre #${parentTicketId} e #${subTicketId} realizado.`);
    } catch (err: any) {
      console.warn(`[GLPI] Não foi possível vincular os chamados (permissão): ${err.message}`);
    }

    // 4. Vincular ao Ativo (Patrimônio) se informado
    if (asset?.id && asset?.itemtype) {
      try {
        await linkItemToTicket(user.username, glpiPassword, subTicketId, asset.id, asset.itemtype);
        console.log(`[GLPI] Ativo ${asset.id} vinculado ao chamado #${subTicketId}.`);
      } catch (err: any) {
        console.warn(`[GLPI] Não foi possível vincular o ativo: ${err.message}`);
      }
    }

    // 5. Solicitar Validação aos Gerentes se informado (Removido loop manual pois a categoria já dispara via regra no GLPI)

    // 6. Adicionar um Acompanhamento PÚBLICO no Chamado Pai
    const laudoHtml = buildFollowupHtml(laudo);
    const linkedMsg = mensagemPai 
      ? `<p>${mensagemPai}</p>` 
      : `<p>Um sub-chamado (<b>#${subTicketId}</b>) foi criado e encaminhado para validação da Liderança correspondente ao laudo emitido:</p>`;

    try {
      await addSimpleFollowup(
        user.username,
        glpiPassword,
        Number(parentTicketId),
        linkedMsg + `<hr>` + laudoHtml,
        0 // is_private = 0 (Visível ao Requerente)
      );
    } catch (fupErr: any) {
      console.warn(`[GLPI] Não foi possível adicionar acompanhamento no chamado pai: ${fupErr.message}`);
    }

    // 7. Atualizar status, categoria e grupo do chamado PAI
    // Usa credenciais master pois técnicos não têm permissão para alterar chamados de terceiros.
    try {
      const updateFields: Record<string, any> = { status: 2 };
      
      // Aplica a categoria escolhida pelo técnico
      if (relacao?.categoriaId) {
        updateFields.itilcategories_id = relacao.categoriaId;
      }

      // Aplica a localização automatizada
      if (relacao?.localizacaoId) {
        updateFields.locations_id = relacao.localizacaoId;
      }

      // Atribui ao grupo "Suporte Técnico"
      const supportGroupId = await findGroupIdByName("Suporte Técnico");
      if (supportGroupId) {
        updateFields.groups_id_assign = supportGroupId;
      }

      await updateTicket(user.username, glpiPassword, Number(parentTicketId), updateFields);
      console.log(`[GLPI] Chamado pai #${parentTicketId} atualizado (Status 2, Cat ${relacao?.categoriaId}, Grupo ${supportGroupId}, Loc ${relacao?.localizacaoId})`);
    } catch (err: any) {
      console.warn(`[GLPI] Não foi possível atualizar o chamado pai: ${err.message}`);
    }

    return res.status(200).json({
      success: true,
      subTicketId,
      parentTicketId,
      assetLinked: !!asset?.id,
      validationRequested: (managerIds?.length ?? 0) > 0 || !!req.body.managerId
    });
  } catch (err: any) {
    console.error("Erro ao promover chamado GLPI:", err);
    return res.status(500).json({ error: err?.message || "Erro ao orquestrar promoção de chamado" });
  }
});

/**
 * Nova rota: Recolhimento de Despacho
 * Body: { tombo, equipamento, loja, setor, glpiPassword }
 */
router.post("/ticket/recollect", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { tombo, equipamento, loja, setor } = req.body;
    const glpiPassword = (req.body?.glpiPassword || user?.glpiPassword || "").toString();

    if (!user?.username) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const { createTicket, linkItemToTicket, setTicketRequester } = await import("../services/glpi");
    const { findGlpiUserByLogin, findItemByTombo } = await import("../services/glpiDb");

    // 1. Cria o chamado de recolhimento
    const laudoFake: LaudoInfoForGlpi = {
      equipamento,
      tombo,
      loja,
      setor,
      diagnostico: "Solicitação de recolhimento de despacho para logística.",
      estadoEquipamento: "nao_funcionando",
      necessidade: "enviar_conserto"
    };

    const createResult = await createTicket(user.username, glpiPassword, laudoFake, {
      titulo: `RECOLHIMENTO DE DESPACHO - ${equipamento} - ${tombo}`,
      // Pode-se associar a uma categoria fixa de Logística se soubermos o ID
    });

    const ticketId = createResult.id;
    if (!ticketId) throw new Error("Erro ao criar ticket de recolhimento");

    // 2. Vincular Requerente
    const userRow = await findGlpiUserByLogin(user.username).catch(() => null);
    if (userRow?.id) {
      try {
        await setTicketRequester(user.username, glpiPassword, ticketId, userRow.id, 1);
      } catch (reqErr: any) {
        console.warn(`[GLPI] Não foi possível definir o requerente no chamado de conserto: ${reqErr.message}`);
      }
    }

    // 3. Vincular Item (Patrimônio)
    const asset = await findItemByTombo(tombo).catch(() => null);
    if (asset?.id) {
      try {
        await linkItemToTicket(user.username, glpiPassword, ticketId, asset.id, asset.itemtype);
      } catch (assetErr: any) {
        console.warn(`[GLPI] Não foi possível vincular o ativo no chamado de conserto: ${assetErr.message}`);
      }
    }

    return res.status(200).json({ success: true, ticketId });
  } catch (err: any) {
    console.error("Erro ao solicitar recolhimento:", err);
    return res.status(500).json({ error: err?.message || "Erro ao processar recolhimento" });
  }
});
// Nova rota: atribuir usuário ao ticket (type=2)
router.post("/ticket/assign", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const glpiPassword = (req.body?.glpiPassword || user?.glpiPassword || "").toString();
    const tickets_id = Number(req.body?.tickets_id);

    // glpiPassword é opcional para permitir automação via .env
    if (!user?.username) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }
    if (!tickets_id || Number.isNaN(tickets_id)) {
      return res.status(400).json({ error: "tickets_id inválido" });
    }

    const { setTicketAssigned } = await import("../services/glpi");
    const { findGlpiUserByLogin } = await import("../services/glpiDb");

    const userRow = await findGlpiUserByLogin(user.username).catch(() => null);
    if (!userRow?.id) {
      return res
        .status(404)
        .json({ error: "Usuário não encontrado em glpi_users" });
    }

    const raw = await setTicketAssigned(
      user.username,
      glpiPassword,
      tickets_id,
      userRow.id,
      2
    );

    return res.status(200).json({
      success: true,
      tickets_id,
      users_id: userRow.id,
      raw,
    });
  } catch (err: any) {
    console.error("Erro GLPI atribuir usuário:", err);
    return res
      .status(500)
      .json({ error: err?.message || "Erro interno ao atribuir usuário" });
  }
});
router.get("/metrics", requireAuth, async (_req, res) => {
  try {
    const { getGlpiMetrics } = await import("../services/glpi");
    const data = await getGlpiMetrics();
    return res.status(200).json(data);
  } catch (err: any) {
    console.error("Erro GLPI metrics:", err);
    return res
      .status(500)
      .json({ error: err?.message || "Erro interno ao obter métricas" });
  }
});
router.post("/metrics/reset", requireAuth, async (_req, res) => {
  try {
    const { resetGlpiMetrics } = await import("../services/glpi");
    resetGlpiMetrics();
    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error("Erro GLPI metrics reset:", err);
    return res
      .status(500)
      .json({ error: err?.message || "Erro interno ao resetar métricas" });
  }
});
router.post("/session/clear", requireAuth, async (req, res) => {
  try {
    const { clearGlpiSessionCache } = await import("../services/glpi");
    const username = (req.body?.username ?? "").toString().trim();
    const all = Boolean(req.body?.all);
    const result = clearGlpiSessionCache(all ? undefined : username || undefined);
    return res.status(200).json({ success: true, ...result });
  } catch (err: any) {
    console.error("Erro GLPI session clear:", err);
    return res
      .status(500)
      .json({ error: err?.message || "Erro interno ao limpar sessão" });
  }
});
router.post("/session/kill", requireAuth, async (req, res) => {
  try {
    const { killGlpiSession } = await import("../services/glpi");
    const username = (req.body?.username ?? "").toString().trim();
    if (!username) return res.status(400).json({ error: "username é obrigatório" });
    const result = await killGlpiSession(username);
    return res.status(200).json(result);
  } catch (err: any) {
    console.error("Erro GLPI session kill:", err);
    return res
      .status(500)
      .json({ error: err?.message || "Erro interno ao encerrar sessão" });
  }
});
export default router;
```
