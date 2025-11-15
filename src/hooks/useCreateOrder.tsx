"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useBalance } from 'wagmi';
import { Address, parseEther, formatEther, erc20Abi, getAddress, maxUint256, isAddress } from 'viem';

// Assurez-vous que les chemins sont corrects
import { Market } from '../interfaces/Market'; 
import { marketplaceABI } from '@/abis/marketplaceABI';
import { ILiquidityTokenABI } from '@/abis/ILiquidityTokenABI';

// Props for the hook
interface UseCreateOrderProps {
    selectedMarket: Market | null;
}

// Constante de précision pour les calculs de prime
const PRECISION_18 = 10n**18n;

/**
 * Hook to manage the logic of creating a new sell order.
 * Handles balance, allowance, premium calculation, and transactions.
 */
export const useCreateOrder = ({ selectedMarket }: UseCreateOrderProps) => {
    const { address } = useAccount();
    const [amount, setAmount] = useState<string>("");
    const [totalPrice, setTotalPrice] = useState<string>(""); // Nouveau : prix total en crvUSD

    // --- 1. Adresses et Données de Base ---
    const marketplaceAddress = (selectedMarket && isAddress(selectedMarket.id)) 
        ? getAddress(selectedMarket.id) 
        : undefined;
        
    const yTokenAddress = (selectedMarket && isAddress(selectedMarket.ybAddress)) 
        ? getAddress(selectedMarket.ybAddress) 
        : undefined;

    // --- 2. Fetch de la Balance (Nouvelle demande) ---
    const { data: balance, refetch: refetchBalance } = useBalance({
        address: address,
        token: yTokenAddress,
        query: { 
            enabled: !!address && !!yTokenAddress,
            refetchInterval: 10000, // Rafraîchit la balance
        },
    });

    // --- 3. Fetch de l'Allowance ---
    const { data: allowance, refetch: refetchAllowance } = useReadContract({
        abi: erc20Abi,
        address: yTokenAddress,
        functionName: 'allowance',
        args: [address!, marketplaceAddress!],
        query: {
            enabled: !!address && !!marketplaceAddress && !!yTokenAddress,
        },
    });

    // --- 4. Validation et Parsage des Inputs ---
    let amountWei: bigint = 0n;
    let amountIsValid = false;
    try {
        if (amount && parseFloat(amount) > 0) {
            amountWei = parseEther(amount); // yToken est 18 decimals
            amountIsValid = true;
        }
    } catch (e) {}
    
    let totalPriceWei: bigint = 0n;
    let priceIsValid = false;
    try {
        if (totalPrice && parseFloat(totalPrice) > 0) {
            totalPriceWei = parseEther(totalPrice); // crvUSD est 18 decimals
            priceIsValid = true;
        }
    } catch (e) {}

    // Validation de la balance
    const hasInsufficientBalance = amountIsValid && balance ? amountWei > balance.value : false;
    const needsApproval = (allowance !== undefined && allowance < amountWei);

    // --- 5. Logique de Calcul de la Prime (Nouvelle demande) ---
    
    // a. Obtenir l'adresse de l'asset sous-jacent (ex: WBTC)
    const { data: assetTokenAddress } = useReadContract({
        abi: ILiquidityTokenABI,
        address: yTokenAddress,
        functionName: 'ASSET_TOKEN',
        query: { enabled: !!yTokenAddress },
    });

    // b. Obtenir les décimales de cet asset (ex: 8 pour WBTC)
    const { data: assetDecimals } = useReadContract({
        abi: erc20Abi,
        address: assetTokenAddress,
        functionName: 'decimals',
        query: { enabled: !!assetTokenAddress },
    });

    // c. Obtenir le montant d'asset sous-jacent pour le montant de yToken (réactif)
    const { data: underlyingAssetAmount, isLoading: isLoadingPreview } = useReadContract({
        abi: ILiquidityTokenABI,
        address: yTokenAddress,
        functionName: 'preview_withdraw',
        args: [amountWei],
        query: { 
            enabled: !!yTokenAddress && amountIsValid && amountWei > 0n,
            staleTime: 30000, // Cache le preview pendant 30s
        },
    });

    // d. Calculer la prime finale
    const { calculatedPremiumPerUnit, premiumDisplay, calculationError } = useMemo(() => {
        // Le `premiumPerSmallestAssetUnit` (ce que le contrat attend) est un uint256
        // représentant le prix en wei (1e18) par *plus petite unité* de l'asset (ex: 1 satoshi).
        
        // 1. underlyingAssetAmount est le montant d'asset (ex: 100_000_000 satoshis pour 1 WBTC)
        // 2. totalPriceWei est le prix total souhaité (ex: 10000e18 wei de crvUSD)
        
        if (!amountIsValid || !priceIsValid || !underlyingAssetAmount || underlyingAssetAmount === 0n || assetDecimals === undefined) {
            return { calculatedPremiumPerUnit: 0n, premiumDisplay: "0.00", calculationError: null };
        }

        try {
            // Formule: premiumPerUnit = (totalPriceWei * 10^18) / underlyingAssetAmount
            // On multiplie par 10^18 (PRECISION_18) car le contrat attend un prix en wei (1e18)
            // par plus petite unité d'asset (qui est déjà `underlyingAssetAmount`).
            const premium = (totalPriceWei) / underlyingAssetAmount;
            
            return {
                calculatedPremiumPerUnit: premium,
                // On formate le résultat (un BigInt en 1e18) pour l'affichage
                premiumDisplay: formatEther(premium), 
                calculationError: null,
            };
        } catch (e) {
            console.error("Premium calculation error:", e);
            return { calculatedPremiumPerUnit: 0n, premiumDisplay: "0.00", calculationError: "Calculation error" };
        }
    }, [amountIsValid, priceIsValid, underlyingAssetAmount, assetDecimals, totalPriceWei]);


    // --- 6. Hooks de Transaction ---
    const { data: approveHash, status: approveStatus, writeContractAsync: approveAsync, reset: resetApprove } = useWriteContract();
    const { data: createOrderHash, status: createOrderStatus, writeContractAsync: createOrderAsync, reset: resetCreateOrder } = useWriteContract();
    
    const { isLoading: isApproving, status: approveReceiptStatus } = useWaitForTransactionReceipt({ hash: approveHash });
    const { isLoading: isCreatingOrder, status: createOrderReceiptStatus } = useWaitForTransactionReceipt({ hash: createOrderHash });

    // --- 7. Fonctions d'Action ---
    const handleApprove = async () => {
        if (!marketplaceAddress || !yTokenAddress) return;
        try {
            await approveAsync({
                abi: erc20Abi,
                address: yTokenAddress,
                functionName: 'approve',
                args: [marketplaceAddress, maxUint256],
            });
        } catch (e) { console.error("Approval failed", e); }
    };

    const handleCreateOrder = async () => {
        // Validation renforcée
        if (!marketplaceAddress || !amountIsValid || !priceIsValid || hasInsufficientBalance || needsApproval || calculatedPremiumPerUnit === 0n) {
            return;
        }

        try {
            await createOrderAsync({
                abi: marketplaceABI,
                address: marketplaceAddress,
                functionName: 'createOrder',
                args: [amountWei, calculatedPremiumPerUnit], // Utiliser la prime calculée
            });
        } catch (e) {
            console.error("Create order failed", e);
        }
    };

    // --- 8. Effets de bord ---
    useEffect(() => {
        if (approveReceiptStatus === 'success') {
            refetchAllowance();
            refetchBalance(); // Re-fetch balance aussi
            resetApprove();
        }
    }, [approveReceiptStatus, refetchAllowance, refetchBalance, resetApprove]);

    useEffect(() => {
        if (createOrderReceiptStatus === 'success') {
            setAmount("");
            setTotalPrice(""); // Nettoyer le nouveau champ
            resetCreateOrder();
            refetchBalance(); // Re-fetch balance
            // (Vous devriez aussi invalider la query "MyOrders" ici)
        }
    }, [createOrderReceiptStatus, resetCreateOrder, refetchBalance]);

    // Réinitialiser les inputs si le marché change
    useEffect(() => {
        setAmount("");
        setTotalPrice("");
    }, [selectedMarket]);

    return {
        amount,
        setAmount,
        totalPrice, // Nouveau
        setTotalPrice, // Nouveau
        balance, // Nouveau
        hasInsufficientBalance, // Nouveau
        needsApproval,
        handleApprove,
        handleCreateOrder,
        amountIsValid,
        priceIsValid,
        isLoadingPreview, // Nouveau
        premiumDisplay, // Nouveau
        calculationError, // Nouveau
        isApproving,
        isCreatingOrder,
        approveStatus,
        createOrderStatus,
    };
};