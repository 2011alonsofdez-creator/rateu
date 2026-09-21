"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useUi } from "@/lib/i18n";
import { clienteNavegador } from "@/lib/supabase/client";
import { hasSupabase } from "@/lib/supabase/config";
import { Aviso, BotonPrincipal, Campo } from "@/components/Campo";
import { ModoDemo } from "@/components/ModoDemo";

function Formulario() {
  const { t } = useUi();
  const router = useRouter();
  const params = useSearchParams();
  const volver = params.get("volver") || "/chat";

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setCargando(true);

    const supabase = clienteNavegador();
    if (!supabase) {
      setError(t("auth.errGeneric"));
      setCargando(false);
      return;
    }

    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: pass,
    });

    if (err) {
      setError(t("auth.errCredentials"));
      setCargando(false);
      return;
    }

    // refresh() hace que el layout de servidor vuelva a leer el perfil.
    router.push(volver);
    router.refresh();
  };

  const conGoogle = async () => {
    const supabase = clienteNavegador();
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?volver=${encodeURIComponent(volver)}`,
      },
    });
  };

  return (
    <form onSubmit={entrar} className="space-y-4">
      {error && <Aviso>{error}</Aviso>}

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
