export type Cell = { text: string; color?: string };
export type DayData = { [time: string]: Cell };
export type Week = {
  label: string;
  startDateISO?: string;
  data: { [dayIndex: number]: DayData };
};
export type QuickLabel = {
  id: string;
  title: string;
  durationMin: number;
  color: string;
  template?: string;
};