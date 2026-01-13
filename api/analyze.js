import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "../firebase-config.js"; // Import your initialized db
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    try {
        const { imageBase64, mimeType } = req.body;
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash" });

        const prompt = "Analyze this DLS squad image. Count Legendary and Rare players. Calculate value ($10/Legendary, $4/Rare). Return ONLY JSON: {'value': 0, 'legendary': 0, 'rare': 0}";

        // Call Gemini
        const result = await model.generateContent([
            prompt,
            { inlineData: { data: imageBase64, mimeType: mimeType } }
        ]);

        const aiResponse = JSON.parse(result.response.text());

        // Save to your Firestore (itzhoyoo-f9f7e)
        const docRef = await addDoc(collection(db, "valuations"), {
            ...aiResponse,
            createdAt: serverTimestamp()
        });

        res.status(200).json({ id: docRef.id, ...aiResponse });
    } catch (error) {
        console.error("Vercel Backend Error:", error);
        res.status(500).json({ error: "Analysis Failed" });
    }
}
