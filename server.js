require("dotenv").config();

const express = require("express");
const axios = require("axios");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");
const multer = require("multer");
const fs = require("fs");

const app = express();
const path = require("path");

const upload = multer({
    dest: "uploads/"
});

app.use(cors());
app.use(express.json());

// =========================
// Gemini AI
// =========================

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

console.log("Gemini Key:", process.env.GEMINI_API_KEY);
console.log("VT KEY:", process.env.VT_API_KEY);
// =========================
// VirusTotal Scan
// =========================

app.post("/scan-url", async (req, res) => {

    const { url } = req.body;

    try {

        const scanResponse = await axios.post(
            "https://www.virustotal.com/api/v3/urls",
            new URLSearchParams({ url }),
            {
                headers: {
                    "x-apikey": process.env.VT_API_KEY,
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            }
        );

        const analysisId = scanResponse.data.data.id;

        let result = null;

        for (let i = 0; i < 10; i++) {

            await new Promise(resolve => setTimeout(resolve, 2000));

            const response = await axios.get(
                `https://www.virustotal.com/api/v3/analyses/${analysisId}`,
                {
                    headers: {
                        "x-apikey": process.env.VT_API_KEY
                    }
                }
            );

            if (response.data.data.attributes.status === "completed") {
                result = response.data;
                break;
            }

        }

        if (!result) {
            return res.status(408).json({
                error: "الفحص لم يكتمل."
            });
        }

        res.json(result);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            error: error.message
        });

    }

});

// =========================
// Gemini Chat
// =========================

app.post("/chat", async (req, res) => {

    try {

        const { message } = req.body;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: message
        });

        res.json({
            reply: response.text
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            error: error.message
        });

    }

});

// =========================
// Image Scan
// =========================

app.post("/scan-image", upload.single("image"), async (req, res) => {

    try {

        console.log("📸 وصل طلب فحص صورة");

        if (!req.file) {
            return res.status(400).json({
                error: "لم يتم رفع صورة."
            });
        }

        console.log("✅ اسم الصورة:", req.file.originalname);

        const imageBytes = fs.readFileSync(req.file.path);
        const base64Image = imageBytes.toString("base64");

        const response = await ai.models.generateContent({

            model: "gemini-2.5-flash",

            contents: [

                {
                    inlineData: {
                        mimeType: req.file.mimetype,
                        data: base64Image
                    }
                },

                {
                    text: `حلل هذه الصورة باللغة العربية.

اذكر:

- هل الصورة حقيقية أم مولدة بالذكاء الاصطناعي؟
- هل يوجد أي تلاعب واضح؟
- هل يمكن الوثوق بها؟
- أعطِ ملخصًا قصيرًا للمستخدم.`
                }

            ]

        });

        fs.unlinkSync(req.file.path);

        res.json({
            reply: response.text
        });

    } catch (error) {

        console.log("===== IMAGE ERROR =====");
        console.log(error);

        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            error: error.message
        });

    }

});

// =========================
// Home
// =========================

app.use(express.static(__dirname));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// =========================
// Start Server
// =========================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});