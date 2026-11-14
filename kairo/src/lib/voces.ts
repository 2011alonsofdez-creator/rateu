/* LAS CINCO VOCES DE KAIRO.
 * Son voces de Gemini (las mismas que usa Google en su app). Los nombres
 * son los suyos; la descripción, la nuestra. Este archivo lo leen el
 * servidor y la pantalla de Ajustes, así que no lleva nada secreto. */

export const VOCES = [
  { id: "Kore", es: "Firme y segura. Seria pero cercana.", en: "Firm and confident." },
  { id: "Puck", es: "Alegre y con energía. Joven.", en: "Upbeat and energetic." },
  { id: "Aoede", es: "Suave y relajada, como una amiga.", en: "Breezy and relaxed." },
  { id: "Charon", es: "Grave y clara, de las que explican.", en: "Deep and clear." },
  { id: "Sulafat", es: "Cálida y tranquila.", en: "Warm and calm." },
] as const;

export type IdVoz = (typeof VOCES)[number]["id"];

export const esVoz = (v: unknown): v is IdVoz =>
  typeof v === "string" && VOCES.some((x) => x.id === v);
