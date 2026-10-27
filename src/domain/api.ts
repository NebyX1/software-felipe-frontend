import axios from "axios";
import { apiBaseUrl } from "../api/baseUrl";
import toast from "react-hot-toast";
import { useSession } from "./session";
export const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 45000,
});
api.interceptors.request.use((config) => {
  const token = useSession.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.data?.code === "client_outdated"
    ) {
      window.dispatchEvent(new Event("obras:client-outdated"));
    }
    return Promise.reject(error);
  },
);
export function errorText(error: unknown) {
  return axios.isAxiosError(error)
    ? error.response?.data?.message ||
        error.response?.data?.error ||
        "No se pudo completar la operación."
    : error instanceof Error
      ? error.message
      : "Ocurrió un error.";
}
export async function get<T>(url: string): Promise<T> {
  return (await api.get<T>(url)).data;
}
export async function action<T>(
  url: string,
  data: unknown = {},
  method: "post" | "patch" | "delete" = "post",
): Promise<T> {
  try {
    const response = await api[method]<T>(
      url,
      method === "delete" ? { data } : data,
    );
    toast.success("Operación registrada");
    return response.data;
  } catch (error) {
    toast.error(errorText(error));
    throw error;
  }
}
export async function download(url: string, name?: string) {
  try {
    const response = await api.get(url, { responseType: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(response.data);
    link.download =
      name ||
      response.headers["content-disposition"]?.match(
        /filename="?([^";]+)/,
      )?.[1] ||
      "informe";
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 30000);
  } catch (error) {
    toast.error(errorText(error));
  }
}
