export default {
  name: 'organizations',
  title: 'Organizadores',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Nombre de los organizadores',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'logo',
      title: 'Logo de los organizadores',
      type: 'image',
      options: {hotspot: true},
    },
    {
      name: 'primaryColor',
      title: 'Color principal del torneo',
      type: 'color',
      options: {
        disableAlpha: true, // opcional, sin transparencia
      },
    },
  ],
}
