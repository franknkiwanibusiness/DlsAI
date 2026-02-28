import Groq from "groq-sdk";
import admin from "firebase-admin";

// Global check to prevent "App already exists" error
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`
  });
}

const db = admin.database();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { home = "Test Team A", away = "Test Team B" } = req.query;

  try {
    // 1. TEST FIREBASE WRITE
    const testRef = db.ref('bridge_status');
    await testRef.set({ last_ping: new Date().toISOString(), status: "Online" });

    // 2. TEST GROQ BRAIN
    const groq = new Groq({ apiKey: process.env.EASYBET_API_KEY });
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: "Is the bridge active? Reply with JSON: {'active': true}" }],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" }
    });

    const brainCheck = JSON.parse(completion.choices[0].message.content);

    // 3. SUCCESS RESPONSE
    return res.status(200).json({
      bridge: "STABLE",
      firebase: "CONNECTED",
      brain: brainCheck.active ? "RECEPTIVE" : "OFFLINE",
      message: "Hoyoo AI is officially clever."
    });

  } catch (error) {
    return res.status(500).json({
      bridge: "FAILED",
      reason: error.message,
      tip: "If 'PEM' appears, your Private Key format is still slightly off."
    });
  }
}
