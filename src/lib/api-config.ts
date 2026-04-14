export const API_BASE_URL = 
  process.env.NEXT_PUBLIC_API_BASE_URL && !process.env.NEXT_PUBLIC_API_BASE_URL.includes("undefined")
    ? process.env.NEXT_PUBLIC_API_BASE_URL
    : "https://homoapilaudos.cometasupermercados.com.br";

export const getAuthHeader = () => {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("token");
  return {
    Authorization: token ? `Bearer ${token}` : "",
    "Content-Type": "application/json",
  };
};
