import {defineType, defineField, defineArrayMember} from 'sanity'

const CATEGORIES = [
  'Client Projects',
  'Contracts',
  'Creative Space',
  'Documentary',
  'Events',
  'Presets',
  'Sports',
  'Visualizer',
  'Wedding',
]

export const blogPost = defineType({
  name: 'blogPost',
  title: 'Blog Posts',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title'},
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {list: CATEGORIES, layout: 'dropdown'},
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published Date',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 2,
      description: 'Short preview shown on the blog listing page',
      validation: Rule => Rule.required().max(200),
    }),
    defineField({
      name: 'thumbnail',
      title: 'Thumbnail Image',
      type: 'image',
      options: {hotspot: true},
      description: 'Used on the blog listing page. Leave empty if using a video thumbnail.',
    }),
    defineField({
      name: 'thumbnailVideoUrl',
      title: 'Thumbnail Video URL',
      type: 'url',
      description: 'YouTube URL — used as the listing thumbnail if no image is set',
    }),
    defineField({
      name: 'body',
      title: 'Post Body',
      type: 'array',
      of: [
        defineArrayMember({type: 'block'}),
        defineArrayMember({
          type: 'image',
          options: {hotspot: true},
          fields: [
            defineField({name: 'alt', title: 'Alt Text', type: 'string'}),
            defineField({name: 'caption', title: 'Caption', type: 'string'}),
          ],
        }),
        defineArrayMember({
          type: 'object',
          name: 'youtubeEmbed',
          title: 'YouTube Embed',
          fields: [
            defineField({name: 'url', title: 'YouTube URL', type: 'url', validation: Rule => Rule.required()}),
            defineField({name: 'caption', title: 'Caption', type: 'string'}),
          ],
          preview: {select: {title: 'url'}, prepare: ({title}) => ({title: 'YouTube', subtitle: title})},
        }),
        defineArrayMember({
          type: 'object',
          name: 'instagramEmbed',
          title: 'Instagram Embed',
          fields: [
            defineField({name: 'url', title: 'Instagram Post URL', type: 'url', validation: Rule => Rule.required()}),
          ],
          preview: {select: {title: 'url'}, prepare: ({title}) => ({title: 'Instagram', subtitle: title})},
        }),
      ],
    }),
    defineField({
      name: 'relatedPosts',
      title: 'Related Posts',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'blogPost'}]})],
      validation: Rule => Rule.max(3),
    }),
  ],
  preview: {
    select: {title: 'title', subtitle: 'category', media: 'thumbnail'},
  },
})
