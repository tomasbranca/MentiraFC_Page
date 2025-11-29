export default {
  name: 'games',
  title: 'Partidos',
  type: 'document',
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
