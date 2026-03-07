const dns = require("node:dns/promises");
// Manually setting DNS prevents Render's internal lookup delays
dns.setServers(["1.1.1.1", "8.8.8.8"]);

// 1. REQUIREMENTS FIRST
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const axios = require("axios"); 
const connectDB = require("./config/db");

// 2. INITIALIZE APP AFTER REQUIREMENTS
const app = express(); 

// 3. MODELS & ROUTES
const Course = require("./models/Course");
const Purchase = require("./models/Purchase");
const Notification = require("./models/Notification");
const purchaseRoutes = require("./routes/purchaseRoutes");
const shortsRoutes = require("./routes/shortsRoutes");
const progressRoutes = require("./routes/progressRoutes");

// 4. DATABASE & ENV CONFIG
dotenv.config();
connectDB();
Purchase.syncIndexes();

// 5. MIDDLEWARE
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = [
    'https://pimentor.github.io',
    'http://localhost:3000',
    'http://localhost:5000'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('netlify.app')) {
            return callback(null, true);
        } else {
            return callback(new Error('CORS Policy Error: Origin not allowed'), false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 6. API ROUTES
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/purchase", purchaseRoutes);
app.use("/api/payment", require("./routes/paymentRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/shorts", shortsRoutes);
app.use("/api/progress", progressRoutes);

// 7. RENDER KEEP-ALIVE & HEALTH CHECKS
app.get("/api/health-check", (req, res) => {
    res.status(200).send("PiMentor is Awake");
});

app.get("/", (req, res) => {
    res.send("PiMentor API is running successfully.");
});

const RENDER_URL = "https://pimentor-project.onrender.com/api/health-check"; 
setInterval(async () => {
    try {
        const response = await axios.get(RENDER_URL);
        console.log(`[Keep-Alive]: Pinged at ${new Date().toLocaleString()} - Status: ${response.data}`);
    } catch (error) {
        console.log(`[Keep-Alive]: Waiting for server...`);
    }
}, 14 * 60 * 1000); 

app.get('/api/notifications/latest', async (req, res) => {
    try {
        const latest = await Notification.findOne().sort({ createdAt: -1 });
        if (!latest) return res.json({ new_alert: false });
        res.status(200).json({
            new_alert: true, 
            message: `${latest.heading}: ${latest.description}`,
            id: latest._id.toString() 
        });
    } catch (error) {
        console.error("Poll Error:", error);
        res.status(500).json({ new_alert: false });
    }
});

// 8. START SERVER
const PORT = process.env.PORT || 10000; 
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});