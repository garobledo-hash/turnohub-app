import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AuthShell } from "@/components/AuthShell";
import { Field, TextInput } from "@/components/FormField";
import { ArrowRight, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPassword() {
  const { sendReset } = useAuth();
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [sent, setSent] = useState<boolean>(false);

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setLoading(true);
    try {
      await sendReset(email.trim());
      setSent(true);
      toast.success("Te enviamos un email para recuperar tu contraseña.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "No pudimos enviar el email");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Recuperar contraseña" subtitle="Te enviamos un link para restablecerla.">
      {sent ? (
        <div className="space-y-4 text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 grid place-items-center">
            <MailCheck className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Si el email existe en TurnoHub recibirás el link para restablecer tu contraseña.</p>
          <Link to="/login" className="inline-block text-sm text-primary hover:underline">Volver a iniciar sesión</Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5">
          <Field label="Email">
            <TextInput type="email" required placeholder="hola@negocio.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <button type="submit" disabled={loading} className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-medium inline-flex items-center justify-center gap-2 btn-glow hover:brightness-110 transition disabled:opacity-60">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Enviar link <ArrowRight className="h-4 w-4" /></>}
          </button>
          <p className="text-sm text-muted-foreground text-center">
            <Link to="/login" className="text-primary hover:underline">Volver</Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}
