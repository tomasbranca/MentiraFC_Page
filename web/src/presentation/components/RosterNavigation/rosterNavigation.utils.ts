import type { Player, StaffMember } from "../../../types/models";
import { getPlayerLink } from "../PlayerCard/playerCard.utils";
import { getStaffLink } from "../StaffCard/staffCard.utils";

type RosterNavigationItemBase = {
  id: string;
  href: string;
  eyebrow: string;
  label: string;
  isActive: boolean;
};

export type PlayerRosterNavigationItem = RosterNavigationItemBase & {
  kind: "player";
  member: Player;
};

export type StaffRosterNavigationItem = RosterNavigationItemBase & {
  kind: "staff";
  member: StaffMember;
};

export type RosterNavigationItem =
  | PlayerRosterNavigationItem
  | StaffRosterNavigationItem;

const PLAYER_POSITION_ORDER = ["arq", "def", "med", "del"] as const;
const PLAYER_POSITION_LABELS: Record<string, string> = {
  arq: "ARQ",
  def: "DEF",
  med: "MED",
  del: "DEL",
};

const getFullName = (member: Pick<Player, "fullName" | "name" | "lastName">) =>
  member.fullName.trim() || `${member.name} ${member.lastName}`.trim();

const getPlayerPositionRank = (position: Player["position"]): number => {
  const index = PLAYER_POSITION_ORDER.findIndex((item) => item === position);

  return index === -1 ? PLAYER_POSITION_ORDER.length : index;
};

const compareByName = (
  first: Pick<Player, "name" | "lastName">,
  second: Pick<Player, "name" | "lastName">
) =>
  first.lastName.localeCompare(second.lastName) ||
  first.name.localeCompare(second.name);

const comparePlayers = (first: Player, second: Player) =>
  getPlayerPositionRank(first.position) -
    getPlayerPositionRank(second.position) ||
  (first.number ?? Number.MAX_SAFE_INTEGER) -
    (second.number ?? Number.MAX_SAFE_INTEGER) ||
  compareByName(first, second);

const compareStaffMembers = (first: StaffMember, second: StaffMember) =>
  compareByName(first, second);

export const getStaffRoleAbbreviation = (role: string): string => {
  const abbreviation = role
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .filter(Boolean)
    .join("")
    .toUpperCase();

  return abbreviation || "STAFF";
};

export const buildPlayerRosterNavigationItems = (
  players: Player[],
  activePlayer: Player | null
): PlayerRosterNavigationItem[] =>
  [...players].sort(comparePlayers).map((player) => ({
    id: `player:${player.id}`,
    kind: "player",
    href: getPlayerLink(player),
    eyebrow: PLAYER_POSITION_LABELS[player.position ?? ""] ?? "INT",
    label: getFullName(player),
    isActive: activePlayer?.id === player.id,
    member: player,
  }));

export const buildStaffRosterNavigationItems = (
  staffMembers: StaffMember[],
  activeStaffMember: StaffMember | null
): StaffRosterNavigationItem[] =>
  [...staffMembers].sort(compareStaffMembers).map((staffMember) => ({
    id: `staff:${staffMember.id}`,
    kind: "staff",
    href: getStaffLink(staffMember),
    eyebrow: getStaffRoleAbbreviation(staffMember.role),
    label: getFullName(staffMember),
    isActive: activeStaffMember?.id === staffMember.id,
    member: staffMember,
  }));

export const buildRosterNavigationItems = ({
  activePlayer,
  activeStaffMember,
  players,
  staffMembers,
}: {
  activePlayer?: Player | null;
  activeStaffMember?: StaffMember | null;
  players: Player[];
  staffMembers: StaffMember[];
}): RosterNavigationItem[] => [
  ...buildPlayerRosterNavigationItems(players, activePlayer ?? null),
  ...buildStaffRosterNavigationItems(staffMembers, activeStaffMember ?? null),
];
