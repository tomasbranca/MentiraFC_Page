import {defineBlueprint, defineDocumentFunction} from '@sanity/blueprints'

export default defineBlueprint({
  resources: [
    defineDocumentFunction({
      name: 'sync-standings-snapshot',
      event: {
        on: ['create', 'update'],
        filter: '_type == "standingsState" && !(_id in path("drafts.**"))',
        projection: '{_id}',
        resource: {
          type: 'dataset',
          id: 'jwpxrdo2.production',
        },
      },
    }),
  ],
})
