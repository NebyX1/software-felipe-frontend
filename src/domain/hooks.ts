import { useQuery, useQueryClient } from "@tanstack/react-query";
import { get, action } from "./api";
export function useApi<T>(url: string, enabled = true) {
  return useQuery({
    queryKey: [url],
    queryFn: () => get<T>(url),
    enabled,
    retry: 1,
  });
}
export function useRefresh() {
  const client = useQueryClient();
  return () => client.invalidateQueries();
}
export function useAction() {
  const refresh = useRefresh();
  return async (
    url: string,
    data: unknown = {},
    method: "post" | "patch" | "delete" = "post",
  ) => {
    try {
      const response = await action(url, data, method);
      await refresh();
      return response;
    } catch {
      return null;
    }
  };
}
