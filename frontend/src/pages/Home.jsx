import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api.js";

export default function Home() {
  const [user, setUser] = useState(null);
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [active, setActive] = useState("pickup");
  const [fares, setFares] = useState(null);
  const [vehicle, setVehicle] = useState("");
  const [ride, setRide] = useState(null);
  const [rides, setRides] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const loadRides = async () => setRides((await API.get("/rides")).data);

  // runs once after the first render: fetch the profile and the ride history
  useEffect(() => {
    API.get("/users/profile").then((r) => setUser(r.data)).catch(() => {
      localStorage.removeItem("token");
      navigate("/login");
    });
    loadRides().catch(() => {});
  }, []);

  // autocomplete: ask the API for suggestions when the text has at least 3 characters
  const typing = async (field, value) => {
    field === "pickup" ? setPickup(value) : setDestination(value);
    setActive(field);
    setFares(null); setRide(null); setVehicle("");
    if (value.length < 3) return setSuggestions([]);
    try {
      const res = await API.get("/maps/get-suggestions", { params: { input: value } });
      setSuggestions(res.data);
    } catch { setSuggestions([]); }
  };
  const choose = (place) => {
    active === "pickup" ? setPickup(place) : setDestination(place);
    setSuggestions([]);
  };

  const findTrip = async () => {
    setError(""); setRide(null); setVehicle("");
    try {
      const res = await API.get("/rides/get-fare", { params: { pickup, destination } });
      setFares(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Choose two places from the suggestions");
    }
  };

  const confirm = async () => {
    setError("");
    try {
      const res = await API.post("/rides/create", { pickup, destination, vehicleType: vehicle });
      setRide(res.data);
      loadRides();
    } catch (err) {
      setError(err.response?.data?.message || "Could not create the ride");
    }
  };

  const remove = async (id) => { await API.delete(`/rides/${id}`); loadRides(); };

  const logout = async () => {
    try { await API.get("/users/logout"); } catch {}
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="card wide">
      <div className="top">
        <h1>RideUp</h1>
        {user && <span>Hello, <b>{user.fullname.firstname} {user.fullname.lastname}</b> <button className="small" onClick={logout}>Logout</button></span>}
      </div>

      <label>Pickup</label>
      <input value={pickup} onChange={(e) => typing("pickup", e.target.value)} placeholder="Type at least 3 letters, e.g. railway" />
      <label>Destination</label>
      <input value={destination} onChange={(e) => typing("destination", e.target.value)} placeholder="Where to?" />
      {suggestions.length > 0 && (
        <ul className="suggest">{suggestions.map((s) => <li key={s} onClick={() => choose(s)}>{s}</li>)}</ul>
      )}
      <button onClick={findTrip} disabled={!pickup || !destination}>Find fares</button>
      {error && <div className="error">{error}</div>}

      {fares && (
        <div className="vehicles">
          {Object.entries(fares).map(([type, fare]) => (
            <div key={type} className={"v" + (vehicle === type ? " sel" : "")} onClick={() => setVehicle(type)}>
              <b>{type}</b><span>Rs. {fare}</span>
            </div>
          ))}
        </div>
      )}
      {fares && <button onClick={confirm} disabled={!vehicle}>Confirm {vehicle || "vehicle"}</button>}

      {ride && (
        <div className="ok">
          <b>Ride created &mdash; status: {ride.status}</b><br />
          OTP for the captain: <span className="otp">{ride.otp}</span><br />
          Fare Rs. {ride.fare} &middot; {(ride.distance / 1000).toFixed(1)} km &middot; {Math.round(ride.duration / 60)} min
        </div>
      )}

      <h3>My rides ({rides.length})</h3>
      <table>
        <thead><tr><th>From</th><th>To</th><th>Fare</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {rides.map((r) => (
            <tr key={r._id}>
              <td>{r.pickup.split(",")[0]}</td><td>{r.destination.split(",")[0]}</td>
              <td>Rs. {r.fare}</td><td>{r.status}</td>
              <td><button className="small del" onClick={() => remove(r._id)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
