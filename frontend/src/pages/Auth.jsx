import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API, { errorText } from "../api.js";
import { saveSession } from "../session.js";

const TYPES = [["car", "Car"], ["auto", "Auto"], ["motorcycle", "Motorcycle"]];

export default function Auth({ role, mode }) {
  const captain = role === "captain";
  const signup = mode === "signup";
  const base = captain ? "/captains" : "/users";
  const nav = useNavigate();
  const [f, setF] = useState({ firstname: "", lastname: "", email: "", password: "", color: "", plate: "", capacity: "3", vehicleType: "car" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      let res;
      if (!signup) res = await API.post(`${base}/login`, { email: f.email, password: f.password });
      else {
        const body = { fullname: { firstname: f.firstname, lastname: f.lastname || undefined }, email: f.email, password: f.password };
        if (captain) body.vehicle = { color: f.color, plate: f.plate, capacity: Number(f.capacity), vehicleType: f.vehicleType };
        res = await API.post(`${base}/register`, body);
      }
      saveSession(res.data.token, role);
      nav(captain ? "/captain/home" : "/home");
    } catch (err) { setError(errorText(err)); }
    setBusy(false);
  };

  const other = captain ? ["/login", "Sign in as a rider"] : ["/captain/login", "Drive with RideUp"];
  return (
    <main className="auth">
      <Link to="/" className="wordmark dark">RideUp</Link>
      <form onSubmit={submit} className="auth-form">
        <h1>{signup ? (captain ? "Sign up to drive" : "Create your account") : captain ? "Sign in to drive" : "Sign in"}</h1>
        {error && <div className="error" role="alert">{error}</div>}
        {signup && (
          <div className="two">
            <label>First name<input value={f.firstname} onChange={set("firstname")} minLength="3" required autoComplete="given-name" /></label>
            <label>Last name<input value={f.lastname} onChange={set("lastname")} minLength="3" autoComplete="family-name" /></label>
          </div>
        )}
        <label>Email<input type="email" value={f.email} onChange={set("email")} required autoComplete="email" /></label>
        <label>Password<input type="password" value={f.password} onChange={set("password")} minLength="6" required autoComplete={signup ? "new-password" : "current-password"} /></label>
        {signup && captain && (
          <>
            <div className="two">
              <label>Vehicle colour<input value={f.color} onChange={set("color")} minLength="3" required /></label>
              <label>Plate number<input value={f.plate} onChange={set("plate")} minLength="3" required /></label>
            </div>
            <div className="two">
              <label>Seats<input type="number" min="1" max="8" value={f.capacity} onChange={set("capacity")} required /></label>
              <label>Vehicle type
                <select value={f.vehicleType} onChange={set("vehicleType")}>{TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
              </label>
            </div>
          </>
        )}
        <button className="btn btn-dark" type="submit" disabled={busy}>{busy ? "Please wait…" : signup ? "Create account" : "Sign in"}</button>
        <p className="swap">
          {signup ? <>Already have an account? <Link to={captain ? "/captain/login" : "/login"}>Sign in</Link></> : <>New here? <Link to={captain ? "/captain/signup" : "/signup"}>Create an account</Link></>}
        </p>
        <p className="swap"><Link to={other[0]}>{other[1]}</Link></p>
      </form>
    </main>
  );
}
