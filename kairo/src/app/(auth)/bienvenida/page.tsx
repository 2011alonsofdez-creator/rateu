"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useUi } from "@/lib/i18n";
import { completarPerfil } from "@/app/(app)/actions";
import { Aviso, BotonPrincipal, Campo } from "@/components/Campo";
import { edadEn } from "../registro/page";

/* A quien entra con Google no se le pregunta la edad en ningún momento,
   así que se la pedimos aquí. De esto depende la moderación, por eso no
   se deja pasar sin contestar. */
export default function BienvenidaPage() {
  const { t } = useUi();
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [fecha, setFecha] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const anios = edadEn(fecha);
    if (anios === null) {
      setError(t("auth.errBirth"));
      return;
    }
    if (anios < 13) {
      setError(t("auth.errTooYoung"));
      return;
    }

    setCargando(true);
    const res = await completarPerfil(nombre.trim(), fecha);
    if (!res.ok) {
      setError(res.mensaje || t("auth.errGeneric"));
      setCargando(false);
      return;
    }

    router.push("/chat");
    router.refresh();
  };

  return (
    <div className="rounded-2xl border border-line bg-panel p-6 shadow-[var(--shadow)]">
      <h1 className="text-[22px] font-semibold tracking-tight">{t("auth.welcomeTitle")}</h1>
      <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{t("auth.welcomeSub")}</p>

      <form onSubmit={enviar} className="mt-6 space-y-4">
        {error && <Aviso>{error}</Aviso>}

        <Campo
          id="nombre"
          label={t("auth.nameLabel")}
          autoComplete="given-name"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
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
          {cargando ? t("auth.working") : t("auth.welcomeCta")}
        </BotonPrincipal>
      </form>
    </div>
  );
}
