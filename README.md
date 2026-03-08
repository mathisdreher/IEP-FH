# Index Égalité Professionnelle F/H · Gender Equality Index

> Explorez l'Index d'Égalité Professionnelle Femmes-Hommes des entreprises françaises de 50 salariés ou plus.
>
> Explore the French Gender Equality Index for companies with 50+ employees.

**[Source data](https://www.data.gouv.fr/datasets/index-egalite-professionnelle-f-h-des-entreprises-de-50-salaries-ou-plus/)** — Ministère du Travail / French Ministry of Labour

---

## Features / Fonctionnalités

| Feature | Description FR | Description EN |
|---------|---------------|----------------|
| 🔍 Search | Recherche par nom, SIREN, filtres région/taille | Search by name, SIREN, region/size filters |
| 🏢 Company page | Score, sous-indicateurs, historique, comparaisons | Score, sub-indicators, history, comparisons |
| ⚖️ Compare | Radar + barres, jusqu'à 5 entreprises | Radar + bar charts, up to 5 companies |
| 📊 Sectors | Classement par secteur d'activité | Ranking by business sector |
| 🗺️ Regions | Scores par région avec graphiques | Regional scores with charts |
| 📈 Dashboard | Vue nationale, tendances, distribution | National overview, trends, distribution |
| 🌙 Dark mode | Thème sombre/clair avec détection système | Dark/light theme with system detection |
| 🌐 i18n | Français et anglais | French and English |

---

## Tech Stack

- **[Next.js](https://nextjs.org/) 16** (App Router, React 19)
- **TypeScript 5**
- **[Tailwind CSS](https://tailwindcss.com/) v4**
- **[Recharts](https://recharts.org/)** — Charts
- **[Fuse.js](https://www.fusejs.io/)** — Server-side fuzzy search
- **[Vercel](https://vercel.com/)** — Hosting (ISR, standalone output, CDG1 region)
- **[GitHub Actions](https://github.com/features/actions)** — Weekly automatic data updates

---

## Architecture

```
data.gouv.fr (XLSX)
      │
      ▼
scripts/fetch-data.ts ──► data/ (static JSON)
                              │
                              ▼
                         Next.js App
                         ├── SSR pages (ISR 24h)
                         ├── API routes (cached)
                         └── Client components
                              │
                              ▼
                         Vercel (CDG1)
```

### Data Pipeline

1. **Source**: XLSX file from `egapro.travail.gouv.fr` (~24 MB, 211K+ rows)
2. **Script**: `scripts/fetch-data.ts` downloads, parses, and splits into optimized JSON
3. **Output**: `data/companies.json` (40K+ companies), `data/stats/`, `data/by-year/`
4. **Schedule**: GitHub Actions runs weekly (Monday 6 AM UTC), checks `last_modified` before downloading
5. **On update**: Commits new JSON files, triggers Vercel rebuild

---

## Project Structure

```
├── data/                       # Generated JSON data (from pipeline)
│   ├── companies.json          # All companies (12 MB)
│   ├── meta.json               # Dataset metadata
│   ├── by-year/                # Year-by-year records (gitignored)
│   └── stats/                  # Pre-computed aggregates
│       ├── national.json
│       ├── regions.json
│       └── sectors.json
├── scripts/
│   └── fetch-data.ts           # Data pipeline (XLSX → JSON)
├── src/
│   ├── app/
│   │   ├── globals.css         # Tailwind + CSS variables (light/dark)
│   │   ├── layout.tsx          # Root layout (providers, nav, footer)
│   │   ├── page.tsx            # Search homepage
│   │   ├── not-found.tsx       # 404 page
│   │   ├── api/
│   │   │   ├── search/         # Fuzzy search API (Fuse.js)
│   │   │   └── company/[siren]/history/  # Company history API
│   │   ├── comparer/           # Compare up to 5 companies
│   │   ├── entreprise/[siren]/ # Company detail page
│   │   ├── regions/            # Regional scores
│   │   ├── secteurs/           # Sector scores
│   │   └── tableau-de-bord/    # National dashboard
│   ├── components/
│   │   ├── theme-provider.tsx  # Dark/light mode context
│   │   ├── theme-toggle.tsx    # Theme switch button
│   │   ├── language-provider.tsx # FR/EN i18n context
│   │   ├── language-toggle.tsx # Language switch button
│   │   ├── navigation.tsx      # Header navigation
│   │   ├── footer.tsx          # Footer with data source
│   │   ├── company-card.tsx    # Search result card
│   │   ├── comparison-bar.tsx  # Horizontal comparison bar
│   │   ├── score-gauge.tsx     # Circular score gauge (SVG)
│   │   ├── score-history.tsx   # Line chart for score history
│   │   ├── sub-scores.tsx      # Sub-indicator gauges
│   │   ├── dashboard-charts.tsx # Dashboard charts
│   │   ├── region-map.tsx      # Region bar chart + table
│   │   ├── sector-table.tsx    # Sortable sector table
│   │   └── share-button.tsx    # Copy link button
│   └── lib/
│       ├── data.ts             # Server-side data loading
│       ├── types.ts            # TypeScript interfaces
│       ├── utils.ts            # cn(), scoreColor(), etc.
│       ├── i18n.ts             # Translation dictionaries
│       └── chart-colors.ts     # Dark-mode-aware chart theme
├── next.config.ts              # Standalone output
├── vercel.json                 # Region + cache config
└── .github/workflows/
    └── update-data.yml         # Weekly data refresh
```

---

## Data Schema

### Company
| Field | Type | Description |
|-------|------|-------------|
| `siren` | string | SIREN identifier (9 digits) |
| `name` | string | Company name |
| `region` | string | French region |
| `department` | string | Department code |
| `sector` | string | Business sector label |
| `sectorCode` | string | NAF/APE code |
| `size` | string | `"50 à 250"`, `"251 à 999"`, or `"1000 et plus"` |
| `latestScore` | number \| null | Most recent equality score (0–100) |
| `latestYear` | number | Year of most recent data |

### YearRecord
| Field | Type | Description |
|-------|------|-------------|
| `siren` | string | Company SIREN |
| `year` | number | Reporting year |
| `score` | number \| null | Overall score |
| `scoreRemunerations` | number \| null | Pay gap indicator (max 40) |
| `scoreAugmentations` | number \| null | Raise gap, 50-250 companies (max 35) |
| `scoreAugmentationsHP` | number \| null | Raise gap excl. promo, 250+ (max 20) |
| `scorePromotions` | number \| null | Promotion gap, 250+ (max 15) |
| `scoreCongesMaternite` | number \| null | Maternity return (max 15) |
| `scoreHautesRemunerations` | number \| null | Top earners balance (max 10) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
git clone https://github.com/mathisdreher/IEP-FH.git
cd IEP-FH
npm install
```

### Seed Data

```bash
npx tsx scripts/fetch-data.ts --force
```

This downloads the XLSX from egapro.travail.gouv.fr and generates all JSON files in `data/`.

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build

```bash
npm run build
npm start
```

---

## Deployment

### Vercel (recommended)

1. Connect the repository to [Vercel](https://vercel.com)
2. Deployment is automatic on every push
3. Region is set to `cdg1` (Paris) via `vercel.json`
4. Pages use ISR with 24h revalidation

### Data Updates

Data is automatically updated every Monday at 6 AM UTC via GitHub Actions. The workflow:
1. Checks `last_modified` on data.gouv.fr API
2. If newer data exists: runs `fetch-data.ts --force`
3. Commits and pushes updated JSON files
4. Vercel rebuilds automatically

You can also trigger a manual update from the Actions tab.

---

## Vercel Cost Optimization

This project is optimized for minimal Vercel serverless usage:

- **ISR (24h)**: SSR pages are cached for 24 hours, reducing function invocations
- **API caching**: Search API has 1h `s-maxage`, history API has 24h
- **Standalone output**: Minimal deployment size
- **Static JSON**: No database — data loaded from pre-generated JSON files
- **In-memory caching**: Server-side data is cached after first load per instance
- **Single region**: Deployed to CDG1 (Paris) only, optimal for French data

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -am 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

---

## License

MIT
