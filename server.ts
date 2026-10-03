import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import {
  initLiveDatabase,
  getPulseStats,
  registerSSEClient,
  unregisterSSEClient,
  getDatabaseState,
  addWaitlistLead,
  updateWaitlistLead,
  deleteWaitlistLead,
  addCustomerRecord,
  updateCustomerRecord,
  addOrderSubmission,
  confirmOrderPaymentInDb,
  addCreditRedemptionInDb,
  findDuplicateInWaitlist,
  findDuplicateInCustomers,
  deleteCustomerRecord,
} from './src/server/liveDatabase';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory rate limiting to protect API from automated abuse / brute-force
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const apiRateLimiter = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 150;

  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return next();
  }

  if (record.count >= maxRequests) {
    return res.status(429).json({
      error: 'Too many requests. Please slow down and try again shortly.',
      retryAfter: Math.ceil((record.resetAt - now) / 1000),
    });
  }

  record.count += 1;
  next();
};

app.use('/api', apiRateLimiter);

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

// Live Database Initialization
initLiveDatabase();

// SSE Live Stream Endpoint for real-time push to all devices
app.get('/api/live-stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (typeof (res as any).flushHeaders === 'function') {
    (res as any).flushHeaders();
  }

  registerSSEClient(res);

  const keepAliveTimer = setInterval(() => {
    try {
      res.write(': keepalive\n\n');
    } catch {
      clearInterval(keepAliveTimer);
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(keepAliveTimer);
    unregisterSSEClient(res);
  });
});

// Live Pulse Summary (Ultra fast for instant counter checks)
app.get('/api/pulse', (_req, res) => {
  res.json(getPulseStats());
});

// Full Database Bootstrap
app.get('/api/bootstrap', (_req, res) => {
  res.json({
    db: getDatabaseState(),
    stats: getPulseStats(),
  });
});

// Duplicate Pre-Check Endpoint
app.post('/api/check-duplicate', (req, res) => {
  const { email, phone } = req.body || {};
  const inWaitlist = findDuplicateInWaitlist(email || '', phone || '');
  const inCustomers = findDuplicateInCustomers(email || '', phone || '');

  const duplicateEmail = inWaitlist.duplicateEmail || inCustomers.duplicateEmail;
  const duplicatePhone = inWaitlist.duplicatePhone || inCustomers.duplicatePhone;

  let message: string | null = null;
  if (duplicateEmail && duplicatePhone) {
    message = 'Both this email and phone number are already registered on our list!';
  } else if (duplicateEmail) {
    message = `The email ${email} is already registered on our list.`;
  } else if (duplicatePhone) {
    message = `The phone number ${phone} is already registered on our list.`;
  }

  res.json({
    duplicateEmail,
    duplicatePhone,
    isDuplicate: duplicateEmail || duplicatePhone,
    message,
    existingLead: inWaitlist.existingLead,
  });
});

// Waitlist Endpoints
app.get('/api/waitlist', (_req, res) => {
  res.json({ waitlistLeads: getDatabaseState().waitlistLeads });
});

app.post('/api/waitlist', (req, res) => {
  const result = addWaitlistLead(req.body);
  if (!result.success) {
    return res.status(409).json(result);
  }
  return res.status(201).json({
    ...result,
    stats: getPulseStats(),
  });
});

app.patch('/api/waitlist/:id', (req, res) => {
  const updated = updateWaitlistLead(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Lead not found' });
  }
  return res.json(updated);
});

app.delete('/api/waitlist/:id', (req, res) => {
  const deleted = deleteWaitlistLead(req.params.id);
  return res.json({ success: deleted });
});

// Customer Endpoints
app.get('/api/customers', (_req, res) => {
  res.json({ customers: getDatabaseState().customers });
});

app.post('/api/customers', (req, res) => {
  const result = addCustomerRecord(req.body);
  if (!result.success) {
    return res.status(409).json(result);
  }
  return res.status(201).json({
    ...result,
    stats: getPulseStats(),
  });
});

app.patch('/api/customers/:id', (req, res) => {
  const updated = updateCustomerRecord(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  return res.json(updated);
});

app.delete('/api/customers/:id', (req, res) => {
  const deleted = deleteCustomerRecord(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  return res.json({ success: true, id: req.params.id });
});

// Orders Endpoints
app.get('/api/orders', (_req, res) => {
  res.json({ submittedOrders: getDatabaseState().submittedOrders });
});

app.post('/api/orders', (req, res) => {
  const order = addOrderSubmission(req.body);
  return res.status(201).json(order);
});

app.post('/api/orders/:id/confirm-payment', (req, res) => {
  const result = confirmOrderPaymentInDb(req.params.id);
  if (!result) {
    return res.status(404).json({ error: 'Order not found' });
  }
  return res.json(result);
});

// Credit Redemptions
app.post('/api/credit-redemptions', (req, res) => {
  const redemption = addCreditRedemptionInDb(req.body);
  return res.status(201).json(redemption);
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
