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
let ourSubPaths = ['posts']

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

  document.querySelector('.page-content').replaceWith(newContent)
  attachNavigationInterceptorsTo(newContent)

  nanomorph(
    document.querySelector('.side-title'),
    newDoc.querySelector('.side-title')
  )
  nanomorph(document.head, newDoc.head)

  if (kind == EventKind.LINK) {
    window.scrollTo(0, 0)
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
  // Also make sure it's not scrolling to something on the page we're already on.
  if (
    (splitIdx == -1 || ourSubPaths.includes(path.substr(0, splitIdx))) &&
    (kind == EventKind.LINK
      ? path.split('#', 1)[0] != window.location.pathname.substr(1)
      : true)
  ) {
    event.preventDefault()
    localNavigateTo(target, kind)
      .then(() => {})
      .catch(() => {
        // On error, fall back to classic navigation.
        // window.location.href = target
      })
  }
}

function attachNavigationInterceptorsTo(el: Element) {
  el.querySelectorAll('a').forEach((el) => {
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
    if (event.state === null || event.state === window.currentState) {
      return
    }

    navigateTo(window.location.href, event, EventKind.HISTORY)
  })
}
