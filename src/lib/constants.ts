export const PRAYER_WORDS = ["fajr","dhuhr","dohr","zuhr","asr","maghrib","maghreb","isha","‘isha","icha","jumu","joumoua"];
export const DAYS = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];
export const REST_DAYS = new Set([0, 6]); // 0=Lundi, 6=Dimanche (selon ta config originale)

export const THEME_COLORS: Record<string, string> = {
  red: "bg-rose-50 border-rose-200 text-rose-700 hover:border-rose-400",
  blue: "bg-sky-50 border-sky-200 text-sky-700 hover:border-sky-400",
  green: "bg-emerald-50 border-emerald-200 text-emerald-700 hover:border-emerald-400",
  yellow: "bg-amber-50 border-amber-200 text-amber-700 hover:border-amber-400",
  purple: "bg-violet-50 border-violet-200 text-violet-700 hover:border-violet-400",
  gray: "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-400",
  orange: "bg-orange-50 border-orange-200 text-orange-700 hover:border-orange-400",
};