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

function mergeTextNode({ from, to }: { from: HTMLElement; to: HTMLElement }) {
  to.innerText = from.innerText
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
  let oldElements = mapOfElements(
    options.key,
    options.from.querySelectorAll(options.selector) as NodeListOf<E>
  )
  let newElements = mapOfElements(
    options.key,
    options.to.querySelectorAll(options.selector) as NodeListOf<E>
  )

  let removed = mapSubtract(oldElements, newElements)
  let added = mapSubtract(newElements, oldElements)

  for (let key in removed) {
    console.debug(`removing: ${options.selector} -> ${key}`)
    removed[key].remove()
  }

  for (let key in added) {
    console.debug(`adding: ${options.selector} -> ${key}`)
    options.from.appendChild(added[key])
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
  })

  let unloadedStyles = new Set()

  for (let rel of ['preload', 'stylesheet']) {
    let onAdded
    if (rel == 'stylesheet') {
      onAdded = (element: HTMLLinkElement) => {
        unloadedStyles.add(element.href)
        element.onload = element.onerror = () => {
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

  let resp = await fetch(target)
  if (resp.status != 200) {
    // Fall back.
    throw Error('navigation failure')
  }

  let html = await resp.text()

  let parser = new DOMParser()
  let newDoc = parser.parseFromString(html, 'text/html')
  let newContent: HTMLElement = newDoc.querySelector('.page-content')

  // After morph, no script tags will actually be loaded, so those will need
  // to be re-added manually. We track all the already-loaded ones before
  // anything gets replaced, so later on those don't get reloaded when we
  // re-add the new scripts.
  let alreadyLoadedScripts = Array.from(document.querySelectorAll('script'))
    .map((el) => el.src)
    .filter((src) => src)

  document.querySelector('.page-content').replaceWith(newContent)
  attachNavigationInterceptorsTo(newContent)

  mergeTextNode({
    from: document.querySelector('.side-title'),
    to: newDoc.querySelector('.side-title'),
  })

  mergeHead({
    from: document.head,
    to: newDoc.head,
    onStylesLoaded: () => {
      document.dispatchEvent(new Event(localNavigateCompleteEvent))
    },
  })

  document.querySelectorAll('script').forEach((el) => {
    if (el.src && alreadyLoadedScripts.includes(el.src)) {
      console.debug(`skipping ${el.src} because it's already loaded`)
      return
    }

    var newEl = document.createElement('script')
    newEl.textContent = el.textContent

    if (el.src) {
      newEl.src = el.src
    }

    newEl.async = el.async
    el.replaceWith(newEl)
  })

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
