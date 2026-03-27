export default function handler(req, res) {
  const key = process.env.EASYBET_API_KEY;
  if (!key) return res.status(500).json({ error: "Key Missing" });
  res.status(200).json({ apiKey: key });
}
