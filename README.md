# AI Support Assistant

A full-stack assistant for customer-support teams. Agents pick a company, paste a
customer message, and get a recommended reply, handling steps and escalation advice
grounded in that company's uploaded support guidelines. Conversations are multi-turn,
stored, and browsable; agents can flag answers and supply corrections that improve
future answers.

**Features**

- Companies with uploadable guidelines (TXT, MD, PDF, DOCX), processed asynchronously with
  live progress, version history, rollback and conflict detection between agents.
- Multi-turn chat per company: paste a customer message (or give the assistant an instruction)
  and get a structured recommendation: coverage verdict, handling steps, questions to clarify
  with the customer, decisions left to the agent, escalation advice, a ready-to-send reply and
  the guideline sections it relied on. Long threads keep their context through a rolling
  summary of older turns.
- Honest "not covered" handling: when nothing relevant is in the guidelines the assistant says
  so, gives a safe holding reply and recommends escalation instead of improvising.
- Per-agent history (each agent sees only their own conversations) with filters (company,
  coverage) and a per-answer
  "why this answer" panel (retrieved sections with similarity scores, corrections used, model,
  tokens, latency, guideline version).
- Feedback loop: thumbs up/down with corrections that are retrieved as golden examples for
  similar future messages and retired automatically when guidelines change.
- Token-based auth on every API call and page: short-lived access JWT plus rotated refresh
  tokens with reuse detection and server-side logout. Swagger UI, English/German UI.
- Observability and evidence: structured logs with per-call token accounting, an optional
  self-hosted Langfuse profile (traces per turn and per ingestion, agent feedback as scores),
  and offline evaluation harnesses whose results back the tuning decisions
  ([`docs/evaluation-report.md`](docs/evaluation-report.md)). Design rationale in
  [`docs/hld.md`](docs/hld.md); request-level flows, sequence diagrams and the data model in
  [`docs/lld.md`](docs/lld.md).

## Start the project

Prerequisites: Docker Desktop (or Docker Engine with Compose v2) and a Google AI Studio key
for Gemini. Node, pnpm and Java are **not** needed to run the app.

```sh
git clone https://github.com/abhijeet4som1/ai-support-assistant.git
cd ai-support-assistant
cp .env.example .env
```

Edit `.env` and set two values:

| Variable         | Value                                                |
| ---------------- | ---------------------------------------------------- |
| `GEMINI_API_KEY` | your key from https://aistudio.google.com/apikey     |
| `JWT_SECRET`     | any long random string (e.g. `openssl rand -hex 32`) |

Then:

```sh
docker compose up --build -d      # first build takes a few minutes
docker compose logs -f api worker # optional: watch migrations, seeding and guideline processing
```

Open **http://assistant.localhost** (or `http://localhost`). Browsers resolve `*.localhost`
to your machine; for `curl` add `127.0.0.1 assistant.localhost` to `/etc/hosts`. If port 80
is busy, set `NGINX_PORT=8080` in `.env` and use `http://assistant.localhost:8080`.

What happens on first start: migrations run, two agent accounts and two demo companies
(**Bookshop**, **VPN SaaS**) are created, and their sample guideline files are queued for
processing by the worker. Processing takes a few seconds with a valid key.

| Login    | Password     |
| -------- | ------------ |
| `agent1` | `agent1pass` |
| `agent2` | `agent2pass` |

Other entry points:

- Swagger UI: http://assistant.localhost/api/docs (public). Call `POST /api/auth/login` with
  _Try it out_, copy the token, click **Authorize** and paste it to call protected endpoints.
- OpenAPI document: http://assistant.localhost/api/openapi.json
- Stop: `docker compose down` · reset database and re-seed: `docker compose down -v && docker compose up -d`

### Optional: HTTPS

```sh
./scripts/tls/setup.sh                                   # one-time: mkcert local CA + certificate
docker compose -f docker-compose.yml -f docker-compose.tls.yml up -d --build
# https://assistant.localhost  (http:// redirects)
```

Requires [mkcert](https://github.com/FiloSottile/mkcert) (`brew install mkcert nss`). The
certificate lives in `nginx/certs/` and is git-ignored.

## Test each flow end to end

Work through these in order; each step lists what you should see.

### 1. Authentication

1. Open http://assistant.localhost. You are redirected to `/login`.
2. Log in with a wrong password: an inline error, no redirect.
3. Log in as `agent1`: you land on **Chat**; the header shows your name and **Log out**.
4. Open http://assistant.localhost/api/companies in a new tab: `401` with a JSON error. Every
   API route except login and health requires the bearer token.
5. **Log out**: protected pages redirect to login again; the server revokes the session.
   Reload after logging in: the session survives. Access tokens live 15 minutes and are renewed
   silently with a rotated refresh token (7 days); a long shift never sees a surprise logout.
   Reusing an old refresh token (token theft) revokes the whole session.

### 2. Companies and guidelines

1. **Companies** lists Bookshop and VPN SaaS with _Guidelines updated …_ badges and your own
   conversation counts. Open Bookshop: the sections the assistant will use (7 topics), the
   extracted text and the upload history with the active version.
2. **Add company**: create _Acme Support_ (try creating _acme support_ again: a conflict error
   on the name field). The new company shows _No guidelines yet_ and chat is disabled for it.
3. On the Acme page, upload a guideline file (TXT, MD, PDF or DOCX). Watch the status move
   through queued → extracting → splitting → indexing to _Guidelines updated_; the section
   list appears. Upload an unsupported file (e.g. `.zip`): rejected before upload.
4. Upload a second file for Acme: the new version is processed while the first one stays
   active; when it is ready it becomes active and the previous one is listed as _Ready_ with a
   **Make active** button (rollback).
5. Concurrency: log in as `agent2` in a private window, open the same company and upload a
   file. Back as `agent1` (page still open), upload another file: a dialog explains that
   `agent2` uploaded meanwhile and asks whether to replace anyway.

### 3. Chat

1. **Chat** → pick _Bookshop_ → **New conversation**. Paste:
   _"Hi, my order was supposed to arrive last week and tracking hasn't moved. Where is it?"_
   Expect _Covered by guidelines_, a recommended reply with `[Name]`/`[Date]` placeholders,
   handling steps, _Your call_ items (compensation) and a citation of _Shipping Issues_.
2. Switch the composer to **Instruction to assistant**, send _"Make it shorter and more
   formal."_: the reply is revised for the same customer message.
3. Send a follow-up customer message (_"Yes, and can I get a refund instead?"_): context is
   kept and _Returns and Refunds_ is cited.
4. Ask something outside the guidelines (_"Do you sell gift cards?"_): _Not covered_, an
   escalation recommendation and a safe holding reply, no invented policy.
5. Pick _Acme Support_ before it has processed guidelines: chat is disabled with an
   explanation. Companies without processed guidelines are greyed out in the picker.
6. Failure handling: stop the network (or set a wrong key and restart the api) and send a
   message: the turn is shown as failed with a **Retry** button; retrying does not duplicate
   the customer message.

### 4. Feedback and corrections

1. Under any assistant answer click 👍: a toast confirms and the button stays selected.
2. Click 👎 on another answer: the dialog is prefilled with the draft; save with what was
   wrong and the correct answer.
3. Start a new conversation with a similar customer message: **History → Why this answer**
   shows the correction among the retrieved context. On the company page the **Corrections**
   section lists it as _Active_.
4. Upload new guidelines for that company: the correction becomes _Inactive (guidelines
   changed)_; **Reactivate** if it still applies.
5. With the observability profile running (see below), open the answer's `chat-turn` trace in
   Langfuse: the rating appears as an `agent-rating` score and the correction as
   `agent-correction`.

### 5. Chat history

1. **History** lists your own conversations (other agents' threads are never shown), newest
   activity first, with company,
   coverage badge, message count and time. Filter by company, by coverage (try _Not
   covered_); filters are kept in the URL.
2. Open a conversation: the thread (long threads load 50 messages at a time, with **Load earlier
   messages** at the top) plus a **Why this answer** panel per answer with the
   retrieved sections and similarity scores, corrections used, model, token counts, latency
   and guideline version. **Continue in chat** reopens it in the chat page.
3. Language: switch **EN/DE** in the header; the UI is translated, answers stay in the
   customer's language.

## Architecture

```
browser ──► nginx :80 (assistant.localhost)
              ├── /            static web build (React)      [dev: vite dev server + HMR]
              ├── /api/*       api (Fastify + Smithy server SDK)
              └── /api/docs    Swagger UI (OpenAPI generated from the Smithy model)
            api ──► Postgres + pgvector          (companies, guideline versions, chunks, conversations, feedback)
            api ──► Gemini                       (chat completions with structured output)
            worker (same image) ──► pg-boss queue in Postgres ──► parse / chunk / embed guideline uploads
```

Key design decisions (full rationale in [`docs/hld.md`](docs/hld.md)):

- **Spec-first API.** The HTTP contract is a [Smithy](https://smithy.io) model in `spec/model`.
  From it we generate the server SDK (routing, validation, serialization) used by the api and
  the OpenAPI document, from which the web app's TypeScript types are generated
  (openapi-typescript → openapi-fetch + openapi-react-query). Generated code is committed, so no
  JDK is needed to run or develop.
- **Retrieval, not whole-document prompting.** Guidelines are chunked by topic, embedded, and
  the relevant sections are retrieved per turn. Uncovered questions are reported as such with an
  escalation recommendation instead of improvised answers.
- **Asynchronous ingestion with progress.** Uploads return immediately; a worker processes the
  file through a Postgres-backed job queue and the UI polls progress. The previous guideline
  version stays active until the new one is ready.
- **Feedback as golden data.** Thumbs up/down with corrections are stored per company and
  version, retrieved as few-shot examples for similar future questions (together with the
  guideline sections the original question pointed at), and deactivated when the guidelines
  they were written against are replaced.
- **Design system, no inline styles.** Tailwind v4 tokens + cva variants; static class names only.

## Repository layout

```
.
├── spec/                 Smithy API model + codegen (source of truth)  → spec/README.md
├── packages/
│   ├── api-server-sdk/   generated server SDK (committed)
│   ├── openapi/          generated OpenAPI document (committed)
│   ├── eslint-config/    shared ESLint flat configs
│   └── tsconfig/         shared tsconfig bases
├── api/                  Fastify service + worker (TypeScript)          → api/README.md
├── web/                  React app (Vite, TanStack Router/Query, Tailwind v4, Lingui) → web/README.md
├── nginx/                reverse proxy templates (HTTP, dev, TLS)        → nginx/README.md
├── docs/                 HLD, LLD (flows, sequence diagrams, tables), evaluation report and raw eval results
├── scripts/tls/          mkcert certificate setup for optional HTTPS
├── Dockerfile            multi-target image (api, api-dev, web-dev, nginx, nginx-dev)
├── docker-compose.yml    production-like stack (+ Langfuse under the observability profile)
├── docker-compose.dev.yml  hot-reload overrides
└── docker-compose.tls.yml  HTTPS override
```

## Development

Everything runs in Docker with hot reload:

```sh
pnpm dev        # docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

- api and worker restart on changes under `api/src` (tsx watch); web reloads via Vite HMR through nginx.
- Postgres is exposed on `localhost:5432` in dev mode (`POSTGRES_PORT` to change).
- A dependency change (`package.json`) needs `pnpm dev` again (rebuild).

Running tools on the host (optional, Node 22+ and pnpm via `corepack enable`):

```sh
pnpm install
pnpm build:generated   # compile the generated Smithy packages once
pnpm lint | pnpm typecheck | pnpm test | pnpm format
```

### Changing the API

1. Edit `spec/model/*.smithy`.
2. `pnpm codegen` (runs the Smithy CLI in Docker and syncs `packages/*`), then `pnpm build:generated`.
3. Implement the new operation in `api/src/handlers`; call it from `web` with `$api`/`apiClient` (typed from the regenerated OpenAPI schema).

See `spec/README.md` for conventions.

## Configuration

All settings are environment variables read from `.env` by Docker Compose; `.env.example`
documents every variable with its default. The api validates configuration at start-up and
lists every problem at once. The retrieval and prompt tunables (`RAG_TOP_K`, `RAG_MIN_SCORE`,
`RAG_CORRECTIONS_*`, `CHAT_HISTORY_WINDOW`, `CHAT_PROMPT_TOKEN_BUDGET`) are explained in
`api/README.md`; the values behind their defaults are in `docs/evaluation-report.md`.

## Observability

Every chat turn is traceable in two places:

- **In the app**: the _Why this answer_ panel in History shows the retrieved sections with
  similarity scores, corrections used, model, tokens, latency and guideline version.
- **In Langfuse** (self-hosted, optional): full traces with the exact prompt sent to Gemini and
  its raw output.

```sh
# 1. in .env uncomment LANGFUSE_PUBLIC_KEY / LANGFUSE_SECRET_KEY (the values are pre-provisioned)
# 2. start the stack with the observability profile
docker compose --profile observability up -d
# 3. open http://localhost:3001  (login: admin@example.com / langfuse-admin-1, see .env.example)
```

Each conversation is a Langfuse **session**, each agent a **user**, and each turn a trace named
`chat-turn` containing a `retrieval` observation (query → sections + scores, corrections), a
`gemini.generateContent` generation (system prompt, history, retrieved context, output, input and
output tokens, latency, `contextUsedPct`, dropped history turns) and, when older turns were folded
into the rolling summary, a `history-summary` generation. The api also logs one structured
`llm call` line per request with the same numbers.

Two more things land in Langfuse:

- **Guideline ingestion** is traced by the worker as `guideline-ingestion` (parse and chunk steps,
  one `gemini.embedContent` embedding observation per batch, final status).
- **Agent feedback** is attached to the trace of the rated answer as scores: `agent-rating`
  (boolean, with _what was wrong_ as the comment) and `agent-correction` (text). In Langfuse this
  makes "show me every answer agents rejected, with the prompt that produced it" a one-click filter.

Offline evaluations (retrieval quality, correction few-shot effect, both with an LLM-as-judge where
a rubric is needed) live in `api/eval/`; the results and the decisions taken from them are in
[`docs/evaluation-report.md`](docs/evaluation-report.md).

Langfuse v4 runs ClickHouse, Redis, MinIO and its own Postgres, roughly 2 GB of RAM; that is why
it sits behind a profile and is off by default.

**Context window.** Prompts are assembled from the last `CHAT_HISTORY_WINDOW` messages (older
assistant turns compacted to verdict + reply). Messages that fall out of that window are folded
into a **rolling summary** (one short paragraph, extended incrementally, stored on the
conversation) that is sent ahead of the window, so a 50-turn chat still knows the order number
from turn one without replaying it. As a last resort the prompt is trimmed oldest-first until the
estimate fits `CHAT_PROMPT_TOKEN_BUDGET` (120k tokens by default, against a 1M-token model
window). The share of the window used by each call is reported as `contextUsedPct`.

## Prompt-injection defences

- Customer text is passed to the model inside `<customer_message>` delimiters (spoofed closing
  tags are stripped) and the system prompt declares it untrusted data: instructions inside it are
  never followed, and out-of-scope requests (code, essays, "ignore your rules") must be answered
  with a polite refusal and `coverage = not_covered`.
- Structured output: the model can only answer through the JSON schema.
- Server-side gates: no retrieved section ⇒ `not_covered` regardless of the model; a reply that
  contains source code is downgraded to `not_covered` with an escalation note.

## Testing

```sh
pnpm test            # api: 103 tests on an in-process Postgres (PGlite + pgvector) with fake
                     #      Gemini clients; web: 53 component/unit tests (Vitest + Testing Library)
pnpm lint            # ESLint (type-aware) for api and web
pnpm typecheck
```

No test needs Docker, a database or a Gemini key.

## Known limitations

- The Gemini free tier rate-limits embeddings; a very large PDF can take a few minutes to
  process. The worker retries with backoff and the UI shows progress.
- Chat responses are not streamed (Smithy's server SDK does not model streaming); typical
  latency is a few seconds and the UI shows a pending state.
- Language switching covers the UI; assistant answers follow the customer's language.
- Section detection recognises numbered, Markdown and all-caps headings. Documents without such
  headings (or with bold-only headings in PDF/DOCX) are split into overlapping windows instead
  of topics; the extracted text and resulting sections are shown after upload so this is visible.

## Troubleshooting

- **`GEMINI_API_KEY` / `JWT_SECRET` errors at `docker compose up`** – the compose file refuses
  to start without them; edit `.env`.
- **`assistant.localhost` does not resolve** – use `http://localhost`, or add a hosts entry.
- **Port 80 in use** – set `NGINX_PORT` in `.env`.
- **Guidelines stay in "Processing failed"** – the error on the company page is the provider's
  message (e.g. _API key not valid_). Fix `.env`, restart (`docker compose up -d`) and click
  _Retry_ on the version.
- **Reset everything** – `docker compose down -v && docker compose up --build -d`.
