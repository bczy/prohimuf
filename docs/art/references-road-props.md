# Références — mobilier de rue parisien 1998 (road props, ADR-0047)

Pour `concept-artist` / `lead-art` / `game-graphist`. Couvre les 8 `NearForegroundKind`
de `src/render/scene/nearForegroundArt.ts`. Rappel de style maison : ces props rendent en
GREY/B&W silhouette pur (loi C1 — voir en-tête du fichier) sauf le feu tricolore (exception
Bertrand-directed, ADR-0047 amendement). **La couleur est donc hors-sujet ici : seules
comptent silhouette et proportion.** Une observation citée par prop = utilisable telle
quelle dans un prompt.

## 1. trafficLight — feu tricolore parisien

Déjà chassé et curé : voir `docs/art-direction/references/boards/board-traffic-light.md`
(statut CURATED, Bertrand 2026-07-18) — ne pas re-chasser, s'y référer.

- **Modèle canonique** : tête véhicule à **casquette/visière** 3 lentilles verticales
  (générations pré-LED-slimline françaises — Garbarini, Thery Hindrick, Silec ; familles
  nommées Nixea/Alumix/Aluxe/Géronimo sur feu-routier.fr) + tête piéton distincte, bicolore,
  pictogramme bonhomme statique/marchant.
- **Traits de silhouette** :
  1. tête véhicule vue strict **PROFIL** (boîte de côté, visières qui pointent vers la
     chaussée, jamais la face des lentilles) — c'est un fait d'ingénierie, pas une
     convention (le visor est un écran directionnel, cf. principe régulatoire MSR25 fiche 20).
  2. tête piéton montée à **90°** de la tête véhicule sur le même mât, vue **FACE-ON**,
     pictogramme lisible.
  3. mât rond fin, pied évasé ; les deux têtes en cantilever sur de courts bras.
  4. lentille allumée = disque coloré + halo doux (seule exception couleur du set).
- **Piège** : têtes plates LED-slimline (retrofit 2000s+) ; tête véhicule montrée face-on
  (casse la logique physique) ; gabarit US box-signal ou UK ; catégorie Wikimedia Commons
  "Traffic lights in Paris" est majoritairement datée 2023-24 — déjà du matériel LED
  retrofité, à ne pas prendre au premier degré (déjà noté dans le board).

## 2. lamppost — lampadaire parisien (col-de-cygne fonte)

- **Modèle canonique** : candélabre haussmannien en fonte, héritage Second Empire (Alphand/
  Davioud-era street furniture programme, 12 485 → 33 859 mâts installés 1853-1869), encore
  la norme visuelle sur les rues secondaires du 18e/19e en 1998 — pas seulement les grands
  boulevards. Fût fuselé, bras "col-de-cygne" en S, lanterne à pans facettés. **Ne PAS**
  utiliser le "cobra head" en aluminium moderne (mât droit + tête plate rectangulaire) : ce
  registre existe en 1998 mais sur voirie fonctionnelle/périphérique, pas la rue de caractère
  qu'on veut vendre.
- **Cas Vitry (HLM/banlieue)** : ADR-0047 a d'ores et déjà exclu `nearForeground` de Vitry
  (facade trop étroite), donc ce choix ne s'y pose pas — mais si un jour ça change, le mât
  d'éclairage HLM des années 90 est un **poteau acier fonctionnel, simple, sans ornement**
  (lampe sodium haute/basse pression, ton chaud perdu en N&B mais silhouette plate/droite),
  jamais le col-de-cygne en fonte : deux registres distincts, ne pas les confondre.
- **Traits de silhouette** :
  1. base fuselée/cannelée, fût qui se rétrécit vers le haut.
  2. bras courbe en S (col-de-cygne) proche du sommet, sortant vers l'extérieur.
  3. lanterne à pans facettés (polygonale, PAS un simple globe rond ni un panneau plat LED)
     au bout du bras.
  4. peinture historique vert wagon/noir foncé — sans objet en N&B mais confirme un fill
     sombre uniforme, pas de reflet métallique clair façon aluminium brossé.
- **Piège** : "cobra head" aluminium 2000s+, mâts routiers gris hauts type autoroute, globe
  moderne tout-LED plat.

## 3. wallaceFountain — fontaine Wallace

- **Modèle canonique** : le modèle "grande" à **4 cariatides**, installé dès 1872 (Richard
  Wallace, don au lendemain du siège de Paris) — piédestal octogonal, quatre cariatides dos
  tournés soutenant un dôme pointu orné de dauphins. Peinture vert bronze très sombre
  (imite une patine de bronze sur une fonte moins noble) — sans objet en N&B mais confirme
  un fill uniformément sombre.
- **Traits de silhouette** :
  1. quatre colonnes fines (cariatides) disposées en cercle/carré autour d'un socle
     octogonal central — jamais une colonne unique.
  2. dôme pointu au sommet, orné de petites protubérances (dauphins) — pas un dôme plat.
  3. silhouette resserrée à la base, élargie à mi-hauteur (les cariatides), puis resserrée
     vers le dôme — un profil "sablier", pas un cylindre droit.
  4. échelle modeste (~2,5 m), nettement plus basse et plus large qu'un lampadaire.
- **Piège** : le modèle "petite" à une seule cariatide (variante plus tardive/réduite,
  aujourd'hui répandue mais moins iconique) — préférer les 4 cariatides pour la lisibilité
  et la reconnaissance immédiate ; ne pas la confondre avec une fontaine à boire moderne en
  acier (design "Ville de Paris" post-2000, cylindrique, sans ornement) ; ne pas la réduire
  à une silhouette de borne/bollard (il lui faut le dôme + les colonnes pour se lire).

## 4. parkingMeter — horodateur (grosse boîte grise Schlumberger, PAS le modèle 2020s)

- **Modèle canonique** : horodateur "Compteurs Schlumberger" (Schlumberger a repris la
  Compagnie des Compteurs en 1970, dessiné son premier horodateur en 1972) — boîtier acier
  gris/beige, tête inclinée en "casquette solaire" (pente pour évacuer la pluie), petit écran
  LCD monochrome, large fente à pièces, ticket imprimé en sortie basse. En 1998, l'horodateur
  multi-place coexiste avec des parcmètres individuels plus anciens (le remplacement complet
  parcmètre→horodateur ne s'achève qu'entre 2001 et 2006) — soit une boîte mécanique/
  électronique simple, PAS le terminal tactile couleur moderne.
- **Traits de silhouette** :
  1. mât fin, nettement plus mince que la tête (ratio fort) — sinon ça se lit comme un
     bollard.
  2. tête rectangulaire massive, **face supérieure inclinée/en biseau** ("casquette"), jamais
     un sommet plat.
  3. petite fenêtre écran (LCD/verre) + fente à pièces + fente ticket en façade, lignes
     horizontales de ventilation.
  4. boîte anguleuse/rectangulaire, jamais ronde.
- **Piège** : l'horodateur Flowbird "Strada" (2010s-2020s, écran tactile couleur, lecteur
  carte seul, coques anthracite/bleu arrondies, logo Ville de Paris moderne, PAS de fente à
  pièces) est l'anachronisme n°1 à éviter — c'est celui qu'on croise aujourd'hui dans Paris,
  pas celui de 1998. Pas de QR code, pas de logo carte bancaire sans contact.

## 5. bollard — potelet parisien (tête boule fonte)

- **Modèle canonique** : le "potelet boule" — fût tubulaire acier meulé lisse, tête en fonte
  ductile sphérique. Fait notable et **très favorable au brief 1998** : le déploiement massif
  du potelet boule dans Paris a précisément commencé **dans les années 1990** — ce n'est pas
  un objet rétro-daté, c'est contemporain de la scène.
- **Traits de silhouette** :
  1. fût court et trapu (hauteur genou/hanche), pas un poteau élancé.
  2. tête en boule/dôme arrondi — jamais plate ni pointue.
  3. fût lisse, légèrement évasé à la base, section constante sinon.
  4. peint sombre uniforme (noir/anthracite), pas de bande réfléchissante.
- **Piège** : les bornes/potelets anti-Vigipirate ou anti-bélier (post-2015, cylindres
  béton/acier trapus avec collerette réfléchissante) sont un **objet différent** — ADR-0047
  mentionne déjà un "Vigipirate ring-and-bag" séparé dans le brief foreground, ne pas fusionner
  les deux. Éviter aussi la borne plate moderne à autocollant réfléchissant (norme 2000s+),
  et surtout : ceci n'est **jamais** une bouche à incendie américaine — pas de silhouette de
  fire hydrant.

## 6. bench — banc public (banc Davioud)

- **Modèle canonique** : le **banc Davioud** (Gabriel Davioud, sous Haussmann/Alphand,
  années 1860 — 8 428 bancs posés dès 1869), toujours la référence visuelle du banc public
  parisien en 1998. Lattes de bois horizontales sur piètement en fonte ornée (motifs
  floraux), forme double-assise dos-à-dos dans sa version square/promenade, ou simple-face
  en version rue courante.
- **Traits de silhouette** :
  1. lattes de bois horizontales bien marquées (assise + dossier), lignes parallèles
     lisibles — c'est le trait le plus identifiant.
  2. piètement en fonte massif aux extrémités (volutes/ornement floral), nettement plus
     "lourd" visuellement que les lattes.
  3. dossier légèrement incliné (confort), pas un dossier vertical droit.
  4. posé au sol/trottoir, pas sur un socle surélevé.
- **Piège** : le banc béton préfabriqué "à la parisienne" version 2000s+ (blocs pleins, pas
  de lattes) est trop plat/anonyme — évite ce look. Éviter aussi tout séparateur médian
  d'accoudoir façon "hostile design" anti-SDF (généralisé après le milieu des années 2000) :
  un banc Davioud 1998 n'a pas cette subdivision. Pas de banc pique-nique américain en A.

## 7. streetSign — plaque/panneau sur poteau (à trancher avec lead-art)

Point de vigilance culturel important : à Paris, la **plaque de nom de rue** est presque
toujours **murale** (fixée sur la façade d'angle), pas montée sur poteau — c'est une
différence structurante avec beaucoup d'autres villes. Le kind actuel (`streetSign`) dessine
un poteau + plaque rectangulaire, ce qui, mécaniquement, se lit plus juste comme un
**panneau réglementaire/de police sur poteau** (stationnement, sens, info Decaux) qu'une
plaque de rue — sauf coin de square/angle sans mur, cas réel mais minoritaire.

- **Modèle canonique (plaque émaillée, référence historique)** : depuis 1844 (préfet
  Rambuteau), fond bleu azur, lettres capitales blanches, **double filet vert** en cadre —
  sans objet en couleur ici, mais le cadre à double liséré donne un trait de silhouette
  (fine bordure visible en relief/grey rim).
- **Traits de silhouette** :
  1. plaque **rectangulaire "paysage"** (plus large que haute, ratio ~2:1 ou plus) — jamais
     carrée, ronde ou en losange (ça la ferait lire comme un panneau de signalisation
     réglementaire français, qui LUI est normé rond/triangle/losange par le code de la route).
  2. fin double-liséré de cadre en bordure de plaque (grey rim, pas juste un bord plat).
  3. si montée sur poteau : poteau nettement plus fin que la largeur de la plaque, entrant
     par en dessous/au centre — jamais deux poteaux type panneau de rue américain.
  4. plan unique, pas un boîtier double-face 3D.
- **Piège** : le panneau de rue vert sur double-poteau à l'américaine (croisement, portrait)
  — géographiquement faux, à bannir totalement. Éviter tout écran Decaux numérique (2010s+).
  À trancher avec `lead-art` : soit assumer que ce kind est un panneau réglementaire (le plus
  honnête vu le poteau), soit basculer vers une plaque murale si le rendu facade le permet.

## 8. scooter — scooter/mobylette garé (1990s)

- **Modèle canonique** : déjà ancré côté véhicules jouables dans `docs/art-direction.md` §5
  ("moto" = MBK Booster / Peugeot 103) — pour ce prop **garé**, deux options fidèles :
  - **MBK Booster** (lancé 1990, LE scooter jeune français des années 90, gamme 1998
    incluait Spirit/Next Generation/Rocket/Track) — carénage bas sportif, jambière avant.
  - **Peugeot 103 / mobylette classique** (encore très répandue, plus "cabossée"/utilitaire,
    convient bien à une scène squat/coursier) — cadre tubulaire apparent, sans carénage.
    Recommandation : si le "moto" jouable à l'écran est déjà un Booster/103 en mouvement,
    choisir l'**autre** des deux pour ce prop statique afin d'éviter un doublon visuel exact
    dans la même scène (à trancher avec `lead-art`).
- **Traits de silhouette** (cohérents avec le tracé actuel du code, à confirmer) :
  1. roues petites et grasses (proportions mobylette/scooter), jamais des roues fines de vélo
     ni des grandes roues de moto routière.
  2. cadre tubulaire apparent (103) OU jambière/carénage bas continu (Booster) — choisir
     UN seul parti et le garder cohérent sur tout le set.
  3. **top-box/caisse arrière** sanglée sur le porte-bagages — cliché très parisien et
     période-correct (usage coursier/utilitaire), déjà présent dans le tracé actuel : garder.
  4. phare rond simple à l'avant, tige de rétroviseur fine.
- **Piège** : maxi-scooter moderne (Piaggio Beverly, Yamaha TMAX — carrosserie pleine,
  grosses roues, bandeaux LED, silhouette 2000s+) ; trottinette électrique ou Vélib/vélo en
  libre-service (anachronisme total, 2007+/2018+) ; carénage plastique lisse et continu façon
  design 2010s (trop propre pour l'esthétique crade-documentaire).

---

## Sources (art-advisor, 2026-07-19)

- [Éclairage des rues à Paris — Wikipédia](https://fr.wikipedia.org/wiki/%C3%89clairage_des_rues_%C3%A0_Paris)
- [Les plus beaux réverbères de Paris — Paris ZigZag](https://www.pariszigzag.fr/insolite/lieux-insolites/plus-beaux-reverberes-paris/)
- [Wallace fountain — Wikipedia](https://en.wikipedia.org/wiki/Wallace_fountain)
- [Pourquoi les fontaines Wallace sont vertes — Le Tribunal du Net](https://www.letribunaldunet.fr/insolite/pourquoi-fontaines-wallace-vertes-paris-origine-histoire.html)
- [UNE FONTAINE WALLACE DANS LES JARDINS — Musée Carnavalet](https://www.carnavalet.paris.fr/le-musee/la-fontaine-wallace)
- [Flowbird — Encyclopédie Wikimonde](https://wikimonde.com/article/Flowbird)
- [L'horodateur, invention 100% française — AirZen](https://www.airzen.fr/lhorodateur-invention-100-francaise-fete-ses-50-ans/)
- [Paris. Les parcmètres ont 50 ans ! — Largus](https://www.largus.fr/actualite-automobile/paris-les-parcmetres-ont-50-ans-10720392.html)
- [You pass them every day in Paris — Sortiraparis (potelets)](https://www.sortiraparis.com/en/what-to-visit-in-paris/history-heritage/articles/345052-you-run-into-them-every-day-in-paris-without-noticing-these-little-bollards-and-posts-hide-a-royal-history)
- [Potelet — Wikipédia](https://fr.wikipedia.org/wiki/Potelet)
- [Banc Davioud — Wikipédia](https://fr.wikipedia.org/wiki/Banc_Davioud)
- [La petite histoire du mobilier parisien : le Banc Davioud — Sortiraparis](https://www.sortiraparis.com/en/what-to-visit-in-paris/history-heritage/articles/339038-the-little-story-of-parisian-furniture-davioud-bench-an-invitation-to-stroll-through-the-streets-of-paris)
- [Plaque de rue — Wikipédia](https://fr.wikipedia.org/wiki/Plaque_de_rue)
- [Pourquoi les plaques de rue françaises sont bleues — Le Tribunal du Net](https://www.letribunaldunet.fr/insolite/pourquoi-plaques-rue-bleues-france-origine-histoire.html)
- [Gamme MBK Booster 1998 — Scooter Mag](https://www.scooter-mag.fr/gamme-mbk-booster-1998)
- [L'histoire de Motobécane et MBK — Moto-Net](https://www.moto-net.com/article/l-histoire-de-motobecane-et-mbk-des-mobylette-et-booster.html)
- [De la fonderie à la LEDification en passant par l'Art déco — Lux Revue](https://lux-revue-eclairage.fr/de-la-fonderie-a-la-ledification-en-passant-par-lart-deco/)
