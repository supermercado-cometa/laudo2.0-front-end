const getApiBaseUrl = () => {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    // Se estiver explicitamente em homo ou local
    if (host.includes("homo") || host.includes("localhost") || host.includes("127.0.0.1")) {
      return "https://homoapilaudos.cometasupermercados.com.br";
    }
    // Se estiver no domínio de produção real
    if (host === "laudos.cometasupermercados.com.br" || host === "laudo.cometasupermercados.com.br") {
      return "https://apilaudos.cometasupermercados.com.br";
    }
  }

  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (envUrl && !envUrl.includes("undefined") && envUrl !== "") {
    return envUrl;
  }
  return "https://apilaudos.cometasupermercados.com.br";
};

const getGlpiBaseUrl = () => {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host.includes("homo") || host.includes("localhost") || host.includes("127.0.0.1")) {
      // URL para abertura de chamados no GLPI de Homologação
      return "http://192.168.7.181/front/ticket.form.php?id="; 
    }
  }
  
  const envGlpi = process.env.NEXT_PUBLIC_GLPI_BASEPESQUISA_URL;
  if (envGlpi && !envGlpi.includes("undefined") && envGlpi !== "") {
    return envGlpi;
  }
  // Fallback Produção
  return "http://192.168.7.181/front/ticket.form.php?id=";
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
