"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useBalance } from 'wagmi';
import { Address, parseEther, formatEther, erc20Abi, getAddress, maxUint256, isAddress, Abi } from 'viem';

// Assurez-vous que les chemins sont corrects
import { Market } from '../interfaces/Market'; 
import { Order } from '../interfaces/Order'; 
import { marketplaceABI } from '@/abis/marketplaceABI';

// --- Constantes ---
const CRVUSD_ADDRESS = '0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E' as Address; // crvUSD Mainnet

// --- Props du Hook ---
interface UseBuyOrderProps {
  market: Market | null;
  order: Order | null;
  isOpen: boolean; // Ajouté pour réinitialiser l'état
}

/**
 * Hook pour gérer la logique d'achat d'un ordre (partiel ou complet).
 */
export const useBuyOrder = ({ market, order, isOpen }: UseBuyOrderProps) => {
    const { address } = useAccount();
    const [buyAmount, setBuyAmount] = useState<string>(""); // Montant en yToken que l'utilisateur veut acheter

    const marketplaceAddress = (market && isAddress(market.id)) 
        ? getAddress(market.id) 
        : undefined;

    // --- 1. Fetch des Adresses de Tokens (ASSET_TOKEN) ---
    const { data: assetTokenAddress } = useReadContract({
        abi: marketplaceABI,
        address: marketplaceAddress,
        functionName: 'ASSET_TOKEN',
        query: { enabled: !!marketplaceAddress },
    });

    // --- 2. Fetch des Balances (crvUSD et Asset) ---
    const { data: stableBalance, refetch: refetchStableBalance } = useBalance({
        address: address,
        token: CRVUSD_ADDRESS,
        query: { enabled: !!address, refetchInterval: 10000 },
    });
    
    const { data: assetBalance, refetch: refetchAssetBalance } = useBalance({
        address: address,
        token: assetTokenAddress,
        query: { enabled: !!address && !!assetTokenAddress, refetchInterval: 10000 },
    });

    // --- 3. Parsage et Validation de l'Input ---
    let yTokenAmountWei: bigint = 0n;
    let isAmountValid = false;
    let isFullOrderBuy = false;
    const orderAmountWei = order?.yTokenAmountRemaining || 0n;

    try {
        if (buyAmount && parseFloat(buyAmount) > 0) {
            yTokenAmountWei = parseEther(buyAmount);
            isAmountValid = true;
            // Vérifie si le montant entré est le montant total de l'ordre
            if (yTokenAmountWei === orderAmountWei) {
                isFullOrderBuy = true;
            }
        }
    } catch (e) {}

    // --- 4. Fetch du Coût (Calculé par le contrat) ---
    const { data: cost, isLoading: isLoadingCost, refetch: refetchCost, error: mm } = useReadContract({
        abi: marketplaceABI,
        address: marketplaceAddress,
        functionName: 'calculateBuyCost',
        args: [order?.orderId || 0n, yTokenAmountWei],
        query: {
            enabled: !!marketplaceAddress && !!order && isAmountValid,
            staleTime: 30000, // Cache le coût pendant 30s
        },
    });
    
    // cost est un tuple: [assetAmount, stableAmountPremium]
    const assetCost = cost ? cost[0] : 0n;
    const stableCost = cost ? cost[1] : 0n;

    // --- 5. Fetch des Allowances (crvUSD et Asset) ---
    const { data: stableAllowance, refetch: refetchStableAllowance } = useReadContract({
        abi: erc20Abi,
        address: CRVUSD_ADDRESS,
        functionName: 'allowance',
        args: [address!, marketplaceAddress!],
        query: { enabled: !!address && !!marketplaceAddress },
    });
    
    const { data: assetAllowance, refetch: refetchAssetAllowance } = useReadContract({
        abi: erc20Abi,
        address: assetTokenAddress,
        functionName: 'allowance',
        args: [address!, marketplaceAddress!],
        query: { enabled: !!address && !!marketplaceAddress && !!assetTokenAddress },
    });

    // --- 6. Validations (Balance et Allowance) ---
    const hasInsufficientStable = stableBalance ? stableCost > stableBalance.value : false;
    const hasInsufficientAsset = assetBalance ? assetCost > assetBalance.value : false;
    const needsStableApproval = stableAllowance !== undefined ? stableCost > stableAllowance : false;
    const needsAssetApproval = assetAllowance !== undefined ? assetCost > assetAllowance : false;
    const hasError = hasInsufficientStable || hasInsufficientAsset;

    // --- 7. Hooks de Transaction ---
    const { data: approveStableHash, status: approveStableStatus, writeContractAsync: approveStableAsync, reset: resetApproveStable } = useWriteContract();
    const { data: approveAssetHash, status: approveAssetStatus, writeContractAsync: approveAssetAsync, reset: resetApproveAsset } = useWriteContract();
    const { data: buyHash, status: buyStatus, writeContractAsync: buyAsync, reset: resetBuy } = useWriteContract();
    
    const { isLoading: isApprovingStable, status: approveStableReceiptStatus } = useWaitForTransactionReceipt({ hash: approveStableHash });
    const { isLoading: isApprovingAsset, status: approveAssetReceiptStatus } = useWaitForTransactionReceipt({ hash: approveAssetHash });
    const { isLoading: isBuying, status: buyReceiptStatus } = useWaitForTransactionReceipt({ hash: buyHash });
    
    const isWorking = isApprovingStable || isApprovingAsset || isBuying;

    // --- 8. Fonctions d'Action ---
    
    // Bouton "Max" (modifié pour correspondre à la demande)
    const handleSetMax = () => {
        if (order) {
            // Remplit l'input avec le montant *total de l'ordre*
            setBuyAmount(formatEther(order.yTokenAmountRemaining));
        }
    };

    const handleSubmit = async () => {
        if (hasError || !isAmountValid || !marketplaceAddress || !order) return;

        // Étape 1: Approve Stable (crvUSD)
        if (needsStableApproval) {
            try {
                await approveStableAsync({
                    abi: erc20Abi,
                    address: CRVUSD_ADDRESS,
                    functionName: 'approve',
                    args: [marketplaceAddress, maxUint256],
                });
            } catch (e) { console.error("Stable approval failed", e); }
            return;
        }
        
        // Étape 2: Approve Asset (WBTC, etc.)
        if (needsAssetApproval && assetTokenAddress) {
            try {
                await approveAssetAsync({
                    abi: erc20Abi,
                    address: assetTokenAddress,
                    functionName: 'approve',
                    args: [marketplaceAddress, maxUint256],
                });
            } catch (e) { console.error("Asset approval failed", e); }
            return;
        }

        // Étape 3: Exécuter l'Achat
        try {
            if (isFullOrderBuy) {
                // Utilise la fonction 'buyFullOrder'
                await buyAsync({
                    abi: marketplaceABI,
                    address: marketplaceAddress,
                    functionName: 'buyFullOrder',
                    args: [order.orderId],
                });
            } else {
                // Utilise la fonction 'buyOrder' (partielle)
                await buyAsync({
                    abi: marketplaceABI,
                    address: marketplaceAddress,
                    functionName: 'buyOrder',
                    args: [order.orderId, yTokenAmountWei],
                });
            }
        } catch (e) { console.error("Buy transaction failed", e); }
    };

    // --- 9. Effets de bord pour rafraîchir les données ---
    useEffect(() => {
        if (approveStableReceiptStatus === 'success') {
            refetchStableAllowance();
            resetApproveStable();
        }
    }, [approveStableReceiptStatus, refetchStableAllowance, resetApproveStable]);
    
    useEffect(() => {
        if (approveAssetReceiptStatus === 'success') {
            refetchAssetAllowance();
            resetApproveAsset();
        }
    }, [approveAssetReceiptStatus, refetchAssetAllowance, resetApproveAsset]);

    useEffect(() => {
        if (buyReceiptStatus === 'success') {
            // Rafraîchir toutes les données pertinentes
            refetchStableBalance();
            refetchAssetBalance();
            refetchStableAllowance();
            refetchAssetAllowance();
            refetchCost(); // R-fetch le coût (qui devrait être 0 ou invalide)
            setBuyAmount(""); // Nettoyer l'input
            resetBuy();
            // (Ici, vous devriez aussi invalider la query des ordres)
        }
    }, [buyReceiptStatus, refetchStableBalance, refetchAssetBalance, refetchStableAllowance, refetchAssetAllowance, refetchCost, resetBuy]);

    // Réinitialiser l'input quand la modale s'ouvre/change d'ordre
    useEffect(() => {
        if (isOpen) {
            setBuyAmount(""); 
        }
    }, [isOpen, order]);

    return {
        buyAmount,
        setBuyAmount,
        handleSetMax,
        handleSubmit,
        stableBalance,
        assetBalance,
        assetCost,
        stableCost,
        isLoadingCost,
        isAmountValid,
        hasError,
        hasInsufficientStable,
        hasInsufficientAsset,
        needsStableApproval,
        needsAssetApproval,
        isWorking,
        isApprovingStable,
        isApprovingAsset,
        isBuying,
        approveStableStatus,
        approveAssetStatus,
        buyStatus,
    };
};