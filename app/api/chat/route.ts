import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import {
  tryDeterministicQuery,
  getCompactCatalogSummary,
  findBooksByIds,
  AssistantResponse,
} from "@/lib/library-assistant";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userMessage: string = (body?.message || "").trim();

    if (!userMessage) {
      return NextResponse.json(
        { reply: "Please enter a question about Reader's HUB books or library availability.", books: [] },
        { status: 400 }
      );
    }

    if (userMessage.length > 800) {
      return NextResponse.json(
        { reply: "Your question is too long. Please ask a more concise question about the library.", books: [] },
        { status: 400 }
      );
    }

    // -------------------------------------------------------------
    // Step 1: SEARCH FIRST (Deterministic fast path with zero AI latency)
    // -------------------------------------------------------------
    const deterministicResult = tryDeterministicQuery(userMessage);
    if (deterministicResult) {
      return NextResponse.json(deterministicResult);
    }

    // -------------------------------------------------------------
    // Step 2: GEMINI API GROUNDED INFERENCE
    // -------------------------------------------------------------
    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.Gemini_API_Key ||
      process.env.GEMINI_KEY ||
      process.env.GOOGLE_API_KEY ||
      "";

    if (!apiKey) {
      return NextResponse.json({
        reply: "I couldn't find a direct match. Try asking about a specific book title, author (e.g. Osho, Plato, Premchand), or genre category in Reader's HUB.",
        books: [],
        suggestedActions: ["Browse categories", "What's available?"],
      });
    }

    const catalogSummary = getCompactCatalogSummary();

    const systemInstruction = `
You are the "Reader's HUB Assistant", a polite, concise, and focused library guide for the Reader's HUB digital book platform.

CRITICAL RULES (ABSOLUTE):
1. The catalog provided below is the ONLY source of truth for book availability in Reader's HUB.
2. NEVER invent books, authors, genres, ratings, or external URLs that do not exist in this catalog.
3. If a user asks for a book or author not in this catalog, state clearly that it is NOT currently available in Reader's HUB.
4. If a user asks an unrelated question (such as writing code, weather, general world facts, politics, jokes, math), do NOT answer it normally. Politely reply with:
   "I'm here specifically to help you explore the Reader's HUB library. Try asking me about a book, author, category, or availability."
5. Format your response strictly as a valid JSON object with the following structure:
{
  "reply": "Clear, concise, markdown-formatted conversational answer (1-3 sentences).",
  "bookIds": ["exact-id-from-catalog", "exact-id-2"],
  "suggestedActions": ["Short action 1", "Short action 2"]
}

READER'S HUB LIBRARY CATALOG:
${catalogSummary}
`;

    const ai = new GoogleGenAI({ apiKey });

    // Try primary models with graceful fallback
    const modelsToTry = ["gemini-3.7-flash", "gemini-3.5-flash-lite", "gemini-2.5-flash"];
    let rawOutput = "";

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              role: "user",
              parts: [{ text: userMessage }],
            },
          ],
          config: {
            systemInstruction,
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        });

        rawOutput = response.text || "";
        if (rawOutput) break;
      } catch (err: any) {
        console.warn(`Model ${model} failed, trying fallback...`, err?.message || err);
      }
    }

    if (rawOutput) {
      try {
        const parsed = JSON.parse(rawOutput);
        const matchingBooks = findBooksByIds(parsed.bookIds || []);

        const finalResponse: AssistantResponse = {
          reply: parsed.reply || "Here is what I found in the Reader's HUB library:",
          books: matchingBooks,
          suggestedActions: parsed.suggestedActions || ["Browse categories", "What's available?"],
        };

        return NextResponse.json(finalResponse);
      } catch {
        // Fallback for non-json text response
        return NextResponse.json({
          reply: rawOutput.replace(/```json|```/g, "").trim(),
          books: [],
          suggestedActions: ["Browse categories", "What's available?"],
        });
      }
    }

    // Default graceful fallback
    return NextResponse.json({
      reply: "I'm having a brief connection issue with the AI service. You can browse all categories or search for specific books like 1984, Atomic Habits, or Meditations directly in Reader's HUB!",
      books: [],
      suggestedActions: ["What's available?", "Browse categories"],
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        reply: "I encountered an error processing your request. Please try asking about a specific book or category in Reader's HUB.",
        books: [],
      },
      { status: 500 }
    );
  }
}
