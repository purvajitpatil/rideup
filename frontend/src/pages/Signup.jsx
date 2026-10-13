import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api.js";

export default function Signup() {
  const [form, setForm] = useState({ firstname: "", lastname: "", email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await API.post("/users/register", {
        fullname: { firstname: form.firstname, lastname: form.lastname || undefined },
        email: form.email,
        password: form.password,
      });
      localStorage.setItem("token", res.data.token);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || "Server not reachable");
    }
  };

  return (
    <form className="card" onSubmit={submit}>
      <h1>RideUp</h1>
      <p className="sub">Create a rider account</p>
      {error && <div className="error">{error}</div>}
      <label>First name</label>
      <input value={form.firstname} onChange={set("firstname")} minLength="3" required />
      <label>Last name (optional)</label>
      <input value={form.lastname} onChange={set("lastname")} minLength="3" />
      <label>Email</label>
      <input type="email" value={form.email} onChange={set("email")} required />
      <label>Password</label>
      <input type="password" minLength="6" value={form.password} onChange={set("password")} required />
      <button type="submit">Sign up</button>
      <p className="sub">Already registered? <Link to="/login">Login</Link></p>
    </form>
  );
}
