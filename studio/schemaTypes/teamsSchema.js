export default {
  name: 'teams',
  title: 'Equipos',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Nombre',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'logo',
      title: 'Escudo',
      type: 'image',
      validation: Rule => Rule.required()
    },
    {
      name: 'isMain',
      title: 'Es equipo principal',
      type: 'boolean',
      validation: Rule => Rule.required()
    }
  ]
};
