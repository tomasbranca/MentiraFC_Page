import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ReactionTarget } from "./reactions";

type QueryResult = {
  data: unknown;
  error: unknown;
};

type QueryBuilder = QueryResult & {
  delete: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
};

const supabaseMocks = vi.hoisted(() => ({
  createPublicSupabaseClient: vi.fn(),
  createUserSupabaseClient: vi.fn(),
  getUser: vi.fn(),
}));

vi.mock("./supabase.js", () => ({
  createPublicSupabaseClient: supabaseMocks.createPublicSupabaseClient,
  createUserSupabaseClient: supabaseMocks.createUserSupabaseClient,
}));

const { removeReaction, setReaction } = await import("./reactions.js");

const target: ReactionTarget = {
  targetType: "news",
  targetId: "news-1",
};

let tableQueues: Map<string, QueryBuilder[]>;
let userClient: {
  auth: { getUser: typeof supabaseMocks.getUser };
  from: ReturnType<typeof vi.fn>;
};

const createQuery = (
  result: QueryResult = { data: null, error: null }
): QueryBuilder => {
  const query = {
    ...result,
  } as QueryBuilder;

  query.select = vi.fn(() => query);
  query.eq = vi.fn(() => query);
  query.order = vi.fn(() => query);
  query.maybeSingle = vi.fn(async () => result);
  query.insert = vi.fn(() => query);
  query.update = vi.fn(() => query);
  query.delete = vi.fn(() => query);

  return query;
};

const queueTable = (table: string, query: QueryBuilder): QueryBuilder => {
  tableQueues.set(table, [...(tableQueues.get(table) ?? []), query]);

  return query;
};

const createSupabaseMock = () => ({
  auth: {
    getUser: supabaseMocks.getUser,
  },
  from: vi.fn((table: string) => {
    const queue = tableQueues.get(table);
    const next = queue?.shift();

    if (!next) {
      throw new Error(`Unexpected Supabase table: ${table}`);
    }

    return next;
  }),
});

describe("reaction auth checks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tableQueues = new Map();
    userClient = createSupabaseMock();
    supabaseMocks.createUserSupabaseClient.mockReturnValue(userClient);
    supabaseMocks.createPublicSupabaseClient.mockReturnValue(createSupabaseMock());
    supabaseMocks.getUser.mockResolvedValue({
      data: {
        user: {
          id: "11111111-1111-1111-1111-111111111111",
        },
      },
      error: null,
    });
  });

  it("bloquea crear reacciones con una cuenta inactiva", async () => {
    queueTable("my_account", createQuery({ data: { is_active: false }, error: null }));

    await expect(setReaction(target, "\u2764\ufe0f", "access-token")).rejects.toThrow(
      "Inactive user."
    );

    expect(userClient.from).not.toHaveBeenCalledWith("user_reactions");
  });

  it("bloquea borrar reacciones con una cuenta inactiva", async () => {
    queueTable("my_account", createQuery({ data: { is_active: false }, error: null }));

    await expect(removeReaction(target, "access-token")).rejects.toThrow(
      "Inactive user."
    );

    expect(userClient.from).not.toHaveBeenCalledWith("user_reactions");
  });

  it("crea la reaccion usando el usuario del token", async () => {
    const emoji = "\u2764\ufe0f";
    queueTable("my_account", createQuery({ data: { is_active: true }, error: null }));
    queueTable("user_reactions", createQuery({ data: null, error: null }));
    const insertQuery = queueTable(
      "user_reactions",
      createQuery({ data: null, error: null })
    );

    queueTable("my_account", createQuery({ data: { is_active: true }, error: null }));
    queueTable(
      "reaction_counts",
      createQuery({ data: [{ emoji, reaction_count: 1 }], error: null })
    );
    queueTable("user_reactions", createQuery({ data: { emoji }, error: null }));

    const state = await setReaction(target, emoji, "access-token");

    expect(insertQuery.insert).toHaveBeenCalledWith({
      user_id: "11111111-1111-1111-1111-111111111111",
      target_type: "news",
      target_id: "news-1",
      emoji,
    });
    expect(state.currentUserReaction).toBe(emoji);
  });
});
