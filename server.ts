import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// In-memory store for Giveaway Entries (simulating Firestore giveaway_entries collection)
interface GiveawayEntry {
  id: string;
  email: string;
  wittyConfirmation: string;
  createdAt: string;
  source: string;
}

const giveawayEntries: GiveawayEntry[] = [
  {
    id: 'gw-1',
    email: 'sarah.j@spreadsheetwiz.ng',
    wittyConfirmation: "Congrats Sarah! Your entry is logged. While your manager is busy asking for 'quick fixes' on VLOOKUP at 11:05 AM, hot Jollof Rice will be marching to your desk like a hero.",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    source: 'Landing Page Funnel',
  },
  {
    id: 'gw-2',
    email: 'tunde.dev@bugcreators.io',
    wittyConfirmation: "Tunde, we received your email! Your code might be throwing NullPointerExceptions, but at least your lunch won't throw 404 errors. 11 AM delivery loading...",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    source: 'Landing Page Funnel',
  }
];

// Genkit AI Flow Endpoint: Generate Witty Confirmation and log giveaway entry
app.post('/api/genkit/witty-confirmation', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email required' });
    }

    let wittyMessage = "";
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: `You are Genkit, the AI bot for "11 to 12", a premier Lagos office food subscription service in Nigeria. 
A user with email "${email}" just signed up for the free office lunch giveaway on our marketing page.
Generate a hilarious, playfully savage, authentic Lagos-themed confirmation message (2 to 3 sentences). 
Incorporate relatable Lagos corporate life humor (e.g., Third Mainland traffic, generator sound, Oga's emergency 5 PM meetings, Excel VLOOKUP breakdown, hot office AC, Slack ping anxiety, or fuel queues) while assuring them that good, hot food is coming to save their office day by 11 AM. 
Do not use generic corporate language. Make it punchy, humorous, and high-energy!`,
      });
      wittyMessage = response.text || "Your entry is locked in! May your food arrive faster than Third Mainland Bridge traffic cleared today!";
    } catch (genError) {
      console.error("Gemini API generation error:", genError);
      wittyMessage = `Entry confirmed for ${email}! While your boss is drafting 'urgent' emails, your hot Jollof is gearing up for delivery at 11 AM prompt!`;
    }

    const newEntry: GiveawayEntry = {
      id: `gw-${Date.now()}`,
      email,
      wittyConfirmation: wittyMessage,
      createdAt: new Date().toISOString(),
      source: 'Landing Page Funnel (Genkit Flow)',
    };

    giveawayEntries.unshift(newEntry);

    return res.json({
      success: true,
      message: wittyMessage,
      entry: newEntry,
    });
  } catch (error) {
    console.error("Server error handling giveaway:", error);
    res.status(500).json({ error: "Failed to process giveaway entry" });
  }
});

// Admin Giveaway Entries Endpoint
app.get('/api/admin/giveaway-entries', (_req, res) => {
  res.json({ entries: giveawayEntries });
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`11 to 12 Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
