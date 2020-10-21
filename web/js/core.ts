// TODO: adjust wrapFocus on resize

import { MDCDrawer } from '@material/drawer'
import { MDCList } from '@material/list'
import { MDCRipple } from '@material/ripple'
import { MDCTopAppBar } from '@material/top-app-bar'
import { attachNavigationInterceptors } from './navigate'
import * as dom from './dom'

function attachToPersistentElements() {
  let drawerEl = document.querySelector('.mdc-drawer')
  let drawer = dom.attachToElement(MDCDrawer, drawerEl)

  let topAppBar = dom.attachToElement(
    MDCTopAppBar,
    document.querySelector('.mdc-top-app-bar')
  )
  topAppBar.listen('MDCTopAppBar:nav', () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }

    drawer.open = !drawer.open
  })

  let listEl = drawerEl.querySelector('.mdc-list')
  let list = dom.attachToElement(MDCList, listEl)
  list.wrapFocus = true
  list.listElements.forEach(dom.attachToElementPartial(MDCRipple))

  attachNavigationInterceptors()
}

function attachToChangingElements(content: HTMLElement) {
  Array.from(content.querySelectorAll('.mdc-icon-button'))
    .map(dom.attachToElementPartial(MDCRipple))
    .forEach((el) => (el.unbounded = true))
}

dom.attachDomCallbacks({
  onRootLoad: attachToPersistentElements,
  onPageLoad: (content: HTMLElement) => {
    attachToChangingElements(content)
  },

  onLocalNavigateBegin: () => {
    let drawer = dom.getComponent<MDCDrawer>(
      document.querySelector('.mdc-drawer')
    )
    if (drawer) {
      drawer.open = false
    }

    document.querySelector('.loading').classList.add('loading-active')
  },

  onLocalNavigateEnd: () => {
    requestAnimationFrame(() => {
      document.querySelector('.loading').classList.remove('loading-active')
    })
  },
})
