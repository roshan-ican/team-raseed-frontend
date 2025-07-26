// hooks/receipts.ts
import { useMutation } from "@tanstack/react-query";
import axios from "axios";

export const useSaveReceipt = () => {
    return useMutation({
        mutationFn: async (data: any) => {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/save-receipt`, data);
            return response.data;
        },
    });
};


export const useAddManualReceipt=()=>{
    
    return useMutation({
        mutationFn: async (data: any) => {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/add_manual_receipt`, data);
            return response.data;
        },
    });
}

