import * as dom from './dom'
import { MDCChipSet, MDCChipSelectionEvent } from '@material/chips'

function attachChips(content: HTMLElement) {
  const chipIdPrefix = 'chip-'
  const matchesAttr = 'data-matches'

  function onChipSelection(_event: MDCChipSelectionEvent) {
    let selectedTags = Array.from(
      content.querySelectorAll('.mdc-chip--selected')
    ).map((chip) => chip.id.substr(chipIdPrefix.length))

    content.querySelectorAll(`[${matchesAttr}]`).forEach((el: HTMLElement) => {
      el.removeAttribute(matchesAttr)
      el.style.display = 'none'
    })

    let selector = selectedTags.map((tag) => `.tag-${tag}`).join('')
    content.querySelectorAll(selector).forEach((el: HTMLElement) => {
      el.setAttribute(matchesAttr, '')
      el.style.display = 'initial'
    })
  }

  let chipSet = dom.attachToElement(
    MDCChipSet,
    content.querySelector('.mdc-chip-set')
  )
  chipSet.listen('MDCChip:selection', onChipSelection)

  if (window.location.hash.length > 1) {
    for (let tag of window.location.hash.substr(1).split(' ')) {
      let chipId = chipIdPrefix + tag
      let chip = chipSet.chips.find((chip) => chip.id == chipId)
      if (chip) {
        // XXX: setting the selected state messes everything up
        let root = chip.root as HTMLElement
        root.click()
      }
    }
  }
}

dom.attachDomCallbacks('tags', { onPageLoad: attachChips })
