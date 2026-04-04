export default {
  name: 'games',
  title: 'Partidos',
  type: 'document',

  preview: {
    select: {
      rival: 'rival.name',
      media: 'rival.logo',
      date: 'date',
      state: 'state',
      goalsFor: 'result.goalsFor',
      goalsAgainst: 'result.goalsAgainst',
    },
    prepare({ rival, media, date, state, goalsFor, goalsAgainst }) {
      let subtitle = 'Por jugar'

      if (state === 'finalizado') {
        subtitle = `Finalizado: ${goalsFor} - ${goalsAgainst}`
      }

      return {
        title: `${new Date(date).toLocaleDateString()} - ${rival}`,
        subtitle,
        media,
      }
    },
  },

  fields: [
    {
      name: 'rival',
      title: 'Rival',
      type: 'reference',
      to: [{ type: 'teams' }],
      validation: (Rule) => Rule.required(),
    },

    {
      name: 'date',
      title: 'Fecha y Hora',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    },

    {
      name: 'location',
      title: 'Ubicación',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },

    {
      name: 'competition',
      title: 'Competición',
      type: 'string',
      options: {
        list: [
          { title: 'Torneo', value: 'Torneo' },
          { title: 'Copa', value: 'Copa' },
          { title: 'Amistoso', value: 'Amistoso' },
        ],
      },
      validation: (Rule) => Rule.required(),
    },

    {
      name: 'tournament',
      title: 'Torneo',
      type: 'reference',
      to: [{ type: 'tournaments' }],
      hidden: ({ parent }) => parent?.competition !== 'Torneo',
      validation: (Rule) => Rule.required().error('El torneo es obligatorio para partidos de tipo "Torneo"'),
    },

    {
      name: 'state',
      title: 'Estado del Partido',
      type: 'string',
      options: {
        list: [
          { title: 'Por jugar', value: 'por_jugar' },
          { title: 'Finalizado', value: 'finalizado' },
        ],
      },
      validation: (Rule) => Rule.required(),
    },

    {
      name: 'result',
      title: 'Resultado',
      type: 'object',
      hidden: ({ parent }) => parent?.state !== 'finalizado',
      fields: [
        {
          name: 'goalsFor',
          title: 'Goles Mentira FC',
          type: 'number',
          validation: (Rule) => Rule.required().min(0),
        },
        {
          name: 'goalsAgainst',
          title: 'Goles Rival',
          type: 'number',
          validation: (Rule) => Rule.required().min(0),
        },
      ],
    },
  ],
}
