/**
 * planPaths.mjs — la résolution CONTENUE des chemins qu'un `LevelPlan` désigne.
 *
 * `backdrop.file` est le troisième champ de plan qui devient une cible du système
 * de fichiers (gen-street-paid y ÉCRIT l'image payée, align-windows la LIT), après
 * `archetype.spriteBase` et `props[].asset`. Il porte donc la même loi à deux
 * moitiés qu'eux (ADR-0078 §3) : `validateLevelPlan` en impose la FORME au moment
 * du CI, et ce module garde le `resolve` lui-même au runtime — parce que les
 * helpers de plan sont exportés et appelables avec un littéral qui n'est jamais
 * passé par `loadPlan`/`validateLevelPlan`.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LEVEL_ID_SHAPE } from "./loadPlan.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

/**
 * Chemin absolu du backdrop d'un plan, garanti sous `public/assets/levels/<id>/`.
 * Jette si `backdrop.file` en sort (chemin absolu ou segment `..`).
 */
export function resolveBackdropFile(plan) {
  // `plan.id` compose la BASE du chemin : le vérifier n'est pas redondant avec le
  // containment ci-dessous, il le rend possible. Un id en "../../etc" ferait échapper
  // `levelDir` LUI-MÊME, et le `startsWith` passerait trivialement puisqu'il compare
  // à une base déjà sortie — le garde se contourne par la base, pas par la feuille
  // (panel #156 run 11). Les appelants actuels passent tous par loadPlan, qui impose
  // déjà cette forme ; ce module existe précisément pour les appels qui ne le font pas.
  if (!LEVEL_ID_SHAPE.test(plan.id)) {
    throw new Error(
      `plan.id ${JSON.stringify(plan.id)} must match ${String(LEVEL_ID_SHAPE)} — it ` +
        `composes the base of public/assets/levels/<id>/, so an invalid id escapes the ` +
        `containment check instead of being caught by it`,
    );
  }
  const levelDir = path.resolve(ROOT, "public/assets/levels", plan.id);
  const file = path.resolve(levelDir, `${plan.backdrop.file}.png`);
  if (!file.startsWith(levelDir + path.sep)) {
    throw new Error(
      `backdrop.file "${plan.backdrop.file}" escapes public/assets/levels/${plan.id}/ ` +
        `(absolute path or ".." traversal) — it must be a plain filename stem ` +
        `matching ^[a-z0-9_-]+$ (see validateLevelPlan)`,
    );
  }
  return file;
}
