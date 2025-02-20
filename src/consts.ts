import type { Site, Page, Links, Socials } from "@types"

// Global
export const SITE: Site = {
  TITLE: "Srikeerthi Srinivasan",
  DESCRIPTION: "Welcome to my website",
  AUTHOR: "Srikeerthi Srinivasan",
}

// Work Page
export const WORK: Page = {
  TITLE: "Experience",
  DESCRIPTION: "Places I have worked.",
}

// Blog Page
export const BLOG: Page = {
  TITLE: "Blog",
  DESCRIPTION: "Writing on topics I am passionate about.",
}

// Projects Page 
export const PROJECTS: Page = {
  TITLE: "Projects",
  DESCRIPTION: "Recent projects I have worked on.",
}

// Search Page
export const SEARCH: Page = {
  TITLE: "Search",
  DESCRIPTION: "Search all posts and projects by keyword.",
}

// Links
export const LINKS: Links = [
  { 
    TEXT: "Home", 
    HREF: "/", 
  },
  { 
    TEXT: "Work", 
    HREF: "/work", 
  },
  { 
    TEXT: "Blog", 
    HREF: "/blog", 
  },
  { 
    TEXT: "Projects", 
    HREF: "/projects", 
  },
  { 
    TEXT: "Contact", 
    HREF: "/#connect", 
  },
]

// Socials
export const SOCIALS: Socials = [
  { 
    NAME: "Email",
    ICON: "email", 
    TEXT: "srikeerthi.vs@gmail.com",
    HREF: "mailto:srikeerthi.vs@gmail.com",
  },
  { 
    NAME: "Github",
    ICON: "github",
    TEXT: "srikeerthis",
    HREF: "https://github.com/srikeerthis"
  },
  { 
    NAME: "LinkedIn",
    ICON: "linkedin",
    TEXT: "srikeerthis",
    HREF: "https://www.linkedin.com/in/srikeerthis/",
  },
]

