import {defineType, defineField} from 'sanity'

export const aboutContent = defineType({
  name: 'aboutContent',
  title: 'About Page',
  type: 'document',
  __experimental_actions: ['update', 'publish'],
  fields: [
    defineField({
      name: 'headline',
      title: 'Headline',
      type: 'string',
      description: 'Main heading on the about page',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'subheadline',
      title: 'Subheadline',
      type: 'string',
      description: 'e.g. "Cinematic Photography & Videography | Based in Maryland"',
    }),
    defineField({
      name: 'bio',
      title: 'Bio',
      type: 'text',
      rows: 6,
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'headshot',
      title: 'Headshot',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'specialties',
      title: 'Specialties',
      type: 'array',
      of: [{type: 'string'}],
      description: 'e.g. Wedding, Editorial, Sports — shown as tags or a list',
    }),
    defineField({
      name: 'yearsExperience',
      title: 'Years of Experience',
      type: 'number',
    }),
  ],
  preview: {
    prepare: () => ({title: 'About Page Content'}),
  },
})
