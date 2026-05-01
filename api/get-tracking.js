export default async function handler(req, res) {
    const { orderId } = req.query; // This is the 'M-XXXX' ID from your Firebase
    const CJ_TOKEN = process.env.CJ_DROPSHIPPING_TOKEN;

    try {
        // CJ V2 API Tracking Endpoint
        const response = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/logistic/getTrackingInfo?orderId=${orderId}`, {
            method: 'GET',
            headers: { 'CJ-Access-Token': CJ_TOKEN }
        });

        const result = await response.json();

        if (result.code === 200 && result.data) {
            // Returns the array of tracking events
            return res.status(200).json({ success: true, updates: result.data });
        } else {
            return res.status(200).json({ success: false, message: "Order still processing" });
        }
    } catch (error) {
        res.status(500).json({ error: "Tracking system offline" });
    }
}
