# 🌍 GlobalMetro3D — Visualiseur 3D temps réel des réseaux de transport

[![Site en direct](https://img.shields.io/badge/Site%20en%20Direct-parisian3dsubway.netlify.app-00DC82?style=flat-square&logo=netlify)](https://parisian3dsubway.netlify.app)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-morgan98800.github.io%2FMistral4Metro3D-181717?style=flat-square&logo=github)](https://morgan98800.github.io/Mistral4Metro3D/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![deck.gl](https://img.shields.io/badge/deck.gl-9.1-blue?style=flat-square)](https://deck.gl/)
[![MapLibre GL](https://img.shields.io/badge/MapLibre%20GL-4.7-2980b9?style=flat-square)](https://maplibre.org/)
[![IDFM PRIM](https://img.shields.io/badge/Donn%C3%A9es-IDFM%20PRIM%20SIRI--Lite-0055A5?style=flat-square)](https://prim.iledefrance-mobilites.fr/)

Application web cartographique modélisant en temps réel la circulation des réseaux de **Paris (métro + RER), Montréal, Londres, Lille, Washington DC, Berlin et Édimbourg** sur des jumeaux numériques 3D (MapLibre GL + deck.gl, données GTFS + flux temps réel).

Accès direct en production : **[https://parisian3dsubway.netlify.app](https://parisian3dsubway.netlify.app)** (Netlify, avec relais temps réel `/api/*`) · version GitHub Pages : **[https://morgan98800.github.io/Mistral4Metro3D/](https://morgan98800.github.io/Mistral4Metro3D/)** (déployée par `.github/workflows/pages.yml`, mode horaires théoriques GTFS sans relais serverless)

---

## 🏙️ Villes supportées

| Ville | Réseaux | Source temps réel | Relais serveurless |
| --- | --- | --- | --- |
| Paris | Métro (16 lignes) + RER (5 lignes) | IDFM PRIM SIRI-Lite | `/api/prim` |
| Montréal | Métro STM (4 lignes) | STM i3 | `/api/stm` |
| Londres | Tube, DLR, Elizabeth line, Overground, Tram | TfL Unified API | `/api/tfl_arrivals` |
| Lille | Métro VAL + Tramway | Ilévia GTFS-RT | `/api/lille-rt` |
| Washington DC | Metrorail | WMATA GTFS-RT | `/api/washington-rt` |
| Berlin | U-Bahn + S-Bahn | VBB GTFS-RT | `/api/berlin-rt` |
| Édimbourg | Trains régionaux ScotRail | Mode théorique GTFS | — |

Chaque ville est décrite par un `cities/<ville>/city.config.ts` (géométrie, cinématique par mode de transport, fournisseur de données temps réel et endpoints de relais). Voir [`cities/index.ts`](cities/index.ts) pour le registre complet.

---

## 🌟 Fonctionnalités Clés

1. **Une Seule Scène 3D, Trois Stratégies de Rendu des Rames** :
   - **Marqueurs** (`trains_layer.ts`, `z < 9`) : pastilles de repli portant le niveau de confiance (`measured` / `bracketed` / `extrapolated` / `scheduled`).
   - **Capsules métriques** (`capsule_layer.ts`, `z ≥ 9`) : caisses découpées dans le tracé réel, toitures, soufflets, phares et feux LED, halo or pour les rames recalées.
   - **Modèles glTF** (`train_models_layer.ts`, `z > 16`) : `ScenegraphLayer` instanciant une caisse par voiture, familles `pneumatic_generic` et `steel_classic`. Désactivables via `?train-models=0`.
   - Fond vectoriel OpenFreeMap, relief DEM (exagération ×1,5) et bâti 3D `fill-extrusion` activable depuis l'en-tête.

2. **Moteur de Circulation In-Browser à Cinématique Trapézoïdale** :
   - Simulation autonome cadencée à 1 Hz exploitant les 11 252 courses commerciales de la journée (`schedule.json`).
   - Profil cinématique trapézoïdal : 25 % d'accélération, 50 % de croisière, 25 % de freinage, plafond à 85 km/h, plus le stationnement en station.
   - Interpolation à 60 FPS entre deux ticks (`requestAnimationFrame`), avec résorption des écarts sur 300 ms et recalage franc au-delà de 20 m.
   - Calcul des azimuts et des caps lissés sur ±30 m le long de tracés binaires SHP2 compressés (`shapes.bin`).

3. **Synchronisation Temps Réel PRIM (Île-de-France Mobilités)** :
   - Relais Netlify côté serveur vers le flux officiel SIRI-Lite `EstimatedTimetable`, planifié toutes les 3 minutes, cache 180 s.
   - Recalage des courses théoriques sur les passages réels (`rt_matching.ts`) et exposition de **4 niveaux de confiance** — mesuré, encadré, extrapolé, théorique.
   - Lissage exponentiel des écarts avec $\alpha = 0.4$, fenêtre d'appariement de 120 s, oubli après 6 min sans donnée fraîche.
   - Pastilles rames dynamiques : halo **or** pour les rames mesurées ou encadrées, halo blanc cassé et contour pointillé pour le théorique.

4. **« Le Quai » & Diagramme de Marche Vertical (Niveau 2)** :
   - Rail latéral escamotable avec les pastilles de lignes (16 lignes de métro + 5 lignes RER natives).
   - Diagramme vertical des stations avec commutateur de terminus (direction A ⇄ B).
   - Visualisation en direct des rames en approche en face de leur prochain arrêt avec vitesse instantanée et retard calculé.
   - Indicateur en direct d'intervalle moyen (*headway*).

5. **Recherche Instantanée de Stations (`⌘K` / Loupe)** :
   - Autocomplétion floue instantanée sur les 468 stations publiées du réseau.
   - Affichage des pastilles officielles des correspondances et tags Hub.
   - Vol de caméra cinématique immédiat avec zoom 16x sur la station choisie.

6. **Optimisation Mobile Smartphone & Typographie Institutionnelle** :
   - Tiroir rétractable en bas d'écran (Bottom Sheet tactile) avec support des zones protégées (`safe-area-inset`).
   - Typographie **Switzer** pour l'interface et **Cabinet Grotesk** pour les titres, servies par Fontshare, avec **Inter** en repli ; chiffres tabulaires (`tnum`) pour les chronomètres et indices de lignes.
   - Cibles tactiles de 52 px sur mobile, et plafond de 150 rames découpées simultanément.

7. **Vertu de Bande Passante** :
   - Voies dédupliquées **24,6 Ko** (`tracks.json`), tracés binaires **0,80 Mo** brut (**0,17 Mo Brotli**, `shapes.bin.br`) — ces deux artefacts étant considérés comme les plus critiques par la carte réseau.

---

## 🏛️ Architecture du Projet

```
GlobalMetro3D/
├── cities/                      # Un dossier par ville : config + données + ingest + rt
│   ├── paris/                   #   city.config.ts, data/, rt/, assets/models/train/
│   ├── montreal/  london/  lille/  washington/  berlin/  edinburgh/
│   └── index.ts                 # Registre des villes (CITIES, getCityConfig)
├── core/                        # Cœur partagé (TypeScript)
│   ├── sim/                     #   Moteur cinématique in-browser (browser_engine, kinematics, shapes)
│   ├── ui/                      #   Composants UI & couches carte (MapLibre + deck.gl)
│   ├── rt/                      #   Recalage temps réel (rt_matching)
│   ├── ingest/                  #   Pipeline d'ingestion Python (GTFS -> artefacts normalisés)
│   └── config.ts / types.ts     # Configurations typées par ville et par mode
├── web/                         # Application front (Vite + TypeScript)
│   ├── src/main.ts              #   Point d'entrée, orchestration & modales
│   └── public/                  #   Données servies au client (data/, cities/<ville>/…)
├── engine/                      # Service local optionnel (HTTP + WebSocket, port 4000)
├── netlify/functions/           # Relais serverless temps réel (un par ville)
│   ├── _shared/cors.ts          #   Liste d'origines CORS (jamais de wildcard *)
│   ├── prim_relay.ts            #   Paris — PRIM SIRI-Lite, planifié */3 * * * *
│   ├── stm_relay.ts             #   Montréal — STM i3, planifié */2 * * * *
│   ├── tfl_relay.ts             #   Londres — TfL Unified API, planifié chaque minute
│   ├── lille_relay.ts           #   Lille — Ilévia GTFS-RT
│   ├── washington_relay.ts      #   Washington DC — WMATA GTFS-RT
│   └── berlin_relay.ts          #   Berlin — VBB GTFS-RT
├── packages/shared/             # Code partagé web <-> engine
├── scripts/                     # Scripts de génération des artefacts (Python)
├── tests/                       # Tests unitaires vitest + snapshots de non-régression par ville
└── docs/                        # Documentation technique détaillée
```

---

## 🚀 Démarrage Rapide en Local

### Prérequis
- Node.js >= 18 (monorepo npm workspaces : `packages/*`, `web`, `engine`)
- Python >= 3.9 (avec `shapely`, `requests`, `numpy` pour régénérer les données)

### Installation & Lancement

```bash
# 1. Cloner le projet
git clone https://github.com/Morgan98800/GlobalMetro3D.git
cd GlobalMetro3D

# 2. Installer les dépendances (à la racine, workspaces npm)
npm install

# 3. Lancer le serveur de développement Vite du client web
npm run dev:web
```

L'application est immédiatement accessible sur **`http://localhost:3000`** (port déclaré dans
`web/vite.config.ts`, qui ouvre aussi le navigateur automatiquement). Le port `5173` correspond
au défaut de Vite : il n'est **pas** utilisé ici.

### Compilation de Production

```bash
# Depuis la racine : publie les GLB, régénère le manifeste, puis build Vite
npm run build:web
```

Les fichiers statiques prêts pour la production sont générés dans `web/dist/`.

### Variables d'environnement

Copiez [`.env.example`](.env.example) en `.env.local` (Netlify) ou `.env` (local) et renseignez les clés d'API temps réel (`PRIM_API_KEY`, `STM_API_KEY`, `TFL_APP_KEY`, `WMATA_API_KEY`). Sans clé, les relais répondent en mode dégradé sur les horaires théoriques GTFS.

Les relais `/api/*` appliquent une **liste d'origines CORS** : par défaut l'URL Netlify du site (`URL`, `DEPLOY_URL`, `DEPLOY_PRIME_URL`) et les origines `localhost` / `127.0.0.1` de développement. Pour autoriser un domaine supplémentaire, définissez `ALLOWED_ORIGINS=https://exemple.com,https://autre.exemple` (séparées par des virgules). Aucun wildcard `*` n'est jamais émis (voir `netlify/functions/_shared/cors.ts`).

### Service local optionnel (`engine/`)

```bash
npm --workspace=engine run dev     # node --watch src/server.js
# HTTP + WebSocket sur http://localhost:4000 (PORT surchargeable), endpoint /health
```

Ce service n'est pas nécessaire au fonctionnement du site : il sert aux tests d'audit
(`npm --workspace=engine run test`, `node --test`) et au relais PRIM local. Le client
`web/src/net/ws_client.ts` est présent mais n'est importé par aucun point d'entrée.

---

## 📚 Documentation Détaillée

Consultez les guides techniques dédiés dans le dossier [`docs/`](docs/) :

- **[Architecture & Flux Global](docs/ARCHITECTURE.md)** : Schémas d'architecture, couches de données, code-splitting et performances.
- **[Pipeline de Données](docs/DATA_PIPELINE.md)** : Extraction GTFS, projection monotone, formats binaires et optimisations de payload.
- **[Moteur de Simulation & Cinématique](docs/SIMULATION_ENGINE.md)** : Moteur autonome, profil trapézoïdal, calcul de vitesse et headway.
- **[Temps Réel PRIM SIRI-Lite](docs/REALTIME_PRIM.md)** : relais côté serveur, fenêtre de service, rapprochement course↔théorique et recalage des rames.
- **[Rendu Visuel 2.5D & 3D](docs/3D_RENDERING.md)** : MapLibre, deck.gl, bâti vectoriel et matériel roulant.
- **[Interface Utilisateur & Navigation](docs/UI_AND_ROUTING.md)** : Composants UI, ergonomie smartphone, raccourcis et routage SPA.
- **[Déploiement & Exploitation](docs/DEPLOYMENT_AND_OPS.md)** : Build Vite, Netlify, en-têtes CDN et poids des bundles.
- **[Audit géométrique](docs/cartographie_geographie_reseau.md)** : fichier **généré** par `scripts/generate_geo_audit.py` — ne pas éditer à la main.
- **[Charte typographique](docs/CHARTE-intERVALLE-sprague.md)** : spécification de design (voir l'encadré de statut en tête de fichier).
- **[Audits historiques](DESIGN_AUDIT.md)** : relevés de mesures datés (`DESIGN_AUDIT.md`, `MOBILE_AUDIT.md`) — ils décrivent l'état du produit au moment de la mesure, pas l'état courant.

---

## 📜 Licence & Données
- Données théoriques : **GTFS Île-de-France Mobilités** (Licence Ouverte v2.0).
- Données temps réel : **API PRIM / SIRI-Lite** (Île-de-France Mobilités).
- Fond cartographique : **OpenFreeMap** (tuiles vectorielles schéma OpenMapTiles, © OpenStreetMap). Relief : `demotiles.maplibre.org`. Aucun fond Esri, Mapbox ou Google n'est utilisé.
- Typographies : **Switzer** et **Cabinet Grotesk** (Fontshare), **Inter** (Google Fonts, repli).
- Code source : Développé dans le cadre du visualiseur 3D du métro parisien.
