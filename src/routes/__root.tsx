import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { StoreProvider } from "../lib/store";
import { LanguageProvider } from "../lib/i18n";
import { AppGate } from "../components/AppGate";
import { Toaster } from "sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <p className="mt-2 text-sm text-muted-foreground">This page is off the menu.</p>
        <Link to="/" className="mt-6 inline-flex rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">
          Go home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">Please try again.</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 inline-flex rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1" },
      { name: "theme-color", content: "#0A0A0F" },
      { title: "NutriLens — AI Calorie & Macro Tracker" },
      { name: "description", content: "Snap your meal. NutriLens AI counts calories and macros in seconds." },
      { property: "og:title", content: "NutriLens — AI Calorie & Macro Tracker" },
      { property: "og:description", content: "Snap your meal. NutriLens AI counts calories and macros in seconds." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "NutriLens — AI Calorie & Macro Tracker" },
      { name: "twitter:description", content: "Snap your meal. NutriLens AI counts calories and macros in seconds." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/d1ab0d6b-1949-4c5f-95b2-628cf732c29b/id-preview-a0f893c0--e496c6d8-594c-44f9-9d63-9b5d72ef6dbe.lovable.app-1780297320931.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/d1ab0d6b-1949-4c5f-95b2-628cf732c29b/id-preview-a0f893c0--e496c6d8-594c-44f9-9d63-9b5d72ef6dbe.lovable.app-1780297320931.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <StoreProvider>
          <AppGate>
            <Outlet />
          </AppGate>
          <Toaster theme="dark" position="top-center" toastOptions={{ style: { background: "var(--color-card)", color: "var(--color-foreground)", border: "1px solid rgba(255,255,255,0.08)" } }} />
        </StoreProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

