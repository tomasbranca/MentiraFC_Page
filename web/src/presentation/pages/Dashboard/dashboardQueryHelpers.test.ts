import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

import { queryKeys } from "../../../data/queryKeys";
import type {
  DashboardMatchItem,
  DashboardGalleryItem,
  DashboardNewsItem,
  DashboardOrganizationItem,
  DashboardStaffItem,
  DashboardTableItem,
  DashboardTeamItem,
  DashboardTournamentItem,
} from "../../../types/dashboard";
import {
  cacheDashboardMatch,
  dashboardMatchDetailQueryOptions,
  dashboardMatchesListQueryOptions,
  dashboardMatchesPageQueryOptions,
  dashboardMatchOptionsQueryOptions,
  invalidateDashboardMatchPublishDependencies,
  invalidateDashboardMatchesList,
} from "../DashboardMatches/dashboardMatches.queries";
import {
  cacheDashboardGallery,
  dashboardGalleriesListQueryOptions,
  dashboardGalleriesPageQueryOptions,
  dashboardGalleryDetailQueryOptions,
  dashboardGalleryOptionsQueryOptions,
  invalidateDashboardGalleriesList,
  invalidateDashboardGalleryPublishDependencies,
} from "../DashboardGalleries/dashboardGalleries.queries";
import {
  cacheDashboardNews,
  dashboardNewsDetailQueryOptions,
  dashboardNewsListQueryOptions,
  dashboardNewsPageQueryOptions,
  invalidateDashboardNewsList,
  invalidateDashboardNewsPublishDependencies,
} from "../DashboardNews/dashboardNews.queries";
import {
  cacheDashboardOrganization,
  dashboardOrganizationDetailQueryOptions,
  dashboardOrganizationsListQueryOptions,
  invalidateDashboardOrganizationPublishDependencies,
  invalidateDashboardOrganizationsList,
} from "../DashboardOrganizations/dashboardOrganizations.queries";
import {
  cacheDashboardStaff,
  dashboardStaffDetailQueryOptions,
  dashboardStaffListQueryOptions,
  invalidateDashboardStaffList,
  invalidateDashboardStaffPublishDependencies,
} from "../DashboardPlayers/dashboardStaff.queries";
import {
  cacheDashboardTable,
  dashboardTableDetailQueryOptions,
  dashboardTableOptionsQueryOptions,
  dashboardTablesListQueryOptions,
  invalidateDashboardTablePublishDependencies,
  invalidateDashboardTablesList,
} from "../DashboardTable/dashboardTable.queries";
import {
  cacheDashboardTeam,
  dashboardTeamDetailQueryOptions,
  dashboardTeamsListQueryOptions,
  invalidateDashboardTeamPublishDependencies,
  invalidateDashboardTeamsList,
} from "../DashboardTeams/dashboardTeams.queries";
import {
  cacheDashboardTournament,
  dashboardTournamentDetailQueryOptions,
  dashboardTournamentOptionsQueryOptions,
  dashboardTournamentsListQueryOptions,
  invalidateDashboardTournamentPublishDependencies,
  invalidateDashboardTournamentsList,
} from "../DashboardTournaments/dashboardTournaments.queries";

const getInvalidatedFilters = async (
  run: (queryClient: QueryClient) => Promise<void>
) => {
  const queryClient = new QueryClient();
  const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");

  await run(queryClient);

  return invalidateQueries.mock.calls.map(([filters]) => filters);
};

describe("dashboard query helpers", () => {
  it("keeps list, detail and options keys centralized", () => {
    expect(dashboardNewsListQueryOptions().queryKey).toEqual(
      queryKeys.dashboard.news.all
    );
    expect(dashboardNewsDetailQueryOptions("news-1").queryKey).toEqual(
      queryKeys.dashboard.news.byId("news-1")
    );
    expect(
      dashboardNewsPageQueryOptions({
        page: 2,
        limit: 20,
        sortBy: "date",
        direction: "desc",
        search: "final",
        status: "draft",
      }).queryKey
    ).toEqual(
      queryKeys.dashboard.news.page({
        page: 2,
        limit: 20,
        sortBy: "date",
        direction: "desc",
        search: "final",
        status: "draft",
      })
    );

    expect(dashboardMatchesListQueryOptions().queryKey).toEqual(
      queryKeys.dashboard.matches.all
    );
    expect(
      dashboardMatchesPageQueryOptions({
        page: 2,
        limit: 20,
        sortBy: "date",
        direction: "desc",
        search: "final",
        status: "draft",
        state: "finalizado",
        competition: "Torneo",
      }).queryKey
    ).toEqual(
      queryKeys.dashboard.matches.page({
        page: 2,
        limit: 20,
        sortBy: "date",
        direction: "desc",
        search: "final",
        status: "draft",
        state: "finalizado",
        competition: "Torneo",
      })
    );
    expect(dashboardMatchOptionsQueryOptions().queryKey).toEqual(
      queryKeys.dashboard.matches.options
    );
    expect(dashboardMatchDetailQueryOptions("match-1").queryKey).toEqual(
      queryKeys.dashboard.matches.byId("match-1")
    );

    expect(dashboardGalleriesListQueryOptions().queryKey).toEqual(
      queryKeys.dashboard.galleries.all
    );
    expect(
      dashboardGalleriesPageQueryOptions({
        page: 2,
        limit: 20,
        sortBy: "date",
        direction: "desc",
        search: "final",
        status: "draft",
        photos: "with_photos",
      }).queryKey
    ).toEqual(
      queryKeys.dashboard.galleries.page({
        page: 2,
        limit: 20,
        sortBy: "date",
        direction: "desc",
        search: "final",
        status: "draft",
        photos: "with_photos",
      })
    );
    expect(dashboardGalleryOptionsQueryOptions().queryKey).toEqual(
      queryKeys.dashboard.galleries.options
    );
    expect(dashboardGalleryDetailQueryOptions("gallery-1").queryKey).toEqual(
      queryKeys.dashboard.galleries.byId("gallery-1")
    );

    expect(dashboardTablesListQueryOptions().queryKey).toEqual(
      queryKeys.dashboard.table.all
    );
    expect(dashboardTableOptionsQueryOptions().queryKey).toEqual(
      queryKeys.dashboard.table.options
    );
    expect(dashboardTableDetailQueryOptions("table-1").queryKey).toEqual(
      queryKeys.dashboard.table.byId("table-1")
    );

    expect(dashboardTournamentsListQueryOptions().queryKey).toEqual(
      queryKeys.dashboard.tournaments.all
    );
    expect(dashboardTournamentOptionsQueryOptions().queryKey).toEqual(
      queryKeys.dashboard.tournaments.options
    );
    expect(dashboardTournamentDetailQueryOptions("tournament-1").queryKey).toEqual(
      queryKeys.dashboard.tournaments.byId("tournament-1")
    );

    expect(dashboardOrganizationsListQueryOptions().queryKey).toEqual(
      queryKeys.dashboard.organizations.all
    );
    expect(dashboardOrganizationDetailQueryOptions("organization-1").queryKey).toEqual(
      queryKeys.dashboard.organizations.byId("organization-1")
    );

    expect(dashboardTeamsListQueryOptions().queryKey).toEqual(
      queryKeys.dashboard.teams.all
    );
    expect(dashboardTeamDetailQueryOptions("team-1").queryKey).toEqual(
      queryKeys.dashboard.teams.byId("team-1")
    );

    expect(dashboardStaffListQueryOptions().queryKey).toEqual(
      queryKeys.dashboard.staff.all
    );
    expect(dashboardStaffDetailQueryOptions("staff-1").queryKey).toEqual(
      queryKeys.dashboard.staff.byId("staff-1")
    );
  });

  it("invalidates only section lists after draft saves", async () => {
    await expect(getInvalidatedFilters(invalidateDashboardNewsList)).resolves.toEqual([
      { queryKey: queryKeys.dashboard.news.all },
    ]);
    await expect(getInvalidatedFilters(invalidateDashboardMatchesList)).resolves.toEqual([
      { queryKey: queryKeys.dashboard.matches.all },
    ]);
    await expect(
      getInvalidatedFilters(invalidateDashboardGalleriesList)
    ).resolves.toEqual([
      { queryKey: queryKeys.dashboard.galleries.all },
      { queryKey: ["dashboard", "galleries", "page"] },
    ]);
    await expect(getInvalidatedFilters(invalidateDashboardTablesList)).resolves.toEqual([
      { queryKey: queryKeys.dashboard.table.all },
    ]);
    await expect(
      getInvalidatedFilters(invalidateDashboardTournamentsList)
    ).resolves.toEqual([{ queryKey: queryKeys.dashboard.tournaments.all }]);
    await expect(
      getInvalidatedFilters(invalidateDashboardOrganizationsList)
    ).resolves.toEqual([{ queryKey: queryKeys.dashboard.organizations.all }]);
    await expect(getInvalidatedFilters(invalidateDashboardTeamsList)).resolves.toEqual([
      { queryKey: queryKeys.dashboard.teams.all },
    ]);
    await expect(getInvalidatedFilters(invalidateDashboardStaffList)).resolves.toEqual([
      { queryKey: queryKeys.dashboard.staff.all },
    ]);
  });

  it("invalidates public and cross-dashboard dependencies after publish/delete", async () => {
    await expect(
      getInvalidatedFilters(invalidateDashboardNewsPublishDependencies)
    ).resolves.toEqual([
      { queryKey: queryKeys.dashboard.news.all },
      { queryKey: queryKeys.news.all },
      { queryKey: queryKeys.home.critical },
    ]);

    await expect(
      getInvalidatedFilters(invalidateDashboardMatchPublishDependencies)
    ).resolves.toEqual([
      { queryKey: queryKeys.dashboard.matches.all },
      { queryKey: queryKeys.dashboard.galleries.all },
      { queryKey: queryKeys.dashboard.galleries.options },
      { queryKey: queryKeys.games.latest },
      { queryKey: queryKeys.games.finished },
      { queryKey: queryKeys.games.tournamentFinished },
      { queryKey: queryKeys.events.goals() },
      { queryKey: queryKeys.galleries.all },
      { queryKey: queryKeys.home.critical },
      { queryKey: queryKeys.home.deferred },
    ]);

    await expect(
      getInvalidatedFilters(invalidateDashboardGalleryPublishDependencies)
    ).resolves.toEqual([
      { queryKey: queryKeys.dashboard.galleries.all },
      { queryKey: ["dashboard", "galleries", "page"] },
      { queryKey: queryKeys.dashboard.galleries.options },
      { queryKey: queryKeys.galleries.all },
    ]);

    await expect(
      getInvalidatedFilters(invalidateDashboardTablePublishDependencies)
    ).resolves.toEqual([
      { queryKey: queryKeys.dashboard.table.all },
      { queryKey: queryKeys.tournaments.current },
      { queryKey: queryKeys.home.deferred },
    ]);

    await expect(
      getInvalidatedFilters(invalidateDashboardTournamentPublishDependencies)
    ).resolves.toEqual([
      { queryKey: queryKeys.dashboard.tournaments.all },
      { queryKey: queryKeys.dashboard.tournaments.options },
      { queryKey: queryKeys.dashboard.matches.options },
      { queryKey: queryKeys.dashboard.table.options },
      { queryKey: queryKeys.dashboard.galleries.all },
      { queryKey: queryKeys.galleries.all },
      { queryKey: queryKeys.tournaments.current },
      { queryKey: queryKeys.home.deferred },
    ]);

    await expect(
      getInvalidatedFilters(invalidateDashboardOrganizationPublishDependencies)
    ).resolves.toEqual([
      { queryKey: queryKeys.dashboard.organizations.all },
      { queryKey: queryKeys.dashboard.tournaments.all },
      { queryKey: queryKeys.dashboard.tournaments.options },
      { queryKey: queryKeys.dashboard.matches.options },
      { queryKey: queryKeys.dashboard.table.options },
      { queryKey: queryKeys.dashboard.galleries.all },
      { queryKey: queryKeys.galleries.all },
      { queryKey: queryKeys.tournaments.current },
      { queryKey: queryKeys.home.deferred },
    ]);

    await expect(
      getInvalidatedFilters(invalidateDashboardTeamPublishDependencies)
    ).resolves.toEqual([
      { queryKey: queryKeys.dashboard.teams.all },
      { queryKey: queryKeys.dashboard.matches.all },
      { queryKey: queryKeys.dashboard.matches.options },
      { queryKey: queryKeys.dashboard.tournaments.all },
      { queryKey: queryKeys.dashboard.tournaments.options },
      { queryKey: queryKeys.dashboard.table.all },
      { queryKey: queryKeys.dashboard.table.options },
      { queryKey: queryKeys.dashboard.galleries.all },
      { queryKey: queryKeys.dashboard.galleries.options },
      { queryKey: queryKeys.teams.all },
      { queryKey: queryKeys.games.all },
      { queryKey: queryKeys.games.latest },
      { queryKey: queryKeys.games.finished },
      { queryKey: queryKeys.galleries.all },
      { queryKey: queryKeys.tournaments.current },
      { queryKey: queryKeys.home.critical },
      { queryKey: queryKeys.home.deferred },
    ]);

    await expect(
      getInvalidatedFilters(invalidateDashboardStaffPublishDependencies)
    ).resolves.toEqual([
      { queryKey: queryKeys.dashboard.staff.all },
      { queryKey: queryKeys.staff.all },
    ]);
  });

  it("writes saved items back to their detail caches", () => {
    const queryClient = new QueryClient();

    const news = { id: "news-1" } as DashboardNewsItem;
    const match = { id: "match-1" } as DashboardMatchItem;
    const gallery = { id: "gallery-1" } as DashboardGalleryItem;
    const table = { id: "table-1" } as DashboardTableItem;
    const tournament = { id: "tournament-1" } as DashboardTournamentItem;
    const organization = { id: "organization-1" } as DashboardOrganizationItem;
    const team = { id: "team-1" } as DashboardTeamItem;
    const staff = { id: "staff-1" } as DashboardStaffItem;

    cacheDashboardNews(queryClient, news);
    cacheDashboardMatch(queryClient, match);
    cacheDashboardGallery(queryClient, gallery);
    cacheDashboardTable(queryClient, table);
    cacheDashboardTournament(queryClient, tournament);
    cacheDashboardOrganization(queryClient, organization);
    cacheDashboardTeam(queryClient, team);
    cacheDashboardStaff(queryClient, staff);

    expect(queryClient.getQueryData(queryKeys.dashboard.news.byId(news.id))).toEqual(
      news
    );
    expect(
      queryClient.getQueryData(queryKeys.dashboard.matches.byId(match.id))
    ).toEqual(match);
    expect(
      queryClient.getQueryData(queryKeys.dashboard.galleries.byId(gallery.id))
    ).toEqual(gallery);
    expect(
      queryClient.getQueryData(queryKeys.dashboard.table.byId(table.id))
    ).toEqual(table);
    expect(
      queryClient.getQueryData(
        queryKeys.dashboard.tournaments.byId(tournament.id)
      )
    ).toEqual(tournament);
    expect(
      queryClient.getQueryData(
        queryKeys.dashboard.organizations.byId(organization.id)
      )
    ).toEqual(organization);
    expect(queryClient.getQueryData(queryKeys.dashboard.teams.byId(team.id))).toEqual(
      team
    );
    expect(
      queryClient.getQueryData(queryKeys.dashboard.staff.byId(staff.id))
    ).toEqual(staff);
  });
});
