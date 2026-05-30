import { useQuery } from "@tanstack/react-query";
import { getMarcaProductAllFn } from "../api/marca.products.api";

export const useGetMarcaProductAll = (page: number = 1, limit: number = 30) => {
  return useQuery({
    queryFn: () => getMarcaProductAllFn(page, limit),
    queryKey: ["marcasProducts"],
    enabled: true,
  });
};
