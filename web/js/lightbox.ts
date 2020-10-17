// @ts-ignore
import Tobii from 'tobii'
import * as dom from './dom'

let tobii: { destroy: () => void }
let firstPage = true

function updateTobiiLinks() {
  document
    .querySelectorAll('.lightbox picture img')
    .forEach((img: HTMLImageElement) => {
      let lightbox: HTMLAnchorElement = img.closest('.lightbox')
      lightbox.href = img.currentSrc
    })
}

dom.attachDomCallbacks({
  onPageLoad: () => {
    updateTobiiLinks()
    if (document.querySelector('.lightbox')) {
      tobii = new Tobii({ captionAttribute: 'title' })
    }
  },

  onLocalNavigateBegin: () => {
    tobii?.destroy()
    tobii = null
  },
})
