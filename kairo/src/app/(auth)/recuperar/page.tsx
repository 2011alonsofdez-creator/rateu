"use client";

import Link from "next/link";
import { useState } from "react";
import { useUi } from "@/lib/i18n";
import { clienteNavegador } from "@/lib/supabase/client";
import { hasSupabase } from "@/lib/supabase/config";
import { razonDeAuth, textoDeRazon, type Razon } from "@/lib/supabase/errores";
import { Aviso, BotonPrincipal, Campo } from "@/components/Campo";
import { ModoDemo } from "@/components/ModoDemo";

/* Cambiar la contraseña cuando no te acuerdas.
 *
 * Faltaba, y se notaba: con la pantalla de entrar diciendo "contraseña
 * incorrecta" y sin forma de cambiarla, quedarse fuera de tu propia
 * cuenta era definitivo.
 *
 * Lo que se envía es un enlace al correo. Pasa por /auth/callback, que
 * canjea el código por una sesión de recuperación y suelta en
 * /nueva-clave, donde se escribe la nueva.
 */

function Formulario() {
  const { t } = useUi();
  const [email, setEmail] = useState("");
  const [razon, setRazon] = useState<Razon | null>(null);
  const [cargando, setCargando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setRazon(null);
    setCargando(true);

    const supabase = clienteNavegador();
    if (!supabase) {
      setRazon("otro");
      setCargando(false);
      return;
    }

    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?volver=/nueva-clave`,
    });
    setCargando(false);

    if (err) {
      setRazon(razonDeAuth(err));
      return;
    }

    /* Se dice "si ese correo tiene cuenta" a propósito: confirmar que un
       correo está registrado le diría a cualquiera quién tiene cuenta
       aquí, y eso no es asunto de quien escribe en esta caja. */
    setEnviado(true);
  };

  if (enviado) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-green/30 bg-green/10 p-4">
          <p className="text-[15px] font-medium text-green">{t("auth.resetDone")}</p>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{t("auth.resetDoneSub")}</p>
        </div>
        <p className="text-center text-[13.5px] text-muted">
          <Link href="/entrar" className="font-medium text-fg underline-offset-4 hover:underline">
            {t("auth.backToLogin")}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      {razon && <Aviso>{t(textoDeRazon(razon))}</Aviso>}

      <Campo
        id="email"
        type="email"
        label={t("auth.emailLabel")}
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <BotonPrincipal type="submit" cargando={cargando}>
        {cargando ? t("auth.working") : t("auth.resetCta")}
      </BotonPrincipal>

      <p className="text-center text-[13.5px] text-muted">
        <Link href="/entrar" className="font-medium text-fg underline-offset-4 hover:underline">
          {t("auth.backToLogin")}
        </Link>
      </p>
    </form>
  );
}

export default function RecuperarPage() {
  const { t } = useUi();

  return (
    <div className="rounded-2xl border border-line bg-panel p-6 shadow-[var(--shadow)]">
      <h1 className="text-[22px] font-semibold tracking-tight">{t("auth.resetTitle")}</h1>
      <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{t("auth.resetSub")}</p>
      <div className="mt-6">{hasSupabase ? <Formulario /> : <ModoDemo />}</div>
    </div>
  );
}
