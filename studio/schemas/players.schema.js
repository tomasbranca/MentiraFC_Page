const POSITION_OPTIONS = [
  {title: 'Arquero', value: 'arq'},
  {title: 'Defensa', value: 'def'},
  {title: 'Mediocampista', value: 'med'},
  {title: 'Delantero', value: 'del'},
]

const DOMINANT_FOOT_OPTIONS = [
  {title: 'Derecho', value: 'right'},
  {title: 'Zurdo', value: 'left'},
]

const ratingValidation = (Rule) => Rule.integer().min(1).max(10)

const fieldRatingFields = [
  {name: 'speed', title: 'Velocidad'},
  {name: 'shooting', title: 'Tiro'},
  {name: 'passing', title: 'Pase'},
  {name: 'dribbling', title: 'Regate'},
  {name: 'defense', title: 'Defensa'},
  {name: 'physical', title: 'Fisico'},
]

const goalkeeperRatingFields = [
  {name: 'jumping', title: 'Salto'},
  {name: 'saving', title: 'Parada'},
  {name: 'kicking', title: 'Saque'},
  {name: 'reflexes', title: 'Reflejos'},
  {name: 'speed', title: 'Velocidad'},
  {name: 'positioning', title: 'Posicionamiento'},
]

const createRatingField = ({name, title}) => ({
  name,
  title,
  type: 'number',
  validation: ratingValidation,
})

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
        list: POSITION_OPTIONS,
      },
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'dominantFoot',
      title: 'Pie habil',
      type: 'string',
      options: {
        list: DOMINANT_FOOT_OPTIONS,
        layout: 'radio',
      },
    },
    {
      name: 'fieldRatings',
      title: 'Valoraciones jugador de campo',
      type: 'object',
      hidden: ({document}) => document?.position === 'arq',
      fields: fieldRatingFields.map(createRatingField),
      options: {
        columns: 2,
      },
    },
    {
      name: 'goalkeeperRatings',
      title: 'Valoraciones arquero',
      type: 'object',
      hidden: ({document}) => document?.position !== 'arq',
      fields: goalkeeperRatingFields.map(createRatingField),
      options: {
        columns: 2,
      },
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
      options: {hotspot: true},
    },
    {
      name: 'isActive',
      title: 'Activo en plantel',
      type: 'boolean',
      description:
        'Si esta desactivado, el jugador no aparece en el plantel publico pero conserva referencias historicas.',
      initialValue: true,
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: (doc) => `${doc.name} ${doc.lastName}`,
        maxLength: 96,
      },
      validation: (Rule) =>
        Rule.required().custom((slug) =>
          slug?.current
            ? true
            : 'El slug es obligatorio para publicar URLs canonicas de jugadores.'
        ),
    },
  ],
  preview: {
    select: {
      name: 'name',
      lastName: 'lastName',
      position: 'position',
      media: 'photo',
    },
    prepare({name, lastName, position, media}) {
      const positionTitle =
        POSITION_OPTIONS.find((option) => option.value === position)?.title

      return {
        title: [name, lastName].filter(Boolean).join(' '),
        subtitle: positionTitle ?? position,
        media,
      }
    },
  },
}
