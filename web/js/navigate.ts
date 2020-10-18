// @ts-ignore
import nanomorph from 'nanomorph'

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

  nanomorph(
    document.querySelector('.side-title'),
    newDoc.querySelector('.side-title')
  )

  nanomorph(document.head, newDoc.head)

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

  document.dispatchEvent(new Event(localNavigateCompleteEvent))
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
    // NOTE: nanomorph will not support this!
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
