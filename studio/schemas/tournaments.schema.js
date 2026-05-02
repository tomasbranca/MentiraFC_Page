export default {
  name: 'tournaments',
  title: 'Torneos',
  type: 'document',
  preview: {
    select: {
      name: 'name',
      organization: 'organization.name',
      logo: 'organization.logo',
    },
    prepare({name, organization, logo}) {
      return {
        title: `${organization} · ${name}`,
        media: logo,
      }
    },
  },

  fields: [
    {
      name: 'name',
      title: 'Nombre del torneo',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'organization',
      title: 'Organizadores',
      type: 'reference',
      to: [{type: 'organizations'}],
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'active',
      title: 'Activo',
      type: 'boolean',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'primaryPrizeSlots',
      title: 'Equipos que clasifican al primer premio',
      type: 'number',
      initialValue: 1,
      validation: (Rule) => Rule.required().integer().min(0),
    },
    {
      name: 'secondaryPrizeSlots',
      title: 'Equipos que clasifican al segundo premio',
      type: 'number',
      initialValue: 4,
      validation: (Rule) => Rule.required().integer().min(0),
    },
    {
      name: 'standings',
      title: 'Posiciones',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'standing',
          title: 'Fila de tabla',
          fields: [
            {
              name: 'team',
              title: 'Equipo',
              type: 'reference',
              to: [{type: 'teams'}],
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'played',
              title: 'Partidos jugados',
              type: 'number',
              validation: (Rule) => Rule.required().min(0),
            },
            {
              name: 'wins',
              title: 'Ganados',
              type: 'number',
              validation: (Rule) => Rule.required().min(0),
            },
            {
              name: 'draws',
              title: 'Empatados',
              type: 'number',
              validation: (Rule) => Rule.required().min(0),
            },
            {
              name: 'losses',
              title: 'Perdidos',
              type: 'number',
              validation: (Rule) => Rule.required().min(0),
            },
            {
              name: 'goalsFor',
              title: 'Goles a favor',
              type: 'number',
              validation: (Rule) => Rule.required().min(0),
            },
            {
              name: 'goalsAgainst',
              title: 'Goles en contra',
              type: 'number',
              validation: (Rule) => Rule.required().min(0),
            },
          ],
          preview: {
            select: {
              team: 'team.name',
              logo: 'team.logo',
              wins: 'wins',
              draws: 'draws',
              losses: 'losses',
            },
            prepare({team, logo, wins, draws, losses}) {
              return {
                title: `${team} (${wins} - ${draws} - ${losses})`,
                media: logo,
              }
            },
          },
        },
      ],
    },
  ],
}
