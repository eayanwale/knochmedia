import {defineType, defineField} from 'sanity'

export const heroImage = defineType({
  name: 'heroImage',
  title: 'Hero Images',
  type: 'document',
  fields: [
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {hotspot: true},
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'altText',
      title: 'Alt Text',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'headline',
      title: 'Headline',
      type: 'string',
      description: 'Text overlaid on this hero image',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers appear first in the slideshow',
    }),
  ],
  preview: {
    select: {title: 'headline', subtitle: 'altText', media: 'image'},
  },
})
