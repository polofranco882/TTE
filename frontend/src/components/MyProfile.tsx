
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    User, Mail, Phone, Globe, MapPin, Calendar, 
    Languages, Clock, Camera, Shield, Bell, 
    Lock, Check, X, Save, Eye, EyeOff, Loader2,
    MessageCircle, Share2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { type NotificationType } from './Notification';
import PremiumLoader from './PremiumLoader';

interface MyProfileProps {
    token: string;
    onNotify: (msg: string, type: NotificationType) => void;
    onUnauthorized: () => void;
}

const MyProfile: React.FC<MyProfileProps> = ({ token, onNotify, onUnauthorized }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [activeSection, setActiveSection] = useState<'personal' | 'security' | 'preferences'>('personal');
    
    // Form states
    const [formData, setFormData] = useState<any>({});
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/profile/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.status === 401) {
                onUnauthorized();
                return;
            }
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
                setFormData(data);
            } else {
                onNotify(t('profile.error_fetch', 'Failed to load profile data'), 'error');
            }
        } catch (err) {
            console.error(err);
            onNotify(t('common.connection_error', 'Connection error'), 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, [token]);

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/profile/me', {
                method: 'POST', // Backend used POST for update to simplify COALESCE logic
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(formData)
            });
            
            if (res.ok) {
                setProfile(formData);
                setIsEditing(false);
                onNotify(t('profile.success_update', 'Profile updated successfully'), 'success');
            } else {
                onNotify(t('profile.error_update', 'Error updating profile'), 'error');
            }
        } catch (err) {
            onNotify(t('common.connection_error', 'Connection error'), 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            onNotify(t('profile.error_password_match', 'Passwords do not match'), 'error');
            return;
        }

        setSaving(true);
        try {
            const res = await fetch('/api/profile/password', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                })
            });

            if (res.ok) {
                onNotify(t('profile.success_password', 'Password changed successfully'), 'success');
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                const data = await res.json();
                onNotify(data.message || t('profile.error_password', 'Error changing password'), 'error');
            }
        } catch (err) {
            onNotify(t('common.connection_error', 'Connection error'), 'error');
        } finally {
            setSaving(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64Content = reader.result as string;
            
            setSaving(true);
            try {
                // Use existing media upload
                const res = await fetch('/api/media/upload', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` 
                    },
                    body: JSON.stringify({
                        module: 'profile',
                        entity_type: 'avatar',
                        file_name: file.name,
                        mime_type: file.type,
                        base64_content: base64Content,
                        size: file.size
                    })
                });

                if (res.ok) {
                    const data = await res.json();
                    const photoUrl = `/api/media/${data.asset.id}`;
                    
                    // Now update the user profile with the new photo URL
                    await fetch('/api/profile/me', {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}` 
                        },
                        body: JSON.stringify({ ...formData, photo_url: photoUrl })
                    });

                    setFormData({ ...formData, photo_url: photoUrl });
                    setProfile({ ...profile, photo_url: photoUrl });
                    onNotify(t('profile.success_photo', 'Photo updated successfully'), 'success');
                } else {
                    onNotify(t('profile.error_photo', 'Error uploading photo'), 'error');
                }
            } catch (err) {
                onNotify(t('common.connection_error', 'Connection error'), 'error');
            } finally {
                setSaving(false);
            }
        };
        reader.readAsDataURL(file);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl">
                <PremiumLoader size="lg" />
                <p className="mt-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">{t('common.loading', 'Loading Profile...')}</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto">
            {/* Header / Intro */}
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">{t('profile.title', 'My Profile')}</h2>
                    <p className="text-slate-500 font-medium">{t('profile.subtitle', 'Manage your account settings and preferences.')}</p>
                </div>
                
                <div className="flex bg-slate-100 p-1 rounded-2xl self-start">
                    <button 
                        onClick={() => setActiveSection('personal')}
                        className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${activeSection === 'personal' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        {t('profile.tab_personal', 'PERSONAL')}
                    </button>
                    <button 
                        onClick={() => setActiveSection('security')}
                        className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${activeSection === 'security' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        {t('profile.tab_security', 'SECURITY')}
                    </button>
                    <button 
                        onClick={() => setActiveSection('preferences')}
                        className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${activeSection === 'preferences' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        {t('profile.tab_preferences', 'PREFERENCES')}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Avatar & Quick Info */}
                <div className="lg:col-span-1 space-y-6">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col items-center text-center"
                    >
                        <div className="relative group mb-6">
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-50 shadow-inner bg-slate-100 flex items-center justify-center">
                                {formData.photo_url ? (
                                    <img src={formData.photo_url} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={64} className="text-slate-300" />
                                )}
                            </div>
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-0 right-0 p-3 bg-accent text-white rounded-2xl shadow-lg border-4 border-white hover:scale-110 transition-transform"
                                title={t('profile.change_photo', 'Change Photo')}
                            >
                                <Camera size={18} />
                            </button>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*" 
                                onChange={handlePhotoUpload}
                            />
                        </div>

                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{profile?.name}</h3>
                        <p className="text-slate-400 text-sm font-bold mb-6">{profile?.email}</p>

                        <div className="w-full pt-6 border-t border-slate-50 space-y-4">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-black text-slate-400 uppercase tracking-widest">{t('profile.member_since', 'ROLE')}</span>
                                <span className="font-bold text-accent bg-accent/5 px-3 py-1 rounded-lg uppercase">{profile?.role_name || profile?.role || 'STUDENT'}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-black text-slate-400 uppercase tracking-widest">{t('profile.status', 'STATUS')}</span>
                                <span className="font-bold text-emerald-500 bg-emerald-50 px-3 py-1 rounded-lg uppercase">{profile?.status || 'ACTIVE'}</span>
                            </div>
                        </div>
                    </motion.div>

                    <div className="bg-gradient-to-br from-primary to-primary-dark p-8 rounded-[32px] text-white shadow-xl shadow-primary/20 overflow-hidden relative">
                         <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
                         <h4 className="text-sm font-black uppercase tracking-[0.2em] mb-4 opacity-70">{t('profile.academic_summary', 'Academic Summary')}</h4>
                         <div className="space-y-4 relative z-10">
                             <div className="flex items-center gap-3">
                                 <div className="p-2 bg-white/10 rounded-xl"><Globe size={16}/></div>
                                 <div>
                                     <p className="text-[10px] font-black uppercase opacity-60">Level</p>
                                     <p className="font-bold">Advanced B2+</p>
                                 </div>
                             </div>
                             <div className="flex items-center gap-3">
                                 <div className="p-2 bg-white/10 rounded-xl"><Languages size={16}/></div>
                                 <div>
                                     <p className="text-[10px] font-black uppercase opacity-60">Language</p>
                                     <p className="font-bold">English / Spanish</p>
                                 </div>
                             </div>
                         </div>
                    </div>
                </div>

                {/* Right Column: Dynamic Form Content */}
                <div className="lg:col-span-2">
                    <AnimatePresence mode="wait">
                        {activeSection === 'personal' && (
                            <motion.div 
                                key="personal"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="bg-white p-6 md:p-10 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40">
                                    <div className="flex items-center justify-between mb-10">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-secondary/10 text-secondary rounded-2xl"><User /></div>
                                            <div>
                                                <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">{t('profile.personal_info', 'Personal Information')}</h4>
                                                <p className="text-sm text-slate-400 font-medium">Basic identity and contact details</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setIsEditing(!isEditing)}
                                            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${isEditing ? 'bg-slate-100 text-slate-400' : 'bg-primary/5 text-primary hover:bg-primary hover:text-white'}`}
                                        >
                                            {isEditing ? t('common.cancel', 'CANCEL') : t('common.edit', 'EDIT')}
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('profile.full_name', 'Full Name')}</label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                <input 
                                                    type="text" 
                                                    disabled={!isEditing}
                                                    value={formData.name || ''}
                                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-accent outline-none font-bold text-slate-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('profile.email', 'Email Address')}</label>
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                <input 
                                                    type="email" 
                                                    disabled // Email is typically fixed for identity
                                                    value={formData.email || ''}
                                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-bold text-slate-400 opacity-60 cursor-not-allowed"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('profile.phone', 'Phone Number')}</label>
                                            <div className="relative">
                                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                <input 
                                                    type="text" 
                                                    disabled={!isEditing}
                                                    placeholder="+1 234 567 890"
                                                    value={formData.phone_number || ''}
                                                    onChange={e => setFormData({...formData, phone_number: e.target.value})}
                                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-accent outline-none font-bold text-slate-700 transition-all disabled:opacity-60"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('profile.birthdate', 'Date of Birth')}</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                <input 
                                                    type="date" 
                                                    disabled={!isEditing}
                                                    value={formData.birthdate ? formData.birthdate.split('T')[0] : ''}
                                                    onChange={e => setFormData({...formData, birthdate: e.target.value})}
                                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-accent outline-none font-bold text-slate-700 transition-all disabled:opacity-60"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('profile.country', 'Country')}</label>
                                            <div className="relative">
                                                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                <input 
                                                    type="text" 
                                                    disabled={!isEditing}
                                                    placeholder="United States"
                                                    value={formData.country || ''}
                                                    onChange={e => setFormData({...formData, country: e.target.value})}
                                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-accent outline-none font-bold text-slate-700 transition-all disabled:opacity-60"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('profile.city', 'City')}</label>
                                            <div className="relative">
                                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                <input 
                                                    type="text" 
                                                    disabled={!isEditing}
                                                    placeholder="New York"
                                                    value={formData.city || ''}
                                                    onChange={e => setFormData({...formData, city: e.target.value})}
                                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-accent outline-none font-bold text-slate-700 transition-all disabled:opacity-60"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {isEditing && (
                                        <div className="mt-12 pt-10 border-t border-slate-100 flex justify-end gap-4">
                                            <button 
                                                onClick={() => { setFormData(profile); setIsEditing(false); }}
                                                className="px-8 py-4 rounded-2xl text-sm font-black text-slate-400 hover:bg-slate-50 transition-all uppercase tracking-widest"
                                            >
                                                {t('common.cancel', 'Cancel')}
                                            </button>
                                            <button 
                                                onClick={handleSaveProfile}
                                                disabled={saving}
                                                className="px-10 py-4 bg-accent text-white rounded-2xl text-sm font-black hover:bg-accent-dark transition-all shadow-lg hover:shadow-accent/40 flex items-center gap-2 uppercase tracking-widest"
                                            >
                                                {saving ? <Loader2 className="animate-spin" size={20} /> : <><Save size={18} /> {t('common.save', 'Save Changes')}</>}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {activeSection === 'security' && (
                            <motion.div 
                                key="security"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="bg-white p-6 md:p-10 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40">
                                    <div className="flex items-center gap-4 mb-10">
                                        <div className="p-3 bg-accent/10 text-accent rounded-2xl"><Shield /></div>
                                        <div>
                                            <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">{t('profile.security', 'Account Security')}</h4>
                                            <p className="text-sm text-slate-400 font-medium">{t('profile.security_desc', 'Update your authentication credentials')}</p>
                                        </div>
                                    </div>

                                    <form onSubmit={handleChangePassword} className="space-y-8 max-w-md">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('profile.current_password', 'Current Password')}</label>
                                            <div className="relative">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                <input 
                                                    type={showPassword.current ? "text" : "password"}
                                                    value={passwordData.currentPassword}
                                                    onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})}
                                                    className="w-full pl-12 pr-12 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-accent outline-none font-bold text-slate-700 transition-all"
                                                    required
                                                />
                                                <button 
                                                    type="button"
                                                    onClick={() => setShowPassword({...showPassword, current: !showPassword.current})}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                                                >
                                                    {showPassword.current ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('profile.new_password', 'New Password')}</label>
                                            <div className="relative">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                <input 
                                                    type={showPassword.new ? "text" : "password"}
                                                    value={passwordData.newPassword}
                                                    onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
                                                    className="w-full pl-12 pr-12 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-accent outline-none font-bold text-slate-700 transition-all"
                                                    required
                                                />
                                                <button 
                                                    type="button"
                                                    onClick={() => setShowPassword({...showPassword, new: !showPassword.new})}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                                                >
                                                    {showPassword.new ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('profile.confirm_password', 'Confirm New Password')}</label>
                                            <div className="relative">
                                                <Check className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                <input 
                                                    type={showPassword.confirm ? "text" : "password"}
                                                    value={passwordData.confirmPassword}
                                                    onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                                                    className="w-full pl-12 pr-12 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-accent outline-none font-bold text-slate-700 transition-all"
                                                    required
                                                />
                                                <button 
                                                    type="button"
                                                    onClick={() => setShowPassword({...showPassword, confirm: !showPassword.confirm})}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                                                >
                                                    {showPassword.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>

                                        <button 
                                            type="submit"
                                            disabled={saving}
                                            className="w-full py-5 bg-primary text-white rounded-2xl font-black hover:bg-primary-dark transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
                                        >
                                            {saving ? <Loader2 className="animate-spin" size={20} /> : t('profile.change_password', 'Update Password')}
                                        </button>
                                    </form>

                                    <div className="mt-16 pt-10 border-t border-slate-50">
                                        <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-red-50 text-red-500 rounded-2xl"><X size={20}/></div>
                                                <div>
                                                    <h5 className="font-bold text-slate-800">{t('profile.active_sessions', 'Active Sessions')}</h5>
                                                    <p className="text-xs text-slate-400 font-medium">Logged in from 2 other devices</p>
                                                </div>
                                            </div>
                                            <button className="text-red-500 text-xs font-black uppercase tracking-widest hover:underline px-4 py-2">
                                                {t('profile.logout_all', 'LOGOUT ALL')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeSection === 'preferences' && (
                            <motion.div 
                                key="preferences"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="bg-white p-6 md:p-10 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40">
                                    <div className="flex items-center gap-4 mb-10">
                                        <div className="p-3 bg-indigo-50 text-indigo-500 rounded-2xl"><Bell /></div>
                                        <div>
                                            <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">{t('profile.preferences', 'User Preferences')}</h4>
                                            <p className="text-sm text-slate-400 font-medium">Customize your learning experience</p>
                                        </div>
                                    </div>

                                    <div className="space-y-12">
                                        {/* Notifications Section */}
                                        <div className="space-y-6">
                                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">{t('profile.notification_settings', 'Notification Settings')}</h5>
                                            
                                            <div className="space-y-4">
                                                {[
                                                    { id: 'platform_notif', icon: <Bell size={18}/>, label: 'Platform Notifications', desc: 'Alerts inside the scholarly portal', color: 'bg-blue-50 text-blue-500' },
                                                    { id: 'academic_reminders', icon: <Calendar size={18}/>, label: 'Academic Reminders', desc: 'Upcoming class and book milestones', color: 'bg-emerald-50 text-emerald-500' },
                                                    { id: 'email_comm', icon: <Mail size={18}/>, label: 'Email Communication', desc: 'Weekly summaries and formal alerts', color: 'bg-amber-50 text-amber-500' },
                                                    { id: 'whatsapp_comm', icon: <MessageCircle size={18}/>, label: 'WhatsApp Updates', desc: 'Fast alerts for urgent academic changes', color: 'bg-green-50 text-green-500' }
                                                ].map(pref => (
                                                    <div key={pref.id} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`p-3 ${pref.color} rounded-xl`}>{pref.icon}</div>
                                                            <div>
                                                                <p className="font-bold text-slate-800 text-sm">{pref.label}</p>
                                                                <p className="text-xs text-slate-400 font-medium">{pref.desc}</p>
                                                            </div>
                                                        </div>
                                                        <label className="relative inline-flex items-center cursor-pointer">
                                                            <input type="checkbox" className="sr-only peer" defaultChecked />
                                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Visibility Section */}
                                        <div className="space-y-6">
                                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">{t('profile.visibility', 'System Visibility')}</h5>
                                            
                                            <div className="p-6 bg-slate-50 rounded-3xl space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-2 bg-white rounded-xl shadow-sm text-slate-400"><Share2 size={18}/></div>
                                                        <p className="text-sm font-bold text-slate-700">Public Profile to Classmates</p>
                                                    </div>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input type="checkbox" className="sr-only peer" />
                                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                                                    </label>
                                                </div>
                                                <p className="text-xs text-slate-400 font-medium pl-12 line-clamp-1">Allows other students in your level to see your progress and badges.</p>
                                            </div>
                                        </div>

                                        <div className="flex justify-end pt-6">
                                            <button 
                                                onClick={() => onNotify(t('profile.success_preferences', 'Preferences saved successfully'), 'success')}
                                                className="px-10 py-4 bg-slate-800 text-white rounded-2xl text-xs font-black hover:bg-black transition-all shadow-lg flex items-center gap-2 uppercase tracking-widest"
                                            >
                                                <Save size={16} /> {t('profile.save_preferences', 'Save Preferences')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default MyProfile;
