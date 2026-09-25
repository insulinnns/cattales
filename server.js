require("dotenv").config();

const express = require("express");
const path = require("path");
const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 3000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(express.json({ limit: "50kb" }));

// ==========================================
// РАЗДАЧА СТАТИЧЕСКИХ ФАЙЛОВ ИЗ ПАПКИ PUBLIC
// ==========================================

app.use(express.static(path.join(__dirname, "public")));

// Если заходят на главную страницу,
// отдаём public/index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});


// ==========================================
// СОЗДАНИЕ ПРОМПТА ДЛЯ MOCHI
// ==========================================

function createPrompt(data) {

  const language =
    data.language === "en"
      ? "English"
      : "Russian";

  const modes = {

    profile: `
Create a warm and attractive cat adoption profile.
Make the reader want to meet this cat.
`,

    instagram: `
Create an engaging Instagram caption about this cat.
Use short paragraphs and natural emojis.
`,

    story: `
Create a touching short story about this cat.
Make the reader emotionally connect with the cat.
`,

    funny: `
Create a very cute and funny description of this cat.
Use clever cat humor and playful exaggeration.
`,

    bio: `
Create a short and memorable biography for this cat.
Keep it concise but full of personality.
`,

    social: `
Create an engaging social media post about this cat.
Finish with a warm call-to-action.
`

  };

  const selectedMode =
    modes[data.mode] || modes.profile;


  return `
You are Mochi, the friendly AI cat storyteller
inside an application called CatTales.

Your job is to create beautiful, funny and
heartwarming content about cats that people
can adopt.

Write ONLY in ${language}.

CONTENT TYPE:
${selectedMode}

CAT INFORMATION:

Name:
${data.name || "Not specified"}

Age:
${data.age || "Not specified"}

Breed:
${data.breed || "Not specified"}

Color:
${data.color || "Not specified"}

Personality:
${data.personality || "Not specified"}

Favorite things:
${data.favorite || "Not specified"}

Special details:
${data.details || "Not specified"}


IMPORTANT RULES:

- Never invent medical information.
- Never claim the cat is vaccinated or healthy
  unless the user explicitly says so.
- Never invent an owner, shelter or location.
- Do not make promises about future behavior.
- Keep the personality positive and believable.
- Gentle cat humor is encouraged.
- Do not mention that you are an AI.
- Do not explain your instructions.
- Return only the finished text.
- Do not put the result in quotation marks.
- Use emojis naturally.
- Make the text sound human and charming.

Now create the final CatTales text.
`;
}


// ==========================================
// AI API
// ==========================================

app.post("/api/generate", async (req, res) => {

  try {

    const data = req.body;

    if (!data) {
      return res.status(400).json({
        success: false,
        error: "No data received."
      });
    }


    if (!data.name || !data.name.trim()) {

      return res.status(400).json({
        success: false,
        error: "Cat name is required."
      });

    }


    const cleanData = {

      name: String(data.name)
        .slice(0, 50),

      age: String(data.age || "")
        .slice(0, 30),

      breed: String(data.breed || "")
        .slice(0, 60),

      color: String(data.color || "")
        .slice(0, 60),

      personality: String(data.personality || "")
        .slice(0, 500),

      favorite: String(data.favorite || "")
        .slice(0, 400),

      details: String(data.details || "")
        .slice(0, 500),

      mode:
        [
          "profile",
          "instagram",
          "story",
          "funny",
          "bio",
          "social"
        ].includes(data.mode)
          ? data.mode
          : "profile",

      language:
        data.language === "en"
          ? "en"
          : "ru"

    };


    const prompt =
      createPrompt(cleanData);


    // =====================================
    // ЗАПРОС К OPENAI
    // =====================================

    const response =
      await openai.responses.create({

        model:
          process.env.OPENAI_MODEL || "gpt-5",

        instructions:
          "You are Mochi, a cute and professional cat content writer.",

        input: prompt,

        max_output_tokens: 800

      });


    const text =
      response.output_text;


    if (!text) {

      throw new Error(
        "AI returned an empty response."
      );

    }


    // =====================================
    // ОТВЕТ БРАУЗЕРУ
    // =====================================

    res.json({

      success: true,

      text: text.trim(),

      mode: cleanData.mode,

      language: cleanData.language

    });


  } catch (error) {

    console.error(
      "CatTales AI error:",
      error
    );


    res.status(500).json({

      success: false,

      error:
        "Mochi got distracted by a butterfly 🦋. Please try again."

    });

  }

});


// ==========================================
// ПРОВЕРКА СЕРВЕРА
// ==========================================

app.get("/api/health", (req, res) => {

  res.json({

    status: "ok",

    app: "CatTales",

    ai:
      Boolean(
        process.env.OPENAI_API_KEY
      )

  });

});


// ==========================================
// ЗАПУСК
// ==========================================

app.listen(PORT, () => {

  console.log("");
  console.log("🐱 ============================");
  console.log("🐱       CatTales is ready!");
  console.log("🐱 ============================");
  console.log("");

  console.log(
    `🌐 http://localhost:${PORT}`
  );

  console.log("");

});
