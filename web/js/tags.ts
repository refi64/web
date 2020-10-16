import * as dom from './dom'
import {
  MDCChipSet,
  MDCChipSelectionEvent,
  MDCChipSelectionEventDetail,
} from '@material/chips'

function attachChips(content: HTMLElement) {
  const chipIdPrefix = 'chip-'

  function onChipSelection(event: MDCChipSelectionEvent) {
    // Remove chip- prefix.
    const { chipId, selected } = event.detail
    if (!chipId.startsWith(chipIdPrefix)) {
      throw new Error(`Unexpected chip ID ${chipId}`)
    }

    let tag = chipId.substr(chipIdPrefix.length)
    content.querySelectorAll(`.tag-${tag}`).forEach((el: HTMLElement) => {
      let diff = selected ? 1 : -1
      const matchesAttr = 'data-matches'

      let prevMatches = parseInt(el.getAttribute(matchesAttr) || '0')
      console.log(el.getAttribute(matchesAttr) || '0')
      let newMatches = prevMatches + diff

      el.setAttribute(matchesAttr, newMatches.toString())
      el.style.display = newMatches ? 'initial' : 'none'
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

dom.attachDomCallbacks(
  { onPageLoad: attachChips },
  { restrictPath: '/tags.html' }
)
