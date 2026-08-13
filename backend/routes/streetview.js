import { Router } from 'express';
import axios from 'axios';

const router = Router();
const MAPS_API_KEY = process.env.MAPS_API_KEY;

// GET /api/streetview/check?lat=&lon=
router.get('/check', async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: 'lat and lon required' });
    try {
        const url = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lon}&key=${MAPS_API_KEY}`;
        const response = await axios.get(url, { timeout: 5000 });
        res.json({ available: response.data.status === 'OK' });
    } catch {
        res.json({ available: false });
    }
});

// GET /api/streetview/image?lat=&lon=&heading=&size=&fov=
// Returns the Street View image as base64 so frontend can pass it to Gemini via /api/ai/gemini
router.get('/image', async (req, res) => {
    const { lat, lon, heading = 0, size = '400x300', fov = 100 } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: 'lat and lon required' });
    try {
        const url = `https://maps.googleapis.com/maps/api/streetview?size=${size}&location=${lat},${lon}&heading=${heading}&fov=${fov}&pitch=0&key=${MAPS_API_KEY}`;
        const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000 });
        const base64 = Buffer.from(response.data).toString('base64');
        res.json({ base64, mimeType: 'image/jpeg' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
