import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";

export interface PagePayload {
  pageNum: number;
  text: string;
}

export type TranslationTarget = "hindi" | "hinglish" | "english";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const pages: PagePayload[] = body?.pages || [];
    const targetLanguage: TranslationTarget = body?.targetLanguage || "hindi";

    if (!Array.isArray(pages) || pages.length === 0) {
      return NextResponse.json(
        { success: false, error: "No page text provided to translate." },
        { status: 400 }
      );
    }

    // Limit to max 2 pages per request (current reading spread)
    const activePages = pages.slice(0, 2).filter((p) => p.text && p.text.trim().length > 0);

    if (activePages.length === 0) {
      return NextResponse.json(
        { success: false, error: "This page does not contain selectable text." },
        { status: 400 }
      );
    }

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.Gemini_API_Key ||
      process.env.GEMINI_KEY ||
      process.env.GOOGLE_API_KEY ||
      "";

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Translation service is not configured. Please add an API key in .env.",
        },
        { status: 503 }
      );
    }

    const targetDesc =
      targetLanguage === "hindi"
        ? "Hindi (Devanagari script)"
        : targetLanguage === "hinglish"
        ? "Hinglish (Natural conversational Hindi written in Roman / Latin script, e.g. 'Yeh jeevan vartamaan mein hi ghatit ho raha hai')"
        : "English";

    const promptText = activePages
      .map((p) => `--- PAGE ${p.pageNum} ---\n${p.text.slice(0, 4000)}`)
      .join("\n\n");

    const systemInstruction = `
You are an expert literary and educational translator for the "Reader's HUB" digital library.
Your task is to translate the provided book page text into ${targetDesc}.

CRITICAL TRANSLATION GUIDELINES:
1. Target language: ${targetDesc}.
2. If target is "hinglish": Produce natural, conversational, and culturally authentic Hindi written in English/Latin letters (Roman Hindi). Do NOT invent bizarre slang. Keep it clear, eloquent, and easy to read.
3. If target is "hindi": Produce grammatically correct, natural Hindi in Devanagari script.
4. If target is "english": Produce fluent, articulate English.
5. Preserve paragraph structures and line breaks where appropriate.
6. Return your translation strictly formatted as a valid JSON object where keys are the page numbers as strings and values are the translated text for that page:
{
  "${activePages[0].pageNum}": "translated text for page ${activePages[0].pageNum}..."${
      activePages.length > 1
        ? `,\n  "${activePages[1].pageNum}": "translated text for page ${activePages[1].pageNum}..."`
        : ""
    }
}
`;

    const ai = new GoogleGenAI({ apiKey });
    // Prioritize high-speed active models with graceful fallback
    const modelsToTry = [
      "gemini-3.1-flash-lite-preview",
      "gemini-3-flash-preview",
      "gemini-3.1-flash-lite",
      "gemini-3.6-flash",
      "gemini-3.7-flash",
    ];
    let rawOutput = "";

    for (const model of modelsToTry) {
      try {
        // Fast per-model timeout to ensure the UI gets an instant response without hanging
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout on model ${model}`)), 7500)
        );

        const generatePromise = ai.models.generateContent({
          model,
          contents: [
            {
              role: "user",
              parts: [{ text: promptText }],
            },
          ],
          config: {
            systemInstruction,
            temperature: 0.3,
            responseMimeType: "application/json",
          },
        });

        const response = await Promise.race([generatePromise, timeoutPromise]);
        rawOutput = response.text || "";
        if (rawOutput) break;
      } catch (err: any) {
        console.warn(`[Translate API] Model ${model} failed, trying next fallback...`, err?.message || err);
      }
    }

    if (!rawOutput) {
      return NextResponse.json(
        { success: false, error: "Translation service temporarily unavailable. Please try again." },
        { status: 502 }
      );
    }

    try {
      const cleaned = rawOutput
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      const parsedTranslations = JSON.parse(cleaned);
      const formattedResult: Record<number, string> = {};

      for (const p of activePages) {
        formattedResult[p.pageNum] =
          parsedTranslations[String(p.pageNum)] ||
          parsedTranslations[p.pageNum] ||
          parsedTranslations[`PAGE ${p.pageNum}`] ||
          "";
      }

      return NextResponse.json({
        success: true,
        targetLanguage,
        translations: formattedResult,
      });
    } catch {
      // Fallback if model returned plain string
      const formattedResult: Record<number, string> = {};
      formattedResult[activePages[0].pageNum] = rawOutput.replace(/```json|```/g, "").trim();
      return NextResponse.json({
        success: true,
        targetLanguage,
        translations: formattedResult,
      });
    }
  } catch (error: any) {
    console.error("[Translate API] Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred while translating. Please try again." },
      { status: 500 }
    );
  }
}

