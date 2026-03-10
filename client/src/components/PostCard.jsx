import React from 'react';
import { MapPin, Briefcase, Calendar, Trash2, ShieldAlert, Coffee, Info, Pencil } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

export function PostCard({ post, onDelete, onExpand, onEdit }) {
    const isRedFlag = post.type === 'REDFLAG';

    return (
        <motion.div
            layout
            whileHover={{ y: -10 }}
            className="relative h-[500px] w-full group cursor-pointer overflow-hidden rounded-[40px] border border-white/10 shadow-3xl bg-[#0a0c10]"
            onClick={onExpand}
        >
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
                <img
                    src={post.photos[0]}
                    alt={post.name}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            </div>

            {/* Top Floating Content */}
            <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-10">
                {/* Nationality Badge */}
                <div className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 text-xl">
                    {getFlagEmoji(post.nationality)}
                </div>

                {/* Type Badge */}
                <div className={cn(
                    "px-4 py-1.5 rounded-full flex items-center gap-2 border text-[10px] font-black tracking-widest uppercase backdrop-blur-md",
                    isRedFlag
                        ? "bg-red-500/20 border-red-500/30 text-red-500"
                        : "bg-blue-500/20 border-blue-500/30 text-blue-400"
                )}>
                    {isRedFlag ? <ShieldAlert size={12} className="fill-red-500/30" /> : <Coffee size={12} className="fill-blue-500/30" />}
                    {post.type === 'REDFLAG' ? 'RED FLAG' : 'TEA POST'}
                </div>
            </div>

            {/* Main Info at Bottom */}
            <div className="absolute bottom-6 left-6 right-6 z-10">
                <div className="flex items-baseline gap-2 mb-2">
                    <h3 className="text-3xl font-black text-white">{post.name}</h3>
                    <span className="text-xl text-white/60 font-medium">{post.age}</span>
                </div>

                <div className="space-y-1.5 mb-5 opacity-80 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-2 text-white/70 text-sm font-medium">
                        <MapPin size={14} className="text-red-500" />
                        {post.currentLivingIn} • {post.nationality}
                    </div>
                    <div className="flex items-center gap-2 text-white/70 text-sm font-medium">
                        <Briefcase size={14} className="text-white/40" />
                        {post.jobProfile}
                    </div>
                </div>

                {/* Content Snippet */}
                <div className="flex items-center gap-3 py-3 border-t border-white/10">
                    <div className="w-1.5 h-6 bg-yellow-500 rounded-full" />
                    <p className="text-white/90 font-medium text-sm line-clamp-1 italic">
                        {post.content}
                    </p>
                </div>
            </div>

            {/* Action Buttons Overlay */}
            <div className="absolute top-6 right-6 group-hover:flex hidden flex-col gap-3 z-20">
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit(post); }}
                    className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20"
                    title="Edit Record"
                >
                    <Pencil size={20} className="stroke-[3]" />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(post.id); }}
                    className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all shadow-xl shadow-red-500/20"
                    title="Delete Record"
                >
                    <Trash2 size={20} />
                </button>
            </div>
        </motion.div>
    );
}

function getFlagEmoji(country) {
    if (!country) return '🌍';
    // Simplified mapping for common countries mentioned in screenshot/region
    const flags = {
        'Lebanese': '🇱🇧',
        'Indian': '🇮🇳',
        'Egyptian': '🇪🇬',
        'Emirati': '🇦🇪',
        'Philippines': '🇵🇭'
    };
    return flags[country] || '🚩';
}
