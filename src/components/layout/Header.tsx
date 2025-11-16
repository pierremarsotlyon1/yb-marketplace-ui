"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Layers, LayoutGrid, ListPlus } from 'lucide-react';
import { ConnectKitButton } from 'connectkit';
import Image from 'next/image';

/**
 * Composant de navigation principal, maintenant horizontal
 */
const TopNav = () => {
  const pathname = usePathname();
  
  const navItems = [
    { name: 'Market', href: '/', icon: Layers },
    { name: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
    { name: 'Create an order', href: '/create-order', icon: ListPlus },
  ];

  return (
    <nav className="flex items-center gap-2">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`
              flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium
              transition-colors
              ${
                isActive
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
              }
            `}
          >
            <item.icon className="h-4 w-4" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
};

/**
 * Header Component
 * Contient maintenant le Logo, la TopNav, et les boutons de connexion.
 */
export const Header = () => {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-zinc-700 bg-zinc-900 backdrop-blur-md">
            <nav className="container mx-auto flex max-w-7xl items-center justify-between p-4">
                <div className="flex items-center gap-6">
                    {/* Logo */}
                    <a href="/" className="text-xl font-bold text-gray-100 flex items-center gap-2">
                        <Image src={"/logo.png"} width={90} height={100} alt='logo' />
                        
                    </a>
                    {/* Navigation intégrée */}
                    <TopNav />
                </div>
                <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 text-sm text-gray-300 hover:bg-zinc-700 transition-colors">
                        <img src="https://placehold.co/16x16/6366f1/white?text=E&font=sans" alt="Ethereum" className="rounded-full" />
                        Ethereum
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                    </button>
                    <ConnectKitButton />
                </div>
            </nav>
        </header>
    );
};