/* Con qué consejo se contaría ahora mismo, según las claves del entorno.
 *
 *   npx tsx pruebas/consejo-composicion.ts
 *
 * Y para comprobar las reglas —que no se repitan casas y que la del
 * secretario no vote— se le cambia el entorno delante:
 *
 *   ANTHROPIC_API_KEY=k GEMINI_API_KEY=k OPENAI_API_KEY=k \
 *   KAIRO_EXTRA_KEY=k KAIRO_EXTRA_URL=https://openrouter.ai \
 *   KAIRO_EXTRA_MODELOS=openai/gpt-5.1,x-ai/grok-4.7 \
 *   npx tsx pruebas/consejo-composicion.ts
 *
 * Ese caso tiene truco: OpenAI ya está en nativo, así que el de
 * OpenRouter debe caerse y entrar solo xAI.
 */

import { formarConsejo, hayConsejo } from "@/lib/consejo/miembros";
const c = formarConsejo();
console.log(JSON.stringify({
  casas: c.votantes.map((m) => m.casa),
  sec: c.sec?.casa ?? null,
  secNoVota: c.sec?.secretario ?? null,
  total: c.miembros.length,
  listo: hayConsejo(c),
  aviso: c.aviso,
}));
