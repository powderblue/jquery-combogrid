/* global jQuery */
/*
 * jQuery UI Menu (not officially released)
 *
 * This widget isn't yet finished and the API is subject to change. We plan to finish
 * it for the next release. You're welcome to give it a try anyway and give us feedback,
 * as long as you're okay with migrating your code later on. We can help with that, too.
 *
 * Copyright 2010, AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * http://docs.jquery.com/UI/Menu
 *
 * Depends:
 *  jquery.ui.core.js
 *  jquery.ui.widget.js
 */

jQuery.widget('cg.menucombo', {
  _create: function () {
    const self = this
    this.element
      .addClass('cg-menu ui-widget ui-widget-content ui-corner-all combogrid')
      .attr({
        role: 'listbox',
        'aria-activedescendant': 'ui-active-menuitem'
      })
      .click(function (event) {
        if (!jQuery(event.target).closest('.cg-menu-item div').length) {
          return
        }
        // temporary
        event.preventDefault()
        self.select(event)
      })
    this.refresh()
  },

  refresh: function () {
    const self = this

    // don't refresh list items that are already adapted
    const items = this.element.children('div:not(.cg-menu-item):not(#cg-divHeader):not(.cg-comboButton):has(div)')
      .addClass('cg-menu-item')
      .attr('role', 'menuitem')

    items.children('div')
      .addClass('ui-corner-all')
      .attr('tabindex', -1)
      // mouseenter doesn't work with event delegation
      .mouseenter(function (event) {
        self.activate(event, jQuery(this).parent())
      })
      .mouseleave(function () {
        self.deactivate()
      })
  },

  activate: function (event, item) {
    this.deactivate()
    if (this.hasScroll()) {
      const offset = item.offset().top - this.element.offset().top
      const scroll = this.element.attr('scrollTop')
      const elementHeight = this.element.height()
      if (offset < 0) {
        this.element.attr('scrollTop', scroll + offset)
      } else if (offset >= elementHeight) {
        this.element.attr('scrollTop', scroll + offset - elementHeight + item.height())
      }
    }
    this.active = item.eq(0)
      .addClass('ui-state-hover')
      .attr('id', 'ui-active-menuitem')
      .end()
    this._trigger('focus', event, { item })
  },

  deactivate: function () {
    if (!this.active) { return }
    this.active
      .removeClass('ui-state-hover')
      .removeAttr('id')
    this._trigger('blur')
    this.active = null
  },

  next: function (event) {
    this.move('next', '.cg-menu-item:first', event)
  },

  previous: function (event) {
    this.move('prev', '.cg-menu-item:last', event)
  },

  first: function () {
    return this.active && !this.active.prevAll('.cg-menu-item').length
  },

  last: function () {
    return this.active && !this.active.nextAll('.cg-menu-item').length
  },

  move: function (direction, edge, event) {
    if (!this.active) {
      this.activate(event, this.element.children(edge))
      return
    }
    const next = this.active[direction + 'All']('.cg-menu-item').eq(0)
    if (next.length) {
      this.activate(event, next)
    } else {
      this.activate(event, this.element.children(edge))
    }
  },

  // @todo merge with previousPage
  nextPage: function (event) {
    if (this.hasScroll()) {
      // @todo merge with no-scroll-else
      if (!this.active || this.last()) {
        this.activate(event, this.element.children('.cg-menu-item:first'))
        return
      }

      const base = this.active.offset().top
      const height = this.element.height()

      let result = this.element.children('.cg-menu-item').filter(function () {
        const close = jQuery(this).offset().top - base - height + jQuery(this).height()
        // @todo improve approximation
        return close < 10 && close > -10
      })

      // @todo try to catch this earlier when scrollTop indicates the last page anyway
      if (!result.length) {
        result = this.element.children('.cg-menu-item:last')
      }
      this.activate(event, result)
    } else {
      this.activate(event, this.element.children('.cg-menu-item')
        .filter(!this.active || this.last() ? ':first' : ':last'))
    }
  },

  // @todo merge with nextPage
  previousPage: function (event) {
    if (this.hasScroll()) {
      // @todo merge with no-scroll-else
      if (!this.active || this.first()) {
        this.activate(event, this.element.children('.cg-menu-item:last'))
        return
      }

      const base = this.active.offset().top
      const height = this.element.height()

      let result = this.element.children('.cg-menu-item').filter(function () {
        const close = jQuery(this).offset().top - base + height - jQuery(this).height()
        // @todo improve approximation
        return close < 10 && close > -10
      })

      // @todo try to catch this earlier when scrollTop indicates the last page anyway
      if (!result.length) {
        result = this.element.children('.cg-menu-item:first')
      }
      this.activate(event, result)
    } else {
      this.activate(event, this.element.children('.cg-menu-item')
        .filter(!this.active || this.first() ? ':last' : ':first'))
    }
  },

  hasScroll: function () {
    return this.element.height() < this.element.attr('scrollHeight')
  },

  select: function (event) {
    this._trigger('selected', event, { item: this.active })
  }
})
