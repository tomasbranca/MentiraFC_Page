const scorerKindOptions = [
  {title: 'Jugador del plantel', value: 'roster'},
  {title: 'Invitado al partido', value: 'guest'},
  {title: 'Gol en propia del rival', value: 'opponent_own_goal'},
]

export default {
  name: 'events',
  title: 'Eventos',
  type: 'document',

  preview: {
    select: {
      date: 'game.date',
      playerName: 'player.name',
      playerLastName: 'player.lastName',
      guestName: 'guestName',
      order: 'order',
      type: 'type',
      scorerKind: 'scorerKind',
    },
    prepare({date, playerName, playerLastName, guestName, order, type, scorerKind}) {
      let formattedDate = 'Sin fecha'

      if (date) {
        const d = new Date(date)

        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')

        formattedDate = `${year}/${month}/${day}`
      }

      const player =
        playerName && playerLastName
          ? `${playerName} ${playerLastName}`
          : guestName?.trim() || 'Jugador desconocido'

      const label = type === 'goal' ? 'Gol' : 'Evento'
      const kindLabel =
        scorerKind === 'guest'
          ? ' · Invitado'
          : scorerKind === 'opponent_own_goal'
            ? ' · Propia rival'
            : ''

      return {
        title: `${formattedDate} · ${player} · ${label} #${order}${kindLabel}`,
      }
    },
  },

  fields: [
    {
      name: 'game',
      title: 'Partido',
      type: 'reference',
      to: [{type: 'games'}],
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'type',
      title: 'Tipo',
      type: 'string',
      options: {
        list: [{title: 'Gol', value: 'goal'}],
      },
      initialValue: 'goal',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'scorerKind',
      title: 'Gol a favor de Mentira FC',
      description:
        'Todos los goles registrados acá suman para Mentira FC. Los goles del rival solo van en el resultado del partido.',
      type: 'string',
      options: {
        list: scorerKindOptions,
        layout: 'radio',
      },
      initialValue: 'roster',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'player',
      title: 'Jugador del plantel',
      type: 'reference',
      to: [{type: 'players'}],
      hidden: ({parent}) => parent?.scorerKind !== 'roster',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          if (context.parent?.scorerKind !== 'roster') {
            return true
          }

          return value ? true : 'Elegí el jugador del plantel.'
        }),
    },
    {
      name: 'guestName',
      title: 'Nombre del invitado',
      type: 'string',
      hidden: ({parent}) => parent?.scorerKind !== 'guest',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          if (context.parent?.scorerKind !== 'guest') {
            return true
          }

          return value?.trim() ? true : 'Escribí el nombre del jugador invitado.'
        }),
    },
    {
      name: 'order',
      title: 'Número de gol en el partido',
      type: 'number',
      validation: (Rule) => Rule.required().min(1),
    },
  ],
}
