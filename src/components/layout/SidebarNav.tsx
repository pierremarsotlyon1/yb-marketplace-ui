"use client"
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layers, LayoutGrid } from 'lucide-react';

/**
 * SidebarNav Component
 * Utilise Link pour la navigation et usePathname pour l'état actif.
 */
const SidebarNav: React.FC = () => {
    const pathname = usePathname();

    const navItems = [
        { name: 'Market', href: '/', icon: Layers },
        { name: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
    ];

    return (
        <nav className="flex flex-col gap-2 p-4 sticky">
            {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                    <Link
                        key={item.name}
                        href={item.href}
                        className={`
              flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium
              transition-colors
              ${isActive
                                ? 'bg-blue-600 text-white'
                                : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
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

export default SidebarNav;