import React, { useState } from 'react';
import { X, MapPin, Briefcase, Calendar, ChevronLeft, ChevronRight, ShieldAlert, Coffee, Trash2, Pencil } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function PostDetailModal({ post, isOpen, onClose, onDelete }) {
    const [currentImage, setCurrentImage] = useState(0);

    if (!post || !isOpen) return null;

    const isRedFlag = post.type === 'REDFLAG';

    const nextImage = (e) => {
        e.stopPropagation();
        setCurrentImage((prev) => (prev + 1) % post.photos.length);
    };

    const prevImage = (e) => {
        e.stopPropagation();
        setCurrentImage((prev) => (prev - 1 + post.photos.length) % post.photos.length);
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-xl"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="relative w-full max-w-5xl bg-surface border border-white/10 rounded-[40px] overflow-hidden flex flex-col md:flex-row h-full max-h-[85vh] shadow-3xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Left Side: Image Carousel */}
                    <div className="relative w-full md:w-3/5 h-[40vh] md:h-auto bg-black">
                        <AnimatePresence mode="wait">
                            <motion.img
                                key={currentImage}
                                src={post.photos[currentImage]}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="w-full h-full object-contain"
                            />
                        </AnimatePresence>

                        {post.photos.length > 1 && (
                            <>
                                <button
                                    onClick={prevImage}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white rounded-full border border-white/10 transition-all"
                                >
                                    <ChevronLeft size={24} />
                                </button>
                                <button
                                    onClick={nextImage}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white rounded-full border border-white/10 transition-all"
                                >
                                    <ChevronRight size={24} />
                                </button>

                                {/* Dot Indicators */}
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                                    {post.photos.map((_, idx) => (
                                        <div
                                            key={idx}
                                            className={cn(
                                                "w-2 h-2 rounded-full transition-all",
                                                idx === currentImage ? "w-6 bg-white" : "bg-white/30"
                                            )}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Right Side: Details */}
                    <div className="w-full md:w-2/5 p-8 md:p-10 overflow-y-auto flex flex-col custom-scrollbar">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-8">
                            <div className={cn(
                                "px-4 py-2 rounded-full flex items-center gap-2 border text-[10px] font-black tracking-widest uppercase",
                                isRedFlag
                                    ? "bg-red-500/10 border-red-500/20 text-red-500"
                                    : "bg-blue-500/10 border-blue-500/20 text-blue-400"
                            )}>
                                {isRedFlag ? <ShieldAlert size={14} /> : <Coffee size={14} />}
                                {post.type === 'REDFLAG' ? 'RED FLAG' : 'TEA POST'}
                            </div>

                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Subject Profile */}
                        <div className="mb-10">
                            {post.title && (
                                <h1 className="text-3xl font-black text-white mb-4 leading-tight">{post.title}</h1>
                            )}
                            <h2 className="text-4xl font-black text-white mb-2">{post.name}</h2>
                            <p className="text-xl text-white/60 mb-6 font-medium">Subject Identity • {post.age} Years Old</p>

                            <div className="space-y-4">
                                <DetailItem icon={MapPin} label="Location" value={`${post.currentLivingIn} • ${post.nationality}`} active={isRedFlag} />
                                <DetailItem icon={Briefcase} label="Occupation" value={post.jobProfile} />
                            </div>
                        </div>

                        {/* Verified intel */}
                        {post.content && (
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-4 text-xs font-black uppercase tracking-widest text-white/30">
                                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                                    Verified Intel Report
                                </div>
                                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl text-lg leading-relaxed text-white/80 italic">
                                    "{post.content}"
                                </div>
                            </div>
                        )}

                        {/* Footer / Actions */}
                        <div className="mt-10 pt-8 border-t border-white/5 flex items-center justify-between">
                            <div className="text-[11px] font-bold text-white/20 uppercase tracking-widest">
                                Database ID: RFC-{post.id.toString().padStart(4, '0')}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => { onEdit(post); onClose(); }}
                                    className="p-3 text-white/40 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-all flex items-center gap-2 font-bold text-xs"
                                >
                                    <Pencil size={18} />
                                    EDIT INTEL
                                </button>
                                <button
                                    onClick={() => { if (confirm("Permanently delete this intel record?")) { onDelete(post.id); onClose(); } }}
                                    className="p-3 text-red-500/30 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                    title="Delete Record"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

function DetailItem({ icon: Icon, label, value, active }) {
    return (
        <div className="flex items-start gap-4">
            <div className={cn(
                "p-3 rounded-2xl border",
                active ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-white/5 border-white/10 text-white/40"
            )}>
                <Icon size={18} />
            </div>
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-0.5">{label}</p>
                <p className="text-white font-bold">{value}</p>
            </div>
        </div>
    );
}
