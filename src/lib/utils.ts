export const uuid = () => (crypto as any)?.randomUUID ? (crypto as any).randomUUID() : Math.random().toString(36).slice(2);

export const toMinutes = (hhmm: string) => { 
  const [h, m] = hhmm.split(":").map(Number); 
  return h * 60 + m; 
};

export const toHHMM = (minutes: number) => { 
  const h = Math.floor(minutes / 60); 
  const m = minutes % 60; 
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`; 
};