export default {
  name: 'galleries',
  title: 'Galerias',
  type: 'document',

  preview: {
    select: {
      rival: 'game.rival.name',
      date: 'game.date',
      media: 'photos.0.image',
    },
    prepare({rival, date, media}) {
      const formattedDate = date ? new Date(date).toLocaleDateString() : 'Sin fecha'

      return {
        title: rival ? `Galeria vs ${rival}` : 'Galeria de partido',
        subtitle: formattedDate,
        media,
      }
    },
  },

  fields: [
    {
      name: 'game',
      title: 'Partido finalizado',
      type: 'reference',
      to: [{type: 'games'}],
      options: {
        filter: 'state == "finalizado"',
      },
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'URL publica de la galeria. El titulo visible se genera desde el partido.',
      options: {
        source: (doc) => (doc?.game?._ref ? `galeria-${doc.game._ref}` : 'galeria'),
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'photos',
      title: 'Fotos',
      type: 'array',
      of: [
        {
          name: 'galleryPhoto',
          title: 'Foto',
          type: 'object',
          fields: [
            {
              name: 'image',
              title: 'Imagen',
              type: 'image',
              options: {hotspot: true},
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'isHero',
              title: 'Usar como hero',
              type: 'boolean',
              initialValue: false,
            },
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
          preview: {
            select: {
              title: 'alt',
              subtitle: 'caption',
              media: 'image',
              isHero: 'isHero',
            },
            prepare({title, subtitle, media, isHero}) {
              return {
                title: `${isHero ? '[Hero] ' : ''}${title || 'Foto'}`,
                subtitle,
                media,
              }
            },
          },
        },
      ],
      validation: (Rule) =>
        Rule.required()
          .min(1)
          .custom((photos = []) => {
            const heroCount = photos.filter((photo) => photo?.isHero).length

            if (heroCount === 1) {
              return true
            }

            return 'Marca exactamente una foto como hero de la galeria'
          }),
    },
  ],
}
