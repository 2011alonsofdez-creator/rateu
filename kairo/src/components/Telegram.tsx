"use client";

import { useCallback, useEffect, useState } from "react";
import { useUi } from "@/lib/i18n";
import { usePerfil } from "@/lib/perfil-cliente";
import { copiarTexto } from "@/lib/copiar";

/* RECIBIR LOS CO-WORKS EN EL MÓVIL.
 *
 * Toda la pantalla existe por un paso que la gente no sabe dar: Telegram
 * no te dice cuál es tu identificador de conversación por ningún sitio.
 * Así que no se pide: Kairo te da un código, tú se lo mandas al bot y él
 * mira quién lo ha enviado.
 *
 * Y el botón de abrir el bot lleva el código puesto, así que en el móvil
 * son dos toques: abrir y enviar.
 */

type Estado = {
  bot: boolean;
  vinculado: boolean;
  codigo?: string | null;
  usuario?: string | null;
  falta?: boolean;
  demo?: boolean;
};

export function Telegram() {
  const { lang } = useUi();
  const es = lang === "es";
  const perfil = usePerfil();

  const [estado, setEstado] = useState<Estado | null>(null);
  const [trabajando, setTrabajando] = useState(false);
  const [aviso, setAviso] = useState("");
  const [copiado, setCopiado] = useState(false);

  const mirar = useCallback(async () => {
    try {
      const r = await fetch("/api/telegram", { cache: "no-store" });
      setEstado((await r.json()) as Estado);
    } catch {
      setEstado({ bot: false, vinculado: false });
    }
  }, []);

  useEffect(() => {
    void mirar();
  }, [mirar]);

  const pedir = async (cuerpo: object | null, metodo = "POST") => {
    setTrabajando(true);
    setAviso("");
    try {
      const r = await fetch("/api/telegram", {
        method: metodo,
        headers: cuerpo ? { "content-type": "application/json" } : undefined,
        body: cuerpo ? JSON.stringify(cuerpo) : undefined,
      });
      const j = await r.json().catch(() => null);

      if (!r.ok) {
        setAviso(
          j?.error === "no_encontrado"
            ? es
              ? "No he visto tu código. Asegúrate de haberlo enviado al bot y vuelve a darle."
              : "I have not seen your code. Make sure you sent it to the bot and try again."
            : j?.error === "falta_migracion"
              ? es
                ? "Falta pegar la migración 0013_telegram.sql en Supabase."
                : "Migration 0013_telegram.sql has not been run in Supabase yet."
              : es
                ? "No ha salido. Inténtalo otra vez en un minuto."
                : "That did not work. Try again in a minute."
        );
        return;
      }

      setAviso(es ? "Hecho." : "Done.");
      await mirar();
    } catch {
      setAviso(es ? "No ha salido." : "That did not work.");
    } finally {
      setTrabajando(false);
    }
  };

  if (!estado) {
    return <p className="text-[13.5px] text-faint">{es ? "Mirándolo…" : "Checking…"}</p>;
  }

  /* Sin bot no hay nada que enlazar, así que lo que se enseña es cómo
     crearlo. Son tres pasos y ninguno se puede saltar. */
  if (!estado.bot) {
    return (
      <div className="text-[13.5px] leading-relaxed text-muted">
        <p>
          {es
            ? "Para que Kairo te escriba al móvil hace falta un bot tuyo. Es gratis y se tarda un minuto:"
            : "For Kairo to message your phone you need a bot of your own. It is free and takes a minute:"}
        </p>
        <ol className="mt-3 space-y-2">
          <li>
            <strong>1.</strong>{" "}
            {es ? "En Telegram, habla con " : "In Telegram, open "}
            <a
              href="https://t.me/BotFather"
              target="_blank"
              rel="noreferrer noopener"
              className="text-acento underline underline-offset-2"
            >
              @BotFather
            </a>{" "}
            {es ? "y escríbele " : "and send it "}
            <code className="rounded-md border border-line bg-bg-soft px-1.5 py-0.5 font-mono text-[12px]">
              /newbot
            </code>
            .
          </li>
          <li>
            <strong>2.</strong>{" "}
            {es
              ? "Te pedirá un nombre. Cuando acabes te da un testigo largo: cópialo."
              : "It asks for a name. When you finish it gives you a long token: copy it."}
          </li>
          <li>
            <strong>3.</strong>{" "}
            {es ? "En Vercel → Settings → Environment Variables, añade " : "In Vercel → Settings → Environment Variables, add "}
            <code className="rounded-md border border-line bg-bg-soft px-1.5 py-0.5 font-mono text-[12px]">
              TELEGRAM_BOT_TOKEN
            </code>{" "}
            {es
              ? "con ese testigo de valor, y vuelve a desplegar (Deployments → los tres puntos → Redeploy)."
              : "with that token as the value, then redeploy (Deployments → the three dots → Redeploy)."}
          </li>
        </ol>
        <p className="mt-3 text-[12.5px] text-faint">
          {es
            ? "Ese testigo es una contraseña: no se la enseñes a nadie, ni a mí."
            : "That token is a password: do not show it to anyone, me included."}
        </p>
      </div>
    );
  }

  if (perfil.demo) {
    return (
      <p className="text-[13.5px] leading-relaxed text-muted">
        {es
          ? "En la demostración no se puede enlazar: hace falta tu cuenta."
          : "Linking is not available in the demo: it needs your account."}
      </p>
    );
  }

  if (estado.falta) {
    return (
      <p className="rounded-xl border border-gold/30 bg-gold/10 p-3 text-[13px] leading-relaxed text-gold">
        {es
          ? "Falta pegar supabase/migrations/0013_telegram.sql en Supabase → SQL Editor → Run."
          : "Run supabase/migrations/0013_telegram.sql in Supabase → SQL Editor → Run first."}
      </p>
    );
  }

  if (estado.vinculado) {
    return (
      <div>
        <p className="text-[13.5px] leading-relaxed text-muted">
          <span className="font-medium text-green">✓ {es ? "Conectado" : "Connected"}</span>
          {es
            ? ". Lo que preparen tus Co-Works te llegará a Telegram en cuanto esté."
            : ". Whatever your Co-Works prepare will reach you on Telegram as soon as it is ready."}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => void pedir({ accion: "probar" })}
            disabled={trabajando}
            className="rounded-xl border border-line-hi px-3.5 py-2 text-[13.5px] font-medium transition enabled:hover:bg-panel-hi disabled:opacity-50"
          >
            {es ? "Mandarme una prueba" : "Send me a test"}
          </button>
          <button
            onClick={() => void pedir(null, "DELETE")}
            disabled={trabajando}
            className="rounded-xl px-3 py-2 text-[13.5px] text-muted transition hover:text-red disabled:opacity-50"
          >
            {es ? "Desconectar" : "Disconnect"}
          </button>
        </div>
        {aviso && <p className="mt-2 text-[13px] text-muted">{aviso}</p>}
      </div>
    );
  }

  const codigo = estado.codigo ?? "";
  // Con el código ya escrito: en el móvil son dos toques, abrir y enviar.
  const enlace = estado.usuario
    ? `https://t.me/${estado.usuario}?text=${encodeURIComponent(codigo)}`
    : null;

  return (
    <div className="text-[13.5px] leading-relaxed text-muted">
      <p>
        {es
          ? "Mándale este código a tu bot y pulsa Comprobar. Telegram no enseña tu identificador por ningún sitio, así que es la forma de saber cuál eres."
          : "Send this code to your bot and press Check. Telegram never shows your chat id anywhere, so this is how it knows which one you are."}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <code className="rounded-lg border border-line bg-bg-soft px-2.5 py-1.5 font-mono text-[14px] tracking-wider text-fg">
          {codigo}
        </code>
        <button
          onClick={async () => {
            if (await copiarTexto(codigo)) {
              setCopiado(true);
              setTimeout(() => setCopiado(false), 1800);
            }
          }}
          className="rounded-lg border border-line px-2.5 py-1.5 text-[12.5px] transition hover:border-line-hi hover:text-fg"
        >
          {copiado ? (es ? "copiado" : "copied") : es ? "copiar" : "copy"}
        </button>
        {enlace && (
          <a
            href={enlace}
            target="_blank"
            rel="noreferrer noopener"
            className="rounded-lg border border-acento/50 bg-acento/10 px-2.5 py-1.5 text-[12.5px] font-medium text-acento transition hover:bg-acento/20"
          >
            {es ? "Abrir el bot con el código puesto" : "Open the bot with the code filled in"}
          </a>
        )}
      </div>

      <button
        onClick={() => void pedir({ accion: "vincular" })}
        disabled={trabajando}
        className="brand-grad mt-3 rounded-xl px-4 py-2 text-[13.5px] font-semibold text-on-accent transition enabled:hover:opacity-90 disabled:opacity-50"
      >
        {trabajando ? (es ? "Comprobando…" : "Checking…") : es ? "Ya se lo he enviado" : "I have sent it"}
      </button>

      {aviso && <p className="mt-2 text-[13px] text-gold">{aviso}</p>}
    </div>
  );
}
