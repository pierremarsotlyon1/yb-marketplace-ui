"use client"
import MyOrdersPanel from '../../components/dashboard/MyOrdersPanel';
import WalletPanel from '../../components/dashboard/WalletPanel';
import React from 'react';

/**
 * Page Dashboard (Route: /dashboard)
 * Affiche les ordres de l'utilisateur et son portefeuille.
 */
export default function DashboardPage() {
    return (
        <div className="font-inter min-h-screen w-full overflow-hidden 
                    bg-zinc-900 text-gray-100 relative">

            {/* Le Header est dans layout.tsx */}

            <div className="container mx-auto max-w-7xl p-4">

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <main className="lg:col-span-8">
                        <MyOrdersPanel />
                    </main>

                    {/* Col 3: User Panel (Wallet) - Ré-ajusté à 4 colonnes */}
                    <aside className="lg:col-span-4">
                        <WalletPanel />
                    </aside>

                </div>
            </div>

        </div>
    );
}