import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { analyzeFood } from "@/lib/nutrition.functions";
import { useStore, type MealType } from "@/lib/store";
import { Camera, ImageIcon, X, Sparkles, ChevronDown, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export const Route = createFileRoute("/scan")({
  head: () => ({
    meta: [
      { title: "NutriLens — Scan" },
      { name: "description", content: "Snap a photo and let AI estimate calories and macros." },
    ],
  }),
  component: ScanPage,
});

type AnalysisResult = Awaited<ReturnType<typeof analyzeFood>>;

function fileToBase64(file: File): Promise<{ data: string; mediaType: "image/jpeg" | "image/png" | "image/webp" }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const comma = result.indexOf(",");
      const data = comma >= 0 ? result.slice(comma + 1) : result;
      const mt = file.type === "image/png" ? "image/png" : file.type === "image/webp" ? "image/webp" : "image/jpeg";
      resolve({ data, mediaType: mt });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function ScanPage() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const cameraRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [showIngredients, setShowIngredients] = useState(false);
  const analyze = useServerFn(analyzeFood);
  const { addEntry } = useStore();
  const navigate = useNavigate();

  async function handleFile(file: File) {
    setResult(null);
    setShowIngredients(false);
    setPreview(URL.createObjectURL(file));
    setLoading(true);
    try {
      const { data, mediaType } = await fileToBase64(file);
      const res = await analyze({ data: { imageBase64: data, mediaType } });
      setResult(res);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not analyze image";
      toast.error(`❌ ${msg.includes("AI") ? msg : "Couldn't analyze — try a clearer photo"}`);
      setPreview(null);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setPreview(null);
    setResult(null);
    setShowIngredients(false);
  }

  function commit() {
    if (!result) return;
    const mealMap: Record<typeof result.meal_type, MealType> = {
      breakfast: "breakfast",
      lunch: "lunch",
      dinner: "dinner",
      snack: "snacks",
    };
    addEntry({
      foodName: result.foodName,
      emoji: result.emoji,
      calories: result.calories,
      protein_g: result.protein_g,
      carbs_g: result.carbs_g,
      fat_g: result.fat_g,
      serving_size: result.serving_size,
      meal: mealMap[result.meal_type] ?? "snacks",
    });
    toast.success(`✅ ${result.foodName} added to diary!`);
    navigate({ to: "/" });
  }

  return (
    <AppShell>
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 22, stiffness: 260 }}
      >
        <header className="pt-2">
          <h1 className="font-display text-3xl font-bold">Scan a meal</h1>
          <p className="text-xs text-muted-foreground">Point your camera — AI does the rest.</p>
        </header>

        {/* Viewfinder */}
        <div className="relative mt-5 aspect-[4/5] overflow-hidden rounded-3xl border border-white/7 bg-card">
          {preview ? (
            <img src={preview} alt="Selected meal" className="h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl">🍽️</div>
                <p className="mt-3 text-sm text-muted-foreground">Tap a button below to start</p>
              </div>
            </div>
          )}

          {/* Corner brackets */}
          {(loading || !preview) && (
            <div className={`pointer-events-none absolute inset-6 ${loading ? "animate-scan-corners" : ""}`}>
              <Corner pos="tl" /><Corner pos="tr" /><Corner pos="bl" /><Corner pos="br" />
            </div>
          )}

          {/* Scanning line */}
          {loading && (
            <>
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1 animate-scan-line" style={{
                background: "linear-gradient(180deg, transparent 0%, #A8FF3E 50%, transparent 100%)",
                height: 80,
                filter: "blur(2px)",
              }} />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-background/60 py-3 backdrop-blur-md">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">🔍 Analyzing your meal<span className="dots" /></span>
              </div>
            </>
          )}

          {preview && !loading && (
            <button onClick={reset} aria-label="Clear" className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/70 backdrop-blur">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button onClick={() => cameraRef.current?.click()} className="tap glow-lime flex h-[52px] items-center justify-center gap-2 rounded-2xl bg-primary font-bold text-primary-foreground">
            <Camera className="h-5 w-5" strokeWidth={2.5} /> Take Photo
          </button>
          <button onClick={() => fileRef.current?.click()} className="tap flex h-[52px] items-center justify-center gap-2 rounded-2xl border border-white/10 bg-card font-semibold">
            <ImageIcon className="h-5 w-5" /> Upload Image
          </button>
        </div>

        {/* Skeletons */}
        {loading && (
          <div className="mt-5 flex flex-col gap-3">
            <div className="h-24 animate-pulse rounded-2xl bg-white/[0.04]" />
            <div className="h-16 animate-pulse rounded-2xl bg-white/[0.04]" />
            <div className="h-16 animate-pulse rounded-2xl bg-white/[0.04]" />
          </div>
        )}

        {/* Result */}
        <AnimatePresence>
          {result && !loading && (
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: "spring", damping: 22, stiffness: 260 }}
              className="mt-5 rounded-3xl border border-white/10 bg-card p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="text-5xl leading-none">{result.emoji}</div>
                  <div>
                    <h2 className="font-display text-2xl font-bold leading-tight">{result.foodName}</h2>
                    <p className="text-xs text-muted-foreground">{result.serving_size}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-semibold text-primary">
                  ✦ {result.confidence_percent}%
                </div>
              </div>

              <div className="mt-5 text-center">
                <div className="font-display text-5xl font-bold tabular-nums">{result.calories}</div>
                <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">calories</div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2">
                <Pill color="#3E9BFF" label="Protein" value={result.protein_g} />
                <Pill color="#FFD93D" label="Carbs" value={result.carbs_g} />
                <Pill color="#FF6B6B" label="Fat" value={result.fat_g} />
              </div>

              {/* Health score */}
              <div className="mt-5">
                <div className="flex items-baseline justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Health score</span>
                  <span className="font-display text-sm font-bold tabular-nums">{result.health_score}/10</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/5">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "linear-gradient(90deg, #FF6B6B 0%, #FFD93D 50%, #A8FF3E 100%)" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${result.health_score * 10}%` }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </div>

              {/* Tip */}
              {result.tip && (
                <div className="mt-4 flex items-start gap-2 rounded-2xl bg-white/[0.04] p-3">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-streak" />
                  <p className="text-xs leading-relaxed text-foreground/90">{result.tip}</p>
                </div>
              )}

              {/* Ingredients accordion */}
              {result.ingredients.length > 0 && (
                <div className="mt-4 overflow-hidden rounded-2xl bg-white/[0.04]">
                  <button
                    onClick={() => setShowIngredients((v) => !v)}
                    className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold"
                  >
                    <span>Ingredients ({result.ingredients.length})</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${showIngredients ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {showIngredients && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <ul className="flex flex-col gap-1 px-4 pb-3 text-sm">
                          {result.ingredients.map((ing: { name: string; calories: number; amount: string }, i: number) => (
                            <li key={i} className="flex items-center justify-between border-t border-white/5 py-2 first:border-t-0">
                              <div className="min-w-0">
                                <div className="truncate">{ing.name}</div>
                                {ing.amount && <div className="text-[10px] text-muted-foreground">{ing.amount}</div>}
                              </div>
                              <span className="tabular-nums text-muted-foreground">{ing.calories} kcal</span>
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <div className="mt-5 grid grid-cols-[1fr_auto] gap-3">
                <button onClick={commit} className="tap glow-lime h-[52px] rounded-2xl bg-primary font-bold text-primary-foreground">
                  ✓ Add to Diary
                </button>
                <button onClick={reset} className="tap h-[52px] rounded-2xl border border-white/10 px-4 font-semibold">
                  🔄 Retake
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AppShell>
  );
}

function Pill({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div
      className="flex flex-col items-center rounded-2xl px-3 py-3"
      style={{ background: `${color}26`, color }}
    >
      <span className="font-display text-xl font-bold tabular-nums">{value}g</span>
      <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider opacity-90">{label}</span>
    </div>
  );
}

function Corner({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const base = "absolute h-8 w-8 border-primary";
  const map = {
    tl: "top-0 left-0 border-l-2 border-t-2 rounded-tl-xl",
    tr: "top-0 right-0 border-r-2 border-t-2 rounded-tr-xl",
    bl: "bottom-0 left-0 border-l-2 border-b-2 rounded-bl-xl",
    br: "bottom-0 right-0 border-r-2 border-b-2 rounded-br-xl",
  } as const;
  return <div className={`${base} ${map[pos]}`} />;
}
