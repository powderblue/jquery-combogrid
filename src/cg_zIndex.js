/* global jQuery */
// removed jQueryUI .zIndex() replacement
// See http://jqueryui.com/changelog/1.12.0
jQuery.fn.cg_zIndex = function (zIndex) {
  if (zIndex !== undefined) {
    return this.css('zIndex', zIndex)
  }

  if (this.length) {
    let elem = jQuery(this[0])
    let position
    let value

    while (elem.length && elem[0] !== document) {
      // Ignore z-index if position is set to a value where z-index is ignored by the browser
      // This makes behavior of this function consistent across browsers
      // WebKit always returns auto if the element is positioned
      position = elem.css('position')

      if (position === 'absolute' || position === 'relative' || position === 'fixed') {
        // IE returns 0 when zIndex is not specified
        // other browsers return a string
        // we ignore the case of nested elements with an explicit value of 0
        // <div style="z-index: -10;"><div style="z-index: 0;"></div></div>
        value = parseInt(elem.css('zIndex'), 10)

        if (!isNaN(value) && value !== 0) {
          return value
        }
      }

      elem = elem.parent()
    }
  }

  return 0
}
