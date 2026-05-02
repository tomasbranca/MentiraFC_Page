export default {
  name: 'staff',
  title: 'Staff',
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
      name: 'role',
      title: 'Rol en el equipo',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'birthDate',
      title: 'Fecha de nacimiento',
      type: 'date',
    },
    {
      name: 'photo',
      title: 'Foto del staff',
      type: 'image',
      options: {hotspot: true},
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
            : 'El slug es obligatorio para publicar URLs canonicas del staff.'
        ),
    },
  ],
  preview: {
    select: {
      name: 'name',
      lastName: 'lastName',
      role: 'role',
      media: 'photo',
    },
    prepare({name, lastName, role, media}) {
      return {
        title: [name, lastName].filter(Boolean).join(' '),
        subtitle: role,
        media,
      }
    },
  },
}
