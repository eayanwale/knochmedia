import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {testimonial} from './schemas/testimonial'
import {galleryCollection} from './schemas/galleryCollection'
import {service} from './schemas/service'
export default defineConfig({
  name: 'knoch-media',
  title: 'Knoch Media',
  projectId: '2779g58e',
  dataset: 'production',
  plugins: [
    structureTool(),
    visionTool(),
  ],
  schema: {
    types: [testimonial, galleryCollection, service],
  },
})
