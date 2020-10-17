// @ts-ignore
import Tobii from 'tobii'
import * as dom from './dom'

let tobii: { init: () => void; reset: () => void }
let firstPage = true

dom.attachDomCallbacks({
  onRootLoad: () => {
    tobii = new Tobii({ captionAttribute: 'title' })
  },

  onPageLoad: () => {
    if (firstPage) {
      firstPage = false
      return
    }

    tobii.init()
  },

  onLocalNavigateBegin: () => {
    tobii.reset()
  },
})
