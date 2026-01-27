/* global jQuery */
/**
 * Copyright 2011 D'Alia Sara
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * Depends:
 *  jquery.ui.core.js
 *  jquery.ui.widget.js
 *  jquery.ui.position.js
 *
 *  jquery.i18n.properties.js
 */

jQuery.widget('cg.combogrid', {
  options: {
    resetButton: false,
    resetFields: null,
    searchButton: false,
    searchIcon: false,
    okIcon: false,
    alternate: false,
    appendTo: 'body',
    autoFocus: false,
    autoChoose: false,
    delayChoose: 300,
    delay: 300,
    rows: 10,
    addClass: null,
    addId: null,
    minLength: 0,
    munit: '%',
    position: {
      my: 'left top',
      at: 'left bottom',
      collision: 'none'
    },
    url: null,
    colModel: null,
    sidx: '',
    sord: '',
    datatype: 'json',
    debug: false,
    i18n: false,
    draggable: false,
    rememberDrag: false,
    replaceNull: false,
    rowsArray: [10, 20, 30],
    showOn: false,
    width: null
  },

  source: null,
  lastOrdered: '',
  cssCol: '',
  pending: 0,
  page: 1,
  rowNumber: 0,
  pos: null,

  _create: function () {
    const self = this
    const doc = this.element[0].ownerDocument
    let suppressKeyPress

    if (self.options.resetButton) {
      this.element.after('<span class="ui-state-default ui-corner-all ' + self.element.attr('id') + ' cg-resetButton"><span class="ui-icon ui-icon-circle-close"></span></span>')

      jQuery('.' + self.element.attr('id') + '.cg-resetButton').on('click.combogrid', function () {
        self.element.val('')
        self.term = self.element.val()

        if (self.options.okIcon) {
          jQuery('.' + self.element.attr('id') + '.ok-icon').remove()
          jQuery('.' + self.element.attr('id') + '.notok-icon').remove()

          if (self.options.resetButton) {
            jQuery('.' + self.element.attr('id') + '.cg-resetButton').after('<span class="' + self.element.attr('id') + ' notok-icon"/>')
          } else if (self.options.searchButton) {
            jQuery('.' + self.element.attr('id') + '.cg-searchButton').after('<span class="' + self.element.attr('id') + ' notok-icon"/>')
          } else {
            self.element.after('<span class="' + self.element.attr('id') + ' notok-icon"/>')
          }
        }

        // keyup trigger leaved for backward compatibility
        self.element.trigger('keyup')

        if (self.options.resetFields != null) {
          jQuery.each(self.options.resetFields, function () {
            jQuery('' + this).val('')
          })
        }
      })
    }

    if (self.options.searchButton) {
      this.element.after('<span class="ui-state-default ui-corner-all ' + self.element.attr('id') + ' cg-searchButton"><span class="ui-icon ui-icon-search"></span></span>')

      jQuery('.' + self.element.attr('id') + '.cg-searchButton').on('click.combogrid', function () {
        self.element.trigger('focus.combogrid')
        self._search(self.element.val())
        self.element.trigger('focus.combogrid')
      })
    }

    if (self.options.showOn) {
      this.element.focus(function () {
        self._search(self.element.val())
      })
    }

    this.element
      .addClass('ui-autocomplete-input')
      .attr('autocomplete', 'off')
      // @todo verify these actually work as intended
      .attr({
        role: 'textbox',
        'aria-autocomplete': 'list',
        'aria-haspopup': 'true'
      })
      .on('keydown.combogrid', function (event) {
        if (self.options.disabled || self.element.attr('readonly')) {
          return
        }

        const widgetClassName = self.element.attr('id')
        const widgetSelector = '.' + widgetClassName
        suppressKeyPress = false
        const keyCode = jQuery.ui.keyCode

        switch (event.keyCode) {
          case keyCode.LEFT:
            jQuery(widgetSelector + '.cg-keynav-prev').trigger('click.combogrid')

            break

          case keyCode.PAGE_UP:
            self._move('previousPage', event)

            break

          case keyCode.RIGHT:
            jQuery(widgetSelector + '.cg-keynav-next').trigger('click.combogrid')

            break

          case keyCode.PAGE_DOWN:
            self._move('nextPage', event)

            break

          case keyCode.UP:
            self._move('previous', event)
            // prevent moving cursor to beginning of text field in some browsers
            event.preventDefault()

            break

          case keyCode.DOWN:
            self._move('next', event)
            // prevent moving cursor to end of text field in some browsers
            event.preventDefault()

            break

          case keyCode.ENTER:
          case keyCode.NUMPAD_ENTER:
            // when menu is open and has focus
            if (self.menucombo.active) {
              // #6055 - Opera still allows the keypress to occur which causes forms to submit
              suppressKeyPress = true
              event.preventDefault()
            }

            // ENTER and TAB both select the current element
            if (!self.menucombo.active) {
              return
            }

            self.menucombo.select(event)

            break

          case keyCode.TAB:
            if (!self.menucombo.active) {
              return
            }

            self.menucombo.select(event)

            break

          case keyCode.DELETE:
            if (self.options.okIcon) {
              jQuery(widgetSelector + '.ok-icon').remove()
              jQuery(widgetSelector + '.notok-icon').remove()

              if (self.options.resetButton) {
                jQuery(widgetSelector + '.cg-resetButton').after('<span class="' + widgetClassName + ' notok-icon"/>')
              } else if (self.options.searchButton) {
                jQuery(widgetSelector + '.cg-searchButton').after('<span class="' + widgetClassName + ' notok-icon"/>')
              } else {
                self.element.after('<span class="' + widgetClassName + ' notok-icon"/>')
              }
            }

            if (self.options.resetFields != null) {
              jQuery.each(self.options.resetFields, function () {
                jQuery('' + this).val('')
              })
            }

            self.element.val('')

            break

          case keyCode.ESCAPE:
            self.element.val(self.term)
            self.close(event)
            // ESCAPE needs this workaround
            jQuery(widgetSelector + '.ok-icon').remove()
            jQuery(widgetSelector + '.notok-icon').remove()

            if (self.options.okIcon) {
              if (self.options.resetButton) {
                jQuery(widgetSelector + '.cg-resetButton').after('<span class="' + widgetClassName + ' ok-icon"/>')
              } else if (self.options.searchButton) {
                jQuery(widgetSelector + '.cg-searchButton').after('<span class="' + widgetClassName + ' ok-icon"/>')
              } else {
                self.element.after(`<span class="${widgetClassName} ok-icon"/>`)
              }
            }

            break

          default:
            if (self.options.okIcon) {
              jQuery(widgetSelector + '.ok-icon').remove()
              jQuery(widgetSelector + '.notok-icon').remove()

              if (self.options.resetButton) {
                jQuery(widgetSelector + '.cg-resetButton').after('<span class="' + widgetClassName + ' notok-icon"/>')
              } else if (self.options.searchButton) {
                jQuery(widgetSelector + '.cg-searchButton').after('<span class="' + widgetClassName + ' notok-icon"/>')
              } else {
                self.element.after('<span class="' + widgetClassName + ' notok-icon"/>')
              }
            }

            // keypress is triggered before the input value is changed
            clearTimeout(self.searching)

            self.searching = setTimeout(function () {
              self.selectedItem = null
              self.search(null, event)
            }, self.options.delay)

            break
        }
      })
      .on('keypress.combogrid', function (event) {
        if (suppressKeyPress) {
          suppressKeyPress = false
          event.preventDefault()
        }
      })
      .on('focus.combogrid', function () {
        if (self.options.disabled) {
          return
        }

        self.selectedItem = null
        self.previous = self.element.val()
      })
      .on('blur.combogrid', function (event) {
        if (self.options.disabled) {
          return
        }

        // preventing from closing when a button trigger a search
        if (self.options.searchButton) {
          if (self.menucombo.element.is(':visible')) {
            clearTimeout(self.searching)

            self.closing = setTimeout(function () {
              self.close(event)
              self._change(event)
            }, 70)
          }
        } else {
          clearTimeout(self.searching)

          // clicks on the menu (or a button to trigger a search) will cause a blur event
          self.closing = setTimeout(function () {
            self.close(event)
            self._change(event)
          }, 150)
        }
      })
    if (this.options.searchIcon) {
      this.element.addClass('input-bg')
    }

    this.options.source = function (request, response) {
      jQuery.ajax({
        url: self.options.url,
        dataType: self.options.datatype,
        data: {
          sidx: self.options.sidx,
          page: self.page,
          sord: self.options.sord,
          rows: self.options.rows,
          searchTerm: request.term
        },
        success: function (data) {
          if (data.records == 0) {
            self.pending--

            if (!self.pending) {
              self.element.removeClass('cg-loading')
              self.close()
            }
          } else if (data.records == 1) {
            response(data.records, data.total, jQuery.map(data.rows, function (item) {
              return item
            }))

            self.menucombo.activate(jQuery.Event({ type: 'mouseenter' }), self.menucombo.element.children('.cg-menu-item:first'))

            if (self.options.autoChoose) {
              setTimeout(function () {
                self.menucombo._trigger('selected', jQuery.Event({ type: 'click' }), { item: self.menucombo.active })
              }, self.options.delayChoose)
            }
          } else {
            response(data.records, data.total, jQuery.map(data.rows, function (item) {
              return item
            }))
          }
        }
      })
    }

    this._initSource()

    this.response = function () {
      return self._response.apply(self, arguments)
    }

    this.menucombo = jQuery('<div/>')
      .addClass('cg-autocomplete')
      .appendTo(jQuery(this.options.appendTo || 'body', doc)[0])
      // prevent the close-on-blur in case of a "slow" click on the menu (long mousedown)
      .on('mousedown', function (event) {
        // clicking on the scrollbar causes focus to shift to the body
        // but we can't detect a mouseup or a click immediately afterward
        // so we have to track the next mousedown and close the menu if
        // the user clicks somewhere outside of the autocomplete
        const menuElement = self.menucombo.element[0]

        if (!jQuery(event.target).closest('.cg-menu-item').length) {
          setTimeout(function () {
            jQuery(document).one('mousedown', function (event) {
              if (event.target !== self.element[0] && event.target !== menuElement && !jQuery.contains(menuElement, event.target)) {
                self.close()
              }
            })
          }, 1)
        }

        // use another timeout to make sure the blur-event-handler on the input was already triggered
        setTimeout(function () {
          clearTimeout(self.closing)
        }, 13)
      })
      .menucombo({
        focus: function (event, ui) {
          const item = ui.item.data('item.combogrid')

          if (self._trigger('focus', event, { item }) !== false) {
            // use value to match what will end up in the input, if it was a key event
            if (/^key/.test(event.originalEvent.type)) {
              if (item.value !== undefined) {
                self.element.val(item.value)
              }
            }
          }
        },

        selected: function (event, ui) {
          const item = ui.item.data('item.combogrid')
          const previous = self.previous

          // only trigger when focus was lost (click on menu)
          if (self.element[0] !== doc.activeElement) {
            if (!self.options.showOn) {
              self.element.focus()
            }

            self.previous = previous

            // #6109 - IE triggers two focus events and the second
            // is asynchronous, so we need to reset the previous
            // term synchronously and asynchronously :-(
            setTimeout(function () {
              self.previous = previous
              self.selectedItem = item
            }, 1)
          }

          if (self._trigger('select', event, { item }) !== false) {
            self.element.val(item.value)
          }

          // reset the term after the select event
          // this allows custom select handling to work properly
          self.term = self.element.val()

          self.close(event)
          self.selectedItem = item

          if (self.options.okIcon) {
            jQuery('.' + self.element.attr('id') + '.ok-icon').remove()
            jQuery('.' + self.element.attr('id') + '.notok-icon').remove()

            if (self.options.resetButton) {
              jQuery('.' + self.element.attr('id') + '.cg-resetButton').after('<span class="' + self.element.attr('id') + ' ok-icon"/>')
            } else if (self.options.searchButton) {
              jQuery('.' + self.element.attr('id') + '.cg-searchButton').after('<span class="' + self.element.attr('id') + ' ok-icon"/>')
            } else {
              self.element.after('<span class="' + self.element.attr('id') + ' ok-icon"/>')
            }
          }
        },

        blur: function (event, ui) {
          // don't set the value of the text field if it's already correct
          // this prevents moving the cursor unnecessarily
          // if (self.menucombo.element.is(':visible') && self.element.val() !== self.term) {
          // }
        }
      })
      .cg_zIndex(this.element.cg_zIndex() + 1)
      // workaround for jQuery bug #5781 http://dev.jquery.com/ticket/5781
      .css({ top: 0, left: 0 })
      .hide()
      .data('cg-menucombo')

    if (this.options.draggable) {
      this.menucombo.element.draggable({
        stop: function (event, ui) {
          self.pos = ui.position
        }
      })
    }

    if (jQuery.fn.bgiframe) {
      this.menucombo.element.bgiframe()
    }

    if (this.options.addClass != null) {
      this.menucombo.element.addClass(this.options.addClass)
    }

    if (this.options.addId != null) {
      this.menucombo.element.attr('id', this.options.addId)
    }
  },

  destroy: function () {
    this.element
      .removeClass('cg-autocomplete-input')
      .removeAttr('autocomplete role aria-autocomplete aria-haspopup')

    this.menucombo.element.remove()
    jQuery.Widget.prototype.destroy.call(this)
  },

  _setOption: function (key, value) {
    jQuery.Widget.prototype._setOption.apply(this, arguments)

    if (key === 'source') {
      this._initSource()
    }

    if (key === 'appendTo') {
      this.menucombo.element.appendTo(jQuery(value || 'body', this.element[0].ownerDocument)[0])
    }

    if (key === 'disabled' && value && this.xhr) {
      this.xhr.abort()
    }
  },

  _initSource: function () {
    const self = this
    let array
    let url

    if (Array.isArray(this.options.source)) {
      array = this.options.source

      this.source = function (request, response) {
        response(jQuery.cg.combogrid.filter(array, request.term))
      }
    } else if (typeof this.options.source === 'string') {
      url = this.options.source

      this.source = function (request, response) {
        if (self.xhr) {
          self.xhr.abort()
        }

        self.xhr = jQuery.ajax({
          url,
          data: request,
          dataType: 'json',
          success: function (data, status, xhr) {
            if (xhr === self.xhr) {
              response(data)
            }

            self.xhr = null
          },
          error: function (xhr) {
            if (xhr === self.xhr) {
              response([])
            }

            self.xhr = null
          }
        })
      }
    } else {
      this.source = this.options.source
    }
  },

  search: function (value, event) {
    value = value != null ? value : this.element.val()
    // reset pagination values on a new term search
    this.page = 1
    this.rows = 10
    // always save the actual value, not the one passed as an argument
    this.term = this.element.val()

    if (value.length < this.options.minLength) {
      return this.close(event)
    }

    clearTimeout(this.closing)

    if (this._trigger('search', event) === false) {
      return
    }

    if (!this.options.searchButton) {
      return this._search(value)
    }
  },

  _search: function (value) {
    this.pending++
    this.element.addClass('cg-loading')

    this.source({ term: value }, this.response)
  },

  _response: function (records, total, content) {
    if (!this.options.disabled && content && content.length) {
      this._suggest(records, total, content)
      this._trigger('open')
    } else {
      this.close()
    }

    this.pending--

    if (!this.pending) {
      this.element.removeClass('cg-loading')
    }
  },

  close: function (event) {
    clearTimeout(this.closing)

    if (!this.menucombo.element.is(':visible')) {
      return
    }

    const widgetSelector = '.' + this.element.attr('id')

    this.menucombo.element.hide()
    this.menucombo.deactivate()

    jQuery()
      .add(widgetSelector + '.cg-keynav-next')
      .add(widgetSelector + '.cg-keynav-prev')
      .add(widgetSelector + '.cg-keynav-last')
      .add(widgetSelector + '.cg-keynav-first')
      .off('click.combogrid')

    if (!this.options.debug) {
      this.menucombo.element.empty()
    }

    // this.options.sidx = this.options.sidx
    this.cssCol = ''
    this.lastOrdered = ''
    this.options.rows = 10

    if (!this.options.rememberDrag) {
      this.pos = null
    }

    this._trigger('close', event)
  },

  _change: function (event) {
    if (this.previous !== this.element.val()) {
      this._trigger('change', event, { item: this.selectedItem })
    }
  },

  _normalize: function (items) {
    // assume all items have the right format when the first item is complete
    if (items.length && items[0].label && items[0].value) {
      return items
    }

    return jQuery.map(items, function (item) {
      if (typeof item === 'string') {
        return {
          label: item,
          value: item
        }
      }

      return jQuery.extend({
        value: JSON.parse(item)
      }, item)
    })
  },

  _suggest: function (records, total, items) {
    const widgetSelector = '.' + this.element.attr('id')
    const ul = this.menucombo.element
      .empty()
      .cg_zIndex(this.element.cg_zIndex() + 1)

    jQuery()
      .add(widgetSelector + '.cg-keynav-next')
      .add(widgetSelector + '.cg-keynav-prev')
      .add(widgetSelector + '.cg-keynav-last')
      .add(widgetSelector + '.cg-keynav-first')
      .add('.cg-colHeader-label')
      .off('click.combogrid')

    this._renderHeader(ul, this.options.colModel)
    this._renderMenu(ul, items, this.options.colModel)
    this._renderPager(ul, records, total)
    // @todo refresh should check if the active item is still in the dom, removing the need for a manual deactivate
    this.menucombo.deactivate()
    this.menucombo.refresh()

    // size and position menu
    ul.show()
    this._resizeMenu()

    if (this.pos == null) {
      ul.position(jQuery.extend({
        of: this.element
      }, this.options.position))
    }

    if (this.options.autoFocus) {
      this.menucombo.next(new jQuery.Event('mouseover'))
    }
  },

  _resizeMenu: function () {
    const ul = this.menucombo.element

    if (this.options.width != null) {
      ul.css('width', this.options.width)
    }
  },

  _renderHeader: function (ul, colModel) {
    const self = this
    const $divHeader = jQuery('<div id="cg-divHeader" class="ui-state-default"/>')

    jQuery.each(colModel, function (index, col) {
      if (col.width == undefined) { col.width = 100 / colModel.length }

      if (col.align == undefined) { col.align = 'center' }

      let hide = ''

      if (col.hidden != undefined && col.hidden) {
        hide = 'display:none;'
        if (col.width != undefined) col.width = 0
      }

      // Check if column is ordered or not to provide asc/desc icon
      if (col.columnName == self.cssCol) {
        $divHeader.append('<div class="cg-colHeader" style="width:' + col.width + self.options.munit + ';' + hide + ' text-align:' + col.align + '"><label class="cg-colHeader-label" id="' + col.columnName + '">' +
          self._renderLabel(col.label) +
          '</label><span class="cg-colHeader ' + self.options.sord + '"></span></div>')
      } else {
        $divHeader.append('<div class="cg-colHeader" style="width:' + col.width + self.options.munit + ';' + hide + ' text-align:' + col.align + '"><label class="cg-colHeader-label" id="' + col.columnName + '">' +
          self._renderLabel(col.label) +
          '</label></div>')
      }
    })

    $divHeader.appendTo(ul)

    if (this.options.draggable) {
      jQuery('#cg-divHeader').css('cursor', 'move')
    }

    jQuery('.cg-colHeader-label').on('click.combogrid', function () {
      self.options.sord = ''
      self.cssCol = ''
      const value = jQuery(this).attr('id')
      self.cssCol = value

      if (self.lastOrdered == value) {
        self.lastOrdered = ''
        self.options.sord = 'desc'
      } else {
        self.lastOrdered = value
        self.options.sord = 'asc'
      }

      self.options.sidx = value
      self._search(self.term)
    })
  },

  _renderLabel: function (label) {
    if (this.options.i18n) {
      return jQuery.i18n.prop(label)
    }

    return label
  },

  _renderMenu: function (ul, items, colModel) {
    jQuery.each(items, (index, item) => {
      this._renderItem(ul, item, colModel)
    })
  },

  _renderItem: function (ul, item, colModel) {
    const self = this
    this.rowNumber++
    const $colItem = jQuery("<div class='cg-colItem'/>")

    jQuery.each(colModel, function (index, col) {
      if (col.width == undefined) { col.width = 100 / colModel.length }
      if (col.align == undefined) { col.align = 'center' }
      let hide = ''

      if (col.hidden != undefined && col.hidden) {
        hide = 'display:none;'
      }

      let colItem

      if (item[col.columnName] != null && typeof item[col.columnName] === 'object') {
        const subItem = item[col.columnName]
        colItem = subItem[col.subName]
      } else if (item[col.columnName] == null && self.options.replaceNull) {
        colItem = ''
      } else {
        colItem = item[col.columnName]
      }

      jQuery("<div style='width:" + col.width + self.options.munit + ';' + hide + ' text-align:' + col.align + "' class='cg-DivItem'>" + colItem + '</div>')
        .appendTo($colItem)
    })

    if (self.options.alternate) {
      if (this.rowNumber % 2 === 0) {
        return jQuery("<div class='cg-comboItem-even'/>").data('item.combogrid', item).append($colItem).appendTo(ul)
      }

      return jQuery("<div class='cg-comboItem-odd'/>").data('item.combogrid', item).append($colItem).appendTo(ul)
    }

    return jQuery("<div class='cg-comboItem'/>").data('item.combogrid', item).append($colItem).appendTo(ul)
  },

  _renderPager: function (ul, records, total) {
    const self = this
    const initRecord = ((self.page * self.options.rows) - self.options.rows) + 1

    const lastRecord = self.page < total
      ? (self.page * self.options.rows)
      : records

    const $comboButton = jQuery("<div class='cg-comboButton ui-state-default'/>")

    jQuery("<table cellspacing='0' cellpadding='0' border='0' class='cg-navTable'>" +
    '<tbody>' +
      "<td align='center' style='white-space: pre; width: 264px;' id='cg-keynav-center'>" +
      "<table cellspacing='0' cellpadding='0' border='0' class='cg-pg-table' style='table-layout: auto;'>" +
      '<tbody>' +
        '<tr>' +
          "<td class='cg-pg-button ui-corner-all cg-state-disabled cg-keynav-first " + self.element.attr('id') + "'>" +
            "<span class='ui-icon ui-icon-seek-first'></span>" +
          '</td>' +
          "<td class='cg-pg-button ui-corner-all cg-state-disabled cg-keynav-prev " + self.element.attr('id') + "'>" +
            "<span class='ui-icon ui-icon-seek-prev'></span>" +
          '</td>' +
          "<td style='width: 4px;' class='cg-state-disabled'>" +
            "<span class='ui-separator'></span>" +
          '</td>' +
          "<td dir='ltr' id='cg-navInfo'>" +
          self._renderPagerPage('page', self.page, total) +
          '</td>' +
          "<td style='width: 4px;' class='cg-state-disabled'>" +
            "<span class='ui-separator'></span>" +
          '</td>' +
          "<td class='cg-pg-button ui-corner-all cg-keynav-next " + self.element.attr('id') + "'>" +
            "<span class='ui-icon ui-icon-seek-next'></span>" +
          '</td>' +
          "<td class='cg-pg-button ui-corner-all cg-keynav-last " + self.element.attr('id') + "'>" +
            "<span class='ui-icon ui-icon-seek-end'></span>" +
          '</td>' +
          // Select page
          "<td dir='ltr'>" +
            "<select class='" + self.element.attr('id') + " recordXP'>" +
            '</select>' +
          '</td>' +
        '</tr>' +
      '</tbody>' +
      '</table>' +
      '</td>' +
      "<td align='right' id='cg-keynav-right'>" +
        "<div class='ui-paging-info' style='text-align: right;' dir='ltr'>" +
        self._renderPagerView('recordtext', initRecord, lastRecord, records) +
        '</div>' +
      '</td>' +
    '</tr>' +
  '</tbody>' +
  '</table>').appendTo($comboButton)

    $comboButton.appendTo(ul)

    jQuery.each(self.options.rowsArray, function (index, value) {
      jQuery('.' + self.element.attr('id') + '.recordXP').append("<option value='" + value + "' role='option'>" + value + '</option>')
    })

    jQuery('.' + self.element.attr('id') + '.recordXP').val(self.options.rows)

    if (self.page > 1) {
      jQuery('.' + self.element.attr('id') + '.cg-keynav-first').removeClass('cg-state-disabled')
      jQuery('.' + self.element.attr('id') + '.cg-keynav-prev').removeClass('cg-state-disabled')
    } else {
      jQuery('.' + self.element.attr('id') + '.cg-keynav-first').addClass('cg-state-disabled')
      jQuery('.' + self.element.attr('id') + '.cg-keynav-prev').addClass('cg-state-disabled')
    };

    if (self.page == total) {
      jQuery('.' + self.element.attr('id') + '.cg-keynav-next').addClass('cg-state-disabled')
      jQuery('.' + self.element.attr('id') + '.cg-keynav-last').addClass('cg-state-disabled')
    };

    jQuery('.' + self.element.attr('id') + '.cg-keynav-next').on('click.combogrid', function () {
      if (self.page < total) {
        self.page++
        self._search(self.term)
      }
    })

    jQuery('.' + self.element.attr('id') + '.cg-keynav-prev').on('click.combogrid', function () {
      if (self.page > 1) {
        self.page--
        self._search(self.term)
      }
    })

    jQuery('.' + self.element.attr('id') + '.cg-keynav-last').on('click.combogrid', function () {
      if (total > 1 && self.page < total) {
        self.page = total
        self._search(self.term)
      }
    })

    jQuery('.' + self.element.attr('id') + '.cg-keynav-first').on('click.combogrid', function () {
      if (total > 1 && self.page > 1) {
        self.page = 1
        self._search(self.term)
      }
    })

    jQuery('.' + self.element.attr('id') + '.currentPage').on('keypress', function (e) {
      const key = e.charCode ? e.charCode : (e.keyCode ? e.keyCode : 0)
      /** @type {string|undefined} */
      const currPageNo = jQuery(this).val()

      if (key === 13) {
        if (!isNaN(currPageNo) && currPageNo !== '0') {
          self.page = currPageNo > total
            ? total
            : currPageNo

          self._search(self.term)
        }
      }
    })

    jQuery('.' + self.element.attr('id') + '.recordXP').on('change', function () {
      self.options.rows = this.value
      self.page = 1
      self._search(self.term)
    })

    return $comboButton
  },

  _renderPagerPage: function (label, page, total) {
    const self = this

    if (this.options.i18n) {
      return jQuery.i18n.prop('page') + ' <input type="text" size="1" class="' + self.element.attr('id') + ' currentPage" value="' + page + '"></input> ' + jQuery.i18n.prop('of') + ' ' + total
    }

    return 'Page <input type="text" size="1" class="' + self.element.attr('id') + ' currentPage" value="' + page + '"></input> of ' + total
  },

  _renderPagerView: function (label, initRecord, lastRecord, records) {
    if (this.options.i18n) {
      return jQuery.i18n.prop(label, initRecord, lastRecord, records)
    }

    return 'View ' + initRecord + ' - ' + lastRecord + ' of ' + records
  },

  _move: function (direction, event) {
    if (!this.menucombo.element.is(':visible')) {
      this.search(null, event)

      return
    }

    if ((this.menucombo.first() && /^previous/.test(direction)) || (this.menucombo.last() && /^next/.test(direction))) {
      this.element.val(this.term)
      this.menucombo.deactivate()

      return
    }

    this.menucombo[direction](event)
  },

  widget: function () {
    return this.menucombo.element
  }
})

// Static methods
jQuery.extend(jQuery.cg.combogrid, {

  /**
   * @private
   * @param {string} value
   * @returns {string}
   */
  escapeRegex: function (value) {
    return value.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
  },

  filter: function (array, term) {
    const matcher = new RegExp(jQuery.cg.combogrid.escapeRegex(term), 'i')

    return jQuery.grep(array, function (value) {
      return matcher.test(value.label || value.value || value)
    })
  }
})
