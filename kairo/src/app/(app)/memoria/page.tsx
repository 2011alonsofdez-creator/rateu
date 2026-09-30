"use client";

import { useCallback, useEffect, useState } from "react";
import { usePerfil } from "@/lib/perfil-cliente";
import { Brain } from "@/components/Icons";
import { RECUERDO_MAX } from "@/lib/memoria";

/* LA MEMORIA, A LA VISTA.
 *
 * Esta pantalla no es un extra: es la condición para que la memoria sea
 * aceptable. Una lista de cosas ciertas sobre una persona que esa
 * persona no puede leer entera, corregir y borrar no es una memoria, es
 * una ficha que alguien tiene sobre ella.
 *
 * Por eso lo que más se ve aquí no es cómo añadir, sino qué hay dentro y
 * cómo quitarlo.
 */

type Recuerdo = {
  id: string;
  texto: string;
  origen: "chat" | "mano";
  creado_el: string;
};

const EJEMPLOS: Recuerdo[] = [
  { id: "d1", texto: "Me llamo Alonso y soy de Ceuta", origen: "chat", creado_el: "" },
  { id: "d2", texto: "Estoy estudiando 2º de Bachillerato", origen: "chat", creado_el: "" },
  { id: "d3", texto: "Prefiero respuestas cortas y al grano", origen: "mano", creado_el: "" },
];

export default function MemoriaPage() {
  const perfil = usePerfil();

  const [recuerdos, setRecuerdos] = useState<Recuerdo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [falta, setFalta] = useState(false);
  const [nuevo, setNuevo] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState("");
  const [editando, setEditando] = useState("");
  const [borrador, setBorrador] = useState("");
  const [confirmarTodo, setConfirmarTodo] = useState(false);

  const cargar = useCallback(async () => {
    if (perfil.demo) {
      setRecuerdos(EJEMPLOS);
      setCargando(false);
      return;
    }
    try {
      const r = await fetch("/api/memoria", { cache: "no-store" });
      const j = await r.json();
      setRecuerdos(Array.isArray(j?.recuerdos) ? j.recuerdos : []);
      setFalta(Boolean(j?.falta));
    } catch {
      /* se queda vacía */
    } finally {
      setCargando(false);
    }
  }, [perfil.demo]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const anadir = async () => {
    const texto = nuevo.trim();
    if (!texto || guardando || perfil.demo) return;
    setGuardando(true);
    setAviso("");
    try {
      const r = await fetch("/api/memoria", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ texto }),
      });
      const j = await r.json();
      if (!r.ok) {
        setAviso(
          j?.error === "demasiados"
            ? "Has llegado al máximo de 200. Borra alguno para añadir otro."
            : j?.error === "falta_migracion"
              ? "Falta pegar la migración 0012_memoria.sql en Supabase."
              : "No se ha podido guardar.",
        );
      } else if (j?.repetido) {
        setAviso("Eso ya lo sabía.");
        setNuevo("");
      } else if (j?.recuerdo) {
        setRecuerdos((v) => [j.recuerdo, ...v]);
        setNuevo("");
      }
    } catch {
      setAviso("No se ha podido guardar.");
    } finally {
      setGuardando(false);
    }
  };

  const corregir = async (id: string) => {
    const texto = borrador.trim();
    if (!texto) return;
    setEditando("");
    // Se pinta ya y se manda después: corregir una frase no es una
    // operación que merezca una espera con el cursor parado.
    setRecuerdos((v) => v.map((r) => (r.id === id ? { ...r, texto } : r)));
    await fetch("/api/memoria", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, texto }),
    }).catch(() => {});
  };

  const olvidar = async (id: string) => {
    setRecuerdos((v) => v.filter((r) => r.id !== id));
    await fetch(`/api/memoria?id=${id}`, { method: "DELETE" }).catch(() => {});
  };

  const olvidarTodo = async () => {
    setRecuerdos([]);
    setConfirmarTodo(false);
    await fetch("/api/memoria?todo=1", { method: "DELETE" }).catch(() => {});
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-panel text-acento">
          <Brain className="h-5 w-5" />
        </span>
        <h1 className="text-[24px] font-semibold tracking-tight">Memoria</h1>
      </div>

      <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-muted">
        Lo que Kairo sabe de ti y usa en cada respuesta. Todo lo de aquí lo has dicho tú: en el
        chat, escribiendo <span className="text-fg">«recuerda que…»</span>, o a mano aquí abajo.
        Kairo no apunta nada por su cuenta.
      </p>

      {falta && (
        <div className="mt-5 rounded-2xl border border-gold/30 bg-gold/10 p-4 text-[13.5px] leading-relaxed text-gold">
          Falta montar la memoria en tu base de datos: pega{" "}
          <code>supabase/migrations/0012_memoria.sql</code> en Supabase → SQL Editor → Run.
        </div>
      )}

      {perfil.demo && (
        <div className="mt-5 rounded-2xl border border-gold/30 bg-gold/10 p-4 text-[13.5px] leading-relaxed text-gold">
          Esto es una demostración: los recuerdos de abajo son de ejemplo y no se guarda nada.
        </div>
      )}

      {/* Añadir a mano */}
      <div className="mt-6 rounded-2xl border border-line bg-panel p-4">
        <label className="mb-1.5 block text-[13px] font-medium" htmlFor="nuevo">
          Añadir algo que quieras que recuerde
        </label>
        <div className="flex flex-wrap gap-2">
          <input
            id="nuevo"
            value={nuevo}
            onChange={(e) => setNuevo(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void anadir()}
            maxLength={RECUERDO_MAX}
            placeholder="Soy alérgico al marisco"
            disabled={perfil.demo}
            className="min-w-0 flex-1 rounded-xl border border-line bg-bg-soft px-3.5 py-2 text-[14.5px] outline-none transition placeholder:text-faint focus:border-line-hi disabled:opacity-50"
          />
          <button
            onClick={() => void anadir()}
            disabled={!nuevo.trim() || guardando || perfil.demo}
            className="brand-grad rounded-xl px-4 py-2 text-[14px] font-semibold text-on-accent transition enabled:hover:opacity-90 disabled:opacity-40"
          >
            Añadir
          </button>
        </div>
        {aviso && <p className="mt-2 text-[13px] text-gold">{aviso}</p>}
      </div>

      {/* La lista */}
      <div className="mt-6">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[15px] font-semibold">
            {recuerdos.length === 0
              ? "Todavía no sé nada de ti"
              : `${recuerdos.length} ${recuerdos.length === 1 ? "cosa" : "cosas"}`}
          </h2>

          {recuerdos.length > 0 && !perfil.demo && (
            <button
              onClick={() => setConfirmarTodo(true)}
              className="text-[13px] text-muted underline underline-offset-2 transition hover:text-red"
            >
              Olvidarlo todo
            </button>
          )}
        </div>

        {/* Borrar entero tiene que ser fácil: si irse cuesta más que
            entrar, la memoria deja de ser tuya. Pero no de un clic
            despistado, que no tiene vuelta atrás. */}
        {confirmarTodo && (
          <div className="mb-3 rounded-2xl border border-red/40 bg-red/10 p-4">
            <p className="text-[13.5px] leading-relaxed">
              ¿Seguro? Kairo dejará de saber todo lo de esta lista. No se puede deshacer.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => void olvidarTodo()}
                className="rounded-xl border border-red/40 px-3 py-1.5 text-[13.5px] font-medium text-red transition hover:bg-red/10"
              >
                Sí, olvidarlo todo
              </button>
              <button
                onClick={() => setConfirmarTodo(false)}
                className="rounded-xl border border-line px-3 py-1.5 text-[13.5px] text-muted transition hover:bg-panel-hi hover:text-fg"
              >
                No
              </button>
            </div>
          </div>
        )}

        {cargando ? (
          <p className="py-6 text-center text-[14px] text-faint">Cargando…</p>
        ) : recuerdos.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line-hi p-6 text-center text-[14px] leading-relaxed text-muted">
            Díselo en el chat: <span className="text-fg">«recuerda que soy de Ceuta»</span>.
            <br />
            O escríbelo aquí arriba.
          </p>
        ) : (
          <ul className="space-y-2">
            {recuerdos.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-panel p-3"
              >
                {editando === r.id ? (
                  <>
                    <input
                      value={borrador}
                      onChange={(e) => setBorrador(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && void corregir(r.id)}
                      maxLength={RECUERDO_MAX}
                      autoFocus
                      className="min-w-0 flex-1 rounded-lg border border-line bg-bg-soft px-3 py-1.5 text-[14px] outline-none focus:border-line-hi"
                    />
                    <button
                      onClick={() => void corregir(r.id)}
                      className="rounded-lg border border-line-hi px-3 py-1.5 text-[13px] font-medium transition hover:bg-panel-hi"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => setEditando("")}
                      className="rounded-lg px-2 py-1.5 text-[13px] text-muted transition hover:text-fg"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <span className="min-w-0 flex-1 text-[14.5px] leading-relaxed">{r.texto}</span>
                    {!perfil.demo && (
                      <>
                        <button
                          onClick={() => {
                            setEditando(r.id);
                            setBorrador(r.texto);
                          }}
                          className="rounded-lg px-2 py-1 text-[13px] text-muted transition hover:text-fg"
                        >
                          Corregir
                        </button>
                        <button
                          onClick={() => void olvidar(r.id)}
                          className="rounded-lg px-2 py-1 text-[13px] text-muted transition hover:text-red"
                        >
                          Olvidar
                        </button>
                      </>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
