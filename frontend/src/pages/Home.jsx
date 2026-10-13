import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import API, { errorText } from "../api.js";
import { clearSession, connectSocket } from "../session.js";
import { arriveBy, rupees, shortName, useRoute } from "../route.js";
import MapView from "../components/MapView.jsx";
import { Spinner, VehicleIcon } from "../components/Icons.jsx";

const VEHICLES = {
  moto: { label: "Moto", seats: 1, note: "Fastest through traffic" },
  auto: { label: "Auto", seats: 3, note: "Affordable rickshaw" },
  car: { label: "Car", seats: 4, note: "Comfortable, with AC" },
};

export default function Home() {
  const nav = useNavigate();
  const [user, setUser] = useState(null);
  const [pickup, setPickup] = useState({ text: "", pos: null });
  const [dest, setDest] = useState({ text: "", pos: null });
  const [active, setActive] = useState("pickup");
  const [suggestions, setSuggestions] = useState([]);
  const [fares, setFares] = useState(null);
  const [vehicle, setVehicle] = useState("");
  const [trip, setTrip] = useState(null); // { distance, duration } for the chosen route
  const [ride, setRide] = useState(null); // the live ride from the server
  const [captainPos, setCaptainPos] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [recent, setRecent] = useState([]);
  const timer = useRef();

  const stage = !ride ? (fares ? "vehicles" : "search") : { pending: "finding", accepted: "waiting", ongoing: "riding", completed: "done" }[ride.status] || "search";

  // ---- load profile, restore any ride in progress, listen for live updates ----
  useEffect(() => {
    API.get("/users/profile").then((r) => setUser(r.data)).catch(() => { clearSession(); nav("/login"); });
    API.get("/rides/active").then((r) => { if (r.data) restore(r.data); });
    loadRecent();

    const socket = connectSocket("user");
    socket.on("ride-confirmed", (r) => { setRide(r); if (r.captain?.location?.ltd) setCaptainPos(r.captain.location); });
    socket.on("ride-started", (r) => setRide(r));
    socket.on("ride-ended", (r) => { setRide(r); setCaptainPos(null); });
    socket.on("captain-moved", (m) => setCaptainPos(m.location));
    return () => socket.disconnect();
  }, []);

  const loadRecent = () => API.get("/rides").then((r) => {
    const seen = new Set();
    setRecent(r.data.filter((x) => x.status === "completed").reverse().filter((x) => !seen.has(x.destination) && seen.add(x.destination)).slice(0, 3));
  }).catch(() => {});

  const coords = (address) => API.get("/maps/get-coordinates", { params: { address } }).then((r) => r.data);
  const restore = async (r) => {
    setRide(r);
    setPickup({ text: r.pickup, pos: await coords(r.pickup).catch(() => null) });
    setDest({ text: r.destination, pos: await coords(r.destination).catch(() => null) });
    if (r.captain?.location?.ltd) setCaptainPos(r.captain.location);
  };

  // ---- search with autocomplete ----
  const type = (field, text) => {
    const setter = field === "pickup" ? setPickup : setDest;
    setter({ text, pos: null });
    setActive(field); setFares(null); setVehicle(""); setError("");
    clearTimeout(timer.current);
    if (text.length < 3) return setSuggestions([]);
    timer.current = setTimeout(async () => {
      try { setSuggestions((await API.get("/maps/get-suggestions", { params: { input: text } })).data); } catch { setSuggestions([]); }
    }, 300);
  };

  const choose = async (place, field = active) => {
    setSuggestions([]);
    const pos = await coords(place).catch(() => null);
    if (!pos) return setError("We couldn't find that place on the map. Try another.");
    const next = { text: place, pos };
    const nextPickup = field === "pickup" ? next : pickup;
    const nextDest = field === "dest" ? next : dest;
    field === "pickup" ? setPickup(next) : setDest(next);
    if (nextPickup.pos && nextDest.pos) findFares(nextPickup.text, nextDest.text);
    else setActive(field === "pickup" ? "dest" : "pickup");
  };

  const findFares = async (from, to) => {
    setBusy(true); setError("");
    try {
      const [f, t] = await Promise.all([
        API.get("/rides/get-fare", { params: { pickup: from, destination: to } }),
        API.get("/maps/get-distance-time", { params: { origin: from, destination: to } }),
      ]);
      setFares(f.data); setTrip(t.data); setVehicle("car");
    } catch (err) { setError(errorText(err)); }
    setBusy(false);
  };

  const book = async () => {
    setBusy(true); setError("");
    try {
      const res = await API.post("/rides/create", { pickup: pickup.text, destination: dest.text, vehicleType: vehicle });
      setRide(res.data);
    } catch (err) { setError(errorText(err)); }
    setBusy(false);
  };

  const reset = () => { loadRecent(); setRide(null); setFares(null); setVehicle(""); setTrip(null); setPickup({ text: "", pos: null }); setDest({ text: "", pos: null }); setCaptainPos(null); setActive("pickup"); };

  const cancel = async () => {
    try { await API.put(`/rides/${ride._id}`, { status: "cancelled" }); reset(); } catch (err) { setError(errorText(err)); }
  };

  const logout = async () => { try { await API.get("/users/logout"); } catch {} clearSession(); nav("/login"); };

  const routeFrom = stage === "waiting" ? captainPos : pickup.pos;
  const routeTo = stage === "waiting" ? pickup.pos : dest.pos;
  const line = useRoute(pickup.pos && dest.pos ? routeFrom : null, routeTo);
  const cap = ride?.captain;

  return (
    <div className="app">
      <MapView pickup={pickup.pos} destination={stage === "waiting" ? null : dest.pos} captain={captainPos} route={line} />

      <header className="topbar">
        <span className="wordmark dark">RideUp</span>
        {user && <button className="chip" onClick={logout}>{user.fullname.firstname} &middot; Sign out</button>}
      </header>

      <section className="sheet" aria-live="polite">
        <div className="grabber" aria-hidden="true" />

        {(stage === "search" || stage === "vehicles") && (
          <>
            <h2>{stage === "search" ? "Where to?" : "Choose a ride"}</h2>
            <div className="route-inputs">
              <div className="rail" aria-hidden="true"><i className="dot" /><b /><i className="sq" /></div>
              <div className="fields">
                <input aria-label="Pickup" value={pickup.text} placeholder="Pickup location" onFocus={() => setActive("pickup")} onChange={(e) => type("pickup", e.target.value)} />
                <input aria-label="Destination" value={dest.text} placeholder="Dropoff location" onFocus={() => setActive("dest")} onChange={(e) => type("dest", e.target.value)} />
              </div>
            </div>
            {error && <div className="error" role="alert">{error}</div>}
            {suggestions.length > 0 && (
              <ul className="list" role="listbox">
                {suggestions.map((s) => (
                  <li key={s} role="option"><button onClick={() => choose(s)}><span className="pin-ic" /><span><b>{shortName(s)}</b><small>{s.split(",").slice(1, 3).join(",").trim()}</small></span></button></li>
                ))}
              </ul>
            )}
            {stage === "search" && suggestions.length === 0 && !busy && recent.length > 0 && (
              <ul className="list">
                {recent.map((r) => (
                  <li key={r._id}><button onClick={() => choose(r.destination, "dest")}>
                    <span className="clock-ic" /><span><b>{shortName(r.destination)}</b><small>Recent trip</small></span></button></li>
                ))}
              </ul>
            )}
            {busy && <p className="hint"><Spinner /> Getting fares&hellip;</p>}
            {stage === "search" && !busy && suggestions.length === 0 && recent.length === 0 && <p className="hint">Type at least 3 letters, for example &ldquo;railway&rdquo; or &ldquo;airport&rdquo;.</p>}

            {stage === "vehicles" && fares && (
              <>
                <ul className="rides">
                  {Object.entries(fares).map(([t, fare]) => (
                    <li key={t}>
                      <button className={vehicle === t ? "ride-opt sel" : "ride-opt"} onClick={() => setVehicle(t)} aria-pressed={vehicle === t}>
                        <VehicleIcon type={t} />
                        <span className="ride-info"><b>{VEHICLES[t].label}<small> {VEHICLES[t].seats} {VEHICLES[t].seats === 1 ? "seat" : "seats"}</small></b><small>{arriveBy(trip.duration.value)} dropoff &middot; {trip.duration.text}</small></span>
                        <span className="price">{rupees(fare)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
                <button className="btn btn-dark block" onClick={book} disabled={!vehicle || busy}>{busy ? "Booking…" : `Book ${VEHICLES[vehicle]?.label || ""}`}</button>
              </>
            )}
          </>
        )}

        {stage === "finding" && (
          <>
            <h2>Finding your driver</h2>
            <div className="progress" role="progressbar" aria-label="Searching for a driver"><span /></div>
            <TripSummary ride={ride} />
            <p className="hint">Nearby {VEHICLES[ride.vehicleType]?.label.toLowerCase() || "driver"}s are being notified. This usually takes under a minute.</p>
            {error && <div className="error" role="alert">{error}</div>}
            <button className="btn btn-light-outline block" onClick={cancel}>Cancel request</button>
          </>
        )}

        {stage === "waiting" && (
          <>
            <h2>Your driver is on the way</h2>
            <DriverCard captain={cap} vehicle={ride.vehicleType} />
            <div className="otp-box"><small>Tell your driver this PIN to start the trip</small><b>{ride.otp}</b></div>
            <TripSummary ride={ride} />
            {error && <div className="error" role="alert">{error}</div>}
            <button className="btn btn-light-outline block" onClick={cancel}>Cancel ride</button>
          </>
        )}

        {stage === "riding" && (
          <>
            <h2>On your way to {shortName(ride.destination)}</h2>
            <DriverCard captain={cap} vehicle={ride.vehicleType} />
            <TripSummary ride={ride} />
          </>
        )}

        {stage === "done" && (
          <>
            <h2>You&rsquo;ve arrived</h2>
            <div className="receipt"><span>Pay your driver</span><b>{rupees(ride.fare)}</b></div>
            <TripSummary ride={ride} />
            <button className="btn btn-dark block" onClick={reset}>Done</button>
          </>
        )}
      </section>
    </div>
  );
}

function TripSummary({ ride }) {
  return (
    <div className="summary">
      <div><i className="dot" /><span>{shortName(ride.pickup)}</span></div>
      <div><i className="sq" /><span>{shortName(ride.destination)}</span></div>
      <p>{rupees(ride.fare)} &middot; {(ride.distance / 1000).toFixed(1)} km &middot; {Math.round(ride.duration / 60)} min</p>
    </div>
  );
}

export function DriverCard({ captain, vehicle }) {
  if (!captain) return null;
  const name = `${captain.fullname.firstname} ${captain.fullname.lastname || ""}`.trim();
  return (
    <div className="driver">
      <div className="avatar" aria-hidden="true">{captain.fullname.firstname[0]}</div>
      <div className="driver-info"><b>{name}</b><small>{captain.vehicle.color} {captain.vehicle.vehicleType}</small></div>
      <div className="plate">{captain.vehicle.plate}</div>
    </div>
  );
}
