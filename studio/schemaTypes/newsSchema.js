export default {
  name: 'news',
  title: 'Noticia',
  type: 'document',

  initialValue: () => ({
    date: new Date().toISOString(),
  }),

  fields: [
    {
      name: 'title',
      title: 'Título',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'description',
      title: 'Descripción corta',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'content',
      title: 'Contenido',
      type: 'array',
      of: [{type: 'block'}],
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'image',
      title: 'Imagen principal',
      type: 'image',
      options: {hotspot: true},
    },
    {
      name: 'date',
      title: 'Fecha',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: (doc) => doc._id || 'temp', // si no existe _id, pone algo temporal
        slugify: (input) => input.replace('drafts.', ''), // limpia el ID de drafts
      },
      validation: (Rule) => Rule.required(),
    },
  ],
}
