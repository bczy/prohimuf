# Boss encounter — fiction spec (Open Q5 answer + Open Q4 opinion)

**Author:** `narrative-designer` (Yasmine) · **Gate:** `lead-game-designer` (Karim) —
status **DRAFT, awaiting PASS** · **Date:** 2026-07-19 ·
**Story:** `_bmad-output/planning-artifacts/story-boss-encounter-qte.md`

This spec answers **Open Question 5** (who the boss is) and gives a narrative **opinion on
Open Question 4** (where it lives first). It does **not** decide Open Questions 1/2/3/6 —
those belong to `game-designer` (mechanic, tuning), `lead-game-designer` + `pm` (encounter
count), and `ux-designer` (HP read). Nothing here is production code.

Voice baseline is the **shipped** register in `src/game/systems/narrativeSystem.ts`
(DISPATCH terse/imperative, KENZA field-savvy, MUF laconic) and the grounded, unadorned tone
ADR-0030/ADR-0034 set for the hostage ("la fille d'un boss de cartel" — a role, not an opera).
Period is **1998–1999 Paris, free-party circuit** — no smartphone-era vocabulary, francs not
euros, `08 36` infolines. All player-facing strings are **French**; meta/notes are English.

**Hard scope pin (AC6):** the boss must **extend** the already-scoped antagonist roster
(`PROJECT_GUIDELINES.md` §7: **BAC de nuit** / **RG en civil** / **indics**). It must **not**
fork a third, unrelated faction. Everything below traces to §7.

---

## 1. Open Question 5 — who is "le chef de brigade"

### 1.1 Decision in one line

**Le boss est l'apex de la BAC de nuit, pas une nouvelle faction.** « Chef de brigade » se
lit au premier degré : la **B**AC est une **B**rigade, son chef est le commandant qui envoie
les flics aux fenêtres depuis le début du jeu. On donne enfin un visage — et un seul mot — au
« les flics » que le joueur affronte niveau après niveau. **Singulier, nommé, récurrent,
capstone.** Pas un titre réutilisé par niveau.

Le nom que la scène lui donne : **« le Commandant ».** Un seul mot, dit à plat. L'underground
ne lui accorde pas de surnom de rue — le nommer déjà, c'est trop d'honneur ; on dit « le
Commandant » comme on nomme quelqu'un qu'on craint. (Registre miroir : voir §1.4 — la presse
établie `PARIS-MINUIT` l'encense sous son nom complet ; l'underground n'a que le grade.)

### 1.2 Pourquoi c'est une EXTENSION du roster §7, pas une troisième faction

| Élément §7 (déjà scopé)        | Lien au Commandant (extension, pas fork)                                                                                                            |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **BAC de nuit** — patrouilles visibles, règles claires | Il **est** leur chef. Chaque flic aux fenêtres est un de ses hommes. Il n'est pas un ennemi nouveau : c'est la tête du seul ennemi qui existe déjà. |
| **RG en civil** — planques, micro-tells               | Il est le **nœud** où la BAC (visible) et les RG (renseignement) se rejoignent : les planques que KENZA date de `'95` (dialogue shippé Stalingrad, _« Ils ont des planques là-dedans depuis '95 »_) lui remontent. Il **voit** par les RG, il **frappe** par la BAC. |
| **Indics** — contact retourné, apparence normale       | C'est lui qu'ils appellent. L'indic est sa main invisible ; le Commandant est le numéro au bout du fil. (Hook narratif, pas une mécanique ici.)     |

Le Commandant **unifie** les trois bras du roster §7 en une seule figure sans en inventer un
quatrième. C'est le sens strict de la contrainte de la story : on étend, on ne forke pas.

> **Pourquoi BAC et pas RG comme ancre.** L'idée-veille (§3 #6) le veut « vulnérable
> seulement quand il ouvre le feu ». Les RG surveillent, ils n'assaillent pas — un chef RG
> qui « ouvre le feu » sonnerait faux. La BAC est le bras **armé et visible** ; son chef qui
> tire, c'est cohérent. On garde le RG comme sa **source de renseignement**, pas comme son
> corps. Cohérent avec §7 (RG = tells discrets, jamais de fusillade frontale).

### 1.3 Pourquoi il n'est « à découvert que quand il ouvre le feu » — justification diégétique

C'est ici que la fiction et §7 se referment proprement l'une sur l'autre. Le foyer narratif
correct du personnage est le **Niveau Final — 31 décembre 1999, flics débordés** (§7). Cette
nuit-là, tout Paris est dehors (bug de l'an 2000, la ville en délire). La BAC est **débordée** :
ses hommes sont noyés partout à la fois. Alors le Commandant fait ce qu'un chef ne fait jamais —
il **descend au contact et tire lui-même**, parce qu'il n'a plus personne pour le couvrir.

- C'est **pourquoi** il s'expose : un commandant à court d'hommes est forcé au premier rang.
- C'est **quand** il s'expose : chaque fois qu'il ouvre le feu, il sort du couvert de ses
  propres troupes — la seule fenêtre où il est atteignable est la seule où il est dangereux
  (exactement le pivot bidirectionnel qu'ADR-0034 D3 a validé pour l'otage).

La mécanique (« vulnérable seulement quand il ouvre le feu ») **découle** de « flics débordés »
au lieu d'être plaquée dessus. Le `game-designer` reste maître de la forme exacte de la fenêtre
de vulnérabilité (Open Q2) ; la fiction lui **donne une raison**, elle ne la lui impose pas.

### 1.4 Deux registres pour un homme (réutilise le device zine ↔ tabloïd déjà canon)

Le pre-game copy-deck a déjà posé `PARIS-MINUIT`, le tabloïd établi, comme repoussoir de la
zine underground. Le Commandant s'y branche sans rien inventer :

- **Underground (DISPATCH / KENZA / MUF)** — « le Commandant ». Un grade, pas un nom. Froid.
- **Établissement (`PARIS-MINUIT`, l'UNE des scores)** — lui **imprime** son nom complet et sa
  médaille : **« le commandant Ferrand »**, « l'homme qui a nettoyé les nuits de Paris ». Le
  même homme, encensé par la presse qui méprise la teuf. (Nom complet **fictionnel**, sur le
  même principe légal-safe que les numéros `08 36` — voir §5, flag 2. Le gate peut le changer.)

Cette asymétrie — l'underground n'a que le grade, le tabloïd a le nom et les décorations —
renforce le device existant au lieu d'ajouter du lore.

---

## 2. Character sheet — le Commandant

Fiche destinée à `concept-artist` → `lead-art` (le VISUEL leur appartient — je fournis la
fiche, pas le look) et à `dev-gameplay`/`dev-r3f-render` (rôle dans la boucle).

| Champ                    | Contenu                                                                                                                                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Nom (underground)**    | **le Commandant** (un seul mot, à plat).                                                                                                                                    |
| **Nom (établissement)**  | commandant **Ferrand** — n'apparaît QUE dans `PARIS-MINUIT` (fictionnel, flag 2).                                                                                          |
| **Faction**              | **BAC de nuit** (§7) — il en est le chef. Alimenté par les **RG** (§7). Pas une 4e faction.                                                                                |
| **Rôle dans la boucle**  | Antagoniste **capstone** unique. Il ne modifie pas la règle `Éviter` (rien de neuf à discriminer). Son encounter se branche sur `Récupérer → Livrer` (voir Open Q1 — non tranché ici ; la fiction supporte le lecture « beat requis » sans la forcer). |
| **Ce qu'il sait**        | Tout, en retard d'un cran : il connaît les crews (SPIRALE 23, KANAL SYSTEM, NADIR 94), a couru après eux depuis `'95`, mais n'a jamais eu Muf. La teuf du siècle lui échappe s'il rate cette nuit. |
| **Comment il parle**     | **Il ne parle pas au joueur.** Le QTE est figé/muet (le shell ADR-0030/0034 gèle la scène) ; sa présence est portée par la brève scène pre/post et par le sprite. S'il faut une réplique un jour, elle est pour un `PARIS-MINUIT` ou un mégaphone, jamais un dialogue — il n'est pas de la rédaction. |
| **Ce que la scène pense de lui** | Le premier arrivé, le dernier parti, celui qui coupe le son. On le craint sans le romancer. |
| **Pistes visuelles (REQUEST à l'art flow, pas un fait accompli)** | Silhouette d'**autorité** distincte de la piétaille aux fenêtres : plein pied et non un buste-fenêtre, tenue de commandement (pas la tenue anti-émeute du CRS `enemy_riot`), lisible « chef » en < 0,3 s sans couleur (règle art-direction). Poses demandées par la story : **protégé / à découvert (ouvre le feu) / touché / à terre**. B&N photocopié + néon acide comme tout le roster. **Ceci est une demande à `concept-artist` → `lead-art`, pas une spec de sprite.** |

---

## 3. Open Question 4 — opinion narrative : où ça vit en premier

La story défend Belliard-first (vélocité d'ingénierie, précédent de tous les QTE) sauf
« argument narratif fort contre ». **Il y en a un**, et il est spécifique à ce feature.

### 3.1 L'argument

Le Commandant est un **capstone à usage unique**. L'otage (ADR-0030/0034) est un side-event
**répétable** et anonyme — le griller sur Belliard ne coûte rien à la fiction. Le Commandant,
lui, est le nemesis récurrent qu'on abat **une fois**. Le battre sur le **premier** gig
(Belliard, `FACILE`, quasi-tutoriel) le détruit comme figure : on ne tue pas le boss final au
niveau 1. Et §7 lui a déjà donné un foyer — le **Niveau Final, 31 déc 1999** — qui est le seul
endroit où « flics débordés » rend sa vulnérabilité crédible (§1.3).

### 3.2 Contrainte réelle : le Niveau Final n'existe pas encore

Le niveau `31 déc 1999` n'est **pas construit** (les niveaux shippés sont belliard / stalingrad
/ vitry ; le final est explicitement « still-unbuilt » — cf. `pregame-copy-deck.md` §8.2). On ne
peut donc pas *shipper* le boss dans un niveau qui n'existe pas. Cette contrainte renforce mon
argument au lieu de l'affaiblir : le Commandant appelle un final ; le final l'appelle en retour.

### 3.3 Recommandation (workable — pas une injonction à l'architecte)

Découpler le **shell** (ingénierie) de la **fiction** (canon) :

1. **Itérer la mécanique sur Belliard**, comme tout QTE précédent (seul niveau construit,
   dé-risque le build) — **mais avec un combattant PLACEHOLDER non-canon** : un officier BAC
   générique et sans nom (un « chef de patrouille », échelon inférieur), explicitement un
   **harnais de dev/tuning**, jamais présenté au joueur comme une vraie défaite. Exactement la
   discipline « cop fallback until art lands » que le QTE emploie déjà. Sans script canon
   (harnais muet ou répliques jetables marquées non-canon).
2. **Réserver le canon — « le Commandant » — au Niveau Final.** Sa fiction est **écrite et
   gatée maintenant** (ce doc + §4), puis **tenue** jusqu'à ce que le final soit construit
   (story séparée, déjà flaggée).
3. Si le crew veut le boss **jouable en canon dès V1**, avant que le final existe, les deux
   options honnêtes sont : (a) le shipper sur Belliard **en canon** — je le déconseille sur
   l'argument capstone ; ou (b) construire un **final minimal** dans le périmètre de ce feature.
   C'est un arbitrage `pm` + `lead-game-designer` + `senior-architect` — **je le flagge, je ne
   le tranche pas.**

Cette position donne à l'ingénierie son Belliard-first (le shell) **sans dépenser la première
apparition du boss**. `senior-architect` tranche avec moi si désaccord technique (la story
prévoit ce co-arbitrage) — ma recommandation est au dossier.

> **Note AC3 (« exactement un boss ships en V1 »).** Le placeholder Belliard est un **harnais
> de dev**, pas un encounter canon shippé — il ne crée pas un « second boss » au sens d'AC3, qui
> parle de ce qui **ship**. Si le gate juge l'ambiguïté risquée, l'option (b) — un final minimal
> — est la sortie propre.

---

## 4. Scripts — scène pre/post du Niveau Final (canon, tenue pour le final)

Le QTE lui-même est **figé et muet** (shell ADR-0030/0034 : gel + zoom + machine à phases). La
fiction vit donc dans la **brève scène pre/post du niveau**, exactement comme chaque niveau
shippé — elle **encadre** la boucle, elle ne la **gate** jamais (« une mission = 3-5 min »).
Format = `NarrativeLine` (`src/game/systems/narrativeSystem.ts`). Illustrations : **uniquement
des sprites déjà shippés** (règle de fer) ; le sprite propre du Commandant est une **demande à
l'art flow** (§2), donc sa réplique de révélation reste **sans image** (comme le monologue Vitry
shippé) jusqu'à ce que l'art atterrisse.

Ces scripts sont **écrits pour le Niveau Final** ; ils ne partent chez `dev-gameplay` que quand
le final est construit (§3.3). Ils sont gatés maintenant pour ne pas dériver.

### 4.1 Pré-niveau — `final_pre` (proposition d'`id`)

| # | speaker  | text (FR)                                                                 | image (sprite shippé)             | imageAlt                                  |
| - | -------- | ------------------------------------------------------------------------- | --------------------------------- | ----------------------------------------- |
| 1 | DISPATCH | `31 décembre. Tout Paris est dehors. Le dernier son du siècle, Muf.`      | —                                 | —                                         |
| 2 | MUF      | `Et les flics ?`                                                          | `assets/courier/rider.png`        | `Muf, le coursier à moto`                 |
| 3 | DISPATCH | `Débordés. Partout à la fois. Sauf un.`                                   | `assets/enemy_shooting.png`       | `Un flic qui dégaine à la fenêtre`        |
| 4 | MUF      | `...le Commandant.`                                                       | `assets/courier/rider.png`        | `Muf, le coursier à moto`                 |
| 5 | DISPATCH | `Cette nuit il n'a plus personne pour le couvrir. Il descend lui-même.`  | —                                 | —                                         |
| 6 | DISPATCH | `Il tire le premier. C'est là qu'il est à découvert. Nulle part ailleurs.` | —                               | —                                         |
| 7 | MUF      | `Une seule fenêtre.`                                                      | `assets/courier/rider.png`        | `Muf, le coursier à moto`                 |
| 8 | DISPATCH | `Une. Livre le son, Muf. Qu'il danse jusqu'en 2000.`                      | —                                 | —                                         |

- **Ligne 6** enseigne la règle **diégétiquement** (« vulnérable quand il ouvre le feu ») dans
  la voix DISPATCH — pas de tuto plaqué. Elle est compatible avec la forme que `game-designer`
  choisira pour Open Q2 (elle nomme le *quand*, pas le *comment*).
- **Ligne 4** est la première fois que le joueur entend le nom : dit par MUF, à plat. Sans image
  (la révélation attend le sprite art, §2). Cadence calquée sur `belliard_pre` / `vitry_pre`.
- Longueur : 8 répliques, dans la borne des scènes shippées (5–9). Skippable en un bouton (§5.3
  guidelines) comme toute cutscene.

### 4.2 Post-niveau (win) — `final_post` (proposition d'`id`)

| # | speaker  | text (FR)                                          | image (sprite shippé)      | imageAlt                    |
| - | -------- | -------------------------------------------------- | -------------------------- | --------------------------- |
| 1 | MUF      | `Le son passe.`                                    | `assets/courier/rider.png` | `Muf, le coursier à moto`   |
| 2 | DISPATCH | `Et le Commandant ?`                               | —                          | —                           |
| 3 | MUF      | `À terre. Ses hommes l'ont pas vu tomber.`         | `assets/courier/rider.png` | `Muf, le coursier à moto`   |
| 4 | DISPATCH | `Minuit dans deux minutes. Écoute la ville.`       | —                          | —                           |
| 5 | MUF      | `...ça tient.`                                     | `assets/courier/rider.png` | `Muf, le coursier à moto`   |
| 6 | DISPATCH | `Bonne année, Muf.`                                | —                          | —                           |

- Registre laconique MUF + DISPATCH sec, calqué sur `belliard_post` / `stalingrad_post`. On
  **ne romance pas** la chute du boss (une ligne, à plat — cf. le ton retenu de la fille-du-boss
  d'ADR-0030). Le beat émotionnel est la **ville qui tient**, pas la mort du flic.
- Ferme la boucle sur l'an 2000 (§7) — le seul niveau qui a le droit de conclure.

> **Placeholder Belliard (§3.3.1) — pas de script canon.** Le harnais de dev tourne muet ou
> avec des répliques jetables explicitement marquées non-canon ; il ne reçoit **pas** les scènes
> ci-dessus. Aucune ligne canon ne se dépense sur le niveau de test.

---

## 5. Fiction flags — pour le PASS de Karim

1. **NET-NEW canon** — « le Commandant » (BAC de nuit, chef) est une nouvelle entité nommée,
   première figure d'autorité **nommée** du jeu. Extension consciente et documentée (précédent
   ADR-0012 / copy-deck §9). À folder dans un futur `narrative-bible.md` + `characters.md`. Ne
   contredit aucun dialogue shippé ; **prolonge** la ligne KENZA `'95` (Stalingrad).
2. **Nom complet `commandant Ferrand` = fictionnel**, réservé à `PARIS-MINUIT`, sur le même
   principe légal-safe que les `08 36` (copy-deck §8.7). Le gate peut le remplacer ; le canon
   underground (« le Commandant ») ne dépend pas de ce choix.
3. **Extension roster confirmée (AC6)** — trace 1:1 à §7 (BAC / RG / indics) ; **aucune 4e
   faction**. Voir §1.2.
4. **Cahier des charges** — Prohibition (Atari ST) n'avait pas de boss (veille §1) ⇒ EXTENSION
   consciente, même standard qu'ADR-0030. La fiction **encadre** la boucle
   `Récupérer → Livrer → Éviter`, ne la gate pas ; `Éviter` intouché (rien de neuf à
   discriminer). QTE muet ⇒ pas de dialogue élaboré (hors-scope §8 guidelines).
5. **Foyer = Niveau Final (§7)** — la fiction argumente pour le final comme home canon (Open
   Q4). Contrainte : le final n'est pas construit ⇒ scripts §4 **gatés puis tenus**, pas livrés
   à `dev-gameplay` tant que le final n'existe pas. Belliard reçoit un **placeholder non-canon**.
6. **Ne décide PAS** Open Q1 (gate vs bonus — `game-designer`/gate), Q2 (forme de la fenêtre —
   `game-designer`), Q3 (nombre d'encounters — `lead`+`pm`), Q6 (read HP — `ux-designer`). La
   fiction est **compatible avec les deux lectures d'Open Q1** ; elle *penche* pour le beat requis
   (un final se termine sur son boss) sans le forcer.
7. **Compatibilité Open Q3** — si le gate ouvre un jour un palier « mini-boss », la fiction en a
   la matière prête sans dupliquer le Commandant : les **officiers BAC subalternes** (chefs de
   patrouille, échelon inférieur, anonymes) — mêmes hommes, moindre rang. Réservé, **pas
   construit ici** (AC3 : un seul boss en V1).

---

## 6. Loop / scope compliance

- **Boucle intouchable** — le boss branche sur `Récupérer → Livrer` (le *comment* est Open Q1,
  non tranché ici) ; `Éviter` n'acquiert aucune règle nouvelle. PASS.
- **`une mission = 3-5 min`** — la fiction est deux brèves scènes pre/post (8 + 6 répliques),
  dans la borne shippée ; le QTE figé est le set-piece, pas un mur de texte. Skippable un bouton.
- **Period authenticity** — `31 déc 1999` / bug an 2000 / francs / `PARIS-MINUIT` / BAC-RG :
  zéro vocabulaire post-2000, zéro anachronisme. (Grounding culturel : `art-advisor` (Estelle)
  consultable si le gate veut durcir le read « chef de brigade 1999 ».)

---

## 7. Hand-off — `lead-game-designer` (design gate)

**De :** `narrative-designer` (Yasmine) · **À :** `lead-game-designer` (Karim) ·
**Objet :** fiction du boss — Open Q5 (répondu) + opinion Open Q4.

**Livré :**

- **Open Q5 — TRANCHÉ (proposition à gater) :** le boss est **« le Commandant »**, chef **singulier
  et nommé** de la **BAC de nuit** (§7), nœud BAC×RG — **extension du roster §7, pas une 4e
  faction** (AC6 ✓). Justification diégétique de « vulnérable quand il ouvre le feu » ancrée dans
  « flics débordés » du Niveau Final (§7). Character sheet fournie pour l'art flow (§2).
- **Open Q4 — OPINION :** shell itéré **Belliard-first avec placeholder non-canon** ; **canon
  réservé au Niveau Final**. Scripts pre/post canon écrits et prêts à gater (§4), tenus jusqu'à
  ce que le final soit construit. Contrainte flaggée : final non construit ⇒ arbitrage
  `pm`+`lead`+`architect` si le crew veut le boss canon en V1 (§3.3).

**Ce que je NE décide pas :** Open Q1/Q2/Q3/Q6 (voir flag 6). Terrain partagé à synchroniser
avec `game-designer` (Sacha) : la fenêtre de vulnérabilité (Q2) doit *pouvoir* se lire comme
« il ouvre le feu » pour rester cohérente avec la ligne DISPATCH §4.1 #6 — **on conçoit ensemble,
on livre séparément** (COLLABORATION.md).

**Demandé au gate :**

1. PASS / PASS-avec-corrections sur la fiction (§1–§2) et les scripts (§4).
2. Ratifier ou amender les 7 flags §5 (surtout flag 1 net-new canon, flag 2 nom fictionnel,
   flag 5 foyer/tenue).
3. Trancher (avec `senior-architect` + `pm`) Open Q4 §3.3 : placeholder-Belliard + canon-final,
   ou final-minimal-dans-ce-feature, ou boss-canon-sur-Belliard (déconseillé).

**Demandé à l'art flow (via le gate) :** ouvrir la demande de sprite Commandant (poses
protégé/à-découvert/touché/à-terre, §2) — `concept-artist` → `lead-art`. Le sprite propre
débloque la ligne de révélation illustrée (§4.1 #4, actuellement sans image par choix).

**À loguer :** hand-off dans `docs/handoffs/story-boss-encounter-qte.md`, indexé dans
`docs/agent-handoffs.md` (per COLLABORATION.md). Verdict de gate à reporter dans
`docs/game-design/README.md` (statut « In flight / gated »).
