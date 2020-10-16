import * as cheerio from 'cheerio'
import * as child_process from 'child_process'
import * as fs from 'fs'

function collapseWhitespace(s: string): string {
  return s
    .replace(/\n/g, ' ')
    .replace(/ {2,}/g, ' ')
    .replace(/^\s+|\s+$/g, '')
}

function convertTextContent(node: Cheerio): string {
  let contents = []

  node.contents().map((_, x) => {
    let $ = cheerio(x)
    // Note: doesn't escape +++
    let escaped = `+++${collapseWhitespace($.text())}+++`

    switch (x.tagName) {
      case 'b':
        contents.push(`**${escaped}**`)
        break
      case 'i':
        contents.push(`__${escaped}__`)
        break
      case 'a':
        contents.push(`link:+++${$.attr('href')}+++[${escaped}]`)
        break
      case 'code':
        contents.push('``' + escaped + '``')
        break
      case 'strike':
        contents.push(`[.strike]#${escaped}#`)
        break
      case null:
        contents.push(escaped)
        break
      default:
        console.log(
          `unknown paragraph tag: ${x.tagName} in ${collapseWhitespace(
            node.html()
          )}`
        )
        break
    }
  })

  return contents.join(' ')
}

function convertChildren(node: Cheerio): string {
  const BLOCK = '--'

  let items: string[] = []
  node.children().map((_, e) => {
    let $ = cheerio(e)

    if ($.attr('id') == 'teaser') {
      items.push(['[#teaser]', BLOCK, convertChildren($), BLOCK].join('\n'))
    } else if (e.tagName == 'p') {
      items.push(convertTextContent($))
    } else if (e.tagName == 'link-header') {
      let eq = $.attr('small') !== undefined ? '===' : '=='
      items.push(`[id=${$.attr('id')}]\n${eq} ${collapseWhitespace($.text())}`)
    } else if (e.tagName == 'code' || e.tagName == 'pygments') {
      let open =
        e.tagName == 'pygments' && $.attr('class')
          ? `[source,${$.attr('class')}]`
          : '[source]'

      items.push([open, BLOCK + BLOCK, $.text(), BLOCK + BLOCK].join('\n'))
    } else if (e.tagName == 'ul' || e.tagName == 'ol') {
      let list = []
      let prefix = e.tagName == 'ul' ? '*' : '.'
      $.children('li').each((_, x) => {
        let $$ = cheerio(x)
        if (
          $$.find('p').length ||
          $$.find('ul').length ||
          $$.find('li').length
        ) {
          let inner = convertChildren($$)
          list.push(['+', BLOCK, inner, BLOCK, '+'].join('\n'))
        } else {
          list.push(convertTextContent($$))
        }
      })
      items.push(list.map((x) => `${prefix} ${x}`).join('\n'))
    } else if (e.tagName == 'embedded-image' || e.tagName == 'img') {
      // XXX: No escaping
      let urlAttr = e.tagName == 'img' ? 'src' : 'url'
      items.push(`image::${$.attr(urlAttr)}[${$.attr('alt') || ''}]`)
    } else if (e.tagName == 'warning-card' || e.tagName == 'note-card') {
      let admonition = e.tagName.split('-')[0].toUpperCase()
      let adblock = BLOCK.replace('-', '=')
      items.push(
        [`[${admonition}]`, adblock, convertTextContent($), adblock].join('\n')
      )
    } else if (e.tagName == 'embedded-video') {
      console.log($.attr('url'))
      let [_, id] = $.attr('url').match(/youtube\.com\/embed\/([^"]+)/)
      items.push(`video::${id}[youtube]`)
    } else if (!e.tagName.startsWith('site-')) {
      console.log(
        `unknown: ${e.tagName} in ${collapseWhitespace($.parent().html())}`
      )
    }
  })

  return items.join('\n\n')
}

function main() {
  // XXX
  process.chdir(`${process.env.HOME}/code/web-next`)

  if (!fs.existsSync('migrate/repo')) {
    child_process.execSync(
      'git clone -b sources https://github.com/refi64/refi64.github.io migrate/repo',
      { stdio: 'inherit' }
    )
    child_process.execSync(
      'git -C migrate/repo checkout ca42ec658d2cf439769155133de4585b56bc0cf3',
      { stdio: 'inherit' }
    )
  }

  let oldPostsDir = 'migrate/repo/web/posts'
  let oldPosts = fs.opendirSync(oldPostsDir)
  let dirent: fs.Dirent
  while ((dirent = oldPosts.readSync())) {
    const suffix = '.p.html'
    if (!dirent.name.endsWith(suffix)) {
      throw new Error(dirent.name)
    }

    let name = dirent.name.substr(0, dirent.name.length - suffix.length)
    console.log(name)

    let contents = fs.readFileSync(`${oldPostsDir}/${dirent.name}`, 'utf8')

    const HACKS: { [key: string]: (s: string) => string } = {
      'implementing-a-sort-of-generic-sort-of-type-safe-arrayin-c': (s) =>
        s
          .replace(/(?<=and that is freed.)/, '</p>')
          .replace(/(?<=list_append<\/code>:)/, '</p>'),
      'when-replacing-a-hard-drive': (s) =>
        s.replace(/(?<=look good...)<p>/, '</p>'),
      'the-top-5-programming-languages-youve-never-heard-of': (s) =>
        s.replace(/(?<=Myrddin:)/, '</p>'),
      'hacker-stereotype': (s) => s.replace(/(?<=!)<p>/, '</p>'),
      'web-port': (s) => s.replace(/(?<=link-header id=")dart/, 'js-to-dart'),
    }

    let hack = HACKS[name]
    if (hack) {
      contents = hack(contents)
    }

    let [titleHtml] = contents.match(/<title>(.*)<\/title>/s)
    titleHtml = collapseWhitespace(titleHtml)
    let titleText = cheerio.load(titleHtml)('title').text()

    let [bodyHtml] = contents.match(/<\+@ body>(.*)<\/\+@>/s)
    bodyHtml = bodyHtml.replace(/\+@ body/, 'body').replace(/\+@/, 'body')
    let body = cheerio.load(bodyHtml)('body')

    // console.log(titleText)
    // console.log(bodyHtml)

    let created = body.find('site-title').attr('created-on').split(' ', 1)[0]
    let tags = body.find('site-tags').attr('tags').split(', ')
    let converted = convertChildren(body)
    // console.log(converted)

    let adoc = [
      `# ${titleText}`,
      `:created: ${created}`,
      `:tags: ${tags}`,
      converted,
    ]

    fs.writeFileSync(`web/posts/${name}.adoc`, adoc.join('\n\n'))
  }
}

main()
