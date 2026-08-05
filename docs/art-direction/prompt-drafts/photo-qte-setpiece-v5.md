# Photo QTE set-piece — DRAFT v5 (round 5 — **quatre corrections, rien d'autre**)

Auteur : concept-artist (Maud). Statut : **draft, non gaté**.
Répond à `docs/art-direction/gates/photo-qte-setpiece-v4-prompt-gate.md` : **R7, R8, R9 et
`commandant_table_apres`**. Tout le reste de la v4 est banké et **n'est pas rouvert** —
plaque (hors R8), les six ouvertures/fermetures, le contrat §2.0, `commandant_arrivee`,
`commandant_couple`, `berline_plate`, l'audit toutes-bandes, la clause de traits observée.

---

## R7 (éliminatoire) — `_c` perd le signal 1, et le slot disparaît du budget

**Le défaut, tel que je le lis :** `decoy_table_c` cumulait « voiture hors file **avec**
chauffeur » et « tailleur + parapheur ». C'est la conjonction suffisante `1 ∧ 2` **entière**
sur un leurre. Deux tables se trouvaient donc désignées au grand-angle, et le joueur ne
pouvait les départager qu'en attendant le signal 3 vers ~53 s — soit **après** la fermeture
de la preuve maîtresse. J'avais refermé ce piège au round 4 et je le rouvrais dans la même
page.

**La cause est ma transposition de R4, et elle est nommable :** j'ai transposé une règle
écrite pour N signaux **interchangeables** à un jeu où le signal 3 est **déclaré
redondant**. Un quasi-manqué sur un signal redondant n'est pas un leurre : c'est **une
seconde cible** à laquelle il manque une confirmation tardive.

### Correction

- **`_c` : signal 1 retiré.** Sa voiture est **rangée dans la file**, comme n'importe quel
  riverain. Il garde le signal 2 (tailleur + serviette rigide) et le motif de mains jointes.
  **Sa chaîne de prompt ne change pas d'un caractère** — le signal 1 n'a jamais vécu dans le
  sprite, il vit dans le placement. C'est une correction de **contrat de scène**, et je
  l'écris ici pour qu'elle soit opposable.
- **Le slot « quasi-manqué n°3 » est SUPPRIMÉ du budget, pas réaffecté.** Cinq leurres
  portent une combinaison partielle, un ne porte rien de la conjonction. On ne rachète pas
  la difficulté perdue ailleurs : elle n'était pas de la difficulté, c'était une ambiguïté.

### Règle générale (à écrire dans la bible avec les trois précédentes)

> **RÈGLE — la règle du quasi-manqué ne s'applique qu'aux signaux PORTEURS.** Un signal
> déclaré redondant (confirmation tardive, non nécessaire à la décision) n'ouvre **aucun**
> slot de quasi-manqué : un leurre à qui il ne manque que lui n'est pas un leurre, c'est une
> seconde cible. Et, en toutes circonstances : **aucun leurre ne détient la conjonction
> suffisante entière.** C'est la conjonction qui identifie ; la donner à un leurre, c'est
> désigner deux tables.

### Tableau des signaux — v5

| Leurre    | Signal 1 (voiture hors file + chauffeur) | Signal 2 (tailleur + parapheur) | Signal 3 (déroulé, **redondant**) | Statut                   |
| --------- | ---------------------------------------- | ------------------------------- | --------------------------------- | ------------------------ |
| **cible** | oui, complet                             | oui                             | oui                               | **la seule conjonction** |
| `_a`      | voiture hors file, **personne à côté**   | oui                             | oui                               | quasi-manqué sur 1       |
| `_b`      | oui, complet                             | non (sacs de courses)           | oui                               | quasi-manqué sur 2       |
| `_c`      | **non — voiture rangée dans la file**    | oui                             | non                               | partiel (2 seul)         |
| `_d`      | non (dans la file)                       | non (sacoche souple)            | non                               | lointain                 |
| `_e`      | aucune voiture                           | non                             | oui                               | lointain                 |
| `_f`      | non (dans la file)                       | non                             | non                               | lointain                 |

Le signal 1 garde trois porteurs (cible, `_a` partiel, `_b`), le signal 2 en garde trois
(cible, `_a`, `_c`). **Aucune ligne ne laisse la cible seule ; aucune ligne ne donne à un
leurre les deux signaux porteurs.**

---

## R8 — la plaque peint le LIEU, jamais le mobilier d'un candidat

Ma correction v4 s'arrêtait une couche trop tôt, et le gate a raison sur le compte : chaque
découpe candidate énumère **la table ronde et les deux chaises**. « seven tables standing
empty with their bistro chairs in place » peignait donc sept tables et quatorze chaises
**sous** sept tables et quatorze chaises.

**Clause corrigée** (delta unique dans la chaîne `plate` v4, tout le reste inchangé) :

> `a corner bistro under a glowing awning with a clear empty stretch of terrace paving
beneath it, and three tables at the far end of the same terrace, one with a single
customer reading alone, one with its chairs turned up on the tabletop, one half hidden
behind the awning post;`

- `a clear empty stretch of terrace paving beneath it` — le lieu, le sol, la lumière de
  l'auvent : tout ce qui n'appartient à aucun candidat. Les sept tables arrivent **entières,
  mobilier compris**, comme découpes.
- `three tables at the far end of the same terrace` (au lieu de `three further tables`) — le
  « further » renvoyait aux sept désormais absentes ; « at the far end » les situe sans
  antécédent, et les tient à l'écart du pan vide où atterrissent les candidats.
- Les trois tables mortes **restent peintes** : elles ne sont pas des candidats, c'est leur
  fonction (F20, catégorie non-photographiable), et elles coûtent zéro asset.

Le compte R2 est intact : dix tables, sept candidates, trois mortes.

---

## R9 — le chauffeur DEBOUT à côté de la voiture

Question tranchée contre ma solution de repli, et l'argument est meilleur que le mien : une
portière ouverte dit « quelqu'un vient de sortir », pas « il attend » — et une encoche noire
dans une caisse sombre à l'échelle plaque se confond avec les trous de la file garée.

**Le contraste devient présence / absence de masse verticale.** Une silhouette debout contre
une caisse horizontale survit à toutes les trames : c'est la seule lecture qui ne dépend ni
du détail, ni du contre-jour d'un pare-brise.

**`berline_double_file`** (remplace la version v4) :

> a dark saloon standing square in the open roadway seen from the same high dormer angle,
> parallel to the parked row but well out of it, angled slightly across the traffic lane,
> a uniformed driver in a peaked cap standing upright at the driver's door, one hand resting
> on the door pillar, facing along the street, the driver's door standing open beside him,
> wet tarmac under the tyres

**`berline_decoy`** (pour `_a` — même carrosserie, **personne à côté**) :

> a dark saloon standing square in the open roadway seen from the same high dormer angle,
> parallel to the parked row but well out of it, angled slightly across the traffic lane,
> the roadway clear all around it, wet tarmac under the tyres

| Clause                                                                       | Ce qu'elle achète                                                                                                                                              |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `standing upright at the driver's door, one hand resting on the door pillar` | La masse verticale, et **l'attente** : la main sur le montant est une pose d'homme qui ne s'en va pas. C'est ce que la portière seule ne disait pas.           |
| `in a peaked cap`                                                            | Le « véhicule de service » porté par le chauffeur, jamais par la cible — le piège de l'uniforme reste désamorcé sur le Commandant.                             |
| `facing along the street`                                                    | Il surveille. Détail gratuit qui renforce le sens sans ajouter de détail à dessiner.                                                                           |
| `the driver's door standing open beside him`                                 | **Token cumulatif seulement**, comme dicté : il enrichit la lecture quand elle est déjà acquise, il ne la porte pas. Présent uniquement sur la version maître. |
| `the roadway clear all around it` (decoy)                                    | L'absence, décrite **positivement** : pas de « no driver », pas de négation. La différence entre les deux sprites est une masse en plus ou en moins.           |

`berline_plate` (gros plan de plaque) et sa translation de départ : inchangés.

---

## `commandant_table_apres` — la table change d'état

La mécanique a répondu à ma question §7 : le départ **est** la plaque, déjà authoré sur
K5→K8. Le gate me suit néanmoins sur le fond, et c'est le bon compromis : une voiture qui
s'en va lit « une voiture part », pas « **il** repart seul ». Il faut que la table change
d'état.

Ce n'est **ni une quatrième pose, ni une quatrième boîte** : c'est un **swap de sprite sur
la boîte déjà authorée** de LA TABLE. Même boîte 17,00 × 9,56 su, même canevas 1024, même
60,2 px/su, même trame, ouverture et fermeture **verbatim**. La mécanique ne doit que
l'instant du swap.

> two fully dressed customers in winter coats seated at a small round café table on a
> pavement terrace at night, seen at mid-distance from slightly above, both figures whole
> from head to shoe, both seated upright on separate bistro chairs on one ground line: on
> the left an empty bistro chair pushed back from the table and turned aside, nobody on it;
> on the right the woman alone in her belted pale coat over a business suit and a beret,
> seated upright, her document folder now lying open on the tablecloth in front of her, one
> hand flat on its pages, looking down at them; on the tablecloth two tall glasses, one of
> them empty, a coffee cup and the small ribboned parcel still resting closed on the cloth;
> behind them the glowing awning of the bistro and a wall of tiles, at their feet the wet
> pavement

**Rationale — chaque clause paye, et deux d'entre elles sont des garde-fous :**

| Clause                                                                                                                       | Ce qu'elle achète                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ouverture verbatim (`two fully dressed customers … on one ground line:`) conservée **malgré** l'absence du second personnage | **Garde-fou d'AABB.** C'est l'ouverture qui fixe le cadrage, le sol et l'échelle sur toute la famille ; la changer ferait bouger la boîte sous un swap censé être invisible. Le prompt annonce deux places, et l'énumération en remplit une par **une chaise vide** — l'ensemble énuméré (deux places assises + deux chaises + table + objets) est rigoureusement identique à LA TABLE, donc E2 tient et F12(1b) mesure la même boîte. |
| `an empty bistro chair pushed back from the table and turned aside, nobody on it`                                            | **Il est parti, et il est parti seul** — dit par le mobilier, pas par une absence. Reculée **et tournée de côté** : deux tokens pour interdire la lecture « il s'est juste levé ».                                                                                                                                                                                                                                                     |
| `the woman alone … seated upright`                                                                                           | **Elle reste.** C'est la moitié du signal 3 que la voiture ne pouvait pas porter.                                                                                                                                                                                                                                                                                                                                                      |
| `her document folder now lying open on the tablecloth, one hand flat on its pages, looking down at them`                     | Le parapheur **ouvert** : le signal 2 monte d'un cran au moment exact où l'homme sort du cadre — c'est le beat qui dit « ce n'était pas un dîner ». Et c'est une masse claire franche sur nappe claire, lisible à 60,2 px/su.                                                                                                                                                                                                          |
| `two tall glasses, one of them empty`                                                                                        | La durée, en un token. Ils étaient là avant.                                                                                                                                                                                                                                                                                                                                                                                           |
| `the small ribboned parcel still resting closed on the cloth`                                                                | **Garde-fou de fiction :** le paquet n'a jamais été remis, sur aucun des trois états de la table. Aucune lecture de paiement possible sur toute la piste maître.                                                                                                                                                                                                                                                                       |
| Fermeture verbatim                                                                                                           | Même auvent, même mur, même trottoir mouillé : le swap ne doit rien changer derrière.                                                                                                                                                                                                                                                                                                                                                  |

**Point de contrôle que je porte au gate asset :** les deux sprites de LA TABLE (avant /
après) doivent se superposer **au pixel près** sur la table, les verres et l'auvent. Un
décalage de mobilier au moment du swap transformerait un beat narratif en glitch. Même seed,
même graine de trame, et si le générateur ne le tient pas, `commandant_table_apres` se
dérive du master en img2img plutôt que d'être tiré à neuf.

---

## Écriture `levelArt.json`

- Le diff `boss.$comment` (1 ligne) est **autorisé à commiter** et n'a pas bougé depuis le
  round 4 ; `photoQte` vérifié **intact**, et il le reste — le bloc est gelé.
- Arbitrage « revert du diff de travail plutôt que `origin/main` littéral » : ratifié, rien
  à refaire.
- `node scripts/check-art-prompts.mjs` : PASSED (état inchangé depuis le round 4).

## Ce que ce round ajoute à la facture des autres lanes

| Owner                  | Item                                                                                                                                                                                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `game-designer` / spec | R7 est un **contrat de placement** : la voiture de `_c` doit être **dans la file**. À asserter là où les autres contraintes de scène le sont, sinon la correction ne survit pas au premier repositionnement. · Instant de swap `commandant_table_apres` |
| `dev-tooling-assets`   | Un sprite de plus (`commandant_table_apres`, même canevas que LA TABLE) ; `berline_double_file` / `berline_decoy` mis à jour (R9)                                                                                                                       |
| `lead-art`             | Gate round 5 · gate asset : superposition au pixel près des deux états de LA TABLE, et **deux mains de plus** au balayage anti-défauts (chauffeur debout, main sur le montant)                                                                          |
