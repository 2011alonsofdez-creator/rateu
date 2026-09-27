"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useUi } from "@/lib/i18n";
import { clienteNavegador } from "@/lib/supabase/client";
import { hasSupabase } from "@/lib/supabase/config";
import { razonDeAuth, textoDeRazon, type Razon } from "@/lib/supabase/errores";
import { Aviso, BotonPrincipal, Campo } from "@/components/Campo";
import { ModoDemo } from "@/components/ModoDemo";

/* Aquí se aterriza desde el enlace del correo, ya con una sesión de
   recuperación puesta por /auth/callback. Lo único que queda es escribir
   la contraseña nueva.
 *
 * Si alguien entra por su cuenta escribiendo la dirección, no hay
 * sesión: entonces se dice que el enlace no vale, en vez de enseñar un
 * formulario que va a fallar al guardar. */

function Formulario() {
  const { t } = useUi();
  const router = useRouter();

  const [pass, setPass] = useState("");
  const [razon, setRazon] = useState<Razon | null>(null);
  const [cargando, setCargando] = useState(false);
  /** null = todavía se está comprobando si hay sesión. */
  const [conEnlace, setConEnlace] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = clienteNavegador();
    if (!supabase) {
      setConEnlace(false);
      return;
    }
    supabase.auth.getUser().then(({ data }) => setConEnlace(Boolean(data.user)));
  }, []);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setRazon(null);

    if (pass.length < 8) {
      setRazon("clave_debil");
      return;
    }

    const supabase = clienteNavegador();
    if (!supabase) {
      setRazon("otro");
      return;
    }

    setCargando(true);
    const { error: err } = await supabase.auth.updateUser({ password: pass });
    setCargando(false);

    if (err) {
      setRazon(razonDeAuth(err));
      return;
    }

    router.push("/chat");
    router.refresh();
  };

  if (conEnlace === null) return null;

  if (!conEnlace) {
    return (
      <div className="space-y-4">
        <Aviso>{t("auth.newPassNoLink")}</Aviso>
        <p className="text-center text-[13.5px] text-muted">
          <Link href="/recuperar" className="font-medium text-fg underline-offset-4 hover:underline">
            {t("auth.forgot")}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={guardar} className="space-y-4">
      {razon && <Aviso>{t(textoDeRazon(razon))}</Aviso>}

      <Campo
        id="pass"
        type="password"
        label={t("auth.newPassLabel")}
        autoComplete="new-password"
        minLength={8}
        required
        value={pass}
        onChange={(e) => setPass(e.target.value)}
      />

      <BotonPrincipal type="submit" cargando={cargando}>
        {cargando ? t("auth.working") : t("auth.newPassCta")}
      </BotonPrincipal>
    </form>
  );
}

export default function NuevaClavePage() {
  const { t } = useUi();

  return (
    <div className="rounded-2xl border border-line bg-panel p-6 shadow-[var(--shadow)]">
      <h1 className="text-[22px] font-semibold tracking-tight">{t("auth.newPassTitle")}</h1>
      <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{t("auth.newPassSub")}</p>
      <div className="mt-6">{hasSupabase ? <Formulario /> : <ModoDemo />}</div>
    </div>
  );
}
