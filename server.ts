import express from "express";
import { createServer as createViteServer } from "vite";
import admin from "firebase-admin";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Serve PWA files directly at the root level BEFORE any other middleware
// This prevents Vite or other middleware from redirecting these requests
app.use(express.static(path.join(__dirname, "public")));

// Firebase Admin Initialization using provided Service Account JSON
const serviceAccount = {
  type: "service_account",
  project_id: "smart-salon-da136",
  private_key_id: "c545fb7c5c13e70ade4753f35c48c24e42c2c0b5",
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDfq9ajdEsAXah3\nrJeWIAUQPAFGqmxKAzF8/Kog9FMAKLbaYOMvH+lCPxGEoOa/BZhQsF8pPfPSi3xT\nwXdgdkSE0lWWOGizbyp3mWOkfXk3x58pZXXJUhnH9W5/3i7jIh4go/I1AuhHklxT\n4NDU10X4TmQllLJpwfFaRlufzUgrAXk5UKH6HLSHgBj6JeZpXAtp1qH18Ps9L/1Z\nseZklhAWMFCrd9la1BVfQLoLxSIzyoPz0hJ7EtUa4/ubPRLZj681JE7QXG2QYXy6\noilQjTKdnfpYsh9X4s9vuB/Ff+YE150ZhvNMRMWifomCTv1YISUlbo+x4jnI94QZ\nEkeKaQJ/AgMBAAECggEACJ748OfklCkH+0Tdut2VFGEbs3uSHPAukiCy9f40zMbE\n9XnSh9h1ByajKDeDbU1r54BEyrQml7Dko93LGh602WG6BsY50uCwBFgXLRng+DNr\ngQ72EUJm1/wvvCH2MK759kwbY8uu5ENR57G8mteJTN7IoWIv1j+xa8dWdLxW0cF0\nVBIugkl/I8H0D/zCsgHAz9/uYCrZHj59Y/Ze95u/MRXQ+MhQmnuxewy6an3FhK7g\npwKXQ6w5QPZlqBJ7muGp2JGEXKhIYg9xlUPvqv90oOHWjdo4cJndKOQ/GSu5gMjJ\nHEExMzgTjk3by9w6EuAFdZ0PyMZMyeLystNmRbdxMQKBgQD2/cgR+krBOZboZjvU\nR7aEA8y+NF24WKDwLTB1Vz2I7FnMggWPyHwBwvatyDVe/tKk7GJBsKL3MEG8TEOh\nVhOvntu/VcvVZ7oKThoFo7/VpOFec7s2LX/gJZoSkRV7mOKQEaCRM9fdw49syFgC\nt1a8UFfQFoFLJim3oEKn9y1XtQKBgQDn1E+//WMiz1H/8A5Ik+tf6U7Hkm06ROCS\nGA7TkAKBZ1qqaPYZc+kBSv0UP30dJ/SyCvWQgrxj+nqo3QwfsMJCP8xrLeHEt13n\n6dgbrOQaQHFDwTZS4zX2Gr9lO20vYwJwcnw6U3tryOZi4uf8ixfNz1xVNdJIARUW\nRlSuQi9p4wKBgQDqPtgfzLxXM1IfCM6XTogX/i6Q+cMk0dGY15LMxreSg23LGklC\nC0couIoRWP7dIFoQliu911NHklnVxpKhkaxL9CK+/RS7SYvUuCvPy3Rln+EqHiKg\niFht8duE3lp8hQvizQT2kS+aoB0Hc56cvNqi8KPHs4BeEEyiXXi6Kh+zvQKBgGvl\rrBmmEtNPpbl/V/eKIBdL+NGzTt/bx3PwKbKsb/UgKgrbc7u2ZVWd2+DFRIK1KJA\n44W8sz29CHWrW8csF12KH/QKSLeruDMF7SUEVK27LHwiYsw1H5pJXKca/3g8lpgL\nULI8xIan3EJN5Tbu7cdGKW0nPZVxm4Tgeu0XtMWNAoGBAM5xuU2/ZOOYH+Q/Tp0g\n4u6DBRTF3Ty+4+vwTRNElSNs8MjDUvHYrj9GLwfaG/Nv01Nb07XdmPgQfg+WtVSV\nY7hTlQmLZKJVtkWTxSS5PhDF1F2hER5Du2M9EJMIzZ6wzrrhE0j8RPaTWPD474oR\nCnFazroQ1Q7UjPn2TVGlps9A\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-fbsvc@smart-salon-da136.iam.gserviceaccount.com",
  client_id: "108978241144575016105",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40smart-salon-da136.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as any),
  });
}

// API Route to send FCM V1 Notification
app.post("/api/send-notification", async (req, res) => {
  const { token, title, body, icon } = req.body;

  if (!token) {
    return res.status(400).json({ error: "FCM token is required" });
  }

  const message = {
    notification: {
      title,
      body,
    },
    android: {
      notification: {
        icon: icon || "stock_ticker_update",
        color: "#f59e0b",
      },
    },
    webpush: {
      notification: {
        icon: icon || "https://ais-dev-oookh6ajim5rhzro6nj7vx-171583610141.asia-east1.run.app/favicon.ico",
        badge: icon || "https://ais-dev-oookh6ajim5rhzro6nj7vx-171583610141.asia-east1.run.app/favicon.ico",
      },
    },
    token: token,
  };

  try {
    const response = await admin.messaging().send(message);
    console.log("Successfully sent message:", response);
    res.json({ success: true, messageId: response });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Failed to send notification" });
  }
});

// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
