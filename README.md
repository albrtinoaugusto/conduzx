# ConduzX

Gestão interna para escolas de condução em Moçambique.

## Super-Admin global

Para criar ou actualizar a conta global, defina `SUPER_ADMIN_EMAIL` e `SUPER_ADMIN_PASSWORD` no `.env` e execute `npm run db:super-admin`. A migração `0002_super_admin` deve estar aplicada antes do comando (execute `npm run db:migrate`). O comando é idempotente e associa a conta à administração global, sem a ligar a uma empresa.

## Stack

- Next.js App Router + TypeScript strict
- Tailwind CSS
- PostgreSQL
- Drizzle ORM
- Zod
- Vitest

## Começar

1. Instale dependências:

```bash
npm install
```

2. Copie o ficheiro de ambiente:

```bash
cp .env.example .env
```

3. Inicie o PostgreSQL local:

```bash
docker compose up -d
```

4. Crie as tabelas e os dados de exemplo:

```bash
npm run db:setup
```

5. Inicie a app:

```bash
npm run dev
```

A aplicação fica em `http://localhost:3000` (a landing pública em `/landing`).

### Contas de teste (seed)

Palavra-passe de todas: `conduzx123`

- `admin@conduzx.test` - administrador (categorias, utilizadores, tudo)
- `gestor@conduzx.test` - gestor (pode anular pagamentos e ver histórico)
- `atendente@conduzx.test` - atendente (alunos, inscrições, pagamentos)
- `outra@conduzx.test` - admin de outra escola (para confirmar o isolamento de dados)

## Scripts

- `npm run dev` inicia o servidor local.
- `npm run build` compila a aplicação.
- `npm run lint` executa lint.
- `npm run format` verifica formatação.
- `npm test` executa testes unitários.
- `npm run db:migrate` aplica as migrações (pasta `drizzle/`).
- `npm run db:seed` apaga e recria os dados de exemplo.
- `npm run db:generate` gera uma migração a partir de `src/server/db/schema.ts`.

## Fases do MVP

- Fase 0: scaffold do projeto, ambiente local e estrutura base.
- Fase 1: camada de dados com Drizzle, migrations e seed.
- Fase 2: autenticação, sessões e permissões.
- Fase 3: gestão de alunos.
- Fase 4: fluxo de nova inscrição.
- Fase 5: pagamentos.
- Fase 6: lista de pendentes no INATRO.
- Fase 7: histórico e polimento.
