'use strict';

!function ($) {

  "use strict";

  var FOUNDATION_VERSION = '6.3.1';

  // Global Foundation object
  // This is attached to the window, or used as a module for AMD/Browserify
  var Foundation = {
    version: FOUNDATION_VERSION,

    /**
     * Stores initialized plugins.
     */
    _plugins: {},

    /**
     * Stores generated unique ids for plugin instances
     */
    _uuids: [],

    /**
     * Returns a boolean for RTL support
     */
    rtl: function () {
      return $('html').attr('dir') === 'rtl';
    },
    /**
     * Defines a Foundation plugin, adding it to the `Foundation` namespace and the list of plugins to initialize when reflowing.
     * @param {Object} plugin - The constructor of the plugin.
     */
    plugin: function (plugin, name) {
      // Object key to use when adding to global Foundation object
      // Examples: Foundation.Reveal, Foundation.OffCanvas
      var className = name || functionName(plugin);
      // Object key to use when storing the plugin, also used to create the identifying data attribute for the plugin
      // Examples: data-reveal, data-off-canvas
      var attrName = hyphenate(className);

      // Add to the Foundation object and the plugins list (for reflowing)
      this._plugins[attrName] = this[className] = plugin;
    },
    /**
     * @function
     * Populates the _uuids array with pointers to each individual plugin instance.
     * Adds the `zfPlugin` data-attribute to programmatically created plugins to allow use of $(selector).foundation(method) calls.
     * Also fires the initialization event for each plugin, consolidating repetitive code.
     * @param {Object} plugin - an instance of a plugin, usually `this` in context.
     * @param {String} name - the name of the plugin, passed as a camelCased string.
     * @fires Plugin#init
     */
    registerPlugin: function (plugin, name) {
      var pluginName = name ? hyphenate(name) : functionName(plugin.constructor).toLowerCase();
      plugin.uuid = this.GetYoDigits(6, pluginName);

      if (!plugin.$element.attr('data-' + pluginName)) {
        plugin.$element.attr('data-' + pluginName, plugin.uuid);
      }
      if (!plugin.$element.data('zfPlugin')) {
        plugin.$element.data('zfPlugin', plugin);
      }
      /**
       * Fires when the plugin has initialized.
       * @event Plugin#init
       */
      plugin.$element.trigger('init.zf.' + pluginName);

      this._uuids.push(plugin.uuid);

      return;
    },
    /**
     * @function
     * Removes the plugins uuid from the _uuids array.
     * Removes the zfPlugin data attribute, as well as the data-plugin-name attribute.
     * Also fires the destroyed event for the plugin, consolidating repetitive code.
     * @param {Object} plugin - an instance of a plugin, usually `this` in context.
     * @fires Plugin#destroyed
     */
    unregisterPlugin: function (plugin) {
      var pluginName = hyphenate(functionName(plugin.$element.data('zfPlugin').constructor));

      this._uuids.splice(this._uuids.indexOf(plugin.uuid), 1);
      plugin.$element.removeAttr('data-' + pluginName).removeData('zfPlugin')
      /**
       * Fires when the plugin has been destroyed.
       * @event Plugin#destroyed
       */
      .trigger('destroyed.zf.' + pluginName);
      for (var prop in plugin) {
        plugin[prop] = null; //clean up script to prep for garbage collection.
      }
      return;
    },

    /**
     * @function
     * Causes one or more active plugins to re-initialize, resetting event listeners, recalculating positions, etc.
     * @param {String} plugins - optional string of an individual plugin key, attained by calling `$(element).data('pluginName')`, or string of a plugin class i.e. `'dropdown'`
     * @default If no argument is passed, reflow all currently active plugins.
     */
    reInit: function (plugins) {
      var isJQ = plugins instanceof $;
      try {
        if (isJQ) {
          plugins.each(function () {
            $(this).data('zfPlugin')._init();
          });
        } else {
          var type = typeof plugins,
              _this = this,
              fns = {
            'object': function (plgs) {
              plgs.forEach(function (p) {
                p = hyphenate(p);
                $('[data-' + p + ']').foundation('_init');
              });
            },
            'string': function () {
              plugins = hyphenate(plugins);
              $('[data-' + plugins + ']').foundation('_init');
            },
            'undefined': function () {
              this['object'](Object.keys(_this._plugins));
            }
          };
          fns[type](plugins);
        }
      } catch (err) {
        console.error(err);
      } finally {
        return plugins;
      }
    },

    /**
     * returns a random base-36 uid with namespacing
     * @function
     * @param {Number} length - number of random base-36 digits desired. Increase for more random strings.
     * @param {String} namespace - name of plugin to be incorporated in uid, optional.
     * @default {String} '' - if no plugin name is provided, nothing is appended to the uid.
     * @returns {String} - unique id
     */
    GetYoDigits: function (length, namespace) {
      length = length || 6;
      return Math.round(Math.pow(36, length + 1) - Math.random() * Math.pow(36, length)).toString(36).slice(1) + (namespace ? '-' + namespace : '');
    },
    /**
     * Initialize plugins on any elements within `elem` (and `elem` itself) that aren't already initialized.
     * @param {Object} elem - jQuery object containing the element to check inside. Also checks the element itself, unless it's the `document` object.
     * @param {String|Array} plugins - A list of plugins to initialize. Leave this out to initialize everything.
     */
    reflow: function (elem, plugins) {

      // If plugins is undefined, just grab everything
      if (typeof plugins === 'undefined') {
        plugins = Object.keys(this._plugins);
      }
      // If plugins is a string, convert it to an array with one item
      else if (typeof plugins === 'string') {
          plugins = [plugins];
        }

      var _this = this;

      // Iterate through each plugin
      $.each(plugins, function (i, name) {
        // Get the current plugin
        var plugin = _this._plugins[name];

        // Localize the search to all elements inside elem, as well as elem itself, unless elem === document
        var $elem = $(elem).find('[data-' + name + ']').addBack('[data-' + name + ']');

        // For each plugin found, initialize it
        $elem.each(function () {
          var $el = $(this),
              opts = {};
          // Don't double-dip on plugins
          if ($el.data('zfPlugin')) {
            console.warn("Tried to initialize " + name + " on an element that already has a Foundation plugin.");
            return;
          }

          if ($el.attr('data-options')) {
            var thing = $el.attr('data-options').split(';').forEach(function (e, i) {
              var opt = e.split(':').map(function (el) {
                return el.trim();
              });
              if (opt[0]) opts[opt[0]] = parseValue(opt[1]);
            });
          }
          try {
            $el.data('zfPlugin', new plugin($(this), opts));
          } catch (er) {
            console.error(er);
          } finally {
            return;
          }
        });
      });
    },
    getFnName: functionName,
    transitionend: function ($elem) {
      var transitions = {
        'transition': 'transitionend',
        'WebkitTransition': 'webkitTransitionEnd',
        'MozTransition': 'transitionend',
        'OTransition': 'otransitionend'
      };
      var elem = document.createElement('div'),
          end;

      for (var t in transitions) {
        if (typeof elem.style[t] !== 'undefined') {
          end = transitions[t];
        }
      }
      if (end) {
        return end;
      } else {
        end = setTimeout(function () {
          $elem.triggerHandler('transitionend', [$elem]);
        }, 1);
        return 'transitionend';
      }
    }
  };

  Foundation.util = {
    /**
     * Function for applying a debounce effect to a function call.
     * @function
     * @param {Function} func - Function to be called at end of timeout.
     * @param {Number} delay - Time in ms to delay the call of `func`.
     * @returns function
     */
    throttle: function (func, delay) {
      var timer = null;

      return function () {
        var context = this,
            args = arguments;

        if (timer === null) {
          timer = setTimeout(function () {
            func.apply(context, args);
            timer = null;
          }, delay);
        }
      };
    }
  };

  // TODO: consider not making this a jQuery function
  // TODO: need way to reflow vs. re-initialize
  /**
   * The Foundation jQuery method.
   * @param {String|Array} method - An action to perform on the current jQuery object.
   */
  var foundation = function (method) {
    var type = typeof method,
        $meta = $('meta.foundation-mq'),
        $noJS = $('.no-js');

    if (!$meta.length) {
      $('<meta class="foundation-mq">').appendTo(document.head);
    }
    if ($noJS.length) {
      $noJS.removeClass('no-js');
    }

    if (type === 'undefined') {
      //needs to initialize the Foundation object, or an individual plugin.
      Foundation.MediaQuery._init();
      Foundation.reflow(this);
    } else if (type === 'string') {
      //an individual method to invoke on a plugin or group of plugins
      var args = Array.prototype.slice.call(arguments, 1); //collect all the arguments, if necessary
      var plugClass = this.data('zfPlugin'); //determine the class of plugin

      if (plugClass !== undefined && plugClass[method] !== undefined) {
        //make sure both the class and method exist
        if (this.length === 1) {
          //if there's only one, call it directly.
          plugClass[method].apply(plugClass, args);
        } else {
          this.each(function (i, el) {
            //otherwise loop through the jQuery collection and invoke the method on each
            plugClass[method].apply($(el).data('zfPlugin'), args);
          });
        }
      } else {
        //error for no class or no method
        throw new ReferenceError("We're sorry, '" + method + "' is not an available method for " + (plugClass ? functionName(plugClass) : 'this element') + '.');
      }
    } else {
      //error for invalid argument type
      throw new TypeError('We\'re sorry, ' + type + ' is not a valid parameter. You must use a string representing the method you wish to invoke.');
    }
    return this;
  };

  window.Foundation = Foundation;
  $.fn.foundation = foundation;

  // Polyfill for requestAnimationFrame
  (function () {
    if (!Date.now || !window.Date.now) window.Date.now = Date.now = function () {
      return new Date().getTime();
    };

    var vendors = ['webkit', 'moz'];
    for (var i = 0; i < vendors.length && !window.requestAnimationFrame; ++i) {
      var vp = vendors[i];
      window.requestAnimationFrame = window[vp + 'RequestAnimationFrame'];
      window.cancelAnimationFrame = window[vp + 'CancelAnimationFrame'] || window[vp + 'CancelRequestAnimationFrame'];
    }
    if (/iP(ad|hone|od).*OS 6/.test(window.navigator.userAgent) || !window.requestAnimationFrame || !window.cancelAnimationFrame) {
      var lastTime = 0;
      window.requestAnimationFrame = function (callback) {
        var now = Date.now();
        var nextTime = Math.max(lastTime + 16, now);
        return setTimeout(function () {
          callback(lastTime = nextTime);
        }, nextTime - now);
      };
      window.cancelAnimationFrame = clearTimeout;
    }
    /**
     * Polyfill for performance.now, required by rAF
     */
    if (!window.performance || !window.performance.now) {
      window.performance = {
        start: Date.now(),
        now: function () {
          return Date.now() - this.start;
        }
      };
    }
  })();
  if (!Function.prototype.bind) {
    Function.prototype.bind = function (oThis) {
      if (typeof this !== 'function') {
        // closest thing possible to the ECMAScript 5
        // internal IsCallable function
        throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
      }

      var aArgs = Array.prototype.slice.call(arguments, 1),
          fToBind = this,
          fNOP = function () {},
          fBound = function () {
        return fToBind.apply(this instanceof fNOP ? this : oThis, aArgs.concat(Array.prototype.slice.call(arguments)));
      };

      if (this.prototype) {
        // native functions don't have a prototype
        fNOP.prototype = this.prototype;
      }
      fBound.prototype = new fNOP();

      return fBound;
    };
  }
  // Polyfill to get the name of a function in IE9
  function functionName(fn) {
    if (Function.prototype.name === undefined) {
      var funcNameRegex = /function\s([^(]{1,})\(/;
      var results = funcNameRegex.exec(fn.toString());
      return results && results.length > 1 ? results[1].trim() : "";
    } else if (fn.prototype === undefined) {
      return fn.constructor.name;
    } else {
      return fn.prototype.constructor.name;
    }
  }
  function parseValue(str) {
    if ('true' === str) return true;else if ('false' === str) return false;else if (!isNaN(str * 1)) return parseFloat(str);
    return str;
  }
  // Convert PascalCase to kebab-case
  // Thank you: http://stackoverflow.com/a/8955580
  function hyphenate(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }
}(jQuery);
;'use strict';

!function ($) {

  Foundation.Box = {
    ImNotTouchingYou: ImNotTouchingYou,
    GetDimensions: GetDimensions,
    GetOffsets: GetOffsets

    /**
     * Compares the dimensions of an element to a container and determines collision events with container.
     * @function
     * @param {jQuery} element - jQuery object to test for collisions.
     * @param {jQuery} parent - jQuery object to use as bounding container.
     * @param {Boolean} lrOnly - set to true to check left and right values only.
     * @param {Boolean} tbOnly - set to true to check top and bottom values only.
     * @default if no parent object passed, detects collisions with `window`.
     * @returns {Boolean} - true if collision free, false if a collision in any direction.
     */
  };function ImNotTouchingYou(element, parent, lrOnly, tbOnly) {
    var eleDims = GetDimensions(element),
        top,
        bottom,
        left,
        right;

    if (parent) {
      var parDims = GetDimensions(parent);

      bottom = eleDims.offset.top + eleDims.height <= parDims.height + parDims.offset.top;
      top = eleDims.offset.top >= parDims.offset.top;
      left = eleDims.offset.left >= parDims.offset.left;
      right = eleDims.offset.left + eleDims.width <= parDims.width + parDims.offset.left;
    } else {
      bottom = eleDims.offset.top + eleDims.height <= eleDims.windowDims.height + eleDims.windowDims.offset.top;
      top = eleDims.offset.top >= eleDims.windowDims.offset.top;
      left = eleDims.offset.left >= eleDims.windowDims.offset.left;
      right = eleDims.offset.left + eleDims.width <= eleDims.windowDims.width;
    }

    var allDirs = [bottom, top, left, right];

    if (lrOnly) {
      return left === right === true;
    }

    if (tbOnly) {
      return top === bottom === true;
    }

    return allDirs.indexOf(false) === -1;
  };

  /**
   * Uses native methods to return an object of dimension values.
   * @function
   * @param {jQuery || HTML} element - jQuery object or DOM element for which to get the dimensions. Can be any element other that document or window.
   * @returns {Object} - nested object of integer pixel values
   * TODO - if element is window, return only those values.
   */
  function GetDimensions(elem, test) {
    elem = elem.length ? elem[0] : elem;

    if (elem === window || elem === document) {
      throw new Error("I'm sorry, Dave. I'm afraid I can't do that.");
    }

    var rect = elem.getBoundingClientRect(),
        parRect = elem.parentNode.getBoundingClientRect(),
        winRect = document.body.getBoundingClientRect(),
        winY = window.pageYOffset,
        winX = window.pageXOffset;

    return {
      width: rect.width,
      height: rect.height,
      offset: {
        top: rect.top + winY,
        left: rect.left + winX
      },
      parentDims: {
        width: parRect.width,
        height: parRect.height,
        offset: {
          top: parRect.top + winY,
          left: parRect.left + winX
        }
      },
      windowDims: {
        width: winRect.width,
        height: winRect.height,
        offset: {
          top: winY,
          left: winX
        }
      }
    };
  }

  /**
   * Returns an object of top and left integer pixel values for dynamically rendered elements,
   * such as: Tooltip, Reveal, and Dropdown
   * @function
   * @param {jQuery} element - jQuery object for the element being positioned.
   * @param {jQuery} anchor - jQuery object for the element's anchor point.
   * @param {String} position - a string relating to the desired position of the element, relative to it's anchor
   * @param {Number} vOffset - integer pixel value of desired vertical separation between anchor and element.
   * @param {Number} hOffset - integer pixel value of desired horizontal separation between anchor and element.
   * @param {Boolean} isOverflow - if a collision event is detected, sets to true to default the element to full width - any desired offset.
   * TODO alter/rewrite to work with `em` values as well/instead of pixels
   */
  function GetOffsets(element, anchor, position, vOffset, hOffset, isOverflow) {
    var $eleDims = GetDimensions(element),
        $anchorDims = anchor ? GetDimensions(anchor) : null;

    switch (position) {
      case 'top':
        return {
          left: Foundation.rtl() ? $anchorDims.offset.left - $eleDims.width + $anchorDims.width : $anchorDims.offset.left,
          top: $anchorDims.offset.top - ($eleDims.height + vOffset)
        };
        break;
      case 'left':
        return {
          left: $anchorDims.offset.left - ($eleDims.width + hOffset),
          top: $anchorDims.offset.top
        };
        break;
      case 'right':
        return {
          left: $anchorDims.offset.left + $anchorDims.width + hOffset,
          top: $anchorDims.offset.top
        };
        break;
      case 'center top':
        return {
          left: $anchorDims.offset.left + $anchorDims.width / 2 - $eleDims.width / 2,
          top: $anchorDims.offset.top - ($eleDims.height + vOffset)
        };
        break;
      case 'center bottom':
        return {
          left: isOverflow ? hOffset : $anchorDims.offset.left + $anchorDims.width / 2 - $eleDims.width / 2,
          top: $anchorDims.offset.top + $anchorDims.height + vOffset
        };
        break;
      case 'center left':
        return {
          left: $anchorDims.offset.left - ($eleDims.width + hOffset),
          top: $anchorDims.offset.top + $anchorDims.height / 2 - $eleDims.height / 2
        };
        break;
      case 'center right':
        return {
          left: $anchorDims.offset.left + $anchorDims.width + hOffset + 1,
          top: $anchorDims.offset.top + $anchorDims.height / 2 - $eleDims.height / 2
        };
        break;
      case 'center':
        return {
          left: $eleDims.windowDims.offset.left + $eleDims.windowDims.width / 2 - $eleDims.width / 2,
          top: $eleDims.windowDims.offset.top + $eleDims.windowDims.height / 2 - $eleDims.height / 2
        };
        break;
      case 'reveal':
        return {
          left: ($eleDims.windowDims.width - $eleDims.width) / 2,
          top: $eleDims.windowDims.offset.top + vOffset
        };
      case 'reveal full':
        return {
          left: $eleDims.windowDims.offset.left,
          top: $eleDims.windowDims.offset.top
        };
        break;
      case 'left bottom':
        return {
          left: $anchorDims.offset.left,
          top: $anchorDims.offset.top + $anchorDims.height + vOffset
        };
        break;
      case 'right bottom':
        return {
          left: $anchorDims.offset.left + $anchorDims.width + hOffset - $eleDims.width,
          top: $anchorDims.offset.top + $anchorDims.height + vOffset
        };
        break;
      default:
        return {
          left: Foundation.rtl() ? $anchorDims.offset.left - $eleDims.width + $anchorDims.width : $anchorDims.offset.left + hOffset,
          top: $anchorDims.offset.top + $anchorDims.height + vOffset
        };
    }
  }
}(jQuery);
;/*******************************************
 *                                         *
 * This util was created by Marius Olbertz *
 * Please thank Marius on GitHub /owlbertz *
 * or the web http://www.mariusolbertz.de/ *
 *                                         *
 ******************************************/

'use strict';

!function ($) {

  var keyCodes = {
    9: 'TAB',
    13: 'ENTER',
    27: 'ESCAPE',
    32: 'SPACE',
    37: 'ARROW_LEFT',
    38: 'ARROW_UP',
    39: 'ARROW_RIGHT',
    40: 'ARROW_DOWN'
  };

  var commands = {};

  var Keyboard = {
    keys: getKeyCodes(keyCodes),

    /**
     * Parses the (keyboard) event and returns a String that represents its key
     * Can be used like Foundation.parseKey(event) === Foundation.keys.SPACE
     * @param {Event} event - the event generated by the event handler
     * @return String key - String that represents the key pressed
     */
    parseKey: function (event) {
      var key = keyCodes[event.which || event.keyCode] || String.fromCharCode(event.which).toUpperCase();

      // Remove un-printable characters, e.g. for `fromCharCode` calls for CTRL only events
      key = key.replace(/\W+/, '');

      if (event.shiftKey) key = 'SHIFT_' + key;
      if (event.ctrlKey) key = 'CTRL_' + key;
      if (event.altKey) key = 'ALT_' + key;

      // Remove trailing underscore, in case only modifiers were used (e.g. only `CTRL_ALT`)
      key = key.replace(/_$/, '');

      return key;
    },


    /**
     * Handles the given (keyboard) event
     * @param {Event} event - the event generated by the event handler
     * @param {String} component - Foundation component's name, e.g. Slider or Reveal
     * @param {Objects} functions - collection of functions that are to be executed
     */
    handleKey: function (event, component, functions) {
      var commandList = commands[component],
          keyCode = this.parseKey(event),
          cmds,
          command,
          fn;

      if (!commandList) return console.warn('Component not defined!');

      if (typeof commandList.ltr === 'undefined') {
        // this component does not differentiate between ltr and rtl
        cmds = commandList; // use plain list
      } else {
        // merge ltr and rtl: if document is rtl, rtl overwrites ltr and vice versa
        if (Foundation.rtl()) cmds = $.extend({}, commandList.ltr, commandList.rtl);else cmds = $.extend({}, commandList.rtl, commandList.ltr);
      }
      command = cmds[keyCode];

      fn = functions[command];
      if (fn && typeof fn === 'function') {
        // execute function  if exists
        var returnValue = fn.apply();
        if (functions.handled || typeof functions.handled === 'function') {
          // execute function when event was handled
          functions.handled(returnValue);
        }
      } else {
        if (functions.unhandled || typeof functions.unhandled === 'function') {
          // execute function when event was not handled
          functions.unhandled();
        }
      }
    },


    /**
     * Finds all focusable elements within the given `$element`
     * @param {jQuery} $element - jQuery object to search within
     * @return {jQuery} $focusable - all focusable elements within `$element`
     */
    findFocusable: function ($element) {
      if (!$element) {
        return false;
      }
      return $element.find('a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, *[tabindex], *[contenteditable]').filter(function () {
        if (!$(this).is(':visible') || $(this).attr('tabindex') < 0) {
          return false;
        } //only have visible elements and those that have a tabindex greater or equal 0
        return true;
      });
    },


    /**
     * Returns the component name name
     * @param {Object} component - Foundation component, e.g. Slider or Reveal
     * @return String componentName
     */

    register: function (componentName, cmds) {
      commands[componentName] = cmds;
    },


    /**
     * Traps the focus in the given element.
     * @param  {jQuery} $element  jQuery object to trap the foucs into.
     */
    trapFocus: function ($element) {
      var $focusable = Foundation.Keyboard.findFocusable($element),
          $firstFocusable = $focusable.eq(0),
          $lastFocusable = $focusable.eq(-1);

      $element.on('keydown.zf.trapfocus', function (event) {
        if (event.target === $lastFocusable[0] && Foundation.Keyboard.parseKey(event) === 'TAB') {
          event.preventDefault();
          $firstFocusable.focus();
        } else if (event.target === $firstFocusable[0] && Foundation.Keyboard.parseKey(event) === 'SHIFT_TAB') {
          event.preventDefault();
          $lastFocusable.focus();
        }
      });
    },

    /**
     * Releases the trapped focus from the given element.
     * @param  {jQuery} $element  jQuery object to release the focus for.
     */
    releaseFocus: function ($element) {
      $element.off('keydown.zf.trapfocus');
    }
  };

  /*
   * Constants for easier comparing.
   * Can be used like Foundation.parseKey(event) === Foundation.keys.SPACE
   */
  function getKeyCodes(kcs) {
    var k = {};
    for (var kc in kcs) {
      k[kcs[kc]] = kcs[kc];
    }return k;
  }

  Foundation.Keyboard = Keyboard;
}(jQuery);
;'use strict';

!function ($) {

  // Default set of media queries
  var defaultQueries = {
    'default': 'only screen',
    landscape: 'only screen and (orientation: landscape)',
    portrait: 'only screen and (orientation: portrait)',
    retina: 'only screen and (-webkit-min-device-pixel-ratio: 2),' + 'only screen and (min--moz-device-pixel-ratio: 2),' + 'only screen and (-o-min-device-pixel-ratio: 2/1),' + 'only screen and (min-device-pixel-ratio: 2),' + 'only screen and (min-resolution: 192dpi),' + 'only screen and (min-resolution: 2dppx)'
  };

  var MediaQuery = {
    queries: [],

    current: '',

    /**
     * Initializes the media query helper, by extracting the breakpoint list from the CSS and activating the breakpoint watcher.
     * @function
     * @private
     */
    _init: function () {
      var self = this;
      var extractedStyles = $('.foundation-mq').css('font-family');
      var namedQueries;

      namedQueries = parseStyleToObject(extractedStyles);

      for (var key in namedQueries) {
        if (namedQueries.hasOwnProperty(key)) {
          self.queries.push({
            name: key,
            value: 'only screen and (min-width: ' + namedQueries[key] + ')'
          });
        }
      }

      this.current = this._getCurrentSize();

      this._watcher();
    },


    /**
     * Checks if the screen is at least as wide as a breakpoint.
     * @function
     * @param {String} size - Name of the breakpoint to check.
     * @returns {Boolean} `true` if the breakpoint matches, `false` if it's smaller.
     */
    atLeast: function (size) {
      var query = this.get(size);

      if (query) {
        return window.matchMedia(query).matches;
      }

      return false;
    },


    /**
     * Checks if the screen matches to a breakpoint.
     * @function
     * @param {String} size - Name of the breakpoint to check, either 'small only' or 'small'. Omitting 'only' falls back to using atLeast() method.
     * @returns {Boolean} `true` if the breakpoint matches, `false` if it does not.
     */
    is: function (size) {
      size = size.trim().split(' ');
      if (size.length > 1 && size[1] === 'only') {
        if (size[0] === this._getCurrentSize()) return true;
      } else {
        return this.atLeast(size[0]);
      }
      return false;
    },


    /**
     * Gets the media query of a breakpoint.
     * @function
     * @param {String} size - Name of the breakpoint to get.
     * @returns {String|null} - The media query of the breakpoint, or `null` if the breakpoint doesn't exist.
     */
    get: function (size) {
      for (var i in this.queries) {
        if (this.queries.hasOwnProperty(i)) {
          var query = this.queries[i];
          if (size === query.name) return query.value;
        }
      }

      return null;
    },


    /**
     * Gets the current breakpoint name by testing every breakpoint and returning the last one to match (the biggest one).
     * @function
     * @private
     * @returns {String} Name of the current breakpoint.
     */
    _getCurrentSize: function () {
      var matched;

      for (var i = 0; i < this.queries.length; i++) {
        var query = this.queries[i];

        if (window.matchMedia(query.value).matches) {
          matched = query;
        }
      }

      if (typeof matched === 'object') {
        return matched.name;
      } else {
        return matched;
      }
    },


    /**
     * Activates the breakpoint watcher, which fires an event on the window whenever the breakpoint changes.
     * @function
     * @private
     */
    _watcher: function () {
      var _this = this;

      $(window).on('resize.zf.mediaquery', function () {
        var newSize = _this._getCurrentSize(),
            currentSize = _this.current;

        if (newSize !== currentSize) {
          // Change the current media query
          _this.current = newSize;

          // Broadcast the media query change on the window
          $(window).trigger('changed.zf.mediaquery', [newSize, currentSize]);
        }
      });
    }
  };

  Foundation.MediaQuery = MediaQuery;

  // matchMedia() polyfill - Test a CSS media type/query in JS.
  // Authors & copyright (c) 2012: Scott Jehl, Paul Irish, Nicholas Zakas, David Knight. Dual MIT/BSD license
  window.matchMedia || (window.matchMedia = function () {
    'use strict';

    // For browsers that support matchMedium api such as IE 9 and webkit

    var styleMedia = window.styleMedia || window.media;

    // For those that don't support matchMedium
    if (!styleMedia) {
      var style = document.createElement('style'),
          script = document.getElementsByTagName('script')[0],
          info = null;

      style.type = 'text/css';
      style.id = 'matchmediajs-test';

      script && script.parentNode && script.parentNode.insertBefore(style, script);

      // 'style.currentStyle' is used by IE <= 8 and 'window.getComputedStyle' for all other browsers
      info = 'getComputedStyle' in window && window.getComputedStyle(style, null) || style.currentStyle;

      styleMedia = {
        matchMedium: function (media) {
          var text = '@media ' + media + '{ #matchmediajs-test { width: 1px; } }';

          // 'style.styleSheet' is used by IE <= 8 and 'style.textContent' for all other browsers
          if (style.styleSheet) {
            style.styleSheet.cssText = text;
          } else {
            style.textContent = text;
          }

          // Test if media query is true or false
          return info.width === '1px';
        }
      };
    }

    return function (media) {
      return {
        matches: styleMedia.matchMedium(media || 'all'),
        media: media || 'all'
      };
    };
  }());

  // Thank you: https://github.com/sindresorhus/query-string
  function parseStyleToObject(str) {
    var styleObject = {};

    if (typeof str !== 'string') {
      return styleObject;
    }

    str = str.trim().slice(1, -1); // browsers re-quote string style values

    if (!str) {
      return styleObject;
    }

    styleObject = str.split('&').reduce(function (ret, param) {
      var parts = param.replace(/\+/g, ' ').split('=');
      var key = parts[0];
      var val = parts[1];
      key = decodeURIComponent(key);

      // missing `=` should be `null`:
      // http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
      val = val === undefined ? null : decodeURIComponent(val);

      if (!ret.hasOwnProperty(key)) {
        ret[key] = val;
      } else if (Array.isArray(ret[key])) {
        ret[key].push(val);
      } else {
        ret[key] = [ret[key], val];
      }
      return ret;
    }, {});

    return styleObject;
  }

  Foundation.MediaQuery = MediaQuery;
}(jQuery);
;'use strict';

!function ($) {

  /**
   * Motion module.
   * @module foundation.motion
   */

  var initClasses = ['mui-enter', 'mui-leave'];
  var activeClasses = ['mui-enter-active', 'mui-leave-active'];

  var Motion = {
    animateIn: function (element, animation, cb) {
      animate(true, element, animation, cb);
    },

    animateOut: function (element, animation, cb) {
      animate(false, element, animation, cb);
    }
  };

  function Move(duration, elem, fn) {
    var anim,
        prog,
        start = null;
    // console.log('called');

    if (duration === 0) {
      fn.apply(elem);
      elem.trigger('finished.zf.animate', [elem]).triggerHandler('finished.zf.animate', [elem]);
      return;
    }

    function move(ts) {
      if (!start) start = ts;
      // console.log(start, ts);
      prog = ts - start;
      fn.apply(elem);

      if (prog < duration) {
        anim = window.requestAnimationFrame(move, elem);
      } else {
        window.cancelAnimationFrame(anim);
        elem.trigger('finished.zf.animate', [elem]).triggerHandler('finished.zf.animate', [elem]);
      }
    }
    anim = window.requestAnimationFrame(move);
  }

  /**
   * Animates an element in or out using a CSS transition class.
   * @function
   * @private
   * @param {Boolean} isIn - Defines if the animation is in or out.
   * @param {Object} element - jQuery or HTML object to animate.
   * @param {String} animation - CSS class to use.
   * @param {Function} cb - Callback to run when animation is finished.
   */
  function animate(isIn, element, animation, cb) {
    element = $(element).eq(0);

    if (!element.length) return;

    var initClass = isIn ? initClasses[0] : initClasses[1];
    var activeClass = isIn ? activeClasses[0] : activeClasses[1];

    // Set up the animation
    reset();

    element.addClass(animation).css('transition', 'none');

    requestAnimationFrame(function () {
      element.addClass(initClass);
      if (isIn) element.show();
    });

    // Start the animation
    requestAnimationFrame(function () {
      element[0].offsetWidth;
      element.css('transition', '').addClass(activeClass);
    });

    // Clean up the animation when it finishes
    element.one(Foundation.transitionend(element), finish);

    // Hides the element (for out animations), resets the element, and runs a callback
    function finish() {
      if (!isIn) element.hide();
      reset();
      if (cb) cb.apply(element);
    }

    // Resets transitions and removes motion-specific classes
    function reset() {
      element[0].style.transitionDuration = 0;
      element.removeClass(initClass + ' ' + activeClass + ' ' + animation);
    }
  }

  Foundation.Move = Move;
  Foundation.Motion = Motion;
}(jQuery);
;'use strict';

!function ($) {

  var Nest = {
    Feather: function (menu) {
      var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'zf';

      menu.attr('role', 'menubar');

      var items = menu.find('li').attr({ 'role': 'menuitem' }),
          subMenuClass = 'is-' + type + '-submenu',
          subItemClass = subMenuClass + '-item',
          hasSubClass = 'is-' + type + '-submenu-parent';

      items.each(function () {
        var $item = $(this),
            $sub = $item.children('ul');

        if ($sub.length) {
          $item.addClass(hasSubClass).attr({
            'aria-haspopup': true,
            'aria-label': $item.children('a:first').text()
          });
          // Note:  Drilldowns behave differently in how they hide, and so need
          // additional attributes.  We should look if this possibly over-generalized
          // utility (Nest) is appropriate when we rework menus in 6.4
          if (type === 'drilldown') {
            $item.attr({ 'aria-expanded': false });
          }

          $sub.addClass('submenu ' + subMenuClass).attr({
            'data-submenu': '',
            'role': 'menu'
          });
          if (type === 'drilldown') {
            $sub.attr({ 'aria-hidden': true });
          }
        }

        if ($item.parent('[data-submenu]').length) {
          $item.addClass('is-submenu-item ' + subItemClass);
        }
      });

      return;
    },
    Burn: function (menu, type) {
      var //items = menu.find('li'),
      subMenuClass = 'is-' + type + '-submenu',
          subItemClass = subMenuClass + '-item',
          hasSubClass = 'is-' + type + '-submenu-parent';

      menu.find('>li, .menu, .menu > li').removeClass(subMenuClass + ' ' + subItemClass + ' ' + hasSubClass + ' is-submenu-item submenu is-active').removeAttr('data-submenu').css('display', '');

      // console.log(      menu.find('.' + subMenuClass + ', .' + subItemClass + ', .has-submenu, .is-submenu-item, .submenu, [data-submenu]')
      //           .removeClass(subMenuClass + ' ' + subItemClass + ' has-submenu is-submenu-item submenu')
      //           .removeAttr('data-submenu'));
      // items.each(function(){
      //   var $item = $(this),
      //       $sub = $item.children('ul');
      //   if($item.parent('[data-submenu]').length){
      //     $item.removeClass('is-submenu-item ' + subItemClass);
      //   }
      //   if($sub.length){
      //     $item.removeClass('has-submenu');
      //     $sub.removeClass('submenu ' + subMenuClass).removeAttr('data-submenu');
      //   }
      // });
    }
  };

  Foundation.Nest = Nest;
}(jQuery);
;'use strict';

!function ($) {

  function Timer(elem, options, cb) {
    var _this = this,
        duration = options.duration,
        //options is an object for easily adding features later.
    nameSpace = Object.keys(elem.data())[0] || 'timer',
        remain = -1,
        start,
        timer;

    this.isPaused = false;

    this.restart = function () {
      remain = -1;
      clearTimeout(timer);
      this.start();
    };

    this.start = function () {
      this.isPaused = false;
      // if(!elem.data('paused')){ return false; }//maybe implement this sanity check if used for other things.
      clearTimeout(timer);
      remain = remain <= 0 ? duration : remain;
      elem.data('paused', false);
      start = Date.now();
      timer = setTimeout(function () {
        if (options.infinite) {
          _this.restart(); //rerun the timer.
        }
        if (cb && typeof cb === 'function') {
          cb();
        }
      }, remain);
      elem.trigger('timerstart.zf.' + nameSpace);
    };

    this.pause = function () {
      this.isPaused = true;
      //if(elem.data('paused')){ return false; }//maybe implement this sanity check if used for other things.
      clearTimeout(timer);
      elem.data('paused', true);
      var end = Date.now();
      remain = remain - (end - start);
      elem.trigger('timerpaused.zf.' + nameSpace);
    };
  }

  /**
   * Runs a callback function when images are fully loaded.
   * @param {Object} images - Image(s) to check if loaded.
   * @param {Func} callback - Function to execute when image is fully loaded.
   */
  function onImagesLoaded(images, callback) {
    var self = this,
        unloaded = images.length;

    if (unloaded === 0) {
      callback();
    }

    images.each(function () {
      // Check if image is loaded
      if (this.complete || this.readyState === 4 || this.readyState === 'complete') {
        singleImageLoaded();
      }
      // Force load the image
      else {
          // fix for IE. See https://css-tricks.com/snippets/jquery/fixing-load-in-ie-for-cached-images/
          var src = $(this).attr('src');
          $(this).attr('src', src + (src.indexOf('?') >= 0 ? '&' : '?') + new Date().getTime());
          $(this).one('load', function () {
            singleImageLoaded();
          });
        }
    });

    function singleImageLoaded() {
      unloaded--;
      if (unloaded === 0) {
        callback();
      }
    }
  }

  Foundation.Timer = Timer;
  Foundation.onImagesLoaded = onImagesLoaded;
}(jQuery);
;'use strict';

//**************************************************
//**Work inspired by multiple jquery swipe plugins**
//**Done by Yohai Ararat ***************************
//**************************************************
(function ($) {

	$.spotSwipe = {
		version: '1.0.0',
		enabled: 'ontouchstart' in document.documentElement,
		preventDefault: false,
		moveThreshold: 75,
		timeThreshold: 200
	};

	var startPosX,
	    startPosY,
	    startTime,
	    elapsedTime,
	    isMoving = false;

	function onTouchEnd() {
		//  alert(this);
		this.removeEventListener('touchmove', onTouchMove);
		this.removeEventListener('touchend', onTouchEnd);
		isMoving = false;
	}

	function onTouchMove(e) {
		if ($.spotSwipe.preventDefault) {
			e.preventDefault();
		}
		if (isMoving) {
			var x = e.touches[0].pageX;
			var y = e.touches[0].pageY;
			var dx = startPosX - x;
			var dy = startPosY - y;
			var dir;
			elapsedTime = new Date().getTime() - startTime;
			if (Math.abs(dx) >= $.spotSwipe.moveThreshold && elapsedTime <= $.spotSwipe.timeThreshold) {
				dir = dx > 0 ? 'left' : 'right';
			}
			// else if(Math.abs(dy) >= $.spotSwipe.moveThreshold && elapsedTime <= $.spotSwipe.timeThreshold) {
			//   dir = dy > 0 ? 'down' : 'up';
			// }
			if (dir) {
				e.preventDefault();
				onTouchEnd.call(this);
				$(this).trigger('swipe', dir).trigger('swipe' + dir);
			}
		}
	}

	function onTouchStart(e) {
		if (e.touches.length == 1) {
			startPosX = e.touches[0].pageX;
			startPosY = e.touches[0].pageY;
			isMoving = true;
			startTime = new Date().getTime();
			this.addEventListener('touchmove', onTouchMove, false);
			this.addEventListener('touchend', onTouchEnd, false);
		}
	}

	function init() {
		this.addEventListener && this.addEventListener('touchstart', onTouchStart, false);
	}

	function teardown() {
		this.removeEventListener('touchstart', onTouchStart);
	}

	$.event.special.swipe = { setup: init };

	$.each(['left', 'up', 'down', 'right'], function () {
		$.event.special['swipe' + this] = { setup: function () {
				$(this).on('swipe', $.noop);
			} };
	});
})(jQuery);
/****************************************************
 * Method for adding psuedo drag events to elements *
 ***************************************************/
!function ($) {
	$.fn.addTouch = function () {
		this.each(function (i, el) {
			$(el).bind('touchstart touchmove touchend touchcancel', function () {
				//we pass the original event object because the jQuery event
				//object is normalized to w3c specs and does not provide the TouchList
				handleTouch(event);
			});
		});

		var handleTouch = function (event) {
			var touches = event.changedTouches,
			    first = touches[0],
			    eventTypes = {
				touchstart: 'mousedown',
				touchmove: 'mousemove',
				touchend: 'mouseup'
			},
			    type = eventTypes[event.type],
			    simulatedEvent;

			if ('MouseEvent' in window && typeof window.MouseEvent === 'function') {
				simulatedEvent = new window.MouseEvent(type, {
					'bubbles': true,
					'cancelable': true,
					'screenX': first.screenX,
					'screenY': first.screenY,
					'clientX': first.clientX,
					'clientY': first.clientY
				});
			} else {
				simulatedEvent = document.createEvent('MouseEvent');
				simulatedEvent.initMouseEvent(type, true, true, window, 1, first.screenX, first.screenY, first.clientX, first.clientY, false, false, false, false, 0 /*left*/, null);
			}
			first.target.dispatchEvent(simulatedEvent);
		};
	};
}(jQuery);

//**********************************
//**From the jQuery Mobile Library**
//**need to recreate functionality**
//**and try to improve if possible**
//**********************************

/* Removing the jQuery function ****
************************************

(function( $, window, undefined ) {

	var $document = $( document ),
		// supportTouch = $.mobile.support.touch,
		touchStartEvent = 'touchstart'//supportTouch ? "touchstart" : "mousedown",
		touchStopEvent = 'touchend'//supportTouch ? "touchend" : "mouseup",
		touchMoveEvent = 'touchmove'//supportTouch ? "touchmove" : "mousemove";

	// setup new event shortcuts
	$.each( ( "touchstart touchmove touchend " +
		"swipe swipeleft swiperight" ).split( " " ), function( i, name ) {

		$.fn[ name ] = function( fn ) {
			return fn ? this.bind( name, fn ) : this.trigger( name );
		};

		// jQuery < 1.8
		if ( $.attrFn ) {
			$.attrFn[ name ] = true;
		}
	});

	function triggerCustomEvent( obj, eventType, event, bubble ) {
		var originalType = event.type;
		event.type = eventType;
		if ( bubble ) {
			$.event.trigger( event, undefined, obj );
		} else {
			$.event.dispatch.call( obj, event );
		}
		event.type = originalType;
	}

	// also handles taphold

	// Also handles swipeleft, swiperight
	$.event.special.swipe = {

		// More than this horizontal displacement, and we will suppress scrolling.
		scrollSupressionThreshold: 30,

		// More time than this, and it isn't a swipe.
		durationThreshold: 1000,

		// Swipe horizontal displacement must be more than this.
		horizontalDistanceThreshold: window.devicePixelRatio >= 2 ? 15 : 30,

		// Swipe vertical displacement must be less than this.
		verticalDistanceThreshold: window.devicePixelRatio >= 2 ? 15 : 30,

		getLocation: function ( event ) {
			var winPageX = window.pageXOffset,
				winPageY = window.pageYOffset,
				x = event.clientX,
				y = event.clientY;

			if ( event.pageY === 0 && Math.floor( y ) > Math.floor( event.pageY ) ||
				event.pageX === 0 && Math.floor( x ) > Math.floor( event.pageX ) ) {

				// iOS4 clientX/clientY have the value that should have been
				// in pageX/pageY. While pageX/page/ have the value 0
				x = x - winPageX;
				y = y - winPageY;
			} else if ( y < ( event.pageY - winPageY) || x < ( event.pageX - winPageX ) ) {

				// Some Android browsers have totally bogus values for clientX/Y
				// when scrolling/zooming a page. Detectable since clientX/clientY
				// should never be smaller than pageX/pageY minus page scroll
				x = event.pageX - winPageX;
				y = event.pageY - winPageY;
			}

			return {
				x: x,
				y: y
			};
		},

		start: function( event ) {
			var data = event.originalEvent.touches ?
					event.originalEvent.touches[ 0 ] : event,
				location = $.event.special.swipe.getLocation( data );
			return {
						time: ( new Date() ).getTime(),
						coords: [ location.x, location.y ],
						origin: $( event.target )
					};
		},

		stop: function( event ) {
			var data = event.originalEvent.touches ?
					event.originalEvent.touches[ 0 ] : event,
				location = $.event.special.swipe.getLocation( data );
			return {
						time: ( new Date() ).getTime(),
						coords: [ location.x, location.y ]
					};
		},

		handleSwipe: function( start, stop, thisObject, origTarget ) {
			if ( stop.time - start.time < $.event.special.swipe.durationThreshold &&
				Math.abs( start.coords[ 0 ] - stop.coords[ 0 ] ) > $.event.special.swipe.horizontalDistanceThreshold &&
				Math.abs( start.coords[ 1 ] - stop.coords[ 1 ] ) < $.event.special.swipe.verticalDistanceThreshold ) {
				var direction = start.coords[0] > stop.coords[ 0 ] ? "swipeleft" : "swiperight";

				triggerCustomEvent( thisObject, "swipe", $.Event( "swipe", { target: origTarget, swipestart: start, swipestop: stop }), true );
				triggerCustomEvent( thisObject, direction,$.Event( direction, { target: origTarget, swipestart: start, swipestop: stop } ), true );
				return true;
			}
			return false;

		},

		// This serves as a flag to ensure that at most one swipe event event is
		// in work at any given time
		eventInProgress: false,

		setup: function() {
			var events,
				thisObject = this,
				$this = $( thisObject ),
				context = {};

			// Retrieve the events data for this element and add the swipe context
			events = $.data( this, "mobile-events" );
			if ( !events ) {
				events = { length: 0 };
				$.data( this, "mobile-events", events );
			}
			events.length++;
			events.swipe = context;

			context.start = function( event ) {

				// Bail if we're already working on a swipe event
				if ( $.event.special.swipe.eventInProgress ) {
					return;
				}
				$.event.special.swipe.eventInProgress = true;

				var stop,
					start = $.event.special.swipe.start( event ),
					origTarget = event.target,
					emitted = false;

				context.move = function( event ) {
					if ( !start || event.isDefaultPrevented() ) {
						return;
					}

					stop = $.event.special.swipe.stop( event );
					if ( !emitted ) {
						emitted = $.event.special.swipe.handleSwipe( start, stop, thisObject, origTarget );
						if ( emitted ) {

							// Reset the context to make way for the next swipe event
							$.event.special.swipe.eventInProgress = false;
						}
					}
					// prevent scrolling
					if ( Math.abs( start.coords[ 0 ] - stop.coords[ 0 ] ) > $.event.special.swipe.scrollSupressionThreshold ) {
						event.preventDefault();
					}
				};

				context.stop = function() {
						emitted = true;

						// Reset the context to make way for the next swipe event
						$.event.special.swipe.eventInProgress = false;
						$document.off( touchMoveEvent, context.move );
						context.move = null;
				};

				$document.on( touchMoveEvent, context.move )
					.one( touchStopEvent, context.stop );
			};
			$this.on( touchStartEvent, context.start );
		},

		teardown: function() {
			var events, context;

			events = $.data( this, "mobile-events" );
			if ( events ) {
				context = events.swipe;
				delete events.swipe;
				events.length--;
				if ( events.length === 0 ) {
					$.removeData( this, "mobile-events" );
				}
			}

			if ( context ) {
				if ( context.start ) {
					$( this ).off( touchStartEvent, context.start );
				}
				if ( context.move ) {
					$document.off( touchMoveEvent, context.move );
				}
				if ( context.stop ) {
					$document.off( touchStopEvent, context.stop );
				}
			}
		}
	};
	$.each({
		swipeleft: "swipe.left",
		swiperight: "swipe.right"
	}, function( event, sourceEvent ) {

		$.event.special[ event ] = {
			setup: function() {
				$( this ).bind( sourceEvent, $.noop );
			},
			teardown: function() {
				$( this ).unbind( sourceEvent );
			}
		};
	});
})( jQuery, this );
*/
;'use strict';

!function ($) {

  var MutationObserver = function () {
    var prefixes = ['WebKit', 'Moz', 'O', 'Ms', ''];
    for (var i = 0; i < prefixes.length; i++) {
      if (prefixes[i] + 'MutationObserver' in window) {
        return window[prefixes[i] + 'MutationObserver'];
      }
    }
    return false;
  }();

  var triggers = function (el, type) {
    el.data(type).split(' ').forEach(function (id) {
      $('#' + id)[type === 'close' ? 'trigger' : 'triggerHandler'](type + '.zf.trigger', [el]);
    });
  };
  // Elements with [data-open] will reveal a plugin that supports it when clicked.
  $(document).on('click.zf.trigger', '[data-open]', function () {
    triggers($(this), 'open');
  });

  // Elements with [data-close] will close a plugin that supports it when clicked.
  // If used without a value on [data-close], the event will bubble, allowing it to close a parent component.
  $(document).on('click.zf.trigger', '[data-close]', function () {
    var id = $(this).data('close');
    if (id) {
      triggers($(this), 'close');
    } else {
      $(this).trigger('close.zf.trigger');
    }
  });

  // Elements with [data-toggle] will toggle a plugin that supports it when clicked.
  $(document).on('click.zf.trigger', '[data-toggle]', function () {
    var id = $(this).data('toggle');
    if (id) {
      triggers($(this), 'toggle');
    } else {
      $(this).trigger('toggle.zf.trigger');
    }
  });

  // Elements with [data-closable] will respond to close.zf.trigger events.
  $(document).on('close.zf.trigger', '[data-closable]', function (e) {
    e.stopPropagation();
    var animation = $(this).data('closable');

    if (animation !== '') {
      Foundation.Motion.animateOut($(this), animation, function () {
        $(this).trigger('closed.zf');
      });
    } else {
      $(this).fadeOut().trigger('closed.zf');
    }
  });

  $(document).on('focus.zf.trigger blur.zf.trigger', '[data-toggle-focus]', function () {
    var id = $(this).data('toggle-focus');
    $('#' + id).triggerHandler('toggle.zf.trigger', [$(this)]);
  });

  /**
  * Fires once after all other scripts have loaded
  * @function
  * @private
  */
  $(window).on('load', function () {
    checkListeners();
  });

  function checkListeners() {
    eventsListener();
    resizeListener();
    scrollListener();
    closemeListener();
  }

  //******** only fires this function once on load, if there's something to watch ********
  function closemeListener(pluginName) {
    var yetiBoxes = $('[data-yeti-box]'),
        plugNames = ['dropdown', 'tooltip', 'reveal'];

    if (pluginName) {
      if (typeof pluginName === 'string') {
        plugNames.push(pluginName);
      } else if (typeof pluginName === 'object' && typeof pluginName[0] === 'string') {
        plugNames.concat(pluginName);
      } else {
        console.error('Plugin names must be strings');
      }
    }
    if (yetiBoxes.length) {
      var listeners = plugNames.map(function (name) {
        return 'closeme.zf.' + name;
      }).join(' ');

      $(window).off(listeners).on(listeners, function (e, pluginId) {
        var plugin = e.namespace.split('.')[0];
        var plugins = $('[data-' + plugin + ']').not('[data-yeti-box="' + pluginId + '"]');

        plugins.each(function () {
          var _this = $(this);

          _this.triggerHandler('close.zf.trigger', [_this]);
        });
      });
    }
  }

  function resizeListener(debounce) {
    var timer = void 0,
        $nodes = $('[data-resize]');
    if ($nodes.length) {
      $(window).off('resize.zf.trigger').on('resize.zf.trigger', function (e) {
        if (timer) {
          clearTimeout(timer);
        }

        timer = setTimeout(function () {

          if (!MutationObserver) {
            //fallback for IE 9
            $nodes.each(function () {
              $(this).triggerHandler('resizeme.zf.trigger');
            });
          }
          //trigger all listening elements and signal a resize event
          $nodes.attr('data-events', "resize");
        }, debounce || 10); //default time to emit resize event
      });
    }
  }

  function scrollListener(debounce) {
    var timer = void 0,
        $nodes = $('[data-scroll]');
    if ($nodes.length) {
      $(window).off('scroll.zf.trigger').on('scroll.zf.trigger', function (e) {
        if (timer) {
          clearTimeout(timer);
        }

        timer = setTimeout(function () {

          if (!MutationObserver) {
            //fallback for IE 9
            $nodes.each(function () {
              $(this).triggerHandler('scrollme.zf.trigger');
            });
          }
          //trigger all listening elements and signal a scroll event
          $nodes.attr('data-events', "scroll");
        }, debounce || 10); //default time to emit scroll event
      });
    }
  }

  function eventsListener() {
    if (!MutationObserver) {
      return false;
    }
    var nodes = document.querySelectorAll('[data-resize], [data-scroll], [data-mutate]');

    //element callback
    var listeningElementsMutation = function (mutationRecordsList) {
      var $target = $(mutationRecordsList[0].target);

      //trigger the event handler for the element depending on type
      switch (mutationRecordsList[0].type) {

        case "attributes":
          if ($target.attr("data-events") === "scroll" && mutationRecordsList[0].attributeName === "data-events") {
            $target.triggerHandler('scrollme.zf.trigger', [$target, window.pageYOffset]);
          }
          if ($target.attr("data-events") === "resize" && mutationRecordsList[0].attributeName === "data-events") {
            $target.triggerHandler('resizeme.zf.trigger', [$target]);
          }
          if (mutationRecordsList[0].attributeName === "style") {
            $target.closest("[data-mutate]").attr("data-events", "mutate");
            $target.closest("[data-mutate]").triggerHandler('mutateme.zf.trigger', [$target.closest("[data-mutate]")]);
          }
          break;

        case "childList":
          $target.closest("[data-mutate]").attr("data-events", "mutate");
          $target.closest("[data-mutate]").triggerHandler('mutateme.zf.trigger', [$target.closest("[data-mutate]")]);
          break;

        default:
          return false;
        //nothing
      }
    };

    if (nodes.length) {
      //for each element that needs to listen for resizing, scrolling, or mutation add a single observer
      for (var i = 0; i <= nodes.length - 1; i++) {
        var elementObserver = new MutationObserver(listeningElementsMutation);
        elementObserver.observe(nodes[i], { attributes: true, childList: true, characterData: false, subtree: true, attributeFilter: ["data-events", "style"] });
      }
    }
  }

  // ------------------------------------

  // [PH]
  // Foundation.CheckWatchers = checkWatchers;
  Foundation.IHearYou = checkListeners;
  // Foundation.ISeeYou = scrollListener;
  // Foundation.IFeelYou = closemeListener;
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Abide module.
   * @module foundation.abide
   */

  var Abide = function () {
    /**
     * Creates a new instance of Abide.
     * @class
     * @fires Abide#init
     * @param {Object} element - jQuery object to add the trigger to.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    function Abide(element) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      _classCallCheck(this, Abide);

      this.$element = element;
      this.options = $.extend({}, Abide.defaults, this.$element.data(), options);

      this._init();

      Foundation.registerPlugin(this, 'Abide');
    }

    /**
     * Initializes the Abide plugin and calls functions to get Abide functioning on load.
     * @private
     */


    _createClass(Abide, [{
      key: '_init',
      value: function _init() {
        this.$inputs = this.$element.find('input, textarea, select');

        this._events();
      }

      /**
       * Initializes events for Abide.
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        var _this2 = this;

        this.$element.off('.abide').on('reset.zf.abide', function () {
          _this2.resetForm();
        }).on('submit.zf.abide', function () {
          return _this2.validateForm();
        });

        if (this.options.validateOn === 'fieldChange') {
          this.$inputs.off('change.zf.abide').on('change.zf.abide', function (e) {
            _this2.validateInput($(e.target));
          });
        }

        if (this.options.liveValidate) {
          this.$inputs.off('input.zf.abide').on('input.zf.abide', function (e) {
            _this2.validateInput($(e.target));
          });
        }

        if (this.options.validateOnBlur) {
          this.$inputs.off('blur.zf.abide').on('blur.zf.abide', function (e) {
            _this2.validateInput($(e.target));
          });
        }
      }

      /**
       * Calls necessary functions to update Abide upon DOM change
       * @private
       */

    }, {
      key: '_reflow',
      value: function _reflow() {
        this._init();
      }

      /**
       * Checks whether or not a form element has the required attribute and if it's checked or not
       * @param {Object} element - jQuery object to check for required attribute
       * @returns {Boolean} Boolean value depends on whether or not attribute is checked or empty
       */

    }, {
      key: 'requiredCheck',
      value: function requiredCheck($el) {
        if (!$el.attr('required')) return true;

        var isGood = true;

        switch ($el[0].type) {
          case 'checkbox':
            isGood = $el[0].checked;
            break;

          case 'select':
          case 'select-one':
          case 'select-multiple':
            var opt = $el.find('option:selected');
            if (!opt.length || !opt.val()) isGood = false;
            break;

          default:
            if (!$el.val() || !$el.val().length) isGood = false;
        }

        return isGood;
      }

      /**
       * Get:
       * - Based on $el, the first element(s) corresponding to `formErrorSelector` in this order:
       *   1. The element's direct sibling('s).
       *   2. The element's parent's children.
       * - Element(s) with the attribute `[data-form-error-for]` set with the element's id.
       *
       * This allows for multiple form errors per input, though if none are found, no form errors will be shown.
       *
       * @param {Object} $el - jQuery object to use as reference to find the form error selector.
       * @returns {Object} jQuery object with the selector.
       */

    }, {
      key: 'findFormError',
      value: function findFormError($el) {
        var id = $el[0].id;
        var $error = $el.siblings(this.options.formErrorSelector);

        if (!$error.length) {
          $error = $el.parent().find(this.options.formErrorSelector);
        }

        $error = $error.add(this.$element.find('[data-form-error-for="' + id + '"]'));

        return $error;
      }

      /**
       * Get the first element in this order:
       * 2. The <label> with the attribute `[for="someInputId"]`
       * 3. The `.closest()` <label>
       *
       * @param {Object} $el - jQuery object to check for required attribute
       * @returns {Boolean} Boolean value depends on whether or not attribute is checked or empty
       */

    }, {
      key: 'findLabel',
      value: function findLabel($el) {
        var id = $el[0].id;
        var $label = this.$element.find('label[for="' + id + '"]');

        if (!$label.length) {
          return $el.closest('label');
        }

        return $label;
      }

      /**
       * Get the set of labels associated with a set of radio els in this order
       * 2. The <label> with the attribute `[for="someInputId"]`
       * 3. The `.closest()` <label>
       *
       * @param {Object} $el - jQuery object to check for required attribute
       * @returns {Boolean} Boolean value depends on whether or not attribute is checked or empty
       */

    }, {
      key: 'findRadioLabels',
      value: function findRadioLabels($els) {
        var _this3 = this;

        var labels = $els.map(function (i, el) {
          var id = el.id;
          var $label = _this3.$element.find('label[for="' + id + '"]');

          if (!$label.length) {
            $label = $(el).closest('label');
          }
          return $label[0];
        });

        return $(labels);
      }

      /**
       * Adds the CSS error class as specified by the Abide settings to the label, input, and the form
       * @param {Object} $el - jQuery object to add the class to
       */

    }, {
      key: 'addErrorClasses',
      value: function addErrorClasses($el) {
        var $label = this.findLabel($el);
        var $formError = this.findFormError($el);

        if ($label.length) {
          $label.addClass(this.options.labelErrorClass);
        }

        if ($formError.length) {
          $formError.addClass(this.options.formErrorClass);
        }

        $el.addClass(this.options.inputErrorClass).attr('data-invalid', '');
      }

      /**
       * Remove CSS error classes etc from an entire radio button group
       * @param {String} groupName - A string that specifies the name of a radio button group
       *
       */

    }, {
      key: 'removeRadioErrorClasses',
      value: function removeRadioErrorClasses(groupName) {
        var $els = this.$element.find(':radio[name="' + groupName + '"]');
        var $labels = this.findRadioLabels($els);
        var $formErrors = this.findFormError($els);

        if ($labels.length) {
          $labels.removeClass(this.options.labelErrorClass);
        }

        if ($formErrors.length) {
          $formErrors.removeClass(this.options.formErrorClass);
        }

        $els.removeClass(this.options.inputErrorClass).removeAttr('data-invalid');
      }

      /**
       * Removes CSS error class as specified by the Abide settings from the label, input, and the form
       * @param {Object} $el - jQuery object to remove the class from
       */

    }, {
      key: 'removeErrorClasses',
      value: function removeErrorClasses($el) {
        // radios need to clear all of the els
        if ($el[0].type == 'radio') {
          return this.removeRadioErrorClasses($el.attr('name'));
        }

        var $label = this.findLabel($el);
        var $formError = this.findFormError($el);

        if ($label.length) {
          $label.removeClass(this.options.labelErrorClass);
        }

        if ($formError.length) {
          $formError.removeClass(this.options.formErrorClass);
        }

        $el.removeClass(this.options.inputErrorClass).removeAttr('data-invalid');
      }

      /**
       * Goes through a form to find inputs and proceeds to validate them in ways specific to their type. 
       * Ignores inputs with data-abide-ignore, type="hidden" or disabled attributes set
       * @fires Abide#invalid
       * @fires Abide#valid
       * @param {Object} element - jQuery object to validate, should be an HTML input
       * @returns {Boolean} goodToGo - If the input is valid or not.
       */

    }, {
      key: 'validateInput',
      value: function validateInput($el) {
        var clearRequire = this.requiredCheck($el),
            validated = false,
            customValidator = true,
            validator = $el.attr('data-validator'),
            equalTo = true;

        // don't validate ignored inputs or hidden inputs or disabled inputs
        if ($el.is('[data-abide-ignore]') || $el.is('[type="hidden"]') || $el.is('[disabled]')) {
          return true;
        }

        switch ($el[0].type) {
          case 'radio':
            validated = this.validateRadio($el.attr('name'));
            break;

          case 'checkbox':
            validated = clearRequire;
            break;

          case 'select':
          case 'select-one':
          case 'select-multiple':
            validated = clearRequire;
            break;

          default:
            validated = this.validateText($el);
        }

        if (validator) {
          customValidator = this.matchValidation($el, validator, $el.attr('required'));
        }

        if ($el.attr('data-equalto')) {
          equalTo = this.options.validators.equalTo($el);
        }

        var goodToGo = [clearRequire, validated, customValidator, equalTo].indexOf(false) === -1;
        var message = (goodToGo ? 'valid' : 'invalid') + '.zf.abide';

        if (goodToGo) {
          // Re-validate inputs that depend on this one with equalto
          var dependentElements = this.$element.find('[data-equalto="' + $el.attr('id') + '"]');
          if (dependentElements.length) {
            var _this = this;
            dependentElements.each(function () {
              if ($(this).val()) {
                _this.validateInput($(this));
              }
            });
          }
        }

        this[goodToGo ? 'removeErrorClasses' : 'addErrorClasses']($el);

        /**
         * Fires when the input is done checking for validation. Event trigger is either `valid.zf.abide` or `invalid.zf.abide`
         * Trigger includes the DOM element of the input.
         * @event Abide#valid
         * @event Abide#invalid
         */
        $el.trigger(message, [$el]);

        return goodToGo;
      }

      /**
       * Goes through a form and if there are any invalid inputs, it will display the form error element
       * @returns {Boolean} noError - true if no errors were detected...
       * @fires Abide#formvalid
       * @fires Abide#forminvalid
       */

    }, {
      key: 'validateForm',
      value: function validateForm() {
        var acc = [];
        var _this = this;

        this.$inputs.each(function () {
          acc.push(_this.validateInput($(this)));
        });

        var noError = acc.indexOf(false) === -1;

        this.$element.find('[data-abide-error]').css('display', noError ? 'none' : 'block');

        /**
         * Fires when the form is finished validating. Event trigger is either `formvalid.zf.abide` or `forminvalid.zf.abide`.
         * Trigger includes the element of the form.
         * @event Abide#formvalid
         * @event Abide#forminvalid
         */
        this.$element.trigger((noError ? 'formvalid' : 'forminvalid') + '.zf.abide', [this.$element]);

        return noError;
      }

      /**
       * Determines whether or a not a text input is valid based on the pattern specified in the attribute. If no matching pattern is found, returns true.
       * @param {Object} $el - jQuery object to validate, should be a text input HTML element
       * @param {String} pattern - string value of one of the RegEx patterns in Abide.options.patterns
       * @returns {Boolean} Boolean value depends on whether or not the input value matches the pattern specified
       */

    }, {
      key: 'validateText',
      value: function validateText($el, pattern) {
        // A pattern can be passed to this function, or it will be infered from the input's "pattern" attribute, or it's "type" attribute
        pattern = pattern || $el.attr('pattern') || $el.attr('type');
        var inputText = $el.val();
        var valid = false;

        if (inputText.length) {
          // If the pattern attribute on the element is in Abide's list of patterns, then test that regexp
          if (this.options.patterns.hasOwnProperty(pattern)) {
            valid = this.options.patterns[pattern].test(inputText);
          }
          // If the pattern name isn't also the type attribute of the field, then test it as a regexp
          else if (pattern !== $el.attr('type')) {
              valid = new RegExp(pattern).test(inputText);
            } else {
              valid = true;
            }
        }
        // An empty field is valid if it's not required
        else if (!$el.prop('required')) {
            valid = true;
          }

        return valid;
      }

      /**
       * Determines whether or a not a radio input is valid based on whether or not it is required and selected. Although the function targets a single `<input>`, it validates by checking the `required` and `checked` properties of all radio buttons in its group.
       * @param {String} groupName - A string that specifies the name of a radio button group
       * @returns {Boolean} Boolean value depends on whether or not at least one radio input has been selected (if it's required)
       */

    }, {
      key: 'validateRadio',
      value: function validateRadio(groupName) {
        // If at least one radio in the group has the `required` attribute, the group is considered required
        // Per W3C spec, all radio buttons in a group should have `required`, but we're being nice
        var $group = this.$element.find(':radio[name="' + groupName + '"]');
        var valid = false,
            required = false;

        // For the group to be required, at least one radio needs to be required
        $group.each(function (i, e) {
          if ($(e).attr('required')) {
            required = true;
          }
        });
        if (!required) valid = true;

        if (!valid) {
          // For the group to be valid, at least one radio needs to be checked
          $group.each(function (i, e) {
            if ($(e).prop('checked')) {
              valid = true;
            }
          });
        };

        return valid;
      }

      /**
       * Determines if a selected input passes a custom validation function. Multiple validations can be used, if passed to the element with `data-validator="foo bar baz"` in a space separated listed.
       * @param {Object} $el - jQuery input element.
       * @param {String} validators - a string of function names matching functions in the Abide.options.validators object.
       * @param {Boolean} required - self explanatory?
       * @returns {Boolean} - true if validations passed.
       */

    }, {
      key: 'matchValidation',
      value: function matchValidation($el, validators, required) {
        var _this4 = this;

        required = required ? true : false;

        var clear = validators.split(' ').map(function (v) {
          return _this4.options.validators[v]($el, required, $el.parent());
        });
        return clear.indexOf(false) === -1;
      }

      /**
       * Resets form inputs and styles
       * @fires Abide#formreset
       */

    }, {
      key: 'resetForm',
      value: function resetForm() {
        var $form = this.$element,
            opts = this.options;

        $('.' + opts.labelErrorClass, $form).not('small').removeClass(opts.labelErrorClass);
        $('.' + opts.inputErrorClass, $form).not('small').removeClass(opts.inputErrorClass);
        $(opts.formErrorSelector + '.' + opts.formErrorClass).removeClass(opts.formErrorClass);
        $form.find('[data-abide-error]').css('display', 'none');
        $(':input', $form).not(':button, :submit, :reset, :hidden, :radio, :checkbox, [data-abide-ignore]').val('').removeAttr('data-invalid');
        $(':input:radio', $form).not('[data-abide-ignore]').prop('checked', false).removeAttr('data-invalid');
        $(':input:checkbox', $form).not('[data-abide-ignore]').prop('checked', false).removeAttr('data-invalid');
        /**
         * Fires when the form has been reset.
         * @event Abide#formreset
         */
        $form.trigger('formreset.zf.abide', [$form]);
      }

      /**
       * Destroys an instance of Abide.
       * Removes error styles and classes from elements, without resetting their values.
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        var _this = this;
        this.$element.off('.abide').find('[data-abide-error]').css('display', 'none');

        this.$inputs.off('.abide').each(function () {
          _this.removeErrorClasses($(this));
        });

        Foundation.unregisterPlugin(this);
      }
    }]);

    return Abide;
  }();

  /**
   * Default settings for plugin
   */


  Abide.defaults = {
    /**
     * The default event to validate inputs. Checkboxes and radios validate immediately.
     * Remove or change this value for manual validation.
     * @option
     * @type {?string}
     * @default 'fieldChange'
     */
    validateOn: 'fieldChange',

    /**
     * Class to be applied to input labels on failed validation.
     * @option
     * @type {string}
     * @default 'is-invalid-label'
     */
    labelErrorClass: 'is-invalid-label',

    /**
     * Class to be applied to inputs on failed validation.
     * @option
     * @type {string}
     * @default 'is-invalid-input'
     */
    inputErrorClass: 'is-invalid-input',

    /**
     * Class selector to use to target Form Errors for show/hide.
     * @option
     * @type {string}
     * @default '.form-error'
     */
    formErrorSelector: '.form-error',

    /**
     * Class added to Form Errors on failed validation.
     * @option
     * @type {string}
     * @default 'is-visible'
     */
    formErrorClass: 'is-visible',

    /**
     * Set to true to validate text inputs on any value change.
     * @option
     * @type {boolean}
     * @default false
     */
    liveValidate: false,

    /**
     * Set to true to validate inputs on blur.
     * @option
     * @type {boolean}
     * @default false
     */
    validateOnBlur: false,

    patterns: {
      alpha: /^[a-zA-Z]+$/,
      alpha_numeric: /^[a-zA-Z0-9]+$/,
      integer: /^[-+]?\d+$/,
      number: /^[-+]?\d*(?:[\.\,]\d+)?$/,

      // amex, visa, diners
      card: /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})$/,
      cvv: /^([0-9]){3,4}$/,

      // http://www.whatwg.org/specs/web-apps/current-work/multipage/states-of-the-type-attribute.html#valid-e-mail-address
      email: /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/,

      url: /^(https?|ftp|file|ssh):\/\/(((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/,
      // abc.de
      domain: /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,8}$/,

      datetime: /^([0-2][0-9]{3})\-([0-1][0-9])\-([0-3][0-9])T([0-5][0-9])\:([0-5][0-9])\:([0-5][0-9])(Z|([\-\+]([0-1][0-9])\:00))$/,
      // YYYY-MM-DD
      date: /(?:19|20)[0-9]{2}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1[0-9]|2[0-9])|(?:(?!02)(?:0[1-9]|1[0-2])-(?:30))|(?:(?:0[13578]|1[02])-31))$/,
      // HH:MM:SS
      time: /^(0[0-9]|1[0-9]|2[0-3])(:[0-5][0-9]){2}$/,
      dateISO: /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/,
      // MM/DD/YYYY
      month_day_year: /^(0[1-9]|1[012])[- \/.](0[1-9]|[12][0-9]|3[01])[- \/.]\d{4}$/,
      // DD/MM/YYYY
      day_month_year: /^(0[1-9]|[12][0-9]|3[01])[- \/.](0[1-9]|1[012])[- \/.]\d{4}$/,

      // #FFF or #FFFFFF
      color: /^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/
    },

    /**
     * Optional validation functions to be used. `equalTo` being the only default included function.
     * Functions should return only a boolean if the input is valid or not. Functions are given the following arguments:
     * el : The jQuery element to validate.
     * required : Boolean value of the required attribute be present or not.
     * parent : The direct parent of the input.
     * @option
     */
    validators: {
      equalTo: function (el, required, parent) {
        return $('#' + el.attr('data-equalto')).val() === el.val();
      }
    }

    // Window exports
  };Foundation.plugin(Abide, 'Abide');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Accordion module.
   * @module foundation.accordion
   * @requires foundation.util.keyboard
   * @requires foundation.util.motion
   */

  var Accordion = function () {
    /**
     * Creates a new instance of an accordion.
     * @class
     * @fires Accordion#init
     * @param {jQuery} element - jQuery object to make into an accordion.
     * @param {Object} options - a plain object with settings to override the default options.
     */
    function Accordion(element, options) {
      _classCallCheck(this, Accordion);

      this.$element = element;
      this.options = $.extend({}, Accordion.defaults, this.$element.data(), options);

      this._init();

      Foundation.registerPlugin(this, 'Accordion');
      Foundation.Keyboard.register('Accordion', {
        'ENTER': 'toggle',
        'SPACE': 'toggle',
        'ARROW_DOWN': 'next',
        'ARROW_UP': 'previous'
      });
    }

    /**
     * Initializes the accordion by animating the preset active pane(s).
     * @private
     */


    _createClass(Accordion, [{
      key: '_init',
      value: function _init() {
        var _this2 = this;

        this.$element.attr('role', 'tablist');
        this.$tabs = this.$element.children('[data-accordion-item]');

        this.$tabs.each(function (idx, el) {
          var $el = $(el),
              $content = $el.children('[data-tab-content]'),
              id = $content[0].id || Foundation.GetYoDigits(6, 'accordion'),
              linkId = el.id || id + '-label';

          $el.find('a:first').attr({
            'aria-controls': id,
            'role': 'tab',
            'id': linkId,
            'aria-expanded': false,
            'aria-selected': false
          });

          $content.attr({ 'role': 'tabpanel', 'aria-labelledby': linkId, 'aria-hidden': true, 'id': id });
        });
        var $initActive = this.$element.find('.is-active').children('[data-tab-content]');
        this.firstTimeInit = true;
        if ($initActive.length) {
          this.down($initActive, this.firstTimeInit);
          this.firstTimeInit = false;
        }

        this._checkDeepLink = function () {
          var anchor = window.location.hash;
          //need a hash and a relevant anchor in this tabset
          if (anchor.length) {
            var $link = _this2.$element.find('[href$="' + anchor + '"]'),
                $anchor = $(anchor);

            if ($link.length && $anchor) {
              if (!$link.parent('[data-accordion-item]').hasClass('is-active')) {
                _this2.down($anchor, _this2.firstTimeInit);
                _this2.firstTimeInit = false;
              };

              //roll up a little to show the titles
              if (_this2.options.deepLinkSmudge) {
                var _this = _this2;
                $(window).load(function () {
                  var offset = _this.$element.offset();
                  $('html, body').animate({ scrollTop: offset.top }, _this.options.deepLinkSmudgeDelay);
                });
              }

              /**
                * Fires when the zplugin has deeplinked at pageload
                * @event Accordion#deeplink
                */
              _this2.$element.trigger('deeplink.zf.accordion', [$link, $anchor]);
            }
          }
        };

        //use browser to open a tab, if it exists in this tabset
        if (this.options.deepLink) {
          this._checkDeepLink();
        }

        this._events();
      }

      /**
       * Adds event handlers for items within the accordion.
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        var _this = this;

        this.$tabs.each(function () {
          var $elem = $(this);
          var $tabContent = $elem.children('[data-tab-content]');
          if ($tabContent.length) {
            $elem.children('a').off('click.zf.accordion keydown.zf.accordion').on('click.zf.accordion', function (e) {
              e.preventDefault();
              _this.toggle($tabContent);
            }).on('keydown.zf.accordion', function (e) {
              Foundation.Keyboard.handleKey(e, 'Accordion', {
                toggle: function () {
                  _this.toggle($tabContent);
                },
                next: function () {
                  var $a = $elem.next().find('a').focus();
                  if (!_this.options.multiExpand) {
                    $a.trigger('click.zf.accordion');
                  }
                },
                previous: function () {
                  var $a = $elem.prev().find('a').focus();
                  if (!_this.options.multiExpand) {
                    $a.trigger('click.zf.accordion');
                  }
                },
                handled: function () {
                  e.preventDefault();
                  e.stopPropagation();
                }
              });
            });
          }
        });
        if (this.options.deepLink) {
          $(window).on('popstate', this._checkDeepLink);
        }
      }

      /**
       * Toggles the selected content pane's open/close state.
       * @param {jQuery} $target - jQuery object of the pane to toggle (`.accordion-content`).
       * @function
       */

    }, {
      key: 'toggle',
      value: function toggle($target) {
        if ($target.parent().hasClass('is-active')) {
          this.up($target);
        } else {
          this.down($target);
        }
        //either replace or update browser history
        if (this.options.deepLink) {
          var anchor = $target.prev('a').attr('href');

          if (this.options.updateHistory) {
            history.pushState({}, '', anchor);
          } else {
            history.replaceState({}, '', anchor);
          }
        }
      }

      /**
       * Opens the accordion tab defined by `$target`.
       * @param {jQuery} $target - Accordion pane to open (`.accordion-content`).
       * @param {Boolean} firstTime - flag to determine if reflow should happen.
       * @fires Accordion#down
       * @function
       */

    }, {
      key: 'down',
      value: function down($target, firstTime) {
        var _this3 = this;

        $target.attr('aria-hidden', false).parent('[data-tab-content]').addBack().parent().addClass('is-active');

        if (!this.options.multiExpand && !firstTime) {
          var $currentActive = this.$element.children('.is-active').children('[data-tab-content]');
          if ($currentActive.length) {
            this.up($currentActive.not($target));
          }
        }

        $target.slideDown(this.options.slideSpeed, function () {
          /**
           * Fires when the tab is done opening.
           * @event Accordion#down
           */
          _this3.$element.trigger('down.zf.accordion', [$target]);
        });

        $('#' + $target.attr('aria-labelledby')).attr({
          'aria-expanded': true,
          'aria-selected': true
        });
      }

      /**
       * Closes the tab defined by `$target`.
       * @param {jQuery} $target - Accordion tab to close (`.accordion-content`).
       * @fires Accordion#up
       * @function
       */

    }, {
      key: 'up',
      value: function up($target) {
        var $aunts = $target.parent().siblings(),
            _this = this;

        if (!this.options.allowAllClosed && !$aunts.hasClass('is-active') || !$target.parent().hasClass('is-active')) {
          return;
        }

        // Foundation.Move(this.options.slideSpeed, $target, function(){
        $target.slideUp(_this.options.slideSpeed, function () {
          /**
           * Fires when the tab is done collapsing up.
           * @event Accordion#up
           */
          _this.$element.trigger('up.zf.accordion', [$target]);
        });
        // });

        $target.attr('aria-hidden', true).parent().removeClass('is-active');

        $('#' + $target.attr('aria-labelledby')).attr({
          'aria-expanded': false,
          'aria-selected': false
        });
      }

      /**
       * Destroys an instance of an accordion.
       * @fires Accordion#destroyed
       * @function
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this.$element.find('[data-tab-content]').stop(true).slideUp(0).css('display', '');
        this.$element.find('a').off('.zf.accordion');
        if (this.options.deepLink) {
          $(window).off('popstate', this._checkDeepLink);
        }

        Foundation.unregisterPlugin(this);
      }
    }]);

    return Accordion;
  }();

  Accordion.defaults = {
    /**
     * Amount of time to animate the opening of an accordion pane.
     * @option
     * @type {number}
     * @default 250
     */
    slideSpeed: 250,
    /**
     * Allow the accordion to have multiple open panes.
     * @option
     * @type {boolean}
     * @default false
     */
    multiExpand: false,
    /**
     * Allow the accordion to close all panes.
     * @option
     * @type {boolean}
     * @default false
     */
    allowAllClosed: false,
    /**
     * Allows the window to scroll to content of pane specified by hash anchor
     * @option
     * @type {boolean}
     * @default false
     */
    deepLink: false,

    /**
     * Adjust the deep link scroll to make sure the top of the accordion panel is visible
     * @option
     * @type {boolean}
     * @default false
     */
    deepLinkSmudge: false,

    /**
     * Animation time (ms) for the deep link adjustment
     * @option
     * @type {number}
     * @default 300
     */
    deepLinkSmudgeDelay: 300,

    /**
     * Update the browser history with the open accordion
     * @option
     * @type {boolean}
     * @default false
     */
    updateHistory: false
  };

  // Window exports
  Foundation.plugin(Accordion, 'Accordion');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * AccordionMenu module.
   * @module foundation.accordionMenu
   * @requires foundation.util.keyboard
   * @requires foundation.util.motion
   * @requires foundation.util.nest
   */

  var AccordionMenu = function () {
    /**
     * Creates a new instance of an accordion menu.
     * @class
     * @fires AccordionMenu#init
     * @param {jQuery} element - jQuery object to make into an accordion menu.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    function AccordionMenu(element, options) {
      _classCallCheck(this, AccordionMenu);

      this.$element = element;
      this.options = $.extend({}, AccordionMenu.defaults, this.$element.data(), options);

      Foundation.Nest.Feather(this.$element, 'accordion');

      this._init();

      Foundation.registerPlugin(this, 'AccordionMenu');
      Foundation.Keyboard.register('AccordionMenu', {
        'ENTER': 'toggle',
        'SPACE': 'toggle',
        'ARROW_RIGHT': 'open',
        'ARROW_UP': 'up',
        'ARROW_DOWN': 'down',
        'ARROW_LEFT': 'close',
        'ESCAPE': 'closeAll'
      });
    }

    /**
     * Initializes the accordion menu by hiding all nested menus.
     * @private
     */


    _createClass(AccordionMenu, [{
      key: '_init',
      value: function _init() {
        this.$element.find('[data-submenu]').not('.is-active').slideUp(0); //.find('a').css('padding-left', '1rem');
        this.$element.attr({
          'role': 'menu',
          'aria-multiselectable': this.options.multiOpen
        });

        this.$menuLinks = this.$element.find('.is-accordion-submenu-parent');
        this.$menuLinks.each(function () {
          var linkId = this.id || Foundation.GetYoDigits(6, 'acc-menu-link'),
              $elem = $(this),
              $sub = $elem.children('[data-submenu]'),
              subId = $sub[0].id || Foundation.GetYoDigits(6, 'acc-menu'),
              isActive = $sub.hasClass('is-active');
          $elem.attr({
            'aria-controls': subId,
            'aria-expanded': isActive,
            'role': 'menuitem',
            'id': linkId
          });
          $sub.attr({
            'aria-labelledby': linkId,
            'aria-hidden': !isActive,
            'role': 'menu',
            'id': subId
          });
        });
        var initPanes = this.$element.find('.is-active');
        if (initPanes.length) {
          var _this = this;
          initPanes.each(function () {
            _this.down($(this));
          });
        }
        this._events();
      }

      /**
       * Adds event handlers for items within the menu.
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        var _this = this;

        this.$element.find('li').each(function () {
          var $submenu = $(this).children('[data-submenu]');

          if ($submenu.length) {
            $(this).children('a').off('click.zf.accordionMenu').on('click.zf.accordionMenu', function (e) {
              e.preventDefault();

              _this.toggle($submenu);
            });
          }
        }).on('keydown.zf.accordionmenu', function (e) {
          var $element = $(this),
              $elements = $element.parent('ul').children('li'),
              $prevElement,
              $nextElement,
              $target = $element.children('[data-submenu]');

          $elements.each(function (i) {
            if ($(this).is($element)) {
              $prevElement = $elements.eq(Math.max(0, i - 1)).find('a').first();
              $nextElement = $elements.eq(Math.min(i + 1, $elements.length - 1)).find('a').first();

              if ($(this).children('[data-submenu]:visible').length) {
                // has open sub menu
                $nextElement = $element.find('li:first-child').find('a').first();
              }
              if ($(this).is(':first-child')) {
                // is first element of sub menu
                $prevElement = $element.parents('li').first().find('a').first();
              } else if ($prevElement.parents('li').first().children('[data-submenu]:visible').length) {
                // if previous element has open sub menu
                $prevElement = $prevElement.parents('li').find('li:last-child').find('a').first();
              }
              if ($(this).is(':last-child')) {
                // is last element of sub menu
                $nextElement = $element.parents('li').first().next('li').find('a').first();
              }

              return;
            }
          });

          Foundation.Keyboard.handleKey(e, 'AccordionMenu', {
            open: function () {
              if ($target.is(':hidden')) {
                _this.down($target);
                $target.find('li').first().find('a').first().focus();
              }
            },
            close: function () {
              if ($target.length && !$target.is(':hidden')) {
                // close active sub of this item
                _this.up($target);
              } else if ($element.parent('[data-submenu]').length) {
                // close currently open sub
                _this.up($element.parent('[data-submenu]'));
                $element.parents('li').first().find('a').first().focus();
              }
            },
            up: function () {
              $prevElement.focus();
              return true;
            },
            down: function () {
              $nextElement.focus();
              return true;
            },
            toggle: function () {
              if ($element.children('[data-submenu]').length) {
                _this.toggle($element.children('[data-submenu]'));
              }
            },
            closeAll: function () {
              _this.hideAll();
            },
            handled: function (preventDefault) {
              if (preventDefault) {
                e.preventDefault();
              }
              e.stopImmediatePropagation();
            }
          });
        }); //.attr('tabindex', 0);
      }

      /**
       * Closes all panes of the menu.
       * @function
       */

    }, {
      key: 'hideAll',
      value: function hideAll() {
        this.up(this.$element.find('[data-submenu]'));
      }

      /**
       * Opens all panes of the menu.
       * @function
       */

    }, {
      key: 'showAll',
      value: function showAll() {
        this.down(this.$element.find('[data-submenu]'));
      }

      /**
       * Toggles the open/close state of a submenu.
       * @function
       * @param {jQuery} $target - the submenu to toggle
       */

    }, {
      key: 'toggle',
      value: function toggle($target) {
        if (!$target.is(':animated')) {
          if (!$target.is(':hidden')) {
            this.up($target);
          } else {
            this.down($target);
          }
        }
      }

      /**
       * Opens the sub-menu defined by `$target`.
       * @param {jQuery} $target - Sub-menu to open.
       * @fires AccordionMenu#down
       */

    }, {
      key: 'down',
      value: function down($target) {
        var _this = this;

        if (!this.options.multiOpen) {
          this.up(this.$element.find('.is-active').not($target.parentsUntil(this.$element).add($target)));
        }

        $target.addClass('is-active').attr({ 'aria-hidden': false }).parent('.is-accordion-submenu-parent').attr({ 'aria-expanded': true });

        //Foundation.Move(this.options.slideSpeed, $target, function() {
        $target.slideDown(_this.options.slideSpeed, function () {
          /**
           * Fires when the menu is done opening.
           * @event AccordionMenu#down
           */
          _this.$element.trigger('down.zf.accordionMenu', [$target]);
        });
        //});
      }

      /**
       * Closes the sub-menu defined by `$target`. All sub-menus inside the target will be closed as well.
       * @param {jQuery} $target - Sub-menu to close.
       * @fires AccordionMenu#up
       */

    }, {
      key: 'up',
      value: function up($target) {
        var _this = this;
        //Foundation.Move(this.options.slideSpeed, $target, function(){
        $target.slideUp(_this.options.slideSpeed, function () {
          /**
           * Fires when the menu is done collapsing up.
           * @event AccordionMenu#up
           */
          _this.$element.trigger('up.zf.accordionMenu', [$target]);
        });
        //});

        var $menus = $target.find('[data-submenu]').slideUp(0).addBack().attr('aria-hidden', true);

        $menus.parent('.is-accordion-submenu-parent').attr('aria-expanded', false);
      }

      /**
       * Destroys an instance of accordion menu.
       * @fires AccordionMenu#destroyed
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this.$element.find('[data-submenu]').slideDown(0).css('display', '');
        this.$element.find('a').off('click.zf.accordionMenu');

        Foundation.Nest.Burn(this.$element, 'accordion');
        Foundation.unregisterPlugin(this);
      }
    }]);

    return AccordionMenu;
  }();

  AccordionMenu.defaults = {
    /**
     * Amount of time to animate the opening of a submenu in ms.
     * @option
     * @type {number}
     * @default 250
     */
    slideSpeed: 250,
    /**
     * Allow the menu to have multiple open panes.
     * @option
     * @type {boolean}
     * @default true
     */
    multiOpen: true
  };

  // Window exports
  Foundation.plugin(AccordionMenu, 'AccordionMenu');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Drilldown module.
   * @module foundation.drilldown
   * @requires foundation.util.keyboard
   * @requires foundation.util.motion
   * @requires foundation.util.nest
   */

  var Drilldown = function () {
    /**
     * Creates a new instance of a drilldown menu.
     * @class
     * @param {jQuery} element - jQuery object to make into an accordion menu.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    function Drilldown(element, options) {
      _classCallCheck(this, Drilldown);

      this.$element = element;
      this.options = $.extend({}, Drilldown.defaults, this.$element.data(), options);

      Foundation.Nest.Feather(this.$element, 'drilldown');

      this._init();

      Foundation.registerPlugin(this, 'Drilldown');
      Foundation.Keyboard.register('Drilldown', {
        'ENTER': 'open',
        'SPACE': 'open',
        'ARROW_RIGHT': 'next',
        'ARROW_UP': 'up',
        'ARROW_DOWN': 'down',
        'ARROW_LEFT': 'previous',
        'ESCAPE': 'close',
        'TAB': 'down',
        'SHIFT_TAB': 'up'
      });
    }

    /**
     * Initializes the drilldown by creating jQuery collections of elements
     * @private
     */


    _createClass(Drilldown, [{
      key: '_init',
      value: function _init() {
        this.$submenuAnchors = this.$element.find('li.is-drilldown-submenu-parent').children('a');
        this.$submenus = this.$submenuAnchors.parent('li').children('[data-submenu]');
        this.$menuItems = this.$element.find('li').not('.js-drilldown-back').attr('role', 'menuitem').find('a');
        this.$element.attr('data-mutate', this.$element.attr('data-drilldown') || Foundation.GetYoDigits(6, 'drilldown'));

        this._prepareMenu();
        this._registerEvents();

        this._keyboardEvents();
      }

      /**
       * prepares drilldown menu by setting attributes to links and elements
       * sets a min height to prevent content jumping
       * wraps the element if not already wrapped
       * @private
       * @function
       */

    }, {
      key: '_prepareMenu',
      value: function _prepareMenu() {
        var _this = this;
        // if(!this.options.holdOpen){
        //   this._menuLinkEvents();
        // }
        this.$submenuAnchors.each(function () {
          var $link = $(this);
          var $sub = $link.parent();
          if (_this.options.parentLink) {
            $link.clone().prependTo($sub.children('[data-submenu]')).wrap('<li class="is-submenu-parent-item is-submenu-item is-drilldown-submenu-item" role="menu-item"></li>');
          }
          $link.data('savedHref', $link.attr('href')).removeAttr('href').attr('tabindex', 0);
          $link.children('[data-submenu]').attr({
            'aria-hidden': true,
            'tabindex': 0,
            'role': 'menu'
          });
          _this._events($link);
        });
        this.$submenus.each(function () {
          var $menu = $(this),
              $back = $menu.find('.js-drilldown-back');
          if (!$back.length) {
            switch (_this.options.backButtonPosition) {
              case "bottom":
                $menu.append(_this.options.backButton);
                break;
              case "top":
                $menu.prepend(_this.options.backButton);
                break;
              default:
                console.error("Unsupported backButtonPosition value '" + _this.options.backButtonPosition + "'");
            }
          }
          _this._back($menu);
        });

        this.$submenus.addClass('invisible');
        if (!this.options.autoHeight) {
          this.$submenus.addClass('drilldown-submenu-cover-previous');
        }

        // create a wrapper on element if it doesn't exist.
        if (!this.$element.parent().hasClass('is-drilldown')) {
          this.$wrapper = $(this.options.wrapper).addClass('is-drilldown');
          if (this.options.animateHeight) this.$wrapper.addClass('animate-height');
          this.$element.wrap(this.$wrapper);
        }
        // set wrapper
        this.$wrapper = this.$element.parent();
        this.$wrapper.css(this._getMaxDims());
      }
    }, {
      key: '_resize',
      value: function _resize() {
        this.$wrapper.css({ 'max-width': 'none', 'min-height': 'none' });
        // _getMaxDims has side effects (boo) but calling it should update all other necessary heights & widths
        this.$wrapper.css(this._getMaxDims());
      }

      /**
       * Adds event handlers to elements in the menu.
       * @function
       * @private
       * @param {jQuery} $elem - the current menu item to add handlers to.
       */

    }, {
      key: '_events',
      value: function _events($elem) {
        var _this = this;

        $elem.off('click.zf.drilldown').on('click.zf.drilldown', function (e) {
          if ($(e.target).parentsUntil('ul', 'li').hasClass('is-drilldown-submenu-parent')) {
            e.stopImmediatePropagation();
            e.preventDefault();
          }

          // if(e.target !== e.currentTarget.firstElementChild){
          //   return false;
          // }
          _this._show($elem.parent('li'));

          if (_this.options.closeOnClick) {
            var $body = $('body');
            $body.off('.zf.drilldown').on('click.zf.drilldown', function (e) {
              if (e.target === _this.$element[0] || $.contains(_this.$element[0], e.target)) {
                return;
              }
              e.preventDefault();
              _this._hideAll();
              $body.off('.zf.drilldown');
            });
          }
        });
        this.$element.on('mutateme.zf.trigger', this._resize.bind(this));
      }

      /**
       * Adds event handlers to the menu element.
       * @function
       * @private
       */

    }, {
      key: '_registerEvents',
      value: function _registerEvents() {
        if (this.options.scrollTop) {
          this._bindHandler = this._scrollTop.bind(this);
          this.$element.on('open.zf.drilldown hide.zf.drilldown closed.zf.drilldown', this._bindHandler);
        }
      }

      /**
       * Scroll to Top of Element or data-scroll-top-element
       * @function
       * @fires Drilldown#scrollme
       */

    }, {
      key: '_scrollTop',
      value: function _scrollTop() {
        var _this = this;
        var $scrollTopElement = _this.options.scrollTopElement != '' ? $(_this.options.scrollTopElement) : _this.$element,
            scrollPos = parseInt($scrollTopElement.offset().top + _this.options.scrollTopOffset);
        $('html, body').stop(true).animate({ scrollTop: scrollPos }, _this.options.animationDuration, _this.options.animationEasing, function () {
          /**
            * Fires after the menu has scrolled
            * @event Drilldown#scrollme
            */
          if (this === $('html')[0]) _this.$element.trigger('scrollme.zf.drilldown');
        });
      }

      /**
       * Adds keydown event listener to `li`'s in the menu.
       * @private
       */

    }, {
      key: '_keyboardEvents',
      value: function _keyboardEvents() {
        var _this = this;

        this.$menuItems.add(this.$element.find('.js-drilldown-back > a, .is-submenu-parent-item > a')).on('keydown.zf.drilldown', function (e) {
          var $element = $(this),
              $elements = $element.parent('li').parent('ul').children('li').children('a'),
              $prevElement,
              $nextElement;

          $elements.each(function (i) {
            if ($(this).is($element)) {
              $prevElement = $elements.eq(Math.max(0, i - 1));
              $nextElement = $elements.eq(Math.min(i + 1, $elements.length - 1));
              return;
            }
          });

          Foundation.Keyboard.handleKey(e, 'Drilldown', {
            next: function () {
              if ($element.is(_this.$submenuAnchors)) {
                _this._show($element.parent('li'));
                $element.parent('li').one(Foundation.transitionend($element), function () {
                  $element.parent('li').find('ul li a').filter(_this.$menuItems).first().focus();
                });
                return true;
              }
            },
            previous: function () {
              _this._hide($element.parent('li').parent('ul'));
              $element.parent('li').parent('ul').one(Foundation.transitionend($element), function () {
                setTimeout(function () {
                  $element.parent('li').parent('ul').parent('li').children('a').first().focus();
                }, 1);
              });
              return true;
            },
            up: function () {
              $prevElement.focus();
              // Don't tap focus on first element in root ul
              return !$element.is(_this.$element.find('> li:first-child > a'));
            },
            down: function () {
              $nextElement.focus();
              // Don't tap focus on last element in root ul
              return !$element.is(_this.$element.find('> li:last-child > a'));
            },
            close: function () {
              // Don't close on element in root ul
              if (!$element.is(_this.$element.find('> li > a'))) {
                _this._hide($element.parent().parent());
                $element.parent().parent().siblings('a').focus();
              }
            },
            open: function () {
              if (!$element.is(_this.$menuItems)) {
                // not menu item means back button
                _this._hide($element.parent('li').parent('ul'));
                $element.parent('li').parent('ul').one(Foundation.transitionend($element), function () {
                  setTimeout(function () {
                    $element.parent('li').parent('ul').parent('li').children('a').first().focus();
                  }, 1);
                });
                return true;
              } else if ($element.is(_this.$submenuAnchors)) {
                _this._show($element.parent('li'));
                $element.parent('li').one(Foundation.transitionend($element), function () {
                  $element.parent('li').find('ul li a').filter(_this.$menuItems).first().focus();
                });
                return true;
              }
            },
            handled: function (preventDefault) {
              if (preventDefault) {
                e.preventDefault();
              }
              e.stopImmediatePropagation();
            }
          });
        }); // end keyboardAccess
      }

      /**
       * Closes all open elements, and returns to root menu.
       * @function
       * @fires Drilldown#closed
       */

    }, {
      key: '_hideAll',
      value: function _hideAll() {
        var $elem = this.$element.find('.is-drilldown-submenu.is-active').addClass('is-closing');
        if (this.options.autoHeight) this.$wrapper.css({ height: $elem.parent().closest('ul').data('calcHeight') });
        $elem.one(Foundation.transitionend($elem), function (e) {
          $elem.removeClass('is-active is-closing');
        });
        /**
         * Fires when the menu is fully closed.
         * @event Drilldown#closed
         */
        this.$element.trigger('closed.zf.drilldown');
      }

      /**
       * Adds event listener for each `back` button, and closes open menus.
       * @function
       * @fires Drilldown#back
       * @param {jQuery} $elem - the current sub-menu to add `back` event.
       */

    }, {
      key: '_back',
      value: function _back($elem) {
        var _this = this;
        $elem.off('click.zf.drilldown');
        $elem.children('.js-drilldown-back').on('click.zf.drilldown', function (e) {
          e.stopImmediatePropagation();
          // console.log('mouseup on back');
          _this._hide($elem);

          // If there is a parent submenu, call show
          var parentSubMenu = $elem.parent('li').parent('ul').parent('li');
          if (parentSubMenu.length) {
            _this._show(parentSubMenu);
          }
        });
      }

      /**
       * Adds event listener to menu items w/o submenus to close open menus on click.
       * @function
       * @private
       */

    }, {
      key: '_menuLinkEvents',
      value: function _menuLinkEvents() {
        var _this = this;
        this.$menuItems.not('.is-drilldown-submenu-parent').off('click.zf.drilldown').on('click.zf.drilldown', function (e) {
          // e.stopImmediatePropagation();
          setTimeout(function () {
            _this._hideAll();
          }, 0);
        });
      }

      /**
       * Opens a submenu.
       * @function
       * @fires Drilldown#open
       * @param {jQuery} $elem - the current element with a submenu to open, i.e. the `li` tag.
       */

    }, {
      key: '_show',
      value: function _show($elem) {
        if (this.options.autoHeight) this.$wrapper.css({ height: $elem.children('[data-submenu]').data('calcHeight') });
        $elem.attr('aria-expanded', true);
        $elem.children('[data-submenu]').addClass('is-active').removeClass('invisible').attr('aria-hidden', false);
        /**
         * Fires when the submenu has opened.
         * @event Drilldown#open
         */
        this.$element.trigger('open.zf.drilldown', [$elem]);
      }
    }, {
      key: '_hide',


      /**
       * Hides a submenu
       * @function
       * @fires Drilldown#hide
       * @param {jQuery} $elem - the current sub-menu to hide, i.e. the `ul` tag.
       */
      value: function _hide($elem) {
        if (this.options.autoHeight) this.$wrapper.css({ height: $elem.parent().closest('ul').data('calcHeight') });
        var _this = this;
        $elem.parent('li').attr('aria-expanded', false);
        $elem.attr('aria-hidden', true).addClass('is-closing');
        $elem.addClass('is-closing').one(Foundation.transitionend($elem), function () {
          $elem.removeClass('is-active is-closing');
          $elem.blur().addClass('invisible');
        });
        /**
         * Fires when the submenu has closed.
         * @event Drilldown#hide
         */
        $elem.trigger('hide.zf.drilldown', [$elem]);
      }

      /**
       * Iterates through the nested menus to calculate the min-height, and max-width for the menu.
       * Prevents content jumping.
       * @function
       * @private
       */

    }, {
      key: '_getMaxDims',
      value: function _getMaxDims() {
        var maxHeight = 0,
            result = {},
            _this = this;
        this.$submenus.add(this.$element).each(function () {
          var numOfElems = $(this).children('li').length;
          var height = Foundation.Box.GetDimensions(this).height;
          maxHeight = height > maxHeight ? height : maxHeight;
          if (_this.options.autoHeight) {
            $(this).data('calcHeight', height);
            if (!$(this).hasClass('is-drilldown-submenu')) result['height'] = height;
          }
        });

        if (!this.options.autoHeight) result['min-height'] = maxHeight + 'px';

        result['max-width'] = this.$element[0].getBoundingClientRect().width + 'px';

        return result;
      }

      /**
       * Destroys the Drilldown Menu
       * @function
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        if (this.options.scrollTop) this.$element.off('.zf.drilldown', this._bindHandler);
        this._hideAll();
        this.$element.off('mutateme.zf.trigger');
        Foundation.Nest.Burn(this.$element, 'drilldown');
        this.$element.unwrap().find('.js-drilldown-back, .is-submenu-parent-item').remove().end().find('.is-active, .is-closing, .is-drilldown-submenu').removeClass('is-active is-closing is-drilldown-submenu').end().find('[data-submenu]').removeAttr('aria-hidden tabindex role');
        this.$submenuAnchors.each(function () {
          $(this).off('.zf.drilldown');
        });

        this.$submenus.removeClass('drilldown-submenu-cover-previous');

        this.$element.find('a').each(function () {
          var $link = $(this);
          $link.removeAttr('tabindex');
          if ($link.data('savedHref')) {
            $link.attr('href', $link.data('savedHref')).removeData('savedHref');
          } else {
            return;
          }
        });
        Foundation.unregisterPlugin(this);
      }
    }]);

    return Drilldown;
  }();

  Drilldown.defaults = {
    /**
     * Markup used for JS generated back button. Prepended  or appended (see backButtonPosition) to submenu lists and deleted on `destroy` method, 'js-drilldown-back' class required. Remove the backslash (`\`) if copy and pasting.
     * @option
     * @type {string}
     * @default '<li class="js-drilldown-back"><a tabindex="0">Back</a></li>'
     */
    backButton: '<li class="js-drilldown-back"><a tabindex="0">Back</a></li>',
    /**
     * Position the back button either at the top or bottom of drilldown submenus. Can be `'left'` or `'bottom'`.
     * @option
     * @type {string}
     * @default top
     */
    backButtonPosition: 'top',
    /**
     * Markup used to wrap drilldown menu. Use a class name for independent styling; the JS applied class: `is-drilldown` is required. Remove the backslash (`\`) if copy and pasting.
     * @option
     * @type {string}
     * @default '<div></div>'
     */
    wrapper: '<div></div>',
    /**
     * Adds the parent link to the submenu.
     * @option
     * @type {boolean}
     * @default false
     */
    parentLink: false,
    /**
     * Allow the menu to return to root list on body click.
     * @option
     * @type {boolean}
     * @default false
     */
    closeOnClick: false,
    /**
     * Allow the menu to auto adjust height.
     * @option
     * @type {boolean}
     * @default false
     */
    autoHeight: false,
    /**
     * Animate the auto adjust height.
     * @option
     * @type {boolean}
     * @default false
     */
    animateHeight: false,
    /**
     * Scroll to the top of the menu after opening a submenu or navigating back using the menu back button
     * @option
     * @type {boolean}
     * @default false
     */
    scrollTop: false,
    /**
     * String jquery selector (for example 'body') of element to take offset().top from, if empty string the drilldown menu offset().top is taken
     * @option
     * @type {string}
     * @default ''
     */
    scrollTopElement: '',
    /**
     * ScrollTop offset
     * @option
     * @type {number}
     * @default 0
     */
    scrollTopOffset: 0,
    /**
     * Scroll animation duration
     * @option
     * @type {number}
     * @default 500
     */
    animationDuration: 500,
    /**
     * Scroll animation easing. Can be `'swing'` or `'linear'`.
     * @option
     * @type {string}
     * @see {@link https://api.jquery.com/animate|JQuery animate}
     * @default 'swing'
     */
    animationEasing: 'swing'
    // holdOpen: false
  };

  // Window exports
  Foundation.plugin(Drilldown, 'Drilldown');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Equalizer module.
   * @module foundation.equalizer
   * @requires foundation.util.mediaQuery
   * @requires foundation.util.timerAndImageLoader if equalizer contains images
   */

  var Equalizer = function () {
    /**
     * Creates a new instance of Equalizer.
     * @class
     * @fires Equalizer#init
     * @param {Object} element - jQuery object to add the trigger to.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    function Equalizer(element, options) {
      _classCallCheck(this, Equalizer);

      this.$element = element;
      this.options = $.extend({}, Equalizer.defaults, this.$element.data(), options);

      this._init();

      Foundation.registerPlugin(this, 'Equalizer');
    }

    /**
     * Initializes the Equalizer plugin and calls functions to get equalizer functioning on load.
     * @private
     */


    _createClass(Equalizer, [{
      key: '_init',
      value: function _init() {
        var eqId = this.$element.attr('data-equalizer') || '';
        var $watched = this.$element.find('[data-equalizer-watch="' + eqId + '"]');

        this.$watched = $watched.length ? $watched : this.$element.find('[data-equalizer-watch]');
        this.$element.attr('data-resize', eqId || Foundation.GetYoDigits(6, 'eq'));
        this.$element.attr('data-mutate', eqId || Foundation.GetYoDigits(6, 'eq'));

        this.hasNested = this.$element.find('[data-equalizer]').length > 0;
        this.isNested = this.$element.parentsUntil(document.body, '[data-equalizer]').length > 0;
        this.isOn = false;
        this._bindHandler = {
          onResizeMeBound: this._onResizeMe.bind(this),
          onPostEqualizedBound: this._onPostEqualized.bind(this)
        };

        var imgs = this.$element.find('img');
        var tooSmall;
        if (this.options.equalizeOn) {
          tooSmall = this._checkMQ();
          $(window).on('changed.zf.mediaquery', this._checkMQ.bind(this));
        } else {
          this._events();
        }
        if (tooSmall !== undefined && tooSmall === false || tooSmall === undefined) {
          if (imgs.length) {
            Foundation.onImagesLoaded(imgs, this._reflow.bind(this));
          } else {
            this._reflow();
          }
        }
      }

      /**
       * Removes event listeners if the breakpoint is too small.
       * @private
       */

    }, {
      key: '_pauseEvents',
      value: function _pauseEvents() {
        this.isOn = false;
        this.$element.off({
          '.zf.equalizer': this._bindHandler.onPostEqualizedBound,
          'resizeme.zf.trigger': this._bindHandler.onResizeMeBound,
          'mutateme.zf.trigger': this._bindHandler.onResizeMeBound
        });
      }

      /**
       * function to handle $elements resizeme.zf.trigger, with bound this on _bindHandler.onResizeMeBound
       * @private
       */

    }, {
      key: '_onResizeMe',
      value: function _onResizeMe(e) {
        this._reflow();
      }

      /**
       * function to handle $elements postequalized.zf.equalizer, with bound this on _bindHandler.onPostEqualizedBound
       * @private
       */

    }, {
      key: '_onPostEqualized',
      value: function _onPostEqualized(e) {
        if (e.target !== this.$element[0]) {
          this._reflow();
        }
      }

      /**
       * Initializes events for Equalizer.
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        var _this = this;
        this._pauseEvents();
        if (this.hasNested) {
          this.$element.on('postequalized.zf.equalizer', this._bindHandler.onPostEqualizedBound);
        } else {
          this.$element.on('resizeme.zf.trigger', this._bindHandler.onResizeMeBound);
          this.$element.on('mutateme.zf.trigger', this._bindHandler.onResizeMeBound);
        }
        this.isOn = true;
      }

      /**
       * Checks the current breakpoint to the minimum required size.
       * @private
       */

    }, {
      key: '_checkMQ',
      value: function _checkMQ() {
        var tooSmall = !Foundation.MediaQuery.is(this.options.equalizeOn);
        if (tooSmall) {
          if (this.isOn) {
            this._pauseEvents();
            this.$watched.css('height', 'auto');
          }
        } else {
          if (!this.isOn) {
            this._events();
          }
        }
        return tooSmall;
      }

      /**
       * A noop version for the plugin
       * @private
       */

    }, {
      key: '_killswitch',
      value: function _killswitch() {
        return;
      }

      /**
       * Calls necessary functions to update Equalizer upon DOM change
       * @private
       */

    }, {
      key: '_reflow',
      value: function _reflow() {
        if (!this.options.equalizeOnStack) {
          if (this._isStacked()) {
            this.$watched.css('height', 'auto');
            return false;
          }
        }
        if (this.options.equalizeByRow) {
          this.getHeightsByRow(this.applyHeightByRow.bind(this));
        } else {
          this.getHeights(this.applyHeight.bind(this));
        }
      }

      /**
       * Manually determines if the first 2 elements are *NOT* stacked.
       * @private
       */

    }, {
      key: '_isStacked',
      value: function _isStacked() {
        if (!this.$watched[0] || !this.$watched[1]) {
          return true;
        }
        return this.$watched[0].getBoundingClientRect().top !== this.$watched[1].getBoundingClientRect().top;
      }

      /**
       * Finds the outer heights of children contained within an Equalizer parent and returns them in an array
       * @param {Function} cb - A non-optional callback to return the heights array to.
       * @returns {Array} heights - An array of heights of children within Equalizer container
       */

    }, {
      key: 'getHeights',
      value: function getHeights(cb) {
        var heights = [];
        for (var i = 0, len = this.$watched.length; i < len; i++) {
          this.$watched[i].style.height = 'auto';
          heights.push(this.$watched[i].offsetHeight);
        }
        cb(heights);
      }

      /**
       * Finds the outer heights of children contained within an Equalizer parent and returns them in an array
       * @param {Function} cb - A non-optional callback to return the heights array to.
       * @returns {Array} groups - An array of heights of children within Equalizer container grouped by row with element,height and max as last child
       */

    }, {
      key: 'getHeightsByRow',
      value: function getHeightsByRow(cb) {
        var lastElTopOffset = this.$watched.length ? this.$watched.first().offset().top : 0,
            groups = [],
            group = 0;
        //group by Row
        groups[group] = [];
        for (var i = 0, len = this.$watched.length; i < len; i++) {
          this.$watched[i].style.height = 'auto';
          //maybe could use this.$watched[i].offsetTop
          var elOffsetTop = $(this.$watched[i]).offset().top;
          if (elOffsetTop != lastElTopOffset) {
            group++;
            groups[group] = [];
            lastElTopOffset = elOffsetTop;
          }
          groups[group].push([this.$watched[i], this.$watched[i].offsetHeight]);
        }

        for (var j = 0, ln = groups.length; j < ln; j++) {
          var heights = $(groups[j]).map(function () {
            return this[1];
          }).get();
          var max = Math.max.apply(null, heights);
          groups[j].push(max);
        }
        cb(groups);
      }

      /**
       * Changes the CSS height property of each child in an Equalizer parent to match the tallest
       * @param {array} heights - An array of heights of children within Equalizer container
       * @fires Equalizer#preequalized
       * @fires Equalizer#postequalized
       */

    }, {
      key: 'applyHeight',
      value: function applyHeight(heights) {
        var max = Math.max.apply(null, heights);
        /**
         * Fires before the heights are applied
         * @event Equalizer#preequalized
         */
        this.$element.trigger('preequalized.zf.equalizer');

        this.$watched.css('height', max);

        /**
         * Fires when the heights have been applied
         * @event Equalizer#postequalized
         */
        this.$element.trigger('postequalized.zf.equalizer');
      }

      /**
       * Changes the CSS height property of each child in an Equalizer parent to match the tallest by row
       * @param {array} groups - An array of heights of children within Equalizer container grouped by row with element,height and max as last child
       * @fires Equalizer#preequalized
       * @fires Equalizer#preequalizedrow
       * @fires Equalizer#postequalizedrow
       * @fires Equalizer#postequalized
       */

    }, {
      key: 'applyHeightByRow',
      value: function applyHeightByRow(groups) {
        /**
         * Fires before the heights are applied
         */
        this.$element.trigger('preequalized.zf.equalizer');
        for (var i = 0, len = groups.length; i < len; i++) {
          var groupsILength = groups[i].length,
              max = groups[i][groupsILength - 1];
          if (groupsILength <= 2) {
            $(groups[i][0][0]).css({ 'height': 'auto' });
            continue;
          }
          /**
            * Fires before the heights per row are applied
            * @event Equalizer#preequalizedrow
            */
          this.$element.trigger('preequalizedrow.zf.equalizer');
          for (var j = 0, lenJ = groupsILength - 1; j < lenJ; j++) {
            $(groups[i][j][0]).css({ 'height': max });
          }
          /**
            * Fires when the heights per row have been applied
            * @event Equalizer#postequalizedrow
            */
          this.$element.trigger('postequalizedrow.zf.equalizer');
        }
        /**
         * Fires when the heights have been applied
         */
        this.$element.trigger('postequalized.zf.equalizer');
      }

      /**
       * Destroys an instance of Equalizer.
       * @function
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this._pauseEvents();
        this.$watched.css('height', 'auto');

        Foundation.unregisterPlugin(this);
      }
    }]);

    return Equalizer;
  }();

  /**
   * Default settings for plugin
   */


  Equalizer.defaults = {
    /**
     * Enable height equalization when stacked on smaller screens.
     * @option
     * @type {boolean}
     * @default false
     */
    equalizeOnStack: false,
    /**
     * Enable height equalization row by row.
     * @option
     * @type {boolean}
     * @default false
     */
    equalizeByRow: false,
    /**
     * String representing the minimum breakpoint size the plugin should equalize heights on.
     * @option
     * @type {string}
     * @default ''
     */
    equalizeOn: ''
  };

  // Window exports
  Foundation.plugin(Equalizer, 'Equalizer');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Interchange module.
   * @module foundation.interchange
   * @requires foundation.util.mediaQuery
   * @requires foundation.util.timerAndImageLoader
   */

  var Interchange = function () {
    /**
     * Creates a new instance of Interchange.
     * @class
     * @fires Interchange#init
     * @param {Object} element - jQuery object to add the trigger to.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    function Interchange(element, options) {
      _classCallCheck(this, Interchange);

      this.$element = element;
      this.options = $.extend({}, Interchange.defaults, options);
      this.rules = [];
      this.currentPath = '';

      this._init();
      this._events();

      Foundation.registerPlugin(this, 'Interchange');
    }

    /**
     * Initializes the Interchange plugin and calls functions to get interchange functioning on load.
     * @function
     * @private
     */


    _createClass(Interchange, [{
      key: '_init',
      value: function _init() {
        this._addBreakpoints();
        this._generateRules();
        this._reflow();
      }

      /**
       * Initializes events for Interchange.
       * @function
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        var _this2 = this;

        $(window).on('resize.zf.interchange', Foundation.util.throttle(function () {
          _this2._reflow();
        }, 50));
      }

      /**
       * Calls necessary functions to update Interchange upon DOM change
       * @function
       * @private
       */

    }, {
      key: '_reflow',
      value: function _reflow() {
        var match;

        // Iterate through each rule, but only save the last match
        for (var i in this.rules) {
          if (this.rules.hasOwnProperty(i)) {
            var rule = this.rules[i];
            if (window.matchMedia(rule.query).matches) {
              match = rule;
            }
          }
        }

        if (match) {
          this.replace(match.path);
        }
      }

      /**
       * Gets the Foundation breakpoints and adds them to the Interchange.SPECIAL_QUERIES object.
       * @function
       * @private
       */

    }, {
      key: '_addBreakpoints',
      value: function _addBreakpoints() {
        for (var i in Foundation.MediaQuery.queries) {
          if (Foundation.MediaQuery.queries.hasOwnProperty(i)) {
            var query = Foundation.MediaQuery.queries[i];
            Interchange.SPECIAL_QUERIES[query.name] = query.value;
          }
        }
      }

      /**
       * Checks the Interchange element for the provided media query + content pairings
       * @function
       * @private
       * @param {Object} element - jQuery object that is an Interchange instance
       * @returns {Array} scenarios - Array of objects that have 'mq' and 'path' keys with corresponding keys
       */

    }, {
      key: '_generateRules',
      value: function _generateRules(element) {
        var rulesList = [];
        var rules;

        if (this.options.rules) {
          rules = this.options.rules;
        } else {
          rules = this.$element.data('interchange');
        }

        rules = typeof rules === 'string' ? rules.match(/\[.*?\]/g) : rules;

        for (var i in rules) {
          if (rules.hasOwnProperty(i)) {
            var rule = rules[i].slice(1, -1).split(', ');
            var path = rule.slice(0, -1).join('');
            var query = rule[rule.length - 1];

            if (Interchange.SPECIAL_QUERIES[query]) {
              query = Interchange.SPECIAL_QUERIES[query];
            }

            rulesList.push({
              path: path,
              query: query
            });
          }
        }

        this.rules = rulesList;
      }

      /**
       * Update the `src` property of an image, or change the HTML of a container, to the specified path.
       * @function
       * @param {String} path - Path to the image or HTML partial.
       * @fires Interchange#replaced
       */

    }, {
      key: 'replace',
      value: function replace(path) {
        if (this.currentPath === path) return;

        var _this = this,
            trigger = 'replaced.zf.interchange';

        // Replacing images
        if (this.$element[0].nodeName === 'IMG') {
          this.$element.attr('src', path).on('load', function () {
            _this.currentPath = path;
          }).trigger(trigger);
        }
        // Replacing background images
        else if (path.match(/\.(gif|jpg|jpeg|png|svg|tiff)([?#].*)?/i)) {
            this.$element.css({ 'background-image': 'url(' + path + ')' }).trigger(trigger);
          }
          // Replacing HTML
          else {
              $.get(path, function (response) {
                _this.$element.html(response).trigger(trigger);
                $(response).foundation();
                _this.currentPath = path;
              });
            }

        /**
         * Fires when content in an Interchange element is done being loaded.
         * @event Interchange#replaced
         */
        // this.$element.trigger('replaced.zf.interchange');
      }

      /**
       * Destroys an instance of interchange.
       * @function
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        //TODO this.
      }
    }]);

    return Interchange;
  }();

  /**
   * Default settings for plugin
   */


  Interchange.defaults = {
    /**
     * Rules to be applied to Interchange elements. Set with the `data-interchange` array notation.
     * @option
     * @type {?array}
     * @default null
     */
    rules: null
  };

  Interchange.SPECIAL_QUERIES = {
    'landscape': 'screen and (orientation: landscape)',
    'portrait': 'screen and (orientation: portrait)',
    'retina': 'only screen and (-webkit-min-device-pixel-ratio: 2), only screen and (min--moz-device-pixel-ratio: 2), only screen and (-o-min-device-pixel-ratio: 2/1), only screen and (min-device-pixel-ratio: 2), only screen and (min-resolution: 192dpi), only screen and (min-resolution: 2dppx)'
  };

  // Window exports
  Foundation.plugin(Interchange, 'Interchange');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Magellan module.
   * @module foundation.magellan
   */

  var Magellan = function () {
    /**
     * Creates a new instance of Magellan.
     * @class
     * @fires Magellan#init
     * @param {Object} element - jQuery object to add the trigger to.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    function Magellan(element, options) {
      _classCallCheck(this, Magellan);

      this.$element = element;
      this.options = $.extend({}, Magellan.defaults, this.$element.data(), options);

      this._init();
      this.calcPoints();

      Foundation.registerPlugin(this, 'Magellan');
    }

    /**
     * Initializes the Magellan plugin and calls functions to get equalizer functioning on load.
     * @private
     */


    _createClass(Magellan, [{
      key: '_init',
      value: function _init() {
        var id = this.$element[0].id || Foundation.GetYoDigits(6, 'magellan');
        var _this = this;
        this.$targets = $('[data-magellan-target]');
        this.$links = this.$element.find('a');
        this.$element.attr({
          'data-resize': id,
          'data-scroll': id,
          'id': id
        });
        this.$active = $();
        this.scrollPos = parseInt(window.pageYOffset, 10);

        this._events();
      }

      /**
       * Calculates an array of pixel values that are the demarcation lines between locations on the page.
       * Can be invoked if new elements are added or the size of a location changes.
       * @function
       */

    }, {
      key: 'calcPoints',
      value: function calcPoints() {
        var _this = this,
            body = document.body,
            html = document.documentElement;

        this.points = [];
        this.winHeight = Math.round(Math.max(window.innerHeight, html.clientHeight));
        this.docHeight = Math.round(Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight));

        this.$targets.each(function () {
          var $tar = $(this),
              pt = Math.round($tar.offset().top - _this.options.threshold);
          $tar.targetPoint = pt;
          _this.points.push(pt);
        });
      }

      /**
       * Initializes events for Magellan.
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        var _this = this,
            $body = $('html, body'),
            opts = {
          duration: _this.options.animationDuration,
          easing: _this.options.animationEasing
        };
        $(window).one('load', function () {
          if (_this.options.deepLinking) {
            if (location.hash) {
              _this.scrollToLoc(location.hash);
            }
          }
          _this.calcPoints();
          _this._updateActive();
        });

        this.$element.on({
          'resizeme.zf.trigger': this.reflow.bind(this),
          'scrollme.zf.trigger': this._updateActive.bind(this)
        }).on('click.zf.magellan', 'a[href^="#"]', function (e) {
          e.preventDefault();
          var arrival = this.getAttribute('href');
          _this.scrollToLoc(arrival);
        });
        $(window).on('popstate', function (e) {
          if (_this.options.deepLinking) {
            _this.scrollToLoc(window.location.hash);
          }
        });
      }

      /**
       * Function to scroll to a given location on the page.
       * @param {String} loc - a properly formatted jQuery id selector. Example: '#foo'
       * @function
       */

    }, {
      key: 'scrollToLoc',
      value: function scrollToLoc(loc) {
        // Do nothing if target does not exist to prevent errors
        if (!$(loc).length) {
          return false;
        }
        this._inTransition = true;
        var _this = this,
            scrollPos = Math.round($(loc).offset().top - this.options.threshold / 2 - this.options.barOffset);

        $('html, body').stop(true).animate({ scrollTop: scrollPos }, this.options.animationDuration, this.options.animationEasing, function () {
          _this._inTransition = false;_this._updateActive();
        });
      }

      /**
       * Calls necessary functions to update Magellan upon DOM change
       * @function
       */

    }, {
      key: 'reflow',
      value: function reflow() {
        this.calcPoints();
        this._updateActive();
      }

      /**
       * Updates the visibility of an active location link, and updates the url hash for the page, if deepLinking enabled.
       * @private
       * @function
       * @fires Magellan#update
       */

    }, {
      key: '_updateActive',
      value: function _updateActive() /*evt, elem, scrollPos*/{
        if (this._inTransition) {
          return;
        }
        var winPos = /*scrollPos ||*/parseInt(window.pageYOffset, 10),
            curIdx;

        if (winPos + this.winHeight === this.docHeight) {
          curIdx = this.points.length - 1;
        } else if (winPos < this.points[0]) {
          curIdx = undefined;
        } else {
          var isDown = this.scrollPos < winPos,
              _this = this,
              curVisible = this.points.filter(function (p, i) {
            return isDown ? p - _this.options.barOffset <= winPos : p - _this.options.barOffset - _this.options.threshold <= winPos;
          });
          curIdx = curVisible.length ? curVisible.length - 1 : 0;
        }

        this.$active.removeClass(this.options.activeClass);
        this.$active = this.$links.filter('[href="#' + this.$targets.eq(curIdx).data('magellan-target') + '"]').addClass(this.options.activeClass);

        if (this.options.deepLinking) {
          var hash = "";
          if (curIdx != undefined) {
            hash = this.$active[0].getAttribute('href');
          }
          if (hash !== window.location.hash) {
            if (window.history.pushState) {
              window.history.pushState(null, null, hash);
            } else {
              window.location.hash = hash;
            }
          }
        }

        this.scrollPos = winPos;
        /**
         * Fires when magellan is finished updating to the new active element.
         * @event Magellan#update
         */
        this.$element.trigger('update.zf.magellan', [this.$active]);
      }

      /**
       * Destroys an instance of Magellan and resets the url of the window.
       * @function
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this.$element.off('.zf.trigger .zf.magellan').find('.' + this.options.activeClass).removeClass(this.options.activeClass);

        if (this.options.deepLinking) {
          var hash = this.$active[0].getAttribute('href');
          window.location.hash.replace(hash, '');
        }

        Foundation.unregisterPlugin(this);
      }
    }]);

    return Magellan;
  }();

  /**
   * Default settings for plugin
   */


  Magellan.defaults = {
    /**
     * Amount of time, in ms, the animated scrolling should take between locations.
     * @option
     * @type {number}
     * @default 500
     */
    animationDuration: 500,
    /**
     * Animation style to use when scrolling between locations. Can be `'swing'` or `'linear'`.
     * @option
     * @type {string}
     * @default 'linear'
     * @see {@link https://api.jquery.com/animate|Jquery animate}
     */
    animationEasing: 'linear',
    /**
     * Number of pixels to use as a marker for location changes.
     * @option
     * @type {number}
     * @default 50
     */
    threshold: 50,
    /**
     * Class applied to the active locations link on the magellan container.
     * @option
     * @type {string}
     * @default 'active'
     */
    activeClass: 'active',
    /**
     * Allows the script to manipulate the url of the current page, and if supported, alter the history.
     * @option
     * @type {boolean}
     * @default false
     */
    deepLinking: false,
    /**
     * Number of pixels to offset the scroll of the page on item click if using a sticky nav bar.
     * @option
     * @type {number}
     * @default 0
     */
    barOffset: 0

    // Window exports
  };Foundation.plugin(Magellan, 'Magellan');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * OffCanvas module.
   * @module foundation.offcanvas
   * @requires foundation.util.keyboard
   * @requires foundation.util.mediaQuery
   * @requires foundation.util.triggers
   * @requires foundation.util.motion
   */

  var OffCanvas = function () {
    /**
     * Creates a new instance of an off-canvas wrapper.
     * @class
     * @fires OffCanvas#init
     * @param {Object} element - jQuery object to initialize.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    function OffCanvas(element, options) {
      _classCallCheck(this, OffCanvas);

      this.$element = element;
      this.options = $.extend({}, OffCanvas.defaults, this.$element.data(), options);
      this.$lastTrigger = $();
      this.$triggers = $();

      this._init();
      this._events();

      Foundation.registerPlugin(this, 'OffCanvas');
      Foundation.Keyboard.register('OffCanvas', {
        'ESCAPE': 'close'
      });
    }

    /**
     * Initializes the off-canvas wrapper by adding the exit overlay (if needed).
     * @function
     * @private
     */


    _createClass(OffCanvas, [{
      key: '_init',
      value: function _init() {
        var id = this.$element.attr('id');

        this.$element.attr('aria-hidden', 'true');

        this.$element.addClass('is-transition-' + this.options.transition);

        // Find triggers that affect this element and add aria-expanded to them
        this.$triggers = $(document).find('[data-open="' + id + '"], [data-close="' + id + '"], [data-toggle="' + id + '"]').attr('aria-expanded', 'false').attr('aria-controls', id);

        // Add an overlay over the content if necessary
        if (this.options.contentOverlay === true) {
          var overlay = document.createElement('div');
          var overlayPosition = $(this.$element).css("position") === 'fixed' ? 'is-overlay-fixed' : 'is-overlay-absolute';
          overlay.setAttribute('class', 'js-off-canvas-overlay ' + overlayPosition);
          this.$overlay = $(overlay);
          if (overlayPosition === 'is-overlay-fixed') {
            $('body').append(this.$overlay);
          } else {
            this.$element.siblings('[data-off-canvas-content]').append(this.$overlay);
          }
        }

        this.options.isRevealed = this.options.isRevealed || new RegExp(this.options.revealClass, 'g').test(this.$element[0].className);

        if (this.options.isRevealed === true) {
          this.options.revealOn = this.options.revealOn || this.$element[0].className.match(/(reveal-for-medium|reveal-for-large)/g)[0].split('-')[2];
          this._setMQChecker();
        }
        if (!this.options.transitionTime === true) {
          this.options.transitionTime = parseFloat(window.getComputedStyle($('[data-off-canvas]')[0]).transitionDuration) * 1000;
        }
      }

      /**
       * Adds event handlers to the off-canvas wrapper and the exit overlay.
       * @function
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        this.$element.off('.zf.trigger .zf.offcanvas').on({
          'open.zf.trigger': this.open.bind(this),
          'close.zf.trigger': this.close.bind(this),
          'toggle.zf.trigger': this.toggle.bind(this),
          'keydown.zf.offcanvas': this._handleKeyboard.bind(this)
        });

        if (this.options.closeOnClick === true) {
          var $target = this.options.contentOverlay ? this.$overlay : $('[data-off-canvas-content]');
          $target.on({ 'click.zf.offcanvas': this.close.bind(this) });
        }
      }

      /**
       * Applies event listener for elements that will reveal at certain breakpoints.
       * @private
       */

    }, {
      key: '_setMQChecker',
      value: function _setMQChecker() {
        var _this = this;

        $(window).on('changed.zf.mediaquery', function () {
          if (Foundation.MediaQuery.atLeast(_this.options.revealOn)) {
            _this.reveal(true);
          } else {
            _this.reveal(false);
          }
        }).one('load.zf.offcanvas', function () {
          if (Foundation.MediaQuery.atLeast(_this.options.revealOn)) {
            _this.reveal(true);
          }
        });
      }

      /**
       * Handles the revealing/hiding the off-canvas at breakpoints, not the same as open.
       * @param {Boolean} isRevealed - true if element should be revealed.
       * @function
       */

    }, {
      key: 'reveal',
      value: function reveal(isRevealed) {
        var $closer = this.$element.find('[data-close]');
        if (isRevealed) {
          this.close();
          this.isRevealed = true;
          this.$element.attr('aria-hidden', 'false');
          this.$element.off('open.zf.trigger toggle.zf.trigger');
          if ($closer.length) {
            $closer.hide();
          }
        } else {
          this.isRevealed = false;
          this.$element.attr('aria-hidden', 'true');
          this.$element.off('open.zf.trigger toggle.zf.trigger').on({
            'open.zf.trigger': this.open.bind(this),
            'toggle.zf.trigger': this.toggle.bind(this)
          });
          if ($closer.length) {
            $closer.show();
          }
        }
      }

      /**
       * Stops scrolling of the body when offcanvas is open on mobile Safari and other troublesome browsers.
       * @private
       */

    }, {
      key: '_stopScrolling',
      value: function _stopScrolling(event) {
        return false;
      }

      // Taken and adapted from http://stackoverflow.com/questions/16889447/prevent-full-page-scrolling-ios
      // Only really works for y, not sure how to extend to x or if we need to.

    }, {
      key: '_recordScrollable',
      value: function _recordScrollable(event) {
        var elem = this; // called from event handler context with this as elem

        // If the element is scrollable (content overflows), then...
        if (elem.scrollHeight !== elem.clientHeight) {
          // If we're at the top, scroll down one pixel to allow scrolling up
          if (elem.scrollTop === 0) {
            elem.scrollTop = 1;
          }
          // If we're at the bottom, scroll up one pixel to allow scrolling down
          if (elem.scrollTop === elem.scrollHeight - elem.clientHeight) {
            elem.scrollTop = elem.scrollHeight - elem.clientHeight - 1;
          }
        }
        elem.allowUp = elem.scrollTop > 0;
        elem.allowDown = elem.scrollTop < elem.scrollHeight - elem.clientHeight;
        elem.lastY = event.originalEvent.pageY;
      }
    }, {
      key: '_stopScrollPropagation',
      value: function _stopScrollPropagation(event) {
        var elem = this; // called from event handler context with this as elem
        var up = event.pageY < elem.lastY;
        var down = !up;
        elem.lastY = event.pageY;

        if (up && elem.allowUp || down && elem.allowDown) {
          event.stopPropagation();
        } else {
          event.preventDefault();
        }
      }

      /**
       * Opens the off-canvas menu.
       * @function
       * @param {Object} event - Event object passed from listener.
       * @param {jQuery} trigger - element that triggered the off-canvas to open.
       * @fires OffCanvas#opened
       */

    }, {
      key: 'open',
      value: function open(event, trigger) {
        if (this.$element.hasClass('is-open') || this.isRevealed) {
          return;
        }
        var _this = this;

        if (trigger) {
          this.$lastTrigger = trigger;
        }

        if (this.options.forceTo === 'top') {
          window.scrollTo(0, 0);
        } else if (this.options.forceTo === 'bottom') {
          window.scrollTo(0, document.body.scrollHeight);
        }

        /**
         * Fires when the off-canvas menu opens.
         * @event OffCanvas#opened
         */
        _this.$element.addClass('is-open');

        this.$triggers.attr('aria-expanded', 'true');
        this.$element.attr('aria-hidden', 'false').trigger('opened.zf.offcanvas');

        // If `contentScroll` is set to false, add class and disable scrolling on touch devices.
        if (this.options.contentScroll === false) {
          $('body').addClass('is-off-canvas-open').on('touchmove', this._stopScrolling);
          this.$element.on('touchstart', this._recordScrollable);
          this.$element.on('touchmove', this._stopScrollPropagation);
        }

        if (this.options.contentOverlay === true) {
          this.$overlay.addClass('is-visible');
        }

        if (this.options.closeOnClick === true && this.options.contentOverlay === true) {
          this.$overlay.addClass('is-closable');
        }

        if (this.options.autoFocus === true) {
          this.$element.one(Foundation.transitionend(this.$element), function () {
            var canvasFocus = _this.$element.find('[data-autofocus]');
            if (canvasFocus.length) {
              canvasFocus.eq(0).focus();
            } else {
              _this.$element.find('a, button').eq(0).focus();
            }
          });
        }

        if (this.options.trapFocus === true) {
          this.$element.siblings('[data-off-canvas-content]').attr('tabindex', '-1');
          Foundation.Keyboard.trapFocus(this.$element);
        }
      }

      /**
       * Closes the off-canvas menu.
       * @function
       * @param {Function} cb - optional cb to fire after closure.
       * @fires OffCanvas#closed
       */

    }, {
      key: 'close',
      value: function close(cb) {
        if (!this.$element.hasClass('is-open') || this.isRevealed) {
          return;
        }

        var _this = this;

        _this.$element.removeClass('is-open');

        this.$element.attr('aria-hidden', 'true')
        /**
         * Fires when the off-canvas menu opens.
         * @event OffCanvas#closed
         */
        .trigger('closed.zf.offcanvas');

        // If `contentScroll` is set to false, remove class and re-enable scrolling on touch devices.
        if (this.options.contentScroll === false) {
          $('body').removeClass('is-off-canvas-open').off('touchmove', this._stopScrolling);
          this.$element.off('touchstart', this._recordScrollable);
          this.$element.off('touchmove', this._stopScrollPropagation);
        }

        if (this.options.contentOverlay === true) {
          this.$overlay.removeClass('is-visible');
        }

        if (this.options.closeOnClick === true && this.options.contentOverlay === true) {
          this.$overlay.removeClass('is-closable');
        }

        this.$triggers.attr('aria-expanded', 'false');

        if (this.options.trapFocus === true) {
          this.$element.siblings('[data-off-canvas-content]').removeAttr('tabindex');
          Foundation.Keyboard.releaseFocus(this.$element);
        }
      }

      /**
       * Toggles the off-canvas menu open or closed.
       * @function
       * @param {Object} event - Event object passed from listener.
       * @param {jQuery} trigger - element that triggered the off-canvas to open.
       */

    }, {
      key: 'toggle',
      value: function toggle(event, trigger) {
        if (this.$element.hasClass('is-open')) {
          this.close(event, trigger);
        } else {
          this.open(event, trigger);
        }
      }

      /**
       * Handles keyboard input when detected. When the escape key is pressed, the off-canvas menu closes, and focus is restored to the element that opened the menu.
       * @function
       * @private
       */

    }, {
      key: '_handleKeyboard',
      value: function _handleKeyboard(e) {
        var _this2 = this;

        Foundation.Keyboard.handleKey(e, 'OffCanvas', {
          close: function () {
            _this2.close();
            _this2.$lastTrigger.focus();
            return true;
          },
          handled: function () {
            e.stopPropagation();
            e.preventDefault();
          }
        });
      }

      /**
       * Destroys the offcanvas plugin.
       * @function
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this.close();
        this.$element.off('.zf.trigger .zf.offcanvas');
        this.$overlay.off('.zf.offcanvas');

        Foundation.unregisterPlugin(this);
      }
    }]);

    return OffCanvas;
  }();

  OffCanvas.defaults = {
    /**
     * Allow the user to click outside of the menu to close it.
     * @option
     * @type {boolean}
     * @default true
     */
    closeOnClick: true,

    /**
     * Adds an overlay on top of `[data-off-canvas-content]`.
     * @option
     * @type {boolean}
     * @default true
     */
    contentOverlay: true,

    /**
     * Enable/disable scrolling of the main content when an off canvas panel is open.
     * @option
     * @type {boolean}
     * @default true
     */
    contentScroll: true,

    /**
     * Amount of time in ms the open and close transition requires. If none selected, pulls from body style.
     * @option
     * @type {number}
     * @default 0
     */
    transitionTime: 0,

    /**
     * Type of transition for the offcanvas menu. Options are 'push', 'detached' or 'slide'.
     * @option
     * @type {string}
     * @default push
     */
    transition: 'push',

    /**
     * Force the page to scroll to top or bottom on open.
     * @option
     * @type {?string}
     * @default null
     */
    forceTo: null,

    /**
     * Allow the offcanvas to remain open for certain breakpoints.
     * @option
     * @type {boolean}
     * @default false
     */
    isRevealed: false,

    /**
     * Breakpoint at which to reveal. JS will use a RegExp to target standard classes, if changing classnames, pass your class with the `revealClass` option.
     * @option
     * @type {?string}
     * @default null
     */
    revealOn: null,

    /**
     * Force focus to the offcanvas on open. If true, will focus the opening trigger on close.
     * @option
     * @type {boolean}
     * @default true
     */
    autoFocus: true,

    /**
     * Class used to force an offcanvas to remain open. Foundation defaults for this are `reveal-for-large` & `reveal-for-medium`.
     * @option
     * @type {string}
     * @default reveal-for-
     * @todo improve the regex testing for this.
     */
    revealClass: 'reveal-for-',

    /**
     * Triggers optional focus trapping when opening an offcanvas. Sets tabindex of [data-off-canvas-content] to -1 for accessibility purposes.
     * @option
     * @type {boolean}
     * @default false
     */
    trapFocus: false

    // Window exports
  };Foundation.plugin(OffCanvas, 'OffCanvas');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * ResponsiveMenu module.
   * @module foundation.responsiveMenu
   * @requires foundation.util.triggers
   * @requires foundation.util.mediaQuery
   */

  var ResponsiveMenu = function () {
    /**
     * Creates a new instance of a responsive menu.
     * @class
     * @fires ResponsiveMenu#init
     * @param {jQuery} element - jQuery object to make into a dropdown menu.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    function ResponsiveMenu(element, options) {
      _classCallCheck(this, ResponsiveMenu);

      this.$element = $(element);
      this.rules = this.$element.data('responsive-menu');
      this.currentMq = null;
      this.currentPlugin = null;

      this._init();
      this._events();

      Foundation.registerPlugin(this, 'ResponsiveMenu');
    }

    /**
     * Initializes the Menu by parsing the classes from the 'data-ResponsiveMenu' attribute on the element.
     * @function
     * @private
     */


    _createClass(ResponsiveMenu, [{
      key: '_init',
      value: function _init() {
        // The first time an Interchange plugin is initialized, this.rules is converted from a string of "classes" to an object of rules
        if (typeof this.rules === 'string') {
          var rulesTree = {};

          // Parse rules from "classes" pulled from data attribute
          var rules = this.rules.split(' ');

          // Iterate through every rule found
          for (var i = 0; i < rules.length; i++) {
            var rule = rules[i].split('-');
            var ruleSize = rule.length > 1 ? rule[0] : 'small';
            var rulePlugin = rule.length > 1 ? rule[1] : rule[0];

            if (MenuPlugins[rulePlugin] !== null) {
              rulesTree[ruleSize] = MenuPlugins[rulePlugin];
            }
          }

          this.rules = rulesTree;
        }

        if (!$.isEmptyObject(this.rules)) {
          this._checkMediaQueries();
        }
        // Add data-mutate since children may need it.
        this.$element.attr('data-mutate', this.$element.attr('data-mutate') || Foundation.GetYoDigits(6, 'responsive-menu'));
      }

      /**
       * Initializes events for the Menu.
       * @function
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        var _this = this;

        $(window).on('changed.zf.mediaquery', function () {
          _this._checkMediaQueries();
        });
        // $(window).on('resize.zf.ResponsiveMenu', function() {
        //   _this._checkMediaQueries();
        // });
      }

      /**
       * Checks the current screen width against available media queries. If the media query has changed, and the plugin needed has changed, the plugins will swap out.
       * @function
       * @private
       */

    }, {
      key: '_checkMediaQueries',
      value: function _checkMediaQueries() {
        var matchedMq,
            _this = this;
        // Iterate through each rule and find the last matching rule
        $.each(this.rules, function (key) {
          if (Foundation.MediaQuery.atLeast(key)) {
            matchedMq = key;
          }
        });

        // No match? No dice
        if (!matchedMq) return;

        // Plugin already initialized? We good
        if (this.currentPlugin instanceof this.rules[matchedMq].plugin) return;

        // Remove existing plugin-specific CSS classes
        $.each(MenuPlugins, function (key, value) {
          _this.$element.removeClass(value.cssClass);
        });

        // Add the CSS class for the new plugin
        this.$element.addClass(this.rules[matchedMq].cssClass);

        // Create an instance of the new plugin
        if (this.currentPlugin) this.currentPlugin.destroy();
        this.currentPlugin = new this.rules[matchedMq].plugin(this.$element, {});
      }

      /**
       * Destroys the instance of the current plugin on this element, as well as the window resize handler that switches the plugins out.
       * @function
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this.currentPlugin.destroy();
        $(window).off('.zf.ResponsiveMenu');
        Foundation.unregisterPlugin(this);
      }
    }]);

    return ResponsiveMenu;
  }();

  ResponsiveMenu.defaults = {};

  // The plugin matches the plugin classes with these plugin instances.
  var MenuPlugins = {
    dropdown: {
      cssClass: 'dropdown',
      plugin: Foundation._plugins['dropdown-menu'] || null
    },
    drilldown: {
      cssClass: 'drilldown',
      plugin: Foundation._plugins['drilldown'] || null
    },
    accordion: {
      cssClass: 'accordion-menu',
      plugin: Foundation._plugins['accordion-menu'] || null
    }
  };

  // Window exports
  Foundation.plugin(ResponsiveMenu, 'ResponsiveMenu');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * ResponsiveToggle module.
   * @module foundation.responsiveToggle
   * @requires foundation.util.mediaQuery
   */

  var ResponsiveToggle = function () {
    /**
     * Creates a new instance of Tab Bar.
     * @class
     * @fires ResponsiveToggle#init
     * @param {jQuery} element - jQuery object to attach tab bar functionality to.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    function ResponsiveToggle(element, options) {
      _classCallCheck(this, ResponsiveToggle);

      this.$element = $(element);
      this.options = $.extend({}, ResponsiveToggle.defaults, this.$element.data(), options);

      this._init();
      this._events();

      Foundation.registerPlugin(this, 'ResponsiveToggle');
    }

    /**
     * Initializes the tab bar by finding the target element, toggling element, and running update().
     * @function
     * @private
     */


    _createClass(ResponsiveToggle, [{
      key: '_init',
      value: function _init() {
        var targetID = this.$element.data('responsive-toggle');
        if (!targetID) {
          console.error('Your tab bar needs an ID of a Menu as the value of data-tab-bar.');
        }

        this.$targetMenu = $('#' + targetID);
        this.$toggler = this.$element.find('[data-toggle]').filter(function () {
          var target = $(this).data('toggle');
          return target === targetID || target === "";
        });
        this.options = $.extend({}, this.options, this.$targetMenu.data());

        // If they were set, parse the animation classes
        if (this.options.animate) {
          var input = this.options.animate.split(' ');

          this.animationIn = input[0];
          this.animationOut = input[1] || null;
        }

        this._update();
      }

      /**
       * Adds necessary event handlers for the tab bar to work.
       * @function
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        var _this = this;

        this._updateMqHandler = this._update.bind(this);

        $(window).on('changed.zf.mediaquery', this._updateMqHandler);

        this.$toggler.on('click.zf.responsiveToggle', this.toggleMenu.bind(this));
      }

      /**
       * Checks the current media query to determine if the tab bar should be visible or hidden.
       * @function
       * @private
       */

    }, {
      key: '_update',
      value: function _update() {
        // Mobile
        if (!Foundation.MediaQuery.atLeast(this.options.hideFor)) {
          this.$element.show();
          this.$targetMenu.hide();
        }

        // Desktop
        else {
            this.$element.hide();
            this.$targetMenu.show();
          }
      }

      /**
       * Toggles the element attached to the tab bar. The toggle only happens if the screen is small enough to allow it.
       * @function
       * @fires ResponsiveToggle#toggled
       */

    }, {
      key: 'toggleMenu',
      value: function toggleMenu() {
        var _this2 = this;

        if (!Foundation.MediaQuery.atLeast(this.options.hideFor)) {
          /**
           * Fires when the element attached to the tab bar toggles.
           * @event ResponsiveToggle#toggled
           */
          if (this.options.animate) {
            if (this.$targetMenu.is(':hidden')) {
              Foundation.Motion.animateIn(this.$targetMenu, this.animationIn, function () {
                _this2.$element.trigger('toggled.zf.responsiveToggle');
                _this2.$targetMenu.find('[data-mutate]').triggerHandler('mutateme.zf.trigger');
              });
            } else {
              Foundation.Motion.animateOut(this.$targetMenu, this.animationOut, function () {
                _this2.$element.trigger('toggled.zf.responsiveToggle');
              });
            }
          } else {
            this.$targetMenu.toggle(0);
            this.$targetMenu.find('[data-mutate]').trigger('mutateme.zf.trigger');
            this.$element.trigger('toggled.zf.responsiveToggle');
          }
        }
      }
    }, {
      key: 'destroy',
      value: function destroy() {
        this.$element.off('.zf.responsiveToggle');
        this.$toggler.off('.zf.responsiveToggle');

        $(window).off('changed.zf.mediaquery', this._updateMqHandler);

        Foundation.unregisterPlugin(this);
      }
    }]);

    return ResponsiveToggle;
  }();

  ResponsiveToggle.defaults = {
    /**
     * The breakpoint after which the menu is always shown, and the tab bar is hidden.
     * @option
     * @type {string}
     * @default 'medium'
     */
    hideFor: 'medium',

    /**
     * To decide if the toggle should be animated or not.
     * @option
     * @type {boolean}
     * @default false
     */
    animate: false
  };

  // Window exports
  Foundation.plugin(ResponsiveToggle, 'ResponsiveToggle');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Reveal module.
   * @module foundation.reveal
   * @requires foundation.util.keyboard
   * @requires foundation.util.box
   * @requires foundation.util.triggers
   * @requires foundation.util.mediaQuery
   * @requires foundation.util.motion if using animations
   */

  var Reveal = function () {
    /**
     * Creates a new instance of Reveal.
     * @class
     * @param {jQuery} element - jQuery object to use for the modal.
     * @param {Object} options - optional parameters.
     */
    function Reveal(element, options) {
      _classCallCheck(this, Reveal);

      this.$element = element;
      this.options = $.extend({}, Reveal.defaults, this.$element.data(), options);
      this._init();

      Foundation.registerPlugin(this, 'Reveal');
      Foundation.Keyboard.register('Reveal', {
        'ENTER': 'open',
        'SPACE': 'open',
        'ESCAPE': 'close'
      });
    }

    /**
     * Initializes the modal by adding the overlay and close buttons, (if selected).
     * @private
     */


    _createClass(Reveal, [{
      key: '_init',
      value: function _init() {
        this.id = this.$element.attr('id');
        this.isActive = false;
        this.cached = { mq: Foundation.MediaQuery.current };
        this.isMobile = mobileSniff();

        this.$anchor = $('[data-open="' + this.id + '"]').length ? $('[data-open="' + this.id + '"]') : $('[data-toggle="' + this.id + '"]');
        this.$anchor.attr({
          'aria-controls': this.id,
          'aria-haspopup': true,
          'tabindex': 0
        });

        if (this.options.fullScreen || this.$element.hasClass('full')) {
          this.options.fullScreen = true;
          this.options.overlay = false;
        }
        if (this.options.overlay && !this.$overlay) {
          this.$overlay = this._makeOverlay(this.id);
        }

        this.$element.attr({
          'role': 'dialog',
          'aria-hidden': true,
          'data-yeti-box': this.id,
          'data-resize': this.id
        });

        if (this.$overlay) {
          this.$element.detach().appendTo(this.$overlay);
        } else {
          this.$element.detach().appendTo($(this.options.appendTo));
          this.$element.addClass('without-overlay');
        }
        this._events();
        if (this.options.deepLink && window.location.hash === '#' + this.id) {
          $(window).one('load.zf.reveal', this.open.bind(this));
        }
      }

      /**
       * Creates an overlay div to display behind the modal.
       * @private
       */

    }, {
      key: '_makeOverlay',
      value: function _makeOverlay() {
        return $('<div></div>').addClass('reveal-overlay').appendTo(this.options.appendTo);
      }

      /**
       * Updates position of modal
       * TODO:  Figure out if we actually need to cache these values or if it doesn't matter
       * @private
       */

    }, {
      key: '_updatePosition',
      value: function _updatePosition() {
        var width = this.$element.outerWidth();
        var outerWidth = $(window).width();
        var height = this.$element.outerHeight();
        var outerHeight = $(window).height();
        var left, top;
        if (this.options.hOffset === 'auto') {
          left = parseInt((outerWidth - width) / 2, 10);
        } else {
          left = parseInt(this.options.hOffset, 10);
        }
        if (this.options.vOffset === 'auto') {
          if (height > outerHeight) {
            top = parseInt(Math.min(100, outerHeight / 10), 10);
          } else {
            top = parseInt((outerHeight - height) / 4, 10);
          }
        } else {
          top = parseInt(this.options.vOffset, 10);
        }
        this.$element.css({ top: top + 'px' });
        // only worry about left if we don't have an overlay or we havea  horizontal offset,
        // otherwise we're perfectly in the middle
        if (!this.$overlay || this.options.hOffset !== 'auto') {
          this.$element.css({ left: left + 'px' });
          this.$element.css({ margin: '0px' });
        }
      }

      /**
       * Adds event handlers for the modal.
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        var _this2 = this;

        var _this = this;

        this.$element.on({
          'open.zf.trigger': this.open.bind(this),
          'close.zf.trigger': function (event, $element) {
            if (event.target === _this.$element[0] || $(event.target).parents('[data-closable]')[0] === $element) {
              // only close reveal when it's explicitly called
              return _this2.close.apply(_this2);
            }
          },
          'toggle.zf.trigger': this.toggle.bind(this),
          'resizeme.zf.trigger': function () {
            _this._updatePosition();
          }
        });

        if (this.$anchor.length) {
          this.$anchor.on('keydown.zf.reveal', function (e) {
            if (e.which === 13 || e.which === 32) {
              e.stopPropagation();
              e.preventDefault();
              _this.open();
            }
          });
        }

        if (this.options.closeOnClick && this.options.overlay) {
          this.$overlay.off('.zf.reveal').on('click.zf.reveal', function (e) {
            if (e.target === _this.$element[0] || $.contains(_this.$element[0], e.target) || !$.contains(document, e.target)) {
              return;
            }
            _this.close();
          });
        }
        if (this.options.deepLink) {
          $(window).on('popstate.zf.reveal:' + this.id, this._handleState.bind(this));
        }
      }

      /**
       * Handles modal methods on back/forward button clicks or any other event that triggers popstate.
       * @private
       */

    }, {
      key: '_handleState',
      value: function _handleState(e) {
        if (window.location.hash === '#' + this.id && !this.isActive) {
          this.open();
        } else {
          this.close();
        }
      }

      /**
       * Opens the modal controlled by `this.$anchor`, and closes all others by default.
       * @function
       * @fires Reveal#closeme
       * @fires Reveal#open
       */

    }, {
      key: 'open',
      value: function open() {
        var _this3 = this;

        if (this.options.deepLink) {
          var hash = '#' + this.id;

          if (window.history.pushState) {
            window.history.pushState(null, null, hash);
          } else {
            window.location.hash = hash;
          }
        }

        this.isActive = true;

        // Make elements invisible, but remove display: none so we can get size and positioning
        this.$element.css({ 'visibility': 'hidden' }).show().scrollTop(0);
        if (this.options.overlay) {
          this.$overlay.css({ 'visibility': 'hidden' }).show();
        }

        this._updatePosition();

        this.$element.hide().css({ 'visibility': '' });

        if (this.$overlay) {
          this.$overlay.css({ 'visibility': '' }).hide();
          if (this.$element.hasClass('fast')) {
            this.$overlay.addClass('fast');
          } else if (this.$element.hasClass('slow')) {
            this.$overlay.addClass('slow');
          }
        }

        if (!this.options.multipleOpened) {
          /**
           * Fires immediately before the modal opens.
           * Closes any other modals that are currently open
           * @event Reveal#closeme
           */
          this.$element.trigger('closeme.zf.reveal', this.id);
        }

        var _this = this;

        function addRevealOpenClasses() {
          if (_this.isMobile) {
            if (!_this.originalScrollPos) {
              _this.originalScrollPos = window.pageYOffset;
            }
            $('html, body').addClass('is-reveal-open');
          } else {
            $('body').addClass('is-reveal-open');
          }
        }
        // Motion UI method of reveal
        if (this.options.animationIn) {
          var afterAnimation = function () {
            _this.$element.attr({
              'aria-hidden': false,
              'tabindex': -1
            }).focus();
            addRevealOpenClasses();
            Foundation.Keyboard.trapFocus(_this.$element);
          };

          if (this.options.overlay) {
            Foundation.Motion.animateIn(this.$overlay, 'fade-in');
          }
          Foundation.Motion.animateIn(this.$element, this.options.animationIn, function () {
            if (_this3.$element) {
              // protect against object having been removed
              _this3.focusableElements = Foundation.Keyboard.findFocusable(_this3.$element);
              afterAnimation();
            }
          });
        }
        // jQuery method of reveal
        else {
            if (this.options.overlay) {
              this.$overlay.show(0);
            }
            this.$element.show(this.options.showDelay);
          }

        // handle accessibility
        this.$element.attr({
          'aria-hidden': false,
          'tabindex': -1
        }).focus();
        Foundation.Keyboard.trapFocus(this.$element);

        /**
         * Fires when the modal has successfully opened.
         * @event Reveal#open
         */
        this.$element.trigger('open.zf.reveal');

        addRevealOpenClasses();

        setTimeout(function () {
          _this3._extraHandlers();
        }, 0);
      }

      /**
       * Adds extra event handlers for the body and window if necessary.
       * @private
       */

    }, {
      key: '_extraHandlers',
      value: function _extraHandlers() {
        var _this = this;
        if (!this.$element) {
          return;
        } // If we're in the middle of cleanup, don't freak out
        this.focusableElements = Foundation.Keyboard.findFocusable(this.$element);

        if (!this.options.overlay && this.options.closeOnClick && !this.options.fullScreen) {
          $('body').on('click.zf.reveal', function (e) {
            if (e.target === _this.$element[0] || $.contains(_this.$element[0], e.target) || !$.contains(document, e.target)) {
              return;
            }
            _this.close();
          });
        }

        if (this.options.closeOnEsc) {
          $(window).on('keydown.zf.reveal', function (e) {
            Foundation.Keyboard.handleKey(e, 'Reveal', {
              close: function () {
                if (_this.options.closeOnEsc) {
                  _this.close();
                  _this.$anchor.focus();
                }
              }
            });
          });
        }

        // lock focus within modal while tabbing
        this.$element.on('keydown.zf.reveal', function (e) {
          var $target = $(this);
          // handle keyboard event with keyboard util
          Foundation.Keyboard.handleKey(e, 'Reveal', {
            open: function () {
              if (_this.$element.find(':focus').is(_this.$element.find('[data-close]'))) {
                setTimeout(function () {
                  // set focus back to anchor if close button has been activated
                  _this.$anchor.focus();
                }, 1);
              } else if ($target.is(_this.focusableElements)) {
                // dont't trigger if acual element has focus (i.e. inputs, links, ...)
                _this.open();
              }
            },
            close: function () {
              if (_this.options.closeOnEsc) {
                _this.close();
                _this.$anchor.focus();
              }
            },
            handled: function (preventDefault) {
              if (preventDefault) {
                e.preventDefault();
              }
            }
          });
        });
      }

      /**
       * Closes the modal.
       * @function
       * @fires Reveal#closed
       */

    }, {
      key: 'close',
      value: function close() {
        if (!this.isActive || !this.$element.is(':visible')) {
          return false;
        }
        var _this = this;

        // Motion UI method of hiding
        if (this.options.animationOut) {
          if (this.options.overlay) {
            Foundation.Motion.animateOut(this.$overlay, 'fade-out', finishUp);
          } else {
            finishUp();
          }

          Foundation.Motion.animateOut(this.$element, this.options.animationOut);
        }
        // jQuery method of hiding
        else {

            this.$element.hide(this.options.hideDelay);

            if (this.options.overlay) {
              this.$overlay.hide(0, finishUp);
            } else {
              finishUp();
            }
          }

        // Conditionals to remove extra event listeners added on open
        if (this.options.closeOnEsc) {
          $(window).off('keydown.zf.reveal');
        }

        if (!this.options.overlay && this.options.closeOnClick) {
          $('body').off('click.zf.reveal');
        }

        this.$element.off('keydown.zf.reveal');

        function finishUp() {
          if (_this.isMobile) {
            if ($('.reveal:visible').length === 0) {
              $('html, body').removeClass('is-reveal-open');
            }
            if (_this.originalScrollPos) {
              $('body').scrollTop(_this.originalScrollPos);
              _this.originalScrollPos = null;
            }
          } else {
            if ($('.reveal:visible').length === 0) {
              $('body').removeClass('is-reveal-open');
            }
          }

          Foundation.Keyboard.releaseFocus(_this.$element);

          _this.$element.attr('aria-hidden', true);

          /**
          * Fires when the modal is done closing.
          * @event Reveal#closed
          */
          _this.$element.trigger('closed.zf.reveal');
        }

        /**
        * Resets the modal content
        * This prevents a running video to keep going in the background
        */
        if (this.options.resetOnClose) {
          this.$element.html(this.$element.html());
        }

        this.isActive = false;
        if (_this.options.deepLink) {
          if (window.history.replaceState) {
            window.history.replaceState('', document.title, window.location.href.replace('#' + this.id, ''));
          } else {
            window.location.hash = '';
          }
        }
      }

      /**
       * Toggles the open/closed state of a modal.
       * @function
       */

    }, {
      key: 'toggle',
      value: function toggle() {
        if (this.isActive) {
          this.close();
        } else {
          this.open();
        }
      }
    }, {
      key: 'destroy',


      /**
       * Destroys an instance of a modal.
       * @function
       */
      value: function destroy() {
        if (this.options.overlay) {
          this.$element.appendTo($(this.options.appendTo)); // move $element outside of $overlay to prevent error unregisterPlugin()
          this.$overlay.hide().off().remove();
        }
        this.$element.hide().off();
        this.$anchor.off('.zf');
        $(window).off('.zf.reveal:' + this.id);

        Foundation.unregisterPlugin(this);
      }
    }]);

    return Reveal;
  }();

  Reveal.defaults = {
    /**
     * Motion-UI class to use for animated elements. If none used, defaults to simple show/hide.
     * @option
     * @type {string}
     * @default ''
     */
    animationIn: '',
    /**
     * Motion-UI class to use for animated elements. If none used, defaults to simple show/hide.
     * @option
     * @type {string}
     * @default ''
     */
    animationOut: '',
    /**
     * Time, in ms, to delay the opening of a modal after a click if no animation used.
     * @option
     * @type {number}
     * @default 0
     */
    showDelay: 0,
    /**
     * Time, in ms, to delay the closing of a modal after a click if no animation used.
     * @option
     * @type {number}
     * @default 0
     */
    hideDelay: 0,
    /**
     * Allows a click on the body/overlay to close the modal.
     * @option
     * @type {boolean}
     * @default true
     */
    closeOnClick: true,
    /**
     * Allows the modal to close if the user presses the `ESCAPE` key.
     * @option
     * @type {boolean}
     * @default true
     */
    closeOnEsc: true,
    /**
     * If true, allows multiple modals to be displayed at once.
     * @option
     * @type {boolean}
     * @default false
     */
    multipleOpened: false,
    /**
     * Distance, in pixels, the modal should push down from the top of the screen.
     * @option
     * @type {number|string}
     * @default auto
     */
    vOffset: 'auto',
    /**
     * Distance, in pixels, the modal should push in from the side of the screen.
     * @option
     * @type {number|string}
     * @default auto
     */
    hOffset: 'auto',
    /**
     * Allows the modal to be fullscreen, completely blocking out the rest of the view. JS checks for this as well.
     * @option
     * @type {boolean}
     * @default false
     */
    fullScreen: false,
    /**
     * Percentage of screen height the modal should push up from the bottom of the view.
     * @option
     * @type {number}
     * @default 10
     */
    btmOffsetPct: 10,
    /**
     * Allows the modal to generate an overlay div, which will cover the view when modal opens.
     * @option
     * @type {boolean}
     * @default true
     */
    overlay: true,
    /**
     * Allows the modal to remove and reinject markup on close. Should be true if using video elements w/o using provider's api, otherwise, videos will continue to play in the background.
     * @option
     * @type {boolean}
     * @default false
     */
    resetOnClose: false,
    /**
     * Allows the modal to alter the url on open/close, and allows the use of the `back` button to close modals. ALSO, allows a modal to auto-maniacally open on page load IF the hash === the modal's user-set id.
     * @option
     * @type {boolean}
     * @default false
     */
    deepLink: false,
    /**
    * Allows the modal to append to custom div.
    * @option
    * @type {string}
    * @default "body"
    */
    appendTo: "body"

  };

  // Window exports
  Foundation.plugin(Reveal, 'Reveal');

  function iPhoneSniff() {
    return (/iP(ad|hone|od).*OS/.test(window.navigator.userAgent)
    );
  }

  function androidSniff() {
    return (/Android/.test(window.navigator.userAgent)
    );
  }

  function mobileSniff() {
    return iPhoneSniff() || androidSniff();
  }
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Toggler module.
   * @module foundation.toggler
   * @requires foundation.util.motion
   * @requires foundation.util.triggers
   */

  var Toggler = function () {
    /**
     * Creates a new instance of Toggler.
     * @class
     * @fires Toggler#init
     * @param {Object} element - jQuery object to add the trigger to.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    function Toggler(element, options) {
      _classCallCheck(this, Toggler);

      this.$element = element;
      this.options = $.extend({}, Toggler.defaults, element.data(), options);
      this.className = '';

      this._init();
      this._events();

      Foundation.registerPlugin(this, 'Toggler');
    }

    /**
     * Initializes the Toggler plugin by parsing the toggle class from data-toggler, or animation classes from data-animate.
     * @function
     * @private
     */


    _createClass(Toggler, [{
      key: '_init',
      value: function _init() {
        var input;
        // Parse animation classes if they were set
        if (this.options.animate) {
          input = this.options.animate.split(' ');

          this.animationIn = input[0];
          this.animationOut = input[1] || null;
        }
        // Otherwise, parse toggle class
        else {
            input = this.$element.data('toggler');
            // Allow for a . at the beginning of the string
            this.className = input[0] === '.' ? input.slice(1) : input;
          }

        // Add ARIA attributes to triggers
        var id = this.$element[0].id;
        $('[data-open="' + id + '"], [data-close="' + id + '"], [data-toggle="' + id + '"]').attr('aria-controls', id);
        // If the target is hidden, add aria-hidden
        this.$element.attr('aria-expanded', this.$element.is(':hidden') ? false : true);
      }

      /**
       * Initializes events for the toggle trigger.
       * @function
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        this.$element.off('toggle.zf.trigger').on('toggle.zf.trigger', this.toggle.bind(this));
      }

      /**
       * Toggles the target class on the target element. An event is fired from the original trigger depending on if the resultant state was "on" or "off".
       * @function
       * @fires Toggler#on
       * @fires Toggler#off
       */

    }, {
      key: 'toggle',
      value: function toggle() {
        this[this.options.animate ? '_toggleAnimate' : '_toggleClass']();
      }
    }, {
      key: '_toggleClass',
      value: function _toggleClass() {
        this.$element.toggleClass(this.className);

        var isOn = this.$element.hasClass(this.className);
        if (isOn) {
          /**
           * Fires if the target element has the class after a toggle.
           * @event Toggler#on
           */
          this.$element.trigger('on.zf.toggler');
        } else {
          /**
           * Fires if the target element does not have the class after a toggle.
           * @event Toggler#off
           */
          this.$element.trigger('off.zf.toggler');
        }

        this._updateARIA(isOn);
        this.$element.find('[data-mutate]').trigger('mutateme.zf.trigger');
      }
    }, {
      key: '_toggleAnimate',
      value: function _toggleAnimate() {
        var _this = this;

        if (this.$element.is(':hidden')) {
          Foundation.Motion.animateIn(this.$element, this.animationIn, function () {
            _this._updateARIA(true);
            this.trigger('on.zf.toggler');
            this.find('[data-mutate]').trigger('mutateme.zf.trigger');
          });
        } else {
          Foundation.Motion.animateOut(this.$element, this.animationOut, function () {
            _this._updateARIA(false);
            this.trigger('off.zf.toggler');
            this.find('[data-mutate]').trigger('mutateme.zf.trigger');
          });
        }
      }
    }, {
      key: '_updateARIA',
      value: function _updateARIA(isOn) {
        this.$element.attr('aria-expanded', isOn ? true : false);
      }

      /**
       * Destroys the instance of Toggler on the element.
       * @function
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this.$element.off('.zf.toggler');
        Foundation.unregisterPlugin(this);
      }
    }]);

    return Toggler;
  }();

  Toggler.defaults = {
    /**
     * Tells the plugin if the element should animated when toggled.
     * @option
     * @type {boolean}
     * @default false
     */
    animate: false
  };

  // Window exports
  Foundation.plugin(Toggler, 'Toggler');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Tooltip module.
   * @module foundation.tooltip
   * @requires foundation.util.box
   * @requires foundation.util.mediaQuery
   * @requires foundation.util.triggers
   */

  var Tooltip = function () {
    /**
     * Creates a new instance of a Tooltip.
     * @class
     * @fires Tooltip#init
     * @param {jQuery} element - jQuery object to attach a tooltip to.
     * @param {Object} options - object to extend the default configuration.
     */
    function Tooltip(element, options) {
      _classCallCheck(this, Tooltip);

      this.$element = element;
      this.options = $.extend({}, Tooltip.defaults, this.$element.data(), options);

      this.isActive = false;
      this.isClick = false;
      this._init();

      Foundation.registerPlugin(this, 'Tooltip');
    }

    /**
     * Initializes the tooltip by setting the creating the tip element, adding it's text, setting private variables and setting attributes on the anchor.
     * @private
     */


    _createClass(Tooltip, [{
      key: '_init',
      value: function _init() {
        var elemId = this.$element.attr('aria-describedby') || Foundation.GetYoDigits(6, 'tooltip');

        this.options.positionClass = this.options.positionClass || this._getPositionClass(this.$element);
        this.options.tipText = this.options.tipText || this.$element.attr('title');
        this.template = this.options.template ? $(this.options.template) : this._buildTemplate(elemId);

        if (this.options.allowHtml) {
          this.template.appendTo(document.body).html(this.options.tipText).hide();
        } else {
          this.template.appendTo(document.body).text(this.options.tipText).hide();
        }

        this.$element.attr({
          'title': '',
          'aria-describedby': elemId,
          'data-yeti-box': elemId,
          'data-toggle': elemId,
          'data-resize': elemId
        }).addClass(this.options.triggerClass);

        //helper variables to track movement on collisions
        this.usedPositions = [];
        this.counter = 4;
        this.classChanged = false;

        this._events();
      }

      /**
       * Grabs the current positioning class, if present, and returns the value or an empty string.
       * @private
       */

    }, {
      key: '_getPositionClass',
      value: function _getPositionClass(element) {
        if (!element) {
          return '';
        }
        // var position = element.attr('class').match(/top|left|right/g);
        var position = element[0].className.match(/\b(top|left|right)\b/g);
        position = position ? position[0] : '';
        return position;
      }
    }, {
      key: '_buildTemplate',

      /**
       * builds the tooltip element, adds attributes, and returns the template.
       * @private
       */
      value: function _buildTemplate(id) {
        var templateClasses = (this.options.tooltipClass + ' ' + this.options.positionClass + ' ' + this.options.templateClasses).trim();
        var $template = $('<div></div>').addClass(templateClasses).attr({
          'role': 'tooltip',
          'aria-hidden': true,
          'data-is-active': false,
          'data-is-focus': false,
          'id': id
        });
        return $template;
      }

      /**
       * Function that gets called if a collision event is detected.
       * @param {String} position - positioning class to try
       * @private
       */

    }, {
      key: '_reposition',
      value: function _reposition(position) {
        this.usedPositions.push(position ? position : 'bottom');

        //default, try switching to opposite side
        if (!position && this.usedPositions.indexOf('top') < 0) {
          this.template.addClass('top');
        } else if (position === 'top' && this.usedPositions.indexOf('bottom') < 0) {
          this.template.removeClass(position);
        } else if (position === 'left' && this.usedPositions.indexOf('right') < 0) {
          this.template.removeClass(position).addClass('right');
        } else if (position === 'right' && this.usedPositions.indexOf('left') < 0) {
          this.template.removeClass(position).addClass('left');
        }

        //if default change didn't work, try bottom or left first
        else if (!position && this.usedPositions.indexOf('top') > -1 && this.usedPositions.indexOf('left') < 0) {
            this.template.addClass('left');
          } else if (position === 'top' && this.usedPositions.indexOf('bottom') > -1 && this.usedPositions.indexOf('left') < 0) {
            this.template.removeClass(position).addClass('left');
          } else if (position === 'left' && this.usedPositions.indexOf('right') > -1 && this.usedPositions.indexOf('bottom') < 0) {
            this.template.removeClass(position);
          } else if (position === 'right' && this.usedPositions.indexOf('left') > -1 && this.usedPositions.indexOf('bottom') < 0) {
            this.template.removeClass(position);
          }
          //if nothing cleared, set to bottom
          else {
              this.template.removeClass(position);
            }
        this.classChanged = true;
        this.counter--;
      }

      /**
       * sets the position class of an element and recursively calls itself until there are no more possible positions to attempt, or the tooltip element is no longer colliding.
       * if the tooltip is larger than the screen width, default to full width - any user selected margin
       * @private
       */

    }, {
      key: '_setPosition',
      value: function _setPosition() {
        var position = this._getPositionClass(this.template),
            $tipDims = Foundation.Box.GetDimensions(this.template),
            $anchorDims = Foundation.Box.GetDimensions(this.$element),
            direction = position === 'left' ? 'left' : position === 'right' ? 'left' : 'top',
            param = direction === 'top' ? 'height' : 'width',
            offset = param === 'height' ? this.options.vOffset : this.options.hOffset,
            _this = this;

        if ($tipDims.width >= $tipDims.windowDims.width || !this.counter && !Foundation.Box.ImNotTouchingYou(this.template)) {
          this.template.offset(Foundation.Box.GetOffsets(this.template, this.$element, 'center bottom', this.options.vOffset, this.options.hOffset, true)).css({
            // this.$element.offset(Foundation.GetOffsets(this.template, this.$element, 'center bottom', this.options.vOffset, this.options.hOffset, true)).css({
            'width': $anchorDims.windowDims.width - this.options.hOffset * 2,
            'height': 'auto'
          });
          return false;
        }

        this.template.offset(Foundation.Box.GetOffsets(this.template, this.$element, 'center ' + (position || 'bottom'), this.options.vOffset, this.options.hOffset));

        while (!Foundation.Box.ImNotTouchingYou(this.template) && this.counter) {
          this._reposition(position);
          this._setPosition();
        }
      }

      /**
       * reveals the tooltip, and fires an event to close any other open tooltips on the page
       * @fires Tooltip#closeme
       * @fires Tooltip#show
       * @function
       */

    }, {
      key: 'show',
      value: function show() {
        if (this.options.showOn !== 'all' && !Foundation.MediaQuery.is(this.options.showOn)) {
          // console.error('The screen is too small to display this tooltip');
          return false;
        }

        var _this = this;
        this.template.css('visibility', 'hidden').show();
        this._setPosition();

        /**
         * Fires to close all other open tooltips on the page
         * @event Closeme#tooltip
         */
        this.$element.trigger('closeme.zf.tooltip', this.template.attr('id'));

        this.template.attr({
          'data-is-active': true,
          'aria-hidden': false
        });
        _this.isActive = true;
        // console.log(this.template);
        this.template.stop().hide().css('visibility', '').fadeIn(this.options.fadeInDuration, function () {
          //maybe do stuff?
        });
        /**
         * Fires when the tooltip is shown
         * @event Tooltip#show
         */
        this.$element.trigger('show.zf.tooltip');
      }

      /**
       * Hides the current tooltip, and resets the positioning class if it was changed due to collision
       * @fires Tooltip#hide
       * @function
       */

    }, {
      key: 'hide',
      value: function hide() {
        // console.log('hiding', this.$element.data('yeti-box'));
        var _this = this;
        this.template.stop().attr({
          'aria-hidden': true,
          'data-is-active': false
        }).fadeOut(this.options.fadeOutDuration, function () {
          _this.isActive = false;
          _this.isClick = false;
          if (_this.classChanged) {
            _this.template.removeClass(_this._getPositionClass(_this.template)).addClass(_this.options.positionClass);

            _this.usedPositions = [];
            _this.counter = 4;
            _this.classChanged = false;
          }
        });
        /**
         * fires when the tooltip is hidden
         * @event Tooltip#hide
         */
        this.$element.trigger('hide.zf.tooltip');
      }

      /**
       * adds event listeners for the tooltip and its anchor
       * TODO combine some of the listeners like focus and mouseenter, etc.
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        var _this = this;
        var $template = this.template;
        var isFocus = false;

        if (!this.options.disableHover) {

          this.$element.on('mouseenter.zf.tooltip', function (e) {
            if (!_this.isActive) {
              _this.timeout = setTimeout(function () {
                _this.show();
              }, _this.options.hoverDelay);
            }
          }).on('mouseleave.zf.tooltip', function (e) {
            clearTimeout(_this.timeout);
            if (!isFocus || _this.isClick && !_this.options.clickOpen) {
              _this.hide();
            }
          });
        }

        if (this.options.clickOpen) {
          this.$element.on('mousedown.zf.tooltip', function (e) {
            e.stopImmediatePropagation();
            if (_this.isClick) {
              //_this.hide();
              // _this.isClick = false;
            } else {
              _this.isClick = true;
              if ((_this.options.disableHover || !_this.$element.attr('tabindex')) && !_this.isActive) {
                _this.show();
              }
            }
          });
        } else {
          this.$element.on('mousedown.zf.tooltip', function (e) {
            e.stopImmediatePropagation();
            _this.isClick = true;
          });
        }

        if (!this.options.disableForTouch) {
          this.$element.on('tap.zf.tooltip touchend.zf.tooltip', function (e) {
            _this.isActive ? _this.hide() : _this.show();
          });
        }

        this.$element.on({
          // 'toggle.zf.trigger': this.toggle.bind(this),
          // 'close.zf.trigger': this.hide.bind(this)
          'close.zf.trigger': this.hide.bind(this)
        });

        this.$element.on('focus.zf.tooltip', function (e) {
          isFocus = true;
          if (_this.isClick) {
            // If we're not showing open on clicks, we need to pretend a click-launched focus isn't
            // a real focus, otherwise on hover and come back we get bad behavior
            if (!_this.options.clickOpen) {
              isFocus = false;
            }
            return false;
          } else {
            _this.show();
          }
        }).on('focusout.zf.tooltip', function (e) {
          isFocus = false;
          _this.isClick = false;
          _this.hide();
        }).on('resizeme.zf.trigger', function () {
          if (_this.isActive) {
            _this._setPosition();
          }
        });
      }

      /**
       * adds a toggle method, in addition to the static show() & hide() functions
       * @function
       */

    }, {
      key: 'toggle',
      value: function toggle() {
        if (this.isActive) {
          this.hide();
        } else {
          this.show();
        }
      }

      /**
       * Destroys an instance of tooltip, removes template element from the view.
       * @function
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this.$element.attr('title', this.template.text()).off('.zf.trigger .zf.tooltip').removeClass('has-tip top right left').removeAttr('aria-describedby aria-haspopup data-disable-hover data-resize data-toggle data-tooltip data-yeti-box');

        this.template.remove();

        Foundation.unregisterPlugin(this);
      }
    }]);

    return Tooltip;
  }();

  Tooltip.defaults = {
    disableForTouch: false,
    /**
     * Time, in ms, before a tooltip should open on hover.
     * @option
     * @type {number}
     * @default 200
     */
    hoverDelay: 200,
    /**
     * Time, in ms, a tooltip should take to fade into view.
     * @option
     * @type {number}
     * @default 150
     */
    fadeInDuration: 150,
    /**
     * Time, in ms, a tooltip should take to fade out of view.
     * @option
     * @type {number}
     * @default 150
     */
    fadeOutDuration: 150,
    /**
     * Disables hover events from opening the tooltip if set to true
     * @option
     * @type {boolean}
     * @default false
     */
    disableHover: false,
    /**
     * Optional addtional classes to apply to the tooltip template on init.
     * @option
     * @type {string}
     * @default ''
     */
    templateClasses: '',
    /**
     * Non-optional class added to tooltip templates. Foundation default is 'tooltip'.
     * @option
     * @type {string}
     * @default 'tooltip'
     */
    tooltipClass: 'tooltip',
    /**
     * Class applied to the tooltip anchor element.
     * @option
     * @type {string}
     * @default 'has-tip'
     */
    triggerClass: 'has-tip',
    /**
     * Minimum breakpoint size at which to open the tooltip.
     * @option
     * @type {string}
     * @default 'small'
     */
    showOn: 'small',
    /**
     * Custom template to be used to generate markup for tooltip.
     * @option
     * @type {string}
     * @default ''
     */
    template: '',
    /**
     * Text displayed in the tooltip template on open.
     * @option
     * @type {string}
     * @default ''
     */
    tipText: '',
    touchCloseText: 'Tap to close.',
    /**
     * Allows the tooltip to remain open if triggered with a click or touch event.
     * @option
     * @type {boolean}
     * @default true
     */
    clickOpen: true,
    /**
     * Additional positioning classes, set by the JS
     * @option
     * @type {string}
     * @default ''
     */
    positionClass: '',
    /**
     * Distance, in pixels, the template should push away from the anchor on the Y axis.
     * @option
     * @type {number}
     * @default 10
     */
    vOffset: 10,
    /**
     * Distance, in pixels, the template should push away from the anchor on the X axis, if aligned to a side.
     * @option
     * @type {number}
     * @default 12
     */
    hOffset: 12,
    /**
    * Allow HTML in tooltip. Warning: If you are loading user-generated content into tooltips,
    * allowing HTML may open yourself up to XSS attacks.
    * @option
    * @type {boolean}
    * @default false
    */
    allowHtml: false
  };

  /**
   * TODO utilize resize event trigger
   */

  // Window exports
  Foundation.plugin(Tooltip, 'Tooltip');
}(jQuery);
;'use strict';

// Polyfill for requestAnimationFrame

(function () {
  if (!Date.now) Date.now = function () {
    return new Date().getTime();
  };

  var vendors = ['webkit', 'moz'];
  for (var i = 0; i < vendors.length && !window.requestAnimationFrame; ++i) {
    var vp = vendors[i];
    window.requestAnimationFrame = window[vp + 'RequestAnimationFrame'];
    window.cancelAnimationFrame = window[vp + 'CancelAnimationFrame'] || window[vp + 'CancelRequestAnimationFrame'];
  }
  if (/iP(ad|hone|od).*OS 6/.test(window.navigator.userAgent) || !window.requestAnimationFrame || !window.cancelAnimationFrame) {
    var lastTime = 0;
    window.requestAnimationFrame = function (callback) {
      var now = Date.now();
      var nextTime = Math.max(lastTime + 16, now);
      return setTimeout(function () {
        callback(lastTime = nextTime);
      }, nextTime - now);
    };
    window.cancelAnimationFrame = clearTimeout;
  }
})();

var initClasses = ['mui-enter', 'mui-leave'];
var activeClasses = ['mui-enter-active', 'mui-leave-active'];

// Find the right "transitionend" event for this browser
var endEvent = function () {
  var transitions = {
    'transition': 'transitionend',
    'WebkitTransition': 'webkitTransitionEnd',
    'MozTransition': 'transitionend',
    'OTransition': 'otransitionend'
  };
  var elem = window.document.createElement('div');

  for (var t in transitions) {
    if (typeof elem.style[t] !== 'undefined') {
      return transitions[t];
    }
  }

  return null;
}();

function animate(isIn, element, animation, cb) {
  element = $(element).eq(0);

  if (!element.length) return;

  if (endEvent === null) {
    isIn ? element.show() : element.hide();
    cb();
    return;
  }

  var initClass = isIn ? initClasses[0] : initClasses[1];
  var activeClass = isIn ? activeClasses[0] : activeClasses[1];

  // Set up the animation
  reset();
  element.addClass(animation);
  element.css('transition', 'none');
  requestAnimationFrame(function () {
    element.addClass(initClass);
    if (isIn) element.show();
  });

  // Start the animation
  requestAnimationFrame(function () {
    element[0].offsetWidth;
    element.css('transition', '');
    element.addClass(activeClass);
  });

  // Clean up the animation when it finishes
  element.one('transitionend', finish);

  // Hides the element (for out animations), resets the element, and runs a callback
  function finish() {
    if (!isIn) element.hide();
    reset();
    if (cb) cb.apply(element);
  }

  // Resets transitions and removes motion-specific classes
  function reset() {
    element[0].style.transitionDuration = 0;
    element.removeClass(initClass + ' ' + activeClass + ' ' + animation);
  }
}

var MotionUI = {
  animateIn: function (element, animation, cb) {
    animate(true, element, animation, cb);
  },

  animateOut: function (element, animation, cb) {
    animate(false, element, animation, cb);
  }
};
;"use strict";

!function (t, i) {
  "use strict";
  if (!i) throw new Error("Filterizr requires jQuery to work.");var r = function (t) {
    this.init(t);
  };r.prototype = { init: function (t) {
      this.root = { x: 0, y: 0, w: t };
    }, fit: function (t) {
      var i,
          r,
          n,
          e = t.length,
          o = e > 0 ? t[0].h : 0;for (this.root.h = o, i = 0; i < e; i++) {
        n = t[i], (r = this.findNode(this.root, n.w, n.h)) ? n.fit = this.splitNode(r, n.w, n.h) : n.fit = this.growDown(n.w, n.h);
      }
    }, findNode: function (t, i, r) {
      return t.used ? this.findNode(t.right, i, r) || this.findNode(t.down, i, r) : i <= t.w && r <= t.h ? t : null;
    }, splitNode: function (t, i, r) {
      return t.used = !0, t.down = { x: t.x, y: t.y + r, w: t.w, h: t.h - r }, t.right = { x: t.x + i, y: t.y, w: t.w - i, h: r }, t;
    }, growDown: function (t, i) {
      var r;return this.root = { used: !0, x: 0, y: 0, w: this.root.w, h: this.root.h + i, down: { x: 0, y: this.root.h, w: this.root.w, h: i }, right: this.root }, (r = this.findNode(this.root, t, i)) ? this.splitNode(r, t, i) : null;
    } }, i.fn.filterizr = function () {
    var t = this,
        r = arguments;if (t._fltr || (t._fltr = i.fn.filterizr.prototype.init(t, "object" == typeof r[0] ? r[0] : void 0)), "string" == typeof r[0]) {
      if (r[0].lastIndexOf("_") > -1) throw new Error("Filterizr error: You cannot call private methods");if ("function" != typeof t._fltr[r[0]]) throw new Error("Filterizr error: There is no such function");t._fltr[r[0]](r[1], r[2]);
    }return t;
  }, i.fn.filterizr.prototype = { init: function (t, r) {
      var n = i(t).extend(i.fn.filterizr.prototype);return n.options = { animationDuration: .5, callbacks: { onFilteringStart: function () {}, onFilteringEnd: function () {}, onShufflingStart: function () {}, onShufflingEnd: function () {}, onSortingStart: function () {}, onSortingEnd: function () {} }, delay: 0, delayMode: "progressive", easing: "ease-out", filter: "all", filterOutCss: { opacity: 0, transform: "scale(0.5)" }, filterInCss: { opacity: 1, transform: "scale(1)" }, layout: "sameSize", setupControls: !0 }, 0 === arguments.length && (r = n.options), 1 === arguments.length && "object" == typeof arguments[0] && (r = arguments[0]), r && n.setOptions(r), n.css({ padding: 0, position: "relative" }), n._lastCategory = 0, n._isAnimating = !1, n._isShuffling = !1, n._isSorting = !1, n._mainArray = n._getFiltrItems(), n._subArrays = n._makeSubarrays(), n._activeArray = n._getCollectionByFilter(n.options.filter), n._toggledCategories = {}, n._typedText = i("input[data-search]").val() || "", n._uID = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (t) {
        var i = 16 * Math.random() | 0;return ("x" == t ? i : 3 & i | 8).toString(16);
      }), n._setupEvents(), n.options.setupControls && n._setupControls(), n.filter(n.options.filter), n;
    }, filter: function (t) {
      var i = this,
          r = i._getCollectionByFilter(t);i.options.filter = t, i.trigger("filteringStart"), i._handleFiltering(r), i._isSearchActivated() && i.search(i._typedText);
    }, toggleFilter: function (t) {
      var i = this,
          r = [];i.trigger("filteringStart"), t && (i._toggledCategories[t] ? delete i._toggledCategories[t] : i._toggledCategories[t] = !0), i._multifilterModeOn() ? (r = i._makeMultifilterArray(), i._handleFiltering(r), i._isSearchActivated() && i.search(i._typedText)) : (i.filter("all"), i._isSearchActivated() && i.search(i._typedText));
    }, search: function (t) {
      var i = this,
          r = i._multifilterModeOn() ? i._makeMultifilterArray() : i._getCollectionByFilter(i.options.filter),
          n = [],
          e = 0;if (i._isSearchActivated()) for (e = 0; e < r.length; e++) {
        r[e].text().toLowerCase().indexOf(t.toLowerCase()) > -1 && n.push(r[e]);
      }if (n.length > 0) i._handleFiltering(n);else if (i._isSearchActivated()) for (e = 0; e < i._activeArray.length; e++) {
        i._activeArray[e]._filterOut();
      } else i._handleFiltering(r);
    }, shuffle: function () {
      var t = this;t._isAnimating = !0, t._isShuffling = !0, t.trigger("shufflingStart"), t._mainArray = t._fisherYatesShuffle(t._mainArray), t._subArrays = t._makeSubarrays();var i = t._multifilterModeOn() ? t._makeMultifilterArray() : t._getCollectionByFilter(t.options.filter);t._isSearchActivated() ? t.search(t._typedText) : t._placeItems(i);
    }, sort: function (t, i) {
      var r = this;if (t = t || "domIndex", i = i || "asc", r._isAnimating = !0, r._isSorting = !0, r.trigger("sortingStart"), "domIndex" !== t && "sortData" !== t && "w" !== t && "h" !== t) for (var n = 0; n < r._mainArray.length; n++) {
        r._mainArray[n][t] = r._mainArray[n].data(t);
      }r._mainArray.sort(r._comparator(t, i)), r._subArrays = r._makeSubarrays();var e = r._multifilterModeOn() ? r._makeMultifilterArray() : r._getCollectionByFilter(r.options.filter);r._isSearchActivated() ? r.search(r._typedText) : r._placeItems(e);
    }, setOptions: function (t) {
      var i = this,
          r = 0;for (var n in t) {
        i.options[n] = t[n];
      }if (i._mainArray && (t.animationDuration || t.delay || t.easing || t.delayMode)) for (r = 0; r < i._mainArray.length; r++) {
        i._mainArray[r].css("transition", "all " + i.options.animationDuration + "s " + i.options.easing + " " + i._mainArray[r]._calcDelay() + "ms");
      }t.callbacks && (t.callbacks.onFilteringStart || (i.options.callbacks.onFilteringStart = function () {}), t.callbacks.onFilteringEnd || (i.options.callbacks.onFilteringEnd = function () {}), t.callbacks.onShufflingStart || (i.options.callbacks.onShufflingStart = function () {}), t.callbacks.onShufflingEnd || (i.options.callbacks.onShufflingEnd = function () {}), t.callbacks.onSortingStart || (i.options.callbacks.onSortingStart = function () {}), t.callbacks.onSortingEnd || (i.options.callbacks.onSortingEnd = function () {})), i.options.filterInCss.transform || (i.options.filterInCss.transform = "translate3d(0,0,0)"), i.options.filterOutCss.transform || (i.options.filterOutCss.transform = "translate3d(0,0,0)");
    }, _getFiltrItems: function () {
      var t = this,
          r = i(t.find(".filtr-item")),
          e = [];return i.each(r, function (r, o) {
        var a = i(o).extend(n)._init(r, t);e.push(a);
      }), e;
    }, _makeSubarrays: function () {
      for (var t = this, i = [], r = 0; r < t._lastCategory; r++) {
        i.push([]);
      }for (r = 0; r < t._mainArray.length; r++) {
        if ("object" == typeof t._mainArray[r]._category) for (var n = t._mainArray[r]._category.length, e = 0; e < n; e++) {
          i[t._mainArray[r]._category[e] - 1].push(t._mainArray[r]);
        } else i[t._mainArray[r]._category - 1].push(t._mainArray[r]);
      }return i;
    }, _makeMultifilterArray: function () {
      for (var t = this, i = [], r = {}, n = 0; n < t._mainArray.length; n++) {
        var e = t._mainArray[n],
            o = !1,
            a = e.domIndex in r == !1;if (Array.isArray(e._category)) {
          for (var s = 0; s < e._category.length; s++) {
            if (e._category[s] in t._toggledCategories) {
              o = !0;break;
            }
          }
        } else e._category in t._toggledCategories && (o = !0);a && o && (r[e.domIndex] = !0, i.push(e));
      }return i;
    }, _setupControls: function () {
      var t = this;i("*[data-filter]").click(function () {
        var r = i(this).data("filter");t.options.filter !== r && t.filter(r);
      }), i("*[data-multifilter]").click(function () {
        var r = i(this).data("multifilter");"all" === r ? (t._toggledCategories = {}, t.filter("all")) : t.toggleFilter(r);
      }), i("*[data-shuffle]").click(function () {
        t.shuffle();
      }), i("*[data-sortAsc]").click(function () {
        var r = i("*[data-sortOrder]").val();t.sort(r, "asc");
      }), i("*[data-sortDesc]").click(function () {
        var r = i("*[data-sortOrder]").val();t.sort(r, "desc");
      }), i("input[data-search]").keyup(function () {
        t._typedText = i(this).val(), t._delayEvent(function () {
          t.search(t._typedText);
        }, 250, t._uID);
      });
    }, _setupEvents: function () {
      var r = this;i(t).resize(function () {
        r._delayEvent(function () {
          r.trigger("resizeFiltrContainer");
        }, 250, r._uID);
      }), r.on("resizeFiltrContainer", function () {
        r._multifilterModeOn() ? r.toggleFilter() : r.filter(r.options.filter);
      }).on("filteringStart", function () {
        r.options.callbacks.onFilteringStart();
      }).on("filteringEnd", function () {
        r.options.callbacks.onFilteringEnd();
      }).on("shufflingStart", function () {
        r._isShuffling = !0, r.options.callbacks.onShufflingStart();
      }).on("shufflingEnd", function () {
        r.options.callbacks.onShufflingEnd(), r._isShuffling = !1;
      }).on("sortingStart", function () {
        r._isSorting = !0, r.options.callbacks.onSortingStart();
      }).on("sortingEnd", function () {
        r.options.callbacks.onSortingEnd(), r._isSorting = !1;
      });
    }, _calcItemPositions: function () {
      var t = this,
          n = t._activeArray,
          e = 0,
          o = Math.round(t.width() / t.find(".filtr-item").outerWidth()),
          a = 0,
          s = n[0].outerWidth(),
          l = 0,
          f = 0,
          u = 0,
          c = 0,
          g = 0,
          _ = [];if ("packed" === t.options.layout) {
        i.each(t._activeArray, function (t, i) {
          i._updateDimensions();
        });var h = new r(t.outerWidth());for (h.fit(t._activeArray), c = 0; c < n.length; c++) {
          _.push({ left: n[c].fit.x, top: n[c].fit.y });
        }e = h.root.h;
      }if ("horizontal" === t.options.layout) for (a = 1, c = 1; c <= n.length; c++) {
        s = n[c - 1].outerWidth(), l = n[c - 1].outerHeight(), _.push({ left: f, top: u }), f += s, e < l && (e = l);
      } else if ("vertical" === t.options.layout) {
        for (c = 1; c <= n.length; c++) {
          l = n[c - 1].outerHeight(), _.push({ left: f, top: u }), u += l;
        }e = u;
      } else if ("sameHeight" === t.options.layout) {
        a = 1;var d = t.outerWidth();for (c = 1; c <= n.length; c++) {
          s = n[c - 1].width();var p = n[c - 1].outerWidth(),
              y = 0;n[c] && (y = n[c].width()), _.push({ left: f, top: u }), (g = f + s + y) > d ? (g = 0, f = 0, u += n[0].outerHeight(), a++) : f += p;
        }e = a * n[0].outerHeight();
      } else if ("sameWidth" === t.options.layout) {
        for (c = 1; c <= n.length; c++) {
          if (_.push({ left: f, top: u }), c % o == 0 && a++, f += s, u = 0, a > 0) for (g = a; g > 0;) {
            u += n[c - o * g].outerHeight(), g--;
          }c % o == 0 && (f = 0);
        }for (c = 0; c < o; c++) {
          for (var m = 0, v = c; n[v];) {
            m += n[v].outerHeight(), v += o;
          }m > e ? (e = m, m = 0) : m = 0;
        }
      } else if ("sameSize" === t.options.layout) {
        for (c = 1; c <= n.length; c++) {
          _.push({ left: f, top: u }), f += s, c % o == 0 && (u += n[0].outerHeight(), f = 0);
        }e = (a = Math.ceil(n.length / o)) * n[0].outerHeight();
      }return t.css("height", e), _;
    }, _handleFiltering: function (t) {
      for (var i = this, r = i._getArrayOfUniqueItems(i._activeArray, t), n = 0; n < r.length; n++) {
        r[n]._filterOut();
      }i._activeArray = t, i._placeItems(t);
    }, _multifilterModeOn: function () {
      var t = this;return Object.keys(t._toggledCategories).length > 0;
    }, _isSearchActivated: function () {
      return this._typedText.length > 0;
    }, _placeItems: function (t) {
      var i = this;i._isAnimating = !0, i._itemPositions = i._calcItemPositions();for (var r = 0; r < t.length; r++) {
        t[r]._filterIn(i._itemPositions[r]);
      }
    }, _getCollectionByFilter: function (t) {
      var i = this;return "all" === t ? i._mainArray : i._subArrays[t - 1];
    }, _makeDeepCopy: function (t) {
      var i = {};for (var r in t) {
        i[r] = t[r];
      }return i;
    }, _comparator: function (t, i) {
      return function (r, n) {
        return "asc" === i ? r[t] < n[t] ? -1 : r[t] > n[t] ? 1 : 0 : "desc" === i ? n[t] < r[t] ? -1 : n[t] > r[t] ? 1 : 0 : void 0;
      };
    }, _getArrayOfUniqueItems: function (t, i) {
      var r,
          n,
          e = [],
          o = {},
          a = i.length;for (r = 0; r < a; r++) {
        o[i[r].domIndex] = !0;
      }for (a = t.length, r = 0; r < a; r++) {
        (n = t[r]).domIndex in o || e.push(n);
      }return e;
    }, _delayEvent: function () {
      var t = {};return function (i, r, n) {
        if (null === n) throw Error("UniqueID needed");t[n] && clearTimeout(t[n]), t[n] = setTimeout(i, r);
      };
    }(), _fisherYatesShuffle: function (t) {
      for (var i, r, n = t.length; n;) {
        r = Math.floor(Math.random() * n--), i = t[n], t[n] = t[r], t[r] = i;
      }return t;
    } };var n = { _init: function (t, i) {
      var r = this;return r._parent = i, r._category = r._getCategory(), r._lastPos = {}, r.domIndex = t, r.sortData = r.data("sort"), r.w = 0, r.h = 0, r._isFilteredOut = !0, r._filteringOut = !1, r._filteringIn = !1, r.css(i.options.filterOutCss).css({ "-webkit-backface-visibility": "hidden", perspective: "1000px", "-webkit-perspective": "1000px", "-webkit-transform-style": "preserve-3d", position: "absolute", transition: "all " + i.options.animationDuration + "s " + i.options.easing + " " + r._calcDelay() + "ms" }), r.on("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd", function () {
        r._onTransitionEnd();
      }), r;
    }, _updateDimensions: function () {
      var t = this;t.w = t.outerWidth(), t.h = t.outerHeight();
    }, _calcDelay: function () {
      var t = this,
          i = 0;return "progressive" === t._parent.options.delayMode ? i = t._parent.options.delay * t.domIndex : t.domIndex % 2 == 0 && (i = t._parent.options.delay), i;
    }, _getCategory: function () {
      var t = this,
          i = t.data("category");if ("string" == typeof i) {
        i = i.split(", ");for (var r = 0; r < i.length; r++) {
          if (isNaN(parseInt(i[r]))) throw new Error("Filterizr: the value of data-category must be a number, starting from value 1 and increasing.");parseInt(i[r]) > t._parent._lastCategory && (t._parent._lastCategory = parseInt(i[r]));
        }
      } else i > t._parent._lastCategory && (t._parent._lastCategory = i);return i;
    }, _onTransitionEnd: function () {
      var t = this;t._filteringOut ? (i(t).addClass("filteredOut"), t._isFilteredOut = !0, t._filteringOut = !1) : t._filteringIn && (t._isFilteredOut = !1, t._filteringIn = !1), t._parent._isAnimating && (t._parent._isShuffling ? t._parent.trigger("shufflingEnd") : t._parent._isSorting ? t._parent.trigger("sortingEnd") : t._parent.trigger("filteringEnd"), t._parent._isAnimating = !1);
    }, _filterOut: function () {
      var t = this,
          i = t._parent._makeDeepCopy(t._parent.options.filterOutCss);i.transform += " translate3d(" + t._lastPos.left + "px," + t._lastPos.top + "px, 0)", t.css(i), t.css("pointer-events", "none"), t._filteringOut = !0;
    }, _filterIn: function (t) {
      var r = this,
          n = r._parent._makeDeepCopy(r._parent.options.filterInCss);i(r).removeClass("filteredOut"), r._filteringIn = !0, r._lastPos = t, r.css("pointer-events", "auto"), n.transform += " translate3d(" + t.left + "px," + t.top + "px, 0)", r.css(n);
    } };
}(this, jQuery);
;"use strict";

/**
 * Featherlight - ultra slim jQuery lightbox
 * Version 1.7.7 - http://noelboss.github.io/featherlight/
 *
 * Copyright 2017, Noël Raoul Bossart (http://www.noelboss.com)
 * MIT Licensed.
**/
!function (a) {
  "use strict";
  function b(a, c) {
    if (!(this instanceof b)) {
      var d = new b(a, c);return d.open(), d;
    }this.id = b.id++, this.setup(a, c), this.chainCallbacks(b._callbackChain);
  }function c(a, b) {
    var c = {};for (var d in a) {
      d in b && (c[d] = a[d], delete a[d]);
    }return c;
  }function d(a, b) {
    var c = {},
        d = new RegExp("^" + b + "([A-Z])(.*)");for (var e in a) {
      var f = e.match(d);if (f) {
        var g = (f[1] + f[2].replace(/([A-Z])/g, "-$1")).toLowerCase();c[g] = a[e];
      }
    }return c;
  }if ("undefined" == typeof a) return void ("console" in window && window.console.info("Too much lightness, Featherlight needs jQuery."));var e = [],
      f = function (b) {
    return e = a.grep(e, function (a) {
      return a !== b && a.$instance.closest("body").length > 0;
    });
  },
      g = { allowfullscreen: 1, frameborder: 1, height: 1, longdesc: 1, marginheight: 1, marginwidth: 1, name: 1, referrerpolicy: 1, scrolling: 1, sandbox: 1, src: 1, srcdoc: 1, width: 1 },
      h = { keyup: "onKeyUp", resize: "onResize" },
      i = function (c) {
    a.each(b.opened().reverse(), function () {
      return c.isDefaultPrevented() || !1 !== this[h[c.type]](c) ? void 0 : (c.preventDefault(), c.stopPropagation(), !1);
    });
  },
      j = function (c) {
    if (c !== b._globalHandlerInstalled) {
      b._globalHandlerInstalled = c;var d = a.map(h, function (a, c) {
        return c + "." + b.prototype.namespace;
      }).join(" ");a(window)[c ? "on" : "off"](d, i);
    }
  };b.prototype = { constructor: b, namespace: "featherlight", targetAttr: "data-featherlight", variant: null, resetCss: !1, background: null, openTrigger: "click", closeTrigger: "click", filter: null, root: "body", openSpeed: 250, closeSpeed: 250, closeOnClick: "background", closeOnEsc: !0, closeIcon: "&#10005;", loading: "", persist: !1, otherClose: null, beforeOpen: a.noop, beforeContent: a.noop, beforeClose: a.noop, afterOpen: a.noop, afterContent: a.noop, afterClose: a.noop, onKeyUp: a.noop, onResize: a.noop, type: null, contentFilters: ["jquery", "image", "html", "ajax", "iframe", "text"], setup: function (b, c) {
      "object" != typeof b || b instanceof a != !1 || c || (c = b, b = void 0);var d = a.extend(this, c, { target: b }),
          e = d.resetCss ? d.namespace + "-reset" : d.namespace,
          f = a(d.background || ['<div class="' + e + "-loading " + e + '">', '<div class="' + e + '-content">', '<button class="' + e + "-close-icon " + d.namespace + '-close" aria-label="Close">', d.closeIcon, "</button>", '<div class="' + d.namespace + '-inner">' + d.loading + "</div>", "</div>", "</div>"].join("")),
          g = "." + d.namespace + "-close" + (d.otherClose ? "," + d.otherClose : "");return d.$instance = f.clone().addClass(d.variant), d.$instance.on(d.closeTrigger + "." + d.namespace, function (b) {
        var c = a(b.target);("background" === d.closeOnClick && c.is("." + d.namespace) || "anywhere" === d.closeOnClick || c.closest(g).length) && (d.close(b), b.preventDefault());
      }), this;
    }, getContent: function () {
      if (this.persist !== !1 && this.$content) return this.$content;var b = this,
          c = this.constructor.contentFilters,
          d = function (a) {
        return b.$currentTarget && b.$currentTarget.attr(a);
      },
          e = d(b.targetAttr),
          f = b.target || e || "",
          g = c[b.type];if (!g && f in c && (g = c[f], f = b.target && e), f = f || d("href") || "", !g) for (var h in c) {
        b[h] && (g = c[h], f = b[h]);
      }if (!g) {
        var i = f;if (f = null, a.each(b.contentFilters, function () {
          return g = c[this], g.test && (f = g.test(i)), !f && g.regex && i.match && i.match(g.regex) && (f = i), !f;
        }), !f) return "console" in window && window.console.error("Featherlight: no content filter found " + (i ? ' for "' + i + '"' : " (no target specified)")), !1;
      }return g.process.call(b, f);
    }, setContent: function (b) {
      var c = this;return b.is("iframe") && c.$instance.addClass(c.namespace + "-iframe"), c.$instance.removeClass(c.namespace + "-loading"), c.$instance.find("." + c.namespace + "-inner").not(b).slice(1).remove().end().replaceWith(a.contains(c.$instance[0], b[0]) ? "" : b), c.$content = b.addClass(c.namespace + "-inner"), c;
    }, open: function (b) {
      var c = this;if (c.$instance.hide().appendTo(c.root), !(b && b.isDefaultPrevented() || c.beforeOpen(b) === !1)) {
        b && b.preventDefault();var d = c.getContent();if (d) return e.push(c), j(!0), c.$instance.fadeIn(c.openSpeed), c.beforeContent(b), a.when(d).always(function (a) {
          c.setContent(a), c.afterContent(b);
        }).then(c.$instance.promise()).done(function () {
          c.afterOpen(b);
        });
      }return c.$instance.detach(), a.Deferred().reject().promise();
    }, close: function (b) {
      var c = this,
          d = a.Deferred();return c.beforeClose(b) === !1 ? d.reject() : (0 === f(c).length && j(!1), c.$instance.fadeOut(c.closeSpeed, function () {
        c.$instance.detach(), c.afterClose(b), d.resolve();
      })), d.promise();
    }, resize: function (a, b) {
      if (a && b) {
        this.$content.css("width", "").css("height", "");var c = Math.max(a / (this.$content.parent().width() - 1), b / (this.$content.parent().height() - 1));c > 1 && (c = b / Math.floor(b / c), this.$content.css("width", "" + a / c + "px").css("height", "" + b / c + "px"));
      }
    }, chainCallbacks: function (b) {
      for (var c in b) {
        this[c] = a.proxy(b[c], this, a.proxy(this[c], this));
      }
    } }, a.extend(b, { id: 0, autoBind: "[data-featherlight]", defaults: b.prototype, contentFilters: { jquery: { regex: /^[#.]\w/, test: function (b) {
          return b instanceof a && b;
        }, process: function (b) {
          return this.persist !== !1 ? a(b) : a(b).clone(!0);
        } }, image: { regex: /\.(png|jpg|jpeg|gif|tiff|bmp|svg)(\?\S*)?$/i, process: function (b) {
          var c = this,
              d = a.Deferred(),
              e = new Image(),
              f = a('<img src="' + b + '" alt="" class="' + c.namespace + '-image" />');return e.onload = function () {
            f.naturalWidth = e.width, f.naturalHeight = e.height, d.resolve(f);
          }, e.onerror = function () {
            d.reject(f);
          }, e.src = b, d.promise();
        } }, html: { regex: /^\s*<[\w!][^<]*>/, process: function (b) {
          return a(b);
        } }, ajax: { regex: /./, process: function (b) {
          var c = a.Deferred(),
              d = a("<div></div>").load(b, function (a, b) {
            "error" !== b && c.resolve(d.contents()), c.fail();
          });return c.promise();
        } }, iframe: { process: function (b) {
          var e = new a.Deferred(),
              f = a("<iframe/>"),
              h = d(this, "iframe"),
              i = c(h, g);return f.hide().attr("src", b).attr(i).css(h).on("load", function () {
            e.resolve(f.show());
          }).appendTo(this.$instance.find("." + this.namespace + "-content")), e.promise();
        } }, text: { process: function (b) {
          return a("<div>", { text: b });
        } } }, functionAttributes: ["beforeOpen", "afterOpen", "beforeContent", "afterContent", "beforeClose", "afterClose"], readElementConfig: function (b, c) {
      var d = this,
          e = new RegExp("^data-" + c + "-(.*)"),
          f = {};return b && b.attributes && a.each(b.attributes, function () {
        var b = this.name.match(e);if (b) {
          var c = this.value,
              g = a.camelCase(b[1]);if (a.inArray(g, d.functionAttributes) >= 0) c = new Function(c);else try {
            c = JSON.parse(c);
          } catch (h) {}f[g] = c;
        }
      }), f;
    }, extend: function (b, c) {
      var d = function () {
        this.constructor = b;
      };return d.prototype = this.prototype, b.prototype = new d(), b.__super__ = this.prototype, a.extend(b, this, c), b.defaults = b.prototype, b;
    }, attach: function (b, c, d) {
      var e = this;"object" != typeof c || c instanceof a != !1 || d || (d = c, c = void 0), d = a.extend({}, d);var f,
          g = d.namespace || e.defaults.namespace,
          h = a.extend({}, e.defaults, e.readElementConfig(b[0], g), d),
          i = function (g) {
        var i = a(g.currentTarget),
            j = a.extend({ $source: b, $currentTarget: i }, e.readElementConfig(b[0], h.namespace), e.readElementConfig(g.currentTarget, h.namespace), d),
            k = f || i.data("featherlight-persisted") || new e(c, j);"shared" === k.persist ? f = k : k.persist !== !1 && i.data("featherlight-persisted", k), j.$currentTarget.blur && j.$currentTarget.blur(), k.open(g);
      };return b.on(h.openTrigger + "." + h.namespace, h.filter, i), i;
    }, current: function () {
      var a = this.opened();return a[a.length - 1] || null;
    }, opened: function () {
      var b = this;return f(), a.grep(e, function (a) {
        return a instanceof b;
      });
    }, close: function (a) {
      var b = this.current();return b ? b.close(a) : void 0;
    }, _onReady: function () {
      var b = this;b.autoBind && (a(b.autoBind).each(function () {
        b.attach(a(this));
      }), a(document).on("click", b.autoBind, function (c) {
        if (!c.isDefaultPrevented()) {
          var d = b.attach(a(c.currentTarget));d(c);
        }
      }));
    }, _callbackChain: { onKeyUp: function (b, c) {
        return 27 === c.keyCode ? (this.closeOnEsc && a.featherlight.close(c), !1) : b(c);
      }, beforeOpen: function (b, c) {
        return this._previouslyActive = document.activeElement, this._$previouslyTabbable = a("a, input, select, textarea, iframe, button, iframe, [contentEditable=true]").not("[tabindex]").not(this.$instance.find("button")), this._$previouslyWithTabIndex = a("[tabindex]").not('[tabindex="-1"]'), this._previousWithTabIndices = this._$previouslyWithTabIndex.map(function (b, c) {
          return a(c).attr("tabindex");
        }), this._$previouslyWithTabIndex.add(this._$previouslyTabbable).attr("tabindex", -1), document.activeElement.blur && document.activeElement.blur(), b(c);
      }, afterClose: function (b, c) {
        var d = b(c),
            e = this;return this._$previouslyTabbable.removeAttr("tabindex"), this._$previouslyWithTabIndex.each(function (b, c) {
          a(c).attr("tabindex", e._previousWithTabIndices[b]);
        }), this._previouslyActive.focus(), d;
      }, onResize: function (a, b) {
        return this.resize(this.$content.naturalWidth, this.$content.naturalHeight), a(b);
      }, afterContent: function (a, b) {
        var c = a(b);return this.$instance.find("[autofocus]:not([disabled])").focus(), this.onResize(b), c;
      } } }), a.featherlight = b, a.fn.featherlight = function (a, c) {
    return b.attach(this, a, c), this;
  }, a(document).ready(function () {
    b._onReady();
  });
}(jQuery);
;'use strict';

//Default options
var options = {
  animationDuration: 0.2, //in seconds
  filter: 'all', //Initial filter
  callbacks: {
    onFilteringStart: function () {},
    onFilteringEnd: function () {},
    onShufflingStart: function () {},
    onShufflingEnd: function () {},
    onSortingStart: function () {},
    onSortingEnd: function () {}
  },
  delay: 0, //Transition delay in ms
  delayMode: 'progressive', //'progressive' or 'alternate'
  easing: 'ease-out',
  layout: 'sameSize', //See layouts
  selector: '.filtr-container',
  setupControls: true
};

jQuery(document).foundation();

window.onload = function () {
  Particles.init({
    selector: 'canvas.background',
    maxParticles: 350,
    color: '#f74902',
    responsive: [{
      breakpoint: 768,
      options: {
        maxParticles: 200,
        connectParticles: false
      }
    }, {
      breakpoint: 425,
      options: {
        maxParticles: 100
      }
    }, {
      breakpoint: 320,
      options: {
        maxParticles: 0 // disables particles.js
      }
    }]
  });
};

// once AJAX is done, lets load stuff
$.fn.almDone = function (alm) {

  //You can override any of these options and then call...
  var filterStart = $('.filtr-container').filterizr(options);
  //If you have already instantiated your Filterizr then call...
  filterStart.filterizr('setOptions', options);

  // lightbox
  $('.filtr-item > a').featherlight({
    beforeOpen: function (event) {
      //setup vars
      var $title = this.$currentTarget[0].dataset.title,
          $description = this.$currentTarget[0].dataset.description,
          $image = this.$currentTarget[0].dataset.image,
          $link = this.$currentTarget[0].dataset.link;

      // link
      $('#mylightbox').find('a.lightbox-external').attr('href', $link);
      // title
      $('#mylightbox').find('h2').empty().append($title);
      // content
      $('#mylightbox').find('p').empty().append($description);
      // image
      $('#mylightbox').find('img').attr('src', $image);

      // setup sharing
      $("#mylightbox").find('div.a2a_kit').attr("data-a2a-url", $link);
      $("#mylightbox").find('div.a2a_kit').attr("data-a2a-title", $title);
    },
    afterContent: function () {
      var $title = this.$currentTarget[0].dataset.title,
          $link = this.$currentTarget[0].dataset.link;

      // initialize sharing
      var a2a_config = a2a_config || {};
      a2a.init('page');
    }
  });
};

var alm_is_animating = false; // Animating flag
$('.alm-filter-nav li').eq(0).addClass('active'); // Set initial active state

// Btn Click Event
$('.alm-filter-nav li a').on('click', function (e) {

  e.preventDefault();
  var el = $(this); // Our selected element

  if (!el.hasClass('active') && !alm_is_animating) {
    // Check for active and !alm_is_animating
    alm_is_animating = true;
    el.parent().addClass('active').siblings('li').removeClass('active');

    // Add active state
    var data = el.data(),
        // Get data values from selected menu item
    transition = 'fade',
        // 'slide' | 'fade' | null
    speed = '300'; //in milliseconds
    $.fn.almFilter(transition, speed, data); // Run the filter
  }
});

$.fn.almFilterComplete = function () {
  console.log('Ajax Load More filter has completed!');
  alm_is_animating = false; // clear animating flag
};

jQuery(document).ready(function () {
  $.fn.almComplete = function (alm) {
    // lightbox
    $('.filtr-item > a').featherlight({
      beforeOpen: function (event) {
        //setup vars
        var $title = this.$currentTarget[0].dataset.title,
            $description = this.$currentTarget[0].dataset.description,
            $image = this.$currentTarget[0].dataset.image,
            $link = this.$currentTarget[0].dataset.link;

        // link
        $('#mylightbox').find('a.lightbox-external').attr('href', $link);
        // title
        $('#mylightbox').find('h2').empty().append($title);
        // content
        $('#mylightbox').find('p').empty().append($description);
        // image
        $('#mylightbox').find('img').attr('src', $image);

        // setup sharing
        $("#mylightbox").find('div.a2a_kit').attr("data-a2a-url", $link);
        $("#mylightbox").find('div.a2a_kit').attr("data-a2a-title", $title);
      },
      afterContent: function () {
        var $title = this.$currentTarget[0].dataset.title,
            $link = this.$currentTarget[0].dataset.link;

        // initialize sharing
        var a2a_config = a2a_config || {};
        a2a.init('page');
      }
    });
  };
});

// when closing the mobile menu, reinit filter to position right.
jQuery(document).on('closed.zf.offcanvas', function () {
  //You can override any of these options and then call...
  var filterStart = $('.filtr-container').filterizr(options);
  //If you have already instantiated your Filterizr then call...
  filterStart.filterizr('setOptions', options);
});
;"use strict";

/* jshint ignore:start */

/* ============================================================
 * jQuery Easing v1.3 - http://gsgd.co.uk/sandbox/jquery/easing/
 *
 * Open source under the BSD License.
 *
 * Copyright ・ゑｽｩ 2008 George McGinley Smith
 * All rights reserved.
 * https://raw.github.com/danro/jquery-easing/master/LICENSE
 * ======================================================== */jQuery.easing.jswing = jQuery.easing.swing, jQuery.extend(jQuery.easing, { def: "easeOutQuad", swing: function (a, b, c, d, e) {
    return jQuery.easing[jQuery.easing.def](a, b, c, d, e);
  }, easeInQuad: function (a, b, c, d, e) {
    return d * (b /= e) * b + c;
  }, easeOutQuad: function (a, b, c, d, e) {
    return -d * (b /= e) * (b - 2) + c;
  }, easeInOutQuad: function (a, b, c, d, e) {
    return (b /= e / 2) < 1 ? d / 2 * b * b + c : -d / 2 * (--b * (b - 2) - 1) + c;
  }, easeInCubic: function (a, b, c, d, e) {
    return d * (b /= e) * b * b + c;
  }, easeOutCubic: function (a, b, c, d, e) {
    return d * ((b = b / e - 1) * b * b + 1) + c;
  }, easeInOutCubic: function (a, b, c, d, e) {
    return (b /= e / 2) < 1 ? d / 2 * b * b * b + c : d / 2 * ((b -= 2) * b * b + 2) + c;
  }, easeInQuart: function (a, b, c, d, e) {
    return d * (b /= e) * b * b * b + c;
  }, easeOutQuart: function (a, b, c, d, e) {
    return -d * ((b = b / e - 1) * b * b * b - 1) + c;
  }, easeInOutQuart: function (a, b, c, d, e) {
    return (b /= e / 2) < 1 ? d / 2 * b * b * b * b + c : -d / 2 * ((b -= 2) * b * b * b - 2) + c;
  }, easeInQuint: function (a, b, c, d, e) {
    return d * (b /= e) * b * b * b * b + c;
  }, easeOutQuint: function (a, b, c, d, e) {
    return d * ((b = b / e - 1) * b * b * b * b + 1) + c;
  }, easeInOutQuint: function (a, b, c, d, e) {
    return (b /= e / 2) < 1 ? d / 2 * b * b * b * b * b + c : d / 2 * ((b -= 2) * b * b * b * b + 2) + c;
  }, easeInSine: function (a, b, c, d, e) {
    return -d * Math.cos(b / e * (Math.PI / 2)) + d + c;
  }, easeOutSine: function (a, b, c, d, e) {
    return d * Math.sin(b / e * (Math.PI / 2)) + c;
  }, easeInOutSine: function (a, b, c, d, e) {
    return -d / 2 * (Math.cos(Math.PI * b / e) - 1) + c;
  }, easeInExpo: function (a, b, c, d, e) {
    return b == 0 ? c : d * Math.pow(2, 10 * (b / e - 1)) + c;
  }, easeOutExpo: function (a, b, c, d, e) {
    return b == e ? c + d : d * (-Math.pow(2, -10 * b / e) + 1) + c;
  }, easeInOutExpo: function (a, b, c, d, e) {
    return b == 0 ? c : b == e ? c + d : (b /= e / 2) < 1 ? d / 2 * Math.pow(2, 10 * (b - 1)) + c : d / 2 * (-Math.pow(2, -10 * --b) + 2) + c;
  }, easeInCirc: function (a, b, c, d, e) {
    return -d * (Math.sqrt(1 - (b /= e) * b) - 1) + c;
  }, easeOutCirc: function (a, b, c, d, e) {
    return d * Math.sqrt(1 - (b = b / e - 1) * b) + c;
  }, easeInOutCirc: function (a, b, c, d, e) {
    return (b /= e / 2) < 1 ? -d / 2 * (Math.sqrt(1 - b * b) - 1) + c : d / 2 * (Math.sqrt(1 - (b -= 2) * b) + 1) + c;
  }, easeInElastic: function (a, b, c, d, e) {
    var f = 1.70158,
        g = 0,
        h = d;if (b == 0) return c;if ((b /= e) == 1) return c + d;g || (g = e * .3);if (h < Math.abs(d)) {
      h = d;var f = g / 4;
    } else var f = g / (2 * Math.PI) * Math.asin(d / h);return -(h * Math.pow(2, 10 * (b -= 1)) * Math.sin((b * e - f) * 2 * Math.PI / g)) + c;
  }, easeOutElastic: function (a, b, c, d, e) {
    var f = 1.70158,
        g = 0,
        h = d;if (b == 0) return c;if ((b /= e) == 1) return c + d;g || (g = e * .3);if (h < Math.abs(d)) {
      h = d;var f = g / 4;
    } else var f = g / (2 * Math.PI) * Math.asin(d / h);return h * Math.pow(2, -10 * b) * Math.sin((b * e - f) * 2 * Math.PI / g) + d + c;
  }, easeInOutElastic: function (a, b, c, d, e) {
    var f = 1.70158,
        g = 0,
        h = d;if (b == 0) return c;if ((b /= e / 2) == 2) return c + d;g || (g = e * .3 * 1.5);if (h < Math.abs(d)) {
      h = d;var f = g / 4;
    } else var f = g / (2 * Math.PI) * Math.asin(d / h);return b < 1 ? -0.5 * h * Math.pow(2, 10 * (b -= 1)) * Math.sin((b * e - f) * 2 * Math.PI / g) + c : h * Math.pow(2, -10 * (b -= 1)) * Math.sin((b * e - f) * 2 * Math.PI / g) * .5 + d + c;
  }, easeInBack: function (a, b, c, d, e, f) {
    return f == undefined && (f = 1.70158), d * (b /= e) * b * ((f + 1) * b - f) + c;
  }, easeOutBack: function (a, b, c, d, e, f) {
    return f == undefined && (f = 1.70158), d * ((b = b / e - 1) * b * ((f + 1) * b + f) + 1) + c;
  }, easeInOutBack: function (a, b, c, d, e, f) {
    return f == undefined && (f = 1.70158), (b /= e / 2) < 1 ? d / 2 * b * b * (((f *= 1.525) + 1) * b - f) + c : d / 2 * ((b -= 2) * b * (((f *= 1.525) + 1) * b + f) + 2) + c;
  }, easeInBounce: function (a, b, c, d, e) {
    return d - jQuery.easing.easeOutBounce(a, e - b, 0, d, e) + c;
  }, easeOutBounce: function (a, b, c, d, e) {
    return (b /= e) < 1 / 2.75 ? d * 7.5625 * b * b + c : b < 2 / 2.75 ? d * (7.5625 * (b -= 1.5 / 2.75) * b + .75) + c : b < 2.5 / 2.75 ? d * (7.5625 * (b -= 2.25 / 2.75) * b + .9375) + c : d * (7.5625 * (b -= 2.625 / 2.75) * b + .984375) + c;
  }, easeInOutBounce: function (a, b, c, d, e) {
    return b < e / 2 ? jQuery.easing.easeInBounce(a, b * 2, 0, d, e) * .5 + c : jQuery.easing.easeOutBounce(a, b * 2 - e, 0, d, e) * .5 + d * .5 + c;
  } });

/*!
 * jQuery Transit - CSS3 transitions and transformations
 * (c) 2011-2012 Rico Sta. Cruz <rico@ricostacruz.com>
 * MIT Licensed.
 *
 * http://ricostacruz.com/jquery.transit
 * http://github.com/rstacruz/jquery.transit
 */
(function (k) {
  k.transit = { version: "0.9.9", propertyMap: { marginLeft: "margin", marginRight: "margin", marginBottom: "margin", marginTop: "margin", paddingLeft: "padding", paddingRight: "padding", paddingBottom: "padding", paddingTop: "padding" }, enabled: true, useTransitionEnd: false };var d = document.createElement("div");var q = {};function b(v) {
    if (v in d.style) {
      return v;
    }var u = ["Moz", "Webkit", "O", "ms"];var r = v.charAt(0).toUpperCase() + v.substr(1);if (v in d.style) {
      return v;
    }for (var t = 0; t < u.length; ++t) {
      var s = u[t] + r;if (s in d.style) {
        return s;
      }
    }
  }function e() {
    d.style[q.transform] = "";d.style[q.transform] = "rotateY(90deg)";return d.style[q.transform] !== "";
  }var a = navigator.userAgent.toLowerCase().indexOf("chrome") > -1;q.transition = b("transition");q.transitionDelay = b("transitionDelay");q.transform = b("transform");q.transformOrigin = b("transformOrigin");q.transform3d = e();var i = { transition: "transitionEnd", MozTransition: "transitionend", OTransition: "oTransitionEnd", WebkitTransition: "webkitTransitionEnd", msTransition: "MSTransitionEnd" };var f = q.transitionEnd = i[q.transition] || null;for (var p in q) {
    if (q.hasOwnProperty(p) && typeof k.support[p] === "undefined") {
      k.support[p] = q[p];
    }
  }d = null;k.cssEase = { _default: "ease", "in": "ease-in", out: "ease-out", "in-out": "ease-in-out", snap: "cubic-bezier(0,1,.5,1)", easeOutCubic: "cubic-bezier(.215,.61,.355,1)", easeInOutCubic: "cubic-bezier(.645,.045,.355,1)", easeInCirc: "cubic-bezier(.6,.04,.98,.335)", easeOutCirc: "cubic-bezier(.075,.82,.165,1)", easeInOutCirc: "cubic-bezier(.785,.135,.15,.86)", easeInExpo: "cubic-bezier(.95,.05,.795,.035)", easeOutExpo: "cubic-bezier(.19,1,.22,1)", easeInOutExpo: "cubic-bezier(1,0,0,1)", easeInQuad: "cubic-bezier(.55,.085,.68,.53)", easeOutQuad: "cubic-bezier(.25,.46,.45,.94)", easeInOutQuad: "cubic-bezier(.455,.03,.515,.955)", easeInQuart: "cubic-bezier(.895,.03,.685,.22)", easeOutQuart: "cubic-bezier(.165,.84,.44,1)", easeInOutQuart: "cubic-bezier(.77,0,.175,1)", easeInQuint: "cubic-bezier(.755,.05,.855,.06)", easeOutQuint: "cubic-bezier(.23,1,.32,1)", easeInOutQuint: "cubic-bezier(.86,0,.07,1)", easeInSine: "cubic-bezier(.47,0,.745,.715)", easeOutSine: "cubic-bezier(.39,.575,.565,1)", easeInOutSine: "cubic-bezier(.445,.05,.55,.95)", easeInBack: "cubic-bezier(.6,-.28,.735,.045)", easeOutBack: "cubic-bezier(.175, .885,.32,1.275)", easeInOutBack: "cubic-bezier(.68,-.55,.265,1.55)" };k.cssHooks["transit:transform"] = { get: function (r) {
      return k(r).data("transform") || new j();
    }, set: function (s, r) {
      var t = r;if (!(t instanceof j)) {
        t = new j(t);
      }if (q.transform === "WebkitTransform" && !a) {
        s.style[q.transform] = t.toString(true);
      } else {
        s.style[q.transform] = t.toString();
      }k(s).data("transform", t);
    } };k.cssHooks.transform = { set: k.cssHooks["transit:transform"].set };if (k.fn.jquery < "1.8") {
    k.cssHooks.transformOrigin = { get: function (r) {
        return r.style[q.transformOrigin];
      }, set: function (r, s) {
        r.style[q.transformOrigin] = s;
      } };k.cssHooks.transition = { get: function (r) {
        return r.style[q.transition];
      }, set: function (r, s) {
        r.style[q.transition] = s;
      } };
  }n("scale");n("translate");n("rotate");n("rotateX");n("rotateY");n("rotate3d");n("perspective");n("skewX");n("skewY");n("x", true);n("y", true);function j(r) {
    if (typeof r === "string") {
      this.parse(r);
    }return this;
  }j.prototype = { setFromString: function (t, s) {
      var r = typeof s === "string" ? s.split(",") : s.constructor === Array ? s : [s];r.unshift(t);j.prototype.set.apply(this, r);
    }, set: function (s) {
      var r = Array.prototype.slice.apply(arguments, [1]);if (this.setter[s]) {
        this.setter[s].apply(this, r);
      } else {
        this[s] = r.join(",");
      }
    }, get: function (r) {
      if (this.getter[r]) {
        return this.getter[r].apply(this);
      } else {
        return this[r] || 0;
      }
    }, setter: { rotate: function (r) {
        this.rotate = o(r, "deg");
      }, rotateX: function (r) {
        this.rotateX = o(r, "deg");
      }, rotateY: function (r) {
        this.rotateY = o(r, "deg");
      }, scale: function (r, s) {
        if (s === undefined) {
          s = r;
        }this.scale = r + "," + s;
      }, skewX: function (r) {
        this.skewX = o(r, "deg");
      }, skewY: function (r) {
        this.skewY = o(r, "deg");
      }, perspective: function (r) {
        this.perspective = o(r, "px");
      }, x: function (r) {
        this.set("translate", r, null);
      }, y: function (r) {
        this.set("translate", null, r);
      }, translate: function (r, s) {
        if (this._translateX === undefined) {
          this._translateX = 0;
        }if (this._translateY === undefined) {
          this._translateY = 0;
        }if (r !== null && r !== undefined) {
          this._translateX = o(r, "px");
        }if (s !== null && s !== undefined) {
          this._translateY = o(s, "px");
        }this.translate = this._translateX + "," + this._translateY;
      } }, getter: { x: function () {
        return this._translateX || 0;
      }, y: function () {
        return this._translateY || 0;
      }, scale: function () {
        var r = (this.scale || "1,1").split(",");if (r[0]) {
          r[0] = parseFloat(r[0]);
        }if (r[1]) {
          r[1] = parseFloat(r[1]);
        }return r[0] === r[1] ? r[0] : r;
      }, rotate3d: function () {
        var t = (this.rotate3d || "0,0,0,0deg").split(",");for (var r = 0; r <= 3; ++r) {
          if (t[r]) {
            t[r] = parseFloat(t[r]);
          }
        }if (t[3]) {
          t[3] = o(t[3], "deg");
        }return t;
      } }, parse: function (s) {
      var r = this;s.replace(/([a-zA-Z0-9]+)\((.*?)\)/g, function (t, v, u) {
        r.setFromString(v, u);
      });
    }, toString: function (t) {
      var s = [];for (var r in this) {
        if (this.hasOwnProperty(r)) {
          if (!q.transform3d && (r === "rotateX" || r === "rotateY" || r === "perspective" || r === "transformOrigin")) {
            continue;
          }if (r[0] !== "_") {
            if (t && r === "scale") {
              s.push(r + "3d(" + this[r] + ",1)");
            } else {
              if (t && r === "translate") {
                s.push(r + "3d(" + this[r] + ",0)");
              } else {
                s.push(r + "(" + this[r] + ")");
              }
            }
          }
        }
      }return s.join(" ");
    } };function m(s, r, t) {
    if (r === true) {
      s.queue(t);
    } else {
      if (r) {
        s.queue(r, t);
      } else {
        t();
      }
    }
  }function h(s) {
    var r = [];k.each(s, function (t) {
      t = k.camelCase(t);t = k.transit.propertyMap[t] || k.cssProps[t] || t;t = c(t);if (k.inArray(t, r) === -1) {
        r.push(t);
      }
    });return r;
  }function g(s, v, x, r) {
    var t = h(s);if (k.cssEase[x]) {
      x = k.cssEase[x];
    }var w = "" + l(v) + " " + x;if (parseInt(r, 10) > 0) {
      w += " " + l(r);
    }var u = [];k.each(t, function (z, y) {
      u.push(y + " " + w);
    });return u.join(", ");
  }k.fn.transition = k.fn.transit = function (z, s, y, C) {
    var D = this;var u = 0;var w = true;if (typeof s === "function") {
      C = s;s = undefined;
    }if (typeof y === "function") {
      C = y;y = undefined;
    }if (typeof z.easing !== "undefined") {
      y = z.easing;delete z.easing;
    }if (typeof z.duration !== "undefined") {
      s = z.duration;delete z.duration;
    }if (typeof z.complete !== "undefined") {
      C = z.complete;delete z.complete;
    }if (typeof z.queue !== "undefined") {
      w = z.queue;delete z.queue;
    }if (typeof z.delay !== "undefined") {
      u = z.delay;delete z.delay;
    }if (typeof s === "undefined") {
      s = k.fx.speeds._default;
    }if (typeof y === "undefined") {
      y = k.cssEase._default;
    }s = l(s);var E = g(z, s, y, u);var B = k.transit.enabled && q.transition;var t = B ? parseInt(s, 10) + parseInt(u, 10) : 0;if (t === 0) {
      var A = function (F) {
        D.css(z);if (C) {
          C.apply(D);
        }if (F) {
          F();
        }
      };m(D, w, A);return D;
    }var x = {};var r = function (H) {
      var G = false;var F = function () {
        if (G) {
          D.unbind(f, F);
        }if (t > 0) {
          D.each(function () {
            this.style[q.transition] = x[this] || null;
          });
        }if (typeof C === "function") {
          C.apply(D);
        }if (typeof H === "function") {
          H();
        }
      };if (t > 0 && f && k.transit.useTransitionEnd) {
        G = true;D.bind(f, F);
      } else {
        window.setTimeout(F, t);
      }D.each(function () {
        if (t > 0) {
          this.style[q.transition] = E;
        }k(this).css(z);
      });
    };var v = function (F) {
      this.offsetWidth;r(F);
    };m(D, w, v);return this;
  };function n(s, r) {
    if (!r) {
      k.cssNumber[s] = true;
    }k.transit.propertyMap[s] = q.transform;k.cssHooks[s] = { get: function (v) {
        var u = k(v).css("transit:transform");return u.get(s);
      }, set: function (v, w) {
        var u = k(v).css("transit:transform");u.setFromString(s, w);k(v).css({ "transit:transform": u });
      } };
  }function c(r) {
    return r.replace(/([A-Z])/g, function (s) {
      return "-" + s.toLowerCase();
    });
  }function o(s, r) {
    if (typeof s === "string" && !s.match(/^[\-0-9\.]+$/)) {
      return s;
    } else {
      return "" + s + r;
    }
  }function l(s) {
    var r = s;if (k.fx.speeds[r]) {
      r = k.fx.speeds[r];
    }return o(r, "ms");
  }k.transit.getTransitionValue = g;
})(jQuery);

/**
 * Flatten height same as the highest element for each row.
 *
 * Copyright (c) 2011 Hayato Takenaka
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 * @author: Hayato Takenaka (http://urin.take-uma.net)
 * @version: 0.0.2
**/
;(function ($) {
  $.fn.tile = function (columns) {
    var tiles,
        max,
        c,
        h,
        last = this.length - 1,
        s;
    if (!columns) columns = this.length;
    this.each(function () {
      s = this.style;
      if (s.removeProperty) s.removeProperty("height");
      if (s.removeAttribute) s.removeAttribute("height");
    });
    return this.each(function (i) {
      c = i % columns;
      if (c == 0) tiles = [];
      tiles[c] = $(this);
      h = tiles[c].height();
      if (c == 0 || h > max) max = h;
      if (i == last || c == columns - 1) $.each(tiles, function () {
        this.height(max);
      });
    });
  };
})(jQuery);

/*
 * jQuery throttle / debounce - v1.1 - 3/7/2010
 * http://benalman.com/projects/jquery-throttle-debounce-plugin/
 *
 * Copyright (c) 2010 "Cowboy" Ben Alman
 * Dual licensed under the MIT and GPL licenses.
 * http://benalman.com/about/license/
 */
(function (b, c) {
  var $ = b.jQuery || b.Cowboy || (b.Cowboy = {}),
      a;$.throttle = a = function (e, f, j, i) {
    var h,
        d = 0;if (typeof f !== "boolean") {
      i = j;j = f;f = c;
    }function g() {
      var o = this,
          m = +new Date() - d,
          n = arguments;function l() {
        d = +new Date();j.apply(o, n);
      }function k() {
        h = c;
      }if (i && !h) {
        l();
      }h && clearTimeout(h);if (i === c && m > e) {
        l();
      } else {
        if (f !== true) {
          h = setTimeout(i ? k : l, i === c ? e - m : e);
        }
      }
    }if ($.guid) {
      g.guid = j.guid = j.guid || $.guid++;
    }return g;
  };$.debounce = function (d, e, f) {
    return f === c ? a(d, e, false) : a(d, f, e !== false);
  };
})(this);
;"use strict";

/* jshint ignore:start */

/*!
 * A lightweight, dependency-free and responsive javascript plugin for particle backgrounds.
 *
 * @author Marc Bruederlin <hello@marcbruederlin.com>
 * @version 2.0.2
 * @license MIT
 * @see https://github.com/marcbruederlin/particles.js
 */
var Particles = function (t, e) {
  "use strict";
  var o,
      i = {};return o = function () {
    function t() {
      var t = this;t.defaults = { responsive: null, selector: null, maxParticles: 100, sizeVariations: 3, speed: .5, color: "#000000", minDistance: 120, connectParticles: !1 }, t.element = null, t.context = null, t.ratio = null, t.breakpoints = [], t.activeBreakpoint = null, t.breakpointSettings = [], t.originalSettings = null, t.storage = [];
    }return t;
  }(), o.prototype.init = function (t) {
    var e = this;e.options = e._extend(e.defaults, t), e.options.color = t.color ? e._hex2rgb(t.color) : e._hex2rgb(e.defaults.color), e.originalSettings = JSON.parse(JSON.stringify(e.options)), e._initializeCanvas(), e._initializeEvents(), e._registerBreakpoints(), e._checkResponsive(), e._initializeStorage(), e._animate();
  }, o.prototype._initializeCanvas = function () {
    var o,
        i,
        n = this;return n.options.selector ? (n.element = e.querySelector(n.options.selector), n.context = n.element.getContext("2d"), o = t.devicePixelRatio || 1, i = n.context.webkitBackingStorePixelRatio || n.context.mozBackingStorePixelRatio || n.context.msBackingStorePixelRatio || n.context.oBackingStorePixelRatio || n.context.backingStorePixelRatio || 1, n.ratio = o / i, n.element.width = t.innerWidth * n.ratio, n.element.height = t.innerHeight * n.ratio, n.element.style.width = "100%", n.element.style.height = "100%", void n.context.scale(n.ratio, n.ratio)) : (console.warn("particles.js: No selector specified! Check https://github.com/marcbruederlin/particles.js#options"), !1);
  }, o.prototype._initializeEvents = function () {
    var e = this;t.addEventListener("resize", e._resize.bind(e), !1);
  }, o.prototype._initializeStorage = function () {
    var t = this;t.storage = [];for (var e = t.options.maxParticles; e--;) {
      t.storage.push(new i(t.context, t.options));
    }
  }, o.prototype._registerBreakpoints = function () {
    var t,
        e,
        o,
        i = this,
        n = i.options.responsive || null;if ("object" == typeof n && null !== n && n.length) {
      for (t in n) {
        if (o = i.breakpoints.length - 1, e = n[t].breakpoint, n.hasOwnProperty(t)) {
          for (n[t].options.color && (n[t].options.color = i._hex2rgb(n[t].options.color)); o >= 0;) {
            i.breakpoints[o] && i.breakpoints[o] === e && i.breakpoints.splice(o, 1), o--;
          }i.breakpoints.push(e), i.breakpointSettings[e] = n[t].options;
        }
      }i.breakpoints.sort(function (t, e) {
        return e - t;
      });
    }
  }, o.prototype._checkResponsive = function () {
    var e,
        o = this,
        i = !1,
        n = t.innerWidth;if (o.options.responsive && o.options.responsive.length && null !== o.options.responsive) {
      i = null;for (e in o.breakpoints) {
        o.breakpoints.hasOwnProperty(e) && n <= o.breakpoints[e] && (i = o.breakpoints[e]);
      }null !== i ? (o.activeBreakpoint = i, o.options = o._extend(o.options, o.breakpointSettings[i])) : null !== o.activeBreakpoint && (o.activeBreakpoint = null, i = null, o.options = o._extend(o.options, o.originalSettings));
    }
  }, o.prototype._refresh = function () {
    var t = this;t._initializeStorage(), t._update();
  }, o.prototype._resize = function () {
    var e = this;e.element.width = t.innerWidth * e.ratio, e.element.height = t.innerHeight * e.ratio, e.context.scale(e.ratio, e.ratio), clearTimeout(e.windowDelay), e.windowDelay = t.setTimeout(function () {
      e._checkResponsive(), e._refresh();
    }, 50);
  }, o.prototype._animate = function () {
    var e = this;e._draw(), t.requestAnimFrame(e._animate.bind(e));
  }, o.prototype._draw = function () {
    var t = this;t.context.clearRect(0, 0, t.element.width, t.element.height);for (var e = t.storage.length; e--;) {
      var o = t.storage[e];o._draw();
    }t._update();
  }, o.prototype._update = function () {
    for (var e = this, o = e.storage.length; o--;) {
      var i = e.storage[o];if (i.x += i.vx, i.y += i.vy, i.x + i.radius > t.innerWidth ? i.x = i.radius : i.x - i.radius < 0 && (i.x = t.innerWidth - i.radius), i.y + i.radius > t.innerHeight ? i.y = i.radius : i.y - i.radius < 0 && (i.y = t.innerHeight - i.radius), e.options.connectParticles) for (var n = o + 1; n < e.storage.length; n++) {
        var r = e.storage[n];e._calculateDistance(i, r);
      }
    }
  }, o.prototype._calculateDistance = function (t, e) {
    var o,
        i = this,
        n = t.x - e.x,
        r = t.y - e.y;o = Math.sqrt(n * n + r * r), o <= i.options.minDistance && (i.context.beginPath(), i.context.strokeStyle = "rgba(" + i.options.color.r + ", " + i.options.color.g + ", " + i.options.color.b + ", " + (1.2 - o / i.options.minDistance) + ")", i.context.moveTo(t.x, t.y), i.context.lineTo(e.x, e.y), i.context.stroke(), i.context.closePath());
  }, o.prototype._extend = function (t, e) {
    return Object.keys(e).forEach(function (o) {
      t[o] = e[o];
    }), t;
  }, o.prototype._hex2rgb = function (t) {
    var e = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(t);return e ? { r: parseInt(e[1], 16), g: parseInt(e[2], 16), b: parseInt(e[3], 16) } : null;
  }, i = function (e, o) {
    var i = this;i.context = e, i.options = o, i.x = Math.random() * t.innerWidth, i.y = Math.random() * t.innerHeight, i.vx = Math.random() * i.options.speed * 2 - i.options.speed, i.vy = Math.random() * i.options.speed * 2 - i.options.speed, i.radius = Math.random() * Math.random() * i.options.sizeVariations, i._draw();
  }, i.prototype._draw = function () {
    var t = this;t.context.fillStyle = "rgb(" + t.options.color.r + ", " + t.options.color.g + ", " + t.options.color.b + ")", t.context.beginPath(), t.context.arc(t.x, t.y, t.radius, 0, 2 * Math.PI, !1), t.context.fill();
  }, t.requestAnimFrame = function () {
    return t.requestAnimationFrame || t.webkitRequestAnimationFrame || t.mozRequestAnimationFrame || function (e) {
      t.setTimeout(e, 1e3 / 60);
    };
  }(), new o();
}(window, document);!function () {
  "use strict";
  "function" == typeof define && define.amd ? define("Particles", function () {
    return Particles;
  }) : "undefined" != typeof module && module.exports ? module.exports = Particles : window.Particles = Particles;
}();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZvdW5kYXRpb24uY29yZS5qcyIsImZvdW5kYXRpb24udXRpbC5ib3guanMiLCJmb3VuZGF0aW9uLnV0aWwua2V5Ym9hcmQuanMiLCJmb3VuZGF0aW9uLnV0aWwubWVkaWFRdWVyeS5qcyIsImZvdW5kYXRpb24udXRpbC5tb3Rpb24uanMiLCJmb3VuZGF0aW9uLnV0aWwubmVzdC5qcyIsImZvdW5kYXRpb24udXRpbC50aW1lckFuZEltYWdlTG9hZGVyLmpzIiwiZm91bmRhdGlvbi51dGlsLnRvdWNoLmpzIiwiZm91bmRhdGlvbi51dGlsLnRyaWdnZXJzLmpzIiwiZm91bmRhdGlvbi5hYmlkZS5qcyIsImZvdW5kYXRpb24uYWNjb3JkaW9uLmpzIiwiZm91bmRhdGlvbi5hY2NvcmRpb25NZW51LmpzIiwiZm91bmRhdGlvbi5kcmlsbGRvd24uanMiLCJmb3VuZGF0aW9uLmVxdWFsaXplci5qcyIsImZvdW5kYXRpb24uaW50ZXJjaGFuZ2UuanMiLCJmb3VuZGF0aW9uLm1hZ2VsbGFuLmpzIiwiZm91bmRhdGlvbi5vZmZjYW52YXMuanMiLCJmb3VuZGF0aW9uLnJlc3BvbnNpdmVNZW51LmpzIiwiZm91bmRhdGlvbi5yZXNwb25zaXZlVG9nZ2xlLmpzIiwiZm91bmRhdGlvbi5yZXZlYWwuanMiLCJmb3VuZGF0aW9uLnRvZ2dsZXIuanMiLCJmb3VuZGF0aW9uLnRvb2x0aXAuanMiLCJtb3Rpb24tdWkuanMiLCJqcXVlcnkuZmlsdGVyaXpyLm1pbi5qcyIsImZlYXRoZXJsaWdodC5taW4uanMiLCJpbml0LWZvdW5kYXRpb24uanMiLCJqcXVlcnlsaWJzLm1pbi5qcyIsInBhcnRpY2xlcy5taW4uanMiXSwibmFtZXMiOlsiJCIsIkZPVU5EQVRJT05fVkVSU0lPTiIsIkZvdW5kYXRpb24iLCJ2ZXJzaW9uIiwiX3BsdWdpbnMiLCJfdXVpZHMiLCJydGwiLCJhdHRyIiwicGx1Z2luIiwibmFtZSIsImNsYXNzTmFtZSIsImZ1bmN0aW9uTmFtZSIsImF0dHJOYW1lIiwiaHlwaGVuYXRlIiwicmVnaXN0ZXJQbHVnaW4iLCJwbHVnaW5OYW1lIiwiY29uc3RydWN0b3IiLCJ0b0xvd2VyQ2FzZSIsInV1aWQiLCJHZXRZb0RpZ2l0cyIsIiRlbGVtZW50IiwiZGF0YSIsInRyaWdnZXIiLCJwdXNoIiwidW5yZWdpc3RlclBsdWdpbiIsInNwbGljZSIsImluZGV4T2YiLCJyZW1vdmVBdHRyIiwicmVtb3ZlRGF0YSIsInByb3AiLCJyZUluaXQiLCJwbHVnaW5zIiwiaXNKUSIsImVhY2giLCJfaW5pdCIsInR5cGUiLCJfdGhpcyIsImZucyIsInBsZ3MiLCJmb3JFYWNoIiwicCIsImZvdW5kYXRpb24iLCJPYmplY3QiLCJrZXlzIiwiZXJyIiwiY29uc29sZSIsImVycm9yIiwibGVuZ3RoIiwibmFtZXNwYWNlIiwiTWF0aCIsInJvdW5kIiwicG93IiwicmFuZG9tIiwidG9TdHJpbmciLCJzbGljZSIsInJlZmxvdyIsImVsZW0iLCJpIiwiJGVsZW0iLCJmaW5kIiwiYWRkQmFjayIsIiRlbCIsIm9wdHMiLCJ3YXJuIiwidGhpbmciLCJzcGxpdCIsImUiLCJvcHQiLCJtYXAiLCJlbCIsInRyaW0iLCJwYXJzZVZhbHVlIiwiZXIiLCJnZXRGbk5hbWUiLCJ0cmFuc2l0aW9uZW5kIiwidHJhbnNpdGlvbnMiLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnQiLCJlbmQiLCJ0Iiwic3R5bGUiLCJzZXRUaW1lb3V0IiwidHJpZ2dlckhhbmRsZXIiLCJ1dGlsIiwidGhyb3R0bGUiLCJmdW5jIiwiZGVsYXkiLCJ0aW1lciIsImNvbnRleHQiLCJhcmdzIiwiYXJndW1lbnRzIiwiYXBwbHkiLCJtZXRob2QiLCIkbWV0YSIsIiRub0pTIiwiYXBwZW5kVG8iLCJoZWFkIiwicmVtb3ZlQ2xhc3MiLCJNZWRpYVF1ZXJ5IiwiQXJyYXkiLCJwcm90b3R5cGUiLCJjYWxsIiwicGx1Z0NsYXNzIiwidW5kZWZpbmVkIiwiUmVmZXJlbmNlRXJyb3IiLCJUeXBlRXJyb3IiLCJ3aW5kb3ciLCJmbiIsIkRhdGUiLCJub3ciLCJnZXRUaW1lIiwidmVuZG9ycyIsInJlcXVlc3RBbmltYXRpb25GcmFtZSIsInZwIiwiY2FuY2VsQW5pbWF0aW9uRnJhbWUiLCJ0ZXN0IiwibmF2aWdhdG9yIiwidXNlckFnZW50IiwibGFzdFRpbWUiLCJjYWxsYmFjayIsIm5leHRUaW1lIiwibWF4IiwiY2xlYXJUaW1lb3V0IiwicGVyZm9ybWFuY2UiLCJzdGFydCIsIkZ1bmN0aW9uIiwiYmluZCIsIm9UaGlzIiwiYUFyZ3MiLCJmVG9CaW5kIiwiZk5PUCIsImZCb3VuZCIsImNvbmNhdCIsImZ1bmNOYW1lUmVnZXgiLCJyZXN1bHRzIiwiZXhlYyIsInN0ciIsImlzTmFOIiwicGFyc2VGbG9hdCIsInJlcGxhY2UiLCJqUXVlcnkiLCJCb3giLCJJbU5vdFRvdWNoaW5nWW91IiwiR2V0RGltZW5zaW9ucyIsIkdldE9mZnNldHMiLCJlbGVtZW50IiwicGFyZW50IiwibHJPbmx5IiwidGJPbmx5IiwiZWxlRGltcyIsInRvcCIsImJvdHRvbSIsImxlZnQiLCJyaWdodCIsInBhckRpbXMiLCJvZmZzZXQiLCJoZWlnaHQiLCJ3aWR0aCIsIndpbmRvd0RpbXMiLCJhbGxEaXJzIiwiRXJyb3IiLCJyZWN0IiwiZ2V0Qm91bmRpbmdDbGllbnRSZWN0IiwicGFyUmVjdCIsInBhcmVudE5vZGUiLCJ3aW5SZWN0IiwiYm9keSIsIndpblkiLCJwYWdlWU9mZnNldCIsIndpblgiLCJwYWdlWE9mZnNldCIsInBhcmVudERpbXMiLCJhbmNob3IiLCJwb3NpdGlvbiIsInZPZmZzZXQiLCJoT2Zmc2V0IiwiaXNPdmVyZmxvdyIsIiRlbGVEaW1zIiwiJGFuY2hvckRpbXMiLCJrZXlDb2RlcyIsImNvbW1hbmRzIiwiS2V5Ym9hcmQiLCJnZXRLZXlDb2RlcyIsInBhcnNlS2V5IiwiZXZlbnQiLCJrZXkiLCJ3aGljaCIsImtleUNvZGUiLCJTdHJpbmciLCJmcm9tQ2hhckNvZGUiLCJ0b1VwcGVyQ2FzZSIsInNoaWZ0S2V5IiwiY3RybEtleSIsImFsdEtleSIsImhhbmRsZUtleSIsImNvbXBvbmVudCIsImZ1bmN0aW9ucyIsImNvbW1hbmRMaXN0IiwiY21kcyIsImNvbW1hbmQiLCJsdHIiLCJleHRlbmQiLCJyZXR1cm5WYWx1ZSIsImhhbmRsZWQiLCJ1bmhhbmRsZWQiLCJmaW5kRm9jdXNhYmxlIiwiZmlsdGVyIiwiaXMiLCJyZWdpc3RlciIsImNvbXBvbmVudE5hbWUiLCJ0cmFwRm9jdXMiLCIkZm9jdXNhYmxlIiwiJGZpcnN0Rm9jdXNhYmxlIiwiZXEiLCIkbGFzdEZvY3VzYWJsZSIsIm9uIiwidGFyZ2V0IiwicHJldmVudERlZmF1bHQiLCJmb2N1cyIsInJlbGVhc2VGb2N1cyIsIm9mZiIsImtjcyIsImsiLCJrYyIsImRlZmF1bHRRdWVyaWVzIiwibGFuZHNjYXBlIiwicG9ydHJhaXQiLCJyZXRpbmEiLCJxdWVyaWVzIiwiY3VycmVudCIsInNlbGYiLCJleHRyYWN0ZWRTdHlsZXMiLCJjc3MiLCJuYW1lZFF1ZXJpZXMiLCJwYXJzZVN0eWxlVG9PYmplY3QiLCJoYXNPd25Qcm9wZXJ0eSIsInZhbHVlIiwiX2dldEN1cnJlbnRTaXplIiwiX3dhdGNoZXIiLCJhdExlYXN0Iiwic2l6ZSIsInF1ZXJ5IiwiZ2V0IiwibWF0Y2hNZWRpYSIsIm1hdGNoZXMiLCJtYXRjaGVkIiwibmV3U2l6ZSIsImN1cnJlbnRTaXplIiwic3R5bGVNZWRpYSIsIm1lZGlhIiwic2NyaXB0IiwiZ2V0RWxlbWVudHNCeVRhZ05hbWUiLCJpbmZvIiwiaWQiLCJpbnNlcnRCZWZvcmUiLCJnZXRDb21wdXRlZFN0eWxlIiwiY3VycmVudFN0eWxlIiwibWF0Y2hNZWRpdW0iLCJ0ZXh0Iiwic3R5bGVTaGVldCIsImNzc1RleHQiLCJ0ZXh0Q29udGVudCIsInN0eWxlT2JqZWN0IiwicmVkdWNlIiwicmV0IiwicGFyYW0iLCJwYXJ0cyIsInZhbCIsImRlY29kZVVSSUNvbXBvbmVudCIsImlzQXJyYXkiLCJpbml0Q2xhc3NlcyIsImFjdGl2ZUNsYXNzZXMiLCJNb3Rpb24iLCJhbmltYXRlSW4iLCJhbmltYXRpb24iLCJjYiIsImFuaW1hdGUiLCJhbmltYXRlT3V0IiwiTW92ZSIsImR1cmF0aW9uIiwiYW5pbSIsInByb2ciLCJtb3ZlIiwidHMiLCJpc0luIiwiaW5pdENsYXNzIiwiYWN0aXZlQ2xhc3MiLCJyZXNldCIsImFkZENsYXNzIiwic2hvdyIsIm9mZnNldFdpZHRoIiwib25lIiwiZmluaXNoIiwiaGlkZSIsInRyYW5zaXRpb25EdXJhdGlvbiIsIk5lc3QiLCJGZWF0aGVyIiwibWVudSIsIml0ZW1zIiwic3ViTWVudUNsYXNzIiwic3ViSXRlbUNsYXNzIiwiaGFzU3ViQ2xhc3MiLCIkaXRlbSIsIiRzdWIiLCJjaGlsZHJlbiIsIkJ1cm4iLCJUaW1lciIsIm9wdGlvbnMiLCJuYW1lU3BhY2UiLCJyZW1haW4iLCJpc1BhdXNlZCIsInJlc3RhcnQiLCJpbmZpbml0ZSIsInBhdXNlIiwib25JbWFnZXNMb2FkZWQiLCJpbWFnZXMiLCJ1bmxvYWRlZCIsImNvbXBsZXRlIiwicmVhZHlTdGF0ZSIsInNpbmdsZUltYWdlTG9hZGVkIiwic3JjIiwic3BvdFN3aXBlIiwiZW5hYmxlZCIsImRvY3VtZW50RWxlbWVudCIsIm1vdmVUaHJlc2hvbGQiLCJ0aW1lVGhyZXNob2xkIiwic3RhcnRQb3NYIiwic3RhcnRQb3NZIiwic3RhcnRUaW1lIiwiZWxhcHNlZFRpbWUiLCJpc01vdmluZyIsIm9uVG91Y2hFbmQiLCJyZW1vdmVFdmVudExpc3RlbmVyIiwib25Ub3VjaE1vdmUiLCJ4IiwidG91Y2hlcyIsInBhZ2VYIiwieSIsInBhZ2VZIiwiZHgiLCJkeSIsImRpciIsImFicyIsIm9uVG91Y2hTdGFydCIsImFkZEV2ZW50TGlzdGVuZXIiLCJpbml0IiwidGVhcmRvd24iLCJzcGVjaWFsIiwic3dpcGUiLCJzZXR1cCIsIm5vb3AiLCJhZGRUb3VjaCIsImhhbmRsZVRvdWNoIiwiY2hhbmdlZFRvdWNoZXMiLCJmaXJzdCIsImV2ZW50VHlwZXMiLCJ0b3VjaHN0YXJ0IiwidG91Y2htb3ZlIiwidG91Y2hlbmQiLCJzaW11bGF0ZWRFdmVudCIsIk1vdXNlRXZlbnQiLCJzY3JlZW5YIiwic2NyZWVuWSIsImNsaWVudFgiLCJjbGllbnRZIiwiY3JlYXRlRXZlbnQiLCJpbml0TW91c2VFdmVudCIsImRpc3BhdGNoRXZlbnQiLCJNdXRhdGlvbk9ic2VydmVyIiwicHJlZml4ZXMiLCJ0cmlnZ2VycyIsInN0b3BQcm9wYWdhdGlvbiIsImZhZGVPdXQiLCJjaGVja0xpc3RlbmVycyIsImV2ZW50c0xpc3RlbmVyIiwicmVzaXplTGlzdGVuZXIiLCJzY3JvbGxMaXN0ZW5lciIsImNsb3NlbWVMaXN0ZW5lciIsInlldGlCb3hlcyIsInBsdWdOYW1lcyIsImxpc3RlbmVycyIsImpvaW4iLCJwbHVnaW5JZCIsIm5vdCIsImRlYm91bmNlIiwiJG5vZGVzIiwibm9kZXMiLCJxdWVyeVNlbGVjdG9yQWxsIiwibGlzdGVuaW5nRWxlbWVudHNNdXRhdGlvbiIsIm11dGF0aW9uUmVjb3Jkc0xpc3QiLCIkdGFyZ2V0IiwiYXR0cmlidXRlTmFtZSIsImNsb3Nlc3QiLCJlbGVtZW50T2JzZXJ2ZXIiLCJvYnNlcnZlIiwiYXR0cmlidXRlcyIsImNoaWxkTGlzdCIsImNoYXJhY3RlckRhdGEiLCJzdWJ0cmVlIiwiYXR0cmlidXRlRmlsdGVyIiwiSUhlYXJZb3UiLCJBYmlkZSIsImRlZmF1bHRzIiwiJGlucHV0cyIsIl9ldmVudHMiLCJyZXNldEZvcm0iLCJ2YWxpZGF0ZUZvcm0iLCJ2YWxpZGF0ZU9uIiwidmFsaWRhdGVJbnB1dCIsImxpdmVWYWxpZGF0ZSIsInZhbGlkYXRlT25CbHVyIiwiaXNHb29kIiwiY2hlY2tlZCIsIiRlcnJvciIsInNpYmxpbmdzIiwiZm9ybUVycm9yU2VsZWN0b3IiLCJhZGQiLCIkbGFiZWwiLCIkZWxzIiwibGFiZWxzIiwiZmluZExhYmVsIiwiJGZvcm1FcnJvciIsImZpbmRGb3JtRXJyb3IiLCJsYWJlbEVycm9yQ2xhc3MiLCJmb3JtRXJyb3JDbGFzcyIsImlucHV0RXJyb3JDbGFzcyIsImdyb3VwTmFtZSIsIiRsYWJlbHMiLCJmaW5kUmFkaW9MYWJlbHMiLCIkZm9ybUVycm9ycyIsInJlbW92ZVJhZGlvRXJyb3JDbGFzc2VzIiwiY2xlYXJSZXF1aXJlIiwicmVxdWlyZWRDaGVjayIsInZhbGlkYXRlZCIsImN1c3RvbVZhbGlkYXRvciIsInZhbGlkYXRvciIsImVxdWFsVG8iLCJ2YWxpZGF0ZVJhZGlvIiwidmFsaWRhdGVUZXh0IiwibWF0Y2hWYWxpZGF0aW9uIiwidmFsaWRhdG9ycyIsImdvb2RUb0dvIiwibWVzc2FnZSIsImRlcGVuZGVudEVsZW1lbnRzIiwiYWNjIiwibm9FcnJvciIsInBhdHRlcm4iLCJpbnB1dFRleHQiLCJ2YWxpZCIsInBhdHRlcm5zIiwiUmVnRXhwIiwiJGdyb3VwIiwicmVxdWlyZWQiLCJjbGVhciIsInYiLCIkZm9ybSIsInJlbW92ZUVycm9yQ2xhc3NlcyIsImFscGhhIiwiYWxwaGFfbnVtZXJpYyIsImludGVnZXIiLCJudW1iZXIiLCJjYXJkIiwiY3Z2IiwiZW1haWwiLCJ1cmwiLCJkb21haW4iLCJkYXRldGltZSIsImRhdGUiLCJ0aW1lIiwiZGF0ZUlTTyIsIm1vbnRoX2RheV95ZWFyIiwiZGF5X21vbnRoX3llYXIiLCJjb2xvciIsIkFjY29yZGlvbiIsIiR0YWJzIiwiaWR4IiwiJGNvbnRlbnQiLCJsaW5rSWQiLCIkaW5pdEFjdGl2ZSIsImZpcnN0VGltZUluaXQiLCJkb3duIiwiX2NoZWNrRGVlcExpbmsiLCJsb2NhdGlvbiIsImhhc2giLCIkbGluayIsIiRhbmNob3IiLCJoYXNDbGFzcyIsImRlZXBMaW5rU211ZGdlIiwibG9hZCIsInNjcm9sbFRvcCIsImRlZXBMaW5rU211ZGdlRGVsYXkiLCJkZWVwTGluayIsIiR0YWJDb250ZW50IiwidG9nZ2xlIiwibmV4dCIsIiRhIiwibXVsdGlFeHBhbmQiLCJwcmV2aW91cyIsInByZXYiLCJ1cCIsInVwZGF0ZUhpc3RvcnkiLCJoaXN0b3J5IiwicHVzaFN0YXRlIiwicmVwbGFjZVN0YXRlIiwiZmlyc3RUaW1lIiwiJGN1cnJlbnRBY3RpdmUiLCJzbGlkZURvd24iLCJzbGlkZVNwZWVkIiwiJGF1bnRzIiwiYWxsb3dBbGxDbG9zZWQiLCJzbGlkZVVwIiwic3RvcCIsIkFjY29yZGlvbk1lbnUiLCJtdWx0aU9wZW4iLCIkbWVudUxpbmtzIiwic3ViSWQiLCJpc0FjdGl2ZSIsImluaXRQYW5lcyIsIiRzdWJtZW51IiwiJGVsZW1lbnRzIiwiJHByZXZFbGVtZW50IiwiJG5leHRFbGVtZW50IiwibWluIiwicGFyZW50cyIsIm9wZW4iLCJjbG9zZSIsImNsb3NlQWxsIiwiaGlkZUFsbCIsInN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbiIsInBhcmVudHNVbnRpbCIsIiRtZW51cyIsIkRyaWxsZG93biIsIiRzdWJtZW51QW5jaG9ycyIsIiRzdWJtZW51cyIsIiRtZW51SXRlbXMiLCJfcHJlcGFyZU1lbnUiLCJfcmVnaXN0ZXJFdmVudHMiLCJfa2V5Ym9hcmRFdmVudHMiLCJwYXJlbnRMaW5rIiwiY2xvbmUiLCJwcmVwZW5kVG8iLCJ3cmFwIiwiJG1lbnUiLCIkYmFjayIsImJhY2tCdXR0b25Qb3NpdGlvbiIsImFwcGVuZCIsImJhY2tCdXR0b24iLCJwcmVwZW5kIiwiX2JhY2siLCJhdXRvSGVpZ2h0IiwiJHdyYXBwZXIiLCJ3cmFwcGVyIiwiYW5pbWF0ZUhlaWdodCIsIl9nZXRNYXhEaW1zIiwiX3Nob3ciLCJjbG9zZU9uQ2xpY2siLCIkYm9keSIsImNvbnRhaW5zIiwiX2hpZGVBbGwiLCJfcmVzaXplIiwiX2JpbmRIYW5kbGVyIiwiX3Njcm9sbFRvcCIsIiRzY3JvbGxUb3BFbGVtZW50Iiwic2Nyb2xsVG9wRWxlbWVudCIsInNjcm9sbFBvcyIsInBhcnNlSW50Iiwic2Nyb2xsVG9wT2Zmc2V0IiwiYW5pbWF0aW9uRHVyYXRpb24iLCJhbmltYXRpb25FYXNpbmciLCJfaGlkZSIsInBhcmVudFN1Yk1lbnUiLCJibHVyIiwibWF4SGVpZ2h0IiwicmVzdWx0IiwibnVtT2ZFbGVtcyIsInVud3JhcCIsInJlbW92ZSIsIkVxdWFsaXplciIsImVxSWQiLCIkd2F0Y2hlZCIsImhhc05lc3RlZCIsImlzTmVzdGVkIiwiaXNPbiIsIm9uUmVzaXplTWVCb3VuZCIsIl9vblJlc2l6ZU1lIiwib25Qb3N0RXF1YWxpemVkQm91bmQiLCJfb25Qb3N0RXF1YWxpemVkIiwiaW1ncyIsInRvb1NtYWxsIiwiZXF1YWxpemVPbiIsIl9jaGVja01RIiwiX3JlZmxvdyIsIl9wYXVzZUV2ZW50cyIsImVxdWFsaXplT25TdGFjayIsIl9pc1N0YWNrZWQiLCJlcXVhbGl6ZUJ5Um93IiwiZ2V0SGVpZ2h0c0J5Um93IiwiYXBwbHlIZWlnaHRCeVJvdyIsImdldEhlaWdodHMiLCJhcHBseUhlaWdodCIsImhlaWdodHMiLCJsZW4iLCJvZmZzZXRIZWlnaHQiLCJsYXN0RWxUb3BPZmZzZXQiLCJncm91cHMiLCJncm91cCIsImVsT2Zmc2V0VG9wIiwiaiIsImxuIiwiZ3JvdXBzSUxlbmd0aCIsImxlbkoiLCJJbnRlcmNoYW5nZSIsInJ1bGVzIiwiY3VycmVudFBhdGgiLCJfYWRkQnJlYWtwb2ludHMiLCJfZ2VuZXJhdGVSdWxlcyIsIm1hdGNoIiwicnVsZSIsInBhdGgiLCJTUEVDSUFMX1FVRVJJRVMiLCJydWxlc0xpc3QiLCJub2RlTmFtZSIsInJlc3BvbnNlIiwiaHRtbCIsIk1hZ2VsbGFuIiwiY2FsY1BvaW50cyIsIiR0YXJnZXRzIiwiJGxpbmtzIiwiJGFjdGl2ZSIsInBvaW50cyIsIndpbkhlaWdodCIsImlubmVySGVpZ2h0IiwiY2xpZW50SGVpZ2h0IiwiZG9jSGVpZ2h0Iiwic2Nyb2xsSGVpZ2h0IiwiJHRhciIsInB0IiwidGhyZXNob2xkIiwidGFyZ2V0UG9pbnQiLCJlYXNpbmciLCJkZWVwTGlua2luZyIsInNjcm9sbFRvTG9jIiwiX3VwZGF0ZUFjdGl2ZSIsImFycml2YWwiLCJnZXRBdHRyaWJ1dGUiLCJsb2MiLCJfaW5UcmFuc2l0aW9uIiwiYmFyT2Zmc2V0Iiwid2luUG9zIiwiY3VySWR4IiwiaXNEb3duIiwiY3VyVmlzaWJsZSIsIk9mZkNhbnZhcyIsIiRsYXN0VHJpZ2dlciIsIiR0cmlnZ2VycyIsInRyYW5zaXRpb24iLCJjb250ZW50T3ZlcmxheSIsIm92ZXJsYXkiLCJvdmVybGF5UG9zaXRpb24iLCJzZXRBdHRyaWJ1dGUiLCIkb3ZlcmxheSIsImlzUmV2ZWFsZWQiLCJyZXZlYWxDbGFzcyIsInJldmVhbE9uIiwiX3NldE1RQ2hlY2tlciIsInRyYW5zaXRpb25UaW1lIiwiX2hhbmRsZUtleWJvYXJkIiwicmV2ZWFsIiwiJGNsb3NlciIsImFsbG93VXAiLCJhbGxvd0Rvd24iLCJsYXN0WSIsIm9yaWdpbmFsRXZlbnQiLCJmb3JjZVRvIiwic2Nyb2xsVG8iLCJjb250ZW50U2Nyb2xsIiwiX3N0b3BTY3JvbGxpbmciLCJfcmVjb3JkU2Nyb2xsYWJsZSIsIl9zdG9wU2Nyb2xsUHJvcGFnYXRpb24iLCJhdXRvRm9jdXMiLCJjYW52YXNGb2N1cyIsIlJlc3BvbnNpdmVNZW51IiwiY3VycmVudE1xIiwiY3VycmVudFBsdWdpbiIsInJ1bGVzVHJlZSIsInJ1bGVTaXplIiwicnVsZVBsdWdpbiIsIk1lbnVQbHVnaW5zIiwiaXNFbXB0eU9iamVjdCIsIl9jaGVja01lZGlhUXVlcmllcyIsIm1hdGNoZWRNcSIsImNzc0NsYXNzIiwiZGVzdHJveSIsImRyb3Bkb3duIiwiZHJpbGxkb3duIiwiYWNjb3JkaW9uIiwiUmVzcG9uc2l2ZVRvZ2dsZSIsInRhcmdldElEIiwiJHRhcmdldE1lbnUiLCIkdG9nZ2xlciIsImlucHV0IiwiYW5pbWF0aW9uSW4iLCJhbmltYXRpb25PdXQiLCJfdXBkYXRlIiwiX3VwZGF0ZU1xSGFuZGxlciIsInRvZ2dsZU1lbnUiLCJoaWRlRm9yIiwiUmV2ZWFsIiwiY2FjaGVkIiwibXEiLCJpc01vYmlsZSIsIm1vYmlsZVNuaWZmIiwiZnVsbFNjcmVlbiIsIl9tYWtlT3ZlcmxheSIsImRldGFjaCIsIm91dGVyV2lkdGgiLCJvdXRlckhlaWdodCIsIm1hcmdpbiIsIl91cGRhdGVQb3NpdGlvbiIsIl9oYW5kbGVTdGF0ZSIsIm11bHRpcGxlT3BlbmVkIiwiYWRkUmV2ZWFsT3BlbkNsYXNzZXMiLCJvcmlnaW5hbFNjcm9sbFBvcyIsImFmdGVyQW5pbWF0aW9uIiwiZm9jdXNhYmxlRWxlbWVudHMiLCJzaG93RGVsYXkiLCJfZXh0cmFIYW5kbGVycyIsImNsb3NlT25Fc2MiLCJmaW5pc2hVcCIsImhpZGVEZWxheSIsInJlc2V0T25DbG9zZSIsInRpdGxlIiwiaHJlZiIsImJ0bU9mZnNldFBjdCIsImlQaG9uZVNuaWZmIiwiYW5kcm9pZFNuaWZmIiwiVG9nZ2xlciIsInRvZ2dsZUNsYXNzIiwiX3VwZGF0ZUFSSUEiLCJUb29sdGlwIiwiaXNDbGljayIsImVsZW1JZCIsInBvc2l0aW9uQ2xhc3MiLCJfZ2V0UG9zaXRpb25DbGFzcyIsInRpcFRleHQiLCJ0ZW1wbGF0ZSIsIl9idWlsZFRlbXBsYXRlIiwiYWxsb3dIdG1sIiwidHJpZ2dlckNsYXNzIiwidXNlZFBvc2l0aW9ucyIsImNvdW50ZXIiLCJjbGFzc0NoYW5nZWQiLCJ0ZW1wbGF0ZUNsYXNzZXMiLCJ0b29sdGlwQ2xhc3MiLCIkdGVtcGxhdGUiLCIkdGlwRGltcyIsImRpcmVjdGlvbiIsIl9yZXBvc2l0aW9uIiwiX3NldFBvc2l0aW9uIiwic2hvd09uIiwiZmFkZUluIiwiZmFkZUluRHVyYXRpb24iLCJmYWRlT3V0RHVyYXRpb24iLCJpc0ZvY3VzIiwiZGlzYWJsZUhvdmVyIiwidGltZW91dCIsImhvdmVyRGVsYXkiLCJjbGlja09wZW4iLCJkaXNhYmxlRm9yVG91Y2giLCJ0b3VjaENsb3NlVGV4dCIsImVuZEV2ZW50IiwiTW90aW9uVUkiLCJyIiwicm9vdCIsInciLCJmaXQiLCJuIiwibyIsImgiLCJmaW5kTm9kZSIsInNwbGl0Tm9kZSIsImdyb3dEb3duIiwidXNlZCIsImZpbHRlcml6ciIsIl9mbHRyIiwibGFzdEluZGV4T2YiLCJjYWxsYmFja3MiLCJvbkZpbHRlcmluZ1N0YXJ0Iiwib25GaWx0ZXJpbmdFbmQiLCJvblNodWZmbGluZ1N0YXJ0Iiwib25TaHVmZmxpbmdFbmQiLCJvblNvcnRpbmdTdGFydCIsIm9uU29ydGluZ0VuZCIsImRlbGF5TW9kZSIsImZpbHRlck91dENzcyIsIm9wYWNpdHkiLCJ0cmFuc2Zvcm0iLCJmaWx0ZXJJbkNzcyIsImxheW91dCIsInNldHVwQ29udHJvbHMiLCJzZXRPcHRpb25zIiwicGFkZGluZyIsIl9sYXN0Q2F0ZWdvcnkiLCJfaXNBbmltYXRpbmciLCJfaXNTaHVmZmxpbmciLCJfaXNTb3J0aW5nIiwiX21haW5BcnJheSIsIl9nZXRGaWx0ckl0ZW1zIiwiX3N1YkFycmF5cyIsIl9tYWtlU3ViYXJyYXlzIiwiX2FjdGl2ZUFycmF5IiwiX2dldENvbGxlY3Rpb25CeUZpbHRlciIsIl90b2dnbGVkQ2F0ZWdvcmllcyIsIl90eXBlZFRleHQiLCJfdUlEIiwiX3NldHVwRXZlbnRzIiwiX3NldHVwQ29udHJvbHMiLCJfaGFuZGxlRmlsdGVyaW5nIiwiX2lzU2VhcmNoQWN0aXZhdGVkIiwic2VhcmNoIiwidG9nZ2xlRmlsdGVyIiwiX211bHRpZmlsdGVyTW9kZU9uIiwiX21ha2VNdWx0aWZpbHRlckFycmF5IiwiX2ZpbHRlck91dCIsInNodWZmbGUiLCJfZmlzaGVyWWF0ZXNTaHVmZmxlIiwiX3BsYWNlSXRlbXMiLCJzb3J0IiwiX2NvbXBhcmF0b3IiLCJfY2FsY0RlbGF5IiwiYSIsIl9jYXRlZ29yeSIsImRvbUluZGV4IiwicyIsImNsaWNrIiwia2V5dXAiLCJfZGVsYXlFdmVudCIsInJlc2l6ZSIsIl9jYWxjSXRlbVBvc2l0aW9ucyIsImwiLCJmIiwidSIsImMiLCJnIiwiXyIsIl91cGRhdGVEaW1lbnNpb25zIiwiZCIsIm0iLCJjZWlsIiwiX2dldEFycmF5T2ZVbmlxdWVJdGVtcyIsIl9pdGVtUG9zaXRpb25zIiwiX2ZpbHRlckluIiwiX21ha2VEZWVwQ29weSIsImZsb29yIiwiX3BhcmVudCIsIl9nZXRDYXRlZ29yeSIsIl9sYXN0UG9zIiwic29ydERhdGEiLCJfaXNGaWx0ZXJlZE91dCIsIl9maWx0ZXJpbmdPdXQiLCJfZmlsdGVyaW5nSW4iLCJwZXJzcGVjdGl2ZSIsIl9vblRyYW5zaXRpb25FbmQiLCJiIiwiY2hhaW5DYWxsYmFja3MiLCJfY2FsbGJhY2tDaGFpbiIsImdyZXAiLCIkaW5zdGFuY2UiLCJhbGxvd2Z1bGxzY3JlZW4iLCJmcmFtZWJvcmRlciIsImxvbmdkZXNjIiwibWFyZ2luaGVpZ2h0IiwibWFyZ2lud2lkdGgiLCJyZWZlcnJlcnBvbGljeSIsInNjcm9sbGluZyIsInNhbmRib3giLCJzcmNkb2MiLCJvcGVuZWQiLCJyZXZlcnNlIiwiaXNEZWZhdWx0UHJldmVudGVkIiwiX2dsb2JhbEhhbmRsZXJJbnN0YWxsZWQiLCJ0YXJnZXRBdHRyIiwidmFyaWFudCIsInJlc2V0Q3NzIiwiYmFja2dyb3VuZCIsIm9wZW5UcmlnZ2VyIiwiY2xvc2VUcmlnZ2VyIiwib3BlblNwZWVkIiwiY2xvc2VTcGVlZCIsImNsb3NlSWNvbiIsImxvYWRpbmciLCJwZXJzaXN0Iiwib3RoZXJDbG9zZSIsImJlZm9yZU9wZW4iLCJiZWZvcmVDb250ZW50IiwiYmVmb3JlQ2xvc2UiLCJhZnRlck9wZW4iLCJhZnRlckNvbnRlbnQiLCJhZnRlckNsb3NlIiwib25LZXlVcCIsIm9uUmVzaXplIiwiY29udGVudEZpbHRlcnMiLCJnZXRDb250ZW50IiwiJGN1cnJlbnRUYXJnZXQiLCJyZWdleCIsInByb2Nlc3MiLCJzZXRDb250ZW50IiwicmVwbGFjZVdpdGgiLCJ3aGVuIiwiYWx3YXlzIiwidGhlbiIsInByb21pc2UiLCJkb25lIiwiRGVmZXJyZWQiLCJyZWplY3QiLCJyZXNvbHZlIiwicHJveHkiLCJhdXRvQmluZCIsImpxdWVyeSIsImltYWdlIiwiSW1hZ2UiLCJvbmxvYWQiLCJuYXR1cmFsV2lkdGgiLCJuYXR1cmFsSGVpZ2h0Iiwib25lcnJvciIsImFqYXgiLCJjb250ZW50cyIsImZhaWwiLCJpZnJhbWUiLCJmdW5jdGlvbkF0dHJpYnV0ZXMiLCJyZWFkRWxlbWVudENvbmZpZyIsImNhbWVsQ2FzZSIsImluQXJyYXkiLCJKU09OIiwicGFyc2UiLCJfX3N1cGVyX18iLCJhdHRhY2giLCJjdXJyZW50VGFyZ2V0IiwiJHNvdXJjZSIsIl9vblJlYWR5IiwiZmVhdGhlcmxpZ2h0IiwiX3ByZXZpb3VzbHlBY3RpdmUiLCJhY3RpdmVFbGVtZW50IiwiXyRwcmV2aW91c2x5VGFiYmFibGUiLCJfJHByZXZpb3VzbHlXaXRoVGFiSW5kZXgiLCJfcHJldmlvdXNXaXRoVGFiSW5kaWNlcyIsInJlYWR5Iiwic2VsZWN0b3IiLCJQYXJ0aWNsZXMiLCJtYXhQYXJ0aWNsZXMiLCJyZXNwb25zaXZlIiwiYnJlYWtwb2ludCIsImNvbm5lY3RQYXJ0aWNsZXMiLCJhbG1Eb25lIiwiYWxtIiwiZmlsdGVyU3RhcnQiLCIkdGl0bGUiLCJkYXRhc2V0IiwiJGRlc2NyaXB0aW9uIiwiZGVzY3JpcHRpb24iLCIkaW1hZ2UiLCJsaW5rIiwiZW1wdHkiLCJhMmFfY29uZmlnIiwiYTJhIiwiYWxtX2lzX2FuaW1hdGluZyIsInNwZWVkIiwiYWxtRmlsdGVyIiwiYWxtRmlsdGVyQ29tcGxldGUiLCJsb2ciLCJhbG1Db21wbGV0ZSIsImpzd2luZyIsInN3aW5nIiwiZGVmIiwiZWFzZUluUXVhZCIsImVhc2VPdXRRdWFkIiwiZWFzZUluT3V0UXVhZCIsImVhc2VJbkN1YmljIiwiZWFzZU91dEN1YmljIiwiZWFzZUluT3V0Q3ViaWMiLCJlYXNlSW5RdWFydCIsImVhc2VPdXRRdWFydCIsImVhc2VJbk91dFF1YXJ0IiwiZWFzZUluUXVpbnQiLCJlYXNlT3V0UXVpbnQiLCJlYXNlSW5PdXRRdWludCIsImVhc2VJblNpbmUiLCJjb3MiLCJQSSIsImVhc2VPdXRTaW5lIiwic2luIiwiZWFzZUluT3V0U2luZSIsImVhc2VJbkV4cG8iLCJlYXNlT3V0RXhwbyIsImVhc2VJbk91dEV4cG8iLCJlYXNlSW5DaXJjIiwic3FydCIsImVhc2VPdXRDaXJjIiwiZWFzZUluT3V0Q2lyYyIsImVhc2VJbkVsYXN0aWMiLCJhc2luIiwiZWFzZU91dEVsYXN0aWMiLCJlYXNlSW5PdXRFbGFzdGljIiwiZWFzZUluQmFjayIsImVhc2VPdXRCYWNrIiwiZWFzZUluT3V0QmFjayIsImVhc2VJbkJvdW5jZSIsImVhc2VPdXRCb3VuY2UiLCJlYXNlSW5PdXRCb3VuY2UiLCJ0cmFuc2l0IiwicHJvcGVydHlNYXAiLCJtYXJnaW5MZWZ0IiwibWFyZ2luUmlnaHQiLCJtYXJnaW5Cb3R0b20iLCJtYXJnaW5Ub3AiLCJwYWRkaW5nTGVmdCIsInBhZGRpbmdSaWdodCIsInBhZGRpbmdCb3R0b20iLCJwYWRkaW5nVG9wIiwidXNlVHJhbnNpdGlvbkVuZCIsInEiLCJjaGFyQXQiLCJzdWJzdHIiLCJ0cmFuc2l0aW9uRGVsYXkiLCJ0cmFuc2Zvcm1PcmlnaW4iLCJ0cmFuc2Zvcm0zZCIsIk1velRyYW5zaXRpb24iLCJPVHJhbnNpdGlvbiIsIldlYmtpdFRyYW5zaXRpb24iLCJtc1RyYW5zaXRpb24iLCJ0cmFuc2l0aW9uRW5kIiwic3VwcG9ydCIsImNzc0Vhc2UiLCJfZGVmYXVsdCIsIm91dCIsInNuYXAiLCJjc3NIb29rcyIsInNldCIsInNldEZyb21TdHJpbmciLCJ1bnNoaWZ0Iiwic2V0dGVyIiwiZ2V0dGVyIiwicm90YXRlIiwicm90YXRlWCIsInJvdGF0ZVkiLCJzY2FsZSIsInNrZXdYIiwic2tld1kiLCJ0cmFuc2xhdGUiLCJfdHJhbnNsYXRlWCIsIl90cmFuc2xhdGVZIiwicm90YXRlM2QiLCJxdWV1ZSIsImNzc1Byb3BzIiwieiIsIkMiLCJEIiwiZngiLCJzcGVlZHMiLCJFIiwiQiIsIkEiLCJGIiwiSCIsIkciLCJ1bmJpbmQiLCJjc3NOdW1iZXIiLCJnZXRUcmFuc2l0aW9uVmFsdWUiLCJ0aWxlIiwiY29sdW1ucyIsInRpbGVzIiwibGFzdCIsInJlbW92ZVByb3BlcnR5IiwicmVtb3ZlQXR0cmlidXRlIiwiQ293Ym95IiwiZ3VpZCIsInNpemVWYXJpYXRpb25zIiwibWluRGlzdGFuY2UiLCJyYXRpbyIsImJyZWFrcG9pbnRzIiwiYWN0aXZlQnJlYWtwb2ludCIsImJyZWFrcG9pbnRTZXR0aW5ncyIsIm9yaWdpbmFsU2V0dGluZ3MiLCJzdG9yYWdlIiwiX2V4dGVuZCIsIl9oZXgycmdiIiwic3RyaW5naWZ5IiwiX2luaXRpYWxpemVDYW52YXMiLCJfaW5pdGlhbGl6ZUV2ZW50cyIsIl9yZWdpc3RlckJyZWFrcG9pbnRzIiwiX2NoZWNrUmVzcG9uc2l2ZSIsIl9pbml0aWFsaXplU3RvcmFnZSIsIl9hbmltYXRlIiwicXVlcnlTZWxlY3RvciIsImdldENvbnRleHQiLCJkZXZpY2VQaXhlbFJhdGlvIiwid2Via2l0QmFja2luZ1N0b3JlUGl4ZWxSYXRpbyIsIm1vekJhY2tpbmdTdG9yZVBpeGVsUmF0aW8iLCJtc0JhY2tpbmdTdG9yZVBpeGVsUmF0aW8iLCJvQmFja2luZ1N0b3JlUGl4ZWxSYXRpbyIsImJhY2tpbmdTdG9yZVBpeGVsUmF0aW8iLCJpbm5lcldpZHRoIiwiX3JlZnJlc2giLCJ3aW5kb3dEZWxheSIsIl9kcmF3IiwicmVxdWVzdEFuaW1GcmFtZSIsImNsZWFyUmVjdCIsInZ4IiwidnkiLCJyYWRpdXMiLCJfY2FsY3VsYXRlRGlzdGFuY2UiLCJiZWdpblBhdGgiLCJzdHJva2VTdHlsZSIsIm1vdmVUbyIsImxpbmVUbyIsInN0cm9rZSIsImNsb3NlUGF0aCIsImZpbGxTdHlsZSIsImFyYyIsImZpbGwiLCJ3ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUiLCJtb3pSZXF1ZXN0QW5pbWF0aW9uRnJhbWUiLCJkZWZpbmUiLCJhbWQiLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiOztBQUFBLENBQUMsVUFBU0EsQ0FBVCxFQUFZOztBQUViOztBQUVBLE1BQUlDLHFCQUFxQixPQUF6Qjs7QUFFQTtBQUNBO0FBQ0EsTUFBSUMsYUFBYTtBQUNmQyxhQUFTRixrQkFETTs7QUFHZjs7O0FBR0FHLGNBQVUsRUFOSzs7QUFRZjs7O0FBR0FDLFlBQVEsRUFYTzs7QUFhZjs7O0FBR0FDLFNBQUssWUFBVTtBQUNiLGFBQU9OLEVBQUUsTUFBRixFQUFVTyxJQUFWLENBQWUsS0FBZixNQUEwQixLQUFqQztBQUNELEtBbEJjO0FBbUJmOzs7O0FBSUFDLFlBQVEsVUFBU0EsTUFBVCxFQUFpQkMsSUFBakIsRUFB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TCxHQUEvakosRUFBZ2tKaGhDLEVBQUVrZ0MsZ0JBQUYsR0FBbUIsWUFBVTtBQUFDLFdBQU9sZ0MsRUFBRWlDLHFCQUFGLElBQXlCakMsRUFBRWloQywyQkFBM0IsSUFBd0RqaEMsRUFBRWtoQyx3QkFBMUQsSUFBb0YsVUFBUy9oQyxDQUFULEVBQVc7QUFBQ2EsUUFBRUUsVUFBRixDQUFhZixDQUFiLEVBQWUsTUFBSSxFQUFuQjtBQUF1QixLQUE5SDtBQUErSCxHQUExSSxFQUFubEosRUFBZ3VKLElBQUl1c0IsQ0FBSixFQUF2dUo7QUFBNnVKLENBQW54SixDQUFveEovcEIsTUFBcHhKLEVBQTJ4SjlCLFFBQTN4SixDQUFkLENBQW16SixDQUFDLFlBQVU7QUFBQztBQUFhLGdCQUFZLE9BQU9zaEMsTUFBbkIsSUFBMkJBLE9BQU9DLEdBQWxDLEdBQXNDRCxPQUFPLFdBQVAsRUFBbUIsWUFBVTtBQUFDLFdBQU85SyxTQUFQO0FBQWlCLEdBQS9DLENBQXRDLEdBQXVGLGVBQWEsT0FBT2dMLE1BQXBCLElBQTRCQSxPQUFPQyxPQUFuQyxHQUEyQ0QsT0FBT0MsT0FBUCxHQUFlakwsU0FBMUQsR0FBb0UxMEIsT0FBTzAwQixTQUFQLEdBQWlCQSxTQUE1SztBQUFzTCxDQUE5TSxFQUFEIiwiZmlsZSI6ImZvdW5kYXRpb24uanMiLCJzb3VyY2VzQ29udGVudCI6WyIhZnVuY3Rpb24oJCkge1xuXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIEZPVU5EQVRJT05fVkVSU0lPTiA9ICc2LjMuMSc7XG5cbi8vIEdsb2JhbCBGb3VuZGF0aW9uIG9iamVjdFxuLy8gVGhpcyBpcyBhdHRhY2hlZCB0byB0aGUgd2luZG93LCBvciB1c2VkIGFzIGEgbW9kdWxlIGZvciBBTUQvQnJvd3NlcmlmeVxudmFyIEZvdW5kYXRpb24gPSB7XG4gIHZlcnNpb246IEZPVU5EQVRJT05fVkVSU0lPTixcblxuICAvKipcbiAgICogU3RvcmVzIGluaXRpYWxpemVkIHBsdWdpbnMuXG4gICAqL1xuICBfcGx1Z2luczoge30sXG5cbiAgLyoqXG4gICAqIFN0b3JlcyBnZW5lcmF0ZWQgdW5pcXVlIGlkcyBmb3IgcGx1Z2luIGluc3RhbmNlc1xuICAgKi9cbiAgX3V1aWRzOiBbXSxcblxuICAvKipcbiAgICogUmV0dXJucyBhIGJvb2xlYW4gZm9yIFJUTCBzdXBwb3J0XG4gICAqL1xuICBydGw6IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuICQoJ2h0bWwnKS5hdHRyKCdkaXInKSA9PT0gJ3J0bCc7XG4gIH0sXG4gIC8qKlxuICAgKiBEZWZpbmVzIGEgRm91bmRhdGlvbiBwbHVnaW4sIGFkZGluZyBpdCB0byB0aGUgYEZvdW5kYXRpb25gIG5hbWVzcGFjZSBhbmQgdGhlIGxpc3Qgb2YgcGx1Z2lucyB0byBpbml0aWFsaXplIHdoZW4gcmVmbG93aW5nLlxuICAgKiBAcGFyYW0ge09iamVjdH0gcGx1Z2luIC0gVGhlIGNvbnN0cnVjdG9yIG9mIHRoZSBwbHVnaW4uXG4gICAqL1xuICBwbHVnaW46IGZ1bmN0aW9uKHBsdWdpbiwgbmFtZSkge1xuICAgIC8vIE9iamVjdCBrZXkgdG8gdXNlIHdoZW4gYWRkaW5nIHRvIGdsb2JhbCBGb3VuZGF0aW9uIG9iamVjdFxuICAgIC8vIEV4YW1wbGVzOiBGb3VuZGF0aW9uLlJldmVhbCwgRm91bmRhdGlvbi5PZmZDYW52YXNcbiAgICB2YXIgY2xhc3NOYW1lID0gKG5hbWUgfHwgZnVuY3Rpb25OYW1lKHBsdWdpbikpO1xuICAgIC8vIE9iamVjdCBrZXkgdG8gdXNlIHdoZW4gc3RvcmluZyB0aGUgcGx1Z2luLCBhbHNvIHVzZWQgdG8gY3JlYXRlIHRoZSBpZGVudGlmeWluZyBkYXRhIGF0dHJpYnV0ZSBmb3IgdGhlIHBsdWdpblxuICAgIC8vIEV4YW1wbGVzOiBkYXRhLXJldmVhbCwgZGF0YS1vZmYtY2FudmFzXG4gICAgdmFyIGF0dHJOYW1lICA9IGh5cGhlbmF0ZShjbGFzc05hbWUpO1xuXG4gICAgLy8gQWRkIHRvIHRoZSBGb3VuZGF0aW9uIG9iamVjdCBhbmQgdGhlIHBsdWdpbnMgbGlzdCAoZm9yIHJlZmxvd2luZylcbiAgICB0aGlzLl9wbHVnaW5zW2F0dHJOYW1lXSA9IHRoaXNbY2xhc3NOYW1lXSA9IHBsdWdpbjtcbiAgfSxcbiAgLyoqXG4gICAqIEBmdW5jdGlvblxuICAgKiBQb3B1bGF0ZXMgdGhlIF91dWlkcyBhcnJheSB3aXRoIHBvaW50ZXJzIHRvIGVhY2ggaW5kaXZpZHVhbCBwbHVnaW4gaW5zdGFuY2UuXG4gICAqIEFkZHMgdGhlIGB6ZlBsdWdpbmAgZGF0YS1hdHRyaWJ1dGUgdG8gcHJvZ3JhbW1hdGljYWxseSBjcmVhdGVkIHBsdWdpbnMgdG8gYWxsb3cgdXNlIG9mICQoc2VsZWN0b3IpLmZvdW5kYXRpb24obWV0aG9kKSBjYWxscy5cbiAgICogQWxzbyBmaXJlcyB0aGUgaW5pdGlhbGl6YXRpb24gZXZlbnQgZm9yIGVhY2ggcGx1Z2luLCBjb25zb2xpZGF0aW5nIHJlcGV0aXRpdmUgY29kZS5cbiAgICogQHBhcmFtIHtPYmplY3R9IHBsdWdpbiAtIGFuIGluc3RhbmNlIG9mIGEgcGx1Z2luLCB1c3VhbGx5IGB0aGlzYCBpbiBjb250ZXh0LlxuICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZSAtIHRoZSBuYW1lIG9mIHRoZSBwbHVnaW4sIHBhc3NlZCBhcyBhIGNhbWVsQ2FzZWQgc3RyaW5nLlxuICAgKiBAZmlyZXMgUGx1Z2luI2luaXRcbiAgICovXG4gIHJlZ2lzdGVyUGx1Z2luOiBmdW5jdGlvbihwbHVnaW4sIG5hbWUpe1xuICAgIHZhciBwbHVnaW5OYW1lID0gbmFtZSA/IGh5cGhlbmF0ZShuYW1lKSA6IGZ1bmN0aW9uTmFtZShwbHVnaW4uY29uc3RydWN0b3IpLnRvTG93ZXJDYXNlKCk7XG4gICAgcGx1Z2luLnV1aWQgPSB0aGlzLkdldFlvRGlnaXRzKDYsIHBsdWdpbk5hbWUpO1xuXG4gICAgaWYoIXBsdWdpbi4kZWxlbWVudC5hdHRyKGBkYXRhLSR7cGx1Z2luTmFtZX1gKSl7IHBsdWdpbi4kZWxlbWVudC5hdHRyKGBkYXRhLSR7cGx1Z2luTmFtZX1gLCBwbHVnaW4udXVpZCk7IH1cbiAgICBpZighcGx1Z2luLiRlbGVtZW50LmRhdGEoJ3pmUGx1Z2luJykpeyBwbHVnaW4uJGVsZW1lbnQuZGF0YSgnemZQbHVnaW4nLCBwbHVnaW4pOyB9XG4gICAgICAgICAgLyoqXG4gICAgICAgICAgICogRmlyZXMgd2hlbiB0aGUgcGx1Z2luIGhhcyBpbml0aWFsaXplZC5cbiAgICAgICAgICAgKiBAZXZlbnQgUGx1Z2luI2luaXRcbiAgICAgICAgICAgKi9cbiAgICBwbHVnaW4uJGVsZW1lbnQudHJpZ2dlcihgaW5pdC56Zi4ke3BsdWdpbk5hbWV9YCk7XG5cbiAgICB0aGlzLl91dWlkcy5wdXNoKHBsdWdpbi51dWlkKTtcblxuICAgIHJldHVybjtcbiAgfSxcbiAgLyoqXG4gICAqIEBmdW5jdGlvblxuICAgKiBSZW1vdmVzIHRoZSBwbHVnaW5zIHV1aWQgZnJvbSB0aGUgX3V1aWRzIGFycmF5LlxuICAgKiBSZW1vdmVzIHRoZSB6ZlBsdWdpbiBkYXRhIGF0dHJpYnV0ZSwgYXMgd2VsbCBhcyB0aGUgZGF0YS1wbHVnaW4tbmFtZSBhdHRyaWJ1dGUuXG4gICAqIEFsc28gZmlyZXMgdGhlIGRlc3Ryb3llZCBldmVudCBmb3IgdGhlIHBsdWdpbiwgY29uc29saWRhdGluZyByZXBldGl0aXZlIGNvZGUuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBwbHVnaW4gLSBhbiBpbnN0YW5jZSBvZiBhIHBsdWdpbiwgdXN1YWxseSBgdGhpc2AgaW4gY29udGV4dC5cbiAgICogQGZpcmVzIFBsdWdpbiNkZXN0cm95ZWRcbiAgICovXG4gIHVucmVnaXN0ZXJQbHVnaW46IGZ1bmN0aW9uKHBsdWdpbil7XG4gICAgdmFyIHBsdWdpbk5hbWUgPSBoeXBoZW5hdGUoZnVuY3Rpb25OYW1lKHBsdWdpbi4kZWxlbWVudC5kYXRhKCd6ZlBsdWdpbicpLmNvbnN0cnVjdG9yKSk7XG5cbiAgICB0aGlzLl91dWlkcy5zcGxpY2UodGhpcy5fdXVpZHMuaW5kZXhPZihwbHVnaW4udXVpZCksIDEpO1xuICAgIHBsdWdpbi4kZWxlbWVudC5yZW1vdmVBdHRyKGBkYXRhLSR7cGx1Z2luTmFtZX1gKS5yZW1vdmVEYXRhKCd6ZlBsdWdpbicpXG4gICAgICAgICAgLyoqXG4gICAgICAgICAgICogRmlyZXMgd2hlbiB0aGUgcGx1Z2luIGhhcyBiZWVuIGRlc3Ryb3llZC5cbiAgICAgICAgICAgKiBAZXZlbnQgUGx1Z2luI2Rlc3Ryb3llZFxuICAgICAgICAgICAqL1xuICAgICAgICAgIC50cmlnZ2VyKGBkZXN0cm95ZWQuemYuJHtwbHVnaW5OYW1lfWApO1xuICAgIGZvcih2YXIgcHJvcCBpbiBwbHVnaW4pe1xuICAgICAgcGx1Z2luW3Byb3BdID0gbnVsbDsvL2NsZWFuIHVwIHNjcmlwdCB0byBwcmVwIGZvciBnYXJiYWdlIGNvbGxlY3Rpb24uXG4gICAgfVxuICAgIHJldHVybjtcbiAgfSxcblxuICAvKipcbiAgICogQGZ1bmN0aW9uXG4gICAqIENhdXNlcyBvbmUgb3IgbW9yZSBhY3RpdmUgcGx1Z2lucyB0byByZS1pbml0aWFsaXplLCByZXNldHRpbmcgZXZlbnQgbGlzdGVuZXJzLCByZWNhbGN1bGF0aW5nIHBvc2l0aW9ucywgZXRjLlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGx1Z2lucyAtIG9wdGlvbmFsIHN0cmluZyBvZiBhbiBpbmRpdmlkdWFsIHBsdWdpbiBrZXksIGF0dGFpbmVkIGJ5IGNhbGxpbmcgYCQoZWxlbWVudCkuZGF0YSgncGx1Z2luTmFtZScpYCwgb3Igc3RyaW5nIG9mIGEgcGx1Z2luIGNsYXNzIGkuZS4gYCdkcm9wZG93bidgXG4gICAqIEBkZWZhdWx0IElmIG5vIGFyZ3VtZW50IGlzIHBhc3NlZCwgcmVmbG93IGFsbCBjdXJyZW50bHkgYWN0aXZlIHBsdWdpbnMuXG4gICAqL1xuICAgcmVJbml0OiBmdW5jdGlvbihwbHVnaW5zKXtcbiAgICAgdmFyIGlzSlEgPSBwbHVnaW5zIGluc3RhbmNlb2YgJDtcbiAgICAgdHJ5e1xuICAgICAgIGlmKGlzSlEpe1xuICAgICAgICAgcGx1Z2lucy5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICQodGhpcykuZGF0YSgnemZQbHVnaW4nKS5faW5pdCgpO1xuICAgICAgICAgfSk7XG4gICAgICAgfWVsc2V7XG4gICAgICAgICB2YXIgdHlwZSA9IHR5cGVvZiBwbHVnaW5zLFxuICAgICAgICAgX3RoaXMgPSB0aGlzLFxuICAgICAgICAgZm5zID0ge1xuICAgICAgICAgICAnb2JqZWN0JzogZnVuY3Rpb24ocGxncyl7XG4gICAgICAgICAgICAgcGxncy5mb3JFYWNoKGZ1bmN0aW9uKHApe1xuICAgICAgICAgICAgICAgcCA9IGh5cGhlbmF0ZShwKTtcbiAgICAgICAgICAgICAgICQoJ1tkYXRhLScrIHAgKyddJykuZm91bmRhdGlvbignX2luaXQnKTtcbiAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgfSxcbiAgICAgICAgICAgJ3N0cmluZyc6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgcGx1Z2lucyA9IGh5cGhlbmF0ZShwbHVnaW5zKTtcbiAgICAgICAgICAgICAkKCdbZGF0YS0nKyBwbHVnaW5zICsnXScpLmZvdW5kYXRpb24oJ19pbml0Jyk7XG4gICAgICAgICAgIH0sXG4gICAgICAgICAgICd1bmRlZmluZWQnOiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgIHRoaXNbJ29iamVjdCddKE9iamVjdC5rZXlzKF90aGlzLl9wbHVnaW5zKSk7XG4gICAgICAgICAgIH1cbiAgICAgICAgIH07XG4gICAgICAgICBmbnNbdHlwZV0ocGx1Z2lucyk7XG4gICAgICAgfVxuICAgICB9Y2F0Y2goZXJyKXtcbiAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgIH1maW5hbGx5e1xuICAgICAgIHJldHVybiBwbHVnaW5zO1xuICAgICB9XG4gICB9LFxuXG4gIC8qKlxuICAgKiByZXR1cm5zIGEgcmFuZG9tIGJhc2UtMzYgdWlkIHdpdGggbmFtZXNwYWNpbmdcbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBsZW5ndGggLSBudW1iZXIgb2YgcmFuZG9tIGJhc2UtMzYgZGlnaXRzIGRlc2lyZWQuIEluY3JlYXNlIGZvciBtb3JlIHJhbmRvbSBzdHJpbmdzLlxuICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZXNwYWNlIC0gbmFtZSBvZiBwbHVnaW4gdG8gYmUgaW5jb3Jwb3JhdGVkIGluIHVpZCwgb3B0aW9uYWwuXG4gICAqIEBkZWZhdWx0IHtTdHJpbmd9ICcnIC0gaWYgbm8gcGx1Z2luIG5hbWUgaXMgcHJvdmlkZWQsIG5vdGhpbmcgaXMgYXBwZW5kZWQgdG8gdGhlIHVpZC5cbiAgICogQHJldHVybnMge1N0cmluZ30gLSB1bmlxdWUgaWRcbiAgICovXG4gIEdldFlvRGlnaXRzOiBmdW5jdGlvbihsZW5ndGgsIG5hbWVzcGFjZSl7XG4gICAgbGVuZ3RoID0gbGVuZ3RoIHx8IDY7XG4gICAgcmV0dXJuIE1hdGgucm91bmQoKE1hdGgucG93KDM2LCBsZW5ndGggKyAxKSAtIE1hdGgucmFuZG9tKCkgKiBNYXRoLnBvdygzNiwgbGVuZ3RoKSkpLnRvU3RyaW5nKDM2KS5zbGljZSgxKSArIChuYW1lc3BhY2UgPyBgLSR7bmFtZXNwYWNlfWAgOiAnJyk7XG4gIH0sXG4gIC8qKlxuICAgKiBJbml0aWFsaXplIHBsdWdpbnMgb24gYW55IGVsZW1lbnRzIHdpdGhpbiBgZWxlbWAgKGFuZCBgZWxlbWAgaXRzZWxmKSB0aGF0IGFyZW4ndCBhbHJlYWR5IGluaXRpYWxpemVkLlxuICAgKiBAcGFyYW0ge09iamVjdH0gZWxlbSAtIGpRdWVyeSBvYmplY3QgY29udGFpbmluZyB0aGUgZWxlbWVudCB0byBjaGVjayBpbnNpZGUuIEFsc28gY2hlY2tzIHRoZSBlbGVtZW50IGl0c2VsZiwgdW5sZXNzIGl0J3MgdGhlIGBkb2N1bWVudGAgb2JqZWN0LlxuICAgKiBAcGFyYW0ge1N0cmluZ3xBcnJheX0gcGx1Z2lucyAtIEEgbGlzdCBvZiBwbHVnaW5zIHRvIGluaXRpYWxpemUuIExlYXZlIHRoaXMgb3V0IHRvIGluaXRpYWxpemUgZXZlcnl0aGluZy5cbiAgICovXG4gIHJlZmxvdzogZnVuY3Rpb24oZWxlbSwgcGx1Z2lucykge1xuXG4gICAgLy8gSWYgcGx1Z2lucyBpcyB1bmRlZmluZWQsIGp1c3QgZ3JhYiBldmVyeXRoaW5nXG4gICAgaWYgKHR5cGVvZiBwbHVnaW5zID09PSAndW5kZWZpbmVkJykge1xuICAgICAgcGx1Z2lucyA9IE9iamVjdC5rZXlzKHRoaXMuX3BsdWdpbnMpO1xuICAgIH1cbiAgICAvLyBJZiBwbHVnaW5zIGlzIGEgc3RyaW5nLCBjb252ZXJ0IGl0IHRvIGFuIGFycmF5IHdpdGggb25lIGl0ZW1cbiAgICBlbHNlIGlmICh0eXBlb2YgcGx1Z2lucyA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHBsdWdpbnMgPSBbcGx1Z2luc107XG4gICAgfVxuXG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCBlYWNoIHBsdWdpblxuICAgICQuZWFjaChwbHVnaW5zLCBmdW5jdGlvbihpLCBuYW1lKSB7XG4gICAgICAvLyBHZXQgdGhlIGN1cnJlbnQgcGx1Z2luXG4gICAgICB2YXIgcGx1Z2luID0gX3RoaXMuX3BsdWdpbnNbbmFtZV07XG5cbiAgICAgIC8vIExvY2FsaXplIHRoZSBzZWFyY2ggdG8gYWxsIGVsZW1lbnRzIGluc2lkZSBlbGVtLCBhcyB3ZWxsIGFzIGVsZW0gaXRzZWxmLCB1bmxlc3MgZWxlbSA9PT0gZG9jdW1lbnRcbiAgICAgIHZhciAkZWxlbSA9ICQoZWxlbSkuZmluZCgnW2RhdGEtJytuYW1lKyddJykuYWRkQmFjaygnW2RhdGEtJytuYW1lKyddJyk7XG5cbiAgICAgIC8vIEZvciBlYWNoIHBsdWdpbiBmb3VuZCwgaW5pdGlhbGl6ZSBpdFxuICAgICAgJGVsZW0uZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRlbCA9ICQodGhpcyksXG4gICAgICAgICAgICBvcHRzID0ge307XG4gICAgICAgIC8vIERvbid0IGRvdWJsZS1kaXAgb24gcGx1Z2luc1xuICAgICAgICBpZiAoJGVsLmRhdGEoJ3pmUGx1Z2luJykpIHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oXCJUcmllZCB0byBpbml0aWFsaXplIFwiK25hbWUrXCIgb24gYW4gZWxlbWVudCB0aGF0IGFscmVhZHkgaGFzIGEgRm91bmRhdGlvbiBwbHVnaW4uXCIpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKCRlbC5hdHRyKCdkYXRhLW9wdGlvbnMnKSl7XG4gICAgICAgICAgdmFyIHRoaW5nID0gJGVsLmF0dHIoJ2RhdGEtb3B0aW9ucycpLnNwbGl0KCc7JykuZm9yRWFjaChmdW5jdGlvbihlLCBpKXtcbiAgICAgICAgICAgIHZhciBvcHQgPSBlLnNwbGl0KCc6JykubWFwKGZ1bmN0aW9uKGVsKXsgcmV0dXJuIGVsLnRyaW0oKTsgfSk7XG4gICAgICAgICAgICBpZihvcHRbMF0pIG9wdHNbb3B0WzBdXSA9IHBhcnNlVmFsdWUob3B0WzFdKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICB0cnl7XG4gICAgICAgICAgJGVsLmRhdGEoJ3pmUGx1Z2luJywgbmV3IHBsdWdpbigkKHRoaXMpLCBvcHRzKSk7XG4gICAgICAgIH1jYXRjaChlcil7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihlcik7XG4gICAgICAgIH1maW5hbGx5e1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH0sXG4gIGdldEZuTmFtZTogZnVuY3Rpb25OYW1lLFxuICB0cmFuc2l0aW9uZW5kOiBmdW5jdGlvbigkZWxlbSl7XG4gICAgdmFyIHRyYW5zaXRpb25zID0ge1xuICAgICAgJ3RyYW5zaXRpb24nOiAndHJhbnNpdGlvbmVuZCcsXG4gICAgICAnV2Via2l0VHJhbnNpdGlvbic6ICd3ZWJraXRUcmFuc2l0aW9uRW5kJyxcbiAgICAgICdNb3pUcmFuc2l0aW9uJzogJ3RyYW5zaXRpb25lbmQnLFxuICAgICAgJ09UcmFuc2l0aW9uJzogJ290cmFuc2l0aW9uZW5kJ1xuICAgIH07XG4gICAgdmFyIGVsZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSxcbiAgICAgICAgZW5kO1xuXG4gICAgZm9yICh2YXIgdCBpbiB0cmFuc2l0aW9ucyl7XG4gICAgICBpZiAodHlwZW9mIGVsZW0uc3R5bGVbdF0gIT09ICd1bmRlZmluZWQnKXtcbiAgICAgICAgZW5kID0gdHJhbnNpdGlvbnNbdF07XG4gICAgICB9XG4gICAgfVxuICAgIGlmKGVuZCl7XG4gICAgICByZXR1cm4gZW5kO1xuICAgIH1lbHNle1xuICAgICAgZW5kID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAkZWxlbS50cmlnZ2VySGFuZGxlcigndHJhbnNpdGlvbmVuZCcsIFskZWxlbV0pO1xuICAgICAgfSwgMSk7XG4gICAgICByZXR1cm4gJ3RyYW5zaXRpb25lbmQnO1xuICAgIH1cbiAgfVxufTtcblxuRm91bmRhdGlvbi51dGlsID0ge1xuICAvKipcbiAgICogRnVuY3Rpb24gZm9yIGFwcGx5aW5nIGEgZGVib3VuY2UgZWZmZWN0IHRvIGEgZnVuY3Rpb24gY2FsbC5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgLSBGdW5jdGlvbiB0byBiZSBjYWxsZWQgYXQgZW5kIG9mIHRpbWVvdXQuXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBkZWxheSAtIFRpbWUgaW4gbXMgdG8gZGVsYXkgdGhlIGNhbGwgb2YgYGZ1bmNgLlxuICAgKiBAcmV0dXJucyBmdW5jdGlvblxuICAgKi9cbiAgdGhyb3R0bGU6IGZ1bmN0aW9uIChmdW5jLCBkZWxheSkge1xuICAgIHZhciB0aW1lciA9IG51bGw7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIGNvbnRleHQgPSB0aGlzLCBhcmdzID0gYXJndW1lbnRzO1xuXG4gICAgICBpZiAodGltZXIgPT09IG51bGwpIHtcbiAgICAgICAgdGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICAgIHRpbWVyID0gbnVsbDtcbiAgICAgICAgfSwgZGVsYXkpO1xuICAgICAgfVxuICAgIH07XG4gIH1cbn07XG5cbi8vIFRPRE86IGNvbnNpZGVyIG5vdCBtYWtpbmcgdGhpcyBhIGpRdWVyeSBmdW5jdGlvblxuLy8gVE9ETzogbmVlZCB3YXkgdG8gcmVmbG93IHZzLiByZS1pbml0aWFsaXplXG4vKipcbiAqIFRoZSBGb3VuZGF0aW9uIGpRdWVyeSBtZXRob2QuXG4gKiBAcGFyYW0ge1N0cmluZ3xBcnJheX0gbWV0aG9kIC0gQW4gYWN0aW9uIHRvIHBlcmZvcm0gb24gdGhlIGN1cnJlbnQgalF1ZXJ5IG9iamVjdC5cbiAqL1xudmFyIGZvdW5kYXRpb24gPSBmdW5jdGlvbihtZXRob2QpIHtcbiAgdmFyIHR5cGUgPSB0eXBlb2YgbWV0aG9kLFxuICAgICAgJG1ldGEgPSAkKCdtZXRhLmZvdW5kYXRpb24tbXEnKSxcbiAgICAgICRub0pTID0gJCgnLm5vLWpzJyk7XG5cbiAgaWYoISRtZXRhLmxlbmd0aCl7XG4gICAgJCgnPG1ldGEgY2xhc3M9XCJmb3VuZGF0aW9uLW1xXCI+JykuYXBwZW5kVG8oZG9jdW1lbnQuaGVhZCk7XG4gIH1cbiAgaWYoJG5vSlMubGVuZ3RoKXtcbiAgICAkbm9KUy5yZW1vdmVDbGFzcygnbm8tanMnKTtcbiAgfVxuXG4gIGlmKHR5cGUgPT09ICd1bmRlZmluZWQnKXsvL25lZWRzIHRvIGluaXRpYWxpemUgdGhlIEZvdW5kYXRpb24gb2JqZWN0LCBvciBhbiBpbmRpdmlkdWFsIHBsdWdpbi5cbiAgICBGb3VuZGF0aW9uLk1lZGlhUXVlcnkuX2luaXQoKTtcbiAgICBGb3VuZGF0aW9uLnJlZmxvdyh0aGlzKTtcbiAgfWVsc2UgaWYodHlwZSA9PT0gJ3N0cmluZycpey8vYW4gaW5kaXZpZHVhbCBtZXRob2QgdG8gaW52b2tlIG9uIGEgcGx1Z2luIG9yIGdyb3VwIG9mIHBsdWdpbnNcbiAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7Ly9jb2xsZWN0IGFsbCB0aGUgYXJndW1lbnRzLCBpZiBuZWNlc3NhcnlcbiAgICB2YXIgcGx1Z0NsYXNzID0gdGhpcy5kYXRhKCd6ZlBsdWdpbicpOy8vZGV0ZXJtaW5lIHRoZSBjbGFzcyBvZiBwbHVnaW5cblxuICAgIGlmKHBsdWdDbGFzcyAhPT0gdW5kZWZpbmVkICYmIHBsdWdDbGFzc1ttZXRob2RdICE9PSB1bmRlZmluZWQpey8vbWFrZSBzdXJlIGJvdGggdGhlIGNsYXNzIGFuZCBtZXRob2QgZXhpc3RcbiAgICAgIGlmKHRoaXMubGVuZ3RoID09PSAxKXsvL2lmIHRoZXJlJ3Mgb25seSBvbmUsIGNhbGwgaXQgZGlyZWN0bHkuXG4gICAgICAgICAgcGx1Z0NsYXNzW21ldGhvZF0uYXBwbHkocGx1Z0NsYXNzLCBhcmdzKTtcbiAgICAgIH1lbHNle1xuICAgICAgICB0aGlzLmVhY2goZnVuY3Rpb24oaSwgZWwpey8vb3RoZXJ3aXNlIGxvb3AgdGhyb3VnaCB0aGUgalF1ZXJ5IGNvbGxlY3Rpb24gYW5kIGludm9rZSB0aGUgbWV0aG9kIG9uIGVhY2hcbiAgICAgICAgICBwbHVnQ2xhc3NbbWV0aG9kXS5hcHBseSgkKGVsKS5kYXRhKCd6ZlBsdWdpbicpLCBhcmdzKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfWVsc2V7Ly9lcnJvciBmb3Igbm8gY2xhc3Mgb3Igbm8gbWV0aG9kXG4gICAgICB0aHJvdyBuZXcgUmVmZXJlbmNlRXJyb3IoXCJXZSdyZSBzb3JyeSwgJ1wiICsgbWV0aG9kICsgXCInIGlzIG5vdCBhbiBhdmFpbGFibGUgbWV0aG9kIGZvciBcIiArIChwbHVnQ2xhc3MgPyBmdW5jdGlvbk5hbWUocGx1Z0NsYXNzKSA6ICd0aGlzIGVsZW1lbnQnKSArICcuJyk7XG4gICAgfVxuICB9ZWxzZXsvL2Vycm9yIGZvciBpbnZhbGlkIGFyZ3VtZW50IHR5cGVcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBXZSdyZSBzb3JyeSwgJHt0eXBlfSBpcyBub3QgYSB2YWxpZCBwYXJhbWV0ZXIuIFlvdSBtdXN0IHVzZSBhIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIG1ldGhvZCB5b3Ugd2lzaCB0byBpbnZva2UuYCk7XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG53aW5kb3cuRm91bmRhdGlvbiA9IEZvdW5kYXRpb247XG4kLmZuLmZvdW5kYXRpb24gPSBmb3VuZGF0aW9uO1xuXG4vLyBQb2x5ZmlsbCBmb3IgcmVxdWVzdEFuaW1hdGlvbkZyYW1lXG4oZnVuY3Rpb24oKSB7XG4gIGlmICghRGF0ZS5ub3cgfHwgIXdpbmRvdy5EYXRlLm5vdylcbiAgICB3aW5kb3cuRGF0ZS5ub3cgPSBEYXRlLm5vdyA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gbmV3IERhdGUoKS5nZXRUaW1lKCk7IH07XG5cbiAgdmFyIHZlbmRvcnMgPSBbJ3dlYmtpdCcsICdtb3onXTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB2ZW5kb3JzLmxlbmd0aCAmJiAhd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZTsgKytpKSB7XG4gICAgICB2YXIgdnAgPSB2ZW5kb3JzW2ldO1xuICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IHdpbmRvd1t2cCsnUmVxdWVzdEFuaW1hdGlvbkZyYW1lJ107XG4gICAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSAod2luZG93W3ZwKydDYW5jZWxBbmltYXRpb25GcmFtZSddXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8fCB3aW5kb3dbdnArJ0NhbmNlbFJlcXVlc3RBbmltYXRpb25GcmFtZSddKTtcbiAgfVxuICBpZiAoL2lQKGFkfGhvbmV8b2QpLipPUyA2Ly50ZXN0KHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50KVxuICAgIHx8ICF3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8ICF3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUpIHtcbiAgICB2YXIgbGFzdFRpbWUgPSAwO1xuICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICB2YXIgbm93ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgdmFyIG5leHRUaW1lID0gTWF0aC5tYXgobGFzdFRpbWUgKyAxNiwgbm93KTtcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IGNhbGxiYWNrKGxhc3RUaW1lID0gbmV4dFRpbWUpOyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICBuZXh0VGltZSAtIG5vdyk7XG4gICAgfTtcbiAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSBjbGVhclRpbWVvdXQ7XG4gIH1cbiAgLyoqXG4gICAqIFBvbHlmaWxsIGZvciBwZXJmb3JtYW5jZS5ub3csIHJlcXVpcmVkIGJ5IHJBRlxuICAgKi9cbiAgaWYoIXdpbmRvdy5wZXJmb3JtYW5jZSB8fCAhd2luZG93LnBlcmZvcm1hbmNlLm5vdyl7XG4gICAgd2luZG93LnBlcmZvcm1hbmNlID0ge1xuICAgICAgc3RhcnQ6IERhdGUubm93KCksXG4gICAgICBub3c6IGZ1bmN0aW9uKCl7IHJldHVybiBEYXRlLm5vdygpIC0gdGhpcy5zdGFydDsgfVxuICAgIH07XG4gIH1cbn0pKCk7XG5pZiAoIUZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kKSB7XG4gIEZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kID0gZnVuY3Rpb24ob1RoaXMpIHtcbiAgICBpZiAodHlwZW9mIHRoaXMgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIC8vIGNsb3Nlc3QgdGhpbmcgcG9zc2libGUgdG8gdGhlIEVDTUFTY3JpcHQgNVxuICAgICAgLy8gaW50ZXJuYWwgSXNDYWxsYWJsZSBmdW5jdGlvblxuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQgLSB3aGF0IGlzIHRyeWluZyB0byBiZSBib3VuZCBpcyBub3QgY2FsbGFibGUnKTtcbiAgICB9XG5cbiAgICB2YXIgYUFyZ3MgICA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSksXG4gICAgICAgIGZUb0JpbmQgPSB0aGlzLFxuICAgICAgICBmTk9QICAgID0gZnVuY3Rpb24oKSB7fSxcbiAgICAgICAgZkJvdW5kICA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiBmVG9CaW5kLmFwcGx5KHRoaXMgaW5zdGFuY2VvZiBmTk9QXG4gICAgICAgICAgICAgICAgID8gdGhpc1xuICAgICAgICAgICAgICAgICA6IG9UaGlzLFxuICAgICAgICAgICAgICAgICBhQXJncy5jb25jYXQoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xuICAgICAgICB9O1xuXG4gICAgaWYgKHRoaXMucHJvdG90eXBlKSB7XG4gICAgICAvLyBuYXRpdmUgZnVuY3Rpb25zIGRvbid0IGhhdmUgYSBwcm90b3R5cGVcbiAgICAgIGZOT1AucHJvdG90eXBlID0gdGhpcy5wcm90b3R5cGU7XG4gICAgfVxuICAgIGZCb3VuZC5wcm90b3R5cGUgPSBuZXcgZk5PUCgpO1xuXG4gICAgcmV0dXJuIGZCb3VuZDtcbiAgfTtcbn1cbi8vIFBvbHlmaWxsIHRvIGdldCB0aGUgbmFtZSBvZiBhIGZ1bmN0aW9uIGluIElFOVxuZnVuY3Rpb24gZnVuY3Rpb25OYW1lKGZuKSB7XG4gIGlmIChGdW5jdGlvbi5wcm90b3R5cGUubmFtZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdmFyIGZ1bmNOYW1lUmVnZXggPSAvZnVuY3Rpb25cXHMoW14oXXsxLH0pXFwoLztcbiAgICB2YXIgcmVzdWx0cyA9IChmdW5jTmFtZVJlZ2V4KS5leGVjKChmbikudG9TdHJpbmcoKSk7XG4gICAgcmV0dXJuIChyZXN1bHRzICYmIHJlc3VsdHMubGVuZ3RoID4gMSkgPyByZXN1bHRzWzFdLnRyaW0oKSA6IFwiXCI7XG4gIH1cbiAgZWxzZSBpZiAoZm4ucHJvdG90eXBlID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gZm4uY29uc3RydWN0b3IubmFtZTtcbiAgfVxuICBlbHNlIHtcbiAgICByZXR1cm4gZm4ucHJvdG90eXBlLmNvbnN0cnVjdG9yLm5hbWU7XG4gIH1cbn1cbmZ1bmN0aW9uIHBhcnNlVmFsdWUoc3RyKXtcbiAgaWYgKCd0cnVlJyA9PT0gc3RyKSByZXR1cm4gdHJ1ZTtcbiAgZWxzZSBpZiAoJ2ZhbHNlJyA9PT0gc3RyKSByZXR1cm4gZmFsc2U7XG4gIGVsc2UgaWYgKCFpc05hTihzdHIgKiAxKSkgcmV0dXJuIHBhcnNlRmxvYXQoc3RyKTtcbiAgcmV0dXJuIHN0cjtcbn1cbi8vIENvbnZlcnQgUGFzY2FsQ2FzZSB0byBrZWJhYi1jYXNlXG4vLyBUaGFuayB5b3U6IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzg5NTU1ODBcbmZ1bmN0aW9uIGh5cGhlbmF0ZShzdHIpIHtcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC8oW2Etel0pKFtBLVpdKS9nLCAnJDEtJDInKS50b0xvd2VyQ2FzZSgpO1xufVxuXG59KGpRdWVyeSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbkZvdW5kYXRpb24uQm94ID0ge1xuICBJbU5vdFRvdWNoaW5nWW91OiBJbU5vdFRvdWNoaW5nWW91LFxuICBHZXREaW1lbnNpb25zOiBHZXREaW1lbnNpb25zLFxuICBHZXRPZmZzZXRzOiBHZXRPZmZzZXRzXG59XG5cbi8qKlxuICogQ29tcGFyZXMgdGhlIGRpbWVuc2lvbnMgb2YgYW4gZWxlbWVudCB0byBhIGNvbnRhaW5lciBhbmQgZGV0ZXJtaW5lcyBjb2xsaXNpb24gZXZlbnRzIHdpdGggY29udGFpbmVyLlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge2pRdWVyeX0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gdGVzdCBmb3IgY29sbGlzaW9ucy5cbiAqIEBwYXJhbSB7alF1ZXJ5fSBwYXJlbnQgLSBqUXVlcnkgb2JqZWN0IHRvIHVzZSBhcyBib3VuZGluZyBjb250YWluZXIuXG4gKiBAcGFyYW0ge0Jvb2xlYW59IGxyT25seSAtIHNldCB0byB0cnVlIHRvIGNoZWNrIGxlZnQgYW5kIHJpZ2h0IHZhbHVlcyBvbmx5LlxuICogQHBhcmFtIHtCb29sZWFufSB0Yk9ubHkgLSBzZXQgdG8gdHJ1ZSB0byBjaGVjayB0b3AgYW5kIGJvdHRvbSB2YWx1ZXMgb25seS5cbiAqIEBkZWZhdWx0IGlmIG5vIHBhcmVudCBvYmplY3QgcGFzc2VkLCBkZXRlY3RzIGNvbGxpc2lvbnMgd2l0aCBgd2luZG93YC5cbiAqIEByZXR1cm5zIHtCb29sZWFufSAtIHRydWUgaWYgY29sbGlzaW9uIGZyZWUsIGZhbHNlIGlmIGEgY29sbGlzaW9uIGluIGFueSBkaXJlY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIEltTm90VG91Y2hpbmdZb3UoZWxlbWVudCwgcGFyZW50LCBsck9ubHksIHRiT25seSkge1xuICB2YXIgZWxlRGltcyA9IEdldERpbWVuc2lvbnMoZWxlbWVudCksXG4gICAgICB0b3AsIGJvdHRvbSwgbGVmdCwgcmlnaHQ7XG5cbiAgaWYgKHBhcmVudCkge1xuICAgIHZhciBwYXJEaW1zID0gR2V0RGltZW5zaW9ucyhwYXJlbnQpO1xuXG4gICAgYm90dG9tID0gKGVsZURpbXMub2Zmc2V0LnRvcCArIGVsZURpbXMuaGVpZ2h0IDw9IHBhckRpbXMuaGVpZ2h0ICsgcGFyRGltcy5vZmZzZXQudG9wKTtcbiAgICB0b3AgICAgPSAoZWxlRGltcy5vZmZzZXQudG9wID49IHBhckRpbXMub2Zmc2V0LnRvcCk7XG4gICAgbGVmdCAgID0gKGVsZURpbXMub2Zmc2V0LmxlZnQgPj0gcGFyRGltcy5vZmZzZXQubGVmdCk7XG4gICAgcmlnaHQgID0gKGVsZURpbXMub2Zmc2V0LmxlZnQgKyBlbGVEaW1zLndpZHRoIDw9IHBhckRpbXMud2lkdGggKyBwYXJEaW1zLm9mZnNldC5sZWZ0KTtcbiAgfVxuICBlbHNlIHtcbiAgICBib3R0b20gPSAoZWxlRGltcy5vZmZzZXQudG9wICsgZWxlRGltcy5oZWlnaHQgPD0gZWxlRGltcy53aW5kb3dEaW1zLmhlaWdodCArIGVsZURpbXMud2luZG93RGltcy5vZmZzZXQudG9wKTtcbiAgICB0b3AgICAgPSAoZWxlRGltcy5vZmZzZXQudG9wID49IGVsZURpbXMud2luZG93RGltcy5vZmZzZXQudG9wKTtcbiAgICBsZWZ0ICAgPSAoZWxlRGltcy5vZmZzZXQubGVmdCA+PSBlbGVEaW1zLndpbmRvd0RpbXMub2Zmc2V0LmxlZnQpO1xuICAgIHJpZ2h0ICA9IChlbGVEaW1zLm9mZnNldC5sZWZ0ICsgZWxlRGltcy53aWR0aCA8PSBlbGVEaW1zLndpbmRvd0RpbXMud2lkdGgpO1xuICB9XG5cbiAgdmFyIGFsbERpcnMgPSBbYm90dG9tLCB0b3AsIGxlZnQsIHJpZ2h0XTtcblxuICBpZiAobHJPbmx5KSB7XG4gICAgcmV0dXJuIGxlZnQgPT09IHJpZ2h0ID09PSB0cnVlO1xuICB9XG5cbiAgaWYgKHRiT25seSkge1xuICAgIHJldHVybiB0b3AgPT09IGJvdHRvbSA9PT0gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiBhbGxEaXJzLmluZGV4T2YoZmFsc2UpID09PSAtMTtcbn07XG5cbi8qKlxuICogVXNlcyBuYXRpdmUgbWV0aG9kcyB0byByZXR1cm4gYW4gb2JqZWN0IG9mIGRpbWVuc2lvbiB2YWx1ZXMuXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7alF1ZXJ5IHx8IEhUTUx9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IG9yIERPTSBlbGVtZW50IGZvciB3aGljaCB0byBnZXQgdGhlIGRpbWVuc2lvbnMuIENhbiBiZSBhbnkgZWxlbWVudCBvdGhlciB0aGF0IGRvY3VtZW50IG9yIHdpbmRvdy5cbiAqIEByZXR1cm5zIHtPYmplY3R9IC0gbmVzdGVkIG9iamVjdCBvZiBpbnRlZ2VyIHBpeGVsIHZhbHVlc1xuICogVE9ETyAtIGlmIGVsZW1lbnQgaXMgd2luZG93LCByZXR1cm4gb25seSB0aG9zZSB2YWx1ZXMuXG4gKi9cbmZ1bmN0aW9uIEdldERpbWVuc2lvbnMoZWxlbSwgdGVzdCl7XG4gIGVsZW0gPSBlbGVtLmxlbmd0aCA/IGVsZW1bMF0gOiBlbGVtO1xuXG4gIGlmIChlbGVtID09PSB3aW5kb3cgfHwgZWxlbSA9PT0gZG9jdW1lbnQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJJJ20gc29ycnksIERhdmUuIEknbSBhZnJhaWQgSSBjYW4ndCBkbyB0aGF0LlwiKTtcbiAgfVxuXG4gIHZhciByZWN0ID0gZWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcbiAgICAgIHBhclJlY3QgPSBlbGVtLnBhcmVudE5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksXG4gICAgICB3aW5SZWN0ID0gZG9jdW1lbnQuYm9keS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcbiAgICAgIHdpblkgPSB3aW5kb3cucGFnZVlPZmZzZXQsXG4gICAgICB3aW5YID0gd2luZG93LnBhZ2VYT2Zmc2V0O1xuXG4gIHJldHVybiB7XG4gICAgd2lkdGg6IHJlY3Qud2lkdGgsXG4gICAgaGVpZ2h0OiByZWN0LmhlaWdodCxcbiAgICBvZmZzZXQ6IHtcbiAgICAgIHRvcDogcmVjdC50b3AgKyB3aW5ZLFxuICAgICAgbGVmdDogcmVjdC5sZWZ0ICsgd2luWFxuICAgIH0sXG4gICAgcGFyZW50RGltczoge1xuICAgICAgd2lkdGg6IHBhclJlY3Qud2lkdGgsXG4gICAgICBoZWlnaHQ6IHBhclJlY3QuaGVpZ2h0LFxuICAgICAgb2Zmc2V0OiB7XG4gICAgICAgIHRvcDogcGFyUmVjdC50b3AgKyB3aW5ZLFxuICAgICAgICBsZWZ0OiBwYXJSZWN0LmxlZnQgKyB3aW5YXG4gICAgICB9XG4gICAgfSxcbiAgICB3aW5kb3dEaW1zOiB7XG4gICAgICB3aWR0aDogd2luUmVjdC53aWR0aCxcbiAgICAgIGhlaWdodDogd2luUmVjdC5oZWlnaHQsXG4gICAgICBvZmZzZXQ6IHtcbiAgICAgICAgdG9wOiB3aW5ZLFxuICAgICAgICBsZWZ0OiB3aW5YXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogUmV0dXJucyBhbiBvYmplY3Qgb2YgdG9wIGFuZCBsZWZ0IGludGVnZXIgcGl4ZWwgdmFsdWVzIGZvciBkeW5hbWljYWxseSByZW5kZXJlZCBlbGVtZW50cyxcbiAqIHN1Y2ggYXM6IFRvb2x0aXAsIFJldmVhbCwgYW5kIERyb3Bkb3duXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7alF1ZXJ5fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCBmb3IgdGhlIGVsZW1lbnQgYmVpbmcgcG9zaXRpb25lZC5cbiAqIEBwYXJhbSB7alF1ZXJ5fSBhbmNob3IgLSBqUXVlcnkgb2JqZWN0IGZvciB0aGUgZWxlbWVudCdzIGFuY2hvciBwb2ludC5cbiAqIEBwYXJhbSB7U3RyaW5nfSBwb3NpdGlvbiAtIGEgc3RyaW5nIHJlbGF0aW5nIHRvIHRoZSBkZXNpcmVkIHBvc2l0aW9uIG9mIHRoZSBlbGVtZW50LCByZWxhdGl2ZSB0byBpdCdzIGFuY2hvclxuICogQHBhcmFtIHtOdW1iZXJ9IHZPZmZzZXQgLSBpbnRlZ2VyIHBpeGVsIHZhbHVlIG9mIGRlc2lyZWQgdmVydGljYWwgc2VwYXJhdGlvbiBiZXR3ZWVuIGFuY2hvciBhbmQgZWxlbWVudC5cbiAqIEBwYXJhbSB7TnVtYmVyfSBoT2Zmc2V0IC0gaW50ZWdlciBwaXhlbCB2YWx1ZSBvZiBkZXNpcmVkIGhvcml6b250YWwgc2VwYXJhdGlvbiBiZXR3ZWVuIGFuY2hvciBhbmQgZWxlbWVudC5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gaXNPdmVyZmxvdyAtIGlmIGEgY29sbGlzaW9uIGV2ZW50IGlzIGRldGVjdGVkLCBzZXRzIHRvIHRydWUgdG8gZGVmYXVsdCB0aGUgZWxlbWVudCB0byBmdWxsIHdpZHRoIC0gYW55IGRlc2lyZWQgb2Zmc2V0LlxuICogVE9ETyBhbHRlci9yZXdyaXRlIHRvIHdvcmsgd2l0aCBgZW1gIHZhbHVlcyBhcyB3ZWxsL2luc3RlYWQgb2YgcGl4ZWxzXG4gKi9cbmZ1bmN0aW9uIEdldE9mZnNldHMoZWxlbWVudCwgYW5jaG9yLCBwb3NpdGlvbiwgdk9mZnNldCwgaE9mZnNldCwgaXNPdmVyZmxvdykge1xuICB2YXIgJGVsZURpbXMgPSBHZXREaW1lbnNpb25zKGVsZW1lbnQpLFxuICAgICAgJGFuY2hvckRpbXMgPSBhbmNob3IgPyBHZXREaW1lbnNpb25zKGFuY2hvcikgOiBudWxsO1xuXG4gIHN3aXRjaCAocG9zaXRpb24pIHtcbiAgICBjYXNlICd0b3AnOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogKEZvdW5kYXRpb24ucnRsKCkgPyAkYW5jaG9yRGltcy5vZmZzZXQubGVmdCAtICRlbGVEaW1zLndpZHRoICsgJGFuY2hvckRpbXMud2lkdGggOiAkYW5jaG9yRGltcy5vZmZzZXQubGVmdCksXG4gICAgICAgIHRvcDogJGFuY2hvckRpbXMub2Zmc2V0LnRvcCAtICgkZWxlRGltcy5oZWlnaHQgKyB2T2Zmc2V0KVxuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnbGVmdCc6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsZWZ0OiAkYW5jaG9yRGltcy5vZmZzZXQubGVmdCAtICgkZWxlRGltcy53aWR0aCArIGhPZmZzZXQpLFxuICAgICAgICB0b3A6ICRhbmNob3JEaW1zLm9mZnNldC50b3BcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ3JpZ2h0JzpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxlZnQ6ICRhbmNob3JEaW1zLm9mZnNldC5sZWZ0ICsgJGFuY2hvckRpbXMud2lkdGggKyBoT2Zmc2V0LFxuICAgICAgICB0b3A6ICRhbmNob3JEaW1zLm9mZnNldC50b3BcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ2NlbnRlciB0b3AnOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogKCRhbmNob3JEaW1zLm9mZnNldC5sZWZ0ICsgKCRhbmNob3JEaW1zLndpZHRoIC8gMikpIC0gKCRlbGVEaW1zLndpZHRoIC8gMiksXG4gICAgICAgIHRvcDogJGFuY2hvckRpbXMub2Zmc2V0LnRvcCAtICgkZWxlRGltcy5oZWlnaHQgKyB2T2Zmc2V0KVxuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnY2VudGVyIGJvdHRvbSc6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsZWZ0OiBpc092ZXJmbG93ID8gaE9mZnNldCA6ICgoJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQgKyAoJGFuY2hvckRpbXMud2lkdGggLyAyKSkgLSAoJGVsZURpbXMud2lkdGggLyAyKSksXG4gICAgICAgIHRvcDogJGFuY2hvckRpbXMub2Zmc2V0LnRvcCArICRhbmNob3JEaW1zLmhlaWdodCArIHZPZmZzZXRcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ2NlbnRlciBsZWZ0JzpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxlZnQ6ICRhbmNob3JEaW1zLm9mZnNldC5sZWZ0IC0gKCRlbGVEaW1zLndpZHRoICsgaE9mZnNldCksXG4gICAgICAgIHRvcDogKCRhbmNob3JEaW1zLm9mZnNldC50b3AgKyAoJGFuY2hvckRpbXMuaGVpZ2h0IC8gMikpIC0gKCRlbGVEaW1zLmhlaWdodCAvIDIpXG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlICdjZW50ZXIgcmlnaHQnOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQgKyAkYW5jaG9yRGltcy53aWR0aCArIGhPZmZzZXQgKyAxLFxuICAgICAgICB0b3A6ICgkYW5jaG9yRGltcy5vZmZzZXQudG9wICsgKCRhbmNob3JEaW1zLmhlaWdodCAvIDIpKSAtICgkZWxlRGltcy5oZWlnaHQgLyAyKVxuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnY2VudGVyJzpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxlZnQ6ICgkZWxlRGltcy53aW5kb3dEaW1zLm9mZnNldC5sZWZ0ICsgKCRlbGVEaW1zLndpbmRvd0RpbXMud2lkdGggLyAyKSkgLSAoJGVsZURpbXMud2lkdGggLyAyKSxcbiAgICAgICAgdG9wOiAoJGVsZURpbXMud2luZG93RGltcy5vZmZzZXQudG9wICsgKCRlbGVEaW1zLndpbmRvd0RpbXMuaGVpZ2h0IC8gMikpIC0gKCRlbGVEaW1zLmhlaWdodCAvIDIpXG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlICdyZXZlYWwnOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogKCRlbGVEaW1zLndpbmRvd0RpbXMud2lkdGggLSAkZWxlRGltcy53aWR0aCkgLyAyLFxuICAgICAgICB0b3A6ICRlbGVEaW1zLndpbmRvd0RpbXMub2Zmc2V0LnRvcCArIHZPZmZzZXRcbiAgICAgIH1cbiAgICBjYXNlICdyZXZlYWwgZnVsbCc6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsZWZ0OiAkZWxlRGltcy53aW5kb3dEaW1zLm9mZnNldC5sZWZ0LFxuICAgICAgICB0b3A6ICRlbGVEaW1zLndpbmRvd0RpbXMub2Zmc2V0LnRvcFxuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnbGVmdCBib3R0b20nOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQsXG4gICAgICAgIHRvcDogJGFuY2hvckRpbXMub2Zmc2V0LnRvcCArICRhbmNob3JEaW1zLmhlaWdodCArIHZPZmZzZXRcbiAgICAgIH07XG4gICAgICBicmVhaztcbiAgICBjYXNlICdyaWdodCBib3R0b20nOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQgKyAkYW5jaG9yRGltcy53aWR0aCArIGhPZmZzZXQgLSAkZWxlRGltcy53aWR0aCxcbiAgICAgICAgdG9wOiAkYW5jaG9yRGltcy5vZmZzZXQudG9wICsgJGFuY2hvckRpbXMuaGVpZ2h0ICsgdk9mZnNldFxuICAgICAgfTtcbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsZWZ0OiAoRm91bmRhdGlvbi5ydGwoKSA/ICRhbmNob3JEaW1zLm9mZnNldC5sZWZ0IC0gJGVsZURpbXMud2lkdGggKyAkYW5jaG9yRGltcy53aWR0aCA6ICRhbmNob3JEaW1zLm9mZnNldC5sZWZ0ICsgaE9mZnNldCksXG4gICAgICAgIHRvcDogJGFuY2hvckRpbXMub2Zmc2V0LnRvcCArICRhbmNob3JEaW1zLmhlaWdodCArIHZPZmZzZXRcbiAgICAgIH1cbiAgfVxufVxuXG59KGpRdWVyeSk7XG4iLCIvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqIFRoaXMgdXRpbCB3YXMgY3JlYXRlZCBieSBNYXJpdXMgT2xiZXJ0eiAqXG4gKiBQbGVhc2UgdGhhbmsgTWFyaXVzIG9uIEdpdEh1YiAvb3dsYmVydHogKlxuICogb3IgdGhlIHdlYiBodHRwOi8vd3d3Lm1hcml1c29sYmVydHouZGUvICpcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4ndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbmNvbnN0IGtleUNvZGVzID0ge1xuICA5OiAnVEFCJyxcbiAgMTM6ICdFTlRFUicsXG4gIDI3OiAnRVNDQVBFJyxcbiAgMzI6ICdTUEFDRScsXG4gIDM3OiAnQVJST1dfTEVGVCcsXG4gIDM4OiAnQVJST1dfVVAnLFxuICAzOTogJ0FSUk9XX1JJR0hUJyxcbiAgNDA6ICdBUlJPV19ET1dOJ1xufVxuXG52YXIgY29tbWFuZHMgPSB7fVxuXG52YXIgS2V5Ym9hcmQgPSB7XG4gIGtleXM6IGdldEtleUNvZGVzKGtleUNvZGVzKSxcblxuICAvKipcbiAgICogUGFyc2VzIHRoZSAoa2V5Ym9hcmQpIGV2ZW50IGFuZCByZXR1cm5zIGEgU3RyaW5nIHRoYXQgcmVwcmVzZW50cyBpdHMga2V5XG4gICAqIENhbiBiZSB1c2VkIGxpa2UgRm91bmRhdGlvbi5wYXJzZUtleShldmVudCkgPT09IEZvdW5kYXRpb24ua2V5cy5TUEFDRVxuICAgKiBAcGFyYW0ge0V2ZW50fSBldmVudCAtIHRoZSBldmVudCBnZW5lcmF0ZWQgYnkgdGhlIGV2ZW50IGhhbmRsZXJcbiAgICogQHJldHVybiBTdHJpbmcga2V5IC0gU3RyaW5nIHRoYXQgcmVwcmVzZW50cyB0aGUga2V5IHByZXNzZWRcbiAgICovXG4gIHBhcnNlS2V5KGV2ZW50KSB7XG4gICAgdmFyIGtleSA9IGtleUNvZGVzW2V2ZW50LndoaWNoIHx8IGV2ZW50LmtleUNvZGVdIHx8IFN0cmluZy5mcm9tQ2hhckNvZGUoZXZlbnQud2hpY2gpLnRvVXBwZXJDYXNlKCk7XG5cbiAgICAvLyBSZW1vdmUgdW4tcHJpbnRhYmxlIGNoYXJhY3RlcnMsIGUuZy4gZm9yIGBmcm9tQ2hhckNvZGVgIGNhbGxzIGZvciBDVFJMIG9ubHkgZXZlbnRzXG4gICAga2V5ID0ga2V5LnJlcGxhY2UoL1xcVysvLCAnJyk7XG5cbiAgICBpZiAoZXZlbnQuc2hpZnRLZXkpIGtleSA9IGBTSElGVF8ke2tleX1gO1xuICAgIGlmIChldmVudC5jdHJsS2V5KSBrZXkgPSBgQ1RSTF8ke2tleX1gO1xuICAgIGlmIChldmVudC5hbHRLZXkpIGtleSA9IGBBTFRfJHtrZXl9YDtcblxuICAgIC8vIFJlbW92ZSB0cmFpbGluZyB1bmRlcnNjb3JlLCBpbiBjYXNlIG9ubHkgbW9kaWZpZXJzIHdlcmUgdXNlZCAoZS5nLiBvbmx5IGBDVFJMX0FMVGApXG4gICAga2V5ID0ga2V5LnJlcGxhY2UoL18kLywgJycpO1xuXG4gICAgcmV0dXJuIGtleTtcbiAgfSxcblxuICAvKipcbiAgICogSGFuZGxlcyB0aGUgZ2l2ZW4gKGtleWJvYXJkKSBldmVudFxuICAgKiBAcGFyYW0ge0V2ZW50fSBldmVudCAtIHRoZSBldmVudCBnZW5lcmF0ZWQgYnkgdGhlIGV2ZW50IGhhbmRsZXJcbiAgICogQHBhcmFtIHtTdHJpbmd9IGNvbXBvbmVudCAtIEZvdW5kYXRpb24gY29tcG9uZW50J3MgbmFtZSwgZS5nLiBTbGlkZXIgb3IgUmV2ZWFsXG4gICAqIEBwYXJhbSB7T2JqZWN0c30gZnVuY3Rpb25zIC0gY29sbGVjdGlvbiBvZiBmdW5jdGlvbnMgdGhhdCBhcmUgdG8gYmUgZXhlY3V0ZWRcbiAgICovXG4gIGhhbmRsZUtleShldmVudCwgY29tcG9uZW50LCBmdW5jdGlvbnMpIHtcbiAgICB2YXIgY29tbWFuZExpc3QgPSBjb21tYW5kc1tjb21wb25lbnRdLFxuICAgICAga2V5Q29kZSA9IHRoaXMucGFyc2VLZXkoZXZlbnQpLFxuICAgICAgY21kcyxcbiAgICAgIGNvbW1hbmQsXG4gICAgICBmbjtcblxuICAgIGlmICghY29tbWFuZExpc3QpIHJldHVybiBjb25zb2xlLndhcm4oJ0NvbXBvbmVudCBub3QgZGVmaW5lZCEnKTtcblxuICAgIGlmICh0eXBlb2YgY29tbWFuZExpc3QubHRyID09PSAndW5kZWZpbmVkJykgeyAvLyB0aGlzIGNvbXBvbmVudCBkb2VzIG5vdCBkaWZmZXJlbnRpYXRlIGJldHdlZW4gbHRyIGFuZCBydGxcbiAgICAgICAgY21kcyA9IGNvbW1hbmRMaXN0OyAvLyB1c2UgcGxhaW4gbGlzdFxuICAgIH0gZWxzZSB7IC8vIG1lcmdlIGx0ciBhbmQgcnRsOiBpZiBkb2N1bWVudCBpcyBydGwsIHJ0bCBvdmVyd3JpdGVzIGx0ciBhbmQgdmljZSB2ZXJzYVxuICAgICAgICBpZiAoRm91bmRhdGlvbi5ydGwoKSkgY21kcyA9ICQuZXh0ZW5kKHt9LCBjb21tYW5kTGlzdC5sdHIsIGNvbW1hbmRMaXN0LnJ0bCk7XG5cbiAgICAgICAgZWxzZSBjbWRzID0gJC5leHRlbmQoe30sIGNvbW1hbmRMaXN0LnJ0bCwgY29tbWFuZExpc3QubHRyKTtcbiAgICB9XG4gICAgY29tbWFuZCA9IGNtZHNba2V5Q29kZV07XG5cbiAgICBmbiA9IGZ1bmN0aW9uc1tjb21tYW5kXTtcbiAgICBpZiAoZm4gJiYgdHlwZW9mIGZuID09PSAnZnVuY3Rpb24nKSB7IC8vIGV4ZWN1dGUgZnVuY3Rpb24gIGlmIGV4aXN0c1xuICAgICAgdmFyIHJldHVyblZhbHVlID0gZm4uYXBwbHkoKTtcbiAgICAgIGlmIChmdW5jdGlvbnMuaGFuZGxlZCB8fCB0eXBlb2YgZnVuY3Rpb25zLmhhbmRsZWQgPT09ICdmdW5jdGlvbicpIHsgLy8gZXhlY3V0ZSBmdW5jdGlvbiB3aGVuIGV2ZW50IHdhcyBoYW5kbGVkXG4gICAgICAgICAgZnVuY3Rpb25zLmhhbmRsZWQocmV0dXJuVmFsdWUpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoZnVuY3Rpb25zLnVuaGFuZGxlZCB8fCB0eXBlb2YgZnVuY3Rpb25zLnVuaGFuZGxlZCA9PT0gJ2Z1bmN0aW9uJykgeyAvLyBleGVjdXRlIGZ1bmN0aW9uIHdoZW4gZXZlbnQgd2FzIG5vdCBoYW5kbGVkXG4gICAgICAgICAgZnVuY3Rpb25zLnVuaGFuZGxlZCgpO1xuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogRmluZHMgYWxsIGZvY3VzYWJsZSBlbGVtZW50cyB3aXRoaW4gdGhlIGdpdmVuIGAkZWxlbWVudGBcbiAgICogQHBhcmFtIHtqUXVlcnl9ICRlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBzZWFyY2ggd2l0aGluXG4gICAqIEByZXR1cm4ge2pRdWVyeX0gJGZvY3VzYWJsZSAtIGFsbCBmb2N1c2FibGUgZWxlbWVudHMgd2l0aGluIGAkZWxlbWVudGBcbiAgICovXG4gIGZpbmRGb2N1c2FibGUoJGVsZW1lbnQpIHtcbiAgICBpZighJGVsZW1lbnQpIHtyZXR1cm4gZmFsc2U7IH1cbiAgICByZXR1cm4gJGVsZW1lbnQuZmluZCgnYVtocmVmXSwgYXJlYVtocmVmXSwgaW5wdXQ6bm90KFtkaXNhYmxlZF0pLCBzZWxlY3Q6bm90KFtkaXNhYmxlZF0pLCB0ZXh0YXJlYTpub3QoW2Rpc2FibGVkXSksIGJ1dHRvbjpub3QoW2Rpc2FibGVkXSksIGlmcmFtZSwgb2JqZWN0LCBlbWJlZCwgKlt0YWJpbmRleF0sICpbY29udGVudGVkaXRhYmxlXScpLmZpbHRlcihmdW5jdGlvbigpIHtcbiAgICAgIGlmICghJCh0aGlzKS5pcygnOnZpc2libGUnKSB8fCAkKHRoaXMpLmF0dHIoJ3RhYmluZGV4JykgPCAwKSB7IHJldHVybiBmYWxzZTsgfSAvL29ubHkgaGF2ZSB2aXNpYmxlIGVsZW1lbnRzIGFuZCB0aG9zZSB0aGF0IGhhdmUgYSB0YWJpbmRleCBncmVhdGVyIG9yIGVxdWFsIDBcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pO1xuICB9LFxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBjb21wb25lbnQgbmFtZSBuYW1lXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBjb21wb25lbnQgLSBGb3VuZGF0aW9uIGNvbXBvbmVudCwgZS5nLiBTbGlkZXIgb3IgUmV2ZWFsXG4gICAqIEByZXR1cm4gU3RyaW5nIGNvbXBvbmVudE5hbWVcbiAgICovXG5cbiAgcmVnaXN0ZXIoY29tcG9uZW50TmFtZSwgY21kcykge1xuICAgIGNvbW1hbmRzW2NvbXBvbmVudE5hbWVdID0gY21kcztcbiAgfSwgIFxuXG4gIC8qKlxuICAgKiBUcmFwcyB0aGUgZm9jdXMgaW4gdGhlIGdpdmVuIGVsZW1lbnQuXG4gICAqIEBwYXJhbSAge2pRdWVyeX0gJGVsZW1lbnQgIGpRdWVyeSBvYmplY3QgdG8gdHJhcCB0aGUgZm91Y3MgaW50by5cbiAgICovXG4gIHRyYXBGb2N1cygkZWxlbWVudCkge1xuICAgIHZhciAkZm9jdXNhYmxlID0gRm91bmRhdGlvbi5LZXlib2FyZC5maW5kRm9jdXNhYmxlKCRlbGVtZW50KSxcbiAgICAgICAgJGZpcnN0Rm9jdXNhYmxlID0gJGZvY3VzYWJsZS5lcSgwKSxcbiAgICAgICAgJGxhc3RGb2N1c2FibGUgPSAkZm9jdXNhYmxlLmVxKC0xKTtcblxuICAgICRlbGVtZW50Lm9uKCdrZXlkb3duLnpmLnRyYXBmb2N1cycsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICBpZiAoZXZlbnQudGFyZ2V0ID09PSAkbGFzdEZvY3VzYWJsZVswXSAmJiBGb3VuZGF0aW9uLktleWJvYXJkLnBhcnNlS2V5KGV2ZW50KSA9PT0gJ1RBQicpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgJGZpcnN0Rm9jdXNhYmxlLmZvY3VzKCk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChldmVudC50YXJnZXQgPT09ICRmaXJzdEZvY3VzYWJsZVswXSAmJiBGb3VuZGF0aW9uLktleWJvYXJkLnBhcnNlS2V5KGV2ZW50KSA9PT0gJ1NISUZUX1RBQicpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgJGxhc3RGb2N1c2FibGUuZm9jdXMoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSxcbiAgLyoqXG4gICAqIFJlbGVhc2VzIHRoZSB0cmFwcGVkIGZvY3VzIGZyb20gdGhlIGdpdmVuIGVsZW1lbnQuXG4gICAqIEBwYXJhbSAge2pRdWVyeX0gJGVsZW1lbnQgIGpRdWVyeSBvYmplY3QgdG8gcmVsZWFzZSB0aGUgZm9jdXMgZm9yLlxuICAgKi9cbiAgcmVsZWFzZUZvY3VzKCRlbGVtZW50KSB7XG4gICAgJGVsZW1lbnQub2ZmKCdrZXlkb3duLnpmLnRyYXBmb2N1cycpO1xuICB9XG59XG5cbi8qXG4gKiBDb25zdGFudHMgZm9yIGVhc2llciBjb21wYXJpbmcuXG4gKiBDYW4gYmUgdXNlZCBsaWtlIEZvdW5kYXRpb24ucGFyc2VLZXkoZXZlbnQpID09PSBGb3VuZGF0aW9uLmtleXMuU1BBQ0VcbiAqL1xuZnVuY3Rpb24gZ2V0S2V5Q29kZXMoa2NzKSB7XG4gIHZhciBrID0ge307XG4gIGZvciAodmFyIGtjIGluIGtjcykga1trY3Nba2NdXSA9IGtjc1trY107XG4gIHJldHVybiBrO1xufVxuXG5Gb3VuZGF0aW9uLktleWJvYXJkID0gS2V5Ym9hcmQ7XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuLy8gRGVmYXVsdCBzZXQgb2YgbWVkaWEgcXVlcmllc1xuY29uc3QgZGVmYXVsdFF1ZXJpZXMgPSB7XG4gICdkZWZhdWx0JyA6ICdvbmx5IHNjcmVlbicsXG4gIGxhbmRzY2FwZSA6ICdvbmx5IHNjcmVlbiBhbmQgKG9yaWVudGF0aW9uOiBsYW5kc2NhcGUpJyxcbiAgcG9ydHJhaXQgOiAnb25seSBzY3JlZW4gYW5kIChvcmllbnRhdGlvbjogcG9ydHJhaXQpJyxcbiAgcmV0aW5hIDogJ29ubHkgc2NyZWVuIGFuZCAoLXdlYmtpdC1taW4tZGV2aWNlLXBpeGVsLXJhdGlvOiAyKSwnICtcbiAgICAnb25seSBzY3JlZW4gYW5kIChtaW4tLW1vei1kZXZpY2UtcGl4ZWwtcmF0aW86IDIpLCcgK1xuICAgICdvbmx5IHNjcmVlbiBhbmQgKC1vLW1pbi1kZXZpY2UtcGl4ZWwtcmF0aW86IDIvMSksJyArXG4gICAgJ29ubHkgc2NyZWVuIGFuZCAobWluLWRldmljZS1waXhlbC1yYXRpbzogMiksJyArXG4gICAgJ29ubHkgc2NyZWVuIGFuZCAobWluLXJlc29sdXRpb246IDE5MmRwaSksJyArXG4gICAgJ29ubHkgc2NyZWVuIGFuZCAobWluLXJlc29sdXRpb246IDJkcHB4KSdcbn07XG5cbnZhciBNZWRpYVF1ZXJ5ID0ge1xuICBxdWVyaWVzOiBbXSxcblxuICBjdXJyZW50OiAnJyxcblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgdGhlIG1lZGlhIHF1ZXJ5IGhlbHBlciwgYnkgZXh0cmFjdGluZyB0aGUgYnJlYWtwb2ludCBsaXN0IGZyb20gdGhlIENTUyBhbmQgYWN0aXZhdGluZyB0aGUgYnJlYWtwb2ludCB3YXRjaGVyLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9pbml0KCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgZXh0cmFjdGVkU3R5bGVzID0gJCgnLmZvdW5kYXRpb24tbXEnKS5jc3MoJ2ZvbnQtZmFtaWx5Jyk7XG4gICAgdmFyIG5hbWVkUXVlcmllcztcblxuICAgIG5hbWVkUXVlcmllcyA9IHBhcnNlU3R5bGVUb09iamVjdChleHRyYWN0ZWRTdHlsZXMpO1xuXG4gICAgZm9yICh2YXIga2V5IGluIG5hbWVkUXVlcmllcykge1xuICAgICAgaWYobmFtZWRRdWVyaWVzLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgc2VsZi5xdWVyaWVzLnB1c2goe1xuICAgICAgICAgIG5hbWU6IGtleSxcbiAgICAgICAgICB2YWx1ZTogYG9ubHkgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAke25hbWVkUXVlcmllc1trZXldfSlgXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuY3VycmVudCA9IHRoaXMuX2dldEN1cnJlbnRTaXplKCk7XG5cbiAgICB0aGlzLl93YXRjaGVyKCk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGUgc2NyZWVuIGlzIGF0IGxlYXN0IGFzIHdpZGUgYXMgYSBicmVha3BvaW50LlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHBhcmFtIHtTdHJpbmd9IHNpemUgLSBOYW1lIG9mIHRoZSBicmVha3BvaW50IHRvIGNoZWNrLlxuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gYHRydWVgIGlmIHRoZSBicmVha3BvaW50IG1hdGNoZXMsIGBmYWxzZWAgaWYgaXQncyBzbWFsbGVyLlxuICAgKi9cbiAgYXRMZWFzdChzaXplKSB7XG4gICAgdmFyIHF1ZXJ5ID0gdGhpcy5nZXQoc2l6ZSk7XG5cbiAgICBpZiAocXVlcnkpIHtcbiAgICAgIHJldHVybiB3aW5kb3cubWF0Y2hNZWRpYShxdWVyeSkubWF0Y2hlcztcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGUgc2NyZWVuIG1hdGNoZXMgdG8gYSBicmVha3BvaW50LlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHBhcmFtIHtTdHJpbmd9IHNpemUgLSBOYW1lIG9mIHRoZSBicmVha3BvaW50IHRvIGNoZWNrLCBlaXRoZXIgJ3NtYWxsIG9ubHknIG9yICdzbWFsbCcuIE9taXR0aW5nICdvbmx5JyBmYWxscyBiYWNrIHRvIHVzaW5nIGF0TGVhc3QoKSBtZXRob2QuXG4gICAqIEByZXR1cm5zIHtCb29sZWFufSBgdHJ1ZWAgaWYgdGhlIGJyZWFrcG9pbnQgbWF0Y2hlcywgYGZhbHNlYCBpZiBpdCBkb2VzIG5vdC5cbiAgICovXG4gIGlzKHNpemUpIHtcbiAgICBzaXplID0gc2l6ZS50cmltKCkuc3BsaXQoJyAnKTtcbiAgICBpZihzaXplLmxlbmd0aCA+IDEgJiYgc2l6ZVsxXSA9PT0gJ29ubHknKSB7XG4gICAgICBpZihzaXplWzBdID09PSB0aGlzLl9nZXRDdXJyZW50U2l6ZSgpKSByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuYXRMZWFzdChzaXplWzBdKTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9LFxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBtZWRpYSBxdWVyeSBvZiBhIGJyZWFrcG9pbnQuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcGFyYW0ge1N0cmluZ30gc2l6ZSAtIE5hbWUgb2YgdGhlIGJyZWFrcG9pbnQgdG8gZ2V0LlxuICAgKiBAcmV0dXJucyB7U3RyaW5nfG51bGx9IC0gVGhlIG1lZGlhIHF1ZXJ5IG9mIHRoZSBicmVha3BvaW50LCBvciBgbnVsbGAgaWYgdGhlIGJyZWFrcG9pbnQgZG9lc24ndCBleGlzdC5cbiAgICovXG4gIGdldChzaXplKSB7XG4gICAgZm9yICh2YXIgaSBpbiB0aGlzLnF1ZXJpZXMpIHtcbiAgICAgIGlmKHRoaXMucXVlcmllcy5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgICB2YXIgcXVlcnkgPSB0aGlzLnF1ZXJpZXNbaV07XG4gICAgICAgIGlmIChzaXplID09PSBxdWVyeS5uYW1lKSByZXR1cm4gcXVlcnkudmFsdWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGN1cnJlbnQgYnJlYWtwb2ludCBuYW1lIGJ5IHRlc3RpbmcgZXZlcnkgYnJlYWtwb2ludCBhbmQgcmV0dXJuaW5nIHRoZSBsYXN0IG9uZSB0byBtYXRjaCAodGhlIGJpZ2dlc3Qgb25lKS5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqIEByZXR1cm5zIHtTdHJpbmd9IE5hbWUgb2YgdGhlIGN1cnJlbnQgYnJlYWtwb2ludC5cbiAgICovXG4gIF9nZXRDdXJyZW50U2l6ZSgpIHtcbiAgICB2YXIgbWF0Y2hlZDtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5xdWVyaWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgcXVlcnkgPSB0aGlzLnF1ZXJpZXNbaV07XG5cbiAgICAgIGlmICh3aW5kb3cubWF0Y2hNZWRpYShxdWVyeS52YWx1ZSkubWF0Y2hlcykge1xuICAgICAgICBtYXRjaGVkID0gcXVlcnk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBtYXRjaGVkID09PSAnb2JqZWN0Jykge1xuICAgICAgcmV0dXJuIG1hdGNoZWQubmFtZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG1hdGNoZWQ7XG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBBY3RpdmF0ZXMgdGhlIGJyZWFrcG9pbnQgd2F0Y2hlciwgd2hpY2ggZmlyZXMgYW4gZXZlbnQgb24gdGhlIHdpbmRvdyB3aGVuZXZlciB0aGUgYnJlYWtwb2ludCBjaGFuZ2VzLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF93YXRjaGVyKCkge1xuICAgICQod2luZG93KS5vbigncmVzaXplLnpmLm1lZGlhcXVlcnknLCAoKSA9PiB7XG4gICAgICB2YXIgbmV3U2l6ZSA9IHRoaXMuX2dldEN1cnJlbnRTaXplKCksIGN1cnJlbnRTaXplID0gdGhpcy5jdXJyZW50O1xuXG4gICAgICBpZiAobmV3U2l6ZSAhPT0gY3VycmVudFNpemUpIHtcbiAgICAgICAgLy8gQ2hhbmdlIHRoZSBjdXJyZW50IG1lZGlhIHF1ZXJ5XG4gICAgICAgIHRoaXMuY3VycmVudCA9IG5ld1NpemU7XG5cbiAgICAgICAgLy8gQnJvYWRjYXN0IHRoZSBtZWRpYSBxdWVyeSBjaGFuZ2Ugb24gdGhlIHdpbmRvd1xuICAgICAgICAkKHdpbmRvdykudHJpZ2dlcignY2hhbmdlZC56Zi5tZWRpYXF1ZXJ5JywgW25ld1NpemUsIGN1cnJlbnRTaXplXSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn07XG5cbkZvdW5kYXRpb24uTWVkaWFRdWVyeSA9IE1lZGlhUXVlcnk7XG5cbi8vIG1hdGNoTWVkaWEoKSBwb2x5ZmlsbCAtIFRlc3QgYSBDU1MgbWVkaWEgdHlwZS9xdWVyeSBpbiBKUy5cbi8vIEF1dGhvcnMgJiBjb3B5cmlnaHQgKGMpIDIwMTI6IFNjb3R0IEplaGwsIFBhdWwgSXJpc2gsIE5pY2hvbGFzIFpha2FzLCBEYXZpZCBLbmlnaHQuIER1YWwgTUlUL0JTRCBsaWNlbnNlXG53aW5kb3cubWF0Y2hNZWRpYSB8fCAod2luZG93Lm1hdGNoTWVkaWEgPSBmdW5jdGlvbigpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIC8vIEZvciBicm93c2VycyB0aGF0IHN1cHBvcnQgbWF0Y2hNZWRpdW0gYXBpIHN1Y2ggYXMgSUUgOSBhbmQgd2Via2l0XG4gIHZhciBzdHlsZU1lZGlhID0gKHdpbmRvdy5zdHlsZU1lZGlhIHx8IHdpbmRvdy5tZWRpYSk7XG5cbiAgLy8gRm9yIHRob3NlIHRoYXQgZG9uJ3Qgc3VwcG9ydCBtYXRjaE1lZGl1bVxuICBpZiAoIXN0eWxlTWVkaWEpIHtcbiAgICB2YXIgc3R5bGUgICA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyksXG4gICAgc2NyaXB0ICAgICAgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnc2NyaXB0JylbMF0sXG4gICAgaW5mbyAgICAgICAgPSBudWxsO1xuXG4gICAgc3R5bGUudHlwZSAgPSAndGV4dC9jc3MnO1xuICAgIHN0eWxlLmlkICAgID0gJ21hdGNobWVkaWFqcy10ZXN0JztcblxuICAgIHNjcmlwdCAmJiBzY3JpcHQucGFyZW50Tm9kZSAmJiBzY3JpcHQucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoc3R5bGUsIHNjcmlwdCk7XG5cbiAgICAvLyAnc3R5bGUuY3VycmVudFN0eWxlJyBpcyB1c2VkIGJ5IElFIDw9IDggYW5kICd3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZScgZm9yIGFsbCBvdGhlciBicm93c2Vyc1xuICAgIGluZm8gPSAoJ2dldENvbXB1dGVkU3R5bGUnIGluIHdpbmRvdykgJiYgd2luZG93LmdldENvbXB1dGVkU3R5bGUoc3R5bGUsIG51bGwpIHx8IHN0eWxlLmN1cnJlbnRTdHlsZTtcblxuICAgIHN0eWxlTWVkaWEgPSB7XG4gICAgICBtYXRjaE1lZGl1bShtZWRpYSkge1xuICAgICAgICB2YXIgdGV4dCA9IGBAbWVkaWEgJHttZWRpYX17ICNtYXRjaG1lZGlhanMtdGVzdCB7IHdpZHRoOiAxcHg7IH0gfWA7XG5cbiAgICAgICAgLy8gJ3N0eWxlLnN0eWxlU2hlZXQnIGlzIHVzZWQgYnkgSUUgPD0gOCBhbmQgJ3N0eWxlLnRleHRDb250ZW50JyBmb3IgYWxsIG90aGVyIGJyb3dzZXJzXG4gICAgICAgIGlmIChzdHlsZS5zdHlsZVNoZWV0KSB7XG4gICAgICAgICAgc3R5bGUuc3R5bGVTaGVldC5jc3NUZXh0ID0gdGV4dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHlsZS50ZXh0Q29udGVudCA9IHRleHQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUZXN0IGlmIG1lZGlhIHF1ZXJ5IGlzIHRydWUgb3IgZmFsc2VcbiAgICAgICAgcmV0dXJuIGluZm8ud2lkdGggPT09ICcxcHgnO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmdW5jdGlvbihtZWRpYSkge1xuICAgIHJldHVybiB7XG4gICAgICBtYXRjaGVzOiBzdHlsZU1lZGlhLm1hdGNoTWVkaXVtKG1lZGlhIHx8ICdhbGwnKSxcbiAgICAgIG1lZGlhOiBtZWRpYSB8fCAnYWxsJ1xuICAgIH07XG4gIH1cbn0oKSk7XG5cbi8vIFRoYW5rIHlvdTogaHR0cHM6Ly9naXRodWIuY29tL3NpbmRyZXNvcmh1cy9xdWVyeS1zdHJpbmdcbmZ1bmN0aW9uIHBhcnNlU3R5bGVUb09iamVjdChzdHIpIHtcbiAgdmFyIHN0eWxlT2JqZWN0ID0ge307XG5cbiAgaWYgKHR5cGVvZiBzdHIgIT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIHN0eWxlT2JqZWN0O1xuICB9XG5cbiAgc3RyID0gc3RyLnRyaW0oKS5zbGljZSgxLCAtMSk7IC8vIGJyb3dzZXJzIHJlLXF1b3RlIHN0cmluZyBzdHlsZSB2YWx1ZXNcblxuICBpZiAoIXN0cikge1xuICAgIHJldHVybiBzdHlsZU9iamVjdDtcbiAgfVxuXG4gIHN0eWxlT2JqZWN0ID0gc3RyLnNwbGl0KCcmJykucmVkdWNlKGZ1bmN0aW9uKHJldCwgcGFyYW0pIHtcbiAgICB2YXIgcGFydHMgPSBwYXJhbS5yZXBsYWNlKC9cXCsvZywgJyAnKS5zcGxpdCgnPScpO1xuICAgIHZhciBrZXkgPSBwYXJ0c1swXTtcbiAgICB2YXIgdmFsID0gcGFydHNbMV07XG4gICAga2V5ID0gZGVjb2RlVVJJQ29tcG9uZW50KGtleSk7XG5cbiAgICAvLyBtaXNzaW5nIGA9YCBzaG91bGQgYmUgYG51bGxgOlxuICAgIC8vIGh0dHA6Ly93My5vcmcvVFIvMjAxMi9XRC11cmwtMjAxMjA1MjQvI2NvbGxlY3QtdXJsLXBhcmFtZXRlcnNcbiAgICB2YWwgPSB2YWwgPT09IHVuZGVmaW5lZCA/IG51bGwgOiBkZWNvZGVVUklDb21wb25lbnQodmFsKTtcblxuICAgIGlmICghcmV0Lmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgIHJldFtrZXldID0gdmFsO1xuICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShyZXRba2V5XSkpIHtcbiAgICAgIHJldFtrZXldLnB1c2godmFsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0W2tleV0gPSBbcmV0W2tleV0sIHZhbF07XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG4gIH0sIHt9KTtcblxuICByZXR1cm4gc3R5bGVPYmplY3Q7XG59XG5cbkZvdW5kYXRpb24uTWVkaWFRdWVyeSA9IE1lZGlhUXVlcnk7XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuLyoqXG4gKiBNb3Rpb24gbW9kdWxlLlxuICogQG1vZHVsZSBmb3VuZGF0aW9uLm1vdGlvblxuICovXG5cbmNvbnN0IGluaXRDbGFzc2VzICAgPSBbJ211aS1lbnRlcicsICdtdWktbGVhdmUnXTtcbmNvbnN0IGFjdGl2ZUNsYXNzZXMgPSBbJ211aS1lbnRlci1hY3RpdmUnLCAnbXVpLWxlYXZlLWFjdGl2ZSddO1xuXG5jb25zdCBNb3Rpb24gPSB7XG4gIGFuaW1hdGVJbjogZnVuY3Rpb24oZWxlbWVudCwgYW5pbWF0aW9uLCBjYikge1xuICAgIGFuaW1hdGUodHJ1ZSwgZWxlbWVudCwgYW5pbWF0aW9uLCBjYik7XG4gIH0sXG5cbiAgYW5pbWF0ZU91dDogZnVuY3Rpb24oZWxlbWVudCwgYW5pbWF0aW9uLCBjYikge1xuICAgIGFuaW1hdGUoZmFsc2UsIGVsZW1lbnQsIGFuaW1hdGlvbiwgY2IpO1xuICB9XG59XG5cbmZ1bmN0aW9uIE1vdmUoZHVyYXRpb24sIGVsZW0sIGZuKXtcbiAgdmFyIGFuaW0sIHByb2csIHN0YXJ0ID0gbnVsbDtcbiAgLy8gY29uc29sZS5sb2coJ2NhbGxlZCcpO1xuXG4gIGlmIChkdXJhdGlvbiA9PT0gMCkge1xuICAgIGZuLmFwcGx5KGVsZW0pO1xuICAgIGVsZW0udHJpZ2dlcignZmluaXNoZWQuemYuYW5pbWF0ZScsIFtlbGVtXSkudHJpZ2dlckhhbmRsZXIoJ2ZpbmlzaGVkLnpmLmFuaW1hdGUnLCBbZWxlbV0pO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGZ1bmN0aW9uIG1vdmUodHMpe1xuICAgIGlmKCFzdGFydCkgc3RhcnQgPSB0cztcbiAgICAvLyBjb25zb2xlLmxvZyhzdGFydCwgdHMpO1xuICAgIHByb2cgPSB0cyAtIHN0YXJ0O1xuICAgIGZuLmFwcGx5KGVsZW0pO1xuXG4gICAgaWYocHJvZyA8IGR1cmF0aW9uKXsgYW5pbSA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUobW92ZSwgZWxlbSk7IH1cbiAgICBlbHNle1xuICAgICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKGFuaW0pO1xuICAgICAgZWxlbS50cmlnZ2VyKCdmaW5pc2hlZC56Zi5hbmltYXRlJywgW2VsZW1dKS50cmlnZ2VySGFuZGxlcignZmluaXNoZWQuemYuYW5pbWF0ZScsIFtlbGVtXSk7XG4gICAgfVxuICB9XG4gIGFuaW0gPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKG1vdmUpO1xufVxuXG4vKipcbiAqIEFuaW1hdGVzIGFuIGVsZW1lbnQgaW4gb3Igb3V0IHVzaW5nIGEgQ1NTIHRyYW5zaXRpb24gY2xhc3MuXG4gKiBAZnVuY3Rpb25cbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0Jvb2xlYW59IGlzSW4gLSBEZWZpbmVzIGlmIHRoZSBhbmltYXRpb24gaXMgaW4gb3Igb3V0LlxuICogQHBhcmFtIHtPYmplY3R9IGVsZW1lbnQgLSBqUXVlcnkgb3IgSFRNTCBvYmplY3QgdG8gYW5pbWF0ZS5cbiAqIEBwYXJhbSB7U3RyaW5nfSBhbmltYXRpb24gLSBDU1MgY2xhc3MgdG8gdXNlLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgLSBDYWxsYmFjayB0byBydW4gd2hlbiBhbmltYXRpb24gaXMgZmluaXNoZWQuXG4gKi9cbmZ1bmN0aW9uIGFuaW1hdGUoaXNJbiwgZWxlbWVudCwgYW5pbWF0aW9uLCBjYikge1xuICBlbGVtZW50ID0gJChlbGVtZW50KS5lcSgwKTtcblxuICBpZiAoIWVsZW1lbnQubGVuZ3RoKSByZXR1cm47XG5cbiAgdmFyIGluaXRDbGFzcyA9IGlzSW4gPyBpbml0Q2xhc3Nlc1swXSA6IGluaXRDbGFzc2VzWzFdO1xuICB2YXIgYWN0aXZlQ2xhc3MgPSBpc0luID8gYWN0aXZlQ2xhc3Nlc1swXSA6IGFjdGl2ZUNsYXNzZXNbMV07XG5cbiAgLy8gU2V0IHVwIHRoZSBhbmltYXRpb25cbiAgcmVzZXQoKTtcblxuICBlbGVtZW50XG4gICAgLmFkZENsYXNzKGFuaW1hdGlvbilcbiAgICAuY3NzKCd0cmFuc2l0aW9uJywgJ25vbmUnKTtcblxuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuICAgIGVsZW1lbnQuYWRkQ2xhc3MoaW5pdENsYXNzKTtcbiAgICBpZiAoaXNJbikgZWxlbWVudC5zaG93KCk7XG4gIH0pO1xuXG4gIC8vIFN0YXJ0IHRoZSBhbmltYXRpb25cbiAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcbiAgICBlbGVtZW50WzBdLm9mZnNldFdpZHRoO1xuICAgIGVsZW1lbnRcbiAgICAgIC5jc3MoJ3RyYW5zaXRpb24nLCAnJylcbiAgICAgIC5hZGRDbGFzcyhhY3RpdmVDbGFzcyk7XG4gIH0pO1xuXG4gIC8vIENsZWFuIHVwIHRoZSBhbmltYXRpb24gd2hlbiBpdCBmaW5pc2hlc1xuICBlbGVtZW50Lm9uZShGb3VuZGF0aW9uLnRyYW5zaXRpb25lbmQoZWxlbWVudCksIGZpbmlzaCk7XG5cbiAgLy8gSGlkZXMgdGhlIGVsZW1lbnQgKGZvciBvdXQgYW5pbWF0aW9ucyksIHJlc2V0cyB0aGUgZWxlbWVudCwgYW5kIHJ1bnMgYSBjYWxsYmFja1xuICBmdW5jdGlvbiBmaW5pc2goKSB7XG4gICAgaWYgKCFpc0luKSBlbGVtZW50LmhpZGUoKTtcbiAgICByZXNldCgpO1xuICAgIGlmIChjYikgY2IuYXBwbHkoZWxlbWVudCk7XG4gIH1cblxuICAvLyBSZXNldHMgdHJhbnNpdGlvbnMgYW5kIHJlbW92ZXMgbW90aW9uLXNwZWNpZmljIGNsYXNzZXNcbiAgZnVuY3Rpb24gcmVzZXQoKSB7XG4gICAgZWxlbWVudFswXS5zdHlsZS50cmFuc2l0aW9uRHVyYXRpb24gPSAwO1xuICAgIGVsZW1lbnQucmVtb3ZlQ2xhc3MoYCR7aW5pdENsYXNzfSAke2FjdGl2ZUNsYXNzfSAke2FuaW1hdGlvbn1gKTtcbiAgfVxufVxuXG5Gb3VuZGF0aW9uLk1vdmUgPSBNb3ZlO1xuRm91bmRhdGlvbi5Nb3Rpb24gPSBNb3Rpb247XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuY29uc3QgTmVzdCA9IHtcbiAgRmVhdGhlcihtZW51LCB0eXBlID0gJ3pmJykge1xuICAgIG1lbnUuYXR0cigncm9sZScsICdtZW51YmFyJyk7XG5cbiAgICB2YXIgaXRlbXMgPSBtZW51LmZpbmQoJ2xpJykuYXR0cih7J3JvbGUnOiAnbWVudWl0ZW0nfSksXG4gICAgICAgIHN1Yk1lbnVDbGFzcyA9IGBpcy0ke3R5cGV9LXN1Ym1lbnVgLFxuICAgICAgICBzdWJJdGVtQ2xhc3MgPSBgJHtzdWJNZW51Q2xhc3N9LWl0ZW1gLFxuICAgICAgICBoYXNTdWJDbGFzcyA9IGBpcy0ke3R5cGV9LXN1Ym1lbnUtcGFyZW50YDtcblxuICAgIGl0ZW1zLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgJGl0ZW0gPSAkKHRoaXMpLFxuICAgICAgICAgICRzdWIgPSAkaXRlbS5jaGlsZHJlbigndWwnKTtcblxuICAgICAgaWYgKCRzdWIubGVuZ3RoKSB7XG4gICAgICAgICRpdGVtXG4gICAgICAgICAgLmFkZENsYXNzKGhhc1N1YkNsYXNzKVxuICAgICAgICAgIC5hdHRyKHtcbiAgICAgICAgICAgICdhcmlhLWhhc3BvcHVwJzogdHJ1ZSxcbiAgICAgICAgICAgICdhcmlhLWxhYmVsJzogJGl0ZW0uY2hpbGRyZW4oJ2E6Zmlyc3QnKS50ZXh0KClcbiAgICAgICAgICB9KTtcbiAgICAgICAgICAvLyBOb3RlOiAgRHJpbGxkb3ducyBiZWhhdmUgZGlmZmVyZW50bHkgaW4gaG93IHRoZXkgaGlkZSwgYW5kIHNvIG5lZWRcbiAgICAgICAgICAvLyBhZGRpdGlvbmFsIGF0dHJpYnV0ZXMuICBXZSBzaG91bGQgbG9vayBpZiB0aGlzIHBvc3NpYmx5IG92ZXItZ2VuZXJhbGl6ZWRcbiAgICAgICAgICAvLyB1dGlsaXR5IChOZXN0KSBpcyBhcHByb3ByaWF0ZSB3aGVuIHdlIHJld29yayBtZW51cyBpbiA2LjRcbiAgICAgICAgICBpZih0eXBlID09PSAnZHJpbGxkb3duJykge1xuICAgICAgICAgICAgJGl0ZW0uYXR0cih7J2FyaWEtZXhwYW5kZWQnOiBmYWxzZX0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAkc3ViXG4gICAgICAgICAgLmFkZENsYXNzKGBzdWJtZW51ICR7c3ViTWVudUNsYXNzfWApXG4gICAgICAgICAgLmF0dHIoe1xuICAgICAgICAgICAgJ2RhdGEtc3VibWVudSc6ICcnLFxuICAgICAgICAgICAgJ3JvbGUnOiAnbWVudSdcbiAgICAgICAgICB9KTtcbiAgICAgICAgaWYodHlwZSA9PT0gJ2RyaWxsZG93bicpIHtcbiAgICAgICAgICAkc3ViLmF0dHIoeydhcmlhLWhpZGRlbic6IHRydWV9KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoJGl0ZW0ucGFyZW50KCdbZGF0YS1zdWJtZW51XScpLmxlbmd0aCkge1xuICAgICAgICAkaXRlbS5hZGRDbGFzcyhgaXMtc3VibWVudS1pdGVtICR7c3ViSXRlbUNsYXNzfWApO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuO1xuICB9LFxuXG4gIEJ1cm4obWVudSwgdHlwZSkge1xuICAgIHZhciAvL2l0ZW1zID0gbWVudS5maW5kKCdsaScpLFxuICAgICAgICBzdWJNZW51Q2xhc3MgPSBgaXMtJHt0eXBlfS1zdWJtZW51YCxcbiAgICAgICAgc3ViSXRlbUNsYXNzID0gYCR7c3ViTWVudUNsYXNzfS1pdGVtYCxcbiAgICAgICAgaGFzU3ViQ2xhc3MgPSBgaXMtJHt0eXBlfS1zdWJtZW51LXBhcmVudGA7XG5cbiAgICBtZW51XG4gICAgICAuZmluZCgnPmxpLCAubWVudSwgLm1lbnUgPiBsaScpXG4gICAgICAucmVtb3ZlQ2xhc3MoYCR7c3ViTWVudUNsYXNzfSAke3N1Ykl0ZW1DbGFzc30gJHtoYXNTdWJDbGFzc30gaXMtc3VibWVudS1pdGVtIHN1Ym1lbnUgaXMtYWN0aXZlYClcbiAgICAgIC5yZW1vdmVBdHRyKCdkYXRhLXN1Ym1lbnUnKS5jc3MoJ2Rpc3BsYXknLCAnJyk7XG5cbiAgICAvLyBjb25zb2xlLmxvZyggICAgICBtZW51LmZpbmQoJy4nICsgc3ViTWVudUNsYXNzICsgJywgLicgKyBzdWJJdGVtQ2xhc3MgKyAnLCAuaGFzLXN1Ym1lbnUsIC5pcy1zdWJtZW51LWl0ZW0sIC5zdWJtZW51LCBbZGF0YS1zdWJtZW51XScpXG4gICAgLy8gICAgICAgICAgIC5yZW1vdmVDbGFzcyhzdWJNZW51Q2xhc3MgKyAnICcgKyBzdWJJdGVtQ2xhc3MgKyAnIGhhcy1zdWJtZW51IGlzLXN1Ym1lbnUtaXRlbSBzdWJtZW51JylcbiAgICAvLyAgICAgICAgICAgLnJlbW92ZUF0dHIoJ2RhdGEtc3VibWVudScpKTtcbiAgICAvLyBpdGVtcy5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgLy8gICB2YXIgJGl0ZW0gPSAkKHRoaXMpLFxuICAgIC8vICAgICAgICRzdWIgPSAkaXRlbS5jaGlsZHJlbigndWwnKTtcbiAgICAvLyAgIGlmKCRpdGVtLnBhcmVudCgnW2RhdGEtc3VibWVudV0nKS5sZW5ndGgpe1xuICAgIC8vICAgICAkaXRlbS5yZW1vdmVDbGFzcygnaXMtc3VibWVudS1pdGVtICcgKyBzdWJJdGVtQ2xhc3MpO1xuICAgIC8vICAgfVxuICAgIC8vICAgaWYoJHN1Yi5sZW5ndGgpe1xuICAgIC8vICAgICAkaXRlbS5yZW1vdmVDbGFzcygnaGFzLXN1Ym1lbnUnKTtcbiAgICAvLyAgICAgJHN1Yi5yZW1vdmVDbGFzcygnc3VibWVudSAnICsgc3ViTWVudUNsYXNzKS5yZW1vdmVBdHRyKCdkYXRhLXN1Ym1lbnUnKTtcbiAgICAvLyAgIH1cbiAgICAvLyB9KTtcbiAgfVxufVxuXG5Gb3VuZGF0aW9uLk5lc3QgPSBOZXN0O1xuXG59KGpRdWVyeSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbmZ1bmN0aW9uIFRpbWVyKGVsZW0sIG9wdGlvbnMsIGNiKSB7XG4gIHZhciBfdGhpcyA9IHRoaXMsXG4gICAgICBkdXJhdGlvbiA9IG9wdGlvbnMuZHVyYXRpb24sLy9vcHRpb25zIGlzIGFuIG9iamVjdCBmb3IgZWFzaWx5IGFkZGluZyBmZWF0dXJlcyBsYXRlci5cbiAgICAgIG5hbWVTcGFjZSA9IE9iamVjdC5rZXlzKGVsZW0uZGF0YSgpKVswXSB8fCAndGltZXInLFxuICAgICAgcmVtYWluID0gLTEsXG4gICAgICBzdGFydCxcbiAgICAgIHRpbWVyO1xuXG4gIHRoaXMuaXNQYXVzZWQgPSBmYWxzZTtcblxuICB0aGlzLnJlc3RhcnQgPSBmdW5jdGlvbigpIHtcbiAgICByZW1haW4gPSAtMTtcbiAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgIHRoaXMuc3RhcnQoKTtcbiAgfVxuXG4gIHRoaXMuc3RhcnQgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmlzUGF1c2VkID0gZmFsc2U7XG4gICAgLy8gaWYoIWVsZW0uZGF0YSgncGF1c2VkJykpeyByZXR1cm4gZmFsc2U7IH0vL21heWJlIGltcGxlbWVudCB0aGlzIHNhbml0eSBjaGVjayBpZiB1c2VkIGZvciBvdGhlciB0aGluZ3MuXG4gICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICByZW1haW4gPSByZW1haW4gPD0gMCA/IGR1cmF0aW9uIDogcmVtYWluO1xuICAgIGVsZW0uZGF0YSgncGF1c2VkJywgZmFsc2UpO1xuICAgIHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICB0aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgIGlmKG9wdGlvbnMuaW5maW5pdGUpe1xuICAgICAgICBfdGhpcy5yZXN0YXJ0KCk7Ly9yZXJ1biB0aGUgdGltZXIuXG4gICAgICB9XG4gICAgICBpZiAoY2IgJiYgdHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSB7IGNiKCk7IH1cbiAgICB9LCByZW1haW4pO1xuICAgIGVsZW0udHJpZ2dlcihgdGltZXJzdGFydC56Zi4ke25hbWVTcGFjZX1gKTtcbiAgfVxuXG4gIHRoaXMucGF1c2UgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmlzUGF1c2VkID0gdHJ1ZTtcbiAgICAvL2lmKGVsZW0uZGF0YSgncGF1c2VkJykpeyByZXR1cm4gZmFsc2U7IH0vL21heWJlIGltcGxlbWVudCB0aGlzIHNhbml0eSBjaGVjayBpZiB1c2VkIGZvciBvdGhlciB0aGluZ3MuXG4gICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICBlbGVtLmRhdGEoJ3BhdXNlZCcsIHRydWUpO1xuICAgIHZhciBlbmQgPSBEYXRlLm5vdygpO1xuICAgIHJlbWFpbiA9IHJlbWFpbiAtIChlbmQgLSBzdGFydCk7XG4gICAgZWxlbS50cmlnZ2VyKGB0aW1lcnBhdXNlZC56Zi4ke25hbWVTcGFjZX1gKTtcbiAgfVxufVxuXG4vKipcbiAqIFJ1bnMgYSBjYWxsYmFjayBmdW5jdGlvbiB3aGVuIGltYWdlcyBhcmUgZnVsbHkgbG9hZGVkLlxuICogQHBhcmFtIHtPYmplY3R9IGltYWdlcyAtIEltYWdlKHMpIHRvIGNoZWNrIGlmIGxvYWRlZC5cbiAqIEBwYXJhbSB7RnVuY30gY2FsbGJhY2sgLSBGdW5jdGlvbiB0byBleGVjdXRlIHdoZW4gaW1hZ2UgaXMgZnVsbHkgbG9hZGVkLlxuICovXG5mdW5jdGlvbiBvbkltYWdlc0xvYWRlZChpbWFnZXMsIGNhbGxiYWNrKXtcbiAgdmFyIHNlbGYgPSB0aGlzLFxuICAgICAgdW5sb2FkZWQgPSBpbWFnZXMubGVuZ3RoO1xuXG4gIGlmICh1bmxvYWRlZCA9PT0gMCkge1xuICAgIGNhbGxiYWNrKCk7XG4gIH1cblxuICBpbWFnZXMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAvLyBDaGVjayBpZiBpbWFnZSBpcyBsb2FkZWRcbiAgICBpZiAodGhpcy5jb21wbGV0ZSB8fCAodGhpcy5yZWFkeVN0YXRlID09PSA0KSB8fCAodGhpcy5yZWFkeVN0YXRlID09PSAnY29tcGxldGUnKSkge1xuICAgICAgc2luZ2xlSW1hZ2VMb2FkZWQoKTtcbiAgICB9XG4gICAgLy8gRm9yY2UgbG9hZCB0aGUgaW1hZ2VcbiAgICBlbHNlIHtcbiAgICAgIC8vIGZpeCBmb3IgSUUuIFNlZSBodHRwczovL2Nzcy10cmlja3MuY29tL3NuaXBwZXRzL2pxdWVyeS9maXhpbmctbG9hZC1pbi1pZS1mb3ItY2FjaGVkLWltYWdlcy9cbiAgICAgIHZhciBzcmMgPSAkKHRoaXMpLmF0dHIoJ3NyYycpO1xuICAgICAgJCh0aGlzKS5hdHRyKCdzcmMnLCBzcmMgKyAoc3JjLmluZGV4T2YoJz8nKSA+PSAwID8gJyYnIDogJz8nKSArIChuZXcgRGF0ZSgpLmdldFRpbWUoKSkpO1xuICAgICAgJCh0aGlzKS5vbmUoJ2xvYWQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgc2luZ2xlSW1hZ2VMb2FkZWQoKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfSk7XG5cbiAgZnVuY3Rpb24gc2luZ2xlSW1hZ2VMb2FkZWQoKSB7XG4gICAgdW5sb2FkZWQtLTtcbiAgICBpZiAodW5sb2FkZWQgPT09IDApIHtcbiAgICAgIGNhbGxiYWNrKCk7XG4gICAgfVxuICB9XG59XG5cbkZvdW5kYXRpb24uVGltZXIgPSBUaW1lcjtcbkZvdW5kYXRpb24ub25JbWFnZXNMb2FkZWQgPSBvbkltYWdlc0xvYWRlZDtcblxufShqUXVlcnkpO1xuIiwiLy8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuLy8qKldvcmsgaW5zcGlyZWQgYnkgbXVsdGlwbGUganF1ZXJ5IHN3aXBlIHBsdWdpbnMqKlxuLy8qKkRvbmUgYnkgWW9oYWkgQXJhcmF0ICoqKioqKioqKioqKioqKioqKioqKioqKioqKlxuLy8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuKGZ1bmN0aW9uKCQpIHtcblxuICAkLnNwb3RTd2lwZSA9IHtcbiAgICB2ZXJzaW9uOiAnMS4wLjAnLFxuICAgIGVuYWJsZWQ6ICdvbnRvdWNoc3RhcnQnIGluIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCxcbiAgICBwcmV2ZW50RGVmYXVsdDogZmFsc2UsXG4gICAgbW92ZVRocmVzaG9sZDogNzUsXG4gICAgdGltZVRocmVzaG9sZDogMjAwXG4gIH07XG5cbiAgdmFyICAgc3RhcnRQb3NYLFxuICAgICAgICBzdGFydFBvc1ksXG4gICAgICAgIHN0YXJ0VGltZSxcbiAgICAgICAgZWxhcHNlZFRpbWUsXG4gICAgICAgIGlzTW92aW5nID0gZmFsc2U7XG5cbiAgZnVuY3Rpb24gb25Ub3VjaEVuZCgpIHtcbiAgICAvLyAgYWxlcnQodGhpcyk7XG4gICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCBvblRvdWNoTW92ZSk7XG4gICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIG9uVG91Y2hFbmQpO1xuICAgIGlzTW92aW5nID0gZmFsc2U7XG4gIH1cblxuICBmdW5jdGlvbiBvblRvdWNoTW92ZShlKSB7XG4gICAgaWYgKCQuc3BvdFN3aXBlLnByZXZlbnREZWZhdWx0KSB7IGUucHJldmVudERlZmF1bHQoKTsgfVxuICAgIGlmKGlzTW92aW5nKSB7XG4gICAgICB2YXIgeCA9IGUudG91Y2hlc1swXS5wYWdlWDtcbiAgICAgIHZhciB5ID0gZS50b3VjaGVzWzBdLnBhZ2VZO1xuICAgICAgdmFyIGR4ID0gc3RhcnRQb3NYIC0geDtcbiAgICAgIHZhciBkeSA9IHN0YXJ0UG9zWSAtIHk7XG4gICAgICB2YXIgZGlyO1xuICAgICAgZWxhcHNlZFRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIHN0YXJ0VGltZTtcbiAgICAgIGlmKE1hdGguYWJzKGR4KSA+PSAkLnNwb3RTd2lwZS5tb3ZlVGhyZXNob2xkICYmIGVsYXBzZWRUaW1lIDw9ICQuc3BvdFN3aXBlLnRpbWVUaHJlc2hvbGQpIHtcbiAgICAgICAgZGlyID0gZHggPiAwID8gJ2xlZnQnIDogJ3JpZ2h0JztcbiAgICAgIH1cbiAgICAgIC8vIGVsc2UgaWYoTWF0aC5hYnMoZHkpID49ICQuc3BvdFN3aXBlLm1vdmVUaHJlc2hvbGQgJiYgZWxhcHNlZFRpbWUgPD0gJC5zcG90U3dpcGUudGltZVRocmVzaG9sZCkge1xuICAgICAgLy8gICBkaXIgPSBkeSA+IDAgPyAnZG93bicgOiAndXAnO1xuICAgICAgLy8gfVxuICAgICAgaWYoZGlyKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgb25Ub3VjaEVuZC5jYWxsKHRoaXMpO1xuICAgICAgICAkKHRoaXMpLnRyaWdnZXIoJ3N3aXBlJywgZGlyKS50cmlnZ2VyKGBzd2lwZSR7ZGlyfWApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIG9uVG91Y2hTdGFydChlKSB7XG4gICAgaWYgKGUudG91Y2hlcy5sZW5ndGggPT0gMSkge1xuICAgICAgc3RhcnRQb3NYID0gZS50b3VjaGVzWzBdLnBhZ2VYO1xuICAgICAgc3RhcnRQb3NZID0gZS50b3VjaGVzWzBdLnBhZ2VZO1xuICAgICAgaXNNb3ZpbmcgPSB0cnVlO1xuICAgICAgc3RhcnRUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIG9uVG91Y2hNb3ZlLCBmYWxzZSk7XG4gICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgb25Ub3VjaEVuZCwgZmFsc2UpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGluaXQoKSB7XG4gICAgdGhpcy5hZGRFdmVudExpc3RlbmVyICYmIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIG9uVG91Y2hTdGFydCwgZmFsc2UpO1xuICB9XG5cbiAgZnVuY3Rpb24gdGVhcmRvd24oKSB7XG4gICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0Jywgb25Ub3VjaFN0YXJ0KTtcbiAgfVxuXG4gICQuZXZlbnQuc3BlY2lhbC5zd2lwZSA9IHsgc2V0dXA6IGluaXQgfTtcblxuICAkLmVhY2goWydsZWZ0JywgJ3VwJywgJ2Rvd24nLCAncmlnaHQnXSwgZnVuY3Rpb24gKCkge1xuICAgICQuZXZlbnQuc3BlY2lhbFtgc3dpcGUke3RoaXN9YF0gPSB7IHNldHVwOiBmdW5jdGlvbigpe1xuICAgICAgJCh0aGlzKS5vbignc3dpcGUnLCAkLm5vb3ApO1xuICAgIH0gfTtcbiAgfSk7XG59KShqUXVlcnkpO1xuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqIE1ldGhvZCBmb3IgYWRkaW5nIHBzdWVkbyBkcmFnIGV2ZW50cyB0byBlbGVtZW50cyAqXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuIWZ1bmN0aW9uKCQpe1xuICAkLmZuLmFkZFRvdWNoID0gZnVuY3Rpb24oKXtcbiAgICB0aGlzLmVhY2goZnVuY3Rpb24oaSxlbCl7XG4gICAgICAkKGVsKS5iaW5kKCd0b3VjaHN0YXJ0IHRvdWNobW92ZSB0b3VjaGVuZCB0b3VjaGNhbmNlbCcsZnVuY3Rpb24oKXtcbiAgICAgICAgLy93ZSBwYXNzIHRoZSBvcmlnaW5hbCBldmVudCBvYmplY3QgYmVjYXVzZSB0aGUgalF1ZXJ5IGV2ZW50XG4gICAgICAgIC8vb2JqZWN0IGlzIG5vcm1hbGl6ZWQgdG8gdzNjIHNwZWNzIGFuZCBkb2VzIG5vdCBwcm92aWRlIHRoZSBUb3VjaExpc3RcbiAgICAgICAgaGFuZGxlVG91Y2goZXZlbnQpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICB2YXIgaGFuZGxlVG91Y2ggPSBmdW5jdGlvbihldmVudCl7XG4gICAgICB2YXIgdG91Y2hlcyA9IGV2ZW50LmNoYW5nZWRUb3VjaGVzLFxuICAgICAgICAgIGZpcnN0ID0gdG91Y2hlc1swXSxcbiAgICAgICAgICBldmVudFR5cGVzID0ge1xuICAgICAgICAgICAgdG91Y2hzdGFydDogJ21vdXNlZG93bicsXG4gICAgICAgICAgICB0b3VjaG1vdmU6ICdtb3VzZW1vdmUnLFxuICAgICAgICAgICAgdG91Y2hlbmQ6ICdtb3VzZXVwJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAgdHlwZSA9IGV2ZW50VHlwZXNbZXZlbnQudHlwZV0sXG4gICAgICAgICAgc2ltdWxhdGVkRXZlbnRcbiAgICAgICAgO1xuXG4gICAgICBpZignTW91c2VFdmVudCcgaW4gd2luZG93ICYmIHR5cGVvZiB3aW5kb3cuTW91c2VFdmVudCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBzaW11bGF0ZWRFdmVudCA9IG5ldyB3aW5kb3cuTW91c2VFdmVudCh0eXBlLCB7XG4gICAgICAgICAgJ2J1YmJsZXMnOiB0cnVlLFxuICAgICAgICAgICdjYW5jZWxhYmxlJzogdHJ1ZSxcbiAgICAgICAgICAnc2NyZWVuWCc6IGZpcnN0LnNjcmVlblgsXG4gICAgICAgICAgJ3NjcmVlblknOiBmaXJzdC5zY3JlZW5ZLFxuICAgICAgICAgICdjbGllbnRYJzogZmlyc3QuY2xpZW50WCxcbiAgICAgICAgICAnY2xpZW50WSc6IGZpcnN0LmNsaWVudFlcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzaW11bGF0ZWRFdmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdNb3VzZUV2ZW50Jyk7XG4gICAgICAgIHNpbXVsYXRlZEV2ZW50LmluaXRNb3VzZUV2ZW50KHR5cGUsIHRydWUsIHRydWUsIHdpbmRvdywgMSwgZmlyc3Quc2NyZWVuWCwgZmlyc3Quc2NyZWVuWSwgZmlyc3QuY2xpZW50WCwgZmlyc3QuY2xpZW50WSwgZmFsc2UsIGZhbHNlLCBmYWxzZSwgZmFsc2UsIDAvKmxlZnQqLywgbnVsbCk7XG4gICAgICB9XG4gICAgICBmaXJzdC50YXJnZXQuZGlzcGF0Y2hFdmVudChzaW11bGF0ZWRFdmVudCk7XG4gICAgfTtcbiAgfTtcbn0oalF1ZXJ5KTtcblxuXG4vLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbi8vKipGcm9tIHRoZSBqUXVlcnkgTW9iaWxlIExpYnJhcnkqKlxuLy8qKm5lZWQgdG8gcmVjcmVhdGUgZnVuY3Rpb25hbGl0eSoqXG4vLyoqYW5kIHRyeSB0byBpbXByb3ZlIGlmIHBvc3NpYmxlKipcbi8vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuXG4vKiBSZW1vdmluZyB0aGUgalF1ZXJ5IGZ1bmN0aW9uICoqKipcbioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuXG4oZnVuY3Rpb24oICQsIHdpbmRvdywgdW5kZWZpbmVkICkge1xuXG5cdHZhciAkZG9jdW1lbnQgPSAkKCBkb2N1bWVudCApLFxuXHRcdC8vIHN1cHBvcnRUb3VjaCA9ICQubW9iaWxlLnN1cHBvcnQudG91Y2gsXG5cdFx0dG91Y2hTdGFydEV2ZW50ID0gJ3RvdWNoc3RhcnQnLy9zdXBwb3J0VG91Y2ggPyBcInRvdWNoc3RhcnRcIiA6IFwibW91c2Vkb3duXCIsXG5cdFx0dG91Y2hTdG9wRXZlbnQgPSAndG91Y2hlbmQnLy9zdXBwb3J0VG91Y2ggPyBcInRvdWNoZW5kXCIgOiBcIm1vdXNldXBcIixcblx0XHR0b3VjaE1vdmVFdmVudCA9ICd0b3VjaG1vdmUnLy9zdXBwb3J0VG91Y2ggPyBcInRvdWNobW92ZVwiIDogXCJtb3VzZW1vdmVcIjtcblxuXHQvLyBzZXR1cCBuZXcgZXZlbnQgc2hvcnRjdXRzXG5cdCQuZWFjaCggKCBcInRvdWNoc3RhcnQgdG91Y2htb3ZlIHRvdWNoZW5kIFwiICtcblx0XHRcInN3aXBlIHN3aXBlbGVmdCBzd2lwZXJpZ2h0XCIgKS5zcGxpdCggXCIgXCIgKSwgZnVuY3Rpb24oIGksIG5hbWUgKSB7XG5cblx0XHQkLmZuWyBuYW1lIF0gPSBmdW5jdGlvbiggZm4gKSB7XG5cdFx0XHRyZXR1cm4gZm4gPyB0aGlzLmJpbmQoIG5hbWUsIGZuICkgOiB0aGlzLnRyaWdnZXIoIG5hbWUgKTtcblx0XHR9O1xuXG5cdFx0Ly8galF1ZXJ5IDwgMS44XG5cdFx0aWYgKCAkLmF0dHJGbiApIHtcblx0XHRcdCQuYXR0ckZuWyBuYW1lIF0gPSB0cnVlO1xuXHRcdH1cblx0fSk7XG5cblx0ZnVuY3Rpb24gdHJpZ2dlckN1c3RvbUV2ZW50KCBvYmosIGV2ZW50VHlwZSwgZXZlbnQsIGJ1YmJsZSApIHtcblx0XHR2YXIgb3JpZ2luYWxUeXBlID0gZXZlbnQudHlwZTtcblx0XHRldmVudC50eXBlID0gZXZlbnRUeXBlO1xuXHRcdGlmICggYnViYmxlICkge1xuXHRcdFx0JC5ldmVudC50cmlnZ2VyKCBldmVudCwgdW5kZWZpbmVkLCBvYmogKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0JC5ldmVudC5kaXNwYXRjaC5jYWxsKCBvYmosIGV2ZW50ICk7XG5cdFx0fVxuXHRcdGV2ZW50LnR5cGUgPSBvcmlnaW5hbFR5cGU7XG5cdH1cblxuXHQvLyBhbHNvIGhhbmRsZXMgdGFwaG9sZFxuXG5cdC8vIEFsc28gaGFuZGxlcyBzd2lwZWxlZnQsIHN3aXBlcmlnaHRcblx0JC5ldmVudC5zcGVjaWFsLnN3aXBlID0ge1xuXG5cdFx0Ly8gTW9yZSB0aGFuIHRoaXMgaG9yaXpvbnRhbCBkaXNwbGFjZW1lbnQsIGFuZCB3ZSB3aWxsIHN1cHByZXNzIHNjcm9sbGluZy5cblx0XHRzY3JvbGxTdXByZXNzaW9uVGhyZXNob2xkOiAzMCxcblxuXHRcdC8vIE1vcmUgdGltZSB0aGFuIHRoaXMsIGFuZCBpdCBpc24ndCBhIHN3aXBlLlxuXHRcdGR1cmF0aW9uVGhyZXNob2xkOiAxMDAwLFxuXG5cdFx0Ly8gU3dpcGUgaG9yaXpvbnRhbCBkaXNwbGFjZW1lbnQgbXVzdCBiZSBtb3JlIHRoYW4gdGhpcy5cblx0XHRob3Jpem9udGFsRGlzdGFuY2VUaHJlc2hvbGQ6IHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvID49IDIgPyAxNSA6IDMwLFxuXG5cdFx0Ly8gU3dpcGUgdmVydGljYWwgZGlzcGxhY2VtZW50IG11c3QgYmUgbGVzcyB0aGFuIHRoaXMuXG5cdFx0dmVydGljYWxEaXN0YW5jZVRocmVzaG9sZDogd2luZG93LmRldmljZVBpeGVsUmF0aW8gPj0gMiA/IDE1IDogMzAsXG5cblx0XHRnZXRMb2NhdGlvbjogZnVuY3Rpb24gKCBldmVudCApIHtcblx0XHRcdHZhciB3aW5QYWdlWCA9IHdpbmRvdy5wYWdlWE9mZnNldCxcblx0XHRcdFx0d2luUGFnZVkgPSB3aW5kb3cucGFnZVlPZmZzZXQsXG5cdFx0XHRcdHggPSBldmVudC5jbGllbnRYLFxuXHRcdFx0XHR5ID0gZXZlbnQuY2xpZW50WTtcblxuXHRcdFx0aWYgKCBldmVudC5wYWdlWSA9PT0gMCAmJiBNYXRoLmZsb29yKCB5ICkgPiBNYXRoLmZsb29yKCBldmVudC5wYWdlWSApIHx8XG5cdFx0XHRcdGV2ZW50LnBhZ2VYID09PSAwICYmIE1hdGguZmxvb3IoIHggKSA+IE1hdGguZmxvb3IoIGV2ZW50LnBhZ2VYICkgKSB7XG5cblx0XHRcdFx0Ly8gaU9TNCBjbGllbnRYL2NsaWVudFkgaGF2ZSB0aGUgdmFsdWUgdGhhdCBzaG91bGQgaGF2ZSBiZWVuXG5cdFx0XHRcdC8vIGluIHBhZ2VYL3BhZ2VZLiBXaGlsZSBwYWdlWC9wYWdlLyBoYXZlIHRoZSB2YWx1ZSAwXG5cdFx0XHRcdHggPSB4IC0gd2luUGFnZVg7XG5cdFx0XHRcdHkgPSB5IC0gd2luUGFnZVk7XG5cdFx0XHR9IGVsc2UgaWYgKCB5IDwgKCBldmVudC5wYWdlWSAtIHdpblBhZ2VZKSB8fCB4IDwgKCBldmVudC5wYWdlWCAtIHdpblBhZ2VYICkgKSB7XG5cblx0XHRcdFx0Ly8gU29tZSBBbmRyb2lkIGJyb3dzZXJzIGhhdmUgdG90YWxseSBib2d1cyB2YWx1ZXMgZm9yIGNsaWVudFgvWVxuXHRcdFx0XHQvLyB3aGVuIHNjcm9sbGluZy96b29taW5nIGEgcGFnZS4gRGV0ZWN0YWJsZSBzaW5jZSBjbGllbnRYL2NsaWVudFlcblx0XHRcdFx0Ly8gc2hvdWxkIG5ldmVyIGJlIHNtYWxsZXIgdGhhbiBwYWdlWC9wYWdlWSBtaW51cyBwYWdlIHNjcm9sbFxuXHRcdFx0XHR4ID0gZXZlbnQucGFnZVggLSB3aW5QYWdlWDtcblx0XHRcdFx0eSA9IGV2ZW50LnBhZ2VZIC0gd2luUGFnZVk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHg6IHgsXG5cdFx0XHRcdHk6IHlcblx0XHRcdH07XG5cdFx0fSxcblxuXHRcdHN0YXJ0OiBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0XHR2YXIgZGF0YSA9IGV2ZW50Lm9yaWdpbmFsRXZlbnQudG91Y2hlcyA/XG5cdFx0XHRcdFx0ZXZlbnQub3JpZ2luYWxFdmVudC50b3VjaGVzWyAwIF0gOiBldmVudCxcblx0XHRcdFx0bG9jYXRpb24gPSAkLmV2ZW50LnNwZWNpYWwuc3dpcGUuZ2V0TG9jYXRpb24oIGRhdGEgKTtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0XHR0aW1lOiAoIG5ldyBEYXRlKCkgKS5nZXRUaW1lKCksXG5cdFx0XHRcdFx0XHRjb29yZHM6IFsgbG9jYXRpb24ueCwgbG9jYXRpb24ueSBdLFxuXHRcdFx0XHRcdFx0b3JpZ2luOiAkKCBldmVudC50YXJnZXQgKVxuXHRcdFx0XHRcdH07XG5cdFx0fSxcblxuXHRcdHN0b3A6IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHRcdHZhciBkYXRhID0gZXZlbnQub3JpZ2luYWxFdmVudC50b3VjaGVzID9cblx0XHRcdFx0XHRldmVudC5vcmlnaW5hbEV2ZW50LnRvdWNoZXNbIDAgXSA6IGV2ZW50LFxuXHRcdFx0XHRsb2NhdGlvbiA9ICQuZXZlbnQuc3BlY2lhbC5zd2lwZS5nZXRMb2NhdGlvbiggZGF0YSApO1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdHRpbWU6ICggbmV3IERhdGUoKSApLmdldFRpbWUoKSxcblx0XHRcdFx0XHRcdGNvb3JkczogWyBsb2NhdGlvbi54LCBsb2NhdGlvbi55IF1cblx0XHRcdFx0XHR9O1xuXHRcdH0sXG5cblx0XHRoYW5kbGVTd2lwZTogZnVuY3Rpb24oIHN0YXJ0LCBzdG9wLCB0aGlzT2JqZWN0LCBvcmlnVGFyZ2V0ICkge1xuXHRcdFx0aWYgKCBzdG9wLnRpbWUgLSBzdGFydC50aW1lIDwgJC5ldmVudC5zcGVjaWFsLnN3aXBlLmR1cmF0aW9uVGhyZXNob2xkICYmXG5cdFx0XHRcdE1hdGguYWJzKCBzdGFydC5jb29yZHNbIDAgXSAtIHN0b3AuY29vcmRzWyAwIF0gKSA+ICQuZXZlbnQuc3BlY2lhbC5zd2lwZS5ob3Jpem9udGFsRGlzdGFuY2VUaHJlc2hvbGQgJiZcblx0XHRcdFx0TWF0aC5hYnMoIHN0YXJ0LmNvb3Jkc1sgMSBdIC0gc3RvcC5jb29yZHNbIDEgXSApIDwgJC5ldmVudC5zcGVjaWFsLnN3aXBlLnZlcnRpY2FsRGlzdGFuY2VUaHJlc2hvbGQgKSB7XG5cdFx0XHRcdHZhciBkaXJlY3Rpb24gPSBzdGFydC5jb29yZHNbMF0gPiBzdG9wLmNvb3Jkc1sgMCBdID8gXCJzd2lwZWxlZnRcIiA6IFwic3dpcGVyaWdodFwiO1xuXG5cdFx0XHRcdHRyaWdnZXJDdXN0b21FdmVudCggdGhpc09iamVjdCwgXCJzd2lwZVwiLCAkLkV2ZW50KCBcInN3aXBlXCIsIHsgdGFyZ2V0OiBvcmlnVGFyZ2V0LCBzd2lwZXN0YXJ0OiBzdGFydCwgc3dpcGVzdG9wOiBzdG9wIH0pLCB0cnVlICk7XG5cdFx0XHRcdHRyaWdnZXJDdXN0b21FdmVudCggdGhpc09iamVjdCwgZGlyZWN0aW9uLCQuRXZlbnQoIGRpcmVjdGlvbiwgeyB0YXJnZXQ6IG9yaWdUYXJnZXQsIHN3aXBlc3RhcnQ6IHN0YXJ0LCBzd2lwZXN0b3A6IHN0b3AgfSApLCB0cnVlICk7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXG5cdFx0fSxcblxuXHRcdC8vIFRoaXMgc2VydmVzIGFzIGEgZmxhZyB0byBlbnN1cmUgdGhhdCBhdCBtb3N0IG9uZSBzd2lwZSBldmVudCBldmVudCBpc1xuXHRcdC8vIGluIHdvcmsgYXQgYW55IGdpdmVuIHRpbWVcblx0XHRldmVudEluUHJvZ3Jlc3M6IGZhbHNlLFxuXG5cdFx0c2V0dXA6IGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIGV2ZW50cyxcblx0XHRcdFx0dGhpc09iamVjdCA9IHRoaXMsXG5cdFx0XHRcdCR0aGlzID0gJCggdGhpc09iamVjdCApLFxuXHRcdFx0XHRjb250ZXh0ID0ge307XG5cblx0XHRcdC8vIFJldHJpZXZlIHRoZSBldmVudHMgZGF0YSBmb3IgdGhpcyBlbGVtZW50IGFuZCBhZGQgdGhlIHN3aXBlIGNvbnRleHRcblx0XHRcdGV2ZW50cyA9ICQuZGF0YSggdGhpcywgXCJtb2JpbGUtZXZlbnRzXCIgKTtcblx0XHRcdGlmICggIWV2ZW50cyApIHtcblx0XHRcdFx0ZXZlbnRzID0geyBsZW5ndGg6IDAgfTtcblx0XHRcdFx0JC5kYXRhKCB0aGlzLCBcIm1vYmlsZS1ldmVudHNcIiwgZXZlbnRzICk7XG5cdFx0XHR9XG5cdFx0XHRldmVudHMubGVuZ3RoKys7XG5cdFx0XHRldmVudHMuc3dpcGUgPSBjb250ZXh0O1xuXG5cdFx0XHRjb250ZXh0LnN0YXJ0ID0gZnVuY3Rpb24oIGV2ZW50ICkge1xuXG5cdFx0XHRcdC8vIEJhaWwgaWYgd2UncmUgYWxyZWFkeSB3b3JraW5nIG9uIGEgc3dpcGUgZXZlbnRcblx0XHRcdFx0aWYgKCAkLmV2ZW50LnNwZWNpYWwuc3dpcGUuZXZlbnRJblByb2dyZXNzICkge1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXHRcdFx0XHQkLmV2ZW50LnNwZWNpYWwuc3dpcGUuZXZlbnRJblByb2dyZXNzID0gdHJ1ZTtcblxuXHRcdFx0XHR2YXIgc3RvcCxcblx0XHRcdFx0XHRzdGFydCA9ICQuZXZlbnQuc3BlY2lhbC5zd2lwZS5zdGFydCggZXZlbnQgKSxcblx0XHRcdFx0XHRvcmlnVGFyZ2V0ID0gZXZlbnQudGFyZ2V0LFxuXHRcdFx0XHRcdGVtaXR0ZWQgPSBmYWxzZTtcblxuXHRcdFx0XHRjb250ZXh0Lm1vdmUgPSBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0XHRcdFx0aWYgKCAhc3RhcnQgfHwgZXZlbnQuaXNEZWZhdWx0UHJldmVudGVkKCkgKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0c3RvcCA9ICQuZXZlbnQuc3BlY2lhbC5zd2lwZS5zdG9wKCBldmVudCApO1xuXHRcdFx0XHRcdGlmICggIWVtaXR0ZWQgKSB7XG5cdFx0XHRcdFx0XHRlbWl0dGVkID0gJC5ldmVudC5zcGVjaWFsLnN3aXBlLmhhbmRsZVN3aXBlKCBzdGFydCwgc3RvcCwgdGhpc09iamVjdCwgb3JpZ1RhcmdldCApO1xuXHRcdFx0XHRcdFx0aWYgKCBlbWl0dGVkICkge1xuXG5cdFx0XHRcdFx0XHRcdC8vIFJlc2V0IHRoZSBjb250ZXh0IHRvIG1ha2Ugd2F5IGZvciB0aGUgbmV4dCBzd2lwZSBldmVudFxuXHRcdFx0XHRcdFx0XHQkLmV2ZW50LnNwZWNpYWwuc3dpcGUuZXZlbnRJblByb2dyZXNzID0gZmFsc2U7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdC8vIHByZXZlbnQgc2Nyb2xsaW5nXG5cdFx0XHRcdFx0aWYgKCBNYXRoLmFicyggc3RhcnQuY29vcmRzWyAwIF0gLSBzdG9wLmNvb3Jkc1sgMCBdICkgPiAkLmV2ZW50LnNwZWNpYWwuc3dpcGUuc2Nyb2xsU3VwcmVzc2lvblRocmVzaG9sZCApIHtcblx0XHRcdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdGNvbnRleHQuc3RvcCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0ZW1pdHRlZCA9IHRydWU7XG5cblx0XHRcdFx0XHRcdC8vIFJlc2V0IHRoZSBjb250ZXh0IHRvIG1ha2Ugd2F5IGZvciB0aGUgbmV4dCBzd2lwZSBldmVudFxuXHRcdFx0XHRcdFx0JC5ldmVudC5zcGVjaWFsLnN3aXBlLmV2ZW50SW5Qcm9ncmVzcyA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0JGRvY3VtZW50Lm9mZiggdG91Y2hNb3ZlRXZlbnQsIGNvbnRleHQubW92ZSApO1xuXHRcdFx0XHRcdFx0Y29udGV4dC5tb3ZlID0gbnVsbDtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHQkZG9jdW1lbnQub24oIHRvdWNoTW92ZUV2ZW50LCBjb250ZXh0Lm1vdmUgKVxuXHRcdFx0XHRcdC5vbmUoIHRvdWNoU3RvcEV2ZW50LCBjb250ZXh0LnN0b3AgKTtcblx0XHRcdH07XG5cdFx0XHQkdGhpcy5vbiggdG91Y2hTdGFydEV2ZW50LCBjb250ZXh0LnN0YXJ0ICk7XG5cdFx0fSxcblxuXHRcdHRlYXJkb3duOiBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBldmVudHMsIGNvbnRleHQ7XG5cblx0XHRcdGV2ZW50cyA9ICQuZGF0YSggdGhpcywgXCJtb2JpbGUtZXZlbnRzXCIgKTtcblx0XHRcdGlmICggZXZlbnRzICkge1xuXHRcdFx0XHRjb250ZXh0ID0gZXZlbnRzLnN3aXBlO1xuXHRcdFx0XHRkZWxldGUgZXZlbnRzLnN3aXBlO1xuXHRcdFx0XHRldmVudHMubGVuZ3RoLS07XG5cdFx0XHRcdGlmICggZXZlbnRzLmxlbmd0aCA9PT0gMCApIHtcblx0XHRcdFx0XHQkLnJlbW92ZURhdGEoIHRoaXMsIFwibW9iaWxlLWV2ZW50c1wiICk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0aWYgKCBjb250ZXh0ICkge1xuXHRcdFx0XHRpZiAoIGNvbnRleHQuc3RhcnQgKSB7XG5cdFx0XHRcdFx0JCggdGhpcyApLm9mZiggdG91Y2hTdGFydEV2ZW50LCBjb250ZXh0LnN0YXJ0ICk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKCBjb250ZXh0Lm1vdmUgKSB7XG5cdFx0XHRcdFx0JGRvY3VtZW50Lm9mZiggdG91Y2hNb3ZlRXZlbnQsIGNvbnRleHQubW92ZSApO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICggY29udGV4dC5zdG9wICkge1xuXHRcdFx0XHRcdCRkb2N1bWVudC5vZmYoIHRvdWNoU3RvcEV2ZW50LCBjb250ZXh0LnN0b3AgKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fTtcblx0JC5lYWNoKHtcblx0XHRzd2lwZWxlZnQ6IFwic3dpcGUubGVmdFwiLFxuXHRcdHN3aXBlcmlnaHQ6IFwic3dpcGUucmlnaHRcIlxuXHR9LCBmdW5jdGlvbiggZXZlbnQsIHNvdXJjZUV2ZW50ICkge1xuXG5cdFx0JC5ldmVudC5zcGVjaWFsWyBldmVudCBdID0ge1xuXHRcdFx0c2V0dXA6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHQkKCB0aGlzICkuYmluZCggc291cmNlRXZlbnQsICQubm9vcCApO1xuXHRcdFx0fSxcblx0XHRcdHRlYXJkb3duOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0JCggdGhpcyApLnVuYmluZCggc291cmNlRXZlbnQgKTtcblx0XHRcdH1cblx0XHR9O1xuXHR9KTtcbn0pKCBqUXVlcnksIHRoaXMgKTtcbiovXG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbmNvbnN0IE11dGF0aW9uT2JzZXJ2ZXIgPSAoZnVuY3Rpb24gKCkge1xuICB2YXIgcHJlZml4ZXMgPSBbJ1dlYktpdCcsICdNb3onLCAnTycsICdNcycsICcnXTtcbiAgZm9yICh2YXIgaT0wOyBpIDwgcHJlZml4ZXMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoYCR7cHJlZml4ZXNbaV19TXV0YXRpb25PYnNlcnZlcmAgaW4gd2luZG93KSB7XG4gICAgICByZXR1cm4gd2luZG93W2Ake3ByZWZpeGVzW2ldfU11dGF0aW9uT2JzZXJ2ZXJgXTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufSgpKTtcblxuY29uc3QgdHJpZ2dlcnMgPSAoZWwsIHR5cGUpID0+IHtcbiAgZWwuZGF0YSh0eXBlKS5zcGxpdCgnICcpLmZvckVhY2goaWQgPT4ge1xuICAgICQoYCMke2lkfWApWyB0eXBlID09PSAnY2xvc2UnID8gJ3RyaWdnZXInIDogJ3RyaWdnZXJIYW5kbGVyJ10oYCR7dHlwZX0uemYudHJpZ2dlcmAsIFtlbF0pO1xuICB9KTtcbn07XG4vLyBFbGVtZW50cyB3aXRoIFtkYXRhLW9wZW5dIHdpbGwgcmV2ZWFsIGEgcGx1Z2luIHRoYXQgc3VwcG9ydHMgaXQgd2hlbiBjbGlja2VkLlxuJChkb2N1bWVudCkub24oJ2NsaWNrLnpmLnRyaWdnZXInLCAnW2RhdGEtb3Blbl0nLCBmdW5jdGlvbigpIHtcbiAgdHJpZ2dlcnMoJCh0aGlzKSwgJ29wZW4nKTtcbn0pO1xuXG4vLyBFbGVtZW50cyB3aXRoIFtkYXRhLWNsb3NlXSB3aWxsIGNsb3NlIGEgcGx1Z2luIHRoYXQgc3VwcG9ydHMgaXQgd2hlbiBjbGlja2VkLlxuLy8gSWYgdXNlZCB3aXRob3V0IGEgdmFsdWUgb24gW2RhdGEtY2xvc2VdLCB0aGUgZXZlbnQgd2lsbCBidWJibGUsIGFsbG93aW5nIGl0IHRvIGNsb3NlIGEgcGFyZW50IGNvbXBvbmVudC5cbiQoZG9jdW1lbnQpLm9uKCdjbGljay56Zi50cmlnZ2VyJywgJ1tkYXRhLWNsb3NlXScsIGZ1bmN0aW9uKCkge1xuICBsZXQgaWQgPSAkKHRoaXMpLmRhdGEoJ2Nsb3NlJyk7XG4gIGlmIChpZCkge1xuICAgIHRyaWdnZXJzKCQodGhpcyksICdjbG9zZScpO1xuICB9XG4gIGVsc2Uge1xuICAgICQodGhpcykudHJpZ2dlcignY2xvc2UuemYudHJpZ2dlcicpO1xuICB9XG59KTtcblxuLy8gRWxlbWVudHMgd2l0aCBbZGF0YS10b2dnbGVdIHdpbGwgdG9nZ2xlIGEgcGx1Z2luIHRoYXQgc3VwcG9ydHMgaXQgd2hlbiBjbGlja2VkLlxuJChkb2N1bWVudCkub24oJ2NsaWNrLnpmLnRyaWdnZXInLCAnW2RhdGEtdG9nZ2xlXScsIGZ1bmN0aW9uKCkge1xuICBsZXQgaWQgPSAkKHRoaXMpLmRhdGEoJ3RvZ2dsZScpO1xuICBpZiAoaWQpIHtcbiAgICB0cmlnZ2VycygkKHRoaXMpLCAndG9nZ2xlJyk7XG4gIH0gZWxzZSB7XG4gICAgJCh0aGlzKS50cmlnZ2VyKCd0b2dnbGUuemYudHJpZ2dlcicpO1xuICB9XG59KTtcblxuLy8gRWxlbWVudHMgd2l0aCBbZGF0YS1jbG9zYWJsZV0gd2lsbCByZXNwb25kIHRvIGNsb3NlLnpmLnRyaWdnZXIgZXZlbnRzLlxuJChkb2N1bWVudCkub24oJ2Nsb3NlLnpmLnRyaWdnZXInLCAnW2RhdGEtY2xvc2FibGVdJywgZnVuY3Rpb24oZSl7XG4gIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gIGxldCBhbmltYXRpb24gPSAkKHRoaXMpLmRhdGEoJ2Nsb3NhYmxlJyk7XG5cbiAgaWYoYW5pbWF0aW9uICE9PSAnJyl7XG4gICAgRm91bmRhdGlvbi5Nb3Rpb24uYW5pbWF0ZU91dCgkKHRoaXMpLCBhbmltYXRpb24sIGZ1bmN0aW9uKCkge1xuICAgICAgJCh0aGlzKS50cmlnZ2VyKCdjbG9zZWQuemYnKTtcbiAgICB9KTtcbiAgfWVsc2V7XG4gICAgJCh0aGlzKS5mYWRlT3V0KCkudHJpZ2dlcignY2xvc2VkLnpmJyk7XG4gIH1cbn0pO1xuXG4kKGRvY3VtZW50KS5vbignZm9jdXMuemYudHJpZ2dlciBibHVyLnpmLnRyaWdnZXInLCAnW2RhdGEtdG9nZ2xlLWZvY3VzXScsIGZ1bmN0aW9uKCkge1xuICBsZXQgaWQgPSAkKHRoaXMpLmRhdGEoJ3RvZ2dsZS1mb2N1cycpO1xuICAkKGAjJHtpZH1gKS50cmlnZ2VySGFuZGxlcigndG9nZ2xlLnpmLnRyaWdnZXInLCBbJCh0aGlzKV0pO1xufSk7XG5cbi8qKlxuKiBGaXJlcyBvbmNlIGFmdGVyIGFsbCBvdGhlciBzY3JpcHRzIGhhdmUgbG9hZGVkXG4qIEBmdW5jdGlvblxuKiBAcHJpdmF0ZVxuKi9cbiQod2luZG93KS5vbignbG9hZCcsICgpID0+IHtcbiAgY2hlY2tMaXN0ZW5lcnMoKTtcbn0pO1xuXG5mdW5jdGlvbiBjaGVja0xpc3RlbmVycygpIHtcbiAgZXZlbnRzTGlzdGVuZXIoKTtcbiAgcmVzaXplTGlzdGVuZXIoKTtcbiAgc2Nyb2xsTGlzdGVuZXIoKTtcbiAgY2xvc2VtZUxpc3RlbmVyKCk7XG59XG5cbi8vKioqKioqKiogb25seSBmaXJlcyB0aGlzIGZ1bmN0aW9uIG9uY2Ugb24gbG9hZCwgaWYgdGhlcmUncyBzb21ldGhpbmcgdG8gd2F0Y2ggKioqKioqKipcbmZ1bmN0aW9uIGNsb3NlbWVMaXN0ZW5lcihwbHVnaW5OYW1lKSB7XG4gIHZhciB5ZXRpQm94ZXMgPSAkKCdbZGF0YS15ZXRpLWJveF0nKSxcbiAgICAgIHBsdWdOYW1lcyA9IFsnZHJvcGRvd24nLCAndG9vbHRpcCcsICdyZXZlYWwnXTtcblxuICBpZihwbHVnaW5OYW1lKXtcbiAgICBpZih0eXBlb2YgcGx1Z2luTmFtZSA9PT0gJ3N0cmluZycpe1xuICAgICAgcGx1Z05hbWVzLnB1c2gocGx1Z2luTmFtZSk7XG4gICAgfWVsc2UgaWYodHlwZW9mIHBsdWdpbk5hbWUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBwbHVnaW5OYW1lWzBdID09PSAnc3RyaW5nJyl7XG4gICAgICBwbHVnTmFtZXMuY29uY2F0KHBsdWdpbk5hbWUpO1xuICAgIH1lbHNle1xuICAgICAgY29uc29sZS5lcnJvcignUGx1Z2luIG5hbWVzIG11c3QgYmUgc3RyaW5ncycpO1xuICAgIH1cbiAgfVxuICBpZih5ZXRpQm94ZXMubGVuZ3RoKXtcbiAgICBsZXQgbGlzdGVuZXJzID0gcGx1Z05hbWVzLm1hcCgobmFtZSkgPT4ge1xuICAgICAgcmV0dXJuIGBjbG9zZW1lLnpmLiR7bmFtZX1gO1xuICAgIH0pLmpvaW4oJyAnKTtcblxuICAgICQod2luZG93KS5vZmYobGlzdGVuZXJzKS5vbihsaXN0ZW5lcnMsIGZ1bmN0aW9uKGUsIHBsdWdpbklkKXtcbiAgICAgIGxldCBwbHVnaW4gPSBlLm5hbWVzcGFjZS5zcGxpdCgnLicpWzBdO1xuICAgICAgbGV0IHBsdWdpbnMgPSAkKGBbZGF0YS0ke3BsdWdpbn1dYCkubm90KGBbZGF0YS15ZXRpLWJveD1cIiR7cGx1Z2luSWR9XCJdYCk7XG5cbiAgICAgIHBsdWdpbnMuZWFjaChmdW5jdGlvbigpe1xuICAgICAgICBsZXQgX3RoaXMgPSAkKHRoaXMpO1xuXG4gICAgICAgIF90aGlzLnRyaWdnZXJIYW5kbGVyKCdjbG9zZS56Zi50cmlnZ2VyJywgW190aGlzXSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxufVxuXG5mdW5jdGlvbiByZXNpemVMaXN0ZW5lcihkZWJvdW5jZSl7XG4gIGxldCB0aW1lcixcbiAgICAgICRub2RlcyA9ICQoJ1tkYXRhLXJlc2l6ZV0nKTtcbiAgaWYoJG5vZGVzLmxlbmd0aCl7XG4gICAgJCh3aW5kb3cpLm9mZigncmVzaXplLnpmLnRyaWdnZXInKVxuICAgIC5vbigncmVzaXplLnpmLnRyaWdnZXInLCBmdW5jdGlvbihlKSB7XG4gICAgICBpZiAodGltZXIpIHsgY2xlYXJUaW1lb3V0KHRpbWVyKTsgfVxuXG4gICAgICB0aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcblxuICAgICAgICBpZighTXV0YXRpb25PYnNlcnZlcil7Ly9mYWxsYmFjayBmb3IgSUUgOVxuICAgICAgICAgICRub2Rlcy5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAkKHRoaXMpLnRyaWdnZXJIYW5kbGVyKCdyZXNpemVtZS56Zi50cmlnZ2VyJyk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgLy90cmlnZ2VyIGFsbCBsaXN0ZW5pbmcgZWxlbWVudHMgYW5kIHNpZ25hbCBhIHJlc2l6ZSBldmVudFxuICAgICAgICAkbm9kZXMuYXR0cignZGF0YS1ldmVudHMnLCBcInJlc2l6ZVwiKTtcbiAgICAgIH0sIGRlYm91bmNlIHx8IDEwKTsvL2RlZmF1bHQgdGltZSB0byBlbWl0IHJlc2l6ZSBldmVudFxuICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIHNjcm9sbExpc3RlbmVyKGRlYm91bmNlKXtcbiAgbGV0IHRpbWVyLFxuICAgICAgJG5vZGVzID0gJCgnW2RhdGEtc2Nyb2xsXScpO1xuICBpZigkbm9kZXMubGVuZ3RoKXtcbiAgICAkKHdpbmRvdykub2ZmKCdzY3JvbGwuemYudHJpZ2dlcicpXG4gICAgLm9uKCdzY3JvbGwuemYudHJpZ2dlcicsIGZ1bmN0aW9uKGUpe1xuICAgICAgaWYodGltZXIpeyBjbGVhclRpbWVvdXQodGltZXIpOyB9XG5cbiAgICAgIHRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xuXG4gICAgICAgIGlmKCFNdXRhdGlvbk9ic2VydmVyKXsvL2ZhbGxiYWNrIGZvciBJRSA5XG4gICAgICAgICAgJG5vZGVzLmVhY2goZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICQodGhpcykudHJpZ2dlckhhbmRsZXIoJ3Njcm9sbG1lLnpmLnRyaWdnZXInKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICAvL3RyaWdnZXIgYWxsIGxpc3RlbmluZyBlbGVtZW50cyBhbmQgc2lnbmFsIGEgc2Nyb2xsIGV2ZW50XG4gICAgICAgICRub2Rlcy5hdHRyKCdkYXRhLWV2ZW50cycsIFwic2Nyb2xsXCIpO1xuICAgICAgfSwgZGVib3VuY2UgfHwgMTApOy8vZGVmYXVsdCB0aW1lIHRvIGVtaXQgc2Nyb2xsIGV2ZW50XG4gICAgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZXZlbnRzTGlzdGVuZXIoKSB7XG4gIGlmKCFNdXRhdGlvbk9ic2VydmVyKXsgcmV0dXJuIGZhbHNlOyB9XG4gIGxldCBub2RlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLXJlc2l6ZV0sIFtkYXRhLXNjcm9sbF0sIFtkYXRhLW11dGF0ZV0nKTtcblxuICAvL2VsZW1lbnQgY2FsbGJhY2tcbiAgdmFyIGxpc3RlbmluZ0VsZW1lbnRzTXV0YXRpb24gPSBmdW5jdGlvbiAobXV0YXRpb25SZWNvcmRzTGlzdCkge1xuICAgICAgdmFyICR0YXJnZXQgPSAkKG11dGF0aW9uUmVjb3Jkc0xpc3RbMF0udGFyZ2V0KTtcblxuXHQgIC8vdHJpZ2dlciB0aGUgZXZlbnQgaGFuZGxlciBmb3IgdGhlIGVsZW1lbnQgZGVwZW5kaW5nIG9uIHR5cGVcbiAgICAgIHN3aXRjaCAobXV0YXRpb25SZWNvcmRzTGlzdFswXS50eXBlKSB7XG5cbiAgICAgICAgY2FzZSBcImF0dHJpYnV0ZXNcIjpcbiAgICAgICAgICBpZiAoJHRhcmdldC5hdHRyKFwiZGF0YS1ldmVudHNcIikgPT09IFwic2Nyb2xsXCIgJiYgbXV0YXRpb25SZWNvcmRzTGlzdFswXS5hdHRyaWJ1dGVOYW1lID09PSBcImRhdGEtZXZlbnRzXCIpIHtcblx0XHQgIFx0JHRhcmdldC50cmlnZ2VySGFuZGxlcignc2Nyb2xsbWUuemYudHJpZ2dlcicsIFskdGFyZ2V0LCB3aW5kb3cucGFnZVlPZmZzZXRdKTtcblx0XHQgIH1cblx0XHQgIGlmICgkdGFyZ2V0LmF0dHIoXCJkYXRhLWV2ZW50c1wiKSA9PT0gXCJyZXNpemVcIiAmJiBtdXRhdGlvblJlY29yZHNMaXN0WzBdLmF0dHJpYnV0ZU5hbWUgPT09IFwiZGF0YS1ldmVudHNcIikge1xuXHRcdCAgXHQkdGFyZ2V0LnRyaWdnZXJIYW5kbGVyKCdyZXNpemVtZS56Zi50cmlnZ2VyJywgWyR0YXJnZXRdKTtcblx0XHQgICB9XG5cdFx0ICBpZiAobXV0YXRpb25SZWNvcmRzTGlzdFswXS5hdHRyaWJ1dGVOYW1lID09PSBcInN0eWxlXCIpIHtcblx0XHRcdCAgJHRhcmdldC5jbG9zZXN0KFwiW2RhdGEtbXV0YXRlXVwiKS5hdHRyKFwiZGF0YS1ldmVudHNcIixcIm11dGF0ZVwiKTtcblx0XHRcdCAgJHRhcmdldC5jbG9zZXN0KFwiW2RhdGEtbXV0YXRlXVwiKS50cmlnZ2VySGFuZGxlcignbXV0YXRlbWUuemYudHJpZ2dlcicsIFskdGFyZ2V0LmNsb3Nlc3QoXCJbZGF0YS1tdXRhdGVdXCIpXSk7XG5cdFx0ICB9XG5cdFx0ICBicmVhaztcblxuICAgICAgICBjYXNlIFwiY2hpbGRMaXN0XCI6XG5cdFx0ICAkdGFyZ2V0LmNsb3Nlc3QoXCJbZGF0YS1tdXRhdGVdXCIpLmF0dHIoXCJkYXRhLWV2ZW50c1wiLFwibXV0YXRlXCIpO1xuXHRcdCAgJHRhcmdldC5jbG9zZXN0KFwiW2RhdGEtbXV0YXRlXVwiKS50cmlnZ2VySGFuZGxlcignbXV0YXRlbWUuemYudHJpZ2dlcicsIFskdGFyZ2V0LmNsb3Nlc3QoXCJbZGF0YS1tdXRhdGVdXCIpXSk7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIC8vbm90aGluZ1xuICAgICAgfVxuICAgIH07XG5cbiAgICBpZiAobm9kZXMubGVuZ3RoKSB7XG4gICAgICAvL2ZvciBlYWNoIGVsZW1lbnQgdGhhdCBuZWVkcyB0byBsaXN0ZW4gZm9yIHJlc2l6aW5nLCBzY3JvbGxpbmcsIG9yIG11dGF0aW9uIGFkZCBhIHNpbmdsZSBvYnNlcnZlclxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPD0gbm9kZXMubGVuZ3RoIC0gMTsgaSsrKSB7XG4gICAgICAgIHZhciBlbGVtZW50T2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihsaXN0ZW5pbmdFbGVtZW50c011dGF0aW9uKTtcbiAgICAgICAgZWxlbWVudE9ic2VydmVyLm9ic2VydmUobm9kZXNbaV0sIHsgYXR0cmlidXRlczogdHJ1ZSwgY2hpbGRMaXN0OiB0cnVlLCBjaGFyYWN0ZXJEYXRhOiBmYWxzZSwgc3VidHJlZTogdHJ1ZSwgYXR0cmlidXRlRmlsdGVyOiBbXCJkYXRhLWV2ZW50c1wiLCBcInN0eWxlXCJdIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuLy8gW1BIXVxuLy8gRm91bmRhdGlvbi5DaGVja1dhdGNoZXJzID0gY2hlY2tXYXRjaGVycztcbkZvdW5kYXRpb24uSUhlYXJZb3UgPSBjaGVja0xpc3RlbmVycztcbi8vIEZvdW5kYXRpb24uSVNlZVlvdSA9IHNjcm9sbExpc3RlbmVyO1xuLy8gRm91bmRhdGlvbi5JRmVlbFlvdSA9IGNsb3NlbWVMaXN0ZW5lcjtcblxufShqUXVlcnkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG4vKipcbiAqIEFiaWRlIG1vZHVsZS5cbiAqIEBtb2R1bGUgZm91bmRhdGlvbi5hYmlkZVxuICovXG5cbmNsYXNzIEFiaWRlIHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgQWJpZGUuXG4gICAqIEBjbGFzc1xuICAgKiBAZmlyZXMgQWJpZGUjaW5pdFxuICAgKiBAcGFyYW0ge09iamVjdH0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gYWRkIHRoZSB0cmlnZ2VyIHRvLlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE92ZXJyaWRlcyB0byB0aGUgZGVmYXVsdCBwbHVnaW4gc2V0dGluZ3MuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihlbGVtZW50LCBvcHRpb25zID0ge30pIHtcbiAgICB0aGlzLiRlbGVtZW50ID0gZWxlbWVudDtcbiAgICB0aGlzLm9wdGlvbnMgID0gJC5leHRlbmQoe30sIEFiaWRlLmRlZmF1bHRzLCB0aGlzLiRlbGVtZW50LmRhdGEoKSwgb3B0aW9ucyk7XG5cbiAgICB0aGlzLl9pbml0KCk7XG5cbiAgICBGb3VuZGF0aW9uLnJlZ2lzdGVyUGx1Z2luKHRoaXMsICdBYmlkZScpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIHRoZSBBYmlkZSBwbHVnaW4gYW5kIGNhbGxzIGZ1bmN0aW9ucyB0byBnZXQgQWJpZGUgZnVuY3Rpb25pbmcgb24gbG9hZC5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9pbml0KCkge1xuICAgIHRoaXMuJGlucHV0cyA9IHRoaXMuJGVsZW1lbnQuZmluZCgnaW5wdXQsIHRleHRhcmVhLCBzZWxlY3QnKTtcblxuICAgIHRoaXMuX2V2ZW50cygpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIGV2ZW50cyBmb3IgQWJpZGUuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfZXZlbnRzKCkge1xuICAgIHRoaXMuJGVsZW1lbnQub2ZmKCcuYWJpZGUnKVxuICAgICAgLm9uKCdyZXNldC56Zi5hYmlkZScsICgpID0+IHtcbiAgICAgICAgdGhpcy5yZXNldEZvcm0oKTtcbiAgICAgIH0pXG4gICAgICAub24oJ3N1Ym1pdC56Zi5hYmlkZScsICgpID0+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsaWRhdGVGb3JtKCk7XG4gICAgICB9KTtcblxuICAgIGlmICh0aGlzLm9wdGlvbnMudmFsaWRhdGVPbiA9PT0gJ2ZpZWxkQ2hhbmdlJykge1xuICAgICAgdGhpcy4kaW5wdXRzXG4gICAgICAgIC5vZmYoJ2NoYW5nZS56Zi5hYmlkZScpXG4gICAgICAgIC5vbignY2hhbmdlLnpmLmFiaWRlJywgKGUpID0+IHtcbiAgICAgICAgICB0aGlzLnZhbGlkYXRlSW5wdXQoJChlLnRhcmdldCkpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmxpdmVWYWxpZGF0ZSkge1xuICAgICAgdGhpcy4kaW5wdXRzXG4gICAgICAgIC5vZmYoJ2lucHV0LnpmLmFiaWRlJylcbiAgICAgICAgLm9uKCdpbnB1dC56Zi5hYmlkZScsIChlKSA9PiB7XG4gICAgICAgICAgdGhpcy52YWxpZGF0ZUlucHV0KCQoZS50YXJnZXQpKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMub3B0aW9ucy52YWxpZGF0ZU9uQmx1cikge1xuICAgICAgdGhpcy4kaW5wdXRzXG4gICAgICAgIC5vZmYoJ2JsdXIuemYuYWJpZGUnKVxuICAgICAgICAub24oJ2JsdXIuemYuYWJpZGUnLCAoZSkgPT4ge1xuICAgICAgICAgIHRoaXMudmFsaWRhdGVJbnB1dCgkKGUudGFyZ2V0KSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxscyBuZWNlc3NhcnkgZnVuY3Rpb25zIHRvIHVwZGF0ZSBBYmlkZSB1cG9uIERPTSBjaGFuZ2VcbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9yZWZsb3coKSB7XG4gICAgdGhpcy5faW5pdCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyB3aGV0aGVyIG9yIG5vdCBhIGZvcm0gZWxlbWVudCBoYXMgdGhlIHJlcXVpcmVkIGF0dHJpYnV0ZSBhbmQgaWYgaXQncyBjaGVja2VkIG9yIG5vdFxuICAgKiBAcGFyYW0ge09iamVjdH0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gY2hlY2sgZm9yIHJlcXVpcmVkIGF0dHJpYnV0ZVxuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gQm9vbGVhbiB2YWx1ZSBkZXBlbmRzIG9uIHdoZXRoZXIgb3Igbm90IGF0dHJpYnV0ZSBpcyBjaGVja2VkIG9yIGVtcHR5XG4gICAqL1xuICByZXF1aXJlZENoZWNrKCRlbCkge1xuICAgIGlmICghJGVsLmF0dHIoJ3JlcXVpcmVkJykpIHJldHVybiB0cnVlO1xuXG4gICAgdmFyIGlzR29vZCA9IHRydWU7XG5cbiAgICBzd2l0Y2ggKCRlbFswXS50eXBlKSB7XG4gICAgICBjYXNlICdjaGVja2JveCc6XG4gICAgICAgIGlzR29vZCA9ICRlbFswXS5jaGVja2VkO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnc2VsZWN0JzpcbiAgICAgIGNhc2UgJ3NlbGVjdC1vbmUnOlxuICAgICAgY2FzZSAnc2VsZWN0LW11bHRpcGxlJzpcbiAgICAgICAgdmFyIG9wdCA9ICRlbC5maW5kKCdvcHRpb246c2VsZWN0ZWQnKTtcbiAgICAgICAgaWYgKCFvcHQubGVuZ3RoIHx8ICFvcHQudmFsKCkpIGlzR29vZCA9IGZhbHNlO1xuICAgICAgICBicmVhaztcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYoISRlbC52YWwoKSB8fCAhJGVsLnZhbCgpLmxlbmd0aCkgaXNHb29kID0gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIGlzR29vZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQ6XG4gICAqIC0gQmFzZWQgb24gJGVsLCB0aGUgZmlyc3QgZWxlbWVudChzKSBjb3JyZXNwb25kaW5nIHRvIGBmb3JtRXJyb3JTZWxlY3RvcmAgaW4gdGhpcyBvcmRlcjpcbiAgICogICAxLiBUaGUgZWxlbWVudCdzIGRpcmVjdCBzaWJsaW5nKCdzKS5cbiAgICogICAyLiBUaGUgZWxlbWVudCdzIHBhcmVudCdzIGNoaWxkcmVuLlxuICAgKiAtIEVsZW1lbnQocykgd2l0aCB0aGUgYXR0cmlidXRlIGBbZGF0YS1mb3JtLWVycm9yLWZvcl1gIHNldCB3aXRoIHRoZSBlbGVtZW50J3MgaWQuXG4gICAqXG4gICAqIFRoaXMgYWxsb3dzIGZvciBtdWx0aXBsZSBmb3JtIGVycm9ycyBwZXIgaW5wdXQsIHRob3VnaCBpZiBub25lIGFyZSBmb3VuZCwgbm8gZm9ybSBlcnJvcnMgd2lsbCBiZSBzaG93bi5cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9ICRlbCAtIGpRdWVyeSBvYmplY3QgdG8gdXNlIGFzIHJlZmVyZW5jZSB0byBmaW5kIHRoZSBmb3JtIGVycm9yIHNlbGVjdG9yLlxuICAgKiBAcmV0dXJucyB7T2JqZWN0fSBqUXVlcnkgb2JqZWN0IHdpdGggdGhlIHNlbGVjdG9yLlxuICAgKi9cbiAgZmluZEZvcm1FcnJvcigkZWwpIHtcbiAgICB2YXIgaWQgPSAkZWxbMF0uaWQ7XG4gICAgdmFyICRlcnJvciA9ICRlbC5zaWJsaW5ncyh0aGlzLm9wdGlvbnMuZm9ybUVycm9yU2VsZWN0b3IpO1xuXG4gICAgaWYgKCEkZXJyb3IubGVuZ3RoKSB7XG4gICAgICAkZXJyb3IgPSAkZWwucGFyZW50KCkuZmluZCh0aGlzLm9wdGlvbnMuZm9ybUVycm9yU2VsZWN0b3IpO1xuICAgIH1cblxuICAgICRlcnJvciA9ICRlcnJvci5hZGQodGhpcy4kZWxlbWVudC5maW5kKGBbZGF0YS1mb3JtLWVycm9yLWZvcj1cIiR7aWR9XCJdYCkpO1xuXG4gICAgcmV0dXJuICRlcnJvcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIGZpcnN0IGVsZW1lbnQgaW4gdGhpcyBvcmRlcjpcbiAgICogMi4gVGhlIDxsYWJlbD4gd2l0aCB0aGUgYXR0cmlidXRlIGBbZm9yPVwic29tZUlucHV0SWRcIl1gXG4gICAqIDMuIFRoZSBgLmNsb3Nlc3QoKWAgPGxhYmVsPlxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gJGVsIC0galF1ZXJ5IG9iamVjdCB0byBjaGVjayBmb3IgcmVxdWlyZWQgYXR0cmlidXRlXG4gICAqIEByZXR1cm5zIHtCb29sZWFufSBCb29sZWFuIHZhbHVlIGRlcGVuZHMgb24gd2hldGhlciBvciBub3QgYXR0cmlidXRlIGlzIGNoZWNrZWQgb3IgZW1wdHlcbiAgICovXG4gIGZpbmRMYWJlbCgkZWwpIHtcbiAgICB2YXIgaWQgPSAkZWxbMF0uaWQ7XG4gICAgdmFyICRsYWJlbCA9IHRoaXMuJGVsZW1lbnQuZmluZChgbGFiZWxbZm9yPVwiJHtpZH1cIl1gKTtcblxuICAgIGlmICghJGxhYmVsLmxlbmd0aCkge1xuICAgICAgcmV0dXJuICRlbC5jbG9zZXN0KCdsYWJlbCcpO1xuICAgIH1cblxuICAgIHJldHVybiAkbGFiZWw7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBzZXQgb2YgbGFiZWxzIGFzc29jaWF0ZWQgd2l0aCBhIHNldCBvZiByYWRpbyBlbHMgaW4gdGhpcyBvcmRlclxuICAgKiAyLiBUaGUgPGxhYmVsPiB3aXRoIHRoZSBhdHRyaWJ1dGUgYFtmb3I9XCJzb21lSW5wdXRJZFwiXWBcbiAgICogMy4gVGhlIGAuY2xvc2VzdCgpYCA8bGFiZWw+XG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAkZWwgLSBqUXVlcnkgb2JqZWN0IHRvIGNoZWNrIGZvciByZXF1aXJlZCBhdHRyaWJ1dGVcbiAgICogQHJldHVybnMge0Jvb2xlYW59IEJvb2xlYW4gdmFsdWUgZGVwZW5kcyBvbiB3aGV0aGVyIG9yIG5vdCBhdHRyaWJ1dGUgaXMgY2hlY2tlZCBvciBlbXB0eVxuICAgKi9cbiAgZmluZFJhZGlvTGFiZWxzKCRlbHMpIHtcbiAgICB2YXIgbGFiZWxzID0gJGVscy5tYXAoKGksIGVsKSA9PiB7XG4gICAgICB2YXIgaWQgPSBlbC5pZDtcbiAgICAgIHZhciAkbGFiZWwgPSB0aGlzLiRlbGVtZW50LmZpbmQoYGxhYmVsW2Zvcj1cIiR7aWR9XCJdYCk7XG5cbiAgICAgIGlmICghJGxhYmVsLmxlbmd0aCkge1xuICAgICAgICAkbGFiZWwgPSAkKGVsKS5jbG9zZXN0KCdsYWJlbCcpO1xuICAgICAgfVxuICAgICAgcmV0dXJuICRsYWJlbFswXTtcbiAgICB9KTtcblxuICAgIHJldHVybiAkKGxhYmVscyk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyB0aGUgQ1NTIGVycm9yIGNsYXNzIGFzIHNwZWNpZmllZCBieSB0aGUgQWJpZGUgc2V0dGluZ3MgdG8gdGhlIGxhYmVsLCBpbnB1dCwgYW5kIHRoZSBmb3JtXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAkZWwgLSBqUXVlcnkgb2JqZWN0IHRvIGFkZCB0aGUgY2xhc3MgdG9cbiAgICovXG4gIGFkZEVycm9yQ2xhc3NlcygkZWwpIHtcbiAgICB2YXIgJGxhYmVsID0gdGhpcy5maW5kTGFiZWwoJGVsKTtcbiAgICB2YXIgJGZvcm1FcnJvciA9IHRoaXMuZmluZEZvcm1FcnJvcigkZWwpO1xuXG4gICAgaWYgKCRsYWJlbC5sZW5ndGgpIHtcbiAgICAgICRsYWJlbC5hZGRDbGFzcyh0aGlzLm9wdGlvbnMubGFiZWxFcnJvckNsYXNzKTtcbiAgICB9XG5cbiAgICBpZiAoJGZvcm1FcnJvci5sZW5ndGgpIHtcbiAgICAgICRmb3JtRXJyb3IuYWRkQ2xhc3ModGhpcy5vcHRpb25zLmZvcm1FcnJvckNsYXNzKTtcbiAgICB9XG5cbiAgICAkZWwuYWRkQ2xhc3ModGhpcy5vcHRpb25zLmlucHV0RXJyb3JDbGFzcykuYXR0cignZGF0YS1pbnZhbGlkJywgJycpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBDU1MgZXJyb3IgY2xhc3NlcyBldGMgZnJvbSBhbiBlbnRpcmUgcmFkaW8gYnV0dG9uIGdyb3VwXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBncm91cE5hbWUgLSBBIHN0cmluZyB0aGF0IHNwZWNpZmllcyB0aGUgbmFtZSBvZiBhIHJhZGlvIGJ1dHRvbiBncm91cFxuICAgKlxuICAgKi9cblxuICByZW1vdmVSYWRpb0Vycm9yQ2xhc3Nlcyhncm91cE5hbWUpIHtcbiAgICB2YXIgJGVscyA9IHRoaXMuJGVsZW1lbnQuZmluZChgOnJhZGlvW25hbWU9XCIke2dyb3VwTmFtZX1cIl1gKTtcbiAgICB2YXIgJGxhYmVscyA9IHRoaXMuZmluZFJhZGlvTGFiZWxzKCRlbHMpO1xuICAgIHZhciAkZm9ybUVycm9ycyA9IHRoaXMuZmluZEZvcm1FcnJvcigkZWxzKTtcblxuICAgIGlmICgkbGFiZWxzLmxlbmd0aCkge1xuICAgICAgJGxhYmVscy5yZW1vdmVDbGFzcyh0aGlzLm9wdGlvbnMubGFiZWxFcnJvckNsYXNzKTtcbiAgICB9XG5cbiAgICBpZiAoJGZvcm1FcnJvcnMubGVuZ3RoKSB7XG4gICAgICAkZm9ybUVycm9ycy5yZW1vdmVDbGFzcyh0aGlzLm9wdGlvbnMuZm9ybUVycm9yQ2xhc3MpO1xuICAgIH1cblxuICAgICRlbHMucmVtb3ZlQ2xhc3ModGhpcy5vcHRpb25zLmlucHV0RXJyb3JDbGFzcykucmVtb3ZlQXR0cignZGF0YS1pbnZhbGlkJyk7XG5cbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIENTUyBlcnJvciBjbGFzcyBhcyBzcGVjaWZpZWQgYnkgdGhlIEFiaWRlIHNldHRpbmdzIGZyb20gdGhlIGxhYmVsLCBpbnB1dCwgYW5kIHRoZSBmb3JtXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAkZWwgLSBqUXVlcnkgb2JqZWN0IHRvIHJlbW92ZSB0aGUgY2xhc3MgZnJvbVxuICAgKi9cbiAgcmVtb3ZlRXJyb3JDbGFzc2VzKCRlbCkge1xuICAgIC8vIHJhZGlvcyBuZWVkIHRvIGNsZWFyIGFsbCBvZiB0aGUgZWxzXG4gICAgaWYoJGVsWzBdLnR5cGUgPT0gJ3JhZGlvJykge1xuICAgICAgcmV0dXJuIHRoaXMucmVtb3ZlUmFkaW9FcnJvckNsYXNzZXMoJGVsLmF0dHIoJ25hbWUnKSk7XG4gICAgfVxuXG4gICAgdmFyICRsYWJlbCA9IHRoaXMuZmluZExhYmVsKCRlbCk7XG4gICAgdmFyICRmb3JtRXJyb3IgPSB0aGlzLmZpbmRGb3JtRXJyb3IoJGVsKTtcblxuICAgIGlmICgkbGFiZWwubGVuZ3RoKSB7XG4gICAgICAkbGFiZWwucmVtb3ZlQ2xhc3ModGhpcy5vcHRpb25zLmxhYmVsRXJyb3JDbGFzcyk7XG4gICAgfVxuXG4gICAgaWYgKCRmb3JtRXJyb3IubGVuZ3RoKSB7XG4gICAgICAkZm9ybUVycm9yLnJlbW92ZUNsYXNzKHRoaXMub3B0aW9ucy5mb3JtRXJyb3JDbGFzcyk7XG4gICAgfVxuXG4gICAgJGVsLnJlbW92ZUNsYXNzKHRoaXMub3B0aW9ucy5pbnB1dEVycm9yQ2xhc3MpLnJlbW92ZUF0dHIoJ2RhdGEtaW52YWxpZCcpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdvZXMgdGhyb3VnaCBhIGZvcm0gdG8gZmluZCBpbnB1dHMgYW5kIHByb2NlZWRzIHRvIHZhbGlkYXRlIHRoZW0gaW4gd2F5cyBzcGVjaWZpYyB0byB0aGVpciB0eXBlLiBcbiAgICogSWdub3JlcyBpbnB1dHMgd2l0aCBkYXRhLWFiaWRlLWlnbm9yZSwgdHlwZT1cImhpZGRlblwiIG9yIGRpc2FibGVkIGF0dHJpYnV0ZXMgc2V0XG4gICAqIEBmaXJlcyBBYmlkZSNpbnZhbGlkXG4gICAqIEBmaXJlcyBBYmlkZSN2YWxpZFxuICAgKiBAcGFyYW0ge09iamVjdH0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gdmFsaWRhdGUsIHNob3VsZCBiZSBhbiBIVE1MIGlucHV0XG4gICAqIEByZXR1cm5zIHtCb29sZWFufSBnb29kVG9HbyAtIElmIHRoZSBpbnB1dCBpcyB2YWxpZCBvciBub3QuXG4gICAqL1xuICB2YWxpZGF0ZUlucHV0KCRlbCkge1xuICAgIHZhciBjbGVhclJlcXVpcmUgPSB0aGlzLnJlcXVpcmVkQ2hlY2soJGVsKSxcbiAgICAgICAgdmFsaWRhdGVkID0gZmFsc2UsXG4gICAgICAgIGN1c3RvbVZhbGlkYXRvciA9IHRydWUsXG4gICAgICAgIHZhbGlkYXRvciA9ICRlbC5hdHRyKCdkYXRhLXZhbGlkYXRvcicpLFxuICAgICAgICBlcXVhbFRvID0gdHJ1ZTtcblxuICAgIC8vIGRvbid0IHZhbGlkYXRlIGlnbm9yZWQgaW5wdXRzIG9yIGhpZGRlbiBpbnB1dHMgb3IgZGlzYWJsZWQgaW5wdXRzXG4gICAgaWYgKCRlbC5pcygnW2RhdGEtYWJpZGUtaWdub3JlXScpIHx8ICRlbC5pcygnW3R5cGU9XCJoaWRkZW5cIl0nKSB8fCAkZWwuaXMoJ1tkaXNhYmxlZF0nKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgc3dpdGNoICgkZWxbMF0udHlwZSkge1xuICAgICAgY2FzZSAncmFkaW8nOlxuICAgICAgICB2YWxpZGF0ZWQgPSB0aGlzLnZhbGlkYXRlUmFkaW8oJGVsLmF0dHIoJ25hbWUnKSk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdjaGVja2JveCc6XG4gICAgICAgIHZhbGlkYXRlZCA9IGNsZWFyUmVxdWlyZTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ3NlbGVjdCc6XG4gICAgICBjYXNlICdzZWxlY3Qtb25lJzpcbiAgICAgIGNhc2UgJ3NlbGVjdC1tdWx0aXBsZSc6XG4gICAgICAgIHZhbGlkYXRlZCA9IGNsZWFyUmVxdWlyZTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHZhbGlkYXRlZCA9IHRoaXMudmFsaWRhdGVUZXh0KCRlbCk7XG4gICAgfVxuXG4gICAgaWYgKHZhbGlkYXRvcikge1xuICAgICAgY3VzdG9tVmFsaWRhdG9yID0gdGhpcy5tYXRjaFZhbGlkYXRpb24oJGVsLCB2YWxpZGF0b3IsICRlbC5hdHRyKCdyZXF1aXJlZCcpKTtcbiAgICB9XG5cbiAgICBpZiAoJGVsLmF0dHIoJ2RhdGEtZXF1YWx0bycpKSB7XG4gICAgICBlcXVhbFRvID0gdGhpcy5vcHRpb25zLnZhbGlkYXRvcnMuZXF1YWxUbygkZWwpO1xuICAgIH1cblxuXG4gICAgdmFyIGdvb2RUb0dvID0gW2NsZWFyUmVxdWlyZSwgdmFsaWRhdGVkLCBjdXN0b21WYWxpZGF0b3IsIGVxdWFsVG9dLmluZGV4T2YoZmFsc2UpID09PSAtMTtcbiAgICB2YXIgbWVzc2FnZSA9IChnb29kVG9HbyA/ICd2YWxpZCcgOiAnaW52YWxpZCcpICsgJy56Zi5hYmlkZSc7XG5cbiAgICBpZiAoZ29vZFRvR28pIHtcbiAgICAgIC8vIFJlLXZhbGlkYXRlIGlucHV0cyB0aGF0IGRlcGVuZCBvbiB0aGlzIG9uZSB3aXRoIGVxdWFsdG9cbiAgICAgIGNvbnN0IGRlcGVuZGVudEVsZW1lbnRzID0gdGhpcy4kZWxlbWVudC5maW5kKGBbZGF0YS1lcXVhbHRvPVwiJHskZWwuYXR0cignaWQnKX1cIl1gKTtcbiAgICAgIGlmIChkZXBlbmRlbnRFbGVtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgbGV0IF90aGlzID0gdGhpcztcbiAgICAgICAgZGVwZW5kZW50RWxlbWVudHMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAoJCh0aGlzKS52YWwoKSkge1xuICAgICAgICAgICAgX3RoaXMudmFsaWRhdGVJbnB1dCgkKHRoaXMpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXNbZ29vZFRvR28gPyAncmVtb3ZlRXJyb3JDbGFzc2VzJyA6ICdhZGRFcnJvckNsYXNzZXMnXSgkZWwpO1xuXG4gICAgLyoqXG4gICAgICogRmlyZXMgd2hlbiB0aGUgaW5wdXQgaXMgZG9uZSBjaGVja2luZyBmb3IgdmFsaWRhdGlvbi4gRXZlbnQgdHJpZ2dlciBpcyBlaXRoZXIgYHZhbGlkLnpmLmFiaWRlYCBvciBgaW52YWxpZC56Zi5hYmlkZWBcbiAgICAgKiBUcmlnZ2VyIGluY2x1ZGVzIHRoZSBET00gZWxlbWVudCBvZiB0aGUgaW5wdXQuXG4gICAgICogQGV2ZW50IEFiaWRlI3ZhbGlkXG4gICAgICogQGV2ZW50IEFiaWRlI2ludmFsaWRcbiAgICAgKi9cbiAgICAkZWwudHJpZ2dlcihtZXNzYWdlLCBbJGVsXSk7XG5cbiAgICByZXR1cm4gZ29vZFRvR287XG4gIH1cblxuICAvKipcbiAgICogR29lcyB0aHJvdWdoIGEgZm9ybSBhbmQgaWYgdGhlcmUgYXJlIGFueSBpbnZhbGlkIGlucHV0cywgaXQgd2lsbCBkaXNwbGF5IHRoZSBmb3JtIGVycm9yIGVsZW1lbnRcbiAgICogQHJldHVybnMge0Jvb2xlYW59IG5vRXJyb3IgLSB0cnVlIGlmIG5vIGVycm9ycyB3ZXJlIGRldGVjdGVkLi4uXG4gICAqIEBmaXJlcyBBYmlkZSNmb3JtdmFsaWRcbiAgICogQGZpcmVzIEFiaWRlI2Zvcm1pbnZhbGlkXG4gICAqL1xuICB2YWxpZGF0ZUZvcm0oKSB7XG4gICAgdmFyIGFjYyA9IFtdO1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICB0aGlzLiRpbnB1dHMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgIGFjYy5wdXNoKF90aGlzLnZhbGlkYXRlSW5wdXQoJCh0aGlzKSkpO1xuICAgIH0pO1xuXG4gICAgdmFyIG5vRXJyb3IgPSBhY2MuaW5kZXhPZihmYWxzZSkgPT09IC0xO1xuXG4gICAgdGhpcy4kZWxlbWVudC5maW5kKCdbZGF0YS1hYmlkZS1lcnJvcl0nKS5jc3MoJ2Rpc3BsYXknLCAobm9FcnJvciA/ICdub25lJyA6ICdibG9jaycpKTtcblxuICAgIC8qKlxuICAgICAqIEZpcmVzIHdoZW4gdGhlIGZvcm0gaXMgZmluaXNoZWQgdmFsaWRhdGluZy4gRXZlbnQgdHJpZ2dlciBpcyBlaXRoZXIgYGZvcm12YWxpZC56Zi5hYmlkZWAgb3IgYGZvcm1pbnZhbGlkLnpmLmFiaWRlYC5cbiAgICAgKiBUcmlnZ2VyIGluY2x1ZGVzIHRoZSBlbGVtZW50IG9mIHRoZSBmb3JtLlxuICAgICAqIEBldmVudCBBYmlkZSNmb3JtdmFsaWRcbiAgICAgKiBAZXZlbnQgQWJpZGUjZm9ybWludmFsaWRcbiAgICAgKi9cbiAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoKG5vRXJyb3IgPyAnZm9ybXZhbGlkJyA6ICdmb3JtaW52YWxpZCcpICsgJy56Zi5hYmlkZScsIFt0aGlzLiRlbGVtZW50XSk7XG5cbiAgICByZXR1cm4gbm9FcnJvcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmVzIHdoZXRoZXIgb3IgYSBub3QgYSB0ZXh0IGlucHV0IGlzIHZhbGlkIGJhc2VkIG9uIHRoZSBwYXR0ZXJuIHNwZWNpZmllZCBpbiB0aGUgYXR0cmlidXRlLiBJZiBubyBtYXRjaGluZyBwYXR0ZXJuIGlzIGZvdW5kLCByZXR1cm5zIHRydWUuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAkZWwgLSBqUXVlcnkgb2JqZWN0IHRvIHZhbGlkYXRlLCBzaG91bGQgYmUgYSB0ZXh0IGlucHV0IEhUTUwgZWxlbWVudFxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGF0dGVybiAtIHN0cmluZyB2YWx1ZSBvZiBvbmUgb2YgdGhlIFJlZ0V4IHBhdHRlcm5zIGluIEFiaWRlLm9wdGlvbnMucGF0dGVybnNcbiAgICogQHJldHVybnMge0Jvb2xlYW59IEJvb2xlYW4gdmFsdWUgZGVwZW5kcyBvbiB3aGV0aGVyIG9yIG5vdCB0aGUgaW5wdXQgdmFsdWUgbWF0Y2hlcyB0aGUgcGF0dGVybiBzcGVjaWZpZWRcbiAgICovXG4gIHZhbGlkYXRlVGV4dCgkZWwsIHBhdHRlcm4pIHtcbiAgICAvLyBBIHBhdHRlcm4gY2FuIGJlIHBhc3NlZCB0byB0aGlzIGZ1bmN0aW9uLCBvciBpdCB3aWxsIGJlIGluZmVyZWQgZnJvbSB0aGUgaW5wdXQncyBcInBhdHRlcm5cIiBhdHRyaWJ1dGUsIG9yIGl0J3MgXCJ0eXBlXCIgYXR0cmlidXRlXG4gICAgcGF0dGVybiA9IChwYXR0ZXJuIHx8ICRlbC5hdHRyKCdwYXR0ZXJuJykgfHwgJGVsLmF0dHIoJ3R5cGUnKSk7XG4gICAgdmFyIGlucHV0VGV4dCA9ICRlbC52YWwoKTtcbiAgICB2YXIgdmFsaWQgPSBmYWxzZTtcblxuICAgIGlmIChpbnB1dFRleHQubGVuZ3RoKSB7XG4gICAgICAvLyBJZiB0aGUgcGF0dGVybiBhdHRyaWJ1dGUgb24gdGhlIGVsZW1lbnQgaXMgaW4gQWJpZGUncyBsaXN0IG9mIHBhdHRlcm5zLCB0aGVuIHRlc3QgdGhhdCByZWdleHBcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMucGF0dGVybnMuaGFzT3duUHJvcGVydHkocGF0dGVybikpIHtcbiAgICAgICAgdmFsaWQgPSB0aGlzLm9wdGlvbnMucGF0dGVybnNbcGF0dGVybl0udGVzdChpbnB1dFRleHQpO1xuICAgICAgfVxuICAgICAgLy8gSWYgdGhlIHBhdHRlcm4gbmFtZSBpc24ndCBhbHNvIHRoZSB0eXBlIGF0dHJpYnV0ZSBvZiB0aGUgZmllbGQsIHRoZW4gdGVzdCBpdCBhcyBhIHJlZ2V4cFxuICAgICAgZWxzZSBpZiAocGF0dGVybiAhPT0gJGVsLmF0dHIoJ3R5cGUnKSkge1xuICAgICAgICB2YWxpZCA9IG5ldyBSZWdFeHAocGF0dGVybikudGVzdChpbnB1dFRleHQpO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHZhbGlkID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gQW4gZW1wdHkgZmllbGQgaXMgdmFsaWQgaWYgaXQncyBub3QgcmVxdWlyZWRcbiAgICBlbHNlIGlmICghJGVsLnByb3AoJ3JlcXVpcmVkJykpIHtcbiAgICAgIHZhbGlkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdmFsaWQ7XG4gICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgd2hldGhlciBvciBhIG5vdCBhIHJhZGlvIGlucHV0IGlzIHZhbGlkIGJhc2VkIG9uIHdoZXRoZXIgb3Igbm90IGl0IGlzIHJlcXVpcmVkIGFuZCBzZWxlY3RlZC4gQWx0aG91Z2ggdGhlIGZ1bmN0aW9uIHRhcmdldHMgYSBzaW5nbGUgYDxpbnB1dD5gLCBpdCB2YWxpZGF0ZXMgYnkgY2hlY2tpbmcgdGhlIGByZXF1aXJlZGAgYW5kIGBjaGVja2VkYCBwcm9wZXJ0aWVzIG9mIGFsbCByYWRpbyBidXR0b25zIGluIGl0cyBncm91cC5cbiAgICogQHBhcmFtIHtTdHJpbmd9IGdyb3VwTmFtZSAtIEEgc3RyaW5nIHRoYXQgc3BlY2lmaWVzIHRoZSBuYW1lIG9mIGEgcmFkaW8gYnV0dG9uIGdyb3VwXG4gICAqIEByZXR1cm5zIHtCb29sZWFufSBCb29sZWFuIHZhbHVlIGRlcGVuZHMgb24gd2hldGhlciBvciBub3QgYXQgbGVhc3Qgb25lIHJhZGlvIGlucHV0IGhhcyBiZWVuIHNlbGVjdGVkIChpZiBpdCdzIHJlcXVpcmVkKVxuICAgKi9cbiAgdmFsaWRhdGVSYWRpbyhncm91cE5hbWUpIHtcbiAgICAvLyBJZiBhdCBsZWFzdCBvbmUgcmFkaW8gaW4gdGhlIGdyb3VwIGhhcyB0aGUgYHJlcXVpcmVkYCBhdHRyaWJ1dGUsIHRoZSBncm91cCBpcyBjb25zaWRlcmVkIHJlcXVpcmVkXG4gICAgLy8gUGVyIFczQyBzcGVjLCBhbGwgcmFkaW8gYnV0dG9ucyBpbiBhIGdyb3VwIHNob3VsZCBoYXZlIGByZXF1aXJlZGAsIGJ1dCB3ZSdyZSBiZWluZyBuaWNlXG4gICAgdmFyICRncm91cCA9IHRoaXMuJGVsZW1lbnQuZmluZChgOnJhZGlvW25hbWU9XCIke2dyb3VwTmFtZX1cIl1gKTtcbiAgICB2YXIgdmFsaWQgPSBmYWxzZSwgcmVxdWlyZWQgPSBmYWxzZTtcblxuICAgIC8vIEZvciB0aGUgZ3JvdXAgdG8gYmUgcmVxdWlyZWQsIGF0IGxlYXN0IG9uZSByYWRpbyBuZWVkcyB0byBiZSByZXF1aXJlZFxuICAgICRncm91cC5lYWNoKChpLCBlKSA9PiB7XG4gICAgICBpZiAoJChlKS5hdHRyKCdyZXF1aXJlZCcpKSB7XG4gICAgICAgIHJlcXVpcmVkID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZighcmVxdWlyZWQpIHZhbGlkPXRydWU7XG5cbiAgICBpZiAoIXZhbGlkKSB7XG4gICAgICAvLyBGb3IgdGhlIGdyb3VwIHRvIGJlIHZhbGlkLCBhdCBsZWFzdCBvbmUgcmFkaW8gbmVlZHMgdG8gYmUgY2hlY2tlZFxuICAgICAgJGdyb3VwLmVhY2goKGksIGUpID0+IHtcbiAgICAgICAgaWYgKCQoZSkucHJvcCgnY2hlY2tlZCcpKSB7XG4gICAgICAgICAgdmFsaWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHZhbGlkO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgaWYgYSBzZWxlY3RlZCBpbnB1dCBwYXNzZXMgYSBjdXN0b20gdmFsaWRhdGlvbiBmdW5jdGlvbi4gTXVsdGlwbGUgdmFsaWRhdGlvbnMgY2FuIGJlIHVzZWQsIGlmIHBhc3NlZCB0byB0aGUgZWxlbWVudCB3aXRoIGBkYXRhLXZhbGlkYXRvcj1cImZvbyBiYXIgYmF6XCJgIGluIGEgc3BhY2Ugc2VwYXJhdGVkIGxpc3RlZC5cbiAgICogQHBhcmFtIHtPYmplY3R9ICRlbCAtIGpRdWVyeSBpbnB1dCBlbGVtZW50LlxuICAgKiBAcGFyYW0ge1N0cmluZ30gdmFsaWRhdG9ycyAtIGEgc3RyaW5nIG9mIGZ1bmN0aW9uIG5hbWVzIG1hdGNoaW5nIGZ1bmN0aW9ucyBpbiB0aGUgQWJpZGUub3B0aW9ucy52YWxpZGF0b3JzIG9iamVjdC5cbiAgICogQHBhcmFtIHtCb29sZWFufSByZXF1aXJlZCAtIHNlbGYgZXhwbGFuYXRvcnk/XG4gICAqIEByZXR1cm5zIHtCb29sZWFufSAtIHRydWUgaWYgdmFsaWRhdGlvbnMgcGFzc2VkLlxuICAgKi9cbiAgbWF0Y2hWYWxpZGF0aW9uKCRlbCwgdmFsaWRhdG9ycywgcmVxdWlyZWQpIHtcbiAgICByZXF1aXJlZCA9IHJlcXVpcmVkID8gdHJ1ZSA6IGZhbHNlO1xuXG4gICAgdmFyIGNsZWFyID0gdmFsaWRhdG9ycy5zcGxpdCgnICcpLm1hcCgodikgPT4ge1xuICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy52YWxpZGF0b3JzW3ZdKCRlbCwgcmVxdWlyZWQsICRlbC5wYXJlbnQoKSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIGNsZWFyLmluZGV4T2YoZmFsc2UpID09PSAtMTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNldHMgZm9ybSBpbnB1dHMgYW5kIHN0eWxlc1xuICAgKiBAZmlyZXMgQWJpZGUjZm9ybXJlc2V0XG4gICAqL1xuICByZXNldEZvcm0oKSB7XG4gICAgdmFyICRmb3JtID0gdGhpcy4kZWxlbWVudCxcbiAgICAgICAgb3B0cyA9IHRoaXMub3B0aW9ucztcblxuICAgICQoYC4ke29wdHMubGFiZWxFcnJvckNsYXNzfWAsICRmb3JtKS5ub3QoJ3NtYWxsJykucmVtb3ZlQ2xhc3Mob3B0cy5sYWJlbEVycm9yQ2xhc3MpO1xuICAgICQoYC4ke29wdHMuaW5wdXRFcnJvckNsYXNzfWAsICRmb3JtKS5ub3QoJ3NtYWxsJykucmVtb3ZlQ2xhc3Mob3B0cy5pbnB1dEVycm9yQ2xhc3MpO1xuICAgICQoYCR7b3B0cy5mb3JtRXJyb3JTZWxlY3Rvcn0uJHtvcHRzLmZvcm1FcnJvckNsYXNzfWApLnJlbW92ZUNsYXNzKG9wdHMuZm9ybUVycm9yQ2xhc3MpO1xuICAgICRmb3JtLmZpbmQoJ1tkYXRhLWFiaWRlLWVycm9yXScpLmNzcygnZGlzcGxheScsICdub25lJyk7XG4gICAgJCgnOmlucHV0JywgJGZvcm0pLm5vdCgnOmJ1dHRvbiwgOnN1Ym1pdCwgOnJlc2V0LCA6aGlkZGVuLCA6cmFkaW8sIDpjaGVja2JveCwgW2RhdGEtYWJpZGUtaWdub3JlXScpLnZhbCgnJykucmVtb3ZlQXR0cignZGF0YS1pbnZhbGlkJyk7XG4gICAgJCgnOmlucHV0OnJhZGlvJywgJGZvcm0pLm5vdCgnW2RhdGEtYWJpZGUtaWdub3JlXScpLnByb3AoJ2NoZWNrZWQnLGZhbHNlKS5yZW1vdmVBdHRyKCdkYXRhLWludmFsaWQnKTtcbiAgICAkKCc6aW5wdXQ6Y2hlY2tib3gnLCAkZm9ybSkubm90KCdbZGF0YS1hYmlkZS1pZ25vcmVdJykucHJvcCgnY2hlY2tlZCcsZmFsc2UpLnJlbW92ZUF0dHIoJ2RhdGEtaW52YWxpZCcpO1xuICAgIC8qKlxuICAgICAqIEZpcmVzIHdoZW4gdGhlIGZvcm0gaGFzIGJlZW4gcmVzZXQuXG4gICAgICogQGV2ZW50IEFiaWRlI2Zvcm1yZXNldFxuICAgICAqL1xuICAgICRmb3JtLnRyaWdnZXIoJ2Zvcm1yZXNldC56Zi5hYmlkZScsIFskZm9ybV0pO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIGFuIGluc3RhbmNlIG9mIEFiaWRlLlxuICAgKiBSZW1vdmVzIGVycm9yIHN0eWxlcyBhbmQgY2xhc3NlcyBmcm9tIGVsZW1lbnRzLCB3aXRob3V0IHJlc2V0dGluZyB0aGVpciB2YWx1ZXMuXG4gICAqL1xuICBkZXN0cm95KCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgdGhpcy4kZWxlbWVudFxuICAgICAgLm9mZignLmFiaWRlJylcbiAgICAgIC5maW5kKCdbZGF0YS1hYmlkZS1lcnJvcl0nKVxuICAgICAgICAuY3NzKCdkaXNwbGF5JywgJ25vbmUnKTtcblxuICAgIHRoaXMuJGlucHV0c1xuICAgICAgLm9mZignLmFiaWRlJylcbiAgICAgIC5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICBfdGhpcy5yZW1vdmVFcnJvckNsYXNzZXMoJCh0aGlzKSk7XG4gICAgICB9KTtcblxuICAgIEZvdW5kYXRpb24udW5yZWdpc3RlclBsdWdpbih0aGlzKTtcbiAgfVxufVxuXG4vKipcbiAqIERlZmF1bHQgc2V0dGluZ3MgZm9yIHBsdWdpblxuICovXG5BYmlkZS5kZWZhdWx0cyA9IHtcbiAgLyoqXG4gICAqIFRoZSBkZWZhdWx0IGV2ZW50IHRvIHZhbGlkYXRlIGlucHV0cy4gQ2hlY2tib3hlcyBhbmQgcmFkaW9zIHZhbGlkYXRlIGltbWVkaWF0ZWx5LlxuICAgKiBSZW1vdmUgb3IgY2hhbmdlIHRoaXMgdmFsdWUgZm9yIG1hbnVhbCB2YWxpZGF0aW9uLlxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHs/c3RyaW5nfVxuICAgKiBAZGVmYXVsdCAnZmllbGRDaGFuZ2UnXG4gICAqL1xuICB2YWxpZGF0ZU9uOiAnZmllbGRDaGFuZ2UnLFxuXG4gIC8qKlxuICAgKiBDbGFzcyB0byBiZSBhcHBsaWVkIHRvIGlucHV0IGxhYmVscyBvbiBmYWlsZWQgdmFsaWRhdGlvbi5cbiAgICogQG9wdGlvblxuICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgKiBAZGVmYXVsdCAnaXMtaW52YWxpZC1sYWJlbCdcbiAgICovXG4gIGxhYmVsRXJyb3JDbGFzczogJ2lzLWludmFsaWQtbGFiZWwnLFxuXG4gIC8qKlxuICAgKiBDbGFzcyB0byBiZSBhcHBsaWVkIHRvIGlucHV0cyBvbiBmYWlsZWQgdmFsaWRhdGlvbi5cbiAgICogQG9wdGlvblxuICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgKiBAZGVmYXVsdCAnaXMtaW52YWxpZC1pbnB1dCdcbiAgICovXG4gIGlucHV0RXJyb3JDbGFzczogJ2lzLWludmFsaWQtaW5wdXQnLFxuXG4gIC8qKlxuICAgKiBDbGFzcyBzZWxlY3RvciB0byB1c2UgdG8gdGFyZ2V0IEZvcm0gRXJyb3JzIGZvciBzaG93L2hpZGUuXG4gICAqIEBvcHRpb25cbiAgICogQHR5cGUge3N0cmluZ31cbiAgICogQGRlZmF1bHQgJy5mb3JtLWVycm9yJ1xuICAgKi9cbiAgZm9ybUVycm9yU2VsZWN0b3I6ICcuZm9ybS1lcnJvcicsXG5cbiAgLyoqXG4gICAqIENsYXNzIGFkZGVkIHRvIEZvcm0gRXJyb3JzIG9uIGZhaWxlZCB2YWxpZGF0aW9uLlxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHtzdHJpbmd9XG4gICAqIEBkZWZhdWx0ICdpcy12aXNpYmxlJ1xuICAgKi9cbiAgZm9ybUVycm9yQ2xhc3M6ICdpcy12aXNpYmxlJyxcblxuICAvKipcbiAgICogU2V0IHRvIHRydWUgdG8gdmFsaWRhdGUgdGV4dCBpbnB1dHMgb24gYW55IHZhbHVlIGNoYW5nZS5cbiAgICogQG9wdGlvblxuICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICogQGRlZmF1bHQgZmFsc2VcbiAgICovXG4gIGxpdmVWYWxpZGF0ZTogZmFsc2UsXG5cbiAgLyoqXG4gICAqIFNldCB0byB0cnVlIHRvIHZhbGlkYXRlIGlucHV0cyBvbiBibHVyLlxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHtib29sZWFufVxuICAgKiBAZGVmYXVsdCBmYWxzZVxuICAgKi9cbiAgdmFsaWRhdGVPbkJsdXI6IGZhbHNlLFxuXG4gIHBhdHRlcm5zOiB7XG4gICAgYWxwaGEgOiAvXlthLXpBLVpdKyQvLFxuICAgIGFscGhhX251bWVyaWMgOiAvXlthLXpBLVowLTldKyQvLFxuICAgIGludGVnZXIgOiAvXlstK10/XFxkKyQvLFxuICAgIG51bWJlciA6IC9eWy0rXT9cXGQqKD86W1xcLlxcLF1cXGQrKT8kLyxcblxuICAgIC8vIGFtZXgsIHZpc2EsIGRpbmVyc1xuICAgIGNhcmQgOiAvXig/OjRbMC05XXsxMn0oPzpbMC05XXszfSk/fDVbMS01XVswLTldezE0fXw2KD86MDExfDVbMC05XVswLTldKVswLTldezEyfXwzWzQ3XVswLTldezEzfXwzKD86MFswLTVdfFs2OF1bMC05XSlbMC05XXsxMX18KD86MjEzMXwxODAwfDM1XFxkezN9KVxcZHsxMX0pJC8sXG4gICAgY3Z2IDogL14oWzAtOV0pezMsNH0kLyxcblxuICAgIC8vIGh0dHA6Ly93d3cud2hhdHdnLm9yZy9zcGVjcy93ZWItYXBwcy9jdXJyZW50LXdvcmsvbXVsdGlwYWdlL3N0YXRlcy1vZi10aGUtdHlwZS1hdHRyaWJ1dGUuaHRtbCN2YWxpZC1lLW1haWwtYWRkcmVzc1xuICAgIGVtYWlsIDogL15bYS16QS1aMC05LiEjJCUmJyorXFwvPT9eX2B7fH1+LV0rQFthLXpBLVowLTldKD86W2EtekEtWjAtOS1dezAsNjF9W2EtekEtWjAtOV0pPyg/OlxcLlthLXpBLVowLTldKD86W2EtekEtWjAtOS1dezAsNjF9W2EtekEtWjAtOV0pPykrJC8sXG5cbiAgICB1cmwgOiAvXihodHRwcz98ZnRwfGZpbGV8c3NoKTpcXC9cXC8oKCgoW2EtekEtWl18XFxkfC18XFwufF98fnxbXFx1MDBBMC1cXHVEN0ZGXFx1RjkwMC1cXHVGRENGXFx1RkRGMC1cXHVGRkVGXSl8KCVbXFxkYS1mXXsyfSl8WyFcXCQmJ1xcKFxcKVxcKlxcKyw7PV18OikqQCk/KCgoXFxkfFsxLTldXFxkfDFcXGRcXGR8MlswLTRdXFxkfDI1WzAtNV0pXFwuKFxcZHxbMS05XVxcZHwxXFxkXFxkfDJbMC00XVxcZHwyNVswLTVdKVxcLihcXGR8WzEtOV1cXGR8MVxcZFxcZHwyWzAtNF1cXGR8MjVbMC01XSlcXC4oXFxkfFsxLTldXFxkfDFcXGRcXGR8MlswLTRdXFxkfDI1WzAtNV0pKXwoKChbYS16QS1aXXxcXGR8W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pfCgoW2EtekEtWl18XFxkfFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKShbYS16QS1aXXxcXGR8LXxcXC58X3x+fFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKSooW2EtekEtWl18XFxkfFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKSkpXFwuKSsoKFthLXpBLVpdfFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKXwoKFthLXpBLVpdfFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKShbYS16QS1aXXxcXGR8LXxcXC58X3x+fFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKSooW2EtekEtWl18W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pKSlcXC4/KSg6XFxkKik/KShcXC8oKChbYS16QS1aXXxcXGR8LXxcXC58X3x+fFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKXwoJVtcXGRhLWZdezJ9KXxbIVxcJCYnXFwoXFwpXFwqXFwrLDs9XXw6fEApKyhcXC8oKFthLXpBLVpdfFxcZHwtfFxcLnxffH58W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pfCglW1xcZGEtZl17Mn0pfFshXFwkJidcXChcXClcXCpcXCssOz1dfDp8QCkqKSopPyk/KFxcPygoKFthLXpBLVpdfFxcZHwtfFxcLnxffH58W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pfCglW1xcZGEtZl17Mn0pfFshXFwkJidcXChcXClcXCpcXCssOz1dfDp8QCl8W1xcdUUwMDAtXFx1RjhGRl18XFwvfFxcPykqKT8oXFwjKCgoW2EtekEtWl18XFxkfC18XFwufF98fnxbXFx1MDBBMC1cXHVEN0ZGXFx1RjkwMC1cXHVGRENGXFx1RkRGMC1cXHVGRkVGXSl8KCVbXFxkYS1mXXsyfSl8WyFcXCQmJ1xcKFxcKVxcKlxcKyw7PV18OnxAKXxcXC98XFw/KSopPyQvLFxuICAgIC8vIGFiYy5kZVxuICAgIGRvbWFpbiA6IC9eKFthLXpBLVowLTldKFthLXpBLVowLTlcXC1dezAsNjF9W2EtekEtWjAtOV0pP1xcLikrW2EtekEtWl17Miw4fSQvLFxuXG4gICAgZGF0ZXRpbWUgOiAvXihbMC0yXVswLTldezN9KVxcLShbMC0xXVswLTldKVxcLShbMC0zXVswLTldKVQoWzAtNV1bMC05XSlcXDooWzAtNV1bMC05XSlcXDooWzAtNV1bMC05XSkoWnwoW1xcLVxcK10oWzAtMV1bMC05XSlcXDowMCkpJC8sXG4gICAgLy8gWVlZWS1NTS1ERFxuICAgIGRhdGUgOiAvKD86MTl8MjApWzAtOV17Mn0tKD86KD86MFsxLTldfDFbMC0yXSktKD86MFsxLTldfDFbMC05XXwyWzAtOV0pfCg/Oig/ITAyKSg/OjBbMS05XXwxWzAtMl0pLSg/OjMwKSl8KD86KD86MFsxMzU3OF18MVswMl0pLTMxKSkkLyxcbiAgICAvLyBISDpNTTpTU1xuICAgIHRpbWUgOiAvXigwWzAtOV18MVswLTldfDJbMC0zXSkoOlswLTVdWzAtOV0pezJ9JC8sXG4gICAgZGF0ZUlTTyA6IC9eXFxkezR9W1xcL1xcLV1cXGR7MSwyfVtcXC9cXC1dXFxkezEsMn0kLyxcbiAgICAvLyBNTS9ERC9ZWVlZXG4gICAgbW9udGhfZGF5X3llYXIgOiAvXigwWzEtOV18MVswMTJdKVstIFxcLy5dKDBbMS05XXxbMTJdWzAtOV18M1swMV0pWy0gXFwvLl1cXGR7NH0kLyxcbiAgICAvLyBERC9NTS9ZWVlZXG4gICAgZGF5X21vbnRoX3llYXIgOiAvXigwWzEtOV18WzEyXVswLTldfDNbMDFdKVstIFxcLy5dKDBbMS05XXwxWzAxMl0pWy0gXFwvLl1cXGR7NH0kLyxcblxuICAgIC8vICNGRkYgb3IgI0ZGRkZGRlxuICAgIGNvbG9yIDogL14jPyhbYS1mQS1GMC05XXs2fXxbYS1mQS1GMC05XXszfSkkL1xuICB9LFxuXG4gIC8qKlxuICAgKiBPcHRpb25hbCB2YWxpZGF0aW9uIGZ1bmN0aW9ucyB0byBiZSB1c2VkLiBgZXF1YWxUb2AgYmVpbmcgdGhlIG9ubHkgZGVmYXVsdCBpbmNsdWRlZCBmdW5jdGlvbi5cbiAgICogRnVuY3Rpb25zIHNob3VsZCByZXR1cm4gb25seSBhIGJvb2xlYW4gaWYgdGhlIGlucHV0IGlzIHZhbGlkIG9yIG5vdC4gRnVuY3Rpb25zIGFyZSBnaXZlbiB0aGUgZm9sbG93aW5nIGFyZ3VtZW50czpcbiAgICogZWwgOiBUaGUgalF1ZXJ5IGVsZW1lbnQgdG8gdmFsaWRhdGUuXG4gICAqIHJlcXVpcmVkIDogQm9vbGVhbiB2YWx1ZSBvZiB0aGUgcmVxdWlyZWQgYXR0cmlidXRlIGJlIHByZXNlbnQgb3Igbm90LlxuICAgKiBwYXJlbnQgOiBUaGUgZGlyZWN0IHBhcmVudCBvZiB0aGUgaW5wdXQuXG4gICAqIEBvcHRpb25cbiAgICovXG4gIHZhbGlkYXRvcnM6IHtcbiAgICBlcXVhbFRvOiBmdW5jdGlvbiAoZWwsIHJlcXVpcmVkLCBwYXJlbnQpIHtcbiAgICAgIHJldHVybiAkKGAjJHtlbC5hdHRyKCdkYXRhLWVxdWFsdG8nKX1gKS52YWwoKSA9PT0gZWwudmFsKCk7XG4gICAgfVxuICB9XG59XG5cbi8vIFdpbmRvdyBleHBvcnRzXG5Gb3VuZGF0aW9uLnBsdWdpbihBYmlkZSwgJ0FiaWRlJyk7XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuLyoqXG4gKiBBY2NvcmRpb24gbW9kdWxlLlxuICogQG1vZHVsZSBmb3VuZGF0aW9uLmFjY29yZGlvblxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5rZXlib2FyZFxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5tb3Rpb25cbiAqL1xuXG5jbGFzcyBBY2NvcmRpb24ge1xuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBhbiBhY2NvcmRpb24uXG4gICAqIEBjbGFzc1xuICAgKiBAZmlyZXMgQWNjb3JkaW9uI2luaXRcbiAgICogQHBhcmFtIHtqUXVlcnl9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIG1ha2UgaW50byBhbiBhY2NvcmRpb24uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gYSBwbGFpbiBvYmplY3Qgd2l0aCBzZXR0aW5ncyB0byBvdmVycmlkZSB0aGUgZGVmYXVsdCBvcHRpb25zLlxuICAgKi9cbiAgY29uc3RydWN0b3IoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIHRoaXMuJGVsZW1lbnQgPSBlbGVtZW50O1xuICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBBY2NvcmRpb24uZGVmYXVsdHMsIHRoaXMuJGVsZW1lbnQuZGF0YSgpLCBvcHRpb25zKTtcblxuICAgIHRoaXMuX2luaXQoKTtcblxuICAgIEZvdW5kYXRpb24ucmVnaXN0ZXJQbHVnaW4odGhpcywgJ0FjY29yZGlvbicpO1xuICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQucmVnaXN0ZXIoJ0FjY29yZGlvbicsIHtcbiAgICAgICdFTlRFUic6ICd0b2dnbGUnLFxuICAgICAgJ1NQQUNFJzogJ3RvZ2dsZScsXG4gICAgICAnQVJST1dfRE9XTic6ICduZXh0JyxcbiAgICAgICdBUlJPV19VUCc6ICdwcmV2aW91cydcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyB0aGUgYWNjb3JkaW9uIGJ5IGFuaW1hdGluZyB0aGUgcHJlc2V0IGFjdGl2ZSBwYW5lKHMpLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2luaXQoKSB7XG4gICAgdGhpcy4kZWxlbWVudC5hdHRyKCdyb2xlJywgJ3RhYmxpc3QnKTtcbiAgICB0aGlzLiR0YWJzID0gdGhpcy4kZWxlbWVudC5jaGlsZHJlbignW2RhdGEtYWNjb3JkaW9uLWl0ZW1dJyk7XG5cbiAgICB0aGlzLiR0YWJzLmVhY2goZnVuY3Rpb24oaWR4LCBlbCkge1xuICAgICAgdmFyICRlbCA9ICQoZWwpLFxuICAgICAgICAgICRjb250ZW50ID0gJGVsLmNoaWxkcmVuKCdbZGF0YS10YWItY29udGVudF0nKSxcbiAgICAgICAgICBpZCA9ICRjb250ZW50WzBdLmlkIHx8IEZvdW5kYXRpb24uR2V0WW9EaWdpdHMoNiwgJ2FjY29yZGlvbicpLFxuICAgICAgICAgIGxpbmtJZCA9IGVsLmlkIHx8IGAke2lkfS1sYWJlbGA7XG5cbiAgICAgICRlbC5maW5kKCdhOmZpcnN0JykuYXR0cih7XG4gICAgICAgICdhcmlhLWNvbnRyb2xzJzogaWQsXG4gICAgICAgICdyb2xlJzogJ3RhYicsXG4gICAgICAgICdpZCc6IGxpbmtJZCxcbiAgICAgICAgJ2FyaWEtZXhwYW5kZWQnOiBmYWxzZSxcbiAgICAgICAgJ2FyaWEtc2VsZWN0ZWQnOiBmYWxzZVxuICAgICAgfSk7XG5cbiAgICAgICRjb250ZW50LmF0dHIoeydyb2xlJzogJ3RhYnBhbmVsJywgJ2FyaWEtbGFiZWxsZWRieSc6IGxpbmtJZCwgJ2FyaWEtaGlkZGVuJzogdHJ1ZSwgJ2lkJzogaWR9KTtcbiAgICB9KTtcbiAgICB2YXIgJGluaXRBY3RpdmUgPSB0aGlzLiRlbGVtZW50LmZpbmQoJy5pcy1hY3RpdmUnKS5jaGlsZHJlbignW2RhdGEtdGFiLWNvbnRlbnRdJyk7XG4gICAgdGhpcy5maXJzdFRpbWVJbml0ID0gdHJ1ZTtcbiAgICBpZigkaW5pdEFjdGl2ZS5sZW5ndGgpe1xuICAgICAgdGhpcy5kb3duKCRpbml0QWN0aXZlLCB0aGlzLmZpcnN0VGltZUluaXQpO1xuICAgICAgdGhpcy5maXJzdFRpbWVJbml0ID0gZmFsc2U7XG4gICAgfVxuXG4gICAgdGhpcy5fY2hlY2tEZWVwTGluayA9ICgpID0+IHtcbiAgICAgIHZhciBhbmNob3IgPSB3aW5kb3cubG9jYXRpb24uaGFzaDtcbiAgICAgIC8vbmVlZCBhIGhhc2ggYW5kIGEgcmVsZXZhbnQgYW5jaG9yIGluIHRoaXMgdGFic2V0XG4gICAgICBpZihhbmNob3IubGVuZ3RoKSB7XG4gICAgICAgIHZhciAkbGluayA9IHRoaXMuJGVsZW1lbnQuZmluZCgnW2hyZWYkPVwiJythbmNob3IrJ1wiXScpLFxuICAgICAgICAkYW5jaG9yID0gJChhbmNob3IpO1xuXG4gICAgICAgIGlmICgkbGluay5sZW5ndGggJiYgJGFuY2hvcikge1xuICAgICAgICAgIGlmICghJGxpbmsucGFyZW50KCdbZGF0YS1hY2NvcmRpb24taXRlbV0nKS5oYXNDbGFzcygnaXMtYWN0aXZlJykpIHtcbiAgICAgICAgICAgIHRoaXMuZG93bigkYW5jaG9yLCB0aGlzLmZpcnN0VGltZUluaXQpO1xuICAgICAgICAgICAgdGhpcy5maXJzdFRpbWVJbml0ID0gZmFsc2U7XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIC8vcm9sbCB1cCBhIGxpdHRsZSB0byBzaG93IHRoZSB0aXRsZXNcbiAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmRlZXBMaW5rU211ZGdlKSB7XG4gICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAgICAgJCh3aW5kb3cpLmxvYWQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHZhciBvZmZzZXQgPSBfdGhpcy4kZWxlbWVudC5vZmZzZXQoKTtcbiAgICAgICAgICAgICAgJCgnaHRtbCwgYm9keScpLmFuaW1hdGUoeyBzY3JvbGxUb3A6IG9mZnNldC50b3AgfSwgX3RoaXMub3B0aW9ucy5kZWVwTGlua1NtdWRnZURlbGF5KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8qKlxuICAgICAgICAgICAgKiBGaXJlcyB3aGVuIHRoZSB6cGx1Z2luIGhhcyBkZWVwbGlua2VkIGF0IHBhZ2Vsb2FkXG4gICAgICAgICAgICAqIEBldmVudCBBY2NvcmRpb24jZGVlcGxpbmtcbiAgICAgICAgICAgICovXG4gICAgICAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdkZWVwbGluay56Zi5hY2NvcmRpb24nLCBbJGxpbmssICRhbmNob3JdKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vdXNlIGJyb3dzZXIgdG8gb3BlbiBhIHRhYiwgaWYgaXQgZXhpc3RzIGluIHRoaXMgdGFic2V0XG4gICAgaWYgKHRoaXMub3B0aW9ucy5kZWVwTGluaykge1xuICAgICAgdGhpcy5fY2hlY2tEZWVwTGluaygpO1xuICAgIH1cblxuICAgIHRoaXMuX2V2ZW50cygpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgZXZlbnQgaGFuZGxlcnMgZm9yIGl0ZW1zIHdpdGhpbiB0aGUgYWNjb3JkaW9uLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2V2ZW50cygpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgdGhpcy4kdGFicy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgdmFyICRlbGVtID0gJCh0aGlzKTtcbiAgICAgIHZhciAkdGFiQ29udGVudCA9ICRlbGVtLmNoaWxkcmVuKCdbZGF0YS10YWItY29udGVudF0nKTtcbiAgICAgIGlmICgkdGFiQ29udGVudC5sZW5ndGgpIHtcbiAgICAgICAgJGVsZW0uY2hpbGRyZW4oJ2EnKS5vZmYoJ2NsaWNrLnpmLmFjY29yZGlvbiBrZXlkb3duLnpmLmFjY29yZGlvbicpXG4gICAgICAgICAgICAgICAub24oJ2NsaWNrLnpmLmFjY29yZGlvbicsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgX3RoaXMudG9nZ2xlKCR0YWJDb250ZW50KTtcbiAgICAgICAgfSkub24oJ2tleWRvd24uemYuYWNjb3JkaW9uJywgZnVuY3Rpb24oZSl7XG4gICAgICAgICAgRm91bmRhdGlvbi5LZXlib2FyZC5oYW5kbGVLZXkoZSwgJ0FjY29yZGlvbicsIHtcbiAgICAgICAgICAgIHRvZ2dsZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIF90aGlzLnRvZ2dsZSgkdGFiQ29udGVudCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbmV4dDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHZhciAkYSA9ICRlbGVtLm5leHQoKS5maW5kKCdhJykuZm9jdXMoKTtcbiAgICAgICAgICAgICAgaWYgKCFfdGhpcy5vcHRpb25zLm11bHRpRXhwYW5kKSB7XG4gICAgICAgICAgICAgICAgJGEudHJpZ2dlcignY2xpY2suemYuYWNjb3JkaW9uJylcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHByZXZpb3VzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgdmFyICRhID0gJGVsZW0ucHJldigpLmZpbmQoJ2EnKS5mb2N1cygpO1xuICAgICAgICAgICAgICBpZiAoIV90aGlzLm9wdGlvbnMubXVsdGlFeHBhbmQpIHtcbiAgICAgICAgICAgICAgICAkYS50cmlnZ2VyKCdjbGljay56Zi5hY2NvcmRpb24nKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaGFuZGxlZDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYodGhpcy5vcHRpb25zLmRlZXBMaW5rKSB7XG4gICAgICAkKHdpbmRvdykub24oJ3BvcHN0YXRlJywgdGhpcy5fY2hlY2tEZWVwTGluayk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRvZ2dsZXMgdGhlIHNlbGVjdGVkIGNvbnRlbnQgcGFuZSdzIG9wZW4vY2xvc2Ugc3RhdGUuXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSAkdGFyZ2V0IC0galF1ZXJ5IG9iamVjdCBvZiB0aGUgcGFuZSB0byB0b2dnbGUgKGAuYWNjb3JkaW9uLWNvbnRlbnRgKS5cbiAgICogQGZ1bmN0aW9uXG4gICAqL1xuICB0b2dnbGUoJHRhcmdldCkge1xuICAgIGlmKCR0YXJnZXQucGFyZW50KCkuaGFzQ2xhc3MoJ2lzLWFjdGl2ZScpKSB7XG4gICAgICB0aGlzLnVwKCR0YXJnZXQpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmRvd24oJHRhcmdldCk7XG4gICAgfVxuICAgIC8vZWl0aGVyIHJlcGxhY2Ugb3IgdXBkYXRlIGJyb3dzZXIgaGlzdG9yeVxuICAgIGlmICh0aGlzLm9wdGlvbnMuZGVlcExpbmspIHtcbiAgICAgIHZhciBhbmNob3IgPSAkdGFyZ2V0LnByZXYoJ2EnKS5hdHRyKCdocmVmJyk7XG5cbiAgICAgIGlmICh0aGlzLm9wdGlvbnMudXBkYXRlSGlzdG9yeSkge1xuICAgICAgICBoaXN0b3J5LnB1c2hTdGF0ZSh7fSwgJycsIGFuY2hvcik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBoaXN0b3J5LnJlcGxhY2VTdGF0ZSh7fSwgJycsIGFuY2hvcik7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIE9wZW5zIHRoZSBhY2NvcmRpb24gdGFiIGRlZmluZWQgYnkgYCR0YXJnZXRgLlxuICAgKiBAcGFyYW0ge2pRdWVyeX0gJHRhcmdldCAtIEFjY29yZGlvbiBwYW5lIHRvIG9wZW4gKGAuYWNjb3JkaW9uLWNvbnRlbnRgKS5cbiAgICogQHBhcmFtIHtCb29sZWFufSBmaXJzdFRpbWUgLSBmbGFnIHRvIGRldGVybWluZSBpZiByZWZsb3cgc2hvdWxkIGhhcHBlbi5cbiAgICogQGZpcmVzIEFjY29yZGlvbiNkb3duXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgZG93bigkdGFyZ2V0LCBmaXJzdFRpbWUpIHtcbiAgICAkdGFyZ2V0XG4gICAgICAuYXR0cignYXJpYS1oaWRkZW4nLCBmYWxzZSlcbiAgICAgIC5wYXJlbnQoJ1tkYXRhLXRhYi1jb250ZW50XScpXG4gICAgICAuYWRkQmFjaygpXG4gICAgICAucGFyZW50KCkuYWRkQ2xhc3MoJ2lzLWFjdGl2ZScpO1xuXG4gICAgaWYgKCF0aGlzLm9wdGlvbnMubXVsdGlFeHBhbmQgJiYgIWZpcnN0VGltZSkge1xuICAgICAgdmFyICRjdXJyZW50QWN0aXZlID0gdGhpcy4kZWxlbWVudC5jaGlsZHJlbignLmlzLWFjdGl2ZScpLmNoaWxkcmVuKCdbZGF0YS10YWItY29udGVudF0nKTtcbiAgICAgIGlmICgkY3VycmVudEFjdGl2ZS5sZW5ndGgpIHtcbiAgICAgICAgdGhpcy51cCgkY3VycmVudEFjdGl2ZS5ub3QoJHRhcmdldCkpO1xuICAgICAgfVxuICAgIH1cblxuICAgICR0YXJnZXQuc2xpZGVEb3duKHRoaXMub3B0aW9ucy5zbGlkZVNwZWVkLCAoKSA9PiB7XG4gICAgICAvKipcbiAgICAgICAqIEZpcmVzIHdoZW4gdGhlIHRhYiBpcyBkb25lIG9wZW5pbmcuXG4gICAgICAgKiBAZXZlbnQgQWNjb3JkaW9uI2Rvd25cbiAgICAgICAqL1xuICAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdkb3duLnpmLmFjY29yZGlvbicsIFskdGFyZ2V0XSk7XG4gICAgfSk7XG5cbiAgICAkKGAjJHskdGFyZ2V0LmF0dHIoJ2FyaWEtbGFiZWxsZWRieScpfWApLmF0dHIoe1xuICAgICAgJ2FyaWEtZXhwYW5kZWQnOiB0cnVlLFxuICAgICAgJ2FyaWEtc2VsZWN0ZWQnOiB0cnVlXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ2xvc2VzIHRoZSB0YWIgZGVmaW5lZCBieSBgJHRhcmdldGAuXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSAkdGFyZ2V0IC0gQWNjb3JkaW9uIHRhYiB0byBjbG9zZSAoYC5hY2NvcmRpb24tY29udGVudGApLlxuICAgKiBAZmlyZXMgQWNjb3JkaW9uI3VwXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgdXAoJHRhcmdldCkge1xuICAgIHZhciAkYXVudHMgPSAkdGFyZ2V0LnBhcmVudCgpLnNpYmxpbmdzKCksXG4gICAgICAgIF90aGlzID0gdGhpcztcblxuICAgIGlmKCghdGhpcy5vcHRpb25zLmFsbG93QWxsQ2xvc2VkICYmICEkYXVudHMuaGFzQ2xhc3MoJ2lzLWFjdGl2ZScpKSB8fCAhJHRhcmdldC5wYXJlbnQoKS5oYXNDbGFzcygnaXMtYWN0aXZlJykpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBGb3VuZGF0aW9uLk1vdmUodGhpcy5vcHRpb25zLnNsaWRlU3BlZWQsICR0YXJnZXQsIGZ1bmN0aW9uKCl7XG4gICAgICAkdGFyZ2V0LnNsaWRlVXAoX3RoaXMub3B0aW9ucy5zbGlkZVNwZWVkLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBGaXJlcyB3aGVuIHRoZSB0YWIgaXMgZG9uZSBjb2xsYXBzaW5nIHVwLlxuICAgICAgICAgKiBAZXZlbnQgQWNjb3JkaW9uI3VwXG4gICAgICAgICAqL1xuICAgICAgICBfdGhpcy4kZWxlbWVudC50cmlnZ2VyKCd1cC56Zi5hY2NvcmRpb24nLCBbJHRhcmdldF0pO1xuICAgICAgfSk7XG4gICAgLy8gfSk7XG5cbiAgICAkdGFyZ2V0LmF0dHIoJ2FyaWEtaGlkZGVuJywgdHJ1ZSlcbiAgICAgICAgICAgLnBhcmVudCgpLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKTtcblxuICAgICQoYCMkeyR0YXJnZXQuYXR0cignYXJpYS1sYWJlbGxlZGJ5Jyl9YCkuYXR0cih7XG4gICAgICdhcmlhLWV4cGFuZGVkJzogZmFsc2UsXG4gICAgICdhcmlhLXNlbGVjdGVkJzogZmFsc2VcbiAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIGFuIGluc3RhbmNlIG9mIGFuIGFjY29yZGlvbi5cbiAgICogQGZpcmVzIEFjY29yZGlvbiNkZXN0cm95ZWRcbiAgICogQGZ1bmN0aW9uXG4gICAqL1xuICBkZXN0cm95KCkge1xuICAgIHRoaXMuJGVsZW1lbnQuZmluZCgnW2RhdGEtdGFiLWNvbnRlbnRdJykuc3RvcCh0cnVlKS5zbGlkZVVwKDApLmNzcygnZGlzcGxheScsICcnKTtcbiAgICB0aGlzLiRlbGVtZW50LmZpbmQoJ2EnKS5vZmYoJy56Zi5hY2NvcmRpb24nKTtcbiAgICBpZih0aGlzLm9wdGlvbnMuZGVlcExpbmspIHtcbiAgICAgICQod2luZG93KS5vZmYoJ3BvcHN0YXRlJywgdGhpcy5fY2hlY2tEZWVwTGluayk7XG4gICAgfVxuXG4gICAgRm91bmRhdGlvbi51bnJlZ2lzdGVyUGx1Z2luKHRoaXMpO1xuICB9XG59XG5cbkFjY29yZGlvbi5kZWZhdWx0cyA9IHtcbiAgLyoqXG4gICAqIEFtb3VudCBvZiB0aW1lIHRvIGFuaW1hdGUgdGhlIG9wZW5pbmcgb2YgYW4gYWNjb3JkaW9uIHBhbmUuXG4gICAqIEBvcHRpb25cbiAgICogQHR5cGUge251bWJlcn1cbiAgICogQGRlZmF1bHQgMjUwXG4gICAqL1xuICBzbGlkZVNwZWVkOiAyNTAsXG4gIC8qKlxuICAgKiBBbGxvdyB0aGUgYWNjb3JkaW9uIHRvIGhhdmUgbXVsdGlwbGUgb3BlbiBwYW5lcy5cbiAgICogQG9wdGlvblxuICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICogQGRlZmF1bHQgZmFsc2VcbiAgICovXG4gIG11bHRpRXhwYW5kOiBmYWxzZSxcbiAgLyoqXG4gICAqIEFsbG93IHRoZSBhY2NvcmRpb24gdG8gY2xvc2UgYWxsIHBhbmVzLlxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHtib29sZWFufVxuICAgKiBAZGVmYXVsdCBmYWxzZVxuICAgKi9cbiAgYWxsb3dBbGxDbG9zZWQ6IGZhbHNlLFxuICAvKipcbiAgICogQWxsb3dzIHRoZSB3aW5kb3cgdG8gc2Nyb2xsIHRvIGNvbnRlbnQgb2YgcGFuZSBzcGVjaWZpZWQgYnkgaGFzaCBhbmNob3JcbiAgICogQG9wdGlvblxuICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICogQGRlZmF1bHQgZmFsc2VcbiAgICovXG4gIGRlZXBMaW5rOiBmYWxzZSxcblxuICAvKipcbiAgICogQWRqdXN0IHRoZSBkZWVwIGxpbmsgc2Nyb2xsIHRvIG1ha2Ugc3VyZSB0aGUgdG9wIG9mIHRoZSBhY2NvcmRpb24gcGFuZWwgaXMgdmlzaWJsZVxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHtib29sZWFufVxuICAgKiBAZGVmYXVsdCBmYWxzZVxuICAgKi9cbiAgZGVlcExpbmtTbXVkZ2U6IGZhbHNlLFxuXG4gIC8qKlxuICAgKiBBbmltYXRpb24gdGltZSAobXMpIGZvciB0aGUgZGVlcCBsaW5rIGFkanVzdG1lbnRcbiAgICogQG9wdGlvblxuICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgKiBAZGVmYXVsdCAzMDBcbiAgICovXG4gIGRlZXBMaW5rU211ZGdlRGVsYXk6IDMwMCxcblxuICAvKipcbiAgICogVXBkYXRlIHRoZSBicm93c2VyIGhpc3Rvcnkgd2l0aCB0aGUgb3BlbiBhY2NvcmRpb25cbiAgICogQG9wdGlvblxuICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICogQGRlZmF1bHQgZmFsc2VcbiAgICovXG4gIHVwZGF0ZUhpc3Rvcnk6IGZhbHNlXG59O1xuXG4vLyBXaW5kb3cgZXhwb3J0c1xuRm91bmRhdGlvbi5wbHVnaW4oQWNjb3JkaW9uLCAnQWNjb3JkaW9uJyk7XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuLyoqXG4gKiBBY2NvcmRpb25NZW51IG1vZHVsZS5cbiAqIEBtb2R1bGUgZm91bmRhdGlvbi5hY2NvcmRpb25NZW51XG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLmtleWJvYXJkXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLm1vdGlvblxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5uZXN0XG4gKi9cblxuY2xhc3MgQWNjb3JkaW9uTWVudSB7XG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIGFuIGFjY29yZGlvbiBtZW51LlxuICAgKiBAY2xhc3NcbiAgICogQGZpcmVzIEFjY29yZGlvbk1lbnUjaW5pdFxuICAgKiBAcGFyYW0ge2pRdWVyeX0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gbWFrZSBpbnRvIGFuIGFjY29yZGlvbiBtZW51LlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE92ZXJyaWRlcyB0byB0aGUgZGVmYXVsdCBwbHVnaW4gc2V0dGluZ3MuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy4kZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoe30sIEFjY29yZGlvbk1lbnUuZGVmYXVsdHMsIHRoaXMuJGVsZW1lbnQuZGF0YSgpLCBvcHRpb25zKTtcblxuICAgIEZvdW5kYXRpb24uTmVzdC5GZWF0aGVyKHRoaXMuJGVsZW1lbnQsICdhY2NvcmRpb24nKTtcblxuICAgIHRoaXMuX2luaXQoKTtcblxuICAgIEZvdW5kYXRpb24ucmVnaXN0ZXJQbHVnaW4odGhpcywgJ0FjY29yZGlvbk1lbnUnKTtcbiAgICBGb3VuZGF0aW9uLktleWJvYXJkLnJlZ2lzdGVyKCdBY2NvcmRpb25NZW51Jywge1xuICAgICAgJ0VOVEVSJzogJ3RvZ2dsZScsXG4gICAgICAnU1BBQ0UnOiAndG9nZ2xlJyxcbiAgICAgICdBUlJPV19SSUdIVCc6ICdvcGVuJyxcbiAgICAgICdBUlJPV19VUCc6ICd1cCcsXG4gICAgICAnQVJST1dfRE9XTic6ICdkb3duJyxcbiAgICAgICdBUlJPV19MRUZUJzogJ2Nsb3NlJyxcbiAgICAgICdFU0NBUEUnOiAnY2xvc2VBbGwnXG4gICAgfSk7XG4gIH1cblxuXG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIHRoZSBhY2NvcmRpb24gbWVudSBieSBoaWRpbmcgYWxsIG5lc3RlZCBtZW51cy5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9pbml0KCkge1xuICAgIHRoaXMuJGVsZW1lbnQuZmluZCgnW2RhdGEtc3VibWVudV0nKS5ub3QoJy5pcy1hY3RpdmUnKS5zbGlkZVVwKDApOy8vLmZpbmQoJ2EnKS5jc3MoJ3BhZGRpbmctbGVmdCcsICcxcmVtJyk7XG4gICAgdGhpcy4kZWxlbWVudC5hdHRyKHtcbiAgICAgICdyb2xlJzogJ21lbnUnLFxuICAgICAgJ2FyaWEtbXVsdGlzZWxlY3RhYmxlJzogdGhpcy5vcHRpb25zLm11bHRpT3BlblxuICAgIH0pO1xuXG4gICAgdGhpcy4kbWVudUxpbmtzID0gdGhpcy4kZWxlbWVudC5maW5kKCcuaXMtYWNjb3JkaW9uLXN1Ym1lbnUtcGFyZW50Jyk7XG4gICAgdGhpcy4kbWVudUxpbmtzLmVhY2goZnVuY3Rpb24oKXtcbiAgICAgIHZhciBsaW5rSWQgPSB0aGlzLmlkIHx8IEZvdW5kYXRpb24uR2V0WW9EaWdpdHMoNiwgJ2FjYy1tZW51LWxpbmsnKSxcbiAgICAgICAgICAkZWxlbSA9ICQodGhpcyksXG4gICAgICAgICAgJHN1YiA9ICRlbGVtLmNoaWxkcmVuKCdbZGF0YS1zdWJtZW51XScpLFxuICAgICAgICAgIHN1YklkID0gJHN1YlswXS5pZCB8fCBGb3VuZGF0aW9uLkdldFlvRGlnaXRzKDYsICdhY2MtbWVudScpLFxuICAgICAgICAgIGlzQWN0aXZlID0gJHN1Yi5oYXNDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAkZWxlbS5hdHRyKHtcbiAgICAgICAgJ2FyaWEtY29udHJvbHMnOiBzdWJJZCxcbiAgICAgICAgJ2FyaWEtZXhwYW5kZWQnOiBpc0FjdGl2ZSxcbiAgICAgICAgJ3JvbGUnOiAnbWVudWl0ZW0nLFxuICAgICAgICAnaWQnOiBsaW5rSWRcbiAgICAgIH0pO1xuICAgICAgJHN1Yi5hdHRyKHtcbiAgICAgICAgJ2FyaWEtbGFiZWxsZWRieSc6IGxpbmtJZCxcbiAgICAgICAgJ2FyaWEtaGlkZGVuJzogIWlzQWN0aXZlLFxuICAgICAgICAncm9sZSc6ICdtZW51JyxcbiAgICAgICAgJ2lkJzogc3ViSWRcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIHZhciBpbml0UGFuZXMgPSB0aGlzLiRlbGVtZW50LmZpbmQoJy5pcy1hY3RpdmUnKTtcbiAgICBpZihpbml0UGFuZXMubGVuZ3RoKXtcbiAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICBpbml0UGFuZXMuZWFjaChmdW5jdGlvbigpe1xuICAgICAgICBfdGhpcy5kb3duKCQodGhpcykpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHRoaXMuX2V2ZW50cygpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgZXZlbnQgaGFuZGxlcnMgZm9yIGl0ZW1zIHdpdGhpbiB0aGUgbWVudS5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9ldmVudHMoKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIHRoaXMuJGVsZW1lbnQuZmluZCgnbGknKS5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgdmFyICRzdWJtZW51ID0gJCh0aGlzKS5jaGlsZHJlbignW2RhdGEtc3VibWVudV0nKTtcblxuICAgICAgaWYgKCRzdWJtZW51Lmxlbmd0aCkge1xuICAgICAgICAkKHRoaXMpLmNoaWxkcmVuKCdhJykub2ZmKCdjbGljay56Zi5hY2NvcmRpb25NZW51Jykub24oJ2NsaWNrLnpmLmFjY29yZGlvbk1lbnUnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgICAgX3RoaXMudG9nZ2xlKCRzdWJtZW51KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSkub24oJ2tleWRvd24uemYuYWNjb3JkaW9ubWVudScsIGZ1bmN0aW9uKGUpe1xuICAgICAgdmFyICRlbGVtZW50ID0gJCh0aGlzKSxcbiAgICAgICAgICAkZWxlbWVudHMgPSAkZWxlbWVudC5wYXJlbnQoJ3VsJykuY2hpbGRyZW4oJ2xpJyksXG4gICAgICAgICAgJHByZXZFbGVtZW50LFxuICAgICAgICAgICRuZXh0RWxlbWVudCxcbiAgICAgICAgICAkdGFyZ2V0ID0gJGVsZW1lbnQuY2hpbGRyZW4oJ1tkYXRhLXN1Ym1lbnVdJyk7XG5cbiAgICAgICRlbGVtZW50cy5lYWNoKGZ1bmN0aW9uKGkpIHtcbiAgICAgICAgaWYgKCQodGhpcykuaXMoJGVsZW1lbnQpKSB7XG4gICAgICAgICAgJHByZXZFbGVtZW50ID0gJGVsZW1lbnRzLmVxKE1hdGgubWF4KDAsIGktMSkpLmZpbmQoJ2EnKS5maXJzdCgpO1xuICAgICAgICAgICRuZXh0RWxlbWVudCA9ICRlbGVtZW50cy5lcShNYXRoLm1pbihpKzEsICRlbGVtZW50cy5sZW5ndGgtMSkpLmZpbmQoJ2EnKS5maXJzdCgpO1xuXG4gICAgICAgICAgaWYgKCQodGhpcykuY2hpbGRyZW4oJ1tkYXRhLXN1Ym1lbnVdOnZpc2libGUnKS5sZW5ndGgpIHsgLy8gaGFzIG9wZW4gc3ViIG1lbnVcbiAgICAgICAgICAgICRuZXh0RWxlbWVudCA9ICRlbGVtZW50LmZpbmQoJ2xpOmZpcnN0LWNoaWxkJykuZmluZCgnYScpLmZpcnN0KCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICgkKHRoaXMpLmlzKCc6Zmlyc3QtY2hpbGQnKSkgeyAvLyBpcyBmaXJzdCBlbGVtZW50IG9mIHN1YiBtZW51XG4gICAgICAgICAgICAkcHJldkVsZW1lbnQgPSAkZWxlbWVudC5wYXJlbnRzKCdsaScpLmZpcnN0KCkuZmluZCgnYScpLmZpcnN0KCk7XG4gICAgICAgICAgfSBlbHNlIGlmICgkcHJldkVsZW1lbnQucGFyZW50cygnbGknKS5maXJzdCgpLmNoaWxkcmVuKCdbZGF0YS1zdWJtZW51XTp2aXNpYmxlJykubGVuZ3RoKSB7IC8vIGlmIHByZXZpb3VzIGVsZW1lbnQgaGFzIG9wZW4gc3ViIG1lbnVcbiAgICAgICAgICAgICRwcmV2RWxlbWVudCA9ICRwcmV2RWxlbWVudC5wYXJlbnRzKCdsaScpLmZpbmQoJ2xpOmxhc3QtY2hpbGQnKS5maW5kKCdhJykuZmlyc3QoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCQodGhpcykuaXMoJzpsYXN0LWNoaWxkJykpIHsgLy8gaXMgbGFzdCBlbGVtZW50IG9mIHN1YiBtZW51XG4gICAgICAgICAgICAkbmV4dEVsZW1lbnQgPSAkZWxlbWVudC5wYXJlbnRzKCdsaScpLmZpcnN0KCkubmV4dCgnbGknKS5maW5kKCdhJykuZmlyc3QoKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBGb3VuZGF0aW9uLktleWJvYXJkLmhhbmRsZUtleShlLCAnQWNjb3JkaW9uTWVudScsIHtcbiAgICAgICAgb3BlbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKCR0YXJnZXQuaXMoJzpoaWRkZW4nKSkge1xuICAgICAgICAgICAgX3RoaXMuZG93bigkdGFyZ2V0KTtcbiAgICAgICAgICAgICR0YXJnZXQuZmluZCgnbGknKS5maXJzdCgpLmZpbmQoJ2EnKS5maXJzdCgpLmZvY3VzKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBjbG9zZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKCR0YXJnZXQubGVuZ3RoICYmICEkdGFyZ2V0LmlzKCc6aGlkZGVuJykpIHsgLy8gY2xvc2UgYWN0aXZlIHN1YiBvZiB0aGlzIGl0ZW1cbiAgICAgICAgICAgIF90aGlzLnVwKCR0YXJnZXQpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoJGVsZW1lbnQucGFyZW50KCdbZGF0YS1zdWJtZW51XScpLmxlbmd0aCkgeyAvLyBjbG9zZSBjdXJyZW50bHkgb3BlbiBzdWJcbiAgICAgICAgICAgIF90aGlzLnVwKCRlbGVtZW50LnBhcmVudCgnW2RhdGEtc3VibWVudV0nKSk7XG4gICAgICAgICAgICAkZWxlbWVudC5wYXJlbnRzKCdsaScpLmZpcnN0KCkuZmluZCgnYScpLmZpcnN0KCkuZm9jdXMoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHVwOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAkcHJldkVsZW1lbnQuZm9jdXMoKTtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgZG93bjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgJG5leHRFbGVtZW50LmZvY3VzKCk7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sXG4gICAgICAgIHRvZ2dsZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKCRlbGVtZW50LmNoaWxkcmVuKCdbZGF0YS1zdWJtZW51XScpLmxlbmd0aCkge1xuICAgICAgICAgICAgX3RoaXMudG9nZ2xlKCRlbGVtZW50LmNoaWxkcmVuKCdbZGF0YS1zdWJtZW51XScpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGNsb3NlQWxsOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBfdGhpcy5oaWRlQWxsKCk7XG4gICAgICAgIH0sXG4gICAgICAgIGhhbmRsZWQ6IGZ1bmN0aW9uKHByZXZlbnREZWZhdWx0KSB7XG4gICAgICAgICAgaWYgKHByZXZlbnREZWZhdWx0KSB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pOy8vLmF0dHIoJ3RhYmluZGV4JywgMCk7XG4gIH1cblxuICAvKipcbiAgICogQ2xvc2VzIGFsbCBwYW5lcyBvZiB0aGUgbWVudS5cbiAgICogQGZ1bmN0aW9uXG4gICAqL1xuICBoaWRlQWxsKCkge1xuICAgIHRoaXMudXAodGhpcy4kZWxlbWVudC5maW5kKCdbZGF0YS1zdWJtZW51XScpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPcGVucyBhbGwgcGFuZXMgb2YgdGhlIG1lbnUuXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgc2hvd0FsbCgpIHtcbiAgICB0aGlzLmRvd24odGhpcy4kZWxlbWVudC5maW5kKCdbZGF0YS1zdWJtZW51XScpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUb2dnbGVzIHRoZSBvcGVuL2Nsb3NlIHN0YXRlIG9mIGEgc3VibWVudS5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSAkdGFyZ2V0IC0gdGhlIHN1Ym1lbnUgdG8gdG9nZ2xlXG4gICAqL1xuICB0b2dnbGUoJHRhcmdldCl7XG4gICAgaWYoISR0YXJnZXQuaXMoJzphbmltYXRlZCcpKSB7XG4gICAgICBpZiAoISR0YXJnZXQuaXMoJzpoaWRkZW4nKSkge1xuICAgICAgICB0aGlzLnVwKCR0YXJnZXQpO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHRoaXMuZG93bigkdGFyZ2V0KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogT3BlbnMgdGhlIHN1Yi1tZW51IGRlZmluZWQgYnkgYCR0YXJnZXRgLlxuICAgKiBAcGFyYW0ge2pRdWVyeX0gJHRhcmdldCAtIFN1Yi1tZW51IHRvIG9wZW4uXG4gICAqIEBmaXJlcyBBY2NvcmRpb25NZW51I2Rvd25cbiAgICovXG4gIGRvd24oJHRhcmdldCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICBpZighdGhpcy5vcHRpb25zLm11bHRpT3Blbikge1xuICAgICAgdGhpcy51cCh0aGlzLiRlbGVtZW50LmZpbmQoJy5pcy1hY3RpdmUnKS5ub3QoJHRhcmdldC5wYXJlbnRzVW50aWwodGhpcy4kZWxlbWVudCkuYWRkKCR0YXJnZXQpKSk7XG4gICAgfVxuXG4gICAgJHRhcmdldC5hZGRDbGFzcygnaXMtYWN0aXZlJykuYXR0cih7J2FyaWEtaGlkZGVuJzogZmFsc2V9KVxuICAgICAgLnBhcmVudCgnLmlzLWFjY29yZGlvbi1zdWJtZW51LXBhcmVudCcpLmF0dHIoeydhcmlhLWV4cGFuZGVkJzogdHJ1ZX0pO1xuXG4gICAgICAvL0ZvdW5kYXRpb24uTW92ZSh0aGlzLm9wdGlvbnMuc2xpZGVTcGVlZCwgJHRhcmdldCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICR0YXJnZXQuc2xpZGVEb3duKF90aGlzLm9wdGlvbnMuc2xpZGVTcGVlZCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIC8qKlxuICAgICAgICAgICAqIEZpcmVzIHdoZW4gdGhlIG1lbnUgaXMgZG9uZSBvcGVuaW5nLlxuICAgICAgICAgICAqIEBldmVudCBBY2NvcmRpb25NZW51I2Rvd25cbiAgICAgICAgICAgKi9cbiAgICAgICAgICBfdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdkb3duLnpmLmFjY29yZGlvbk1lbnUnLCBbJHRhcmdldF0pO1xuICAgICAgICB9KTtcbiAgICAgIC8vfSk7XG4gIH1cblxuICAvKipcbiAgICogQ2xvc2VzIHRoZSBzdWItbWVudSBkZWZpbmVkIGJ5IGAkdGFyZ2V0YC4gQWxsIHN1Yi1tZW51cyBpbnNpZGUgdGhlIHRhcmdldCB3aWxsIGJlIGNsb3NlZCBhcyB3ZWxsLlxuICAgKiBAcGFyYW0ge2pRdWVyeX0gJHRhcmdldCAtIFN1Yi1tZW51IHRvIGNsb3NlLlxuICAgKiBAZmlyZXMgQWNjb3JkaW9uTWVudSN1cFxuICAgKi9cbiAgdXAoJHRhcmdldCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgLy9Gb3VuZGF0aW9uLk1vdmUodGhpcy5vcHRpb25zLnNsaWRlU3BlZWQsICR0YXJnZXQsIGZ1bmN0aW9uKCl7XG4gICAgICAkdGFyZ2V0LnNsaWRlVXAoX3RoaXMub3B0aW9ucy5zbGlkZVNwZWVkLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBGaXJlcyB3aGVuIHRoZSBtZW51IGlzIGRvbmUgY29sbGFwc2luZyB1cC5cbiAgICAgICAgICogQGV2ZW50IEFjY29yZGlvbk1lbnUjdXBcbiAgICAgICAgICovXG4gICAgICAgIF90aGlzLiRlbGVtZW50LnRyaWdnZXIoJ3VwLnpmLmFjY29yZGlvbk1lbnUnLCBbJHRhcmdldF0pO1xuICAgICAgfSk7XG4gICAgLy99KTtcblxuICAgIHZhciAkbWVudXMgPSAkdGFyZ2V0LmZpbmQoJ1tkYXRhLXN1Ym1lbnVdJykuc2xpZGVVcCgwKS5hZGRCYWNrKCkuYXR0cignYXJpYS1oaWRkZW4nLCB0cnVlKTtcblxuICAgICRtZW51cy5wYXJlbnQoJy5pcy1hY2NvcmRpb24tc3VibWVudS1wYXJlbnQnKS5hdHRyKCdhcmlhLWV4cGFuZGVkJywgZmFsc2UpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIGFuIGluc3RhbmNlIG9mIGFjY29yZGlvbiBtZW51LlxuICAgKiBAZmlyZXMgQWNjb3JkaW9uTWVudSNkZXN0cm95ZWRcbiAgICovXG4gIGRlc3Ryb3koKSB7XG4gICAgdGhpcy4kZWxlbWVudC5maW5kKCdbZGF0YS1zdWJtZW51XScpLnNsaWRlRG93bigwKS5jc3MoJ2Rpc3BsYXknLCAnJyk7XG4gICAgdGhpcy4kZWxlbWVudC5maW5kKCdhJykub2ZmKCdjbGljay56Zi5hY2NvcmRpb25NZW51Jyk7XG5cbiAgICBGb3VuZGF0aW9uLk5lc3QuQnVybih0aGlzLiRlbGVtZW50LCAnYWNjb3JkaW9uJyk7XG4gICAgRm91bmRhdGlvbi51bnJlZ2lzdGVyUGx1Z2luKHRoaXMpO1xuICB9XG59XG5cbkFjY29yZGlvbk1lbnUuZGVmYXVsdHMgPSB7XG4gIC8qKlxuICAgKiBBbW91bnQgb2YgdGltZSB0byBhbmltYXRlIHRoZSBvcGVuaW5nIG9mIGEgc3VibWVudSBpbiBtcy5cbiAgICogQG9wdGlvblxuICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgKiBAZGVmYXVsdCAyNTBcbiAgICovXG4gIHNsaWRlU3BlZWQ6IDI1MCxcbiAgLyoqXG4gICAqIEFsbG93IHRoZSBtZW51IHRvIGhhdmUgbXVsdGlwbGUgb3BlbiBwYW5lcy5cbiAgICogQG9wdGlvblxuICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICogQGRlZmF1bHQgdHJ1ZVxuICAgKi9cbiAgbXVsdGlPcGVuOiB0cnVlXG59O1xuXG4vLyBXaW5kb3cgZXhwb3J0c1xuRm91bmRhdGlvbi5wbHVnaW4oQWNjb3JkaW9uTWVudSwgJ0FjY29yZGlvbk1lbnUnKTtcblxufShqUXVlcnkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG4vKipcbiAqIERyaWxsZG93biBtb2R1bGUuXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24uZHJpbGxkb3duXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLmtleWJvYXJkXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLm1vdGlvblxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5uZXN0XG4gKi9cblxuY2xhc3MgRHJpbGxkb3duIHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgYSBkcmlsbGRvd24gbWVudS5cbiAgICogQGNsYXNzXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBtYWtlIGludG8gYW4gYWNjb3JkaW9uIG1lbnUuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3ZlcnJpZGVzIHRvIHRoZSBkZWZhdWx0IHBsdWdpbiBzZXR0aW5ncy5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLiRlbGVtZW50ID0gZWxlbWVudDtcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgRHJpbGxkb3duLmRlZmF1bHRzLCB0aGlzLiRlbGVtZW50LmRhdGEoKSwgb3B0aW9ucyk7XG5cbiAgICBGb3VuZGF0aW9uLk5lc3QuRmVhdGhlcih0aGlzLiRlbGVtZW50LCAnZHJpbGxkb3duJyk7XG5cbiAgICB0aGlzLl9pbml0KCk7XG5cbiAgICBGb3VuZGF0aW9uLnJlZ2lzdGVyUGx1Z2luKHRoaXMsICdEcmlsbGRvd24nKTtcbiAgICBGb3VuZGF0aW9uLktleWJvYXJkLnJlZ2lzdGVyKCdEcmlsbGRvd24nLCB7XG4gICAgICAnRU5URVInOiAnb3BlbicsXG4gICAgICAnU1BBQ0UnOiAnb3BlbicsXG4gICAgICAnQVJST1dfUklHSFQnOiAnbmV4dCcsXG4gICAgICAnQVJST1dfVVAnOiAndXAnLFxuICAgICAgJ0FSUk9XX0RPV04nOiAnZG93bicsXG4gICAgICAnQVJST1dfTEVGVCc6ICdwcmV2aW91cycsXG4gICAgICAnRVNDQVBFJzogJ2Nsb3NlJyxcbiAgICAgICdUQUInOiAnZG93bicsXG4gICAgICAnU0hJRlRfVEFCJzogJ3VwJ1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIHRoZSBkcmlsbGRvd24gYnkgY3JlYXRpbmcgalF1ZXJ5IGNvbGxlY3Rpb25zIG9mIGVsZW1lbnRzXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfaW5pdCgpIHtcbiAgICB0aGlzLiRzdWJtZW51QW5jaG9ycyA9IHRoaXMuJGVsZW1lbnQuZmluZCgnbGkuaXMtZHJpbGxkb3duLXN1Ym1lbnUtcGFyZW50JykuY2hpbGRyZW4oJ2EnKTtcbiAgICB0aGlzLiRzdWJtZW51cyA9IHRoaXMuJHN1Ym1lbnVBbmNob3JzLnBhcmVudCgnbGknKS5jaGlsZHJlbignW2RhdGEtc3VibWVudV0nKTtcbiAgICB0aGlzLiRtZW51SXRlbXMgPSB0aGlzLiRlbGVtZW50LmZpbmQoJ2xpJykubm90KCcuanMtZHJpbGxkb3duLWJhY2snKS5hdHRyKCdyb2xlJywgJ21lbnVpdGVtJykuZmluZCgnYScpO1xuICAgIHRoaXMuJGVsZW1lbnQuYXR0cignZGF0YS1tdXRhdGUnLCAodGhpcy4kZWxlbWVudC5hdHRyKCdkYXRhLWRyaWxsZG93bicpIHx8IEZvdW5kYXRpb24uR2V0WW9EaWdpdHMoNiwgJ2RyaWxsZG93bicpKSk7XG5cbiAgICB0aGlzLl9wcmVwYXJlTWVudSgpO1xuICAgIHRoaXMuX3JlZ2lzdGVyRXZlbnRzKCk7XG5cbiAgICB0aGlzLl9rZXlib2FyZEV2ZW50cygpO1xuICB9XG5cbiAgLyoqXG4gICAqIHByZXBhcmVzIGRyaWxsZG93biBtZW51IGJ5IHNldHRpbmcgYXR0cmlidXRlcyB0byBsaW5rcyBhbmQgZWxlbWVudHNcbiAgICogc2V0cyBhIG1pbiBoZWlnaHQgdG8gcHJldmVudCBjb250ZW50IGp1bXBpbmdcbiAgICogd3JhcHMgdGhlIGVsZW1lbnQgaWYgbm90IGFscmVhZHkgd3JhcHBlZFxuICAgKiBAcHJpdmF0ZVxuICAgKiBAZnVuY3Rpb25cbiAgICovXG4gIF9wcmVwYXJlTWVudSgpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIC8vIGlmKCF0aGlzLm9wdGlvbnMuaG9sZE9wZW4pe1xuICAgIC8vICAgdGhpcy5fbWVudUxpbmtFdmVudHMoKTtcbiAgICAvLyB9XG4gICAgdGhpcy4kc3VibWVudUFuY2hvcnMuZWFjaChmdW5jdGlvbigpe1xuICAgICAgdmFyICRsaW5rID0gJCh0aGlzKTtcbiAgICAgIHZhciAkc3ViID0gJGxpbmsucGFyZW50KCk7XG4gICAgICBpZihfdGhpcy5vcHRpb25zLnBhcmVudExpbmspe1xuICAgICAgICAkbGluay5jbG9uZSgpLnByZXBlbmRUbygkc3ViLmNoaWxkcmVuKCdbZGF0YS1zdWJtZW51XScpKS53cmFwKCc8bGkgY2xhc3M9XCJpcy1zdWJtZW51LXBhcmVudC1pdGVtIGlzLXN1Ym1lbnUtaXRlbSBpcy1kcmlsbGRvd24tc3VibWVudS1pdGVtXCIgcm9sZT1cIm1lbnUtaXRlbVwiPjwvbGk+Jyk7XG4gICAgICB9XG4gICAgICAkbGluay5kYXRhKCdzYXZlZEhyZWYnLCAkbGluay5hdHRyKCdocmVmJykpLnJlbW92ZUF0dHIoJ2hyZWYnKS5hdHRyKCd0YWJpbmRleCcsIDApO1xuICAgICAgJGxpbmsuY2hpbGRyZW4oJ1tkYXRhLXN1Ym1lbnVdJylcbiAgICAgICAgICAuYXR0cih7XG4gICAgICAgICAgICAnYXJpYS1oaWRkZW4nOiB0cnVlLFxuICAgICAgICAgICAgJ3RhYmluZGV4JzogMCxcbiAgICAgICAgICAgICdyb2xlJzogJ21lbnUnXG4gICAgICAgICAgfSk7XG4gICAgICBfdGhpcy5fZXZlbnRzKCRsaW5rKTtcbiAgICB9KTtcbiAgICB0aGlzLiRzdWJtZW51cy5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgICB2YXIgJG1lbnUgPSAkKHRoaXMpLFxuICAgICAgICAgICRiYWNrID0gJG1lbnUuZmluZCgnLmpzLWRyaWxsZG93bi1iYWNrJyk7XG4gICAgICBpZighJGJhY2subGVuZ3RoKXtcbiAgICAgICAgc3dpdGNoIChfdGhpcy5vcHRpb25zLmJhY2tCdXR0b25Qb3NpdGlvbikge1xuICAgICAgICAgIGNhc2UgXCJib3R0b21cIjpcbiAgICAgICAgICAgICRtZW51LmFwcGVuZChfdGhpcy5vcHRpb25zLmJhY2tCdXR0b24pO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcInRvcFwiOlxuICAgICAgICAgICAgJG1lbnUucHJlcGVuZChfdGhpcy5vcHRpb25zLmJhY2tCdXR0b24pO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJVbnN1cHBvcnRlZCBiYWNrQnV0dG9uUG9zaXRpb24gdmFsdWUgJ1wiICsgX3RoaXMub3B0aW9ucy5iYWNrQnV0dG9uUG9zaXRpb24gKyBcIidcIik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIF90aGlzLl9iYWNrKCRtZW51KTtcbiAgICB9KTtcblxuICAgIHRoaXMuJHN1Ym1lbnVzLmFkZENsYXNzKCdpbnZpc2libGUnKTtcbiAgICBpZighdGhpcy5vcHRpb25zLmF1dG9IZWlnaHQpIHtcbiAgICAgIHRoaXMuJHN1Ym1lbnVzLmFkZENsYXNzKCdkcmlsbGRvd24tc3VibWVudS1jb3Zlci1wcmV2aW91cycpO1xuICAgIH1cblxuICAgIC8vIGNyZWF0ZSBhIHdyYXBwZXIgb24gZWxlbWVudCBpZiBpdCBkb2Vzbid0IGV4aXN0LlxuICAgIGlmKCF0aGlzLiRlbGVtZW50LnBhcmVudCgpLmhhc0NsYXNzKCdpcy1kcmlsbGRvd24nKSl7XG4gICAgICB0aGlzLiR3cmFwcGVyID0gJCh0aGlzLm9wdGlvbnMud3JhcHBlcikuYWRkQ2xhc3MoJ2lzLWRyaWxsZG93bicpO1xuICAgICAgaWYodGhpcy5vcHRpb25zLmFuaW1hdGVIZWlnaHQpIHRoaXMuJHdyYXBwZXIuYWRkQ2xhc3MoJ2FuaW1hdGUtaGVpZ2h0Jyk7XG4gICAgICB0aGlzLiRlbGVtZW50LndyYXAodGhpcy4kd3JhcHBlcik7XG4gICAgfVxuICAgIC8vIHNldCB3cmFwcGVyXG4gICAgdGhpcy4kd3JhcHBlciA9IHRoaXMuJGVsZW1lbnQucGFyZW50KCk7XG4gICAgdGhpcy4kd3JhcHBlci5jc3ModGhpcy5fZ2V0TWF4RGltcygpKTtcbiAgfVxuXG4gIF9yZXNpemUoKSB7XG4gICAgdGhpcy4kd3JhcHBlci5jc3MoeydtYXgtd2lkdGgnOiAnbm9uZScsICdtaW4taGVpZ2h0JzogJ25vbmUnfSk7XG4gICAgLy8gX2dldE1heERpbXMgaGFzIHNpZGUgZWZmZWN0cyAoYm9vKSBidXQgY2FsbGluZyBpdCBzaG91bGQgdXBkYXRlIGFsbCBvdGhlciBuZWNlc3NhcnkgaGVpZ2h0cyAmIHdpZHRoc1xuICAgIHRoaXMuJHdyYXBwZXIuY3NzKHRoaXMuX2dldE1heERpbXMoKSk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBldmVudCBoYW5kbGVycyB0byBlbGVtZW50cyBpbiB0aGUgbWVudS5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSAkZWxlbSAtIHRoZSBjdXJyZW50IG1lbnUgaXRlbSB0byBhZGQgaGFuZGxlcnMgdG8uXG4gICAqL1xuICBfZXZlbnRzKCRlbGVtKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgICRlbGVtLm9mZignY2xpY2suemYuZHJpbGxkb3duJylcbiAgICAub24oJ2NsaWNrLnpmLmRyaWxsZG93bicsIGZ1bmN0aW9uKGUpe1xuICAgICAgaWYoJChlLnRhcmdldCkucGFyZW50c1VudGlsKCd1bCcsICdsaScpLmhhc0NsYXNzKCdpcy1kcmlsbGRvd24tc3VibWVudS1wYXJlbnQnKSl7XG4gICAgICAgIGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIH1cblxuICAgICAgLy8gaWYoZS50YXJnZXQgIT09IGUuY3VycmVudFRhcmdldC5maXJzdEVsZW1lbnRDaGlsZCl7XG4gICAgICAvLyAgIHJldHVybiBmYWxzZTtcbiAgICAgIC8vIH1cbiAgICAgIF90aGlzLl9zaG93KCRlbGVtLnBhcmVudCgnbGknKSk7XG5cbiAgICAgIGlmKF90aGlzLm9wdGlvbnMuY2xvc2VPbkNsaWNrKXtcbiAgICAgICAgdmFyICRib2R5ID0gJCgnYm9keScpO1xuICAgICAgICAkYm9keS5vZmYoJy56Zi5kcmlsbGRvd24nKS5vbignY2xpY2suemYuZHJpbGxkb3duJywgZnVuY3Rpb24oZSl7XG4gICAgICAgICAgaWYgKGUudGFyZ2V0ID09PSBfdGhpcy4kZWxlbWVudFswXSB8fCAkLmNvbnRhaW5zKF90aGlzLiRlbGVtZW50WzBdLCBlLnRhcmdldCkpIHsgcmV0dXJuOyB9XG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIF90aGlzLl9oaWRlQWxsKCk7XG4gICAgICAgICAgJGJvZHkub2ZmKCcuemYuZHJpbGxkb3duJyk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuXHQgIHRoaXMuJGVsZW1lbnQub24oJ211dGF0ZW1lLnpmLnRyaWdnZXInLCB0aGlzLl9yZXNpemUuYmluZCh0aGlzKSk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBldmVudCBoYW5kbGVycyB0byB0aGUgbWVudSBlbGVtZW50LlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9yZWdpc3RlckV2ZW50cygpIHtcbiAgICBpZih0aGlzLm9wdGlvbnMuc2Nyb2xsVG9wKXtcbiAgICAgIHRoaXMuX2JpbmRIYW5kbGVyID0gdGhpcy5fc2Nyb2xsVG9wLmJpbmQodGhpcyk7XG4gICAgICB0aGlzLiRlbGVtZW50Lm9uKCdvcGVuLnpmLmRyaWxsZG93biBoaWRlLnpmLmRyaWxsZG93biBjbG9zZWQuemYuZHJpbGxkb3duJyx0aGlzLl9iaW5kSGFuZGxlcik7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNjcm9sbCB0byBUb3Agb2YgRWxlbWVudCBvciBkYXRhLXNjcm9sbC10b3AtZWxlbWVudFxuICAgKiBAZnVuY3Rpb25cbiAgICogQGZpcmVzIERyaWxsZG93biNzY3JvbGxtZVxuICAgKi9cbiAgX3Njcm9sbFRvcCgpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIHZhciAkc2Nyb2xsVG9wRWxlbWVudCA9IF90aGlzLm9wdGlvbnMuc2Nyb2xsVG9wRWxlbWVudCE9Jyc/JChfdGhpcy5vcHRpb25zLnNjcm9sbFRvcEVsZW1lbnQpOl90aGlzLiRlbGVtZW50LFxuICAgICAgICBzY3JvbGxQb3MgPSBwYXJzZUludCgkc2Nyb2xsVG9wRWxlbWVudC5vZmZzZXQoKS50b3ArX3RoaXMub3B0aW9ucy5zY3JvbGxUb3BPZmZzZXQpO1xuICAgICQoJ2h0bWwsIGJvZHknKS5zdG9wKHRydWUpLmFuaW1hdGUoeyBzY3JvbGxUb3A6IHNjcm9sbFBvcyB9LCBfdGhpcy5vcHRpb25zLmFuaW1hdGlvbkR1cmF0aW9uLCBfdGhpcy5vcHRpb25zLmFuaW1hdGlvbkVhc2luZyxmdW5jdGlvbigpe1xuICAgICAgLyoqXG4gICAgICAgICogRmlyZXMgYWZ0ZXIgdGhlIG1lbnUgaGFzIHNjcm9sbGVkXG4gICAgICAgICogQGV2ZW50IERyaWxsZG93biNzY3JvbGxtZVxuICAgICAgICAqL1xuICAgICAgaWYodGhpcz09PSQoJ2h0bWwnKVswXSlfdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdzY3JvbGxtZS56Zi5kcmlsbGRvd24nKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGtleWRvd24gZXZlbnQgbGlzdGVuZXIgdG8gYGxpYCdzIGluIHRoZSBtZW51LlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2tleWJvYXJkRXZlbnRzKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICB0aGlzLiRtZW51SXRlbXMuYWRkKHRoaXMuJGVsZW1lbnQuZmluZCgnLmpzLWRyaWxsZG93bi1iYWNrID4gYSwgLmlzLXN1Ym1lbnUtcGFyZW50LWl0ZW0gPiBhJykpLm9uKCdrZXlkb3duLnpmLmRyaWxsZG93bicsIGZ1bmN0aW9uKGUpe1xuICAgICAgdmFyICRlbGVtZW50ID0gJCh0aGlzKSxcbiAgICAgICAgICAkZWxlbWVudHMgPSAkZWxlbWVudC5wYXJlbnQoJ2xpJykucGFyZW50KCd1bCcpLmNoaWxkcmVuKCdsaScpLmNoaWxkcmVuKCdhJyksXG4gICAgICAgICAgJHByZXZFbGVtZW50LFxuICAgICAgICAgICRuZXh0RWxlbWVudDtcblxuICAgICAgJGVsZW1lbnRzLmVhY2goZnVuY3Rpb24oaSkge1xuICAgICAgICBpZiAoJCh0aGlzKS5pcygkZWxlbWVudCkpIHtcbiAgICAgICAgICAkcHJldkVsZW1lbnQgPSAkZWxlbWVudHMuZXEoTWF0aC5tYXgoMCwgaS0xKSk7XG4gICAgICAgICAgJG5leHRFbGVtZW50ID0gJGVsZW1lbnRzLmVxKE1hdGgubWluKGkrMSwgJGVsZW1lbnRzLmxlbmd0aC0xKSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgRm91bmRhdGlvbi5LZXlib2FyZC5oYW5kbGVLZXkoZSwgJ0RyaWxsZG93bicsIHtcbiAgICAgICAgbmV4dDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKCRlbGVtZW50LmlzKF90aGlzLiRzdWJtZW51QW5jaG9ycykpIHtcbiAgICAgICAgICAgIF90aGlzLl9zaG93KCRlbGVtZW50LnBhcmVudCgnbGknKSk7XG4gICAgICAgICAgICAkZWxlbWVudC5wYXJlbnQoJ2xpJykub25lKEZvdW5kYXRpb24udHJhbnNpdGlvbmVuZCgkZWxlbWVudCksIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICRlbGVtZW50LnBhcmVudCgnbGknKS5maW5kKCd1bCBsaSBhJykuZmlsdGVyKF90aGlzLiRtZW51SXRlbXMpLmZpcnN0KCkuZm9jdXMoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBwcmV2aW91czogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgX3RoaXMuX2hpZGUoJGVsZW1lbnQucGFyZW50KCdsaScpLnBhcmVudCgndWwnKSk7XG4gICAgICAgICAgJGVsZW1lbnQucGFyZW50KCdsaScpLnBhcmVudCgndWwnKS5vbmUoRm91bmRhdGlvbi50cmFuc2l0aW9uZW5kKCRlbGVtZW50KSwgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICRlbGVtZW50LnBhcmVudCgnbGknKS5wYXJlbnQoJ3VsJykucGFyZW50KCdsaScpLmNoaWxkcmVuKCdhJykuZmlyc3QoKS5mb2N1cygpO1xuICAgICAgICAgICAgfSwgMSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sXG4gICAgICAgIHVwOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAkcHJldkVsZW1lbnQuZm9jdXMoKTtcbiAgICAgICAgICAvLyBEb24ndCB0YXAgZm9jdXMgb24gZmlyc3QgZWxlbWVudCBpbiByb290IHVsXG4gICAgICAgICAgcmV0dXJuICEkZWxlbWVudC5pcyhfdGhpcy4kZWxlbWVudC5maW5kKCc+IGxpOmZpcnN0LWNoaWxkID4gYScpKTtcbiAgICAgICAgfSxcbiAgICAgICAgZG93bjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgJG5leHRFbGVtZW50LmZvY3VzKCk7XG4gICAgICAgICAgLy8gRG9uJ3QgdGFwIGZvY3VzIG9uIGxhc3QgZWxlbWVudCBpbiByb290IHVsXG4gICAgICAgICAgcmV0dXJuICEkZWxlbWVudC5pcyhfdGhpcy4kZWxlbWVudC5maW5kKCc+IGxpOmxhc3QtY2hpbGQgPiBhJykpO1xuICAgICAgICB9LFxuICAgICAgICBjbG9zZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgLy8gRG9uJ3QgY2xvc2Ugb24gZWxlbWVudCBpbiByb290IHVsXG4gICAgICAgICAgaWYgKCEkZWxlbWVudC5pcyhfdGhpcy4kZWxlbWVudC5maW5kKCc+IGxpID4gYScpKSkge1xuICAgICAgICAgICAgX3RoaXMuX2hpZGUoJGVsZW1lbnQucGFyZW50KCkucGFyZW50KCkpO1xuICAgICAgICAgICAgJGVsZW1lbnQucGFyZW50KCkucGFyZW50KCkuc2libGluZ3MoJ2EnKS5mb2N1cygpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgb3BlbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKCEkZWxlbWVudC5pcyhfdGhpcy4kbWVudUl0ZW1zKSkgeyAvLyBub3QgbWVudSBpdGVtIG1lYW5zIGJhY2sgYnV0dG9uXG4gICAgICAgICAgICBfdGhpcy5faGlkZSgkZWxlbWVudC5wYXJlbnQoJ2xpJykucGFyZW50KCd1bCcpKTtcbiAgICAgICAgICAgICRlbGVtZW50LnBhcmVudCgnbGknKS5wYXJlbnQoJ3VsJykub25lKEZvdW5kYXRpb24udHJhbnNpdGlvbmVuZCgkZWxlbWVudCksIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgJGVsZW1lbnQucGFyZW50KCdsaScpLnBhcmVudCgndWwnKS5wYXJlbnQoJ2xpJykuY2hpbGRyZW4oJ2EnKS5maXJzdCgpLmZvY3VzKCk7XG4gICAgICAgICAgICAgIH0sIDEpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9IGVsc2UgaWYgKCRlbGVtZW50LmlzKF90aGlzLiRzdWJtZW51QW5jaG9ycykpIHtcbiAgICAgICAgICAgIF90aGlzLl9zaG93KCRlbGVtZW50LnBhcmVudCgnbGknKSk7XG4gICAgICAgICAgICAkZWxlbWVudC5wYXJlbnQoJ2xpJykub25lKEZvdW5kYXRpb24udHJhbnNpdGlvbmVuZCgkZWxlbWVudCksIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICRlbGVtZW50LnBhcmVudCgnbGknKS5maW5kKCd1bCBsaSBhJykuZmlsdGVyKF90aGlzLiRtZW51SXRlbXMpLmZpcnN0KCkuZm9jdXMoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBoYW5kbGVkOiBmdW5jdGlvbihwcmV2ZW50RGVmYXVsdCkge1xuICAgICAgICAgIGlmIChwcmV2ZW50RGVmYXVsdCkge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTsgLy8gZW5kIGtleWJvYXJkQWNjZXNzXG4gIH1cblxuICAvKipcbiAgICogQ2xvc2VzIGFsbCBvcGVuIGVsZW1lbnRzLCBhbmQgcmV0dXJucyB0byByb290IG1lbnUuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAZmlyZXMgRHJpbGxkb3duI2Nsb3NlZFxuICAgKi9cbiAgX2hpZGVBbGwoKSB7XG4gICAgdmFyICRlbGVtID0gdGhpcy4kZWxlbWVudC5maW5kKCcuaXMtZHJpbGxkb3duLXN1Ym1lbnUuaXMtYWN0aXZlJykuYWRkQ2xhc3MoJ2lzLWNsb3NpbmcnKTtcbiAgICBpZih0aGlzLm9wdGlvbnMuYXV0b0hlaWdodCkgdGhpcy4kd3JhcHBlci5jc3Moe2hlaWdodDokZWxlbS5wYXJlbnQoKS5jbG9zZXN0KCd1bCcpLmRhdGEoJ2NhbGNIZWlnaHQnKX0pO1xuICAgICRlbGVtLm9uZShGb3VuZGF0aW9uLnRyYW5zaXRpb25lbmQoJGVsZW0pLCBmdW5jdGlvbihlKXtcbiAgICAgICRlbGVtLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUgaXMtY2xvc2luZycpO1xuICAgIH0pO1xuICAgICAgICAvKipcbiAgICAgICAgICogRmlyZXMgd2hlbiB0aGUgbWVudSBpcyBmdWxseSBjbG9zZWQuXG4gICAgICAgICAqIEBldmVudCBEcmlsbGRvd24jY2xvc2VkXG4gICAgICAgICAqL1xuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignY2xvc2VkLnpmLmRyaWxsZG93bicpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgZXZlbnQgbGlzdGVuZXIgZm9yIGVhY2ggYGJhY2tgIGJ1dHRvbiwgYW5kIGNsb3NlcyBvcGVuIG1lbnVzLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQGZpcmVzIERyaWxsZG93biNiYWNrXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSAkZWxlbSAtIHRoZSBjdXJyZW50IHN1Yi1tZW51IHRvIGFkZCBgYmFja2AgZXZlbnQuXG4gICAqL1xuICBfYmFjaygkZWxlbSkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgJGVsZW0ub2ZmKCdjbGljay56Zi5kcmlsbGRvd24nKTtcbiAgICAkZWxlbS5jaGlsZHJlbignLmpzLWRyaWxsZG93bi1iYWNrJylcbiAgICAgIC5vbignY2xpY2suemYuZHJpbGxkb3duJywgZnVuY3Rpb24oZSl7XG4gICAgICAgIGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdtb3VzZXVwIG9uIGJhY2snKTtcbiAgICAgICAgX3RoaXMuX2hpZGUoJGVsZW0pO1xuXG4gICAgICAgIC8vIElmIHRoZXJlIGlzIGEgcGFyZW50IHN1Ym1lbnUsIGNhbGwgc2hvd1xuICAgICAgICBsZXQgcGFyZW50U3ViTWVudSA9ICRlbGVtLnBhcmVudCgnbGknKS5wYXJlbnQoJ3VsJykucGFyZW50KCdsaScpO1xuICAgICAgICBpZiAocGFyZW50U3ViTWVudS5sZW5ndGgpIHtcbiAgICAgICAgICBfdGhpcy5fc2hvdyhwYXJlbnRTdWJNZW51KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBldmVudCBsaXN0ZW5lciB0byBtZW51IGl0ZW1zIHcvbyBzdWJtZW51cyB0byBjbG9zZSBvcGVuIG1lbnVzIG9uIGNsaWNrLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9tZW51TGlua0V2ZW50cygpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIHRoaXMuJG1lbnVJdGVtcy5ub3QoJy5pcy1kcmlsbGRvd24tc3VibWVudS1wYXJlbnQnKVxuICAgICAgICAub2ZmKCdjbGljay56Zi5kcmlsbGRvd24nKVxuICAgICAgICAub24oJ2NsaWNrLnpmLmRyaWxsZG93bicsIGZ1bmN0aW9uKGUpe1xuICAgICAgICAgIC8vIGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgX3RoaXMuX2hpZGVBbGwoKTtcbiAgICAgICAgICB9LCAwKTtcbiAgICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIE9wZW5zIGEgc3VibWVudS5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBmaXJlcyBEcmlsbGRvd24jb3BlblxuICAgKiBAcGFyYW0ge2pRdWVyeX0gJGVsZW0gLSB0aGUgY3VycmVudCBlbGVtZW50IHdpdGggYSBzdWJtZW51IHRvIG9wZW4sIGkuZS4gdGhlIGBsaWAgdGFnLlxuICAgKi9cbiAgX3Nob3coJGVsZW0pIHtcbiAgICBpZih0aGlzLm9wdGlvbnMuYXV0b0hlaWdodCkgdGhpcy4kd3JhcHBlci5jc3Moe2hlaWdodDokZWxlbS5jaGlsZHJlbignW2RhdGEtc3VibWVudV0nKS5kYXRhKCdjYWxjSGVpZ2h0Jyl9KTtcbiAgICAkZWxlbS5hdHRyKCdhcmlhLWV4cGFuZGVkJywgdHJ1ZSk7XG4gICAgJGVsZW0uY2hpbGRyZW4oJ1tkYXRhLXN1Ym1lbnVdJykuYWRkQ2xhc3MoJ2lzLWFjdGl2ZScpLnJlbW92ZUNsYXNzKCdpbnZpc2libGUnKS5hdHRyKCdhcmlhLWhpZGRlbicsIGZhbHNlKTtcbiAgICAvKipcbiAgICAgKiBGaXJlcyB3aGVuIHRoZSBzdWJtZW51IGhhcyBvcGVuZWQuXG4gICAgICogQGV2ZW50IERyaWxsZG93biNvcGVuXG4gICAgICovXG4gICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdvcGVuLnpmLmRyaWxsZG93bicsIFskZWxlbV0pO1xuICB9O1xuXG4gIC8qKlxuICAgKiBIaWRlcyBhIHN1Ym1lbnVcbiAgICogQGZ1bmN0aW9uXG4gICAqIEBmaXJlcyBEcmlsbGRvd24jaGlkZVxuICAgKiBAcGFyYW0ge2pRdWVyeX0gJGVsZW0gLSB0aGUgY3VycmVudCBzdWItbWVudSB0byBoaWRlLCBpLmUuIHRoZSBgdWxgIHRhZy5cbiAgICovXG4gIF9oaWRlKCRlbGVtKSB7XG4gICAgaWYodGhpcy5vcHRpb25zLmF1dG9IZWlnaHQpIHRoaXMuJHdyYXBwZXIuY3NzKHtoZWlnaHQ6JGVsZW0ucGFyZW50KCkuY2xvc2VzdCgndWwnKS5kYXRhKCdjYWxjSGVpZ2h0Jyl9KTtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICRlbGVtLnBhcmVudCgnbGknKS5hdHRyKCdhcmlhLWV4cGFuZGVkJywgZmFsc2UpO1xuICAgICRlbGVtLmF0dHIoJ2FyaWEtaGlkZGVuJywgdHJ1ZSkuYWRkQ2xhc3MoJ2lzLWNsb3NpbmcnKVxuICAgICRlbGVtLmFkZENsYXNzKCdpcy1jbG9zaW5nJylcbiAgICAgICAgIC5vbmUoRm91bmRhdGlvbi50cmFuc2l0aW9uZW5kKCRlbGVtKSwgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgJGVsZW0ucmVtb3ZlQ2xhc3MoJ2lzLWFjdGl2ZSBpcy1jbG9zaW5nJyk7XG4gICAgICAgICAgICRlbGVtLmJsdXIoKS5hZGRDbGFzcygnaW52aXNpYmxlJyk7XG4gICAgICAgICB9KTtcbiAgICAvKipcbiAgICAgKiBGaXJlcyB3aGVuIHRoZSBzdWJtZW51IGhhcyBjbG9zZWQuXG4gICAgICogQGV2ZW50IERyaWxsZG93biNoaWRlXG4gICAgICovXG4gICAgJGVsZW0udHJpZ2dlcignaGlkZS56Zi5kcmlsbGRvd24nLCBbJGVsZW1dKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJdGVyYXRlcyB0aHJvdWdoIHRoZSBuZXN0ZWQgbWVudXMgdG8gY2FsY3VsYXRlIHRoZSBtaW4taGVpZ2h0LCBhbmQgbWF4LXdpZHRoIGZvciB0aGUgbWVudS5cbiAgICogUHJldmVudHMgY29udGVudCBqdW1waW5nLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9nZXRNYXhEaW1zKCkge1xuICAgIHZhciAgbWF4SGVpZ2h0ID0gMCwgcmVzdWx0ID0ge30sIF90aGlzID0gdGhpcztcbiAgICB0aGlzLiRzdWJtZW51cy5hZGQodGhpcy4kZWxlbWVudCkuZWFjaChmdW5jdGlvbigpe1xuICAgICAgdmFyIG51bU9mRWxlbXMgPSAkKHRoaXMpLmNoaWxkcmVuKCdsaScpLmxlbmd0aDtcbiAgICAgIHZhciBoZWlnaHQgPSBGb3VuZGF0aW9uLkJveC5HZXREaW1lbnNpb25zKHRoaXMpLmhlaWdodDtcbiAgICAgIG1heEhlaWdodCA9IGhlaWdodCA+IG1heEhlaWdodCA/IGhlaWdodCA6IG1heEhlaWdodDtcbiAgICAgIGlmKF90aGlzLm9wdGlvbnMuYXV0b0hlaWdodCkge1xuICAgICAgICAkKHRoaXMpLmRhdGEoJ2NhbGNIZWlnaHQnLGhlaWdodCk7XG4gICAgICAgIGlmICghJCh0aGlzKS5oYXNDbGFzcygnaXMtZHJpbGxkb3duLXN1Ym1lbnUnKSkgcmVzdWx0WydoZWlnaHQnXSA9IGhlaWdodDtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGlmKCF0aGlzLm9wdGlvbnMuYXV0b0hlaWdodCkgcmVzdWx0WydtaW4taGVpZ2h0J10gPSBgJHttYXhIZWlnaHR9cHhgO1xuXG4gICAgcmVzdWx0WydtYXgtd2lkdGgnXSA9IGAke3RoaXMuJGVsZW1lbnRbMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkud2lkdGh9cHhgO1xuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXN0cm95cyB0aGUgRHJpbGxkb3duIE1lbnVcbiAgICogQGZ1bmN0aW9uXG4gICAqL1xuICBkZXN0cm95KCkge1xuICAgIGlmKHRoaXMub3B0aW9ucy5zY3JvbGxUb3ApIHRoaXMuJGVsZW1lbnQub2ZmKCcuemYuZHJpbGxkb3duJyx0aGlzLl9iaW5kSGFuZGxlcik7XG4gICAgdGhpcy5faGlkZUFsbCgpO1xuXHQgIHRoaXMuJGVsZW1lbnQub2ZmKCdtdXRhdGVtZS56Zi50cmlnZ2VyJyk7XG4gICAgRm91bmRhdGlvbi5OZXN0LkJ1cm4odGhpcy4kZWxlbWVudCwgJ2RyaWxsZG93bicpO1xuICAgIHRoaXMuJGVsZW1lbnQudW53cmFwKClcbiAgICAgICAgICAgICAgICAgLmZpbmQoJy5qcy1kcmlsbGRvd24tYmFjaywgLmlzLXN1Ym1lbnUtcGFyZW50LWl0ZW0nKS5yZW1vdmUoKVxuICAgICAgICAgICAgICAgICAuZW5kKCkuZmluZCgnLmlzLWFjdGl2ZSwgLmlzLWNsb3NpbmcsIC5pcy1kcmlsbGRvd24tc3VibWVudScpLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUgaXMtY2xvc2luZyBpcy1kcmlsbGRvd24tc3VibWVudScpXG4gICAgICAgICAgICAgICAgIC5lbmQoKS5maW5kKCdbZGF0YS1zdWJtZW51XScpLnJlbW92ZUF0dHIoJ2FyaWEtaGlkZGVuIHRhYmluZGV4IHJvbGUnKTtcbiAgICB0aGlzLiRzdWJtZW51QW5jaG9ycy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgJCh0aGlzKS5vZmYoJy56Zi5kcmlsbGRvd24nKTtcbiAgICB9KTtcblxuICAgIHRoaXMuJHN1Ym1lbnVzLnJlbW92ZUNsYXNzKCdkcmlsbGRvd24tc3VibWVudS1jb3Zlci1wcmV2aW91cycpO1xuXG4gICAgdGhpcy4kZWxlbWVudC5maW5kKCdhJykuZWFjaChmdW5jdGlvbigpe1xuICAgICAgdmFyICRsaW5rID0gJCh0aGlzKTtcbiAgICAgICRsaW5rLnJlbW92ZUF0dHIoJ3RhYmluZGV4Jyk7XG4gICAgICBpZigkbGluay5kYXRhKCdzYXZlZEhyZWYnKSl7XG4gICAgICAgICRsaW5rLmF0dHIoJ2hyZWYnLCAkbGluay5kYXRhKCdzYXZlZEhyZWYnKSkucmVtb3ZlRGF0YSgnc2F2ZWRIcmVmJyk7XG4gICAgICB9ZWxzZXsgcmV0dXJuOyB9XG4gICAgfSk7XG4gICAgRm91bmRhdGlvbi51bnJlZ2lzdGVyUGx1Z2luKHRoaXMpO1xuICB9O1xufVxuXG5EcmlsbGRvd24uZGVmYXVsdHMgPSB7XG4gIC8qKlxuICAgKiBNYXJrdXAgdXNlZCBmb3IgSlMgZ2VuZXJhdGVkIGJhY2sgYnV0dG9uLiBQcmVwZW5kZWQgIG9yIGFwcGVuZGVkIChzZWUgYmFja0J1dHRvblBvc2l0aW9uKSB0byBzdWJtZW51IGxpc3RzIGFuZCBkZWxldGVkIG9uIGBkZXN0cm95YCBtZXRob2QsICdqcy1kcmlsbGRvd24tYmFjaycgY2xhc3MgcmVxdWlyZWQuIFJlbW92ZSB0aGUgYmFja3NsYXNoIChgXFxgKSBpZiBjb3B5IGFuZCBwYXN0aW5nLlxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHtzdHJpbmd9XG4gICAqIEBkZWZhdWx0ICc8bGkgY2xhc3M9XCJqcy1kcmlsbGRvd24tYmFja1wiPjxhIHRhYmluZGV4PVwiMFwiPkJhY2s8L2E+PC9saT4nXG4gICAqL1xuICBiYWNrQnV0dG9uOiAnPGxpIGNsYXNzPVwianMtZHJpbGxkb3duLWJhY2tcIj48YSB0YWJpbmRleD1cIjBcIj5CYWNrPC9hPjwvbGk+JyxcbiAgLyoqXG4gICAqIFBvc2l0aW9uIHRoZSBiYWNrIGJ1dHRvbiBlaXRoZXIgYXQgdGhlIHRvcCBvciBib3R0b20gb2YgZHJpbGxkb3duIHN1Ym1lbnVzLiBDYW4gYmUgYCdsZWZ0J2Agb3IgYCdib3R0b20nYC5cbiAgICogQG9wdGlvblxuICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgKiBAZGVmYXVsdCB0b3BcbiAgICovXG4gIGJhY2tCdXR0b25Qb3NpdGlvbjogJ3RvcCcsXG4gIC8qKlxuICAgKiBNYXJrdXAgdXNlZCB0byB3cmFwIGRyaWxsZG93biBtZW51LiBVc2UgYSBjbGFzcyBuYW1lIGZvciBpbmRlcGVuZGVudCBzdHlsaW5nOyB0aGUgSlMgYXBwbGllZCBjbGFzczogYGlzLWRyaWxsZG93bmAgaXMgcmVxdWlyZWQuIFJlbW92ZSB0aGUgYmFja3NsYXNoIChgXFxgKSBpZiBjb3B5IGFuZCBwYXN0aW5nLlxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHtzdHJpbmd9XG4gICAqIEBkZWZhdWx0ICc8ZGl2PjwvZGl2PidcbiAgICovXG4gIHdyYXBwZXI6ICc8ZGl2PjwvZGl2PicsXG4gIC8qKlxuICAgKiBBZGRzIHRoZSBwYXJlbnQgbGluayB0byB0aGUgc3VibWVudS5cbiAgICogQG9wdGlvblxuICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICogQGRlZmF1bHQgZmFsc2VcbiAgICovXG4gIHBhcmVudExpbms6IGZhbHNlLFxuICAvKipcbiAgICogQWxsb3cgdGhlIG1lbnUgdG8gcmV0dXJuIHRvIHJvb3QgbGlzdCBvbiBib2R5IGNsaWNrLlxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHtib29sZWFufVxuICAgKiBAZGVmYXVsdCBmYWxzZVxuICAgKi9cbiAgY2xvc2VPbkNsaWNrOiBmYWxzZSxcbiAgLyoqXG4gICAqIEFsbG93IHRoZSBtZW51IHRvIGF1dG8gYWRqdXN0IGhlaWdodC5cbiAgICogQG9wdGlvblxuICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICogQGRlZmF1bHQgZmFsc2VcbiAgICovXG4gIGF1dG9IZWlnaHQ6IGZhbHNlLFxuICAvKipcbiAgICogQW5pbWF0ZSB0aGUgYXV0byBhZGp1c3QgaGVpZ2h0LlxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHtib29sZWFufVxuICAgKiBAZGVmYXVsdCBmYWxzZVxuICAgKi9cbiAgYW5pbWF0ZUhlaWdodDogZmFsc2UsXG4gIC8qKlxuICAgKiBTY3JvbGwgdG8gdGhlIHRvcCBvZiB0aGUgbWVudSBhZnRlciBvcGVuaW5nIGEgc3VibWVudSBvciBuYXZpZ2F0aW5nIGJhY2sgdXNpbmcgdGhlIG1lbnUgYmFjayBidXR0b25cbiAgICogQG9wdGlvblxuICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICogQGRlZmF1bHQgZmFsc2VcbiAgICovXG4gIHNjcm9sbFRvcDogZmFsc2UsXG4gIC8qKlxuICAgKiBTdHJpbmcganF1ZXJ5IHNlbGVjdG9yIChmb3IgZXhhbXBsZSAnYm9keScpIG9mIGVsZW1lbnQgdG8gdGFrZSBvZmZzZXQoKS50b3AgZnJvbSwgaWYgZW1wdHkgc3RyaW5nIHRoZSBkcmlsbGRvd24gbWVudSBvZmZzZXQoKS50b3AgaXMgdGFrZW5cbiAgICogQG9wdGlvblxuICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgKiBAZGVmYXVsdCAnJ1xuICAgKi9cbiAgc2Nyb2xsVG9wRWxlbWVudDogJycsXG4gIC8qKlxuICAgKiBTY3JvbGxUb3Agb2Zmc2V0XG4gICAqIEBvcHRpb25cbiAgICogQHR5cGUge251bWJlcn1cbiAgICogQGRlZmF1bHQgMFxuICAgKi9cbiAgc2Nyb2xsVG9wT2Zmc2V0OiAwLFxuICAvKipcbiAgICogU2Nyb2xsIGFuaW1hdGlvbiBkdXJhdGlvblxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHtudW1iZXJ9XG4gICAqIEBkZWZhdWx0IDUwMFxuICAgKi9cbiAgYW5pbWF0aW9uRHVyYXRpb246IDUwMCxcbiAgLyoqXG4gICAqIFNjcm9sbCBhbmltYXRpb24gZWFzaW5nLiBDYW4gYmUgYCdzd2luZydgIG9yIGAnbGluZWFyJ2AuXG4gICAqIEBvcHRpb25cbiAgICogQHR5cGUge3N0cmluZ31cbiAgICogQHNlZSB7QGxpbmsgaHR0cHM6Ly9hcGkuanF1ZXJ5LmNvbS9hbmltYXRlfEpRdWVyeSBhbmltYXRlfVxuICAgKiBAZGVmYXVsdCAnc3dpbmcnXG4gICAqL1xuICBhbmltYXRpb25FYXNpbmc6ICdzd2luZydcbiAgLy8gaG9sZE9wZW46IGZhbHNlXG59O1xuXG4vLyBXaW5kb3cgZXhwb3J0c1xuRm91bmRhdGlvbi5wbHVnaW4oRHJpbGxkb3duLCAnRHJpbGxkb3duJyk7XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuLyoqXG4gKiBFcXVhbGl6ZXIgbW9kdWxlLlxuICogQG1vZHVsZSBmb3VuZGF0aW9uLmVxdWFsaXplclxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5tZWRpYVF1ZXJ5XG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLnRpbWVyQW5kSW1hZ2VMb2FkZXIgaWYgZXF1YWxpemVyIGNvbnRhaW5zIGltYWdlc1xuICovXG5cbmNsYXNzIEVxdWFsaXplciB7XG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIEVxdWFsaXplci5cbiAgICogQGNsYXNzXG4gICAqIEBmaXJlcyBFcXVhbGl6ZXIjaW5pdFxuICAgKiBAcGFyYW0ge09iamVjdH0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gYWRkIHRoZSB0cmlnZ2VyIHRvLlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE92ZXJyaWRlcyB0byB0aGUgZGVmYXVsdCBwbHVnaW4gc2V0dGluZ3MuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihlbGVtZW50LCBvcHRpb25zKXtcbiAgICB0aGlzLiRlbGVtZW50ID0gZWxlbWVudDtcbiAgICB0aGlzLm9wdGlvbnMgID0gJC5leHRlbmQoe30sIEVxdWFsaXplci5kZWZhdWx0cywgdGhpcy4kZWxlbWVudC5kYXRhKCksIG9wdGlvbnMpO1xuXG4gICAgdGhpcy5faW5pdCgpO1xuXG4gICAgRm91bmRhdGlvbi5yZWdpc3RlclBsdWdpbih0aGlzLCAnRXF1YWxpemVyJyk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgdGhlIEVxdWFsaXplciBwbHVnaW4gYW5kIGNhbGxzIGZ1bmN0aW9ucyB0byBnZXQgZXF1YWxpemVyIGZ1bmN0aW9uaW5nIG9uIGxvYWQuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfaW5pdCgpIHtcbiAgICB2YXIgZXFJZCA9IHRoaXMuJGVsZW1lbnQuYXR0cignZGF0YS1lcXVhbGl6ZXInKSB8fCAnJztcbiAgICB2YXIgJHdhdGNoZWQgPSB0aGlzLiRlbGVtZW50LmZpbmQoYFtkYXRhLWVxdWFsaXplci13YXRjaD1cIiR7ZXFJZH1cIl1gKTtcblxuICAgIHRoaXMuJHdhdGNoZWQgPSAkd2F0Y2hlZC5sZW5ndGggPyAkd2F0Y2hlZCA6IHRoaXMuJGVsZW1lbnQuZmluZCgnW2RhdGEtZXF1YWxpemVyLXdhdGNoXScpO1xuICAgIHRoaXMuJGVsZW1lbnQuYXR0cignZGF0YS1yZXNpemUnLCAoZXFJZCB8fCBGb3VuZGF0aW9uLkdldFlvRGlnaXRzKDYsICdlcScpKSk7XG5cdHRoaXMuJGVsZW1lbnQuYXR0cignZGF0YS1tdXRhdGUnLCAoZXFJZCB8fCBGb3VuZGF0aW9uLkdldFlvRGlnaXRzKDYsICdlcScpKSk7XG5cbiAgICB0aGlzLmhhc05lc3RlZCA9IHRoaXMuJGVsZW1lbnQuZmluZCgnW2RhdGEtZXF1YWxpemVyXScpLmxlbmd0aCA+IDA7XG4gICAgdGhpcy5pc05lc3RlZCA9IHRoaXMuJGVsZW1lbnQucGFyZW50c1VudGlsKGRvY3VtZW50LmJvZHksICdbZGF0YS1lcXVhbGl6ZXJdJykubGVuZ3RoID4gMDtcbiAgICB0aGlzLmlzT24gPSBmYWxzZTtcbiAgICB0aGlzLl9iaW5kSGFuZGxlciA9IHtcbiAgICAgIG9uUmVzaXplTWVCb3VuZDogdGhpcy5fb25SZXNpemVNZS5iaW5kKHRoaXMpLFxuICAgICAgb25Qb3N0RXF1YWxpemVkQm91bmQ6IHRoaXMuX29uUG9zdEVxdWFsaXplZC5iaW5kKHRoaXMpXG4gICAgfTtcblxuICAgIHZhciBpbWdzID0gdGhpcy4kZWxlbWVudC5maW5kKCdpbWcnKTtcbiAgICB2YXIgdG9vU21hbGw7XG4gICAgaWYodGhpcy5vcHRpb25zLmVxdWFsaXplT24pe1xuICAgICAgdG9vU21hbGwgPSB0aGlzLl9jaGVja01RKCk7XG4gICAgICAkKHdpbmRvdykub24oJ2NoYW5nZWQuemYubWVkaWFxdWVyeScsIHRoaXMuX2NoZWNrTVEuYmluZCh0aGlzKSk7XG4gICAgfWVsc2V7XG4gICAgICB0aGlzLl9ldmVudHMoKTtcbiAgICB9XG4gICAgaWYoKHRvb1NtYWxsICE9PSB1bmRlZmluZWQgJiYgdG9vU21hbGwgPT09IGZhbHNlKSB8fCB0b29TbWFsbCA9PT0gdW5kZWZpbmVkKXtcbiAgICAgIGlmKGltZ3MubGVuZ3RoKXtcbiAgICAgICAgRm91bmRhdGlvbi5vbkltYWdlc0xvYWRlZChpbWdzLCB0aGlzLl9yZWZsb3cuYmluZCh0aGlzKSk7XG4gICAgICB9ZWxzZXtcbiAgICAgICAgdGhpcy5fcmVmbG93KCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgZXZlbnQgbGlzdGVuZXJzIGlmIHRoZSBicmVha3BvaW50IGlzIHRvbyBzbWFsbC5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9wYXVzZUV2ZW50cygpIHtcbiAgICB0aGlzLmlzT24gPSBmYWxzZTtcbiAgICB0aGlzLiRlbGVtZW50Lm9mZih7XG4gICAgICAnLnpmLmVxdWFsaXplcic6IHRoaXMuX2JpbmRIYW5kbGVyLm9uUG9zdEVxdWFsaXplZEJvdW5kLFxuICAgICAgJ3Jlc2l6ZW1lLnpmLnRyaWdnZXInOiB0aGlzLl9iaW5kSGFuZGxlci5vblJlc2l6ZU1lQm91bmQsXG5cdCAgJ211dGF0ZW1lLnpmLnRyaWdnZXInOiB0aGlzLl9iaW5kSGFuZGxlci5vblJlc2l6ZU1lQm91bmRcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBmdW5jdGlvbiB0byBoYW5kbGUgJGVsZW1lbnRzIHJlc2l6ZW1lLnpmLnRyaWdnZXIsIHdpdGggYm91bmQgdGhpcyBvbiBfYmluZEhhbmRsZXIub25SZXNpemVNZUJvdW5kXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfb25SZXNpemVNZShlKSB7XG4gICAgdGhpcy5fcmVmbG93KCk7XG4gIH1cblxuICAvKipcbiAgICogZnVuY3Rpb24gdG8gaGFuZGxlICRlbGVtZW50cyBwb3N0ZXF1YWxpemVkLnpmLmVxdWFsaXplciwgd2l0aCBib3VuZCB0aGlzIG9uIF9iaW5kSGFuZGxlci5vblBvc3RFcXVhbGl6ZWRCb3VuZFxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX29uUG9zdEVxdWFsaXplZChlKSB7XG4gICAgaWYoZS50YXJnZXQgIT09IHRoaXMuJGVsZW1lbnRbMF0peyB0aGlzLl9yZWZsb3coKTsgfVxuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIGV2ZW50cyBmb3IgRXF1YWxpemVyLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2V2ZW50cygpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIHRoaXMuX3BhdXNlRXZlbnRzKCk7XG4gICAgaWYodGhpcy5oYXNOZXN0ZWQpe1xuICAgICAgdGhpcy4kZWxlbWVudC5vbigncG9zdGVxdWFsaXplZC56Zi5lcXVhbGl6ZXInLCB0aGlzLl9iaW5kSGFuZGxlci5vblBvc3RFcXVhbGl6ZWRCb3VuZCk7XG4gICAgfWVsc2V7XG4gICAgICB0aGlzLiRlbGVtZW50Lm9uKCdyZXNpemVtZS56Zi50cmlnZ2VyJywgdGhpcy5fYmluZEhhbmRsZXIub25SZXNpemVNZUJvdW5kKTtcblx0ICB0aGlzLiRlbGVtZW50Lm9uKCdtdXRhdGVtZS56Zi50cmlnZ2VyJywgdGhpcy5fYmluZEhhbmRsZXIub25SZXNpemVNZUJvdW5kKTtcbiAgICB9XG4gICAgdGhpcy5pc09uID0gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgdGhlIGN1cnJlbnQgYnJlYWtwb2ludCB0byB0aGUgbWluaW11bSByZXF1aXJlZCBzaXplLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2NoZWNrTVEoKSB7XG4gICAgdmFyIHRvb1NtYWxsID0gIUZvdW5kYXRpb24uTWVkaWFRdWVyeS5pcyh0aGlzLm9wdGlvbnMuZXF1YWxpemVPbik7XG4gICAgaWYodG9vU21hbGwpe1xuICAgICAgaWYodGhpcy5pc09uKXtcbiAgICAgICAgdGhpcy5fcGF1c2VFdmVudHMoKTtcbiAgICAgICAgdGhpcy4kd2F0Y2hlZC5jc3MoJ2hlaWdodCcsICdhdXRvJyk7XG4gICAgICB9XG4gICAgfWVsc2V7XG4gICAgICBpZighdGhpcy5pc09uKXtcbiAgICAgICAgdGhpcy5fZXZlbnRzKCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0b29TbWFsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIG5vb3AgdmVyc2lvbiBmb3IgdGhlIHBsdWdpblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2tpbGxzd2l0Y2goKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGxzIG5lY2Vzc2FyeSBmdW5jdGlvbnMgdG8gdXBkYXRlIEVxdWFsaXplciB1cG9uIERPTSBjaGFuZ2VcbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9yZWZsb3coKSB7XG4gICAgaWYoIXRoaXMub3B0aW9ucy5lcXVhbGl6ZU9uU3RhY2spe1xuICAgICAgaWYodGhpcy5faXNTdGFja2VkKCkpe1xuICAgICAgICB0aGlzLiR3YXRjaGVkLmNzcygnaGVpZ2h0JywgJ2F1dG8nKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAodGhpcy5vcHRpb25zLmVxdWFsaXplQnlSb3cpIHtcbiAgICAgIHRoaXMuZ2V0SGVpZ2h0c0J5Um93KHRoaXMuYXBwbHlIZWlnaHRCeVJvdy5iaW5kKHRoaXMpKTtcbiAgICB9ZWxzZXtcbiAgICAgIHRoaXMuZ2V0SGVpZ2h0cyh0aGlzLmFwcGx5SGVpZ2h0LmJpbmQodGhpcykpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBNYW51YWxseSBkZXRlcm1pbmVzIGlmIHRoZSBmaXJzdCAyIGVsZW1lbnRzIGFyZSAqTk9UKiBzdGFja2VkLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2lzU3RhY2tlZCgpIHtcbiAgICBpZiAoIXRoaXMuJHdhdGNoZWRbMF0gfHwgIXRoaXMuJHdhdGNoZWRbMV0pIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy4kd2F0Y2hlZFswXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3AgIT09IHRoaXMuJHdhdGNoZWRbMV0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wO1xuICB9XG5cbiAgLyoqXG4gICAqIEZpbmRzIHRoZSBvdXRlciBoZWlnaHRzIG9mIGNoaWxkcmVuIGNvbnRhaW5lZCB3aXRoaW4gYW4gRXF1YWxpemVyIHBhcmVudCBhbmQgcmV0dXJucyB0aGVtIGluIGFuIGFycmF5XG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNiIC0gQSBub24tb3B0aW9uYWwgY2FsbGJhY2sgdG8gcmV0dXJuIHRoZSBoZWlnaHRzIGFycmF5IHRvLlxuICAgKiBAcmV0dXJucyB7QXJyYXl9IGhlaWdodHMgLSBBbiBhcnJheSBvZiBoZWlnaHRzIG9mIGNoaWxkcmVuIHdpdGhpbiBFcXVhbGl6ZXIgY29udGFpbmVyXG4gICAqL1xuICBnZXRIZWlnaHRzKGNiKSB7XG4gICAgdmFyIGhlaWdodHMgPSBbXTtcbiAgICBmb3IodmFyIGkgPSAwLCBsZW4gPSB0aGlzLiR3YXRjaGVkLmxlbmd0aDsgaSA8IGxlbjsgaSsrKXtcbiAgICAgIHRoaXMuJHdhdGNoZWRbaV0uc3R5bGUuaGVpZ2h0ID0gJ2F1dG8nO1xuICAgICAgaGVpZ2h0cy5wdXNoKHRoaXMuJHdhdGNoZWRbaV0ub2Zmc2V0SGVpZ2h0KTtcbiAgICB9XG4gICAgY2IoaGVpZ2h0cyk7XG4gIH1cblxuICAvKipcbiAgICogRmluZHMgdGhlIG91dGVyIGhlaWdodHMgb2YgY2hpbGRyZW4gY29udGFpbmVkIHdpdGhpbiBhbiBFcXVhbGl6ZXIgcGFyZW50IGFuZCByZXR1cm5zIHRoZW0gaW4gYW4gYXJyYXlcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgLSBBIG5vbi1vcHRpb25hbCBjYWxsYmFjayB0byByZXR1cm4gdGhlIGhlaWdodHMgYXJyYXkgdG8uXG4gICAqIEByZXR1cm5zIHtBcnJheX0gZ3JvdXBzIC0gQW4gYXJyYXkgb2YgaGVpZ2h0cyBvZiBjaGlsZHJlbiB3aXRoaW4gRXF1YWxpemVyIGNvbnRhaW5lciBncm91cGVkIGJ5IHJvdyB3aXRoIGVsZW1lbnQsaGVpZ2h0IGFuZCBtYXggYXMgbGFzdCBjaGlsZFxuICAgKi9cbiAgZ2V0SGVpZ2h0c0J5Um93KGNiKSB7XG4gICAgdmFyIGxhc3RFbFRvcE9mZnNldCA9ICh0aGlzLiR3YXRjaGVkLmxlbmd0aCA/IHRoaXMuJHdhdGNoZWQuZmlyc3QoKS5vZmZzZXQoKS50b3AgOiAwKSxcbiAgICAgICAgZ3JvdXBzID0gW10sXG4gICAgICAgIGdyb3VwID0gMDtcbiAgICAvL2dyb3VwIGJ5IFJvd1xuICAgIGdyb3Vwc1tncm91cF0gPSBbXTtcbiAgICBmb3IodmFyIGkgPSAwLCBsZW4gPSB0aGlzLiR3YXRjaGVkLmxlbmd0aDsgaSA8IGxlbjsgaSsrKXtcbiAgICAgIHRoaXMuJHdhdGNoZWRbaV0uc3R5bGUuaGVpZ2h0ID0gJ2F1dG8nO1xuICAgICAgLy9tYXliZSBjb3VsZCB1c2UgdGhpcy4kd2F0Y2hlZFtpXS5vZmZzZXRUb3BcbiAgICAgIHZhciBlbE9mZnNldFRvcCA9ICQodGhpcy4kd2F0Y2hlZFtpXSkub2Zmc2V0KCkudG9wO1xuICAgICAgaWYgKGVsT2Zmc2V0VG9wIT1sYXN0RWxUb3BPZmZzZXQpIHtcbiAgICAgICAgZ3JvdXArKztcbiAgICAgICAgZ3JvdXBzW2dyb3VwXSA9IFtdO1xuICAgICAgICBsYXN0RWxUb3BPZmZzZXQ9ZWxPZmZzZXRUb3A7XG4gICAgICB9XG4gICAgICBncm91cHNbZ3JvdXBdLnB1c2goW3RoaXMuJHdhdGNoZWRbaV0sdGhpcy4kd2F0Y2hlZFtpXS5vZmZzZXRIZWlnaHRdKTtcbiAgICB9XG5cbiAgICBmb3IgKHZhciBqID0gMCwgbG4gPSBncm91cHMubGVuZ3RoOyBqIDwgbG47IGorKykge1xuICAgICAgdmFyIGhlaWdodHMgPSAkKGdyb3Vwc1tqXSkubWFwKGZ1bmN0aW9uKCl7IHJldHVybiB0aGlzWzFdOyB9KS5nZXQoKTtcbiAgICAgIHZhciBtYXggICAgICAgICA9IE1hdGgubWF4LmFwcGx5KG51bGwsIGhlaWdodHMpO1xuICAgICAgZ3JvdXBzW2pdLnB1c2gobWF4KTtcbiAgICB9XG4gICAgY2IoZ3JvdXBzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGFuZ2VzIHRoZSBDU1MgaGVpZ2h0IHByb3BlcnR5IG9mIGVhY2ggY2hpbGQgaW4gYW4gRXF1YWxpemVyIHBhcmVudCB0byBtYXRjaCB0aGUgdGFsbGVzdFxuICAgKiBAcGFyYW0ge2FycmF5fSBoZWlnaHRzIC0gQW4gYXJyYXkgb2YgaGVpZ2h0cyBvZiBjaGlsZHJlbiB3aXRoaW4gRXF1YWxpemVyIGNvbnRhaW5lclxuICAgKiBAZmlyZXMgRXF1YWxpemVyI3ByZWVxdWFsaXplZFxuICAgKiBAZmlyZXMgRXF1YWxpemVyI3Bvc3RlcXVhbGl6ZWRcbiAgICovXG4gIGFwcGx5SGVpZ2h0KGhlaWdodHMpIHtcbiAgICB2YXIgbWF4ID0gTWF0aC5tYXguYXBwbHkobnVsbCwgaGVpZ2h0cyk7XG4gICAgLyoqXG4gICAgICogRmlyZXMgYmVmb3JlIHRoZSBoZWlnaHRzIGFyZSBhcHBsaWVkXG4gICAgICogQGV2ZW50IEVxdWFsaXplciNwcmVlcXVhbGl6ZWRcbiAgICAgKi9cbiAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ3ByZWVxdWFsaXplZC56Zi5lcXVhbGl6ZXInKTtcblxuICAgIHRoaXMuJHdhdGNoZWQuY3NzKCdoZWlnaHQnLCBtYXgpO1xuXG4gICAgLyoqXG4gICAgICogRmlyZXMgd2hlbiB0aGUgaGVpZ2h0cyBoYXZlIGJlZW4gYXBwbGllZFxuICAgICAqIEBldmVudCBFcXVhbGl6ZXIjcG9zdGVxdWFsaXplZFxuICAgICAqL1xuICAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ3Bvc3RlcXVhbGl6ZWQuemYuZXF1YWxpemVyJyk7XG4gIH1cblxuICAvKipcbiAgICogQ2hhbmdlcyB0aGUgQ1NTIGhlaWdodCBwcm9wZXJ0eSBvZiBlYWNoIGNoaWxkIGluIGFuIEVxdWFsaXplciBwYXJlbnQgdG8gbWF0Y2ggdGhlIHRhbGxlc3QgYnkgcm93XG4gICAqIEBwYXJhbSB7YXJyYXl9IGdyb3VwcyAtIEFuIGFycmF5IG9mIGhlaWdodHMgb2YgY2hpbGRyZW4gd2l0aGluIEVxdWFsaXplciBjb250YWluZXIgZ3JvdXBlZCBieSByb3cgd2l0aCBlbGVtZW50LGhlaWdodCBhbmQgbWF4IGFzIGxhc3QgY2hpbGRcbiAgICogQGZpcmVzIEVxdWFsaXplciNwcmVlcXVhbGl6ZWRcbiAgICogQGZpcmVzIEVxdWFsaXplciNwcmVlcXVhbGl6ZWRyb3dcbiAgICogQGZpcmVzIEVxdWFsaXplciNwb3N0ZXF1YWxpemVkcm93XG4gICAqIEBmaXJlcyBFcXVhbGl6ZXIjcG9zdGVxdWFsaXplZFxuICAgKi9cbiAgYXBwbHlIZWlnaHRCeVJvdyhncm91cHMpIHtcbiAgICAvKipcbiAgICAgKiBGaXJlcyBiZWZvcmUgdGhlIGhlaWdodHMgYXJlIGFwcGxpZWRcbiAgICAgKi9cbiAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ3ByZWVxdWFsaXplZC56Zi5lcXVhbGl6ZXInKTtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gZ3JvdXBzLmxlbmd0aDsgaSA8IGxlbiA7IGkrKykge1xuICAgICAgdmFyIGdyb3Vwc0lMZW5ndGggPSBncm91cHNbaV0ubGVuZ3RoLFxuICAgICAgICAgIG1heCA9IGdyb3Vwc1tpXVtncm91cHNJTGVuZ3RoIC0gMV07XG4gICAgICBpZiAoZ3JvdXBzSUxlbmd0aDw9Mikge1xuICAgICAgICAkKGdyb3Vwc1tpXVswXVswXSkuY3NzKHsnaGVpZ2h0JzonYXV0byd9KTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICAvKipcbiAgICAgICAgKiBGaXJlcyBiZWZvcmUgdGhlIGhlaWdodHMgcGVyIHJvdyBhcmUgYXBwbGllZFxuICAgICAgICAqIEBldmVudCBFcXVhbGl6ZXIjcHJlZXF1YWxpemVkcm93XG4gICAgICAgICovXG4gICAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ3ByZWVxdWFsaXplZHJvdy56Zi5lcXVhbGl6ZXInKTtcbiAgICAgIGZvciAodmFyIGogPSAwLCBsZW5KID0gKGdyb3Vwc0lMZW5ndGgtMSk7IGogPCBsZW5KIDsgaisrKSB7XG4gICAgICAgICQoZ3JvdXBzW2ldW2pdWzBdKS5jc3MoeydoZWlnaHQnOm1heH0pO1xuICAgICAgfVxuICAgICAgLyoqXG4gICAgICAgICogRmlyZXMgd2hlbiB0aGUgaGVpZ2h0cyBwZXIgcm93IGhhdmUgYmVlbiBhcHBsaWVkXG4gICAgICAgICogQGV2ZW50IEVxdWFsaXplciNwb3N0ZXF1YWxpemVkcm93XG4gICAgICAgICovXG4gICAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ3Bvc3RlcXVhbGl6ZWRyb3cuemYuZXF1YWxpemVyJyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEZpcmVzIHdoZW4gdGhlIGhlaWdodHMgaGF2ZSBiZWVuIGFwcGxpZWRcbiAgICAgKi9cbiAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdwb3N0ZXF1YWxpemVkLnpmLmVxdWFsaXplcicpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIGFuIGluc3RhbmNlIG9mIEVxdWFsaXplci5cbiAgICogQGZ1bmN0aW9uXG4gICAqL1xuICBkZXN0cm95KCkge1xuICAgIHRoaXMuX3BhdXNlRXZlbnRzKCk7XG4gICAgdGhpcy4kd2F0Y2hlZC5jc3MoJ2hlaWdodCcsICdhdXRvJyk7XG5cbiAgICBGb3VuZGF0aW9uLnVucmVnaXN0ZXJQbHVnaW4odGhpcyk7XG4gIH1cbn1cblxuLyoqXG4gKiBEZWZhdWx0IHNldHRpbmdzIGZvciBwbHVnaW5cbiAqL1xuRXF1YWxpemVyLmRlZmF1bHRzID0ge1xuICAvKipcbiAgICogRW5hYmxlIGhlaWdodCBlcXVhbGl6YXRpb24gd2hlbiBzdGFja2VkIG9uIHNtYWxsZXIgc2NyZWVucy5cbiAgICogQG9wdGlvblxuICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICogQGRlZmF1bHQgZmFsc2VcbiAgICovXG4gIGVxdWFsaXplT25TdGFjazogZmFsc2UsXG4gIC8qKlxuICAgKiBFbmFibGUgaGVpZ2h0IGVxdWFsaXphdGlvbiByb3cgYnkgcm93LlxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHtib29sZWFufVxuICAgKiBAZGVmYXVsdCBmYWxzZVxuICAgKi9cbiAgZXF1YWxpemVCeVJvdzogZmFsc2UsXG4gIC8qKlxuICAgKiBTdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBtaW5pbXVtIGJyZWFrcG9pbnQgc2l6ZSB0aGUgcGx1Z2luIHNob3VsZCBlcXVhbGl6ZSBoZWlnaHRzIG9uLlxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHtzdHJpbmd9XG4gICAqIEBkZWZhdWx0ICcnXG4gICAqL1xuICBlcXVhbGl6ZU9uOiAnJ1xufTtcblxuLy8gV2luZG93IGV4cG9ydHNcbkZvdW5kYXRpb24ucGx1Z2luKEVxdWFsaXplciwgJ0VxdWFsaXplcicpO1xuXG59KGpRdWVyeSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbi8qKlxuICogSW50ZXJjaGFuZ2UgbW9kdWxlLlxuICogQG1vZHVsZSBmb3VuZGF0aW9uLmludGVyY2hhbmdlXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLm1lZGlhUXVlcnlcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwudGltZXJBbmRJbWFnZUxvYWRlclxuICovXG5cbmNsYXNzIEludGVyY2hhbmdlIHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgSW50ZXJjaGFuZ2UuXG4gICAqIEBjbGFzc1xuICAgKiBAZmlyZXMgSW50ZXJjaGFuZ2UjaW5pdFxuICAgKiBAcGFyYW0ge09iamVjdH0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gYWRkIHRoZSB0cmlnZ2VyIHRvLlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE92ZXJyaWRlcyB0byB0aGUgZGVmYXVsdCBwbHVnaW4gc2V0dGluZ3MuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy4kZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoe30sIEludGVyY2hhbmdlLmRlZmF1bHRzLCBvcHRpb25zKTtcbiAgICB0aGlzLnJ1bGVzID0gW107XG4gICAgdGhpcy5jdXJyZW50UGF0aCA9ICcnO1xuXG4gICAgdGhpcy5faW5pdCgpO1xuICAgIHRoaXMuX2V2ZW50cygpO1xuXG4gICAgRm91bmRhdGlvbi5yZWdpc3RlclBsdWdpbih0aGlzLCAnSW50ZXJjaGFuZ2UnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyB0aGUgSW50ZXJjaGFuZ2UgcGx1Z2luIGFuZCBjYWxscyBmdW5jdGlvbnMgdG8gZ2V0IGludGVyY2hhbmdlIGZ1bmN0aW9uaW5nIG9uIGxvYWQuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2luaXQoKSB7XG4gICAgdGhpcy5fYWRkQnJlYWtwb2ludHMoKTtcbiAgICB0aGlzLl9nZW5lcmF0ZVJ1bGVzKCk7XG4gICAgdGhpcy5fcmVmbG93KCk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgZXZlbnRzIGZvciBJbnRlcmNoYW5nZS5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfZXZlbnRzKCkge1xuICAgICQod2luZG93KS5vbigncmVzaXplLnpmLmludGVyY2hhbmdlJywgRm91bmRhdGlvbi51dGlsLnRocm90dGxlKCgpID0+IHtcbiAgICAgIHRoaXMuX3JlZmxvdygpO1xuICAgIH0sIDUwKSk7XG4gIH1cblxuICAvKipcbiAgICogQ2FsbHMgbmVjZXNzYXJ5IGZ1bmN0aW9ucyB0byB1cGRhdGUgSW50ZXJjaGFuZ2UgdXBvbiBET00gY2hhbmdlXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX3JlZmxvdygpIHtcbiAgICB2YXIgbWF0Y2g7XG5cbiAgICAvLyBJdGVyYXRlIHRocm91Z2ggZWFjaCBydWxlLCBidXQgb25seSBzYXZlIHRoZSBsYXN0IG1hdGNoXG4gICAgZm9yICh2YXIgaSBpbiB0aGlzLnJ1bGVzKSB7XG4gICAgICBpZih0aGlzLnJ1bGVzLmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgIHZhciBydWxlID0gdGhpcy5ydWxlc1tpXTtcbiAgICAgICAgaWYgKHdpbmRvdy5tYXRjaE1lZGlhKHJ1bGUucXVlcnkpLm1hdGNoZXMpIHtcbiAgICAgICAgICBtYXRjaCA9IHJ1bGU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAobWF0Y2gpIHtcbiAgICAgIHRoaXMucmVwbGFjZShtYXRjaC5wYXRoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgRm91bmRhdGlvbiBicmVha3BvaW50cyBhbmQgYWRkcyB0aGVtIHRvIHRoZSBJbnRlcmNoYW5nZS5TUEVDSUFMX1FVRVJJRVMgb2JqZWN0LlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9hZGRCcmVha3BvaW50cygpIHtcbiAgICBmb3IgKHZhciBpIGluIEZvdW5kYXRpb24uTWVkaWFRdWVyeS5xdWVyaWVzKSB7XG4gICAgICBpZiAoRm91bmRhdGlvbi5NZWRpYVF1ZXJ5LnF1ZXJpZXMuaGFzT3duUHJvcGVydHkoaSkpIHtcbiAgICAgICAgdmFyIHF1ZXJ5ID0gRm91bmRhdGlvbi5NZWRpYVF1ZXJ5LnF1ZXJpZXNbaV07XG4gICAgICAgIEludGVyY2hhbmdlLlNQRUNJQUxfUVVFUklFU1txdWVyeS5uYW1lXSA9IHF1ZXJ5LnZhbHVlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgdGhlIEludGVyY2hhbmdlIGVsZW1lbnQgZm9yIHRoZSBwcm92aWRlZCBtZWRpYSBxdWVyeSArIGNvbnRlbnQgcGFpcmluZ3NcbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0aGF0IGlzIGFuIEludGVyY2hhbmdlIGluc3RhbmNlXG4gICAqIEByZXR1cm5zIHtBcnJheX0gc2NlbmFyaW9zIC0gQXJyYXkgb2Ygb2JqZWN0cyB0aGF0IGhhdmUgJ21xJyBhbmQgJ3BhdGgnIGtleXMgd2l0aCBjb3JyZXNwb25kaW5nIGtleXNcbiAgICovXG4gIF9nZW5lcmF0ZVJ1bGVzKGVsZW1lbnQpIHtcbiAgICB2YXIgcnVsZXNMaXN0ID0gW107XG4gICAgdmFyIHJ1bGVzO1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5ydWxlcykge1xuICAgICAgcnVsZXMgPSB0aGlzLm9wdGlvbnMucnVsZXM7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcnVsZXMgPSB0aGlzLiRlbGVtZW50LmRhdGEoJ2ludGVyY2hhbmdlJyk7XG4gICAgfVxuICAgIFxuICAgIHJ1bGVzID0gIHR5cGVvZiBydWxlcyA9PT0gJ3N0cmluZycgPyBydWxlcy5tYXRjaCgvXFxbLio/XFxdL2cpIDogcnVsZXM7XG5cbiAgICBmb3IgKHZhciBpIGluIHJ1bGVzKSB7XG4gICAgICBpZihydWxlcy5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgICB2YXIgcnVsZSA9IHJ1bGVzW2ldLnNsaWNlKDEsIC0xKS5zcGxpdCgnLCAnKTtcbiAgICAgICAgdmFyIHBhdGggPSBydWxlLnNsaWNlKDAsIC0xKS5qb2luKCcnKTtcbiAgICAgICAgdmFyIHF1ZXJ5ID0gcnVsZVtydWxlLmxlbmd0aCAtIDFdO1xuXG4gICAgICAgIGlmIChJbnRlcmNoYW5nZS5TUEVDSUFMX1FVRVJJRVNbcXVlcnldKSB7XG4gICAgICAgICAgcXVlcnkgPSBJbnRlcmNoYW5nZS5TUEVDSUFMX1FVRVJJRVNbcXVlcnldO1xuICAgICAgICB9XG5cbiAgICAgICAgcnVsZXNMaXN0LnB1c2goe1xuICAgICAgICAgIHBhdGg6IHBhdGgsXG4gICAgICAgICAgcXVlcnk6IHF1ZXJ5XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMucnVsZXMgPSBydWxlc0xpc3Q7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIHRoZSBgc3JjYCBwcm9wZXJ0eSBvZiBhbiBpbWFnZSwgb3IgY2hhbmdlIHRoZSBIVE1MIG9mIGEgY29udGFpbmVyLCB0byB0aGUgc3BlY2lmaWVkIHBhdGguXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGF0aCAtIFBhdGggdG8gdGhlIGltYWdlIG9yIEhUTUwgcGFydGlhbC5cbiAgICogQGZpcmVzIEludGVyY2hhbmdlI3JlcGxhY2VkXG4gICAqL1xuICByZXBsYWNlKHBhdGgpIHtcbiAgICBpZiAodGhpcy5jdXJyZW50UGF0aCA9PT0gcGF0aCkgcmV0dXJuO1xuXG4gICAgdmFyIF90aGlzID0gdGhpcyxcbiAgICAgICAgdHJpZ2dlciA9ICdyZXBsYWNlZC56Zi5pbnRlcmNoYW5nZSc7XG5cbiAgICAvLyBSZXBsYWNpbmcgaW1hZ2VzXG4gICAgaWYgKHRoaXMuJGVsZW1lbnRbMF0ubm9kZU5hbWUgPT09ICdJTUcnKSB7XG4gICAgICB0aGlzLiRlbGVtZW50LmF0dHIoJ3NyYycsIHBhdGgpLm9uKCdsb2FkJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIF90aGlzLmN1cnJlbnRQYXRoID0gcGF0aDtcbiAgICAgIH0pXG4gICAgICAudHJpZ2dlcih0cmlnZ2VyKTtcbiAgICB9XG4gICAgLy8gUmVwbGFjaW5nIGJhY2tncm91bmQgaW1hZ2VzXG4gICAgZWxzZSBpZiAocGF0aC5tYXRjaCgvXFwuKGdpZnxqcGd8anBlZ3xwbmd8c3ZnfHRpZmYpKFs/I10uKik/L2kpKSB7XG4gICAgICB0aGlzLiRlbGVtZW50LmNzcyh7ICdiYWNrZ3JvdW5kLWltYWdlJzogJ3VybCgnK3BhdGgrJyknIH0pXG4gICAgICAgICAgLnRyaWdnZXIodHJpZ2dlcik7XG4gICAgfVxuICAgIC8vIFJlcGxhY2luZyBIVE1MXG4gICAgZWxzZSB7XG4gICAgICAkLmdldChwYXRoLCBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICBfdGhpcy4kZWxlbWVudC5odG1sKHJlc3BvbnNlKVxuICAgICAgICAgICAgIC50cmlnZ2VyKHRyaWdnZXIpO1xuICAgICAgICAkKHJlc3BvbnNlKS5mb3VuZGF0aW9uKCk7XG4gICAgICAgIF90aGlzLmN1cnJlbnRQYXRoID0gcGF0aDtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEZpcmVzIHdoZW4gY29udGVudCBpbiBhbiBJbnRlcmNoYW5nZSBlbGVtZW50IGlzIGRvbmUgYmVpbmcgbG9hZGVkLlxuICAgICAqIEBldmVudCBJbnRlcmNoYW5nZSNyZXBsYWNlZFxuICAgICAqL1xuICAgIC8vIHRoaXMuJGVsZW1lbnQudHJpZ2dlcigncmVwbGFjZWQuemYuaW50ZXJjaGFuZ2UnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXN0cm95cyBhbiBpbnN0YW5jZSBvZiBpbnRlcmNoYW5nZS5cbiAgICogQGZ1bmN0aW9uXG4gICAqL1xuICBkZXN0cm95KCkge1xuICAgIC8vVE9ETyB0aGlzLlxuICB9XG59XG5cbi8qKlxuICogRGVmYXVsdCBzZXR0aW5ncyBmb3IgcGx1Z2luXG4gKi9cbkludGVyY2hhbmdlLmRlZmF1bHRzID0ge1xuICAvKipcbiAgICogUnVsZXMgdG8gYmUgYXBwbGllZCB0byBJbnRlcmNoYW5nZSBlbGVtZW50cy4gU2V0IHdpdGggdGhlIGBkYXRhLWludGVyY2hhbmdlYCBhcnJheSBub3RhdGlvbi5cbiAgICogQG9wdGlvblxuICAgKiBAdHlwZSB7P2FycmF5fVxuICAgKiBAZGVmYXVsdCBudWxsXG4gICAqL1xuICBydWxlczogbnVsbFxufTtcblxuSW50ZXJjaGFuZ2UuU1BFQ0lBTF9RVUVSSUVTID0ge1xuICAnbGFuZHNjYXBlJzogJ3NjcmVlbiBhbmQgKG9yaWVudGF0aW9uOiBsYW5kc2NhcGUpJyxcbiAgJ3BvcnRyYWl0JzogJ3NjcmVlbiBhbmQgKG9yaWVudGF0aW9uOiBwb3J0cmFpdCknLFxuICAncmV0aW5hJzogJ29ubHkgc2NyZWVuIGFuZCAoLXdlYmtpdC1taW4tZGV2aWNlLXBpeGVsLXJhdGlvOiAyKSwgb25seSBzY3JlZW4gYW5kIChtaW4tLW1vei1kZXZpY2UtcGl4ZWwtcmF0aW86IDIpLCBvbmx5IHNjcmVlbiBhbmQgKC1vLW1pbi1kZXZpY2UtcGl4ZWwtcmF0aW86IDIvMSksIG9ubHkgc2NyZWVuIGFuZCAobWluLWRldmljZS1waXhlbC1yYXRpbzogMiksIG9ubHkgc2NyZWVuIGFuZCAobWluLXJlc29sdXRpb246IDE5MmRwaSksIG9ubHkgc2NyZWVuIGFuZCAobWluLXJlc29sdXRpb246IDJkcHB4KSdcbn07XG5cbi8vIFdpbmRvdyBleHBvcnRzXG5Gb3VuZGF0aW9uLnBsdWdpbihJbnRlcmNoYW5nZSwgJ0ludGVyY2hhbmdlJyk7XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuLyoqXG4gKiBNYWdlbGxhbiBtb2R1bGUuXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24ubWFnZWxsYW5cbiAqL1xuXG5jbGFzcyBNYWdlbGxhbiB7XG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIE1hZ2VsbGFuLlxuICAgKiBAY2xhc3NcbiAgICogQGZpcmVzIE1hZ2VsbGFuI2luaXRcbiAgICogQHBhcmFtIHtPYmplY3R9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIGFkZCB0aGUgdHJpZ2dlciB0by5cbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBPdmVycmlkZXMgdG8gdGhlIGRlZmF1bHQgcGx1Z2luIHNldHRpbmdzLlxuICAgKi9cbiAgY29uc3RydWN0b3IoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIHRoaXMuJGVsZW1lbnQgPSBlbGVtZW50O1xuICAgIHRoaXMub3B0aW9ucyAgPSAkLmV4dGVuZCh7fSwgTWFnZWxsYW4uZGVmYXVsdHMsIHRoaXMuJGVsZW1lbnQuZGF0YSgpLCBvcHRpb25zKTtcblxuICAgIHRoaXMuX2luaXQoKTtcbiAgICB0aGlzLmNhbGNQb2ludHMoKTtcblxuICAgIEZvdW5kYXRpb24ucmVnaXN0ZXJQbHVnaW4odGhpcywgJ01hZ2VsbGFuJyk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgdGhlIE1hZ2VsbGFuIHBsdWdpbiBhbmQgY2FsbHMgZnVuY3Rpb25zIHRvIGdldCBlcXVhbGl6ZXIgZnVuY3Rpb25pbmcgb24gbG9hZC5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9pbml0KCkge1xuICAgIHZhciBpZCA9IHRoaXMuJGVsZW1lbnRbMF0uaWQgfHwgRm91bmRhdGlvbi5HZXRZb0RpZ2l0cyg2LCAnbWFnZWxsYW4nKTtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIHRoaXMuJHRhcmdldHMgPSAkKCdbZGF0YS1tYWdlbGxhbi10YXJnZXRdJyk7XG4gICAgdGhpcy4kbGlua3MgPSB0aGlzLiRlbGVtZW50LmZpbmQoJ2EnKTtcbiAgICB0aGlzLiRlbGVtZW50LmF0dHIoe1xuICAgICAgJ2RhdGEtcmVzaXplJzogaWQsXG4gICAgICAnZGF0YS1zY3JvbGwnOiBpZCxcbiAgICAgICdpZCc6IGlkXG4gICAgfSk7XG4gICAgdGhpcy4kYWN0aXZlID0gJCgpO1xuICAgIHRoaXMuc2Nyb2xsUG9zID0gcGFyc2VJbnQod2luZG93LnBhZ2VZT2Zmc2V0LCAxMCk7XG5cbiAgICB0aGlzLl9ldmVudHMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxjdWxhdGVzIGFuIGFycmF5IG9mIHBpeGVsIHZhbHVlcyB0aGF0IGFyZSB0aGUgZGVtYXJjYXRpb24gbGluZXMgYmV0d2VlbiBsb2NhdGlvbnMgb24gdGhlIHBhZ2UuXG4gICAqIENhbiBiZSBpbnZva2VkIGlmIG5ldyBlbGVtZW50cyBhcmUgYWRkZWQgb3IgdGhlIHNpemUgb2YgYSBsb2NhdGlvbiBjaGFuZ2VzLlxuICAgKiBAZnVuY3Rpb25cbiAgICovXG4gIGNhbGNQb2ludHMoKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcyxcbiAgICAgICAgYm9keSA9IGRvY3VtZW50LmJvZHksXG4gICAgICAgIGh0bWwgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG5cbiAgICB0aGlzLnBvaW50cyA9IFtdO1xuICAgIHRoaXMud2luSGVpZ2h0ID0gTWF0aC5yb3VuZChNYXRoLm1heCh3aW5kb3cuaW5uZXJIZWlnaHQsIGh0bWwuY2xpZW50SGVpZ2h0KSk7XG4gICAgdGhpcy5kb2NIZWlnaHQgPSBNYXRoLnJvdW5kKE1hdGgubWF4KGJvZHkuc2Nyb2xsSGVpZ2h0LCBib2R5Lm9mZnNldEhlaWdodCwgaHRtbC5jbGllbnRIZWlnaHQsIGh0bWwuc2Nyb2xsSGVpZ2h0LCBodG1sLm9mZnNldEhlaWdodCkpO1xuXG4gICAgdGhpcy4kdGFyZ2V0cy5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgICB2YXIgJHRhciA9ICQodGhpcyksXG4gICAgICAgICAgcHQgPSBNYXRoLnJvdW5kKCR0YXIub2Zmc2V0KCkudG9wIC0gX3RoaXMub3B0aW9ucy50aHJlc2hvbGQpO1xuICAgICAgJHRhci50YXJnZXRQb2ludCA9IHB0O1xuICAgICAgX3RoaXMucG9pbnRzLnB1c2gocHQpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIGV2ZW50cyBmb3IgTWFnZWxsYW4uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfZXZlbnRzKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXMsXG4gICAgICAgICRib2R5ID0gJCgnaHRtbCwgYm9keScpLFxuICAgICAgICBvcHRzID0ge1xuICAgICAgICAgIGR1cmF0aW9uOiBfdGhpcy5vcHRpb25zLmFuaW1hdGlvbkR1cmF0aW9uLFxuICAgICAgICAgIGVhc2luZzogICBfdGhpcy5vcHRpb25zLmFuaW1hdGlvbkVhc2luZ1xuICAgICAgICB9O1xuICAgICQod2luZG93KS5vbmUoJ2xvYWQnLCBmdW5jdGlvbigpe1xuICAgICAgaWYoX3RoaXMub3B0aW9ucy5kZWVwTGlua2luZyl7XG4gICAgICAgIGlmKGxvY2F0aW9uLmhhc2gpe1xuICAgICAgICAgIF90aGlzLnNjcm9sbFRvTG9jKGxvY2F0aW9uLmhhc2gpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBfdGhpcy5jYWxjUG9pbnRzKCk7XG4gICAgICBfdGhpcy5fdXBkYXRlQWN0aXZlKCk7XG4gICAgfSk7XG5cbiAgICB0aGlzLiRlbGVtZW50Lm9uKHtcbiAgICAgICdyZXNpemVtZS56Zi50cmlnZ2VyJzogdGhpcy5yZWZsb3cuYmluZCh0aGlzKSxcbiAgICAgICdzY3JvbGxtZS56Zi50cmlnZ2VyJzogdGhpcy5fdXBkYXRlQWN0aXZlLmJpbmQodGhpcylcbiAgICB9KS5vbignY2xpY2suemYubWFnZWxsYW4nLCAnYVtocmVmXj1cIiNcIl0nLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdmFyIGFycml2YWwgICA9IHRoaXMuZ2V0QXR0cmlidXRlKCdocmVmJyk7XG4gICAgICAgIF90aGlzLnNjcm9sbFRvTG9jKGFycml2YWwpO1xuICAgICAgfSk7XG4gICAgJCh3aW5kb3cpLm9uKCdwb3BzdGF0ZScsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIGlmKF90aGlzLm9wdGlvbnMuZGVlcExpbmtpbmcpIHtcbiAgICAgICAgX3RoaXMuc2Nyb2xsVG9Mb2Mod2luZG93LmxvY2F0aW9uLmhhc2gpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEZ1bmN0aW9uIHRvIHNjcm9sbCB0byBhIGdpdmVuIGxvY2F0aW9uIG9uIHRoZSBwYWdlLlxuICAgKiBAcGFyYW0ge1N0cmluZ30gbG9jIC0gYSBwcm9wZXJseSBmb3JtYXR0ZWQgalF1ZXJ5IGlkIHNlbGVjdG9yLiBFeGFtcGxlOiAnI2ZvbydcbiAgICogQGZ1bmN0aW9uXG4gICAqL1xuICBzY3JvbGxUb0xvYyhsb2MpIHtcbiAgICAvLyBEbyBub3RoaW5nIGlmIHRhcmdldCBkb2VzIG5vdCBleGlzdCB0byBwcmV2ZW50IGVycm9yc1xuICAgIGlmICghJChsb2MpLmxlbmd0aCkge3JldHVybiBmYWxzZTt9XG4gICAgdGhpcy5faW5UcmFuc2l0aW9uID0gdHJ1ZTtcbiAgICB2YXIgX3RoaXMgPSB0aGlzLFxuICAgICAgICBzY3JvbGxQb3MgPSBNYXRoLnJvdW5kKCQobG9jKS5vZmZzZXQoKS50b3AgLSB0aGlzLm9wdGlvbnMudGhyZXNob2xkIC8gMiAtIHRoaXMub3B0aW9ucy5iYXJPZmZzZXQpO1xuXG4gICAgJCgnaHRtbCwgYm9keScpLnN0b3AodHJ1ZSkuYW5pbWF0ZShcbiAgICAgIHsgc2Nyb2xsVG9wOiBzY3JvbGxQb3MgfSxcbiAgICAgIHRoaXMub3B0aW9ucy5hbmltYXRpb25EdXJhdGlvbixcbiAgICAgIHRoaXMub3B0aW9ucy5hbmltYXRpb25FYXNpbmcsXG4gICAgICBmdW5jdGlvbigpIHtfdGhpcy5faW5UcmFuc2l0aW9uID0gZmFsc2U7IF90aGlzLl91cGRhdGVBY3RpdmUoKX1cbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGxzIG5lY2Vzc2FyeSBmdW5jdGlvbnMgdG8gdXBkYXRlIE1hZ2VsbGFuIHVwb24gRE9NIGNoYW5nZVxuICAgKiBAZnVuY3Rpb25cbiAgICovXG4gIHJlZmxvdygpIHtcbiAgICB0aGlzLmNhbGNQb2ludHMoKTtcbiAgICB0aGlzLl91cGRhdGVBY3RpdmUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIHRoZSB2aXNpYmlsaXR5IG9mIGFuIGFjdGl2ZSBsb2NhdGlvbiBsaW5rLCBhbmQgdXBkYXRlcyB0aGUgdXJsIGhhc2ggZm9yIHRoZSBwYWdlLCBpZiBkZWVwTGlua2luZyBlbmFibGVkLlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAZnVuY3Rpb25cbiAgICogQGZpcmVzIE1hZ2VsbGFuI3VwZGF0ZVxuICAgKi9cbiAgX3VwZGF0ZUFjdGl2ZSgvKmV2dCwgZWxlbSwgc2Nyb2xsUG9zKi8pIHtcbiAgICBpZih0aGlzLl9pblRyYW5zaXRpb24pIHtyZXR1cm47fVxuICAgIHZhciB3aW5Qb3MgPSAvKnNjcm9sbFBvcyB8fCovIHBhcnNlSW50KHdpbmRvdy5wYWdlWU9mZnNldCwgMTApLFxuICAgICAgICBjdXJJZHg7XG5cbiAgICBpZih3aW5Qb3MgKyB0aGlzLndpbkhlaWdodCA9PT0gdGhpcy5kb2NIZWlnaHQpeyBjdXJJZHggPSB0aGlzLnBvaW50cy5sZW5ndGggLSAxOyB9XG4gICAgZWxzZSBpZih3aW5Qb3MgPCB0aGlzLnBvaW50c1swXSl7IGN1cklkeCA9IHVuZGVmaW5lZDsgfVxuICAgIGVsc2V7XG4gICAgICB2YXIgaXNEb3duID0gdGhpcy5zY3JvbGxQb3MgPCB3aW5Qb3MsXG4gICAgICAgICAgX3RoaXMgPSB0aGlzLFxuICAgICAgICAgIGN1clZpc2libGUgPSB0aGlzLnBvaW50cy5maWx0ZXIoZnVuY3Rpb24ocCwgaSl7XG4gICAgICAgICAgICByZXR1cm4gaXNEb3duID8gcCAtIF90aGlzLm9wdGlvbnMuYmFyT2Zmc2V0IDw9IHdpblBvcyA6IHAgLSBfdGhpcy5vcHRpb25zLmJhck9mZnNldCAtIF90aGlzLm9wdGlvbnMudGhyZXNob2xkIDw9IHdpblBvcztcbiAgICAgICAgICB9KTtcbiAgICAgIGN1cklkeCA9IGN1clZpc2libGUubGVuZ3RoID8gY3VyVmlzaWJsZS5sZW5ndGggLSAxIDogMDtcbiAgICB9XG5cbiAgICB0aGlzLiRhY3RpdmUucmVtb3ZlQ2xhc3ModGhpcy5vcHRpb25zLmFjdGl2ZUNsYXNzKTtcbiAgICB0aGlzLiRhY3RpdmUgPSB0aGlzLiRsaW5rcy5maWx0ZXIoJ1tocmVmPVwiIycgKyB0aGlzLiR0YXJnZXRzLmVxKGN1cklkeCkuZGF0YSgnbWFnZWxsYW4tdGFyZ2V0JykgKyAnXCJdJykuYWRkQ2xhc3ModGhpcy5vcHRpb25zLmFjdGl2ZUNsYXNzKTtcblxuICAgIGlmKHRoaXMub3B0aW9ucy5kZWVwTGlua2luZyl7XG4gICAgICB2YXIgaGFzaCA9IFwiXCI7XG4gICAgICBpZihjdXJJZHggIT0gdW5kZWZpbmVkKXtcbiAgICAgICAgaGFzaCA9IHRoaXMuJGFjdGl2ZVswXS5nZXRBdHRyaWJ1dGUoJ2hyZWYnKTtcbiAgICAgIH1cbiAgICAgIGlmKGhhc2ggIT09IHdpbmRvdy5sb2NhdGlvbi5oYXNoKSB7XG4gICAgICAgIGlmKHdpbmRvdy5oaXN0b3J5LnB1c2hTdGF0ZSl7XG4gICAgICAgICAgd2luZG93Lmhpc3RvcnkucHVzaFN0YXRlKG51bGwsIG51bGwsIGhhc2gpO1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICB3aW5kb3cubG9jYXRpb24uaGFzaCA9IGhhc2g7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnNjcm9sbFBvcyA9IHdpblBvcztcbiAgICAvKipcbiAgICAgKiBGaXJlcyB3aGVuIG1hZ2VsbGFuIGlzIGZpbmlzaGVkIHVwZGF0aW5nIHRvIHRoZSBuZXcgYWN0aXZlIGVsZW1lbnQuXG4gICAgICogQGV2ZW50IE1hZ2VsbGFuI3VwZGF0ZVxuICAgICAqL1xuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcigndXBkYXRlLnpmLm1hZ2VsbGFuJywgW3RoaXMuJGFjdGl2ZV0pO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIGFuIGluc3RhbmNlIG9mIE1hZ2VsbGFuIGFuZCByZXNldHMgdGhlIHVybCBvZiB0aGUgd2luZG93LlxuICAgKiBAZnVuY3Rpb25cbiAgICovXG4gIGRlc3Ryb3koKSB7XG4gICAgdGhpcy4kZWxlbWVudC5vZmYoJy56Zi50cmlnZ2VyIC56Zi5tYWdlbGxhbicpXG4gICAgICAgIC5maW5kKGAuJHt0aGlzLm9wdGlvbnMuYWN0aXZlQ2xhc3N9YCkucmVtb3ZlQ2xhc3ModGhpcy5vcHRpb25zLmFjdGl2ZUNsYXNzKTtcblxuICAgIGlmKHRoaXMub3B0aW9ucy5kZWVwTGlua2luZyl7XG4gICAgICB2YXIgaGFzaCA9IHRoaXMuJGFjdGl2ZVswXS5nZXRBdHRyaWJ1dGUoJ2hyZWYnKTtcbiAgICAgIHdpbmRvdy5sb2NhdGlvbi5oYXNoLnJlcGxhY2UoaGFzaCwgJycpO1xuICAgIH1cblxuICAgIEZvdW5kYXRpb24udW5yZWdpc3RlclBsdWdpbih0aGlzKTtcbiAgfVxufVxuXG4vKipcbiAqIERlZmF1bHQgc2V0dGluZ3MgZm9yIHBsdWdpblxuICovXG5NYWdlbGxhbi5kZWZhdWx0cyA9IHtcbiAgLyoqXG4gICAqIEFtb3VudCBvZiB0aW1lLCBpbiBtcywgdGhlIGFuaW1hdGVkIHNjcm9sbGluZyBzaG91bGQgdGFrZSBiZXR3ZWVuIGxvY2F0aW9ucy5cbiAgICogQG9wdGlvblxuICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgKiBAZGVmYXVsdCA1MDBcbiAgICovXG4gIGFuaW1hdGlvbkR1cmF0aW9uOiA1MDAsXG4gIC8qKlxuICAgKiBBbmltYXRpb24gc3R5bGUgdG8gdXNlIHdoZW4gc2Nyb2xsaW5nIGJldHdlZW4gbG9jYXRpb25zLiBDYW4gYmUgYCdzd2luZydgIG9yIGAnbGluZWFyJ2AuXG4gICAqIEBvcHRpb25cbiAgICogQHR5cGUge3N0cmluZ31cbiAgICogQGRlZmF1bHQgJ2xpbmVhcidcbiAgICogQHNlZSB7QGxpbmsgaHR0cHM6Ly9hcGkuanF1ZXJ5LmNvbS9hbmltYXRlfEpxdWVyeSBhbmltYXRlfVxuICAgKi9cbiAgYW5pbWF0aW9uRWFzaW5nOiAnbGluZWFyJyxcbiAgLyoqXG4gICAqIE51bWJlciBvZiBwaXhlbHMgdG8gdXNlIGFzIGEgbWFya2VyIGZvciBsb2NhdGlvbiBjaGFuZ2VzLlxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHtudW1iZXJ9XG4gICAqIEBkZWZhdWx0IDUwXG4gICAqL1xuICB0aHJlc2hvbGQ6IDUwLFxuICAvKipcbiAgICogQ2xhc3MgYXBwbGllZCB0byB0aGUgYWN0aXZlIGxvY2F0aW9ucyBsaW5rIG9uIHRoZSBtYWdlbGxhbiBjb250YWluZXIuXG4gICAqIEBvcHRpb25cbiAgICogQHR5cGUge3N0cmluZ31cbiAgICogQGRlZmF1bHQgJ2FjdGl2ZSdcbiAgICovXG4gIGFjdGl2ZUNsYXNzOiAnYWN0aXZlJyxcbiAgLyoqXG4gICAqIEFsbG93cyB0aGUgc2NyaXB0IHRvIG1hbmlwdWxhdGUgdGhlIHVybCBvZiB0aGUgY3VycmVudCBwYWdlLCBhbmQgaWYgc3VwcG9ydGVkLCBhbHRlciB0aGUgaGlzdG9yeS5cbiAgICogQG9wdGlvblxuICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICogQGRlZmF1bHQgZmFsc2VcbiAgICovXG4gIGRlZXBMaW5raW5nOiBmYWxzZSxcbiAgLyoqXG4gICAqIE51bWJlciBvZiBwaXhlbHMgdG8gb2Zmc2V0IHRoZSBzY3JvbGwgb2YgdGhlIHBhZ2Ugb24gaXRlbSBjbGljayBpZiB1c2luZyBhIHN0aWNreSBuYXYgYmFyLlxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHtudW1iZXJ9XG4gICAqIEBkZWZhdWx0IDBcbiAgICovXG4gIGJhck9mZnNldDogMFxufVxuXG4vLyBXaW5kb3cgZXhwb3J0c1xuRm91bmRhdGlvbi5wbHVnaW4oTWFnZWxsYW4sICdNYWdlbGxhbicpO1xuXG59KGpRdWVyeSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbi8qKlxuICogT2ZmQ2FudmFzIG1vZHVsZS5cbiAqIEBtb2R1bGUgZm91bmRhdGlvbi5vZmZjYW52YXNcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwua2V5Ym9hcmRcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwubWVkaWFRdWVyeVxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC50cmlnZ2Vyc1xuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5tb3Rpb25cbiAqL1xuXG5jbGFzcyBPZmZDYW52YXMge1xuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBhbiBvZmYtY2FudmFzIHdyYXBwZXIuXG4gICAqIEBjbGFzc1xuICAgKiBAZmlyZXMgT2ZmQ2FudmFzI2luaXRcbiAgICogQHBhcmFtIHtPYmplY3R9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIGluaXRpYWxpemUuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3ZlcnJpZGVzIHRvIHRoZSBkZWZhdWx0IHBsdWdpbiBzZXR0aW5ncy5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLiRlbGVtZW50ID0gZWxlbWVudDtcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgT2ZmQ2FudmFzLmRlZmF1bHRzLCB0aGlzLiRlbGVtZW50LmRhdGEoKSwgb3B0aW9ucyk7XG4gICAgdGhpcy4kbGFzdFRyaWdnZXIgPSAkKCk7XG4gICAgdGhpcy4kdHJpZ2dlcnMgPSAkKCk7XG5cbiAgICB0aGlzLl9pbml0KCk7XG4gICAgdGhpcy5fZXZlbnRzKCk7XG5cbiAgICBGb3VuZGF0aW9uLnJlZ2lzdGVyUGx1Z2luKHRoaXMsICdPZmZDYW52YXMnKVxuICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQucmVnaXN0ZXIoJ09mZkNhbnZhcycsIHtcbiAgICAgICdFU0NBUEUnOiAnY2xvc2UnXG4gICAgfSk7XG5cbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyB0aGUgb2ZmLWNhbnZhcyB3cmFwcGVyIGJ5IGFkZGluZyB0aGUgZXhpdCBvdmVybGF5IChpZiBuZWVkZWQpLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9pbml0KCkge1xuICAgIHZhciBpZCA9IHRoaXMuJGVsZW1lbnQuYXR0cignaWQnKTtcblxuICAgIHRoaXMuJGVsZW1lbnQuYXR0cignYXJpYS1oaWRkZW4nLCAndHJ1ZScpO1xuXG4gICAgdGhpcy4kZWxlbWVudC5hZGRDbGFzcyhgaXMtdHJhbnNpdGlvbi0ke3RoaXMub3B0aW9ucy50cmFuc2l0aW9ufWApO1xuXG4gICAgLy8gRmluZCB0cmlnZ2VycyB0aGF0IGFmZmVjdCB0aGlzIGVsZW1lbnQgYW5kIGFkZCBhcmlhLWV4cGFuZGVkIHRvIHRoZW1cbiAgICB0aGlzLiR0cmlnZ2VycyA9ICQoZG9jdW1lbnQpXG4gICAgICAuZmluZCgnW2RhdGEtb3Blbj1cIicraWQrJ1wiXSwgW2RhdGEtY2xvc2U9XCInK2lkKydcIl0sIFtkYXRhLXRvZ2dsZT1cIicraWQrJ1wiXScpXG4gICAgICAuYXR0cignYXJpYS1leHBhbmRlZCcsICdmYWxzZScpXG4gICAgICAuYXR0cignYXJpYS1jb250cm9scycsIGlkKTtcblxuICAgIC8vIEFkZCBhbiBvdmVybGF5IG92ZXIgdGhlIGNvbnRlbnQgaWYgbmVjZXNzYXJ5XG4gICAgaWYgKHRoaXMub3B0aW9ucy5jb250ZW50T3ZlcmxheSA9PT0gdHJ1ZSkge1xuICAgICAgdmFyIG92ZXJsYXkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgIHZhciBvdmVybGF5UG9zaXRpb24gPSAkKHRoaXMuJGVsZW1lbnQpLmNzcyhcInBvc2l0aW9uXCIpID09PSAnZml4ZWQnID8gJ2lzLW92ZXJsYXktZml4ZWQnIDogJ2lzLW92ZXJsYXktYWJzb2x1dGUnO1xuICAgICAgb3ZlcmxheS5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgJ2pzLW9mZi1jYW52YXMtb3ZlcmxheSAnICsgb3ZlcmxheVBvc2l0aW9uKTtcbiAgICAgIHRoaXMuJG92ZXJsYXkgPSAkKG92ZXJsYXkpO1xuICAgICAgaWYob3ZlcmxheVBvc2l0aW9uID09PSAnaXMtb3ZlcmxheS1maXhlZCcpIHtcbiAgICAgICAgJCgnYm9keScpLmFwcGVuZCh0aGlzLiRvdmVybGF5KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuJGVsZW1lbnQuc2libGluZ3MoJ1tkYXRhLW9mZi1jYW52YXMtY29udGVudF0nKS5hcHBlbmQodGhpcy4kb3ZlcmxheSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5vcHRpb25zLmlzUmV2ZWFsZWQgPSB0aGlzLm9wdGlvbnMuaXNSZXZlYWxlZCB8fCBuZXcgUmVnRXhwKHRoaXMub3B0aW9ucy5yZXZlYWxDbGFzcywgJ2cnKS50ZXN0KHRoaXMuJGVsZW1lbnRbMF0uY2xhc3NOYW1lKTtcblxuICAgIGlmICh0aGlzLm9wdGlvbnMuaXNSZXZlYWxlZCA9PT0gdHJ1ZSkge1xuICAgICAgdGhpcy5vcHRpb25zLnJldmVhbE9uID0gdGhpcy5vcHRpb25zLnJldmVhbE9uIHx8IHRoaXMuJGVsZW1lbnRbMF0uY2xhc3NOYW1lLm1hdGNoKC8ocmV2ZWFsLWZvci1tZWRpdW18cmV2ZWFsLWZvci1sYXJnZSkvZylbMF0uc3BsaXQoJy0nKVsyXTtcbiAgICAgIHRoaXMuX3NldE1RQ2hlY2tlcigpO1xuICAgIH1cbiAgICBpZiAoIXRoaXMub3B0aW9ucy50cmFuc2l0aW9uVGltZSA9PT0gdHJ1ZSkge1xuICAgICAgdGhpcy5vcHRpb25zLnRyYW5zaXRpb25UaW1lID0gcGFyc2VGbG9hdCh3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSgkKCdbZGF0YS1vZmYtY2FudmFzXScpWzBdKS50cmFuc2l0aW9uRHVyYXRpb24pICogMTAwMDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBldmVudCBoYW5kbGVycyB0byB0aGUgb2ZmLWNhbnZhcyB3cmFwcGVyIGFuZCB0aGUgZXhpdCBvdmVybGF5LlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9ldmVudHMoKSB7XG4gICAgdGhpcy4kZWxlbWVudC5vZmYoJy56Zi50cmlnZ2VyIC56Zi5vZmZjYW52YXMnKS5vbih7XG4gICAgICAnb3Blbi56Zi50cmlnZ2VyJzogdGhpcy5vcGVuLmJpbmQodGhpcyksXG4gICAgICAnY2xvc2UuemYudHJpZ2dlcic6IHRoaXMuY2xvc2UuYmluZCh0aGlzKSxcbiAgICAgICd0b2dnbGUuemYudHJpZ2dlcic6IHRoaXMudG9nZ2xlLmJpbmQodGhpcyksXG4gICAgICAna2V5ZG93bi56Zi5vZmZjYW52YXMnOiB0aGlzLl9oYW5kbGVLZXlib2FyZC5iaW5kKHRoaXMpXG4gICAgfSk7XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmNsb3NlT25DbGljayA9PT0gdHJ1ZSkge1xuICAgICAgdmFyICR0YXJnZXQgPSB0aGlzLm9wdGlvbnMuY29udGVudE92ZXJsYXkgPyB0aGlzLiRvdmVybGF5IDogJCgnW2RhdGEtb2ZmLWNhbnZhcy1jb250ZW50XScpO1xuICAgICAgJHRhcmdldC5vbih7J2NsaWNrLnpmLm9mZmNhbnZhcyc6IHRoaXMuY2xvc2UuYmluZCh0aGlzKX0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBcHBsaWVzIGV2ZW50IGxpc3RlbmVyIGZvciBlbGVtZW50cyB0aGF0IHdpbGwgcmV2ZWFsIGF0IGNlcnRhaW4gYnJlYWtwb2ludHMuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfc2V0TVFDaGVja2VyKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAkKHdpbmRvdykub24oJ2NoYW5nZWQuemYubWVkaWFxdWVyeScsIGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKEZvdW5kYXRpb24uTWVkaWFRdWVyeS5hdExlYXN0KF90aGlzLm9wdGlvbnMucmV2ZWFsT24pKSB7XG4gICAgICAgIF90aGlzLnJldmVhbCh0cnVlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIF90aGlzLnJldmVhbChmYWxzZSk7XG4gICAgICB9XG4gICAgfSkub25lKCdsb2FkLnpmLm9mZmNhbnZhcycsIGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKEZvdW5kYXRpb24uTWVkaWFRdWVyeS5hdExlYXN0KF90aGlzLm9wdGlvbnMucmV2ZWFsT24pKSB7XG4gICAgICAgIF90aGlzLnJldmVhbCh0cnVlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGVzIHRoZSByZXZlYWxpbmcvaGlkaW5nIHRoZSBvZmYtY2FudmFzIGF0IGJyZWFrcG9pbnRzLCBub3QgdGhlIHNhbWUgYXMgb3Blbi5cbiAgICogQHBhcmFtIHtCb29sZWFufSBpc1JldmVhbGVkIC0gdHJ1ZSBpZiBlbGVtZW50IHNob3VsZCBiZSByZXZlYWxlZC5cbiAgICogQGZ1bmN0aW9uXG4gICAqL1xuICByZXZlYWwoaXNSZXZlYWxlZCkge1xuICAgIHZhciAkY2xvc2VyID0gdGhpcy4kZWxlbWVudC5maW5kKCdbZGF0YS1jbG9zZV0nKTtcbiAgICBpZiAoaXNSZXZlYWxlZCkge1xuICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgdGhpcy5pc1JldmVhbGVkID0gdHJ1ZTtcbiAgICAgIHRoaXMuJGVsZW1lbnQuYXR0cignYXJpYS1oaWRkZW4nLCAnZmFsc2UnKTtcbiAgICAgIHRoaXMuJGVsZW1lbnQub2ZmKCdvcGVuLnpmLnRyaWdnZXIgdG9nZ2xlLnpmLnRyaWdnZXInKTtcbiAgICAgIGlmICgkY2xvc2VyLmxlbmd0aCkgeyAkY2xvc2VyLmhpZGUoKTsgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmlzUmV2ZWFsZWQgPSBmYWxzZTtcbiAgICAgIHRoaXMuJGVsZW1lbnQuYXR0cignYXJpYS1oaWRkZW4nLCAndHJ1ZScpO1xuICAgICAgdGhpcy4kZWxlbWVudC5vZmYoJ29wZW4uemYudHJpZ2dlciB0b2dnbGUuemYudHJpZ2dlcicpLm9uKHtcbiAgICAgICAgJ29wZW4uemYudHJpZ2dlcic6IHRoaXMub3Blbi5iaW5kKHRoaXMpLFxuICAgICAgICAndG9nZ2xlLnpmLnRyaWdnZXInOiB0aGlzLnRvZ2dsZS5iaW5kKHRoaXMpXG4gICAgICB9KTtcbiAgICAgIGlmICgkY2xvc2VyLmxlbmd0aCkge1xuICAgICAgICAkY2xvc2VyLnNob3coKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU3RvcHMgc2Nyb2xsaW5nIG9mIHRoZSBib2R5IHdoZW4gb2ZmY2FudmFzIGlzIG9wZW4gb24gbW9iaWxlIFNhZmFyaSBhbmQgb3RoZXIgdHJvdWJsZXNvbWUgYnJvd3NlcnMuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfc3RvcFNjcm9sbGluZyhldmVudCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8vIFRha2VuIGFuZCBhZGFwdGVkIGZyb20gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xNjg4OTQ0Ny9wcmV2ZW50LWZ1bGwtcGFnZS1zY3JvbGxpbmctaW9zXG4gIC8vIE9ubHkgcmVhbGx5IHdvcmtzIGZvciB5LCBub3Qgc3VyZSBob3cgdG8gZXh0ZW5kIHRvIHggb3IgaWYgd2UgbmVlZCB0by5cbiAgX3JlY29yZFNjcm9sbGFibGUoZXZlbnQpIHtcbiAgICBsZXQgZWxlbSA9IHRoaXM7IC8vIGNhbGxlZCBmcm9tIGV2ZW50IGhhbmRsZXIgY29udGV4dCB3aXRoIHRoaXMgYXMgZWxlbVxuXG4gICAgIC8vIElmIHRoZSBlbGVtZW50IGlzIHNjcm9sbGFibGUgKGNvbnRlbnQgb3ZlcmZsb3dzKSwgdGhlbi4uLlxuICAgIGlmIChlbGVtLnNjcm9sbEhlaWdodCAhPT0gZWxlbS5jbGllbnRIZWlnaHQpIHtcbiAgICAgIC8vIElmIHdlJ3JlIGF0IHRoZSB0b3AsIHNjcm9sbCBkb3duIG9uZSBwaXhlbCB0byBhbGxvdyBzY3JvbGxpbmcgdXBcbiAgICAgIGlmIChlbGVtLnNjcm9sbFRvcCA9PT0gMCkge1xuICAgICAgICBlbGVtLnNjcm9sbFRvcCA9IDE7XG4gICAgICB9XG4gICAgICAvLyBJZiB3ZSdyZSBhdCB0aGUgYm90dG9tLCBzY3JvbGwgdXAgb25lIHBpeGVsIHRvIGFsbG93IHNjcm9sbGluZyBkb3duXG4gICAgICBpZiAoZWxlbS5zY3JvbGxUb3AgPT09IGVsZW0uc2Nyb2xsSGVpZ2h0IC0gZWxlbS5jbGllbnRIZWlnaHQpIHtcbiAgICAgICAgZWxlbS5zY3JvbGxUb3AgPSBlbGVtLnNjcm9sbEhlaWdodCAtIGVsZW0uY2xpZW50SGVpZ2h0IC0gMTtcbiAgICAgIH1cbiAgICB9XG4gICAgZWxlbS5hbGxvd1VwID0gZWxlbS5zY3JvbGxUb3AgPiAwO1xuICAgIGVsZW0uYWxsb3dEb3duID0gZWxlbS5zY3JvbGxUb3AgPCAoZWxlbS5zY3JvbGxIZWlnaHQgLSBlbGVtLmNsaWVudEhlaWdodCk7XG4gICAgZWxlbS5sYXN0WSA9IGV2ZW50Lm9yaWdpbmFsRXZlbnQucGFnZVk7XG4gIH1cblxuICBfc3RvcFNjcm9sbFByb3BhZ2F0aW9uKGV2ZW50KSB7XG4gICAgbGV0IGVsZW0gPSB0aGlzOyAvLyBjYWxsZWQgZnJvbSBldmVudCBoYW5kbGVyIGNvbnRleHQgd2l0aCB0aGlzIGFzIGVsZW1cbiAgICBsZXQgdXAgPSBldmVudC5wYWdlWSA8IGVsZW0ubGFzdFk7XG4gICAgbGV0IGRvd24gPSAhdXA7XG4gICAgZWxlbS5sYXN0WSA9IGV2ZW50LnBhZ2VZO1xuXG4gICAgaWYoKHVwICYmIGVsZW0uYWxsb3dVcCkgfHwgKGRvd24gJiYgZWxlbS5hbGxvd0Rvd24pKSB7XG4gICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogT3BlbnMgdGhlIG9mZi1jYW52YXMgbWVudS5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBldmVudCAtIEV2ZW50IG9iamVjdCBwYXNzZWQgZnJvbSBsaXN0ZW5lci5cbiAgICogQHBhcmFtIHtqUXVlcnl9IHRyaWdnZXIgLSBlbGVtZW50IHRoYXQgdHJpZ2dlcmVkIHRoZSBvZmYtY2FudmFzIHRvIG9wZW4uXG4gICAqIEBmaXJlcyBPZmZDYW52YXMjb3BlbmVkXG4gICAqL1xuICBvcGVuKGV2ZW50LCB0cmlnZ2VyKSB7XG4gICAgaWYgKHRoaXMuJGVsZW1lbnQuaGFzQ2xhc3MoJ2lzLW9wZW4nKSB8fCB0aGlzLmlzUmV2ZWFsZWQpIHsgcmV0dXJuOyB9XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIGlmICh0cmlnZ2VyKSB7XG4gICAgICB0aGlzLiRsYXN0VHJpZ2dlciA9IHRyaWdnZXI7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5mb3JjZVRvID09PSAndG9wJykge1xuICAgICAgd2luZG93LnNjcm9sbFRvKDAsIDApO1xuICAgIH0gZWxzZSBpZiAodGhpcy5vcHRpb25zLmZvcmNlVG8gPT09ICdib3R0b20nKSB7XG4gICAgICB3aW5kb3cuc2Nyb2xsVG8oMCxkb2N1bWVudC5ib2R5LnNjcm9sbEhlaWdodCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRmlyZXMgd2hlbiB0aGUgb2ZmLWNhbnZhcyBtZW51IG9wZW5zLlxuICAgICAqIEBldmVudCBPZmZDYW52YXMjb3BlbmVkXG4gICAgICovXG4gICAgX3RoaXMuJGVsZW1lbnQuYWRkQ2xhc3MoJ2lzLW9wZW4nKVxuXG4gICAgdGhpcy4kdHJpZ2dlcnMuYXR0cignYXJpYS1leHBhbmRlZCcsICd0cnVlJyk7XG4gICAgdGhpcy4kZWxlbWVudC5hdHRyKCdhcmlhLWhpZGRlbicsICdmYWxzZScpXG4gICAgICAgIC50cmlnZ2VyKCdvcGVuZWQuemYub2ZmY2FudmFzJyk7XG5cbiAgICAvLyBJZiBgY29udGVudFNjcm9sbGAgaXMgc2V0IHRvIGZhbHNlLCBhZGQgY2xhc3MgYW5kIGRpc2FibGUgc2Nyb2xsaW5nIG9uIHRvdWNoIGRldmljZXMuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5jb250ZW50U2Nyb2xsID09PSBmYWxzZSkge1xuICAgICAgJCgnYm9keScpLmFkZENsYXNzKCdpcy1vZmYtY2FudmFzLW9wZW4nKS5vbigndG91Y2htb3ZlJywgdGhpcy5fc3RvcFNjcm9sbGluZyk7XG4gICAgICB0aGlzLiRlbGVtZW50Lm9uKCd0b3VjaHN0YXJ0JywgdGhpcy5fcmVjb3JkU2Nyb2xsYWJsZSk7XG4gICAgICB0aGlzLiRlbGVtZW50Lm9uKCd0b3VjaG1vdmUnLCB0aGlzLl9zdG9wU2Nyb2xsUHJvcGFnYXRpb24pO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm9wdGlvbnMuY29udGVudE92ZXJsYXkgPT09IHRydWUpIHtcbiAgICAgIHRoaXMuJG92ZXJsYXkuYWRkQ2xhc3MoJ2lzLXZpc2libGUnKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmNsb3NlT25DbGljayA9PT0gdHJ1ZSAmJiB0aGlzLm9wdGlvbnMuY29udGVudE92ZXJsYXkgPT09IHRydWUpIHtcbiAgICAgIHRoaXMuJG92ZXJsYXkuYWRkQ2xhc3MoJ2lzLWNsb3NhYmxlJyk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5hdXRvRm9jdXMgPT09IHRydWUpIHtcbiAgICAgIHRoaXMuJGVsZW1lbnQub25lKEZvdW5kYXRpb24udHJhbnNpdGlvbmVuZCh0aGlzLiRlbGVtZW50KSwgZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjYW52YXNGb2N1cyA9IF90aGlzLiRlbGVtZW50LmZpbmQoJ1tkYXRhLWF1dG9mb2N1c10nKTtcbiAgICAgICAgaWYgKGNhbnZhc0ZvY3VzLmxlbmd0aCkge1xuICAgICAgICAgICAgY2FudmFzRm9jdXMuZXEoMCkuZm9jdXMoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIF90aGlzLiRlbGVtZW50LmZpbmQoJ2EsIGJ1dHRvbicpLmVxKDApLmZvY3VzKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm9wdGlvbnMudHJhcEZvY3VzID09PSB0cnVlKSB7XG4gICAgICB0aGlzLiRlbGVtZW50LnNpYmxpbmdzKCdbZGF0YS1vZmYtY2FudmFzLWNvbnRlbnRdJykuYXR0cigndGFiaW5kZXgnLCAnLTEnKTtcbiAgICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQudHJhcEZvY3VzKHRoaXMuJGVsZW1lbnQpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDbG9zZXMgdGhlIG9mZi1jYW52YXMgbWVudS5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNiIC0gb3B0aW9uYWwgY2IgdG8gZmlyZSBhZnRlciBjbG9zdXJlLlxuICAgKiBAZmlyZXMgT2ZmQ2FudmFzI2Nsb3NlZFxuICAgKi9cbiAgY2xvc2UoY2IpIHtcbiAgICBpZiAoIXRoaXMuJGVsZW1lbnQuaGFzQ2xhc3MoJ2lzLW9wZW4nKSB8fCB0aGlzLmlzUmV2ZWFsZWQpIHsgcmV0dXJuOyB9XG5cbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgX3RoaXMuJGVsZW1lbnQucmVtb3ZlQ2xhc3MoJ2lzLW9wZW4nKTtcblxuICAgIHRoaXMuJGVsZW1lbnQuYXR0cignYXJpYS1oaWRkZW4nLCAndHJ1ZScpXG4gICAgICAvKipcbiAgICAgICAqIEZpcmVzIHdoZW4gdGhlIG9mZi1jYW52YXMgbWVudSBvcGVucy5cbiAgICAgICAqIEBldmVudCBPZmZDYW52YXMjY2xvc2VkXG4gICAgICAgKi9cbiAgICAgICAgLnRyaWdnZXIoJ2Nsb3NlZC56Zi5vZmZjYW52YXMnKTtcblxuICAgIC8vIElmIGBjb250ZW50U2Nyb2xsYCBpcyBzZXQgdG8gZmFsc2UsIHJlbW92ZSBjbGFzcyBhbmQgcmUtZW5hYmxlIHNjcm9sbGluZyBvbiB0b3VjaCBkZXZpY2VzLlxuICAgIGlmICh0aGlzLm9wdGlvbnMuY29udGVudFNjcm9sbCA9PT0gZmFsc2UpIHtcbiAgICAgICQoJ2JvZHknKS5yZW1vdmVDbGFzcygnaXMtb2ZmLWNhbnZhcy1vcGVuJykub2ZmKCd0b3VjaG1vdmUnLCB0aGlzLl9zdG9wU2Nyb2xsaW5nKTtcbiAgICAgIHRoaXMuJGVsZW1lbnQub2ZmKCd0b3VjaHN0YXJ0JywgdGhpcy5fcmVjb3JkU2Nyb2xsYWJsZSk7XG4gICAgICB0aGlzLiRlbGVtZW50Lm9mZigndG91Y2htb3ZlJywgdGhpcy5fc3RvcFNjcm9sbFByb3BhZ2F0aW9uKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmNvbnRlbnRPdmVybGF5ID09PSB0cnVlKSB7XG4gICAgICB0aGlzLiRvdmVybGF5LnJlbW92ZUNsYXNzKCdpcy12aXNpYmxlJyk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5jbG9zZU9uQ2xpY2sgPT09IHRydWUgJiYgdGhpcy5vcHRpb25zLmNvbnRlbnRPdmVybGF5ID09PSB0cnVlKSB7XG4gICAgICB0aGlzLiRvdmVybGF5LnJlbW92ZUNsYXNzKCdpcy1jbG9zYWJsZScpO1xuICAgIH1cblxuICAgIHRoaXMuJHRyaWdnZXJzLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCAnZmFsc2UnKTtcblxuICAgIGlmICh0aGlzLm9wdGlvbnMudHJhcEZvY3VzID09PSB0cnVlKSB7XG4gICAgICB0aGlzLiRlbGVtZW50LnNpYmxpbmdzKCdbZGF0YS1vZmYtY2FudmFzLWNvbnRlbnRdJykucmVtb3ZlQXR0cigndGFiaW5kZXgnKTtcbiAgICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQucmVsZWFzZUZvY3VzKHRoaXMuJGVsZW1lbnQpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBUb2dnbGVzIHRoZSBvZmYtY2FudmFzIG1lbnUgb3BlbiBvciBjbG9zZWQuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcGFyYW0ge09iamVjdH0gZXZlbnQgLSBFdmVudCBvYmplY3QgcGFzc2VkIGZyb20gbGlzdGVuZXIuXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSB0cmlnZ2VyIC0gZWxlbWVudCB0aGF0IHRyaWdnZXJlZCB0aGUgb2ZmLWNhbnZhcyB0byBvcGVuLlxuICAgKi9cbiAgdG9nZ2xlKGV2ZW50LCB0cmlnZ2VyKSB7XG4gICAgaWYgKHRoaXMuJGVsZW1lbnQuaGFzQ2xhc3MoJ2lzLW9wZW4nKSkge1xuICAgICAgdGhpcy5jbG9zZShldmVudCwgdHJpZ2dlcik7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdGhpcy5vcGVuKGV2ZW50LCB0cmlnZ2VyKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlcyBrZXlib2FyZCBpbnB1dCB3aGVuIGRldGVjdGVkLiBXaGVuIHRoZSBlc2NhcGUga2V5IGlzIHByZXNzZWQsIHRoZSBvZmYtY2FudmFzIG1lbnUgY2xvc2VzLCBhbmQgZm9jdXMgaXMgcmVzdG9yZWQgdG8gdGhlIGVsZW1lbnQgdGhhdCBvcGVuZWQgdGhlIG1lbnUuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2hhbmRsZUtleWJvYXJkKGUpIHtcbiAgICBGb3VuZGF0aW9uLktleWJvYXJkLmhhbmRsZUtleShlLCAnT2ZmQ2FudmFzJywge1xuICAgICAgY2xvc2U6ICgpID0+IHtcbiAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgICB0aGlzLiRsYXN0VHJpZ2dlci5mb2N1cygpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0sXG4gICAgICBoYW5kbGVkOiAoKSA9PiB7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXN0cm95cyB0aGUgb2ZmY2FudmFzIHBsdWdpbi5cbiAgICogQGZ1bmN0aW9uXG4gICAqL1xuICBkZXN0cm95KCkge1xuICAgIHRoaXMuY2xvc2UoKTtcbiAgICB0aGlzLiRlbGVtZW50Lm9mZignLnpmLnRyaWdnZXIgLnpmLm9mZmNhbnZhcycpO1xuICAgIHRoaXMuJG92ZXJsYXkub2ZmKCcuemYub2ZmY2FudmFzJyk7XG5cbiAgICBGb3VuZGF0aW9uLnVucmVnaXN0ZXJQbHVnaW4odGhpcyk7XG4gIH1cbn1cblxuT2ZmQ2FudmFzLmRlZmF1bHRzID0ge1xuICAvKipcbiAgICogQWxsb3cgdGhlIHVzZXIgdG8gY2xpY2sgb3V0c2lkZSBvZiB0aGUgbWVudSB0byBjbG9zZSBpdC5cbiAgICogQG9wdGlvblxuICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICogQGRlZmF1bHQgdHJ1ZVxuICAgKi9cbiAgY2xvc2VPbkNsaWNrOiB0cnVlLFxuXG4gIC8qKlxuICAgKiBBZGRzIGFuIG92ZXJsYXkgb24gdG9wIG9mIGBbZGF0YS1vZmYtY2FudmFzLWNvbnRlbnRdYC5cbiAgICogQG9wdGlvblxuICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICogQGRlZmF1bHQgdHJ1ZVxuICAgKi9cbiAgY29udGVudE92ZXJsYXk6IHRydWUsXG5cbiAgLyoqXG4gICAqIEVuYWJsZS9kaXNhYmxlIHNjcm9sbGluZyBvZiB0aGUgbWFpbiBjb250ZW50IHdoZW4gYW4gb2ZmIGNhbnZhcyBwYW5lbCBpcyBvcGVuLlxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHtib29sZWFufVxuICAgKiBAZGVmYXVsdCB0cnVlXG4gICAqL1xuICBjb250ZW50U2Nyb2xsOiB0cnVlLFxuXG4gIC8qKlxuICAgKiBBbW91bnQgb2YgdGltZSBpbiBtcyB0aGUgb3BlbiBhbmQgY2xvc2UgdHJhbnNpdGlvbiByZXF1aXJlcy4gSWYgbm9uZSBzZWxlY3RlZCwgcHVsbHMgZnJvbSBib2R5IHN0eWxlLlxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHtudW1iZXJ9XG4gICAqIEBkZWZhdWx0IDBcbiAgICovXG4gIHRyYW5zaXRpb25UaW1lOiAwLFxuXG4gIC8qKlxuICAgKiBUeXBlIG9mIHRyYW5zaXRpb24gZm9yIHRoZSBvZmZjYW52YXMgbWVudS4gT3B0aW9ucyBhcmUgJ3B1c2gnLCAnZGV0YWNoZWQnIG9yICdzbGlkZScuXG4gICAqIEBvcHRpb25cbiAgICogQHR5cGUge3N0cmluZ31cbiAgICogQGRlZmF1bHQgcHVzaFxuICAgKi9cbiAgdHJhbnNpdGlvbjogJ3B1c2gnLFxuXG4gIC8qKlxuICAgKiBGb3JjZSB0aGUgcGFnZSB0byBzY3JvbGwgdG8gdG9wIG9yIGJvdHRvbSBvbiBvcGVuLlxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHs/c3RyaW5nfVxuICAgKiBAZGVmYXVsdCBudWxsXG4gICAqL1xuICBmb3JjZVRvOiBudWxsLFxuXG4gIC8qKlxuICAgKiBBbGxvdyB0aGUgb2ZmY2FudmFzIHRvIHJlbWFpbiBvcGVuIGZvciBjZXJ0YWluIGJyZWFrcG9pbnRzLlxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHtib29sZWFufVxuICAgKiBAZGVmYXVsdCBmYWxzZVxuICAgKi9cbiAgaXNSZXZlYWxlZDogZmFsc2UsXG5cbiAgLyoqXG4gICAqIEJyZWFrcG9pbnQgYXQgd2hpY2ggdG8gcmV2ZWFsLiBKUyB3aWxsIHVzZSBhIFJlZ0V4cCB0byB0YXJnZXQgc3RhbmRhcmQgY2xhc3NlcywgaWYgY2hhbmdpbmcgY2xhc3NuYW1lcywgcGFzcyB5b3VyIGNsYXNzIHdpdGggdGhlIGByZXZlYWxDbGFzc2Agb3B0aW9uLlxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHs/c3RyaW5nfVxuICAgKiBAZGVmYXVsdCBudWxsXG4gICAqL1xuICByZXZlYWxPbjogbnVsbCxcblxuICAvKipcbiAgICogRm9yY2UgZm9jdXMgdG8gdGhlIG9mZmNhbnZhcyBvbiBvcGVuLiBJZiB0cnVlLCB3aWxsIGZvY3VzIHRoZSBvcGVuaW5nIHRyaWdnZXIgb24gY2xvc2UuXG4gICAqIEBvcHRpb25cbiAgICogQHR5cGUge2Jvb2xlYW59XG4gICAqIEBkZWZhdWx0IHRydWVcbiAgICovXG4gIGF1dG9Gb2N1czogdHJ1ZSxcblxuICAvKipcbiAgICogQ2xhc3MgdXNlZCB0byBmb3JjZSBhbiBvZmZjYW52YXMgdG8gcmVtYWluIG9wZW4uIEZvdW5kYXRpb24gZGVmYXVsdHMgZm9yIHRoaXMgYXJlIGByZXZlYWwtZm9yLWxhcmdlYCAmIGByZXZlYWwtZm9yLW1lZGl1bWAuXG4gICAqIEBvcHRpb25cbiAgICogQHR5cGUge3N0cmluZ31cbiAgICogQGRlZmF1bHQgcmV2ZWFsLWZvci1cbiAgICogQHRvZG8gaW1wcm92ZSB0aGUgcmVnZXggdGVzdGluZyBmb3IgdGhpcy5cbiAgICovXG4gIHJldmVhbENsYXNzOiAncmV2ZWFsLWZvci0nLFxuXG4gIC8qKlxuICAgKiBUcmlnZ2VycyBvcHRpb25hbCBmb2N1cyB0cmFwcGluZyB3aGVuIG9wZW5pbmcgYW4gb2ZmY2FudmFzLiBTZXRzIHRhYmluZGV4IG9mIFtkYXRhLW9mZi1jYW52YXMtY29udGVudF0gdG8gLTEgZm9yIGFjY2Vzc2liaWxpdHkgcHVycG9zZXMuXG4gICAqIEBvcHRpb25cbiAgICogQHR5cGUge2Jvb2xlYW59XG4gICAqIEBkZWZhdWx0IGZhbHNlXG4gICAqL1xuICB0cmFwRm9jdXM6IGZhbHNlXG59XG5cbi8vIFdpbmRvdyBleHBvcnRzXG5Gb3VuZGF0aW9uLnBsdWdpbihPZmZDYW52YXMsICdPZmZDYW52YXMnKTtcblxufShqUXVlcnkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG4vKipcbiAqIFJlc3BvbnNpdmVNZW51IG1vZHVsZS5cbiAqIEBtb2R1bGUgZm91bmRhdGlvbi5yZXNwb25zaXZlTWVudVxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC50cmlnZ2Vyc1xuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5tZWRpYVF1ZXJ5XG4gKi9cblxuY2xhc3MgUmVzcG9uc2l2ZU1lbnUge1xuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBhIHJlc3BvbnNpdmUgbWVudS5cbiAgICogQGNsYXNzXG4gICAqIEBmaXJlcyBSZXNwb25zaXZlTWVudSNpbml0XG4gICAqIEBwYXJhbSB7alF1ZXJ5fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBtYWtlIGludG8gYSBkcm9wZG93biBtZW51LlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE92ZXJyaWRlcyB0byB0aGUgZGVmYXVsdCBwbHVnaW4gc2V0dGluZ3MuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy4kZWxlbWVudCA9ICQoZWxlbWVudCk7XG4gICAgdGhpcy5ydWxlcyA9IHRoaXMuJGVsZW1lbnQuZGF0YSgncmVzcG9uc2l2ZS1tZW51Jyk7XG4gICAgdGhpcy5jdXJyZW50TXEgPSBudWxsO1xuICAgIHRoaXMuY3VycmVudFBsdWdpbiA9IG51bGw7XG5cbiAgICB0aGlzLl9pbml0KCk7XG4gICAgdGhpcy5fZXZlbnRzKCk7XG5cbiAgICBGb3VuZGF0aW9uLnJlZ2lzdGVyUGx1Z2luKHRoaXMsICdSZXNwb25zaXZlTWVudScpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIHRoZSBNZW51IGJ5IHBhcnNpbmcgdGhlIGNsYXNzZXMgZnJvbSB0aGUgJ2RhdGEtUmVzcG9uc2l2ZU1lbnUnIGF0dHJpYnV0ZSBvbiB0aGUgZWxlbWVudC5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfaW5pdCgpIHtcbiAgICAvLyBUaGUgZmlyc3QgdGltZSBhbiBJbnRlcmNoYW5nZSBwbHVnaW4gaXMgaW5pdGlhbGl6ZWQsIHRoaXMucnVsZXMgaXMgY29udmVydGVkIGZyb20gYSBzdHJpbmcgb2YgXCJjbGFzc2VzXCIgdG8gYW4gb2JqZWN0IG9mIHJ1bGVzXG4gICAgaWYgKHR5cGVvZiB0aGlzLnJ1bGVzID09PSAnc3RyaW5nJykge1xuICAgICAgbGV0IHJ1bGVzVHJlZSA9IHt9O1xuXG4gICAgICAvLyBQYXJzZSBydWxlcyBmcm9tIFwiY2xhc3Nlc1wiIHB1bGxlZCBmcm9tIGRhdGEgYXR0cmlidXRlXG4gICAgICBsZXQgcnVsZXMgPSB0aGlzLnJ1bGVzLnNwbGl0KCcgJyk7XG5cbiAgICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCBldmVyeSBydWxlIGZvdW5kXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJ1bGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGxldCBydWxlID0gcnVsZXNbaV0uc3BsaXQoJy0nKTtcbiAgICAgICAgbGV0IHJ1bGVTaXplID0gcnVsZS5sZW5ndGggPiAxID8gcnVsZVswXSA6ICdzbWFsbCc7XG4gICAgICAgIGxldCBydWxlUGx1Z2luID0gcnVsZS5sZW5ndGggPiAxID8gcnVsZVsxXSA6IHJ1bGVbMF07XG5cbiAgICAgICAgaWYgKE1lbnVQbHVnaW5zW3J1bGVQbHVnaW5dICE9PSBudWxsKSB7XG4gICAgICAgICAgcnVsZXNUcmVlW3J1bGVTaXplXSA9IE1lbnVQbHVnaW5zW3J1bGVQbHVnaW5dO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHRoaXMucnVsZXMgPSBydWxlc1RyZWU7XG4gICAgfVxuXG4gICAgaWYgKCEkLmlzRW1wdHlPYmplY3QodGhpcy5ydWxlcykpIHtcbiAgICAgIHRoaXMuX2NoZWNrTWVkaWFRdWVyaWVzKCk7XG4gICAgfVxuICAgIC8vIEFkZCBkYXRhLW11dGF0ZSBzaW5jZSBjaGlsZHJlbiBtYXkgbmVlZCBpdC5cbiAgICB0aGlzLiRlbGVtZW50LmF0dHIoJ2RhdGEtbXV0YXRlJywgKHRoaXMuJGVsZW1lbnQuYXR0cignZGF0YS1tdXRhdGUnKSB8fCBGb3VuZGF0aW9uLkdldFlvRGlnaXRzKDYsICdyZXNwb25zaXZlLW1lbnUnKSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIGV2ZW50cyBmb3IgdGhlIE1lbnUuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2V2ZW50cygpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgJCh3aW5kb3cpLm9uKCdjaGFuZ2VkLnpmLm1lZGlhcXVlcnknLCBmdW5jdGlvbigpIHtcbiAgICAgIF90aGlzLl9jaGVja01lZGlhUXVlcmllcygpO1xuICAgIH0pO1xuICAgIC8vICQod2luZG93KS5vbigncmVzaXplLnpmLlJlc3BvbnNpdmVNZW51JywgZnVuY3Rpb24oKSB7XG4gICAgLy8gICBfdGhpcy5fY2hlY2tNZWRpYVF1ZXJpZXMoKTtcbiAgICAvLyB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgdGhlIGN1cnJlbnQgc2NyZWVuIHdpZHRoIGFnYWluc3QgYXZhaWxhYmxlIG1lZGlhIHF1ZXJpZXMuIElmIHRoZSBtZWRpYSBxdWVyeSBoYXMgY2hhbmdlZCwgYW5kIHRoZSBwbHVnaW4gbmVlZGVkIGhhcyBjaGFuZ2VkLCB0aGUgcGx1Z2lucyB3aWxsIHN3YXAgb3V0LlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9jaGVja01lZGlhUXVlcmllcygpIHtcbiAgICB2YXIgbWF0Y2hlZE1xLCBfdGhpcyA9IHRoaXM7XG4gICAgLy8gSXRlcmF0ZSB0aHJvdWdoIGVhY2ggcnVsZSBhbmQgZmluZCB0aGUgbGFzdCBtYXRjaGluZyBydWxlXG4gICAgJC5lYWNoKHRoaXMucnVsZXMsIGZ1bmN0aW9uKGtleSkge1xuICAgICAgaWYgKEZvdW5kYXRpb24uTWVkaWFRdWVyeS5hdExlYXN0KGtleSkpIHtcbiAgICAgICAgbWF0Y2hlZE1xID0ga2V5O1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gTm8gbWF0Y2g/IE5vIGRpY2VcbiAgICBpZiAoIW1hdGNoZWRNcSkgcmV0dXJuO1xuXG4gICAgLy8gUGx1Z2luIGFscmVhZHkgaW5pdGlhbGl6ZWQ/IFdlIGdvb2RcbiAgICBpZiAodGhpcy5jdXJyZW50UGx1Z2luIGluc3RhbmNlb2YgdGhpcy5ydWxlc1ttYXRjaGVkTXFdLnBsdWdpbikgcmV0dXJuO1xuXG4gICAgLy8gUmVtb3ZlIGV4aXN0aW5nIHBsdWdpbi1zcGVjaWZpYyBDU1MgY2xhc3Nlc1xuICAgICQuZWFjaChNZW51UGx1Z2lucywgZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xuICAgICAgX3RoaXMuJGVsZW1lbnQucmVtb3ZlQ2xhc3ModmFsdWUuY3NzQ2xhc3MpO1xuICAgIH0pO1xuXG4gICAgLy8gQWRkIHRoZSBDU1MgY2xhc3MgZm9yIHRoZSBuZXcgcGx1Z2luXG4gICAgdGhpcy4kZWxlbWVudC5hZGRDbGFzcyh0aGlzLnJ1bGVzW21hdGNoZWRNcV0uY3NzQ2xhc3MpO1xuXG4gICAgLy8gQ3JlYXRlIGFuIGluc3RhbmNlIG9mIHRoZSBuZXcgcGx1Z2luXG4gICAgaWYgKHRoaXMuY3VycmVudFBsdWdpbikgdGhpcy5jdXJyZW50UGx1Z2luLmRlc3Ryb3koKTtcbiAgICB0aGlzLmN1cnJlbnRQbHVnaW4gPSBuZXcgdGhpcy5ydWxlc1ttYXRjaGVkTXFdLnBsdWdpbih0aGlzLiRlbGVtZW50LCB7fSk7XG4gIH1cblxuICAvKipcbiAgICogRGVzdHJveXMgdGhlIGluc3RhbmNlIG9mIHRoZSBjdXJyZW50IHBsdWdpbiBvbiB0aGlzIGVsZW1lbnQsIGFzIHdlbGwgYXMgdGhlIHdpbmRvdyByZXNpemUgaGFuZGxlciB0aGF0IHN3aXRjaGVzIHRoZSBwbHVnaW5zIG91dC5cbiAgICogQGZ1bmN0aW9uXG4gICAqL1xuICBkZXN0cm95KCkge1xuICAgIHRoaXMuY3VycmVudFBsdWdpbi5kZXN0cm95KCk7XG4gICAgJCh3aW5kb3cpLm9mZignLnpmLlJlc3BvbnNpdmVNZW51Jyk7XG4gICAgRm91bmRhdGlvbi51bnJlZ2lzdGVyUGx1Z2luKHRoaXMpO1xuICB9XG59XG5cblJlc3BvbnNpdmVNZW51LmRlZmF1bHRzID0ge307XG5cbi8vIFRoZSBwbHVnaW4gbWF0Y2hlcyB0aGUgcGx1Z2luIGNsYXNzZXMgd2l0aCB0aGVzZSBwbHVnaW4gaW5zdGFuY2VzLlxudmFyIE1lbnVQbHVnaW5zID0ge1xuICBkcm9wZG93bjoge1xuICAgIGNzc0NsYXNzOiAnZHJvcGRvd24nLFxuICAgIHBsdWdpbjogRm91bmRhdGlvbi5fcGx1Z2luc1snZHJvcGRvd24tbWVudSddIHx8IG51bGxcbiAgfSxcbiBkcmlsbGRvd246IHtcbiAgICBjc3NDbGFzczogJ2RyaWxsZG93bicsXG4gICAgcGx1Z2luOiBGb3VuZGF0aW9uLl9wbHVnaW5zWydkcmlsbGRvd24nXSB8fCBudWxsXG4gIH0sXG4gIGFjY29yZGlvbjoge1xuICAgIGNzc0NsYXNzOiAnYWNjb3JkaW9uLW1lbnUnLFxuICAgIHBsdWdpbjogRm91bmRhdGlvbi5fcGx1Z2luc1snYWNjb3JkaW9uLW1lbnUnXSB8fCBudWxsXG4gIH1cbn07XG5cbi8vIFdpbmRvdyBleHBvcnRzXG5Gb3VuZGF0aW9uLnBsdWdpbihSZXNwb25zaXZlTWVudSwgJ1Jlc3BvbnNpdmVNZW51Jyk7XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuLyoqXG4gKiBSZXNwb25zaXZlVG9nZ2xlIG1vZHVsZS5cbiAqIEBtb2R1bGUgZm91bmRhdGlvbi5yZXNwb25zaXZlVG9nZ2xlXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLm1lZGlhUXVlcnlcbiAqL1xuXG5jbGFzcyBSZXNwb25zaXZlVG9nZ2xlIHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgVGFiIEJhci5cbiAgICogQGNsYXNzXG4gICAqIEBmaXJlcyBSZXNwb25zaXZlVG9nZ2xlI2luaXRcbiAgICogQHBhcmFtIHtqUXVlcnl9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIGF0dGFjaCB0YWIgYmFyIGZ1bmN0aW9uYWxpdHkgdG8uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3ZlcnJpZGVzIHRvIHRoZSBkZWZhdWx0IHBsdWdpbiBzZXR0aW5ncy5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLiRlbGVtZW50ID0gJChlbGVtZW50KTtcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgUmVzcG9uc2l2ZVRvZ2dsZS5kZWZhdWx0cywgdGhpcy4kZWxlbWVudC5kYXRhKCksIG9wdGlvbnMpO1xuXG4gICAgdGhpcy5faW5pdCgpO1xuICAgIHRoaXMuX2V2ZW50cygpO1xuXG4gICAgRm91bmRhdGlvbi5yZWdpc3RlclBsdWdpbih0aGlzLCAnUmVzcG9uc2l2ZVRvZ2dsZScpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIHRoZSB0YWIgYmFyIGJ5IGZpbmRpbmcgdGhlIHRhcmdldCBlbGVtZW50LCB0b2dnbGluZyBlbGVtZW50LCBhbmQgcnVubmluZyB1cGRhdGUoKS5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfaW5pdCgpIHtcbiAgICB2YXIgdGFyZ2V0SUQgPSB0aGlzLiRlbGVtZW50LmRhdGEoJ3Jlc3BvbnNpdmUtdG9nZ2xlJyk7XG4gICAgaWYgKCF0YXJnZXRJRCkge1xuICAgICAgY29uc29sZS5lcnJvcignWW91ciB0YWIgYmFyIG5lZWRzIGFuIElEIG9mIGEgTWVudSBhcyB0aGUgdmFsdWUgb2YgZGF0YS10YWItYmFyLicpO1xuICAgIH1cblxuICAgIHRoaXMuJHRhcmdldE1lbnUgPSAkKGAjJHt0YXJnZXRJRH1gKTtcbiAgICB0aGlzLiR0b2dnbGVyID0gdGhpcy4kZWxlbWVudC5maW5kKCdbZGF0YS10b2dnbGVdJykuZmlsdGVyKGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHRhcmdldCA9ICQodGhpcykuZGF0YSgndG9nZ2xlJyk7XG4gICAgICByZXR1cm4gKHRhcmdldCA9PT0gdGFyZ2V0SUQgfHwgdGFyZ2V0ID09PSBcIlwiKTtcbiAgICB9KTtcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgdGhpcy5vcHRpb25zLCB0aGlzLiR0YXJnZXRNZW51LmRhdGEoKSk7XG5cbiAgICAvLyBJZiB0aGV5IHdlcmUgc2V0LCBwYXJzZSB0aGUgYW5pbWF0aW9uIGNsYXNzZXNcbiAgICBpZih0aGlzLm9wdGlvbnMuYW5pbWF0ZSkge1xuICAgICAgbGV0IGlucHV0ID0gdGhpcy5vcHRpb25zLmFuaW1hdGUuc3BsaXQoJyAnKTtcblxuICAgICAgdGhpcy5hbmltYXRpb25JbiA9IGlucHV0WzBdO1xuICAgICAgdGhpcy5hbmltYXRpb25PdXQgPSBpbnB1dFsxXSB8fCBudWxsO1xuICAgIH1cblxuICAgIHRoaXMuX3VwZGF0ZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgbmVjZXNzYXJ5IGV2ZW50IGhhbmRsZXJzIGZvciB0aGUgdGFiIGJhciB0byB3b3JrLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9ldmVudHMoKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIHRoaXMuX3VwZGF0ZU1xSGFuZGxlciA9IHRoaXMuX3VwZGF0ZS5iaW5kKHRoaXMpO1xuXG4gICAgJCh3aW5kb3cpLm9uKCdjaGFuZ2VkLnpmLm1lZGlhcXVlcnknLCB0aGlzLl91cGRhdGVNcUhhbmRsZXIpO1xuXG4gICAgdGhpcy4kdG9nZ2xlci5vbignY2xpY2suemYucmVzcG9uc2l2ZVRvZ2dsZScsIHRoaXMudG9nZ2xlTWVudS5iaW5kKHRoaXMpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgdGhlIGN1cnJlbnQgbWVkaWEgcXVlcnkgdG8gZGV0ZXJtaW5lIGlmIHRoZSB0YWIgYmFyIHNob3VsZCBiZSB2aXNpYmxlIG9yIGhpZGRlbi5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfdXBkYXRlKCkge1xuICAgIC8vIE1vYmlsZVxuICAgIGlmICghRm91bmRhdGlvbi5NZWRpYVF1ZXJ5LmF0TGVhc3QodGhpcy5vcHRpb25zLmhpZGVGb3IpKSB7XG4gICAgICB0aGlzLiRlbGVtZW50LnNob3coKTtcbiAgICAgIHRoaXMuJHRhcmdldE1lbnUuaGlkZSgpO1xuICAgIH1cblxuICAgIC8vIERlc2t0b3BcbiAgICBlbHNlIHtcbiAgICAgIHRoaXMuJGVsZW1lbnQuaGlkZSgpO1xuICAgICAgdGhpcy4kdGFyZ2V0TWVudS5zaG93KCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRvZ2dsZXMgdGhlIGVsZW1lbnQgYXR0YWNoZWQgdG8gdGhlIHRhYiBiYXIuIFRoZSB0b2dnbGUgb25seSBoYXBwZW5zIGlmIHRoZSBzY3JlZW4gaXMgc21hbGwgZW5vdWdoIHRvIGFsbG93IGl0LlxuICAgKiBAZnVuY3Rpb25cbiAgICogQGZpcmVzIFJlc3BvbnNpdmVUb2dnbGUjdG9nZ2xlZFxuICAgKi9cbiAgdG9nZ2xlTWVudSgpIHtcbiAgICBpZiAoIUZvdW5kYXRpb24uTWVkaWFRdWVyeS5hdExlYXN0KHRoaXMub3B0aW9ucy5oaWRlRm9yKSkge1xuICAgICAgLyoqXG4gICAgICAgKiBGaXJlcyB3aGVuIHRoZSBlbGVtZW50IGF0dGFjaGVkIHRvIHRoZSB0YWIgYmFyIHRvZ2dsZXMuXG4gICAgICAgKiBAZXZlbnQgUmVzcG9uc2l2ZVRvZ2dsZSN0b2dnbGVkXG4gICAgICAgKi9cbiAgICAgIGlmKHRoaXMub3B0aW9ucy5hbmltYXRlKSB7XG4gICAgICAgIGlmICh0aGlzLiR0YXJnZXRNZW51LmlzKCc6aGlkZGVuJykpIHtcbiAgICAgICAgICBGb3VuZGF0aW9uLk1vdGlvbi5hbmltYXRlSW4odGhpcy4kdGFyZ2V0TWVudSwgdGhpcy5hbmltYXRpb25JbiwgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCd0b2dnbGVkLnpmLnJlc3BvbnNpdmVUb2dnbGUnKTtcbiAgICAgICAgICAgIHRoaXMuJHRhcmdldE1lbnUuZmluZCgnW2RhdGEtbXV0YXRlXScpLnRyaWdnZXJIYW5kbGVyKCdtdXRhdGVtZS56Zi50cmlnZ2VyJyk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgRm91bmRhdGlvbi5Nb3Rpb24uYW5pbWF0ZU91dCh0aGlzLiR0YXJnZXRNZW51LCB0aGlzLmFuaW1hdGlvbk91dCwgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCd0b2dnbGVkLnpmLnJlc3BvbnNpdmVUb2dnbGUnKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHRoaXMuJHRhcmdldE1lbnUudG9nZ2xlKDApO1xuICAgICAgICB0aGlzLiR0YXJnZXRNZW51LmZpbmQoJ1tkYXRhLW11dGF0ZV0nKS50cmlnZ2VyKCdtdXRhdGVtZS56Zi50cmlnZ2VyJyk7XG4gICAgICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcigndG9nZ2xlZC56Zi5yZXNwb25zaXZlVG9nZ2xlJyk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIGRlc3Ryb3koKSB7XG4gICAgdGhpcy4kZWxlbWVudC5vZmYoJy56Zi5yZXNwb25zaXZlVG9nZ2xlJyk7XG4gICAgdGhpcy4kdG9nZ2xlci5vZmYoJy56Zi5yZXNwb25zaXZlVG9nZ2xlJyk7XG5cbiAgICAkKHdpbmRvdykub2ZmKCdjaGFuZ2VkLnpmLm1lZGlhcXVlcnknLCB0aGlzLl91cGRhdGVNcUhhbmRsZXIpO1xuXG4gICAgRm91bmRhdGlvbi51bnJlZ2lzdGVyUGx1Z2luKHRoaXMpO1xuICB9XG59XG5cblJlc3BvbnNpdmVUb2dnbGUuZGVmYXVsdHMgPSB7XG4gIC8qKlxuICAgKiBUaGUgYnJlYWtwb2ludCBhZnRlciB3aGljaCB0aGUgbWVudSBpcyBhbHdheXMgc2hvd24sIGFuZCB0aGUgdGFiIGJhciBpcyBoaWRkZW4uXG4gICAqIEBvcHRpb25cbiAgICogQHR5cGUge3N0cmluZ31cbiAgICogQGRlZmF1bHQgJ21lZGl1bSdcbiAgICovXG4gIGhpZGVGb3I6ICdtZWRpdW0nLFxuXG4gIC8qKlxuICAgKiBUbyBkZWNpZGUgaWYgdGhlIHRvZ2dsZSBzaG91bGQgYmUgYW5pbWF0ZWQgb3Igbm90LlxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHtib29sZWFufVxuICAgKiBAZGVmYXVsdCBmYWxzZVxuICAgKi9cbiAgYW5pbWF0ZTogZmFsc2Vcbn07XG5cbi8vIFdpbmRvdyBleHBvcnRzXG5Gb3VuZGF0aW9uLnBsdWdpbihSZXNwb25zaXZlVG9nZ2xlLCAnUmVzcG9uc2l2ZVRvZ2dsZScpO1xuXG59KGpRdWVyeSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbi8qKlxuICogUmV2ZWFsIG1vZHVsZS5cbiAqIEBtb2R1bGUgZm91bmRhdGlvbi5yZXZlYWxcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwua2V5Ym9hcmRcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwuYm94XG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLnRyaWdnZXJzXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLm1lZGlhUXVlcnlcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwubW90aW9uIGlmIHVzaW5nIGFuaW1hdGlvbnNcbiAqL1xuXG5jbGFzcyBSZXZlYWwge1xuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBSZXZlYWwuXG4gICAqIEBjbGFzc1xuICAgKiBAcGFyYW0ge2pRdWVyeX0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gdXNlIGZvciB0aGUgbW9kYWwuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gb3B0aW9uYWwgcGFyYW1ldGVycy5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLiRlbGVtZW50ID0gZWxlbWVudDtcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgUmV2ZWFsLmRlZmF1bHRzLCB0aGlzLiRlbGVtZW50LmRhdGEoKSwgb3B0aW9ucyk7XG4gICAgdGhpcy5faW5pdCgpO1xuXG4gICAgRm91bmRhdGlvbi5yZWdpc3RlclBsdWdpbih0aGlzLCAnUmV2ZWFsJyk7XG4gICAgRm91bmRhdGlvbi5LZXlib2FyZC5yZWdpc3RlcignUmV2ZWFsJywge1xuICAgICAgJ0VOVEVSJzogJ29wZW4nLFxuICAgICAgJ1NQQUNFJzogJ29wZW4nLFxuICAgICAgJ0VTQ0FQRSc6ICdjbG9zZScsXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgdGhlIG1vZGFsIGJ5IGFkZGluZyB0aGUgb3ZlcmxheSBhbmQgY2xvc2UgYnV0dG9ucywgKGlmIHNlbGVjdGVkKS5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9pbml0KCkge1xuICAgIHRoaXMuaWQgPSB0aGlzLiRlbGVtZW50LmF0dHIoJ2lkJyk7XG4gICAgdGhpcy5pc0FjdGl2ZSA9IGZhbHNlO1xuICAgIHRoaXMuY2FjaGVkID0ge21xOiBGb3VuZGF0aW9uLk1lZGlhUXVlcnkuY3VycmVudH07XG4gICAgdGhpcy5pc01vYmlsZSA9IG1vYmlsZVNuaWZmKCk7XG5cbiAgICB0aGlzLiRhbmNob3IgPSAkKGBbZGF0YS1vcGVuPVwiJHt0aGlzLmlkfVwiXWApLmxlbmd0aCA/ICQoYFtkYXRhLW9wZW49XCIke3RoaXMuaWR9XCJdYCkgOiAkKGBbZGF0YS10b2dnbGU9XCIke3RoaXMuaWR9XCJdYCk7XG4gICAgdGhpcy4kYW5jaG9yLmF0dHIoe1xuICAgICAgJ2FyaWEtY29udHJvbHMnOiB0aGlzLmlkLFxuICAgICAgJ2FyaWEtaGFzcG9wdXAnOiB0cnVlLFxuICAgICAgJ3RhYmluZGV4JzogMFxuICAgIH0pO1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5mdWxsU2NyZWVuIHx8IHRoaXMuJGVsZW1lbnQuaGFzQ2xhc3MoJ2Z1bGwnKSkge1xuICAgICAgdGhpcy5vcHRpb25zLmZ1bGxTY3JlZW4gPSB0cnVlO1xuICAgICAgdGhpcy5vcHRpb25zLm92ZXJsYXkgPSBmYWxzZTtcbiAgICB9XG4gICAgaWYgKHRoaXMub3B0aW9ucy5vdmVybGF5ICYmICF0aGlzLiRvdmVybGF5KSB7XG4gICAgICB0aGlzLiRvdmVybGF5ID0gdGhpcy5fbWFrZU92ZXJsYXkodGhpcy5pZCk7XG4gICAgfVxuXG4gICAgdGhpcy4kZWxlbWVudC5hdHRyKHtcbiAgICAgICAgJ3JvbGUnOiAnZGlhbG9nJyxcbiAgICAgICAgJ2FyaWEtaGlkZGVuJzogdHJ1ZSxcbiAgICAgICAgJ2RhdGEteWV0aS1ib3gnOiB0aGlzLmlkLFxuICAgICAgICAnZGF0YS1yZXNpemUnOiB0aGlzLmlkXG4gICAgfSk7XG5cbiAgICBpZih0aGlzLiRvdmVybGF5KSB7XG4gICAgICB0aGlzLiRlbGVtZW50LmRldGFjaCgpLmFwcGVuZFRvKHRoaXMuJG92ZXJsYXkpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLiRlbGVtZW50LmRldGFjaCgpLmFwcGVuZFRvKCQodGhpcy5vcHRpb25zLmFwcGVuZFRvKSk7XG4gICAgICB0aGlzLiRlbGVtZW50LmFkZENsYXNzKCd3aXRob3V0LW92ZXJsYXknKTtcbiAgICB9XG4gICAgdGhpcy5fZXZlbnRzKCk7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5kZWVwTGluayAmJiB3aW5kb3cubG9jYXRpb24uaGFzaCA9PT0gKCBgIyR7dGhpcy5pZH1gKSkge1xuICAgICAgJCh3aW5kb3cpLm9uZSgnbG9hZC56Zi5yZXZlYWwnLCB0aGlzLm9wZW4uYmluZCh0aGlzKSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gb3ZlcmxheSBkaXYgdG8gZGlzcGxheSBiZWhpbmQgdGhlIG1vZGFsLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX21ha2VPdmVybGF5KCkge1xuICAgIHJldHVybiAkKCc8ZGl2PjwvZGl2PicpXG4gICAgICAuYWRkQ2xhc3MoJ3JldmVhbC1vdmVybGF5JylcbiAgICAgIC5hcHBlbmRUbyh0aGlzLm9wdGlvbnMuYXBwZW5kVG8pO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgcG9zaXRpb24gb2YgbW9kYWxcbiAgICogVE9ETzogIEZpZ3VyZSBvdXQgaWYgd2UgYWN0dWFsbHkgbmVlZCB0byBjYWNoZSB0aGVzZSB2YWx1ZXMgb3IgaWYgaXQgZG9lc24ndCBtYXR0ZXJcbiAgICogQHByaXZhdGVcbiAgICovXG4gIF91cGRhdGVQb3NpdGlvbigpIHtcbiAgICB2YXIgd2lkdGggPSB0aGlzLiRlbGVtZW50Lm91dGVyV2lkdGgoKTtcbiAgICB2YXIgb3V0ZXJXaWR0aCA9ICQod2luZG93KS53aWR0aCgpO1xuICAgIHZhciBoZWlnaHQgPSB0aGlzLiRlbGVtZW50Lm91dGVySGVpZ2h0KCk7XG4gICAgdmFyIG91dGVySGVpZ2h0ID0gJCh3aW5kb3cpLmhlaWdodCgpO1xuICAgIHZhciBsZWZ0LCB0b3A7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5oT2Zmc2V0ID09PSAnYXV0bycpIHtcbiAgICAgIGxlZnQgPSBwYXJzZUludCgob3V0ZXJXaWR0aCAtIHdpZHRoKSAvIDIsIDEwKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGVmdCA9IHBhcnNlSW50KHRoaXMub3B0aW9ucy5oT2Zmc2V0LCAxMCk7XG4gICAgfVxuICAgIGlmICh0aGlzLm9wdGlvbnMudk9mZnNldCA9PT0gJ2F1dG8nKSB7XG4gICAgICBpZiAoaGVpZ2h0ID4gb3V0ZXJIZWlnaHQpIHtcbiAgICAgICAgdG9wID0gcGFyc2VJbnQoTWF0aC5taW4oMTAwLCBvdXRlckhlaWdodCAvIDEwKSwgMTApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdG9wID0gcGFyc2VJbnQoKG91dGVySGVpZ2h0IC0gaGVpZ2h0KSAvIDQsIDEwKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdG9wID0gcGFyc2VJbnQodGhpcy5vcHRpb25zLnZPZmZzZXQsIDEwKTtcbiAgICB9XG4gICAgdGhpcy4kZWxlbWVudC5jc3Moe3RvcDogdG9wICsgJ3B4J30pO1xuICAgIC8vIG9ubHkgd29ycnkgYWJvdXQgbGVmdCBpZiB3ZSBkb24ndCBoYXZlIGFuIG92ZXJsYXkgb3Igd2UgaGF2ZWEgIGhvcml6b250YWwgb2Zmc2V0LFxuICAgIC8vIG90aGVyd2lzZSB3ZSdyZSBwZXJmZWN0bHkgaW4gdGhlIG1pZGRsZVxuICAgIGlmKCF0aGlzLiRvdmVybGF5IHx8ICh0aGlzLm9wdGlvbnMuaE9mZnNldCAhPT0gJ2F1dG8nKSkge1xuICAgICAgdGhpcy4kZWxlbWVudC5jc3Moe2xlZnQ6IGxlZnQgKyAncHgnfSk7XG4gICAgICB0aGlzLiRlbGVtZW50LmNzcyh7bWFyZ2luOiAnMHB4J30pO1xuICAgIH1cblxuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgZXZlbnQgaGFuZGxlcnMgZm9yIHRoZSBtb2RhbC5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9ldmVudHMoKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIHRoaXMuJGVsZW1lbnQub24oe1xuICAgICAgJ29wZW4uemYudHJpZ2dlcic6IHRoaXMub3Blbi5iaW5kKHRoaXMpLFxuICAgICAgJ2Nsb3NlLnpmLnRyaWdnZXInOiAoZXZlbnQsICRlbGVtZW50KSA9PiB7XG4gICAgICAgIGlmICgoZXZlbnQudGFyZ2V0ID09PSBfdGhpcy4kZWxlbWVudFswXSkgfHxcbiAgICAgICAgICAgICgkKGV2ZW50LnRhcmdldCkucGFyZW50cygnW2RhdGEtY2xvc2FibGVdJylbMF0gPT09ICRlbGVtZW50KSkgeyAvLyBvbmx5IGNsb3NlIHJldmVhbCB3aGVuIGl0J3MgZXhwbGljaXRseSBjYWxsZWRcbiAgICAgICAgICByZXR1cm4gdGhpcy5jbG9zZS5hcHBseSh0aGlzKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgICd0b2dnbGUuemYudHJpZ2dlcic6IHRoaXMudG9nZ2xlLmJpbmQodGhpcyksXG4gICAgICAncmVzaXplbWUuemYudHJpZ2dlcic6IGZ1bmN0aW9uKCkge1xuICAgICAgICBfdGhpcy5fdXBkYXRlUG9zaXRpb24oKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGlmICh0aGlzLiRhbmNob3IubGVuZ3RoKSB7XG4gICAgICB0aGlzLiRhbmNob3Iub24oJ2tleWRvd24uemYucmV2ZWFsJywgZnVuY3Rpb24oZSkge1xuICAgICAgICBpZiAoZS53aGljaCA9PT0gMTMgfHwgZS53aGljaCA9PT0gMzIpIHtcbiAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICBfdGhpcy5vcGVuKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm9wdGlvbnMuY2xvc2VPbkNsaWNrICYmIHRoaXMub3B0aW9ucy5vdmVybGF5KSB7XG4gICAgICB0aGlzLiRvdmVybGF5Lm9mZignLnpmLnJldmVhbCcpLm9uKCdjbGljay56Zi5yZXZlYWwnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIGlmIChlLnRhcmdldCA9PT0gX3RoaXMuJGVsZW1lbnRbMF0gfHxcbiAgICAgICAgICAkLmNvbnRhaW5zKF90aGlzLiRlbGVtZW50WzBdLCBlLnRhcmdldCkgfHxcbiAgICAgICAgICAgICEkLmNvbnRhaW5zKGRvY3VtZW50LCBlLnRhcmdldCkpIHtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIF90aGlzLmNsb3NlKCk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgaWYgKHRoaXMub3B0aW9ucy5kZWVwTGluaykge1xuICAgICAgJCh3aW5kb3cpLm9uKGBwb3BzdGF0ZS56Zi5yZXZlYWw6JHt0aGlzLmlkfWAsIHRoaXMuX2hhbmRsZVN0YXRlLmJpbmQodGhpcykpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGVzIG1vZGFsIG1ldGhvZHMgb24gYmFjay9mb3J3YXJkIGJ1dHRvbiBjbGlja3Mgb3IgYW55IG90aGVyIGV2ZW50IHRoYXQgdHJpZ2dlcnMgcG9wc3RhdGUuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfaGFuZGxlU3RhdGUoZSkge1xuICAgIGlmKHdpbmRvdy5sb2NhdGlvbi5oYXNoID09PSAoICcjJyArIHRoaXMuaWQpICYmICF0aGlzLmlzQWN0aXZlKXsgdGhpcy5vcGVuKCk7IH1cbiAgICBlbHNleyB0aGlzLmNsb3NlKCk7IH1cbiAgfVxuXG5cbiAgLyoqXG4gICAqIE9wZW5zIHRoZSBtb2RhbCBjb250cm9sbGVkIGJ5IGB0aGlzLiRhbmNob3JgLCBhbmQgY2xvc2VzIGFsbCBvdGhlcnMgYnkgZGVmYXVsdC5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBmaXJlcyBSZXZlYWwjY2xvc2VtZVxuICAgKiBAZmlyZXMgUmV2ZWFsI29wZW5cbiAgICovXG4gIG9wZW4oKSB7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5kZWVwTGluaykge1xuICAgICAgdmFyIGhhc2ggPSBgIyR7dGhpcy5pZH1gO1xuXG4gICAgICBpZiAod2luZG93Lmhpc3RvcnkucHVzaFN0YXRlKSB7XG4gICAgICAgIHdpbmRvdy5oaXN0b3J5LnB1c2hTdGF0ZShudWxsLCBudWxsLCBoYXNoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbi5oYXNoID0gaGFzaDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmlzQWN0aXZlID0gdHJ1ZTtcblxuICAgIC8vIE1ha2UgZWxlbWVudHMgaW52aXNpYmxlLCBidXQgcmVtb3ZlIGRpc3BsYXk6IG5vbmUgc28gd2UgY2FuIGdldCBzaXplIGFuZCBwb3NpdGlvbmluZ1xuICAgIHRoaXMuJGVsZW1lbnRcbiAgICAgICAgLmNzcyh7ICd2aXNpYmlsaXR5JzogJ2hpZGRlbicgfSlcbiAgICAgICAgLnNob3coKVxuICAgICAgICAuc2Nyb2xsVG9wKDApO1xuICAgIGlmICh0aGlzLm9wdGlvbnMub3ZlcmxheSkge1xuICAgICAgdGhpcy4kb3ZlcmxheS5jc3Moeyd2aXNpYmlsaXR5JzogJ2hpZGRlbid9KS5zaG93KCk7XG4gICAgfVxuXG4gICAgdGhpcy5fdXBkYXRlUG9zaXRpb24oKTtcblxuICAgIHRoaXMuJGVsZW1lbnRcbiAgICAgIC5oaWRlKClcbiAgICAgIC5jc3MoeyAndmlzaWJpbGl0eSc6ICcnIH0pO1xuXG4gICAgaWYodGhpcy4kb3ZlcmxheSkge1xuICAgICAgdGhpcy4kb3ZlcmxheS5jc3Moeyd2aXNpYmlsaXR5JzogJyd9KS5oaWRlKCk7XG4gICAgICBpZih0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKCdmYXN0JykpIHtcbiAgICAgICAgdGhpcy4kb3ZlcmxheS5hZGRDbGFzcygnZmFzdCcpO1xuICAgICAgfSBlbHNlIGlmICh0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKCdzbG93JykpIHtcbiAgICAgICAgdGhpcy4kb3ZlcmxheS5hZGRDbGFzcygnc2xvdycpO1xuICAgICAgfVxuICAgIH1cblxuXG4gICAgaWYgKCF0aGlzLm9wdGlvbnMubXVsdGlwbGVPcGVuZWQpIHtcbiAgICAgIC8qKlxuICAgICAgICogRmlyZXMgaW1tZWRpYXRlbHkgYmVmb3JlIHRoZSBtb2RhbCBvcGVucy5cbiAgICAgICAqIENsb3NlcyBhbnkgb3RoZXIgbW9kYWxzIHRoYXQgYXJlIGN1cnJlbnRseSBvcGVuXG4gICAgICAgKiBAZXZlbnQgUmV2ZWFsI2Nsb3NlbWVcbiAgICAgICAqL1xuICAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdjbG9zZW1lLnpmLnJldmVhbCcsIHRoaXMuaWQpO1xuICAgIH1cblxuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICBmdW5jdGlvbiBhZGRSZXZlYWxPcGVuQ2xhc3NlcygpIHtcbiAgICAgIGlmIChfdGhpcy5pc01vYmlsZSkge1xuICAgICAgICBpZighX3RoaXMub3JpZ2luYWxTY3JvbGxQb3MpIHtcbiAgICAgICAgICBfdGhpcy5vcmlnaW5hbFNjcm9sbFBvcyA9IHdpbmRvdy5wYWdlWU9mZnNldDtcbiAgICAgICAgfVxuICAgICAgICAkKCdodG1sLCBib2R5JykuYWRkQ2xhc3MoJ2lzLXJldmVhbC1vcGVuJyk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgJCgnYm9keScpLmFkZENsYXNzKCdpcy1yZXZlYWwtb3BlbicpO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBNb3Rpb24gVUkgbWV0aG9kIG9mIHJldmVhbFxuICAgIGlmICh0aGlzLm9wdGlvbnMuYW5pbWF0aW9uSW4pIHtcbiAgICAgIGZ1bmN0aW9uIGFmdGVyQW5pbWF0aW9uKCl7XG4gICAgICAgIF90aGlzLiRlbGVtZW50XG4gICAgICAgICAgLmF0dHIoe1xuICAgICAgICAgICAgJ2FyaWEtaGlkZGVuJzogZmFsc2UsXG4gICAgICAgICAgICAndGFiaW5kZXgnOiAtMVxuICAgICAgICAgIH0pXG4gICAgICAgICAgLmZvY3VzKCk7XG4gICAgICAgIGFkZFJldmVhbE9wZW5DbGFzc2VzKCk7XG4gICAgICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQudHJhcEZvY3VzKF90aGlzLiRlbGVtZW50KTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLm9wdGlvbnMub3ZlcmxheSkge1xuICAgICAgICBGb3VuZGF0aW9uLk1vdGlvbi5hbmltYXRlSW4odGhpcy4kb3ZlcmxheSwgJ2ZhZGUtaW4nKTtcbiAgICAgIH1cbiAgICAgIEZvdW5kYXRpb24uTW90aW9uLmFuaW1hdGVJbih0aGlzLiRlbGVtZW50LCB0aGlzLm9wdGlvbnMuYW5pbWF0aW9uSW4sICgpID0+IHtcbiAgICAgICAgaWYodGhpcy4kZWxlbWVudCkgeyAvLyBwcm90ZWN0IGFnYWluc3Qgb2JqZWN0IGhhdmluZyBiZWVuIHJlbW92ZWRcbiAgICAgICAgICB0aGlzLmZvY3VzYWJsZUVsZW1lbnRzID0gRm91bmRhdGlvbi5LZXlib2FyZC5maW5kRm9jdXNhYmxlKHRoaXMuJGVsZW1lbnQpO1xuICAgICAgICAgIGFmdGVyQW5pbWF0aW9uKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICAvLyBqUXVlcnkgbWV0aG9kIG9mIHJldmVhbFxuICAgIGVsc2Uge1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5vdmVybGF5KSB7XG4gICAgICAgIHRoaXMuJG92ZXJsYXkuc2hvdygwKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuJGVsZW1lbnQuc2hvdyh0aGlzLm9wdGlvbnMuc2hvd0RlbGF5KTtcbiAgICB9XG5cbiAgICAvLyBoYW5kbGUgYWNjZXNzaWJpbGl0eVxuICAgIHRoaXMuJGVsZW1lbnRcbiAgICAgIC5hdHRyKHtcbiAgICAgICAgJ2FyaWEtaGlkZGVuJzogZmFsc2UsXG4gICAgICAgICd0YWJpbmRleCc6IC0xXG4gICAgICB9KVxuICAgICAgLmZvY3VzKCk7XG4gICAgRm91bmRhdGlvbi5LZXlib2FyZC50cmFwRm9jdXModGhpcy4kZWxlbWVudCk7XG5cbiAgICAvKipcbiAgICAgKiBGaXJlcyB3aGVuIHRoZSBtb2RhbCBoYXMgc3VjY2Vzc2Z1bGx5IG9wZW5lZC5cbiAgICAgKiBAZXZlbnQgUmV2ZWFsI29wZW5cbiAgICAgKi9cbiAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ29wZW4uemYucmV2ZWFsJyk7XG5cbiAgICBhZGRSZXZlYWxPcGVuQ2xhc3NlcygpO1xuXG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICB0aGlzLl9leHRyYUhhbmRsZXJzKCk7XG4gICAgfSwgMCk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBleHRyYSBldmVudCBoYW5kbGVycyBmb3IgdGhlIGJvZHkgYW5kIHdpbmRvdyBpZiBuZWNlc3NhcnkuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfZXh0cmFIYW5kbGVycygpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIGlmKCF0aGlzLiRlbGVtZW50KSB7IHJldHVybjsgfSAvLyBJZiB3ZSdyZSBpbiB0aGUgbWlkZGxlIG9mIGNsZWFudXAsIGRvbid0IGZyZWFrIG91dFxuICAgIHRoaXMuZm9jdXNhYmxlRWxlbWVudHMgPSBGb3VuZGF0aW9uLktleWJvYXJkLmZpbmRGb2N1c2FibGUodGhpcy4kZWxlbWVudCk7XG5cbiAgICBpZiAoIXRoaXMub3B0aW9ucy5vdmVybGF5ICYmIHRoaXMub3B0aW9ucy5jbG9zZU9uQ2xpY2sgJiYgIXRoaXMub3B0aW9ucy5mdWxsU2NyZWVuKSB7XG4gICAgICAkKCdib2R5Jykub24oJ2NsaWNrLnpmLnJldmVhbCcsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgaWYgKGUudGFyZ2V0ID09PSBfdGhpcy4kZWxlbWVudFswXSB8fFxuICAgICAgICAgICQuY29udGFpbnMoX3RoaXMuJGVsZW1lbnRbMF0sIGUudGFyZ2V0KSB8fFxuICAgICAgICAgICAgISQuY29udGFpbnMoZG9jdW1lbnQsIGUudGFyZ2V0KSkgeyByZXR1cm47IH1cbiAgICAgICAgX3RoaXMuY2xvc2UoKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm9wdGlvbnMuY2xvc2VPbkVzYykge1xuICAgICAgJCh3aW5kb3cpLm9uKCdrZXlkb3duLnpmLnJldmVhbCcsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgRm91bmRhdGlvbi5LZXlib2FyZC5oYW5kbGVLZXkoZSwgJ1JldmVhbCcsIHtcbiAgICAgICAgICBjbG9zZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoX3RoaXMub3B0aW9ucy5jbG9zZU9uRXNjKSB7XG4gICAgICAgICAgICAgIF90aGlzLmNsb3NlKCk7XG4gICAgICAgICAgICAgIF90aGlzLiRhbmNob3IuZm9jdXMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gbG9jayBmb2N1cyB3aXRoaW4gbW9kYWwgd2hpbGUgdGFiYmluZ1xuICAgIHRoaXMuJGVsZW1lbnQub24oJ2tleWRvd24uemYucmV2ZWFsJywgZnVuY3Rpb24oZSkge1xuICAgICAgdmFyICR0YXJnZXQgPSAkKHRoaXMpO1xuICAgICAgLy8gaGFuZGxlIGtleWJvYXJkIGV2ZW50IHdpdGgga2V5Ym9hcmQgdXRpbFxuICAgICAgRm91bmRhdGlvbi5LZXlib2FyZC5oYW5kbGVLZXkoZSwgJ1JldmVhbCcsIHtcbiAgICAgICAgb3BlbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKF90aGlzLiRlbGVtZW50LmZpbmQoJzpmb2N1cycpLmlzKF90aGlzLiRlbGVtZW50LmZpbmQoJ1tkYXRhLWNsb3NlXScpKSkge1xuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgLy8gc2V0IGZvY3VzIGJhY2sgdG8gYW5jaG9yIGlmIGNsb3NlIGJ1dHRvbiBoYXMgYmVlbiBhY3RpdmF0ZWRcbiAgICAgICAgICAgICAgX3RoaXMuJGFuY2hvci5mb2N1cygpO1xuICAgICAgICAgICAgfSwgMSk7XG4gICAgICAgICAgfSBlbHNlIGlmICgkdGFyZ2V0LmlzKF90aGlzLmZvY3VzYWJsZUVsZW1lbnRzKSkgeyAvLyBkb250J3QgdHJpZ2dlciBpZiBhY3VhbCBlbGVtZW50IGhhcyBmb2N1cyAoaS5lLiBpbnB1dHMsIGxpbmtzLCAuLi4pXG4gICAgICAgICAgICBfdGhpcy5vcGVuKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBjbG9zZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKF90aGlzLm9wdGlvbnMuY2xvc2VPbkVzYykge1xuICAgICAgICAgICAgX3RoaXMuY2xvc2UoKTtcbiAgICAgICAgICAgIF90aGlzLiRhbmNob3IuZm9jdXMoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGhhbmRsZWQ6IGZ1bmN0aW9uKHByZXZlbnREZWZhdWx0KSB7XG4gICAgICAgICAgaWYgKHByZXZlbnREZWZhdWx0KSB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDbG9zZXMgdGhlIG1vZGFsLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQGZpcmVzIFJldmVhbCNjbG9zZWRcbiAgICovXG4gIGNsb3NlKCkge1xuICAgIGlmICghdGhpcy5pc0FjdGl2ZSB8fCAhdGhpcy4kZWxlbWVudC5pcygnOnZpc2libGUnKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgLy8gTW90aW9uIFVJIG1ldGhvZCBvZiBoaWRpbmdcbiAgICBpZiAodGhpcy5vcHRpb25zLmFuaW1hdGlvbk91dCkge1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5vdmVybGF5KSB7XG4gICAgICAgIEZvdW5kYXRpb24uTW90aW9uLmFuaW1hdGVPdXQodGhpcy4kb3ZlcmxheSwgJ2ZhZGUtb3V0JywgZmluaXNoVXApO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGZpbmlzaFVwKCk7XG4gICAgICB9XG5cbiAgICAgIEZvdW5kYXRpb24uTW90aW9uLmFuaW1hdGVPdXQodGhpcy4kZWxlbWVudCwgdGhpcy5vcHRpb25zLmFuaW1hdGlvbk91dCk7XG4gICAgfVxuICAgIC8vIGpRdWVyeSBtZXRob2Qgb2YgaGlkaW5nXG4gICAgZWxzZSB7XG5cbiAgICAgIHRoaXMuJGVsZW1lbnQuaGlkZSh0aGlzLm9wdGlvbnMuaGlkZURlbGF5KTtcblxuICAgICAgaWYgKHRoaXMub3B0aW9ucy5vdmVybGF5KSB7XG4gICAgICAgIHRoaXMuJG92ZXJsYXkuaGlkZSgwLCBmaW5pc2hVcCk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgZmluaXNoVXAoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBDb25kaXRpb25hbHMgdG8gcmVtb3ZlIGV4dHJhIGV2ZW50IGxpc3RlbmVycyBhZGRlZCBvbiBvcGVuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5jbG9zZU9uRXNjKSB7XG4gICAgICAkKHdpbmRvdykub2ZmKCdrZXlkb3duLnpmLnJldmVhbCcpO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5vcHRpb25zLm92ZXJsYXkgJiYgdGhpcy5vcHRpb25zLmNsb3NlT25DbGljaykge1xuICAgICAgJCgnYm9keScpLm9mZignY2xpY2suemYucmV2ZWFsJyk7XG4gICAgfVxuXG4gICAgdGhpcy4kZWxlbWVudC5vZmYoJ2tleWRvd24uemYucmV2ZWFsJyk7XG5cbiAgICBmdW5jdGlvbiBmaW5pc2hVcCgpIHtcbiAgICAgIGlmIChfdGhpcy5pc01vYmlsZSkge1xuICAgICAgICBpZiAoJCgnLnJldmVhbDp2aXNpYmxlJykubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgJCgnaHRtbCwgYm9keScpLnJlbW92ZUNsYXNzKCdpcy1yZXZlYWwtb3BlbicpO1xuICAgICAgICB9XG4gICAgICAgIGlmKF90aGlzLm9yaWdpbmFsU2Nyb2xsUG9zKSB7XG4gICAgICAgICAgJCgnYm9keScpLnNjcm9sbFRvcChfdGhpcy5vcmlnaW5hbFNjcm9sbFBvcyk7XG4gICAgICAgICAgX3RoaXMub3JpZ2luYWxTY3JvbGxQb3MgPSBudWxsO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgaWYgKCQoJy5yZXZlYWw6dmlzaWJsZScpLmxlbmd0aCAgPT09IDApIHtcbiAgICAgICAgICAkKCdib2R5JykucmVtb3ZlQ2xhc3MoJ2lzLXJldmVhbC1vcGVuJyk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuXG4gICAgICBGb3VuZGF0aW9uLktleWJvYXJkLnJlbGVhc2VGb2N1cyhfdGhpcy4kZWxlbWVudCk7XG5cbiAgICAgIF90aGlzLiRlbGVtZW50LmF0dHIoJ2FyaWEtaGlkZGVuJywgdHJ1ZSk7XG5cbiAgICAgIC8qKlxuICAgICAgKiBGaXJlcyB3aGVuIHRoZSBtb2RhbCBpcyBkb25lIGNsb3NpbmcuXG4gICAgICAqIEBldmVudCBSZXZlYWwjY2xvc2VkXG4gICAgICAqL1xuICAgICAgX3RoaXMuJGVsZW1lbnQudHJpZ2dlcignY2xvc2VkLnpmLnJldmVhbCcpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICogUmVzZXRzIHRoZSBtb2RhbCBjb250ZW50XG4gICAgKiBUaGlzIHByZXZlbnRzIGEgcnVubmluZyB2aWRlbyB0byBrZWVwIGdvaW5nIGluIHRoZSBiYWNrZ3JvdW5kXG4gICAgKi9cbiAgICBpZiAodGhpcy5vcHRpb25zLnJlc2V0T25DbG9zZSkge1xuICAgICAgdGhpcy4kZWxlbWVudC5odG1sKHRoaXMuJGVsZW1lbnQuaHRtbCgpKTtcbiAgICB9XG5cbiAgICB0aGlzLmlzQWN0aXZlID0gZmFsc2U7XG4gICAgIGlmIChfdGhpcy5vcHRpb25zLmRlZXBMaW5rKSB7XG4gICAgICAgaWYgKHdpbmRvdy5oaXN0b3J5LnJlcGxhY2VTdGF0ZSkge1xuICAgICAgICAgd2luZG93Lmhpc3RvcnkucmVwbGFjZVN0YXRlKCcnLCBkb2N1bWVudC50aXRsZSwgd2luZG93LmxvY2F0aW9uLmhyZWYucmVwbGFjZShgIyR7dGhpcy5pZH1gLCAnJykpO1xuICAgICAgIH0gZWxzZSB7XG4gICAgICAgICB3aW5kb3cubG9jYXRpb24uaGFzaCA9ICcnO1xuICAgICAgIH1cbiAgICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRvZ2dsZXMgdGhlIG9wZW4vY2xvc2VkIHN0YXRlIG9mIGEgbW9kYWwuXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgdG9nZ2xlKCkge1xuICAgIGlmICh0aGlzLmlzQWN0aXZlKSB7XG4gICAgICB0aGlzLmNsb3NlKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMub3BlbigpO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogRGVzdHJveXMgYW4gaW5zdGFuY2Ugb2YgYSBtb2RhbC5cbiAgICogQGZ1bmN0aW9uXG4gICAqL1xuICBkZXN0cm95KCkge1xuICAgIGlmICh0aGlzLm9wdGlvbnMub3ZlcmxheSkge1xuICAgICAgdGhpcy4kZWxlbWVudC5hcHBlbmRUbygkKHRoaXMub3B0aW9ucy5hcHBlbmRUbykpOyAvLyBtb3ZlICRlbGVtZW50IG91dHNpZGUgb2YgJG92ZXJsYXkgdG8gcHJldmVudCBlcnJvciB1bnJlZ2lzdGVyUGx1Z2luKClcbiAgICAgIHRoaXMuJG92ZXJsYXkuaGlkZSgpLm9mZigpLnJlbW92ZSgpO1xuICAgIH1cbiAgICB0aGlzLiRlbGVtZW50LmhpZGUoKS5vZmYoKTtcbiAgICB0aGlzLiRhbmNob3Iub2ZmKCcuemYnKTtcbiAgICAkKHdpbmRvdykub2ZmKGAuemYucmV2ZWFsOiR7dGhpcy5pZH1gKTtcblxuICAgIEZvdW5kYXRpb24udW5yZWdpc3RlclBsdWdpbih0aGlzKTtcbiAgfTtcbn1cblxuUmV2ZWFsLmRlZmF1bHRzID0ge1xuICAvKipcbiAgICogTW90aW9uLVVJIGNsYXNzIHRvIHVzZSBmb3IgYW5pbWF0ZWQgZWxlbWVudHMuIElmIG5vbmUgdXNlZCwgZGVmYXVsdHMgdG8gc2ltcGxlIHNob3cvaGlkZS5cbiAgICogQG9wdGlvblxuICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgKiBAZGVmYXVsdCAnJ1xuICAgKi9cbiAgYW5pbWF0aW9uSW46ICcnLFxuICAvKipcbiAgICogTW90aW9uLVVJIGNsYXNzIHRvIHVzZSBmb3IgYW5pbWF0ZWQgZWxlbWVudHMuIElmIG5vbmUgdXNlZCwgZGVmYXVsdHMgdG8gc2ltcGxlIHNob3cvaGlkZS5cbiAgICogQG9wdGlvblxuICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgKiBAZGVmYXVsdCAnJ1xuICAgKi9cbiAgYW5pbWF0aW9uT3V0OiAnJyxcbiAgLyoqXG4gICAqIFRpbWUsIGluIG1zLCB0byBkZWxheSB0aGUgb3BlbmluZyBvZiBhIG1vZGFsIGFmdGVyIGEgY2xpY2sgaWYgbm8gYW5pbWF0aW9uIHVzZWQuXG4gICAqIEBvcHRpb25cbiAgICogQHR5cGUge251bWJlcn1cbiAgICogQGRlZmF1bHQgMFxuICAgKi9cbiAgc2hvd0RlbGF5OiAwLFxuICAvKipcbiAgICogVGltZSwgaW4gbXMsIHRvIGRlbGF5IHRoZSBjbG9zaW5nIG9mIGEgbW9kYWwgYWZ0ZXIgYSBjbGljayBpZiBubyBhbmltYXRpb24gdXNlZC5cbiAgICogQG9wdGlvblxuICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgKiBAZGVmYXVsdCAwXG4gICAqL1xuICBoaWRlRGVsYXk6IDAsXG4gIC8qKlxuICAgKiBBbGxvd3MgYSBjbGljayBvbiB0aGUgYm9keS9vdmVybGF5IHRvIGNsb3NlIHRoZSBtb2RhbC5cbiAgICogQG9wdGlvblxuICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICogQGRlZmF1bHQgdHJ1ZVxuICAgKi9cbiAgY2xvc2VPbkNsaWNrOiB0cnVlLFxuICAvKipcbiAgICogQWxsb3dzIHRoZSBtb2RhbCB0byBjbG9zZSBpZiB0aGUgdXNlciBwcmVzc2VzIHRoZSBgRVNDQVBFYCBrZXkuXG4gICAqIEBvcHRpb25cbiAgICogQHR5cGUge2Jvb2xlYW59XG4gICAqIEBkZWZhdWx0IHRydWVcbiAgICovXG4gIGNsb3NlT25Fc2M6IHRydWUsXG4gIC8qKlxuICAgKiBJZiB0cnVlLCBhbGxvd3MgbXVsdGlwbGUgbW9kYWxzIHRvIGJlIGRpc3BsYXllZCBhdCBvbmNlLlxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHtib29sZWFufVxuICAgKiBAZGVmYXVsdCBmYWxzZVxuICAgKi9cbiAgbXVsdGlwbGVPcGVuZWQ6IGZhbHNlLFxuICAvKipcbiAgICogRGlzdGFuY2UsIGluIHBpeGVscywgdGhlIG1vZGFsIHNob3VsZCBwdXNoIGRvd24gZnJvbSB0aGUgdG9wIG9mIHRoZSBzY3JlZW4uXG4gICAqIEBvcHRpb25cbiAgICogQHR5cGUge251bWJlcnxzdHJpbmd9XG4gICAqIEBkZWZhdWx0IGF1dG9cbiAgICovXG4gIHZPZmZzZXQ6ICdhdXRvJyxcbiAgLyoqXG4gICAqIERpc3RhbmNlLCBpbiBwaXhlbHMsIHRoZSBtb2RhbCBzaG91bGQgcHVzaCBpbiBmcm9tIHRoZSBzaWRlIG9mIHRoZSBzY3JlZW4uXG4gICAqIEBvcHRpb25cbiAgICogQHR5cGUge251bWJlcnxzdHJpbmd9XG4gICAqIEBkZWZhdWx0IGF1dG9cbiAgICovXG4gIGhPZmZzZXQ6ICdhdXRvJyxcbiAgLyoqXG4gICAqIEFsbG93cyB0aGUgbW9kYWwgdG8gYmUgZnVsbHNjcmVlbiwgY29tcGxldGVseSBibG9ja2luZyBvdXQgdGhlIHJlc3Qgb2YgdGhlIHZpZXcuIEpTIGNoZWNrcyBmb3IgdGhpcyBhcyB3ZWxsLlxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHtib29sZWFufVxuICAgKiBAZGVmYXVsdCBmYWxzZVxuICAgKi9cbiAgZnVsbFNjcmVlbjogZmFsc2UsXG4gIC8qKlxuICAgKiBQZXJjZW50YWdlIG9mIHNjcmVlbiBoZWlnaHQgdGhlIG1vZGFsIHNob3VsZCBwdXNoIHVwIGZyb20gdGhlIGJvdHRvbSBvZiB0aGUgdmlldy5cbiAgICogQG9wdGlvblxuICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgKiBAZGVmYXVsdCAxMFxuICAgKi9cbiAgYnRtT2Zmc2V0UGN0OiAxMCxcbiAgLyoqXG4gICAqIEFsbG93cyB0aGUgbW9kYWwgdG8gZ2VuZXJhdGUgYW4gb3ZlcmxheSBkaXYsIHdoaWNoIHdpbGwgY292ZXIgdGhlIHZpZXcgd2hlbiBtb2RhbCBvcGVucy5cbiAgICogQG9wdGlvblxuICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICogQGRlZmF1bHQgdHJ1ZVxuICAgKi9cbiAgb3ZlcmxheTogdHJ1ZSxcbiAgLyoqXG4gICAqIEFsbG93cyB0aGUgbW9kYWwgdG8gcmVtb3ZlIGFuZCByZWluamVjdCBtYXJrdXAgb24gY2xvc2UuIFNob3VsZCBiZSB0cnVlIGlmIHVzaW5nIHZpZGVvIGVsZW1lbnRzIHcvbyB1c2luZyBwcm92aWRlcidzIGFwaSwgb3RoZXJ3aXNlLCB2aWRlb3Mgd2lsbCBjb250aW51ZSB0byBwbGF5IGluIHRoZSBiYWNrZ3JvdW5kLlxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHtib29sZWFufVxuICAgKiBAZGVmYXVsdCBmYWxzZVxuICAgKi9cbiAgcmVzZXRPbkNsb3NlOiBmYWxzZSxcbiAgLyoqXG4gICAqIEFsbG93cyB0aGUgbW9kYWwgdG8gYWx0ZXIgdGhlIHVybCBvbiBvcGVuL2Nsb3NlLCBhbmQgYWxsb3dzIHRoZSB1c2Ugb2YgdGhlIGBiYWNrYCBidXR0b24gdG8gY2xvc2UgbW9kYWxzLiBBTFNPLCBhbGxvd3MgYSBtb2RhbCB0byBhdXRvLW1hbmlhY2FsbHkgb3BlbiBvbiBwYWdlIGxvYWQgSUYgdGhlIGhhc2ggPT09IHRoZSBtb2RhbCdzIHVzZXItc2V0IGlkLlxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHtib29sZWFufVxuICAgKiBAZGVmYXVsdCBmYWxzZVxuICAgKi9cbiAgZGVlcExpbms6IGZhbHNlLFxuICAgIC8qKlxuICAgKiBBbGxvd3MgdGhlIG1vZGFsIHRvIGFwcGVuZCB0byBjdXN0b20gZGl2LlxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHtzdHJpbmd9XG4gICAqIEBkZWZhdWx0IFwiYm9keVwiXG4gICAqL1xuICBhcHBlbmRUbzogXCJib2R5XCJcblxufTtcblxuLy8gV2luZG93IGV4cG9ydHNcbkZvdW5kYXRpb24ucGx1Z2luKFJldmVhbCwgJ1JldmVhbCcpO1xuXG5mdW5jdGlvbiBpUGhvbmVTbmlmZigpIHtcbiAgcmV0dXJuIC9pUChhZHxob25lfG9kKS4qT1MvLnRlc3Qod2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQpO1xufVxuXG5mdW5jdGlvbiBhbmRyb2lkU25pZmYoKSB7XG4gIHJldHVybiAvQW5kcm9pZC8udGVzdCh3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudCk7XG59XG5cbmZ1bmN0aW9uIG1vYmlsZVNuaWZmKCkge1xuICByZXR1cm4gaVBob25lU25pZmYoKSB8fCBhbmRyb2lkU25pZmYoKTtcbn1cblxufShqUXVlcnkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG4vKipcbiAqIFRvZ2dsZXIgbW9kdWxlLlxuICogQG1vZHVsZSBmb3VuZGF0aW9uLnRvZ2dsZXJcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwubW90aW9uXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLnRyaWdnZXJzXG4gKi9cblxuY2xhc3MgVG9nZ2xlciB7XG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIFRvZ2dsZXIuXG4gICAqIEBjbGFzc1xuICAgKiBAZmlyZXMgVG9nZ2xlciNpbml0XG4gICAqIEBwYXJhbSB7T2JqZWN0fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBhZGQgdGhlIHRyaWdnZXIgdG8uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3ZlcnJpZGVzIHRvIHRoZSBkZWZhdWx0IHBsdWdpbiBzZXR0aW5ncy5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLiRlbGVtZW50ID0gZWxlbWVudDtcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgVG9nZ2xlci5kZWZhdWx0cywgZWxlbWVudC5kYXRhKCksIG9wdGlvbnMpO1xuICAgIHRoaXMuY2xhc3NOYW1lID0gJyc7XG5cbiAgICB0aGlzLl9pbml0KCk7XG4gICAgdGhpcy5fZXZlbnRzKCk7XG5cbiAgICBGb3VuZGF0aW9uLnJlZ2lzdGVyUGx1Z2luKHRoaXMsICdUb2dnbGVyJyk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgdGhlIFRvZ2dsZXIgcGx1Z2luIGJ5IHBhcnNpbmcgdGhlIHRvZ2dsZSBjbGFzcyBmcm9tIGRhdGEtdG9nZ2xlciwgb3IgYW5pbWF0aW9uIGNsYXNzZXMgZnJvbSBkYXRhLWFuaW1hdGUuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2luaXQoKSB7XG4gICAgdmFyIGlucHV0O1xuICAgIC8vIFBhcnNlIGFuaW1hdGlvbiBjbGFzc2VzIGlmIHRoZXkgd2VyZSBzZXRcbiAgICBpZiAodGhpcy5vcHRpb25zLmFuaW1hdGUpIHtcbiAgICAgIGlucHV0ID0gdGhpcy5vcHRpb25zLmFuaW1hdGUuc3BsaXQoJyAnKTtcblxuICAgICAgdGhpcy5hbmltYXRpb25JbiA9IGlucHV0WzBdO1xuICAgICAgdGhpcy5hbmltYXRpb25PdXQgPSBpbnB1dFsxXSB8fCBudWxsO1xuICAgIH1cbiAgICAvLyBPdGhlcndpc2UsIHBhcnNlIHRvZ2dsZSBjbGFzc1xuICAgIGVsc2Uge1xuICAgICAgaW5wdXQgPSB0aGlzLiRlbGVtZW50LmRhdGEoJ3RvZ2dsZXInKTtcbiAgICAgIC8vIEFsbG93IGZvciBhIC4gYXQgdGhlIGJlZ2lubmluZyBvZiB0aGUgc3RyaW5nXG4gICAgICB0aGlzLmNsYXNzTmFtZSA9IGlucHV0WzBdID09PSAnLicgPyBpbnB1dC5zbGljZSgxKSA6IGlucHV0O1xuICAgIH1cblxuICAgIC8vIEFkZCBBUklBIGF0dHJpYnV0ZXMgdG8gdHJpZ2dlcnNcbiAgICB2YXIgaWQgPSB0aGlzLiRlbGVtZW50WzBdLmlkO1xuICAgICQoYFtkYXRhLW9wZW49XCIke2lkfVwiXSwgW2RhdGEtY2xvc2U9XCIke2lkfVwiXSwgW2RhdGEtdG9nZ2xlPVwiJHtpZH1cIl1gKVxuICAgICAgLmF0dHIoJ2FyaWEtY29udHJvbHMnLCBpZCk7XG4gICAgLy8gSWYgdGhlIHRhcmdldCBpcyBoaWRkZW4sIGFkZCBhcmlhLWhpZGRlblxuICAgIHRoaXMuJGVsZW1lbnQuYXR0cignYXJpYS1leHBhbmRlZCcsIHRoaXMuJGVsZW1lbnQuaXMoJzpoaWRkZW4nKSA/IGZhbHNlIDogdHJ1ZSk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgZXZlbnRzIGZvciB0aGUgdG9nZ2xlIHRyaWdnZXIuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2V2ZW50cygpIHtcbiAgICB0aGlzLiRlbGVtZW50Lm9mZigndG9nZ2xlLnpmLnRyaWdnZXInKS5vbigndG9nZ2xlLnpmLnRyaWdnZXInLCB0aGlzLnRvZ2dsZS5iaW5kKHRoaXMpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUb2dnbGVzIHRoZSB0YXJnZXQgY2xhc3Mgb24gdGhlIHRhcmdldCBlbGVtZW50LiBBbiBldmVudCBpcyBmaXJlZCBmcm9tIHRoZSBvcmlnaW5hbCB0cmlnZ2VyIGRlcGVuZGluZyBvbiBpZiB0aGUgcmVzdWx0YW50IHN0YXRlIHdhcyBcIm9uXCIgb3IgXCJvZmZcIi5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBmaXJlcyBUb2dnbGVyI29uXG4gICAqIEBmaXJlcyBUb2dnbGVyI29mZlxuICAgKi9cbiAgdG9nZ2xlKCkge1xuICAgIHRoaXNbIHRoaXMub3B0aW9ucy5hbmltYXRlID8gJ190b2dnbGVBbmltYXRlJyA6ICdfdG9nZ2xlQ2xhc3MnXSgpO1xuICB9XG5cbiAgX3RvZ2dsZUNsYXNzKCkge1xuICAgIHRoaXMuJGVsZW1lbnQudG9nZ2xlQ2xhc3ModGhpcy5jbGFzc05hbWUpO1xuXG4gICAgdmFyIGlzT24gPSB0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKHRoaXMuY2xhc3NOYW1lKTtcbiAgICBpZiAoaXNPbikge1xuICAgICAgLyoqXG4gICAgICAgKiBGaXJlcyBpZiB0aGUgdGFyZ2V0IGVsZW1lbnQgaGFzIHRoZSBjbGFzcyBhZnRlciBhIHRvZ2dsZS5cbiAgICAgICAqIEBldmVudCBUb2dnbGVyI29uXG4gICAgICAgKi9cbiAgICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignb24uemYudG9nZ2xlcicpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIC8qKlxuICAgICAgICogRmlyZXMgaWYgdGhlIHRhcmdldCBlbGVtZW50IGRvZXMgbm90IGhhdmUgdGhlIGNsYXNzIGFmdGVyIGEgdG9nZ2xlLlxuICAgICAgICogQGV2ZW50IFRvZ2dsZXIjb2ZmXG4gICAgICAgKi9cbiAgICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignb2ZmLnpmLnRvZ2dsZXInKTtcbiAgICB9XG5cbiAgICB0aGlzLl91cGRhdGVBUklBKGlzT24pO1xuICAgIHRoaXMuJGVsZW1lbnQuZmluZCgnW2RhdGEtbXV0YXRlXScpLnRyaWdnZXIoJ211dGF0ZW1lLnpmLnRyaWdnZXInKTtcbiAgfVxuXG4gIF90b2dnbGVBbmltYXRlKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICBpZiAodGhpcy4kZWxlbWVudC5pcygnOmhpZGRlbicpKSB7XG4gICAgICBGb3VuZGF0aW9uLk1vdGlvbi5hbmltYXRlSW4odGhpcy4kZWxlbWVudCwgdGhpcy5hbmltYXRpb25JbiwgZnVuY3Rpb24oKSB7XG4gICAgICAgIF90aGlzLl91cGRhdGVBUklBKHRydWUpO1xuICAgICAgICB0aGlzLnRyaWdnZXIoJ29uLnpmLnRvZ2dsZXInKTtcbiAgICAgICAgdGhpcy5maW5kKCdbZGF0YS1tdXRhdGVdJykudHJpZ2dlcignbXV0YXRlbWUuemYudHJpZ2dlcicpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgRm91bmRhdGlvbi5Nb3Rpb24uYW5pbWF0ZU91dCh0aGlzLiRlbGVtZW50LCB0aGlzLmFuaW1hdGlvbk91dCwgZnVuY3Rpb24oKSB7XG4gICAgICAgIF90aGlzLl91cGRhdGVBUklBKGZhbHNlKTtcbiAgICAgICAgdGhpcy50cmlnZ2VyKCdvZmYuemYudG9nZ2xlcicpO1xuICAgICAgICB0aGlzLmZpbmQoJ1tkYXRhLW11dGF0ZV0nKS50cmlnZ2VyKCdtdXRhdGVtZS56Zi50cmlnZ2VyJyk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBfdXBkYXRlQVJJQShpc09uKSB7XG4gICAgdGhpcy4kZWxlbWVudC5hdHRyKCdhcmlhLWV4cGFuZGVkJywgaXNPbiA/IHRydWUgOiBmYWxzZSk7XG4gIH1cblxuICAvKipcbiAgICogRGVzdHJveXMgdGhlIGluc3RhbmNlIG9mIFRvZ2dsZXIgb24gdGhlIGVsZW1lbnQuXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgZGVzdHJveSgpIHtcbiAgICB0aGlzLiRlbGVtZW50Lm9mZignLnpmLnRvZ2dsZXInKTtcbiAgICBGb3VuZGF0aW9uLnVucmVnaXN0ZXJQbHVnaW4odGhpcyk7XG4gIH1cbn1cblxuVG9nZ2xlci5kZWZhdWx0cyA9IHtcbiAgLyoqXG4gICAqIFRlbGxzIHRoZSBwbHVnaW4gaWYgdGhlIGVsZW1lbnQgc2hvdWxkIGFuaW1hdGVkIHdoZW4gdG9nZ2xlZC5cbiAgICogQG9wdGlvblxuICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICogQGRlZmF1bHQgZmFsc2VcbiAgICovXG4gIGFuaW1hdGU6IGZhbHNlXG59O1xuXG4vLyBXaW5kb3cgZXhwb3J0c1xuRm91bmRhdGlvbi5wbHVnaW4oVG9nZ2xlciwgJ1RvZ2dsZXInKTtcblxufShqUXVlcnkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG4vKipcbiAqIFRvb2x0aXAgbW9kdWxlLlxuICogQG1vZHVsZSBmb3VuZGF0aW9uLnRvb2x0aXBcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwuYm94XG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLm1lZGlhUXVlcnlcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwudHJpZ2dlcnNcbiAqL1xuXG5jbGFzcyBUb29sdGlwIHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgYSBUb29sdGlwLlxuICAgKiBAY2xhc3NcbiAgICogQGZpcmVzIFRvb2x0aXAjaW5pdFxuICAgKiBAcGFyYW0ge2pRdWVyeX0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gYXR0YWNoIGEgdG9vbHRpcCB0by5cbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBvYmplY3QgdG8gZXh0ZW5kIHRoZSBkZWZhdWx0IGNvbmZpZ3VyYXRpb24uXG4gICAqL1xuICBjb25zdHJ1Y3RvcihlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy4kZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoe30sIFRvb2x0aXAuZGVmYXVsdHMsIHRoaXMuJGVsZW1lbnQuZGF0YSgpLCBvcHRpb25zKTtcblxuICAgIHRoaXMuaXNBY3RpdmUgPSBmYWxzZTtcbiAgICB0aGlzLmlzQ2xpY2sgPSBmYWxzZTtcbiAgICB0aGlzLl9pbml0KCk7XG5cbiAgICBGb3VuZGF0aW9uLnJlZ2lzdGVyUGx1Z2luKHRoaXMsICdUb29sdGlwJyk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgdGhlIHRvb2x0aXAgYnkgc2V0dGluZyB0aGUgY3JlYXRpbmcgdGhlIHRpcCBlbGVtZW50LCBhZGRpbmcgaXQncyB0ZXh0LCBzZXR0aW5nIHByaXZhdGUgdmFyaWFibGVzIGFuZCBzZXR0aW5nIGF0dHJpYnV0ZXMgb24gdGhlIGFuY2hvci5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9pbml0KCkge1xuICAgIHZhciBlbGVtSWQgPSB0aGlzLiRlbGVtZW50LmF0dHIoJ2FyaWEtZGVzY3JpYmVkYnknKSB8fCBGb3VuZGF0aW9uLkdldFlvRGlnaXRzKDYsICd0b29sdGlwJyk7XG5cbiAgICB0aGlzLm9wdGlvbnMucG9zaXRpb25DbGFzcyA9IHRoaXMub3B0aW9ucy5wb3NpdGlvbkNsYXNzIHx8IHRoaXMuX2dldFBvc2l0aW9uQ2xhc3ModGhpcy4kZWxlbWVudCk7XG4gICAgdGhpcy5vcHRpb25zLnRpcFRleHQgPSB0aGlzLm9wdGlvbnMudGlwVGV4dCB8fCB0aGlzLiRlbGVtZW50LmF0dHIoJ3RpdGxlJyk7XG4gICAgdGhpcy50ZW1wbGF0ZSA9IHRoaXMub3B0aW9ucy50ZW1wbGF0ZSA/ICQodGhpcy5vcHRpb25zLnRlbXBsYXRlKSA6IHRoaXMuX2J1aWxkVGVtcGxhdGUoZWxlbUlkKTtcblxuICAgIGlmICh0aGlzLm9wdGlvbnMuYWxsb3dIdG1sKSB7XG4gICAgICB0aGlzLnRlbXBsYXRlLmFwcGVuZFRvKGRvY3VtZW50LmJvZHkpXG4gICAgICAgIC5odG1sKHRoaXMub3B0aW9ucy50aXBUZXh0KVxuICAgICAgICAuaGlkZSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnRlbXBsYXRlLmFwcGVuZFRvKGRvY3VtZW50LmJvZHkpXG4gICAgICAgIC50ZXh0KHRoaXMub3B0aW9ucy50aXBUZXh0KVxuICAgICAgICAuaGlkZSgpO1xuICAgIH1cblxuICAgIHRoaXMuJGVsZW1lbnQuYXR0cih7XG4gICAgICAndGl0bGUnOiAnJyxcbiAgICAgICdhcmlhLWRlc2NyaWJlZGJ5JzogZWxlbUlkLFxuICAgICAgJ2RhdGEteWV0aS1ib3gnOiBlbGVtSWQsXG4gICAgICAnZGF0YS10b2dnbGUnOiBlbGVtSWQsXG4gICAgICAnZGF0YS1yZXNpemUnOiBlbGVtSWRcbiAgICB9KS5hZGRDbGFzcyh0aGlzLm9wdGlvbnMudHJpZ2dlckNsYXNzKTtcblxuICAgIC8vaGVscGVyIHZhcmlhYmxlcyB0byB0cmFjayBtb3ZlbWVudCBvbiBjb2xsaXNpb25zXG4gICAgdGhpcy51c2VkUG9zaXRpb25zID0gW107XG4gICAgdGhpcy5jb3VudGVyID0gNDtcbiAgICB0aGlzLmNsYXNzQ2hhbmdlZCA9IGZhbHNlO1xuXG4gICAgdGhpcy5fZXZlbnRzKCk7XG4gIH1cblxuICAvKipcbiAgICogR3JhYnMgdGhlIGN1cnJlbnQgcG9zaXRpb25pbmcgY2xhc3MsIGlmIHByZXNlbnQsIGFuZCByZXR1cm5zIHRoZSB2YWx1ZSBvciBhbiBlbXB0eSBzdHJpbmcuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfZ2V0UG9zaXRpb25DbGFzcyhlbGVtZW50KSB7XG4gICAgaWYgKCFlbGVtZW50KSB7IHJldHVybiAnJzsgfVxuICAgIC8vIHZhciBwb3NpdGlvbiA9IGVsZW1lbnQuYXR0cignY2xhc3MnKS5tYXRjaCgvdG9wfGxlZnR8cmlnaHQvZyk7XG4gICAgdmFyIHBvc2l0aW9uID0gZWxlbWVudFswXS5jbGFzc05hbWUubWF0Y2goL1xcYih0b3B8bGVmdHxyaWdodClcXGIvZyk7XG4gICAgICAgIHBvc2l0aW9uID0gcG9zaXRpb24gPyBwb3NpdGlvblswXSA6ICcnO1xuICAgIHJldHVybiBwb3NpdGlvbjtcbiAgfTtcbiAgLyoqXG4gICAqIGJ1aWxkcyB0aGUgdG9vbHRpcCBlbGVtZW50LCBhZGRzIGF0dHJpYnV0ZXMsIGFuZCByZXR1cm5zIHRoZSB0ZW1wbGF0ZS5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9idWlsZFRlbXBsYXRlKGlkKSB7XG4gICAgdmFyIHRlbXBsYXRlQ2xhc3NlcyA9IChgJHt0aGlzLm9wdGlvbnMudG9vbHRpcENsYXNzfSAke3RoaXMub3B0aW9ucy5wb3NpdGlvbkNsYXNzfSAke3RoaXMub3B0aW9ucy50ZW1wbGF0ZUNsYXNzZXN9YCkudHJpbSgpO1xuICAgIHZhciAkdGVtcGxhdGUgPSAgJCgnPGRpdj48L2Rpdj4nKS5hZGRDbGFzcyh0ZW1wbGF0ZUNsYXNzZXMpLmF0dHIoe1xuICAgICAgJ3JvbGUnOiAndG9vbHRpcCcsXG4gICAgICAnYXJpYS1oaWRkZW4nOiB0cnVlLFxuICAgICAgJ2RhdGEtaXMtYWN0aXZlJzogZmFsc2UsXG4gICAgICAnZGF0YS1pcy1mb2N1cyc6IGZhbHNlLFxuICAgICAgJ2lkJzogaWRcbiAgICB9KTtcbiAgICByZXR1cm4gJHRlbXBsYXRlO1xuICB9XG5cbiAgLyoqXG4gICAqIEZ1bmN0aW9uIHRoYXQgZ2V0cyBjYWxsZWQgaWYgYSBjb2xsaXNpb24gZXZlbnQgaXMgZGV0ZWN0ZWQuXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwb3NpdGlvbiAtIHBvc2l0aW9uaW5nIGNsYXNzIHRvIHRyeVxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX3JlcG9zaXRpb24ocG9zaXRpb24pIHtcbiAgICB0aGlzLnVzZWRQb3NpdGlvbnMucHVzaChwb3NpdGlvbiA/IHBvc2l0aW9uIDogJ2JvdHRvbScpO1xuXG4gICAgLy9kZWZhdWx0LCB0cnkgc3dpdGNoaW5nIHRvIG9wcG9zaXRlIHNpZGVcbiAgICBpZiAoIXBvc2l0aW9uICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZigndG9wJykgPCAwKSkge1xuICAgICAgdGhpcy50ZW1wbGF0ZS5hZGRDbGFzcygndG9wJyk7XG4gICAgfSBlbHNlIGlmIChwb3NpdGlvbiA9PT0gJ3RvcCcgJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCdib3R0b20nKSA8IDApKSB7XG4gICAgICB0aGlzLnRlbXBsYXRlLnJlbW92ZUNsYXNzKHBvc2l0aW9uKTtcbiAgICB9IGVsc2UgaWYgKHBvc2l0aW9uID09PSAnbGVmdCcgJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCdyaWdodCcpIDwgMCkpIHtcbiAgICAgIHRoaXMudGVtcGxhdGUucmVtb3ZlQ2xhc3MocG9zaXRpb24pXG4gICAgICAgICAgLmFkZENsYXNzKCdyaWdodCcpO1xuICAgIH0gZWxzZSBpZiAocG9zaXRpb24gPT09ICdyaWdodCcgJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCdsZWZ0JykgPCAwKSkge1xuICAgICAgdGhpcy50ZW1wbGF0ZS5yZW1vdmVDbGFzcyhwb3NpdGlvbilcbiAgICAgICAgICAuYWRkQ2xhc3MoJ2xlZnQnKTtcbiAgICB9XG5cbiAgICAvL2lmIGRlZmF1bHQgY2hhbmdlIGRpZG4ndCB3b3JrLCB0cnkgYm90dG9tIG9yIGxlZnQgZmlyc3RcbiAgICBlbHNlIGlmICghcG9zaXRpb24gJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCd0b3AnKSA+IC0xKSAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ2xlZnQnKSA8IDApKSB7XG4gICAgICB0aGlzLnRlbXBsYXRlLmFkZENsYXNzKCdsZWZ0Jyk7XG4gICAgfSBlbHNlIGlmIChwb3NpdGlvbiA9PT0gJ3RvcCcgJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCdib3R0b20nKSA+IC0xKSAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ2xlZnQnKSA8IDApKSB7XG4gICAgICB0aGlzLnRlbXBsYXRlLnJlbW92ZUNsYXNzKHBvc2l0aW9uKVxuICAgICAgICAgIC5hZGRDbGFzcygnbGVmdCcpO1xuICAgIH0gZWxzZSBpZiAocG9zaXRpb24gPT09ICdsZWZ0JyAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ3JpZ2h0JykgPiAtMSkgJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCdib3R0b20nKSA8IDApKSB7XG4gICAgICB0aGlzLnRlbXBsYXRlLnJlbW92ZUNsYXNzKHBvc2l0aW9uKTtcbiAgICB9IGVsc2UgaWYgKHBvc2l0aW9uID09PSAncmlnaHQnICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZignbGVmdCcpID4gLTEpICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZignYm90dG9tJykgPCAwKSkge1xuICAgICAgdGhpcy50ZW1wbGF0ZS5yZW1vdmVDbGFzcyhwb3NpdGlvbik7XG4gICAgfVxuICAgIC8vaWYgbm90aGluZyBjbGVhcmVkLCBzZXQgdG8gYm90dG9tXG4gICAgZWxzZSB7XG4gICAgICB0aGlzLnRlbXBsYXRlLnJlbW92ZUNsYXNzKHBvc2l0aW9uKTtcbiAgICB9XG4gICAgdGhpcy5jbGFzc0NoYW5nZWQgPSB0cnVlO1xuICAgIHRoaXMuY291bnRlci0tO1xuICB9XG5cbiAgLyoqXG4gICAqIHNldHMgdGhlIHBvc2l0aW9uIGNsYXNzIG9mIGFuIGVsZW1lbnQgYW5kIHJlY3Vyc2l2ZWx5IGNhbGxzIGl0c2VsZiB1bnRpbCB0aGVyZSBhcmUgbm8gbW9yZSBwb3NzaWJsZSBwb3NpdGlvbnMgdG8gYXR0ZW1wdCwgb3IgdGhlIHRvb2x0aXAgZWxlbWVudCBpcyBubyBsb25nZXIgY29sbGlkaW5nLlxuICAgKiBpZiB0aGUgdG9vbHRpcCBpcyBsYXJnZXIgdGhhbiB0aGUgc2NyZWVuIHdpZHRoLCBkZWZhdWx0IHRvIGZ1bGwgd2lkdGggLSBhbnkgdXNlciBzZWxlY3RlZCBtYXJnaW5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9zZXRQb3NpdGlvbigpIHtcbiAgICB2YXIgcG9zaXRpb24gPSB0aGlzLl9nZXRQb3NpdGlvbkNsYXNzKHRoaXMudGVtcGxhdGUpLFxuICAgICAgICAkdGlwRGltcyA9IEZvdW5kYXRpb24uQm94LkdldERpbWVuc2lvbnModGhpcy50ZW1wbGF0ZSksXG4gICAgICAgICRhbmNob3JEaW1zID0gRm91bmRhdGlvbi5Cb3guR2V0RGltZW5zaW9ucyh0aGlzLiRlbGVtZW50KSxcbiAgICAgICAgZGlyZWN0aW9uID0gKHBvc2l0aW9uID09PSAnbGVmdCcgPyAnbGVmdCcgOiAoKHBvc2l0aW9uID09PSAncmlnaHQnKSA/ICdsZWZ0JyA6ICd0b3AnKSksXG4gICAgICAgIHBhcmFtID0gKGRpcmVjdGlvbiA9PT0gJ3RvcCcpID8gJ2hlaWdodCcgOiAnd2lkdGgnLFxuICAgICAgICBvZmZzZXQgPSAocGFyYW0gPT09ICdoZWlnaHQnKSA/IHRoaXMub3B0aW9ucy52T2Zmc2V0IDogdGhpcy5vcHRpb25zLmhPZmZzZXQsXG4gICAgICAgIF90aGlzID0gdGhpcztcblxuICAgIGlmICgoJHRpcERpbXMud2lkdGggPj0gJHRpcERpbXMud2luZG93RGltcy53aWR0aCkgfHwgKCF0aGlzLmNvdW50ZXIgJiYgIUZvdW5kYXRpb24uQm94LkltTm90VG91Y2hpbmdZb3UodGhpcy50ZW1wbGF0ZSkpKSB7XG4gICAgICB0aGlzLnRlbXBsYXRlLm9mZnNldChGb3VuZGF0aW9uLkJveC5HZXRPZmZzZXRzKHRoaXMudGVtcGxhdGUsIHRoaXMuJGVsZW1lbnQsICdjZW50ZXIgYm90dG9tJywgdGhpcy5vcHRpb25zLnZPZmZzZXQsIHRoaXMub3B0aW9ucy5oT2Zmc2V0LCB0cnVlKSkuY3NzKHtcbiAgICAgIC8vIHRoaXMuJGVsZW1lbnQub2Zmc2V0KEZvdW5kYXRpb24uR2V0T2Zmc2V0cyh0aGlzLnRlbXBsYXRlLCB0aGlzLiRlbGVtZW50LCAnY2VudGVyIGJvdHRvbScsIHRoaXMub3B0aW9ucy52T2Zmc2V0LCB0aGlzLm9wdGlvbnMuaE9mZnNldCwgdHJ1ZSkpLmNzcyh7XG4gICAgICAgICd3aWR0aCc6ICRhbmNob3JEaW1zLndpbmRvd0RpbXMud2lkdGggLSAodGhpcy5vcHRpb25zLmhPZmZzZXQgKiAyKSxcbiAgICAgICAgJ2hlaWdodCc6ICdhdXRvJ1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgdGhpcy50ZW1wbGF0ZS5vZmZzZXQoRm91bmRhdGlvbi5Cb3guR2V0T2Zmc2V0cyh0aGlzLnRlbXBsYXRlLCB0aGlzLiRlbGVtZW50LCdjZW50ZXIgJyArIChwb3NpdGlvbiB8fCAnYm90dG9tJyksIHRoaXMub3B0aW9ucy52T2Zmc2V0LCB0aGlzLm9wdGlvbnMuaE9mZnNldCkpO1xuXG4gICAgd2hpbGUoIUZvdW5kYXRpb24uQm94LkltTm90VG91Y2hpbmdZb3UodGhpcy50ZW1wbGF0ZSkgJiYgdGhpcy5jb3VudGVyKSB7XG4gICAgICB0aGlzLl9yZXBvc2l0aW9uKHBvc2l0aW9uKTtcbiAgICAgIHRoaXMuX3NldFBvc2l0aW9uKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIHJldmVhbHMgdGhlIHRvb2x0aXAsIGFuZCBmaXJlcyBhbiBldmVudCB0byBjbG9zZSBhbnkgb3RoZXIgb3BlbiB0b29sdGlwcyBvbiB0aGUgcGFnZVxuICAgKiBAZmlyZXMgVG9vbHRpcCNjbG9zZW1lXG4gICAqIEBmaXJlcyBUb29sdGlwI3Nob3dcbiAgICogQGZ1bmN0aW9uXG4gICAqL1xuICBzaG93KCkge1xuICAgIGlmICh0aGlzLm9wdGlvbnMuc2hvd09uICE9PSAnYWxsJyAmJiAhRm91bmRhdGlvbi5NZWRpYVF1ZXJ5LmlzKHRoaXMub3B0aW9ucy5zaG93T24pKSB7XG4gICAgICAvLyBjb25zb2xlLmVycm9yKCdUaGUgc2NyZWVuIGlzIHRvbyBzbWFsbCB0byBkaXNwbGF5IHRoaXMgdG9vbHRpcCcpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgdGhpcy50ZW1wbGF0ZS5jc3MoJ3Zpc2liaWxpdHknLCAnaGlkZGVuJykuc2hvdygpO1xuICAgIHRoaXMuX3NldFBvc2l0aW9uKCk7XG5cbiAgICAvKipcbiAgICAgKiBGaXJlcyB0byBjbG9zZSBhbGwgb3RoZXIgb3BlbiB0b29sdGlwcyBvbiB0aGUgcGFnZVxuICAgICAqIEBldmVudCBDbG9zZW1lI3Rvb2x0aXBcbiAgICAgKi9cbiAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ2Nsb3NlbWUuemYudG9vbHRpcCcsIHRoaXMudGVtcGxhdGUuYXR0cignaWQnKSk7XG5cblxuICAgIHRoaXMudGVtcGxhdGUuYXR0cih7XG4gICAgICAnZGF0YS1pcy1hY3RpdmUnOiB0cnVlLFxuICAgICAgJ2FyaWEtaGlkZGVuJzogZmFsc2VcbiAgICB9KTtcbiAgICBfdGhpcy5pc0FjdGl2ZSA9IHRydWU7XG4gICAgLy8gY29uc29sZS5sb2codGhpcy50ZW1wbGF0ZSk7XG4gICAgdGhpcy50ZW1wbGF0ZS5zdG9wKCkuaGlkZSgpLmNzcygndmlzaWJpbGl0eScsICcnKS5mYWRlSW4odGhpcy5vcHRpb25zLmZhZGVJbkR1cmF0aW9uLCBmdW5jdGlvbigpIHtcbiAgICAgIC8vbWF5YmUgZG8gc3R1ZmY/XG4gICAgfSk7XG4gICAgLyoqXG4gICAgICogRmlyZXMgd2hlbiB0aGUgdG9vbHRpcCBpcyBzaG93blxuICAgICAqIEBldmVudCBUb29sdGlwI3Nob3dcbiAgICAgKi9cbiAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ3Nob3cuemYudG9vbHRpcCcpO1xuICB9XG5cbiAgLyoqXG4gICAqIEhpZGVzIHRoZSBjdXJyZW50IHRvb2x0aXAsIGFuZCByZXNldHMgdGhlIHBvc2l0aW9uaW5nIGNsYXNzIGlmIGl0IHdhcyBjaGFuZ2VkIGR1ZSB0byBjb2xsaXNpb25cbiAgICogQGZpcmVzIFRvb2x0aXAjaGlkZVxuICAgKiBAZnVuY3Rpb25cbiAgICovXG4gIGhpZGUoKSB7XG4gICAgLy8gY29uc29sZS5sb2coJ2hpZGluZycsIHRoaXMuJGVsZW1lbnQuZGF0YSgneWV0aS1ib3gnKSk7XG4gICAgdmFyIF90aGlzID0gdGhpcztcbiAgICB0aGlzLnRlbXBsYXRlLnN0b3AoKS5hdHRyKHtcbiAgICAgICdhcmlhLWhpZGRlbic6IHRydWUsXG4gICAgICAnZGF0YS1pcy1hY3RpdmUnOiBmYWxzZVxuICAgIH0pLmZhZGVPdXQodGhpcy5vcHRpb25zLmZhZGVPdXREdXJhdGlvbiwgZnVuY3Rpb24oKSB7XG4gICAgICBfdGhpcy5pc0FjdGl2ZSA9IGZhbHNlO1xuICAgICAgX3RoaXMuaXNDbGljayA9IGZhbHNlO1xuICAgICAgaWYgKF90aGlzLmNsYXNzQ2hhbmdlZCkge1xuICAgICAgICBfdGhpcy50ZW1wbGF0ZVxuICAgICAgICAgICAgIC5yZW1vdmVDbGFzcyhfdGhpcy5fZ2V0UG9zaXRpb25DbGFzcyhfdGhpcy50ZW1wbGF0ZSkpXG4gICAgICAgICAgICAgLmFkZENsYXNzKF90aGlzLm9wdGlvbnMucG9zaXRpb25DbGFzcyk7XG5cbiAgICAgICBfdGhpcy51c2VkUG9zaXRpb25zID0gW107XG4gICAgICAgX3RoaXMuY291bnRlciA9IDQ7XG4gICAgICAgX3RoaXMuY2xhc3NDaGFuZ2VkID0gZmFsc2U7XG4gICAgICB9XG4gICAgfSk7XG4gICAgLyoqXG4gICAgICogZmlyZXMgd2hlbiB0aGUgdG9vbHRpcCBpcyBoaWRkZW5cbiAgICAgKiBAZXZlbnQgVG9vbHRpcCNoaWRlXG4gICAgICovXG4gICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdoaWRlLnpmLnRvb2x0aXAnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBhZGRzIGV2ZW50IGxpc3RlbmVycyBmb3IgdGhlIHRvb2x0aXAgYW5kIGl0cyBhbmNob3JcbiAgICogVE9ETyBjb21iaW5lIHNvbWUgb2YgdGhlIGxpc3RlbmVycyBsaWtlIGZvY3VzIGFuZCBtb3VzZWVudGVyLCBldGMuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfZXZlbnRzKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgdmFyICR0ZW1wbGF0ZSA9IHRoaXMudGVtcGxhdGU7XG4gICAgdmFyIGlzRm9jdXMgPSBmYWxzZTtcblxuICAgIGlmICghdGhpcy5vcHRpb25zLmRpc2FibGVIb3Zlcikge1xuXG4gICAgICB0aGlzLiRlbGVtZW50XG4gICAgICAub24oJ21vdXNlZW50ZXIuemYudG9vbHRpcCcsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgaWYgKCFfdGhpcy5pc0FjdGl2ZSkge1xuICAgICAgICAgIF90aGlzLnRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgX3RoaXMuc2hvdygpO1xuICAgICAgICAgIH0sIF90aGlzLm9wdGlvbnMuaG92ZXJEZWxheSk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAub24oJ21vdXNlbGVhdmUuemYudG9vbHRpcCcsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KF90aGlzLnRpbWVvdXQpO1xuICAgICAgICBpZiAoIWlzRm9jdXMgfHwgKF90aGlzLmlzQ2xpY2sgJiYgIV90aGlzLm9wdGlvbnMuY2xpY2tPcGVuKSkge1xuICAgICAgICAgIF90aGlzLmhpZGUoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5jbGlja09wZW4pIHtcbiAgICAgIHRoaXMuJGVsZW1lbnQub24oJ21vdXNlZG93bi56Zi50b29sdGlwJywgZnVuY3Rpb24oZSkge1xuICAgICAgICBlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuICAgICAgICBpZiAoX3RoaXMuaXNDbGljaykge1xuICAgICAgICAgIC8vX3RoaXMuaGlkZSgpO1xuICAgICAgICAgIC8vIF90aGlzLmlzQ2xpY2sgPSBmYWxzZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBfdGhpcy5pc0NsaWNrID0gdHJ1ZTtcbiAgICAgICAgICBpZiAoKF90aGlzLm9wdGlvbnMuZGlzYWJsZUhvdmVyIHx8ICFfdGhpcy4kZWxlbWVudC5hdHRyKCd0YWJpbmRleCcpKSAmJiAhX3RoaXMuaXNBY3RpdmUpIHtcbiAgICAgICAgICAgIF90aGlzLnNob3coKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLiRlbGVtZW50Lm9uKCdtb3VzZWRvd24uemYudG9vbHRpcCcsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICAgICAgX3RoaXMuaXNDbGljayA9IHRydWU7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMub3B0aW9ucy5kaXNhYmxlRm9yVG91Y2gpIHtcbiAgICAgIHRoaXMuJGVsZW1lbnRcbiAgICAgIC5vbigndGFwLnpmLnRvb2x0aXAgdG91Y2hlbmQuemYudG9vbHRpcCcsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgX3RoaXMuaXNBY3RpdmUgPyBfdGhpcy5oaWRlKCkgOiBfdGhpcy5zaG93KCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICB0aGlzLiRlbGVtZW50Lm9uKHtcbiAgICAgIC8vICd0b2dnbGUuemYudHJpZ2dlcic6IHRoaXMudG9nZ2xlLmJpbmQodGhpcyksXG4gICAgICAvLyAnY2xvc2UuemYudHJpZ2dlcic6IHRoaXMuaGlkZS5iaW5kKHRoaXMpXG4gICAgICAnY2xvc2UuemYudHJpZ2dlcic6IHRoaXMuaGlkZS5iaW5kKHRoaXMpXG4gICAgfSk7XG5cbiAgICB0aGlzLiRlbGVtZW50XG4gICAgICAub24oJ2ZvY3VzLnpmLnRvb2x0aXAnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIGlzRm9jdXMgPSB0cnVlO1xuICAgICAgICBpZiAoX3RoaXMuaXNDbGljaykge1xuICAgICAgICAgIC8vIElmIHdlJ3JlIG5vdCBzaG93aW5nIG9wZW4gb24gY2xpY2tzLCB3ZSBuZWVkIHRvIHByZXRlbmQgYSBjbGljay1sYXVuY2hlZCBmb2N1cyBpc24ndFxuICAgICAgICAgIC8vIGEgcmVhbCBmb2N1cywgb3RoZXJ3aXNlIG9uIGhvdmVyIGFuZCBjb21lIGJhY2sgd2UgZ2V0IGJhZCBiZWhhdmlvclxuICAgICAgICAgIGlmKCFfdGhpcy5vcHRpb25zLmNsaWNrT3BlbikgeyBpc0ZvY3VzID0gZmFsc2U7IH1cbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgX3RoaXMuc2hvdygpO1xuICAgICAgICB9XG4gICAgICB9KVxuXG4gICAgICAub24oJ2ZvY3Vzb3V0LnpmLnRvb2x0aXAnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIGlzRm9jdXMgPSBmYWxzZTtcbiAgICAgICAgX3RoaXMuaXNDbGljayA9IGZhbHNlO1xuICAgICAgICBfdGhpcy5oaWRlKCk7XG4gICAgICB9KVxuXG4gICAgICAub24oJ3Jlc2l6ZW1lLnpmLnRyaWdnZXInLCBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKF90aGlzLmlzQWN0aXZlKSB7XG4gICAgICAgICAgX3RoaXMuX3NldFBvc2l0aW9uKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIGFkZHMgYSB0b2dnbGUgbWV0aG9kLCBpbiBhZGRpdGlvbiB0byB0aGUgc3RhdGljIHNob3coKSAmIGhpZGUoKSBmdW5jdGlvbnNcbiAgICogQGZ1bmN0aW9uXG4gICAqL1xuICB0b2dnbGUoKSB7XG4gICAgaWYgKHRoaXMuaXNBY3RpdmUpIHtcbiAgICAgIHRoaXMuaGlkZSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnNob3coKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRGVzdHJveXMgYW4gaW5zdGFuY2Ugb2YgdG9vbHRpcCwgcmVtb3ZlcyB0ZW1wbGF0ZSBlbGVtZW50IGZyb20gdGhlIHZpZXcuXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgZGVzdHJveSgpIHtcbiAgICB0aGlzLiRlbGVtZW50LmF0dHIoJ3RpdGxlJywgdGhpcy50ZW1wbGF0ZS50ZXh0KCkpXG4gICAgICAgICAgICAgICAgIC5vZmYoJy56Zi50cmlnZ2VyIC56Zi50b29sdGlwJylcbiAgICAgICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCdoYXMtdGlwIHRvcCByaWdodCBsZWZ0JylcbiAgICAgICAgICAgICAgICAgLnJlbW92ZUF0dHIoJ2FyaWEtZGVzY3JpYmVkYnkgYXJpYS1oYXNwb3B1cCBkYXRhLWRpc2FibGUtaG92ZXIgZGF0YS1yZXNpemUgZGF0YS10b2dnbGUgZGF0YS10b29sdGlwIGRhdGEteWV0aS1ib3gnKTtcblxuICAgIHRoaXMudGVtcGxhdGUucmVtb3ZlKCk7XG5cbiAgICBGb3VuZGF0aW9uLnVucmVnaXN0ZXJQbHVnaW4odGhpcyk7XG4gIH1cbn1cblxuVG9vbHRpcC5kZWZhdWx0cyA9IHtcbiAgZGlzYWJsZUZvclRvdWNoOiBmYWxzZSxcbiAgLyoqXG4gICAqIFRpbWUsIGluIG1zLCBiZWZvcmUgYSB0b29sdGlwIHNob3VsZCBvcGVuIG9uIGhvdmVyLlxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHtudW1iZXJ9XG4gICAqIEBkZWZhdWx0IDIwMFxuICAgKi9cbiAgaG92ZXJEZWxheTogMjAwLFxuICAvKipcbiAgICogVGltZSwgaW4gbXMsIGEgdG9vbHRpcCBzaG91bGQgdGFrZSB0byBmYWRlIGludG8gdmlldy5cbiAgICogQG9wdGlvblxuICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgKiBAZGVmYXVsdCAxNTBcbiAgICovXG4gIGZhZGVJbkR1cmF0aW9uOiAxNTAsXG4gIC8qKlxuICAgKiBUaW1lLCBpbiBtcywgYSB0b29sdGlwIHNob3VsZCB0YWtlIHRvIGZhZGUgb3V0IG9mIHZpZXcuXG4gICAqIEBvcHRpb25cbiAgICogQHR5cGUge251bWJlcn1cbiAgICogQGRlZmF1bHQgMTUwXG4gICAqL1xuICBmYWRlT3V0RHVyYXRpb246IDE1MCxcbiAgLyoqXG4gICAqIERpc2FibGVzIGhvdmVyIGV2ZW50cyBmcm9tIG9wZW5pbmcgdGhlIHRvb2x0aXAgaWYgc2V0IHRvIHRydWVcbiAgICogQG9wdGlvblxuICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICogQGRlZmF1bHQgZmFsc2VcbiAgICovXG4gIGRpc2FibGVIb3ZlcjogZmFsc2UsXG4gIC8qKlxuICAgKiBPcHRpb25hbCBhZGR0aW9uYWwgY2xhc3NlcyB0byBhcHBseSB0byB0aGUgdG9vbHRpcCB0ZW1wbGF0ZSBvbiBpbml0LlxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHtzdHJpbmd9XG4gICAqIEBkZWZhdWx0ICcnXG4gICAqL1xuICB0ZW1wbGF0ZUNsYXNzZXM6ICcnLFxuICAvKipcbiAgICogTm9uLW9wdGlvbmFsIGNsYXNzIGFkZGVkIHRvIHRvb2x0aXAgdGVtcGxhdGVzLiBGb3VuZGF0aW9uIGRlZmF1bHQgaXMgJ3Rvb2x0aXAnLlxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHtzdHJpbmd9XG4gICAqIEBkZWZhdWx0ICd0b29sdGlwJ1xuICAgKi9cbiAgdG9vbHRpcENsYXNzOiAndG9vbHRpcCcsXG4gIC8qKlxuICAgKiBDbGFzcyBhcHBsaWVkIHRvIHRoZSB0b29sdGlwIGFuY2hvciBlbGVtZW50LlxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHtzdHJpbmd9XG4gICAqIEBkZWZhdWx0ICdoYXMtdGlwJ1xuICAgKi9cbiAgdHJpZ2dlckNsYXNzOiAnaGFzLXRpcCcsXG4gIC8qKlxuICAgKiBNaW5pbXVtIGJyZWFrcG9pbnQgc2l6ZSBhdCB3aGljaCB0byBvcGVuIHRoZSB0b29sdGlwLlxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHtzdHJpbmd9XG4gICAqIEBkZWZhdWx0ICdzbWFsbCdcbiAgICovXG4gIHNob3dPbjogJ3NtYWxsJyxcbiAgLyoqXG4gICAqIEN1c3RvbSB0ZW1wbGF0ZSB0byBiZSB1c2VkIHRvIGdlbmVyYXRlIG1hcmt1cCBmb3IgdG9vbHRpcC5cbiAgICogQG9wdGlvblxuICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgKiBAZGVmYXVsdCAnJ1xuICAgKi9cbiAgdGVtcGxhdGU6ICcnLFxuICAvKipcbiAgICogVGV4dCBkaXNwbGF5ZWQgaW4gdGhlIHRvb2x0aXAgdGVtcGxhdGUgb24gb3Blbi5cbiAgICogQG9wdGlvblxuICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgKiBAZGVmYXVsdCAnJ1xuICAgKi9cbiAgdGlwVGV4dDogJycsXG4gIHRvdWNoQ2xvc2VUZXh0OiAnVGFwIHRvIGNsb3NlLicsXG4gIC8qKlxuICAgKiBBbGxvd3MgdGhlIHRvb2x0aXAgdG8gcmVtYWluIG9wZW4gaWYgdHJpZ2dlcmVkIHdpdGggYSBjbGljayBvciB0b3VjaCBldmVudC5cbiAgICogQG9wdGlvblxuICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICogQGRlZmF1bHQgdHJ1ZVxuICAgKi9cbiAgY2xpY2tPcGVuOiB0cnVlLFxuICAvKipcbiAgICogQWRkaXRpb25hbCBwb3NpdGlvbmluZyBjbGFzc2VzLCBzZXQgYnkgdGhlIEpTXG4gICAqIEBvcHRpb25cbiAgICogQHR5cGUge3N0cmluZ31cbiAgICogQGRlZmF1bHQgJydcbiAgICovXG4gIHBvc2l0aW9uQ2xhc3M6ICcnLFxuICAvKipcbiAgICogRGlzdGFuY2UsIGluIHBpeGVscywgdGhlIHRlbXBsYXRlIHNob3VsZCBwdXNoIGF3YXkgZnJvbSB0aGUgYW5jaG9yIG9uIHRoZSBZIGF4aXMuXG4gICAqIEBvcHRpb25cbiAgICogQHR5cGUge251bWJlcn1cbiAgICogQGRlZmF1bHQgMTBcbiAgICovXG4gIHZPZmZzZXQ6IDEwLFxuICAvKipcbiAgICogRGlzdGFuY2UsIGluIHBpeGVscywgdGhlIHRlbXBsYXRlIHNob3VsZCBwdXNoIGF3YXkgZnJvbSB0aGUgYW5jaG9yIG9uIHRoZSBYIGF4aXMsIGlmIGFsaWduZWQgdG8gYSBzaWRlLlxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHtudW1iZXJ9XG4gICAqIEBkZWZhdWx0IDEyXG4gICAqL1xuICBoT2Zmc2V0OiAxMixcbiAgICAvKipcbiAgICogQWxsb3cgSFRNTCBpbiB0b29sdGlwLiBXYXJuaW5nOiBJZiB5b3UgYXJlIGxvYWRpbmcgdXNlci1nZW5lcmF0ZWQgY29udGVudCBpbnRvIHRvb2x0aXBzLFxuICAgKiBhbGxvd2luZyBIVE1MIG1heSBvcGVuIHlvdXJzZWxmIHVwIHRvIFhTUyBhdHRhY2tzLlxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHtib29sZWFufVxuICAgKiBAZGVmYXVsdCBmYWxzZVxuICAgKi9cbiAgYWxsb3dIdG1sOiBmYWxzZVxufTtcblxuLyoqXG4gKiBUT0RPIHV0aWxpemUgcmVzaXplIGV2ZW50IHRyaWdnZXJcbiAqL1xuXG4vLyBXaW5kb3cgZXhwb3J0c1xuRm91bmRhdGlvbi5wbHVnaW4oVG9vbHRpcCwgJ1Rvb2x0aXAnKTtcblxufShqUXVlcnkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vLyBQb2x5ZmlsbCBmb3IgcmVxdWVzdEFuaW1hdGlvbkZyYW1lXG4oZnVuY3Rpb24oKSB7XG4gIGlmICghRGF0ZS5ub3cpXG4gICAgRGF0ZS5ub3cgPSBmdW5jdGlvbigpIHsgcmV0dXJuIG5ldyBEYXRlKCkuZ2V0VGltZSgpOyB9O1xuXG4gIHZhciB2ZW5kb3JzID0gWyd3ZWJraXQnLCAnbW96J107XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdmVuZG9ycy5sZW5ndGggJiYgIXdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWU7ICsraSkge1xuICAgICAgdmFyIHZwID0gdmVuZG9yc1tpXTtcbiAgICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSB3aW5kb3dbdnArJ1JlcXVlc3RBbmltYXRpb25GcmFtZSddO1xuICAgICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lID0gKHdpbmRvd1t2cCsnQ2FuY2VsQW5pbWF0aW9uRnJhbWUnXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfHwgd2luZG93W3ZwKydDYW5jZWxSZXF1ZXN0QW5pbWF0aW9uRnJhbWUnXSk7XG4gIH1cbiAgaWYgKC9pUChhZHxob25lfG9kKS4qT1MgNi8udGVzdCh3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudClcbiAgICB8fCAhd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCAhd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKSB7XG4gICAgdmFyIGxhc3RUaW1lID0gMDtcbiAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIG5vdyA9IERhdGUubm93KCk7XG4gICAgICAgIHZhciBuZXh0VGltZSA9IE1hdGgubWF4KGxhc3RUaW1lICsgMTYsIG5vdyk7XG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyBjYWxsYmFjayhsYXN0VGltZSA9IG5leHRUaW1lKTsgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbmV4dFRpbWUgLSBub3cpO1xuICAgIH07XG4gICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lID0gY2xlYXJUaW1lb3V0O1xuICB9XG59KSgpO1xuXG52YXIgaW5pdENsYXNzZXMgICA9IFsnbXVpLWVudGVyJywgJ211aS1sZWF2ZSddO1xudmFyIGFjdGl2ZUNsYXNzZXMgPSBbJ211aS1lbnRlci1hY3RpdmUnLCAnbXVpLWxlYXZlLWFjdGl2ZSddO1xuXG4vLyBGaW5kIHRoZSByaWdodCBcInRyYW5zaXRpb25lbmRcIiBldmVudCBmb3IgdGhpcyBicm93c2VyXG52YXIgZW5kRXZlbnQgPSAoZnVuY3Rpb24oKSB7XG4gIHZhciB0cmFuc2l0aW9ucyA9IHtcbiAgICAndHJhbnNpdGlvbic6ICd0cmFuc2l0aW9uZW5kJyxcbiAgICAnV2Via2l0VHJhbnNpdGlvbic6ICd3ZWJraXRUcmFuc2l0aW9uRW5kJyxcbiAgICAnTW96VHJhbnNpdGlvbic6ICd0cmFuc2l0aW9uZW5kJyxcbiAgICAnT1RyYW5zaXRpb24nOiAnb3RyYW5zaXRpb25lbmQnXG4gIH1cbiAgdmFyIGVsZW0gPSB3aW5kb3cuZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cbiAgZm9yICh2YXIgdCBpbiB0cmFuc2l0aW9ucykge1xuICAgIGlmICh0eXBlb2YgZWxlbS5zdHlsZVt0XSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHJldHVybiB0cmFuc2l0aW9uc1t0XTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn0pKCk7XG5cbmZ1bmN0aW9uIGFuaW1hdGUoaXNJbiwgZWxlbWVudCwgYW5pbWF0aW9uLCBjYikge1xuICBlbGVtZW50ID0gJChlbGVtZW50KS5lcSgwKTtcblxuICBpZiAoIWVsZW1lbnQubGVuZ3RoKSByZXR1cm47XG5cbiAgaWYgKGVuZEV2ZW50ID09PSBudWxsKSB7XG4gICAgaXNJbiA/IGVsZW1lbnQuc2hvdygpIDogZWxlbWVudC5oaWRlKCk7XG4gICAgY2IoKTtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgaW5pdENsYXNzID0gaXNJbiA/IGluaXRDbGFzc2VzWzBdIDogaW5pdENsYXNzZXNbMV07XG4gIHZhciBhY3RpdmVDbGFzcyA9IGlzSW4gPyBhY3RpdmVDbGFzc2VzWzBdIDogYWN0aXZlQ2xhc3Nlc1sxXTtcblxuICAvLyBTZXQgdXAgdGhlIGFuaW1hdGlvblxuICByZXNldCgpO1xuICBlbGVtZW50LmFkZENsYXNzKGFuaW1hdGlvbik7XG4gIGVsZW1lbnQuY3NzKCd0cmFuc2l0aW9uJywgJ25vbmUnKTtcbiAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGZ1bmN0aW9uKCkge1xuICAgIGVsZW1lbnQuYWRkQ2xhc3MoaW5pdENsYXNzKTtcbiAgICBpZiAoaXNJbikgZWxlbWVudC5zaG93KCk7XG4gIH0pO1xuXG4gIC8vIFN0YXJ0IHRoZSBhbmltYXRpb25cbiAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGZ1bmN0aW9uKCkge1xuICAgIGVsZW1lbnRbMF0ub2Zmc2V0V2lkdGg7XG4gICAgZWxlbWVudC5jc3MoJ3RyYW5zaXRpb24nLCAnJyk7XG4gICAgZWxlbWVudC5hZGRDbGFzcyhhY3RpdmVDbGFzcyk7XG4gIH0pO1xuXG4gIC8vIENsZWFuIHVwIHRoZSBhbmltYXRpb24gd2hlbiBpdCBmaW5pc2hlc1xuICBlbGVtZW50Lm9uZSgndHJhbnNpdGlvbmVuZCcsIGZpbmlzaCk7XG5cbiAgLy8gSGlkZXMgdGhlIGVsZW1lbnQgKGZvciBvdXQgYW5pbWF0aW9ucyksIHJlc2V0cyB0aGUgZWxlbWVudCwgYW5kIHJ1bnMgYSBjYWxsYmFja1xuICBmdW5jdGlvbiBmaW5pc2goKSB7XG4gICAgaWYgKCFpc0luKSBlbGVtZW50LmhpZGUoKTtcbiAgICByZXNldCgpO1xuICAgIGlmIChjYikgY2IuYXBwbHkoZWxlbWVudCk7XG4gIH1cblxuICAvLyBSZXNldHMgdHJhbnNpdGlvbnMgYW5kIHJlbW92ZXMgbW90aW9uLXNwZWNpZmljIGNsYXNzZXNcbiAgZnVuY3Rpb24gcmVzZXQoKSB7XG4gICAgZWxlbWVudFswXS5zdHlsZS50cmFuc2l0aW9uRHVyYXRpb24gPSAwO1xuICAgIGVsZW1lbnQucmVtb3ZlQ2xhc3MoaW5pdENsYXNzICsgJyAnICsgYWN0aXZlQ2xhc3MgKyAnICcgKyBhbmltYXRpb24pO1xuICB9XG59XG5cbnZhciBNb3Rpb25VSSA9IHtcbiAgYW5pbWF0ZUluOiBmdW5jdGlvbihlbGVtZW50LCBhbmltYXRpb24sIGNiKSB7XG4gICAgYW5pbWF0ZSh0cnVlLCBlbGVtZW50LCBhbmltYXRpb24sIGNiKTtcbiAgfSxcblxuICBhbmltYXRlT3V0OiBmdW5jdGlvbihlbGVtZW50LCBhbmltYXRpb24sIGNiKSB7XG4gICAgYW5pbWF0ZShmYWxzZSwgZWxlbWVudCwgYW5pbWF0aW9uLCBjYik7XG4gIH1cbn07XG4iLCIhZnVuY3Rpb24odCxpKXtcInVzZSBzdHJpY3RcIjtpZighaSl0aHJvdyBuZXcgRXJyb3IoXCJGaWx0ZXJpenIgcmVxdWlyZXMgalF1ZXJ5IHRvIHdvcmsuXCIpO3ZhciByPWZ1bmN0aW9uKHQpe3RoaXMuaW5pdCh0KX07ci5wcm90b3R5cGU9e2luaXQ6ZnVuY3Rpb24odCl7dGhpcy5yb290PXt4OjAseTowLHc6dH19LGZpdDpmdW5jdGlvbih0KXt2YXIgaSxyLG4sZT10Lmxlbmd0aCxvPWU+MD90WzBdLmg6MDtmb3IodGhpcy5yb290Lmg9byxpPTA7aTxlO2krKyluPXRbaV0sKHI9dGhpcy5maW5kTm9kZSh0aGlzLnJvb3Qsbi53LG4uaCkpP24uZml0PXRoaXMuc3BsaXROb2RlKHIsbi53LG4uaCk6bi5maXQ9dGhpcy5ncm93RG93bihuLncsbi5oKX0sZmluZE5vZGU6ZnVuY3Rpb24odCxpLHIpe3JldHVybiB0LnVzZWQ/dGhpcy5maW5kTm9kZSh0LnJpZ2h0LGkscil8fHRoaXMuZmluZE5vZGUodC5kb3duLGkscik6aTw9dC53JiZyPD10Lmg/dDpudWxsfSxzcGxpdE5vZGU6ZnVuY3Rpb24odCxpLHIpe3JldHVybiB0LnVzZWQ9ITAsdC5kb3duPXt4OnQueCx5OnQueStyLHc6dC53LGg6dC5oLXJ9LHQucmlnaHQ9e3g6dC54K2kseTp0Lnksdzp0LnctaSxoOnJ9LHR9LGdyb3dEb3duOmZ1bmN0aW9uKHQsaSl7dmFyIHI7cmV0dXJuIHRoaXMucm9vdD17dXNlZDohMCx4OjAseTowLHc6dGhpcy5yb290LncsaDp0aGlzLnJvb3QuaCtpLGRvd246e3g6MCx5OnRoaXMucm9vdC5oLHc6dGhpcy5yb290LncsaDppfSxyaWdodDp0aGlzLnJvb3R9LChyPXRoaXMuZmluZE5vZGUodGhpcy5yb290LHQsaSkpP3RoaXMuc3BsaXROb2RlKHIsdCxpKTpudWxsfX0saS5mbi5maWx0ZXJpenI9ZnVuY3Rpb24oKXt2YXIgdD10aGlzLHI9YXJndW1lbnRzO2lmKHQuX2ZsdHJ8fCh0Ll9mbHRyPWkuZm4uZmlsdGVyaXpyLnByb3RvdHlwZS5pbml0KHQsXCJvYmplY3RcIj09dHlwZW9mIHJbMF0/clswXTp2b2lkIDApKSxcInN0cmluZ1wiPT10eXBlb2YgclswXSl7aWYoclswXS5sYXN0SW5kZXhPZihcIl9cIik+LTEpdGhyb3cgbmV3IEVycm9yKFwiRmlsdGVyaXpyIGVycm9yOiBZb3UgY2Fubm90IGNhbGwgcHJpdmF0ZSBtZXRob2RzXCIpO2lmKFwiZnVuY3Rpb25cIiE9dHlwZW9mIHQuX2ZsdHJbclswXV0pdGhyb3cgbmV3IEVycm9yKFwiRmlsdGVyaXpyIGVycm9yOiBUaGVyZSBpcyBubyBzdWNoIGZ1bmN0aW9uXCIpO3QuX2ZsdHJbclswXV0oclsxXSxyWzJdKX1yZXR1cm4gdH0saS5mbi5maWx0ZXJpenIucHJvdG90eXBlPXtpbml0OmZ1bmN0aW9uKHQscil7dmFyIG49aSh0KS5leHRlbmQoaS5mbi5maWx0ZXJpenIucHJvdG90eXBlKTtyZXR1cm4gbi5vcHRpb25zPXthbmltYXRpb25EdXJhdGlvbjouNSxjYWxsYmFja3M6e29uRmlsdGVyaW5nU3RhcnQ6ZnVuY3Rpb24oKXt9LG9uRmlsdGVyaW5nRW5kOmZ1bmN0aW9uKCl7fSxvblNodWZmbGluZ1N0YXJ0OmZ1bmN0aW9uKCl7fSxvblNodWZmbGluZ0VuZDpmdW5jdGlvbigpe30sb25Tb3J0aW5nU3RhcnQ6ZnVuY3Rpb24oKXt9LG9uU29ydGluZ0VuZDpmdW5jdGlvbigpe319LGRlbGF5OjAsZGVsYXlNb2RlOlwicHJvZ3Jlc3NpdmVcIixlYXNpbmc6XCJlYXNlLW91dFwiLGZpbHRlcjpcImFsbFwiLGZpbHRlck91dENzczp7b3BhY2l0eTowLHRyYW5zZm9ybTpcInNjYWxlKDAuNSlcIn0sZmlsdGVySW5Dc3M6e29wYWNpdHk6MSx0cmFuc2Zvcm06XCJzY2FsZSgxKVwifSxsYXlvdXQ6XCJzYW1lU2l6ZVwiLHNldHVwQ29udHJvbHM6ITB9LDA9PT1hcmd1bWVudHMubGVuZ3RoJiYocj1uLm9wdGlvbnMpLDE9PT1hcmd1bWVudHMubGVuZ3RoJiZcIm9iamVjdFwiPT10eXBlb2YgYXJndW1lbnRzWzBdJiYocj1hcmd1bWVudHNbMF0pLHImJm4uc2V0T3B0aW9ucyhyKSxuLmNzcyh7cGFkZGluZzowLHBvc2l0aW9uOlwicmVsYXRpdmVcIn0pLG4uX2xhc3RDYXRlZ29yeT0wLG4uX2lzQW5pbWF0aW5nPSExLG4uX2lzU2h1ZmZsaW5nPSExLG4uX2lzU29ydGluZz0hMSxuLl9tYWluQXJyYXk9bi5fZ2V0RmlsdHJJdGVtcygpLG4uX3N1YkFycmF5cz1uLl9tYWtlU3ViYXJyYXlzKCksbi5fYWN0aXZlQXJyYXk9bi5fZ2V0Q29sbGVjdGlvbkJ5RmlsdGVyKG4ub3B0aW9ucy5maWx0ZXIpLG4uX3RvZ2dsZWRDYXRlZ29yaWVzPXt9LG4uX3R5cGVkVGV4dD1pKFwiaW5wdXRbZGF0YS1zZWFyY2hdXCIpLnZhbCgpfHxcIlwiLG4uX3VJRD1cInh4eHh4eHh4LXh4eHgtNHh4eC15eHh4LXh4eHh4eHh4eHh4eFwiLnJlcGxhY2UoL1t4eV0vZyxmdW5jdGlvbih0KXt2YXIgaT0xNipNYXRoLnJhbmRvbSgpfDA7cmV0dXJuKFwieFwiPT10P2k6MyZpfDgpLnRvU3RyaW5nKDE2KX0pLG4uX3NldHVwRXZlbnRzKCksbi5vcHRpb25zLnNldHVwQ29udHJvbHMmJm4uX3NldHVwQ29udHJvbHMoKSxuLmZpbHRlcihuLm9wdGlvbnMuZmlsdGVyKSxufSxmaWx0ZXI6ZnVuY3Rpb24odCl7dmFyIGk9dGhpcyxyPWkuX2dldENvbGxlY3Rpb25CeUZpbHRlcih0KTtpLm9wdGlvbnMuZmlsdGVyPXQsaS50cmlnZ2VyKFwiZmlsdGVyaW5nU3RhcnRcIiksaS5faGFuZGxlRmlsdGVyaW5nKHIpLGkuX2lzU2VhcmNoQWN0aXZhdGVkKCkmJmkuc2VhcmNoKGkuX3R5cGVkVGV4dCl9LHRvZ2dsZUZpbHRlcjpmdW5jdGlvbih0KXt2YXIgaT10aGlzLHI9W107aS50cmlnZ2VyKFwiZmlsdGVyaW5nU3RhcnRcIiksdCYmKGkuX3RvZ2dsZWRDYXRlZ29yaWVzW3RdP2RlbGV0ZSBpLl90b2dnbGVkQ2F0ZWdvcmllc1t0XTppLl90b2dnbGVkQ2F0ZWdvcmllc1t0XT0hMCksaS5fbXVsdGlmaWx0ZXJNb2RlT24oKT8ocj1pLl9tYWtlTXVsdGlmaWx0ZXJBcnJheSgpLGkuX2hhbmRsZUZpbHRlcmluZyhyKSxpLl9pc1NlYXJjaEFjdGl2YXRlZCgpJiZpLnNlYXJjaChpLl90eXBlZFRleHQpKTooaS5maWx0ZXIoXCJhbGxcIiksaS5faXNTZWFyY2hBY3RpdmF0ZWQoKSYmaS5zZWFyY2goaS5fdHlwZWRUZXh0KSl9LHNlYXJjaDpmdW5jdGlvbih0KXt2YXIgaT10aGlzLHI9aS5fbXVsdGlmaWx0ZXJNb2RlT24oKT9pLl9tYWtlTXVsdGlmaWx0ZXJBcnJheSgpOmkuX2dldENvbGxlY3Rpb25CeUZpbHRlcihpLm9wdGlvbnMuZmlsdGVyKSxuPVtdLGU9MDtpZihpLl9pc1NlYXJjaEFjdGl2YXRlZCgpKWZvcihlPTA7ZTxyLmxlbmd0aDtlKyspcltlXS50ZXh0KCkudG9Mb3dlckNhc2UoKS5pbmRleE9mKHQudG9Mb3dlckNhc2UoKSk+LTEmJm4ucHVzaChyW2VdKTtpZihuLmxlbmd0aD4wKWkuX2hhbmRsZUZpbHRlcmluZyhuKTtlbHNlIGlmKGkuX2lzU2VhcmNoQWN0aXZhdGVkKCkpZm9yKGU9MDtlPGkuX2FjdGl2ZUFycmF5Lmxlbmd0aDtlKyspaS5fYWN0aXZlQXJyYXlbZV0uX2ZpbHRlck91dCgpO2Vsc2UgaS5faGFuZGxlRmlsdGVyaW5nKHIpfSxzaHVmZmxlOmZ1bmN0aW9uKCl7dmFyIHQ9dGhpczt0Ll9pc0FuaW1hdGluZz0hMCx0Ll9pc1NodWZmbGluZz0hMCx0LnRyaWdnZXIoXCJzaHVmZmxpbmdTdGFydFwiKSx0Ll9tYWluQXJyYXk9dC5fZmlzaGVyWWF0ZXNTaHVmZmxlKHQuX21haW5BcnJheSksdC5fc3ViQXJyYXlzPXQuX21ha2VTdWJhcnJheXMoKTt2YXIgaT10Ll9tdWx0aWZpbHRlck1vZGVPbigpP3QuX21ha2VNdWx0aWZpbHRlckFycmF5KCk6dC5fZ2V0Q29sbGVjdGlvbkJ5RmlsdGVyKHQub3B0aW9ucy5maWx0ZXIpO3QuX2lzU2VhcmNoQWN0aXZhdGVkKCk/dC5zZWFyY2godC5fdHlwZWRUZXh0KTp0Ll9wbGFjZUl0ZW1zKGkpfSxzb3J0OmZ1bmN0aW9uKHQsaSl7dmFyIHI9dGhpcztpZih0PXR8fFwiZG9tSW5kZXhcIixpPWl8fFwiYXNjXCIsci5faXNBbmltYXRpbmc9ITAsci5faXNTb3J0aW5nPSEwLHIudHJpZ2dlcihcInNvcnRpbmdTdGFydFwiKSxcImRvbUluZGV4XCIhPT10JiZcInNvcnREYXRhXCIhPT10JiZcIndcIiE9PXQmJlwiaFwiIT09dClmb3IodmFyIG49MDtuPHIuX21haW5BcnJheS5sZW5ndGg7bisrKXIuX21haW5BcnJheVtuXVt0XT1yLl9tYWluQXJyYXlbbl0uZGF0YSh0KTtyLl9tYWluQXJyYXkuc29ydChyLl9jb21wYXJhdG9yKHQsaSkpLHIuX3N1YkFycmF5cz1yLl9tYWtlU3ViYXJyYXlzKCk7dmFyIGU9ci5fbXVsdGlmaWx0ZXJNb2RlT24oKT9yLl9tYWtlTXVsdGlmaWx0ZXJBcnJheSgpOnIuX2dldENvbGxlY3Rpb25CeUZpbHRlcihyLm9wdGlvbnMuZmlsdGVyKTtyLl9pc1NlYXJjaEFjdGl2YXRlZCgpP3Iuc2VhcmNoKHIuX3R5cGVkVGV4dCk6ci5fcGxhY2VJdGVtcyhlKX0sc2V0T3B0aW9uczpmdW5jdGlvbih0KXt2YXIgaT10aGlzLHI9MDtmb3IodmFyIG4gaW4gdClpLm9wdGlvbnNbbl09dFtuXTtpZihpLl9tYWluQXJyYXkmJih0LmFuaW1hdGlvbkR1cmF0aW9ufHx0LmRlbGF5fHx0LmVhc2luZ3x8dC5kZWxheU1vZGUpKWZvcihyPTA7cjxpLl9tYWluQXJyYXkubGVuZ3RoO3IrKylpLl9tYWluQXJyYXlbcl0uY3NzKFwidHJhbnNpdGlvblwiLFwiYWxsIFwiK2kub3B0aW9ucy5hbmltYXRpb25EdXJhdGlvbitcInMgXCIraS5vcHRpb25zLmVhc2luZytcIiBcIitpLl9tYWluQXJyYXlbcl0uX2NhbGNEZWxheSgpK1wibXNcIik7dC5jYWxsYmFja3MmJih0LmNhbGxiYWNrcy5vbkZpbHRlcmluZ1N0YXJ0fHwoaS5vcHRpb25zLmNhbGxiYWNrcy5vbkZpbHRlcmluZ1N0YXJ0PWZ1bmN0aW9uKCl7fSksdC5jYWxsYmFja3Mub25GaWx0ZXJpbmdFbmR8fChpLm9wdGlvbnMuY2FsbGJhY2tzLm9uRmlsdGVyaW5nRW5kPWZ1bmN0aW9uKCl7fSksdC5jYWxsYmFja3Mub25TaHVmZmxpbmdTdGFydHx8KGkub3B0aW9ucy5jYWxsYmFja3Mub25TaHVmZmxpbmdTdGFydD1mdW5jdGlvbigpe30pLHQuY2FsbGJhY2tzLm9uU2h1ZmZsaW5nRW5kfHwoaS5vcHRpb25zLmNhbGxiYWNrcy5vblNodWZmbGluZ0VuZD1mdW5jdGlvbigpe30pLHQuY2FsbGJhY2tzLm9uU29ydGluZ1N0YXJ0fHwoaS5vcHRpb25zLmNhbGxiYWNrcy5vblNvcnRpbmdTdGFydD1mdW5jdGlvbigpe30pLHQuY2FsbGJhY2tzLm9uU29ydGluZ0VuZHx8KGkub3B0aW9ucy5jYWxsYmFja3Mub25Tb3J0aW5nRW5kPWZ1bmN0aW9uKCl7fSkpLGkub3B0aW9ucy5maWx0ZXJJbkNzcy50cmFuc2Zvcm18fChpLm9wdGlvbnMuZmlsdGVySW5Dc3MudHJhbnNmb3JtPVwidHJhbnNsYXRlM2QoMCwwLDApXCIpLGkub3B0aW9ucy5maWx0ZXJPdXRDc3MudHJhbnNmb3JtfHwoaS5vcHRpb25zLmZpbHRlck91dENzcy50cmFuc2Zvcm09XCJ0cmFuc2xhdGUzZCgwLDAsMClcIil9LF9nZXRGaWx0ckl0ZW1zOmZ1bmN0aW9uKCl7dmFyIHQ9dGhpcyxyPWkodC5maW5kKFwiLmZpbHRyLWl0ZW1cIikpLGU9W107cmV0dXJuIGkuZWFjaChyLGZ1bmN0aW9uKHIsbyl7dmFyIGE9aShvKS5leHRlbmQobikuX2luaXQocix0KTtlLnB1c2goYSl9KSxlfSxfbWFrZVN1YmFycmF5czpmdW5jdGlvbigpe2Zvcih2YXIgdD10aGlzLGk9W10scj0wO3I8dC5fbGFzdENhdGVnb3J5O3IrKylpLnB1c2goW10pO2ZvcihyPTA7cjx0Ll9tYWluQXJyYXkubGVuZ3RoO3IrKylpZihcIm9iamVjdFwiPT10eXBlb2YgdC5fbWFpbkFycmF5W3JdLl9jYXRlZ29yeSlmb3IodmFyIG49dC5fbWFpbkFycmF5W3JdLl9jYXRlZ29yeS5sZW5ndGgsZT0wO2U8bjtlKyspaVt0Ll9tYWluQXJyYXlbcl0uX2NhdGVnb3J5W2VdLTFdLnB1c2godC5fbWFpbkFycmF5W3JdKTtlbHNlIGlbdC5fbWFpbkFycmF5W3JdLl9jYXRlZ29yeS0xXS5wdXNoKHQuX21haW5BcnJheVtyXSk7cmV0dXJuIGl9LF9tYWtlTXVsdGlmaWx0ZXJBcnJheTpmdW5jdGlvbigpe2Zvcih2YXIgdD10aGlzLGk9W10scj17fSxuPTA7bjx0Ll9tYWluQXJyYXkubGVuZ3RoO24rKyl7dmFyIGU9dC5fbWFpbkFycmF5W25dLG89ITEsYT1lLmRvbUluZGV4IGluIHI9PSExO2lmKEFycmF5LmlzQXJyYXkoZS5fY2F0ZWdvcnkpKXtmb3IodmFyIHM9MDtzPGUuX2NhdGVnb3J5Lmxlbmd0aDtzKyspaWYoZS5fY2F0ZWdvcnlbc11pbiB0Ll90b2dnbGVkQ2F0ZWdvcmllcyl7bz0hMDticmVha319ZWxzZSBlLl9jYXRlZ29yeSBpbiB0Ll90b2dnbGVkQ2F0ZWdvcmllcyYmKG89ITApO2EmJm8mJihyW2UuZG9tSW5kZXhdPSEwLGkucHVzaChlKSl9cmV0dXJuIGl9LF9zZXR1cENvbnRyb2xzOmZ1bmN0aW9uKCl7dmFyIHQ9dGhpcztpKFwiKltkYXRhLWZpbHRlcl1cIikuY2xpY2soZnVuY3Rpb24oKXt2YXIgcj1pKHRoaXMpLmRhdGEoXCJmaWx0ZXJcIik7dC5vcHRpb25zLmZpbHRlciE9PXImJnQuZmlsdGVyKHIpfSksaShcIipbZGF0YS1tdWx0aWZpbHRlcl1cIikuY2xpY2soZnVuY3Rpb24oKXt2YXIgcj1pKHRoaXMpLmRhdGEoXCJtdWx0aWZpbHRlclwiKTtcImFsbFwiPT09cj8odC5fdG9nZ2xlZENhdGVnb3JpZXM9e30sdC5maWx0ZXIoXCJhbGxcIikpOnQudG9nZ2xlRmlsdGVyKHIpfSksaShcIipbZGF0YS1zaHVmZmxlXVwiKS5jbGljayhmdW5jdGlvbigpe3Quc2h1ZmZsZSgpfSksaShcIipbZGF0YS1zb3J0QXNjXVwiKS5jbGljayhmdW5jdGlvbigpe3ZhciByPWkoXCIqW2RhdGEtc29ydE9yZGVyXVwiKS52YWwoKTt0LnNvcnQocixcImFzY1wiKX0pLGkoXCIqW2RhdGEtc29ydERlc2NdXCIpLmNsaWNrKGZ1bmN0aW9uKCl7dmFyIHI9aShcIipbZGF0YS1zb3J0T3JkZXJdXCIpLnZhbCgpO3Quc29ydChyLFwiZGVzY1wiKX0pLGkoXCJpbnB1dFtkYXRhLXNlYXJjaF1cIikua2V5dXAoZnVuY3Rpb24oKXt0Ll90eXBlZFRleHQ9aSh0aGlzKS52YWwoKSx0Ll9kZWxheUV2ZW50KGZ1bmN0aW9uKCl7dC5zZWFyY2godC5fdHlwZWRUZXh0KX0sMjUwLHQuX3VJRCl9KX0sX3NldHVwRXZlbnRzOmZ1bmN0aW9uKCl7dmFyIHI9dGhpcztpKHQpLnJlc2l6ZShmdW5jdGlvbigpe3IuX2RlbGF5RXZlbnQoZnVuY3Rpb24oKXtyLnRyaWdnZXIoXCJyZXNpemVGaWx0ckNvbnRhaW5lclwiKX0sMjUwLHIuX3VJRCl9KSxyLm9uKFwicmVzaXplRmlsdHJDb250YWluZXJcIixmdW5jdGlvbigpe3IuX211bHRpZmlsdGVyTW9kZU9uKCk/ci50b2dnbGVGaWx0ZXIoKTpyLmZpbHRlcihyLm9wdGlvbnMuZmlsdGVyKX0pLm9uKFwiZmlsdGVyaW5nU3RhcnRcIixmdW5jdGlvbigpe3Iub3B0aW9ucy5jYWxsYmFja3Mub25GaWx0ZXJpbmdTdGFydCgpfSkub24oXCJmaWx0ZXJpbmdFbmRcIixmdW5jdGlvbigpe3Iub3B0aW9ucy5jYWxsYmFja3Mub25GaWx0ZXJpbmdFbmQoKX0pLm9uKFwic2h1ZmZsaW5nU3RhcnRcIixmdW5jdGlvbigpe3IuX2lzU2h1ZmZsaW5nPSEwLHIub3B0aW9ucy5jYWxsYmFja3Mub25TaHVmZmxpbmdTdGFydCgpfSkub24oXCJzaHVmZmxpbmdFbmRcIixmdW5jdGlvbigpe3Iub3B0aW9ucy5jYWxsYmFja3Mub25TaHVmZmxpbmdFbmQoKSxyLl9pc1NodWZmbGluZz0hMX0pLm9uKFwic29ydGluZ1N0YXJ0XCIsZnVuY3Rpb24oKXtyLl9pc1NvcnRpbmc9ITAsci5vcHRpb25zLmNhbGxiYWNrcy5vblNvcnRpbmdTdGFydCgpfSkub24oXCJzb3J0aW5nRW5kXCIsZnVuY3Rpb24oKXtyLm9wdGlvbnMuY2FsbGJhY2tzLm9uU29ydGluZ0VuZCgpLHIuX2lzU29ydGluZz0hMX0pfSxfY2FsY0l0ZW1Qb3NpdGlvbnM6ZnVuY3Rpb24oKXt2YXIgdD10aGlzLG49dC5fYWN0aXZlQXJyYXksZT0wLG89TWF0aC5yb3VuZCh0LndpZHRoKCkvdC5maW5kKFwiLmZpbHRyLWl0ZW1cIikub3V0ZXJXaWR0aCgpKSxhPTAscz1uWzBdLm91dGVyV2lkdGgoKSxsPTAsZj0wLHU9MCxjPTAsZz0wLF89W107aWYoXCJwYWNrZWRcIj09PXQub3B0aW9ucy5sYXlvdXQpe2kuZWFjaCh0Ll9hY3RpdmVBcnJheSxmdW5jdGlvbih0LGkpe2kuX3VwZGF0ZURpbWVuc2lvbnMoKX0pO3ZhciBoPW5ldyByKHQub3V0ZXJXaWR0aCgpKTtmb3IoaC5maXQodC5fYWN0aXZlQXJyYXkpLGM9MDtjPG4ubGVuZ3RoO2MrKylfLnB1c2goe2xlZnQ6bltjXS5maXQueCx0b3A6bltjXS5maXQueX0pO2U9aC5yb290Lmh9aWYoXCJob3Jpem9udGFsXCI9PT10Lm9wdGlvbnMubGF5b3V0KWZvcihhPTEsYz0xO2M8PW4ubGVuZ3RoO2MrKylzPW5bYy0xXS5vdXRlcldpZHRoKCksbD1uW2MtMV0ub3V0ZXJIZWlnaHQoKSxfLnB1c2goe2xlZnQ6Zix0b3A6dX0pLGYrPXMsZTxsJiYoZT1sKTtlbHNlIGlmKFwidmVydGljYWxcIj09PXQub3B0aW9ucy5sYXlvdXQpe2ZvcihjPTE7Yzw9bi5sZW5ndGg7YysrKWw9bltjLTFdLm91dGVySGVpZ2h0KCksXy5wdXNoKHtsZWZ0OmYsdG9wOnV9KSx1Kz1sO2U9dX1lbHNlIGlmKFwic2FtZUhlaWdodFwiPT09dC5vcHRpb25zLmxheW91dCl7YT0xO3ZhciBkPXQub3V0ZXJXaWR0aCgpO2ZvcihjPTE7Yzw9bi5sZW5ndGg7YysrKXtzPW5bYy0xXS53aWR0aCgpO3ZhciBwPW5bYy0xXS5vdXRlcldpZHRoKCkseT0wO25bY10mJih5PW5bY10ud2lkdGgoKSksXy5wdXNoKHtsZWZ0OmYsdG9wOnV9KSwoZz1mK3MreSk+ZD8oZz0wLGY9MCx1Kz1uWzBdLm91dGVySGVpZ2h0KCksYSsrKTpmKz1wfWU9YSpuWzBdLm91dGVySGVpZ2h0KCl9ZWxzZSBpZihcInNhbWVXaWR0aFwiPT09dC5vcHRpb25zLmxheW91dCl7Zm9yKGM9MTtjPD1uLmxlbmd0aDtjKyspe2lmKF8ucHVzaCh7bGVmdDpmLHRvcDp1fSksYyVvPT0wJiZhKyssZis9cyx1PTAsYT4wKWZvcihnPWE7Zz4wOyl1Kz1uW2MtbypnXS5vdXRlckhlaWdodCgpLGctLTtjJW89PTAmJihmPTApfWZvcihjPTA7YzxvO2MrKyl7Zm9yKHZhciBtPTAsdj1jO25bdl07KW0rPW5bdl0ub3V0ZXJIZWlnaHQoKSx2Kz1vO20+ZT8oZT1tLG09MCk6bT0wfX1lbHNlIGlmKFwic2FtZVNpemVcIj09PXQub3B0aW9ucy5sYXlvdXQpe2ZvcihjPTE7Yzw9bi5sZW5ndGg7YysrKV8ucHVzaCh7bGVmdDpmLHRvcDp1fSksZis9cyxjJW89PTAmJih1Kz1uWzBdLm91dGVySGVpZ2h0KCksZj0wKTtlPShhPU1hdGguY2VpbChuLmxlbmd0aC9vKSkqblswXS5vdXRlckhlaWdodCgpfXJldHVybiB0LmNzcyhcImhlaWdodFwiLGUpLF99LF9oYW5kbGVGaWx0ZXJpbmc6ZnVuY3Rpb24odCl7Zm9yKHZhciBpPXRoaXMscj1pLl9nZXRBcnJheU9mVW5pcXVlSXRlbXMoaS5fYWN0aXZlQXJyYXksdCksbj0wO248ci5sZW5ndGg7bisrKXJbbl0uX2ZpbHRlck91dCgpO2kuX2FjdGl2ZUFycmF5PXQsaS5fcGxhY2VJdGVtcyh0KX0sX211bHRpZmlsdGVyTW9kZU9uOmZ1bmN0aW9uKCl7dmFyIHQ9dGhpcztyZXR1cm4gT2JqZWN0LmtleXModC5fdG9nZ2xlZENhdGVnb3JpZXMpLmxlbmd0aD4wfSxfaXNTZWFyY2hBY3RpdmF0ZWQ6ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5fdHlwZWRUZXh0Lmxlbmd0aD4wfSxfcGxhY2VJdGVtczpmdW5jdGlvbih0KXt2YXIgaT10aGlzO2kuX2lzQW5pbWF0aW5nPSEwLGkuX2l0ZW1Qb3NpdGlvbnM9aS5fY2FsY0l0ZW1Qb3NpdGlvbnMoKTtmb3IodmFyIHI9MDtyPHQubGVuZ3RoO3IrKyl0W3JdLl9maWx0ZXJJbihpLl9pdGVtUG9zaXRpb25zW3JdKX0sX2dldENvbGxlY3Rpb25CeUZpbHRlcjpmdW5jdGlvbih0KXt2YXIgaT10aGlzO3JldHVyblwiYWxsXCI9PT10P2kuX21haW5BcnJheTppLl9zdWJBcnJheXNbdC0xXX0sX21ha2VEZWVwQ29weTpmdW5jdGlvbih0KXt2YXIgaT17fTtmb3IodmFyIHIgaW4gdClpW3JdPXRbcl07cmV0dXJuIGl9LF9jb21wYXJhdG9yOmZ1bmN0aW9uKHQsaSl7cmV0dXJuIGZ1bmN0aW9uKHIsbil7cmV0dXJuXCJhc2NcIj09PWk/clt0XTxuW3RdPy0xOnJbdF0+blt0XT8xOjA6XCJkZXNjXCI9PT1pP25bdF08clt0XT8tMTpuW3RdPnJbdF0/MTowOnZvaWQgMH19LF9nZXRBcnJheU9mVW5pcXVlSXRlbXM6ZnVuY3Rpb24odCxpKXt2YXIgcixuLGU9W10sbz17fSxhPWkubGVuZ3RoO2ZvcihyPTA7cjxhO3IrKylvW2lbcl0uZG9tSW5kZXhdPSEwO2ZvcihhPXQubGVuZ3RoLHI9MDtyPGE7cisrKShuPXRbcl0pLmRvbUluZGV4IGluIG98fGUucHVzaChuKTtyZXR1cm4gZX0sX2RlbGF5RXZlbnQ6ZnVuY3Rpb24oKXt2YXIgdD17fTtyZXR1cm4gZnVuY3Rpb24oaSxyLG4pe2lmKG51bGw9PT1uKXRocm93IEVycm9yKFwiVW5pcXVlSUQgbmVlZGVkXCIpO3Rbbl0mJmNsZWFyVGltZW91dCh0W25dKSx0W25dPXNldFRpbWVvdXQoaSxyKX19KCksX2Zpc2hlcllhdGVzU2h1ZmZsZTpmdW5jdGlvbih0KXtmb3IodmFyIGkscixuPXQubGVuZ3RoO247KXI9TWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKm4tLSksaT10W25dLHRbbl09dFtyXSx0W3JdPWk7cmV0dXJuIHR9fTt2YXIgbj17X2luaXQ6ZnVuY3Rpb24odCxpKXt2YXIgcj10aGlzO3JldHVybiByLl9wYXJlbnQ9aSxyLl9jYXRlZ29yeT1yLl9nZXRDYXRlZ29yeSgpLHIuX2xhc3RQb3M9e30sci5kb21JbmRleD10LHIuc29ydERhdGE9ci5kYXRhKFwic29ydFwiKSxyLnc9MCxyLmg9MCxyLl9pc0ZpbHRlcmVkT3V0PSEwLHIuX2ZpbHRlcmluZ091dD0hMSxyLl9maWx0ZXJpbmdJbj0hMSxyLmNzcyhpLm9wdGlvbnMuZmlsdGVyT3V0Q3NzKS5jc3Moe1wiLXdlYmtpdC1iYWNrZmFjZS12aXNpYmlsaXR5XCI6XCJoaWRkZW5cIixwZXJzcGVjdGl2ZTpcIjEwMDBweFwiLFwiLXdlYmtpdC1wZXJzcGVjdGl2ZVwiOlwiMTAwMHB4XCIsXCItd2Via2l0LXRyYW5zZm9ybS1zdHlsZVwiOlwicHJlc2VydmUtM2RcIixwb3NpdGlvbjpcImFic29sdXRlXCIsdHJhbnNpdGlvbjpcImFsbCBcIitpLm9wdGlvbnMuYW5pbWF0aW9uRHVyYXRpb24rXCJzIFwiK2kub3B0aW9ucy5lYXNpbmcrXCIgXCIrci5fY2FsY0RlbGF5KCkrXCJtc1wifSksci5vbihcInRyYW5zaXRpb25lbmQgd2Via2l0VHJhbnNpdGlvbkVuZCBvVHJhbnNpdGlvbkVuZCBNU1RyYW5zaXRpb25FbmRcIixmdW5jdGlvbigpe3IuX29uVHJhbnNpdGlvbkVuZCgpfSkscn0sX3VwZGF0ZURpbWVuc2lvbnM6ZnVuY3Rpb24oKXt2YXIgdD10aGlzO3Qudz10Lm91dGVyV2lkdGgoKSx0Lmg9dC5vdXRlckhlaWdodCgpfSxfY2FsY0RlbGF5OmZ1bmN0aW9uKCl7dmFyIHQ9dGhpcyxpPTA7cmV0dXJuXCJwcm9ncmVzc2l2ZVwiPT09dC5fcGFyZW50Lm9wdGlvbnMuZGVsYXlNb2RlP2k9dC5fcGFyZW50Lm9wdGlvbnMuZGVsYXkqdC5kb21JbmRleDp0LmRvbUluZGV4JTI9PTAmJihpPXQuX3BhcmVudC5vcHRpb25zLmRlbGF5KSxpfSxfZ2V0Q2F0ZWdvcnk6ZnVuY3Rpb24oKXt2YXIgdD10aGlzLGk9dC5kYXRhKFwiY2F0ZWdvcnlcIik7aWYoXCJzdHJpbmdcIj09dHlwZW9mIGkpe2k9aS5zcGxpdChcIiwgXCIpO2Zvcih2YXIgcj0wO3I8aS5sZW5ndGg7cisrKXtpZihpc05hTihwYXJzZUludChpW3JdKSkpdGhyb3cgbmV3IEVycm9yKFwiRmlsdGVyaXpyOiB0aGUgdmFsdWUgb2YgZGF0YS1jYXRlZ29yeSBtdXN0IGJlIGEgbnVtYmVyLCBzdGFydGluZyBmcm9tIHZhbHVlIDEgYW5kIGluY3JlYXNpbmcuXCIpO3BhcnNlSW50KGlbcl0pPnQuX3BhcmVudC5fbGFzdENhdGVnb3J5JiYodC5fcGFyZW50Ll9sYXN0Q2F0ZWdvcnk9cGFyc2VJbnQoaVtyXSkpfX1lbHNlIGk+dC5fcGFyZW50Ll9sYXN0Q2F0ZWdvcnkmJih0Ll9wYXJlbnQuX2xhc3RDYXRlZ29yeT1pKTtyZXR1cm4gaX0sX29uVHJhbnNpdGlvbkVuZDpmdW5jdGlvbigpe3ZhciB0PXRoaXM7dC5fZmlsdGVyaW5nT3V0PyhpKHQpLmFkZENsYXNzKFwiZmlsdGVyZWRPdXRcIiksdC5faXNGaWx0ZXJlZE91dD0hMCx0Ll9maWx0ZXJpbmdPdXQ9ITEpOnQuX2ZpbHRlcmluZ0luJiYodC5faXNGaWx0ZXJlZE91dD0hMSx0Ll9maWx0ZXJpbmdJbj0hMSksdC5fcGFyZW50Ll9pc0FuaW1hdGluZyYmKHQuX3BhcmVudC5faXNTaHVmZmxpbmc/dC5fcGFyZW50LnRyaWdnZXIoXCJzaHVmZmxpbmdFbmRcIik6dC5fcGFyZW50Ll9pc1NvcnRpbmc/dC5fcGFyZW50LnRyaWdnZXIoXCJzb3J0aW5nRW5kXCIpOnQuX3BhcmVudC50cmlnZ2VyKFwiZmlsdGVyaW5nRW5kXCIpLHQuX3BhcmVudC5faXNBbmltYXRpbmc9ITEpfSxfZmlsdGVyT3V0OmZ1bmN0aW9uKCl7dmFyIHQ9dGhpcyxpPXQuX3BhcmVudC5fbWFrZURlZXBDb3B5KHQuX3BhcmVudC5vcHRpb25zLmZpbHRlck91dENzcyk7aS50cmFuc2Zvcm0rPVwiIHRyYW5zbGF0ZTNkKFwiK3QuX2xhc3RQb3MubGVmdCtcInB4LFwiK3QuX2xhc3RQb3MudG9wK1wicHgsIDApXCIsdC5jc3MoaSksdC5jc3MoXCJwb2ludGVyLWV2ZW50c1wiLFwibm9uZVwiKSx0Ll9maWx0ZXJpbmdPdXQ9ITB9LF9maWx0ZXJJbjpmdW5jdGlvbih0KXt2YXIgcj10aGlzLG49ci5fcGFyZW50Ll9tYWtlRGVlcENvcHkoci5fcGFyZW50Lm9wdGlvbnMuZmlsdGVySW5Dc3MpO2kocikucmVtb3ZlQ2xhc3MoXCJmaWx0ZXJlZE91dFwiKSxyLl9maWx0ZXJpbmdJbj0hMCxyLl9sYXN0UG9zPXQsci5jc3MoXCJwb2ludGVyLWV2ZW50c1wiLFwiYXV0b1wiKSxuLnRyYW5zZm9ybSs9XCIgdHJhbnNsYXRlM2QoXCIrdC5sZWZ0K1wicHgsXCIrdC50b3ArXCJweCwgMClcIixyLmNzcyhuKX19fSh0aGlzLGpRdWVyeSk7XG4iLCIvKipcbiAqIEZlYXRoZXJsaWdodCAtIHVsdHJhIHNsaW0galF1ZXJ5IGxpZ2h0Ym94XG4gKiBWZXJzaW9uIDEuNy43IC0gaHR0cDovL25vZWxib3NzLmdpdGh1Yi5pby9mZWF0aGVybGlnaHQvXG4gKlxuICogQ29weXJpZ2h0IDIwMTcsIE5vw6tsIFJhb3VsIEJvc3NhcnQgKGh0dHA6Ly93d3cubm9lbGJvc3MuY29tKVxuICogTUlUIExpY2Vuc2VkLlxuKiovXG4hZnVuY3Rpb24oYSl7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gYihhLGMpe2lmKCEodGhpcyBpbnN0YW5jZW9mIGIpKXt2YXIgZD1uZXcgYihhLGMpO3JldHVybiBkLm9wZW4oKSxkfXRoaXMuaWQ9Yi5pZCsrLHRoaXMuc2V0dXAoYSxjKSx0aGlzLmNoYWluQ2FsbGJhY2tzKGIuX2NhbGxiYWNrQ2hhaW4pfWZ1bmN0aW9uIGMoYSxiKXt2YXIgYz17fTtmb3IodmFyIGQgaW4gYSlkIGluIGImJihjW2RdPWFbZF0sZGVsZXRlIGFbZF0pO3JldHVybiBjfWZ1bmN0aW9uIGQoYSxiKXt2YXIgYz17fSxkPW5ldyBSZWdFeHAoXCJeXCIrYitcIihbQS1aXSkoLiopXCIpO2Zvcih2YXIgZSBpbiBhKXt2YXIgZj1lLm1hdGNoKGQpO2lmKGYpe3ZhciBnPShmWzFdK2ZbMl0ucmVwbGFjZSgvKFtBLVpdKS9nLFwiLSQxXCIpKS50b0xvd2VyQ2FzZSgpO2NbZ109YVtlXX19cmV0dXJuIGN9aWYoXCJ1bmRlZmluZWRcIj09dHlwZW9mIGEpcmV0dXJuIHZvaWQoXCJjb25zb2xlXCJpbiB3aW5kb3cmJndpbmRvdy5jb25zb2xlLmluZm8oXCJUb28gbXVjaCBsaWdodG5lc3MsIEZlYXRoZXJsaWdodCBuZWVkcyBqUXVlcnkuXCIpKTt2YXIgZT1bXSxmPWZ1bmN0aW9uKGIpe3JldHVybiBlPWEuZ3JlcChlLGZ1bmN0aW9uKGEpe3JldHVybiBhIT09YiYmYS4kaW5zdGFuY2UuY2xvc2VzdChcImJvZHlcIikubGVuZ3RoPjB9KX0sZz17YWxsb3dmdWxsc2NyZWVuOjEsZnJhbWVib3JkZXI6MSxoZWlnaHQ6MSxsb25nZGVzYzoxLG1hcmdpbmhlaWdodDoxLG1hcmdpbndpZHRoOjEsbmFtZToxLHJlZmVycmVycG9saWN5OjEsc2Nyb2xsaW5nOjEsc2FuZGJveDoxLHNyYzoxLHNyY2RvYzoxLHdpZHRoOjF9LGg9e2tleXVwOlwib25LZXlVcFwiLHJlc2l6ZTpcIm9uUmVzaXplXCJ9LGk9ZnVuY3Rpb24oYyl7YS5lYWNoKGIub3BlbmVkKCkucmV2ZXJzZSgpLGZ1bmN0aW9uKCl7cmV0dXJuIGMuaXNEZWZhdWx0UHJldmVudGVkKCl8fCExIT09dGhpc1toW2MudHlwZV1dKGMpP3ZvaWQgMDooYy5wcmV2ZW50RGVmYXVsdCgpLGMuc3RvcFByb3BhZ2F0aW9uKCksITEpfSl9LGo9ZnVuY3Rpb24oYyl7aWYoYyE9PWIuX2dsb2JhbEhhbmRsZXJJbnN0YWxsZWQpe2IuX2dsb2JhbEhhbmRsZXJJbnN0YWxsZWQ9Yzt2YXIgZD1hLm1hcChoLGZ1bmN0aW9uKGEsYyl7cmV0dXJuIGMrXCIuXCIrYi5wcm90b3R5cGUubmFtZXNwYWNlfSkuam9pbihcIiBcIik7YSh3aW5kb3cpW2M/XCJvblwiOlwib2ZmXCJdKGQsaSl9fTtiLnByb3RvdHlwZT17Y29uc3RydWN0b3I6YixuYW1lc3BhY2U6XCJmZWF0aGVybGlnaHRcIix0YXJnZXRBdHRyOlwiZGF0YS1mZWF0aGVybGlnaHRcIix2YXJpYW50Om51bGwscmVzZXRDc3M6ITEsYmFja2dyb3VuZDpudWxsLG9wZW5UcmlnZ2VyOlwiY2xpY2tcIixjbG9zZVRyaWdnZXI6XCJjbGlja1wiLGZpbHRlcjpudWxsLHJvb3Q6XCJib2R5XCIsb3BlblNwZWVkOjI1MCxjbG9zZVNwZWVkOjI1MCxjbG9zZU9uQ2xpY2s6XCJiYWNrZ3JvdW5kXCIsY2xvc2VPbkVzYzohMCxjbG9zZUljb246XCImIzEwMDA1O1wiLGxvYWRpbmc6XCJcIixwZXJzaXN0OiExLG90aGVyQ2xvc2U6bnVsbCxiZWZvcmVPcGVuOmEubm9vcCxiZWZvcmVDb250ZW50OmEubm9vcCxiZWZvcmVDbG9zZTphLm5vb3AsYWZ0ZXJPcGVuOmEubm9vcCxhZnRlckNvbnRlbnQ6YS5ub29wLGFmdGVyQ2xvc2U6YS5ub29wLG9uS2V5VXA6YS5ub29wLG9uUmVzaXplOmEubm9vcCx0eXBlOm51bGwsY29udGVudEZpbHRlcnM6W1wianF1ZXJ5XCIsXCJpbWFnZVwiLFwiaHRtbFwiLFwiYWpheFwiLFwiaWZyYW1lXCIsXCJ0ZXh0XCJdLHNldHVwOmZ1bmN0aW9uKGIsYyl7XCJvYmplY3RcIiE9dHlwZW9mIGJ8fGIgaW5zdGFuY2VvZiBhIT0hMXx8Y3x8KGM9YixiPXZvaWQgMCk7dmFyIGQ9YS5leHRlbmQodGhpcyxjLHt0YXJnZXQ6Yn0pLGU9ZC5yZXNldENzcz9kLm5hbWVzcGFjZStcIi1yZXNldFwiOmQubmFtZXNwYWNlLGY9YShkLmJhY2tncm91bmR8fFsnPGRpdiBjbGFzcz1cIicrZStcIi1sb2FkaW5nIFwiK2UrJ1wiPicsJzxkaXYgY2xhc3M9XCInK2UrJy1jb250ZW50XCI+JywnPGJ1dHRvbiBjbGFzcz1cIicrZStcIi1jbG9zZS1pY29uIFwiK2QubmFtZXNwYWNlKyctY2xvc2VcIiBhcmlhLWxhYmVsPVwiQ2xvc2VcIj4nLGQuY2xvc2VJY29uLFwiPC9idXR0b24+XCIsJzxkaXYgY2xhc3M9XCInK2QubmFtZXNwYWNlKyctaW5uZXJcIj4nK2QubG9hZGluZytcIjwvZGl2PlwiLFwiPC9kaXY+XCIsXCI8L2Rpdj5cIl0uam9pbihcIlwiKSksZz1cIi5cIitkLm5hbWVzcGFjZStcIi1jbG9zZVwiKyhkLm90aGVyQ2xvc2U/XCIsXCIrZC5vdGhlckNsb3NlOlwiXCIpO3JldHVybiBkLiRpbnN0YW5jZT1mLmNsb25lKCkuYWRkQ2xhc3MoZC52YXJpYW50KSxkLiRpbnN0YW5jZS5vbihkLmNsb3NlVHJpZ2dlcitcIi5cIitkLm5hbWVzcGFjZSxmdW5jdGlvbihiKXt2YXIgYz1hKGIudGFyZ2V0KTsoXCJiYWNrZ3JvdW5kXCI9PT1kLmNsb3NlT25DbGljayYmYy5pcyhcIi5cIitkLm5hbWVzcGFjZSl8fFwiYW55d2hlcmVcIj09PWQuY2xvc2VPbkNsaWNrfHxjLmNsb3Nlc3QoZykubGVuZ3RoKSYmKGQuY2xvc2UoYiksYi5wcmV2ZW50RGVmYXVsdCgpKX0pLHRoaXN9LGdldENvbnRlbnQ6ZnVuY3Rpb24oKXtpZih0aGlzLnBlcnNpc3QhPT0hMSYmdGhpcy4kY29udGVudClyZXR1cm4gdGhpcy4kY29udGVudDt2YXIgYj10aGlzLGM9dGhpcy5jb25zdHJ1Y3Rvci5jb250ZW50RmlsdGVycyxkPWZ1bmN0aW9uKGEpe3JldHVybiBiLiRjdXJyZW50VGFyZ2V0JiZiLiRjdXJyZW50VGFyZ2V0LmF0dHIoYSl9LGU9ZChiLnRhcmdldEF0dHIpLGY9Yi50YXJnZXR8fGV8fFwiXCIsZz1jW2IudHlwZV07aWYoIWcmJmYgaW4gYyYmKGc9Y1tmXSxmPWIudGFyZ2V0JiZlKSxmPWZ8fGQoXCJocmVmXCIpfHxcIlwiLCFnKWZvcih2YXIgaCBpbiBjKWJbaF0mJihnPWNbaF0sZj1iW2hdKTtpZighZyl7dmFyIGk9ZjtpZihmPW51bGwsYS5lYWNoKGIuY29udGVudEZpbHRlcnMsZnVuY3Rpb24oKXtyZXR1cm4gZz1jW3RoaXNdLGcudGVzdCYmKGY9Zy50ZXN0KGkpKSwhZiYmZy5yZWdleCYmaS5tYXRjaCYmaS5tYXRjaChnLnJlZ2V4KSYmKGY9aSksIWZ9KSwhZilyZXR1cm5cImNvbnNvbGVcImluIHdpbmRvdyYmd2luZG93LmNvbnNvbGUuZXJyb3IoXCJGZWF0aGVybGlnaHQ6IG5vIGNvbnRlbnQgZmlsdGVyIGZvdW5kIFwiKyhpPycgZm9yIFwiJytpKydcIic6XCIgKG5vIHRhcmdldCBzcGVjaWZpZWQpXCIpKSwhMX1yZXR1cm4gZy5wcm9jZXNzLmNhbGwoYixmKX0sc2V0Q29udGVudDpmdW5jdGlvbihiKXt2YXIgYz10aGlzO3JldHVybiBiLmlzKFwiaWZyYW1lXCIpJiZjLiRpbnN0YW5jZS5hZGRDbGFzcyhjLm5hbWVzcGFjZStcIi1pZnJhbWVcIiksYy4kaW5zdGFuY2UucmVtb3ZlQ2xhc3MoYy5uYW1lc3BhY2UrXCItbG9hZGluZ1wiKSxjLiRpbnN0YW5jZS5maW5kKFwiLlwiK2MubmFtZXNwYWNlK1wiLWlubmVyXCIpLm5vdChiKS5zbGljZSgxKS5yZW1vdmUoKS5lbmQoKS5yZXBsYWNlV2l0aChhLmNvbnRhaW5zKGMuJGluc3RhbmNlWzBdLGJbMF0pP1wiXCI6YiksYy4kY29udGVudD1iLmFkZENsYXNzKGMubmFtZXNwYWNlK1wiLWlubmVyXCIpLGN9LG9wZW46ZnVuY3Rpb24oYil7dmFyIGM9dGhpcztpZihjLiRpbnN0YW5jZS5oaWRlKCkuYXBwZW5kVG8oYy5yb290KSwhKGImJmIuaXNEZWZhdWx0UHJldmVudGVkKCl8fGMuYmVmb3JlT3BlbihiKT09PSExKSl7YiYmYi5wcmV2ZW50RGVmYXVsdCgpO3ZhciBkPWMuZ2V0Q29udGVudCgpO2lmKGQpcmV0dXJuIGUucHVzaChjKSxqKCEwKSxjLiRpbnN0YW5jZS5mYWRlSW4oYy5vcGVuU3BlZWQpLGMuYmVmb3JlQ29udGVudChiKSxhLndoZW4oZCkuYWx3YXlzKGZ1bmN0aW9uKGEpe2Muc2V0Q29udGVudChhKSxjLmFmdGVyQ29udGVudChiKX0pLnRoZW4oYy4kaW5zdGFuY2UucHJvbWlzZSgpKS5kb25lKGZ1bmN0aW9uKCl7Yy5hZnRlck9wZW4oYil9KX1yZXR1cm4gYy4kaW5zdGFuY2UuZGV0YWNoKCksYS5EZWZlcnJlZCgpLnJlamVjdCgpLnByb21pc2UoKX0sY2xvc2U6ZnVuY3Rpb24oYil7dmFyIGM9dGhpcyxkPWEuRGVmZXJyZWQoKTtyZXR1cm4gYy5iZWZvcmVDbG9zZShiKT09PSExP2QucmVqZWN0KCk6KDA9PT1mKGMpLmxlbmd0aCYmaighMSksYy4kaW5zdGFuY2UuZmFkZU91dChjLmNsb3NlU3BlZWQsZnVuY3Rpb24oKXtjLiRpbnN0YW5jZS5kZXRhY2goKSxjLmFmdGVyQ2xvc2UoYiksZC5yZXNvbHZlKCl9KSksZC5wcm9taXNlKCl9LHJlc2l6ZTpmdW5jdGlvbihhLGIpe2lmKGEmJmIpe3RoaXMuJGNvbnRlbnQuY3NzKFwid2lkdGhcIixcIlwiKS5jc3MoXCJoZWlnaHRcIixcIlwiKTt2YXIgYz1NYXRoLm1heChhLyh0aGlzLiRjb250ZW50LnBhcmVudCgpLndpZHRoKCktMSksYi8odGhpcy4kY29udGVudC5wYXJlbnQoKS5oZWlnaHQoKS0xKSk7Yz4xJiYoYz1iL01hdGguZmxvb3IoYi9jKSx0aGlzLiRjb250ZW50LmNzcyhcIndpZHRoXCIsXCJcIithL2MrXCJweFwiKS5jc3MoXCJoZWlnaHRcIixcIlwiK2IvYytcInB4XCIpKX19LGNoYWluQ2FsbGJhY2tzOmZ1bmN0aW9uKGIpe2Zvcih2YXIgYyBpbiBiKXRoaXNbY109YS5wcm94eShiW2NdLHRoaXMsYS5wcm94eSh0aGlzW2NdLHRoaXMpKX19LGEuZXh0ZW5kKGIse2lkOjAsYXV0b0JpbmQ6XCJbZGF0YS1mZWF0aGVybGlnaHRdXCIsZGVmYXVsdHM6Yi5wcm90b3R5cGUsY29udGVudEZpbHRlcnM6e2pxdWVyeTp7cmVnZXg6L15bIy5dXFx3Lyx0ZXN0OmZ1bmN0aW9uKGIpe3JldHVybiBiIGluc3RhbmNlb2YgYSYmYn0scHJvY2VzczpmdW5jdGlvbihiKXtyZXR1cm4gdGhpcy5wZXJzaXN0IT09ITE/YShiKTphKGIpLmNsb25lKCEwKX19LGltYWdlOntyZWdleDovXFwuKHBuZ3xqcGd8anBlZ3xnaWZ8dGlmZnxibXB8c3ZnKShcXD9cXFMqKT8kL2kscHJvY2VzczpmdW5jdGlvbihiKXt2YXIgYz10aGlzLGQ9YS5EZWZlcnJlZCgpLGU9bmV3IEltYWdlLGY9YSgnPGltZyBzcmM9XCInK2IrJ1wiIGFsdD1cIlwiIGNsYXNzPVwiJytjLm5hbWVzcGFjZSsnLWltYWdlXCIgLz4nKTtyZXR1cm4gZS5vbmxvYWQ9ZnVuY3Rpb24oKXtmLm5hdHVyYWxXaWR0aD1lLndpZHRoLGYubmF0dXJhbEhlaWdodD1lLmhlaWdodCxkLnJlc29sdmUoZil9LGUub25lcnJvcj1mdW5jdGlvbigpe2QucmVqZWN0KGYpfSxlLnNyYz1iLGQucHJvbWlzZSgpfX0saHRtbDp7cmVnZXg6L15cXHMqPFtcXHchXVtePF0qPi8scHJvY2VzczpmdW5jdGlvbihiKXtyZXR1cm4gYShiKX19LGFqYXg6e3JlZ2V4Oi8uLyxwcm9jZXNzOmZ1bmN0aW9uKGIpe3ZhciBjPWEuRGVmZXJyZWQoKSxkPWEoXCI8ZGl2PjwvZGl2PlwiKS5sb2FkKGIsZnVuY3Rpb24oYSxiKXtcImVycm9yXCIhPT1iJiZjLnJlc29sdmUoZC5jb250ZW50cygpKSxjLmZhaWwoKX0pO3JldHVybiBjLnByb21pc2UoKX19LGlmcmFtZTp7cHJvY2VzczpmdW5jdGlvbihiKXt2YXIgZT1uZXcgYS5EZWZlcnJlZCxmPWEoXCI8aWZyYW1lLz5cIiksaD1kKHRoaXMsXCJpZnJhbWVcIiksaT1jKGgsZyk7cmV0dXJuIGYuaGlkZSgpLmF0dHIoXCJzcmNcIixiKS5hdHRyKGkpLmNzcyhoKS5vbihcImxvYWRcIixmdW5jdGlvbigpe2UucmVzb2x2ZShmLnNob3coKSl9KS5hcHBlbmRUbyh0aGlzLiRpbnN0YW5jZS5maW5kKFwiLlwiK3RoaXMubmFtZXNwYWNlK1wiLWNvbnRlbnRcIikpLGUucHJvbWlzZSgpfX0sdGV4dDp7cHJvY2VzczpmdW5jdGlvbihiKXtyZXR1cm4gYShcIjxkaXY+XCIse3RleHQ6Yn0pfX19LGZ1bmN0aW9uQXR0cmlidXRlczpbXCJiZWZvcmVPcGVuXCIsXCJhZnRlck9wZW5cIixcImJlZm9yZUNvbnRlbnRcIixcImFmdGVyQ29udGVudFwiLFwiYmVmb3JlQ2xvc2VcIixcImFmdGVyQ2xvc2VcIl0scmVhZEVsZW1lbnRDb25maWc6ZnVuY3Rpb24oYixjKXt2YXIgZD10aGlzLGU9bmV3IFJlZ0V4cChcIl5kYXRhLVwiK2MrXCItKC4qKVwiKSxmPXt9O3JldHVybiBiJiZiLmF0dHJpYnV0ZXMmJmEuZWFjaChiLmF0dHJpYnV0ZXMsZnVuY3Rpb24oKXt2YXIgYj10aGlzLm5hbWUubWF0Y2goZSk7aWYoYil7dmFyIGM9dGhpcy52YWx1ZSxnPWEuY2FtZWxDYXNlKGJbMV0pO2lmKGEuaW5BcnJheShnLGQuZnVuY3Rpb25BdHRyaWJ1dGVzKT49MCljPW5ldyBGdW5jdGlvbihjKTtlbHNlIHRyeXtjPUpTT04ucGFyc2UoYyl9Y2F0Y2goaCl7fWZbZ109Y319KSxmfSxleHRlbmQ6ZnVuY3Rpb24oYixjKXt2YXIgZD1mdW5jdGlvbigpe3RoaXMuY29uc3RydWN0b3I9Yn07cmV0dXJuIGQucHJvdG90eXBlPXRoaXMucHJvdG90eXBlLGIucHJvdG90eXBlPW5ldyBkLGIuX19zdXBlcl9fPXRoaXMucHJvdG90eXBlLGEuZXh0ZW5kKGIsdGhpcyxjKSxiLmRlZmF1bHRzPWIucHJvdG90eXBlLGJ9LGF0dGFjaDpmdW5jdGlvbihiLGMsZCl7dmFyIGU9dGhpcztcIm9iamVjdFwiIT10eXBlb2YgY3x8YyBpbnN0YW5jZW9mIGEhPSExfHxkfHwoZD1jLGM9dm9pZCAwKSxkPWEuZXh0ZW5kKHt9LGQpO3ZhciBmLGc9ZC5uYW1lc3BhY2V8fGUuZGVmYXVsdHMubmFtZXNwYWNlLGg9YS5leHRlbmQoe30sZS5kZWZhdWx0cyxlLnJlYWRFbGVtZW50Q29uZmlnKGJbMF0sZyksZCksaT1mdW5jdGlvbihnKXt2YXIgaT1hKGcuY3VycmVudFRhcmdldCksaj1hLmV4dGVuZCh7JHNvdXJjZTpiLCRjdXJyZW50VGFyZ2V0Oml9LGUucmVhZEVsZW1lbnRDb25maWcoYlswXSxoLm5hbWVzcGFjZSksZS5yZWFkRWxlbWVudENvbmZpZyhnLmN1cnJlbnRUYXJnZXQsaC5uYW1lc3BhY2UpLGQpLGs9Znx8aS5kYXRhKFwiZmVhdGhlcmxpZ2h0LXBlcnNpc3RlZFwiKXx8bmV3IGUoYyxqKTtcInNoYXJlZFwiPT09ay5wZXJzaXN0P2Y9azprLnBlcnNpc3QhPT0hMSYmaS5kYXRhKFwiZmVhdGhlcmxpZ2h0LXBlcnNpc3RlZFwiLGspLGouJGN1cnJlbnRUYXJnZXQuYmx1ciYmai4kY3VycmVudFRhcmdldC5ibHVyKCksay5vcGVuKGcpfTtyZXR1cm4gYi5vbihoLm9wZW5UcmlnZ2VyK1wiLlwiK2gubmFtZXNwYWNlLGguZmlsdGVyLGkpLGl9LGN1cnJlbnQ6ZnVuY3Rpb24oKXt2YXIgYT10aGlzLm9wZW5lZCgpO3JldHVybiBhW2EubGVuZ3RoLTFdfHxudWxsfSxvcGVuZWQ6ZnVuY3Rpb24oKXt2YXIgYj10aGlzO3JldHVybiBmKCksYS5ncmVwKGUsZnVuY3Rpb24oYSl7cmV0dXJuIGEgaW5zdGFuY2VvZiBifSl9LGNsb3NlOmZ1bmN0aW9uKGEpe3ZhciBiPXRoaXMuY3VycmVudCgpO3JldHVybiBiP2IuY2xvc2UoYSk6dm9pZCAwfSxfb25SZWFkeTpmdW5jdGlvbigpe3ZhciBiPXRoaXM7Yi5hdXRvQmluZCYmKGEoYi5hdXRvQmluZCkuZWFjaChmdW5jdGlvbigpe2IuYXR0YWNoKGEodGhpcykpfSksYShkb2N1bWVudCkub24oXCJjbGlja1wiLGIuYXV0b0JpbmQsZnVuY3Rpb24oYyl7aWYoIWMuaXNEZWZhdWx0UHJldmVudGVkKCkpe3ZhciBkPWIuYXR0YWNoKGEoYy5jdXJyZW50VGFyZ2V0KSk7ZChjKX19KSl9LF9jYWxsYmFja0NoYWluOntvbktleVVwOmZ1bmN0aW9uKGIsYyl7cmV0dXJuIDI3PT09Yy5rZXlDb2RlPyh0aGlzLmNsb3NlT25Fc2MmJmEuZmVhdGhlcmxpZ2h0LmNsb3NlKGMpLCExKTpiKGMpfSxiZWZvcmVPcGVuOmZ1bmN0aW9uKGIsYyl7cmV0dXJuIHRoaXMuX3ByZXZpb3VzbHlBY3RpdmU9ZG9jdW1lbnQuYWN0aXZlRWxlbWVudCx0aGlzLl8kcHJldmlvdXNseVRhYmJhYmxlPWEoXCJhLCBpbnB1dCwgc2VsZWN0LCB0ZXh0YXJlYSwgaWZyYW1lLCBidXR0b24sIGlmcmFtZSwgW2NvbnRlbnRFZGl0YWJsZT10cnVlXVwiKS5ub3QoXCJbdGFiaW5kZXhdXCIpLm5vdCh0aGlzLiRpbnN0YW5jZS5maW5kKFwiYnV0dG9uXCIpKSx0aGlzLl8kcHJldmlvdXNseVdpdGhUYWJJbmRleD1hKFwiW3RhYmluZGV4XVwiKS5ub3QoJ1t0YWJpbmRleD1cIi0xXCJdJyksdGhpcy5fcHJldmlvdXNXaXRoVGFiSW5kaWNlcz10aGlzLl8kcHJldmlvdXNseVdpdGhUYWJJbmRleC5tYXAoZnVuY3Rpb24oYixjKXtyZXR1cm4gYShjKS5hdHRyKFwidGFiaW5kZXhcIil9KSx0aGlzLl8kcHJldmlvdXNseVdpdGhUYWJJbmRleC5hZGQodGhpcy5fJHByZXZpb3VzbHlUYWJiYWJsZSkuYXR0cihcInRhYmluZGV4XCIsLTEpLGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQuYmx1ciYmZG9jdW1lbnQuYWN0aXZlRWxlbWVudC5ibHVyKCksYihjKX0sYWZ0ZXJDbG9zZTpmdW5jdGlvbihiLGMpe3ZhciBkPWIoYyksZT10aGlzO3JldHVybiB0aGlzLl8kcHJldmlvdXNseVRhYmJhYmxlLnJlbW92ZUF0dHIoXCJ0YWJpbmRleFwiKSx0aGlzLl8kcHJldmlvdXNseVdpdGhUYWJJbmRleC5lYWNoKGZ1bmN0aW9uKGIsYyl7YShjKS5hdHRyKFwidGFiaW5kZXhcIixlLl9wcmV2aW91c1dpdGhUYWJJbmRpY2VzW2JdKX0pLHRoaXMuX3ByZXZpb3VzbHlBY3RpdmUuZm9jdXMoKSxkfSxvblJlc2l6ZTpmdW5jdGlvbihhLGIpe3JldHVybiB0aGlzLnJlc2l6ZSh0aGlzLiRjb250ZW50Lm5hdHVyYWxXaWR0aCx0aGlzLiRjb250ZW50Lm5hdHVyYWxIZWlnaHQpLGEoYil9LGFmdGVyQ29udGVudDpmdW5jdGlvbihhLGIpe3ZhciBjPWEoYik7cmV0dXJuIHRoaXMuJGluc3RhbmNlLmZpbmQoXCJbYXV0b2ZvY3VzXTpub3QoW2Rpc2FibGVkXSlcIikuZm9jdXMoKSx0aGlzLm9uUmVzaXplKGIpLGN9fX0pLGEuZmVhdGhlcmxpZ2h0PWIsYS5mbi5mZWF0aGVybGlnaHQ9ZnVuY3Rpb24oYSxjKXtyZXR1cm4gYi5hdHRhY2godGhpcyxhLGMpLHRoaXN9LGEoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uKCl7Yi5fb25SZWFkeSgpfSl9KGpRdWVyeSk7IiwiLy9EZWZhdWx0IG9wdGlvbnNcclxudmFyIG9wdGlvbnMgPSB7XHJcbiAgYW5pbWF0aW9uRHVyYXRpb246IDAuMiwgLy9pbiBzZWNvbmRzXHJcbiAgZmlsdGVyOiAnYWxsJywgLy9Jbml0aWFsIGZpbHRlclxyXG4gIGNhbGxiYWNrczoge1xyXG4gICAgb25GaWx0ZXJpbmdTdGFydDogZnVuY3Rpb24oKSB7IH0sXHJcbiAgICBvbkZpbHRlcmluZ0VuZDogZnVuY3Rpb24oKSB7IH0sXHJcbiAgICBvblNodWZmbGluZ1N0YXJ0OiBmdW5jdGlvbigpIHsgfSxcclxuICAgIG9uU2h1ZmZsaW5nRW5kOiBmdW5jdGlvbigpIHsgfSxcclxuICAgIG9uU29ydGluZ1N0YXJ0OiBmdW5jdGlvbigpIHsgfSxcclxuICAgIG9uU29ydGluZ0VuZDogZnVuY3Rpb24oKSB7IH1cclxuICB9LFxyXG4gIGRlbGF5OiAwLCAvL1RyYW5zaXRpb24gZGVsYXkgaW4gbXNcclxuICBkZWxheU1vZGU6ICdwcm9ncmVzc2l2ZScsIC8vJ3Byb2dyZXNzaXZlJyBvciAnYWx0ZXJuYXRlJ1xyXG4gIGVhc2luZzogJ2Vhc2Utb3V0JyxcclxuICBsYXlvdXQ6ICdzYW1lU2l6ZScsIC8vU2VlIGxheW91dHNcclxuICBzZWxlY3RvcjogJy5maWx0ci1jb250YWluZXInLFxyXG4gIHNldHVwQ29udHJvbHM6IHRydWVcclxufTtcclxuXHJcbmpRdWVyeShkb2N1bWVudCkuZm91bmRhdGlvbigpO1xyXG5cclxud2luZG93Lm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gIFBhcnRpY2xlcy5pbml0KHtcclxuICAgIHNlbGVjdG9yOiAnY2FudmFzLmJhY2tncm91bmQnLFxyXG4gICAgbWF4UGFydGljbGVzOiAzNTAsXHJcbiAgICBjb2xvcjogJyNmNzQ5MDInLFxyXG4gICAgcmVzcG9uc2l2ZTogW1xyXG4gICAgICB7XHJcbiAgICAgICAgYnJlYWtwb2ludDogNzY4LFxyXG4gICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgIG1heFBhcnRpY2xlczogMjAwLFxyXG4gICAgICAgICAgY29ubmVjdFBhcnRpY2xlczogZmFsc2VcclxuICAgICAgICB9XHJcbiAgICAgIH0sIHtcclxuICAgICAgICBicmVha3BvaW50OiA0MjUsXHJcbiAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgbWF4UGFydGljbGVzOiAxMDBcclxuICAgICAgICB9XHJcbiAgICAgIH0sIHtcclxuICAgICAgICBicmVha3BvaW50OiAzMjAsXHJcbiAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgbWF4UGFydGljbGVzOiAwIC8vIGRpc2FibGVzIHBhcnRpY2xlcy5qc1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgXVxyXG4gIH0pO1xyXG59O1xyXG5cclxuLy8gb25jZSBBSkFYIGlzIGRvbmUsIGxldHMgbG9hZCBzdHVmZlxyXG4kLmZuLmFsbURvbmUgPSBmdW5jdGlvbihhbG0pe1xyXG5cclxuICAvL1lvdSBjYW4gb3ZlcnJpZGUgYW55IG9mIHRoZXNlIG9wdGlvbnMgYW5kIHRoZW4gY2FsbC4uLlxyXG4gIHZhciBmaWx0ZXJTdGFydCA9ICQoJy5maWx0ci1jb250YWluZXInKS5maWx0ZXJpenIob3B0aW9ucyk7XHJcbiAgLy9JZiB5b3UgaGF2ZSBhbHJlYWR5IGluc3RhbnRpYXRlZCB5b3VyIEZpbHRlcml6ciB0aGVuIGNhbGwuLi5cclxuICBmaWx0ZXJTdGFydC5maWx0ZXJpenIoJ3NldE9wdGlvbnMnLCBvcHRpb25zKTtcclxuXHJcbiAgLy8gbGlnaHRib3hcclxuICAkKCcuZmlsdHItaXRlbSA+IGEnKS5mZWF0aGVybGlnaHQoe1xyXG4gICAgYmVmb3JlT3BlbjogZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgICAvL3NldHVwIHZhcnNcclxuICAgICAgdmFyICR0aXRsZSA9IHRoaXMuJGN1cnJlbnRUYXJnZXRbMF0uZGF0YXNldC50aXRsZSxcclxuICAgICAgICAgICRkZXNjcmlwdGlvbiA9IHRoaXMuJGN1cnJlbnRUYXJnZXRbMF0uZGF0YXNldC5kZXNjcmlwdGlvbixcclxuICAgICAgICAgICRpbWFnZSA9IHRoaXMuJGN1cnJlbnRUYXJnZXRbMF0uZGF0YXNldC5pbWFnZSxcclxuICAgICAgICAgICRsaW5rID0gdGhpcy4kY3VycmVudFRhcmdldFswXS5kYXRhc2V0Lmxpbms7XHJcblxyXG4gICAgICAvLyBsaW5rXHJcbiAgICAgICQoJyNteWxpZ2h0Ym94JykuZmluZCgnYS5saWdodGJveC1leHRlcm5hbCcpLmF0dHIoJ2hyZWYnLCAkbGluayk7XHJcbiAgICAgIC8vIHRpdGxlXHJcbiAgICAgICQoJyNteWxpZ2h0Ym94JykuZmluZCgnaDInKS5lbXB0eSgpLmFwcGVuZCgkdGl0bGUpO1xyXG4gICAgICAvLyBjb250ZW50XHJcbiAgICAgICQoJyNteWxpZ2h0Ym94JykuZmluZCgncCcpLmVtcHR5KCkuYXBwZW5kKCRkZXNjcmlwdGlvbik7XHJcbiAgICAgIC8vIGltYWdlXHJcbiAgICAgICQoJyNteWxpZ2h0Ym94JykuZmluZCgnaW1nJykuYXR0cignc3JjJywgJGltYWdlKTtcclxuXHJcbiAgICAgIC8vIHNldHVwIHNoYXJpbmdcclxuICAgICAgJChcIiNteWxpZ2h0Ym94XCIpLmZpbmQoJ2Rpdi5hMmFfa2l0JykuYXR0cihcImRhdGEtYTJhLXVybFwiLCAkbGluayk7XHJcbiAgICAgICQoXCIjbXlsaWdodGJveFwiKS5maW5kKCdkaXYuYTJhX2tpdCcpLmF0dHIoXCJkYXRhLWEyYS10aXRsZVwiLCAkdGl0bGUpO1xyXG4gICAgfSxcclxuICAgIGFmdGVyQ29udGVudDogZnVuY3Rpb24oKXtcclxuICAgICAgdmFyICR0aXRsZSA9IHRoaXMuJGN1cnJlbnRUYXJnZXRbMF0uZGF0YXNldC50aXRsZSxcclxuICAgICAgICAgICRsaW5rID0gdGhpcy4kY3VycmVudFRhcmdldFswXS5kYXRhc2V0Lmxpbms7XHJcblxyXG4gICAgICAvLyBpbml0aWFsaXplIHNoYXJpbmdcclxuICAgICAgdmFyIGEyYV9jb25maWcgPSBhMmFfY29uZmlnIHx8IHt9O1xyXG4gICAgICAgICAgYTJhLmluaXQoJ3BhZ2UnKTtcclxuICAgIH1cclxuICB9KTtcclxufTtcclxuXHJcbnZhciBhbG1faXNfYW5pbWF0aW5nID0gZmFsc2U7IC8vIEFuaW1hdGluZyBmbGFnXHJcbiQoJy5hbG0tZmlsdGVyLW5hdiBsaScpLmVxKDApLmFkZENsYXNzKCdhY3RpdmUnKTsgLy8gU2V0IGluaXRpYWwgYWN0aXZlIHN0YXRlXHJcblxyXG4vLyBCdG4gQ2xpY2sgRXZlbnRcclxuJCgnLmFsbS1maWx0ZXItbmF2IGxpIGEnKS5vbignY2xpY2snLCBmdW5jdGlvbihlKXtcclxuXHJcbiAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gIHZhciBlbCA9ICQodGhpcyk7IC8vIE91ciBzZWxlY3RlZCBlbGVtZW50XHJcblxyXG4gIGlmKCFlbC5oYXNDbGFzcygnYWN0aXZlJykgJiYgIWFsbV9pc19hbmltYXRpbmcpe1xyXG4gICAgLy8gQ2hlY2sgZm9yIGFjdGl2ZSBhbmQgIWFsbV9pc19hbmltYXRpbmdcclxuICAgICBhbG1faXNfYW5pbWF0aW5nID0gdHJ1ZTtcclxuICAgICBlbC5wYXJlbnQoKS5hZGRDbGFzcygnYWN0aXZlJykuc2libGluZ3MoJ2xpJykucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xyXG5cclxuICAgICAvLyBBZGQgYWN0aXZlIHN0YXRlXHJcbiAgICAgdmFyIGRhdGEgPSBlbC5kYXRhKCksIC8vIEdldCBkYXRhIHZhbHVlcyBmcm9tIHNlbGVjdGVkIG1lbnUgaXRlbVxyXG4gICAgICAgICB0cmFuc2l0aW9uID0gJ2ZhZGUnLCAvLyAnc2xpZGUnIHwgJ2ZhZGUnIHwgbnVsbFxyXG4gICAgICAgICBzcGVlZCA9ICczMDAnOyAvL2luIG1pbGxpc2Vjb25kc1xyXG4gICAgJC5mbi5hbG1GaWx0ZXIodHJhbnNpdGlvbiwgc3BlZWQsIGRhdGEpOyAvLyBSdW4gdGhlIGZpbHRlclxyXG4gIH1cclxufSk7XHJcblxyXG4kLmZuLmFsbUZpbHRlckNvbXBsZXRlID0gZnVuY3Rpb24oKXtcclxuICBjb25zb2xlLmxvZygnQWpheCBMb2FkIE1vcmUgZmlsdGVyIGhhcyBjb21wbGV0ZWQhJyk7XHJcbiAgYWxtX2lzX2FuaW1hdGluZyA9IGZhbHNlOyAvLyBjbGVhciBhbmltYXRpbmcgZmxhZ1xyXG59O1xyXG5cclxualF1ZXJ5KGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbiAoKSB7XHJcbiAgJC5mbi5hbG1Db21wbGV0ZSA9IGZ1bmN0aW9uKGFsbSl7XHJcbiAgICAvLyBsaWdodGJveFxyXG4gICAgJCgnLmZpbHRyLWl0ZW0gPiBhJykuZmVhdGhlcmxpZ2h0KHtcclxuICAgICAgYmVmb3JlT3BlbjogZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgICAgIC8vc2V0dXAgdmFyc1xyXG4gICAgICAgIHZhciAkdGl0bGUgPSB0aGlzLiRjdXJyZW50VGFyZ2V0WzBdLmRhdGFzZXQudGl0bGUsXHJcbiAgICAgICAgICAgICRkZXNjcmlwdGlvbiA9IHRoaXMuJGN1cnJlbnRUYXJnZXRbMF0uZGF0YXNldC5kZXNjcmlwdGlvbixcclxuICAgICAgICAgICAgJGltYWdlID0gdGhpcy4kY3VycmVudFRhcmdldFswXS5kYXRhc2V0LmltYWdlLFxyXG4gICAgICAgICAgICAkbGluayA9IHRoaXMuJGN1cnJlbnRUYXJnZXRbMF0uZGF0YXNldC5saW5rO1xyXG5cclxuICAgICAgICAvLyBsaW5rXHJcbiAgICAgICAgJCgnI215bGlnaHRib3gnKS5maW5kKCdhLmxpZ2h0Ym94LWV4dGVybmFsJykuYXR0cignaHJlZicsICRsaW5rKTtcclxuICAgICAgICAvLyB0aXRsZVxyXG4gICAgICAgICQoJyNteWxpZ2h0Ym94JykuZmluZCgnaDInKS5lbXB0eSgpLmFwcGVuZCgkdGl0bGUpO1xyXG4gICAgICAgIC8vIGNvbnRlbnRcclxuICAgICAgICAkKCcjbXlsaWdodGJveCcpLmZpbmQoJ3AnKS5lbXB0eSgpLmFwcGVuZCgkZGVzY3JpcHRpb24pO1xyXG4gICAgICAgIC8vIGltYWdlXHJcbiAgICAgICAgJCgnI215bGlnaHRib3gnKS5maW5kKCdpbWcnKS5hdHRyKCdzcmMnLCAkaW1hZ2UpO1xyXG5cclxuICAgICAgICAvLyBzZXR1cCBzaGFyaW5nXHJcbiAgICAgICAgJChcIiNteWxpZ2h0Ym94XCIpLmZpbmQoJ2Rpdi5hMmFfa2l0JykuYXR0cihcImRhdGEtYTJhLXVybFwiLCAkbGluayk7XHJcbiAgICAgICAgJChcIiNteWxpZ2h0Ym94XCIpLmZpbmQoJ2Rpdi5hMmFfa2l0JykuYXR0cihcImRhdGEtYTJhLXRpdGxlXCIsICR0aXRsZSk7XHJcbiAgICAgIH0sXHJcbiAgICAgIGFmdGVyQ29udGVudDogZnVuY3Rpb24oKXtcclxuICAgICAgICB2YXIgJHRpdGxlID0gdGhpcy4kY3VycmVudFRhcmdldFswXS5kYXRhc2V0LnRpdGxlLFxyXG4gICAgICAgICAgICAkbGluayA9IHRoaXMuJGN1cnJlbnRUYXJnZXRbMF0uZGF0YXNldC5saW5rO1xyXG5cclxuICAgICAgICAvLyBpbml0aWFsaXplIHNoYXJpbmdcclxuICAgICAgICB2YXIgYTJhX2NvbmZpZyA9IGEyYV9jb25maWcgfHwge307XHJcbiAgICAgICAgICAgIGEyYS5pbml0KCdwYWdlJyk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH07XHJcbn0pO1xyXG5cclxuLy8gd2hlbiBjbG9zaW5nIHRoZSBtb2JpbGUgbWVudSwgcmVpbml0IGZpbHRlciB0byBwb3NpdGlvbiByaWdodC5cclxualF1ZXJ5KGRvY3VtZW50KS5vbignY2xvc2VkLnpmLm9mZmNhbnZhcycsZnVuY3Rpb24oKXtcclxuICAvL1lvdSBjYW4gb3ZlcnJpZGUgYW55IG9mIHRoZXNlIG9wdGlvbnMgYW5kIHRoZW4gY2FsbC4uLlxyXG4gIHZhciBmaWx0ZXJTdGFydCA9ICQoJy5maWx0ci1jb250YWluZXInKS5maWx0ZXJpenIob3B0aW9ucyk7XHJcbiAgLy9JZiB5b3UgaGF2ZSBhbHJlYWR5IGluc3RhbnRpYXRlZCB5b3VyIEZpbHRlcml6ciB0aGVuIGNhbGwuLi5cclxuICBmaWx0ZXJTdGFydC5maWx0ZXJpenIoJ3NldE9wdGlvbnMnLCBvcHRpb25zKTtcclxufSk7IiwiLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG5cclxuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAqIGpRdWVyeSBFYXNpbmcgdjEuMyAtIGh0dHA6Ly9nc2dkLmNvLnVrL3NhbmRib3gvanF1ZXJ5L2Vhc2luZy9cclxuICpcclxuICogT3BlbiBzb3VyY2UgdW5kZXIgdGhlIEJTRCBMaWNlbnNlLlxyXG4gKlxyXG4gKiBDb3B5cmlnaHQg44O744KR7729772pIDIwMDggR2VvcmdlIE1jR2lubGV5IFNtaXRoXHJcbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXHJcbiAqIGh0dHBzOi8vcmF3LmdpdGh1Yi5jb20vZGFucm8vanF1ZXJ5LWVhc2luZy9tYXN0ZXIvTElDRU5TRVxyXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqL2pRdWVyeS5lYXNpbmcuanN3aW5nPWpRdWVyeS5lYXNpbmcuc3dpbmcsalF1ZXJ5LmV4dGVuZChqUXVlcnkuZWFzaW5nLHtkZWY6XCJlYXNlT3V0UXVhZFwiLHN3aW5nOmZ1bmN0aW9uKGEsYixjLGQsZSl7cmV0dXJuIGpRdWVyeS5lYXNpbmdbalF1ZXJ5LmVhc2luZy5kZWZdKGEsYixjLGQsZSl9LGVhc2VJblF1YWQ6ZnVuY3Rpb24oYSxiLGMsZCxlKXtyZXR1cm4gZCooYi89ZSkqYitjfSxlYXNlT3V0UXVhZDpmdW5jdGlvbihhLGIsYyxkLGUpe3JldHVybi1kKihiLz1lKSooYi0yKStjfSxlYXNlSW5PdXRRdWFkOmZ1bmN0aW9uKGEsYixjLGQsZSl7cmV0dXJuKGIvPWUvMik8MT9kLzIqYipiK2M6LWQvMiooLS1iKihiLTIpLTEpK2N9LGVhc2VJbkN1YmljOmZ1bmN0aW9uKGEsYixjLGQsZSl7cmV0dXJuIGQqKGIvPWUpKmIqYitjfSxlYXNlT3V0Q3ViaWM6ZnVuY3Rpb24oYSxiLGMsZCxlKXtyZXR1cm4gZCooKGI9Yi9lLTEpKmIqYisxKStjfSxlYXNlSW5PdXRDdWJpYzpmdW5jdGlvbihhLGIsYyxkLGUpe3JldHVybihiLz1lLzIpPDE/ZC8yKmIqYipiK2M6ZC8yKigoYi09MikqYipiKzIpK2N9LGVhc2VJblF1YXJ0OmZ1bmN0aW9uKGEsYixjLGQsZSl7cmV0dXJuIGQqKGIvPWUpKmIqYipiK2N9LGVhc2VPdXRRdWFydDpmdW5jdGlvbihhLGIsYyxkLGUpe3JldHVybi1kKigoYj1iL2UtMSkqYipiKmItMSkrY30sZWFzZUluT3V0UXVhcnQ6ZnVuY3Rpb24oYSxiLGMsZCxlKXtyZXR1cm4oYi89ZS8yKTwxP2QvMipiKmIqYipiK2M6LWQvMiooKGItPTIpKmIqYipiLTIpK2N9LGVhc2VJblF1aW50OmZ1bmN0aW9uKGEsYixjLGQsZSl7cmV0dXJuIGQqKGIvPWUpKmIqYipiKmIrY30sZWFzZU91dFF1aW50OmZ1bmN0aW9uKGEsYixjLGQsZSl7cmV0dXJuIGQqKChiPWIvZS0xKSpiKmIqYipiKzEpK2N9LGVhc2VJbk91dFF1aW50OmZ1bmN0aW9uKGEsYixjLGQsZSl7cmV0dXJuKGIvPWUvMik8MT9kLzIqYipiKmIqYipiK2M6ZC8yKigoYi09MikqYipiKmIqYisyKStjfSxlYXNlSW5TaW5lOmZ1bmN0aW9uKGEsYixjLGQsZSl7cmV0dXJuLWQqTWF0aC5jb3MoYi9lKihNYXRoLlBJLzIpKStkK2N9LGVhc2VPdXRTaW5lOmZ1bmN0aW9uKGEsYixjLGQsZSl7cmV0dXJuIGQqTWF0aC5zaW4oYi9lKihNYXRoLlBJLzIpKStjfSxlYXNlSW5PdXRTaW5lOmZ1bmN0aW9uKGEsYixjLGQsZSl7cmV0dXJuLWQvMiooTWF0aC5jb3MoTWF0aC5QSSpiL2UpLTEpK2N9LGVhc2VJbkV4cG86ZnVuY3Rpb24oYSxiLGMsZCxlKXtyZXR1cm4gYj09MD9jOmQqTWF0aC5wb3coMiwxMCooYi9lLTEpKStjfSxlYXNlT3V0RXhwbzpmdW5jdGlvbihhLGIsYyxkLGUpe3JldHVybiBiPT1lP2MrZDpkKigtTWF0aC5wb3coMiwtMTAqYi9lKSsxKStjfSxlYXNlSW5PdXRFeHBvOmZ1bmN0aW9uKGEsYixjLGQsZSl7cmV0dXJuIGI9PTA/YzpiPT1lP2MrZDooYi89ZS8yKTwxP2QvMipNYXRoLnBvdygyLDEwKihiLTEpKStjOmQvMiooLU1hdGgucG93KDIsLTEwKi0tYikrMikrY30sZWFzZUluQ2lyYzpmdW5jdGlvbihhLGIsYyxkLGUpe3JldHVybi1kKihNYXRoLnNxcnQoMS0oYi89ZSkqYiktMSkrY30sZWFzZU91dENpcmM6ZnVuY3Rpb24oYSxiLGMsZCxlKXtyZXR1cm4gZCpNYXRoLnNxcnQoMS0oYj1iL2UtMSkqYikrY30sZWFzZUluT3V0Q2lyYzpmdW5jdGlvbihhLGIsYyxkLGUpe3JldHVybihiLz1lLzIpPDE/LWQvMiooTWF0aC5zcXJ0KDEtYipiKS0xKStjOmQvMiooTWF0aC5zcXJ0KDEtKGItPTIpKmIpKzEpK2N9LGVhc2VJbkVsYXN0aWM6ZnVuY3Rpb24oYSxiLGMsZCxlKXt2YXIgZj0xLjcwMTU4LGc9MCxoPWQ7aWYoYj09MClyZXR1cm4gYztpZigoYi89ZSk9PTEpcmV0dXJuIGMrZDtnfHwoZz1lKi4zKTtpZihoPE1hdGguYWJzKGQpKXtoPWQ7dmFyIGY9Zy80fWVsc2UgdmFyIGY9Zy8oMipNYXRoLlBJKSpNYXRoLmFzaW4oZC9oKTtyZXR1cm4tKGgqTWF0aC5wb3coMiwxMCooYi09MSkpKk1hdGguc2luKChiKmUtZikqMipNYXRoLlBJL2cpKStjfSxlYXNlT3V0RWxhc3RpYzpmdW5jdGlvbihhLGIsYyxkLGUpe3ZhciBmPTEuNzAxNTgsZz0wLGg9ZDtpZihiPT0wKXJldHVybiBjO2lmKChiLz1lKT09MSlyZXR1cm4gYytkO2d8fChnPWUqLjMpO2lmKGg8TWF0aC5hYnMoZCkpe2g9ZDt2YXIgZj1nLzR9ZWxzZSB2YXIgZj1nLygyKk1hdGguUEkpKk1hdGguYXNpbihkL2gpO3JldHVybiBoKk1hdGgucG93KDIsLTEwKmIpKk1hdGguc2luKChiKmUtZikqMipNYXRoLlBJL2cpK2QrY30sZWFzZUluT3V0RWxhc3RpYzpmdW5jdGlvbihhLGIsYyxkLGUpe3ZhciBmPTEuNzAxNTgsZz0wLGg9ZDtpZihiPT0wKXJldHVybiBjO2lmKChiLz1lLzIpPT0yKXJldHVybiBjK2Q7Z3x8KGc9ZSouMyoxLjUpO2lmKGg8TWF0aC5hYnMoZCkpe2g9ZDt2YXIgZj1nLzR9ZWxzZSB2YXIgZj1nLygyKk1hdGguUEkpKk1hdGguYXNpbihkL2gpO3JldHVybiBiPDE/LTAuNSpoKk1hdGgucG93KDIsMTAqKGItPTEpKSpNYXRoLnNpbigoYiplLWYpKjIqTWF0aC5QSS9nKStjOmgqTWF0aC5wb3coMiwtMTAqKGItPTEpKSpNYXRoLnNpbigoYiplLWYpKjIqTWF0aC5QSS9nKSouNStkK2N9LGVhc2VJbkJhY2s6ZnVuY3Rpb24oYSxiLGMsZCxlLGYpe3JldHVybiBmPT11bmRlZmluZWQmJihmPTEuNzAxNTgpLGQqKGIvPWUpKmIqKChmKzEpKmItZikrY30sZWFzZU91dEJhY2s6ZnVuY3Rpb24oYSxiLGMsZCxlLGYpe3JldHVybiBmPT11bmRlZmluZWQmJihmPTEuNzAxNTgpLGQqKChiPWIvZS0xKSpiKigoZisxKSpiK2YpKzEpK2N9LGVhc2VJbk91dEJhY2s6ZnVuY3Rpb24oYSxiLGMsZCxlLGYpe3JldHVybiBmPT11bmRlZmluZWQmJihmPTEuNzAxNTgpLChiLz1lLzIpPDE/ZC8yKmIqYiooKChmKj0xLjUyNSkrMSkqYi1mKStjOmQvMiooKGItPTIpKmIqKCgoZio9MS41MjUpKzEpKmIrZikrMikrY30sZWFzZUluQm91bmNlOmZ1bmN0aW9uKGEsYixjLGQsZSl7cmV0dXJuIGQtalF1ZXJ5LmVhc2luZy5lYXNlT3V0Qm91bmNlKGEsZS1iLDAsZCxlKStjfSxlYXNlT3V0Qm91bmNlOmZ1bmN0aW9uKGEsYixjLGQsZSl7cmV0dXJuKGIvPWUpPDEvMi43NT9kKjcuNTYyNSpiKmIrYzpiPDIvMi43NT9kKig3LjU2MjUqKGItPTEuNS8yLjc1KSpiKy43NSkrYzpiPDIuNS8yLjc1P2QqKDcuNTYyNSooYi09Mi4yNS8yLjc1KSpiKy45Mzc1KStjOmQqKDcuNTYyNSooYi09Mi42MjUvMi43NSkqYisuOTg0Mzc1KStjfSxlYXNlSW5PdXRCb3VuY2U6ZnVuY3Rpb24oYSxiLGMsZCxlKXtyZXR1cm4gYjxlLzI/alF1ZXJ5LmVhc2luZy5lYXNlSW5Cb3VuY2UoYSxiKjIsMCxkLGUpKi41K2M6alF1ZXJ5LmVhc2luZy5lYXNlT3V0Qm91bmNlKGEsYioyLWUsMCxkLGUpKi41K2QqLjUrY319KTtcclxuXHJcblxyXG5cclxuLyohXHJcbiAqIGpRdWVyeSBUcmFuc2l0IC0gQ1NTMyB0cmFuc2l0aW9ucyBhbmQgdHJhbnNmb3JtYXRpb25zXHJcbiAqIChjKSAyMDExLTIwMTIgUmljbyBTdGEuIENydXogPHJpY29Acmljb3N0YWNydXouY29tPlxyXG4gKiBNSVQgTGljZW5zZWQuXHJcbiAqXHJcbiAqIGh0dHA6Ly9yaWNvc3RhY3J1ei5jb20vanF1ZXJ5LnRyYW5zaXRcclxuICogaHR0cDovL2dpdGh1Yi5jb20vcnN0YWNydXovanF1ZXJ5LnRyYW5zaXRcclxuICovXHJcbihmdW5jdGlvbihrKXtrLnRyYW5zaXQ9e3ZlcnNpb246XCIwLjkuOVwiLHByb3BlcnR5TWFwOnttYXJnaW5MZWZ0OlwibWFyZ2luXCIsbWFyZ2luUmlnaHQ6XCJtYXJnaW5cIixtYXJnaW5Cb3R0b206XCJtYXJnaW5cIixtYXJnaW5Ub3A6XCJtYXJnaW5cIixwYWRkaW5nTGVmdDpcInBhZGRpbmdcIixwYWRkaW5nUmlnaHQ6XCJwYWRkaW5nXCIscGFkZGluZ0JvdHRvbTpcInBhZGRpbmdcIixwYWRkaW5nVG9wOlwicGFkZGluZ1wifSxlbmFibGVkOnRydWUsdXNlVHJhbnNpdGlvbkVuZDpmYWxzZX07dmFyIGQ9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTt2YXIgcT17fTtmdW5jdGlvbiBiKHYpe2lmKHYgaW4gZC5zdHlsZSl7cmV0dXJuIHZ9dmFyIHU9W1wiTW96XCIsXCJXZWJraXRcIixcIk9cIixcIm1zXCJdO3ZhciByPXYuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkrdi5zdWJzdHIoMSk7aWYodiBpbiBkLnN0eWxlKXtyZXR1cm4gdn1mb3IodmFyIHQ9MDt0PHUubGVuZ3RoOysrdCl7dmFyIHM9dVt0XStyO2lmKHMgaW4gZC5zdHlsZSl7cmV0dXJuIHN9fX1mdW5jdGlvbiBlKCl7ZC5zdHlsZVtxLnRyYW5zZm9ybV09XCJcIjtkLnN0eWxlW3EudHJhbnNmb3JtXT1cInJvdGF0ZVkoOTBkZWcpXCI7cmV0dXJuIGQuc3R5bGVbcS50cmFuc2Zvcm1dIT09XCJcIn12YXIgYT1uYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkuaW5kZXhPZihcImNocm9tZVwiKT4tMTtxLnRyYW5zaXRpb249YihcInRyYW5zaXRpb25cIik7cS50cmFuc2l0aW9uRGVsYXk9YihcInRyYW5zaXRpb25EZWxheVwiKTtxLnRyYW5zZm9ybT1iKFwidHJhbnNmb3JtXCIpO3EudHJhbnNmb3JtT3JpZ2luPWIoXCJ0cmFuc2Zvcm1PcmlnaW5cIik7cS50cmFuc2Zvcm0zZD1lKCk7dmFyIGk9e3RyYW5zaXRpb246XCJ0cmFuc2l0aW9uRW5kXCIsTW96VHJhbnNpdGlvbjpcInRyYW5zaXRpb25lbmRcIixPVHJhbnNpdGlvbjpcIm9UcmFuc2l0aW9uRW5kXCIsV2Via2l0VHJhbnNpdGlvbjpcIndlYmtpdFRyYW5zaXRpb25FbmRcIixtc1RyYW5zaXRpb246XCJNU1RyYW5zaXRpb25FbmRcIn07dmFyIGY9cS50cmFuc2l0aW9uRW5kPWlbcS50cmFuc2l0aW9uXXx8bnVsbDtmb3IodmFyIHAgaW4gcSl7aWYocS5oYXNPd25Qcm9wZXJ0eShwKSYmdHlwZW9mIGsuc3VwcG9ydFtwXT09PVwidW5kZWZpbmVkXCIpe2suc3VwcG9ydFtwXT1xW3BdfX1kPW51bGw7ay5jc3NFYXNlPXtfZGVmYXVsdDpcImVhc2VcIixcImluXCI6XCJlYXNlLWluXCIsb3V0OlwiZWFzZS1vdXRcIixcImluLW91dFwiOlwiZWFzZS1pbi1vdXRcIixzbmFwOlwiY3ViaWMtYmV6aWVyKDAsMSwuNSwxKVwiLGVhc2VPdXRDdWJpYzpcImN1YmljLWJlemllciguMjE1LC42MSwuMzU1LDEpXCIsZWFzZUluT3V0Q3ViaWM6XCJjdWJpYy1iZXppZXIoLjY0NSwuMDQ1LC4zNTUsMSlcIixlYXNlSW5DaXJjOlwiY3ViaWMtYmV6aWVyKC42LC4wNCwuOTgsLjMzNSlcIixlYXNlT3V0Q2lyYzpcImN1YmljLWJlemllciguMDc1LC44MiwuMTY1LDEpXCIsZWFzZUluT3V0Q2lyYzpcImN1YmljLWJlemllciguNzg1LC4xMzUsLjE1LC44NilcIixlYXNlSW5FeHBvOlwiY3ViaWMtYmV6aWVyKC45NSwuMDUsLjc5NSwuMDM1KVwiLGVhc2VPdXRFeHBvOlwiY3ViaWMtYmV6aWVyKC4xOSwxLC4yMiwxKVwiLGVhc2VJbk91dEV4cG86XCJjdWJpYy1iZXppZXIoMSwwLDAsMSlcIixlYXNlSW5RdWFkOlwiY3ViaWMtYmV6aWVyKC41NSwuMDg1LC42OCwuNTMpXCIsZWFzZU91dFF1YWQ6XCJjdWJpYy1iZXppZXIoLjI1LC40NiwuNDUsLjk0KVwiLGVhc2VJbk91dFF1YWQ6XCJjdWJpYy1iZXppZXIoLjQ1NSwuMDMsLjUxNSwuOTU1KVwiLGVhc2VJblF1YXJ0OlwiY3ViaWMtYmV6aWVyKC44OTUsLjAzLC42ODUsLjIyKVwiLGVhc2VPdXRRdWFydDpcImN1YmljLWJlemllciguMTY1LC44NCwuNDQsMSlcIixlYXNlSW5PdXRRdWFydDpcImN1YmljLWJlemllciguNzcsMCwuMTc1LDEpXCIsZWFzZUluUXVpbnQ6XCJjdWJpYy1iZXppZXIoLjc1NSwuMDUsLjg1NSwuMDYpXCIsZWFzZU91dFF1aW50OlwiY3ViaWMtYmV6aWVyKC4yMywxLC4zMiwxKVwiLGVhc2VJbk91dFF1aW50OlwiY3ViaWMtYmV6aWVyKC44NiwwLC4wNywxKVwiLGVhc2VJblNpbmU6XCJjdWJpYy1iZXppZXIoLjQ3LDAsLjc0NSwuNzE1KVwiLGVhc2VPdXRTaW5lOlwiY3ViaWMtYmV6aWVyKC4zOSwuNTc1LC41NjUsMSlcIixlYXNlSW5PdXRTaW5lOlwiY3ViaWMtYmV6aWVyKC40NDUsLjA1LC41NSwuOTUpXCIsZWFzZUluQmFjazpcImN1YmljLWJlemllciguNiwtLjI4LC43MzUsLjA0NSlcIixlYXNlT3V0QmFjazpcImN1YmljLWJlemllciguMTc1LCAuODg1LC4zMiwxLjI3NSlcIixlYXNlSW5PdXRCYWNrOlwiY3ViaWMtYmV6aWVyKC42OCwtLjU1LC4yNjUsMS41NSlcIn07ay5jc3NIb29rc1tcInRyYW5zaXQ6dHJhbnNmb3JtXCJdPXtnZXQ6ZnVuY3Rpb24ocil7cmV0dXJuIGsocikuZGF0YShcInRyYW5zZm9ybVwiKXx8bmV3IGooKX0sc2V0OmZ1bmN0aW9uKHMscil7dmFyIHQ9cjtpZighKHQgaW5zdGFuY2VvZiBqKSl7dD1uZXcgaih0KX1pZihxLnRyYW5zZm9ybT09PVwiV2Via2l0VHJhbnNmb3JtXCImJiFhKXtzLnN0eWxlW3EudHJhbnNmb3JtXT10LnRvU3RyaW5nKHRydWUpfWVsc2V7cy5zdHlsZVtxLnRyYW5zZm9ybV09dC50b1N0cmluZygpfWsocykuZGF0YShcInRyYW5zZm9ybVwiLHQpfX07ay5jc3NIb29rcy50cmFuc2Zvcm09e3NldDprLmNzc0hvb2tzW1widHJhbnNpdDp0cmFuc2Zvcm1cIl0uc2V0fTtpZihrLmZuLmpxdWVyeTxcIjEuOFwiKXtrLmNzc0hvb2tzLnRyYW5zZm9ybU9yaWdpbj17Z2V0OmZ1bmN0aW9uKHIpe3JldHVybiByLnN0eWxlW3EudHJhbnNmb3JtT3JpZ2luXX0sc2V0OmZ1bmN0aW9uKHIscyl7ci5zdHlsZVtxLnRyYW5zZm9ybU9yaWdpbl09c319O2suY3NzSG9va3MudHJhbnNpdGlvbj17Z2V0OmZ1bmN0aW9uKHIpe3JldHVybiByLnN0eWxlW3EudHJhbnNpdGlvbl19LHNldDpmdW5jdGlvbihyLHMpe3Iuc3R5bGVbcS50cmFuc2l0aW9uXT1zfX19bihcInNjYWxlXCIpO24oXCJ0cmFuc2xhdGVcIik7bihcInJvdGF0ZVwiKTtuKFwicm90YXRlWFwiKTtuKFwicm90YXRlWVwiKTtuKFwicm90YXRlM2RcIik7bihcInBlcnNwZWN0aXZlXCIpO24oXCJza2V3WFwiKTtuKFwic2tld1lcIik7bihcInhcIix0cnVlKTtuKFwieVwiLHRydWUpO2Z1bmN0aW9uIGoocil7aWYodHlwZW9mIHI9PT1cInN0cmluZ1wiKXt0aGlzLnBhcnNlKHIpfXJldHVybiB0aGlzfWoucHJvdG90eXBlPXtzZXRGcm9tU3RyaW5nOmZ1bmN0aW9uKHQscyl7dmFyIHI9KHR5cGVvZiBzPT09XCJzdHJpbmdcIik/cy5zcGxpdChcIixcIik6KHMuY29uc3RydWN0b3I9PT1BcnJheSk/czpbc107ci51bnNoaWZ0KHQpO2oucHJvdG90eXBlLnNldC5hcHBseSh0aGlzLHIpfSxzZXQ6ZnVuY3Rpb24ocyl7dmFyIHI9QXJyYXkucHJvdG90eXBlLnNsaWNlLmFwcGx5KGFyZ3VtZW50cyxbMV0pO2lmKHRoaXMuc2V0dGVyW3NdKXt0aGlzLnNldHRlcltzXS5hcHBseSh0aGlzLHIpfWVsc2V7dGhpc1tzXT1yLmpvaW4oXCIsXCIpfX0sZ2V0OmZ1bmN0aW9uKHIpe2lmKHRoaXMuZ2V0dGVyW3JdKXtyZXR1cm4gdGhpcy5nZXR0ZXJbcl0uYXBwbHkodGhpcyl9ZWxzZXtyZXR1cm4gdGhpc1tyXXx8MH19LHNldHRlcjp7cm90YXRlOmZ1bmN0aW9uKHIpe3RoaXMucm90YXRlPW8ocixcImRlZ1wiKX0scm90YXRlWDpmdW5jdGlvbihyKXt0aGlzLnJvdGF0ZVg9byhyLFwiZGVnXCIpfSxyb3RhdGVZOmZ1bmN0aW9uKHIpe3RoaXMucm90YXRlWT1vKHIsXCJkZWdcIil9LHNjYWxlOmZ1bmN0aW9uKHIscyl7aWYocz09PXVuZGVmaW5lZCl7cz1yfXRoaXMuc2NhbGU9citcIixcIitzfSxza2V3WDpmdW5jdGlvbihyKXt0aGlzLnNrZXdYPW8ocixcImRlZ1wiKX0sc2tld1k6ZnVuY3Rpb24ocil7dGhpcy5za2V3WT1vKHIsXCJkZWdcIil9LHBlcnNwZWN0aXZlOmZ1bmN0aW9uKHIpe3RoaXMucGVyc3BlY3RpdmU9byhyLFwicHhcIil9LHg6ZnVuY3Rpb24ocil7dGhpcy5zZXQoXCJ0cmFuc2xhdGVcIixyLG51bGwpfSx5OmZ1bmN0aW9uKHIpe3RoaXMuc2V0KFwidHJhbnNsYXRlXCIsbnVsbCxyKX0sdHJhbnNsYXRlOmZ1bmN0aW9uKHIscyl7aWYodGhpcy5fdHJhbnNsYXRlWD09PXVuZGVmaW5lZCl7dGhpcy5fdHJhbnNsYXRlWD0wfWlmKHRoaXMuX3RyYW5zbGF0ZVk9PT11bmRlZmluZWQpe3RoaXMuX3RyYW5zbGF0ZVk9MH1pZihyIT09bnVsbCYmciE9PXVuZGVmaW5lZCl7dGhpcy5fdHJhbnNsYXRlWD1vKHIsXCJweFwiKX1pZihzIT09bnVsbCYmcyE9PXVuZGVmaW5lZCl7dGhpcy5fdHJhbnNsYXRlWT1vKHMsXCJweFwiKX10aGlzLnRyYW5zbGF0ZT10aGlzLl90cmFuc2xhdGVYK1wiLFwiK3RoaXMuX3RyYW5zbGF0ZVl9fSxnZXR0ZXI6e3g6ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5fdHJhbnNsYXRlWHx8MH0seTpmdW5jdGlvbigpe3JldHVybiB0aGlzLl90cmFuc2xhdGVZfHwwfSxzY2FsZTpmdW5jdGlvbigpe3ZhciByPSh0aGlzLnNjYWxlfHxcIjEsMVwiKS5zcGxpdChcIixcIik7aWYoclswXSl7clswXT1wYXJzZUZsb2F0KHJbMF0pfWlmKHJbMV0pe3JbMV09cGFyc2VGbG9hdChyWzFdKX1yZXR1cm4oclswXT09PXJbMV0pP3JbMF06cn0scm90YXRlM2Q6ZnVuY3Rpb24oKXt2YXIgdD0odGhpcy5yb3RhdGUzZHx8XCIwLDAsMCwwZGVnXCIpLnNwbGl0KFwiLFwiKTtmb3IodmFyIHI9MDtyPD0zOysrcil7aWYodFtyXSl7dFtyXT1wYXJzZUZsb2F0KHRbcl0pfX1pZih0WzNdKXt0WzNdPW8odFszXSxcImRlZ1wiKX1yZXR1cm4gdH19LHBhcnNlOmZ1bmN0aW9uKHMpe3ZhciByPXRoaXM7cy5yZXBsYWNlKC8oW2EtekEtWjAtOV0rKVxcKCguKj8pXFwpL2csZnVuY3Rpb24odCx2LHUpe3Iuc2V0RnJvbVN0cmluZyh2LHUpfSl9LHRvU3RyaW5nOmZ1bmN0aW9uKHQpe3ZhciBzPVtdO2Zvcih2YXIgciBpbiB0aGlzKXtpZih0aGlzLmhhc093blByb3BlcnR5KHIpKXtpZigoIXEudHJhbnNmb3JtM2QpJiYoKHI9PT1cInJvdGF0ZVhcIil8fChyPT09XCJyb3RhdGVZXCIpfHwocj09PVwicGVyc3BlY3RpdmVcIil8fChyPT09XCJ0cmFuc2Zvcm1PcmlnaW5cIikpKXtjb250aW51ZX1pZihyWzBdIT09XCJfXCIpe2lmKHQmJihyPT09XCJzY2FsZVwiKSl7cy5wdXNoKHIrXCIzZChcIit0aGlzW3JdK1wiLDEpXCIpfWVsc2V7aWYodCYmKHI9PT1cInRyYW5zbGF0ZVwiKSl7cy5wdXNoKHIrXCIzZChcIit0aGlzW3JdK1wiLDApXCIpfWVsc2V7cy5wdXNoKHIrXCIoXCIrdGhpc1tyXStcIilcIil9fX19fXJldHVybiBzLmpvaW4oXCIgXCIpfX07ZnVuY3Rpb24gbShzLHIsdCl7aWYocj09PXRydWUpe3MucXVldWUodCl9ZWxzZXtpZihyKXtzLnF1ZXVlKHIsdCl9ZWxzZXt0KCl9fX1mdW5jdGlvbiBoKHMpe3ZhciByPVtdO2suZWFjaChzLGZ1bmN0aW9uKHQpe3Q9ay5jYW1lbENhc2UodCk7dD1rLnRyYW5zaXQucHJvcGVydHlNYXBbdF18fGsuY3NzUHJvcHNbdF18fHQ7dD1jKHQpO2lmKGsuaW5BcnJheSh0LHIpPT09LTEpe3IucHVzaCh0KX19KTtyZXR1cm4gcn1mdW5jdGlvbiBnKHMsdix4LHIpe3ZhciB0PWgocyk7aWYoay5jc3NFYXNlW3hdKXt4PWsuY3NzRWFzZVt4XX12YXIgdz1cIlwiK2wodikrXCIgXCIreDtpZihwYXJzZUludChyLDEwKT4wKXt3Kz1cIiBcIitsKHIpfXZhciB1PVtdO2suZWFjaCh0LGZ1bmN0aW9uKHoseSl7dS5wdXNoKHkrXCIgXCIrdyl9KTtyZXR1cm4gdS5qb2luKFwiLCBcIil9ay5mbi50cmFuc2l0aW9uPWsuZm4udHJhbnNpdD1mdW5jdGlvbih6LHMseSxDKXt2YXIgRD10aGlzO3ZhciB1PTA7dmFyIHc9dHJ1ZTtpZih0eXBlb2Ygcz09PVwiZnVuY3Rpb25cIil7Qz1zO3M9dW5kZWZpbmVkfWlmKHR5cGVvZiB5PT09XCJmdW5jdGlvblwiKXtDPXk7eT11bmRlZmluZWR9aWYodHlwZW9mIHouZWFzaW5nIT09XCJ1bmRlZmluZWRcIil7eT16LmVhc2luZztkZWxldGUgei5lYXNpbmd9aWYodHlwZW9mIHouZHVyYXRpb24hPT1cInVuZGVmaW5lZFwiKXtzPXouZHVyYXRpb247ZGVsZXRlIHouZHVyYXRpb259aWYodHlwZW9mIHouY29tcGxldGUhPT1cInVuZGVmaW5lZFwiKXtDPXouY29tcGxldGU7ZGVsZXRlIHouY29tcGxldGV9aWYodHlwZW9mIHoucXVldWUhPT1cInVuZGVmaW5lZFwiKXt3PXoucXVldWU7ZGVsZXRlIHoucXVldWV9aWYodHlwZW9mIHouZGVsYXkhPT1cInVuZGVmaW5lZFwiKXt1PXouZGVsYXk7ZGVsZXRlIHouZGVsYXl9aWYodHlwZW9mIHM9PT1cInVuZGVmaW5lZFwiKXtzPWsuZnguc3BlZWRzLl9kZWZhdWx0fWlmKHR5cGVvZiB5PT09XCJ1bmRlZmluZWRcIil7eT1rLmNzc0Vhc2UuX2RlZmF1bHR9cz1sKHMpO3ZhciBFPWcoeixzLHksdSk7dmFyIEI9ay50cmFuc2l0LmVuYWJsZWQmJnEudHJhbnNpdGlvbjt2YXIgdD1CPyhwYXJzZUludChzLDEwKStwYXJzZUludCh1LDEwKSk6MDtpZih0PT09MCl7dmFyIEE9ZnVuY3Rpb24oRil7RC5jc3Moeik7aWYoQyl7Qy5hcHBseShEKX1pZihGKXtGKCl9fTttKEQsdyxBKTtyZXR1cm4gRH12YXIgeD17fTt2YXIgcj1mdW5jdGlvbihIKXt2YXIgRz1mYWxzZTt2YXIgRj1mdW5jdGlvbigpe2lmKEcpe0QudW5iaW5kKGYsRil9aWYodD4wKXtELmVhY2goZnVuY3Rpb24oKXt0aGlzLnN0eWxlW3EudHJhbnNpdGlvbl09KHhbdGhpc118fG51bGwpfSl9aWYodHlwZW9mIEM9PT1cImZ1bmN0aW9uXCIpe0MuYXBwbHkoRCl9aWYodHlwZW9mIEg9PT1cImZ1bmN0aW9uXCIpe0goKX19O2lmKCh0PjApJiYoZikmJihrLnRyYW5zaXQudXNlVHJhbnNpdGlvbkVuZCkpe0c9dHJ1ZTtELmJpbmQoZixGKX1lbHNle3dpbmRvdy5zZXRUaW1lb3V0KEYsdCl9RC5lYWNoKGZ1bmN0aW9uKCl7aWYodD4wKXt0aGlzLnN0eWxlW3EudHJhbnNpdGlvbl09RX1rKHRoaXMpLmNzcyh6KX0pfTt2YXIgdj1mdW5jdGlvbihGKXt0aGlzLm9mZnNldFdpZHRoO3IoRil9O20oRCx3LHYpO3JldHVybiB0aGlzfTtmdW5jdGlvbiBuKHMscil7aWYoIXIpe2suY3NzTnVtYmVyW3NdPXRydWV9ay50cmFuc2l0LnByb3BlcnR5TWFwW3NdPXEudHJhbnNmb3JtO2suY3NzSG9va3Nbc109e2dldDpmdW5jdGlvbih2KXt2YXIgdT1rKHYpLmNzcyhcInRyYW5zaXQ6dHJhbnNmb3JtXCIpO3JldHVybiB1LmdldChzKX0sc2V0OmZ1bmN0aW9uKHYsdyl7dmFyIHU9ayh2KS5jc3MoXCJ0cmFuc2l0OnRyYW5zZm9ybVwiKTt1LnNldEZyb21TdHJpbmcocyx3KTtrKHYpLmNzcyh7XCJ0cmFuc2l0OnRyYW5zZm9ybVwiOnV9KX19fWZ1bmN0aW9uIGMocil7cmV0dXJuIHIucmVwbGFjZSgvKFtBLVpdKS9nLGZ1bmN0aW9uKHMpe3JldHVyblwiLVwiK3MudG9Mb3dlckNhc2UoKX0pfWZ1bmN0aW9uIG8ocyxyKXtpZigodHlwZW9mIHM9PT1cInN0cmluZ1wiKSYmKCFzLm1hdGNoKC9eW1xcLTAtOVxcLl0rJC8pKSl7cmV0dXJuIHN9ZWxzZXtyZXR1cm5cIlwiK3Mrcn19ZnVuY3Rpb24gbChzKXt2YXIgcj1zO2lmKGsuZnguc3BlZWRzW3JdKXtyPWsuZnguc3BlZWRzW3JdfXJldHVybiBvKHIsXCJtc1wiKX1rLnRyYW5zaXQuZ2V0VHJhbnNpdGlvblZhbHVlPWd9KShqUXVlcnkpO1xyXG5cclxuXHJcblxyXG4vKipcclxuICogRmxhdHRlbiBoZWlnaHQgc2FtZSBhcyB0aGUgaGlnaGVzdCBlbGVtZW50IGZvciBlYWNoIHJvdy5cclxuICpcclxuICogQ29weXJpZ2h0IChjKSAyMDExIEhheWF0byBUYWtlbmFrYVxyXG4gKiBEdWFsIGxpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgYW5kIEdQTCBsaWNlbnNlczpcclxuICogaHR0cDovL3d3dy5vcGVuc291cmNlLm9yZy9saWNlbnNlcy9taXQtbGljZW5zZS5waHBcclxuICogaHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzL2dwbC5odG1sXHJcbiAqIEBhdXRob3I6IEhheWF0byBUYWtlbmFrYSAoaHR0cDovL3VyaW4udGFrZS11bWEubmV0KVxyXG4gKiBAdmVyc2lvbjogMC4wLjJcclxuKiovXHJcbjsoZnVuY3Rpb24oJCkge1xyXG5cdCQuZm4udGlsZSA9IGZ1bmN0aW9uKGNvbHVtbnMpIHtcclxuXHRcdHZhciB0aWxlcywgbWF4LCBjLCBoLCBsYXN0ID0gdGhpcy5sZW5ndGggLSAxLCBzO1xyXG5cdFx0aWYoIWNvbHVtbnMpIGNvbHVtbnMgPSB0aGlzLmxlbmd0aDtcclxuXHRcdHRoaXMuZWFjaChmdW5jdGlvbigpIHtcclxuXHRcdFx0cyA9IHRoaXMuc3R5bGU7XHJcblx0XHRcdGlmKHMucmVtb3ZlUHJvcGVydHkpIHMucmVtb3ZlUHJvcGVydHkoXCJoZWlnaHRcIik7XHJcblx0XHRcdGlmKHMucmVtb3ZlQXR0cmlidXRlKSBzLnJlbW92ZUF0dHJpYnV0ZShcImhlaWdodFwiKTtcclxuXHRcdH0pO1xyXG5cdFx0cmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbihpKSB7XHJcblx0XHRcdGMgPSBpICUgY29sdW1ucztcclxuXHRcdFx0aWYoYyA9PSAwKSB0aWxlcyA9IFtdO1xyXG5cdFx0XHR0aWxlc1tjXSA9ICQodGhpcyk7XHJcblx0XHRcdGggPSB0aWxlc1tjXS5oZWlnaHQoKTtcclxuXHRcdFx0aWYoYyA9PSAwIHx8IGggPiBtYXgpIG1heCA9IGg7XHJcblx0XHRcdGlmKGkgPT0gbGFzdCB8fCBjID09IGNvbHVtbnMgLSAxKVxyXG5cdFx0XHRcdCQuZWFjaCh0aWxlcywgZnVuY3Rpb24oKSB7IHRoaXMuaGVpZ2h0KG1heCk7IH0pO1xyXG5cdFx0fSk7XHJcblx0fTtcclxufSkoalF1ZXJ5KTtcclxuXHJcblxyXG5cclxuLypcclxuICogalF1ZXJ5IHRocm90dGxlIC8gZGVib3VuY2UgLSB2MS4xIC0gMy83LzIwMTBcclxuICogaHR0cDovL2JlbmFsbWFuLmNvbS9wcm9qZWN0cy9qcXVlcnktdGhyb3R0bGUtZGVib3VuY2UtcGx1Z2luL1xyXG4gKlxyXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTAgXCJDb3dib3lcIiBCZW4gQWxtYW5cclxuICogRHVhbCBsaWNlbnNlZCB1bmRlciB0aGUgTUlUIGFuZCBHUEwgbGljZW5zZXMuXHJcbiAqIGh0dHA6Ly9iZW5hbG1hbi5jb20vYWJvdXQvbGljZW5zZS9cclxuICovXHJcbihmdW5jdGlvbihiLGMpe3ZhciAkPWIualF1ZXJ5fHxiLkNvd2JveXx8KGIuQ293Ym95PXt9KSxhOyQudGhyb3R0bGU9YT1mdW5jdGlvbihlLGYsaixpKXt2YXIgaCxkPTA7aWYodHlwZW9mIGYhPT1cImJvb2xlYW5cIil7aT1qO2o9ZjtmPWN9ZnVuY3Rpb24gZygpe3ZhciBvPXRoaXMsbT0rbmV3IERhdGUoKS1kLG49YXJndW1lbnRzO2Z1bmN0aW9uIGwoKXtkPStuZXcgRGF0ZSgpO2ouYXBwbHkobyxuKX1mdW5jdGlvbiBrKCl7aD1jfWlmKGkmJiFoKXtsKCl9aCYmY2xlYXJUaW1lb3V0KGgpO2lmKGk9PT1jJiZtPmUpe2woKX1lbHNle2lmKGYhPT10cnVlKXtoPXNldFRpbWVvdXQoaT9rOmwsaT09PWM/ZS1tOmUpfX19aWYoJC5ndWlkKXtnLmd1aWQ9ai5ndWlkPWouZ3VpZHx8JC5ndWlkKyt9cmV0dXJuIGd9OyQuZGVib3VuY2U9ZnVuY3Rpb24oZCxlLGYpe3JldHVybiBmPT09Yz9hKGQsZSxmYWxzZSk6YShkLGYsZSE9PWZhbHNlKX19KSh0aGlzKTtcclxuIiwiLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xuXG4vKiFcbiAqIEEgbGlnaHR3ZWlnaHQsIGRlcGVuZGVuY3ktZnJlZSBhbmQgcmVzcG9uc2l2ZSBqYXZhc2NyaXB0IHBsdWdpbiBmb3IgcGFydGljbGUgYmFja2dyb3VuZHMuXG4gKlxuICogQGF1dGhvciBNYXJjIEJydWVkZXJsaW4gPGhlbGxvQG1hcmNicnVlZGVybGluLmNvbT5cbiAqIEB2ZXJzaW9uIDIuMC4yXG4gKiBAbGljZW5zZSBNSVRcbiAqIEBzZWUgaHR0cHM6Ly9naXRodWIuY29tL21hcmNicnVlZGVybGluL3BhcnRpY2xlcy5qc1xuICovXG52YXIgUGFydGljbGVzPWZ1bmN0aW9uKHQsZSl7XCJ1c2Ugc3RyaWN0XCI7dmFyIG8saT17fTtyZXR1cm4gbz1mdW5jdGlvbigpe2Z1bmN0aW9uIHQoKXt2YXIgdD10aGlzO3QuZGVmYXVsdHM9e3Jlc3BvbnNpdmU6bnVsbCxzZWxlY3RvcjpudWxsLG1heFBhcnRpY2xlczoxMDAsc2l6ZVZhcmlhdGlvbnM6MyxzcGVlZDouNSxjb2xvcjpcIiMwMDAwMDBcIixtaW5EaXN0YW5jZToxMjAsY29ubmVjdFBhcnRpY2xlczohMX0sdC5lbGVtZW50PW51bGwsdC5jb250ZXh0PW51bGwsdC5yYXRpbz1udWxsLHQuYnJlYWtwb2ludHM9W10sdC5hY3RpdmVCcmVha3BvaW50PW51bGwsdC5icmVha3BvaW50U2V0dGluZ3M9W10sdC5vcmlnaW5hbFNldHRpbmdzPW51bGwsdC5zdG9yYWdlPVtdfXJldHVybiB0fSgpLG8ucHJvdG90eXBlLmluaXQ9ZnVuY3Rpb24odCl7dmFyIGU9dGhpcztlLm9wdGlvbnM9ZS5fZXh0ZW5kKGUuZGVmYXVsdHMsdCksZS5vcHRpb25zLmNvbG9yPXQuY29sb3I/ZS5faGV4MnJnYih0LmNvbG9yKTplLl9oZXgycmdiKGUuZGVmYXVsdHMuY29sb3IpLGUub3JpZ2luYWxTZXR0aW5ncz1KU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGUub3B0aW9ucykpLGUuX2luaXRpYWxpemVDYW52YXMoKSxlLl9pbml0aWFsaXplRXZlbnRzKCksZS5fcmVnaXN0ZXJCcmVha3BvaW50cygpLGUuX2NoZWNrUmVzcG9uc2l2ZSgpLGUuX2luaXRpYWxpemVTdG9yYWdlKCksZS5fYW5pbWF0ZSgpfSxvLnByb3RvdHlwZS5faW5pdGlhbGl6ZUNhbnZhcz1mdW5jdGlvbigpe3ZhciBvLGksbj10aGlzO3JldHVybiBuLm9wdGlvbnMuc2VsZWN0b3I/KG4uZWxlbWVudD1lLnF1ZXJ5U2VsZWN0b3Iobi5vcHRpb25zLnNlbGVjdG9yKSxuLmNvbnRleHQ9bi5lbGVtZW50LmdldENvbnRleHQoXCIyZFwiKSxvPXQuZGV2aWNlUGl4ZWxSYXRpb3x8MSxpPW4uY29udGV4dC53ZWJraXRCYWNraW5nU3RvcmVQaXhlbFJhdGlvfHxuLmNvbnRleHQubW96QmFja2luZ1N0b3JlUGl4ZWxSYXRpb3x8bi5jb250ZXh0Lm1zQmFja2luZ1N0b3JlUGl4ZWxSYXRpb3x8bi5jb250ZXh0Lm9CYWNraW5nU3RvcmVQaXhlbFJhdGlvfHxuLmNvbnRleHQuYmFja2luZ1N0b3JlUGl4ZWxSYXRpb3x8MSxuLnJhdGlvPW8vaSxuLmVsZW1lbnQud2lkdGg9dC5pbm5lcldpZHRoKm4ucmF0aW8sbi5lbGVtZW50LmhlaWdodD10LmlubmVySGVpZ2h0Km4ucmF0aW8sbi5lbGVtZW50LnN0eWxlLndpZHRoPVwiMTAwJVwiLG4uZWxlbWVudC5zdHlsZS5oZWlnaHQ9XCIxMDAlXCIsdm9pZCBuLmNvbnRleHQuc2NhbGUobi5yYXRpbyxuLnJhdGlvKSk6KGNvbnNvbGUud2FybihcInBhcnRpY2xlcy5qczogTm8gc2VsZWN0b3Igc3BlY2lmaWVkISBDaGVjayBodHRwczovL2dpdGh1Yi5jb20vbWFyY2JydWVkZXJsaW4vcGFydGljbGVzLmpzI29wdGlvbnNcIiksITEpfSxvLnByb3RvdHlwZS5faW5pdGlhbGl6ZUV2ZW50cz1mdW5jdGlvbigpe3ZhciBlPXRoaXM7dC5hZGRFdmVudExpc3RlbmVyKFwicmVzaXplXCIsZS5fcmVzaXplLmJpbmQoZSksITEpfSxvLnByb3RvdHlwZS5faW5pdGlhbGl6ZVN0b3JhZ2U9ZnVuY3Rpb24oKXt2YXIgdD10aGlzO3Quc3RvcmFnZT1bXTtmb3IodmFyIGU9dC5vcHRpb25zLm1heFBhcnRpY2xlcztlLS07KXQuc3RvcmFnZS5wdXNoKG5ldyBpKHQuY29udGV4dCx0Lm9wdGlvbnMpKX0sby5wcm90b3R5cGUuX3JlZ2lzdGVyQnJlYWtwb2ludHM9ZnVuY3Rpb24oKXt2YXIgdCxlLG8saT10aGlzLG49aS5vcHRpb25zLnJlc3BvbnNpdmV8fG51bGw7aWYoXCJvYmplY3RcIj09dHlwZW9mIG4mJm51bGwhPT1uJiZuLmxlbmd0aCl7Zm9yKHQgaW4gbilpZihvPWkuYnJlYWtwb2ludHMubGVuZ3RoLTEsZT1uW3RdLmJyZWFrcG9pbnQsbi5oYXNPd25Qcm9wZXJ0eSh0KSl7Zm9yKG5bdF0ub3B0aW9ucy5jb2xvciYmKG5bdF0ub3B0aW9ucy5jb2xvcj1pLl9oZXgycmdiKG5bdF0ub3B0aW9ucy5jb2xvcikpO28+PTA7KWkuYnJlYWtwb2ludHNbb10mJmkuYnJlYWtwb2ludHNbb109PT1lJiZpLmJyZWFrcG9pbnRzLnNwbGljZShvLDEpLG8tLTtpLmJyZWFrcG9pbnRzLnB1c2goZSksaS5icmVha3BvaW50U2V0dGluZ3NbZV09blt0XS5vcHRpb25zfWkuYnJlYWtwb2ludHMuc29ydChmdW5jdGlvbih0LGUpe3JldHVybiBlLXR9KX19LG8ucHJvdG90eXBlLl9jaGVja1Jlc3BvbnNpdmU9ZnVuY3Rpb24oKXt2YXIgZSxvPXRoaXMsaT0hMSxuPXQuaW5uZXJXaWR0aDtpZihvLm9wdGlvbnMucmVzcG9uc2l2ZSYmby5vcHRpb25zLnJlc3BvbnNpdmUubGVuZ3RoJiZudWxsIT09by5vcHRpb25zLnJlc3BvbnNpdmUpe2k9bnVsbDtmb3IoZSBpbiBvLmJyZWFrcG9pbnRzKW8uYnJlYWtwb2ludHMuaGFzT3duUHJvcGVydHkoZSkmJm48PW8uYnJlYWtwb2ludHNbZV0mJihpPW8uYnJlYWtwb2ludHNbZV0pO251bGwhPT1pPyhvLmFjdGl2ZUJyZWFrcG9pbnQ9aSxvLm9wdGlvbnM9by5fZXh0ZW5kKG8ub3B0aW9ucyxvLmJyZWFrcG9pbnRTZXR0aW5nc1tpXSkpOm51bGwhPT1vLmFjdGl2ZUJyZWFrcG9pbnQmJihvLmFjdGl2ZUJyZWFrcG9pbnQ9bnVsbCxpPW51bGwsby5vcHRpb25zPW8uX2V4dGVuZChvLm9wdGlvbnMsby5vcmlnaW5hbFNldHRpbmdzKSl9fSxvLnByb3RvdHlwZS5fcmVmcmVzaD1mdW5jdGlvbigpe3ZhciB0PXRoaXM7dC5faW5pdGlhbGl6ZVN0b3JhZ2UoKSx0Ll91cGRhdGUoKX0sby5wcm90b3R5cGUuX3Jlc2l6ZT1mdW5jdGlvbigpe3ZhciBlPXRoaXM7ZS5lbGVtZW50LndpZHRoPXQuaW5uZXJXaWR0aCplLnJhdGlvLGUuZWxlbWVudC5oZWlnaHQ9dC5pbm5lckhlaWdodCplLnJhdGlvLGUuY29udGV4dC5zY2FsZShlLnJhdGlvLGUucmF0aW8pLGNsZWFyVGltZW91dChlLndpbmRvd0RlbGF5KSxlLndpbmRvd0RlbGF5PXQuc2V0VGltZW91dChmdW5jdGlvbigpe2UuX2NoZWNrUmVzcG9uc2l2ZSgpLGUuX3JlZnJlc2goKX0sNTApfSxvLnByb3RvdHlwZS5fYW5pbWF0ZT1mdW5jdGlvbigpe3ZhciBlPXRoaXM7ZS5fZHJhdygpLHQucmVxdWVzdEFuaW1GcmFtZShlLl9hbmltYXRlLmJpbmQoZSkpfSxvLnByb3RvdHlwZS5fZHJhdz1mdW5jdGlvbigpe3ZhciB0PXRoaXM7dC5jb250ZXh0LmNsZWFyUmVjdCgwLDAsdC5lbGVtZW50LndpZHRoLHQuZWxlbWVudC5oZWlnaHQpO2Zvcih2YXIgZT10LnN0b3JhZ2UubGVuZ3RoO2UtLTspe3ZhciBvPXQuc3RvcmFnZVtlXTtvLl9kcmF3KCl9dC5fdXBkYXRlKCl9LG8ucHJvdG90eXBlLl91cGRhdGU9ZnVuY3Rpb24oKXtmb3IodmFyIGU9dGhpcyxvPWUuc3RvcmFnZS5sZW5ndGg7by0tOyl7dmFyIGk9ZS5zdG9yYWdlW29dO2lmKGkueCs9aS52eCxpLnkrPWkudnksaS54K2kucmFkaXVzPnQuaW5uZXJXaWR0aD9pLng9aS5yYWRpdXM6aS54LWkucmFkaXVzPDAmJihpLng9dC5pbm5lcldpZHRoLWkucmFkaXVzKSxpLnkraS5yYWRpdXM+dC5pbm5lckhlaWdodD9pLnk9aS5yYWRpdXM6aS55LWkucmFkaXVzPDAmJihpLnk9dC5pbm5lckhlaWdodC1pLnJhZGl1cyksZS5vcHRpb25zLmNvbm5lY3RQYXJ0aWNsZXMpZm9yKHZhciBuPW8rMTtuPGUuc3RvcmFnZS5sZW5ndGg7bisrKXt2YXIgcj1lLnN0b3JhZ2Vbbl07ZS5fY2FsY3VsYXRlRGlzdGFuY2UoaSxyKX19fSxvLnByb3RvdHlwZS5fY2FsY3VsYXRlRGlzdGFuY2U9ZnVuY3Rpb24odCxlKXt2YXIgbyxpPXRoaXMsbj10LngtZS54LHI9dC55LWUueTtvPU1hdGguc3FydChuKm4rcipyKSxvPD1pLm9wdGlvbnMubWluRGlzdGFuY2UmJihpLmNvbnRleHQuYmVnaW5QYXRoKCksaS5jb250ZXh0LnN0cm9rZVN0eWxlPVwicmdiYShcIitpLm9wdGlvbnMuY29sb3IucitcIiwgXCIraS5vcHRpb25zLmNvbG9yLmcrXCIsIFwiK2kub3B0aW9ucy5jb2xvci5iK1wiLCBcIisoMS4yLW8vaS5vcHRpb25zLm1pbkRpc3RhbmNlKStcIilcIixpLmNvbnRleHQubW92ZVRvKHQueCx0LnkpLGkuY29udGV4dC5saW5lVG8oZS54LGUueSksaS5jb250ZXh0LnN0cm9rZSgpLGkuY29udGV4dC5jbG9zZVBhdGgoKSl9LG8ucHJvdG90eXBlLl9leHRlbmQ9ZnVuY3Rpb24odCxlKXtyZXR1cm4gT2JqZWN0LmtleXMoZSkuZm9yRWFjaChmdW5jdGlvbihvKXt0W29dPWVbb119KSx0fSxvLnByb3RvdHlwZS5faGV4MnJnYj1mdW5jdGlvbih0KXt2YXIgZT0vXiM/KFthLWZcXGRdezJ9KShbYS1mXFxkXXsyfSkoW2EtZlxcZF17Mn0pJC9pLmV4ZWModCk7cmV0dXJuIGU/e3I6cGFyc2VJbnQoZVsxXSwxNiksZzpwYXJzZUludChlWzJdLDE2KSxiOnBhcnNlSW50KGVbM10sMTYpfTpudWxsfSxpPWZ1bmN0aW9uKGUsbyl7dmFyIGk9dGhpcztpLmNvbnRleHQ9ZSxpLm9wdGlvbnM9byxpLng9TWF0aC5yYW5kb20oKSp0LmlubmVyV2lkdGgsaS55PU1hdGgucmFuZG9tKCkqdC5pbm5lckhlaWdodCxpLnZ4PU1hdGgucmFuZG9tKCkqaS5vcHRpb25zLnNwZWVkKjItaS5vcHRpb25zLnNwZWVkLGkudnk9TWF0aC5yYW5kb20oKSppLm9wdGlvbnMuc3BlZWQqMi1pLm9wdGlvbnMuc3BlZWQsaS5yYWRpdXM9TWF0aC5yYW5kb20oKSpNYXRoLnJhbmRvbSgpKmkub3B0aW9ucy5zaXplVmFyaWF0aW9ucyxpLl9kcmF3KCl9LGkucHJvdG90eXBlLl9kcmF3PWZ1bmN0aW9uKCl7dmFyIHQ9dGhpczt0LmNvbnRleHQuZmlsbFN0eWxlPVwicmdiKFwiK3Qub3B0aW9ucy5jb2xvci5yK1wiLCBcIit0Lm9wdGlvbnMuY29sb3IuZytcIiwgXCIrdC5vcHRpb25zLmNvbG9yLmIrXCIpXCIsdC5jb250ZXh0LmJlZ2luUGF0aCgpLHQuY29udGV4dC5hcmModC54LHQueSx0LnJhZGl1cywwLDIqTWF0aC5QSSwhMSksdC5jb250ZXh0LmZpbGwoKX0sdC5yZXF1ZXN0QW5pbUZyYW1lPWZ1bmN0aW9uKCl7cmV0dXJuIHQucmVxdWVzdEFuaW1hdGlvbkZyYW1lfHx0LndlYmtpdFJlcXVlc3RBbmltYXRpb25GcmFtZXx8dC5tb3pSZXF1ZXN0QW5pbWF0aW9uRnJhbWV8fGZ1bmN0aW9uKGUpe3Quc2V0VGltZW91dChlLDFlMy82MCl9fSgpLG5ldyBvfSh3aW5kb3csZG9jdW1lbnQpOyFmdW5jdGlvbigpe1widXNlIHN0cmljdFwiO1wiZnVuY3Rpb25cIj09dHlwZW9mIGRlZmluZSYmZGVmaW5lLmFtZD9kZWZpbmUoXCJQYXJ0aWNsZXNcIixmdW5jdGlvbigpe3JldHVybiBQYXJ0aWNsZXN9KTpcInVuZGVmaW5lZFwiIT10eXBlb2YgbW9kdWxlJiZtb2R1bGUuZXhwb3J0cz9tb2R1bGUuZXhwb3J0cz1QYXJ0aWNsZXM6d2luZG93LlBhcnRpY2xlcz1QYXJ0aWNsZXN9KCk7XG4iXX0=
