import { Link } from "react-router-dom";
import { Sparkles, Zap } from "lucide-react";
import { trialDaysLeft } from "@/services/profile";
import type { Profile } from "@/types/db";

export function TrialBanner({ profile }: { profile: Profile | null }) {
  if (!profile) return null;
  if (profile.plan_active) return null;
  const days = trialDaysLeft(profile);
  const urgent = days <= 2;
  return (
    <div className="mb-5 card-premium px-4 py-3 flex items-center gap-3 animate-fade-in">
      <div className={`h-8 w-8 rounded-lg grid place-items-center ${urgent ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary"}`}>
        {urgent ? <Zap className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
      </div>
      <div className="flex-1 text-sm">
        <span className="text-foreground font-medium">{days === 0 ? "Tu prueba terminó hoy." : `Te quedan ${days} ${days === 1 ? "día" : "días"} de prueba.`}</span>
        <span className="text-muted-foreground"> Activá tu plan y seguí sin interrupciones.</span>
      </div>
      <Link
        to="/billing"
        className="hidden sm:inline-flex h-9 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:brightness-110 transition"
      >
        Activar plan
      </Link>
    </div>
  );
}
