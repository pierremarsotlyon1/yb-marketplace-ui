import React from 'react';
import { CircleDollarSign } from 'lucide-react';
import { WalletBalance } from './WalletBalance';

/**
 * WalletPanel Component
 * The right-hand panel for *only* wallet info.
 */
const WalletPanel = () => {
    // More realistic balances
    const balances = [
        { asset: 'y-stETH', amount: '1.25' },
        { asset: 'y-WBTC', amount: '0.00' },
        { asset: 'stETH', amount: '10.50' },
        { asset: 'crvUSD', amount: '1,204.75' },
    ];

    return (
        <div className="flex flex-col gap-6 sticky top-24">
            {/* My Wallet Card */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/20">
                <div className="p-4 border-b border-zinc-800">
                    <h2 className="flex items-center gap-2 font-semibold text-white">
                        <CircleDollarSign className="h-5 w-5 text-zinc-400" />
                        My Wallet
                    </h2>
                </div>
                <div className="p-4 flex flex-col gap-3">
                    {balances.map(bal => (
                        <WalletBalance key={bal.asset} asset={bal.asset} amount={bal.amount} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default WalletPanel;