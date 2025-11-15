import React from 'react';

// Interface for WalletBalance props
interface WalletBalanceProps {
    asset: string;
    amount: string;
}

export const WalletBalance: React.FC<WalletBalanceProps> = ({ asset, amount }) => (
    <div className="flex justify-between items-center text-sm">
        <span className="text-zinc-400">{asset}</span>
        <span className="font-mono text-zinc-200">{amount}</span>
    </div>
);
