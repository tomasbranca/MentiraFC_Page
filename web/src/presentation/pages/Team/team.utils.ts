import type { Player, StaffMember } from "../../../types/models";
import type { PositionId, TeamFilter, TeamSectionId } from "./team.constants";

export type GroupedTeamMembers = Record<PositionId, Player[]> & {
  staff: StaffMember[];
};

const isPositionId = (position: Player["position"]): position is PositionId =>
  position === "arq" || position === "def" || position === "med" || position === "del";

export const groupTeamMembers = (
  players: Player[] = [],
  staff: StaffMember[] = []
): GroupedTeamMembers => {
  const sections: GroupedTeamMembers = {
    arq: [],
    def: [],
    med: [],
    del: [],
    staff: [...staff],
  };

  players.forEach((player) => {
    if (isPositionId(player.position)) {
      sections[player.position].push(player);
    }
  });

  (["arq", "def", "med", "del"] as PositionId[]).forEach((pos) => {
    sections[pos].sort((a, b) => (a.number ?? 0) - (b.number ?? 0));
  });

  sections.staff.sort((a, b) =>
    a.lastName.localeCompare(b.lastName) || a.name.localeCompare(b.name)
  );

  return sections;
};

export const getFilteredSections = (
  grouped: GroupedTeamMembers,
  filter: TeamFilter
): Partial<GroupedTeamMembers> => {
  if (filter === "all") return grouped;

  return {
    [filter]: grouped[filter as TeamSectionId],
  };
};
