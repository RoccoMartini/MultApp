# MultApp 🟡

Gestione multe squadra dilettantistica — calcio & basket.

## Stack
- **Next.js 14** (App Router)
- **Supabase** (PostgreSQL + Auth)
- **Tailwind CSS**
- **TypeScript**

## Setup locale

```bash
# 1. Installa dipendenze
npm install

# 2. Crea il file .env.local
cp .env.example .env.local
# Inserisci le tue credenziali Supabase

# 3. Avvia il dev server
npm run dev
```

## Struttura

```
src/
├── app/
│   ├── page.tsx              # Dashboard
│   ├── giocatori/page.tsx    # Lista giocatori + dettaglio multe
│   └── tipi-multa/page.tsx   # Regolamento multe
├── components/
│   ├── Sidebar.tsx
│   └── MonthFilter.tsx
└── lib/
    ├── supabase.ts
    └── database.types.ts
```

## Funzionalità
- Dashboard con totali (da riscuotere / già saldato) cliccabili
- Lista giocatori con dettaglio multe per giocatore
- Toggle pagamento per ogni multa
- Filtro per mese
- Catalogo tipi di multa
