import { useState, useEffect } from "react";
import { Cell } from "../lib/types";
import { THEME_COLORS } from "../lib/constants";

interface Props {
  isOpen: boolean;
  data?: Cell;
  onClose: () => void;
  onSave: (cell: Cell | null) => void;
}

export const EditModal = ({ isOpen, data, onClose, onSave }: Props) => {
  const [text, setText] = useState("");
  const [color, setColor] = useState("gray");

  useEffect(() => {
    if (isOpen) {
      setText(data?.text || "");
      setColor(data?.color || "gray");
    }
  }, [isOpen, data]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!text.trim()) onSave(null); // Supprime si vide
    else onSave({ text, color });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b">
          <h3 className="font-bold text-lg">Modifier le créneau</h3>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Activité</label>
            <textarea 
              autoFocus
              className="w-full p-3 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none h-32"
              placeholder="Ex: Prière, Cours..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Couleur</label>
            <div className="flex flex-wrap gap-2">
              {Object.keys(THEME_COLORS).map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 ${color === c ? 'border-black scale-110' : 'border-transparent'} shadow-sm`}
                  style={{ backgroundColor: c === 'white' ? '#fff' : `var(--color-${c}-100, ${c})` }} // Simplification visuelle
                >
                  <div className={`w-full h-full rounded-full opacity-50 ${c === 'gray' ? 'bg-slate-200' : `bg-${c}-200`}`}></div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg">Annuler</button>
          <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm">Enregistrer</button>
        </div>
      </div>
    </div>
  );
};