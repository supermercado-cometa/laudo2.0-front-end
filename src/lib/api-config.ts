const getApiBaseUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!envUrl || envUrl.includes("undefined") || envUrl === "") {
    // Fallback explicito para homologação se nada for definido no build/runtime
    return "https://homoapilaudos.cometasupermercados.com.br";
  }
  return envUrl;
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
