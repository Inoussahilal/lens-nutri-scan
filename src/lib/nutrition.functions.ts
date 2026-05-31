import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  imageBase64: z.string().min(10).max(8_000_000),
  mediaType: z.enum(["image/jpeg", "image/png", "image/webp"]).default("image/jpeg"),
});

export const analyzeFood = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI service not configured");

    const prompt = `You are a precise nutritionist AI. Analyze the food in this image and return ONLY a valid JSON object (no markdown, no prose) with this exact shape:
{
  "foodName": string,
  "emoji": string (single food emoji),
  "calories": number,
  "protein_g": number,
  "carbs_g": number,
  "fat_g": number,
  "serving_size": string,
  "confidence_percent": number (0-100),
  "ingredients": [{ "name": string, "calories": number }]
}
Be realistic. If no food is detected, set calories to 0 and confidence_percent low.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: `data:${data.mediaType};base64,${data.imageBase64}` } },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 429) throw new Error("Rate limit reached. Try again in a moment.");
      if (res.status === 402) throw new Error("AI credits exhausted. Add credits in Workspace settings.");
      throw new Error(`AI error: ${text.slice(0, 200)}`);
    }

    const json = await res.json();
    const raw: string = json?.choices?.[0]?.message?.content ?? "";
    const cleaned = raw.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("Could not parse AI response");
    const parsed = JSON.parse(cleaned.slice(start, end + 1));

    return {
      foodName: String(parsed.foodName ?? "Unknown food"),
      emoji: String(parsed.emoji ?? "🍽️"),
      calories: Math.max(0, Math.round(Number(parsed.calories) || 0)),
      protein_g: Math.max(0, Math.round(Number(parsed.protein_g) || 0)),
      carbs_g: Math.max(0, Math.round(Number(parsed.carbs_g) || 0)),
      fat_g: Math.max(0, Math.round(Number(parsed.fat_g) || 0)),
      serving_size: String(parsed.serving_size ?? "1 serving"),
      confidence_percent: Math.max(0, Math.min(100, Math.round(Number(parsed.confidence_percent) || 0))),
      ingredients: Array.isArray(parsed.ingredients)
        ? parsed.ingredients.slice(0, 12).map((i: any) => ({
            name: String(i?.name ?? ""),
            calories: Math.max(0, Math.round(Number(i?.calories) || 0)),
          }))
        : [],
    };
  });
