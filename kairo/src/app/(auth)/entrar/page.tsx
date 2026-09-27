"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useUi } from "@/lib/i18n";
import { clienteNavegador } from "@/lib/supabase/client";
import { LOGIN_GOOGLE, SUPABASE_HOST, hasSupabase } from "@/lib/supabase/config";
import { razonDeAuth, textoDeRazon, type Razon } from "@/lib/supabase/errores";
import { Aviso, BotonPrincipal, Campo } from "@/components/Campo";
import { ModoDemo } from "@/components/ModoDemo";

function Formulario() {
  const { t } = useUi();
  const router = useRouter();
  const params = useSearchParams();
  const volver = params.get("volver") || "/chat";

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  /* El motivo, no el mensaje. El mensaje se saca de aquí al pintar, y
     además hay motivos que traen su propio botón. */
  const [razon, setRazon] = useState<Razon | null>(
    // El callback rebota aquí cuando un enlace del correo ya no vale.
    params.get("error") ? "enlace_caducado" : null,
  );
  const [cargando, setCargando] = useState(false);
  const [reenviado, setReenviado] = useState(false);

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setRazon(null);
    setReenviado(false);
    setCargando(true);

    const supabase = clienteNavegador();
    if (!supabase) {
      setRazon("otro");
      setCargando(false);
      return;
    }

    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: pass,
    });

    if (err) {
      /* Antes esto decía "correo o contraseña incorrectos" pasara lo que
         pasara, y mandaba a cambiar una contraseña que estaba bien.
         Ahora se dice lo que ha fallado de verdad. */
      setRazon(razonDeAuth(err));
      setCargando(false);
      return;
    }

    // refresh() hace que el layout de servidor vuelva a leer el perfil.
    router.push(volver);
    router.refresh();
  };

  /* Falta confirmar el correo: el enlace se le manda otra vez sin que
     tenga que registrarse de nuevo. Es el arreglo de un vistazo para el
     caso más habitual de "mi contraseña es la buena y no me deja". */
  const reenviar = async () => {
    const supabase = clienteNavegador();
    if (!supabase) return;

    setCargando(true);
    const { error: err } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setCargando(false);

    if (err) {
      setRazon(razonDeAuth(err));
      return;
    }
    setRazon(null);
    setReenviado(true);
  };

  const conGoogle = async () => {
    setRazon(null);
    const supabase = clienteNavegador();
    if (!supabase) return;

    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?volver=${encodeURIComponent(volver)}`,
      },
    });

    // Si Google no está dado de alta en Supabase, mejor un aviso claro
    // que la pantalla de error en crudo que devuelve el servidor.
    if (err) setRazon("otro");
  };

  return (
    <form onSubmit={entrar} className="space-y-4">
      {razon && (
        <div className="space-y-2">
          <Aviso>{t(textoDeRazon(razon))}</Aviso>

          {/* Cuando no se llega al servidor, lo que hace falta saber es
              A CUÁL no se llega: casi siempre es que la dirección
              configurada no es la del proyecto. El nombre del sitio ya
              viaja dentro del código que se descarga el navegador, así
              que enseñarlo no destapa nada. */}
          {razon === "sin_conexion" && SUPABASE_HOST && (
            <p className="text-[12.5px] leading-relaxed text-faint">
              {t("auth.triedHost")} <span className="font-mono text-muted">{SUPABASE_HOST}</span>
              {" · "}
              <a href="/api/estado" target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-fg">
                {t("auth.seeDiagnosis")}
              </a>
            </p>
          )}

          {razon === "sin_confirmar" && (
            <button
              type="button"
              onClick={reenviar}
              disabled={cargando || !email.trim()}
              className="w-full rounded-xl border border-line-hi px-4 py-2 text-[13.5px] font-medium transition enabled:hover:bg-panel-hi disabled:opacity-50"
            >
              {t("auth.resendCta")}
            </button>
          )}
        </div>
      )}

      {reenviado && (
        <p className="rounded-xl border border-green/30 bg-green/10 px-3.5 py-2.5 text-[13.5px] leading-relaxed text-green">
          {t("auth.resendDone")}
        </p>
      )}

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
        autoComplete="current-password"
        required
        value={pass}
        onChange={(e) => setPass(e.target.value)}
      />

      <BotonPrincipal type="submit" cargando={cargando}>
        {cargando ? t("auth.working") : t("auth.loginCta")}
      </BotonPrincipal>

      <p className="text-center text-[13px]">
        <Link href="/recuperar" className="text-muted underline-offset-4 hover:text-fg hover:underline">
          {t("auth.forgot")}
        </Link>
      </p>

      {LOGIN_GOOGLE && (
        <>
          <div className="flex items-center gap-3 py-1">
            <span className="h-px flex-1 bg-line" />
            <span className="text-[12px] text-faint">{t("auth.or")}</span>
            <span className="h-px flex-1 bg-line" />
          </div>

          <button
            type="button"
            onClick={conGoogle}
            className="w-full rounded-xl border border-line-hi px-4 py-2.5 text-[14.5px] font-medium transition hover:bg-panel-hi"
          >
            {t("auth.google")}
          </button>
        </>
      )}

      <p className="pt-2 text-center text-[13.5px] text-muted">
        {t("auth.noAccount")}{" "}
        <Link href="/registro" className="font-medium text-fg underline-offset-4 hover:underline">
          {t("auth.goRegister")}
        </Link>
      </p>
    </form>
  );
}

export default function EntrarPage() {
  const { t } = useUi();

  return (
    <div className="rounded-2xl border border-line bg-panel p-6 shadow-[var(--shadow)]">
      <h1 className="text-[22px] font-semibold tracking-tight">{t("auth.loginTitle")}</h1>
      <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{t("auth.loginSub")}</p>

      <div className="mt-6">
        {hasSupabase ? (
          <Suspense fallback={null}>
            <Formulario />
          </Suspense>
        ) : (
          <ModoDemo />
        )}
      </div>
    </div>
  );
}
