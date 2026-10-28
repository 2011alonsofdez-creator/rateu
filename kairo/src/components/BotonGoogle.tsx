"use client";

import { useUi } from "@/lib/i18n";
import { clienteNavegador } from "@/lib/supabase/client";
import { LOGIN_GOOGLE } from "@/lib/supabase/config";

/* "CONTINUAR CON GOOGLE", EN LAS DOS PUERTAS.
 *
 * Estaba solo en Entrar, y faltaba justo donde más hace falta: quien se
 * registra es quien todavía no tiene cuenta, o sea el único que de
 * verdad se ahorra inventarse una contraseña. En Entrar lo usa quien ya
 * entró con Google alguna vez.
 *
 * Y va en un componente compartido, no copiado en las dos pantallas,
 * porque con Google entrar y registrarse SON LO MISMO: Google dice
 * quién eres y Supabase crea la cuenta si no existía. Dos copias del
 * mismo botón acabarían divergiendo, y entonces una de las dos puertas
 * dejaría de funcionar sin que nadie se enterase.
 *
 * Solo sale si está encendido a propósito (NEXT_PUBLIC_LOGIN_GOOGLE=1):
 * sin dar Google de alta en Supabase, el botón contesta "provider is
 * not enabled" en crudo, y un botón que siempre falla es peor que no
 * tenerlo.
 */
export function BotonGoogle({
  volver = "/chat",
  onFallo,
}: {
  /** A dónde ir después de entrar. */
  volver?: string;
  /** Para que cada pantalla avise a su manera. */
  onFallo?: () => void;
}) {
  const { t } = useUi();
  if (!LOGIN_GOOGLE) return null;

  const ir = async () => {
    const supabase = clienteNavegador();
    if (!supabase) return onFallo?.();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?volver=${encodeURIComponent(volver)}`,
      },
    });

    if (error) onFallo?.();
  };

  return (
    <>
      <div className="flex items-center gap-3 py-1">
        <span className="h-px flex-1 bg-line" />
        <span className="text-[12px] text-faint">{t("auth.or")}</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <button
        type="button"
        onClick={ir}
        className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-line-hi px-4 py-2.5 text-[14.5px] font-medium transition hover:bg-panel-hi"
      >
        {/* La G de Google, con sus cuatro colores. Van a fuego y no con
            `currentColor` a propósito: Google pide que su marca se vea
            como es suya, y además es lo que hace que el botón se
            reconozca de un vistazo sin leerlo. */}
        <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" aria-hidden>
          <path fill="#4285F4" d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7c2.2-2 3.4-5 3.4-8.6z" />
          <path fill="#34A853" d="M12 24c3.1 0 5.7-1 7.6-2.8l-3.7-2.9c-1 .7-2.3 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v3C3.7 21.4 7.6 24 12 24z" />
          <path fill="#FBBC05" d="M5.6 14.7a7.2 7.2 0 0 1 0-4.6v-3H1.8a12 12 0 0 0 0 10.6l3.8-3z" />
          <path fill="#EA4335" d="M12 4.8c1.7 0 3.2.6 4.4 1.7l3.3-3.3C17.7 1.2 15.1 0 12 0 7.6 0 3.7 2.6 1.8 6.1l3.8 3c.9-2.7 3.4-4.3 6.4-4.3z" />
        </svg>
        {t("auth.google")}
      </button>
    </>
  );
}
