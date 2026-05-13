const getApiBaseUrl = () => {
  // 1. Prioridade Total: Variável de Ambiente configurada no .env
  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (envUrl && envUrl.trim() !== "" && !envUrl.includes("undefined")) {
    return envUrl;
  }

  // 2. Fallback: Lógica de Detecção por Hostname (Caso a env falhe)
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    // Aceita variações de produção
    if (
      host === "laudos.cometasupermercados.com.br" || 
      host === "laudo.cometasupermercados.com.br" ||
      host === "apilaudos.cometasupermercados.com.br"
    ) {
      return "https://apilaudos.cometasupermercados.com.br";
    }
  }

  // 3. Última Instância: Homologação
  return "https://homoapilaudos.cometasupermercados.com.br";
};

const getGlpiBaseUrl = () => {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host.includes("homo") || host.includes("localhost") || host.includes("127.0.0.1")) {
      // URL para abertura de chamados no GLPI de Homologação
      return "http://suporte.cometasupermercados.com.br/front/ticket.form.php?id="; 
    }
  }
  
  const envGlpi = process.env.NEXT_PUBLIC_GLPI_BASEPESQUISA_URL;
  if (envGlpi && !envGlpi.includes("undefined") && envGlpi !== "") {
    return envGlpi;
  }
  // Fallback Produção
  return "http://suporte.cometasupermercados.com.br/front/ticket.form.php?id=";
};

export const API_BASE_URL = getApiBaseUrl();
export const GLPI_BASE_URL = getGlpiBaseUrl();

export const getAuthHeader = () => {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("token");
  return {
    Authorization: token ? `Bearer ${token}` : "",
    "Content-Type": "application/json",
  };
};
