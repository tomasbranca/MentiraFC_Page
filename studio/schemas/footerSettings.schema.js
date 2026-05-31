export default {
  name: 'footerSettings',
  title: 'Footer y sponsors',
  type: 'document',
  fields: [
    {
      name: 'contactEmail',
      title: 'Email de contacto',
      type: 'email',
      validation: (rule) => rule.required(),
    },
    {
      name: 'socials',
      title: 'Redes sociales',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'label',
              title: 'Nombre visible',
              type: 'string',
              validation: (rule) => rule.required(),
            },
            {
              name: 'platform',
              title: 'Plataforma',
              type: 'string',
              options: {
                list: [
                  {title: 'Instagram', value: 'instagram'},
                  {title: 'TikTok', value: 'tiktok'},
                  {title: 'X', value: 'x'},
                  {title: 'YouTube', value: 'youtube'},
                  {title: 'Facebook', value: 'facebook'},
                  {title: 'Web', value: 'web'},
                ],
                layout: 'dropdown',
              },
              validation: (rule) => rule.required(),
            },
            {
              name: 'url',
              title: 'URL',
              type: 'url',
              validation: (rule) => rule.required(),
            },
          ],
          preview: {
            select: {
              title: 'label',
              subtitle: 'url',
            },
          },
        },
      ],
    },
    {
      name: 'links',
      title: 'Links del footer',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'label',
              title: 'Texto',
              type: 'string',
              validation: (rule) => rule.required(),
            },
            {
              name: 'url',
              title: 'URL',
              type: 'url',
              validation: (rule) => rule.required(),
            },
          ],
          preview: {
            select: {
              title: 'label',
              subtitle: 'url',
            },
          },
        },
      ],
    },
    {
      name: 'sponsors',
      title: 'Sponsors',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'name',
              title: 'Nombre',
              type: 'string',
              validation: (rule) => rule.required(),
            },
            {
              name: 'url',
              title: 'Link a la pagina',
              type: 'url',
              validation: (rule) => rule.required(),
            },
            {
              name: 'logo',
              title: 'Logo',
              type: 'image',
              options: {hotspot: false},
            },
            {
              name: 'logoUrl',
              title: 'URL alternativa del logo',
              type: 'url',
              description: 'Usar solo si el logo no se sube como imagen de Sanity.',
            },
            {
              name: 'logoAlt',
              title: 'Texto alternativo del logo',
              type: 'string',
            },
          ],
          preview: {
            select: {
              title: 'name',
              subtitle: 'url',
              media: 'logo',
            },
          },
        },
      ],
    },
  ],
  preview: {
    prepare: () => ({
      title: 'Footer y sponsors',
      subtitle: 'Contacto, redes, links y sponsors del sitio publico',
    }),
  },
}
