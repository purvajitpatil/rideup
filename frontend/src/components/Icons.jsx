// Simple side-view vehicle drawings
export function VehicleIcon({ type }) {
  const common = { width: 56, height: 36, viewBox: "0 0 56 36", fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" };
  if (type === "moto")
    return (<svg {...common}><circle cx="12" cy="26" r="6" /><circle cx="44" cy="26" r="6" /><path d="M12 26l9-11h10l6 11M31 15l-3-6h-5M37 26l-4-11" /></svg>);
  if (type === "auto")
    return (<svg {...common}><circle cx="14" cy="28" r="5" /><circle cx="44" cy="28" r="5" /><path d="M6 28V14l8-8h26l6 8v14h-2M9 28h0M19 28h20M24 14h18M24 6v8" /></svg>);
  return (<svg {...common}><circle cx="15" cy="27" r="5" /><circle cx="41" cy="27" r="5" /><path d="M5 27v-6l5-2 6-8h20l8 8 5 2v6h-4M20 27h16M5 27h5M16 11l-2 8h28" /></svg>);
}

export const Spinner = () => <span className="spinner" aria-hidden="true" />;
