export interface Section {
  name: string
  id: string // Heading anchor, `top` scrolls to the start of the page
}

export interface Frontmatter {
  navigation?: string
  heading?: string
  description?: string // Meta description used for SEO and social embeds
  order?: number
  hidden?: boolean // Whether to hide the item from navigation
  sections?: Section[] // Entries for the section bar below the navigation
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
