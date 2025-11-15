"use client"
import { MarketList } from '../components/market/MarketList';

export default function MarketPage() {

  return (
    <div className="font-inter min-h-screen w-full overflow-hidden 
                    bg-zinc-900 text-gray-100 relative">

      {/* Le Header est dans layout.tsx et contient la navigation */}

      <div className="container mx-auto max-w-7xl p-4">
        {/* Grille principale, la sidebar est retirée */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Le contenu principal prend maintenant toute la largeur (12 colonnes) */}
          <main className="lg:col-span-12">
            <MarketList />
          </main>

        </div>
      </div>
    </div>
  );
}