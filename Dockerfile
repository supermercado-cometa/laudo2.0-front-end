# ─── Stage 1: Dependencies ───────────────────────────────────────────────────
FROM node:22-slim AS deps

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# ─── Stage 2: Builder ────────────────────────────────────────────────────────
FROM node:22-slim AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Argumentos de build injetados pelo Coolify/Docker para variáveis NEXT_PUBLIC_*
ARG NEXT_PUBLIC_API_BASE_URL=https://apilaudos.cometasupermercados.com.br
ARG NEXT_PUBLIC_GLPI_BASEPESQUISA_URL=http://suporte.cometasupermercados.com.br/front/ticket.form.php?id=
ARG NEXT_PUBLIC_APP_VERSION=2026.05.05

ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NEXT_PUBLIC_GLPI_BASEPESQUISA_URL=${NEXT_PUBLIC_GLPI_BASEPESQUISA_URL}
ENV NEXT_PUBLIC_APP_VERSION=${NEXT_PUBLIC_APP_VERSION}
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# ─── Stage 3: Production Runner (Standalone) ─────────────────────────────────
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV TZ=America/Sao_Paulo

# Instalar curl para healthchecks do Coolify/Docker
RUN apt-get update -y && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copiar arquivos estáticos e build standalone do Next.js
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]

