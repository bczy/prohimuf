# Handoffs — Level harness SP3 : pitch → candidat (STORY-LEVEL-HARNESS-SP3)

Story slug: `story-level-harness-sp3` · ouverte 2026-07-30 sur intake direct de Bertrand
(« sp3 »). Feature : l'orchestrateur qui ferme la boucle du harness — une ligne de pitch
→ une PR draft avec level candidat complet + gate packet. Dernier des 3 sous-projets
(SP1 mergé ADR-0075, SP2 spec/plan mergés PR #151).

**SÉQUENCEMENT : BUILD bloqué jusqu'au merge de SP2** — SP3 orchestre les phases que SP2
rend autonomes. Ce shard trace le cadrage ; rien ne se code avant.

## 1. INTAKE + CADRAGE — direct avec Bertrand — 2026-07-30

- **4 décisions actées** : pitch = ligne libre confiée à la boucle design (le harness
  orchestre la créativité de la crew, il ne l'imite pas) · tuning = courbe paramétrique
  interpolée sur les levels shippés, gatée lead-game-designer · autonomie = jusqu'à la
  PR DRAFT + gate packet, tous les gates humains conservés (design PASS avant toute
  génération payée) · budget = caps SP2 hérités, un candidat à la fois.
- Spec : `docs/game-design/spec-level-harness-sp3.md`. Plan d'implémentation : à écrire
  à l'ouverture du BUILD (après merge SP2), pour intégrer ce que SP2 aura réellement
  livré (noms de workflows, format du compteur, driver §8 généralisé).

## Suivi

- [ ] GATE design du spec lui-même (lead-game-designer : le flux §3.1 et la courbe §3.2
      touchent le design system)
- [ ] Merge de SP2 (`feat/level-harness-sp2`) — précondition BUILD
- [ ] Plan d'implémentation SP3 (écrit contre le SP2 réellement mergé)
- [ ] Format machine-lisible du verdict design (§6 risque 1) — à trancher au plan
