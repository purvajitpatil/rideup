// Local place dataset used instead of the Google Maps API (no API key needed).
const PLACES = [
  { name: 'Bharati Vidyapeeth College of Engineering, Sector 3, CBD Belapur, Navi Mumbai', ltd: 19.0186, lng: 73.0395 },
  { name: 'CBD Belapur Railway Station, Navi Mumbai', ltd: 19.0230, lng: 73.0393 },
  { name: 'Kharghar Railway Station, Navi Mumbai', ltd: 19.0261, lng: 73.0659 },
  { name: 'Vashi Railway Station, Navi Mumbai', ltd: 19.0771, lng: 72.9986 },
  { name: 'Nerul Railway Station, Navi Mumbai', ltd: 19.0330, lng: 73.0169 },
  { name: 'Panvel Railway Station, Raigad', ltd: 18.9894, lng: 73.1175 },
  { name: 'Chhatrapati Shivaji Maharaj Terminus, Mumbai', ltd: 18.9398, lng: 72.8354 },
  { name: 'Gateway of India, Mumbai', ltd: 18.9220, lng: 72.8347 },
  { name: 'Mumbai International Airport, Terminal 2, Andheri', ltd: 19.0896, lng: 72.8656 },
  { name: 'Dadar Railway Station, Mumbai', ltd: 19.0186, lng: 72.8424 },
];
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

function findPlace(address) {
  const q = norm(address);
  if (!q) return null;
  return PLACES.find((p) => norm(p.name).includes(q)) || PLACES.find((p) => q.split(' ').every((w) => norm(p.name).includes(w))) || null;
}
function haversine(a, b) {
  const R = 6371000, rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.ltd - a.ltd), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.ltd)) * Math.cos(rad(b.ltd)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

module.exports.getAddressCoordinate = async (address) => {
  const p = findPlace(address);
  if (!p) throw new Error('Coordinates not found');
  return { ltd: p.ltd, lng: p.lng };
};
module.exports.getDistanceTime = async (origin, destination) => {
  if (!origin || !destination) throw new Error('Origin and destination are required');
  const a = findPlace(origin), b = findPlace(destination);
  if (!a || !b) throw new Error('No routes found');
  const meters = Math.round(haversine(a, b) * 1.3); // road factor
  const seconds = Math.round(meters / (25 / 3.6)); // 25 km/h city average
  const km = (meters / 1000).toFixed(1);
  const mins = Math.max(1, Math.round(seconds / 60));
  return { distance: { text: `${km} km`, value: meters }, duration: { text: `${mins} mins`, value: seconds } };
};
module.exports.getAutoCompleteSuggestions = async (input) => {
  if (!input) throw new Error('query is required');
  const q = norm(input);
  return PLACES.filter((p) => norm(p.name).includes(q)).map((p) => p.name);
};
