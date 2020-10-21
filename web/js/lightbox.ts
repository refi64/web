// @ts-ignore
import Tobii from 'tobii'
import interact from 'interactjs'
import * as dom from './dom'

type Tobii = {
  destroy(): void
  on(event: string, callback: () => void): void

  next(): void
  previous(): void
}
let tobii: Tobii

interface Segment {
  value: number
  length: number
}

function inInclusiveRange(x: number, left: number, right: number): boolean {
  return x >= left && x <= right
}

function inAxisRange(a: Segment, b: Segment) {
  return (
    inInclusiveRange(a.value, b.value, b.value + b.length) ||
    inInclusiveRange(b.value, a.value, a.value + a.length)
  )
}

function doRectsIntersect(
  a: DOMRect,
  b: DOMRect,
  axes: { x: boolean; y: boolean } = { x: true, y: true }
) {
  return (
    (axes.x
      ? inAxisRange(
          { value: a.x, length: a.width },
          { value: b.x, length: b.width }
        )
      : true) &&
    (axes.y
      ? inAxisRange(
          { value: a.y, length: a.height },
          { value: b.y, length: b.height }
        )
      : true)
  )
}

function scaleRect(r: DOMRect, factor: number): DOMRect {
  let newWidth = r.width * factor
  let newHeight = r.height * factor

  let totalXOffset = r.width - newWidth
  let totalYOffset = r.height - newHeight

  return DOMRect.fromRect({
    x: r.x + totalXOffset / 2,
    y: r.y + totalYOffset / 2,
    width: newWidth,
    height: newHeight,
  })
}

type GestureState = {
  scale: number
  translate: { x: number; y: number }
}

function createEmptyState() {
  return { scale: 1, translate: { x: 0, y: 0 } }
}

function saveState(element: HTMLElement, state: GestureState) {
  element.dataset.gestures = JSON.stringify(state)
}

function loadState(element: HTMLElement): GestureState {
  if (element.dataset.gestures) {
    return JSON.parse(element.dataset.gestures)
  } else {
    return createEmptyState()
  }
}

function updateState(
  element: HTMLElement,
  updater: (state: GestureState) => void
) {
  let state = loadState(element)
  updater(state)
  saveState(element, state)
}

function animateOnce(element: HTMLElement, callback: () => void) {
  element.style.transition = 'transform 0.5s'
  requestAnimationFrame(() => {
    callback()
    element.addEventListener(
      'transitionend',
      () => (element.style.transition = ''),
      { once: true }
    )
  })
}

function reset(element: HTMLElement) {
  saveState(element, createEmptyState())
  element.style.transform = ''
}

function resetAnimated(element: HTMLElement) {
  if (element.style.transform) {
    animateOnce(element, () => reset(element))
  }
}

function attachGestures(tobii: Tobii, element: HTMLElement) {
  let lightbox: HTMLElement = element.closest('.tobii')
  let img: HTMLElement = element.querySelector('img')

  let previousTranslate = { x: 0, y: 0 }
  let workingScale = 1

  reset(element)

  function updateElement() {
    let { scale: baseScale, translate } = loadState(element)
    let scale = baseScale * workingScale
    element.style.transform = `scale(${scale}) translate(${translate.x}px, ${translate.y}px)`
  }

  // XXX: The way Tobii works (which is that the lightbox is wide enough to
  // fit all sides, and just hides the others off screen) messes with
  // interact.js's automated bound checks. This means that interact.js's
  // automatic restriction code fails, so we need to restrict it ourselves.
  function readjustIfFallingOffScreen(options?: { enableMoveSlides: boolean }) {
    // Readjust if at least 50% (0.5) of the element is no longer visible.
    let limitFactor = 0.5
    let lightboxRect = lightbox.getBoundingClientRect()
    let criticalLightboxRect = scaleRect(lightboxRect, limitFactor)
    let imageRect = img.getBoundingClientRect()
    if (!doRectsIntersect(criticalLightboxRect, imageRect)) {
      // If this still intersects with the y range, then it only left the x
      // range, meaning that this should be considered a slide transition.
      if (
        options?.enableMoveSlides &&
        doRectsIntersect(criticalLightboxRect, imageRect, { x: false, y: true })
      ) {
        let movedSlides = false

        if (imageRect.x > 0 && element.previousElementSibling) {
          tobii.previous()
          movedSlides = true
        } else if (imageRect.x < 0 && element.nextElementSibling) {
          tobii.next()
          movedSlides = true
        }

        if (movedSlides) {
          // Clear the state as we leave the object.
          previousTranslate = { x: 0, y: 0 }
        }
      }

      updateState(element, (state) => {
        state.translate.x = previousTranslate.x
        state.translate.y = previousTranslate.y
      })

      workingScale = 1
      animateOnce(element, updateElement)
    }
  }

  interact(element)
    .draggable({
      inertia: true,
      listeners: {
        move(event: Interact.DragEvent) {
          if (element.style.transition) {
            return
          }

          console.debug(`drag move: ${event.dx} ${event.dy}`)

          updateState(element, (state) => {
            state.translate.x += event.dx / state.scale
            state.translate.y += event.dy / state.scale
          })

          updateElement()
        },
        end(_event: Interact.DragEvent) {
          readjustIfFallingOffScreen({ enableMoveSlides: true })
          previousTranslate = loadState(element).translate
        },
      },
    })
    .gesturable({
      listeners: {
        move(event: Interact.GestureEvent) {
          if (element.style.transition) {
            return
          }

          workingScale = event.scale
          updateElement()
        },
        end(_event: Interact.GestureEvent) {
          readjustIfFallingOffScreen()

          updateState(element, (state) => (state.scale *= workingScale))
          workingScale = 1
        },
      },
    })
}

function setImageSlideDimensions(slide: HTMLElement) {
  let image: HTMLImageElement = slide.querySelector('img[data-src]')
  if (!image) {
    return
  }

  let origin: HTMLImageElement = document.querySelector(
    `a.lightbox[href="${image.dataset.src}"] picture img`
  )
  if (!origin) {
    console.warn(`Could not find origin for: ${image.dataset.src}`)
    return
  }

  if (origin.hasAttribute('width')) {
    image.width = origin.width
  }
  if (origin.hasAttribute('height')) {
    image.height = origin.height
  }
}

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
      tobii = new Tobii({
        captionAttribute: 'title',
        draggable: false,
        swipeClose: false,
      })

      document
        .querySelectorAll('.tobii__slide')
        .forEach(setImageSlideDimensions)

      tobii.on('open', () => {
        document
          .querySelectorAll('.tobii__slide')
          .forEach((e: HTMLElement) => attachGestures(tobii, e))
      })

      for (let event of ['next', 'previous']) {
        tobii.on(event, () => {
          document.querySelectorAll('.tobii__slide').forEach(resetAnimated)
        })
      }
    }
  },

  onLocalNavigateBegin: () => {
    tobii?.destroy()
    tobii = null
  },
})
