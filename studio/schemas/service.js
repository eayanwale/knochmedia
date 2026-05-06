import {defineType, defineField} from 'sanity'

export const service = defineType({
  name: 'service',
  title: 'Services',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Service Title',
      type: 'string',
      description: 'e.g. "Wedding Photography", "Brand Videography"',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'serviceType',
      title: 'Service Type',
      type: 'string',
      options: {
        list: ['Photography', 'Videography', 'Photography & Videography'],
        layout: 'radio',
      },
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'shortDescription',
      title: 'Short Description',
      type: 'string',
      description: 'One-liner shown on cards — keep under 80 characters',
      validation: Rule => Rule.max(80),
    }),
    defineField({
      name: 'description',
      title: 'Full Description',
      type: 'text',
      rows: 4,
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'price',
      title: 'Price',
      type: 'string',
      description: 'e.g. "Starting at $500", "Contact for pricing"',
    }),
    defineField({
      name: 'includes',
      title: "What's Included",
      type: 'array',
      of: [{type: 'string'}],
      description: 'Bullet points — e.g. "4-hour coverage", "Edited digital gallery", "Print release"',
    }),
    defineField({
      name: 'ctaLabel',
      title: 'CTA Button Label',
      type: 'string',
      initialValue: 'Book Now',
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers appear first',
    }),
  ],
  preview: {
    select: {title: 'title', subtitle: 'serviceType', media: 'coverImage'},
  },
})
