import express from "express";
import cors from "cors";
import { OpenAI } from "openai";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/api/chatkit/session", async (req, res) => {
  try {
    const session = await openai.chatkit.sessions.create({});
    res.json({ client_secret: session.client_secret });
  } catch (e) {
    console.error("ChatKit session error:", e);
    res.status(500).json({ error: "failed_to_create_session" });
  }
});

const PORT = 3101;
app.listen(PORT, "127.0.0.1", () =>
  console.log(`[chatkit] session server on http://127.0.0.1:${PORT}`)
);
