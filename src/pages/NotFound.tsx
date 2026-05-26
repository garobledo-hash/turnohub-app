import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center p-6 text-center">
      <div>
        <Logo />
        <h1 className="mt-8 text-6xl font-semibold tracking-tight">404</h1>
        <p className="mt-2 text-muted-foreground">Esta página no existe.</p>
        <Link to="/" className="mt-6 inline-flex items-center h-10 px-4 rounded-xl bg-primary text-primary-foreground font-medium btn-glow hover:brightness-110 transition">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
