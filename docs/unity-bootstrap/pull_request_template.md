```
██▓▒░  B U I L D   R E P O R T  ░▒▓██
   cibles : windows ▸ macos ▸ linux
   un build qui ne démarre pas sur les trois n'est pas un build
```

## 🎯 Quoi / pourquoi

<!-- Le changement en deux ou trois phrases, et ce qui le motive. -->

**Story / issue :**
**ADR :** <!-- lien, ou "n/a" -->

## 🎮 Ce que ce diff touche côté Unity

| Sujet                                | Réponse              |
| ------------------------------------ | -------------------- |
| Version Unity (`ProjectVersion.txt`) | <!-- 6000.x.y -->    |
| Scènes modifiées                     | <!-- ou "aucune" --> |
| Packages (`manifest.json`) modifiés  | <!-- ou "aucun" -->  |
| Render pipeline / qualité touchés    | <!-- ou "non" -->    |

- [ ] **La version Unity est inchangée**, ou son changement est délibéré et documenté
      dans un ADR.

<sub>⚠️ Un upgrade d'éditeur subi (quelqu'un ouvre le projet avec un Unity plus récent) réécrit
les fichiers du projet en silence et ne se rejoue pas à l'envers. `ProjectVersion.txt` qui
bouge sans raison dans un diff, c'est un blocage de la PR, pas un détail.</sub>

## 🖥️ Smoke test — les trois OS, sinon rien

C'est la raison d'être du projet : un build se juge lancé, pas compilé.
**Un OS non testé ne se coche pas** — il se déclare dans « Ce que je n'ai pas vérifié ».

### Windows x64

- [ ] Build produit
- [ ] Se lance sur une machine Windows propre (pas celle de build)
- [ ] L'écran attendu s'affiche
- [ ] `Quit` ferme l'application sans dialogue d'erreur ni process orphelin

<sub>SmartScreen avertit sur un `.exe` non signé : c'est attendu tant que la signature n'est pas
au périmètre, ce n'est pas un échec.</sub>

### macOS

- [ ] Build produit — architecture : <!-- Apple Silicon / Intel / Universal -->
- [ ] Se lance sur **une autre machine que celle de build**
- [ ] L'écran attendu s'affiche
- [ ] `Quit` ferme l'application proprement

<sub>Gatekeeper bloque un `.app` non signé/non notarisé au premier double-clic. Tant que la
notarisation n'est pas au périmètre : documenter le message vu et le contournement utilisé.
« Ça tourne sur ma machine de build » ne vaut pas test macOS.</sub>

### Linux x64

- [ ] Build produit (exécutable + son dossier `*_Data/` à côté)
- [ ] **Bit exécutable préservé après archivage/extraction** (`tar`, pas `zip`)
- [ ] Se lance sur une machine Linux propre
- [ ] L'écran attendu s'affiche
- [ ] `Quit` sort proprement (pas de process orphelin, pas de crash log)

### Machines utilisées

<!-- OS + version pour chacun des trois tests. Un smoke test sans machine nommée
     n'est pas reproductible. -->

## 📸 Captures

<!-- OBLIGATOIRE dès que le changement est visible à l'écran : captures issues des VRAIS
     builds smoke-testés, pas de l'éditeur, jamais de mockup. Une par OS si le rendu diffère. -->

## 🧪 Tests

- [ ] Tests **EditMode** verts
- [ ] Tests **PlayMode** verts
- [ ] Aucun test désactivé, ignoré ou mis en quarantaine pour passer au vert

## 📦 Hygiène du dépôt Unity

Les pièges qui coûtent des jours quand ils passent :

- [ ] Chaque asset ajouté a son `.meta` committé, et aucun `.meta` orphelin ne traîne
      (asset supprimé ⇒ son `.meta` part avec)
- [ ] Aucun `Library/`, `Temp/`, `Obj/`, `Logs/`, `Builds/`, `UserSettings/` dans le diff
- [ ] Aucun `.csproj` / `.sln` committé
- [ ] Binaires lourds passés par **Git LFS**, pas en blob git
- [ ] Scènes et prefabs en **sérialisation texte** — le diff se relit
- [ ] Aucun chemin absolu ni réglage propre à ma machine

<sub>Perdre un `.meta`, c'est casser les références de l'asset pour tout le monde. Committer un
`Library/`, c'est empoisonner le dépôt pour longtemps.</sub>

## ⚖️ Licence & conformité

- [ ] Aucun asset tiers sans licence claire — source et licence notées pour chaque ajout
- [ ] Le statut du splash screen Unity reste conforme à la licence du studio

## 🚫 Ce que je n'ai PAS vérifié

<!-- OS non testé, cas non couvert, doute assumé, machine indisponible.

     Une case vide est une information utile.
     Une case cochée à tort est un mensonge au reviewer. -->

## 👀 Revue

- [ ] J'ai relu mon propre diff en cherchant ce qui pourrait le faire refuser
- [ ] Le diff se limite à ce que la story demande — rien d'élargi en chemin
