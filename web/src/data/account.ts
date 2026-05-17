import { getSupabaseClient } from "../lib/supabase";
import type { CurrentAccount } from "../types/auth";
import { z, zodParseOptions } from "./zodRuntime";

const currentAccountRowSchema = z.object({
  id: z.string().uuid(),
  first_name: z.string().trim().min(1),
  last_name: z.string().trim().min(1),
  role: z.enum(["user", "team_member", "editor", "moderator", "admin"]),
  is_active: z.boolean(),
});

export const adaptCurrentAccountRow = (
  input: unknown
): CurrentAccount | null => {
  const parsed = currentAccountRowSchema.safeParse(input, zodParseOptions);

  if (!parsed.success) {
    return null;
  }

  return {
    id: parsed.data.id,
    firstName: parsed.data.first_name,
    lastName: parsed.data.last_name,
    role: parsed.data.role,
    isActive: parsed.data.is_active,
  };
};

export const fetchCurrentAccount = async (): Promise<CurrentAccount | null> => {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("my_account")
    .select("id, first_name, last_name, role, is_active")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const account = adaptCurrentAccountRow(data);

  if (!account) {
    throw new Error("Invalid current account payload.");
  }

  return account;
};

type UpdateCurrentProfileInput = {
  userId: string;
  firstName: string;
  lastName: string;
};

export const updateCurrentProfile = async ({
  userId,
  firstName,
  lastName,
}: UpdateCurrentProfileInput): Promise<void> => {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: firstName,
      last_name: lastName,
    })
    .eq("id", userId);

  if (error) {
    throw error;
  }
};
