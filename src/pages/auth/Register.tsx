import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AuthShell } from "@/components/AuthShell";
import { Field, TextInput } from "@/components/FormField";
import { PasswordInput } from "@/components/PasswordInput";
import { ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function Register() {
  const { signUp, signIn, session } = useAuth();
  const nav = useNavigate();

  const [fullName, setFullName] = useState<string>("");
  const [business, setBusiness] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  if (session) return <Navigate to="/dashboard" replace />;

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setLoading(true);
    try {
      await signUp({ email: email.trim(), password, full_name: fullName.trim(), business_name: business.trim() });
      // try to log in (works if email confirmation is disabled)
      try {
        await signIn(email.trim(), password);
        toast.success("¡Cuenta creada! 7 días de prueba activados.");
        nav("/dashboard");
      } catch {
        toast.success("Te enviamos un email para confirmar tu cuenta.");
        nav("/login");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "No pudimos crear tu cuenta";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Crear tu cuenta"
      subtitle="7 días de prueba. Sin tarjeta. Empieza en menos de 1 minuto."
      footer={<>Al crear una cuenta aceptás los términos y la política de privacidad.</>}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Tu nombre">
            <TextInput required placeholder="Camila Pérez" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </Field>
          <Field label="Negocio">
            <TextInput required placeholder="Studio Camila" value={business} onChange={(e) => setBusiness(e.target.value)} />
          </Field>
        </div>
        <Field label="Email">
          <TextInput type="email" required placeholder="hola@negocio.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Contraseña" hint="Mínimo 6 caracteres.">
          <PasswordInput required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>

        <ul className="space-y-1.5 text-xs text-muted-foreground py-1">
          {["7 días gratis, sin tarjeta", "Link público para tus clientes", "Cancela cuando quieras"].map((t) => (
            <li key={t} className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> {t}</li>
          ))}
        </ul>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-medium inline-flex items-center justify-center gap-2 btn-glow hover:brightness-110 active:scale-[0.99] transition disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Crear cuenta <ArrowRight className="h-4 w-4" /></>}
        </button>

        <p className="text-sm text-muted-foreground text-center">
          ¿Ya tenés cuenta? <Link to="/login" className="text-primary hover:underline">Iniciar sesión</Link>
        </p>
      </form>
    </AuthShell>
  );
}
