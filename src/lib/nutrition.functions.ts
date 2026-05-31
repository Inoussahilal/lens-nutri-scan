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

    const prompt = `You are a professional nutritionist AI. Analyze this food photo.
Return ONLY valid JSON, no markdown, no explanation:
{
  "foodName": "descriptive meal name",
  "emoji": "1 relevant food emoji",
  "calories": number,
  "protein_g": number,
  "carbs_g": number,
  "fat_g": number,
  "fiber_g": number,
  "serving_size": "e.g. 1 bowl ~350g",
  "confidence_percent": number,
  "meal_type": "breakfast|lunch|dinner|snack",
  "health_score": number between 1 and 10,
  "tip": "one short nutrition tip",
  "ingredients": [{ "name": "string", "calories": number, "amount": "string" }]
}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
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
      if (res.status === 429) throw new Error("Rate limit reached. Try again soon.");
      if (res.status === 402) throw new Error("AI credits exhausted.");
      throw new Error(`AI error: ${text.slice(0, 200)}`);
    }

    const json = await res.json();
    const raw: string = json?.choices?.[0]?.message?.content ?? "";
    const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
    const s = cleaned.indexOf("{");
    const e = cleaned.lastIndexOf("}");
    if (s === -1 || e === -1) throw new Error("Could not parse AI response");
    const p = JSON.parse(cleaned.slice(s, e + 1));

    const meal = ["breakfast", "lunch", "dinner", "snack"].includes(p.meal_type) ? p.meal_type : "snack";
    return {
      foodName: String(p.foodName ?? "Unknown food"),
      emoji: String(p.emoji ?? "🍽️"),
      calories: Math.max(0, Math.round(Number(p.calories) || 0)),
      protein_g: Math.max(0, Math.round(Number(p.protein_g) || 0)),
      carbs_g: Math.max(0, Math.round(Number(p.carbs_g) || 0)),
      fat_g: Math.max(0, Math.round(Number(p.fat_g) || 0)),
      fiber_g: Math.max(0, Math.round(Number(p.fiber_g) || 0)),
      serving_size: String(p.serving_size ?? "1 serving"),
      confidence_percent: Math.max(0, Math.min(100, Math.round(Number(p.confidence_percent) || 0))),
      meal_type: meal as "breakfast" | "lunch" | "dinner" | "snack",
      health_score: Math.max(1, Math.min(10, Math.round(Number(p.health_score) || 5))),
      tip: String(p.tip ?? ""),
      ingredients: Array.isArray(p.ingredients)
        ? p.ingredients.slice(0, 12).map((i: { name?: unknown; calories?: unknown; amount?: unknown }) => ({
            name: String(i?.name ?? ""),
            calories: Math.max(0, Math.round(Number(i?.calories) || 0)),
            amount: String(i?.amount ?? ""),
          }))
        : [],
    };
  });
