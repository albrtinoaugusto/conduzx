# PROMPT: Build the MVP (ConduzX - Gestão Inteligente para Escolas de Condução)

> Como usar: cole tudo abaixo como primeira mensagem na IA/ferramenta (Claude Code, Cursor, Codex, Kimi, etc.) com o ficheiro `schema.sql` anexado ou presente na raiz do projeto. Depois de cada fase, escreva apenas: "Continua com a próxima fase".

---

## ROLE
You are a senior full-stack engineer building an MVP. Prioritize working, simple, maintainable code over cleverness. Do not over-engineer.

## PRODUCT CONTEXT
Driving schools in Mozambique register their students in the INATRO national system, but have no internal system of their own. When INATRO is down, enrollments are lost on paper and there is no reliable internal record of who enrolled, which category, how much they paid, and which enrollments still need to be registered in INATRO.

We are building the school's INTERNAL system. It must:
1. Register students (personal data).
2. Register enrollments: a student + a licence category.
3. Register payments, including partial payments (e.g. a student paid 30% of the total).
4. Track the INATRO status of each enrollment manually (`nao_registado`, `pendente`, `registado`), so the attendant can see what is still pending when INATRO fails.
5. Keep a full history (audit log) of who changed what.

**Explicitly OUT OF SCOPE for this MVP (do NOT build):** any integration with INATRO, the AI/chatbot layer, WhatsApp, online payments, native mobile apps, full offline mode, reports/dashboards beyond simple lists, multi-language support.

## USERS
- `atendente`: daily user, basic technical level. Needs fast, simple screens (2 to 3 clicks per task).
- `gestor`: consults data, sees payments and pending lists.
- `admin`: manages users and categories.

UI language: **Portuguese (Mozambique)**. Code, identifiers, comments and commit messages: English (domain terms like `escola`, `aluno`, `inscricao` may stay in Portuguese in the DB schema and be mapped consistently).

## TECH STACK (use exactly this; do not substitute without asking)
- Next.js (App Router) + TypeScript (strict) + Tailwind CSS
- PostgreSQL + Drizzle ORM (+ drizzle-kit migrations)
- Zod for ALL input validation (server-side, always)
- Authentication: email + password, secure password hashing (argon2 or bcrypt), HTTP-only cookie sessions. Keep it simple; no OAuth.
- Server Actions or Route Handlers for mutations; keep business logic in a separate `src/server/services/` layer (not inside UI components)
- Docker Compose for local PostgreSQL
- Vitest for unit tests of business logic

## DATA MODEL
The attached `schema.sql` is the source of truth. Translate it faithfully to Drizzle schema + migrations. Do not rename tables or columns, and do not drop constraints. If you believe something must change, explain why BEFORE changing it.

Key design rules (must be preserved):
- Multi-school from day one: every business table has `escola_id`, and EVERY query must be scoped by the logged-in user's `escola_id`. No query may return data from another school.
- Soft delete only (`eliminado_em`); never hard-delete business records.
- Money is stored as integer centavos (`bigint`). Never use floats for money. Format for display only (MZN).
- Three independent axes per enrollment:
  1. `estado_aluno`: `ativo | desistiu | concluido`
  2. `estado_inatro`: `nao_registado | pendente | registado`
  3. payment status: NOT stored; always derived from payments via the `inscricoes_financeiro` view logic (`sem_pagamento | parcial | pago`, balance, percentage paid).
- `preco_total_centavos` is copied from the category price at enrollment time (price changes must not alter old enrollments).
- Payments are never edited or deleted. They are annulled with a mandatory reason (`anulado_em`, `anulado_por`, `motivo_anulacao`). Annulled payments are excluded from totals.
- Every create/update/annul writes a row in `historico` (who, what entity, action, data, and `origem = 'app'`).

## BUSINESS RULES
- A payment cannot be registered with value <= 0, and total paid must not exceed `preco_total_centavos` (reject overpayment with a clear message).
- Creating a new enrollment is ONE database transaction: student (new or existing) + enrollment + optional first payment + audit log. If any step fails, nothing is saved.
- An enrollment may be created while INATRO is down: the attendant can set `estado_inatro = 'pendente'` with an optional note (`inatro_nota`) at creation time.
- Changing to `registado` requires the INATER process number (`inater_numero_processo`).
- Search students by name (case-insensitive, partial match), by BI number, and by phone.
- BI number is unique per school among non-deleted students (when provided). On conflict, show a friendly message that links to the existing student.
- Role permissions: `atendente` can create/edit students, enrollments and payments but cannot annul payments or manage users/categories. `gestor` can annul payments. `admin` can do everything.

## IMPLEMENTATION PLAN (work phase by phase)
Complete ONE phase at a time. At the end of each phase: (a) summarize what was built, (b) list files created or changed, (c) give exact commands to run and test it, (d) STOP and wait for me to say "continue".

- **Phase 0, Scaffold:** project setup, Docker Compose for Postgres, env handling (`.env.example`), ESLint/Prettier, folder structure, README with run instructions.
- **Phase 1, Data layer:** Drizzle schema + migrations from `schema.sql`, seed script (1 school, 3 users with different roles, 3 categories with example prices, ~10 sample students/enrollments/payments covering: no payment, 30% paid, fully paid, pending INATRO, registered INATRO).
- **Phase 2, Auth and roles:** login/logout, session handling, route protection, school scoping helper that every service must use, role checks.
- **Phase 3, Students:** list with search and pagination, create, edit, student detail page showing enrollments and documents placeholder.
- **Phase 4, New enrollment flow:** single screen: choose/create student, choose category (price auto-filled), optional first payment, choose INATRO status (`registado` / `pendente` / `nao_registado`). Transactional.
- **Phase 5, Payments:** add payment to an enrollment, show paid amount / balance / percentage, annul payment with reason (gestor/admin only).
- **Phase 6, Pending list:** page listing enrollments where `estado_inatro <> 'registado'`, oldest first, with buttons "Marcar como registado" (asks for process number) and "Manter pendente" (updates `inatro_ultima_tentativa` and note).
- **Phase 7, Audit and polish:** history view per student/enrollment, empty states, error messages in Portuguese, loading states, responsive layout for modest PCs and slow connections.

## QUALITY REQUIREMENTS
- TypeScript strict, no `any`. Validate every input with Zod on the server.
- Unit tests (Vitest) for: payment totals and derived payment status, overpayment rejection, INATRO status transition rules, school scoping in services.
- Handle errors explicitly; user-facing messages in clear Portuguese; never expose stack traces or raw DB errors.
- Do not log sensitive personal data (BI, phone, address) in plain text.
- Keep UI simple and fast: forms with clear labels, big buttons, keyboard-friendly. No heavy UI libraries unless truly needed (Tailwind + small headless components are fine).
- Small, focused files. No premature abstractions.

## HOW TO WORK
- Before writing code in Phase 0, reply with a brief plan (max 10 lines) and any BLOCKING questions only. If a question is not blocking, make a reasonable assumption, state it, and continue.
- Never invent requirements. If something is ambiguous and matters, ask once, concisely.
- If a library or API you plan to use may have changed, check the installed version's docs instead of relying on memory.
- Prefer boring, well-known solutions. Explain any non-obvious decision in one sentence in the code or README.
- Do not modify `schema.sql` semantics without approval. Do not add features outside the current phase.

## DEFINITION OF DONE (per phase)
The code compiles with no TypeScript errors, lint passes, tests for that phase pass, and the described flow works end to end with the seed data.

## START NOW
Begin with Phase 0. First reply with your short plan and any blocking questions, then implement Phase 0.
