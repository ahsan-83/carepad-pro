require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { initializeConnection } = require("./config/database");
const path = require("path");
const helmet = require('helmet');

const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500, 
});


const app = express();
app.use(express.json());
app.enable('trust proxy');
app.use(cors());
app.use(helmet());
app.use(limiter);

app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    if (!req.secure) {
      return res.redirect('https://' + req.headers.host + req.url);
    }
  }
  next();
});

app.use((req, res, next) => {
  const allowedMethods = ['GET', 'POST', 'PUT','DELETE'];
  if (!allowedMethods.includes(req.method)) {
    return res.status(405).send('Method Not Allowed');
  }
  next(); // Proceed to the route handler
});

app.use(cors({
  origin: [
    "http://localhost:8080",
  ],
  methods: ["GET", "POST", "PUT","DELETE"],
  allowedHeaders: ["Content-Type", "Authorization","Verification","bmdc"],
}))

app.use(express.static(path.join(__dirname, "../client/dist")));

/*app.get("*", (_, res) => {
  res.sendFile(path.resolve(__dirname, "../client/dist/index.html"));
});*/

const authRoutes = require("./routes/authRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const patientRoutes = require("./routes/patientRoutes");
const consultationRoutes = require("./routes/consultationRoutes");
const eventRoutes = require("./routes/eventRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes")

app.use("/auth", authRoutes); 
app.use("/doctor", doctorRoutes);
app.use("/patients",patientRoutes);
app.use("/consultation",consultationRoutes);
app.use("/event",eventRoutes);
app.use("/feedback",feedbackRoutes);
app.use("/analytics",analyticsRoutes);


initializeConnection()
  .then((connection) => {
    const port = 3000;
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  }) 
  .catch((err) => {
    console.error("Error initializing database connection:", err);
  });
