const getApiBaseUrl = () => {
  // 1. Tenta pegar da variável de ambiente (Bbaked no build ou runtime se disponível)
  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (envUrl && !envUrl.includes("undefined") && envUrl !== "") {
    return envUrl;
  }

  // 2. Fallback inteligente baseado no domínio atual (Runtime)
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host.includes("homo") || host.includes("localhost") || host.includes("127.0.0.1")) {
      return "https://homoapilaudos.cometasupermercados.com.br";
    }
  }

  // 3. Fallback final para Produção
  return "https://apilaudos.cometasupermercados.com.br";
};

export const API_BASE_URL = getApiBaseUrl();

export const getAuthHeader = () => {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("token");
  return {
    Authorization: token ? `Bearer ${token}` : "",
    "Content-Type": "application/json",
  };
};
