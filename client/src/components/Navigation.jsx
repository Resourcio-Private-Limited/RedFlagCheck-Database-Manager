import React from 'react';
import { ShieldAlert, Plus, LogOut, Coffee, TriangleAlert } from 'lucide-react';
import { cn } from '../lib/utils';

export function Header({ onOpenModal, onLogout }) {
    return (
        <header className="flex items-center justify-between px-10 py-5 sticky top-0 z-50 bg-[#05070a]/80 backdrop-blur-xl border-b border-white/10">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-accent to-[#ff8833] rounded-xl flex items-center justify-center shadow-lg shadow-accent/20">
                    <ShieldAlert className="text-white" size={24} />
                </div>
                <h2 className="text-xl font-bold tracking-tight">
                    Red<span className="text-accent">Flag</span>Check
                </h2>
            </div>

            <div className="flex items-center gap-5">
                <button
                    onClick={onOpenModal}
                    className="bg-accent hover:translate-y-[-2px] hover:shadow-lg hover:shadow-accent/30 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2"
                >
                    <Plus size={18} /> New Post
                </button>
                <button
                    onClick={onLogout}
                    className="bg-surface hover:bg-surface-hover border border-border text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2"
                >
                    <LogOut size={18} /> Logout
                </button>
            </div>
        </header>
    );
}

export function Tabs({ activeTab, onTabChange }) {
    const tabs = [
        { id: 'ALL', label: 'All Posts', icon: ShieldAlert },
        { id: 'REDFLAG', label: 'Red Flags', icon: TriangleAlert },
        { id: 'TEA', label: 'Tea Posts', icon: Coffee }
    ];

    return (
        <div className="flex gap-3 mb-8">
            {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={cn(
                            "px-6 py-3 rounded-[14px] bg-surface border border-border text-text-muted font-semibold transition-all flex items-center gap-2.5",
                            isActive && "bg-surface-hover text-white border-accent shadow-lg shadow-black/20"
                        )}
                    >
                        <Icon size={18} className={isActive ? "text-accent" : ""} />
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
}
