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
      options: { hotspot: true },
    },
    {
      name: "primaryColor",
      title: "Color principal del torneo",
      type: "string",
      description: "Ejemplo: #6D28D9",
      validation: Rule =>
        Rule.required().regex(/^#([0-9A-F]{3}){1,2}$/i, {
          name: "hex",
          invert: false,
        })
    }, 
  ],
}