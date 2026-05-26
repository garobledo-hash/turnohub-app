import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AuthShell } from "@/components/AuthShell";
import { Field, TextInput } from "@/components/FormField";
import { PasswordInput } from "@/components/PasswordInput";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const { signIn, session } = useAuth();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  if (session) return <Navigate to="/dashboard" replace />;

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      toast.success("¡Bienvenido de vuelta!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "No pudimos iniciar sesión";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Inicia sesión"
      subtitle="Volvé al control total de tu agenda."
      footer={<>© {new Date().getFullYear()} TurnoHub</>}
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <Field label="Email">
          <TextInput type="email" autoComplete="email" required placeholder="hola@negocio.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Contraseña">
          <PasswordInput autoComplete="current-password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>

        <div className="flex justify-end">
          <Link to="/recuperar" className="text-xs text-muted-foreground hover:text-primary transition-colors">¿Olvidaste tu contraseña?</Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-medium inline-flex items-center justify-center gap-2 btn-glow hover:brightness-110 active:scale-[0.99] transition disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Entrar <ArrowRight className="h-4 w-4" /></>}
        </button>

        <p className="text-sm text-muted-foreground text-center">
          ¿No tenés cuenta? <Link to="/registro" className="text-primary hover:underline">Crear cuenta</Link>
        </p>
      </form>
    </AuthShell>
  );
}
