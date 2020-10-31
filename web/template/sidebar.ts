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
      url: 'https://github.com/refi64/web/issues/new',
    },
  ],
  sections: [
    {
      name: 'Projects',
      icon: 'code',
      items: [
        { name: 'nsbox', url: 'https://nsbox.dev/' },
        { name: 'Cloverplay', url: 'https://cloverplay.app' },
        { name: 'XCXSound', url: '/proj/xcxsound.html' },
        { name: 'zdata (old)', url: '/proj/zdata.html' },
      ],
    },
    {
      name: 'Social',
      icon: '6_ft_apart',
      items: [
        { name: 'GitHub', url: 'https://github.com/refi64' },
        { name: 'Twitter', url: 'https://twitter.com/refi_64' },
        {
          name: 'XDA',
          url: 'https://forum.xda-developers.com/member.php?u=5569318',
        },
      ],
    },
  ],
}
