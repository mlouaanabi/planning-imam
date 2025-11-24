import { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { Settings, Cloud, Users, PlusCircle, Trash2, Check, ChevronDown, Copy, CalendarOff, Scissors, Clipboard, Upload, FileJson, Sun, Moon, Clock } from 'lucide-react';
import { usePlanning } from './hooks/usePlanning';
import { EventCell } from './components/EventCell';
import { EditModal } from './components/EditModal';
import { DAYS } from './lib/constants';
import { Cell } from './lib/types';

// État pour le menu clic-droit
type ContextMenuState = {
    x: number;
    y: number;
    day: number;
    time: string;
    hasContent: boolean;
} | null;

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

  // --- GESTION CLIC DROIT ---
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  const [clipboard, setClipboard] = useState<{ cell: Cell, mode: 'copy' | 'cut' } | null>(null);

  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, day: number, time: string, hasContent: boolean) => {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, day, time, hasContent });
  };

  const handleCopy = () => {
      if (!contextMenu) return;
      const cell = currentWeek.data[contextMenu.day]?.[contextMenu.time];
      if (cell) { setClipboard({ cell, mode: 'copy' }); toast.info("Copié"); }
      setContextMenu(null);
  };

  const handleCutImmediate = () => {
       if (!contextMenu) return;
       const cell = currentWeek.data[contextMenu.day]?.[contextMenu.time];
       if (cell) {
           setClipboard({ cell, mode: 'cut' });
           deleteCell(contextMenu.day, contextMenu.time);
           toast.success("Coupé");
       }
       setContextMenu(null);
  };

  const handleDelete = () => {
      if (!contextMenu) return;
      deleteCell(contextMenu.day, contextMenu.time);
      toast.success("Effacé");
      setContextMenu(null);
  };

  const handlePaste = () => {
      if (!contextMenu || !clipboard) return;
      updateCell(contextMenu.day, contextMenu.time, clipboard.cell);
      toast.success("Collé !");
      setContextMenu(null);
  };

  const handleSwitchProfile = (p: { publicId: string, editId: string }) => {
      loadFromCloud(p.publicId, p.editId);
      setShowProfileMenu(false);
  };

  const toggleRestDay = (dayIndex: number) => {
      const current = config.restDays || [0, 6];
      let newRestDays;
      if (current.includes(dayIndex)) { newRestDays = current.filter(d => d !== dayIndex); } 
      else { newRestDays = [...current, dayIndex]; }
      setConfig({ ...config, restDays: newRestDays });
  };
  const isRestDay = (dayIndex: number) => (config.restDays || [0, 6]).includes(dayIndex);

  // --- SAISONS ---
  const applySeason = (season: 'ete' | 'hiver') => {
      if (season === 'ete') {
          setConfig({ ...config, start: "04:00", end: "23:30", isEte: true });
          toast.success("Mode Été activé (04:00 - 23:30)");
      } else {
          setConfig({ ...config, start: "06:00", end: "21:00", isEte: false });
          toast.success("Mode Hiver activé (06:00 - 21:00)");
      }
  };

  const exportJSON = () => {
    const payload = { weeks, settings: config, cloudIds, version: "v3-modern" };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = `planning_${config.imamName.replace(/\s+/g, "_")}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    toast.success("Fichier téléchargé !");
  };
  const importJSON = () => {
    const input = document.createElement("input"); input.type = "file"; input.accept = "application/json";
    input.onchange = async () => {
      const file = input.files?.[0]; if (!file) return;
      const text = await file.text();
      try {
        const parsed = JSON.parse(text);
        if (parsed.weeks) setWeeks(parsed.weeks); else if (parsed.data) setWeeks([{ label: "Semaine A", data: parsed.data }]);
        if (parsed.settings) setConfig(parsed.settings);
        else if (parsed.imamName) { setConfig(prev => ({ ...prev, imamName: parsed.imamName, isEte: parsed.isEte ?? prev.isEte })); }
        if (parsed.cloudIds) setCloudIds(parsed.cloudIds); if (parsed.quickLabels) setQuickLabels(parsed.quickLabels);
        toast.success("Importé !");
      } catch (e) { toast.error("Erreur fichier"); }
    }; input.click();
  };

  return (
    <div className="min-h-screen bg-stone-50 text-slate-800 font-sans">
      <Toaster position="top-right" richColors />
      
      {/* MENU CLIC DROIT */}
      {contextMenu && (
        <div className="fixed z-50 bg-white rounded-lg shadow-xl border border-slate-100 py-1 w-40 animate-in fade-in zoom-in-95 duration-100" style={{ top: contextMenu.y, left: contextMenu.x }}>
            {contextMenu.hasContent ? (
                <>
                    <button onClick={handleCutImmediate} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 text-slate-700"><Scissors size={14} /> Couper</button>
                    <button onClick={handleCopy} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 text-slate-700"><Copy size={14} /> Copier</button>
                    <div className="h-px bg-slate-100 my-1"></div>
                    <button onClick={handleDelete} className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 flex items-center gap-2 text-red-600"><Trash2 size={14} /> Effacer</button>
                </>
            ) : (<div className="px-4 py-2 text-xs text-slate-400 italic">Case vide</div>)}
            {clipboard && (
                <>
                    <div className="h-px bg-slate-100 my-1"></div>
                    <button onClick={handlePaste} className="w-full text-left px-4 py-2 text-sm hover:bg-emerald-50 flex items-center gap-2 text-emerald-700 font-medium"><Clipboard size={14} /> Coller</button>
                </>
            )}
        </div>
      )}

      {/* HEADER */}
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-200 shrink-0">CT</div>
                <div className="relative">
                    <div className="flex items-center gap-1 cursor-pointer hover:bg-slate-100 p-1 rounded-md transition-colors pr-2" onClick={() => setShowProfileMenu(!showProfileMenu)}>
                        <div className="leading-tight">
                            <h1 className="font-bold text-slate-900 text-sm sm:text-base hidden sm:block">Centre Tariq Ibn Ziyad</h1>
                            <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">{config.imamName} <ChevronDown size={12}/></p>
                        </div>
                    </div>
                    {showProfileMenu && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50">
                            <div className="p-2 bg-slate-50 border-b text-xs font-bold text-slate-500 uppercase tracking-wider">Choisir un planning</div>
                            {profiles.map((p, idx) => (
                                <button key={idx} onClick={() => handleSwitchProfile(p)} className={`w-full text-left px-4 py-3 text-sm hover:bg-emerald-50 flex items-center justify-between group ${p.publicId === cloudIds.publicId ? 'bg-emerald-50/50 text-emerald-700 font-medium' : ''}`}>
                                    <span>{p.name}</span> {p.publicId === cloudIds.publicId && <Check size={14} className="text-emerald-600"/>}
                                </button>
                            ))}
                            <div className="border-t p-2">
                                <button onClick={() => { resetPlanning(); setShowProfileMenu(false); }} className="flex items-center gap-2 w-full px-2 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"><PlusCircle size={14} /> Nouvel Imam</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-2">
                <div className="hidden md:flex bg-stone-100 p-1 rounded-lg mr-2">
                    {weeks.map((w, i) => (
                        <button key={i} onClick={() => setConfig(prev => ({ ...prev, weekIndex: i }))} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${config.weekIndex === i ? 'bg-white shadow text-emerald-700' : 'text-slate-500 hover:text-slate-700'}`}>{w.label}</button>
                    ))}
                </div>
                <button onClick={() => saveToCloud()} className="p-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"><Cloud size={20} /></button>
                <button onClick={() => setShowSettings(!showSettings)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"><Settings size={20} /></button>
            </div>
        </div>
      </header>
      
      {/* SETTINGS PANEL */}
      {showSettings && (
        <div className="max-w-7xl mx-auto p-4 bg-white border-b mb-4 animate-in slide-in-from-top-2 shadow-sm">
            <div className="grid md:grid-cols-3 gap-6">
                
                {/* COLONNE 1 : CONFIGURATION */}
                <div className="space-y-4">
                    <div>
                        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 mb-2"><Settings size={16} /> Configuration</h3>
                        <label className="block"><span className="text-xs font-bold text-slate-500">Nom de l'Imam</span><input className="w-full mt-1 border rounded-lg p-2 text-sm" value={config.imamName} onChange={e => setConfig({...config, imamName: e.target.value})} /></label>
                    </div>

                    {/* --- NOUVEAU : PLAGE HORAIRE & SAISONS --- */}
                    <div className="pt-2 border-t mt-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1"><Clock size={12}/> Plage Horaire</p>
                        
                        {/* Boutons Saisons */}
                        <div className="flex gap-2 mb-3">
                            <button onClick={() => applySeason('hiver')} className={`flex-1 flex flex-col items-center justify-center p-2 rounded border text-xs transition-colors ${!config.isEte ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white hover:bg-slate-50'}`}>
                                <div className="flex items-center gap-1 font-bold"><Moon size={12}/> Hiver</div>
                                <span className="text-[10px] opacity-75">06:00 - 21:00</span>
                            </button>
                            <button onClick={() => applySeason('ete')} className={`flex-1 flex flex-col items-center justify-center p-2 rounded border text-xs transition-colors ${config.isEte ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-white hover:bg-slate-50'}`}>
                                <div className="flex items-center gap-1 font-bold"><Sun size={12}/> Été</div>
                                <span className="text-[10px] opacity-75">04:00 - 23:30</span>
                            </button>
                        </div>

                        {/* Réglage Manuel */}
                        <div className="grid grid-cols-2 gap-2">
                            <label className="block">
                                <span className="text-[10px] font-bold text-slate-400">Début</span>
                                <input type="time" className="w-full mt-1 border rounded p-1 text-xs" value={config.start} onChange={e => setConfig({...config, start: e.target.value})} />
                            </label>
                            <label className="block">
                                <span className="text-[10px] font-bold text-slate-400">Fin</span>
                                <input type="time" className="w-full mt-1 border rounded p-1 text-xs" value={config.end} onChange={e => setConfig({...config, end: e.target.value})} />
                            </label>
                        </div>
                    </div>

                    {/* Jours de Repos */}
                    <div className="pt-2 border-t mt-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1"><CalendarOff size={12}/> Jours de repos</p>
                        <div className="flex flex-wrap gap-1">{DAYS.map((d, i) => (<button key={d} onClick={() => toggleRestDay(i)} className={`px-2 py-1 text-[10px] rounded border transition-colors ${isRestDay(i) ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>{d.slice(0,3)}.</button>))}</div>
                    </div>
                </div>

                {/* COLONNE 2 & 3 : CLOUD & OUTILS */}
                <div className="space-y-3 md:col-span-2 border-l pl-0 md:pl-6 border-slate-100">
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2"><Cloud size={16} className="text-emerald-600"/> Cloud & Profils</h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <div className="flex gap-2"><button onClick={saveToCloud} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"><Cloud size={14} /> Sauvegarder</button><button onClick={saveProfile} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 bg-white border hover:bg-slate-50 rounded-lg shadow-sm"><Users size={14} /> Mémoriser profil</button></div>
                            <div className="bg-slate-50 p-2 rounded border mt-2"><p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Connexion Technique</p><div className="grid grid-cols-2 gap-2"><input className="w-full border rounded p-1 text-[10px] font-mono" placeholder="ID Public" value={cloudIds.publicId} onChange={e => setCloudIds({...cloudIds, publicId: e.target.value})} /><input className="w-full border rounded p-1 text-[10px] font-mono" placeholder="Secret Edit" value={cloudIds.editId} onChange={e => setCloudIds({...cloudIds, editId: e.target.value})} /></div><button onClick={() => loadFromCloud()} className="mt-1 w-full text-center text-[10px] text-blue-600 hover:underline">Charger manuellement cet ID</button></div>
                        </div>
                        <div className="space-y-3">
                             <div className="bg-slate-50 p-3 rounded-lg border text-xs space-y-2 max-h-40 overflow-y-auto"><p className="font-bold text-slate-700">Profils enregistrés :</p>{profiles.length === 0 && <p className="text-slate-400 italic">Aucun.</p>}<ul className="space-y-1">{profiles.map(p => (<li key={p.publicId} className="flex justify-between items-center bg-white p-1.5 rounded border"><span className="truncate max-w-[120px]" title={p.name}>{p.name}</span><button onClick={() => deleteProfile(p.publicId)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={12}/></button></li>))}</ul></div>
                             
                             <div className="pt-2 border-t mt-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1"><Copy size={12}/> Copier depuis...</p>
                                <div className="space-y-1">{profiles.filter(p => p.publicId !== cloudIds.publicId).map(p => (<button key={p.publicId} onClick={() => copyDataFromProfile(p)} className="w-full text-left px-2 py-1.5 text-xs bg-stone-50 hover:bg-emerald-50 rounded border flex items-center gap-2"><Copy size={12} className="text-slate-400"/><span className="truncate">Horaires de {p.name}</span></button>))}</div>
                                <div className="mt-2 flex gap-2"><button onClick={importJSON} className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs bg-stone-100 rounded border"><Upload size={10}/> Import</button><button onClick={exportJSON} className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs bg-stone-100 rounded border"><FileJson size={10}/> Export</button></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* GRILLE */}
      <main className="max-w-7xl mx-auto p-2 md:p-6 overflow-x-auto">
        <div className="min-w-[800px] grid grid-cols-[60px_repeat(7,1fr)] gap-2 pb-20">
          <div className="pt-12 space-y-2">
            {times.map(t => (<div key={t} className="h-14 flex items-center justify-end pr-3 text-xs text-slate-400 font-medium">{t}</div>))}
          </div>
          {DAYS.map((dayName, dayIndex) => {
            const isRest = isRestDay(dayIndex);
            return (
              <div key={dayName} className="space-y-2">
                <div className={`text-center py-3 rounded-xl text-sm font-bold mb-2 ${isRest ? 'bg-slate-800 text-white' : 'bg-white border-b-2 border-emerald-100 shadow-sm text-slate-700'}`}>{dayName}</div>
                {isRest ? (
                  <div className="h-full rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center opacity-50"><span className="text-slate-400 font-bold tracking-widest text-xs uppercase" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>Repos</span></div>
                ) : (
                  times.map(time => (
                    <EventCell
                      key={`${dayIndex}-${time}`}
                      time={time}
                      cell={currentWeek.data[dayIndex]?.[time]}
                      isPrayerAuto={true}
                      onClick={() => setEditingCell({ day: dayIndex, time })}
                      onContextMenu={(e) => handleContextMenu(e, dayIndex, time, !!currentWeek.data[dayIndex]?.[time])}
                    />
                  ))
                )}
              </div>
            );
          })}
        </div>
      </main>

      <EditModal isOpen={!!editingCell} data={editingCell ? currentWeek.data[editingCell.day]?.[editingCell.time] : undefined} onClose={() => setEditingCell(null)} onSave={(cell) => { if (editingCell) { updateCell(editingCell.day, editingCell.time, cell); setEditingCell(null); }}} />
    </div>
  );
}