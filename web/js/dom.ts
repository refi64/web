import { MDCComponent, MDCFoundation } from '@material/base'
import { localNavigateCompleteEvent, localNavigateBeginEvent } from './navigate'

const mdcSym = Symbol('MDC')

export function getComponent<T extends MDCComponent<MDCFoundation>>(
  el: Element
): T | undefined {
  return el[mdcSym]
}

export function attachToElement<T extends MDCComponent<MDCFoundation>>(
  Cls: new (el: Element) => T,
  el: Element
): T {
  let previous = getComponent<T>(el)
  if (previous) {
    previous.destroy()
  }

  let result = new Cls(el)
  el[mdcSym] = result
  return result
}

export function attachToElementPartial<T extends MDCComponent<MDCFoundation>>(
  Cls: new (el: Element) => T
): (el: Element) => T {
  return (el: Element) => attachToElement(Cls, el)
}

export interface Callbacks {
  onRootLoad?: () => void
  onPageLoad?: (content: HTMLElement) => void

  onLocalNavigateBegin?: () => void
  onLocalNavigateEnd?: () => void
}

export function attachDomCallbacks(feature: string, callbacks: Callbacks) {
  function navigateBeginListener() {
    callbacks.onLocalNavigateBegin()
  }

  function navigateCompleteListener() {
    let usesRemovedFeature = !document.body.dataset.features
      .split(' ')
      .includes(feature)
    if (usesRemovedFeature) {
      document.removeEventListener(
        localNavigateBeginEvent,
        navigateBeginListener
      )

      document.removeEventListener(
        localNavigateCompleteEvent,
        navigateCompleteListener
      )

      return
    }

    if (callbacks.onLocalNavigateEnd) {
      callbacks.onLocalNavigateEnd()
    }

    if (callbacks.onPageLoad) {
      callbacks.onPageLoad(document.querySelector('.page-content'))
    }
  }

  function loaded() {
    document.removeEventListener('DOMContentLoaded', loaded)

    if (callbacks.onRootLoad) {
      callbacks.onRootLoad()
    }

    if (callbacks.onPageLoad) {
      callbacks.onPageLoad(document.querySelector('.page-content'))
    }

    if (callbacks.onLocalNavigateBegin) {
      document.addEventListener(localNavigateBeginEvent, navigateBeginListener)
    }

    if (callbacks.onLocalNavigateEnd || callbacks.onPageLoad) {
      document.addEventListener(
        localNavigateCompleteEvent,
        navigateCompleteListener
      )
    }
  }

  if (
    document.readyState === 'complete' ||
    document.readyState === 'interactive'
  ) {
    loaded()
  } else {
    document.addEventListener('DOMContentLoaded', loaded)
  }
}
