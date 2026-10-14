import { Link } from "react-router-dom";

export default function Start() {
  return (
    <main className="start">
      <div className="start-top">
        <span className="wordmark">RideUp</span>
      </div>
      <div className="start-body">
        <h1>Go anywhere in Navi&nbsp;Mumbai.</h1>
        <p>Request an auto, car or moto, see the fare before you book, and track your driver on the map.</p>
        <div className="start-actions">
          <Link className="btn btn-light" to="/login">Ride with RideUp</Link>
          <Link className="btn btn-ghost" to="/captain/login">Drive with RideUp</Link>
        </div>
      </div>
    </main>
  );
}
