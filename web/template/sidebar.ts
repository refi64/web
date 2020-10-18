type Sidebar = {
  root: {
    name: string
    icon: string
    url: string
  }[]
  sections: {
    name: string
    icon: string
    items: { name: string; url: string }[]
  }[]
}

export let sidebar: Sidebar = {
  root: [
    { name: 'Home', icon: 'home', url: '/' },
    { name: 'Atom', icon: 'rss_feed', url: '/atom.xml' },
    { name: 'Tags', icon: 'label', url: '/tags.html' },
    {
      name: 'Report a bug',
      icon: 'bug_report',
      url: 'https://github.com/refi64/refi64.github.io/issues/new',
    },
  ],
  sections: [
    {
      name: 'Projects',
      icon: 'code',
      items: [{ name: 'Cloverplay', url: 'https://cloverplay.app' }],
    },
    {
      name: 'Links',
      icon: 'link',
      items: [
        { name: 'GitHub', url: 'https://github.com/refi64' },
        { name: 'Twitter', url: 'https://twitter.com/refi_64' },
      ],
    },
  ],
}
