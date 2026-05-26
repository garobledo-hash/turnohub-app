import { useState, type ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { Calendar, ChevronsLeft, CreditCard, ExternalLink, Home, LogOut, Menu, Scissors, Settings, Users, X } from "lucide-react";
import { SideNavLink } from "@/components/NavLink";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/hooks/useAuth";
import { TrialBanner } from "@/components/TrialBanner";

interface NavItem {
  to: string;
  icon: typeof Home;
  label: string;
  end?: boolean;
}

const NAV: NavItem[] = [
  { to: "/dashboard", icon: Home, label: "Inicio", end: true },
  { to: "/dashboard/agenda", icon: Calendar, label: "Agenda" },
  { to: "/dashboard/servicios", icon: Scissors, label: "Servicios" },
  { to: "/dashboard/clientes", icon: Users, label: "Clientes" },
  { to: "/dashboard/pagos", icon: CreditCard, label: "Pagos" },
  { to: "/dashboard/configuracion", icon: Settings, label: "Configuración" },
];

export function DashboardLayout({ children }: { children?: ReactNode }) {
  const { signOut, profile } = useAuth();
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  async function onSignOut(): Promise<void> {
  await signOut();

  window.location.href = "/login";
}

  const publicLink = profile?.slug ? `${window.location.origin}/r/${profile.slug}` : null;

  return (
    <div className="min-h-screen w-full flex">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border/60 bg-sidebar/60 backdrop-blur-xl">
        <div className="px-5 h-16 flex items-center"><Logo /></div>
        <nav className="px-3 space-y-1">
          {NAV.map((n) => (
            <SideNavLink key={n.to} {...n} />
          ))}
        </nav>

        <div className="mt-auto p-3 space-y-2">
          {publicLink && (
            <a
              href={publicLink}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-card/40 px-3 py-2.5 text-xs hover:border-primary/40 transition-colors"
            >
              <div className="min-w-0">
                <div className="text-muted-foreground">Tu link público</div>
                <div className="truncate text-foreground">/r/{profile?.slug}</div>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </a>
          )}

          <div className="rounded-xl bg-card/40 border border-border/60 p-3">
            <div className="text-xs text-muted-foreground truncate">{profile?.business_name ?? "Mi negocio"}</div>
            <div className="text-sm text-foreground truncate">{profile?.full_name || profile?.email}</div>
            <button
              onClick={onSignOut}
              className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              <LogOut className="h-3 w-3" /> cerrar sesion
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-sidebar border-r border-border flex flex-col animate-slide-in-right">
            <div className="h-16 px-5 flex items-center justify-between">
              <Logo />
              <button onClick={() => setMobileOpen(false)} className="h-9 w-9 grid place-items-center rounded-lg hover:bg-accent"><X className="h-4 w-4" /></button>
            </div>
            <nav className="px-3 space-y-1">
              {NAV.map((n) => (
                <SideNavLink key={n.to} {...n} onClick={() => setMobileOpen(false)} />
              ))}
            </nav>
            <div className="mt-auto p-3">
              <button onClick={onSignOut} className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-xl border border-border text-sm text-muted-foreground hover:text-destructive">
                <LogOut className="h-4 w-4" /> Cerrar sesión
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar mobile */}
        <header className="lg:hidden sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/60 h-14 px-4 flex items-center justify-between">
          <button onClick={() => setMobileOpen(true)} className="h-9 w-9 grid place-items-center rounded-lg hover:bg-accent"><Menu className="h-4 w-4" /></button>
          <Logo />
          <button onClick={onSignOut} className="h-9 w-9 grid place-items-center rounded-lg hover:bg-accent"><LogOut className="h-4 w-4" /></button>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-10 lg:py-8 max-w-[1400px] w-full mx-auto">
          <TrialBanner profile={profile} />
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
}

// silence unused
void ChevronsLeft;
