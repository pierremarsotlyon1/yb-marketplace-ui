"use client";

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { Address } from 'viem';
import { useEffect, useState } from 'react';
import { marketplaceABI } from '@/abis/marketplaceABI';

export const useCancelOrder = () => {
    const queryClient = useQueryClient();
    const [cancellingOrderId, setCancellingOrderId] = useState<bigint | null>(null);

    const { data: hash, status, writeContractAsync, reset } = useWriteContract();

    const { isLoading: isConfirming, status: receiptStatus } = useWaitForTransactionReceipt({
        hash,
    });

    const cancelOrder = async (marketplaceAddress: Address, orderId: bigint) => {
        setCancellingOrderId(orderId);
        try {
            await writeContractAsync({
                address: marketplaceAddress,
                abi: marketplaceABI,
                functionName: 'cancelOrder',
                args: [orderId],
            });
        } catch (e) {
            console.error("Cancel failed", e);
            setCancellingOrderId(null); // Reset on error
        }
    };

    // When transaction is confirmed, invalidate queries to refetch user's orders
    useEffect(() => {
        if (receiptStatus === 'success') {
            // This invalidates all 'fetchAllOrders' queries, which 
            // will trigger 'useFetchMyOrders' to refetch.
            queryClient.invalidateQueries({ queryKey: ['fetchAllOrders'] });
            setCancellingOrderId(null);
            reset();
        } else if (receiptStatus === 'error') {
            // Handle tx failure
            setCancellingOrderId(null);
            reset();
        }
    }, [receiptStatus, queryClient, reset]);

    const isPending = status === 'pending' || isConfirming;

    return {
        cancelOrder,
        isPending,
        cancellingOrderId,
    };
};