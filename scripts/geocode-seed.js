/**
 * One-time script: geocode seed listings using Nominatim (free, no key).
 * Run: node scripts/geocode-seed.js
 * Rate-limited to 1 req/sec by Nominatim's ToS.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Property = require('../models/Property');

// Approximate coordinates for Nigerian cities (rough — used when Nominatim fails)
const FALLBACK = {
  'Lagos|Yaba': [3.3792, 6.5095],
  'Lagos|Akoka': [3.3907, 6.5158],
  'Lagos|Lekki': [3.4718, 6.4478],
  'Lagos|Ikeja': [3.3421, 6.6018],
  'Lagos|Surulere': [3.3583, 6.5000],
  'FCT Abuja|Maitama': [7.4890, 9.0877],
  'FCT Abuja|Wuse': [7.4709, 9.0589],
  'FCT Abuja|Gwarinpa': [7.3950, 9.1080],
  'Rivers|Port Harcourt': [7.0100, 4.8156],
  'Rivers|Rumuokoro': [6.9557, 4.8593],
  'Enugu|Enugu GRA': [7.4986, 6.4402],
  'Oyo|Bodija': [3.8900, 7.4300],
  'Oyo|Jericho': [3.8750, 7.3800],
  'Edo|Ugbowo': [5.6100, 6.3800],
  'Delta|Asaba': [6.7000, 6.2000]
};

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function geocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
  const res = await fetch(url, { headers: { 'User-Agent': 'NaijaRent-MVP/1.0 (setup)' } });
  const data = await res.json();
  if (data && data[0]) return [Number(data[0].lon), Number(data[0].lat)];
  return null;
}

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected. Geocoding properties...');

    const props = await Property.find({});
    let updated = 0, failed = 0;

    for (const p of props) {
      const key = `${p.state}|${p.area}`;
      let coords = FALLBACK[key];

      if (!coords) {
        try {
          coords = await geocode(`${p.area}, ${p.state}, Nigeria`);
          await sleep(1100); // Nominatim rate limit
        } catch { coords = null; }
      }

      if (coords) {
        p.coordinates = { type: 'Point', coordinates: coords };
        await p.save();
        updated++;
        console.log(`✓ ${p.title} → [${coords[0]}, ${coords[1]}]`);
      } else {
        failed++;
        console.log(`✗ ${p.title} — no coords found`);
      }
    }

    console.log(`\nDone. Updated: ${updated}, Failed: ${failed}`);
    process.exit(0);
  } catch (e) {
    console.error('Geocode failed:', e);
    process.exit(1);
  }
})();
