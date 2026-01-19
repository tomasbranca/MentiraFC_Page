export default {
  name: 'players',
  title: 'Jugadores',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Nombre',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'lastName',
      title: 'Apellido',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'number',
      title: 'Número de camiseta',
      type: 'number',
      validation: (Rule) => Rule.required().min(0),
    },
    {
      name: 'position',
      title: 'Posición',
      type: 'string',
      options: {
        list: [
          {title: 'Arquero', value: 'arq'},
          {title: 'Defensa', value: 'def'},
          {title: 'Mediocampista', value: 'med'},
          {title: 'Delantero', value: 'del'},
        ],
      },
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'birthDate',
      title: 'Fecha de nacimiento',
      type: 'date',
    },
    {
      name: 'photo',
      title: 'Foto del jugador',
      type: 'image',
      options: { hotspot: true },
    },
    {
      name: 'goals',
      title: 'Goles',
      type: 'number',
      validation: (Rule) => Rule.required().min(0),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: (doc) => `${doc.name} ${doc.lastName}`,
        maxLength: 96,
      },
    }
  ]
}