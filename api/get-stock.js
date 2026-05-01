// api/get-stock.js
export default async function handler(req, res) {
  const { pid } = req.query;
  const CJ_TOKEN = process.env.CJ_API_TOKEN; // Set this in Vercel Dashboard

  try {
    const response = await fetch(`https://developers.cjdropshipping.com/api2.0/product/stock?pid=${pid}`, {
      headers: { 'CJ-Access-Token': CJ_TOKEN }
    });
    const data = await response.json();

    // Summing up stock across all variants (White, Black, Red)
    const totalStock = data.data.reduce((acc, variant) => acc + variant.stock, 0);

    res.status(200).json({ stock: totalStock });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch stock" });
  }
}
