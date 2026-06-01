# AI Development Logs — NutriLens AI (Cal AI Clone)
**Contest:** Cal AI Clone — AI Calorie Tracker | 8x Engineer
**Tools used:** Claude AI (strategy + prompt engineering) + Lovable AI (code generation)
**App URL:** lens-nutri-scan.lovable.app

---

# PART 1 — STRATEGY & PROMPT ENGINEERING (Claude AI)

---

## Prompt

I have a hackathon to build a Cal AI clone — AI Calorie Tracker. Here is the reference app screenshot (Cal AI on App Store, 4.8 stars, 322K ratings). What should I build and how should I approach this to be in the top 3?

## Response

To be in the top 3, focus on these priorities in order:

1. Screenshots first — judges see UI before anything else. Make every screen polished and screenshot-worthy.
2. AI integration that actually works — real Anthropic API call with image base64, not mocked data.
3. Complete all major flows — dashboard, diary, scanner, stats, profile.

Recommended stack: React PWA, dark premium theme, real Claude API for food recognition.

Key differentiators vs typical submissions:
- Animated SVG calorie ring
- Colored macro cards (not generic grey bars)
- Recharts for real data visualization
- Streak tracking with calendar
- Full localStorage persistence

---

## Prompt

Fait moi alors un prompt que je vais donner à lovable ia pour avoir un truc propre et avoir la chance d'etre parmi les 3 premiers au moins et applique tout ce qui doit etre applique

## Response

Here is the full optimized prompt for Lovable:

Build a production-ready mobile-first React PWA called "NutriLens" — an AI-powered calorie and macro tracker.

DESIGN DIRECTION — "Dark Luxury Health":
- Dark theme: background #0A0A0F, cards #13131A, surfaces #1C1C26
- Accent: vibrant electric lime #C6FF00
- Secondary accent: soft coral #FF6B6B (fat macro)
- Typography: "Sora" for headings, "DM Sans" for body
- Glassmorphism cards with subtle border
- Bottom tab navigation
- Safe area insets for iOS

SCREENS:
1. HOME/DASHBOARD — greeting header, large circular calorie ring (SVG animated), 3 macro progress bars, streak badge, Log Food CTA, recent meals list
2. FOOD LOGGER (AI Camera) — full-screen camera viewfinder mock, Take Photo and Upload options, Anthropic Claude API call with base64 image, results card with food name, calories, macros, ingredients, confidence badge
3. DIARY — grouped by meal sections, macro chips, running total, swipe to delete
4. PROGRESS/STATS — weekly bar chart recharts, macros pie chart, weight tracker, streak calendar
5. PROFILE/GOALS — avatar, calorie goal, macro sliders, stats

AI INTEGRATION using exact fetch code to https://api.anthropic.com/v1/messages with claude-sonnet-4-20250514, image as base64, returning structured JSON.

---

## Prompt

Voila ce que ca a fait (screenshot showing basic dark UI with grey macro bars, no streak badge, ring cropped). Les credits sont finis voila ce que ca a genere.

## Response

C'est un bon debut — la base est la (dark theme, lime green, bottom nav, macro bars). Mais pour le top 3, il faut upgrader plusieurs choses.

Problemes actuels:
- Le calorie ring en haut est coupe / mal proportionne
- Les macro bars sont plates et sans couleur (tout gris)
- Pas de streak badge visible
- Les cards macro manquent de personnalite
- Pas de donnees de demo (tout a 0)

Prompt de correction pour Lovable (version economique — un seul prompt):

Fix ALL issues and complete the entire app in one pass:

1. CALORIE RING: Fix cropping. Full SVG ring centered, viewBox="0 0 200 200", 180px, animated strokeDashoffset on mount.
2. MACRO BARS: Protein #3E9BFF / Carbs #FFD93D / Fat #FF6B6B. Convert to 3 side-by-side colored cards.
3. STREAK BADGE: Top-right, "1 day", lime glow.
4. GREETING: "Good morning, Alex" + today's date.
5. DEMO DATA: Oatmeal with Banana 380kcal, Grilled Chicken & Rice 520kcal, Greek Yogurt 150kcal.
6. DIARY: 4 sections, sticky header, macro chips on entries, swipe delete, summary card.
7. STATS: recharts BarChart + macro donut + streak calendar + stats cards.
8. PROFILE: avatar, calorie goal +/-, macro sliders summing to 100%, live gram calc.
9. SCANNER: bottom sheet, pulsing viewfinder, scanning animation, full result card, real Anthropic API.

---

## Prompt

dis moi tout ce qui manque en un seul prompt pour ne pas gaspiller les credits de lovable

## Response

Full single prompt covering everything:

Fix ALL issues and complete the entire app in one pass. Here are all the changes needed:

FIX EXISTING ISSUES:
1. CALORIE RING: Full SVG ring centered, viewBox="0 0 200 200", 180px, animated strokeDashoffset 1.2s ease-out on mount.
2. MACRO BARS: Protein #3E9BFF / Carbs #FFD93D / Fat #FF6B6B. 3 side-by-side cards with colored top border.
3. STREAK BADGE: "1 day", bg rgba(168,255,62,0.15), border 1px solid #A8FF3E.
4. GREETING: "Good morning, Alex" Outfit 22px bold. Below: today's date muted.
5. SCROLL: Home screen overflow-y: auto.

DEMO DATA: Breakfast Oatmeal 380kcal P:12g C:68g F:7g / Lunch Grilled Chicken 520kcal P:45g C:52g F:8g / Snack Greek Yogurt 150kcal P:15g C:12g F:3g. Updates ring to 1050/2500, macro bars, streak to 1.

DIARY SCREEN: Sticky header total kcal, 4 sections Breakfast/Lunch/Dinner/Snacks, each entry with emoji + name + macro chips + kcal badge, swipe left delete, "+" per section, bottom macro summary.

STATS SCREEN: recharts BarChart 7 days today=lime others=rgba(168,255,62,0.4) dashed coral goal line. Macro PieChart donut innerRadius 50 outerRadius 80. Streak calendar 30 days 6x5 grid. Stats cards Best/Avg/Meals.

PROFILE SCREEN: Avatar 64px lime border. Editable name. Calorie goal +/- step 50. 3 sliders P/C/F summing to 100% with live gram calc. Save to localStorage.

SCANNER: Bottom sheet framer-motion. Pulsing lime corner brackets. Scanning line animation. Result: emoji + name + confidence badge + calories + macro pills + health score bar + tip card + ingredients accordion + Add to Diary + Retake.

AI CALL exact code:
const analyzeFood = async (imageFile) => {
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(imageFile);
  });
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: imageFile.type, data: base64 } },
          { type: "text", text: "Analyze this food. Return ONLY JSON: { foodName, emoji, calories, protein_g, carbs_g, fat_g, fiber_g, serving_size, confidence_percent, meal_type, health_score, tip, ingredients: [{name, calories, amount}] }" }
        ]
      }]
    })
  });
  const data = await response.json();
  return JSON.parse(data.content[0].text.replace(/```json|```/g, "").trim());
};

STATE: React Context + useReducer. Shape: { diary: { "YYYY-MM-DD": [...meals] }, goals: { calories:2500, protein_pct:30, carbs_pct:45, fat_pct:25 }, streak: { current:1, best:1, lastLogDate }, profile: { name:"Alex" } }. Persist to localStorage on every change.

GLOBAL POLISH: Outfit + Plus Jakarta Sans Google Fonts. Glassmorphism cards everywhere. Page transitions opacity+translateX. Toast notifications lime/coral auto-dismiss 3s. 44px tap targets. Zero horizontal overflow. Safe area bottom padding.

---

## Prompt

Voila ce que ca a fait (screenshots showing complete dashboard with ring 1050/2500, streak badge 1 day, colored macro cards P:72g/188g blue, C:132g/281g yellow, F:18g/69g red, Log Food button, recent meals with macro chips)

## Response

C'est excellent! Le dashboard est vraiment propre et competitif maintenant.

Ce qui est parfait:
- Ring complet et anime
- Macro chips P/C/F sur chaque meal
- Streak badge 1 day
- Demo data realiste
- Bottom nav propre

Maintenant montre-moi les 4 autres screens pour evaluer si c'est soumettable.

---

## Prompt

(Screenshots of all 5 screens: Diary with 4 sections and macro chips, Stats with bar chart + donut + streak calendar, Profile with sliders, Scanner result with ingredients)

## Response

C'est complet et soumettable! Evaluation:

DIARY — Parfait: 4 sections correctes, macro chips sur chaque item, "On track" badge, Today's macros summary
STATS — Tres bien: weekly bar chart today en lime, macro donut 222g, streak calendar 30 jours, stats cards Best/Avg/Meals
PROFILE — Complet: avatar lime, calorie goal +/-, sliders P/C/F avec gram calc, Save Changes
SCANNER — A tester

Ce qu'il reste: tester le scanner avec une vraie photo en live.

---

## Prompt

(Screenshots of AI scanner working on mobile with real photo of dessert cups)

## Response

C'EST PARFAIT! Le scanner fonctionne vraiment bien:
- Photo reelle uploadee
- AI a reconnu: "Assorted Dessert Cups with Marshmallows and Fruit"
- 750 calories, P:5g C:90g F:40g
- Health score 3/10 avec bar coloree
- 6 ingredients detailles avec kcal individuels
- Nutrition tip
- Add to Diary + Retake
- URL publique visible: lens-nutri-scan.lovable.app

TON APP EST SOUMETTABLE TOP 3.

---

# PART 2 — CODE GENERATION (Lovable AI)

---

## Prompt

Build a production-ready mobile-first React PWA called "NutriLens AI" — an AI-powered calorie and macro tracker. This app must feel like a premium App Store top-10 product.

Design direction: Dark theme (#08080F background), electric lime accent (#A8FF3E), Outfit + Plus Jakarta Sans fonts, glassmorphism cards.

Key screens:
1. Dashboard with animated SVG calorie ring, 3 colored macro cards (protein blue, carbs yellow, fat coral), streak badge, Log Food CTA, recent meals list
2. AI Scanner with real Anthropic Claude API call (claude-sonnet-4-20250514), base64 image, JSON response with foodName/calories/macros/health_score/tip/ingredients
3. Diary: 4 meal sections, macro chips on each entry, daily total, macros summary
4. Stats: recharts weekly bar chart, macro donut, 30-day streak calendar, stats cards
5. Profile: editable name, calorie goal +/- buttons, macro sliders P/C/F summing to 100%, live gram calculation

State: React Context + useReducer, localStorage persistence, streak logic.
Demo data: Oatmeal 380kcal, Grilled Chicken 520kcal, Greek Yogurt 150kcal.
Bottom nav 5 tabs, center camera elevated.
Animations: ring strokeDashoffset, staggered macro bars, number countup, page transitions.

## Response

Lovable generated initial app:
- Dark dashboard with calorie ring (partially cropped)
- Macro bars (all grey, no individual colors)
- Log Food button
- Bottom navigation
- Basic recent meals list
- AI scanner shell connected to Anthropic API

---

## Prompt

Fix ALL issues and complete the entire app in one pass:

CALORIE RING: Fix cropping, full SVG, viewBox 0 0 200 200, 180px, animated.
MACRO BARS: Protein #3E9BFF / Carbs #FFD93D / Fat #FF6B6B, 3 colored cards side by side.
STREAK BADGE: Top-right, lime glow, "1 day".
GREETING: "Good morning, Alex" + date.
DEMO DATA seeded.
DIARY: 4 sections, sticky header, macro chips, swipe delete, summary.
STATS: recharts bar chart + donut + calendar + stats cards.
PROFILE: avatar, goal +/-, sliders 100%, gram calc, localStorage.
SCANNER: bottom sheet, animations, full result card, real API.
STATE: React Context + useReducer + localStorage.
GLOBAL POLISH: fonts, glassmorphism, transitions, toasts, tap targets.

## Response

Lovable fixed all issues:
- Calorie ring fully visible, centered, animated strokeDashoffset on mount
- Macro cards: Protein blue card 72/188g (38%), Carbs yellow 132/281g (47%), Fat coral 18/69g (26%)
- Streak badge top-right "1 day" with lime glow
- Greeting "Good morning, Alex" with date "lundi 1 juin"
- Demo data loaded: 1050 total kcal shown in ring
- Recent meals with macro chips (P/C/F colored pills) on each entry

---

## Prompt

Fix and complete remaining issues:

MEAL CARDS: macro chips [P: Xg] [C: Xg] [F: Xg] colored pills on every entry.
DIARY: sticky header, 4 sections correct, On track badge, swipe delete, macro summary.
STATS: BarChart today=lime dashed goal line, donut 222g center, calendar 30 days, stats row.
PROFILE: lime avatar, +/- goal, colored sliders gram calc, save.
SCANNER: bottom sheet, viewfinder corners, scanning line, confidence badge, health score, tip, ingredients accordion.
AI CALL: exact fetch code to Anthropic API.

## Response

All screens completed and verified:
- Diary: "Today — 1050 / 2500 kcal — On track", Breakfast (Oatmeal 380kcal), Lunch (Grilled Chicken 520kcal), Dinner (empty "Tap + to log dinner"), Snacks (Greek Yogurt 150kcal), Today's macros P:72g C:132g F:18g
- Stats: Calories this week bar chart (Goal 2500 shown), Macro split today donut 222g total (Protein 32% / Carbs 59% / Fat 8%), Streak calendar last 30 days (today filled lime), Best 1d / Avg 1684 kcal / Meals 3
- Profile: Avatar "A" lime border, Alex editable, 2500 kcal goal, Protein 30%=188g/day / Carbs 45%=281g/day / Fat 25%=69g/day, Save changes button, "NutriLens - Built with care" footer
- Scanner: Take Photo + Upload Image buttons, real Anthropic API connected

---

## Prompt

Live test on mobile iPhone iOS Safari at lens-nutri-scan.lovable.app — uploaded real photo of dessert cups to test full AI pipeline.

## Response

Full end-to-end test PASSED on mobile:
- App loads correctly at lens-nutri-scan.lovable.app
- Tapped camera button, bottom sheet slid up
- Selected Upload Image, chose real food photo
- Scanning animation played during API call
- AI returned complete analysis:
  "Assorted Dessert Cups with Marshmallows and Fruit"
  750 kcal total, Protein 5g, Carbs 90g, Fat 40g
  Health Score 3/10 (gradient bar)
  Confidence: 80%
  Serving: 5 dessert cups ~250g
  Tip: "Enjoy desserts in moderation as part of a balanced diet"
  Ingredients (6):
    Crumbled cookies/biscuits 50g - 150 kcal
    Whipped cream/Meringue 100g - 200 kcal
    Marshmallows 80g - 100 kcal
    Fruit puree/sauce (red) 50g - 70 kcal
    Mango pieces 60g - 80 kcal
    Chocolate chips/sauce 30g - 150 kcal
- Add to Diary: meal added successfully, dashboard updated in real time
- All 5 screens functional on mobile
- App fully ready for hackathon submission
