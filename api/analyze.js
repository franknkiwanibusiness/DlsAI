import { GoogleGenerativeAI } from "@google/generative-ai";
import admin from "firebase-admin";

// Firebase initialization remains same...

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

    const { imageBase64 } = req.body;
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // THE FALLBACK LIST: Try in this order
    const modelsToTry = ["gemma-3-12b-it", "gemma-3-4b-it", "gemini-1.5-flash"];
    
    for (const modelId of modelsToTry) {
        try {
            console.log(`Scanning with ${modelId}...`);
            const model = genAI.getGenerativeModel({ model: modelId });

            const prompt = `Identify DLS player cards. Count Gold (Legendary) and Blue (Rare). JSON ONLY: {"value": 0, "legendary": 0, "rare": 0}`;

            const result = await model.generateContent([
                { inlineData: { data: imageBase64, mimeType: "image/jpeg" } },
                prompt
            ]);

            const responseText = result.response.text().replace(/```json|```/g, "").trim();
            const aiData = JSON.parse(responseText);

            // SUCCESS: Save to DB and return
            await db.collection("valuations").add({
                ...aiData,
                modelUsed: modelId, // Track which model actually worked!
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });

            return res.status(200).json(aiData);

        } catch (error) {
            console.error(`${modelId} failed:`, error.message);
            // If this was the last model, we give up and send an error
            if (modelId === modelsToTry[modelsToTry.length - 1]) {
                return res.status(503).json({ error: "All AI models are busy. Please try again." });
            }
            // Otherwise, the 'continue' is implicit and it tries the next modelId in the loop
        }
    }
}
