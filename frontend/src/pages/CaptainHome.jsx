import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import API, { errorText } from "../api.js";
import { clearSession, connectSocket } from "../session.js";
import { rupees, shortName, useRoute } from "../route.js";
import MapView from "../components/MapView.jsx";
import { Spinner } from "../components/Icons.jsx";

// Used when the browser can't give a location (permission denied, desktop, tests): near BVCOE, CBD Belapur
const FALLBACK = { ltd: 19.0215, lng: 73.0385 };

export default function CaptainHome() {
  const nav = useNavigate();
  const [me, setMe] = useState(null);
  const [online, setOnline] = useState(false);
  const [pos, setPos] = useState(null);
  const [requests, setRequests] = useState([]);
  const [ride, setRide] = useState(null); // accepted / ongoing / just completed
  const [pickupPos, setPickupPos] = useState(null);
  const [destPos, setDestPos] = useState(null);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [earned, setEarned] = useState(0);
  const socketRef = useRef(null);
  const posRef = useRef(null);

  const coords = (a) => API.get("/maps/get-coordinates", { params: { address: a } }).then((r) => r.data);

  // ---- profile + restore ----
  useEffect(() => {
    API.get("/captains/profile").then((r) => { setMe(r.data.captain); if (r.data.captain.status === "active") goOnline(true); }).catch(() => { clearSession(); nav("/captain/login"); });
    API.get("/rides/active-captain").then((r) => { if (r.data) setActive(r.data); });
    return () => { socketRef.current?.disconnect(); };
  }, []);

  const setActive = async (r) => {
    setRide(r);
    setPickupPos(await coords(r.pickup).catch(() => null));
    setDestPos(await coords(r.destination).catch(() => null));
  };

  // ---- online / offline ----
  const locate = () => new Promise((resolve) => {
    // never wait more than 3 s for a GPS fix (permission prompts and indoor GPS can hang)
    const t = setTimeout(() => resolve(FALLBACK), 3000);
    const done = (v) => { clearTimeout(t); resolve(v); };
    if (!navigator.geolocation) return done(FALLBACK);
    navigator.geolocation.getCurrentPosition((p) => done({ ltd: p.coords.latitude, lng: p.coords.longitude }), () => done(FALLBACK), { timeout: 2500 });
  });

  const goOnline = async (restoring = false) => {
    setError("");
    const here = await locate();
    setPos(here); posRef.current = here;
    try { await API.put("/captains/status", { status: "active", location: here }); } catch (err) { return setError(errorText(err)); }
    setOnline(true);
    const s = connectSocket("captain");
    socketRef.current = s;
    s.on("connect", () => s.emit("update-location-captain", posRef.current));
    s.on("new-ride", (r) => setRequests((q) => (q.some((x) => x._id === r._id) ? q : [r, ...q])));
    s.on("ride-cancelled", () => { setRide(null); setPickupPos(null); setDestPos(null); setOtp(""); setError("The rider cancelled this trip."); });
    API.get("/rides/open").then((r) => setRequests(r.data)).catch(() => {});
  };

  const goOffline = async () => {
    try { await API.put("/captains/status", { status: "inactive" }); } catch {}
    socketRef.current?.disconnect(); socketRef.current = null;
    setOnline(false); setRequests([]);
  };

  // keep sending our location while online (every 5 s)
  useEffect(() => {
    if (!online) return;
    const id = setInterval(async () => {
      const here = await locate();
      setPos(here); posRef.current = here;
      socketRef.current?.emit("update-location-captain", here);
    }, 5000);
    return () => clearInterval(id);
  }, [online]);

  // ---- ride actions ----
  const run = async (fn) => { setBusy(true); setError(""); try { await fn(); } catch (err) { setError(errorText(err)); } setBusy(false); };

  const accept = (r) => run(async () => {
    const res = await API.post("/rides/confirm", { rideId: r._id });
    setRequests([]); setOtp("");
    await setActive(res.data);
  });

  const ignore = (id) => setRequests((q) => q.filter((r) => r._id !== id));

  const start = (e) => { e.preventDefault(); run(async () => { const res = await API.post("/rides/start-ride", { rideId: ride._id, otp }); setRide(res.data); setOtp(""); }); };
  const finish = () => run(async () => { const res = await API.post("/rides/end-ride", { rideId: ride._id }); setRide(res.data); setEarned((e) => e + res.data.fare); });
  const clear = () => { setRide(null); setPickupPos(null); setDestPos(null); API.get("/rides/open").then((r) => setRequests(r.data)).catch(() => {}); };

  const logout = async () => { try { await API.put("/captains/status", { status: "inactive" }); await API.get("/captains/logout"); } catch {} socketRef.current?.disconnect(); clearSession(); nav("/captain/login"); };

  // route: to the pickup while heading to the rider, then pickup -> destination
  const phase = !ride ? "idle" : ride.status === "accepted" ? "pickup" : ride.status === "ongoing" ? "trip" : "done";
  const line = useRoute(phase === "pickup" ? pos : phase === "trip" ? pickupPos : null, phase === "pickup" ? pickupPos : phase === "trip" ? destPos : null);
  const req = requests[0];
  const riderName = (r) => (r.user ? `${r.user.fullname.firstname} ${r.user.fullname.lastname || ""}`.trim() : "Rider");

  return (
    <div className="app">
      <MapView captain={pos} pickup={phase === "pickup" || phase === "trip" ? pickupPos : null} destination={phase === "trip" ? destPos : null} route={line} />

      <header className="topbar">
        <span className="wordmark dark">RideUp Driver</span>
        {me && <button className="chip" onClick={logout}>{me.fullname.firstname} &middot; Sign out</button>}
      </header>

      <section className="sheet" aria-live="polite">
        <div className="grabber" aria-hidden="true" />
        {error && <div className="error" role="alert">{error}</div>}

        {phase === "idle" && !req && (
          <>
            <h2>{online ? "You’re online" : "You’re offline"}</h2>
            {online ? (
              <p className="hint"><Spinner /> Waiting for ride requests near you&hellip;</p>
            ) : (
              <p className="hint">Go online to start receiving ride requests{me ? ` for your ${me.vehicle.color} ${me.vehicle.vehicleType}` : ""}.</p>
            )}
            <div className="receipt"><span>Earned this session</span><b>{rupees(earned)}</b></div>
            <button className={online ? "btn btn-light-outline block" : "btn btn-dark block"} onClick={online ? goOffline : () => goOnline()}>{online ? "Go offline" : "Go online"}</button>
          </>
        )}

        {phase === "idle" && req && (
          <>
            <h2>New ride request</h2>
            <div className="request-fare"><b>{rupees(req.fare)}</b><small>{(req.distance / 1000).toFixed(1)} km &middot; {Math.round(req.duration / 60)} min &middot; {riderName(req)}</small></div>
            <div className="summary"><div><i className="dot" /><span>{shortName(req.pickup)}</span></div><div><i className="sq" /><span>{shortName(req.destination)}</span></div></div>
            {requests.length > 1 && <p className="hint">{requests.length - 1} more request{requests.length > 2 ? "s" : ""} waiting</p>}
            <div className="row">
              <button className="btn btn-light-outline" onClick={() => ignore(req._id)}>Ignore</button>
              <button className="btn btn-dark" onClick={() => accept(req)} disabled={busy}>{busy ? "Accepting…" : "Accept"}</button>
            </div>
          </>
        )}

        {phase === "pickup" && (
          <>
            <h2>Pick up {riderName(ride)}</h2>
            <div className="summary"><div><i className="dot" /><span>{ride.pickup}</span></div></div>
            <form onSubmit={start} className="otp-form">
              <label>Ask the rider for their 6-digit PIN
                <input inputMode="numeric" pattern="[0-9]{6}" maxLength="6" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} placeholder="000000" className="otp-input" required />
              </label>
              <button className="btn btn-dark block" disabled={otp.length !== 6 || busy}>{busy ? "Checking…" : "Start trip"}</button>
            </form>
          </>
        )}

        {phase === "trip" && (
          <>
            <h2>Drive to {shortName(ride.destination)}</h2>
            <div className="summary"><div><i className="sq" /><span>{ride.destination}</span></div><p>{rupees(ride.fare)} &middot; {(ride.distance / 1000).toFixed(1)} km</p></div>
            <button className="btn btn-dark block" onClick={finish} disabled={busy}>{busy ? "Finishing…" : "Complete trip"}</button>
          </>
        )}

        {phase === "done" && (
          <>
            <h2>Trip complete</h2>
            <div className="receipt"><span>Collect from rider</span><b>{rupees(ride.fare)}</b></div>
            <button className="btn btn-dark block" onClick={clear}>Back online</button>
          </>
        )}
      </section>
    </div>
  );
}
