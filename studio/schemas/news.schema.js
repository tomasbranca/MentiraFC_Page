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
        {
          type: 'block',
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'Titulo 2', value: 'h2'},
            {title: 'Titulo 3', value: 'h3'},
            {title: 'Cita', value: 'blockquote'},
          ],
          lists: [
            {title: 'Viñetas', value: 'bullet'},
            {title: 'Numerada', value: 'number'},
          ],
          marks: {
            decorators: [
              {title: 'Negrita', value: 'strong'},
              {title: 'Cursiva', value: 'em'},
              {title: 'Subrayado', value: 'underline'},
            ],
            annotations: [
              {
                name: 'link',
                title: 'Enlace',
                type: 'object',
                fields: [
                  {
                    name: 'href',
                    title: 'URL',
                    type: 'string',
                    validation: (Rule) =>
                      Rule.required().custom((value) => {
                        if (typeof value !== 'string') {
                          return 'El enlace necesita una URL valida.'
                        }

                        if (
                          value.startsWith('#') ||
                          (value.startsWith('/') && !value.startsWith('//'))
                        ) {
                          return true
                        }

                        try {
                          const url = new globalThis.URL(value)
                          return ['http:', 'https:'].includes(url.protocol)
                            ? true
                            : 'Usa una URL http(s) o una ruta interna.'
                        } catch {
                          return 'Usa una URL http(s) o una ruta interna.'
                        }
                      }),
                  },
                ],
              },
            ],
          },
        },
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
      fields: [
        {
          name: 'alt',
          title: 'Texto alternativo',
          type: 'string',
          validation: (Rule) => Rule.required(),
        },
      ],
      validation: (Rule) => Rule.required(),
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
