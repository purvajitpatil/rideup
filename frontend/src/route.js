import { useEffect, useState } from "react";

// Road geometry from the public OSRM demo server; falls back to a straight line if it is unreachable.
export function useRoute(from, to) {
  const [line, setLine] = useState([]);
  useEffect(() => {
    if (!from || !to) { setLine([]); return; }
    const straight = [[from.ltd, from.lng], [to.ltd, to.lng]];
    setLine(straight);
    const ctl = new AbortController();
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.ltd};${to.lng},${to.ltd}?overview=full&geometries=geojson`;
    fetch(url, { signal: ctl.signal })
      .then((r) => r.json())
      .then((d) => { const c = d.routes?.[0]?.geometry?.coordinates; if (c?.length) setLine(c.map(([lng, ltd]) => [ltd, lng])); })
      .catch(() => {});
    return () => ctl.abort();
  }, [from?.ltd, from?.lng, to?.ltd, to?.lng]);
  return line;
}

export const rupees = (n) => `₹${n}`;
export const arriveBy = (seconds) =>
  new Date(Date.now() + seconds * 1000).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
export const shortName = (s = "") => s.split(",")[0];
