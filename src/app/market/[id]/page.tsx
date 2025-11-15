"use client"
// 1. Import de 'useParams' pour accéder aux paramètres côté client
import { BuyModal } from '@/components/market/BuyModal';
import OrderList from '@/components/market/OrderList';
import { Order } from '@/interfaces/Order';
import { useState } from 'react';
import { useParams } from 'next/navigation'; // Import du hook
import { useFetchMarkets } from '@/hooks/useFetchMarkets';

export default function SpecificMarketPage() {

    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

    const { data: markets } = useFetchMarkets()
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;

    const market = markets?.find(m => m.id === id);

    const handleBuyOrder = (order: Order) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedOrder(null);
    };

    // --- Gestion du cas où le marché n'est pas trouvé ---
    if (!market) {
        return (
            <div className="font-inter min-h-screen w-full overflow-hidden 
                      bg-zinc-900 text-gray-100 relative">
                <div className="container mx-auto max-w-7xl p-4">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <main className="lg:col-span-10">
                            <h1 className="text-xl font-semibold text-white">Market not found</h1>
                        </main>
                    </div>
                </div>
            </div>
        );
    }
    // --- Fin de la gestion d'erreur ---

    return (
        <div className="font-inter min-h-screen w-full overflow-hidden 
                        bg-zinc-900 text-gray-100 relative">

            {/* Le Header est dans layout.tsx et contient la navigation */}

            <div className="container mx-auto max-w-7xl p-4">
                {/* Grille principale, la sidebar est retirée */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Le contenu principal prend maintenant toute la largeur (12 colonnes) */}
                    <main className="lg:col-span-12">
                        <OrderList
                            market={market}
                            onBuyOrder={handleBuyOrder}
                        />
                    </main>

                </div>
            </div>
            {/* Buy Modal */}
            <BuyModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                order={selectedOrder}
                market={market}
            />
        </div>
    );
}