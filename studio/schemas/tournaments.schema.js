export default {
  name: 'tournaments',
  title: 'Torneos',
  type: 'document',
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
              name: 'position',
              title: 'Posición',
              type: 'number',
              validation: (Rule) => Rule.required().min(1),
            },
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
              position: 'position',
              team: 'team.name',
              points: 'points',
            },
            prepare({position, team}) {
              return {
                title: `${position}° - ${team}`,
              }
            },
          },
        },
      ],
    },
  ],
}
