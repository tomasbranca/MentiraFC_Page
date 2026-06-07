const standingStateRowFields = [
  {
    name: 'team',
    title: 'Equipo',
    type: 'reference',
    to: [{type: 'teams'}],
    options: {
      filter: ({document}) => {
        const tournamentId = document?.tournament?._ref

        if (!tournamentId) {
          return {
            filter: '!defined(isMain) || isMain != true',
          }
        }

        return {
          filter:
            '(!defined(isMain) || isMain != true) && _id in *[_id == $tournamentId][0].participants[].team._ref',
          params: {tournamentId},
        }
      },
    },
    validation: (Rule) => Rule.required(),
  },
  {
    name: 'wins',
    title: 'Ganados',
    type: 'number',
    validation: (Rule) => Rule.required().integer().min(0),
  },
  {
    name: 'draws',
    title: 'Empatados',
    type: 'number',
    validation: (Rule) => Rule.required().integer().min(0),
  },
  {
    name: 'losses',
    title: 'Perdidos',
    type: 'number',
    validation: (Rule) => Rule.required().integer().min(0),
  },
  {
    name: 'goalsFor',
    title: 'Goles a favor',
    type: 'number',
    validation: (Rule) => Rule.required().integer().min(0),
  },
  {
    name: 'goalsAgainst',
    title: 'Goles en contra',
    type: 'number',
    validation: (Rule) => Rule.required().integer().min(0),
  },
]

export default {
  name: 'standingsState',
  title: 'Tabla actual',
  type: 'document',
  preview: {
    select: {
      tournament: 'tournament.name',
      matchdayNumber: 'matchdayNumber',
      label: 'label',
      logo: 'tournament.organization.logo',
    },
    prepare({tournament, matchdayNumber, label, logo}) {
      const title = label || `Fecha ${matchdayNumber || '?'}`

      return {
        title: `${tournament || 'Torneo'} - ${title}`,
        subtitle: 'Documento editable que actualiza la tabla publicada',
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
      description: 'Debe existir un solo documento editable de tabla por torneo.',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'matchdayNumber',
      title: 'Numero de fecha',
      type: 'number',
      validation: (Rule) => Rule.required().integer().min(1),
    },
    {
      name: 'label',
      title: 'Etiqueta',
      type: 'string',
      description: 'Ejemplo: Fecha 7, Semifinal, Tabla final.',
    },
    {
      name: 'snapshotDate',
      title: 'Fecha de actualizacion',
      type: 'datetime',
      description:
        'Tambien se usa como corte para calcular Mentira FC: solo cuentan partidos finalizados anteriores a esta fecha.',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'rows',
      title: 'Filas editables de tabla',
      type: 'array',
      description:
        'Cargar solo rivales/equipos del torneo. No cargar Mentira FC, PJ, puntos, diferencia ni posicion.',
      of: [
        {
          type: 'object',
          name: 'standingStateRow',
          title: 'Fila editable',
          fields: standingStateRowFields,
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
                title: team || 'Equipo',
                subtitle: `${wins || 0} - ${draws || 0} - ${losses || 0}`,
                media: logo,
              }
            },
          },
        },
      ],
      validation: (Rule) =>
        Rule.required()
          .min(1)
          .custom((rows = []) => {
            const teamRefs = rows.map((row) => row?.team?._ref).filter(Boolean)
            const duplicateTeam = teamRefs.find(
              (teamRef, index) => teamRefs.indexOf(teamRef) !== index,
            )

            return duplicateTeam ? 'No se puede repetir un equipo en la tabla actual.' : true
          }),
    },
  ],
}
