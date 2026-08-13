import { Router } from 'express';
import axios from 'axios';

const router = Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const FREELLMAPI_KEY = process.env.FREELLMAPI_KEY || '';
const FREELLMAPI_URL = process.env.FREELLMAPI_URL || 'http://localhost:3003/v1/chat/completions';

// POST /api/ai/gemini
// Transparent proxy to Gemini generateContent — frontend sends the full request body
router.post('/gemini', async (req, res) => {
    const { model = 'gemini-3.1-flash-lite', ...body } = req.body;
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
        const response = await axios.post(url, body, {
            timeout: 60000,
            signal: req.signal,
        });
        res.json(response.data);
    } catch (e) {
        if (e.response) {
            return res.status(e.response.status).json(e.response.data);
        }
        res.status(500).json({ error: e.message });
    }
});

// POST /api/ai/openrouter
// Transparent proxy to OpenRouter — frontend sends the full request body
router.post('/openrouter', async (req, res) => {
    try {
        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            req.body,
            {
                headers: {
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'HTTP-Referer': 'https://safe-house.app',
                    'X-Title': 'SAFE House',
                },
                timeout: 60000,
                signal: req.signal,
            }
        );
        res.json(response.data);
    } catch (e) {
        if (e.response) {
            return res.status(e.response.status).json(e.response.data);
        }
        res.status(500).json({ error: e.message });
    }
});

// POST /api/ai/freellmapi
// Transparent proxy to FreeLLMAPI
router.post('/freellmapi', async (req, res) => {
    try {
        const response = await axios.post(
            FREELLMAPI_URL,
            req.body,
            {
                headers: {
                    'Authorization': `Bearer ${FREELLMAPI_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 60000,
                signal: req.signal,
            }
        );
        res.json(response.data);
    } catch (e) {
        if (e.response) {
            return res.status(e.response.status).json(e.response.data);
        }
        res.status(500).json({ error: e.message });
    }
});

export default router;
