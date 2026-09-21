"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useUi } from "@/lib/i18n";
import { clienteNavegador } from "@/lib/supabase/client";
import { hasSupabase } from "@/lib/supabase/config";
import { Aviso, BotonPrincipal, Campo } from "@/components/Campo";
import { ModoDemo } from "@/components/ModoDemo";

/** Años cumplidos a día de hoy. */
export function edadEn(fecha: string): number | null {
  const d = new Date(`${fecha}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;

  const hoy = new Date();
  if (d > hoy || d.getFullYear() < 1900) return null;

  let anios = hoy.getFullYear() - d.getFullYear();
  const mes = hoy.getMonth() - d.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < d.getDate())) anios--;
  return anios;
}

function Formulario() {
  const { t } = useUi();
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [fecha, setFecha] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [revisaCorreo, setRevisaCorreo] = useState(false);

  const registrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (pass.length < 8) {
      setError(t("auth.errPass"));
      return;
    }

    const anios = edadEn(fecha);
    if (anios === null) {
      setError(t("auth.errBirth"));
      return;
    }

    // Un menor de 13 años no puede abrirse cuenta: la ley exige el
    // consentimiento de un adulto, así que entra como perfil hijo.
    if (anios < 13) {
      setError(t("auth.errTooYoung"));
      return;
    }

    setCargando(true);
    const supabase = clienteNavegador();
    if (!supabase) {
      setError(t("auth.errGeneric"));
      setCargando(false);
      return;
    }

    const { data, error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password: pass,
      options: {
        // El disparador de la base de datos lee estos datos para crear
        // el perfil y calcular el modo de edad.
        data: { nombre: nombre.trim(), fecha_nacimiento: fecha },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (err) {
      setError(err.message || t("auth.errGeneric"));
      setCargando(false);
      return;
    }

    if (data.session) {
      router.push("/chat");
      router.refresh();
      return;
    }

    // Confirmación por correo activada: no hay sesión todavía.
    setRevisaCorreo(true);
    setCargando(false);
  };

  if (revisaCorreo) {
    return (
      <div className="rounded-xl border border-green/30 bg-green/10 p-4">
        <p className="text-[15px] font-medium text-green">{t("auth.checkTitle")}</p>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{t("auth.checkSub")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={registrar} className="space-y-4">
      {error && <Aviso>{error}</Aviso>}

      <Campo
        id="nombre"
        label={t("auth.nameLabel")}
        autoComplete="given-name"
        required
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
      />
      <Campo
        id="email"
        type="email"
        label={t("auth.emailLabel")}
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Campo
        id="pass"
        type="password"
        label={t("auth.passLabel")}
        autoComplete="new-password"
        minLength={8}
        required
        value={pass}
        onChange={(e) => setPass(e.target.value)}
      />
      <Campo
        id="fecha"
        type="date"
        label={t("auth.birthLabel")}
        ayuda={t("auth.birthHelp")}
        required
        max={new Date().toISOString().slice(0, 10)}
        value={fecha}
        onChange={(e) => setFecha(e.target.value)}
      />

      <BotonPrincipal type="submit" cargando={cargando}>
        {cargando ? t("auth.working") : t("auth.registerCta")}
      </BotonPrincipal>

      <p className="text-center text-[12px] leading-relaxed text-faint">{t("auth.terms")}</p>

      <p className="text-center text-[13.5px] text-muted">
        {t("auth.haveAccount")}{" "}
        <Link href="/entrar" className="font-medium text-fg underline-offset-4 hover:underline">
          {t("auth.goLogin")}
        </Link>
      </p>
    </form>
  );
}

export default function RegistroPage() {
  const { t } = useUi();

  return (
    <div className="rounded-2xl border border-line bg-panel p-6 shadow-[var(--shadow)]">
      <h1 className="text-[22px] font-semibold tracking-tight">{t("auth.registerTitle")}</h1>
      <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{t("auth.registerSub")}</p>
      <div className="mt-6">{hasSupabase ? <Formulario /> : <ModoDemo />}</div>
    </div>
  );
}
