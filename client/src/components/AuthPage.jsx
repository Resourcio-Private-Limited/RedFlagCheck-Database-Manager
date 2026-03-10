import React, { useState } from 'react';
import { ShieldAlert, Mail, Lock, User, AtSign, Loader2, ArrowRight, Plus } from 'lucide-react';
import api from '../lib/api';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function AuthPage({ onLogin }) {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [profileImage, setProfileImage] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        fullname: '',
        username: '',
        email: '',
        password: ''
    });

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const { data } = await api.get('/api/s3/presigned-url', {
                params: {
                    filename: file.name,
                    contentType: file.type,
                    folder: 'profiles'
                }
            });

            await api.put(data.presignedUrl, file, {
                headers: { 'Content-Type': file.type }
            });

            setProfileImage(data.publicUrl);
        } catch (err) {
            console.error(err);
            alert("Profile image upload failed.");
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isLogin) {
                await api.post('/login', {
                    email: formData.email,
                    password: formData.password
                });
                onLogin();
            } else {
                await api.post('/register', {
                    ...formData,
                    profileImage
                });
                alert("Registration successful! Logging you in...");
                await api.post('/login', {
                    email: formData.email,
                    password: formData.password
                });
                onLogin();
            }
        } catch (err) {
            alert(err.response?.data?.error || "Authentication failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid place-items-center bg-bg p-5 overflow-hidden relative">
            {/* Dynamic Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-accent/20 blur-[150px] rounded-full opacity-50" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-tea/10 blur-[150px] rounded-full opacity-30" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-md space-y-10 relative z-10"
            >
                <div className="text-center space-y-5">
                    <motion.div
                        whileHover={{ scale: 1.05, rotate: 5 }}
                        className="w-24 h-24 bg-gradient-to-br from-accent to-[#ff8833] rounded-[32px] mx-auto flex items-center justify-center shadow-2xl shadow-accent/30"
                    >
                        <ShieldAlert size={48} className="text-white" />
                    </motion.div>
                    <div className="space-y-1">
                        <h1 className="text-5xl font-black tracking-tight bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent italic">
                            RedFlagCheck
                        </h1>
                        <p className="text-text-muted text-sm font-semibold tracking-wider uppercase opacity-80">Verified Intel Database</p>
                    </div>
                </div>

                <div className="bg-white/[0.03] border border-white/[0.08] p-8 rounded-[40px] shadow-2xl backdrop-blur-3xl">
                    <div className="flex bg-black/40 rounded-2xl p-1.5 mb-10 border border-white/5">
                        <button
                            onClick={() => setIsLogin(true)}
                            className={cn(
                                "flex-1 py-3.5 rounded-xl font-black transition-all text-xs tracking-widest uppercase cursor-pointer",
                                isLogin ? "bg-accent text-white shadow-xl shadow-accent/20" : "text-white/40 hover:text-white"
                            )}
                        >
                            Login
                        </button>
                        <button
                            onClick={() => setIsLogin(false)}
                            className={cn(
                                "flex-1 py-3.5 rounded-xl font-black transition-all text-xs tracking-widest uppercase cursor-pointer",
                                !isLogin ? "bg-accent text-white shadow-xl shadow-accent/20" : "text-white/40 hover:text-white"
                            )}
                        >
                            Register
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <AnimatePresence mode="wait">
                            {!isLogin && (
                                <motion.div
                                    key="register"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-6 overflow-hidden"
                                >
                                    {/* Profile Upload */}
                                    <div className="flex flex-col items-center gap-4 mb-4">
                                        <div
                                            className="w-24 h-24 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center cursor-pointer overflow-hidden group relative bg-black/20"
                                            onClick={() => document.getElementById('register-avatar').click()}
                                        >
                                            {profileImage ? (
                                                <img src={profileImage} className="w-full h-full object-cover" alt="Profile" />
                                            ) : (
                                                uploading ? <Loader2 className="animate-spin text-accent" /> : <User size={40} className="text-white/20 group-hover:text-accent transition-colors" />
                                            )}
                                            {!uploading && (
                                                <div className="absolute inset-0 bg-accent/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm">
                                                    <Plus size={24} className="text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Profile Image</span>
                                        <input type="file" id="register-avatar" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                    </div>

                                    <Input
                                        icon={User}
                                        type="text"
                                        placeholder="Full Name"
                                        value={formData.fullname}
                                        onChange={v => setFormData({ ...formData, fullname: v })}
                                        required
                                    />
                                    <Input
                                        icon={AtSign}
                                        type="text"
                                        placeholder="Username"
                                        value={formData.username}
                                        onChange={v => setFormData({ ...formData, username: v })}
                                        required
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <Input
                            icon={Mail}
                            type="email"
                            placeholder="Email Address"
                            value={formData.email}
                            onChange={v => setFormData({ ...formData, email: v })}
                            required
                        />
                        <Input
                            icon={Lock}
                            type="password"
                            placeholder="Your Password"
                            value={formData.password}
                            onChange={v => setFormData({ ...formData, password: v })}
                            required
                        />

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={loading || (!isLogin && uploading)}
                            className="w-full bg-accent hover:brightness-110 disabled:opacity-50 py-5 rounded-[20px] font-black text-white transition-all flex items-center justify-center gap-3 mt-4 shadow-2xl shadow-accent/30 text-sm tracking-widest uppercase cursor-pointer"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : (isLogin ? 'Establish Session' : 'Create Intelligence Profile')}
                            {!loading && <ArrowRight size={20} />}
                        </motion.button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}

function Input({ icon: Icon, value, onChange, ...props }) {
    return (
        <div className="relative group w-full">
            <div className="absolute left-0 top-0 bottom-0 w-14 flex items-center justify-center pointer-events-none z-10">
                <Icon className="text-white/20 group-focus-within:text-accent transition-colors" size={20} />
            </div>
            <input
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl py-5 pl-14 pr-5 outline-none focus:border-accent/40 focus:bg-white/[0.06] focus:ring-8 focus:ring-accent/5 text-white transition-all placeholder:text-white/10 text-sm font-medium"
                {...props}
            />
        </div>
    );
}
