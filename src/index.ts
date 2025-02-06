import express, { Request, Response } from "express";
import dotenv from "dotenv";
import axios from "axios";
const expiry_date = "2025-02-06"
const baseInstrument = { name: "NIFTY", Symbol: "NSE_INDEX|Nifty 50" }

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.get("/", (req: Request, res: Response) => {
    res.send("Hello");
});
app.get("/fetch2", async (req: Request, res: Response) => {
    try {
        const access_token = process.env.accessToken
        let config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: `https://api.upstox.com/v2/option/chain?expiry_date=${expiry_date}&instrument_key=${baseInstrument.Symbol}`,
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${access_token}`
            }
        };
        const response = await axios(config)
        const data= response.data
    
        res.json(data)
    } catch (error) {
        console.log(error)

    }
})
app.get("/fetch", async (req: Request, res: Response) => {

    let config = {
        method: 'POST',
        maxBodyLength: Infinity,
        url: process.env.c2tDataUrl,
        headers: {
            'Accept': 'application/json',
        }
    };

    const response = await axios(config)

    const instrumentData = response.data
    const niftyData = instrumentData.NSE[baseInstrument.name]
    const filteredData = []
    Object.keys(niftyData).map((key, value) => {
        if (key.includes(expiry_date)) filteredData.push({ expiry_date: key.split(" : ")[0], strike: Number(key.split(" : ")[1]), options: niftyData[key] })
    })

    filteredData.sort((a, b) => Number(a.strike) - Number(b.strike))


    res.json(filteredData);
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
