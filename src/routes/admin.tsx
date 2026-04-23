import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, X, Phone, Building2 } from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-store";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — EVENZO" }] }),
  component: AdminPage,
});

type Request = {
  id: string;
  user_id: string;
  full_name: string;
  activity_type: string;
  whatsapp: string;
  business_name: string;
  description: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

function AdminPage() {
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/auth" });
    else if (role !== "admin") navigate({ to: "/" });
  }, [loading, user, role, navigate]);

  const load = async () => {
    const { data, error } = await supabase
      .from("organizer_requests")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setRequests((data as Request[]) ?? []);
  };

  useEffect(() => {
    if (role === "admin") load();
  }, [role]);

  const decide = async (req: Request, approve: boolean) => {
    setBusyId(req.id);
    try {
      const { error: updErr } = await supabase
        .from("organizer_requests")
        .update({
          status: approve ? "approved" : "rejected",
          reviewed_by: user!.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", req.id);
      if (updErr) throw updErr;

      if (approve) {
        const { error: roleErr } = await supabase
          .from("user_roles")
          .insert({ user_id: req.user_id, role: "organizer" });
        if (roleErr && !roleErr.message.includes("duplicate")) throw roleErr;
      }
      toast.success(approve ? "Approuvé ✓" : "Refusé");
      setRequests((r) => r.filter((x) => x.id !== req.id));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <MobileFrame hideNav>
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 pt-safe backdrop-blur-xl">
        <button
          onClick={() => navigate({ to: "/" })}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary"
          aria-label="Retour"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-base font-bold text-foreground">Admin · Demandes</h1>
          <p className="text-[11px] text-muted-foreground">{requests.length} en attente</p>
        </div>
      </header>

      <div className="space-y-3 px-4 py-4 pb-12">
        {requests.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <p className="text-3xl">✨</p>
            <p className="mt-2 text-sm text-muted-foreground">Aucune demande en attente</p>
          </div>
        )}

        {requests.map((r) => (
          <article
            key={r.id}
            className="space-y-3 rounded-xl border border-border bg-card p-4"
          >
            <div>
              <h2 className="text-base font-bold text-foreground">{r.full_name}</h2>
              <p className="mt-0.5 text-xs font-medium text-primary">{r.activity_type}</p>
            </div>
            <div className="space-y-1.5 text-sm">
              <p className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span className="text-foreground">{r.business_name}</span>
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <a href={`https://wa.me/${r.whatsapp.replace(/\D/g, "")}`} className="text-foreground underline">
                  {r.whatsapp}
                </a>
              </p>
              {r.description && (
                <p className="rounded-lg bg-secondary p-2.5 text-[13px] text-foreground">
                  {r.description}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => decide(r, false)}
                disabled={busyId === r.id}
                className="flex h-10 items-center justify-center gap-1.5 rounded-lg border border-destructive/40 text-sm font-semibold text-destructive disabled:opacity-50"
              >
                <X className="h-4 w-4" /> Refuser
              </button>
              <button
                onClick={() => decide(r, true)}
                disabled={busyId === r.id}
                className="flex h-10 items-center justify-center gap-1.5 rounded-lg bg-success text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                <Check className="h-4 w-4" /> Approuver
              </button>
            </div>
          </article>
        ))}
      </div>
    </MobileFrame>
  );
}
