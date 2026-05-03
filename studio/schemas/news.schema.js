export default {
  name: 'news',
  title: 'Noticias',
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
      of: [
        {type: 'block'},
        {
          type: 'image',
          title: 'Foto',
          options: {hotspot: true},
          fields: [
            {
              name: 'alt',
              title: 'Texto alternativo',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'caption',
              title: 'Epigrafe',
              type: 'string',
            },
          ],
        },
        {
          name: 'video',
          title: 'Video',
          type: 'object',
          fields: [
            {
              name: 'url',
              title: 'URL del video',
              type: 'url',
              description: 'YouTube, Vimeo o un enlace directo a un archivo de video.',
            },
            {
              name: 'file',
              title: 'Archivo de video',
              type: 'file',
              options: {accept: 'video/*'},
            },
            {
              name: 'title',
              title: 'Titulo',
              type: 'string',
            },
            {
              name: 'caption',
              title: 'Epigrafe',
              type: 'string',
            },
          ],
          preview: {
            select: {
              title: 'title',
              url: 'url',
              fileName: 'file.asset.originalFilename',
            },
            prepare({title, url, fileName}) {
              return {
                title: title || fileName || url || 'Video',
              }
            },
          },
          validation: (Rule) =>
            Rule.custom((value) =>
              value?.url || value?.file ? true : 'Agrega una URL o un archivo de video',
            ),
        },
      ],
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
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    },
  ],
}
