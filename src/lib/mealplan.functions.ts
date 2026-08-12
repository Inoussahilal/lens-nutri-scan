import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  mode: z.enum(["plan", "alternative"]).default("plan"),
  calorieGoal: z.number().min(800).max(6000),
  mealsPerDay: z.number().min(1).max(8),
  dietType: z.string().max(80).default("all"),
  language: z.enum(["fr", "en"]).default("fr"),
  country: z.string().max(60).optional(),
  ingredients: z.string().max(600).optional(),
});

export type MealPlanInput = z.infer<typeof InputSchema>;

export interface PlanMeal {
  mealNumber: number;
  mealName: string;
  dish: string;
  description: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  ingredients: string[];
}
export interface PlanDay {
  day: number;
  dayName: string;
  totalCalories: number;
  meals: PlanMeal[];
}
export interface MealPlan {
  summary: string;
  weeklyPattern: string;
  days: PlanDay[];
  calorieGoal: number;
  mealsPerDay: number;
  createdAt: number;
}

export const generateMealPlan = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }): Promise<MealPlan> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI service not configured");

    const lang = data.language === "fr" ? "French" : "English";
    const countryNote = data.country
      ? data.mode === "alternative"
        ? `User is based in ${data.country}. Use ingredients commonly found in ${data.country} as inspiration even if the user did not mention them.`
        : `User is based in ${data.country}. Prioritize dishes and ingredients that are commonly available and affordable in ${data.country}. For West African countries, include local dishes like riz sauce, alloco, gari, pâte, fufu, thiéboudienne, yassa etc. when appropriate. Always balance local dishes with international options.`
      : "";

    const base = `Return ONLY a valid JSON object, no markdown:
{
  "summary": "brief intro sentence about the plan",
  "weeklyPattern": "explanation of the weekly rotation",
  "days": [
    { "day": 1, "dayName": "day name + number", "totalCalories": number,
      "meals": [ { "mealNumber": 1, "mealName": "meal label", "dish": "dish name", "description": "brief description", "calories": number, "protein_g": number, "carbs_g": number, "fat_g": number, "ingredients": ["a","b","c"] } ] }
  ]
}
Exactly 30 days, each with exactly ${data.mealsPerDay} meals. Keep descriptions under 12 words. Day totals close to ${data.calorieGoal} kcal.`;

    const prompt =
      data.mode === "alternative"
        ? `You are a nutritionist AI.
The user has these ingredients available daily: ${data.ingredients ?? ""}
Daily calorie goal: ${data.calorieGoal} kcal
Meals per day: ${data.mealsPerDay}
Language: ${lang}
${countryNote}
Create a NEW complete 30-day meal plan using ONLY these available ingredients (or combinations of them). Be creative — vary preparations, cooking methods and combinations so each day is different.
${base}`
        : `You are a professional nutritionist AI. Create a complete 30-day meal plan in ${lang}.
User profile:
- Daily calorie goal: ${data.calorieGoal} kcal
- Meals per day: ${data.mealsPerDay}
- Diet type: ${data.dietType}
${countryNote}
Vary the dishes — do not repeat the same dish more than twice per week. Include diverse cuisines.
${base}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        max_tokens: 32000,
        messages: [{ role: "user", content: prompt }],
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

    const days: PlanDay[] = (Array.isArray(p.days) ? p.days : []).map((d: any, i: number) => {
      const meals: PlanMeal[] = (Array.isArray(d?.meals) ? d.meals : []).map((m: any, j: number) => ({
        mealNumber: Number(m?.mealNumber) || j + 1,
        mealName: String(m?.mealName ?? ""),
        dish: String(m?.dish ?? ""),
        description: String(m?.description ?? ""),
        calories: Math.max(0, Math.round(Number(m?.calories) || 0)),
        protein_g: Math.max(0, Math.round(Number(m?.protein_g) || 0)),
        carbs_g: Math.max(0, Math.round(Number(m?.carbs_g) || 0)),
        fat_g: Math.max(0, Math.round(Number(m?.fat_g) || 0)),
        ingredients: Array.isArray(m?.ingredients) ? m.ingredients.slice(0, 12).map((x: unknown) => String(x)) : [],
      }));
      return {
        day: Number(d?.day) || i + 1,
        dayName: String(d?.dayName ?? `Day ${i + 1}`),
        totalCalories:
          Math.round(Number(d?.totalCalories)) || meals.reduce((a, m) => a + m.calories, 0),
        meals,
      };
    });

    if (!days.length) throw new Error("Empty plan");

    return {
      summary: String(p.summary ?? ""),
      weeklyPattern: String(p.weeklyPattern ?? ""),
      days,
      calorieGoal: data.calorieGoal,
      mealsPerDay: data.mealsPerDay,
      createdAt: Date.now(),
    };
  });
