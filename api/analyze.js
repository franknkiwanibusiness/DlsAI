import { GoogleGenerativeAI } from "@google/generative-ai";
import admin from "firebase-admin";

if (!admin.apps.length) {
    try {
        // This regex handles both single \n and double \\n common in Vercel
        const privateKey = process.env.FIREBASE_PRIVATE_KEY
            ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/gm, '\n')
            : undefined;

        // Validation check: If the key doesn't start correctly, it will show in logs
        if (!privateKey || !privateKey.includes("BEGIN PRIVATE KEY")) {
            console.error("FIREBASE_PRIVATE_KEY is missing or incorrectly formatted");
        }

        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            })
        });
        console.log("Firebase initialized successfully");
    } catch (e) {
        console.error("Firebase Init Error:", e.message);
    }
}
const db = admin.firestore();
