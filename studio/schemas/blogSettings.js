import {defineType, defineField} from 'sanity'

export const blogSettings = defineType({
  name: 'blogSettings',
  title: 'Blog Page Settings',
  type: 'document',
  __experimental_actions: ['update', 'publish'],
  fields: [
    defineField({
      name: 'pageTitle',
      title: 'Page Title',
      type: 'string',
      initialValue: 'Welcome to the Blog',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'intro',
      title: 'Intro Text',
      type: 'text',
      rows: 4,
    }),
  ],
  preview: {
    prepare: () => ({title: 'Blog Page Settings'}),
  },
})
