export interface Section {
  name: string
  id: string // Heading anchor, `top` scrolls to the start of the page
}

export interface GalleryItem {
  slug: string // File name under the gallery image folder, without extension
  name?: string
  year?: string
  video?: string // YouTube id, the image then only serves as the poster
  width?: number // Thumbnail size, filled in at build time
  height?: number
}

export interface GallerySection {
  name: string
  id: string
  items: GalleryItem[]
}

export interface LightboxItem {
  src: string
  video?: string
  title: string
}

export interface Frontmatter {
  navigation?: string
  heading?: string
  description?: string // Meta description used for SEO and social embeds
  order?: number
  hidden?: boolean // Whether to hide the item from navigation
  sections?: Section[] // Entries for the section bar below the navigation
  gallery?: GallerySection[] // Rendered below the page content, also fills the section bar
  [key: string]: any // For any other properties in frontmatter
}

export interface ContentData {
  html: string
  frontmatter: Frontmatter
}

export interface NavItem {
  slug: string
  heading: string
  navigation: string
  order: number
}
