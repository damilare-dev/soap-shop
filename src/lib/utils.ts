export const uid = () => Math.random().toString(36).slice(2, 9);
export const today = () => new Date().toISOString().split("T")[0];
export const nowTime = () => new Date().toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" });
export const fmt = (n: number | string | null | undefined) => `₦${Number(n || 0).toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const fmtD = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" });
