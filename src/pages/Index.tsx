import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { ArrowRight, Calendar, Check, Clock, Scissors, Smartphone, Sparkles, Users, Zap } from "lucide-react";

export default function Index() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 grid-dots opacity-30 pointer-events-none" />
      <div className="absolute -top-40 right-0 h-[500px] w-[500px] rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-20 h-[400px] w-[400px] rounded-full bg-fuchsia-500/10 blur-3xl pointer-events-none" />

      <header className="relative z-10 px-6 lg:px-10 h-16 flex items-center justify-between max-w-7xl mx-auto">
        <Logo />
        <nav className="flex items-center gap-2">
          <Link to="/login" className="hidden sm:inline-flex h-9 items-center px-4 rounded-lg text-sm text-muted-foreground hover:text-foreground transition">Iniciar sesión</Link>
          <Link to="/registro" className="h-9 inline-flex items-center px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium btn-glow hover:brightness-110 transition">Empezar gratis</Link>
        </nav>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10">
        {/* Hero */}
        <section className="pt-12 lg:pt-20 pb-16 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 h-7 text-xs text-muted-foreground backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Prueba gratuita 7 días · Sin tarjeta
            </div>
            <h1 className="mt-5 text-5xl lg:text-7xl font-semibold tracking-tight leading-[1.02] text-balance">
              Tu agenda online,<br />
              <span className="font-serif italic text-primary">profesional</span> desde el día uno.
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-xl">
              TurnoHub es la plataforma de turnos para peluquerías, barberías, estéticas, spas y profesionales independientes. Tus clientes reservan en segundos. Vos te enfocás en lo tuyo.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link to="/registro" className="h-12 inline-flex items-center gap-2 px-6 rounded-xl bg-primary text-primary-foreground font-medium btn-glow hover:brightness-110 transition">
                Crear mi cuenta <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/login" className="h-12 inline-flex items-center px-6 rounded-xl border border-border hover:border-primary/40 text-sm transition">
                Ya tengo cuenta
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-3 max-w-lg">
              {[
                { k: "−42%", v: "no-shows" },
                { k: "24/7", v: "reservas online" },
                { k: "+18h", v: "ahorradas / mes" },
              ].map((s) => (
                <div key={s.v} className="card-premium p-3">
                  <div className="text-xl font-semibold">{s.k}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{s.v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Visual */}
          <div className="lg:col-span-5 animate-scale-in">
            <div className="card-premium p-5 relative">
              <div className="absolute -top-2 right-4 h-1 w-12 rounded-full bg-primary animate-pulse-glow" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-xl bg-primary/15 grid place-items-center text-primary"><Scissors className="h-4 w-4" /></div>
                  <div>
                    <div className="text-sm font-semibold">Studio Camila</div>
                    <div className="text-[11px] text-muted-foreground">Reserva online</div>
                  </div>
                </div>
                <span className="text-[11px] text-success">● Online</span>
              </div>
              <div className="mt-5 grid grid-cols-7 gap-1.5 text-center text-[10px] uppercase tracking-wider text-muted-foreground">
                {["L","M","M","J","V","S","D"].map((d,i) => <div key={i}>{d}</div>)}
              </div>
              <div className="mt-1 grid grid-cols-7 gap-1.5">
                {Array.from({ length: 21 }).map((_, i) => {
                  const isToday = i === 9;
                  const hasAppt = [2,5,9,13,16].includes(i);
                  return (
                    <div key={i} className={`aspect-square rounded-md flex items-center justify-center text-xs ${isToday ? "bg-primary text-primary-foreground font-semibold" : hasAppt ? "bg-primary/10 text-foreground" : "bg-secondary/40 text-muted-foreground"}`}>
                      {((i % 31) + 1)}
                    </div>
                  );
                })}
              </div>
              <div className="mt-5 space-y-2">
                {[
                  { t: "Corte y barba", n: "Martín G.", h: "10:30", c: "primary" },
                  { t: "Color + brushing", n: "Lucía P.", h: "12:00", c: "fuchsia" },
                  { t: "Manicura", n: "Sofía R.", h: "15:30", c: "primary" },
                ].map((a) => (
                  <div key={a.h} className="flex items-center gap-3 rounded-lg border border-border bg-card/40 p-2.5">
                    <div className="w-12 text-center"><div className="text-sm font-semibold tabular-nums">{a.h}</div></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">{a.t}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{a.n}</div>
                    </div>
                    <Check className="h-4 w-4 text-success" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-12 lg:py-20">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-semibold tracking-tight text-balance">
              Todo lo que necesitás. <span className="text-muted-foreground">Nada que no.</span>
            </h2>
          </div>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { i: Calendar, t: "Agenda inteligente", d: "Calcula automáticamente los huecos según la duración de cada servicio." },
              { i: Smartphone, t: "Link público mobile-first", d: "Compartí tu link en Instagram. Tus clientes reservan en segundos." },
              { i: Users, t: "Clientes con historial", d: "Cada cliente con sus visitas, contacto y próximos turnos." },
              { i: Zap, t: "Mercado Pago integrado", d: "Cobrá tu plan automáticamente. Sin contacto manual." },
              { i: Clock, t: "Horarios flexibles", d: "Múltiples rangos por día, descansos, días cerrados. Como tu negocio funciona." },
              { i: Sparkles, t: "Diseño premium", d: "Una experiencia que tus clientes recordarán." },
            ].map(({ i: Icon, t, d }) => (
              <div key={t} className="card-premium p-5">
                <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary grid place-items-center"><Icon className="h-4 w-4" /></div>
                <h3 className="mt-4 font-semibold">{t}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-16">
          <div className="card-premium p-8 lg:p-12 text-center relative overflow-hidden">
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-60 w-[600px] rounded-full bg-primary/15 blur-3xl" />
            <div className="relative">
              <h2 className="text-3xl lg:text-5xl font-semibold tracking-tight text-balance">
                Probá TurnoHub <span className="font-serif italic text-primary">gratis</span> por 7 días.
              </h2>
              <p className="mt-3 text-muted-foreground">Sin tarjeta. Configurás todo en menos de 5 minutos.</p>
              <Link to="/registro" className="mt-7 inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-primary text-primary-foreground font-medium btn-glow hover:brightness-110 transition">
                Empezar ahora <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 py-8 flex items-center justify-between text-xs text-muted-foreground">
        <Logo />
        <span>© {new Date().getFullYear()} TurnoHub</span>
      </footer>
    </div>
  );
}
