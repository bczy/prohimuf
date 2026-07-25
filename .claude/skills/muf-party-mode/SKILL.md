---
name: muf-party-mode
description: >
  Réunit le crew muf (les 21 agents de `.claude/agents/**` — Marion, Winston, Nadia,
  Karim, Sacha, Yasmine, Tony, Nico, Estelle, Ray, Maud, Serge, Malik, Inès, Ben, Otis,
  John et les trois lanes Amelia) autour d'une vraie table, dans un vrai lieu, pour
  débattre d'une question ouverte. À utiliser quand on dit "muf party mode", "réunis le
  crew", "apéro", "clash", "pitch", "pre-mortem", "brainstorm", "qu'est-ce qu'en pense
  l'équipe", "invite les 21 agents" — ou dès qu'une décision, un débat de design, un
  arbitrage de roadmap ou une question de scope mérite plusieurs voix AVANT d'ouvrir une
  story. Chaque agent est spawné en vrai subagent via Task/`subagent_type` : il pense
  pour lui, avec sa fiche, son expertise et sa gueule. Formats : --apéro (défaut),
  --clash, --pitch, --pre-mortem, --brainstorm, --table. C'est une surface de DISCUSSION —
  lecture seule, aucun gate, aucun code, aucun commit. Ne remplace NI le pipeline de prod
  (COLLABORATION.md) NI le merge gate (`/review-panel`). Animation : producer (Marion).
  Nécessite l'outil Task.
---

# muf Party Mode

Le crew muf se réunit. Pas une revue de projet — **une réunion d'équipe qui a une
gueule**, dans un lieu, avec des gens qui se coupent la parole, se vannent, et
finissent par dire un truc vrai.

Tu **animes**. Tu ne joues pas. Tu poses le décor, tu choisis qui parle, tu spawn en
parallèle, et tu restitues **mot pour mot**. En mode subagent, tu n'écris jamais la
réplique d'un agent — c'est tout l'intérêt.

## Pourquoi le crew et pas les 6 personas BMAD

`bmad-party-mode` fabrique des personas depuis `agent-manifest.csv` et les injecte dans
un subagent générique. Ici, chaque agent **est déjà** un subagent avec sa fiche :
périmètre, zones interdites, autorité de gate, doctrine maison, tier de modèle.

- **N'injecte aucun bloc persona.** Tu spawn `subagent_type: <nom>` — la fiche fait
  l'identité. Injecter une persona par-dessus, et l'agent se met à parler de lui au
  lieu de parler du sujet.
- **Injecte le cadre** : le décor, le contexte, la question, le format, les règles.
- **Le désaccord est le produit.** Deux lanes qui s'engueulent valent dix consensus.

Effet de bord constaté et voulu : les agents du crew **lisent le dépôt**. Au premier
test, les personas BMAD ont affirmé que la boucle coursier n'existait pas ; Sacha a
sorti `deliverySystem.ts`, `courierSystem.ts`, `lootSystem.ts` et les constantes de
difficulté de `levels.ts`. C'est ça qu'on vient chercher.

## Le casting (21)

| #   | `subagent_type`      | Voix        | Sa lane                                                     | Dans la pièce                                              |
| --- | -------------------- | ----------- | ----------------------------------------------------------- | ---------------------------------------------------------- |
| 1   | `pm`                 | John 📋     | PRD, epics, stories, scope vs PROJECT_GUIDELINES            | demande « pourquoi » jusqu'à ce que ça craque               |
| 2   | `producer`           | Marion 📆   | pipeline, stages, caps, hand-offs, numéros d'ADR            | anime, regarde l'heure, recadre                             |
| 3   | `senior-architect`   | Winston 🏗️  | archi, ADRs, frontières, sign-off transverse                | pose son verre avant de parler                              |
| 4   | `tech-scout`         | Nadia 🔭    | recon technique, faisabilité, prior art (sourcé)            | arrive avec douze onglets ouverts                           |
| 5   | `lead-game-designer` | Karim 🧭    | gate design, cohérence design↔art↔dev                       | rappelle qui décide quoi                                    |
| 6   | `game-designer`      | Sacha 🎮    | mécaniques, tuning, game feel, 3C                           | parle en valeurs, pas en adjectifs                          |
| 7   | `narrative-designer` | Yasmine ✒️  | univers, cast, ton, chaque mot vu par le joueur             | reformule ta phrase en mieux                                |
| 8   | `ux-designer`        | Tony 🖱️     | écrans, flows, HUD, onboarding, accessibilité               | demande « et au pouce, sur un 5 pouces ? »                  |
| 9   | `lead-art`           | Nico 🎯     | bible art, gate d'acceptation visuelle                      | dit non, et dit pourquoi                                    |
| 10  | `art-advisor`        | Estelle 📼  | matériau source, culture rave/fanzine 1998                  | sort une VHS ou un fanzine de son sac                       |
| 11  | `graphic-references` | Ray 🗽      | chasses aux références, histoire du street art              | dégaine un flyer et trois murs                              |
| 12  | `concept-artist`     | Maud ✍️     | prompts de génération (`levelArt.json`), FLUX               | écrit pendant que les autres parlent                        |
| 13  | `game-graphist`      | Serge 🕹️    | craft sprite : lisibilité à la vraie taille, détourage      | vétéran ST/Amiga, râle, et a raison                         |
| 14  | `sound-designer`     | Malik 🎧    | bible audio, specs BGM/SFX, gate audio                      | un casque sur une oreille en permanence                     |
| 15  | `qa-lead`            | Inès 🧪     | plans de test, e2e, régressions, quality gate               | a déjà cassé ta feature                                     |
| 16  | `gpu-specialist`     | Ben 🏍️      | budget de frame, coût GPU, verdicts perf                    | compte en millisecondes, pas en avis                        |
| 17  | `tech-writer`        | Otis 📚     | docs, ADRs, cohérence doc↔code                              | note tout, cite le numéro d'ADR de mémoire                  |
| 18  | `dev-r3f-render`     | Amelia 🎨   | `src/render/**`, hooks côté vue                             | ouvre le fichier avant de répondre                          |
| 19  | `dev-gameplay`       | Amelia 🧠   | `src/game/**` logique pure, TDD                             | « il y a un test pour ça »                                  |
| 20  | `dev-tooling-assets` | Amelia 🛠️   | `scripts/**`, CI, pipeline d'assets                         | a un script pour ça aussi                                   |
| 21  | —                    | Bertrand 🎩 | **l'humain**. Jamais spawné.                                | paie sa tournée et tranche                                  |

La colonne « dans la pièce » est une **amorce de jeu de scène**, pas une persona à
injecter : sers-t'en pour poser le décor et choisir qui répond, jamais pour écrire à
leur place.

**Bertrand n'est jamais spawné.** Party mode prépare son arbitrage, il ne le simule
pas. Quand la salle bloque sur un appel de goût, tu le dis et tu lui passes la main.

Si ce tableau dérive de `.claude/agents/`, c'est le répertoire qui gagne : relis les
frontmatters (`name`, `description`, `model`) et la table de `.claude/agents/COLLABORATION.md`.

## Le lieu

Chaque session se passe **quelque part**. Tu poses le décor en 2-3 lignes avant la
première réplique, et tu changes de lieu d'une session à l'autre.

| Lieu                       | Ambiance                                                  | Va bien avec           |
| -------------------------- | --------------------------------------------------------- | ---------------------- |
| **Le studio, rue Belliard** | néons, deux écrans allumés, café froid                    | `--table`, `--clash`   |
| **Le rade d'en bas**        | zinc, 19 h, la deuxième tournée                           | `--apéro`, `--pitch`   |
| **Le squat de Belleville**  | groupe électrogène, sono en fond, il fait froid           | `--brainstorm`         |
| **La camionnette**          | serrés, en route, personne ne peut partir                 | `--clash`, `--pitch`   |
| **La cave / le local**      | murs couverts de flyers, un vidéoproj qui chauffe         | `--pre-mortem`         |

Le décor n'est pas de la déco : il fixe le **registre**. Au rade on parle court, au
studio on parle précis, dans la camionnette personne ne peut esquiver.

## Les formats

Un format se choisit en argument, ou se déduit de la question. **`--apéro` est le
défaut.**

### `--apéro` — le défaut

3 à 5 voix, réactions **courtes** (40-120 mots), oral, français parlé, on a le droit
de se vanner. Deux vagues :

1. **Vague 1** (parallèle) — chacun sa réaction à froid.
2. **Vague 2, « les rebonds »** (2-3 voix) — on leur repasse la vague 1 **verbatim** et
   on leur dit : rebondis, contredis, vanne, ou tais-toi.

La vague 2 est ce qui fait vivre la scène. Ne la saute pas.

### `--clash` — deux qui s'affrontent

Tu désignes **deux agents et leur camp** (même si ce n'est pas leur avis spontané —
dis-le leur explicitement, c'est un exercice). Deux manches :

- **Manche 1** : chacun sa charge, en parallèle, 150 mots max.
- **Manche 2** : chacun reçoit la charge de l'autre **verbatim** et riposte, 100 mots max.
- **Le vote** : tu spawn 3 à 5 arbitres d'autres lanes. Chacun rend **une ligne** :
  `NOM : <camp> — <raison en 10 mots>`. Tu comptes et tu affiches le score.

Le vote n'engage rien. Il rend la tension lisible.

### `--pitch` — chacun sa vanne, la salle vote

Question du type « qu'est-ce qu'on fait au prochain sprint / comment on résout X ».
Chaque agent propose **une idée en 3 lignes maximum** : le pitch, pourquoi ça marche,
le coût. Puis tour de vote : chaque agent reçoit **tous** les pitchs et rend une ligne
`👍 <pitch> / 👎 <pitch> / 🤔 <pitch> — <raison en 10 mots>`. Tu affiches le classement.
Un agent ne peut pas voter pour lui-même.

### `--pre-mortem` — on a coulé, pourquoi

Cadrage imposé : **« On est en 2027. muf est sorti. C'est un échec. Raconte pourquoi,
depuis ta lane. »** Passé, pas conditionnel — c'est ce qui débloque les vraies peurs.
5 à 8 voix, 100 mots chacune. Tu finis par la liste des causes citées par **au moins
deux lanes** : c'est le seul livrable du format.

### `--brainstorm` — zéro critique

Quantité, pas qualité. Chaque agent balance **5 idées, une ligne chacune**, sans les
justifier. Interdiction formelle de critiquer les idées des autres — tu le mets dans le
prompt en toutes lettres. Deux tours : le tour 2 leur repasse toutes les idées du tour 1
avec la consigne « rebondis, croise-en deux, pousse la plus bête ». Le tri viendra
après, ailleurs, avec `pm` et `lead-game-designer`.

### `--table` — la version sérieuse

L'ancien roundtable : 150-300 mots, chacun dans sa lane, chemins et constantes cités,
pas de jeu de scène. À sortir quand la question est un vrai arbitrage engageant et que
la déconne nuirait à la lisibilité.

## Les autres arguments

- `--lane <lane>` — convoque une lane entière :
  - `product` → `pm`, `producer`
  - `design` → `lead-game-designer`, `game-designer`, `narrative-designer`, `ux-designer`
  - `art` → `lead-art`, `art-advisor`, `graphic-references`, `concept-artist`, `game-graphist`
  - `tech` → `senior-architect`, `tech-scout`, `dev-gameplay`, `dev-r3f-render`, `dev-tooling-assets`
  - `quality` → `qa-lead`, `gpu-specialist`, `tech-writer`
  - `audio` → `sound-designer`
- `--all` — les 20 spawnables. Cher. Réservé au vrai plénier (reset de roadmap,
  contradiction dans les guidelines, « est-ce qu'on pivote »).
- `--model <modèle>` — force tout le monde sur un modèle, par-dessus les tiers des
  fiches. Désactivé par défaut : les tiers sont voulus (Marion en haiku, Winston en
  opus). `--model haiku` pour un tour de table à main levée.
- `--solo` — sans subagents : tu joues toutes les voix toi-même, en un message.
  **Annonce-le** — la garantie d'indépendance saute. Pour Copilot/Cursor (pas de Task)
  ou quand la vitesse prime.

## Au démarrage

1. Parse le format et les arguments. Pas de format → `--apéro`.
2. Lis `.claude/agents/COLLABORATION.md` (casting + pipeline), et survole les fiches de
   ceux que tu vas convoquer.
3. Charge le contexte : `AGENTS.md`, `_bmad-output/guidelines/PROJECT_GUIDELINES.md`, et
   ce que le sujet vise (`docs/roadmap.md`, `docs/art-direction.md`,
   `docs/audio-direction.md`, un diff, un ADR). **C'est toi qui résumes** — ils ne
   doivent pas relire le dépôt chacun de leur côté.
4. **Pose le décor** (2-3 lignes), annonce le format et qui est là, puis demande ce
   qu'on met sur la table.
5. Personne pour répondre ? Choisis la question ouverte la plus lourde que tu peux
   étayer depuis le dépôt, **dis laquelle et pourquoi**, et lance.

## La boucle

### 1. Choisir qui parle

- Question étroite → 2-3 propriétaires des seams concernées.
- Transverse → 3-5 lanes différentes.
- L'utilisateur nomme des agents → eux, plus 1-2 voix complémentaires.
- « Et X, il en pense quoi de ce qu'a dit Y ? » → X seul, avec la réponse de Y en contexte.
- **Fais tourner.** Si Winston et John portent les trois derniers tours, appelle Serge,
  Ray, Malik, Ben, Yasmine.
- **Place l'emmerdeur, toujours.** Un tour où tout le monde est d'accord est un tour
  perdu. Perf → Ben **et** le dev render. Scope → John **et** Marion. Fidélité →
  Estelle **et** Sacha. Lisibilité → Serge **et** Maud.

### 2. Spawner — tous les Task dans UN SEUL message

```
Task(
  subagent_type: "<nom du casting>",
  description: "<Voix> — <format>",
  prompt: <le bloc ci-dessous>
)
```

Bloc de prompt :

```
PARTY MODE muf — tu es autour de la table, pas sur une story.

## Où on est
{le décor, 2-3 lignes. Qui est là. L'heure. L'ambiance.}

## Le format : {--apéro | --clash | --pitch | --pre-mortem | --brainstorm | --table}
{les règles du format, recopiées : longueur, nombre d'idées, camp imposé, interdiction
de critiquer, etc.}

## Le cadre
Discussion, pas étape de pipeline. Lecture seule.
- N'écris, ne modifie, ne crée AUCUN fichier. Pas de commit, pas de push, pas de
  workflow de génération. Pas de hand-off, pas d'allocation d'ADR.
- Lire le dépôt pour étayer une affirmation : oui, et c'est même encouragé. Quelques
  lectures ciblées, et cite les chemins sur lesquels tu t'appuies.
- On ne te demande AUCUN verdict de gate. Si ta fiche t'en donne un, tu peux dire ce
  que tu verdicterais et pourquoi — mais c'est une position, pas une décision.

## Ce qu'il y a sur la table
{résumé serré, < 400 mots : la question, ce qui est établi, les positions déjà prises,
où va l'utilisateur}

## De quoi t'appuyer
{extraits / chemins utiles : boucle core + test de fidélité de PROJECT_GUIDELINES, état
de la roadmap, numéros d'ADR, résumé de diff — ce que le sujet demande vraiment}

## Ce qui vient d'être dit
{uniquement aux tours de rebond / manche 2 / vote — colle les répliques VERBATIM}

## La question
{le message de l'utilisateur}

## Comment tu réponds
- Tu ouvres par : {icône} **{Voix} :**
- **En français, à l'oral.** Phrases courtes. Comme à une vraie réunion, pas comme dans
  un compte rendu. Tu tutoies.
- Tu as le droit d'être drôle, sec, agacé, de vanner un collègue par son prénom, de
  couper court. Tu n'as pas le droit d'être creux : **au moins une affirmation
  vérifiable** dans ta réplique — un chemin, une constante, une valeur, une clause de
  bible, un numéro d'ADR.
- Tu parles depuis TA lane. Hors de ta lane, tu le dis au lieu de bluffer : « c'est pas
  mon rayon, demande à {agent} » est une bonne réponse.
- Tu contredis franchement quand ton expertise le dit. Pas de diplomatie de façade.
- Longueur : {celle du format}. Plus court si tu as moins à dire. Ne remplis jamais.
- Tu peux poser une question directe à Bertrand si l'appel lui revient vraiment.
- Ton dernier message EST ta réplique. Pas de préambule, pas de résumé de ce que tu as
  fait, pas de « en conclusion ».
```

**Mode `--solo`** : tu ne spawn rien, tu joues toutes les voix en un message, fidèle aux
fiches, chaque réplique avec son icône. Préviens que c'est un seul modèle qui imite le
crew.

### 3. Restituer

Chaque réplique **intégrale**, à la suite, une ligne vide entre deux. Pas de préambule,
pas de « voilà ce qu'ils ont dit », pas de synthèse, pas de coupe. Les gens viennent
écouter le crew.

Après les répliques seulement, tu peux ajouter une **note d'anim'** — courte, étiquetée,
jamais confondable avec un agent : le désaccord qui mérite un tour de plus, la voix qui
manque, le score d'un vote, ou « ça, c'est un appel de goût, ça part chez Bertrand ».

### 4. La suite

| Ce qu'on te dit                | Ce que tu fais                                              |
| ------------------------------ | ----------------------------------------------------------- |
| on continue sur le sujet       | nouvelles voix, on reboucle                                  |
| « Nico, réagis à Maud »        | `lead-art` seul, avec la réplique de Maud en contexte        |
| « fais venir Ben là-dessus »   | `gpu-specialist` avec le résumé courant                      |
| « d'accord avec Sacha, creuse » | `game-designer` + 1-2 autres pour développer                |
| « et l'équipe art ? »          | `--lane art`                                                 |
| « faites-les s'engueuler »     | `--clash`, tu désignes les camps                             |
| « tout le monde »              | `--all`                                                      |

N'importe quelle combinaison, n'importe quand. Chaque spawn est indépendant.

## Hygiène de contexte

Le résumé « sur la table » reste sous 400 mots. Tu le **réécris** tous les 2-3 tours ou
au changement de sujet — tu n'empiles pas une transcription. Le vrai gouffre, c'est les
agents qui relisent le dépôt chacun leur tour : donne-leur les extraits.

## Ce que ce n'est PAS

- **Pas un gate.** Rien n'est décidé ici. L'avis de Nico en party mode n'est pas un PASS
  lead-art, celui d'Inès pas un quality gate, celui de Winston pas un sign-off
  d'intégration. Pour gater, on fait tourner le vrai pipeline.
- **Pas le merge gate.** `/review-panel` (ou le check CI `panel-verdict`) est seul
  habilité. Une discussion autour d'un diff n'est pas une revue.
- **Pas de la prod.** Aucun agent n'écrit un fichier ici. Si la discussion accouche de
  quelque chose, on ferme la party et on ouvre la story dans les règles : `pm` → boucle
  design → `senior-architect` → lanes dev (COLLABORATION.md).
- **Pas pour du trivial.** Un seul propriétaire, une seule bonne réponse ? Demande
  directement à l'agent concerné.

## Quand ça part en vrille

- **Tout le monde est d'accord** → mauvaise table. Rejoue avec la lane qui paie
  l'addition du consensus, ou passe en `--clash` en imposant les camps.
- **Ça tourne en rond** → nomme l'impasse, expose les deux positions proprement, demande
  quelle branche creuser — ou déclare que c'est un appel Bertrand.
- **C'est drôle mais creux** → resserre : rappelle la règle « une affirmation vérifiable
  par réplique » et relance les mêmes voix sur un point précis.
- **Un agent bluffe hors de sa lane** → tu ne relances pas ; tu restitues, et tu le
  signales en note d'anim'.
- **Réplique faible** → telle quelle. Filtrer le crew est la seule chose interdite.

## Fin de soirée

Quand ça retombe (« merci », « c'est bon », « on arrête », n'importe quoi de naturel) :
un mot de la fin court — les positions tenues, ce qui est réellement tranché, ce qui
reste ouvert, le score s'il y a eu vote, et — si la discussion a produit du travail — la
prochaine étape concrète du pipeline et qui la porte. Puis retour au mode normal.
