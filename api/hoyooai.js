import axios from 'axios';
import { Groq } from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import admin from 'firebase-admin';

// Initialize Firebase Admin (Singleton pattern)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Fix for Vercel's handling of private keys
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`
  });
}

const db = admin.database();

export default async function handler(req, res) {
  const { ODDS_API_KEY, GROQ_API_KEY, GEMINI_API_KEY } = process.env;

  try {
    // 1. Fetch live odds for Over/Under (Totals)
    const oddsRes = await axios.get('https://api.the-odds-api.com/v4/sports/soccer_epl/odds/', {
      params: { apiKey: ODDS_API_KEY, regions: 'uk', markets: 'totals', oddsFormat: 'decimal' }
    });

    const game = oddsRes.data[0];
    if (!game) return res.status(404).json({ error: "No games found" });

    // 2. Prepare the AI Prompt
    const prompt = `Match: ${game.home_team} vs ${game.away_team}. Market: Over/Under. Odds: ${JSON.stringify(game.bookmakers[0]?.markets[0])}. Provide a short prediction and confidence %.`;

    // 3. Get Consensus from AIs
    const groq = new Groq({ apiKey: GROQ_API_KEY });
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const [groqRes, geminiRes] = await Promise.all([
      groq.chat.completions.create({ messages: [{ role: 'user', content: prompt }], model: 'llama3-8b-8192' }),
      geminiModel.generateContent(prompt)
    ]);

    // 4. Create the Prediction Object
    const prediction = {
      match: `${game.home_team} vs ${game.away_team}`,
      timestamp: new Date().toISOString(),
      predictions: {
        groq: groqRes.choices[0].message.content,
        gemini: geminiRes.response.text()
      },
      status: "pending_result"
    };

    // 5. Save to Firebase
    const newRef = db.ref('hoyoo_predictions').push();
    await newRef.set(prediction);

    // 6. Return response
    return res.status(200).json({ id: newRef.key, ...prediction });

  } catch (error) {
    console.error("Hoyoo Engine Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
