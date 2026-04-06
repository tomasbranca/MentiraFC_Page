import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { ColorInput } from '@sanity/color-input'
import {schemas} from './schemas'

export default defineConfig({
  name: 'default',
  title: 'mentira-fc',

  projectId: 'jwpxrdo2',
  dataset: 'production',

  plugins: [structureTool(), visionTool(), ColorInput()],

  schema: {
    types: schemas,
  },
})
