import { motion } from 'framer-motion';
import { Cell } from '../lib/types';
import { THEME_COLORS, PRAYER_WORDS } from '../lib/constants';

interface Props {
  time: string;
  cell?: Cell;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void; // Ajout du clic droit
  isPrayerAuto: boolean;
}

export const EventCell = ({ time, cell, onClick, onContextMenu, isPrayerAuto }: Props) => {
  const isPrayer = cell?.text && PRAYER_WORDS.some(w => cell.text.toLowerCase().includes(w));
  const colorKey = (isPrayer && isPrayerAuto) ? 'red' : (cell?.color || 'gray');
  const themeClass = cell?.text ? THEME_COLORS[colorKey] : "bg-white border-slate-100 text-slate-300";

  return (
    <motion.div
      whileHover={{ scale: 0.98 }}
      onClick={onClick}
      onContextMenu={onContextMenu} // Déclencheur du menu
      className={`
        relative p-2 h-14 rounded-lg border text-xs cursor-pointer transition-all shadow-sm
        flex flex-col justify-center overflow-hidden select-none
        ${themeClass} ${!cell?.text && 'hover:bg-slate-50 hover:border-slate-300'}
      `}
    >
      {!cell?.text && <span className="opacity-0 hover:opacity-100 text-[10px] text-center">+</span>}
      {cell?.text && (
        <>
          <span className="font-semibold line-clamp-2 leading-tight whitespace-pre-wrap">{cell.text}</span>
          {isPrayer && <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-current opacity-50" />}
        </>
      )}
    </motion.div>
  );
};