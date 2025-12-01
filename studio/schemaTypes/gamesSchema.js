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
      goalsAgainst: 'result.goalsAgainst'
    },
    prepare(selection) {
      const { rival, media, date, state, goalsFor, goalsAgainst } = selection;
      let subtitle = '';

      if (state === 'por_jugar') {
        subtitle = `${new Date(date).toLocaleDateString()}`;
      } else if (state === 'en_curso') {
        subtitle = `En curso`;
      } else if (state === 'finalizado') {
        subtitle = `Finalizado: ${goalsFor} - ${goalsAgainst}`;
      }

      return {
        title: `vs ${rival}`,
        subtitle: subtitle,
        media
      };
    }
  },
  fields: [
    {
      name: 'rival',
      title: 'Rival',
      type: 'reference',
      to: [{ type: 'teams' }],
      validation: Rule => Rule.required()
    },
    {
      name: 'date',
      title: 'Fecha y Hora',
      type: 'datetime',
      validation: Rule => Rule.required()
    },
    {
      name: 'location',
      title: 'Ubicación',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'competition',
      title: 'Competición',
      type: 'string',
      options: {
        list: [
          { title: 'Torneo', value: 'Torneo' },
          { title: 'Copa', value: 'Copa' },
          { title: 'Amistoso', value: 'Amistoso' }
        ]
      },
      validation: Rule => Rule.required()
    },
    {
      name: 'state',
      title: 'Estado del Partido',
      type: 'string',
      options: {
        list: [
          { title: 'Por jugar', value: 'por_jugar' },
          { title: 'En curso', value: 'en_curso' },
          { title: 'Finalizado', value: 'finalizado' }
        ]
      },
      validation: Rule => Rule.required()
    },
    {
      name: 'result',
      title: 'Resultado',
      type: 'object',
      fields: [
        { name: 'goalsFor', type: 'number', title: 'Goles Mentira FC' },
        { name: 'goalsAgainst', type: 'number', title: 'Goles Rival' },
        {
          name: 'scorers',
          title: 'Goleadores',
          type: 'array',
          of: [{ type: 'string' }]
        }
      ],
      hidden: ({ parent }) => parent?.state !== 'finalizado'
    }
  ]
};
