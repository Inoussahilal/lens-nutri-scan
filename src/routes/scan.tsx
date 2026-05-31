import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { analyzeFood } from "@/lib/nutrition.functions";
import { useStore, type MealType } from "@/lib/store";
import { Camera, ImageIcon, X, Sparkles, Loader2 } from "lucide-react";
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

function inferMeal(): MealType {
  const h = new Date().getHours();
  if (h < 11) return "breakfast";
  if (h < 15) return "lunch";
  if (h < 21) return "dinner";
  return "snacks";
}

function ScanPage() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const cameraRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const analyze = useServerFn(analyzeFood);
  const { addEntry } = useStore();
  const navigate = useNavigate();

  async function handleFile(file: File) {
    setResult(null);
    setPreview(URL.createObjectURL(file));
    setLoading(true);
    try {
      const { data, mediaType } = await fileToBase64(file);
      const res = await analyze({ data: { imageBase64: data, mediaType } });
      setResult(res);
    } catch (e: any) {
      toast.error(e?.message || "Could not analyze image");
      setPreview(null);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setPreview(null);
    setResult(null);
  }

  function commit() {
    if (!result) return;
    addEntry({
      foodName: result.foodName,
      emoji: result.emoji,
      calories: result.calories,
      protein_g: result.protein_g,
      carbs_g: result.carbs_g,
      fat_g: result.fat_g,
      serving_size: result.serving_size,
      meal: inferMeal(),
    });
    toast.success("✅ Meal added!");
    navigate({ to: "/" });
  }

  return (
    <AppShell>
      <header className="pt-2">
        <h1 className="font-display text-3xl font-bold">Scan a meal</h1>
        <p className="text-sm text-muted-foreground">Point your camera — AI does the rest.</p>
      </header>

      <div className="relative mt-6 aspect-[4/5] overflow-hidden rounded-3xl border border-white/5 bg-card">
        {preview ? (
          <img src={preview} alt="Selected meal" className="h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl">🍽️</div>
              <p className="mt-3 text-sm text-muted-foreground">No image yet</p>
            </div>
          </div>
        )}

        {/* Scan corners */}
        {(loading || !preview) && (
          <div className={`pointer-events-none absolute inset-6 ${loading ? "animate-scan-pulse" : ""}`}>
            <Corner pos="tl" />
            <Corner pos="tr" />
            <Corner pos="bl" />
            <Corner pos="br" />
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2 text-foreground">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <span className="text-sm font-medium">Analyzing…</span>
            </div>
          </div>
        )}

        {preview && !loading && (
          <button
            onClick={reset}
            aria-label="Clear"
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/70 backdrop-blur"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          onClick={() => cameraRef.current?.click()}
          className="tap glow-lime flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-4 font-semibold text-primary-foreground"
        >
          <Camera className="h-5 w-5" strokeWidth={2.5} /> Take Photo
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="tap flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-card px-4 py-4 font-semibold text-foreground"
        >
          <ImageIcon className="h-5 w-5" /> Gallery
        </button>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: "spring", damping: 22, stiffness: 280 }}
            className="mt-6 rounded-3xl border border-white/10 bg-card p-5"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface text-3xl">{result.emoji}</div>
                <div>
                  <h2 className="font-display text-xl font-semibold leading-tight">{result.foodName}</h2>
                  <p className="text-xs text-muted-foreground">{result.serving_size}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                <Sparkles className="h-3 w-3" /> {result.confidence_percent}%
              </div>
            </div>

            <div className="mt-5 text-center">
              <div className="font-display text-5xl font-bold tabular-nums">{result.calories}</div>
              <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">calories</div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <Pill color="protein" label="Protein" value={result.protein_g} />
              <Pill color="carbs" label="Carbs" value={result.carbs_g} />
              <Pill color="fat" label="Fat" value={result.fat_g} />
            </div>

            {result.ingredients.length > 0 && (
              <div className="mt-5">
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Ingredients</p>
                <ul className="flex flex-col gap-1.5">
                  {result.ingredients.map((ing: { name: string; calories: number }, i: number) => (
                    <li key={i} className="flex items-center justify-between rounded-xl bg-surface/60 px-3 py-2 text-sm">
                      <span>{ing.name}</span>
                      <span className="tabular-nums text-muted-foreground">{ing.calories} kcal</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-5 grid grid-cols-[1fr_auto] gap-3">
              <button
                onClick={commit}
                className="tap glow-lime rounded-2xl bg-primary px-4 py-3.5 font-semibold text-primary-foreground"
              >
                Add to Diary
              </button>
              <button
                onClick={reset}
                className="tap rounded-2xl border border-white/10 px-4 py-3.5 font-medium text-foreground"
              >
                Retake
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}

function Pill({ color, label, value }: { color: "protein" | "carbs" | "fat"; label: string; value: number }) {
  const bg =
    color === "protein"
      ? "bg-[color:var(--color-protein)]/15 text-[color:var(--color-protein)]"
      : color === "carbs"
        ? "bg-[color:var(--color-carbs)]/15 text-[color:var(--color-carbs)]"
        : "bg-[color:var(--color-fat)]/15 text-[color:var(--color-fat)]";
  return (
    <div className={`flex flex-col items-center rounded-2xl px-3 py-3 ${bg}`}>
      <span className="font-display text-xl font-bold tabular-nums">{value}g</span>
      <span className="text-[10px] font-medium uppercase tracking-wider opacity-80">{label}</span>
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
