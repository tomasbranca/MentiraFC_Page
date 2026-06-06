import { beforeEach, describe, expect, it, vi } from "vitest";

const supabaseMocks = vi.hoisted(() => ({
  createPublicSupabaseClient: vi.fn(),
  createUserSupabaseClient: vi.fn(),
  getUser: vi.fn(),
}));

vi.mock("./supabase.js", () => ({
  createPublicSupabaseClient: supabaseMocks.createPublicSupabaseClient,
  createUserSupabaseClient: supabaseMocks.createUserSupabaseClient,
}));

const { createCommentReport, createNewsComment, updateOwnNewsComment } =
  await import("./comments.js");
const { __resetRateLimitsForTests } = await import("./rateLimit.js");

type QueryResult = {
  data: unknown;
  error: unknown;
};

type QueryBuilder = QueryResult & {
  eq: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  is: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
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
  query.is = vi.fn(() => query);
  query.insert = vi.fn(() => query);
  query.update = vi.fn(() => query);
  query.maybeSingle = vi.fn(async () => result);
  query.single = vi.fn(async () => result);

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

describe("comment auth checks", () => {
  beforeEach(() => {
    vi.stubEnv("SUPABASE_RATE_LIMIT_STORE", "");
    vi.clearAllMocks();
    __resetRateLimitsForTests();
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

  it("bloquea comentarios de usuarios inactivos", async () => {
    queueTable(
      "my_account",
      createQuery({ data: { role: "user", is_active: false }, error: null })
    );

    await expect(
      createNewsComment({
        newsId: "news-1",
        body: "Hola",
        token: "access-token",
      })
    ).rejects.toThrow("Banned user.");

    expect(userClient.from).not.toHaveBeenCalledWith("news_comments");
  });

  it("bloquea editar comentarios ajenos", async () => {
    queueTable(
      "my_account",
      createQuery({ data: { role: "user", is_active: true }, error: null })
    );
    const updateQuery = queueTable(
      "news_comments",
      createQuery({
        data: {
          id: "22222222-2222-2222-2222-222222222222",
          user_id: "33333333-3333-3333-3333-333333333333",
        },
        error: null,
      })
    );

    await expect(
      updateOwnNewsComment({
        commentId: "22222222-2222-2222-2222-222222222222",
        body: "Editado",
        token: "access-token",
      })
    ).rejects.toThrow("Comment not found.");

    expect(updateQuery.update).not.toHaveBeenCalled();
  });

  it("traduce reportes duplicados desde la constraint unica", async () => {
    queueTable(
      "my_account",
      createQuery({ data: { role: "user", is_active: true }, error: null })
    );
    queueTable(
      "news_comments",
      createQuery({
        data: {
          id: "22222222-2222-2222-2222-222222222222",
          user_id: "33333333-3333-3333-3333-333333333333",
        },
        error: null,
      })
    );
    queueTable(
      "comment_reports",
      createQuery({
        data: null,
        error: {
          code: "23505",
          message: "duplicate key value violates unique constraint",
        },
      })
    );

    await expect(
      createCommentReport({
        commentId: "22222222-2222-2222-2222-222222222222",
        reason: "spam",
        details: null,
        token: "access-token",
      })
    ).rejects.toThrow("Duplicate report.");
  });
});
