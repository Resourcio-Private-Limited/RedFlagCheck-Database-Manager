import React, { useState, useRef } from 'react';
import { X, Plus, Loader2, Image as ImageIcon } from 'lucide-react';
import api from '../lib/api';
import { cn } from '../lib/utils';

export function PostModal({ isOpen, onClose, onSuccess, user, editingPost }) {
    const [type, setType] = useState('REDFLAG');
    const [photos, setPhotos] = useState([null, null, null, null, null]);
    const [uploading, setUploading] = useState([false, false, false, false, false]);
    const [formData, setFormData] = useState({
        name: '',
        age: '',
        nationality: '',
        jobProfile: '',
        currentLivingIn: '',
        content: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const fileInputRef = useRef(null);
    const [activeSlot, setActiveSlot] = useState(0);

    // Sync editing data
    React.useEffect(() => {
        if (editingPost && isOpen) {
            setType(editingPost.type);
            setFormData({
                name: editingPost.name,
                age: editingPost.age.toString(),
                nationality: editingPost.nationality,
                jobProfile: editingPost.jobProfile,
                currentLivingIn: editingPost.currentLivingIn,
                content: editingPost.content
            });
            const newPhotos = [null, null, null, null, null];
            editingPost.photos.forEach((p, i) => { if (i < 5) newPhotos[i] = p; });
            setPhotos(newPhotos);
        } else if (!editingPost && isOpen) {
            // Reset for new post
            setType('REDFLAG');
            setPhotos([null, null, null, null, null]);
            setFormData({ name: '', age: '', nationality: '', jobProfile: '', currentLivingIn: '', content: '' });
        }
    }, [editingPost, isOpen]);

    if (!isOpen) return null;

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const slot = activeSlot;
        const newUploading = [...uploading];
        newUploading[slot] = true;
        setUploading(newUploading);

        try {
            const { data } = await api.get(`/api/s3/presigned-url`, {
                params: {
                    filename: file.name,
                    contentType: file.type,
                    folder: 'posts',
                    uid: user?.uid
                }
            });

            await api.put(data.presignedUrl, file, {
                headers: { 'Content-Type': file.type }
            });

            const newPhotos = [...photos];
            newPhotos[slot] = data.publicUrl;
            setPhotos(newPhotos);
        } catch (err) {
            console.error(err);
            alert("Upload failed.");
        } finally {
            const finalUploading = [...uploading];
            finalUploading[slot] = false;
            setUploading(finalUploading);
        }
    };

    const removePhoto = (idx, e) => {
        e.stopPropagation();
        const newPhotos = [...photos];
        newPhotos[idx] = null;
        setPhotos(newPhotos);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const activePhotos = photos.filter(p => p !== null);
        if (activePhotos.length === 0) return alert("At least one photo is required.");

        setSubmitting(true);
        try {
            if (editingPost) {
                await api.put(`/api/posts/${editingPost.id}`, {
                    ...formData,
                    type,
                    photos: activePhotos,
                    age: parseInt(formData.age)
                });
            } else {
                await api.post('/api/posts', {
                    ...formData,
                    type,
                    photos: activePhotos,
                    age: parseInt(formData.age)
                });
            }
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.error || "Submission failed.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md grid place-items-center p-5 overflow-y-auto">
            <div className="bg-[#0f1117] border border-white/10 rounded-[28px] w-full max-w-2xl p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold">{type === 'REDFLAG' ? 'Create Red Flag Report' : 'Create Tea Inquiry'}</h2>
                    <button onClick={onClose} className="p-2 text-text-muted hover:bg-white/5 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex gap-2.5 mb-8">
                    <button
                        onClick={() => setType('REDFLAG')}
                        className={cn(
                            "flex-1 py-4 rounded-2xl font-bold transition-all border border-transparent",
                            type === 'REDFLAG' ? "bg-accent text-white shadow-lg shadow-accent/20" : "bg-surface text-text-muted border-border"
                        )}
                    >
                        RED FLAG
                    </button>
                    <button
                        onClick={() => setType('TEA')}
                        className={cn(
                            "flex-1 py-4 rounded-2xl font-bold transition-all border border-transparent cursor-pointer",
                            type === 'TEA' ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "bg-surface text-text-muted border-border"
                        )}
                    >
                        TEA POST
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-3">
                        <label className="text-[12px] font-bold text-text-muted uppercase tracking-wider">Upload Photos (1-5)</label>
                        <div className="grid grid-cols-5 gap-3">
                            {photos.map((photo, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => { setActiveSlot(idx); fileInputRef.current.click(); }}
                                    className={cn(
                                        "aspect-square rounded-2xl border-2 border-dashed border-border bg-surface flex items-center justify-center cursor-pointer transition-all relative overflow-hidden",
                                        photo ? "border-solid border-accent" : "hover:border-accent hover:text-accent"
                                    )}
                                >
                                    {uploading[idx] ? <Loader2 className="animate-spin" size={24} /> : (
                                        photo ? (
                                            <>
                                                <img src={photo} className="w-full h-full object-cover" />
                                                <button
                                                    onClick={(e) => removePhoto(idx, e)}
                                                    className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white z-10"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </>
                                        ) : <Plus size={24} className="text-text-muted" />
                                    )}
                                </div>
                            ))}
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleUpload}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Target Name" placeholder="Full name" value={formData.name} onChange={v => setFormData({ ...formData, name: v })} required />
                        <Input label="Age" type="number" placeholder="Age" value={formData.age} onChange={v => setFormData({ ...formData, age: v })} required />
                        <Input label="Nationality" placeholder="Country" value={formData.nationality} onChange={v => setFormData({ ...formData, nationality: v })} required />
                        <Input label="Job Profile" placeholder="Work/Title" value={formData.jobProfile} onChange={v => setFormData({ ...formData, jobProfile: v })} required />
                        <div className="col-span-2">
                            <Input label="Current Living In" placeholder="City/State" value={formData.currentLivingIn} onChange={v => setFormData({ ...formData, currentLivingIn: v })} required />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-[12px] font-bold text-text-muted uppercase tracking-wider mb-2">Remarks (Min 10 chars)</label>
                            <textarea
                                className="w-full bg-surface border border-border rounded-2xl p-4 text-white outline-none focus:border-accent transition-all min-h-[120px]"
                                placeholder="Share the details..."
                                value={formData.content}
                                onChange={e => setFormData({ ...formData, content: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-accent hover:brightness-110 active:scale-[0.98] py-5 rounded-[20px] font-bold text-white transition-all flex items-center justify-center gap-2"
                    >
                        {submitting ? <Loader2 className="animate-spin" size={24} /> : (editingPost ? 'UPDATE RECORD' : 'SUBMIT POST')}
                    </button>
                </form>
            </div>
        </div>
    );
}

function Input({ label, ...props }) {
    return (
        <div className="space-y-2">
            <label className="block text-[12px] font-bold text-text-muted uppercase tracking-wider">{label}</label>
            <input
                className="w-full bg-surface border border-border rounded-xl px-4 py-3.5 text-white outline-none focus:border-accent transition-all"
                {...props}
                onChange={e => props.onChange(e.target.value)}
            />
        </div>
    )
}
