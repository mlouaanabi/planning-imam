import { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { Settings, Cloud, Users, PlusCircle, Trash2, Check, ChevronDown, Copy, CalendarOff, Scissors, Clipboard, Upload, FileJson, Sun, Moon, Clock, Share2, Lock } from 'lucide-react';
import { usePlanning } from './hooks/usePlanning';
import { EventCell } from './components/EventCell';
import { EditModal } from './components/EditModal';
import { DAYS } from './lib/constants';
import { Cell } from './lib/types';

type ContextMenuState = { x: number; y: number; day: number; time: string; hasContent: boolean; } | null;

export default function App() {
  const { 
    config, setConfig, weeks, setWeeks, setQuickLabels, setCloudIds,
    currentWeek, times, updateCell, deleteCell,
    saveToCloud, loadFromCloud, cloudIds,
    profiles, saveProfile, deleteProfile, resetPlanning, copyDataFromProfile
  } = usePlanning();
  
  const [editingCell, setEditingCell] = useState<{day: number, time: string} | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // --- DATE DU JOUR & HÉGIRIEN ---
  const today = new Date();
  const dateFr = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(today);
  const dateHijri = new Intl.DateTimeFormat('fr-FR-u-ca-islamic', { day: 'numeric', month: 'long', year: 'numeric' }).format(today);
  const dateFrCap = dateFr.charAt(0).toUpperCase() + dateFr.slice(1);

  const isReadOnly = !cloudIds.editId;

  // CLIC DROIT
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  const [clipboard, setClipboard] = useState<{ cell: Cell, mode: 'copy' | 'cut' } | null>(null);
  useEffect(() => { const close = () => setContextMenu(null); window.addEventListener('click', close); return () => window.removeEventListener('click', close); }, []);
  const handleContextMenu = (e: React.MouseEvent, day: number, time: string, hasContent: boolean) => { if (isReadOnly) return; e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, day, time, hasContent }); };
  const handleCopy = () => { if (!contextMenu) return; const c = currentWeek.data[contextMenu.day]?.[contextMenu.time]; if(c){setClipboard({cell:c, mode:'copy'}); toast.info("Copié");} setContextMenu(null); };
  const handleCutImmediate = () => { if (!contextMenu) return; const c = currentWeek.data[contextMenu.day]?.[contextMenu.time]; if(c){setClipboard({cell:c, mode:'cut'}); deleteCell(contextMenu.day, contextMenu.time); toast.success("Coupé");} setContextMenu(null); };
  const handleDelete = () => { if (!contextMenu) return; deleteCell(contextMenu.day, contextMenu.time); toast.success("Effacé"); setContextMenu(null); };
  const handlePaste = () => { if (!contextMenu || !clipboard) return; updateCell(contextMenu.day, contextMenu.time, clipboard.cell); toast.success("Collé !"); setContextMenu(null); };

  const handleSwitchProfile = (p: { publicId: string, editId: string }) => { loadFromCloud(p.publicId, p.editId); setShowProfileMenu(false); };
  const toggleRestDay = (d: number) => { const c = config.restDays || [0, 6]; setConfig({ ...config, restDays: c.includes(d) ? c.filter(x=>x!==d) : [...c, d] }); };
  const isRestDay = (d: number) => (config.restDays || [0, 6]).includes(d);
  const applySeason = (s: 'ete'|'hiver') => { if(s==='ete') {setConfig({...config, start:"04:00", end:"23:30", isEte:true}); toast.success("Mode Été");} else {setConfig({...config, start:"06:00", end:"21:00", isEte:false}); toast.success("Mode Hiver");} };
  
  const shareLink = () => {
      if (!cloudIds.publicId) return toast.error("Sauvegardez d'abord le planning !");
      const url = `${window.location.origin}/?id=${cloudIds.publicId}`;
      navigator.clipboard.writeText(url).then(() => { toast.success("Lien copié !", { description: "Ce lien est en lecture seule." }); });
  };

  const exportJSON = () => { const p = { weeks, settings: config, cloudIds, version: "v3" }; const b = new Blob([JSON.stringify(p, null, 2)], {type:"application/json"}); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href=u; a.download=`planning_${config.imamName}.json`; document.body.appendChild(a); a.click(); document.body.removeChild(a); };
  const importJSON = () => { const i = document.createElement("input"); i.type="file"; i.accept="application/json"; i.onchange=async()=>{const f=i.files?.[0]; if(!f)return; try{const p=JSON.parse(await f.text()); if(p.weeks)setWeeks(p.weeks);else if(p.data)setWeeks([{label:"A",data:p.data}]); if(p.settings)setConfig(p.settings);else if(p.imamName)setConfig(pr=>({...pr, imamName:p.imamName})); if(p.cloudIds)setCloudIds(p.cloudIds); if(p.quickLabels)setQuickLabels(p.quickLabels); toast.success("Importé !");}catch{toast.error("Erreur fichier");}}; i.click(); };

  return (
    <div className="min-h-screen bg-stone-50 text-slate-800 font-sans">
      <Toaster position="top-right" richColors />
      {contextMenu && !isReadOnly && ( <div className="fixed z-50 bg-white rounded-lg shadow-xl border border-slate-100 py-1 w-40" style={{ top: contextMenu.y, left: contextMenu.x }}> {contextMenu.hasContent ? (<> <button onClick={handleCutImmediate} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex gap-2"><Scissors size={14}/> Couper</button> <button onClick={handleCopy} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex gap-2"><Copy size={14}/> Copier</button> <div className="h-px bg-slate-100 my-1"></div> <button onClick={handleDelete} className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 flex gap-2"><Trash2 size={14}/> Effacer</button> </>) : <div className="px-4 py-2 text-xs text-slate-400">Vide</div>} {clipboard && (<> <div className="h-px bg-slate-100 my-1"></div> <button onClick={handlePaste} className="w-full text-left px-4 py-2 text-sm hover:bg-emerald-50 text-emerald-700 flex gap-2"><Clipboard size={14}/> Coller</button> </>)} </div> )}

      <header className="bg-white/90 backdrop-blur-md border-b border-stone-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-2 md:px-4 h-20 md:h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
                {/* LOGO */}
                <div className="w-12 h-12 md:w-10 md:h-10 shrink-0">
                    <img src="/logo.png" alt="Centre Tariq Ibn Ziyad" className="w-full h-full object-contain" />
                </div>

                {/* TITRE & SELECTEUR */}
                <div className="relative">
                    <div className={`flex flex-col cursor-pointer hover:bg-slate-100 p-1 rounded-md transition-colors pr-2 ${isReadOnly ? 'cursor-default hover:bg-transparent' : ''}`} onClick={() => !isReadOnly && setShowProfileMenu(!showProfileMenu)}>
                        <h1 className="font-bold text-slate-900 text-sm md:text-base leading-none">Centre Tariq Ibn Ziyad</h1>
                        <p className="text-xs text-emerald-600 font-bold flex items-center gap-1 mt-0.5">{config.imamName} {!isReadOnly && <ChevronDown size={12}/>}</p>
                    </div>
                    {/* Menu Profils */}
                    {showProfileMenu && !isReadOnly && (<div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50"><div className="p-2 bg-slate-50 border-b text-xs font-bold text-slate-500 uppercase tracking-wider">Choisir un planning</div>{profiles.map((p,i)=>(<button key={i} onClick={()=>handleSwitchProfile(p)} className={`w-full text-left px-4 py-3 text-sm hover:bg-emerald-50 flex justify-between ${p.publicId===cloudIds.publicId?'bg-emerald-50/50 text-emerald-700 font-medium':''}`}><span>{p.name}</span>{p.publicId===cloudIds.publicId&&<Check size={14}/>}</button>))} <div className="border-t p-2"><button onClick={()=>{resetPlanning();setShowProfileMenu(false)}} className="flex items-center gap-2 w-full px-2 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"><PlusCircle size={14}/> Nouvel Imam</button></div></div>)}
                </div>
            </div>

            {/* DATE DU JOUR (Visible sur grands écrans, caché sur petit mobile pour gagner de la place) */}
            <div className="hidden lg:flex flex-col items-center">
                 <div className="text-sm font-bold text-slate-700">{dateFrCap}</div>
                 <div className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-3 py-0.5 rounded-full border border-emerald-100 mt-0.5">
                    🌙 {dateHijri}
                 </div>
            </div>
            
            <div className="flex items-center gap-2">
                <div className="hidden md:flex bg-stone-100 p-1 rounded-lg mr-2">{weeks.map((w,i)=>(<button key={i} onClick={()=>setConfig(p=>({...p, weekIndex:i}))} className={`px-3 py-1.5 text-xs font-medium rounded-md ${config.weekIndex===i?'bg-white shadow text-emerald-700':'text-slate-500 hover:text-slate-700'}`}>{w.label}</button>))}</div>
                
                {!isReadOnly ? (
                    <>
                        <button onClick={shareLink} className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-xs font-bold" title="Partager"><Share2 size={16} /> Partager</button>
                        <button onClick={() => saveToCloud()} className="p-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"><Cloud size={20} /></button>
                        <button onClick={() => setShowSettings(!showSettings)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"><Settings size={20} /></button>
                    </>
                ) : (
                    <div className="flex flex-col items-end">
                         {/* Date visible en mobile ici si besoin, ou juste le cadenas */}
                         <div className="flex items-center gap-1 px-3 py-1 bg-stone-100 rounded-full text-xs text-stone-500 font-medium border border-stone-200">
                            <Lock size={12} /> <span className="hidden sm:inline">Lecture seule</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
        
        {/* Date mobile (s'affiche sous le header sur petits écrans) */}
        <div className="lg:hidden w-full bg-stone-50 border-b border-stone-100 py-1 text-center flex items-center justify-center gap-2 text-xs text-slate-600">
            <span className="font-semibold">{dateFrCap}</span>
            <span className="text-emerald-600">•</span>
            <span>{dateHijri}</span>
        </div>
      </header>
      
      {showSettings && !isReadOnly && (
        <div className="max-w-7xl mx-auto p-4 bg-white border-b mb-4 animate-in slide-in-from-top-2 shadow-sm">
            <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-4">
                    <div><h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 mb-2"><Settings size={16} /> Configuration</h3><label className="block"><span className="text-xs font-bold text-slate-500">Nom de l'Imam</span><input className="w-full mt-1 border rounded-lg p-2 text-sm" value={config.imamName} onChange={e => setConfig({...config, imamName: e.target.value})} /></label></div>
                    <div className="pt-2 border-t mt-2"><p className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1"><Clock size={12}/> Plage Horaire</p><div className="flex gap-2 mb-3"><button onClick={()=>applySeason('hiver')} className={`flex-1 flex flex-col items-center justify-center p-2 rounded border text-xs ${!config.isEte?'bg-blue-50 border-blue-200 text-blue-700':'bg-white hover:bg-slate-50'}`}><div className="flex items-center gap-1 font-bold"><Moon size={12}/> Hiver</div><span className="text-[10px] opacity-75">06:00 - 21:00</span></button><button onClick={()=>applySeason('ete')} className={`flex-1 flex flex-col items-center justify-center p-2 rounded border text-xs ${config.isEte?'bg-orange-50 border-orange-200 text-orange-700':'bg-white hover:bg-slate-50'}`}><div className="flex items-center gap-1 font-bold"><Sun size={12}/> Été</div><span className="text-[10px] opacity-75">04:00 - 23:30</span></button></div><div className="grid grid-cols-2 gap-2"><label className="block"><span className="text-[10px] font-bold text-slate-400">Début</span><input type="time" className="w-full mt-1 border rounded p-1 text-xs" value={config.start} onChange={e=>setConfig({...config, start:e.target.value})} /></label><label className="block"><span className="text-[10px] font-bold text-slate-400">Fin</span><input type="time" className="w-full mt-1 border rounded p-1 text-xs" value={config.end} onChange={e=>setConfig({...config, end:e.target.value})} /></label></div></div>
                    <div className="pt-2 border-t mt-2"><p className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1"><CalendarOff size={12}/> Jours de repos</p><div className="flex flex-wrap gap-1">{DAYS.map((d, i) => (<button key={d} onClick={() => toggleRestDay(i)} className={`px-2 py-1 text-[10px] rounded border transition-colors ${isRestDay(i) ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>{d.slice(0,3)}.</button>))}</div></div>
                </div>
                <div className="space-y-3 md:col-span-2 border-l pl-0 md:pl-6 border-slate-100">
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2"><Cloud size={16} className="text-emerald-600"/> Cloud & Profils</h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <div className="flex gap-2"><button onClick={saveToCloud} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"><Cloud size={14} /> Sauvegarder</button><button onClick={saveProfile} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 bg-white border hover:bg-slate-50 rounded-lg shadow-sm"><Users size={14} /> Mémoriser profil</button></div>
                            <div className="bg-slate-50 p-2 rounded border mt-2"><p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Connexion Technique</p><div className="grid grid-cols-2 gap-2"><input className="w-full border rounded p-1 text-[10px] font-mono" placeholder="ID Public" value={cloudIds.publicId} onChange={e => setCloudIds({...cloudIds, publicId: e.target.value})} /><input className="w-full border rounded p-1 text-[10px] font-mono" placeholder="Secret Edit" value={cloudIds.editId} onChange={e => setCloudIds({...cloudIds, editId: e.target.value})} /></div><button onClick={() => loadFromCloud()} className="mt-1 w-full text-center text-[10px] text-blue-600 hover:underline">Charger manuellement cet ID</button></div>
                            <button onClick={shareLink} className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-bold shadow-sm"><Share2 size={16} /> Copier le lien pour les membres</button>
                        </div>
                        <div className="space-y-3">
                             <div className="bg-slate-50 p-3 rounded-lg border text-xs space-y-2 max-h-40 overflow-y-auto"><p className="font-bold text-slate-700">Profils enregistrés :</p>{profiles.length === 0 && <p className="text-slate-400 italic">Aucun.</p>}<ul className="space-y-1">{profiles.map(p => (<li key={p.publicId} className="flex justify-between items-center bg-white p-1.5 rounded border"><span className="truncate max-w-[120px]" title={p.name}>{p.name}</span><button onClick={() => deleteProfile(p.publicId)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={12}/></button></li>))}</ul></div>
                             <div className="pt-2 border-t mt-2"><p className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1"><Copy size={12}/> Copier depuis...</p><div className="space-y-1">{profiles.filter(p => p.publicId !== cloudIds.publicId).map(p => (<button key={p.publicId} onClick={() => copyDataFromProfile(p)} className="w-full text-left px-2 py-1.5 text-xs bg-stone-50 hover:bg-emerald-50 rounded border flex items-center gap-2"><Copy size={12} className="text-slate-400"/><span className="truncate">Horaires de {p.name}</span></button>))}</div><div className="mt-2 flex gap-2"><button onClick={importJSON} className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs bg-stone-100 rounded border"><Upload size={10}/> Import</button><button onClick={exportJSON} className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs bg-stone-100 rounded border"><FileJson size={10}/> Export</button></div></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
      <main className="max-w-7xl mx-auto p-2 md:p-6 overflow-x-auto"><div className="min-w-[800px] grid grid-cols-[60px_repeat(7,1fr)] gap-2 pb-20"><div className="pt-12 space-y-2">{times.map(t => (<div key={t} className="h-14 flex items-center justify-end pr-3 text-xs text-slate-400 font-medium">{t}</div>))}</div>{DAYS.map((d, i) => (<div key={d} className="space-y-2"><div className={`text-center py-3 rounded-xl text-sm font-bold mb-2 ${isRestDay(i) ? 'bg-slate-800 text-white' : 'bg-white border-b-2 border-emerald-100 shadow-sm text-slate-700'}`}>{d}</div>{isRestDay(i) ? (<div className="h-full rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center opacity-50"><span className="text-slate-400 font-bold tracking-widest text-xs uppercase" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>Repos</span></div>) : (times.map(t => (<EventCell key={`${i}-${t}`} time={t} cell={currentWeek.data[i]?.[t]} isPrayerAuto={true} onClick={() => !isReadOnly && setEditingCell({ day: i, time: t })} onContextMenu={(e) => handleContextMenu(e, i, t, !!currentWeek.data[i]?.[t])} />)))}</div>))}</div></main>
      <EditModal isOpen={!!editingCell} data={editingCell ? currentWeek.data[editingCell.day]?.[editingCell.time] : undefined} onClose={() => setEditingCell(null)} onSave={(cell) => { if (editingCell) { updateCell(editingCell.day, editingCell.time, cell); setEditingCell(null); }}} />
    </div>
  );
}