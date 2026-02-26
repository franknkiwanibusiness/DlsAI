import os
import json
from http.server import BaseHTTPRequestHandler
import google.generativeai as genai
from groq import Groq

# Configure Clients
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
groq_client = Groq(api_key=os.environ.get("EASYBET_API_KEY"))

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data)

        home, away = data['home'], data['away']
        odds = f"H: {data['h']}, D: {data['d']}, A: {data['a']}"

        try:
            # STEP 1: Research using Gemma 3 4B (via Gemini API)
            # Gemma 3 4B is excellent for reasoning and concise research
            gemma_model = genai.GenerativeModel('gemma-3-4b-it')
            research_query = f"Provide a brief tactical preview for {home} vs {away}. Focus on who is likely to dominate and why. 2 sentences max."
            research_text = gemma_model.generate_content(research_query).text

            # STEP 2: Market Analysis using Llama 3.1 8B (via Groq Free Tier)
            # This model has the highest free-tier rate limits (14.4k RPD)
            completion = groq_client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": "You are an expert bet analyst. Using the research provided, pick the most likely betting market. Return ONLY JSON: {\"market\": \"string\", \"confidence\": \"number%\", \"reason\": \"string\"}"},
                    {"role": "user", "content": f"Research: {research_text}\nOdds: {odds}"}
                ],
                response_format={"type": "json_object"}
            )
            
            ai_analysis = json.loads(completion.choices[0].message.content)
            response_data = {
                "research": research_text,
                "market": ai_analysis.get("market"),
                "confidence": ai_analysis.get("confidence"),
                "reason": ai_analysis.get("reason")
            }

        except Exception as e:
            response_data = {"error": str(e), "market": "N/A", "research": "Service temporarily unavailable."}

        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(response_data).encode())
