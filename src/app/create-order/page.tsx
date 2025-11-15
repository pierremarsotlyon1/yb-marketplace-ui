"use client"
import { CreateOrderPanel } from '@/components/market/CreateOrderPanel';
import React from 'react';

export default function CreateOrder() {
    return (
        <div className="font-inter min-h-screen w-full overflow-hidden 
                    bg-zinc-900 text-gray-100 relative">

            {/* Le Header est dans layout.tsx */}

            <div className="container mx-auto max-w-7xl p-4">

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <main className="lg:col-span-12">
                        <CreateOrderPanel />
                    </main>


                </div>
            </div>

        </div>
    );
}