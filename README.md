<div align="center">

# ✦ Preact Dev Feature Flags

**A local release-control console with environment rollouts, JSON Logic targeting, deterministic bucketing, and explainable evaluations.**

![Preact](https://img.shields.io/badge/Preact-10-673ab8?style=for-the-badge&logo=preact&logoColor=ffffff)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?style=for-the-badge&logo=typescript&logoColor=ffffff)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=ffffff)
![JSON Logic](https://img.shields.io/badge/JSON_Logic-Targeting-4f46e5?style=for-the-badge)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=ffffff)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

</div>

---

## ✨ Highlights

- **Environment Controls:** Switches independently between production, staging, and development configurations.
- **Flag Registry:** Searches feature names, keys, and owners with live environment status.
- **Kill Switches:** Enables or disables each flag per environment.
- **Percentage Rollouts:** Adjusts rollout in five-percent increments with a stable user bucket.
- **Targeting Rules:** Adds, edits, and removes ordered attribute rules for country, plan, email, and company size.
- **JSON Logic Evaluation:** Executes targeting operators with `json-logic-js` rather than display-only conditions.
- **Deterministic Bucketing:** Uses MurmurHash over the flag key and user ID for stable rollout assignment.
- **Decision Trace:** Explains the environment gate, each targeting rule, and rollout comparison.
- **Audit Log:** Records local configuration changes with timestamp, actor, and human-readable action.
- **Validated Persistence:** Stores the workspace in IndexedDB and validates restored data with Zod.
- **Responsive UI:** Uses focused list/detail navigation on mobile and adds a persistent simulator column on wide screens.

## 🧱 Project Structure

```text
public/
|-- favicon.svg
`-- sample-feature-flags.json
src/
|-- app.tsx
|-- main.tsx
|-- index.css
|-- components/
|   |-- evaluation-panel.tsx
|   |-- flag-editor.tsx
|   |-- flag-list.tsx
|   `-- workspace-state.tsx
|-- domain/
|   `-- flags.ts
`-- services/
    `-- flag-store.ts
```

## 🛠️ Tech Stack

- Preact 10 with Vite 8
- TypeScript 6
- Tailwind CSS 4
- `json-logic-js`
- `murmurhash-js`
- `zod`
- `idb-keyval`
- `@preact/signals`
- `lucide-preact`

## 📦 Included Sample Data

`public/sample-feature-flags.json` contains four product flags, three environments, sample identities, targeting rules, rollout configurations, and an initial audit history.

## 🚀 Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## 🔌 Extension Notes & Nuances

- The console is a client-side template and does not provide an edge SDK or remote configuration service.
- Rule order matters: the first matching rule returns its configured value before percentage rollout.
- Percentage rollout is deterministic for the same flag key and user ID, but changing either value changes the bucket.
- Local audit entries are useful for UI prototyping and are not tamper-proof records.
- Replace `services/flag-store.ts` with an authenticated API boundary before using the interface for shared release controls.
- The mobile layout keeps evaluation immediately below the editor so a change can be verified without a horizontal workspace.

## 🧪 Build & Checks

```bash
npm run format:check
npm run build
npm run preview
```

## 🌐 Vercel Deployment

The repository includes a Vite-ready `vercel.json` with SPA rewrites.

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## 📄 License

MIT License. See [LICENSE](./LICENSE).
