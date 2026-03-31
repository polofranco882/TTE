import React, { useState, useEffect } from 'react';
import { Settings, Plus, Server, Edit, Trash2, MailCheck, ShieldCheck, Activity, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { NotificationType } from './components/Notification';

interface ConfigItem {
    id: number;
    name: string;
    host: string;
    port: number;
    secure: boolean;
    auth_user: string;
    from_name: string;
    from_email: string;
    reply_to: string;
    is_active: boolean;
}

interface AdminMarketingConfigsProps {
    token: string;
    onNotify: (msg: string, type: NotificationType) => void;
    onUnauthorized: () => void;
}

const AdminMarketingConfigs: React.FC<AdminMarketingConfigsProps> = ({ token, onNotify, onUnauthorized }) => {
    const [configs, setConfigs] = useState<ConfigItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [testingId, setTestingId] = useState<number | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        host: '',
        port: 587,
        secure: false,
        auth_user: '',
        auth_pass: '',
        from_name: '',
        from_email: '',
        reply_to: ''
    });
    const [showPass, setShowPass] = useState(false);

    useEffect(() => {
        fetchConfigs();
    }, []);

    const fetchConfigs = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/marketing/configs', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.status === 401) {
                onUnauthorized();
                return;
            }
            if (res.ok) {
                const data = await res.json();
                setConfigs(data);
            }
        } catch (err) {
            onNotify('Error al cargar configuraciones SMTP', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const endpoint = editingId ? `/api/marketing/configs/${editingId}` : '/api/marketing/configs';
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData)
            });
            if (res.status === 401) return onUnauthorized();
            
            if (res.ok) {
                onNotify(editingId ? 'Configuración actualizada.' : 'Configuración guardada exitosamente.', 'success');
                setShowModal(false);
                setEditingId(null);
                setFormData({ name: '', host: '', port: 587, secure: false, auth_user: '', auth_pass: '', from_name: '', from_email: '', reply_to: '' });
                fetchConfigs();
            } else {
                const err = await res.json();
                onNotify(err.error || 'Error al guardar.', 'error');
            }
        } catch (err) {
            onNotify('Error de conexión.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleTest = async (configId?: number) => {
        const isModalTest = !configId;
        isModalTest ? setTesting(true) : setTestingId(configId);
        
        try {
            // Test either from the form (include editingId if modifying) or from an existing ID in the card list
            const payload = isModalTest 
                ? { ...formData, id: editingId } 
                : { 
                    id: configId, 
                    host: configs.find(c => c.id === configId)?.host, 
                    port: configs.find(c => c.id === configId)?.port, 
                    secure: configs.find(c => c.id === configId)?.secure, 
                    auth_user: configs.find(c => c.id === configId)?.auth_user 
                  };

            const res = await fetch('/api/marketing/configs/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            if (res.status === 401) return onUnauthorized();
            const data = await res.json();
            
            if (res.ok && data.success) {
                onNotify(data.message || 'Conexión SMTP exitosa.', 'success');
            } else {
                onNotify(data.error || 'Error al conectar al servidor SMTP.', 'error');
            }
        } catch (err) {
            onNotify('Error intentando conexión SMTP.', 'error');
        } finally {
            isModalTest ? setTesting(false) : setTestingId(null);
        }
    };

    const handleEdit = (c: ConfigItem) => {
        setFormData({
            name: c.name,
            host: c.host,
            port: c.port,
            secure: c.secure,
            auth_user: c.auth_user,
            auth_pass: '', // Blank for security; skipped loosely if empty
            from_name: c.from_name,
            from_email: c.from_email,
            reply_to: c.reply_to || ''
        });
        setEditingId(c.id);
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("¿Estás seguro de que deseas eliminar este servidor SMTP? Esta acción es irreversible.")) return;
        try {
            const res = await fetch(`/api/marketing/configs/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.status === 401) return onUnauthorized();
            if (res.ok) {
                onNotify('Configuración eliminada exitosamente.', 'success');
                fetchConfigs();
            } else {
                onNotify('Error al eliminar.', 'error');
            }
        } catch (e) {
            onNotify('Error de conexión al eliminar.', 'error');
        }
    };

    return (
        <div className="h-full bg-slate-50 relative p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-bold text-[#09194F]">Servidores de Salida SMTP</h3>
                    <p className="text-sm text-gray-500">Administre las cuentas de correo autorizadas para enviar campañas.</p>
                </div>
                <button
                    onClick={() => {
                        setEditingId(null);
                        setFormData({ name: '', host: '', port: 587, secure: false, auth_user: '', auth_pass: '', from_name: '', from_email: '', reply_to: '' });
                        setShowModal(true);
                    }}
                    className="bg-[#2E49AC] hover:bg-[#1a2d73] text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-md transition-all active:scale-95"
                >
                    <Plus size={18} />
                    <span className="hidden sm:inline">Nueva Configuración</span>
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Activity className="w-10 h-10 text-[#2E49AC] animate-spin" />
                </div>
            ) : configs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                    <Server className="w-16 h-16 text-gray-300 mb-4" />
                    <p className="text-gray-500 font-medium">No hay servidores configurados.</p>
                    <p className="text-sm text-gray-400 mt-1">Añada una configuración SMTP para empezar a enviar correos.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {configs.map((c) => (
                        <div key={c.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow relative overflow-hidden group">
                            {/* Decorative header line */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#2E49AC] to-[#AC2425]"></div>
                            
                            <div className="flex justify-between items-start mb-4 mt-2">
                                <div className="flex items-center gap-3">
                                    <div className="bg-[#e9effd] p-3 rounded-xl text-[#2E49AC]">
                                        <Server size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 leading-tight">{c.name}</h4>
                                        <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-green-500"></span> Activo
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-3 mt-5">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Host:</span>
                                    <span className="font-semibold text-[#09194F] truncate max-w-[150px]">{c.host}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Puerto:</span>
                                    <span className="font-semibold text-gray-700">{c.port} {c.secure ? <ShieldCheck className="w-3 h-3 text-green-500 inline ml-1" /> : ''}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Remitente:</span>
                                    <span className="font-medium text-gray-700 truncate max-w-[150px]">{c.from_email}</span>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-gray-100 flex gap-2">
                                <button 
                                    onClick={() => handleTest(c.id)}
                                    disabled={testingId === c.id}
                                    className="flex-1 bg-slate-50 hover:bg-[#e9effd] text-[#2E49AC] py-2 rounded-lg text-sm font-semibold transition-colors flex justify-center items-center gap-2"
                                >
                                    {testingId === c.id ? <Activity className="w-4 h-4 animate-spin" /> : <MailCheck className="w-4 h-4" />}
                                    Probar
                                </button>
                                <button 
                                    onClick={() => handleEdit(c)}
                                    className="bg-slate-50 hover:bg-gray-200 text-gray-600 px-3 rounded-lg flex items-center justify-center transition-colors"
                                    title="Editar configuración"
                                >
                                    <Edit className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={() => handleDelete(c.id)}
                                    className="bg-red-50 hover:bg-red-100 text-red-600 px-3 rounded-lg flex items-center justify-center transition-colors"
                                    title="Eliminar configuración"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal for New Config */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                        
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-2xl shadow-premium w-full max-w-2xl relative z-10 overflow-hidden max-h-[90vh] flex flex-col"
                        >
                            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <h3 className="text-lg font-bold text-[#09194F] flex items-center gap-2">
                                    <Settings className="w-5 h-5 text-[#2E49AC]"/> {editingId ? 'Editar Configuración SMTP' : 'Nueva Configuración SMTP'}
                                </h3>
                                <button onClick={() => { setShowModal(false); setEditingId(null); setFormData({ name: '', host: '', port: 587, secure: false, auth_user: '', auth_pass: '', from_name: '', from_email: '', reply_to: '' }); }} className="text-gray-400 hover:text-gray-600">×</button>
                            </div>
                            
                            <div className="p-6 overflow-y-auto flex-1">
                                <form id="smtp-form" onSubmit={handleSave} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre Descriptivo</label>
                                        <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej: AWS SES Corporativo" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#2E49AC]/20 focus:border-[#2E49AC] outline-none transition-all"/>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="col-span-2">
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Host SMTP</label>
                                            <input required type="text" value={formData.host} onChange={e => setFormData({...formData, host: e.target.value})} placeholder="smtp.gmail.com" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#2E49AC]/20 focus:border-[#2E49AC] outline-none transition-all"/>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Puerto</label>
                                            <input required type="number" value={formData.port} onChange={e => setFormData({...formData, port: Number(e.target.value)})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#2E49AC]/20 focus:border-[#2E49AC] outline-none transition-all"/>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <input type="checkbox" id="secureMode" checked={formData.secure} onChange={e => setFormData({...formData, secure: e.target.checked})} className="w-4 h-4 text-[#2E49AC] rounded cursor-pointer"/>
                                        <label htmlFor="secureMode" className="text-sm font-semibold text-gray-700 cursor-pointer flex items-center gap-1">
                                            Usar conexión segura (SSL/TLS) <ShieldCheck className="w-4 h-4 text-green-500"/>
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Usuario Auth / Correo</label>
                                            <input required type="text" value={formData.auth_user} onChange={e => setFormData({...formData, auth_user: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#2E49AC]/20 focus:border-[#2E49AC] outline-none transition-all"/>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contraseña / App Password</label>
                                            <div className="relative">
                                                <input required={!editingId} type={showPass ? 'text' : 'password'} value={formData.auth_pass} onChange={e => setFormData({...formData, auth_pass: e.target.value})} placeholder={editingId ? 'Deja vacío para mantener actual' : ''} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 pr-10 focus:ring-2 focus:ring-[#2E49AC]/20 focus:border-[#2E49AC] outline-none transition-all"/>
                                                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                                                    {showPass ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre del Remitente</label>
                                            <input required type="text" value={formData.from_name} onChange={e => setFormData({...formData, from_name: e.target.value})} placeholder="TTESOL Academy" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#2E49AC]/20 focus:border-[#2E49AC] outline-none transition-all"/>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Correo Remitente</label>
                                            <input required type="email" value={formData.from_email} onChange={e => setFormData({...formData, from_email: e.target.value})} placeholder="no-reply@ttesol.com" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#2E49AC]/20 focus:border-[#2E49AC] outline-none transition-all"/>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Responder-A (Reply-To) <span className="font-normal lowercase">(Opcional)</span></label>
                                        <input type="email" value={formData.reply_to} onChange={e => setFormData({...formData, reply_to: e.target.value})} placeholder="soporte@ttesol.com" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#2E49AC]/20 focus:border-[#2E49AC] outline-none transition-all"/>
                                    </div>
                                    
                                </form>
                            </div>
                            
                            <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-between">
                                <button type="button" onClick={() => handleTest()} disabled={testing} className="text-[#2E49AC] font-bold text-sm flex items-center gap-2 hover:bg-[#2E49AC]/10 px-4 py-2 rounded-lg transition-colors">
                                    {testing ? <Activity className="w-4 h-4 animate-spin" /> : <MailCheck className="w-4 h-4" />}
                                    Probar Conexión
                                </button>
                                
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => { setShowModal(false); setEditingId(null); setFormData({ name: '', host: '', port: 587, secure: false, auth_user: '', auth_pass: '', from_name: '', from_email: '', reply_to: '' }); }} className="text-gray-500 hover:text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-lg font-bold text-sm transition-colors">Cancelar</button>
                                    <button type="submit" form="smtp-form" disabled={saving} className="bg-[#AC2425] hover:bg-[#8b1c1e] text-white px-6 py-2 rounded-lg font-bold text-sm shadow-md transition-colors flex items-center justify-center min-w-[120px]">
                                        {saving ? <Activity className="w-4 h-4 animate-spin" /> : 'Guardar'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminMarketingConfigs;
