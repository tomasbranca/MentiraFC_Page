export default {
  name: 'tournaments',
  title: 'Torneos',
  type: 'document',
  preview: {
    select: {
      name: 'name',
      organization: 'organization.name',
      logo: 'organization.logo',
    },
    prepare({name, organization, logo}) {
      return {
        title: `${organization} - ${name}`,
        media: logo,
      }
    },
  },

  fields: [
    {
      name: 'name',
      title: 'Nombre del torneo',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'organization',
      title: 'Organizadores',
      type: 'reference',
      to: [{type: 'organizations'}],
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'active',
      title: 'Activo',
      type: 'boolean',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'primaryPrizeSlots',
      title: 'Equipos que clasifican al primer premio',
      type: 'number',
      initialValue: 1,
      validation: (Rule) => Rule.required().integer().min(0),
    },
    {
      name: 'secondaryPrizeSlots',
      title: 'Equipos que clasifican al segundo premio',
      type: 'number',
      initialValue: 4,
      validation: (Rule) => Rule.required().integer().min(0),
    },
    {
      name: 'participants',
      title: 'Equipos participantes de tabla',
      type: 'array',
      description:
        'Lista oficial de equipos que pueden cargarse manualmente en Tabla actual. No incluir Mentira FC: se calcula automaticamente desde partidos.',
      of: [
        {
          type: 'object',
          name: 'tournamentParticipant',
          title: 'Participante',
          fields: [
            {
              name: 'team',
              title: 'Equipo',
              type: 'reference',
              to: [{type: 'teams'}],
              options: {
                filter: '!defined(isMain) || isMain != true',
              },
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'status',
              title: 'Estado',
              type: 'string',
              initialValue: 'active',
              options: {
                layout: 'radio',
                list: [
                  {title: 'Activo', value: 'active'},
                  {title: 'Reemplazado', value: 'replaced'},
                  {title: 'Retirado', value: 'withdrawn'},
                ],
              },
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'activeFromMatchday',
              title: 'Activo desde fecha',
              type: 'number',
              description: 'Opcional. Si queda vacio, cuenta desde el inicio del torneo.',
              validation: (Rule) => Rule.integer().min(1),
            },
            {
              name: 'activeUntilMatchday',
              title: 'Activo hasta fecha',
              type: 'number',
              description:
                'Usar cuando un equipo se retira o es reemplazado. La fecha indicada sigue contando como activa.',
              validation: (Rule) => Rule.integer().min(1),
            },
            {
              name: 'notes',
              title: 'Notas',
              type: 'text',
              rows: 2,
            },
          ],
          preview: {
            select: {
              team: 'team.name',
              logo: 'team.logo',
              status: 'status',
              from: 'activeFromMatchday',
              until: 'activeUntilMatchday',
            },
            prepare({team, logo, status, from, until}) {
              const range = [from ? `desde F${from}` : null, until ? `hasta F${until}` : null]
                .filter(Boolean)
                .join(' - ')

              return {
                title: team || 'Equipo',
                subtitle: [status || 'active', range].filter(Boolean).join(' - '),
                media: logo,
              }
            },
          },
        },
      ],
      validation: (Rule) =>
        Rule.required()
          .min(1)
          .custom((participants = []) => {
            const teamRefs = participants
              .map((participant) => participant?.team?._ref)
              .filter(Boolean)
            const duplicateTeam = teamRefs.find((teamRef, index) => teamRefs.indexOf(teamRef) !== index)

            if (duplicateTeam) return 'No se puede repetir un equipo participante.'

            const invalidRange = participants.find((participant) => {
              const from = Number(participant?.activeFromMatchday)
              const until = Number(participant?.activeUntilMatchday)

              return Number.isFinite(from) && Number.isFinite(until) && from > until
            })

            if (invalidRange) {
              return 'La fecha "activo desde" no puede ser mayor que "activo hasta".'
            }

            const inactiveWithoutEnd = participants.find(
              (participant) =>
                participant?.status &&
                participant.status !== 'active' &&
                !participant.activeUntilMatchday,
            )

            if (inactiveWithoutEnd) {
              return 'Los equipos reemplazados o retirados deben tener "Activo hasta fecha".'
            }

            return true
          }),
    },
  ],
}
