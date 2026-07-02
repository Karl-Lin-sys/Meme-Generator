import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import "dotenv/config";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limit for base64 images
  app.use(express.json({ limit: "50mb" }));

  // API Route: Analyze Image & Generate Captions
  app.post("/api/captions", async (req, res) => {
    try {
      const { imageBase64, imageUrl, mimeType } = req.body;
      let base64Data = "";
      let finalMimeType = mimeType || "image/jpeg";

      if (imageBase64) {
        base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      } else if (imageUrl) {
        // Fetch image on the server side to avoid CORS
        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        base64Data = Buffer.from(arrayBuffer).toString("base64");
        const type = response.headers.get("content-type");
        if (type) finalMimeType = type;
      } else {
        return res.status(400).json({ error: "No image provided" });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [
          {
            inlineData: {
              mimeType: finalMimeType,
              data: base64Data,
            },
          },
          {
            text: "Analyze this image and suggest 5 extremely funny, highly relatable, and viral-worthy short meme captions for it. Keep them punchy and distinct from one another. Do not include hashtags.",
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
            },
            description: "An array of 5 short funny string captions.",
          },
        },
      });

      let jsonStr = response.text?.trim() || "[]";
      let captions = [];
      try {
        captions = JSON.parse(jsonStr);
      } catch (e) {
        console.error("Failed to parse JSON response:", jsonStr);
        captions = ["Caption parsing failed. Try again!"];
      }

      res.json({ captions });
    } catch (error: any) {
      console.error("Error generating captions:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API Route: Generate Image
  app.post("/api/generate-image", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "No prompt provided" });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-image-preview", // Specified by user
        contents: [
          {
            text: prompt,
          },
        ],
        config: {
          imageConfig: {
            aspectRatio: "1:1",
            imageSize: "1K",
          }
        }
      });
      
      let imageUrl = null;
      if (response.candidates && response.candidates.length > 0 && response.candidates[0].content && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const base64EncodeString: string = part.inlineData.data;
            imageUrl = `data:image/png;base64,${base64EncodeString}`;
            break;
          }
        }
      }

      if (imageUrl) {
         res.json({ imageUrl });
      } else {
         res.status(500).json({ error: "No image found in response" });
      }
    } catch (error: any) {
      console.error("Error generating image:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
