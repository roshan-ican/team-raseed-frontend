import { useQuery } from "@tanstack/react-query";
import axios from "@/lib/axios";

export const useReceipts = (params?: { userId?: string; receiptId?: string }) => {
  return useQuery({
    queryKey: ["receipts", params],
    queryFn: async () => {
      const response = await axios.get("api/receipts", { params });
      return response.data;
    },
    enabled: !!params, 
  });
};