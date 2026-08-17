import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import aiRouter from './routes/ai.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:4173',
        // Add your production frontend URL here when deploying
        // e.g. 'https://safe-house.vercel.app'
    ]
}));

app.use(express.json());

app.use('/api/ai', aiRouter);

app.get('/health', (_, res) => res.json({ status: 'ok' }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Fallback to client-side routing
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
    }
});

app.listen(PORT, () => {
    console.log(`S.A.F.E House backend running on http://localhost:${PORT}`);
});
