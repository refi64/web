interface WindowWithState extends Window {
  currentState: string
}

declare var window: WindowWithState

enum EventKind {
  LINK,
  HISTORY,
}

// XXX: hardcoding this is ugly
let ourSubPaths = ['posts', 'proj']

export const localNavigateBeginEvent = 'local-navigate-begin'
export const localNavigateCompleteEvent = 'local-navigate-complete'

const navigationInterceptorAttached = Symbol('NavigationInterceptorAttached')

function mergeData(options: {
  from: HTMLElement
  to: HTMLElement
  keys: string[]
}) {
  for (let key of options.keys) {
    console.log(`key: ${options.from.dataset[key]}`)

    let value = options.from.dataset[key]
    if (value) {
      options.to.dataset[key] = value
    } else {
      delete options.to.dataset[key]
    }
  }
}

function mergeTextNode({ from, to }: { from: HTMLElement; to: HTMLElement }) {
  to.innerText = from.innerText
}

function replaceScriptWithSelf(script: HTMLScriptElement) {
  // After merge, no script tags will actually be loaded, so those will need
  // to be re-added manually. We track all the already-loaded ones before
  // anything gets replaced, so later on those don't get reloaded when we
  // re-add the new scripts.
  var replacement = document.createElement('script')
  replacement.textContent = script.textContent

  if (script.src) {
    replacement.src = script.src
  }

  replacement.async = script.async
  script.replaceWith(replacement)
}

function setSubtract(xs: string[], ys: string[]): string[] {
  let ysSet = new Set(ys)
  return xs.filter((x) => !ysSet.has(x))
}

function mapSubtract<T>(
  xs: { [key: string]: T },
  ys: { [key: string]: T }
): { [key: string]: T } {
  return Object.fromEntries(
    setSubtract(Object.keys(xs), Object.keys(ys)).map((x) => [x, xs[x]])
  )
}

function mapOfElements<E extends HTMLElement>(
  key: (E) => string,
  elements: NodeListOf<E>
): { [key: string]: E } {
  return Object.fromEntries(Array.from(elements).map((e) => [key(e), e]))
}

function updateKeyedChildren<E extends HTMLElement>(options: {
  from: HTMLElement
  to: HTMLElement
  selector: string
  key: (e: E) => string
  onAdded?: (e: E) => void
}) {
  let incomingElements = mapOfElements(
    options.key,
    options.from.querySelectorAll(options.selector) as NodeListOf<E>
  )
  let currentlyPresentElements = mapOfElements(
    options.key,
    options.to.querySelectorAll(options.selector) as NodeListOf<E>
  )

  let removed = mapSubtract(currentlyPresentElements, incomingElements)
  let added = mapSubtract(incomingElements, currentlyPresentElements)

  for (let key in removed) {
    console.debug(`removing: ${options.selector} -> ${key}`)
    removed[key].remove()
  }

  for (let key in added) {
    console.debug(`adding: ${options.selector} -> ${key}`)
    options.to.appendChild(added[key])
    if (options.onAdded) {
      options.onAdded(added[key])
    }
  }
}

function mergeHead({
  from,
  to,
  onStylesLoaded,
}: {
  from: HTMLElement
  to: HTMLElement
  onStylesLoaded: () => void
}) {
  mergeTextNode({
    from: from.querySelector('title'),
    to: to.querySelector('title'),
  })

  updateKeyedChildren({
    from,
    to,
    selector: 'script',
    key: (e: HTMLScriptElement) => e.src,
    onAdded: replaceScriptWithSelf,
  })

  let unloadedStyles = new Set()

  for (let rel of ['preload', 'stylesheet']) {
    let onAdded
    if (rel == 'stylesheet') {
      onAdded = (element: HTMLLinkElement) => {
        unloadedStyles.add(element.href)
        element.onload = element.onerror = () => {
          console.log(`removing ${element.href} from ${unloadedStyles}`)
          unloadedStyles.delete(element.href)
          if (unloadedStyles.size == 0) {
            onStylesLoaded()
          }
        }
      }
    }

    updateKeyedChildren({
      from,
      to,
      selector: `link[rel=${rel}]`,
      key: (e: HTMLLinkElement) => e.href,
      onAdded: onAdded,
    })
  }

  if (unloadedStyles.size == 0) {
    onStylesLoaded()
  }
}

async function localNavigateTo(target: string, kind: EventKind) {
  document.dispatchEvent(new Event(localNavigateBeginEvent))

  if (kind == EventKind.LINK) {
    console.debug(`pushState ${target}`)
    window.history.pushState(target, '', target)
  }

  window.currentState = target

  let resp = await fetch(target, { cache: 'no-cache' })
  if (resp.status != 200) {
    // Fall back.
    throw Error('navigation failure')
  }

  let html = await resp.text()

  let parser = new DOMParser()
  let newDoc = parser.parseFromString(html, 'text/html')
  let newContent: HTMLElement = newDoc.querySelector('.page-content')

  document.querySelector('.page-content').replaceWith(newContent)
  attachNavigationInterceptorsTo(newContent)

  mergeData({ from: newDoc.body, to: document.body, keys: ['features'] })

  mergeTextNode({
    from: newDoc.querySelector('.side-title'),
    to: document.querySelector('.side-title'),
  })

  mergeHead({
    from: newDoc.head,
    to: document.head,
    onStylesLoaded: () => {
      document.dispatchEvent(new Event(localNavigateCompleteEvent))
    },
  })

  document.body.querySelectorAll('script').forEach(replaceScriptWithSelf)

  if (kind == EventKind.LINK) {
    if (target.includes('#')) {
      document
        .querySelector(target.substring(target.lastIndexOf('#')))
        ?.scrollIntoView()
    } else {
      window.scrollTo(0, 0)
    }
  }
}

function navigateTo(target: string, event: Event, kind: EventKind) {
  let originPrefix = `${window.location.origin}/`
  if (!target.startsWith(originPrefix)) {
    return
  }

  let path = target.substr(originPrefix.length)
  let splitIdx = path.indexOf('/')
  console.debug(
    `<${path.split('#', 1)[0]}> -> <${window.location.pathname.substr(
      1
    )}> (${kind})`
  )
  // Support fast navigation to paths on the root *or* in a supported subpath.
  // Also make sure it's not scrolling to something on the page we're already on,
  // and that it's an HTML file (including the index).
  if (
    (splitIdx == -1 || ourSubPaths.includes(path.substr(0, splitIdx))) &&
    (kind == EventKind.LINK
      ? path.split('#', 1)[0] != window.location.pathname.substr(1)
      : true) &&
    (path.length == 0 ||
      target.endsWith('.html') ||
      target.indexOf('.html#') != -1)
  ) {
    event.preventDefault()
    localNavigateTo(target, kind)
      .then(() => {})
      .catch(() => {
        // On error, fall back to classic navigation.
        window.location.href = target
      })
  }
}

function attachNavigationInterceptorsTo(el: Element) {
  el.querySelectorAll('a:not(.lightbox)').forEach((el: HTMLAnchorElement) => {
    if (el[navigationInterceptorAttached]) {
      return
    }

    el.addEventListener('click', (event) => {
      if (el.href) {
        navigateTo(el.href, event, EventKind.LINK)
      }
    })

    el[navigationInterceptorAttached] = true
  })
}

export function attachNavigationInterceptors() {
  history.replaceState(location.pathname, location.href)
  window.currentState = location.pathname

  attachNavigationInterceptorsTo(document.body)

  window.addEventListener('popstate', (event: PopStateEvent) => {
    // Don't bother going in if the previous path is identical, or this wasn't a navigation done by JS.
    console.debug(`popstate: ${window.currentState} -> ${event.state}`)
    if (
      event.state === null ||
      event.state === window.currentState ||
      event.state.tobii === 'close'
    ) {
      console.debug('Skipping this popstate')
      return
    }

    navigateTo(window.location.href, event, EventKind.HISTORY)
  })
}
