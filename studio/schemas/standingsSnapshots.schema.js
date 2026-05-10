const standingRowFields = [
  {
    name: 'team',
    title: 'Equipo',
    type: 'reference',
    to: [{type: 'teams'}],
    readOnly: true,
    validation: (Rule) => Rule.required(),
  },
  {
    name: 'played',
    title: 'Partidos jugados',
    type: 'number',
    readOnly: true,
  },
  {
    name: 'wins',
    title: 'Ganados',
    type: 'number',
    readOnly: true,
    validation: (Rule) => Rule.required().integer().min(0),
  },
  {
    name: 'draws',
    title: 'Empatados',
    type: 'number',
    readOnly: true,
    validation: (Rule) => Rule.required().integer().min(0),
  },
  {
    name: 'losses',
    title: 'Perdidos',
    type: 'number',
    readOnly: true,
    validation: (Rule) => Rule.required().integer().min(0),
  },
  {
    name: 'goalsFor',
    title: 'Goles a favor',
    type: 'number',
    readOnly: true,
    validation: (Rule) => Rule.required().integer().min(0),
  },
  {
    name: 'goalsAgainst',
    title: 'Goles en contra',
    type: 'number',
    readOnly: true,
    validation: (Rule) => Rule.required().integer().min(0),
  },
  {
    name: 'points',
    title: 'Puntos',
    type: 'number',
    readOnly: true,
  },
  {
    name: 'goalDiff',
    title: 'Diferencia de gol',
    type: 'number',
    readOnly: true,
  },
  {
    name: 'position',
    title: 'Posicion',
    type: 'number',
    readOnly: true,
  },
  {
    name: 'previousPosition',
    title: 'Posicion anterior',
    type: 'number',
    readOnly: true,
  },
  {
    name: 'positionChange',
    title: 'Movimiento',
    type: 'number',
    readOnly: true,
  },
]

export default {
  name: 'standingsSnapshots',
  title: 'Tablas guardadas',
  type: 'document',
  preview: {
    select: {
      tournament: 'tournament.name',
      matchdayNumber: 'matchdayNumber',
      label: 'label',
      snapshotDate: 'snapshotDate',
      logo: 'tournament.organization.logo',
    },
    prepare({tournament, matchdayNumber, label, snapshotDate, logo}) {
      const title = label || `Fecha ${matchdayNumber || '?'}`

      return {
        title: `${tournament || 'Torneo'} - ${title}`,
        subtitle: snapshotDate,
        media: logo,
      }
    },
  },
  fields: [
    {
      name: 'tournament',
      title: 'Torneo',
      type: 'reference',
      to: [{type: 'tournaments'}],
      readOnly: true,
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'matchdayNumber',
      title: 'Numero de fecha',
      type: 'number',
      readOnly: true,
      validation: (Rule) => Rule.required().integer().min(1),
    },
    {
      name: 'label',
      title: 'Etiqueta',
      type: 'string',
      readOnly: true,
      description: 'Ejemplo: Fecha 7, Semifinal, Tabla final.',
    },
    {
      name: 'snapshotDate',
      title: 'Fecha visible de la tabla',
      type: 'datetime',
      readOnly: true,
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'gamesThroughDate',
      title: 'Partidos de Mentira contabilizados hasta',
      type: 'datetime',
      readOnly: true,
      description:
        'La web usa este corte para calcular automaticamente la fila de Mentira FC en esta tabla.',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'rows',
      title: 'Filas de tabla',
      type: 'array',
      readOnly: true,
      description:
        'Historial generado automaticamente desde Tabla actual y partidos de Mentira FC.',
      of: [
        {
          type: 'object',
          name: 'standingSnapshotRow',
          title: 'Fila de tabla',
          fields: standingRowFields,
          preview: {
            select: {
              team: 'team.name',
              logo: 'team.logo',
              wins: 'wins',
              draws: 'draws',
              losses: 'losses',
              position: 'position',
              points: 'points',
            },
            prepare({team, logo, wins, draws, losses, position, points}) {
              const normalizedWins = Number.isFinite(Number(wins)) ? Number(wins) : 0
              const normalizedDraws = Number.isFinite(Number(draws)) ? Number(draws) : 0
              const normalizedLosses = Number.isFinite(Number(losses)) ? Number(losses) : 0
              const displayedPoints = Number.isFinite(Number(points))
                ? Number(points)
                : normalizedWins * 3 + normalizedDraws

              return {
                title: `${position || '-'} - ${team || 'Equipo'}`,
                subtitle: `${displayedPoints} pts | ${normalizedWins} - ${normalizedDraws} - ${normalizedLosses}`,
                media: logo,
              }
            },
          },
        },
      ],
      validation: (Rule) => Rule.required().min(1),
    },
  ],
}
