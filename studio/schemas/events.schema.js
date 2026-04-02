export default {
  name: 'events',
  title: 'Eventos',
  type: 'document',

  preview: {
    select: {
      date: 'game.date',
      playerName: 'player.name',
      playerLastName: 'player.lastName',
      order: 'order',
      type: 'type',
    },
    prepare({date, playerName, playerLastName, order, type}) {
      let formattedDate = 'Sin fecha'

      if (date) {
        const d = new Date(date)

        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')

        formattedDate = `${year}/${month}/${day}`
      }

      const player =
        playerName && playerLastName ? `${playerName} ${playerLastName}` : 'Jugador desconocido'

      const label = type === 'goal' ? 'Gol' : 'Evento' //Agregar mas eventos a futuro y ajustar label acorde al type

      return {
        title: `${formattedDate} · ${player} · ${label} #${order}`,
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
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'player',
      title: 'Jugador',
      type: 'reference',
      to: [{type: 'players'}],
    },
    {
      name: 'order',
      title: 'Número de gol en el partido',
      type: 'number',
      validation: (Rule) => Rule.required().min(1),
    },
  ],
}
