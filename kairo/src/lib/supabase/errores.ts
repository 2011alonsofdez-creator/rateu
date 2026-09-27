import type { AuthError } from "@supabase/supabase-js";
import type { TKey } from "@/lib/i18n";

/* Por qué NO te ha dejado entrar.
 *
 * Esto nace de un fallo real y de los caros: la pantalla de entrar
 * enseñaba "ese correo o esa contraseña no son correctos" pasara lo que
 * pasara. Y lo que pasaba casi nunca era eso. Podía ser que faltara
 * confirmar el correo, que Supabase estuviera cortando por exceso de
 * intentos, o que la dirección del servidor estuviera mal escrita en las
 * variables de entorno —y entonces el navegador no llegaba ni a
 * preguntar—. Tres problemas distintos, tres soluciones distintas, y un
 * solo mensaje que apuntaba al único sitio donde no estaba el fallo:
 * la contraseña. Con eso se pierden horas mirando lo que ya está bien.
 *
 * Así que aquí se traduce el error de Supabase a un motivo concreto, y
 * cada motivo dice qué hacer. Se mira `code` primero, que es el campo
 * estable; el texto del mensaje solo como último recurso, porque cambia
 * cuando a Supabase le apetece.
 */

export type Razon =
  /** La contraseña o el correo no coinciden. El único caso que antes se contaba bien. */
  | "credenciales"
  /** La cuenta existe y la contraseña vale: falta abrir el enlace del correo. */
  | "sin_confirmar"
  /** Demasiados intentos seguidos: Supabase está cortando. */
  | "muchos_intentos"
  /** No se ha llegado al servidor: sin red, o la dirección está mal. */
  | "sin_conexion"
  /** Ese correo ya tiene cuenta (al registrarse). */
  | "ya_existe"
  /** La dirección de correo no le vale a Supabase. */
  | "correo_invalido"
  /** El registro está cerrado en el panel de Supabase. */
  | "registro_cerrado"
  /** Contraseña demasiado corta o demasiado fácil. */
  | "clave_debil"
  /** El enlace del correo ha caducado o ya se ha usado. */
  | "enlace_caducado"
  /** Se ha roto del lado de Supabase (5xx). No es culpa de quien entra. */
  | "servidor"
  /** Cualquier otra cosa. */
  | "otro";

/* Los códigos que manda Supabase. Un mapa y no una cadena de ifs porque
   esta lista crece cada vez que ellos añaden un caso. */
const POR_CODIGO: Record<string, Razon> = {
  invalid_credentials: "credenciales",
  email_not_confirmed: "sin_confirmar",
  phone_not_confirmed: "sin_confirmar",
  over_request_rate_limit: "muchos_intentos",
  over_email_send_rate_limit: "muchos_intentos",
  over_sms_send_rate_limit: "muchos_intentos",
  user_already_exists: "ya_existe",
  email_exists: "ya_existe",
  phone_exists: "ya_existe",
  email_address_invalid: "correo_invalido",
  email_address_not_authorized: "correo_invalido",
  signup_disabled: "registro_cerrado",
  email_provider_disabled: "registro_cerrado",
  provider_disabled: "registro_cerrado",
  weak_password: "clave_debil",
  otp_expired: "enlace_caducado",
  flow_state_expired: "enlace_caducado",
  flow_state_not_found: "enlace_caducado",
  bad_code_verifier: "enlace_caducado",
  validation_failed: "otro",
};

/** Lo que devuelve Supabase cuando algo va mal al entrar o registrarse. */
type Fallo = Pick<AuthError, "message"> & {
  code?: string;
  status?: number;
  name?: string;
};

/** Qué ha pasado de verdad. */
export function razonDeAuth(err: Fallo | null | undefined): Razon {
  if (!err) return "otro";

  const codigo = err.code?.toLowerCase();
  if (codigo && POR_CODIGO[codigo] && POR_CODIGO[codigo] !== "otro") {
    return POR_CODIGO[codigo];
  }

  /* Sin respuesta del servidor. Supabase lo marca con su propio nombre
     de error y con status 0, pero también llega como el "Failed to
     fetch" pelado del navegador cuando la URL no existe. Es el motivo
     que más despista, porque desde fuera se ve igual que una contraseña
     mal puesta: la pantalla dice que no y no dice por qué. */
  const texto = (err.message ?? "").toLowerCase();
  if (
    err.name === "AuthRetryableFetchError" ||
    err.status === 0 ||
    /failed to fetch|load failed|networkerror|network request failed|fetch failed/.test(texto)
  ) {
    return "sin_conexion";
  }

  if (typeof err.status === "number" && err.status >= 500) return "servidor";
  if (err.status === 429) return "muchos_intentos";

  // Y ahora sí, el texto, para las versiones que no mandan `code`.
  if (/not confirmed|confirm your email/.test(texto)) return "sin_confirmar";
  if (/invalid login credentials|invalid credentials/.test(texto)) return "credenciales";
  if (/already registered|already exists/.test(texto)) return "ya_existe";
  if (/rate limit|too many requests/.test(texto)) return "muchos_intentos";
  if (/expired|invalid flow state|code verifier/.test(texto)) return "enlace_caducado";
  if (/signups? (not allowed|disabled)/.test(texto)) return "registro_cerrado";
  if (/password.*(short|weak)|weak password/.test(texto)) return "clave_debil";
  if (/invalid email|email.*invalid/.test(texto)) return "correo_invalido";

  return "otro";
}

/* Cada motivo, con su clave de texto. Están en i18n.tsx, en los dos
   idiomas, y dicen qué hacer y no solo qué ha fallado. */
const TEXTO: Record<Razon, TKey> = {
  credenciales: "auth.errCredentials",
  sin_confirmar: "auth.errUnconfirmed",
  muchos_intentos: "auth.errTooMany",
  sin_conexion: "auth.errOffline",
  ya_existe: "auth.errExists",
  correo_invalido: "auth.errEmail",
  registro_cerrado: "auth.errSignupOff",
  clave_debil: "auth.errPass",
  enlace_caducado: "auth.errLinkDead",
  servidor: "auth.errServer",
  otro: "auth.errGeneric",
};

/** La clave del texto que hay que enseñar para este motivo. */
export function textoDeRazon(razon: Razon): TKey {
  return TEXTO[razon];
}
