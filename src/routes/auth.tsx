import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-store";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Connexion — EVENZO" },
      { name: "description", content: "Connecte-toi à EVENZO pour découvrir les événements à Lomé." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/" });
  }, [user, loading, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { display_name: displayName || email.split("@")[0] },
          },
        });
        if (error) {
          if (error.message.toLowerCase().includes("already") || error.message.toLowerCase().includes("registered")) {
            toast.error("Ce compte existe déjà. Connecte-toi à la place.");
            setMode("signin");
            return;
          }
          throw error;
        }
        toast.success("Compte créé ! Bienvenue 🔥");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (error) {
          if (error.message.toLowerCase().includes("invalid")) {
            toast.error("Email ou mot de passe incorrect");
            return;
          }
          throw error;
        }
        toast.success("Connecté !");
      }
      navigate({ to: "/" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur d'authentification";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-background px-6 pt-safe">
      <div className="flex flex-1 flex-col justify-center py-10">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="text-5xl animate-flame-flicker">🔥</div>
          <Logo />
          <p className="text-center text-sm text-muted-foreground">
            L'app qui connecte les gens aux événements de Lomé
          </p>
        </div>

        <div className="mb-5 grid grid-cols-2 rounded-xl bg-secondary p-1">
          <button
            onClick={() => setMode("signin")}
            className={`rounded-lg py-2 text-sm font-semibold transition-all ${
              mode === "signin" ? "bg-card text-foreground shadow-card" : "text-muted-foreground"
            }`}
          >
            Connexion
          </button>
          <button
            onClick={() => setMode("signup")}
            className={`rounded-lg py-2 text-sm font-semibold transition-all ${
              mode === "signup" ? "bg-card text-foreground shadow-card" : "text-muted-foreground"
            }`}
          >
            Inscription
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Nom affiché
              </label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ex: Kvsmir"
                className="w-full rounded-xl border border-border bg-card px-3.5 py-3 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ton@email.com"
              className="w-full rounded-xl border border-border bg-card px-3.5 py-3 text-sm text-foreground outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Mot de passe
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-border bg-card px-3.5 py-3 text-sm text-foreground outline-none focus:border-primary"
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="mt-3 h-12 w-full rounded-lg bg-gradient-flame text-base font-bold text-primary-foreground shadow-flame transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {busy ? "..." : mode === "signin" ? "Se connecter" : "Créer mon compte 🔥"}
          </button>
        </form>

        <Link to="/" className="mt-6 text-center text-xs text-muted-foreground hover:text-foreground">
          Continuer sans compte
        </Link>
      </div>
    </div>
  );
}
