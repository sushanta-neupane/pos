# Inventory Management + POS (Next.js + Prisma + MongoDB)

Minimal, keyboard-friendly ERP/POS-style app with:
- Next.js (App Router)
- Prisma ORM + MongoDB
- Tailwind CSS + shadcn/ui
- NextAuth (Credentials) with roles: `ADMIN` / `SALES`

## Setup

1) Create env file:
```bash
npm run setup
```

2) Start MongoDB locally (default in `.env.example`):
Prisma + MongoDB requires a replica set (single-node is fine).

Local mongod (no Docker):
```bash
mkdir -p .mongo-data-rs0
mongod --dbpath .mongo-data-rs0 --replSet rs0 --bind_ip 127.0.0.1 --port 27018 --logpath .mongo-data-rs0/mongod.log
mongosh --quiet "mongodb://127.0.0.1:27018/admin" --eval 'rs.initiate({_id:"rs0",members:[{_id:0,host:"127.0.0.1:27018"}]})'
```

Or Docker (if installed):
```bash
docker compose up -d
```

3) Push schema + seed an admin:
```bash
npm run db:push
npm run db:seed
```

4) Run:
```bash
npm run dev
```

Login:
- `admin@local.test` / `admin123`

## Notes

- Admin-only routes: `/dashboard`, `/alerts`
- Email alerts: set SMTP env vars in `.env` (see `.env.example`)
