---
name: migrate-drizzle
description: >
  Use when migrating this project from Prisma 7 to Drizzle ORM. Covers dependency
  swap, schema rewrite, db singleton, better-auth adapter, tRPC query rewrites,
  drizzle-kit setup, and cleanup of the generated Prisma client.
---

# Migrate Prisma → Drizzle

End-to-end migration for aether-flow. Four non-generated files touch Prisma —
migrate them in order to keep the app working at each step.

---

## Step 1 — Install & Uninstall

```bash
bun add drizzle-orm
bun add -d drizzle-kit
bun remove @prisma/client @prisma/adapter-pg prisma
```

Also remove `@types/pg` if only Prisma needed it — `pg` itself stays (Drizzle uses it directly).

---

## Step 2 — drizzle.config.ts

Create at repo root:

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

---

## Step 3 — Schema (`src/db/schema.ts`)

Replaces `prisma/schema.prisma`. Better-auth owns the first four tables; define them
to match better-auth's expected column names exactly.

```ts
import { relations } from "drizzle-orm";
import {
  boolean,
  json,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  index,
} from "drizzle-orm/pg-core";

// ── better-auth tables ────────────────────────────────────────────────────────

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().$onUpdate(() => new Date()),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().$onUpdate(() => new Date()),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
}, (t) => [index("session_user_id_idx").on(t.userId)]);

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().$onUpdate(() => new Date()),
}, (t) => [index("account_user_id_idx").on(t.userId)]);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().$onUpdate(() => new Date()),
}, (t) => [index("verification_identifier_idx").on(t.identifier)]);

// ── app tables ────────────────────────────────────────────────────────────────

export const workflow = pgTable("workflow", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().$onUpdate(() => new Date()),
});

export const nodeTypeEnum = pgEnum("node_type", ["INITIAL"]);

export const node = pgTable("node", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  workflowId: text("workflow_id")
    .notNull()
    .references(() => workflow.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: nodeTypeEnum("type").notNull(),
  position: json("position").notNull().$type<{ x: number; y: number }>(),
  data: json("data").notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().$onUpdate(() => new Date()),
});

export const connection = pgTable("connection", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  workflowId: text("workflow_id")
    .notNull()
    .references(() => workflow.id, { onDelete: "cascade" }),
  fromNodeId: text("from_node_id")
    .notNull()
    .references(() => node.id, { onDelete: "cascade" }),
  toNodeId: text("to_node_id")
    .notNull()
    .references(() => node.id, { onDelete: "cascade" }),
  fromOutput: text("from_output").notNull().default("main"),
  toInput: text("to_input").notNull().default("main"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().$onUpdate(() => new Date()),
}, (t) => [
  unique().on(t.fromNodeId, t.toNodeId, t.fromOutput, t.toInput),
]);

// ── relations ─────────────────────────────────────────────────────────────────

export const workflowRelations = relations(workflow, ({ one, many }) => ({
  user: one(user, { fields: [workflow.userId], references: [user.id] }),
  nodes: many(node),
  connections: many(connection),
}));

export const nodeRelations = relations(node, ({ one, many }) => ({
  workflow: one(workflow, { fields: [node.workflowId], references: [workflow.id] }),
  outputConnections: many(connection, { relationName: "fromNode" }),
  inputConnections: many(connection, { relationName: "toNode" }),
}));

export const connectionRelations = relations(connection, ({ one }) => ({
  workflow: one(workflow, { fields: [connection.workflowId], references: [workflow.id] }),
  fromNode: one(node, { fields: [connection.fromNodeId], references: [node.id], relationName: "fromNode" }),
  toNode: one(node, { fields: [connection.toNodeId], references: [node.id], relationName: "toNode" }),
}));
```

---

## Step 4 — DB Singleton (`src/lib/db.ts`)

```ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "@/db/schema";

const globalForDb = global as unknown as { pool: Pool };

const pool = globalForDb.pool ?? new Pool({ connectionString: process.env.DATABASE_URL });

if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;

export const db = drizzle(pool, { schema });
```

---

## Step 5 — Auth Adapter (`src/lib/auth.ts`)

Swap `prismaAdapter` → `drizzleAdapter`. Pass the schema tables better-auth needs.

```ts
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "@/lib/db";
import { account, session, user, verification } from "@/db/schema";

// inside betterAuth({...})
database: drizzleAdapter(db, {
  provider: "pg",
  schema: { user, session, account, verification },
}),
```

---

## Step 6 — Router Queries (`src/features/workflows/server/routers.ts`)

Replace the Prisma import and all six queries. Import `NodeType` from the schema instead of the generated Prisma browser client.

```ts
import { and, count, eq, ilike } from "drizzle-orm";

import { db } from "@/lib/db";
import { node, nodeTypeEnum, workflow } from "@/db/schema";

// NodeType enum value — use the string literal "INITIAL" or re-export from schema:
// export const NodeType = { INITIAL: "INITIAL" } as const;
```

### create
```ts
return db.insert(workflow).values({
  name: generateSlug(3),
  userId: ctx.auth.user.id,
}).returning().then(async ([wf]) => {
  await db.insert(node).values({
    workflowId: wf.id,
    type: "INITIAL",
    name: "INITIAL",
    position: { x: 0, y: 0 },
  });
  return wf;
});
```

### remove
```ts
return db.delete(workflow).where(
  and(eq(workflow.id, input.id), eq(workflow.userId, ctx.auth.user.id))
);
```

### updateName
```ts
return db.update(workflow)
  .set({ name: input.name })
  .where(and(eq(workflow.id, input.id), eq(workflow.userId, ctx.auth.user.id)));
```

### getOne
```ts
const wf = await db.query.workflow.findFirst({
  where: (t, { and, eq }) =>
    and(eq(t.id, input.id), eq(t.userId, ctx.auth.user.id)),
  with: { nodes: true, connections: true },
});
if (!wf) throw new TRPCError({ code: "NOT_FOUND" });

const nodes: Node[] = wf.nodes.map((n) => ({
  id: n.id,
  type: n.type,
  position: n.position as { x: number; y: number },
  data: (n.data as Record<string, unknown>) || { label: n.name },
}));
const edges: Edge[] = wf.connections.map((c) => ({
  id: c.id,
  source: c.fromNodeId,
  target: c.toNodeId,
  sourceHandle: c.fromOutput,
  targetHandle: c.toInput,
}));
return { id: wf.id, name: wf.name, nodes, edges };
```

### getMany
```ts
const whereClause = and(
  eq(workflow.userId, ctx.auth.user.id),
  input.search ? ilike(workflow.name, `%${input.search}%`) : undefined,
);

const [items, [{ value: totalCount }]] = await Promise.all([
  db.query.workflow.findMany({
    where: () => whereClause,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    orderBy: (t, { desc }) => desc(t.updatedAt),
  }),
  db.select({ value: count() }).from(workflow).where(whereClause),
]);
```

---

## Step 7 — Run Migration

```bash
# Introspect existing DB and generate a baseline migration
bun drizzle-kit generate
bun drizzle-kit migrate
```

If the DB already has all tables (Prisma created them), use `push` in dev to sync without a new migration file:

```bash
bun drizzle-kit push
```

---

## Step 8 — Cleanup

```bash
rm -rf prisma/ src/generated/prisma/
```

Remove `prisma` script references from `package.json` if any remain.
Update `CLAUDE.md` Gotchas section — remove Prisma-specific notes, add:

```
- **DB client** lives in `src/lib/db.ts`, schema in `src/db/schema.ts`
- **Drizzle CLI**: `bun drizzle-kit [generate|migrate|push|studio]`
```

---

## Common Mistakes

| Mistake | Fix |
|---|---|
| `$onUpdate` not firing | Ensure Drizzle version ≥ 0.30 — earlier versions don't support `$onUpdate` |
| better-auth table mismatch | Column names must be camelCase in schema definition; Drizzle maps to snake_case DB columns via the string arg |
| `db.query.*` returns undefined | `findFirst` returns `undefined` not null — always guard with `if (!result) throw` |
| NodeType import breaks | Import `nodeTypeEnum` from `@/db/schema`; use string literal `"INITIAL"` or define a const map |
| Relations not resolving | All `relations()` calls must be in the same file passed to `drizzle({ schema })` |
