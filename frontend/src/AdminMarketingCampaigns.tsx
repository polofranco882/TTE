import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, FileSpreadsheet, Upload, Play, Pause, X, Send, CheckCircle2, AlertCircle, BarChart, Settings, Mail, RefreshCw, Activity } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import * as XLSX from 'xlsx';
import type { NotificationType } from './components/Notification';

// Types
interface Campaign {
    id: number;
    name: string;
    subject: string;
    status: 'draft' | 'scheduled' | 'processing' | 'paused' | 'completed' | 'error';
    metrics_json: { total: number; sent: number; failed: number; pending: number; };
    created_at: string;
}

interface NewCampaignForm {
    name: string;
    description: string;
    sender_id: number;
    subject: string;
    body_html: string;
    contacts: Array<{ name: string; email: string; telephone: string; }>;
}

interface AdminMarketingCampaignsProps {
    token: string;
    onNotify: (msg: string, type: NotificationType) => void;
    onUnauthorized: () => void;
}

const AdminMarketingCampaigns: React.FC<AdminMarketingCampaignsProps> = ({ token, onNotify, onUnauthorized }) => {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [configs, setConfigs] = useState<{id: number, name: string}[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<NewCampaignForm>({
        name: '', description: '', sender_id: 0, subject: '', body_html: '', contacts: []
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [campRes, confRes] = await Promise.all([
                fetch('/api/marketing/campaigns', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('/api/marketing/configs', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            
            if (campRes.status === 401 || confRes.status === 401) return onUnauthorized();
            
            if (campRes.ok) setCampaigns(await campRes.json());
            if (confRes.ok) {
                const confs = await confRes.json();
                setConfigs(confs);
                if (confs.length > 0 && formData.sender_id === 0) setFormData(prev => ({...prev, sender_id: confs[0].id}));
            }
        } catch (e) {
            onNotify('Error de conexión al cargar campañas', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws) as any[];

                // Map data blindly trying to find columns for name, email, telephone
                const validContacts: any[] = [];
                data.forEach(row => {
                    const keys = Object.keys(row);
                    let email = '';
                    let name = '';
                    let telephone = '';

                    // Very permissive mapping (first key matching /email/i etc)
                    keys.forEach(k => {
                        const kl = k.toLowerCase();
                        if (kl.includes('email') || kl.includes('correo')) email = row[k];
                        else if (kl.includes('name') || kl.includes('nombre')) name = row[k];
                        else if (kl.includes('tel') || kl.includes('phone') || kl.includes('celular')) telephone = typeof row[k] === 'number' ? row[k].toString() : row[k];
                    });

                    if (email) validContacts.push({ name, email, telephone });
                });

                if (validContacts.length === 0) {
                    onNotify('No se encontraron correos válidos en el archivo.', 'error');
                } else {
                    setFormData(prev => ({ ...prev, contacts: validContacts }));
                    onNotify(`Se cargaron ${validContacts.length} contactos.`, 'success');
                }
            } catch (err) {
                onNotify('Error leyendo el archivo Excel', 'error');
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleCreateCampaign = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.contacts.length === 0) {
            onNotify('Debe cargar al menos un contacto', 'info');
            return;
        }
        if (!formData.sender_id) {
            onNotify('Debe seleccionar un remitente', 'info');
            return;
        }

        setSaving(true);
        try {
            const res = await fetch('/api/marketing/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData)
            });
            if (res.status === 401) return onUnauthorized();
            
            if (res.ok) {
                onNotify('Campaña creada. Lista para procesar.', 'success');
                setShowModal(false);
                setFormData({name: '', description: '', sender_id: configs[0]?.id || 0, subject: '', body_html: '', contacts: []});
                fetchData();
            } else {
                const err = await res.json();
                onNotify(err.error || 'Error creando campaña', 'error');
            }
        } catch (err) {
            onNotify('Error de conexión', 'error');
        } finally {
            setSaving(false);
        }
    };

    const toggleCampaignStatus = async (id: number, currentStatus: string) => {
        const newStatus = currentStatus === 'processing' ? 'paused' : 'processing';
        try {
            const res = await fetch(`/api/marketing/campaigns/${id}/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.status === 401) return onUnauthorized();
            if (res.ok) {
                fetchData();
                onNotify(`Campaña ${newStatus === 'processing' ? 'iniciada' : 'pausada'}.`, 'success');
            }
        } catch (e) {
            onNotify('Error actualizando estado.', 'error');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'completed': return 'bg-green-100 text-green-800 border-green-200';
            case 'paused': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
            case 'error': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const filteredCampaigns = campaigns.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

    // Quill Toolbar settings
    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['link', 'image'],
            ['clean']
        ]
    };

    const insertVariable = (variable: string) => {
        setFormData(prev => ({...prev, body_html: prev.body_html + ` {{${variable}}}`}));
    };

    return (
        <div className="h-full flex flex-col p-6 overflow-hidden">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input 
                        type="text" 
                        placeholder="Buscar campañas..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2E49AC]/20 focus:border-[#2E49AC] outline-none transition-all shadow-sm"
                    />
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <button onClick={fetchData} className="p-2.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-[#2E49AC] hover:bg-slate-50 shadow-sm transition-all">
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button 
                        onClick={() => setShowModal(true)}
                        className="flex-1 md:flex-none bg-[#2E49AC] hover:bg-[#1a2d73] text-white px-5 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        Nueva Campaña
                    </button>
                </div>
            </div>

            {/* Campaigns List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar -mr-2 pr-2">
                <div className="grid grid-cols-1 gap-4 pb-10">
                    {filteredCampaigns.length === 0 && !loading && (
                        <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                            <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-gray-500 font-bold text-lg">No hay campañas</h3>
                            <p className="text-gray-400 text-sm">Crea tu primera campaña para empezar.</p>
                        </div>
                    )}
                    
                    {filteredCampaigns.map((camp) => {
                        const m = typeof camp.metrics_json === 'string' ? JSON.parse(camp.metrics_json) : (camp.metrics_json || {total:0,sent:0,pending:0,failed:0});
                        const progress = m.total > 0 ? ((m.sent + m.failed) / m.total) * 100 : 0;
                        
                        return (
                            <div key={camp.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group flex flex-col md:flex-row gap-6 items-center">
                                {/* Left: Info */}
                                <div className="flex-1 min-w-0 w-full">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-lg font-bold text-[#09194F] truncate">{camp.name}</h3>
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(camp.status)}`}>
                                            {camp.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 truncate mb-4">"{camp.subject}"</p>
                                    
                                    {/* Progress Bar */}
                                    <div className="w-full">
                                        <div className="flex justify-between text-xs text-gray-500 font-medium mb-1.5">
                                            <span>Progreso: {Math.round(progress)}%</span>
                                            <span>{m.sent + m.failed} de {m.total} procesados</span>
                                        </div>
                                        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden flex">
                                            <div className="h-full bg-[#10b981] transition-all duration-500" style={{ width: (m.total>0 ? (m.sent/m.total)*100 : 0) + '%' }}></div>
                                            <div className="h-full bg-[#f43f5e] transition-all duration-500" style={{ width: (m.total>0 ? (m.failed/m.total)*100 : 0) + '%' }}></div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Right: Stats & Action */}
                                <div className="flex items-center gap-6 md:gap-8 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
                                    <div className="flex gap-4">
                                        <div className="text-center">
                                            <p className="text-xl font-black text-[#10b981]">{m.sent}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">Enviados</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xl font-black text-[#f43f5e]">{m.failed}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">Fallidos</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 ml-auto md:ml-0">
                                        {/* Play / Pause button */}
                                        {(camp.status === 'draft' || camp.status === 'paused' || camp.status === 'processing') && (
                                            <button 
                                                onClick={() => toggleCampaignStatus(camp.id, camp.status)}
                                                className={`p-3 rounded-xl shadow-md transition-transform active:scale-95 ${
                                                    camp.status === 'processing' 
                                                    ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' 
                                                    : 'bg-[#2E49AC] text-white hover:bg-[#1a2d73]'
                                                }`}
                                            >
                                                {camp.status === 'processing' ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                                            </button>
                                        )}
                                        {camp.status === 'completed' && (
                                            <div className="p-3 bg-green-100 text-green-600 rounded-xl">
                                                <CheckCircle2 className="w-5 h-5" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Create Campaign Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                        
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl relative z-10 overflow-hidden max-h-[95vh] flex flex-col"
                        >
                            {/* Header */}
                            <div className="bg-[#09194F] p-5 flex justify-between items-center text-white shrink-0">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Send className="w-5 h-5 text-[#B1B3D8]" />
                                    Nueva Campaña
                                </h3>
                                <button onClick={() => setShowModal(false)} className="bg-white/10 hover:bg-white/20 p-1.5 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
                            </div>

                            {/* Scrollable Body */}
                            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-slate-50 custom-scrollbar">
                                
                                {/* Top Row Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Left Column Configs */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre Descriptivo</label>
                                            <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej: Promo Octubre" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#2E49AC]/20 focus:border-[#2E49AC] outline-none transition-all shadow-sm"/>
                                        </div>
                                        
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Servidor Remitente (SMTP)</label>
                                            <select 
                                                value={formData.sender_id} 
                                                onChange={e => setFormData({...formData, sender_id: parseInt(e.target.value)})}
                                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#2E49AC]/20 focus:border-[#2E49AC] outline-none transition-all shadow-sm"
                                            >
                                                <option value={0} disabled>Seleccione remitente...</option>
                                                {configs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                            {configs.length === 0 && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>Debe crear una Configuración SMTP primero.</p>}
                                        </div>
                                    </div>

                                    {/* Right Column Contacts Excel */}
                                    <div className="flex flex-col">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Destinatarios (.xlsx)</label>
                                        <div 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="flex-1 bg-white border-2 border-dashed border-[#2E49AC]/30 rounded-xl hover:border-[#2E49AC] hover:bg-[#e9effd]/30 transition-all cursor-pointer flex flex-col items-center justify-center p-4 text-center group"
                                        >
                                            <input type="file" accept=".xls,.xlsx" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                                            {formData.contacts.length > 0 ? (
                                                <>
                                                  <div className="bg-[#10b981]/10 p-3 rounded-full mb-2"><CheckCircle2 className="w-8 h-8 text-[#10b981]" /></div>
                                                  <p className="font-bold text-[#09194F] text-lg">{formData.contacts.length}</p>
                                                  <p className="text-sm text-gray-500">Contactos listos para importar</p>
                                                  <p className="text-xs text-[#2E49AC] mt-2 group-hover:underline">Subir otro archivo</p>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="bg-[#e9effd] p-3 rounded-full mb-2 group-hover:scale-110 transition-transform"><FileSpreadsheet className="w-8 h-8 text-[#2E49AC]" /></div>
                                                    <p className="font-semibold text-[#2E49AC]">Subir o arrastrar Excel</p>
                                                    <p className="text-[10px] text-gray-400 mt-1 max-w-[200px]">El archivo debe contener columnas como "email", "name" o "phone".</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Subject */}
                                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Asunto del Correo</label>
                                    <div className="relative">
                                        <input required type="text" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} placeholder="Ej: {{name}}, tenemos una oferta exclusiva para ti" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#2E49AC]/20 focus:border-[#2E49AC] outline-none transition-all text-[#09194F] font-medium"/>
                                    </div>
                                    <div className="flex gap-2 mt-2">
                                        <span className="text-xs text-gray-400">Variables:</span>
                                        <button onClick={()=>setFormData(p=>({...p, subject: p.subject+' {{name}}'}))} className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono hover:bg-slate-300">{'{{name}}'}</button>
                                    </div>
                                </div>

                                {/* Body Editor */}
                                <div className="bg-white flex flex-col rounded-xl border border-gray-100 shadow-sm overflow-hidden h-[400px]">
                                     <div className="bg-gray-50 border-b border-gray-200 p-2 flex justify-between items-center shrink-0">
                                         <span className="text-xs font-bold text-gray-500 uppercase ml-2">Diseño del Mensaje</span>
                                         <div className="flex gap-1">
                                            <button onClick={()=>insertVariable('name')} className="text-[10px] bg-white border border-gray-200 text-slate-700 px-2 py-1 rounded font-mono hover:bg-slate-100 flex items-center gap-1"><Plus className="w-3 h-3"/>{'{{name}}'}</button>
                                            <button onClick={()=>insertVariable('email')} className="text-[10px] bg-white border border-gray-200 text-slate-700 px-2 py-1 rounded font-mono hover:bg-slate-100 flex items-center gap-1"><Plus className="w-3 h-3"/>{'{{email}}'}</button>
                                         </div>
                                     </div>
                                     <ReactQuill 
                                         theme="snow" 
                                         value={formData.body_html} 
                                         onChange={(val) => setFormData({...formData, body_html: val})} 
                                         modules={modules}
                                         className="flex-1 overflow-hidden flex flex-col ql-custom"
                                     />
                                </div>

                            </div>

                            {/* Footer Actions */}
                            <div className="bg-white p-5 border-t border-gray-100 flex justify-between items-center shrink-0">
                                <span className="text-xs text-gray-400 font-medium hidden sm:inline">
                                    Los envíos se procesarán en bloques de forma síncrona en segundo plano para proteger el servidor.
                                </span>
                                <div className="flex gap-3 w-full sm:w-auto">
                                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 sm:flex-none text-gray-500 hover:bg-gray-100 px-5 py-2.5 rounded-xl font-bold text-sm transition-colors">Cancelar</button>
                                    <button 
                                        type="button" 
                                        onClick={handleCreateCampaign}
                                        disabled={saving || formData.contacts.length === 0 || !formData.sender_id || !formData.subject} 
                                        className="flex-1 sm:flex-none bg-[#AC2425] hover:bg-[#8b1c1e] text-white px-8 py-2.5 rounded-xl font-bold text-sm shadow-premium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {saving ? <Activity className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Crear y Enviar</>}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`.ql-custom .ql-container { flex: 1; overflow-y: auto; font-family: 'Inter', sans-serif; font-size: 15px; } .ql-custom .ql-editor { min-height: 100%; }`}</style>
        </div>
    );
};

export default AdminMarketingCampaigns;
