import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { API } from "@/config/api";
import { io, Socket } from "socket.io-client";
import { RefreshCcw } from "lucide-react";

interface ActiveSessionItem {
  userId: string;
  fullname: string;
  userType: 'student' | 'admin';
  loginTime: number; // unix seconds
}

interface HourGroup {
  hourKey: number; // 0-23
  label: string;
  items: ActiveSessionItem[];
}
interface DateGroup {
  dateKey: string; // MM-DD-YYYY
  hours: HourGroup[];
}

const API_BASE = API.BACKEND.BASE;

function toAmPm(date: Date) {
  const h = date.getHours();
  const m = date.getMinutes();
  const s = date.getSeconds();
  const am = h < 12;
  const hr = ((h + 11) % 12) + 1;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(hr)}:${pad(m)}:${pad(s)} ${am ? 'A.M.' : 'P.M.'}`;
}

function formatRowTimestamp(tsSec: number) {
  const d = new Date(tsSec * 1000);
  const date = `${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}-${d.getFullYear()}`;
  return { time: toAmPm(d), date } as const;
}

function hourRangeLabel(d: Date) {
  const startH24 = d.getHours();
  const endH24 = (startH24 + 1) % 24;
  const to12 = (h: number) => ((h + 11) % 12) + 1;
  const fmt = (h24: number) => `${to12(h24)}:00 ${h24 < 12 ? 'A.M.' : 'P.M.'}`;
  return `ALL TIME ${fmt(startH24)} TO ${fmt(endH24)}`;
}

// Heuristic: format "Firstname Middlename Surname [Suffix]" -> "Surname [Suffix], Firstname Middlename"
function formatFullNameSurnameFirst(fullname: string): string {
  if (!fullname) return '';
  const hasComma = fullname.includes(',');
  if (hasComma) return fullname; // already formatted
  const parts = fullname.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return fullname;
  const prefixes = new Set([
    'De','Del','Dela','Deo','Di','Da','Van','Von','San','Santa','Santo','Sto.','La','Le','Mac','Mc'
  ]);
  let lastParts: string[];
  if (parts.length >= 3 && prefixes.has(parts[parts.length - 2])) {
    lastParts = parts.slice(-2);
  } else {
    lastParts = parts.slice(-1);
  }
  const firstParts = parts.slice(0, parts.length - lastParts.length);
  return `${lastParts.join(' ')}, ${firstParts.join(' ')}`.trim();
}

export function ActiveSessionsPanel() {
  const [sessions, setSessions] = useState<ActiveSessionItem[]>([]);
  const [search, setSearch] = useState("");
  const [recent, setRecent] = useState<Record<string, { item: ActiveSessionItem; until: number }>>({});
  const [loggingOutId, setLoggingOutId] = useState<string | null>(null);
  const [info, setInfo] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showRecent, setShowRecent] = useState(true);
  const [visibleByHour, setVisibleByHour] = useState<Record<string, number>>({});
  const socketRef = useRef<Socket | null>(null);

  async function load(q?: string) {
    try {
      setLoading(true);
      const url = new URL(`${API_BASE}/api/library/active-sessions`);
      if (q) url.searchParams.set('q', q);
      const res = await fetch(url.toString());
      if (!res.ok) return;
      const data = await res.json();
      const items: ActiveSessionItem[] = (data.items || []).map((r: any) => ({
        userId: r.userId,
        fullname: r.fullname,
        userType: (r.userType || 'student').toLowerCase(),
        loginTime: typeof r.loginTime === 'number' ? r.loginTime : Math.floor(Date.parse(r.loginTime)/1000),
      }));
      setSessions(items);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const s = io(API_BASE, { transports: ['websocket','polling'], withCredentials: true, reconnection: true, reconnectionAttempts: 10, reconnectionDelay: 500 });
    socketRef.current = s;
    s.on('session_update', (payload: any) => {
      if (payload?.type === 'logout' && payload?.userId) {
        const now = Math.floor(Date.now()/1000);
        setRecent(prev => ({
          ...prev,
          [payload.userId]: {
            item: prev[payload.userId]?.item || { userId: payload.userId, fullname: payload.fullname || payload.userId, userType: (payload.userType || 'student').toLowerCase(), loginTime: now },
            until: now + 60,
          }
        }));
        setTimeout(() => {
          setRecent(prev => {
            const cp = { ...prev };
            delete cp[payload.userId];
            return cp;
          });
        }, 60*1000);
      }
      load(search);
    });
    s.on('session_cleanup', () => load(search));
    // Polling fallback every 5s to guarantee freshness
    const poll = setInterval(() => load(search), 5000);
    return () => { s.close(); clearInterval(poll); };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = q
      ? sessions.filter(x => x.userId.toLowerCase().includes(q) || x.fullname.toLowerCase().includes(q) || x.userType.includes(q))
      : sessions;
    // include recent logged-out items (optional)
    const now = Math.floor(Date.now()/1000);
    const recents = showRecent
      ? Object.values(recent).filter(r => r.until > now).map(r => r.item)
      : [];
    return [...base, ...recents];
  }, [search, sessions, recent, showRecent]);

  const groups: DateGroup[] = useMemo(() => {
    // First group by date MM-DD-YYYY
    const byDate = new Map<string, ActiveSessionItem[]>();
    for (const it of filtered) {
      const d = new Date(it.loginTime * 1000);
      const dateKey = `${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}-${d.getFullYear()}`;
      const arr = byDate.get(dateKey) || [];
      arr.push(it);
      byDate.set(dateKey, arr);
    }
    // Sort dates desc by actual date value
    const dateEntries = Array.from(byDate.entries()).sort((a,b)=>{
      const [am, ad, ay] = a[0].split('-').map(Number);
      const [bm, bd, by] = b[0].split('-').map(Number);
      const adt = new Date(ay, am-1, ad).getTime();
      const bdt = new Date(by, bm-1, bd).getTime();
      return bdt - adt;
    });
    const out: DateGroup[] = [];
    for (const [dateKey, items] of dateEntries) {
      // Group within date by hour buckets (0-23)
      const byHour = new Map<number, ActiveSessionItem[]>();
      for (const it of items) {
        const d = new Date(it.loginTime * 1000);
        const h = d.getHours();
        const arr = byHour.get(h) || [];
        arr.push(it);
        byHour.set(h, arr);
      }
      // Sort hour groups ascending (e.g., 4 PM (16) then 5 PM (17))
      const hourEntries = Array.from(byHour.entries()).sort((a,b)=> a[0] - b[0]);
      const hours: HourGroup[] = hourEntries.map(([h, arr]) => {
        // Sort items by time ascending within the hour
        const sorted = arr.slice().sort((a,b)=> a.loginTime - b.loginTime);
        const sample = new Date(sorted[0].loginTime * 1000);
        return { hourKey: h, label: hourRangeLabel(sample), items: sorted };
      });
      out.push({ dateKey, hours });
    }
    return out;
  }, [filtered]);

  async function forceLogout(userId: string) {
    try {
      setLoggingOutId(userId);
      setInfo("");
      const res = await fetch(`${API_BASE}/api/library/force-logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (!res.ok) {
        // Fallback to standard logout endpoint
        const res2 = await fetch(`${API_BASE}/api/library/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        });
        if (!res2.ok) {
          const t = await res2.text().catch(() => "");
          throw new Error(t || `Logout failed (${res2.status})`);
        }
      }
      // Optimistic UI: mark as recently logged out so button hides
      const now = Math.floor(Date.now()/1000);
      setRecent(prev => ({
        ...prev,
        [userId]: {
          item: prev[userId]?.item || { userId, fullname: userId, userType: 'student', loginTime: now },
          until: now + 60
        }
      }));
      setInfo(`User ${userId} logged out.`);
      await load(search);
    } catch (e: any) {
      setInfo(e?.message || 'Logout failed');
      // Optionally alert for visibility
      try { alert(`Logout error: ${e?.message || ''}`); } catch {}
    } finally {
      setLoggingOutId(null);
    }
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex items-center justify-between gap-3">
        <CardTitle>Active Sessions</CardTitle>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input type="checkbox" checked={showRecent} onChange={e=>setShowRecent(e.target.checked)} />
            Show recently ended (60s)
          </label>
          <Button variant="outline" size="sm" onClick={()=> load(search)} title="Refresh">
            <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-3 space-y-2">
          <Input placeholder="Search by ID, name, or user type" value={search} onChange={e=>setSearch(e.target.value)} />
          {info && <div className="text-xs text-muted-foreground">{info}</div>}
        </div>
        <div className="space-y-6 max-h-[70vh] overflow-auto pr-2">
          {groups.map(dateGroup => (
            <div key={dateGroup.dateKey} className="space-y-3">
              {/* Date header */}
              <div className="text-sm font-bold text-gray-800">{`Date: ${dateGroup.dateKey}`}</div>
              {dateGroup.hours.map(hour => (
                <div key={`${dateGroup.dateKey}-${hour.hourKey}`} className="space-y-2">
                  {/* Hour range header */}
                  <div className="text-xs font-semibold text-gray-600">{hour.label}</div>
                  <div className="overflow-x-auto rounded border relative">
                    {/* Header row */}
                    <div className="grid [grid-template-columns:180px_220px_minmax(300px,1fr)_140px_120px] items-end px-3 py-2 text-[12px] font-semibold bg-white min-w-[1120px] text-gray-900">
                      <div>Time</div>
                      <div>UserID</div>
                      <div>
                        <div>Full Name</div>
                        <div className="text-[11px] font-normal text-gray-500 leading-tight">(Surname <span className="italic">(Optional Suffix)</span>, Firstname Middlename)</div>
                      </div>
                      <div>User Type</div>
                      <div className="text-right sticky right-0 bg-white">Logout</div>
                    </div>
                    <div className="divide-y">
                      {(() => {
                        const key = `${dateGroup.dateKey}-${hour.hourKey}`;
                        const visible = visibleByHour[key] ?? 20;
                        const slice = hour.items.slice(0, visible);
                        return (
                          <>
                            {slice.map((it, idx) => {
                              const isRecent = !!recent[it.userId];
                              const ts = formatRowTimestamp(it.loginTime);
                              const name = formatFullNameSurnameFirst(it.fullname);
                              return (
                                <div key={`${it.userId}-${idx}`} className={`min-w-[1120px]`}>
                                  <div className={`grid [grid-template-columns:180px_220px_minmax(300px,1fr)_140px_120px] items-center px-3 py-2 text-sm ${isRecent ? 'bg-gray-50' : 'bg-blue-50/30'} text-gray-900`}>
                                    <div className="font-mono whitespace-nowrap">{ts.time}</div>
                                    <div className="font-semibold truncate" title={it.userId}>{it.userId}</div>
                                    <div className="break-words whitespace-normal" title={it.fullname}>{name}</div>
                                    <div className="capitalize whitespace-nowrap">{it.userType}</div>
                                    <div className="text-right sticky right-0 bg-inherit">
                                      {!isRecent && (
                                        <Button size="sm" variant="destructive" disabled={loggingOutId===it.userId} onClick={() => forceLogout(it.userId)}>{loggingOutId===it.userId? '...' : 'Logout'}</Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            {hour.items.length > visible && (
                              <div className="p-2 flex justify-center">
                                <Button variant="outline" size="sm" onClick={() => setVisibleByHour(v => ({ ...v, [key]: visible + 20 }))}>
                                  Show more ({hour.items.length - visible} more)
                                </Button>
                              </div>
                            )}
                          </>
                        );
                      })()}
                      {hour.items.length === 0 && (
                        <div className="p-3 text-xs text-gray-500">No sessions in this hour.</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
          {groups.length === 0 && (
            <div className="text-xs text-gray-500">No active sessions.</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
