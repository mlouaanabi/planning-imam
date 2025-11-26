import { useState, useEffect, useCallback } from 'react';
import { Week, Cell, QuickLabel } from '../lib/types';
import { toMinutes, toHHMM } from '../lib/utils';
import { supabase } from '../lib/supabase'; 
import { toast } from 'sonner'; 

const STORAGE_KEY = "imam_schedule_v3";
const PROFILES_KEY = "imam_profiles_list";

export type SavedProfile = { name: string; publicId: string; editId: string; };

export function usePlanning() {
  // AJOUT DE 'mawaqitSlug' dans la config
  const [config, setConfig] = useState({
    imamName: "Imam", isEte: true, start: "04:00", end: "22:30", interval: 30, weekIndex: 0, restDays: [0, 6], hijriOffset: 0, mawaqitSlug: ""
  });
  const [weeks, setWeeks] = useState<Week[]>([{ label: "Semaine A", data: {} }]);
  const [quickLabels, setQuickLabels] = useState<QuickLabel[]>([]);
  const [cloudIds, setCloudIds] = useState({ publicId: "", editId: "" });
  const [profiles, setProfiles] = useState<SavedProfile[]>([]);

  const times = useCallback(() => {
    const out: string[] = [];
    let t = toMinutes(config.start);
    const endMin = toMinutes(config.end);
    while (t <= endMin) { out.push(toHHMM(t)); t += config.interval; }
    return out;
  }, [config.start, config.end, config.interval]);

  const updateCell = (day: number, time: string, cell: Cell) => {
    setWeeks(prev => {
      const newWeeks = [...prev];
      const currentWeek = newWeeks[config.weekIndex] || newWeeks[0];
      const currentData = currentWeek.data;
      if (!currentData[day]) currentData[day] = {};
      currentData[day][time] = cell; 
      return newWeeks;
    });
  };

  const deleteCell = (day: number, time: string) => {
    setWeeks(prev => {
      const newWeeks = [...prev];
      const currentWeek = newWeeks[config.weekIndex] || newWeeks[0];
      if (currentWeek.data[day]) delete currentWeek.data[day][time];
      return newWeeks;
    });
  };

  const saveProfile = () => {
    if (!cloudIds.publicId) return toast.error("Sauvegardez d'abord sur le Cloud !");
    const newProfile: SavedProfile = { name: config.imamName, publicId: cloudIds.publicId, editId: cloudIds.editId };
    setProfiles(prev => {
        const newList = [...prev.filter(p => p.publicId !== newProfile.publicId), newProfile];
        localStorage.setItem(PROFILES_KEY, JSON.stringify(newList));
        return newList;
    });
    toast.success(`Profil "${config.imamName}" mémorisé !`);
  };

  const deleteProfile = (pid: string) => {
      setProfiles(prev => {
          const newList = prev.filter(p => p.publicId !== pid);
          localStorage.setItem(PROFILES_KEY, JSON.stringify(newList));
          return newList;
      });
  };

  const resetPlanning = () => {
      if(!confirm("Créer un nouveau planning vierge ?")) return;
      setWeeks([{ label: "Semaine A", data: {} }]);
      setConfig(prev => ({ ...prev, imamName: "Nouvel Imam", weekIndex: 0, restDays: [0, 6], hijriOffset: 0, mawaqitSlug: "" }));
      setCloudIds({ publicId: "", editId: "" });
      toast.info("Planning vierge créé");
  };

  const copyDataFromProfile = async (profile: SavedProfile) => {
      if (!confirm(`Écraser le planning actuel avec les horaires de ${profile.name} ?`)) return;
      const loading = toast.loading(`Copie depuis ${profile.name}...`);
      const { data, error } = await supabase.from("plans").select("content").eq("id", profile.publicId).single();
      if (error || !data) { toast.dismiss(loading); return toast.error("Impossible de lire les données source"); }
      try {
          const parsed = typeof data.content === "string" ? JSON.parse(data.content) : data.content;
          if (parsed.weeks) setWeeks(parsed.weeks);
          else if (parsed.data) setWeeks([{ label: "Semaine A", data: parsed.data }]);
          if (parsed.quickLabels) setQuickLabels(parsed.quickLabels);
          toast.dismiss(loading); toast.success(`Copié avec succès !`);
      } catch (e) { toast.dismiss(loading); toast.error("Erreur copie"); }
  };

  const saveToCloud = async () => {
    if (!supabase) return toast.error("Supabase non configuré");
    const payload = JSON.stringify({ weeks, settings: config, quickLabels });
    if (!cloudIds.publicId) {
       const { data, error } = await supabase.from("plans").insert({ content: payload }).select("id, edit_id").single();
       if (error) return toast.error(error.message);
       setCloudIds({ publicId: data.id, editId: data.edit_id });
       toast.success(`Planning créé !`);
       return;
    }
    if (!cloudIds.editId) return toast.error("Secret d'édition manquant");
    const { error } = await supabase.from("plans").update({ content: payload, updated_at: new Date().toISOString() }).eq("id", cloudIds.publicId).eq("edit_id", cloudIds.editId);
    if (error) toast.error(error.message); else toast.success("Planning mis à jour en ligne !");
  };

  const loadFromCloud = async (pid?: string, eid?: string) => {
    const targetP = pid || cloudIds.publicId;
    const targetE = eid || cloudIds.editId;
    if (!targetP) return toast.error("Aucun ID fourni");
    const loading = toast.loading("Chargement...");
    const { data, error } = await supabase.from("plans").select("content").eq("id", targetP).single();
    if (error || !data) { toast.dismiss(loading); return toast.error("Planning introuvable"); }
    try {
      const parsed = typeof data.content === "string" ? JSON.parse(data.content) : data.content;
      if (parsed.weeks) setWeeks(parsed.weeks);
      else if (parsed.data) setWeeks([{ label: "Semaine A", data: parsed.data }]);
      if (parsed.settings) setConfig(parsed.settings);
      else if (parsed.imamName) { setConfig(prev => ({ ...prev, imamName: parsed.imamName, isEte: parsed.isEte ?? prev.isEte, weekIndex: 0, hijriOffset: 0, mawaqitSlug: "" })); }
      if (parsed.quickLabels) setQuickLabels(parsed.quickLabels);
      setCloudIds({ publicId: targetP, editId: targetE || "" });
      toast.dismiss(loading); toast.success("Planning chargé !");
    } catch (e) { toast.dismiss(loading); toast.error("Erreur lecture"); }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlId = params.get('id');
    const urlEdit = params.get('edit'); 
    if (urlId) {
        loadFromCloud(urlId, urlEdit || undefined);
    } else {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) { try {
            const parsed = JSON.parse(raw);
            if (parsed.weeks) setWeeks(parsed.weeks);
            if (parsed.imamName) setConfig(prev => ({ ...prev, ...parsed }));
            if (parsed.publicId) setCloudIds({ publicId: parsed.publicId, editId: parsed.editId });
        } catch (e) {} }
    }
    const rawProfiles = localStorage.getItem(PROFILES_KEY);
    if (rawProfiles) try { setProfiles(JSON.parse(rawProfiles)); } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const payload = { ...config, weeks, quickLabels, ...cloudIds };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [config, weeks, quickLabels, cloudIds]);

  return {
    config, setConfig, weeks, setWeeks, setQuickLabels, setCloudIds,
    currentWeek: weeks[config.weekIndex] || weeks[0], times: times(),
    updateCell, deleteCell,
    saveToCloud, loadFromCloud, cloudIds,
    profiles, saveProfile, deleteProfile, resetPlanning, copyDataFromProfile
  };
}