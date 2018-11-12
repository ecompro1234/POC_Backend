(function e(t, n, r) {
    function s(o, u) {
        if (!n[o]) {
            if (!t[o]) {
                var a = typeof require == "function" && require;
                if (!u && a) return a(o, !0);
                if (i) return i(o, !0);
                var f = new Error("Cannot find module '" + o + "'");
                throw f.code = "MODULE_NOT_FOUND", f
            }
            var l = n[o] = {
                exports: {}
            };
            t[o][0].call(l.exports, function(e) {
                var n = t[o][1][e];
                return s(n ? n : e)
            }, l, l.exports, e, t, n, r)
        }
        return n[o].exports
    }
    var i = typeof require == "function" && require;
    for (var o = 0; o < r.length; o++) s(r[o]);
    return s
})({
    1: [function(require, module, exports) {
        (function(global) {
            "use strict";

            function dispatchEvent(el, eventName) {
                function _CustomEvent(event, params) {
                    params = params || {
                        bubbles: false,
                        cancelable: false,
                        detail: undefined
                    };
                    var evt = document.createEvent("CustomEvent");
                    evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
                    return evt
                }
                _CustomEvent.prototype = global.Event.prototype;
                var event;
                if (global.CustomEvent) {
                    event = new global.CustomEvent(eventName)
                } else {
                    event = new _CustomEvent(eventName)
                }
                event && el.dispatchEvent(event)
            }

            function getFocusableChildren(node) {
                var focusableElements = ["a[href]", "area[href]", "input:not([disabled])", "select:not([disabled])", "textarea:not([disabled])", "button:not([disabled])", "iframe", "object", "embed", "[contenteditable]", '[tabindex]:not([tabindex^="-"])'];
                return $$(focusableElements.join(","), node).filter(function(child) {
                    return !!(child.offsetWidth || child.offsetHeight || child.getClientRects().length)
                })
            }

            function $$(selector, context) {
                return Array.prototype.slice.call((context || document).querySelectorAll(selector))
            }

            function trapTabKey(node, event) {
                var focusableChildren = getFocusableChildren(node);
                var focusedItemIndex = focusableChildren.indexOf(document.activeElement);
                if (event.shiftKey && focusedItemIndex === 0) {
                    focusableChildren[focusableChildren.length - 1].focus();
                    event.preventDefault()
                } else if (!event.shiftKey && focusedItemIndex === focusableChildren.length - 1) {
                    focusableChildren[0].focus();
                    event.preventDefault()
                }
            }

            function setFocusToFirstItem(node) {
                var focusableChildren = getFocusableChildren(node);
                if (focusableChildren.length) focusableChildren[0].focus()
            }
            var focusedBeforeDialog;
            var A11yDialog = function(node, main) {
                var namespace = "data-a11y-dialog";
                var that = this;
                main = main || document.querySelector("#main");
                this.shown = false;
                this.show = show;
                this.hide = hide;
                $$("[" + namespace + '-show="' + node.id + '"]').forEach(function(opener) {
                    opener.addEventListener("click", show)
                });
                $$("[" + namespace + "-hide]", node).concat($$("[" + namespace + '-hide="' + node.id + '"]')).forEach(function(closer) {
                    closer.addEventListener("click", hide)
                });
                document.addEventListener("keydown", function(event) {
                    if (that.shown && event.which === 27) {
                        event.preventDefault();
                        hide()
                    }
                    if (that.shown && event.which === 9) {
                        trapTabKey(node, event)
                    }
                });

                function maintainFocus(event) {
                    if (that.shown && !node.contains(event.target)) {
                        setFocusToFirstItem(node)
                    }
                }

                function show() {
                    that.shown = true;
                    node.removeAttribute("aria-hidden");
                    main.setAttribute("aria-hidden", "true");
                    focusedBeforeDialog = document.activeElement;
                    setFocusToFirstItem(node);
                    document.body.addEventListener("focus", maintainFocus, true);
                    dispatchEvent(node, "dialog:show")
                }

                function hide() {
                    that.shown = false;
                    node.setAttribute("aria-hidden", "true");
                    main.removeAttribute("aria-hidden");
                    focusedBeforeDialog && focusedBeforeDialog.focus();
                    document.body.removeEventListener("focus", maintainFocus, true);
                    dispatchEvent(node, "dialog:hide")
                }
            };
            if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
                module.exports = A11yDialog
            } else if (typeof define === "function" && define.amd) {
                define("A11yDialog", [], function() {
                    return A11yDialog
                })
            } else if (typeof global === "object") {
                global.A11yDialog = A11yDialog
            }
        })(window)
    }, {}],
    2: [function(require, module, exports) {
        "use strict";
        var extend = require("./util").extend;
        var defaultOpts = {
            collapseOthers: false,
            customHiding: false,
            contentPrefix: "accordion",
            openFirst: false
        };
        var defaultSelectors = {
            body: ".js-accordion",
            trigger: "button"
        };
        var Accordion = function(selectors, opts) {
            this.selectors = extend({}, defaultSelectors, selectors);
            this.opts = extend({}, defaultOpts, opts);
            this.body = document.querySelector(this.selectors.body);
            this.triggers = this.findTriggers();
            this.listeners = [];
            this.addEventListener(this.body, "click", this.handleClickBody.bind(this));
            if (this.opts.openFirst) {
                this.expand(this.triggers[0])
            }
        };
        Accordion.prototype.handleClickBody = function(e) {
            if (this.triggers.indexOf(e.target) > -1) {
                this.toggle(e.target)
            } else {
                var self = this;
                this.triggers.forEach(function(trigger) {
                    if (e.target.parentElement === trigger) {
                        self.toggle(trigger)
                    }
                })
            }
        };
        Accordion.prototype.findTriggers = function() {
            var self = this;
            var triggers = [].slice.call(this.body.querySelectorAll(this.selectors.trigger));
            triggers.forEach(function(trigger, index) {
                self.setAria(trigger, index)
            });
            return triggers
        };
        Accordion.prototype.setAria = function(trigger, index) {
            var content = trigger.nextElementSibling;
            var contentID;
            if (content.hasAttribute("id")) {
                contentID = content.getAttribute("id")
            } else {
                contentID = this.opts.contentPrefix + "-" + "content-" + index;
                content.setAttribute("id", contentID)
            }
            trigger.setAttribute("aria-controls", contentID);
            trigger.setAttribute("aria-expanded", "false");
            content.setAttribute("aria-hidden", "true");
            this.setStyles(content)
        };
        Accordion.prototype.toggle = function(elm) {
            var f = elm.getAttribute("aria-expanded") === "true" ? this.collapse : this.expand;
            f.call(this, elm)
        };
        Accordion.prototype.expand = function(button) {
            if (this.opts.collapseOthers) {
                this.collapseAll()
            }
            var content = document.getElementById(button.getAttribute("aria-controls"));
            button.setAttribute("aria-expanded", "true");
            content.setAttribute("aria-hidden", "false");
            this.setStyles(content)
        };
        Accordion.prototype.collapse = function(button) {
            var content = document.getElementById(button.getAttribute("aria-controls"));
            button.setAttribute("aria-expanded", "false");
            content.setAttribute("aria-hidden", "true");
            this.setStyles(content)
        };
        Accordion.prototype.collapseAll = function() {
            var self = this;
            this.triggers.forEach(function(trigger) {
                self.collapse(trigger)
            })
        };
        Accordion.prototype.expandAll = function() {
            var self = this;
            this.triggers.forEach(function(trigger) {
                self.expand(trigger)
            })
        };
        Accordion.prototype.setStyles = function(content) {
            var prop = content.getAttribute("aria-hidden") === "true" ? "none" : "block";
            if (!this.opts.customHiding) {
                content.style.display = prop
            }
        };
        Accordion.prototype.addEventListener = function(elm, event, callback) {
            if (elm) {
                elm.addEventListener(event, callback);
                this.listeners.push({
                    elm: elm,
                    event: event,
                    callback: callback
                })
            }
        };
        Accordion.prototype.destroy = function() {
            this.listeners.forEach(function(listener) {
                listener.elm.removeEventListener(listener.event, listener.callback)
            })
        };
        module.exports = {
            Accordion: Accordion
        }
    }, {
        "./util": 3
    }],
    3: [function(require, module, exports) {
        var extend = function(out) {
            out = out || {};
            for (var i = 1; i < arguments.length; i++) {
                if (!arguments[i]) continue;
                for (var key in arguments[i]) {
                    if (arguments[i].hasOwnProperty(key)) {
                        out[key] = arguments[i][key]
                    }
                }
            }
            return out
        };
        module.exports = {
            extend: extend
        }
    }, {}],
    4: [function(require, module, exports) {
        ! function(factory) {
            "function" == typeof define && define.amd ? define(["inputmask.dependencyLib", "inputmask"], factory) : "object" == typeof exports ? module.exports = factory(require("./inputmask.dependencyLib"), require("./inputmask")) : factory(window.dependencyLib || jQuery, window.Inputmask)
        }(function($, Inputmask) {
            function isLeapYear(year) {
                return isNaN(year) || 29 === new Date(year, 2, 0).getDate()
            }
            return Inputmask.extendAliases({
                "dd/mm/yyyy": {
                    mask: "1/2/y",
                    placeholder: "dd/mm/yyyy",
                    regex: {
                        val1pre: new RegExp("[0-3]"),
                        val1: new RegExp("0[1-9]|[12][0-9]|3[01]"),
                        val2pre: function(separator) {
                            var escapedSeparator = Inputmask.escapeRegex.call(this, separator);
                            return new RegExp("((0[1-9]|[12][0-9]|3[01])" + escapedSeparator + "[01])")
                        },
                        val2: function(separator) {
                            var escapedSeparator = Inputmask.escapeRegex.call(this, separator);
                            return new RegExp("((0[1-9]|[12][0-9])" + escapedSeparator + "(0[1-9]|1[012]))|(30" + escapedSeparator + "(0[13-9]|1[012]))|(31" + escapedSeparator + "(0[13578]|1[02]))")
                        }
                    },
                    leapday: "29/02/",
                    separator: "/",
                    yearrange: {
                        minyear: 1900,
                        maxyear: 2099
                    },
                    isInYearRange: function(chrs, minyear, maxyear) {
                        if (isNaN(chrs)) return !1;
                        var enteredyear = parseInt(chrs.concat(minyear.toString().slice(chrs.length))),
                            enteredyear2 = parseInt(chrs.concat(maxyear.toString().slice(chrs.length)));
                        return !isNaN(enteredyear) && (minyear <= enteredyear && enteredyear <= maxyear) || !isNaN(enteredyear2) && (minyear <= enteredyear2 && enteredyear2 <= maxyear)
                    },
                    determinebaseyear: function(minyear, maxyear, hint) {
                        var currentyear = (new Date).getFullYear();
                        if (minyear > currentyear) return minyear;
                        if (maxyear < currentyear) {
                            for (var maxYearPrefix = maxyear.toString().slice(0, 2), maxYearPostfix = maxyear.toString().slice(2, 4); maxyear < maxYearPrefix + hint;) maxYearPrefix--;
                            var maxxYear = maxYearPrefix + maxYearPostfix;
                            return minyear > maxxYear ? minyear : maxxYear
                        }
                        if (minyear <= currentyear && currentyear <= maxyear) {
                            for (var currentYearPrefix = currentyear.toString().slice(0, 2); maxyear < currentYearPrefix + hint;) currentYearPrefix--;
                            var currentYearAndHint = currentYearPrefix + hint;
                            return currentYearAndHint < minyear ? minyear : currentYearAndHint
                        }
                        return currentyear
                    },
                    onKeyDown: function(e, buffer, caretPos, opts) {
                        var $input = $(this);
                        if (e.ctrlKey && e.keyCode === Inputmask.keyCode.RIGHT) {
                            var today = new Date;
                            $input.val(today.getDate().toString() + (today.getMonth() + 1).toString() + today.getFullYear().toString()), $input.trigger("setvalue")
                        }
                    },
                    getFrontValue: function(mask, buffer, opts) {
                        for (var start = 0, length = 0, i = 0; i < mask.length && "2" !== mask.charAt(i); i++) {
                            var definition = opts.definitions[mask.charAt(i)];
                            definition ? (start += length, length = definition.cardinality) : length++
                        }
                        return buffer.join("").substr(start, length)
                    },
                    postValidation: function(buffer, currentResult, opts) {
                        var dayMonthValue, year, bufferStr = buffer.join("");
                        return 0 === opts.mask.indexOf("y") ? (year = bufferStr.substr(0, 4), dayMonthValue = bufferStr.substr(4, 11)) : (year = bufferStr.substr(6, 11), dayMonthValue = bufferStr.substr(0, 6)), currentResult && (dayMonthValue !== opts.leapday || isLeapYear(year))
                    },
                    definitions: {
                        1: {
                            validator: function(chrs, maskset, pos, strict, opts) {
                                var isValid = opts.regex.val1.test(chrs);
                                return strict || isValid || chrs.charAt(1) !== opts.separator && "-./".indexOf(chrs.charAt(1)) === -1 || !(isValid = opts.regex.val1.test("0" + chrs.charAt(0))) ? isValid : (maskset.buffer[pos - 1] = "0", {
                                    refreshFromBuffer: {
                                        start: pos - 1,
                                        end: pos
                                    },
                                    pos: pos,
                                    c: chrs.charAt(0)
                                })
                            },
                            cardinality: 2,
                            prevalidator: [{
                                validator: function(chrs, maskset, pos, strict, opts) {
                                    var pchrs = chrs;
                                    isNaN(maskset.buffer[pos + 1]) || (pchrs += maskset.buffer[pos + 1]);
                                    var isValid = 1 === pchrs.length ? opts.regex.val1pre.test(pchrs) : opts.regex.val1.test(pchrs);
                                    if (!strict && !isValid) {
                                        if (isValid = opts.regex.val1.test(chrs + "0")) return maskset.buffer[pos] = chrs, maskset.buffer[++pos] = "0", {
                                            pos: pos,
                                            c: "0"
                                        };
                                        if (isValid = opts.regex.val1.test("0" + chrs)) return maskset.buffer[pos] = "0", pos++, {
                                            pos: pos
                                        }
                                    }
                                    return isValid
                                },
                                cardinality: 1
                            }]
                        },
                        2: {
                            validator: function(chrs, maskset, pos, strict, opts) {
                                var frontValue = opts.getFrontValue(maskset.mask, maskset.buffer, opts);
                                frontValue.indexOf(opts.placeholder[0]) !== -1 && (frontValue = "01" + opts.separator);
                                var isValid = opts.regex.val2(opts.separator).test(frontValue + chrs);
                                return strict || isValid || chrs.charAt(1) !== opts.separator && "-./".indexOf(chrs.charAt(1)) === -1 || !(isValid = opts.regex.val2(opts.separator).test(frontValue + "0" + chrs.charAt(0))) ? isValid : (maskset.buffer[pos - 1] = "0", {
                                    refreshFromBuffer: {
                                        start: pos - 1,
                                        end: pos
                                    },
                                    pos: pos,
                                    c: chrs.charAt(0)
                                })
                            },
                            cardinality: 2,
                            prevalidator: [{
                                validator: function(chrs, maskset, pos, strict, opts) {
                                    isNaN(maskset.buffer[pos + 1]) || (chrs += maskset.buffer[pos + 1]);
                                    var frontValue = opts.getFrontValue(maskset.mask, maskset.buffer, opts);
                                    frontValue.indexOf(opts.placeholder[0]) !== -1 && (frontValue = "01" + opts.separator);
                                    var isValid = 1 === chrs.length ? opts.regex.val2pre(opts.separator).test(frontValue + chrs) : opts.regex.val2(opts.separator).test(frontValue + chrs);
                                    return strict || isValid || !(isValid = opts.regex.val2(opts.separator).test(frontValue + "0" + chrs)) ? isValid : (maskset.buffer[pos] = "0", pos++, {
                                        pos: pos
                                    })
                                },
                                cardinality: 1
                            }]
                        },
                        y: {
                            validator: function(chrs, maskset, pos, strict, opts) {
                                return opts.isInYearRange(chrs, opts.yearrange.minyear, opts.yearrange.maxyear)
                            },
                            cardinality: 4,
                            prevalidator: [{
                                validator: function(chrs, maskset, pos, strict, opts) {
                                    var isValid = opts.isInYearRange(chrs, opts.yearrange.minyear, opts.yearrange.maxyear);
                                    if (!strict && !isValid) {
                                        var yearPrefix = opts.determinebaseyear(opts.yearrange.minyear, opts.yearrange.maxyear, chrs + "0").toString().slice(0, 1);
                                        if (isValid = opts.isInYearRange(yearPrefix + chrs, opts.yearrange.minyear, opts.yearrange.maxyear)) return maskset.buffer[pos++] = yearPrefix.charAt(0), {
                                            pos: pos
                                        };
                                        if (yearPrefix = opts.determinebaseyear(opts.yearrange.minyear, opts.yearrange.maxyear, chrs + "0").toString().slice(0, 2), isValid = opts.isInYearRange(yearPrefix + chrs, opts.yearrange.minyear, opts.yearrange.maxyear)) return maskset.buffer[pos++] = yearPrefix.charAt(0), maskset.buffer[pos++] = yearPrefix.charAt(1), {
                                            pos: pos
                                        }
                                    }
                                    return isValid
                                },
                                cardinality: 1
                            }, {
                                validator: function(chrs, maskset, pos, strict, opts) {
                                    var isValid = opts.isInYearRange(chrs, opts.yearrange.minyear, opts.yearrange.maxyear);
                                    if (!strict && !isValid) {
                                        var yearPrefix = opts.determinebaseyear(opts.yearrange.minyear, opts.yearrange.maxyear, chrs).toString().slice(0, 2);
                                        if (isValid = opts.isInYearRange(chrs[0] + yearPrefix[1] + chrs[1], opts.yearrange.minyear, opts.yearrange.maxyear)) return maskset.buffer[pos++] = yearPrefix.charAt(1), {
                                            pos: pos
                                        };
                                        if (yearPrefix = opts.determinebaseyear(opts.yearrange.minyear, opts.yearrange.maxyear, chrs).toString().slice(0, 2), isValid = opts.isInYearRange(yearPrefix + chrs, opts.yearrange.minyear, opts.yearrange.maxyear)) return maskset.buffer[pos - 1] = yearPrefix.charAt(0), maskset.buffer[pos++] = yearPrefix.charAt(1), maskset.buffer[pos++] = chrs.charAt(0), {
                                            refreshFromBuffer: {
                                                start: pos - 3,
                                                end: pos
                                            },
                                            pos: pos
                                        }
                                    }
                                    return isValid
                                },
                                cardinality: 2
                            }, {
                                validator: function(chrs, maskset, pos, strict, opts) {
                                    return opts.isInYearRange(chrs, opts.yearrange.minyear, opts.yearrange.maxyear)
                                },
                                cardinality: 3
                            }]
                        }
                    },
                    insertMode: !1,
                    autoUnmask: !1
                },
                "mm/dd/yyyy": {
                    placeholder: "mm/dd/yyyy",
                    alias: "dd/mm/yyyy",
                    regex: {
                        val2pre: function(separator) {
                            var escapedSeparator = Inputmask.escapeRegex.call(this, separator);
                            return new RegExp("((0[13-9]|1[012])" + escapedSeparator + "[0-3])|(02" + escapedSeparator + "[0-2])")
                        },
                        val2: function(separator) {
                            var escapedSeparator = Inputmask.escapeRegex.call(this, separator);
                            return new RegExp("((0[1-9]|1[012])" + escapedSeparator + "(0[1-9]|[12][0-9]))|((0[13-9]|1[012])" + escapedSeparator + "30)|((0[13578]|1[02])" + escapedSeparator + "31)")
                        },
                        val1pre: new RegExp("[01]"),
                        val1: new RegExp("0[1-9]|1[012]")
                    },
                    leapday: "02/29/",
                    onKeyDown: function(e, buffer, caretPos, opts) {
                        var $input = $(this);
                        if (e.ctrlKey && e.keyCode === Inputmask.keyCode.RIGHT) {
                            var today = new Date;
                            $input.val((today.getMonth() + 1).toString() + today.getDate().toString() + today.getFullYear().toString()), $input.trigger("setvalue")
                        }
                    }
                },
                "yyyy/mm/dd": {
                    mask: "y/1/2",
                    placeholder: "yyyy/mm/dd",
                    alias: "mm/dd/yyyy",
                    leapday: "/02/29",
                    onKeyDown: function(e, buffer, caretPos, opts) {
                        var $input = $(this);
                        if (e.ctrlKey && e.keyCode === Inputmask.keyCode.RIGHT) {
                            var today = new Date;
                            $input.val(today.getFullYear().toString() + (today.getMonth() + 1).toString() + today.getDate().toString()), $input.trigger("setvalue")
                        }
                    }
                },
                "dd.mm.yyyy": {
                    mask: "1.2.y",
                    placeholder: "dd.mm.yyyy",
                    leapday: "29.02.",
                    separator: ".",
                    alias: "dd/mm/yyyy"
                },
                "dd-mm-yyyy": {
                    mask: "1-2-y",
                    placeholder: "dd-mm-yyyy",
                    leapday: "29-02-",
                    separator: "-",
                    alias: "dd/mm/yyyy"
                },
                "mm.dd.yyyy": {
                    mask: "1.2.y",
                    placeholder: "mm.dd.yyyy",
                    leapday: "02.29.",
                    separator: ".",
                    alias: "mm/dd/yyyy"
                },
                "mm-dd-yyyy": {
                    mask: "1-2-y",
                    placeholder: "mm-dd-yyyy",
                    leapday: "02-29-",
                    separator: "-",
                    alias: "mm/dd/yyyy"
                },
                "yyyy.mm.dd": {
                    mask: "y.1.2",
                    placeholder: "yyyy.mm.dd",
                    leapday: ".02.29",
                    separator: ".",
                    alias: "yyyy/mm/dd"
                },
                "yyyy-mm-dd": {
                    mask: "y-1-2",
                    placeholder: "yyyy-mm-dd",
                    leapday: "-02-29",
                    separator: "-",
                    alias: "yyyy/mm/dd"
                },
                datetime: {
                    mask: "1/2/y h:s",
                    placeholder: "dd/mm/yyyy hh:mm",
                    alias: "dd/mm/yyyy",
                    regex: {
                        hrspre: new RegExp("[012]"),
                        hrs24: new RegExp("2[0-4]|1[3-9]"),
                        hrs: new RegExp("[01][0-9]|2[0-4]"),
                        ampm: new RegExp("^[a|p|A|P][m|M]"),
                        mspre: new RegExp("[0-5]"),
                        ms: new RegExp("[0-5][0-9]")
                    },
                    timeseparator: ":",
                    hourFormat: "24",
                    definitions: {
                        h: {
                            validator: function(chrs, maskset, pos, strict, opts) {
                                if ("24" === opts.hourFormat && 24 === parseInt(chrs, 10)) return maskset.buffer[pos - 1] = "0", maskset.buffer[pos] = "0", {
                                    refreshFromBuffer: {
                                        start: pos - 1,
                                        end: pos
                                    },
                                    c: "0"
                                };
                                var isValid = opts.regex.hrs.test(chrs);
                                if (!strict && !isValid && (chrs.charAt(1) === opts.timeseparator || "-.:".indexOf(chrs.charAt(1)) !== -1) && (isValid = opts.regex.hrs.test("0" + chrs.charAt(0)))) return maskset.buffer[pos - 1] = "0", maskset.buffer[pos] = chrs.charAt(0), pos++, {
                                    refreshFromBuffer: {
                                        start: pos - 2,
                                        end: pos
                                    },
                                    pos: pos,
                                    c: opts.timeseparator
                                };
                                if (isValid && "24" !== opts.hourFormat && opts.regex.hrs24.test(chrs)) {
                                    var tmp = parseInt(chrs, 10);
                                    return 24 === tmp ? (maskset.buffer[pos + 5] = "a", maskset.buffer[pos + 6] = "m") : (maskset.buffer[pos + 5] = "p", maskset.buffer[pos + 6] = "m"), tmp -= 12, tmp < 10 ? (maskset.buffer[pos] = tmp.toString(), maskset.buffer[pos - 1] = "0") : (maskset.buffer[pos] = tmp.toString().charAt(1), maskset.buffer[pos - 1] = tmp.toString().charAt(0)), {
                                        refreshFromBuffer: {
                                            start: pos - 1,
                                            end: pos + 6
                                        },
                                        c: maskset.buffer[pos]
                                    }
                                }
                                return isValid
                            },
                            cardinality: 2,
                            prevalidator: [{
                                validator: function(chrs, maskset, pos, strict, opts) {
                                    var isValid = opts.regex.hrspre.test(chrs);
                                    return strict || isValid || !(isValid = opts.regex.hrs.test("0" + chrs)) ? isValid : (maskset.buffer[pos] = "0", pos++, {
                                        pos: pos
                                    })
                                },
                                cardinality: 1
                            }]
                        },
                        s: {
                            validator: "[0-5][0-9]",
                            cardinality: 2,
                            prevalidator: [{
                                validator: function(chrs, maskset, pos, strict, opts) {
                                    var isValid = opts.regex.mspre.test(chrs);
                                    return strict || isValid || !(isValid = opts.regex.ms.test("0" + chrs)) ? isValid : (maskset.buffer[pos] = "0", pos++, {
                                        pos: pos
                                    })
                                },
                                cardinality: 1
                            }]
                        },
                        t: {
                            validator: function(chrs, maskset, pos, strict, opts) {
                                return opts.regex.ampm.test(chrs + "m")
                            },
                            casing: "lower",
                            cardinality: 1
                        }
                    },
                    insertMode: !1,
                    autoUnmask: !1
                },
                datetime12: {
                    mask: "1/2/y h:s t\\m",
                    placeholder: "dd/mm/yyyy hh:mm xm",
                    alias: "datetime",
                    hourFormat: "12"
                },
                "mm/dd/yyyy hh:mm xm": {
                    mask: "1/2/y h:s t\\m",
                    placeholder: "mm/dd/yyyy hh:mm xm",
                    alias: "datetime12",
                    regex: {
                        val2pre: function(separator) {
                            var escapedSeparator = Inputmask.escapeRegex.call(this, separator);
                            return new RegExp("((0[13-9]|1[012])" + escapedSeparator + "[0-3])|(02" + escapedSeparator + "[0-2])")
                        },
                        val2: function(separator) {
                            var escapedSeparator = Inputmask.escapeRegex.call(this, separator);
                            return new RegExp("((0[1-9]|1[012])" + escapedSeparator + "(0[1-9]|[12][0-9]))|((0[13-9]|1[012])" + escapedSeparator + "30)|((0[13578]|1[02])" + escapedSeparator + "31)")
                        },
                        val1pre: new RegExp("[01]"),
                        val1: new RegExp("0[1-9]|1[012]")
                    },
                    leapday: "02/29/",
                    onKeyDown: function(e, buffer, caretPos, opts) {
                        var $input = $(this);
                        if (e.ctrlKey && e.keyCode === Inputmask.keyCode.RIGHT) {
                            var today = new Date;
                            $input.val((today.getMonth() + 1).toString() + today.getDate().toString() + today.getFullYear().toString()), $input.trigger("setvalue")
                        }
                    }
                },
                "hh:mm t": {
                    mask: "h:s t\\m",
                    placeholder: "hh:mm xm",
                    alias: "datetime",
                    hourFormat: "12"
                },
                "h:s t": {
                    mask: "h:s t\\m",
                    placeholder: "hh:mm xm",
                    alias: "datetime",
                    hourFormat: "12"
                },
                "hh:mm:ss": {
                    mask: "h:s:s",
                    placeholder: "hh:mm:ss",
                    alias: "datetime",
                    autoUnmask: !1
                },
                "hh:mm": {
                    mask: "h:s",
                    placeholder: "hh:mm",
                    alias: "datetime",
                    autoUnmask: !1
                },
                date: {
                    alias: "dd/mm/yyyy"
                },
                "mm/yyyy": {
                    mask: "1/y",
                    placeholder: "mm/yyyy",
                    leapday: "donotuse",
                    separator: "/",
                    alias: "mm/dd/yyyy"
                },
                shamsi: {
                    regex: {
                        val2pre: function(separator) {
                            var escapedSeparator = Inputmask.escapeRegex.call(this, separator);
                            return new RegExp("((0[1-9]|1[012])" + escapedSeparator + "[0-3])")
                        },
                        val2: function(separator) {
                            var escapedSeparator = Inputmask.escapeRegex.call(this, separator);
                            return new RegExp("((0[1-9]|1[012])" + escapedSeparator + "(0[1-9]|[12][0-9]))|((0[1-9]|1[012])" + escapedSeparator + "30)|((0[1-6])" + escapedSeparator + "31)")
                        },
                        val1pre: new RegExp("[01]"),
                        val1: new RegExp("0[1-9]|1[012]")
                    },
                    yearrange: {
                        minyear: 1300,
                        maxyear: 1499
                    },
                    mask: "y/1/2",
                    leapday: "/12/30",
                    placeholder: "yyyy/mm/dd",
                    alias: "mm/dd/yyyy",
                    clearIncomplete: !0
                }
            }), Inputmask
        })
    }, {
        "./inputmask": 7,
        "./inputmask.dependencyLib": 5
    }],
    5: [function(require, module, exports) {
        ! function(factory) {
            "function" == typeof define && define.amd ? define("inputmask.dependencyLib", ["jquery"], factory) : "object" == typeof exports ? module.exports = factory(require("jquery")) : factory(jQuery)
        }(function($) {
            return window.dependencyLib = $, $
        })
    }, {
        jquery: 13
    }],
    6: [function(require, module, exports) {
        ! function(factory) {
            "function" == typeof define && define.amd ? define(["inputmask.dependencyLib", "inputmask"], factory) : "object" == typeof exports ? module.exports = factory(require("./inputmask.dependencyLib"), require("./inputmask")) : factory(window.dependencyLib || jQuery, window.Inputmask)
        }(function($, Inputmask) {
            return Inputmask.extendDefinitions({
                A: {
                    validator: "[A-Za-zА-яЁёÀ-ÿµ]",
                    cardinality: 1,
                    casing: "upper"
                },
                "&": {
                    validator: "[0-9A-Za-zА-яЁёÀ-ÿµ]",
                    cardinality: 1,
                    casing: "upper"
                },
                "#": {
                    validator: "[0-9A-Fa-f]",
                    cardinality: 1,
                    casing: "upper"
                }
            }), Inputmask.extendAliases({
                url: {
                    definitions: {
                        i: {
                            validator: ".",
                            cardinality: 1
                        }
                    },
                    mask: "(\\http://)|(\\http\\s://)|(ftp://)|(ftp\\s://)i{+}",
                    insertMode: !1,
                    autoUnmask: !1,
                    inputmode: "url"
                },
                ip: {
                    mask: "i[i[i]].i[i[i]].i[i[i]].i[i[i]]",
                    definitions: {
                        i: {
                            validator: function(chrs, maskset, pos, strict, opts) {
                                return pos - 1 > -1 && "." !== maskset.buffer[pos - 1] ? (chrs = maskset.buffer[pos - 1] + chrs, chrs = pos - 2 > -1 && "." !== maskset.buffer[pos - 2] ? maskset.buffer[pos - 2] + chrs : "0" + chrs) : chrs = "00" + chrs, new RegExp("25[0-5]|2[0-4][0-9]|[01][0-9][0-9]").test(chrs)
                            },
                            cardinality: 1
                        }
                    },
                    onUnMask: function(maskedValue, unmaskedValue, opts) {
                        return maskedValue
                    },
                    inputmode: "numeric"
                },
                email: {
                    mask: "*{1,64}[.*{1,64}][.*{1,64}][.*{1,63}]@-{1,63}.-{1,63}[.-{1,63}][.-{1,63}]",
                    greedy: !1,
                    onBeforePaste: function(pastedValue, opts) {
                        return pastedValue = pastedValue.toLowerCase(), pastedValue.replace("mailto:", "")
                    },
                    definitions: {
                        "*": {
                            validator: "[0-9A-Za-z!#$%&'*+/=?^_`{|}~-]",
                            cardinality: 1,
                            casing: "lower"
                        },
                        "-": {
                            validator: "[0-9A-Za-z-]",
                            cardinality: 1,
                            casing: "lower"
                        }
                    },
                    onUnMask: function(maskedValue, unmaskedValue, opts) {
                        return maskedValue
                    },
                    inputmode: "email"
                },
                mac: {
                    mask: "##:##:##:##:##:##"
                },
                vin: {
                    mask: "V{13}9{4}",
                    definitions: {
                        V: {
                            validator: "[A-HJ-NPR-Za-hj-npr-z\\d]",
                            cardinality: 1,
                            casing: "upper"
                        }
                    },
                    clearIncomplete: !0,
                    autoUnmask: !0
                }
            }), Inputmask
        })
    }, {
        "./inputmask": 7,
        "./inputmask.dependencyLib": 5
    }],
    7: [function(require, module, exports) {
        ! function(factory) {
            "function" == typeof define && define.amd ? define("inputmask", ["inputmask.dependencyLib"], factory) : "object" == typeof exports ? module.exports = factory(require("./inputmask.dependencyLib")) : factory(window.dependencyLib || jQuery)
        }(function($) {
            function Inputmask(alias, options) {
                return this instanceof Inputmask ? ($.isPlainObject(alias) ? options = alias : (options = options || {}, options.alias = alias), this.el = void 0, this.opts = $.extend(!0, {}, this.defaults, options), this.maskset = void 0, this.noMasksCache = options && void 0 !== options.definitions, this.userOptions = options || {}, this.events = {}, this.dataAttribute = "data-inputmask", this.isRTL = this.opts.numericInput, void resolveAlias(this.opts.alias, options, this.opts)) : new Inputmask(alias, options)
            }

            function resolveAlias(aliasStr, options, opts) {
                var aliasDefinition = opts.aliases[aliasStr];
                return aliasDefinition ? (aliasDefinition.alias && resolveAlias(aliasDefinition.alias, void 0, opts), $.extend(!0, opts, aliasDefinition), $.extend(!0, opts, options), !0) : (null === opts.mask && (opts.mask = aliasStr), !1)
            }

            function generateMaskSet(opts, nocache) {
                function generateMask(mask, metadata, opts) {
                    if (null !== mask && "" !== mask) {
                        if (1 === mask.length && opts.greedy === !1 && 0 !== opts.repeat && (opts.placeholder = ""), opts.repeat > 0 || "*" === opts.repeat || "+" === opts.repeat) {
                            var repeatStart = "*" === opts.repeat ? 0 : "+" === opts.repeat ? 1 : opts.repeat;
                            mask = opts.groupmarker.start + mask + opts.groupmarker.end + opts.quantifiermarker.start + repeatStart + "," + opts.repeat + opts.quantifiermarker.end
                        }
                        var masksetDefinition;
                        return void 0 === Inputmask.prototype.masksCache[mask] || nocache === !0 ? (masksetDefinition = {
                            mask: mask,
                            maskToken: Inputmask.prototype.analyseMask(mask, opts),
                            validPositions: {},
                            _buffer: void 0,
                            buffer: void 0,
                            tests: {},
                            metadata: metadata,
                            maskLength: void 0
                        }, nocache !== !0 && (Inputmask.prototype.masksCache[opts.numericInput ? mask.split("").reverse().join("") : mask] = masksetDefinition, masksetDefinition = $.extend(!0, {}, Inputmask.prototype.masksCache[opts.numericInput ? mask.split("").reverse().join("") : mask]))) : masksetDefinition = $.extend(!0, {}, Inputmask.prototype.masksCache[opts.numericInput ? mask.split("").reverse().join("") : mask]), masksetDefinition
                    }
                }
                var ms;
                if ($.isFunction(opts.mask) && (opts.mask = opts.mask(opts)), $.isArray(opts.mask)) {
                    if (opts.mask.length > 1) {
                        opts.keepStatic = null === opts.keepStatic || opts.keepStatic;
                        var altMask = opts.groupmarker.start;
                        return $.each(opts.numericInput ? opts.mask.reverse() : opts.mask, function(ndx, msk) {
                            altMask.length > 1 && (altMask += opts.groupmarker.end + opts.alternatormarker + opts.groupmarker.start), altMask += void 0 === msk.mask || $.isFunction(msk.mask) ? msk : msk.mask
                        }), altMask += opts.groupmarker.end, generateMask(altMask, opts.mask, opts)
                    }
                    opts.mask = opts.mask.pop()
                }
                return opts.mask && (ms = void 0 === opts.mask.mask || $.isFunction(opts.mask.mask) ? generateMask(opts.mask, opts.mask, opts) : generateMask(opts.mask.mask, opts.mask, opts)), ms
            }

            function maskScope(actionObj, maskset, opts) {
                function getMaskTemplate(baseOnInput, minimalPos, includeMode) {
                    minimalPos = minimalPos || 0;
                    var ndxIntlzr, test, testPos, maskTemplate = [],
                        pos = 0,
                        lvp = getLastValidPosition();
                    maxLength = void 0 !== el ? el.maxLength : void 0, maxLength === -1 && (maxLength = void 0);
                    do {
                        baseOnInput === !0 && getMaskSet().validPositions[pos] ? (testPos = getMaskSet().validPositions[pos], test = testPos.match, ndxIntlzr = testPos.locator.slice(), maskTemplate.push(includeMode === !0 ? testPos.input : includeMode === !1 ? test.nativeDef : getPlaceholder(pos, test))) : (testPos = getTestTemplate(pos, ndxIntlzr, pos - 1), test = testPos.match, ndxIntlzr = testPos.locator.slice(), (opts.jitMasking === !1 || pos < lvp || "number" == typeof opts.jitMasking && isFinite(opts.jitMasking) && opts.jitMasking > pos) && maskTemplate.push(includeMode === !1 ? test.nativeDef : getPlaceholder(pos, test))), pos++
                    } while ((void 0 === maxLength || pos < maxLength) && (null !== test.fn || "" !== test.def) || minimalPos > pos);
                    return "" === maskTemplate[maskTemplate.length - 1] && maskTemplate.pop(), getMaskSet().maskLength = pos + 1, maskTemplate
                }

                function getMaskSet() {
                    return maskset
                }

                function resetMaskSet(soft) {
                    var maskset = getMaskSet();
                    maskset.buffer = void 0, soft !== !0 && (maskset._buffer = void 0, maskset.validPositions = {}, maskset.p = 0)
                }

                function getLastValidPosition(closestTo, strict, validPositions) {
                    var before = -1,
                        after = -1,
                        valids = validPositions || getMaskSet().validPositions;
                    void 0 === closestTo && (closestTo = -1);
                    for (var posNdx in valids) {
                        var psNdx = parseInt(posNdx);
                        valids[psNdx] && (strict || null !== valids[psNdx].match.fn) && (psNdx <= closestTo && (before = psNdx), psNdx >= closestTo && (after = psNdx))
                    }
                    return before !== -1 && closestTo - before > 1 || after < closestTo ? before : after
                }

                function stripValidPositions(start, end, nocheck, strict) {
                    function IsEnclosedStatic(pos) {
                        var posMatch = getMaskSet().validPositions[pos];
                        if (void 0 !== posMatch && null === posMatch.match.fn) {
                            var prevMatch = getMaskSet().validPositions[pos - 1],
                                nextMatch = getMaskSet().validPositions[pos + 1];
                            return void 0 !== prevMatch && void 0 !== nextMatch
                        }
                        return !1
                    }
                    var i, startPos = start,
                        positionsClone = $.extend(!0, {}, getMaskSet().validPositions),
                        needsValidation = !1;
                    for (getMaskSet().p = start, i = end - 1; i >= startPos; i--) void 0 !== getMaskSet().validPositions[i] && (nocheck !== !0 && (!getMaskSet().validPositions[i].match.optionality && IsEnclosedStatic(i) || opts.canClearPosition(getMaskSet(), i, getLastValidPosition(), strict, opts) === !1) || delete getMaskSet().validPositions[i]);
                    for (resetMaskSet(!0), i = startPos + 1; i <= getLastValidPosition();) {
                        for (; void 0 !== getMaskSet().validPositions[startPos];) startPos++;
                        if (i < startPos && (i = startPos + 1), void 0 === getMaskSet().validPositions[i] && isMask(i)) i++;
                        else {
                            var t = getTestTemplate(i);
                            needsValidation === !1 && positionsClone[startPos] && positionsClone[startPos].match.def === t.match.def ? (getMaskSet().validPositions[startPos] = $.extend(!0, {}, positionsClone[startPos]), getMaskSet().validPositions[startPos].input = t.input, delete getMaskSet().validPositions[i], i++) : positionCanMatchDefinition(startPos, t.match.def) ? isValid(startPos, t.input || getPlaceholder(i), !0) !== !1 && (delete getMaskSet().validPositions[i], i++, needsValidation = !0) : isMask(i) || (i++, startPos--), startPos++
                        }
                    }
                    resetMaskSet(!0)
                }

                function determineTestTemplate(tests, guessNextBest) {
                    for (var testPos, testPositions = tests, lvp = getLastValidPosition(), lvTest = getMaskSet().validPositions[lvp] || getTests(0)[0], lvTestAltArr = void 0 !== lvTest.alternation ? lvTest.locator[lvTest.alternation].toString().split(",") : [], ndx = 0; ndx < testPositions.length && (testPos = testPositions[ndx], !(testPos.match && (opts.greedy && testPos.match.optionalQuantifier !== !0 || (testPos.match.optionality === !1 || testPos.match.newBlockMarker === !1) && testPos.match.optionalQuantifier !== !0) && (void 0 === lvTest.alternation || lvTest.alternation !== testPos.alternation || void 0 !== testPos.locator[lvTest.alternation] && checkAlternationMatch(testPos.locator[lvTest.alternation].toString().split(","), lvTestAltArr))) || guessNextBest === !0 && (null !== testPos.match.fn || /[0-9a-bA-Z]/.test(testPos.match.def))); ndx++);
                    return testPos
                }

                function getTestTemplate(pos, ndxIntlzr, tstPs) {
                    return getMaskSet().validPositions[pos] || determineTestTemplate(getTests(pos, ndxIntlzr ? ndxIntlzr.slice() : ndxIntlzr, tstPs))
                }

                function getTest(pos) {
                    return getMaskSet().validPositions[pos] ? getMaskSet().validPositions[pos] : getTests(pos)[0]
                }

                function positionCanMatchDefinition(pos, def) {
                    for (var valid = !1, tests = getTests(pos), tndx = 0; tndx < tests.length; tndx++)
                        if (tests[tndx].match && tests[tndx].match.def === def) {
                            valid = !0;
                            break
                        }
                    return valid
                }

                function getTests(pos, ndxIntlzr, tstPs) {
                    function resolveTestFromToken(maskToken, ndxInitializer, loopNdx, quantifierRecurse) {
                        function handleMatch(match, loopNdx, quantifierRecurse) {
                            function isFirstMatch(latestMatch, tokenGroup) {
                                var firstMatch = 0 === $.inArray(latestMatch, tokenGroup.matches);
                                return firstMatch || $.each(tokenGroup.matches, function(ndx, match) {
                                    if (match.isQuantifier === !0 && (firstMatch = isFirstMatch(latestMatch, tokenGroup.matches[ndx - 1]))) return !1
                                }), firstMatch
                            }

                            function resolveNdxInitializer(pos, alternateNdx, targetAlternation) {
                                var bestMatch, indexPos;
                                return (getMaskSet().tests[pos] || getMaskSet().validPositions[pos]) && $.each(getMaskSet().tests[pos] || [getMaskSet().validPositions[pos]], function(ndx, lmnt) {
                                    var alternation = void 0 !== targetAlternation ? targetAlternation : lmnt.alternation,
                                        ndxPos = void 0 !== lmnt.locator[alternation] ? lmnt.locator[alternation].toString().indexOf(alternateNdx) : -1;
                                    (void 0 === indexPos || ndxPos < indexPos) && ndxPos !== -1 && (bestMatch = lmnt, indexPos = ndxPos)
                                }), bestMatch ? bestMatch.locator.slice((void 0 !== targetAlternation ? targetAlternation : bestMatch.alternation) + 1) : void 0 !== targetAlternation ? resolveNdxInitializer(pos, alternateNdx) : void 0
                            }

                            function staticCanMatchDefinition(source, target) {
                                return null === source.match.fn && null !== target.match.fn && target.match.fn.test(source.match.def, getMaskSet(), pos, !1, opts, !1)
                            }
                            if (testPos > 1e4) throw "Inputmask: There is probably an error in your mask definition or in the code. Create an issue on github with an example of the mask you are using. " + getMaskSet().mask;
                            if (testPos === pos && void 0 === match.matches) return matches.push({
                                match: match,
                                locator: loopNdx.reverse(),
                                cd: cacheDependency
                            }), !0;
                            if (void 0 !== match.matches) {
                                if (match.isGroup && quantifierRecurse !== match) {
                                    if (match = handleMatch(maskToken.matches[$.inArray(match, maskToken.matches) + 1], loopNdx)) return !0
                                } else if (match.isOptional) {
                                    var optionalToken = match;
                                    if (match = resolveTestFromToken(match, ndxInitializer, loopNdx, quantifierRecurse)) {
                                        if (latestMatch = matches[matches.length - 1].match, !isFirstMatch(latestMatch, optionalToken)) return !0;
                                        insertStop = !0, testPos = pos
                                    }
                                } else if (match.isAlternator) {
                                    var maltMatches, alternateToken = match,
                                        malternateMatches = [],
                                        currentMatches = matches.slice(),
                                        loopNdxCnt = loopNdx.length,
                                        altIndex = ndxInitializer.length > 0 ? ndxInitializer.shift() : -1;
                                    if (altIndex === -1 || "string" == typeof altIndex) {
                                        var amndx, currentPos = testPos,
                                            ndxInitializerClone = ndxInitializer.slice(),
                                            altIndexArr = [];
                                        if ("string" == typeof altIndex) altIndexArr = altIndex.split(",");
                                        else
                                            for (amndx = 0; amndx < alternateToken.matches.length; amndx++) altIndexArr.push(amndx);
                                        for (var ndx = 0; ndx < altIndexArr.length; ndx++) {
                                            if (amndx = parseInt(altIndexArr[ndx]), matches = [], ndxInitializer = resolveNdxInitializer(testPos, amndx, loopNdxCnt) || ndxInitializerClone.slice(), match = handleMatch(alternateToken.matches[amndx] || maskToken.matches[amndx], [amndx].concat(loopNdx), quantifierRecurse) || match, match !== !0 && void 0 !== match && altIndexArr[altIndexArr.length - 1] < alternateToken.matches.length) {
                                                var ntndx = $.inArray(match, maskToken.matches) + 1;
                                                maskToken.matches.length > ntndx && (match = handleMatch(maskToken.matches[ntndx], [ntndx].concat(loopNdx.slice(1, loopNdx.length)), quantifierRecurse), match && (altIndexArr.push(ntndx.toString()), $.each(matches, function(ndx, lmnt) {
                                                    lmnt.alternation = loopNdx.length - 1
                                                })))
                                            }
                                            maltMatches = matches.slice(), testPos = currentPos, matches = [];
                                            for (var ndx1 = 0; ndx1 < maltMatches.length; ndx1++) {
                                                var altMatch = maltMatches[ndx1],
                                                    hasMatch = !1;
                                                altMatch.alternation = altMatch.alternation || loopNdxCnt;
                                                for (var ndx2 = 0; ndx2 < malternateMatches.length; ndx2++) {
                                                    var altMatch2 = malternateMatches[ndx2];
                                                    if (("string" != typeof altIndex || $.inArray(altMatch.locator[altMatch.alternation].toString(), altIndexArr) !== -1) && (altMatch.match.def === altMatch2.match.def || staticCanMatchDefinition(altMatch, altMatch2))) {
                                                        hasMatch = altMatch.match.nativeDef === altMatch2.match.nativeDef, altMatch.alternation == altMatch2.alternation && altMatch2.locator[altMatch2.alternation].toString().indexOf(altMatch.locator[altMatch.alternation]) === -1 && (altMatch2.locator[altMatch2.alternation] = altMatch2.locator[altMatch2.alternation] + "," + altMatch.locator[altMatch.alternation], altMatch2.alternation = altMatch.alternation, null == altMatch.match.fn && (altMatch2.na = altMatch2.na || altMatch.locator[altMatch.alternation].toString(), altMatch2.na.indexOf(altMatch.locator[altMatch.alternation]) === -1 && (altMatch2.na = altMatch2.na + "," + altMatch.locator[altMatch.alternation])));
                                                        break
                                                    }
                                                }
                                                hasMatch || malternateMatches.push(altMatch)
                                            }
                                        }
                                        "string" == typeof altIndex && (malternateMatches = $.map(malternateMatches, function(lmnt, ndx) {
                                            if (isFinite(ndx)) {
                                                var mamatch, alternation = lmnt.alternation,
                                                    altLocArr = lmnt.locator[alternation].toString().split(",");
                                                lmnt.locator[alternation] = void 0, lmnt.alternation = void 0;
                                                for (var alndx = 0; alndx < altLocArr.length; alndx++) mamatch = $.inArray(altLocArr[alndx], altIndexArr) !== -1, mamatch && (void 0 !== lmnt.locator[alternation] ? (lmnt.locator[alternation] += ",", lmnt.locator[alternation] += altLocArr[alndx]) : lmnt.locator[alternation] = parseInt(altLocArr[alndx]), lmnt.alternation = alternation);
                                                if (void 0 !== lmnt.locator[alternation]) return lmnt
                                            }
                                        })), matches = currentMatches.concat(malternateMatches), testPos = pos, insertStop = matches.length > 0, ndxInitializer = ndxInitializerClone.slice()
                                    } else match = handleMatch(alternateToken.matches[altIndex] || maskToken.matches[altIndex], [altIndex].concat(loopNdx), quantifierRecurse);
                                    if (match) return !0
                                } else if (match.isQuantifier && quantifierRecurse !== maskToken.matches[$.inArray(match, maskToken.matches) - 1])
                                    for (var qt = match, qndx = ndxInitializer.length > 0 ? ndxInitializer.shift() : 0; qndx < (isNaN(qt.quantifier.max) ? qndx + 1 : qt.quantifier.max) && testPos <= pos; qndx++) {
                                        var tokenGroup = maskToken.matches[$.inArray(qt, maskToken.matches) - 1];
                                        if (match = handleMatch(tokenGroup, [qndx].concat(loopNdx), tokenGroup)) {
                                            if (latestMatch = matches[matches.length - 1].match, latestMatch.optionalQuantifier = qndx > qt.quantifier.min - 1, isFirstMatch(latestMatch, tokenGroup)) {
                                                if (qndx > qt.quantifier.min - 1) {
                                                    insertStop = !0, testPos = pos;
                                                    break
                                                }
                                                return !0
                                            }
                                            return !0
                                        }
                                    } else if (match = resolveTestFromToken(match, ndxInitializer, loopNdx, quantifierRecurse)) return !0
                            } else testPos++
                        }
                        for (var tndx = ndxInitializer.length > 0 ? ndxInitializer.shift() : 0; tndx < maskToken.matches.length; tndx++)
                            if (maskToken.matches[tndx].isQuantifier !== !0) {
                                var match = handleMatch(maskToken.matches[tndx], [tndx].concat(loopNdx), quantifierRecurse);
                                if (match && testPos === pos) return match;
                                if (testPos > pos) break
                            }
                    }

                    function mergeLocators(tests) {
                        var locator = [];
                        return $.isArray(tests) || (tests = [tests]), tests.length > 0 && (void 0 === tests[0].alternation ? (locator = determineTestTemplate(tests.slice()).locator.slice(), 0 === locator.length && (locator = tests[0].locator.slice())) : $.each(tests, function(ndx, tst) {
                            if ("" !== tst.def)
                                if (0 === locator.length) locator = tst.locator.slice();
                                else
                                    for (var i = 0; i < locator.length; i++) tst.locator[i] && locator[i].toString().indexOf(tst.locator[i]) === -1 && (locator[i] += "," + tst.locator[i])
                        })), locator
                    }

                    function filterTests(tests) {
                        return opts.keepStatic && pos > 0 && tests.length > 1 + ("" === tests[tests.length - 1].match.def ? 1 : 0) && tests[0].match.optionality !== !0 && tests[0].match.optionalQuantifier !== !0 && null === tests[0].match.fn && !/[0-9a-bA-Z]/.test(tests[0].match.def) ? [determineTestTemplate(tests)] : tests
                    }
                    var latestMatch, maskTokens = getMaskSet().maskToken,
                        testPos = ndxIntlzr ? tstPs : 0,
                        ndxInitializer = ndxIntlzr ? ndxIntlzr.slice() : [0],
                        matches = [],
                        insertStop = !1,
                        cacheDependency = ndxIntlzr ? ndxIntlzr.join("") : "";
                    if (pos > -1) {
                        if (void 0 === ndxIntlzr) {
                            for (var test, previousPos = pos - 1; void 0 === (test = getMaskSet().validPositions[previousPos] || getMaskSet().tests[previousPos]) && previousPos > -1;) previousPos--;
                            void 0 !== test && previousPos > -1 && (ndxInitializer = mergeLocators(test), cacheDependency = ndxInitializer.join(""), testPos = previousPos)
                        }
                        if (getMaskSet().tests[pos] && getMaskSet().tests[pos][0].cd === cacheDependency) return filterTests(getMaskSet().tests[pos]);
                        for (var mtndx = ndxInitializer.shift(); mtndx < maskTokens.length; mtndx++) {
                            var match = resolveTestFromToken(maskTokens[mtndx], ndxInitializer, [mtndx]);
                            if (match && testPos === pos || testPos > pos) break
                        }
                    }
                    return (0 === matches.length || insertStop) && matches.push({
                        match: {
                            fn: null,
                            cardinality: 0,
                            optionality: !0,
                            casing: null,
                            def: "",
                            placeholder: ""
                        },
                        locator: [],
                        cd: cacheDependency
                    }), void 0 !== ndxIntlzr && getMaskSet().tests[pos] ? filterTests($.extend(!0, [], matches)) : (getMaskSet().tests[pos] = $.extend(!0, [], matches), filterTests(getMaskSet().tests[pos]))
                }

                function getBufferTemplate() {
                    return void 0 === getMaskSet()._buffer && (getMaskSet()._buffer = getMaskTemplate(!1, 1), void 0 === getMaskSet().buffer && getMaskSet()._buffer.slice()), getMaskSet()._buffer
                }

                function getBuffer(noCache) {
                    return void 0 !== getMaskSet().buffer && noCache !== !0 || (getMaskSet().buffer = getMaskTemplate(!0, getLastValidPosition(), !0)), getMaskSet().buffer
                }

                function refreshFromBuffer(start, end, buffer) {
                    var i;
                    if (start === !0) resetMaskSet(), start = 0, end = buffer.length;
                    else
                        for (i = start; i < end; i++) delete getMaskSet().validPositions[i];
                    for (i = start; i < end; i++) resetMaskSet(!0), buffer[i] !== opts.skipOptionalPartCharacter && isValid(i, buffer[i], !0, !0)
                }

                function casing(elem, test, pos) {
                    switch (opts.casing || test.casing) {
                        case "upper":
                            elem = elem.toUpperCase();
                            break;
                        case "lower":
                            elem = elem.toLowerCase();
                            break;
                        case "title":
                            var posBefore = getMaskSet().validPositions[pos - 1];
                            elem = 0 === pos || posBefore && posBefore.input === String.fromCharCode(Inputmask.keyCode.SPACE) ? elem.toUpperCase() : elem.toLowerCase()
                    }
                    return elem
                }

                function checkAlternationMatch(altArr1, altArr2) {
                    for (var altArrC = opts.greedy ? altArr2 : altArr2.slice(0, 1), isMatch = !1, alndx = 0; alndx < altArr1.length; alndx++)
                        if ($.inArray(altArr1[alndx], altArrC) !== -1) {
                            isMatch = !0;
                            break
                        }
                    return isMatch
                }

                function isValid(pos, c, strict, fromSetValid, fromAlternate) {
                    function isSelection(posObj) {
                        var selection = isRTL ? posObj.begin - posObj.end > 1 || posObj.begin - posObj.end === 1 && opts.insertMode : posObj.end - posObj.begin > 1 || posObj.end - posObj.begin === 1 && opts.insertMode;
                        return selection && 0 === posObj.begin && posObj.end === getMaskSet().maskLength ? "full" : selection
                    }

                    function _isValid(position, c, strict) {
                        var rslt = !1;
                        return $.each(getTests(position), function(ndx, tst) {
                            for (var test = tst.match, loopend = c ? 1 : 0, chrs = "", i = test.cardinality; i > loopend; i--) chrs += getBufferElement(position - (i - 1));
                            if (c && (chrs += c), getBuffer(!0), rslt = null != test.fn ? test.fn.test(chrs, getMaskSet(), position, strict, opts, isSelection(pos)) : (c === test.def || c === opts.skipOptionalPartCharacter) && "" !== test.def && {
                                    c: test.placeholder || test.def,
                                    pos: position
                                }, rslt !== !1) {
                                var elem = void 0 !== rslt.c ? rslt.c : c;
                                elem = elem === opts.skipOptionalPartCharacter && null === test.fn ? test.placeholder || test.def : elem;
                                var validatedPos = position,
                                    possibleModifiedBuffer = getBuffer();
                                if (void 0 !== rslt.remove && ($.isArray(rslt.remove) || (rslt.remove = [rslt.remove]), $.each(rslt.remove.sort(function(a, b) {
                                        return b - a
                                    }), function(ndx, lmnt) {
                                        stripValidPositions(lmnt, lmnt + 1, !0)
                                    })), void 0 !== rslt.insert && ($.isArray(rslt.insert) || (rslt.insert = [rslt.insert]), $.each(rslt.insert.sort(function(a, b) {
                                        return a - b
                                    }), function(ndx, lmnt) {
                                        isValid(lmnt.pos, lmnt.c, !0, fromSetValid)
                                    })), rslt.refreshFromBuffer) {
                                    var refresh = rslt.refreshFromBuffer;
                                    if (strict = !0, refreshFromBuffer(refresh === !0 ? refresh : refresh.start, refresh.end, possibleModifiedBuffer), void 0 === rslt.pos && void 0 === rslt.c) return rslt.pos = getLastValidPosition(), !1;
                                    if (validatedPos = void 0 !== rslt.pos ? rslt.pos : position, validatedPos !== position) return rslt = $.extend(rslt, isValid(validatedPos, elem, !0, fromSetValid)), !1
                                } else if (rslt !== !0 && void 0 !== rslt.pos && rslt.pos !== position && (validatedPos = rslt.pos, refreshFromBuffer(position, validatedPos, getBuffer().slice()), validatedPos !== position)) return rslt = $.extend(rslt, isValid(validatedPos, elem, !0)), !1;
                                return (rslt === !0 || void 0 !== rslt.pos || void 0 !== rslt.c) && (ndx > 0 && resetMaskSet(!0), setValidPosition(validatedPos, $.extend({}, tst, {
                                    input: casing(elem, test, validatedPos)
                                }), fromSetValid, isSelection(pos)) || (rslt = !1), !1)
                            }
                        }), rslt
                    }

                    function alternate(pos, c, strict) {
                        var lastAlt, alternation, altPos, prevAltPos, i, validPos, altNdxs, decisionPos, validPsClone = $.extend(!0, {}, getMaskSet().validPositions),
                            isValidRslt = !1,
                            lAltPos = getLastValidPosition();
                        for (prevAltPos = getMaskSet().validPositions[lAltPos]; lAltPos >= 0; lAltPos--)
                            if (altPos = getMaskSet().validPositions[lAltPos], altPos && void 0 !== altPos.alternation) {
                                if (lastAlt = lAltPos, alternation = getMaskSet().validPositions[lastAlt].alternation, prevAltPos.locator[altPos.alternation] !== altPos.locator[altPos.alternation]) break;
                                prevAltPos = altPos
                            }
                        if (void 0 !== alternation) {
                            decisionPos = parseInt(lastAlt);
                            var decisionTaker = void 0 !== prevAltPos.locator[prevAltPos.alternation || alternation] ? prevAltPos.locator[prevAltPos.alternation || alternation] : altNdxs[0];
                            decisionTaker.length > 0 && (decisionTaker = decisionTaker.split(",")[0]);
                            var possibilityPos = getMaskSet().validPositions[decisionPos],
                                prevPos = getMaskSet().validPositions[decisionPos - 1];
                            $.each(getTests(decisionPos, prevPos ? prevPos.locator : void 0, decisionPos - 1), function(ndx, test) {
                                altNdxs = test.locator[alternation] ? test.locator[alternation].toString().split(",") : [];
                                for (var mndx = 0; mndx < altNdxs.length; mndx++) {
                                    var validInputs = [],
                                        staticInputsBeforePos = 0,
                                        staticInputsBeforePosAlternate = 0,
                                        verifyValidInput = !1;
                                    if (decisionTaker < altNdxs[mndx] && (void 0 === test.na || $.inArray(altNdxs[mndx], test.na.split(",")) === -1)) {
                                        getMaskSet().validPositions[decisionPos] = $.extend(!0, {}, test);
                                        var possibilities = getMaskSet().validPositions[decisionPos].locator;
                                        for (getMaskSet().validPositions[decisionPos].locator[alternation] = parseInt(altNdxs[mndx]), null == test.match.fn ? (possibilityPos.input !== test.match.def && (verifyValidInput = !0, possibilityPos.generatedInput !== !0 && validInputs.push(possibilityPos.input)), staticInputsBeforePosAlternate++, getMaskSet().validPositions[decisionPos].generatedInput = !/[0-9a-bA-Z]/.test(test.match.def), getMaskSet().validPositions[decisionPos].input = test.match.def) : getMaskSet().validPositions[decisionPos].input = possibilityPos.input, i = decisionPos + 1; i < getLastValidPosition(void 0, !0) + 1; i++) validPos = getMaskSet().validPositions[i], validPos && validPos.generatedInput !== !0 && /[0-9a-bA-Z]/.test(validPos.input) ? validInputs.push(validPos.input) : i < pos && staticInputsBeforePos++, delete getMaskSet().validPositions[i];
                                        for (verifyValidInput && validInputs[0] === test.match.def && validInputs.shift(), resetMaskSet(!0), isValidRslt = !0; validInputs.length > 0;) {
                                            var input = validInputs.shift();
                                            if (input !== opts.skipOptionalPartCharacter && !(isValidRslt = isValid(getLastValidPosition(void 0, !0) + 1, input, !1, fromSetValid, !0))) break
                                        }
                                        if (isValidRslt) {
                                            getMaskSet().validPositions[decisionPos].locator = possibilities;
                                            var targetLvp = getLastValidPosition(pos) + 1;
                                            for (i = decisionPos + 1; i < getLastValidPosition() + 1; i++) validPos = getMaskSet().validPositions[i], (void 0 === validPos || null == validPos.match.fn) && i < pos + (staticInputsBeforePosAlternate - staticInputsBeforePos) && staticInputsBeforePosAlternate++;
                                            pos += staticInputsBeforePosAlternate - staticInputsBeforePos, isValidRslt = isValid(pos > targetLvp ? targetLvp : pos, c, strict, fromSetValid, !0)
                                        }
                                        if (isValidRslt) return !1;
                                        resetMaskSet(), getMaskSet().validPositions = $.extend(!0, {}, validPsClone)
                                    }
                                }
                            })
                        }
                        return isValidRslt
                    }

                    function trackbackAlternations(originalPos, newPos) {
                        var vp = getMaskSet().validPositions[newPos];
                        if (vp)
                            for (var targetLocator = vp.locator, tll = targetLocator.length, ps = originalPos; ps < newPos; ps++)
                                if (void 0 === getMaskSet().validPositions[ps] && !isMask(ps, !0)) {
                                    var tests = getTests(ps),
                                        bestMatch = tests[0],
                                        equality = -1;
                                    $.each(tests, function(ndx, tst) {
                                        for (var i = 0; i < tll && (void 0 !== tst.locator[i] && checkAlternationMatch(tst.locator[i].toString().split(","), targetLocator[i].toString().split(","))); i++) equality < i && (equality = i, bestMatch = tst)
                                    }), setValidPosition(ps, $.extend({}, bestMatch, {
                                        input: bestMatch.match.placeholder || bestMatch.match.def
                                    }), !0)
                                }
                    }

                    function setValidPosition(pos, validTest, fromSetValid, isSelection) {
                        if (isSelection || opts.insertMode && void 0 !== getMaskSet().validPositions[pos] && void 0 === fromSetValid) {
                            var i, positionsClone = $.extend(!0, {}, getMaskSet().validPositions),
                                lvp = getLastValidPosition(void 0, !0);
                            for (i = pos; i <= lvp; i++) delete getMaskSet().validPositions[i];
                            getMaskSet().validPositions[pos] = $.extend(!0, {}, validTest);
                            var j, valid = !0,
                                vps = getMaskSet().validPositions,
                                needsValidation = !1,
                                initialLength = getMaskSet().maskLength;
                            for (i = j = pos; i <= lvp; i++) {
                                var t = positionsClone[i];
                                if (void 0 !== t)
                                    for (var posMatch = j; posMatch < getMaskSet().maskLength && (null === t.match.fn && vps[i] && (vps[i].match.optionalQuantifier === !0 || vps[i].match.optionality === !0) || null != t.match.fn);) {
                                        if (posMatch++, needsValidation === !1 && positionsClone[posMatch] && positionsClone[posMatch].match.def === t.match.def) getMaskSet().validPositions[posMatch] = $.extend(!0, {}, positionsClone[posMatch]), getMaskSet().validPositions[posMatch].input = t.input, fillMissingNonMask(posMatch), j = posMatch, valid = !0;
                                        else if (positionCanMatchDefinition(posMatch, t.match.def)) {
                                            var result = isValid(posMatch, t.input, !0, !0);
                                            valid = result !== !1, j = result.caret || result.insert ? getLastValidPosition() : posMatch, needsValidation = !0
                                        } else valid = t.generatedInput === !0;
                                        if (getMaskSet().maskLength < initialLength && (getMaskSet().maskLength = initialLength), valid) break
                                    }
                                if (!valid) break
                            }
                            if (!valid) return getMaskSet().validPositions = $.extend(!0, {}, positionsClone), resetMaskSet(!0), !1
                        } else getMaskSet().validPositions[pos] = $.extend(!0, {}, validTest);
                        return resetMaskSet(!0), !0
                    }

                    function fillMissingNonMask(maskPos) {
                        for (var pndx = maskPos - 1; pndx > -1 && !getMaskSet().validPositions[pndx]; pndx--);
                        var testTemplate, testsFromPos;
                        for (pndx++; pndx < maskPos; pndx++) void 0 === getMaskSet().validPositions[pndx] && (opts.jitMasking === !1 || opts.jitMasking > pndx) && (testsFromPos = getTests(pndx, getTestTemplate(pndx - 1).locator, pndx - 1).slice(), "" === testsFromPos[testsFromPos.length - 1].match.def && testsFromPos.pop(), testTemplate = determineTestTemplate(testsFromPos), testTemplate && (testTemplate.match.def === opts.radixPointDefinitionSymbol || !isMask(pndx, !0) || $.inArray(opts.radixPoint, getBuffer()) < pndx && testTemplate.match.fn && testTemplate.match.fn.test(getPlaceholder(pndx), getMaskSet(), pndx, !1, opts)) && (result = _isValid(pndx, testTemplate.match.placeholder || (null == testTemplate.match.fn ? testTemplate.match.def : "" !== getPlaceholder(pndx) ? getPlaceholder(pndx) : getBuffer()[pndx]), !0), result !== !1 && (getMaskSet().validPositions[result.pos || pndx].generatedInput = !0)))
                    }
                    strict = strict === !0;
                    var maskPos = pos;
                    void 0 !== pos.begin && (maskPos = isRTL && !isSelection(pos) ? pos.end : pos.begin);
                    var result = !1,
                        positionsClone = $.extend(!0, {}, getMaskSet().validPositions);
                    if (fillMissingNonMask(maskPos), isSelection(pos) && (handleRemove(void 0, Inputmask.keyCode.DELETE, pos), maskPos = getMaskSet().p), maskPos < getMaskSet().maskLength && (result = _isValid(maskPos, c, strict), (!strict || fromSetValid === !0) && result === !1)) {
                        var currentPosValid = getMaskSet().validPositions[maskPos];
                        if (!currentPosValid || null !== currentPosValid.match.fn || currentPosValid.match.def !== c && c !== opts.skipOptionalPartCharacter) {
                            if ((opts.insertMode || void 0 === getMaskSet().validPositions[seekNext(maskPos)]) && !isMask(maskPos, !0)) {
                                var testsFromPos = getTests(maskPos).slice();
                                "" === testsFromPos[testsFromPos.length - 1].match.def && testsFromPos.pop();
                                var staticChar = determineTestTemplate(testsFromPos, !0);
                                staticChar && null === staticChar.match.fn && (staticChar = staticChar.match.placeholder || staticChar.match.def, _isValid(maskPos, staticChar, strict), getMaskSet().validPositions[maskPos].generatedInput = !0);
                                for (var nPos = maskPos + 1, snPos = seekNext(maskPos); nPos <= snPos; nPos++)
                                    if (result = _isValid(nPos, c, strict), result !== !1) {
                                        trackbackAlternations(maskPos, void 0 !== result.pos ? result.pos : nPos), maskPos = nPos;
                                        break
                                    }
                            }
                        } else result = {
                            caret: seekNext(maskPos)
                        }
                    }
                    return result === !1 && opts.keepStatic && !strict && fromAlternate !== !0 && (result = alternate(maskPos, c, strict)), result === !0 && (result = {
                        pos: maskPos
                    }), $.isFunction(opts.postValidation) && result !== !1 && !strict && fromSetValid !== !0 && (result = !!opts.postValidation(getBuffer(!0), result, opts) && result), void 0 === result.pos && (result.pos = maskPos), result === !1 && (resetMaskSet(!0), getMaskSet().validPositions = $.extend(!0, {}, positionsClone)), result
                }

                function isMask(pos, strict) {
                    var test;
                    if (strict ? (test = getTestTemplate(pos).match, "" === test.def && (test = getTest(pos).match)) : test = getTest(pos).match, null != test.fn) return test.fn;
                    if (strict !== !0 && pos > -1) {
                        var tests = getTests(pos);
                        return tests.length > 1 + ("" === tests[tests.length - 1].match.def ? 1 : 0)
                    }
                    return !1
                }

                function seekNext(pos, newBlock) {
                    var maskL = getMaskSet().maskLength;
                    if (pos >= maskL) return maskL;
                    for (var position = pos; ++position < maskL && (newBlock === !0 && (getTest(position).match.newBlockMarker !== !0 || !isMask(position)) || newBlock !== !0 && !isMask(position)););
                    return position
                }

                function seekPrevious(pos, newBlock) {
                    var tests, position = pos;
                    if (position <= 0) return 0;
                    for (; --position > 0 && (newBlock === !0 && getTest(position).match.newBlockMarker !== !0 || newBlock !== !0 && !isMask(position) && (tests = getTests(position), tests.length < 2 || 2 === tests.length && "" === tests[1].match.def)););
                    return position
                }

                function getBufferElement(position) {
                    return void 0 === getMaskSet().validPositions[position] ? getPlaceholder(position) : getMaskSet().validPositions[position].input
                }

                function writeBuffer(input, buffer, caretPos, event, triggerInputEvent) {
                    if (event && $.isFunction(opts.onBeforeWrite)) {
                        var result = opts.onBeforeWrite(event, buffer, caretPos, opts);
                        if (result) {
                            if (result.refreshFromBuffer) {
                                var refresh = result.refreshFromBuffer;
                                refreshFromBuffer(refresh === !0 ? refresh : refresh.start, refresh.end, result.buffer || buffer), buffer = getBuffer(!0)
                            }
                            void 0 !== caretPos && (caretPos = void 0 !== result.caret ? result.caret : caretPos)
                        }
                    }
                    input.inputmask._valueSet(buffer.join("")), void 0 === caretPos || void 0 !== event && "blur" === event.type ? renderColorMask(input, buffer, caretPos) : caret(input, caretPos), triggerInputEvent === !0 && (skipInputEvent = !0, $(input).trigger("input"))
                }

                function getPlaceholder(pos, test) {
                    if (test = test || getTest(pos).match, void 0 !== test.placeholder) return test.placeholder;
                    if (null === test.fn) {
                        if (pos > -1 && void 0 === getMaskSet().validPositions[pos]) {
                            var prevTest, tests = getTests(pos),
                                staticAlternations = [];
                            if (tests.length > 1 + ("" === tests[tests.length - 1].match.def ? 1 : 0))
                                for (var i = 0; i < tests.length; i++)
                                    if (tests[i].match.optionality !== !0 && tests[i].match.optionalQuantifier !== !0 && (null === tests[i].match.fn || void 0 === prevTest || tests[i].match.fn.test(prevTest.match.def, getMaskSet(), pos, !0, opts) !== !1) && (staticAlternations.push(tests[i]), null === tests[i].match.fn && (prevTest = tests[i]), staticAlternations.length > 1 && /[0-9a-bA-Z]/.test(staticAlternations[0].match.def))) return opts.placeholder.charAt(pos % opts.placeholder.length)
                        }
                        return test.def
                    }
                    return opts.placeholder.charAt(pos % opts.placeholder.length)
                }

                function checkVal(input, writeOut, strict, nptvl, initiatingEvent, stickyCaret) {
                    function isTemplateMatch() {
                        var isMatch = !1,
                            charCodeNdx = getBufferTemplate().slice(initialNdx, seekNext(initialNdx)).join("").indexOf(charCodes);
                        if (charCodeNdx !== -1 && !isMask(initialNdx)) {
                            isMatch = !0;
                            for (var bufferTemplateArr = getBufferTemplate().slice(initialNdx, initialNdx + charCodeNdx), i = 0; i < bufferTemplateArr.length; i++)
                                if (" " !== bufferTemplateArr[i]) {
                                    isMatch = !1;
                                    break
                                }
                        }
                        return isMatch
                    }
                    var inputValue = nptvl.slice(),
                        charCodes = "",
                        initialNdx = 0,
                        result = void 0;
                    if (resetMaskSet(), getMaskSet().p = seekNext(-1), !strict)
                        if (opts.autoUnmask !== !0) {
                            var staticInput = getBufferTemplate().slice(0, seekNext(-1)).join(""),
                                matches = inputValue.join("").match(new RegExp("^" + Inputmask.escapeRegex(staticInput), "g"));
                            matches && matches.length > 0 && (inputValue.splice(0, matches.length * staticInput.length), initialNdx = seekNext(initialNdx))
                        } else initialNdx = seekNext(initialNdx);
                    if ($.each(inputValue, function(ndx, charCode) {
                            if (void 0 !== charCode) {
                                var keypress = new $.Event("keypress");
                                keypress.which = charCode.charCodeAt(0), charCodes += charCode;
                                var lvp = getLastValidPosition(void 0, !0),
                                    lvTest = getMaskSet().validPositions[lvp],
                                    nextTest = getTestTemplate(lvp + 1, lvTest ? lvTest.locator.slice() : void 0, lvp);
                                if (!isTemplateMatch() || strict || opts.autoUnmask) {
                                    var pos = strict ? ndx : null == nextTest.match.fn && nextTest.match.optionality && lvp + 1 < getMaskSet().p ? lvp + 1 : getMaskSet().p;
                                    result = EventHandlers.keypressEvent.call(input, keypress, !0, !1, strict, pos), initialNdx = pos + 1, charCodes = ""
                                } else result = EventHandlers.keypressEvent.call(input, keypress, !0, !1, !0, lvp + 1);
                                if (!strict && $.isFunction(opts.onBeforeWrite) && (result = opts.onBeforeWrite(keypress, getBuffer(), result.forwardPosition, opts), result && result.refreshFromBuffer)) {
                                    var refresh = result.refreshFromBuffer;
                                    refreshFromBuffer(refresh === !0 ? refresh : refresh.start, refresh.end, result.buffer), resetMaskSet(!0), result.caret && (getMaskSet().p = result.caret)
                                }
                            }
                        }), writeOut) {
                        var caretPos = void 0,
                            lvp = getLastValidPosition();
                        document.activeElement === input && (initiatingEvent || result) && (caretPos = caret(input).begin, initiatingEvent && result === !1 && (caretPos = seekNext(getLastValidPosition(caretPos))), result && stickyCaret !== !0 && (caretPos < lvp + 1 || lvp === -1) && (caretPos = opts.numericInput && void 0 === result.caret ? seekPrevious(result.forwardPosition) : result.forwardPosition)), writeBuffer(input, getBuffer(), caretPos, initiatingEvent || new $.Event("checkval"))
                    }
                }

                function unmaskedvalue(input) {
                    if (input && void 0 === input.inputmask) return input.value;
                    var umValue = [],
                        vps = getMaskSet().validPositions;
                    for (var pndx in vps) vps[pndx].match && null != vps[pndx].match.fn && umValue.push(vps[pndx].input);
                    var unmaskedValue = 0 === umValue.length ? "" : (isRTL ? umValue.reverse() : umValue).join("");
                    if ($.isFunction(opts.onUnMask)) {
                        var bufferValue = (isRTL ? getBuffer().slice().reverse() : getBuffer()).join("");
                        unmaskedValue = opts.onUnMask(bufferValue, unmaskedValue, opts) || unmaskedValue
                    }
                    return unmaskedValue
                }

                function caret(input, begin, end, notranslate) {
                    function translatePosition(pos) {
                        if (notranslate !== !0 && isRTL && "number" == typeof pos && (!opts.greedy || "" !== opts.placeholder)) {
                            var bffrLght = getBuffer().join("").length;
                            pos = bffrLght - pos
                        }
                        return pos
                    }
                    var range;
                    if ("number" != typeof begin) return input.setSelectionRange ? (begin = input.selectionStart, end = input.selectionEnd) : window.getSelection ? (range = window.getSelection().getRangeAt(0), range.commonAncestorContainer.parentNode !== input && range.commonAncestorContainer !== input || (begin = range.startOffset, end = range.endOffset)) : document.selection && document.selection.createRange && (range = document.selection.createRange(), begin = 0 - range.duplicate().moveStart("character", -input.inputmask._valueGet().length), end = begin + range.text.length), {
                        begin: translatePosition(begin),
                        end: translatePosition(end)
                    };
                    begin = translatePosition(begin), end = translatePosition(end), end = "number" == typeof end ? end : begin;
                    var scrollCalc = parseInt(((input.ownerDocument.defaultView || window).getComputedStyle ? (input.ownerDocument.defaultView || window).getComputedStyle(input, null) : input.currentStyle).fontSize) * end;
                    if (input.scrollLeft = scrollCalc > input.scrollWidth ? scrollCalc : 0, mobile || opts.insertMode !== !1 || begin !== end || end++, input.setSelectionRange) input.selectionStart = begin, input.selectionEnd = end;
                    else if (window.getSelection) {
                        if (range = document.createRange(), void 0 === input.firstChild || null === input.firstChild) {
                            var textNode = document.createTextNode("");
                            input.appendChild(textNode)
                        }
                        range.setStart(input.firstChild, begin < input.inputmask._valueGet().length ? begin : input.inputmask._valueGet().length), range.setEnd(input.firstChild, end < input.inputmask._valueGet().length ? end : input.inputmask._valueGet().length), range.collapse(!0);
                        var sel = window.getSelection();
                        sel.removeAllRanges(), sel.addRange(range)
                    } else input.createTextRange && (range = input.createTextRange(), range.collapse(!0), range.moveEnd("character", end), range.moveStart("character", begin), range.select());
                    renderColorMask(input, void 0, {
                        begin: begin,
                        end: end
                    })
                }

                function determineLastRequiredPosition(returnDefinition) {
                    var pos, testPos, buffer = getBuffer(),
                        bl = buffer.length,
                        lvp = getLastValidPosition(),
                        positions = {},
                        lvTest = getMaskSet().validPositions[lvp],
                        ndxIntlzr = void 0 !== lvTest ? lvTest.locator.slice() : void 0;
                    for (pos = lvp + 1; pos < buffer.length; pos++) testPos = getTestTemplate(pos, ndxIntlzr, pos - 1), ndxIntlzr = testPos.locator.slice(), positions[pos] = $.extend(!0, {}, testPos);
                    var lvTestAlt = lvTest && void 0 !== lvTest.alternation ? lvTest.locator[lvTest.alternation] : void 0;
                    for (pos = bl - 1; pos > lvp && (testPos = positions[pos], (testPos.match.optionality || testPos.match.optionalQuantifier || lvTestAlt && (lvTestAlt !== positions[pos].locator[lvTest.alternation] && null != testPos.match.fn || null === testPos.match.fn && testPos.locator[lvTest.alternation] && checkAlternationMatch(testPos.locator[lvTest.alternation].toString().split(","), lvTestAlt.toString().split(",")) && "" !== getTests(pos)[0].def)) && buffer[pos] === getPlaceholder(pos, testPos.match)); pos--) bl--;
                    return returnDefinition ? {
                        l: bl,
                        def: positions[bl] ? positions[bl].match : void 0
                    } : bl
                }

                function clearOptionalTail(buffer) {
                    for (var rl = determineLastRequiredPosition(), lmib = buffer.length - 1; lmib > rl && !isMask(lmib); lmib--);
                    return buffer.splice(rl, lmib + 1 - rl), buffer
                }

                function isComplete(buffer) {
                    if ($.isFunction(opts.isComplete)) return opts.isComplete(buffer, opts);
                    if ("*" !== opts.repeat) {
                        var complete = !1,
                            lrp = determineLastRequiredPosition(!0),
                            aml = seekPrevious(lrp.l);
                        if (void 0 === lrp.def || lrp.def.newBlockMarker || lrp.def.optionality || lrp.def.optionalQuantifier) {
                            complete = !0;
                            for (var i = 0; i <= aml; i++) {
                                var test = getTestTemplate(i).match;
                                if (null !== test.fn && void 0 === getMaskSet().validPositions[i] && test.optionality !== !0 && test.optionalQuantifier !== !0 || null === test.fn && buffer[i] !== getPlaceholder(i, test)) {
                                    complete = !1;
                                    break
                                }
                            }
                        }
                        return complete
                    }
                }

                function handleRemove(input, k, pos, strict) {
                    function generalize() {
                        if (opts.keepStatic) {
                            for (var validInputs = [], lastAlt = getLastValidPosition(-1, !0), positionsClone = $.extend(!0, {}, getMaskSet().validPositions), prevAltPos = getMaskSet().validPositions[lastAlt]; lastAlt >= 0; lastAlt--) {
                                var altPos = getMaskSet().validPositions[lastAlt];
                                if (altPos) {
                                    if (altPos.generatedInput !== !0 && /[0-9a-bA-Z]/.test(altPos.input) && validInputs.push(altPos.input), delete getMaskSet().validPositions[lastAlt], void 0 !== altPos.alternation && altPos.locator[altPos.alternation] !== prevAltPos.locator[altPos.alternation]) break;
                                    prevAltPos = altPos
                                }
                            }
                            if (lastAlt > -1)
                                for (getMaskSet().p = seekNext(getLastValidPosition(-1, !0)); validInputs.length > 0;) {
                                    var keypress = new $.Event("keypress");
                                    keypress.which = validInputs.pop().charCodeAt(0), EventHandlers.keypressEvent.call(input, keypress, !0, !1, !1, getMaskSet().p)
                                } else getMaskSet().validPositions = $.extend(!0, {}, positionsClone)
                        }
                    }
                    if ((opts.numericInput || isRTL) && (k === Inputmask.keyCode.BACKSPACE ? k = Inputmask.keyCode.DELETE : k === Inputmask.keyCode.DELETE && (k = Inputmask.keyCode.BACKSPACE), isRTL)) {
                        var pend = pos.end;
                        pos.end = pos.begin, pos.begin = pend
                    }
                    k === Inputmask.keyCode.BACKSPACE && (pos.end - pos.begin < 1 || opts.insertMode === !1) ? (pos.begin = seekPrevious(pos.begin), void 0 === getMaskSet().validPositions[pos.begin] || getMaskSet().validPositions[pos.begin].input !== opts.groupSeparator && getMaskSet().validPositions[pos.begin].input !== opts.radixPoint || pos.begin--) : k === Inputmask.keyCode.DELETE && pos.begin === pos.end && (pos.end = isMask(pos.end, !0) ? pos.end + 1 : seekNext(pos.end) + 1, void 0 === getMaskSet().validPositions[pos.begin] || getMaskSet().validPositions[pos.begin].input !== opts.groupSeparator && getMaskSet().validPositions[pos.begin].input !== opts.radixPoint || pos.end++), stripValidPositions(pos.begin, pos.end, !1, strict), strict !== !0 && generalize();
                    var lvp = getLastValidPosition(pos.begin, !0);
                    lvp < pos.begin ? getMaskSet().p = seekNext(lvp) : strict !== !0 && (getMaskSet().p = pos.begin)
                }

                function initializeColorMask(input) {
                    function findCaretPos(clientx) {
                        var caretPos, e = document.createElement("span");
                        for (var style in computedStyle) isNaN(style) && style.indexOf("font") !== -1 && (e.style[style] = computedStyle[style]);
                        e.style.textTransform = computedStyle.textTransform, e.style.letterSpacing = computedStyle.letterSpacing, e.style.position = "absolute", e.style.height = "auto", e.style.width = "auto", e.style.visibility = "hidden", e.style.whiteSpace = "nowrap", document.body.appendChild(e);
                        var itl, inputText = input.inputmask._valueGet(),
                            previousWidth = 0;
                        for (caretPos = 0, itl = inputText.length; caretPos <= itl; caretPos++) {
                            if (e.innerHTML += inputText.charAt(caretPos) || "_", e.offsetWidth >= clientx) {
                                var offset1 = clientx - previousWidth,
                                    offset2 = e.offsetWidth - clientx;
                                e.innerHTML = inputText.charAt(caretPos), offset1 -= e.offsetWidth / 3, caretPos = offset1 < offset2 ? caretPos - 1 : caretPos;
                                break
                            }
                            previousWidth = e.offsetWidth
                        }
                        return document.body.removeChild(e), caretPos
                    }

                    function position() {
                        colorMask.style.position = "absolute", colorMask.style.top = offset.top + "px", colorMask.style.left = offset.left + "px", colorMask.style.width = parseInt(input.offsetWidth) - parseInt(computedStyle.paddingLeft) - parseInt(computedStyle.paddingRight) - parseInt(computedStyle.borderLeftWidth) - parseInt(computedStyle.borderRightWidth) + "px", colorMask.style.height = parseInt(input.offsetHeight) - parseInt(computedStyle.paddingTop) - parseInt(computedStyle.paddingBottom) - parseInt(computedStyle.borderTopWidth) - parseInt(computedStyle.borderBottomWidth) + "px", colorMask.style.lineHeight = colorMask.style.height, colorMask.style.zIndex = isNaN(computedStyle.zIndex) ? -1 : computedStyle.zIndex - 1, colorMask.style.webkitAppearance = "textfield", colorMask.style.mozAppearance = "textfield", colorMask.style.Appearance = "textfield"
                    }
                    var offset = $(input).position(),
                        computedStyle = (input.ownerDocument.defaultView || window).getComputedStyle(input, null);
                    input.parentNode;
                    colorMask = document.createElement("div"), document.body.appendChild(colorMask);
                    for (var style in computedStyle) isNaN(style) && "cssText" !== style && style.indexOf("webkit") == -1 && (colorMask.style[style] = computedStyle[style]);
                    input.style.backgroundColor = "transparent", input.style.color = "transparent", input.style.webkitAppearance = "caret", input.style.mozAppearance = "caret", input.style.Appearance = "caret", position(), $(window).on("resize", function(e) {
                        offset = $(input).position(), computedStyle = (input.ownerDocument.defaultView || window).getComputedStyle(input, null), position()
                    }), $(input).on("click", function(e) {
                        return caret(input, findCaretPos(e.clientX)), EventHandlers.clickEvent.call(this, [e])
                    }), $(input).on("keydown", function(e) {
                        e.shiftKey || opts.insertMode === !1 || setTimeout(function() {
                            renderColorMask(input)
                        }, 0)
                    })
                }

                function renderColorMask(input, buffer, caretPos) {
                    function handleStatic() {
                        static || null !== test.fn && void 0 !== testPos.input ? static && null !== test.fn && void 0 !== testPos.input && (static = !1, maskTemplate += "</span>") : (static = !0, maskTemplate += "<span class='im-static''>")
                    }
                    if (void 0 !== colorMask) {
                        buffer = buffer || getBuffer(), void 0 === caretPos ? caretPos = caret(input) : void 0 === caretPos.begin && (caretPos = {
                            begin: caretPos,
                            end: caretPos
                        });
                        var maskTemplate = "",
                            static = !1;
                        if ("" != buffer) {
                            var ndxIntlzr, test, testPos, pos = 0,
                                lvp = getLastValidPosition();
                            do {
                                pos === caretPos.begin && document.activeElement === input && (maskTemplate += "<span class='im-caret' style='border-right-width: 1px;border-right-style: solid;'></span>"), getMaskSet().validPositions[pos] ? (testPos = getMaskSet().validPositions[pos], test = testPos.match, ndxIntlzr = testPos.locator.slice(), handleStatic(), maskTemplate += testPos.input) : (testPos = getTestTemplate(pos, ndxIntlzr, pos - 1), test = testPos.match, ndxIntlzr = testPos.locator.slice(), (opts.jitMasking === !1 || pos < lvp || "number" == typeof opts.jitMasking && isFinite(opts.jitMasking) && opts.jitMasking > pos) && (handleStatic(), maskTemplate += getPlaceholder(pos, test))), pos++
                            } while ((void 0 === maxLength || pos < maxLength) && (null !== test.fn || "" !== test.def) || lvp > pos)
                        }
                        colorMask.innerHTML = maskTemplate
                    }
                }

                function mask(elem) {
                    function isElementTypeSupported(input, opts) {
                        function patchValueProperty(npt) {
                            function patchValhook(type) {
                                if ($.valHooks && (void 0 === $.valHooks[type] || $.valHooks[type].inputmaskpatch !== !0)) {
                                    var valhookGet = $.valHooks[type] && $.valHooks[type].get ? $.valHooks[type].get : function(elem) {
                                            return elem.value
                                        },
                                        valhookSet = $.valHooks[type] && $.valHooks[type].set ? $.valHooks[type].set : function(elem, value) {
                                            return elem.value = value, elem
                                        };
                                    $.valHooks[type] = {
                                        get: function(elem) {
                                            if (elem.inputmask) {
                                                if (elem.inputmask.opts.autoUnmask) return elem.inputmask.unmaskedvalue();
                                                var result = valhookGet(elem);
                                                return getLastValidPosition(void 0, void 0, elem.inputmask.maskset.validPositions) !== -1 || opts.nullable !== !0 ? result : ""
                                            }
                                            return valhookGet(elem)
                                        },
                                        set: function(elem, value) {
                                            var result, $elem = $(elem);
                                            return result = valhookSet(elem, value), elem.inputmask && $elem.trigger("setvalue"), result
                                        },
                                        inputmaskpatch: !0
                                    }
                                }
                            }

                            function getter() {
                                return this.inputmask ? this.inputmask.opts.autoUnmask ? this.inputmask.unmaskedvalue() : getLastValidPosition() !== -1 || opts.nullable !== !0 ? document.activeElement === this && opts.clearMaskOnLostFocus ? (isRTL ? clearOptionalTail(getBuffer().slice()).reverse() : clearOptionalTail(getBuffer().slice())).join("") : valueGet.call(this) : "" : valueGet.call(this)
                            }

                            function setter(value) {
                                valueSet.call(this, value), this.inputmask && $(this).trigger("setvalue")
                            }

                            function installNativeValueSetFallback(npt) {
                                EventRuler.on(npt, "mouseenter", function(event) {
                                    var $input = $(this),
                                        input = this,
                                        value = input.inputmask._valueGet();
                                    value !== getBuffer().join("") && $input.trigger("setvalue")
                                })
                            }
                            var valueGet, valueSet;
                            if (!npt.inputmask.__valueGet) {
                                if (opts.noValuePatching !== !0) {
                                    if (Object.getOwnPropertyDescriptor) {
                                        "function" != typeof Object.getPrototypeOf && (Object.getPrototypeOf = "object" == typeof "test".__proto__ ? function(object) {
                                            return object.__proto__
                                        } : function(object) {
                                            return object.constructor.prototype
                                        });
                                        var valueProperty = Object.getPrototypeOf ? Object.getOwnPropertyDescriptor(Object.getPrototypeOf(npt), "value") : void 0;
                                        valueProperty && valueProperty.get && valueProperty.set ? (valueGet = valueProperty.get, valueSet = valueProperty.set, Object.defineProperty(npt, "value", {
                                            get: getter,
                                            set: setter,
                                            configurable: !0
                                        })) : "INPUT" !== npt.tagName && (valueGet = function() {
                                            return this.textContent
                                        }, valueSet = function(value) {
                                            this.textContent = value
                                        }, Object.defineProperty(npt, "value", {
                                            get: getter,
                                            set: setter,
                                            configurable: !0
                                        }))
                                    } else document.__lookupGetter__ && npt.__lookupGetter__("value") && (valueGet = npt.__lookupGetter__("value"), valueSet = npt.__lookupSetter__("value"), npt.__defineGetter__("value", getter), npt.__defineSetter__("value", setter));
                                    npt.inputmask.__valueGet = valueGet, npt.inputmask.__valueSet = valueSet
                                }
                                npt.inputmask._valueGet = function(overruleRTL) {
                                    return isRTL && overruleRTL !== !0 ? valueGet.call(this.el).split("").reverse().join("") : valueGet.call(this.el)
                                }, npt.inputmask._valueSet = function(value, overruleRTL) {
                                    valueSet.call(this.el, null === value || void 0 === value ? "" : overruleRTL !== !0 && isRTL ? value.split("").reverse().join("") : value)
                                }, void 0 === valueGet && (valueGet = function() {
                                    return this.value
                                }, valueSet = function(value) {
                                    this.value = value
                                }, patchValhook(npt.type), installNativeValueSetFallback(npt))
                            }
                        }
                        var elementType = input.getAttribute("type"),
                            isSupported = "INPUT" === input.tagName && $.inArray(elementType, opts.supportsInputType) !== -1 || input.isContentEditable || "TEXTAREA" === input.tagName;
                        if (!isSupported)
                            if ("INPUT" === input.tagName) {
                                var el = document.createElement("input");
                                el.setAttribute("type", elementType), isSupported = "text" === el.type, el = null
                            } else isSupported = "partial";
                        return isSupported !== !1 && patchValueProperty(input), isSupported
                    }
                    var isSupported = isElementTypeSupported(elem, opts);
                    if (isSupported !== !1 && (el = elem, $el = $(el), ("rtl" === el.dir || opts.rightAlign) && (el.style.textAlign = "right"), ("rtl" === el.dir || opts.numericInput) && (el.dir = "ltr", el.removeAttribute("dir"), el.inputmask.isRTL = !0, isRTL = !0), opts.colorMask === !0 && initializeColorMask(el), android && (el.hasOwnProperty("inputmode") && (el.inputmode = opts.inputmode, el.setAttribute("inputmode", opts.inputmode)), "rtfm" === opts.androidHack && (opts.colorMask !== !0 && initializeColorMask(el), el.type = "password")), EventRuler.off(el), isSupported === !0 && (EventRuler.on(el, "submit", EventHandlers.submitEvent), EventRuler.on(el, "reset", EventHandlers.resetEvent), EventRuler.on(el, "mouseenter", EventHandlers.mouseenterEvent), EventRuler.on(el, "blur", EventHandlers.blurEvent), EventRuler.on(el, "focus", EventHandlers.focusEvent), EventRuler.on(el, "mouseleave", EventHandlers.mouseleaveEvent), opts.colorMask !== !0 && EventRuler.on(el, "click", EventHandlers.clickEvent), EventRuler.on(el, "dblclick", EventHandlers.dblclickEvent), EventRuler.on(el, "paste", EventHandlers.pasteEvent), EventRuler.on(el, "dragdrop", EventHandlers.pasteEvent), EventRuler.on(el, "drop", EventHandlers.pasteEvent), EventRuler.on(el, "cut", EventHandlers.cutEvent), EventRuler.on(el, "complete", opts.oncomplete), EventRuler.on(el, "incomplete", opts.onincomplete), EventRuler.on(el, "cleared", opts.oncleared), opts.inputEventOnly !== !0 && (EventRuler.on(el, "keydown", EventHandlers.keydownEvent), EventRuler.on(el, "keypress", EventHandlers.keypressEvent)), EventRuler.on(el, "compositionstart", $.noop), EventRuler.on(el, "compositionupdate", $.noop), EventRuler.on(el, "compositionend", $.noop), EventRuler.on(el, "keyup", $.noop), EventRuler.on(el, "input", EventHandlers.inputFallBackEvent)), EventRuler.on(el, "setvalue", EventHandlers.setValueEvent), getBufferTemplate(), "" !== el.inputmask._valueGet() || opts.clearMaskOnLostFocus === !1 || document.activeElement === el)) {
                        var initialValue = $.isFunction(opts.onBeforeMask) ? opts.onBeforeMask(el.inputmask._valueGet(), opts) || el.inputmask._valueGet() : el.inputmask._valueGet();
                        checkVal(el, !0, !1, initialValue.split(""));
                        var buffer = getBuffer().slice();
                        undoValue = buffer.join(""), isComplete(buffer) === !1 && opts.clearIncomplete && resetMaskSet(), opts.clearMaskOnLostFocus && document.activeElement !== el && (getLastValidPosition() === -1 ? buffer = [] : clearOptionalTail(buffer)), writeBuffer(el, buffer), document.activeElement === el && caret(el, seekNext(getLastValidPosition()))
                    }
                }
                maskset = maskset || this.maskset, opts = opts || this.opts;
                var undoValue, $el, maxLength, colorMask, valueBuffer, el = this.el,
                    isRTL = this.isRTL,
                    skipKeyPressEvent = !1,
                    skipInputEvent = !1,
                    ignorable = !1,
                    mouseEnter = !1,
                    EventRuler = {
                        on: function(input, eventName, eventHandler) {
                            var ev = function(e) {
                                if (void 0 === this.inputmask && "FORM" !== this.nodeName) {
                                    var imOpts = $.data(this, "_inputmask_opts");
                                    imOpts ? new Inputmask(imOpts).mask(this) : EventRuler.off(this)
                                } else {
                                    if ("setvalue" === e.type || !(this.disabled || this.readOnly && !("keydown" === e.type && e.ctrlKey && 67 === e.keyCode || opts.tabThrough === !1 && e.keyCode === Inputmask.keyCode.TAB))) {
                                        switch (e.type) {
                                            case "input":
                                                if (skipInputEvent === !0) return skipInputEvent = !1, e.preventDefault();
                                                break;
                                            case "keydown":
                                                skipKeyPressEvent = !1, skipInputEvent = !1;
                                                break;
                                            case "keypress":
                                                if (skipKeyPressEvent === !0) return e.preventDefault();
                                                skipKeyPressEvent = !0;
                                                break;
                                            case "click":
                                                if (iemobile || iphone) {
                                                    var that = this,
                                                        args = arguments;
                                                    return setTimeout(function() {
                                                        eventHandler.apply(that, args)
                                                    }, 0), !1
                                                }
                                        }
                                        var returnVal = eventHandler.apply(this, arguments);
                                        return returnVal === !1 && (e.preventDefault(), e.stopPropagation()), returnVal
                                    }
                                    e.preventDefault()
                                }
                            };
                            input.inputmask.events[eventName] = input.inputmask.events[eventName] || [], input.inputmask.events[eventName].push(ev), $.inArray(eventName, ["submit", "reset"]) !== -1 ? null != input.form && $(input.form).on(eventName, ev) : $(input).on(eventName, ev)
                        },
                        off: function(input, event) {
                            if (input.inputmask && input.inputmask.events) {
                                var events;
                                event ? (events = [], events[event] = input.inputmask.events[event]) : events = input.inputmask.events, $.each(events, function(eventName, evArr) {
                                    for (; evArr.length > 0;) {
                                        var ev = evArr.pop();
                                        $.inArray(eventName, ["submit", "reset"]) !== -1 ? null != input.form && $(input.form).off(eventName, ev) : $(input).off(eventName, ev)
                                    }
                                    delete input.inputmask.events[eventName]
                                })
                            }
                        }
                    },
                    EventHandlers = {
                        keydownEvent: function(e) {
                            function isInputEventSupported(eventName) {
                                var el = document.createElement("input"),
                                    evName = "on" + eventName,
                                    isSupported = evName in el;
                                return isSupported || (el.setAttribute(evName, "return;"), isSupported = "function" == typeof el[evName]), el = null, isSupported
                            }
                            var input = this,
                                $input = $(input),
                                k = e.keyCode,
                                pos = caret(input);
                            if (k === Inputmask.keyCode.BACKSPACE || k === Inputmask.keyCode.DELETE || iphone && k === Inputmask.keyCode.BACKSPACE_SAFARI || e.ctrlKey && k === Inputmask.keyCode.X && !isInputEventSupported("cut")) e.preventDefault(), handleRemove(input, k, pos), writeBuffer(input, getBuffer(!0), getMaskSet().p, e, input.inputmask._valueGet() !== getBuffer().join("")), input.inputmask._valueGet() === getBufferTemplate().join("") ? $input.trigger("cleared") : isComplete(getBuffer()) === !0 && $input.trigger("complete");
                            else if (k === Inputmask.keyCode.END || k === Inputmask.keyCode.PAGE_DOWN) {
                                e.preventDefault();
                                var caretPos = seekNext(getLastValidPosition());
                                opts.insertMode || caretPos !== getMaskSet().maskLength || e.shiftKey || caretPos--, caret(input, e.shiftKey ? pos.begin : caretPos, caretPos, !0)
                            } else k === Inputmask.keyCode.HOME && !e.shiftKey || k === Inputmask.keyCode.PAGE_UP ? (e.preventDefault(), caret(input, 0, e.shiftKey ? pos.begin : 0, !0)) : (opts.undoOnEscape && k === Inputmask.keyCode.ESCAPE || 90 === k && e.ctrlKey) && e.altKey !== !0 ? (checkVal(input, !0, !1, undoValue.split("")), $input.trigger("click")) : k !== Inputmask.keyCode.INSERT || e.shiftKey || e.ctrlKey ? opts.tabThrough === !0 && k === Inputmask.keyCode.TAB ? (e.shiftKey === !0 ? (null === getTest(pos.begin).match.fn && (pos.begin = seekNext(pos.begin)), pos.end = seekPrevious(pos.begin, !0), pos.begin = seekPrevious(pos.end, !0)) : (pos.begin = seekNext(pos.begin, !0), pos.end = seekNext(pos.begin, !0), pos.end < getMaskSet().maskLength && pos.end--), pos.begin < getMaskSet().maskLength && (e.preventDefault(), caret(input, pos.begin, pos.end))) : e.shiftKey || opts.insertMode === !1 && (k === Inputmask.keyCode.RIGHT ? setTimeout(function() {
                                var caretPos = caret(input);
                                caret(input, caretPos.begin)
                            }, 0) : k === Inputmask.keyCode.LEFT && setTimeout(function() {
                                var caretPos = caret(input);
                                caret(input, isRTL ? caretPos.begin + 1 : caretPos.begin - 1)
                            }, 0)) : (opts.insertMode = !opts.insertMode, caret(input, opts.insertMode || pos.begin !== getMaskSet().maskLength ? pos.begin : pos.begin - 1));
                            opts.onKeyDown.call(this, e, getBuffer(), caret(input).begin, opts), ignorable = $.inArray(k, opts.ignorables) !== -1
                        },
                        keypressEvent: function(e, checkval, writeOut, strict, ndx) {
                            var input = this,
                                $input = $(input),
                                k = e.which || e.charCode || e.keyCode;
                            if (!(checkval === !0 || e.ctrlKey && e.altKey) && (e.ctrlKey || e.metaKey || ignorable)) return k === Inputmask.keyCode.ENTER && undoValue !== getBuffer().join("") && (undoValue = getBuffer().join(""), setTimeout(function() {
                                $input.trigger("change")
                            }, 0)), !0;
                            if (k) {
                                46 === k && e.shiftKey === !1 && "," === opts.radixPoint && (k = 44);
                                var forwardPosition, pos = checkval ? {
                                        begin: ndx,
                                        end: ndx
                                    } : caret(input),
                                    c = String.fromCharCode(k);
                                getMaskSet().writeOutBuffer = !0;
                                var valResult = isValid(pos, c, strict);
                                if (valResult !== !1 && (resetMaskSet(!0), forwardPosition = void 0 !== valResult.caret ? valResult.caret : checkval ? valResult.pos + 1 : seekNext(valResult.pos), getMaskSet().p = forwardPosition), writeOut !== !1) {
                                    var self = this;
                                    if (setTimeout(function() {
                                            opts.onKeyValidation.call(self, k, valResult, opts)
                                        }, 0), getMaskSet().writeOutBuffer && valResult !== !1) {
                                        var buffer = getBuffer();
                                        writeBuffer(input, buffer, opts.numericInput && void 0 === valResult.caret ? seekPrevious(forwardPosition) : forwardPosition, e, checkval !== !0), checkval !== !0 && setTimeout(function() {
                                            isComplete(buffer) === !0 && $input.trigger("complete")
                                        }, 0)
                                    }
                                }
                                if (e.preventDefault(), checkval) return valResult.forwardPosition = forwardPosition, valResult
                            }
                        },
                        pasteEvent: function(e) {
                            var tempValue, input = this,
                                ev = e.originalEvent || e,
                                $input = $(input),
                                inputValue = input.inputmask._valueGet(!0),
                                caretPos = caret(input);
                            isRTL && (tempValue = caretPos.end, caretPos.end = caretPos.begin, caretPos.begin = tempValue);
                            var valueBeforeCaret = inputValue.substr(0, caretPos.begin),
                                valueAfterCaret = inputValue.substr(caretPos.end, inputValue.length);
                            if (valueBeforeCaret === (isRTL ? getBufferTemplate().reverse() : getBufferTemplate()).slice(0, caretPos.begin).join("") && (valueBeforeCaret = ""), valueAfterCaret === (isRTL ? getBufferTemplate().reverse() : getBufferTemplate()).slice(caretPos.end).join("") && (valueAfterCaret = ""), isRTL && (tempValue = valueBeforeCaret, valueBeforeCaret = valueAfterCaret, valueAfterCaret = tempValue), window.clipboardData && window.clipboardData.getData) inputValue = valueBeforeCaret + window.clipboardData.getData("Text") + valueAfterCaret;
                            else {
                                if (!ev.clipboardData || !ev.clipboardData.getData) return !0;
                                inputValue = valueBeforeCaret + ev.clipboardData.getData("text/plain") + valueAfterCaret
                            }
                            var pasteValue = inputValue;
                            if ($.isFunction(opts.onBeforePaste)) {
                                if (pasteValue = opts.onBeforePaste(inputValue, opts), pasteValue === !1) return e.preventDefault();
                                pasteValue || (pasteValue = inputValue)
                            }
                            return checkVal(input, !1, !1, isRTL ? pasteValue.split("").reverse() : pasteValue.toString().split("")), writeBuffer(input, getBuffer(), seekNext(getLastValidPosition()), e, undoValue !== getBuffer().join("")), isComplete(getBuffer()) === !0 && $input.trigger("complete"), e.preventDefault()
                        },
                        inputFallBackEvent: function(e) {
                            var input = this,
                                inputValue = input.inputmask._valueGet();
                            if (getBuffer().join("") !== inputValue) {
                                var caretPos = caret(input);
                                if (inputValue = inputValue.replace(new RegExp("(" + Inputmask.escapeRegex(getBufferTemplate().join("")) + ")*"), ""), iemobile) {
                                    var inputChar = inputValue.replace(getBuffer().join(""), "");
                                    if (1 === inputChar.length) {
                                        var keypress = new $.Event("keypress");
                                        return keypress.which = inputChar.charCodeAt(0), EventHandlers.keypressEvent.call(input, keypress, !0, !0, !1, getMaskSet().validPositions[caretPos.begin - 1] ? caretPos.begin : caretPos.begin - 1), !1
                                    }
                                }
                                if (caretPos.begin > inputValue.length && (caret(input, inputValue.length), caretPos = caret(input)), getBuffer().length - inputValue.length !== 1 || inputValue.charAt(caretPos.begin) === getBuffer()[caretPos.begin] || inputValue.charAt(caretPos.begin + 1) === getBuffer()[caretPos.begin] || isMask(caretPos.begin)) {
                                    for (var lvp = getLastValidPosition() + 1, bufferTemplate = getBufferTemplate().join(""); null === inputValue.match(Inputmask.escapeRegex(bufferTemplate) + "$");) bufferTemplate = bufferTemplate.slice(1);
                                    inputValue = inputValue.replace(bufferTemplate, ""), inputValue = inputValue.split(""), checkVal(input, !0, !1, inputValue, e, caretPos.begin < lvp), isComplete(getBuffer()) === !0 && $(input).trigger("complete")
                                } else e.keyCode = Inputmask.keyCode.BACKSPACE, EventHandlers.keydownEvent.call(input, e);
                                e.preventDefault()
                            }
                        },
                        setValueEvent: function(e) {
                            var input = this,
                                value = input.inputmask._valueGet();
                            checkVal(input, !0, !1, ($.isFunction(opts.onBeforeMask) ? opts.onBeforeMask(value, opts) || value : value).split("")), undoValue = getBuffer().join(""), (opts.clearMaskOnLostFocus || opts.clearIncomplete) && input.inputmask._valueGet() === getBufferTemplate().join("") && input.inputmask._valueSet("")
                        },
                        focusEvent: function(e) {
                            var input = this,
                                nptValue = input.inputmask._valueGet();
                            opts.showMaskOnFocus && (!opts.showMaskOnHover || opts.showMaskOnHover && "" === nptValue) && (input.inputmask._valueGet() !== getBuffer().join("") ? writeBuffer(input, getBuffer(), seekNext(getLastValidPosition())) : mouseEnter === !1 && caret(input, seekNext(getLastValidPosition()))), opts.positionCaretOnTab === !0 && EventHandlers.clickEvent.apply(input, [e, !0]), undoValue = getBuffer().join("")
                        },
                        mouseleaveEvent: function(e) {
                            var input = this;
                            if (mouseEnter = !1, opts.clearMaskOnLostFocus && document.activeElement !== input) {
                                var buffer = getBuffer().slice(),
                                    nptValue = input.inputmask._valueGet();
                                nptValue !== input.getAttribute("placeholder") && "" !== nptValue && (getLastValidPosition() === -1 && nptValue === getBufferTemplate().join("") ? buffer = [] : clearOptionalTail(buffer), writeBuffer(input, buffer))
                            }
                        },
                        clickEvent: function(e, tabbed) {
                            function doRadixFocus(clickPos) {
                                if ("" !== opts.radixPoint) {
                                    var vps = getMaskSet().validPositions;
                                    if (void 0 === vps[clickPos] || vps[clickPos].input === getPlaceholder(clickPos)) {
                                        if (clickPos < seekNext(-1)) return !0;
                                        var radixPos = $.inArray(opts.radixPoint, getBuffer());
                                        if (radixPos !== -1) {
                                            for (var vp in vps)
                                                if (radixPos < vp && vps[vp].input !== getPlaceholder(vp)) return !1;
                                            return !0
                                        }
                                    }
                                }
                                return !1
                            }
                            var input = this;
                            setTimeout(function() {
                                if (document.activeElement === input) {
                                    var selectedCaret = caret(input);
                                    if (tabbed && (selectedCaret.begin = selectedCaret.end), selectedCaret.begin === selectedCaret.end) switch (opts.positionCaretOnClick) {
                                        case "none":
                                            break;
                                        case "radixFocus":
                                            if (doRadixFocus(selectedCaret.begin)) {
                                                var radixPos = $.inArray(opts.radixPoint, getBuffer().join(""));
                                                caret(input, opts.numericInput ? seekNext(radixPos) : radixPos);
                                                break
                                            }
                                        default:
                                            var clickPosition = selectedCaret.begin,
                                                lvclickPosition = getLastValidPosition(clickPosition, !0),
                                                lastPosition = seekNext(lvclickPosition);
                                            if (clickPosition < lastPosition) caret(input, isMask(clickPosition) || isMask(clickPosition - 1) ? clickPosition : seekNext(clickPosition));
                                            else {
                                                var placeholder = getPlaceholder(lastPosition);
                                                ("" !== placeholder && getBuffer()[lastPosition] !== placeholder && getTest(lastPosition).match.optionalQuantifier !== !0 || !isMask(lastPosition) && getTest(lastPosition).match.def === placeholder) && (lastPosition = seekNext(lastPosition)), caret(input, lastPosition)
                                            }
                                    }
                                }
                            }, 0)
                        },
                        dblclickEvent: function(e) {
                            var input = this;
                            setTimeout(function() {
                                caret(input, 0, seekNext(getLastValidPosition()))
                            }, 0)
                        },
                        cutEvent: function(e) {
                            var input = this,
                                $input = $(input),
                                pos = caret(input),
                                ev = e.originalEvent || e,
                                clipboardData = window.clipboardData || ev.clipboardData,
                                clipData = isRTL ? getBuffer().slice(pos.end, pos.begin) : getBuffer().slice(pos.begin, pos.end);
                            clipboardData.setData("text", isRTL ? clipData.reverse().join("") : clipData.join("")), document.execCommand && document.execCommand("copy"), handleRemove(input, Inputmask.keyCode.DELETE, pos), writeBuffer(input, getBuffer(), getMaskSet().p, e, undoValue !== getBuffer().join("")), input.inputmask._valueGet() === getBufferTemplate().join("") && $input.trigger("cleared")
                        },
                        blurEvent: function(e) {
                            var $input = $(this),
                                input = this;
                            if (input.inputmask) {
                                var nptValue = input.inputmask._valueGet(),
                                    buffer = getBuffer().slice();
                                undoValue !== buffer.join("") && setTimeout(function() {
                                    $input.trigger("change"), undoValue = buffer.join("")
                                }, 0), "" !== nptValue && (opts.clearMaskOnLostFocus && (getLastValidPosition() === -1 && nptValue === getBufferTemplate().join("") ? buffer = [] : clearOptionalTail(buffer)), isComplete(buffer) === !1 && (setTimeout(function() {
                                    $input.trigger("incomplete")
                                }, 0), opts.clearIncomplete && (resetMaskSet(), buffer = opts.clearMaskOnLostFocus ? [] : getBufferTemplate().slice())), writeBuffer(input, buffer, void 0, e))
                            }
                        },
                        mouseenterEvent: function(e) {
                            var input = this;
                            mouseEnter = !0, document.activeElement !== input && opts.showMaskOnHover && input.inputmask._valueGet() !== getBuffer().join("") && writeBuffer(input, getBuffer())
                        },
                        submitEvent: function(e) {
                            undoValue !== getBuffer().join("") && $el.trigger("change"), opts.clearMaskOnLostFocus && getLastValidPosition() === -1 && el.inputmask._valueGet && el.inputmask._valueGet() === getBufferTemplate().join("") && el.inputmask._valueSet(""), opts.removeMaskOnSubmit && (el.inputmask._valueSet(el.inputmask.unmaskedvalue(), !0), setTimeout(function() {
                                writeBuffer(el, getBuffer())
                            }, 0))
                        },
                        resetEvent: function(e) {
                            setTimeout(function() {
                                $el.trigger("setvalue")
                            }, 0)
                        }
                    };
                if (void 0 !== actionObj) switch (actionObj.action) {
                    case "isComplete":
                        return el = actionObj.el, isComplete(getBuffer());
                    case "unmaskedvalue":
                        return void 0 !== el && void 0 === actionObj.value || (valueBuffer = actionObj.value, valueBuffer = ($.isFunction(opts.onBeforeMask) ? opts.onBeforeMask(valueBuffer, opts) || valueBuffer : valueBuffer).split(""), checkVal(void 0, !1, !1, isRTL ? valueBuffer.reverse() : valueBuffer), $.isFunction(opts.onBeforeWrite) && opts.onBeforeWrite(void 0, getBuffer(), 0, opts)), unmaskedvalue(el);
                    case "mask":
                        mask(el);
                        break;
                    case "format":
                        return valueBuffer = ($.isFunction(opts.onBeforeMask) ? opts.onBeforeMask(actionObj.value, opts) || actionObj.value : actionObj.value).split(""), checkVal(void 0, !1, !1, isRTL ? valueBuffer.reverse() : valueBuffer), $.isFunction(opts.onBeforeWrite) && opts.onBeforeWrite(void 0, getBuffer(), 0, opts), actionObj.metadata ? {
                            value: isRTL ? getBuffer().slice().reverse().join("") : getBuffer().join(""),
                            metadata: maskScope.call(this, {
                                action: "getmetadata"
                            }, maskset, opts)
                        } : isRTL ? getBuffer().slice().reverse().join("") : getBuffer().join("");
                    case "isValid":
                        actionObj.value ? (valueBuffer = actionObj.value.split(""), checkVal(void 0, !1, !0, isRTL ? valueBuffer.reverse() : valueBuffer)) : actionObj.value = getBuffer().join("");
                        for (var buffer = getBuffer(), rl = determineLastRequiredPosition(), lmib = buffer.length - 1; lmib > rl && !isMask(lmib); lmib--);
                        return buffer.splice(rl, lmib + 1 - rl), isComplete(buffer) && actionObj.value === getBuffer().join("");
                    case "getemptymask":
                        return getBufferTemplate().join("");
                    case "remove":
                        if (el) {
                            $el = $(el), el.inputmask._valueSet(unmaskedvalue(el)), EventRuler.off(el);
                            var valueProperty;
                            Object.getOwnPropertyDescriptor && Object.getPrototypeOf ? (valueProperty = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value"), valueProperty && el.inputmask.__valueGet && Object.defineProperty(el, "value", {
                                get: el.inputmask.__valueGet,
                                set: el.inputmask.__valueSet,
                                configurable: !0
                            })) : document.__lookupGetter__ && el.__lookupGetter__("value") && el.inputmask.__valueGet && (el.__defineGetter__("value", el.inputmask.__valueGet), el.__defineSetter__("value", el.inputmask.__valueSet)), el.inputmask = void 0
                        }
                        return el;
                    case "getmetadata":
                        if ($.isArray(maskset.metadata)) {
                            var maskTarget = getMaskTemplate(!0, 0, !1).join("");
                            return $.each(maskset.metadata, function(ndx, mtdt) {
                                if (mtdt.mask === maskTarget) return maskTarget = mtdt, !1
                            }), maskTarget
                        }
                        return maskset.metadata
                }
            }
            var ua = navigator.userAgent,
                mobile = /mobile/i.test(ua),
                iemobile = /iemobile/i.test(ua),
                iphone = /iphone/i.test(ua) && !iemobile,
                android = /android/i.test(ua) && !iemobile;
            return Inputmask.prototype = {
                defaults: {
                    placeholder: "_",
                    optionalmarker: {
                        start: "[",
                        end: "]"
                    },
                    quantifiermarker: {
                        start: "{",
                        end: "}"
                    },
                    groupmarker: {
                        start: "(",
                        end: ")"
                    },
                    alternatormarker: "|",
                    escapeChar: "\\",
                    mask: null,
                    oncomplete: $.noop,
                    onincomplete: $.noop,
                    oncleared: $.noop,
                    repeat: 0,
                    greedy: !0,
                    autoUnmask: !1,
                    removeMaskOnSubmit: !1,
                    clearMaskOnLostFocus: !0,
                    insertMode: !0,
                    clearIncomplete: !1,
                    aliases: {},
                    alias: null,
                    onKeyDown: $.noop,
                    onBeforeMask: null,
                    onBeforePaste: function(pastedValue, opts) {
                        return $.isFunction(opts.onBeforeMask) ? opts.onBeforeMask(pastedValue, opts) : pastedValue
                    },
                    onBeforeWrite: null,
                    onUnMask: null,
                    showMaskOnFocus: !0,
                    showMaskOnHover: !0,
                    onKeyValidation: $.noop,
                    skipOptionalPartCharacter: " ",
                    numericInput: !1,
                    rightAlign: !1,
                    undoOnEscape: !0,
                    radixPoint: "",
                    radixPointDefinitionSymbol: void 0,
                    groupSeparator: "",
                    keepStatic: null,
                    positionCaretOnTab: !0,
                    tabThrough: !1,
                    supportsInputType: ["text", "tel", "password"],
                    definitions: {
                        9: {
                            validator: "[0-9]",
                            cardinality: 1,
                            definitionSymbol: "*"
                        },
                        a: {
                            validator: "[A-Za-zА-яЁёÀ-ÿµ]",
                            cardinality: 1,
                            definitionSymbol: "*"
                        },
                        "*": {
                            validator: "[0-9A-Za-zА-яЁёÀ-ÿµ]",
                            cardinality: 1
                        }
                    },
                    ignorables: [8, 9, 13, 19, 27, 33, 34, 35, 36, 37, 38, 39, 40, 45, 46, 93, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123],
                    isComplete: null,
                    canClearPosition: $.noop,
                    postValidation: null,
                    staticDefinitionSymbol: void 0,
                    jitMasking: !1,
                    nullable: !0,
                    inputEventOnly: !1,
                    noValuePatching: !1,
                    positionCaretOnClick: "lvp",
                    casing: null,
                    inputmode: "verbatim",
                    colorMask: !1,
                    androidHack: !1
                },
                masksCache: {},
                mask: function(elems) {
                    function importAttributeOptions(npt, opts, userOptions, dataAttribute) {
                        function importOption(option, optionData) {
                            optionData = void 0 !== optionData ? optionData : npt.getAttribute(dataAttribute + "-" + option), null !== optionData && ("string" == typeof optionData && (0 === option.indexOf("on") ? optionData = window[optionData] : "false" === optionData ? optionData = !1 : "true" === optionData && (optionData = !0)), userOptions[option] = optionData)
                        }
                        var option, dataoptions, optionData, p, attrOptions = npt.getAttribute(dataAttribute);
                        if (attrOptions && "" !== attrOptions && (attrOptions = attrOptions.replace(new RegExp("'", "g"), '"'), dataoptions = JSON.parse("{" + attrOptions + "}")), dataoptions) {
                            optionData = void 0;
                            for (p in dataoptions)
                                if ("alias" === p.toLowerCase()) {
                                    optionData = dataoptions[p];
                                    break
                                }
                        }
                        importOption("alias", optionData), userOptions.alias && resolveAlias(userOptions.alias, userOptions, opts);
                        for (option in opts) {
                            if (dataoptions) {
                                optionData = void 0;
                                for (p in dataoptions)
                                    if (p.toLowerCase() === option.toLowerCase()) {
                                        optionData = dataoptions[p];
                                        break
                                    }
                            }
                            importOption(option, optionData)
                        }
                        return $.extend(!0, opts, userOptions), opts
                    }
                    var that = this;
                    return "string" == typeof elems && (elems = document.getElementById(elems) || document.querySelectorAll(elems)), elems = elems.nodeName ? [elems] : elems, $.each(elems, function(ndx, el) {
                        var scopedOpts = $.extend(!0, {}, that.opts);
                        importAttributeOptions(el, scopedOpts, $.extend(!0, {}, that.userOptions), that.dataAttribute);
                        var maskset = generateMaskSet(scopedOpts, that.noMasksCache);
                        void 0 !== maskset && (void 0 !== el.inputmask && el.inputmask.remove(), el.inputmask = new Inputmask, el.inputmask.opts = scopedOpts, el.inputmask.noMasksCache = that.noMasksCache, el.inputmask.userOptions = $.extend(!0, {}, that.userOptions), el.inputmask.el = el, el.inputmask.maskset = maskset, $.data(el, "_inputmask_opts", scopedOpts), maskScope.call(el.inputmask, {
                            action: "mask"
                        }))
                    }), elems && elems[0] ? elems[0].inputmask || this : this
                },
                option: function(options, noremask) {
                    return "string" == typeof options ? this.opts[options] : "object" == typeof options ? ($.extend(this.userOptions, options), this.el && noremask !== !0 && this.mask(this.el), this) : void 0
                },
                unmaskedvalue: function(value) {
                    return this.maskset = this.maskset || generateMaskSet(this.opts, this.noMasksCache), maskScope.call(this, {
                        action: "unmaskedvalue",
                        value: value
                    })
                },
                remove: function() {
                    return maskScope.call(this, {
                        action: "remove"
                    })
                },
                getemptymask: function() {
                    return this.maskset = this.maskset || generateMaskSet(this.opts, this.noMasksCache), maskScope.call(this, {
                        action: "getemptymask"
                    })
                },
                hasMaskedValue: function() {
                    return !this.opts.autoUnmask
                },
                isComplete: function() {
                    return this.maskset = this.maskset || generateMaskSet(this.opts, this.noMasksCache), maskScope.call(this, {
                        action: "isComplete"
                    })
                },
                getmetadata: function() {
                    return this.maskset = this.maskset || generateMaskSet(this.opts, this.noMasksCache), maskScope.call(this, {
                        action: "getmetadata"
                    })
                },
                isValid: function(value) {
                    return this.maskset = this.maskset || generateMaskSet(this.opts, this.noMasksCache), maskScope.call(this, {
                        action: "isValid",
                        value: value
                    })
                },
                format: function(value, metadata) {
                    return this.maskset = this.maskset || generateMaskSet(this.opts, this.noMasksCache), maskScope.call(this, {
                        action: "format",
                        value: value,
                        metadata: metadata
                    })
                },
                analyseMask: function(mask, opts) {
                    function MaskToken(isGroup, isOptional, isQuantifier, isAlternator) {
                        this.matches = [], this.openGroup = isGroup || !1, this.isGroup = isGroup || !1, this.isOptional = isOptional || !1, this.isQuantifier = isQuantifier || !1, this.isAlternator = isAlternator || !1, this.quantifier = {
                            min: 1,
                            max: 1
                        }
                    }

                    function insertTestDefinition(mtoken, element, position) {
                        var maskdef = opts.definitions[element];
                        position = void 0 !== position ? position : mtoken.matches.length;
                        var prevMatch = mtoken.matches[position - 1];
                        if (maskdef && !escaped) {
                            maskdef.placeholder = $.isFunction(maskdef.placeholder) ? maskdef.placeholder(opts) : maskdef.placeholder;
                            for (var prevalidators = maskdef.prevalidator, prevalidatorsL = prevalidators ? prevalidators.length : 0, i = 1; i < maskdef.cardinality; i++) {
                                var prevalidator = prevalidatorsL >= i ? prevalidators[i - 1] : [],
                                    validator = prevalidator.validator,
                                    cardinality = prevalidator.cardinality;
                                mtoken.matches.splice(position++, 0, {
                                    fn: validator ? "string" == typeof validator ? new RegExp(validator) : new function() {
                                        this.test = validator
                                    } : new RegExp("."),
                                    cardinality: cardinality ? cardinality : 1,
                                    optionality: mtoken.isOptional,
                                    newBlockMarker: void 0 === prevMatch || prevMatch.def !== (maskdef.definitionSymbol || element),
                                    casing: maskdef.casing,
                                    def: maskdef.definitionSymbol || element,
                                    placeholder: maskdef.placeholder,
                                    nativeDef: element
                                }), prevMatch = mtoken.matches[position - 1]
                            }
                            mtoken.matches.splice(position++, 0, {
                                fn: maskdef.validator ? "string" == typeof maskdef.validator ? new RegExp(maskdef.validator) : new function() {
                                    this.test = maskdef.validator
                                } : new RegExp("."),
                                cardinality: maskdef.cardinality,
                                optionality: mtoken.isOptional,
                                newBlockMarker: void 0 === prevMatch || prevMatch.def !== (maskdef.definitionSymbol || element),
                                casing: maskdef.casing,
                                def: maskdef.definitionSymbol || element,
                                placeholder: maskdef.placeholder,
                                nativeDef: element
                            })
                        } else mtoken.matches.splice(position++, 0, {
                            fn: null,
                            cardinality: 0,
                            optionality: mtoken.isOptional,
                            newBlockMarker: void 0 === prevMatch || prevMatch.def !== element,
                            casing: null,
                            def: opts.staticDefinitionSymbol || element,
                            placeholder: void 0 !== opts.staticDefinitionSymbol ? element : void 0,
                            nativeDef: element
                        }), escaped = !1
                    }

                    function verifyGroupMarker(maskToken) {
                        maskToken && maskToken.matches && $.each(maskToken.matches, function(ndx, token) {
                            var nextToken = maskToken.matches[ndx + 1];
                            (void 0 === nextToken || void 0 === nextToken.matches || nextToken.isQuantifier === !1) && token && token.isGroup && (token.isGroup = !1, insertTestDefinition(token, opts.groupmarker.start, 0), token.openGroup !== !0 && insertTestDefinition(token, opts.groupmarker.end)), verifyGroupMarker(token)
                        })
                    }

                    function defaultCase() {
                        if (openenings.length > 0) {
                            if (currentOpeningToken = openenings[openenings.length - 1], insertTestDefinition(currentOpeningToken, m), currentOpeningToken.isAlternator) {
                                alternator = openenings.pop();
                                for (var mndx = 0; mndx < alternator.matches.length; mndx++) alternator.matches[mndx].isGroup = !1;
                                openenings.length > 0 ? (currentOpeningToken = openenings[openenings.length - 1], currentOpeningToken.matches.push(alternator)) : currentToken.matches.push(alternator)
                            }
                        } else insertTestDefinition(currentToken, m)
                    }

                    function reverseTokens(maskToken) {
                        function reverseStatic(st) {
                            return st === opts.optionalmarker.start ? st = opts.optionalmarker.end : st === opts.optionalmarker.end ? st = opts.optionalmarker.start : st === opts.groupmarker.start ? st = opts.groupmarker.end : st === opts.groupmarker.end && (st = opts.groupmarker.start), st
                        }
                        maskToken.matches = maskToken.matches.reverse();
                        for (var match in maskToken.matches) {
                            var intMatch = parseInt(match);
                            if (maskToken.matches[match].isQuantifier && maskToken.matches[intMatch + 1] && maskToken.matches[intMatch + 1].isGroup) {
                                var qt = maskToken.matches[match];
                                maskToken.matches.splice(match, 1), maskToken.matches.splice(intMatch + 1, 0, qt)
                            }
                            void 0 !== maskToken.matches[match].matches ? maskToken.matches[match] = reverseTokens(maskToken.matches[match]) : maskToken.matches[match] = reverseStatic(maskToken.matches[match])
                        }
                        return maskToken
                    }
                    for (var match, m, openingToken, currentOpeningToken, alternator, lastMatch, groupToken, tokenizer = /(?:[?*+]|\{[0-9\+\*]+(?:,[0-9\+\*]*)?\})|[^.?*+^${[]()|\\]+|./g, escaped = !1, currentToken = new MaskToken, openenings = [], maskTokens = []; match = tokenizer.exec(mask);)
                        if (m = match[0], escaped) defaultCase();
                        else switch (m.charAt(0)) {
                            case opts.escapeChar:
                                escaped = !0;
                                break;
                            case opts.optionalmarker.end:
                            case opts.groupmarker.end:
                                if (openingToken = openenings.pop(), openingToken.openGroup = !1, void 0 !== openingToken)
                                    if (openenings.length > 0) {
                                        if (currentOpeningToken = openenings[openenings.length - 1], currentOpeningToken.matches.push(openingToken), currentOpeningToken.isAlternator) {
                                            alternator = openenings.pop();
                                            for (var mndx = 0; mndx < alternator.matches.length; mndx++) alternator.matches[mndx].isGroup = !1;
                                            openenings.length > 0 ? (currentOpeningToken = openenings[openenings.length - 1], currentOpeningToken.matches.push(alternator)) : currentToken.matches.push(alternator)
                                        }
                                    } else currentToken.matches.push(openingToken);
                                else defaultCase();
                                break;
                            case opts.optionalmarker.start:
                                openenings.push(new MaskToken(!1, !0));
                                break;
                            case opts.groupmarker.start:
                                openenings.push(new MaskToken(!0));
                                break;
                            case opts.quantifiermarker.start:
                                var quantifier = new MaskToken(!1, !1, !0);
                                m = m.replace(/[{}]/g, "");
                                var mq = m.split(","),
                                    mq0 = isNaN(mq[0]) ? mq[0] : parseInt(mq[0]),
                                    mq1 = 1 === mq.length ? mq0 : isNaN(mq[1]) ? mq[1] : parseInt(mq[1]);
                                if ("*" !== mq1 && "+" !== mq1 || (mq0 = "*" === mq1 ? 0 : 1), quantifier.quantifier = {
                                        min: mq0,
                                        max: mq1
                                    }, openenings.length > 0) {
                                    var matches = openenings[openenings.length - 1].matches;
                                    match = matches.pop(), match.isGroup || (groupToken = new MaskToken(!0), groupToken.matches.push(match), match = groupToken), matches.push(match), matches.push(quantifier)
                                } else match = currentToken.matches.pop(), match.isGroup || (groupToken = new MaskToken(!0), groupToken.matches.push(match), match = groupToken), currentToken.matches.push(match), currentToken.matches.push(quantifier);
                                break;
                            case opts.alternatormarker:
                                openenings.length > 0 ? (currentOpeningToken = openenings[openenings.length - 1], lastMatch = currentOpeningToken.matches.pop()) : lastMatch = currentToken.matches.pop(), lastMatch.isAlternator ? openenings.push(lastMatch) : (alternator = new MaskToken(!1, !1, !1, !0), alternator.matches.push(lastMatch), openenings.push(alternator));
                                break;
                            default:
                                defaultCase()
                        }
                    for (; openenings.length > 0;) openingToken = openenings.pop(), currentToken.matches.push(openingToken);
                    return currentToken.matches.length > 0 && (verifyGroupMarker(currentToken), maskTokens.push(currentToken)), opts.numericInput && reverseTokens(maskTokens[0]), maskTokens
                }
            }, Inputmask.extendDefaults = function(options) {
                $.extend(!0, Inputmask.prototype.defaults, options)
            }, Inputmask.extendDefinitions = function(definition) {
                $.extend(!0, Inputmask.prototype.defaults.definitions, definition)
            }, Inputmask.extendAliases = function(alias) {
                $.extend(!0, Inputmask.prototype.defaults.aliases, alias)
            }, Inputmask.format = function(value, options, metadata) {
                return Inputmask(options).format(value, metadata)
            }, Inputmask.unmask = function(value, options) {
                return Inputmask(options).unmaskedvalue(value)
            }, Inputmask.isValid = function(value, options) {
                return Inputmask(options).isValid(value)
            }, Inputmask.remove = function(elems) {
                $.each(elems, function(ndx, el) {
                    el.inputmask && el.inputmask.remove()
                })
            }, Inputmask.escapeRegex = function(str) {
                var specials = ["/", ".", "*", "+", "?", "|", "(", ")", "[", "]", "{", "}", "\\", "$", "^"];
                return str.replace(new RegExp("(\\" + specials.join("|\\") + ")", "gim"), "\\$1")
            }, Inputmask.keyCode = {
                ALT: 18,
                BACKSPACE: 8,
                BACKSPACE_SAFARI: 127,
                CAPS_LOCK: 20,
                COMMA: 188,
                COMMAND: 91,
                COMMAND_LEFT: 91,
                COMMAND_RIGHT: 93,
                CONTROL: 17,
                DELETE: 46,
                DOWN: 40,
                END: 35,
                ENTER: 13,
                ESCAPE: 27,
                HOME: 36,
                INSERT: 45,
                LEFT: 37,
                MENU: 93,
                NUMPAD_ADD: 107,
                NUMPAD_DECIMAL: 110,
                NUMPAD_DIVIDE: 111,
                NUMPAD_ENTER: 108,
                NUMPAD_MULTIPLY: 106,
                NUMPAD_SUBTRACT: 109,
                PAGE_DOWN: 34,
                PAGE_UP: 33,
                PERIOD: 190,
                RIGHT: 39,
                SHIFT: 16,
                SPACE: 32,
                TAB: 9,
                UP: 38,
                WINDOWS: 91,
                X: 88
            }, window.Inputmask = Inputmask, Inputmask
        })
    }, {
        "./inputmask.dependencyLib": 5
    }],
    8: [function(require, module, exports) {
        ! function(factory) {
            "function" == typeof define && define.amd ? define(["inputmask.dependencyLib", "inputmask"], factory) : "object" == typeof exports ? module.exports = factory(require("./inputmask.dependencyLib"), require("./inputmask")) : factory(window.dependencyLib || jQuery, window.Inputmask)
        }(function($, Inputmask) {
            return Inputmask.extendAliases({
                numeric: {
                    mask: function(opts) {
                        function autoEscape(txt) {
                            for (var escapedTxt = "", i = 0; i < txt.length; i++) escapedTxt += opts.definitions[txt.charAt(i)] || opts.optionalmarker.start === txt.charAt(i) || opts.optionalmarker.end === txt.charAt(i) || opts.quantifiermarker.start === txt.charAt(i) || opts.quantifiermarker.end === txt.charAt(i) || opts.groupmarker.start === txt.charAt(i) || opts.groupmarker.end === txt.charAt(i) || opts.alternatormarker === txt.charAt(i) ? "\\" + txt.charAt(i) : txt.charAt(i);
                            return escapedTxt
                        }
                        if (0 !== opts.repeat && isNaN(opts.integerDigits) && (opts.integerDigits = opts.repeat), opts.repeat = 0, opts.groupSeparator === opts.radixPoint && ("." === opts.radixPoint ? opts.groupSeparator = "," : "," === opts.radixPoint ? opts.groupSeparator = "." : opts.groupSeparator = ""), " " === opts.groupSeparator && (opts.skipOptionalPartCharacter = void 0), opts.autoGroup = opts.autoGroup && "" !== opts.groupSeparator, opts.autoGroup && ("string" == typeof opts.groupSize && isFinite(opts.groupSize) && (opts.groupSize = parseInt(opts.groupSize)), isFinite(opts.integerDigits))) {
                            var seps = Math.floor(opts.integerDigits / opts.groupSize),
                                mod = opts.integerDigits % opts.groupSize;
                            opts.integerDigits = parseInt(opts.integerDigits) + (0 === mod ? seps - 1 : seps), opts.integerDigits < 1 && (opts.integerDigits = "*")
                        }
                        opts.placeholder.length > 1 && (opts.placeholder = opts.placeholder.charAt(0)), "radixFocus" === opts.positionCaretOnClick && "" === opts.placeholder && opts.integerOptional === !1 && (opts.positionCaretOnClick = "lvp"), opts.definitions[";"] = opts.definitions["~"], opts.definitions[";"].definitionSymbol = "~", opts.numericInput === !0 && (opts.positionCaretOnClick = "radixFocus" === opts.positionCaretOnClick ? "lvp" : opts.positionCaretOnClick, opts.digitsOptional = !1, isNaN(opts.digits) && (opts.digits = 2), opts.decimalProtect = !1);
                        var mask = "[+]";
                        if (mask += autoEscape(opts.prefix), mask += opts.integerOptional === !0 ? "~{1," + opts.integerDigits + "}" : "~{" + opts.integerDigits + "}", void 0 !== opts.digits) {
                            opts.decimalProtect && (opts.radixPointDefinitionSymbol = ":");
                            var dq = opts.digits.toString().split(",");
                            isFinite(dq[0] && dq[1] && isFinite(dq[1])) ? mask += (opts.decimalProtect ? ":" : opts.radixPoint) + ";{" + opts.digits + "}" : (isNaN(opts.digits) || parseInt(opts.digits) > 0) && (mask += opts.digitsOptional ? "[" + (opts.decimalProtect ? ":" : opts.radixPoint) + ";{1," + opts.digits + "}]" : (opts.decimalProtect ? ":" : opts.radixPoint) + ";{" + opts.digits + "}")
                        }
                        return mask += autoEscape(opts.suffix), mask += "[-]", opts.greedy = !1, null !== opts.min && (opts.min = opts.min.toString().replace(new RegExp(Inputmask.escapeRegex(opts.groupSeparator), "g"), ""), "," === opts.radixPoint && (opts.min = opts.min.replace(opts.radixPoint, "."))), null !== opts.max && (opts.max = opts.max.toString().replace(new RegExp(Inputmask.escapeRegex(opts.groupSeparator), "g"), ""), "," === opts.radixPoint && (opts.max = opts.max.replace(opts.radixPoint, "."))), mask
                    },
                    placeholder: "",
                    greedy: !1,
                    digits: "*",
                    digitsOptional: !0,
                    radixPoint: ".",
                    positionCaretOnClick: "radixFocus",
                    groupSize: 3,
                    groupSeparator: "",
                    autoGroup: !1,
                    allowPlus: !0,
                    allowMinus: !0,
                    negationSymbol: {
                        front: "-",
                        back: ""
                    },
                    integerDigits: "+",
                    integerOptional: !0,
                    prefix: "",
                    suffix: "",
                    rightAlign: !0,
                    decimalProtect: !0,
                    min: null,
                    max: null,
                    step: 1,
                    insertMode: !0,
                    autoUnmask: !1,
                    unmaskAsNumber: !1,
                    inputmode: "numeric",
                    postFormat: function(buffer, pos, opts) {
                        opts.numericInput === !0 && (buffer = buffer.reverse(), isFinite(pos) && (pos = buffer.join("").length - pos - 1));
                        var i, l;
                        pos = pos >= buffer.length ? buffer.length - 1 : pos < 0 ? 0 : pos;
                        var charAtPos = buffer[pos],
                            cbuf = buffer.slice();
                        charAtPos === opts.groupSeparator && (cbuf.splice(pos--, 1), charAtPos = cbuf[pos]);
                        var isNegative = cbuf.join("").match(new RegExp("^" + Inputmask.escapeRegex(opts.negationSymbol.front)));
                        isNegative = null !== isNegative && 1 === isNegative.length, pos > (isNegative ? opts.negationSymbol.front.length : 0) + opts.prefix.length && pos < cbuf.length - opts.suffix.length && (cbuf[pos] = "!");
                        var bufVal = cbuf.join(""),
                            bufValOrigin = cbuf.join();
                        if (isNegative && (bufVal = bufVal.replace(new RegExp("^" + Inputmask.escapeRegex(opts.negationSymbol.front)), ""), bufVal = bufVal.replace(new RegExp(Inputmask.escapeRegex(opts.negationSymbol.back) + "$"), "")), bufVal = bufVal.replace(new RegExp(Inputmask.escapeRegex(opts.suffix) + "$"), ""), bufVal = bufVal.replace(new RegExp("^" + Inputmask.escapeRegex(opts.prefix)), ""), bufVal.length > 0 && opts.autoGroup || bufVal.indexOf(opts.groupSeparator) !== -1) {
                            var escapedGroupSeparator = Inputmask.escapeRegex(opts.groupSeparator);
                            bufVal = bufVal.replace(new RegExp(escapedGroupSeparator, "g"), "");
                            var radixSplit = bufVal.split(charAtPos === opts.radixPoint ? "!" : opts.radixPoint);
                            if (bufVal = "" === opts.radixPoint ? bufVal : radixSplit[0], charAtPos !== opts.negationSymbol.front && (bufVal = bufVal.replace("!", "?")), bufVal.length > opts.groupSize)
                                for (var reg = new RegExp("([-+]?[\\d?]+)([\\d?]{" + opts.groupSize + "})"); reg.test(bufVal) && "" !== opts.groupSeparator;) bufVal = bufVal.replace(reg, "$1" + opts.groupSeparator + "$2"), bufVal = bufVal.replace(opts.groupSeparator + opts.groupSeparator, opts.groupSeparator);
                            bufVal = bufVal.replace("?", "!"), "" !== opts.radixPoint && radixSplit.length > 1 && (bufVal += (charAtPos === opts.radixPoint ? "!" : opts.radixPoint) + radixSplit[1])
                        }
                        bufVal = opts.prefix + bufVal + opts.suffix, isNegative && (bufVal = opts.negationSymbol.front + bufVal + opts.negationSymbol.back);
                        var needsRefresh = bufValOrigin !== bufVal.split("").join(),
                            newPos = $.inArray("!", bufVal);
                        if (newPos === -1 && (newPos = pos), needsRefresh) {
                            for (buffer.length = bufVal.length, i = 0, l = bufVal.length; i < l; i++) buffer[i] = bufVal.charAt(i);
                            buffer[newPos] = charAtPos
                        }
                        return newPos = opts.numericInput && isFinite(pos) ? buffer.join("").length - newPos - 1 : newPos, opts.numericInput && (buffer = buffer.reverse(), $.inArray(opts.radixPoint, buffer) < newPos && buffer.join("").length - opts.suffix.length !== newPos && (newPos -= 1)), {
                            pos: newPos,
                            refreshFromBuffer: needsRefresh,
                            buffer: buffer,
                            isNegative: isNegative
                        }
                    },
                    onBeforeWrite: function(e, buffer, caretPos, opts) {
                        var rslt;
                        if (e && ("blur" === e.type || "checkval" === e.type || "keydown" === e.type)) {
                            var maskedValue = opts.numericInput ? buffer.slice().reverse().join("") : buffer.join(""),
                                processValue = maskedValue.replace(opts.prefix, "");
                            processValue = processValue.replace(opts.suffix, ""), processValue = processValue.replace(new RegExp(Inputmask.escapeRegex(opts.groupSeparator), "g"), ""), "," === opts.radixPoint && (processValue = processValue.replace(opts.radixPoint, "."));
                            var isNegative = processValue.match(new RegExp("[-" + Inputmask.escapeRegex(opts.negationSymbol.front) + "]", "g"));
                            if (isNegative = null !== isNegative && 1 === isNegative.length, processValue = processValue.replace(new RegExp("[-" + Inputmask.escapeRegex(opts.negationSymbol.front) + "]", "g"), ""), processValue = processValue.replace(new RegExp(Inputmask.escapeRegex(opts.negationSymbol.back) + "$"), ""), isNaN(opts.placeholder) && (processValue = processValue.replace(new RegExp(Inputmask.escapeRegex(opts.placeholder), "g"), "")), processValue = processValue === opts.negationSymbol.front ? processValue + "0" : processValue, "" !== processValue && isFinite(processValue)) {
                                var floatValue = parseFloat(processValue),
                                    signedFloatValue = isNegative ? floatValue * -1 : floatValue;
                                if (null !== opts.min && isFinite(opts.min) && signedFloatValue < parseFloat(opts.min) ? (floatValue = Math.abs(opts.min), isNegative = opts.min < 0, maskedValue = void 0) : null !== opts.max && isFinite(opts.max) && signedFloatValue > parseFloat(opts.max) && (floatValue = Math.abs(opts.max), isNegative = opts.max < 0, maskedValue = void 0), processValue = floatValue.toString().replace(".", opts.radixPoint).split(""), isFinite(opts.digits)) {
                                    var radixPosition = $.inArray(opts.radixPoint, processValue),
                                        rpb = $.inArray(opts.radixPoint, maskedValue);
                                    radixPosition === -1 && (processValue.push(opts.radixPoint), radixPosition = processValue.length - 1);
                                    for (var i = 1; i <= opts.digits; i++) opts.digitsOptional || void 0 !== processValue[radixPosition + i] && processValue[radixPosition + i] !== opts.placeholder.charAt(0) ? rpb !== -1 && void 0 !== maskedValue[rpb + i] && (processValue[radixPosition + i] = processValue[radixPosition + i] || maskedValue[rpb + i]) : processValue[radixPosition + i] = "0";
                                    processValue[processValue.length - 1] === opts.radixPoint && delete processValue[processValue.length - 1]
                                }
                                if (floatValue.toString() !== processValue && floatValue.toString() + "." !== processValue || isNegative) return processValue = (opts.prefix + processValue.join("")).split(""), !isNegative || 0 === floatValue && "blur" === e.type || (processValue.unshift(opts.negationSymbol.front), processValue.push(opts.negationSymbol.back)), opts.numericInput && (processValue = processValue.reverse()), rslt = opts.postFormat(processValue, opts.numericInput ? caretPos : caretPos - 1, opts), rslt.buffer && (rslt.refreshFromBuffer = rslt.buffer.join("") !== buffer.join("")), rslt
                            }
                        }
                        if (opts.autoGroup) return rslt = opts.postFormat(buffer, opts.numericInput ? caretPos : caretPos - 1, opts), rslt.caret = caretPos < (rslt.isNegative ? opts.negationSymbol.front.length : 0) + opts.prefix.length || caretPos > rslt.buffer.length - (rslt.isNegative ? opts.negationSymbol.back.length : 0) ? rslt.pos : rslt.pos + 1, rslt
                    },
                    regex: {
                        integerPart: function(opts) {
                            return new RegExp("[" + Inputmask.escapeRegex(opts.negationSymbol.front) + "+]?\\d+")
                        },
                        integerNPart: function(opts) {
                            return new RegExp("[\\d" + Inputmask.escapeRegex(opts.groupSeparator) + Inputmask.escapeRegex(opts.placeholder.charAt(0)) + "]+")
                        }
                    },
                    signHandler: function(chrs, maskset, pos, strict, opts) {
                        if (!strict && opts.allowMinus && "-" === chrs || opts.allowPlus && "+" === chrs) {
                            var matchRslt = maskset.buffer.join("").match(opts.regex.integerPart(opts));
                            if (matchRslt && matchRslt[0].length > 0) return maskset.buffer[matchRslt.index] === ("-" === chrs ? "+" : opts.negationSymbol.front) ? "-" === chrs ? "" !== opts.negationSymbol.back ? {
                                pos: 0,
                                c: opts.negationSymbol.front,
                                remove: 0,
                                caret: pos,
                                insert: {
                                    pos: maskset.buffer.length - 1,
                                    c: opts.negationSymbol.back
                                }
                            } : {
                                pos: 0,
                                c: opts.negationSymbol.front,
                                remove: 0,
                                caret: pos
                            } : "" !== opts.negationSymbol.back ? {
                                pos: 0,
                                c: "+",
                                remove: [0, maskset.buffer.length - 1],
                                caret: pos
                            } : {
                                pos: 0,
                                c: "+",
                                remove: 0,
                                caret: pos
                            } : maskset.buffer[0] === ("-" === chrs ? opts.negationSymbol.front : "+") ? "-" === chrs && "" !== opts.negationSymbol.back ? {
                                remove: [0, maskset.buffer.length - 1],
                                caret: pos - 1
                            } : {
                                remove: 0,
                                caret: pos - 1
                            } : "-" === chrs ? "" !== opts.negationSymbol.back ? {
                                pos: 0,
                                c: opts.negationSymbol.front,
                                caret: pos + 1,
                                insert: {
                                    pos: maskset.buffer.length,
                                    c: opts.negationSymbol.back
                                }
                            } : {
                                pos: 0,
                                c: opts.negationSymbol.front,
                                caret: pos + 1
                            } : {
                                pos: 0,
                                c: chrs,
                                caret: pos + 1
                            }
                        }
                        return !1
                    },
                    radixHandler: function(chrs, maskset, pos, strict, opts) {
                        if (!strict && opts.numericInput !== !0 && chrs === opts.radixPoint && void 0 !== opts.digits && (isNaN(opts.digits) || parseInt(opts.digits) > 0)) {
                            var radixPos = $.inArray(opts.radixPoint, maskset.buffer),
                                integerValue = maskset.buffer.join("").match(opts.regex.integerPart(opts));
                            if (radixPos !== -1 && maskset.validPositions[radixPos]) return maskset.validPositions[radixPos - 1] ? {
                                caret: radixPos + 1
                            } : {
                                pos: integerValue.index,
                                c: integerValue[0],
                                caret: radixPos + 1
                            };
                            if (!integerValue || "0" === integerValue[0] && integerValue.index + 1 !== pos) return maskset.buffer[integerValue ? integerValue.index : pos] = "0", {
                                pos: (integerValue ? integerValue.index : pos) + 1,
                                c: opts.radixPoint
                            }
                        }
                        return !1
                    },
                    leadingZeroHandler: function(chrs, maskset, pos, strict, opts, isSelection) {
                        if (!strict) {
                            var buffer = maskset.buffer.slice("");
                            if (buffer.splice(0, opts.prefix.length), buffer.splice(buffer.length - opts.suffix.length, opts.suffix.length), opts.numericInput === !0) {
                                var buffer = buffer.reverse(),
                                    bufferChar = buffer[0];
                                if ("0" === bufferChar && void 0 === maskset.validPositions[pos - 1]) return {
                                    pos: pos,
                                    remove: buffer.length - 1
                                }
                            } else {
                                pos -= opts.prefix.length;
                                var radixPosition = $.inArray(opts.radixPoint, buffer),
                                    matchRslt = buffer.slice(0, radixPosition !== -1 ? radixPosition : void 0).join("").match(opts.regex.integerNPart(opts));
                                if (matchRslt && (radixPosition === -1 || pos <= radixPosition)) {
                                    var decimalPart = radixPosition === -1 ? 0 : parseInt(buffer.slice(radixPosition + 1).join(""));
                                    if (0 === matchRslt[0].indexOf("" !== opts.placeholder ? opts.placeholder.charAt(0) : "0") && (matchRslt.index + 1 === pos || isSelection !== !0 && 0 === decimalPart)) return maskset.buffer.splice(matchRslt.index + opts.prefix.length, 1), {
                                        pos: matchRslt.index + opts.prefix.length,
                                        remove: matchRslt.index + opts.prefix.length
                                    };
                                    if ("0" === chrs && pos <= matchRslt.index && matchRslt[0] !== opts.groupSeparator) return !1
                                }
                            }
                        }
                        return !0
                    },
                    definitions: {
                        "~": {
                            validator: function(chrs, maskset, pos, strict, opts, isSelection) {
                                var isValid = opts.signHandler(chrs, maskset, pos, strict, opts);
                                if (!isValid && (isValid = opts.radixHandler(chrs, maskset, pos, strict, opts), !isValid && (isValid = strict ? new RegExp("[0-9" + Inputmask.escapeRegex(opts.groupSeparator) + "]").test(chrs) : new RegExp("[0-9]").test(chrs), isValid === !0 && (isValid = opts.leadingZeroHandler(chrs, maskset, pos, strict, opts, isSelection), isValid === !0)))) {
                                    var radixPosition = $.inArray(opts.radixPoint, maskset.buffer);
                                    isValid = radixPosition !== -1 && (opts.digitsOptional === !1 || maskset.validPositions[pos]) && opts.numericInput !== !0 && pos > radixPosition && !strict ? {
                                        pos: pos,
                                        remove: pos
                                    } : {
                                        pos: pos
                                    }
                                }
                                return isValid
                            },
                            cardinality: 1
                        },
                        "+": {
                            validator: function(chrs, maskset, pos, strict, opts) {
                                var isValid = opts.signHandler(chrs, maskset, pos, strict, opts);
                                return !isValid && (strict && opts.allowMinus && chrs === opts.negationSymbol.front || opts.allowMinus && "-" === chrs || opts.allowPlus && "+" === chrs) && (isValid = !(!strict && "-" === chrs) || ("" !== opts.negationSymbol.back ? {
                                    pos: pos,
                                    c: "-" === chrs ? opts.negationSymbol.front : "+",
                                    caret: pos + 1,
                                    insert: {
                                        pos: maskset.buffer.length,
                                        c: opts.negationSymbol.back
                                    }
                                } : {
                                    pos: pos,
                                    c: "-" === chrs ? opts.negationSymbol.front : "+",
                                    caret: pos + 1
                                })), isValid
                            },
                            cardinality: 1,
                            placeholder: ""
                        },
                        "-": {
                            validator: function(chrs, maskset, pos, strict, opts) {
                                var isValid = opts.signHandler(chrs, maskset, pos, strict, opts);
                                return !isValid && strict && opts.allowMinus && chrs === opts.negationSymbol.back && (isValid = !0), isValid
                            },
                            cardinality: 1,
                            placeholder: ""
                        },
                        ":": {
                            validator: function(chrs, maskset, pos, strict, opts) {
                                var isValid = opts.signHandler(chrs, maskset, pos, strict, opts);
                                if (!isValid) {
                                    var radix = "[" + Inputmask.escapeRegex(opts.radixPoint) + "]";
                                    isValid = new RegExp(radix).test(chrs), isValid && maskset.validPositions[pos] && maskset.validPositions[pos].match.placeholder === opts.radixPoint && (isValid = {
                                        caret: pos + 1
                                    })
                                }
                                return isValid
                            },
                            cardinality: 1,
                            placeholder: function(opts) {
                                return opts.radixPoint
                            }
                        }
                    },
                    onUnMask: function(maskedValue, unmaskedValue, opts) {
                        if ("" === unmaskedValue && opts.nullable === !0) return unmaskedValue;
                        var processValue = maskedValue.replace(opts.prefix, "");
                        return processValue = processValue.replace(opts.suffix, ""), processValue = processValue.replace(new RegExp(Inputmask.escapeRegex(opts.groupSeparator), "g"), ""), opts.unmaskAsNumber ? ("" !== opts.radixPoint && processValue.indexOf(opts.radixPoint) !== -1 && (processValue = processValue.replace(Inputmask.escapeRegex.call(this, opts.radixPoint), ".")), Number(processValue)) : processValue
                    },
                    isComplete: function(buffer, opts) {
                        var maskedValue = buffer.join(""),
                            bufClone = buffer.slice();
                        if (opts.postFormat(bufClone, 0, opts), bufClone.join("") !== maskedValue) return !1;
                        var processValue = maskedValue.replace(opts.prefix, "");
                        return processValue = processValue.replace(opts.suffix, ""), processValue = processValue.replace(new RegExp(Inputmask.escapeRegex(opts.groupSeparator), "g"), ""), "," === opts.radixPoint && (processValue = processValue.replace(Inputmask.escapeRegex(opts.radixPoint), ".")), isFinite(processValue)
                    },
                    onBeforeMask: function(initialValue, opts) {
                        if (opts.numericInput === !0 && (initialValue = initialValue.split("").reverse().join("")), "" !== opts.radixPoint && isFinite(initialValue)) {
                            var vs = initialValue.split("."),
                                groupSize = "" !== opts.groupSeparator ? parseInt(opts.groupSize) : 0;
                            2 === vs.length && (vs[0].length > groupSize || vs[1].length > groupSize) && (initialValue = initialValue.toString().replace(".", opts.radixPoint))
                        }
                        var kommaMatches = initialValue.match(/,/g),
                            dotMatches = initialValue.match(/\./g);
                        if (dotMatches && kommaMatches ? dotMatches.length > kommaMatches.length ? (initialValue = initialValue.replace(/\./g, ""), initialValue = initialValue.replace(",", opts.radixPoint)) : kommaMatches.length > dotMatches.length ? (initialValue = initialValue.replace(/,/g, ""), initialValue = initialValue.replace(".", opts.radixPoint)) : initialValue = initialValue.indexOf(".") < initialValue.indexOf(",") ? initialValue.replace(/\./g, "") : initialValue = initialValue.replace(/,/g, "") : initialValue = initialValue.replace(new RegExp(Inputmask.escapeRegex(opts.groupSeparator), "g"), ""), 0 === opts.digits && (initialValue.indexOf(".") !== -1 ? initialValue = initialValue.substring(0, initialValue.indexOf(".")) : initialValue.indexOf(",") !== -1 && (initialValue = initialValue.substring(0, initialValue.indexOf(",")))), "" !== opts.radixPoint && isFinite(opts.digits) && initialValue.indexOf(opts.radixPoint) !== -1) {
                            var valueParts = initialValue.split(opts.radixPoint),
                                decPart = valueParts[1].match(new RegExp("\\d*"))[0];
                            if (parseInt(opts.digits) < decPart.toString().length) {
                                var digitsFactor = Math.pow(10, parseInt(opts.digits));
                                initialValue = initialValue.replace(Inputmask.escapeRegex(opts.radixPoint), "."), initialValue = Math.round(parseFloat(initialValue) * digitsFactor) / digitsFactor, initialValue = initialValue.toString().replace(".", opts.radixPoint)
                            }
                        }
                        return opts.numericInput === !0 && (initialValue = initialValue.split("").reverse().join("")), initialValue.toString()
                    },
                    canClearPosition: function(maskset, position, lvp, strict, opts) {
                        var positionInput = maskset.validPositions[position].input,
                            canClear = positionInput !== opts.radixPoint || null !== maskset.validPositions[position].match.fn && opts.decimalProtect === !1 || isFinite(positionInput) || position === lvp || positionInput === opts.groupSeparator || positionInput === opts.negationSymbol.front || positionInput === opts.negationSymbol.back;
                        return canClear
                    },
                    onKeyDown: function(e, buffer, caretPos, opts) {
                        var $input = $(this);
                        if (e.ctrlKey) switch (e.keyCode) {
                            case Inputmask.keyCode.UP:
                                $input.val(parseFloat(this.inputmask.unmaskedvalue()) + parseInt(opts.step)), $input.trigger("setvalue");
                                break;
                            case Inputmask.keyCode.DOWN:
                                $input.val(parseFloat(this.inputmask.unmaskedvalue()) - parseInt(opts.step)), $input.trigger("setvalue")
                        }
                    }
                },
                currency: {
                    prefix: "$ ",
                    groupSeparator: ",",
                    alias: "numeric",
                    placeholder: "0",
                    autoGroup: !0,
                    digits: 2,
                    digitsOptional: !1,
                    clearMaskOnLostFocus: !1
                },
                decimal: {
                    alias: "numeric"
                },
                integer: {
                    alias: "numeric",
                    digits: 0,
                    radixPoint: ""
                },
                percentage: {
                    alias: "numeric",
                    digits: 2,
                    radixPoint: ".",
                    placeholder: "0",
                    autoGroup: !1,
                    min: 0,
                    max: 100,
                    suffix: " %",
                    allowPlus: !1,
                    allowMinus: !1
                }
            }), Inputmask
        })
    }, {
        "./inputmask": 7,
        "./inputmask.dependencyLib": 5
    }],
    9: [function(require, module, exports) {
        ! function(factory) {
            "function" == typeof define && define.amd ? define(["inputmask.dependencyLib", "inputmask"], factory) : "object" == typeof exports ? module.exports = factory(require("./inputmask.dependencyLib"), require("./inputmask")) : factory(window.dependencyLib || jQuery, window.Inputmask)
        }(function($, Inputmask) {
            function maskSort(a, b) {
                var maska = (a.mask || a).replace(/#/g, "9").replace(/\)/, "9").replace(/[+()#-]/g, ""),
                    maskb = (b.mask || b).replace(/#/g, "9").replace(/\)/, "9").replace(/[+()#-]/g, ""),
                    maskas = (a.mask || a).split("#")[0],
                    maskbs = (b.mask || b).split("#")[0];
                return 0 === maskbs.indexOf(maskas) ? -1 : 0 === maskas.indexOf(maskbs) ? 1 : maska.localeCompare(maskb)
            }
            var analyseMaskBase = Inputmask.prototype.analyseMask;
            return Inputmask.prototype.analyseMask = function(mask, opts) {
                function reduceVariations(masks, previousVariation, previousmaskGroup) {
                    previousVariation = previousVariation || "", previousmaskGroup = previousmaskGroup || maskGroups, "" !== previousVariation && (previousmaskGroup[previousVariation] = {});
                    for (var variation = "", maskGroup = previousmaskGroup[previousVariation] || previousmaskGroup, i = masks.length - 1; i >= 0; i--) mask = masks[i].mask || masks[i], variation = mask.substr(0, 1), maskGroup[variation] = maskGroup[variation] || [], maskGroup[variation].unshift(mask.substr(1)), masks.splice(i, 1);
                    for (var ndx in maskGroup) maskGroup[ndx].length > 500 && reduceVariations(maskGroup[ndx].slice(), ndx, maskGroup)
                }

                function rebuild(maskGroup) {
                    var mask = "",
                        submasks = [];
                    for (var ndx in maskGroup) $.isArray(maskGroup[ndx]) ? 1 === maskGroup[ndx].length ? submasks.push(ndx + maskGroup[ndx]) : submasks.push(ndx + opts.groupmarker.start + maskGroup[ndx].join(opts.groupmarker.end + opts.alternatormarker + opts.groupmarker.start) + opts.groupmarker.end) : submasks.push(ndx + rebuild(maskGroup[ndx]));
                    return mask += 1 === submasks.length ? submasks[0] : opts.groupmarker.start + submasks.join(opts.groupmarker.end + opts.alternatormarker + opts.groupmarker.start) + opts.groupmarker.end
                }
                var maskGroups = {};
                opts.phoneCodes && opts.phoneCodes.length > 1e3 && (mask = mask.substr(1, mask.length - 2), reduceVariations(mask.split(opts.groupmarker.end + opts.alternatormarker + opts.groupmarker.start)), mask = rebuild(maskGroups));
                var mt = analyseMaskBase.call(this, mask, opts);
                return mt
            }, Inputmask.extendAliases({
                abstractphone: {
                    groupmarker: {
                        start: "<",
                        end: ">"
                    },
                    countrycode: "",
                    phoneCodes: [],
                    mask: function(opts) {
                        return opts.definitions = {
                            "#": opts.definitions[9]
                        }, opts.phoneCodes.sort(maskSort)
                    },
                    keepStatic: !0,
                    onBeforeMask: function(value, opts) {
                        var processedValue = value.replace(/^0{1,2}/, "").replace(/[\s]/g, "");
                        return (processedValue.indexOf(opts.countrycode) > 1 || processedValue.indexOf(opts.countrycode) === -1) && (processedValue = "+" + opts.countrycode + processedValue), processedValue
                    },
                    onUnMask: function(maskedValue, unmaskedValue, opts) {
                        return unmaskedValue
                    },
                    inputmode: "tel"
                }
            }), Inputmask
        })
    }, {
        "./inputmask": 7,
        "./inputmask.dependencyLib": 5
    }],
    10: [function(require, module, exports) {
        ! function(factory) {
            "function" == typeof define && define.amd ? define(["inputmask.dependencyLib", "inputmask"], factory) : "object" == typeof exports ? module.exports = factory(require("./inputmask.dependencyLib"), require("./inputmask")) : factory(window.dependencyLib || jQuery, window.Inputmask)
        }(function($, Inputmask) {
            return Inputmask.extendAliases({
                Regex: {
                    mask: "r",
                    greedy: !1,
                    repeat: "*",
                    regex: null,
                    regexTokens: null,
                    tokenizer: /\[\^?]?(?:[^\\\]]+|\\[\S\s]?)*]?|\\(?:0(?:[0-3][0-7]{0,2}|[4-7][0-7]?)?|[1-9][0-9]*|x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4}|c[A-Za-z]|[\S\s]?)|\((?:\?[:=!]?)?|(?:[?*+]|\{[0-9]+(?:,[0-9]*)?\})\??|[^.?*+^${[()|\\]+|./g,
                    quantifierFilter: /[0-9]+[^,]/,
                    isComplete: function(buffer, opts) {
                        return new RegExp(opts.regex).test(buffer.join(""))
                    },
                    definitions: {
                        r: {
                            validator: function(chrs, maskset, pos, strict, opts) {
                                function RegexToken(isGroup, isQuantifier) {
                                    this.matches = [], this.isGroup = isGroup || !1, this.isQuantifier = isQuantifier || !1, this.quantifier = {
                                        min: 1,
                                        max: 1
                                    }, this.repeaterPart = void 0
                                }

                                function analyseRegex() {
                                    var match, m, currentToken = new RegexToken,
                                        opengroups = [];
                                    for (opts.regexTokens = []; match = opts.tokenizer.exec(opts.regex);) switch (m = match[0], m.charAt(0)) {
                                        case "(":
                                            opengroups.push(new RegexToken(!0));
                                            break;
                                        case ")":
                                            groupToken = opengroups.pop(), opengroups.length > 0 ? opengroups[opengroups.length - 1].matches.push(groupToken) : currentToken.matches.push(groupToken);
                                            break;
                                        case "{":
                                        case "+":
                                        case "*":
                                            var quantifierToken = new RegexToken(!1, !0);
                                            m = m.replace(/[{}]/g, "");
                                            var mq = m.split(","),
                                                mq0 = isNaN(mq[0]) ? mq[0] : parseInt(mq[0]),
                                                mq1 = 1 === mq.length ? mq0 : isNaN(mq[1]) ? mq[1] : parseInt(mq[1]);
                                            if (quantifierToken.quantifier = {
                                                    min: mq0,
                                                    max: mq1
                                                }, opengroups.length > 0) {
                                                var matches = opengroups[opengroups.length - 1].matches;
                                                match = matches.pop(), match.isGroup || (groupToken = new RegexToken(!0), groupToken.matches.push(match), match = groupToken), matches.push(match), matches.push(quantifierToken)
                                            } else match = currentToken.matches.pop(), match.isGroup || (groupToken = new RegexToken(!0), groupToken.matches.push(match), match = groupToken), currentToken.matches.push(match), currentToken.matches.push(quantifierToken);
                                            break;
                                        default:
                                            opengroups.length > 0 ? opengroups[opengroups.length - 1].matches.push(m) : currentToken.matches.push(m)
                                    }
                                    currentToken.matches.length > 0 && opts.regexTokens.push(currentToken)
                                }

                                function validateRegexToken(token, fromGroup) {
                                    var isvalid = !1;
                                    fromGroup && (regexPart += "(", openGroupCount++);
                                    for (var mndx = 0; mndx < token.matches.length; mndx++) {
                                        var matchToken = token.matches[mndx];
                                        if (matchToken.isGroup === !0) isvalid = validateRegexToken(matchToken, !0);
                                        else if (matchToken.isQuantifier === !0) {
                                            var crrntndx = $.inArray(matchToken, token.matches),
                                                matchGroup = token.matches[crrntndx - 1],
                                                regexPartBak = regexPart;
                                            if (isNaN(matchToken.quantifier.max)) {
                                                for (; matchToken.repeaterPart && matchToken.repeaterPart !== regexPart && matchToken.repeaterPart.length > regexPart.length && !(isvalid = validateRegexToken(matchGroup, !0)););
                                                isvalid = isvalid || validateRegexToken(matchGroup, !0), isvalid && (matchToken.repeaterPart = regexPart), regexPart = regexPartBak + matchToken.quantifier.max
                                            } else {
                                                for (var i = 0, qm = matchToken.quantifier.max - 1; i < qm && !(isvalid = validateRegexToken(matchGroup, !0)); i++);
                                                regexPart = regexPartBak + "{" + matchToken.quantifier.min + "," + matchToken.quantifier.max + "}"
                                            }
                                        } else if (void 0 !== matchToken.matches)
                                            for (var k = 0; k < matchToken.length && !(isvalid = validateRegexToken(matchToken[k], fromGroup)); k++);
                                        else {
                                            var testExp;
                                            if ("[" == matchToken.charAt(0)) {
                                                testExp = regexPart, testExp += matchToken;
                                                for (var j = 0; j < openGroupCount; j++) testExp += ")";
                                                var exp = new RegExp("^(" + testExp + ")$");
                                                isvalid = exp.test(bufferStr)
                                            } else
                                                for (var l = 0, tl = matchToken.length; l < tl; l++)
                                                    if ("\\" !== matchToken.charAt(l)) {
                                                        testExp = regexPart, testExp += matchToken.substr(0, l + 1), testExp = testExp.replace(/\|$/, "");
                                                        for (var j = 0; j < openGroupCount; j++) testExp += ")";
                                                        var exp = new RegExp("^(" + testExp + ")$");
                                                        if (isvalid = exp.test(bufferStr)) break
                                                    }
                                            regexPart += matchToken
                                        }
                                        if (isvalid) break
                                    }
                                    return fromGroup && (regexPart += ")", openGroupCount--), isvalid
                                }
                                var bufferStr, groupToken, cbuffer = maskset.buffer.slice(),
                                    regexPart = "",
                                    isValid = !1,
                                    openGroupCount = 0;
                                null === opts.regexTokens && analyseRegex(), cbuffer.splice(pos, 0, chrs), bufferStr = cbuffer.join("");
                                for (var i = 0; i < opts.regexTokens.length; i++) {
                                    var regexToken = opts.regexTokens[i];
                                    if (isValid = validateRegexToken(regexToken, regexToken.isGroup)) break
                                }
                                return isValid
                            },
                            cardinality: 1
                        }
                    }
                }
            }), Inputmask
        })
    }, {
        "./inputmask": 7,
        "./inputmask.dependencyLib": 5
    }],
    11: [function(require, module, exports) {
        ! function(factory) {
            "function" == typeof define && define.amd ? define(["jquery", "inputmask"], factory) : "object" == typeof exports ? module.exports = factory(require("jquery"), require("./inputmask")) : factory(jQuery, window.Inputmask)
        }(function($, Inputmask) {
            return void 0 === $.fn.inputmask && ($.fn.inputmask = function(fn, options) {
                var nptmask, input = this[0];
                if (void 0 === options && (options = {}), "string" == typeof fn) switch (fn) {
                    case "unmaskedvalue":
                        return input && input.inputmask ? input.inputmask.unmaskedvalue() : $(input).val();
                    case "remove":
                        return this.each(function() {
                            this.inputmask && this.inputmask.remove()
                        });
                    case "getemptymask":
                        return input && input.inputmask ? input.inputmask.getemptymask() : "";
                    case "hasMaskedValue":
                        return !(!input || !input.inputmask) && input.inputmask.hasMaskedValue();
                    case "isComplete":
                        return !input || !input.inputmask || input.inputmask.isComplete();
                    case "getmetadata":
                        return input && input.inputmask ? input.inputmask.getmetadata() : void 0;
                    case "setvalue":
                        $(input).val(options), input && void 0 === input.inputmask && $(input).triggerHandler("setvalue");
                        break;
                    case "option":
                        if ("string" != typeof options) return this.each(function() {
                            if (void 0 !== this.inputmask) return this.inputmask.option(options)
                        });
                        if (input && void 0 !== input.inputmask) return input.inputmask.option(options);
                        break;
                    default:
                        return options.alias = fn, nptmask = new Inputmask(options), this.each(function() {
                            nptmask.mask(this)
                        })
                } else {
                    if ("object" == typeof fn) return nptmask = new Inputmask(fn), void 0 === fn.mask && void 0 === fn.alias ? this.each(function() {
                        return void 0 !== this.inputmask ? this.inputmask.option(fn) : void nptmask.mask(this)
                    }) : this.each(function() {
                        nptmask.mask(this)
                    });
                    if (void 0 === fn) return this.each(function() {
                        nptmask = new Inputmask(options), nptmask.mask(this)
                    })
                }
            }), $.fn.inputmask
        })
    }, {
        "./inputmask": 7,
        jquery: 13
    }],
    12: [function(require, module, exports) {
        require("./dist/inputmask/inputmask.dependencyLib");
        module.exports = require("./dist/inputmask/inputmask");
        require("./dist/inputmask/inputmask.extensions");
        require("./dist/inputmask/inputmask.date.extensions");
        require("./dist/inputmask/inputmask.numeric.extensions");
        require("./dist/inputmask/inputmask.phone.extensions");
        require("./dist/inputmask/inputmask.regex.extensions");
        require("./dist/inputmask/jquery.inputmask")
    }, {
        "./dist/inputmask/inputmask": 7,
        "./dist/inputmask/inputmask.date.extensions": 4,
        "./dist/inputmask/inputmask.dependencyLib": 5,
        "./dist/inputmask/inputmask.extensions": 6,
        "./dist/inputmask/inputmask.numeric.extensions": 8,
        "./dist/inputmask/inputmask.phone.extensions": 9,
        "./dist/inputmask/inputmask.regex.extensions": 10,
        "./dist/inputmask/jquery.inputmask": 11
    }],
    13: [function(require, module, exports) {
        (function(global, factory) {
            "use strict";
            if (typeof module === "object" && typeof module.exports === "object") {
                module.exports = global.document ? factory(global, true) : function(w) {
                    if (!w.document) {
                        throw new Error("jQuery requires a window with a document")
                    }
                    return factory(w)
                }
            } else {
                factory(global)
            }
        })(typeof window !== "undefined" ? window : this, function(window, noGlobal) {
            "use strict";
            var arr = [];
            var document = window.document;
            var getProto = Object.getPrototypeOf;
            var slice = arr.slice;
            var concat = arr.concat;
            var push = arr.push;
            var indexOf = arr.indexOf;
            var class2type = {};
            var toString = class2type.toString;
            var hasOwn = class2type.hasOwnProperty;
            var fnToString = hasOwn.toString;
            var ObjectFunctionString = fnToString.call(Object);
            var support = {};

            function DOMEval(code, doc) {
                doc = doc || document;
                var script = doc.createElement("script");
                script.text = code;
                doc.head.appendChild(script).parentNode.removeChild(script)
            }
            var version = "3.2.1",
                jQuery = function(selector, context) {
                    return new jQuery.fn.init(selector, context)
                },
                rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,
                rmsPrefix = /^-ms-/,
                rdashAlpha = /-([a-z])/g,
                fcamelCase = function(all, letter) {
                    return letter.toUpperCase()
                };
            jQuery.fn = jQuery.prototype = {
                jquery: version,
                constructor: jQuery,
                length: 0,
                toArray: function() {
                    return slice.call(this)
                },
                get: function(num) {
                    if (num == null) {
                        return slice.call(this)
                    }
                    return num < 0 ? this[num + this.length] : this[num]
                },
                pushStack: function(elems) {
                    var ret = jQuery.merge(this.constructor(), elems);
                    ret.prevObject = this;
                    return ret
                },
                each: function(callback) {
                    return jQuery.each(this, callback)
                },
                map: function(callback) {
                    return this.pushStack(jQuery.map(this, function(elem, i) {
                        return callback.call(elem, i, elem)
                    }))
                },
                slice: function() {
                    return this.pushStack(slice.apply(this, arguments))
                },
                first: function() {
                    return this.eq(0)
                },
                last: function() {
                    return this.eq(-1)
                },
                eq: function(i) {
                    var len = this.length,
                        j = +i + (i < 0 ? len : 0);
                    return this.pushStack(j >= 0 && j < len ? [this[j]] : [])
                },
                end: function() {
                    return this.prevObject || this.constructor()
                },
                push: push,
                sort: arr.sort,
                splice: arr.splice
            };
            jQuery.extend = jQuery.fn.extend = function() {
                var options, name, src, copy, copyIsArray, clone, target = arguments[0] || {},
                    i = 1,
                    length = arguments.length,
                    deep = false;
                if (typeof target === "boolean") {
                    deep = target;
                    target = arguments[i] || {};
                    i++
                }
                if (typeof target !== "object" && !jQuery.isFunction(target)) {
                    target = {}
                }
                if (i === length) {
                    target = this;
                    i--
                }
                for (; i < length; i++) {
                    if ((options = arguments[i]) != null) {
                        for (name in options) {
                            src = target[name];
                            copy = options[name];
                            if (target === copy) {
                                continue
                            }
                            if (deep && copy && (jQuery.isPlainObject(copy) || (copyIsArray = Array.isArray(copy)))) {
                                if (copyIsArray) {
                                    copyIsArray = false;
                                    clone = src && Array.isArray(src) ? src : []
                                } else {
                                    clone = src && jQuery.isPlainObject(src) ? src : {}
                                }
                                target[name] = jQuery.extend(deep, clone, copy)
                            } else if (copy !== undefined) {
                                target[name] = copy
                            }
                        }
                    }
                }
                return target
            };
            jQuery.extend({
                expando: "jQuery" + (version + Math.random()).replace(/\D/g, ""),
                isReady: true,
                error: function(msg) {
                    throw new Error(msg)
                },
                noop: function() {},
                isFunction: function(obj) {
                    return jQuery.type(obj) === "function"
                },
                isWindow: function(obj) {
                    return obj != null && obj === obj.window
                },
                isNumeric: function(obj) {
                    var type = jQuery.type(obj);
                    return (type === "number" || type === "string") && !isNaN(obj - parseFloat(obj))
                },
                isPlainObject: function(obj) {
                    var proto, Ctor;
                    if (!obj || toString.call(obj) !== "[object Object]") {
                        return false
                    }
                    proto = getProto(obj);
                    if (!proto) {
                        return true
                    }
                    Ctor = hasOwn.call(proto, "constructor") && proto.constructor;
                    return typeof Ctor === "function" && fnToString.call(Ctor) === ObjectFunctionString
                },
                isEmptyObject: function(obj) {
                    var name;
                    for (name in obj) {
                        return false
                    }
                    return true
                },
                type: function(obj) {
                    if (obj == null) {
                        return obj + ""
                    }
                    return typeof obj === "object" || typeof obj === "function" ? class2type[toString.call(obj)] || "object" : typeof obj
                },
                globalEval: function(code) {
                    DOMEval(code)
                },
                camelCase: function(string) {
                    return string.replace(rmsPrefix, "ms-").replace(rdashAlpha, fcamelCase)
                },
                each: function(obj, callback) {
                    var length, i = 0;
                    if (isArrayLike(obj)) {
                        length = obj.length;
                        for (; i < length; i++) {
                            if (callback.call(obj[i], i, obj[i]) === false) {
                                break
                            }
                        }
                    } else {
                        for (i in obj) {
                            if (callback.call(obj[i], i, obj[i]) === false) {
                                break
                            }
                        }
                    }
                    return obj
                },
                trim: function(text) {
                    return text == null ? "" : (text + "").replace(rtrim, "")
                },
                makeArray: function(arr, results) {
                    var ret = results || [];
                    if (arr != null) {
                        if (isArrayLike(Object(arr))) {
                            jQuery.merge(ret, typeof arr === "string" ? [arr] : arr)
                        } else {
                            push.call(ret, arr)
                        }
                    }
                    return ret
                },
                inArray: function(elem, arr, i) {
                    return arr == null ? -1 : indexOf.call(arr, elem, i)
                },
                merge: function(first, second) {
                    var len = +second.length,
                        j = 0,
                        i = first.length;
                    for (; j < len; j++) {
                        first[i++] = second[j]
                    }
                    first.length = i;
                    return first
                },
                grep: function(elems, callback, invert) {
                    var callbackInverse, matches = [],
                        i = 0,
                        length = elems.length,
                        callbackExpect = !invert;
                    for (; i < length; i++) {
                        callbackInverse = !callback(elems[i], i);
                        if (callbackInverse !== callbackExpect) {
                            matches.push(elems[i])
                        }
                    }
                    return matches
                },
                map: function(elems, callback, arg) {
                    var length, value, i = 0,
                        ret = [];
                    if (isArrayLike(elems)) {
                        length = elems.length;
                        for (; i < length; i++) {
                            value = callback(elems[i], i, arg);
                            if (value != null) {
                                ret.push(value)
                            }
                        }
                    } else {
                        for (i in elems) {
                            value = callback(elems[i], i, arg);
                            if (value != null) {
                                ret.push(value)
                            }
                        }
                    }
                    return concat.apply([], ret)
                },
                guid: 1,
                proxy: function(fn, context) {
                    var tmp, args, proxy;
                    if (typeof context === "string") {
                        tmp = fn[context];
                        context = fn;
                        fn = tmp
                    }
                    if (!jQuery.isFunction(fn)) {
                        return undefined
                    }
                    args = slice.call(arguments, 2);
                    proxy = function() {
                        return fn.apply(context || this, args.concat(slice.call(arguments)))
                    };
                    proxy.guid = fn.guid = fn.guid || jQuery.guid++;
                    return proxy
                },
                now: Date.now,
                support: support
            });
            if (typeof Symbol === "function") {
                jQuery.fn[Symbol.iterator] = arr[Symbol.iterator]
            }
            jQuery.each("Boolean Number String Function Array Date RegExp Object Error Symbol".split(" "), function(i, name) {
                class2type["[object " + name + "]"] = name.toLowerCase()
            });

            function isArrayLike(obj) {
                var length = !!obj && "length" in obj && obj.length,
                    type = jQuery.type(obj);
                if (type === "function" || jQuery.isWindow(obj)) {
                    return false
                }
                return type === "array" || length === 0 || typeof length === "number" && length > 0 && length - 1 in obj
            }
            var Sizzle = function(window) {
                var i, support, Expr, getText, isXML, tokenize, compile, select, outermostContext, sortInput, hasDuplicate, setDocument, document, docElem, documentIsHTML, rbuggyQSA, rbuggyMatches, matches, contains, expando = "sizzle" + 1 * new Date,
                    preferredDoc = window.document,
                    dirruns = 0,
                    done = 0,
                    classCache = createCache(),
                    tokenCache = createCache(),
                    compilerCache = createCache(),
                    sortOrder = function(a, b) {
                        if (a === b) {
                            hasDuplicate = true
                        }
                        return 0
                    },
                    hasOwn = {}.hasOwnProperty,
                    arr = [],
                    pop = arr.pop,
                    push_native = arr.push,
                    push = arr.push,
                    slice = arr.slice,
                    indexOf = function(list, elem) {
                        var i = 0,
                            len = list.length;
                        for (; i < len; i++) {
                            if (list[i] === elem) {
                                return i
                            }
                        }
                        return -1
                    },
                    booleans = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",
                    whitespace = "[\\x20\\t\\r\\n\\f]",
                    identifier = "(?:\\\\.|[\\w-]|[^\0-\\xa0])+",
                    attributes = "\\[" + whitespace + "*(" + identifier + ")(?:" + whitespace + "*([*^$|!~]?=)" + whitespace + "*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" + identifier + "))|)" + whitespace + "*\\]",
                    pseudos = ":(" + identifier + ")(?:\\((" + "('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|" + "((?:\\\\.|[^\\\\()[\\]]|" + attributes + ")*)|" + ".*" + ")\\)|)",
                    rwhitespace = new RegExp(whitespace + "+", "g"),
                    rtrim = new RegExp("^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g"),
                    rcomma = new RegExp("^" + whitespace + "*," + whitespace + "*"),
                    rcombinators = new RegExp("^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace + "*"),
                    rattributeQuotes = new RegExp("=" + whitespace + "*([^\\]'\"]*?)" + whitespace + "*\\]", "g"),
                    rpseudo = new RegExp(pseudos),
                    ridentifier = new RegExp("^" + identifier + "$"),
                    matchExpr = {
                        ID: new RegExp("^#(" + identifier + ")"),
                        CLASS: new RegExp("^\\.(" + identifier + ")"),
                        TAG: new RegExp("^(" + identifier + "|[*])"),
                        ATTR: new RegExp("^" + attributes),
                        PSEUDO: new RegExp("^" + pseudos),
                        CHILD: new RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + whitespace + "*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace + "*(\\d+)|))" + whitespace + "*\\)|)", "i"),
                        bool: new RegExp("^(?:" + booleans + ")$", "i"),
                        needsContext: new RegExp("^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" + whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i")
                    },
                    rinputs = /^(?:input|select|textarea|button)$/i,
                    rheader = /^h\d$/i,
                    rnative = /^[^{]+\{\s*\[native \w/,
                    rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,
                    rsibling = /[+~]/,
                    runescape = new RegExp("\\\\([\\da-f]{1,6}" + whitespace + "?|(" + whitespace + ")|.)", "ig"),
                    funescape = function(_, escaped, escapedWhitespace) {
                        var high = "0x" + escaped - 65536;
                        return high !== high || escapedWhitespace ? escaped : high < 0 ? String.fromCharCode(high + 65536) : String.fromCharCode(high >> 10 | 55296, high & 1023 | 56320)
                    },
                    rcssescape = /([\0-\x1f\x7f]|^-?\d)|^-$|[^\0-\x1f\x7f-\uFFFF\w-]/g,
                    fcssescape = function(ch, asCodePoint) {
                        if (asCodePoint) {
                            if (ch === "\0") {
                                return "�"
                            }
                            return ch.slice(0, -1) + "\\" + ch.charCodeAt(ch.length - 1).toString(16) + " "
                        }
                        return "\\" + ch
                    },
                    unloadHandler = function() {
                        setDocument()
                    },
                    disabledAncestor = addCombinator(function(elem) {
                        return elem.disabled === true && ("form" in elem || "label" in elem)
                    }, {
                        dir: "parentNode",
                        next: "legend"
                    });
                try {
                    push.apply(arr = slice.call(preferredDoc.childNodes), preferredDoc.childNodes);
                    arr[preferredDoc.childNodes.length].nodeType
                } catch (e) {
                    push = {
                        apply: arr.length ? function(target, els) {
                            push_native.apply(target, slice.call(els))
                        } : function(target, els) {
                            var j = target.length,
                                i = 0;
                            while (target[j++] = els[i++]) {}
                            target.length = j - 1
                        }
                    }
                }

                function Sizzle(selector, context, results, seed) {
                    var m, i, elem, nid, match, groups, newSelector, newContext = context && context.ownerDocument,
                        nodeType = context ? context.nodeType : 9;
                    results = results || [];
                    if (typeof selector !== "string" || !selector || nodeType !== 1 && nodeType !== 9 && nodeType !== 11) {
                        return results
                    }
                    if (!seed) {
                        if ((context ? context.ownerDocument || context : preferredDoc) !== document) {
                            setDocument(context)
                        }
                        context = context || document;
                        if (documentIsHTML) {
                            if (nodeType !== 11 && (match = rquickExpr.exec(selector))) {
                                if (m = match[1]) {
                                    if (nodeType === 9) {
                                        if (elem = context.getElementById(m)) {
                                            if (elem.id === m) {
                                                results.push(elem);
                                                return results
                                            }
                                        } else {
                                            return results
                                        }
                                    } else {
                                        if (newContext && (elem = newContext.getElementById(m)) && contains(context, elem) && elem.id === m) {
                                            results.push(elem);
                                            return results
                                        }
                                    }
                                } else if (match[2]) {
                                    push.apply(results, context.getElementsByTagName(selector));
                                    return results
                                } else if ((m = match[3]) && support.getElementsByClassName && context.getElementsByClassName) {
                                    push.apply(results, context.getElementsByClassName(m));
                                    return results
                                }
                            }
                            if (support.qsa && !compilerCache[selector + " "] && (!rbuggyQSA || !rbuggyQSA.test(selector))) {
                                if (nodeType !== 1) {
                                    newContext = context;
                                    newSelector = selector
                                } else if (context.nodeName.toLowerCase() !== "object") {
                                    if (nid = context.getAttribute("id")) {
                                        nid = nid.replace(rcssescape, fcssescape)
                                    } else {
                                        context.setAttribute("id", nid = expando)
                                    }
                                    groups = tokenize(selector);
                                    i = groups.length;
                                    while (i--) {
                                        groups[i] = "#" + nid + " " + toSelector(groups[i])
                                    }
                                    newSelector = groups.join(",");
                                    newContext = rsibling.test(selector) && testContext(context.parentNode) || context
                                }
                                if (newSelector) {
                                    try {
                                        push.apply(results, newContext.querySelectorAll(newSelector));
                                        return results
                                    } catch (qsaError) {} finally {
                                        if (nid === expando) {
                                            context.removeAttribute("id")
                                        }
                                    }
                                }
                            }
                        }
                    }
                    return select(selector.replace(rtrim, "$1"), context, results, seed)
                }

                function createCache() {
                    var keys = [];

                    function cache(key, value) {
                        if (keys.push(key + " ") > Expr.cacheLength) {
                            delete cache[keys.shift()]
                        }
                        return cache[key + " "] = value
                    }
                    return cache
                }

                function markFunction(fn) {
                    fn[expando] = true;
                    return fn
                }

                function assert(fn) {
                    var el = document.createElement("fieldset");
                    try {
                        return !!fn(el)
                    } catch (e) {
                        return false
                    } finally {
                        if (el.parentNode) {
                            el.parentNode.removeChild(el)
                        }
                        el = null
                    }
                }

                function addHandle(attrs, handler) {
                    var arr = attrs.split("|"),
                        i = arr.length;
                    while (i--) {
                        Expr.attrHandle[arr[i]] = handler
                    }
                }

                function siblingCheck(a, b) {
                    var cur = b && a,
                        diff = cur && a.nodeType === 1 && b.nodeType === 1 && a.sourceIndex - b.sourceIndex;
                    if (diff) {
                        return diff
                    }
                    if (cur) {
                        while (cur = cur.nextSibling) {
                            if (cur === b) {
                                return -1
                            }
                        }
                    }
                    return a ? 1 : -1
                }

                function createInputPseudo(type) {
                    return function(elem) {
                        var name = elem.nodeName.toLowerCase();
                        return name === "input" && elem.type === type
                    }
                }

                function createButtonPseudo(type) {
                    return function(elem) {
                        var name = elem.nodeName.toLowerCase();
                        return (name === "input" || name === "button") && elem.type === type
                    }
                }

                function createDisabledPseudo(disabled) {
                    return function(elem) {
                        if ("form" in elem) {
                            if (elem.parentNode && elem.disabled === false) {
                                if ("label" in elem) {
                                    if ("label" in elem.parentNode) {
                                        return elem.parentNode.disabled === disabled
                                    } else {
                                        return elem.disabled === disabled
                                    }
                                }
                                return elem.isDisabled === disabled || elem.isDisabled !== !disabled && disabledAncestor(elem) === disabled
                            }
                            return elem.disabled === disabled
                        } else if ("label" in elem) {
                            return elem.disabled === disabled
                        }
                        return false
                    }
                }

                function createPositionalPseudo(fn) {
                    return markFunction(function(argument) {
                        argument = +argument;
                        return markFunction(function(seed, matches) {
                            var j, matchIndexes = fn([], seed.length, argument),
                                i = matchIndexes.length;
                            while (i--) {
                                if (seed[j = matchIndexes[i]]) {
                                    seed[j] = !(matches[j] = seed[j])
                                }
                            }
                        })
                    })
                }

                function testContext(context) {
                    return context && typeof context.getElementsByTagName !== "undefined" && context
                }
                support = Sizzle.support = {};
                isXML = Sizzle.isXML = function(elem) {
                    var documentElement = elem && (elem.ownerDocument || elem).documentElement;
                    return documentElement ? documentElement.nodeName !== "HTML" : false
                };
                setDocument = Sizzle.setDocument = function(node) {
                    var hasCompare, subWindow, doc = node ? node.ownerDocument || node : preferredDoc;
                    if (doc === document || doc.nodeType !== 9 || !doc.documentElement) {
                        return document
                    }
                    document = doc;
                    docElem = document.documentElement;
                    documentIsHTML = !isXML(document);
                    if (preferredDoc !== document && (subWindow = document.defaultView) && subWindow.top !== subWindow) {
                        if (subWindow.addEventListener) {
                            subWindow.addEventListener("unload", unloadHandler, false)
                        } else if (subWindow.attachEvent) {
                            subWindow.attachEvent("onunload", unloadHandler)
                        }
                    }
                    support.attributes = assert(function(el) {
                        el.className = "i";
                        return !el.getAttribute("className")
                    });
                    support.getElementsByTagName = assert(function(el) {
                        el.appendChild(document.createComment(""));
                        return !el.getElementsByTagName("*").length
                    });
                    support.getElementsByClassName = rnative.test(document.getElementsByClassName);
                    support.getById = assert(function(el) {
                        docElem.appendChild(el).id = expando;
                        return !document.getElementsByName || !document.getElementsByName(expando).length
                    });
                    if (support.getById) {
                        Expr.filter["ID"] = function(id) {
                            var attrId = id.replace(runescape, funescape);
                            return function(elem) {
                                return elem.getAttribute("id") === attrId
                            }
                        };
                        Expr.find["ID"] = function(id, context) {
                            if (typeof context.getElementById !== "undefined" && documentIsHTML) {
                                var elem = context.getElementById(id);
                                return elem ? [elem] : []
                            }
                        }
                    } else {
                        Expr.filter["ID"] = function(id) {
                            var attrId = id.replace(runescape, funescape);
                            return function(elem) {
                                var node = typeof elem.getAttributeNode !== "undefined" && elem.getAttributeNode("id");
                                return node && node.value === attrId
                            }
                        };
                        Expr.find["ID"] = function(id, context) {
                            if (typeof context.getElementById !== "undefined" && documentIsHTML) {
                                var node, i, elems, elem = context.getElementById(id);
                                if (elem) {
                                    node = elem.getAttributeNode("id");
                                    if (node && node.value === id) {
                                        return [elem]
                                    }
                                    elems = context.getElementsByName(id);
                                    i = 0;
                                    while (elem = elems[i++]) {
                                        node = elem.getAttributeNode("id");
                                        if (node && node.value === id) {
                                            return [elem]
                                        }
                                    }
                                }
                                return []
                            }
                        }
                    }
                    Expr.find["TAG"] = support.getElementsByTagName ? function(tag, context) {
                        if (typeof context.getElementsByTagName !== "undefined") {
                            return context.getElementsByTagName(tag)
                        } else if (support.qsa) {
                            return context.querySelectorAll(tag)
                        }
                    } : function(tag, context) {
                        var elem, tmp = [],
                            i = 0,
                            results = context.getElementsByTagName(tag);
                        if (tag === "*") {
                            while (elem = results[i++]) {
                                if (elem.nodeType === 1) {
                                    tmp.push(elem)
                                }
                            }
                            return tmp
                        }
                        return results
                    };
                    Expr.find["CLASS"] = support.getElementsByClassName && function(className, context) {
                        if (typeof context.getElementsByClassName !== "undefined" && documentIsHTML) {
                            return context.getElementsByClassName(className)
                        }
                    };
                    rbuggyMatches = [];
                    rbuggyQSA = [];
                    if (support.qsa = rnative.test(document.querySelectorAll)) {
                        assert(function(el) {
                            docElem.appendChild(el).innerHTML = "<a id='" + expando + "'></a>" + "<select id='" + expando + "-\r\\' msallowcapture=''>" + "<option selected=''></option></select>";
                            if (el.querySelectorAll("[msallowcapture^='']").length) {
                                rbuggyQSA.push("[*^$]=" + whitespace + "*(?:''|\"\")")
                            }
                            if (!el.querySelectorAll("[selected]").length) {
                                rbuggyQSA.push("\\[" + whitespace + "*(?:value|" + booleans + ")")
                            }
                            if (!el.querySelectorAll("[id~=" + expando + "-]").length) {
                                rbuggyQSA.push("~=")
                            }
                            if (!el.querySelectorAll(":checked").length) {
                                rbuggyQSA.push(":checked")
                            }
                            if (!el.querySelectorAll("a#" + expando + "+*").length) {
                                rbuggyQSA.push(".#.+[+~]")
                            }
                        });
                        assert(function(el) {
                            el.innerHTML = "<a href='' disabled='disabled'></a>" + "<select disabled='disabled'><option/></select>";
                            var input = document.createElement("input");
                            input.setAttribute("type", "hidden");
                            el.appendChild(input).setAttribute("name", "D");
                            if (el.querySelectorAll("[name=d]").length) {
                                rbuggyQSA.push("name" + whitespace + "*[*^$|!~]?=")
                            }
                            if (el.querySelectorAll(":enabled").length !== 2) {
                                rbuggyQSA.push(":enabled", ":disabled")
                            }
                            docElem.appendChild(el).disabled = true;
                            if (el.querySelectorAll(":disabled").length !== 2) {
                                rbuggyQSA.push(":enabled", ":disabled")
                            }
                            el.querySelectorAll("*,:x");
                            rbuggyQSA.push(",.*:")
                        })
                    }
                    if (support.matchesSelector = rnative.test(matches = docElem.matches || docElem.webkitMatchesSelector || docElem.mozMatchesSelector || docElem.oMatchesSelector || docElem.msMatchesSelector)) {
                        assert(function(el) {
                            support.disconnectedMatch = matches.call(el, "*");
                            matches.call(el, "[s!='']:x");
                            rbuggyMatches.push("!=", pseudos)
                        })
                    }
                    rbuggyQSA = rbuggyQSA.length && new RegExp(rbuggyQSA.join("|"));
                    rbuggyMatches = rbuggyMatches.length && new RegExp(rbuggyMatches.join("|"));
                    hasCompare = rnative.test(docElem.compareDocumentPosition);
                    contains = hasCompare || rnative.test(docElem.contains) ? function(a, b) {
                        var adown = a.nodeType === 9 ? a.documentElement : a,
                            bup = b && b.parentNode;
                        return a === bup || !!(bup && bup.nodeType === 1 && (adown.contains ? adown.contains(bup) : a.compareDocumentPosition && a.compareDocumentPosition(bup) & 16))
                    } : function(a, b) {
                        if (b) {
                            while (b = b.parentNode) {
                                if (b === a) {
                                    return true
                                }
                            }
                        }
                        return false
                    };
                    sortOrder = hasCompare ? function(a, b) {
                        if (a === b) {
                            hasDuplicate = true;
                            return 0
                        }
                        var compare = !a.compareDocumentPosition - !b.compareDocumentPosition;
                        if (compare) {
                            return compare
                        }
                        compare = (a.ownerDocument || a) === (b.ownerDocument || b) ? a.compareDocumentPosition(b) : 1;
                        if (compare & 1 || !support.sortDetached && b.compareDocumentPosition(a) === compare) {
                            if (a === document || a.ownerDocument === preferredDoc && contains(preferredDoc, a)) {
                                return -1
                            }
                            if (b === document || b.ownerDocument === preferredDoc && contains(preferredDoc, b)) {
                                return 1
                            }
                            return sortInput ? indexOf(sortInput, a) - indexOf(sortInput, b) : 0
                        }
                        return compare & 4 ? -1 : 1
                    } : function(a, b) {
                        if (a === b) {
                            hasDuplicate = true;
                            return 0
                        }
                        var cur, i = 0,
                            aup = a.parentNode,
                            bup = b.parentNode,
                            ap = [a],
                            bp = [b];
                        if (!aup || !bup) {
                            return a === document ? -1 : b === document ? 1 : aup ? -1 : bup ? 1 : sortInput ? indexOf(sortInput, a) - indexOf(sortInput, b) : 0
                        } else if (aup === bup) {
                            return siblingCheck(a, b)
                        }
                        cur = a;
                        while (cur = cur.parentNode) {
                            ap.unshift(cur)
                        }
                        cur = b;
                        while (cur = cur.parentNode) {
                            bp.unshift(cur)
                        }
                        while (ap[i] === bp[i]) {
                            i++
                        }
                        return i ? siblingCheck(ap[i], bp[i]) : ap[i] === preferredDoc ? -1 : bp[i] === preferredDoc ? 1 : 0
                    };
                    return document
                };
                Sizzle.matches = function(expr, elements) {
                    return Sizzle(expr, null, null, elements)
                };
                Sizzle.matchesSelector = function(elem, expr) {
                    if ((elem.ownerDocument || elem) !== document) {
                        setDocument(elem)
                    }
                    expr = expr.replace(rattributeQuotes, "='$1']");
                    if (support.matchesSelector && documentIsHTML && !compilerCache[expr + " "] && (!rbuggyMatches || !rbuggyMatches.test(expr)) && (!rbuggyQSA || !rbuggyQSA.test(expr))) {
                        try {
                            var ret = matches.call(elem, expr);
                            if (ret || support.disconnectedMatch || elem.document && elem.document.nodeType !== 11) {
                                return ret
                            }
                        } catch (e) {}
                    }
                    return Sizzle(expr, document, null, [elem]).length > 0
                };
                Sizzle.contains = function(context, elem) {
                    if ((context.ownerDocument || context) !== document) {
                        setDocument(context)
                    }
                    return contains(context, elem)
                };
                Sizzle.attr = function(elem, name) {
                    if ((elem.ownerDocument || elem) !== document) {
                        setDocument(elem)
                    }
                    var fn = Expr.attrHandle[name.toLowerCase()],
                        val = fn && hasOwn.call(Expr.attrHandle, name.toLowerCase()) ? fn(elem, name, !documentIsHTML) : undefined;
                    return val !== undefined ? val : support.attributes || !documentIsHTML ? elem.getAttribute(name) : (val = elem.getAttributeNode(name)) && val.specified ? val.value : null
                };
                Sizzle.escape = function(sel) {
                    return (sel + "").replace(rcssescape, fcssescape)
                };
                Sizzle.error = function(msg) {
                    throw new Error("Syntax error, unrecognized expression: " + msg)
                };
                Sizzle.uniqueSort = function(results) {
                    var elem, duplicates = [],
                        j = 0,
                        i = 0;
                    hasDuplicate = !support.detectDuplicates;
                    sortInput = !support.sortStable && results.slice(0);
                    results.sort(sortOrder);
                    if (hasDuplicate) {
                        while (elem = results[i++]) {
                            if (elem === results[i]) {
                                j = duplicates.push(i)
                            }
                        }
                        while (j--) {
                            results.splice(duplicates[j], 1)
                        }
                    }
                    sortInput = null;
                    return results
                };
                getText = Sizzle.getText = function(elem) {
                    var node, ret = "",
                        i = 0,
                        nodeType = elem.nodeType;
                    if (!nodeType) {
                        while (node = elem[i++]) {
                            ret += getText(node)
                        }
                    } else if (nodeType === 1 || nodeType === 9 || nodeType === 11) {
                        if (typeof elem.textContent === "string") {
                            return elem.textContent
                        } else {
                            for (elem = elem.firstChild; elem; elem = elem.nextSibling) {
                                ret += getText(elem)
                            }
                        }
                    } else if (nodeType === 3 || nodeType === 4) {
                        return elem.nodeValue
                    }
                    return ret
                };
                Expr = Sizzle.selectors = {
                    cacheLength: 50,
                    createPseudo: markFunction,
                    match: matchExpr,
                    attrHandle: {},
                    find: {},
                    relative: {
                        ">": {
                            dir: "parentNode",
                            first: true
                        },
                        " ": {
                            dir: "parentNode"
                        },
                        "+": {
                            dir: "previousSibling",
                            first: true
                        },
                        "~": {
                            dir: "previousSibling"
                        }
                    },
                    preFilter: {
                        ATTR: function(match) {
                            match[1] = match[1].replace(runescape, funescape);
                            match[3] = (match[3] || match[4] || match[5] || "").replace(runescape, funescape);
                            if (match[2] === "~=") {
                                match[3] = " " + match[3] + " "
                            }
                            return match.slice(0, 4)
                        },
                        CHILD: function(match) {
                            match[1] = match[1].toLowerCase();
                            if (match[1].slice(0, 3) === "nth") {
                                if (!match[3]) {
                                    Sizzle.error(match[0])
                                }
                                match[4] = +(match[4] ? match[5] + (match[6] || 1) : 2 * (match[3] === "even" || match[3] === "odd"));
                                match[5] = +(match[7] + match[8] || match[3] === "odd")
                            } else if (match[3]) {
                                Sizzle.error(match[0])
                            }
                            return match
                        },
                        PSEUDO: function(match) {
                            var excess, unquoted = !match[6] && match[2];
                            if (matchExpr["CHILD"].test(match[0])) {
                                return null
                            }
                            if (match[3]) {
                                match[2] = match[4] || match[5] || ""
                            } else if (unquoted && rpseudo.test(unquoted) && (excess = tokenize(unquoted, true)) && (excess = unquoted.indexOf(")", unquoted.length - excess) - unquoted.length)) {
                                match[0] = match[0].slice(0, excess);
                                match[2] = unquoted.slice(0, excess)
                            }
                            return match.slice(0, 3)
                        }
                    },
                    filter: {
                        TAG: function(nodeNameSelector) {
                            var nodeName = nodeNameSelector.replace(runescape, funescape).toLowerCase();
                            return nodeNameSelector === "*" ? function() {
                                return true
                            } : function(elem) {
                                return elem.nodeName && elem.nodeName.toLowerCase() === nodeName
                            }
                        },
                        CLASS: function(className) {
                            var pattern = classCache[className + " "];
                            return pattern || (pattern = new RegExp("(^|" + whitespace + ")" + className + "(" + whitespace + "|$)")) && classCache(className, function(elem) {
                                return pattern.test(typeof elem.className === "string" && elem.className || typeof elem.getAttribute !== "undefined" && elem.getAttribute("class") || "")
                            })
                        },
                        ATTR: function(name, operator, check) {
                            return function(elem) {
                                var result = Sizzle.attr(elem, name);
                                if (result == null) {
                                    return operator === "!="
                                }
                                if (!operator) {
                                    return true
                                }
                                result += "";
                                return operator === "=" ? result === check : operator === "!=" ? result !== check : operator === "^=" ? check && result.indexOf(check) === 0 : operator === "*=" ? check && result.indexOf(check) > -1 : operator === "$=" ? check && result.slice(-check.length) === check : operator === "~=" ? (" " + result.replace(rwhitespace, " ") + " ").indexOf(check) > -1 : operator === "|=" ? result === check || result.slice(0, check.length + 1) === check + "-" : false
                            }
                        },
                        CHILD: function(type, what, argument, first, last) {
                            var simple = type.slice(0, 3) !== "nth",
                                forward = type.slice(-4) !== "last",
                                ofType = what === "of-type";
                            return first === 1 && last === 0 ? function(elem) {
                                return !!elem.parentNode
                            } : function(elem, context, xml) {
                                var cache, uniqueCache, outerCache, node, nodeIndex, start, dir = simple !== forward ? "nextSibling" : "previousSibling",
                                    parent = elem.parentNode,
                                    name = ofType && elem.nodeName.toLowerCase(),
                                    useCache = !xml && !ofType,
                                    diff = false;
                                if (parent) {
                                    if (simple) {
                                        while (dir) {
                                            node = elem;
                                            while (node = node[dir]) {
                                                if (ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1) {
                                                    return false
                                                }
                                            }
                                            start = dir = type === "only" && !start && "nextSibling"
                                        }
                                        return true
                                    }
                                    start = [forward ? parent.firstChild : parent.lastChild];
                                    if (forward && useCache) {
                                        node = parent;
                                        outerCache = node[expando] || (node[expando] = {});
                                        uniqueCache = outerCache[node.uniqueID] || (outerCache[node.uniqueID] = {});
                                        cache = uniqueCache[type] || [];
                                        nodeIndex = cache[0] === dirruns && cache[1];
                                        diff = nodeIndex && cache[2];
                                        node = nodeIndex && parent.childNodes[nodeIndex];
                                        while (node = ++nodeIndex && node && node[dir] || (diff = nodeIndex = 0) || start.pop()) {
                                            if (node.nodeType === 1 && ++diff && node === elem) {
                                                uniqueCache[type] = [dirruns, nodeIndex, diff];
                                                break
                                            }
                                        }
                                    } else {
                                        if (useCache) {
                                            node = elem;
                                            outerCache = node[expando] || (node[expando] = {});
                                            uniqueCache = outerCache[node.uniqueID] || (outerCache[node.uniqueID] = {});
                                            cache = uniqueCache[type] || [];
                                            nodeIndex = cache[0] === dirruns && cache[1];
                                            diff = nodeIndex
                                        }
                                        if (diff === false) {
                                            while (node = ++nodeIndex && node && node[dir] || (diff = nodeIndex = 0) || start.pop()) {
                                                if ((ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1) && ++diff) {
                                                    if (useCache) {
                                                        outerCache = node[expando] || (node[expando] = {});
                                                        uniqueCache = outerCache[node.uniqueID] || (outerCache[node.uniqueID] = {});
                                                        uniqueCache[type] = [dirruns, diff]
                                                    }
                                                    if (node === elem) {
                                                        break
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    diff -= last;
                                    return diff === first || diff % first === 0 && diff / first >= 0
                                }
                            }
                        },
                        PSEUDO: function(pseudo, argument) {
                            var args, fn = Expr.pseudos[pseudo] || Expr.setFilters[pseudo.toLowerCase()] || Sizzle.error("unsupported pseudo: " + pseudo);
                            if (fn[expando]) {
                                return fn(argument)
                            }
                            if (fn.length > 1) {
                                args = [pseudo, pseudo, "", argument];
                                return Expr.setFilters.hasOwnProperty(pseudo.toLowerCase()) ? markFunction(function(seed, matches) {
                                    var idx, matched = fn(seed, argument),
                                        i = matched.length;
                                    while (i--) {
                                        idx = indexOf(seed, matched[i]);
                                        seed[idx] = !(matches[idx] = matched[i])
                                    }
                                }) : function(elem) {
                                    return fn(elem, 0, args)
                                }
                            }
                            return fn
                        }
                    },
                    pseudos: {
                        not: markFunction(function(selector) {
                            var input = [],
                                results = [],
                                matcher = compile(selector.replace(rtrim, "$1"));
                            return matcher[expando] ? markFunction(function(seed, matches, context, xml) {
                                var elem, unmatched = matcher(seed, null, xml, []),
                                    i = seed.length;
                                while (i--) {
                                    if (elem = unmatched[i]) {
                                        seed[i] = !(matches[i] = elem)
                                    }
                                }
                            }) : function(elem, context, xml) {
                                input[0] = elem;
                                matcher(input, null, xml, results);
                                input[0] = null;
                                return !results.pop()
                            }
                        }),
                        has: markFunction(function(selector) {
                            return function(elem) {
                                return Sizzle(selector, elem).length > 0
                            }
                        }),
                        contains: markFunction(function(text) {
                            text = text.replace(runescape, funescape);
                            return function(elem) {
                                return (elem.textContent || elem.innerText || getText(elem)).indexOf(text) > -1
                            }
                        }),
                        lang: markFunction(function(lang) {
                            if (!ridentifier.test(lang || "")) {
                                Sizzle.error("unsupported lang: " + lang)
                            }
                            lang = lang.replace(runescape, funescape).toLowerCase();
                            return function(elem) {
                                var elemLang;
                                do {
                                    if (elemLang = documentIsHTML ? elem.lang : elem.getAttribute("xml:lang") || elem.getAttribute("lang")) {
                                        elemLang = elemLang.toLowerCase();
                                        return elemLang === lang || elemLang.indexOf(lang + "-") === 0
                                    }
                                } while ((elem = elem.parentNode) && elem.nodeType === 1);
                                return false
                            }
                        }),
                        target: function(elem) {
                            var hash = window.location && window.location.hash;
                            return hash && hash.slice(1) === elem.id
                        },
                        root: function(elem) {
                            return elem === docElem
                        },
                        focus: function(elem) {
                            return elem === document.activeElement && (!document.hasFocus || document.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex)
                        },
                        enabled: createDisabledPseudo(false),
                        disabled: createDisabledPseudo(true),
                        checked: function(elem) {
                            var nodeName = elem.nodeName.toLowerCase();
                            return nodeName === "input" && !!elem.checked || nodeName === "option" && !!elem.selected
                        },
                        selected: function(elem) {
                            if (elem.parentNode) {
                                elem.parentNode.selectedIndex
                            }
                            return elem.selected === true
                        },
                        empty: function(elem) {
                            for (elem = elem.firstChild; elem; elem = elem.nextSibling) {
                                if (elem.nodeType < 6) {
                                    return false
                                }
                            }
                            return true
                        },
                        parent: function(elem) {
                            return !Expr.pseudos["empty"](elem)
                        },
                        header: function(elem) {
                            return rheader.test(elem.nodeName)
                        },
                        input: function(elem) {
                            return rinputs.test(elem.nodeName)
                        },
                        button: function(elem) {
                            var name = elem.nodeName.toLowerCase();
                            return name === "input" && elem.type === "button" || name === "button"
                        },
                        text: function(elem) {
                            var attr;
                            return elem.nodeName.toLowerCase() === "input" && elem.type === "text" && ((attr = elem.getAttribute("type")) == null || attr.toLowerCase() === "text")
                        },
                        first: createPositionalPseudo(function() {
                            return [0]
                        }),
                        last: createPositionalPseudo(function(matchIndexes, length) {
                            return [length - 1]
                        }),
                        eq: createPositionalPseudo(function(matchIndexes, length, argument) {
                            return [argument < 0 ? argument + length : argument]
                        }),
                        even: createPositionalPseudo(function(matchIndexes, length) {
                            var i = 0;
                            for (; i < length; i += 2) {
                                matchIndexes.push(i)
                            }
                            return matchIndexes
                        }),
                        odd: createPositionalPseudo(function(matchIndexes, length) {
                            var i = 1;
                            for (; i < length; i += 2) {
                                matchIndexes.push(i)
                            }
                            return matchIndexes
                        }),
                        lt: createPositionalPseudo(function(matchIndexes, length, argument) {
                            var i = argument < 0 ? argument + length : argument;
                            for (; --i >= 0;) {
                                matchIndexes.push(i)
                            }
                            return matchIndexes
                        }),
                        gt: createPositionalPseudo(function(matchIndexes, length, argument) {
                            var i = argument < 0 ? argument + length : argument;
                            for (; ++i < length;) {
                                matchIndexes.push(i)
                            }
                            return matchIndexes
                        })
                    }
                };
                Expr.pseudos["nth"] = Expr.pseudos["eq"];
                for (i in {
                        radio: true,
                        checkbox: true,
                        file: true,
                        password: true,
                        image: true
                    }) {
                    Expr.pseudos[i] = createInputPseudo(i)
                }
                for (i in {
                        submit: true,
                        reset: true
                    }) {
                    Expr.pseudos[i] = createButtonPseudo(i)
                }

                function setFilters() {}
                setFilters.prototype = Expr.filters = Expr.pseudos;
                Expr.setFilters = new setFilters;
                tokenize = Sizzle.tokenize = function(selector, parseOnly) {
                    var matched, match, tokens, type, soFar, groups, preFilters, cached = tokenCache[selector + " "];
                    if (cached) {
                        return parseOnly ? 0 : cached.slice(0)
                    }
                    soFar = selector;
                    groups = [];
                    preFilters = Expr.preFilter;
                    while (soFar) {
                        if (!matched || (match = rcomma.exec(soFar))) {
                            if (match) {
                                soFar = soFar.slice(match[0].length) || soFar
                            }
                            groups.push(tokens = [])
                        }
                        matched = false;
                        if (match = rcombinators.exec(soFar)) {
                            matched = match.shift();
                            tokens.push({
                                value: matched,
                                type: match[0].replace(rtrim, " ")
                            });
                            soFar = soFar.slice(matched.length)
                        }
                        for (type in Expr.filter) {
                            if ((match = matchExpr[type].exec(soFar)) && (!preFilters[type] || (match = preFilters[type](match)))) {
                                matched = match.shift();
                                tokens.push({
                                    value: matched,
                                    type: type,
                                    matches: match
                                });
                                soFar = soFar.slice(matched.length)
                            }
                        }
                        if (!matched) {
                            break
                        }
                    }
                    return parseOnly ? soFar.length : soFar ? Sizzle.error(selector) : tokenCache(selector, groups).slice(0)
                };

                function toSelector(tokens) {
                    var i = 0,
                        len = tokens.length,
                        selector = "";
                    for (; i < len; i++) {
                        selector += tokens[i].value
                    }
                    return selector
                }

                function addCombinator(matcher, combinator, base) {
                    var dir = combinator.dir,
                        skip = combinator.next,
                        key = skip || dir,
                        checkNonElements = base && key === "parentNode",
                        doneName = done++;
                    return combinator.first ? function(elem, context, xml) {
                        while (elem = elem[dir]) {
                            if (elem.nodeType === 1 || checkNonElements) {
                                return matcher(elem, context, xml)
                            }
                        }
                        return false
                    } : function(elem, context, xml) {
                        var oldCache, uniqueCache, outerCache, newCache = [dirruns, doneName];
                        if (xml) {
                            while (elem = elem[dir]) {
                                if (elem.nodeType === 1 || checkNonElements) {
                                    if (matcher(elem, context, xml)) {
                                        return true
                                    }
                                }
                            }
                        } else {
                            while (elem = elem[dir]) {
                                if (elem.nodeType === 1 || checkNonElements) {
                                    outerCache = elem[expando] || (elem[expando] = {});
                                    uniqueCache = outerCache[elem.uniqueID] || (outerCache[elem.uniqueID] = {});
                                    if (skip && skip === elem.nodeName.toLowerCase()) {
                                        elem = elem[dir] || elem
                                    } else if ((oldCache = uniqueCache[key]) && oldCache[0] === dirruns && oldCache[1] === doneName) {
                                        return newCache[2] = oldCache[2]
                                    } else {
                                        uniqueCache[key] = newCache;
                                        if (newCache[2] = matcher(elem, context, xml)) {
                                            return true
                                        }
                                    }
                                }
                            }
                        }
                        return false
                    }
                }

                function elementMatcher(matchers) {
                    return matchers.length > 1 ? function(elem, context, xml) {
                        var i = matchers.length;
                        while (i--) {
                            if (!matchers[i](elem, context, xml)) {
                                return false
                            }
                        }
                        return true
                    } : matchers[0]
                }

                function multipleContexts(selector, contexts, results) {
                    var i = 0,
                        len = contexts.length;
                    for (; i < len; i++) {
                        Sizzle(selector, contexts[i], results)
                    }
                    return results
                }

                function condense(unmatched, map, filter, context, xml) {
                    var elem, newUnmatched = [],
                        i = 0,
                        len = unmatched.length,
                        mapped = map != null;
                    for (; i < len; i++) {
                        if (elem = unmatched[i]) {
                            if (!filter || filter(elem, context, xml)) {
                                newUnmatched.push(elem);
                                if (mapped) {
                                    map.push(i)
                                }
                            }
                        }
                    }
                    return newUnmatched
                }

                function setMatcher(preFilter, selector, matcher, postFilter, postFinder, postSelector) {
                    if (postFilter && !postFilter[expando]) {
                        postFilter = setMatcher(postFilter)
                    }
                    if (postFinder && !postFinder[expando]) {
                        postFinder = setMatcher(postFinder, postSelector)
                    }
                    return markFunction(function(seed, results, context, xml) {
                        var temp, i, elem, preMap = [],
                            postMap = [],
                            preexisting = results.length,
                            elems = seed || multipleContexts(selector || "*", context.nodeType ? [context] : context, []),
                            matcherIn = preFilter && (seed || !selector) ? condense(elems, preMap, preFilter, context, xml) : elems,
                            matcherOut = matcher ? postFinder || (seed ? preFilter : preexisting || postFilter) ? [] : results : matcherIn;
                        if (matcher) {
                            matcher(matcherIn, matcherOut, context, xml)
                        }
                        if (postFilter) {
                            temp = condense(matcherOut, postMap);
                            postFilter(temp, [], context, xml);
                            i = temp.length;
                            while (i--) {
                                if (elem = temp[i]) {
                                    matcherOut[postMap[i]] = !(matcherIn[postMap[i]] = elem)
                                }
                            }
                        }
                        if (seed) {
                            if (postFinder || preFilter) {
                                if (postFinder) {
                                    temp = [];
                                    i = matcherOut.length;
                                    while (i--) {
                                        if (elem = matcherOut[i]) {
                                            temp.push(matcherIn[i] = elem)
                                        }
                                    }
                                    postFinder(null, matcherOut = [], temp, xml)
                                }
                                i = matcherOut.length;
                                while (i--) {
                                    if ((elem = matcherOut[i]) && (temp = postFinder ? indexOf(seed, elem) : preMap[i]) > -1) {
                                        seed[temp] = !(results[temp] = elem)
                                    }
                                }
                            }
                        } else {
                            matcherOut = condense(matcherOut === results ? matcherOut.splice(preexisting, matcherOut.length) : matcherOut);
                            if (postFinder) {
                                postFinder(null, results, matcherOut, xml)
                            } else {
                                push.apply(results, matcherOut)
                            }
                        }
                    })
                }

                function matcherFromTokens(tokens) {
                    var checkContext, matcher, j, len = tokens.length,
                        leadingRelative = Expr.relative[tokens[0].type],
                        implicitRelative = leadingRelative || Expr.relative[" "],
                        i = leadingRelative ? 1 : 0,
                        matchContext = addCombinator(function(elem) {
                            return elem === checkContext
                        }, implicitRelative, true),
                        matchAnyContext = addCombinator(function(elem) {
                            return indexOf(checkContext, elem) > -1
                        }, implicitRelative, true),
                        matchers = [function(elem, context, xml) {
                            var ret = !leadingRelative && (xml || context !== outermostContext) || ((checkContext = context).nodeType ? matchContext(elem, context, xml) : matchAnyContext(elem, context, xml));
                            checkContext = null;
                            return ret
                        }];
                    for (; i < len; i++) {
                        if (matcher = Expr.relative[tokens[i].type]) {
                            matchers = [addCombinator(elementMatcher(matchers), matcher)]
                        } else {
                            matcher = Expr.filter[tokens[i].type].apply(null, tokens[i].matches);
                            if (matcher[expando]) {
                                j = ++i;
                                for (; j < len; j++) {
                                    if (Expr.relative[tokens[j].type]) {
                                        break
                                    }
                                }
                                return setMatcher(i > 1 && elementMatcher(matchers), i > 1 && toSelector(tokens.slice(0, i - 1).concat({
                                    value: tokens[i - 2].type === " " ? "*" : ""
                                })).replace(rtrim, "$1"), matcher, i < j && matcherFromTokens(tokens.slice(i, j)), j < len && matcherFromTokens(tokens = tokens.slice(j)), j < len && toSelector(tokens))
                            }
                            matchers.push(matcher)
                        }
                    }
                    return elementMatcher(matchers)
                }

                function matcherFromGroupMatchers(elementMatchers, setMatchers) {
                    var bySet = setMatchers.length > 0,
                        byElement = elementMatchers.length > 0,
                        superMatcher = function(seed, context, xml, results, outermost) {
                            var elem, j, matcher, matchedCount = 0,
                                i = "0",
                                unmatched = seed && [],
                                setMatched = [],
                                contextBackup = outermostContext,
                                elems = seed || byElement && Expr.find["TAG"]("*", outermost),
                                dirrunsUnique = dirruns += contextBackup == null ? 1 : Math.random() || .1,
                                len = elems.length;
                            if (outermost) {
                                outermostContext = context === document || context || outermost
                            }
                            for (; i !== len && (elem = elems[i]) != null; i++) {
                                if (byElement && elem) {
                                    j = 0;
                                    if (!context && elem.ownerDocument !== document) {
                                        setDocument(elem);
                                        xml = !documentIsHTML
                                    }
                                    while (matcher = elementMatchers[j++]) {
                                        if (matcher(elem, context || document, xml)) {
                                            results.push(elem);
                                            break
                                        }
                                    }
                                    if (outermost) {
                                        dirruns = dirrunsUnique
                                    }
                                }
                                if (bySet) {
                                    if (elem = !matcher && elem) {
                                        matchedCount--
                                    }
                                    if (seed) {
                                        unmatched.push(elem)
                                    }
                                }
                            }
                            matchedCount += i;
                            if (bySet && i !== matchedCount) {
                                j = 0;
                                while (matcher = setMatchers[j++]) {
                                    matcher(unmatched, setMatched, context, xml)
                                }
                                if (seed) {
                                    if (matchedCount > 0) {
                                        while (i--) {
                                            if (!(unmatched[i] || setMatched[i])) {
                                                setMatched[i] = pop.call(results)
                                            }
                                        }
                                    }
                                    setMatched = condense(setMatched)
                                }
                                push.apply(results, setMatched);
                                if (outermost && !seed && setMatched.length > 0 && matchedCount + setMatchers.length > 1) {
                                    Sizzle.uniqueSort(results)
                                }
                            }
                            if (outermost) {
                                dirruns = dirrunsUnique;
                                outermostContext = contextBackup
                            }
                            return unmatched
                        };
                    return bySet ? markFunction(superMatcher) : superMatcher
                }
                compile = Sizzle.compile = function(selector, match) {
                    var i, setMatchers = [],
                        elementMatchers = [],
                        cached = compilerCache[selector + " "];
                    if (!cached) {
                        if (!match) {
                            match = tokenize(selector)
                        }
                        i = match.length;
                        while (i--) {
                            cached = matcherFromTokens(match[i]);
                            if (cached[expando]) {
                                setMatchers.push(cached)
                            } else {
                                elementMatchers.push(cached)
                            }
                        }
                        cached = compilerCache(selector, matcherFromGroupMatchers(elementMatchers, setMatchers));
                        cached.selector = selector
                    }
                    return cached
                };
                select = Sizzle.select = function(selector, context, results, seed) {
                    var i, tokens, token, type, find, compiled = typeof selector === "function" && selector,
                        match = !seed && tokenize(selector = compiled.selector || selector);
                    results = results || [];
                    if (match.length === 1) {
                        tokens = match[0] = match[0].slice(0);
                        if (tokens.length > 2 && (token = tokens[0]).type === "ID" && context.nodeType === 9 && documentIsHTML && Expr.relative[tokens[1].type]) {
                            context = (Expr.find["ID"](token.matches[0].replace(runescape, funescape), context) || [])[0];
                            if (!context) {
                                return results
                            } else if (compiled) {
                                context = context.parentNode
                            }
                            selector = selector.slice(tokens.shift().value.length)
                        }
                        i = matchExpr["needsContext"].test(selector) ? 0 : tokens.length;
                        while (i--) {
                            token = tokens[i];
                            if (Expr.relative[type = token.type]) {
                                break
                            }
                            if (find = Expr.find[type]) {
                                if (seed = find(token.matches[0].replace(runescape, funescape), rsibling.test(tokens[0].type) && testContext(context.parentNode) || context)) {
                                    tokens.splice(i, 1);
                                    selector = seed.length && toSelector(tokens);
                                    if (!selector) {
                                        push.apply(results, seed);
                                        return results
                                    }
                                    break
                                }
                            }
                        }
                    }(compiled || compile(selector, match))(seed, context, !documentIsHTML, results, !context || rsibling.test(selector) && testContext(context.parentNode) || context);
                    return results
                };
                support.sortStable = expando.split("").sort(sortOrder).join("") === expando;
                support.detectDuplicates = !!hasDuplicate;
                setDocument();
                support.sortDetached = assert(function(el) {
                    return el.compareDocumentPosition(document.createElement("fieldset")) & 1
                });
                if (!assert(function(el) {
                        el.innerHTML = "<a href='#'></a>";
                        return el.firstChild.getAttribute("href") === "#"
                    })) {
                    addHandle("type|href|height|width", function(elem, name, isXML) {
                        if (!isXML) {
                            return elem.getAttribute(name, name.toLowerCase() === "type" ? 1 : 2)
                        }
                    })
                }
                if (!support.attributes || !assert(function(el) {
                        el.innerHTML = "<input/>";
                        el.firstChild.setAttribute("value", "");
                        return el.firstChild.getAttribute("value") === ""
                    })) {
                    addHandle("value", function(elem, name, isXML) {
                        if (!isXML && elem.nodeName.toLowerCase() === "input") {
                            return elem.defaultValue
                        }
                    })
                }
                if (!assert(function(el) {
                        return el.getAttribute("disabled") == null
                    })) {
                    addHandle(booleans, function(elem, name, isXML) {
                        var val;
                        if (!isXML) {
                            return elem[name] === true ? name.toLowerCase() : (val = elem.getAttributeNode(name)) && val.specified ? val.value : null
                        }
                    })
                }
                return Sizzle
            }(window);
            jQuery.find = Sizzle;
            jQuery.expr = Sizzle.selectors;
            jQuery.expr[":"] = jQuery.expr.pseudos;
            jQuery.uniqueSort = jQuery.unique = Sizzle.uniqueSort;
            jQuery.text = Sizzle.getText;
            jQuery.isXMLDoc = Sizzle.isXML;
            jQuery.contains = Sizzle.contains;
            jQuery.escapeSelector = Sizzle.escape;
            var dir = function(elem, dir, until) {
                var matched = [],
                    truncate = until !== undefined;
                while ((elem = elem[dir]) && elem.nodeType !== 9) {
                    if (elem.nodeType === 1) {
                        if (truncate && jQuery(elem).is(until)) {
                            break
                        }
                        matched.push(elem)
                    }
                }
                return matched
            };
            var siblings = function(n, elem) {
                var matched = [];
                for (; n; n = n.nextSibling) {
                    if (n.nodeType === 1 && n !== elem) {
                        matched.push(n)
                    }
                }
                return matched
            };
            var rneedsContext = jQuery.expr.match.needsContext;

            function nodeName(elem, name) {
                return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase()
            }
            var rsingleTag = /^<([a-z][^\/\0>:\x20\t\r\n\f]*)[\x20\t\r\n\f]*\/?>(?:<\/\1>|)$/i;
            var risSimple = /^.[^:#\[\.,]*$/;

            function winnow(elements, qualifier, not) {
                if (jQuery.isFunction(qualifier)) {
                    return jQuery.grep(elements, function(elem, i) {
                        return !!qualifier.call(elem, i, elem) !== not
                    })
                }
                if (qualifier.nodeType) {
                    return jQuery.grep(elements, function(elem) {
                        return elem === qualifier !== not
                    })
                }
                if (typeof qualifier !== "string") {
                    return jQuery.grep(elements, function(elem) {
                        return indexOf.call(qualifier, elem) > -1 !== not
                    })
                }
                if (risSimple.test(qualifier)) {
                    return jQuery.filter(qualifier, elements, not)
                }
                qualifier = jQuery.filter(qualifier, elements);
                return jQuery.grep(elements, function(elem) {
                    return indexOf.call(qualifier, elem) > -1 !== not && elem.nodeType === 1
                })
            }
            jQuery.filter = function(expr, elems, not) {
                var elem = elems[0];
                if (not) {
                    expr = ":not(" + expr + ")"
                }
                if (elems.length === 1 && elem.nodeType === 1) {
                    return jQuery.find.matchesSelector(elem, expr) ? [elem] : []
                }
                return jQuery.find.matches(expr, jQuery.grep(elems, function(elem) {
                    return elem.nodeType === 1
                }))
            };
            jQuery.fn.extend({
                find: function(selector) {
                    var i, ret, len = this.length,
                        self = this;
                    if (typeof selector !== "string") {
                        return this.pushStack(jQuery(selector).filter(function() {
                            for (i = 0; i < len; i++) {
                                if (jQuery.contains(self[i], this)) {
                                    return true
                                }
                            }
                        }))
                    }
                    ret = this.pushStack([]);
                    for (i = 0; i < len; i++) {
                        jQuery.find(selector, self[i], ret)
                    }
                    return len > 1 ? jQuery.uniqueSort(ret) : ret
                },
                filter: function(selector) {
                    return this.pushStack(winnow(this, selector || [], false))
                },
                not: function(selector) {
                    return this.pushStack(winnow(this, selector || [], true))
                },
                is: function(selector) {
                    return !!winnow(this, typeof selector === "string" && rneedsContext.test(selector) ? jQuery(selector) : selector || [], false).length
                }
            });
            var rootjQuery, rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]+))$/,
                init = jQuery.fn.init = function(selector, context, root) {
                    var match, elem;
                    if (!selector) {
                        return this
                    }
                    root = root || rootjQuery;
                    if (typeof selector === "string") {
                        if (selector[0] === "<" && selector[selector.length - 1] === ">" && selector.length >= 3) {
                            match = [null, selector, null]
                        } else {
                            match = rquickExpr.exec(selector)
                        }
                        if (match && (match[1] || !context)) {
                            if (match[1]) {
                                context = context instanceof jQuery ? context[0] : context;
                                jQuery.merge(this, jQuery.parseHTML(match[1], context && context.nodeType ? context.ownerDocument || context : document, true));
                                if (rsingleTag.test(match[1]) && jQuery.isPlainObject(context)) {
                                    for (match in context) {
                                        if (jQuery.isFunction(this[match])) {
                                            this[match](context[match])
                                        } else {
                                            this.attr(match, context[match])
                                        }
                                    }
                                }
                                return this
                            } else {
                                elem = document.getElementById(match[2]);
                                if (elem) {
                                    this[0] = elem;
                                    this.length = 1
                                }
                                return this
                            }
                        } else if (!context || context.jquery) {
                            return (context || root).find(selector)
                        } else {
                            return this.constructor(context).find(selector)
                        }
                    } else if (selector.nodeType) {
                        this[0] = selector;
                        this.length = 1;
                        return this
                    } else if (jQuery.isFunction(selector)) {
                        return root.ready !== undefined ? root.ready(selector) : selector(jQuery)
                    }
                    return jQuery.makeArray(selector, this)
                };
            init.prototype = jQuery.fn;
            rootjQuery = jQuery(document);
            var rparentsprev = /^(?:parents|prev(?:Until|All))/,
                guaranteedUnique = {
                    children: true,
                    contents: true,
                    next: true,
                    prev: true
                };
            jQuery.fn.extend({
                has: function(target) {
                    var targets = jQuery(target, this),
                        l = targets.length;
                    return this.filter(function() {
                        var i = 0;
                        for (; i < l; i++) {
                            if (jQuery.contains(this, targets[i])) {
                                return true
                            }
                        }
                    })
                },
                closest: function(selectors, context) {
                    var cur, i = 0,
                        l = this.length,
                        matched = [],
                        targets = typeof selectors !== "string" && jQuery(selectors);
                    if (!rneedsContext.test(selectors)) {
                        for (; i < l; i++) {
                            for (cur = this[i]; cur && cur !== context; cur = cur.parentNode) {
                                if (cur.nodeType < 11 && (targets ? targets.index(cur) > -1 : cur.nodeType === 1 && jQuery.find.matchesSelector(cur, selectors))) {
                                    matched.push(cur);
                                    break
                                }
                            }
                        }
                    }
                    return this.pushStack(matched.length > 1 ? jQuery.uniqueSort(matched) : matched)
                },
                index: function(elem) {
                    if (!elem) {
                        return this[0] && this[0].parentNode ? this.first().prevAll().length : -1
                    }
                    if (typeof elem === "string") {
                        return indexOf.call(jQuery(elem), this[0])
                    }
                    return indexOf.call(this, elem.jquery ? elem[0] : elem)
                },
                add: function(selector, context) {
                    return this.pushStack(jQuery.uniqueSort(jQuery.merge(this.get(), jQuery(selector, context))))
                },
                addBack: function(selector) {
                    return this.add(selector == null ? this.prevObject : this.prevObject.filter(selector))
                }
            });

            function sibling(cur, dir) {
                while ((cur = cur[dir]) && cur.nodeType !== 1) {}
                return cur
            }
            jQuery.each({
                parent: function(elem) {
                    var parent = elem.parentNode;
                    return parent && parent.nodeType !== 11 ? parent : null
                },
                parents: function(elem) {
                    return dir(elem, "parentNode")
                },
                parentsUntil: function(elem, i, until) {
                    return dir(elem, "parentNode", until)
                },
                next: function(elem) {
                    return sibling(elem, "nextSibling")
                },
                prev: function(elem) {
                    return sibling(elem, "previousSibling")
                },
                nextAll: function(elem) {
                    return dir(elem, "nextSibling")
                },
                prevAll: function(elem) {
                    return dir(elem, "previousSibling")
                },
                nextUntil: function(elem, i, until) {
                    return dir(elem, "nextSibling", until)
                },
                prevUntil: function(elem, i, until) {
                    return dir(elem, "previousSibling", until)
                },
                siblings: function(elem) {
                    return siblings((elem.parentNode || {}).firstChild, elem)
                },
                children: function(elem) {
                    return siblings(elem.firstChild)
                },
                contents: function(elem) {
                    if (nodeName(elem, "iframe")) {
                        return elem.contentDocument
                    }
                    if (nodeName(elem, "template")) {
                        elem = elem.content || elem
                    }
                    return jQuery.merge([], elem.childNodes)
                }
            }, function(name, fn) {
                jQuery.fn[name] = function(until, selector) {
                    var matched = jQuery.map(this, fn, until);
                    if (name.slice(-5) !== "Until") {
                        selector = until
                    }
                    if (selector && typeof selector === "string") {
                        matched = jQuery.filter(selector, matched)
                    }
                    if (this.length > 1) {
                        if (!guaranteedUnique[name]) {
                            jQuery.uniqueSort(matched)
                        }
                        if (rparentsprev.test(name)) {
                            matched.reverse()
                        }
                    }
                    return this.pushStack(matched)
                }
            });
            var rnothtmlwhite = /[^\x20\t\r\n\f]+/g;

            function createOptions(options) {
                var object = {};
                jQuery.each(options.match(rnothtmlwhite) || [], function(_, flag) {
                    object[flag] = true
                });
                return object
            }
            jQuery.Callbacks = function(options) {
                options = typeof options === "string" ? createOptions(options) : jQuery.extend({}, options);
                var firing, memory, fired, locked, list = [],
                    queue = [],
                    firingIndex = -1,
                    fire = function() {
                        locked = locked || options.once;
                        fired = firing = true;
                        for (; queue.length; firingIndex = -1) {
                            memory = queue.shift();
                            while (++firingIndex < list.length) {
                                if (list[firingIndex].apply(memory[0], memory[1]) === false && options.stopOnFalse) {
                                    firingIndex = list.length;
                                    memory = false
                                }
                            }
                        }
                        if (!options.memory) {
                            memory = false
                        }
                        firing = false;
                        if (locked) {
                            if (memory) {
                                list = []
                            } else {
                                list = ""
                            }
                        }
                    },
                    self = {
                        add: function() {
                            if (list) {
                                if (memory && !firing) {
                                    firingIndex = list.length - 1;
                                    queue.push(memory)
                                }(function add(args) {
                                    jQuery.each(args, function(_, arg) {
                                        if (jQuery.isFunction(arg)) {
                                            if (!options.unique || !self.has(arg)) {
                                                list.push(arg)
                                            }
                                        } else if (arg && arg.length && jQuery.type(arg) !== "string") {
                                            add(arg)
                                        }
                                    })
                                })(arguments);
                                if (memory && !firing) {
                                    fire()
                                }
                            }
                            return this
                        },
                        remove: function() {
                            jQuery.each(arguments, function(_, arg) {
                                var index;
                                while ((index = jQuery.inArray(arg, list, index)) > -1) {
                                    list.splice(index, 1);
                                    if (index <= firingIndex) {
                                        firingIndex--
                                    }
                                }
                            });
                            return this
                        },
                        has: function(fn) {
                            return fn ? jQuery.inArray(fn, list) > -1 : list.length > 0
                        },
                        empty: function() {
                            if (list) {
                                list = []
                            }
                            return this
                        },
                        disable: function() {
                            locked = queue = [];
                            list = memory = "";
                            return this
                        },
                        disabled: function() {
                            return !list
                        },
                        lock: function() {
                            locked = queue = [];
                            if (!memory && !firing) {
                                list = memory = ""
                            }
                            return this
                        },
                        locked: function() {
                            return !!locked
                        },
                        fireWith: function(context, args) {
                            if (!locked) {
                                args = args || [];
                                args = [context, args.slice ? args.slice() : args];
                                queue.push(args);
                                if (!firing) {
                                    fire()
                                }
                            }
                            return this
                        },
                        fire: function() {
                            self.fireWith(this, arguments);
                            return this
                        },
                        fired: function() {
                            return !!fired
                        }
                    };
                return self
            };

            function Identity(v) {
                return v
            }

            function Thrower(ex) {
                throw ex
            }

            function adoptValue(value, resolve, reject, noValue) {
                var method;
                try {
                    if (value && jQuery.isFunction(method = value.promise)) {
                        method.call(value).done(resolve).fail(reject)
                    } else if (value && jQuery.isFunction(method = value.then)) {
                        method.call(value, resolve, reject)
                    } else {
                        resolve.apply(undefined, [value].slice(noValue))
                    }
                } catch (value) {
                    reject.apply(undefined, [value])
                }
            }
            jQuery.extend({
                Deferred: function(func) {
                    var tuples = [
                            ["notify", "progress", jQuery.Callbacks("memory"), jQuery.Callbacks("memory"), 2],
                            ["resolve", "done", jQuery.Callbacks("once memory"), jQuery.Callbacks("once memory"), 0, "resolved"],
                            ["reject", "fail", jQuery.Callbacks("once memory"), jQuery.Callbacks("once memory"), 1, "rejected"]
                        ],
                        state = "pending",
                        promise = {
                            state: function() {
                                return state
                            },
                            always: function() {
                                deferred.done(arguments).fail(arguments);
                                return this
                            },
                            catch: function(fn) {
                                return promise.then(null, fn)
                            },
                            pipe: function() {
                                var fns = arguments;
                                return jQuery.Deferred(function(newDefer) {
                                    jQuery.each(tuples, function(i, tuple) {
                                        var fn = jQuery.isFunction(fns[tuple[4]]) && fns[tuple[4]];
                                        deferred[tuple[1]](function() {
                                            var returned = fn && fn.apply(this, arguments);
                                            if (returned && jQuery.isFunction(returned.promise)) {
                                                returned.promise().progress(newDefer.notify).done(newDefer.resolve).fail(newDefer.reject)
                                            } else {
                                                newDefer[tuple[0] + "With"](this, fn ? [returned] : arguments)
                                            }
                                        })
                                    });
                                    fns = null
                                }).promise()
                            },
                            then: function(onFulfilled, onRejected, onProgress) {
                                var maxDepth = 0;

                                function resolve(depth, deferred, handler, special) {
                                    return function() {
                                        var that = this,
                                            args = arguments,
                                            mightThrow = function() {
                                                var returned, then;
                                                if (depth < maxDepth) {
                                                    return
                                                }
                                                returned = handler.apply(that, args);
                                                if (returned === deferred.promise()) {
                                                    throw new TypeError("Thenable self-resolution")
                                                }
                                                then = returned && (typeof returned === "object" || typeof returned === "function") && returned.then;
                                                if (jQuery.isFunction(then)) {
                                                    if (special) {
                                                        then.call(returned, resolve(maxDepth, deferred, Identity, special), resolve(maxDepth, deferred, Thrower, special))
                                                    } else {
                                                        maxDepth++;
                                                        then.call(returned, resolve(maxDepth, deferred, Identity, special), resolve(maxDepth, deferred, Thrower, special), resolve(maxDepth, deferred, Identity, deferred.notifyWith))
                                                    }
                                                } else {
                                                    if (handler !== Identity) {
                                                        that = undefined;
                                                        args = [returned]
                                                    }(special || deferred.resolveWith)(that, args)
                                                }
                                            },
                                            process = special ? mightThrow : function() {
                                                try {
                                                    mightThrow()
                                                } catch (e) {
                                                    if (jQuery.Deferred.exceptionHook) {
                                                        jQuery.Deferred.exceptionHook(e, process.stackTrace)
                                                    }
                                                    if (depth + 1 >= maxDepth) {
                                                        if (handler !== Thrower) {
                                                            that = undefined;
                                                            args = [e]
                                                        }
                                                        deferred.rejectWith(that, args)
                                                    }
                                                }
                                            };
                                        if (depth) {
                                            process()
                                        } else {
                                            if (jQuery.Deferred.getStackHook) {
                                                process.stackTrace = jQuery.Deferred.getStackHook()
                                            }
                                            window.setTimeout(process)
                                        }
                                    }
                                }
                                return jQuery.Deferred(function(newDefer) {
                                    tuples[0][3].add(resolve(0, newDefer, jQuery.isFunction(onProgress) ? onProgress : Identity, newDefer.notifyWith));
                                    tuples[1][3].add(resolve(0, newDefer, jQuery.isFunction(onFulfilled) ? onFulfilled : Identity));
                                    tuples[2][3].add(resolve(0, newDefer, jQuery.isFunction(onRejected) ? onRejected : Thrower))
                                }).promise()
                            },
                            promise: function(obj) {
                                return obj != null ? jQuery.extend(obj, promise) : promise
                            }
                        },
                        deferred = {};
                    jQuery.each(tuples, function(i, tuple) {
                        var list = tuple[2],
                            stateString = tuple[5];
                        promise[tuple[1]] = list.add;
                        if (stateString) {
                            list.add(function() {
                                state = stateString
                            }, tuples[3 - i][2].disable, tuples[0][2].lock)
                        }
                        list.add(tuple[3].fire);
                        deferred[tuple[0]] = function() {
                            deferred[tuple[0] + "With"](this === deferred ? undefined : this, arguments);
                            return this
                        };
                        deferred[tuple[0] + "With"] = list.fireWith
                    });
                    promise.promise(deferred);
                    if (func) {
                        func.call(deferred, deferred)
                    }
                    return deferred
                },
                when: function(singleValue) {
                    var remaining = arguments.length,
                        i = remaining,
                        resolveContexts = Array(i),
                        resolveValues = slice.call(arguments),
                        master = jQuery.Deferred(),
                        updateFunc = function(i) {
                            return function(value) {
                                resolveContexts[i] = this;
                                resolveValues[i] = arguments.length > 1 ? slice.call(arguments) : value;
                                if (!--remaining) {
                                    master.resolveWith(resolveContexts, resolveValues)
                                }
                            }
                        };
                    if (remaining <= 1) {
                        adoptValue(singleValue, master.done(updateFunc(i)).resolve, master.reject, !remaining);
                        if (master.state() === "pending" || jQuery.isFunction(resolveValues[i] && resolveValues[i].then)) {
                            return master.then()
                        }
                    }
                    while (i--) {
                        adoptValue(resolveValues[i], updateFunc(i), master.reject)
                    }
                    return master.promise()
                }
            });
            var rerrorNames = /^(Eval|Internal|Range|Reference|Syntax|Type|URI)Error$/;
            jQuery.Deferred.exceptionHook = function(error, stack) {
                if (window.console && window.console.warn && error && rerrorNames.test(error.name)) {
                    window.console.warn("jQuery.Deferred exception: " + error.message, error.stack, stack)
                }
            };
            jQuery.readyException = function(error) {
                window.setTimeout(function() {
                    throw error
                })
            };
            var readyList = jQuery.Deferred();
            jQuery.fn.ready = function(fn) {
                readyList.then(fn).catch(function(error) {
                    jQuery.readyException(error)
                });
                return this
            };
            jQuery.extend({
                isReady: false,
                readyWait: 1,
                ready: function(wait) {
                    if (wait === true ? --jQuery.readyWait : jQuery.isReady) {
                        return
                    }
                    jQuery.isReady = true;
                    if (wait !== true && --jQuery.readyWait > 0) {
                        return
                    }
                    readyList.resolveWith(document, [jQuery])
                }
            });
            jQuery.ready.then = readyList.then;

            function completed() {
                document.removeEventListener("DOMContentLoaded", completed);
                window.removeEventListener("load", completed);
                jQuery.ready()
            }
            if (document.readyState === "complete" || document.readyState !== "loading" && !document.documentElement.doScroll) {
                window.setTimeout(jQuery.ready)
            } else {
                document.addEventListener("DOMContentLoaded", completed);
                window.addEventListener("load", completed)
            }
            var access = function(elems, fn, key, value, chainable, emptyGet, raw) {
                var i = 0,
                    len = elems.length,
                    bulk = key == null;
                if (jQuery.type(key) === "object") {
                    chainable = true;
                    for (i in key) {
                        access(elems, fn, i, key[i], true, emptyGet, raw)
                    }
                } else if (value !== undefined) {
                    chainable = true;
                    if (!jQuery.isFunction(value)) {
                        raw = true
                    }
                    if (bulk) {
                        if (raw) {
                            fn.call(elems, value);
                            fn = null
                        } else {
                            bulk = fn;
                            fn = function(elem, key, value) {
                                return bulk.call(jQuery(elem), value)
                            }
                        }
                    }
                    if (fn) {
                        for (; i < len; i++) {
                            fn(elems[i], key, raw ? value : value.call(elems[i], i, fn(elems[i], key)))
                        }
                    }
                }
                if (chainable) {
                    return elems
                }
                if (bulk) {
                    return fn.call(elems)
                }
                return len ? fn(elems[0], key) : emptyGet
            };
            var acceptData = function(owner) {
                return owner.nodeType === 1 || owner.nodeType === 9 || !+owner.nodeType
            };

            function Data() {
                this.expando = jQuery.expando + Data.uid++
            }
            Data.uid = 1;
            Data.prototype = {
                cache: function(owner) {
                    var value = owner[this.expando];
                    if (!value) {
                        value = {};
                        if (acceptData(owner)) {
                            if (owner.nodeType) {
                                owner[this.expando] = value
                            } else {
                                Object.defineProperty(owner, this.expando, {
                                    value: value,
                                    configurable: true
                                })
                            }
                        }
                    }
                    return value
                },
                set: function(owner, data, value) {
                    var prop, cache = this.cache(owner);
                    if (typeof data === "string") {
                        cache[jQuery.camelCase(data)] = value
                    } else {
                        for (prop in data) {
                            cache[jQuery.camelCase(prop)] = data[prop]
                        }
                    }
                    return cache
                },
                get: function(owner, key) {
                    return key === undefined ? this.cache(owner) : owner[this.expando] && owner[this.expando][jQuery.camelCase(key)]
                },
                access: function(owner, key, value) {
                    if (key === undefined || key && typeof key === "string" && value === undefined) {
                        return this.get(owner, key)
                    }
                    this.set(owner, key, value);
                    return value !== undefined ? value : key
                },
                remove: function(owner, key) {
                    var i, cache = owner[this.expando];
                    if (cache === undefined) {
                        return
                    }
                    if (key !== undefined) {
                        if (Array.isArray(key)) {
                            key = key.map(jQuery.camelCase)
                        } else {
                            key = jQuery.camelCase(key);
                            key = key in cache ? [key] : key.match(rnothtmlwhite) || []
                        }
                        i = key.length;
                        while (i--) {
                            delete cache[key[i]]
                        }
                    }
                    if (key === undefined || jQuery.isEmptyObject(cache)) {
                        if (owner.nodeType) {
                            owner[this.expando] = undefined
                        } else {
                            delete owner[this.expando]
                        }
                    }
                },
                hasData: function(owner) {
                    var cache = owner[this.expando];
                    return cache !== undefined && !jQuery.isEmptyObject(cache)
                }
            };
            var dataPriv = new Data;
            var dataUser = new Data;
            var rbrace = /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,
                rmultiDash = /[A-Z]/g;

            function getData(data) {
                if (data === "true") {
                    return true
                }
                if (data === "false") {
                    return false
                }
                if (data === "null") {
                    return null
                }
                if (data === +data + "") {
                    return +data
                }
                if (rbrace.test(data)) {
                    return JSON.parse(data)
                }
                return data
            }

            function dataAttr(elem, key, data) {
                var name;
                if (data === undefined && elem.nodeType === 1) {
                    name = "data-" + key.replace(rmultiDash, "-$&").toLowerCase();
                    data = elem.getAttribute(name);
                    if (typeof data === "string") {
                        try {
                            data = getData(data)
                        } catch (e) {}
                        dataUser.set(elem, key, data)
                    } else {
                        data = undefined
                    }
                }
                return data
            }
            jQuery.extend({
                hasData: function(elem) {
                    return dataUser.hasData(elem) || dataPriv.hasData(elem)
                },
                data: function(elem, name, data) {
                    return dataUser.access(elem, name, data)
                },
                removeData: function(elem, name) {
                    dataUser.remove(elem, name)
                },
                _data: function(elem, name, data) {
                    return dataPriv.access(elem, name, data)
                },
                _removeData: function(elem, name) {
                    dataPriv.remove(elem, name)
                }
            });
            jQuery.fn.extend({
                data: function(key, value) {
                    var i, name, data, elem = this[0],
                        attrs = elem && elem.attributes;
                    if (key === undefined) {
                        if (this.length) {
                            data = dataUser.get(elem);
                            if (elem.nodeType === 1 && !dataPriv.get(elem, "hasDataAttrs")) {
                                i = attrs.length;
                                while (i--) {
                                    if (attrs[i]) {
                                        name = attrs[i].name;
                                        if (name.indexOf("data-") === 0) {
                                            name = jQuery.camelCase(name.slice(5));
                                            dataAttr(elem, name, data[name])
                                        }
                                    }
                                }
                                dataPriv.set(elem, "hasDataAttrs", true)
                            }
                        }
                        return data
                    }
                    if (typeof key === "object") {
                        return this.each(function() {
                            dataUser.set(this, key)
                        })
                    }
                    return access(this, function(value) {
                        var data;
                        if (elem && value === undefined) {
                            data = dataUser.get(elem, key);
                            if (data !== undefined) {
                                return data
                            }
                            data = dataAttr(elem, key);
                            if (data !== undefined) {
                                return data
                            }
                            return
                        }
                        this.each(function() {
                            dataUser.set(this, key, value)
                        })
                    }, null, value, arguments.length > 1, null, true)
                },
                removeData: function(key) {
                    return this.each(function() {
                        dataUser.remove(this, key)
                    })
                }
            });
            jQuery.extend({
                queue: function(elem, type, data) {
                    var queue;
                    if (elem) {
                        type = (type || "fx") + "queue";
                        queue = dataPriv.get(elem, type);
                        if (data) {
                            if (!queue || Array.isArray(data)) {
                                queue = dataPriv.access(elem, type, jQuery.makeArray(data))
                            } else {
                                queue.push(data)
                            }
                        }
                        return queue || []
                    }
                },
                dequeue: function(elem, type) {
                    type = type || "fx";
                    var queue = jQuery.queue(elem, type),
                        startLength = queue.length,
                        fn = queue.shift(),
                        hooks = jQuery._queueHooks(elem, type),
                        next = function() {
                            jQuery.dequeue(elem, type)
                        };
                    if (fn === "inprogress") {
                        fn = queue.shift();
                        startLength--
                    }
                    if (fn) {
                        if (type === "fx") {
                            queue.unshift("inprogress")
                        }
                        delete hooks.stop;
                        fn.call(elem, next, hooks)
                    }
                    if (!startLength && hooks) {
                        hooks.empty.fire()
                    }
                },
                _queueHooks: function(elem, type) {
                    var key = type + "queueHooks";
                    return dataPriv.get(elem, key) || dataPriv.access(elem, key, {
                        empty: jQuery.Callbacks("once memory").add(function() {
                            dataPriv.remove(elem, [type + "queue", key])
                        })
                    })
                }
            });
            jQuery.fn.extend({
                queue: function(type, data) {
                    var setter = 2;
                    if (typeof type !== "string") {
                        data = type;
                        type = "fx";
                        setter--
                    }
                    if (arguments.length < setter) {
                        return jQuery.queue(this[0], type)
                    }
                    return data === undefined ? this : this.each(function() {
                        var queue = jQuery.queue(this, type, data);
                        jQuery._queueHooks(this, type);
                        if (type === "fx" && queue[0] !== "inprogress") {
                            jQuery.dequeue(this, type)
                        }
                    })
                },
                dequeue: function(type) {
                    return this.each(function() {
                        jQuery.dequeue(this, type)
                    })
                },
                clearQueue: function(type) {
                    return this.queue(type || "fx", [])
                },
                promise: function(type, obj) {
                    var tmp, count = 1,
                        defer = jQuery.Deferred(),
                        elements = this,
                        i = this.length,
                        resolve = function() {
                            if (!--count) {
                                defer.resolveWith(elements, [elements])
                            }
                        };
                    if (typeof type !== "string") {
                        obj = type;
                        type = undefined
                    }
                    type = type || "fx";
                    while (i--) {
                        tmp = dataPriv.get(elements[i], type + "queueHooks");
                        if (tmp && tmp.empty) {
                            count++;
                            tmp.empty.add(resolve)
                        }
                    }
                    resolve();
                    return defer.promise(obj)
                }
            });
            var pnum = /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source;
            var rcssNum = new RegExp("^(?:([+-])=|)(" + pnum + ")([a-z%]*)$", "i");
            var cssExpand = ["Top", "Right", "Bottom", "Left"];
            var isHiddenWithinTree = function(elem, el) {
                elem = el || elem;
                return elem.style.display === "none" || elem.style.display === "" && jQuery.contains(elem.ownerDocument, elem) && jQuery.css(elem, "display") === "none"
            };
            var swap = function(elem, options, callback, args) {
                var ret, name, old = {};
                for (name in options) {
                    old[name] = elem.style[name];
                    elem.style[name] = options[name]
                }
                ret = callback.apply(elem, args || []);
                for (name in options) {
                    elem.style[name] = old[name]
                }
                return ret
            };

            function adjustCSS(elem, prop, valueParts, tween) {
                var adjusted, scale = 1,
                    maxIterations = 20,
                    currentValue = tween ? function() {
                        return tween.cur()
                    } : function() {
                        return jQuery.css(elem, prop, "")
                    },
                    initial = currentValue(),
                    unit = valueParts && valueParts[3] || (jQuery.cssNumber[prop] ? "" : "px"),
                    initialInUnit = (jQuery.cssNumber[prop] || unit !== "px" && +initial) && rcssNum.exec(jQuery.css(elem, prop));
                if (initialInUnit && initialInUnit[3] !== unit) {
                    unit = unit || initialInUnit[3];
                    valueParts = valueParts || [];
                    initialInUnit = +initial || 1;
                    do {
                        scale = scale || ".5";
                        initialInUnit = initialInUnit / scale;
                        jQuery.style(elem, prop, initialInUnit + unit)
                    } while (scale !== (scale = currentValue() / initial) && scale !== 1 && --maxIterations)
                }
                if (valueParts) {
                    initialInUnit = +initialInUnit || +initial || 0;
                    adjusted = valueParts[1] ? initialInUnit + (valueParts[1] + 1) * valueParts[2] : +valueParts[2];
                    if (tween) {
                        tween.unit = unit;
                        tween.start = initialInUnit;
                        tween.end = adjusted
                    }
                }
                return adjusted
            }
            var defaultDisplayMap = {};

            function getDefaultDisplay(elem) {
                var temp, doc = elem.ownerDocument,
                    nodeName = elem.nodeName,
                    display = defaultDisplayMap[nodeName];
                if (display) {
                    return display
                }
                temp = doc.body.appendChild(doc.createElement(nodeName));
                display = jQuery.css(temp, "display");
                temp.parentNode.removeChild(temp);
                if (display === "none") {
                    display = "block"
                }
                defaultDisplayMap[nodeName] = display;
                return display
            }

            function showHide(elements, show) {
                var display, elem, values = [],
                    index = 0,
                    length = elements.length;
                for (; index < length; index++) {
                    elem = elements[index];
                    if (!elem.style) {
                        continue
                    }
                    display = elem.style.display;
                    if (show) {
                        if (display === "none") {
                            values[index] = dataPriv.get(elem, "display") || null;
                            if (!values[index]) {
                                elem.style.display = ""
                            }
                        }
                        if (elem.style.display === "" && isHiddenWithinTree(elem)) {
                            values[index] = getDefaultDisplay(elem)
                        }
                    } else {
                        if (display !== "none") {
                            values[index] = "none";
                            dataPriv.set(elem, "display", display)
                        }
                    }
                }
                for (index = 0; index < length; index++) {
                    if (values[index] != null) {
                        elements[index].style.display = values[index]
                    }
                }
                return elements
            }
            jQuery.fn.extend({
                show: function() {
                    return showHide(this, true)
                },
                hide: function() {
                    return showHide(this)
                },
                toggle: function(state) {
                    if (typeof state === "boolean") {
                        return state ? this.show() : this.hide()
                    }
                    return this.each(function() {
                        if (isHiddenWithinTree(this)) {
                            jQuery(this).show()
                        } else {
                            jQuery(this).hide()
                        }
                    })
                }
            });
            var rcheckableType = /^(?:checkbox|radio)$/i;
            var rtagName = /<([a-z][^\/\0>\x20\t\r\n\f]+)/i;
            var rscriptType = /^$|\/(?:java|ecma)script/i;
            var wrapMap = {
                option: [1, "<select multiple='multiple'>", "</select>"],
                thead: [1, "<table>", "</table>"],
                col: [2, "<table><colgroup>", "</colgroup></table>"],
                tr: [2, "<table><tbody>", "</tbody></table>"],
                td: [3, "<table><tbody><tr>", "</tr></tbody></table>"],
                _default: [0, "", ""]
            };
            wrapMap.optgroup = wrapMap.option;
            wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
            wrapMap.th = wrapMap.td;

            function getAll(context, tag) {
                var ret;
                if (typeof context.getElementsByTagName !== "undefined") {
                    ret = context.getElementsByTagName(tag || "*")
                } else if (typeof context.querySelectorAll !== "undefined") {
                    ret = context.querySelectorAll(tag || "*")
                } else {
                    ret = []
                }
                if (tag === undefined || tag && nodeName(context, tag)) {
                    return jQuery.merge([context], ret)
                }
                return ret
            }

            function setGlobalEval(elems, refElements) {
                var i = 0,
                    l = elems.length;
                for (; i < l; i++) {
                    dataPriv.set(elems[i], "globalEval", !refElements || dataPriv.get(refElements[i], "globalEval"))
                }
            }
            var rhtml = /<|&#?\w+;/;

            function buildFragment(elems, context, scripts, selection, ignored) {
                var elem, tmp, tag, wrap, contains, j, fragment = context.createDocumentFragment(),
                    nodes = [],
                    i = 0,
                    l = elems.length;
                for (; i < l; i++) {
                    elem = elems[i];
                    if (elem || elem === 0) {
                        if (jQuery.type(elem) === "object") {
                            jQuery.merge(nodes, elem.nodeType ? [elem] : elem)
                        } else if (!rhtml.test(elem)) {
                            nodes.push(context.createTextNode(elem))
                        } else {
                            tmp = tmp || fragment.appendChild(context.createElement("div"));
                            tag = (rtagName.exec(elem) || ["", ""])[1].toLowerCase();
                            wrap = wrapMap[tag] || wrapMap._default;
                            tmp.innerHTML = wrap[1] + jQuery.htmlPrefilter(elem) + wrap[2];
                            j = wrap[0];
                            while (j--) {
                                tmp = tmp.lastChild
                            }
                            jQuery.merge(nodes, tmp.childNodes);
                            tmp = fragment.firstChild;
                            tmp.textContent = ""
                        }
                    }
                }
                fragment.textContent = "";
                i = 0;
                while (elem = nodes[i++]) {
                    if (selection && jQuery.inArray(elem, selection) > -1) {
                        if (ignored) {
                            ignored.push(elem)
                        }
                        continue
                    }
                    contains = jQuery.contains(elem.ownerDocument, elem);
                    tmp = getAll(fragment.appendChild(elem), "script");
                    if (contains) {
                        setGlobalEval(tmp)
                    }
                    if (scripts) {
                        j = 0;
                        while (elem = tmp[j++]) {
                            if (rscriptType.test(elem.type || "")) {
                                scripts.push(elem)
                            }
                        }
                    }
                }
                return fragment
            }(function() {
                var fragment = document.createDocumentFragment(),
                    div = fragment.appendChild(document.createElement("div")),
                    input = document.createElement("input");
                input.setAttribute("type", "radio");
                input.setAttribute("checked", "checked");
                input.setAttribute("name", "t");
                div.appendChild(input);
                support.checkClone = div.cloneNode(true).cloneNode(true).lastChild.checked;
                div.innerHTML = "<textarea>x</textarea>";
                support.noCloneChecked = !!div.cloneNode(true).lastChild.defaultValue
            })();
            var documentElement = document.documentElement;
            var rkeyEvent = /^key/,
                rmouseEvent = /^(?:mouse|pointer|contextmenu|drag|drop)|click/,
                rtypenamespace = /^([^.]*)(?:\.(.+)|)/;

            function returnTrue() {
                return true
            }

            function returnFalse() {
                return false
            }

            function safeActiveElement() {
                try {
                    return document.activeElement
                } catch (err) {}
            }

            function on(elem, types, selector, data, fn, one) {
                var origFn, type;
                if (typeof types === "object") {
                    if (typeof selector !== "string") {
                        data = data || selector;
                        selector = undefined
                    }
                    for (type in types) {
                        on(elem, type, selector, data, types[type], one)
                    }
                    return elem
                }
                if (data == null && fn == null) {
                    fn = selector;
                    data = selector = undefined
                } else if (fn == null) {
                    if (typeof selector === "string") {
                        fn = data;
                        data = undefined
                    } else {
                        fn = data;
                        data = selector;
                        selector = undefined
                    }
                }
                if (fn === false) {
                    fn = returnFalse
                } else if (!fn) {
                    return elem
                }
                if (one === 1) {
                    origFn = fn;
                    fn = function(event) {
                        jQuery().off(event);
                        return origFn.apply(this, arguments)
                    };
                    fn.guid = origFn.guid || (origFn.guid = jQuery.guid++)
                }
                return elem.each(function() {
                    jQuery.event.add(this, types, fn, data, selector)
                })
            }
            jQuery.event = {
                global: {},
                add: function(elem, types, handler, data, selector) {
                    var handleObjIn, eventHandle, tmp, events, t, handleObj, special, handlers, type, namespaces, origType, elemData = dataPriv.get(elem);
                    if (!elemData) {
                        return
                    }
                    if (handler.handler) {
                        handleObjIn = handler;
                        handler = handleObjIn.handler;
                        selector = handleObjIn.selector
                    }
                    if (selector) {
                        jQuery.find.matchesSelector(documentElement, selector)
                    }
                    if (!handler.guid) {
                        handler.guid = jQuery.guid++
                    }
                    if (!(events = elemData.events)) {
                        events = elemData.events = {}
                    }
                    if (!(eventHandle = elemData.handle)) {
                        eventHandle = elemData.handle = function(e) {
                            return typeof jQuery !== "undefined" && jQuery.event.triggered !== e.type ? jQuery.event.dispatch.apply(elem, arguments) : undefined
                        }
                    }
                    types = (types || "").match(rnothtmlwhite) || [""];
                    t = types.length;
                    while (t--) {
                        tmp = rtypenamespace.exec(types[t]) || [];
                        type = origType = tmp[1];
                        namespaces = (tmp[2] || "").split(".").sort();
                        if (!type) {
                            continue
                        }
                        special = jQuery.event.special[type] || {};
                        type = (selector ? special.delegateType : special.bindType) || type;
                        special = jQuery.event.special[type] || {};
                        handleObj = jQuery.extend({
                            type: type,
                            origType: origType,
                            data: data,
                            handler: handler,
                            guid: handler.guid,
                            selector: selector,
                            needsContext: selector && jQuery.expr.match.needsContext.test(selector),
                            namespace: namespaces.join(".")
                        }, handleObjIn);
                        if (!(handlers = events[type])) {
                            handlers = events[type] = [];
                            handlers.delegateCount = 0;
                            if (!special.setup || special.setup.call(elem, data, namespaces, eventHandle) === false) {
                                if (elem.addEventListener) {
                                    elem.addEventListener(type, eventHandle)
                                }
                            }
                        }
                        if (special.add) {
                            special.add.call(elem, handleObj);
                            if (!handleObj.handler.guid) {
                                handleObj.handler.guid = handler.guid
                            }
                        }
                        if (selector) {
                            handlers.splice(handlers.delegateCount++, 0, handleObj)
                        } else {
                            handlers.push(handleObj)
                        }
                        jQuery.event.global[type] = true
                    }
                },
                remove: function(elem, types, handler, selector, mappedTypes) {
                    var j, origCount, tmp, events, t, handleObj, special, handlers, type, namespaces, origType, elemData = dataPriv.hasData(elem) && dataPriv.get(elem);
                    if (!elemData || !(events = elemData.events)) {
                        return
                    }
                    types = (types || "").match(rnothtmlwhite) || [""];
                    t = types.length;
                    while (t--) {
                        tmp = rtypenamespace.exec(types[t]) || [];
                        type = origType = tmp[1];
                        namespaces = (tmp[2] || "").split(".").sort();
                        if (!type) {
                            for (type in events) {
                                jQuery.event.remove(elem, type + types[t], handler, selector, true)
                            }
                            continue
                        }
                        special = jQuery.event.special[type] || {};
                        type = (selector ? special.delegateType : special.bindType) || type;
                        handlers = events[type] || [];
                        tmp = tmp[2] && new RegExp("(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)");
                        origCount = j = handlers.length;
                        while (j--) {
                            handleObj = handlers[j];
                            if ((mappedTypes || origType === handleObj.origType) && (!handler || handler.guid === handleObj.guid) && (!tmp || tmp.test(handleObj.namespace)) && (!selector || selector === handleObj.selector || selector === "**" && handleObj.selector)) {
                                handlers.splice(j, 1);
                                if (handleObj.selector) {
                                    handlers.delegateCount--
                                }
                                if (special.remove) {
                                    special.remove.call(elem, handleObj)
                                }
                            }
                        }
                        if (origCount && !handlers.length) {
                            if (!special.teardown || special.teardown.call(elem, namespaces, elemData.handle) === false) {
                                jQuery.removeEvent(elem, type, elemData.handle)
                            }
                            delete events[type]
                        }
                    }
                    if (jQuery.isEmptyObject(events)) {
                        dataPriv.remove(elem, "handle events")
                    }
                },
                dispatch: function(nativeEvent) {
                    var event = jQuery.event.fix(nativeEvent);
                    var i, j, ret, matched, handleObj, handlerQueue, args = new Array(arguments.length),
                        handlers = (dataPriv.get(this, "events") || {})[event.type] || [],
                        special = jQuery.event.special[event.type] || {};
                    args[0] = event;
                    for (i = 1; i < arguments.length; i++) {
                        args[i] = arguments[i]
                    }
                    event.delegateTarget = this;
                    if (special.preDispatch && special.preDispatch.call(this, event) === false) {
                        return
                    }
                    handlerQueue = jQuery.event.handlers.call(this, event, handlers);
                    i = 0;
                    while ((matched = handlerQueue[i++]) && !event.isPropagationStopped()) {
                        event.currentTarget = matched.elem;
                        j = 0;
                        while ((handleObj = matched.handlers[j++]) && !event.isImmediatePropagationStopped()) {
                            if (!event.rnamespace || event.rnamespace.test(handleObj.namespace)) {
                                event.handleObj = handleObj;
                                event.data = handleObj.data;
                                ret = ((jQuery.event.special[handleObj.origType] || {}).handle || handleObj.handler).apply(matched.elem, args);
                                if (ret !== undefined) {
                                    if ((event.result = ret) === false) {
                                        event.preventDefault();
                                        event.stopPropagation()
                                    }
                                }
                            }
                        }
                    }
                    if (special.postDispatch) {
                        special.postDispatch.call(this, event)
                    }
                    return event.result
                },
                handlers: function(event, handlers) {
                    var i, handleObj, sel, matchedHandlers, matchedSelectors, handlerQueue = [],
                        delegateCount = handlers.delegateCount,
                        cur = event.target;
                    if (delegateCount && cur.nodeType && !(event.type === "click" && event.button >= 1)) {
                        for (; cur !== this; cur = cur.parentNode || this) {
                            if (cur.nodeType === 1 && !(event.type === "click" && cur.disabled === true)) {
                                matchedHandlers = [];
                                matchedSelectors = {};
                                for (i = 0; i < delegateCount; i++) {
                                    handleObj = handlers[i];
                                    sel = handleObj.selector + " ";
                                    if (matchedSelectors[sel] === undefined) {
                                        matchedSelectors[sel] = handleObj.needsContext ? jQuery(sel, this).index(cur) > -1 : jQuery.find(sel, this, null, [cur]).length
                                    }
                                    if (matchedSelectors[sel]) {
                                        matchedHandlers.push(handleObj)
                                    }
                                }
                                if (matchedHandlers.length) {
                                    handlerQueue.push({
                                        elem: cur,
                                        handlers: matchedHandlers
                                    })
                                }
                            }
                        }
                    }
                    cur = this;
                    if (delegateCount < handlers.length) {
                        handlerQueue.push({
                            elem: cur,
                            handlers: handlers.slice(delegateCount)
                        })
                    }
                    return handlerQueue
                },
                addProp: function(name, hook) {
                    Object.defineProperty(jQuery.Event.prototype, name, {
                        enumerable: true,
                        configurable: true,
                        get: jQuery.isFunction(hook) ? function() {
                            if (this.originalEvent) {
                                return hook(this.originalEvent)
                            }
                        } : function() {
                            if (this.originalEvent) {
                                return this.originalEvent[name]
                            }
                        },
                        set: function(value) {
                            Object.defineProperty(this, name, {
                                enumerable: true,
                                configurable: true,
                                writable: true,
                                value: value
                            })
                        }
                    })
                },
                fix: function(originalEvent) {
                    return originalEvent[jQuery.expando] ? originalEvent : new jQuery.Event(originalEvent)
                },
                special: {
                    load: {
                        noBubble: true
                    },
                    focus: {
                        trigger: function() {
                            if (this !== safeActiveElement() && this.focus) {
                                this.focus();
                                return false
                            }
                        },
                        delegateType: "focusin"
                    },
                    blur: {
                        trigger: function() {
                            if (this === safeActiveElement() && this.blur) {
                                this.blur();
                                return false
                            }
                        },
                        delegateType: "focusout"
                    },
                    click: {
                        trigger: function() {
                            if (this.type === "checkbox" && this.click && nodeName(this, "input")) {
                                this.click();
                                return false
                            }
                        },
                        _default: function(event) {
                            return nodeName(event.target, "a")
                        }
                    },
                    beforeunload: {
                        postDispatch: function(event) {
                            if (event.result !== undefined && event.originalEvent) {
                                event.originalEvent.returnValue = event.result
                            }
                        }
                    }
                }
            };
            jQuery.removeEvent = function(elem, type, handle) {
                if (elem.removeEventListener) {
                    elem.removeEventListener(type, handle)
                }
            };
            jQuery.Event = function(src, props) {
                if (!(this instanceof jQuery.Event)) {
                    return new jQuery.Event(src, props)
                }
                if (src && src.type) {
                    this.originalEvent = src;
                    this.type = src.type;
                    this.isDefaultPrevented = src.defaultPrevented || src.defaultPrevented === undefined && src.returnValue === false ? returnTrue : returnFalse;
                    this.target = src.target && src.target.nodeType === 3 ? src.target.parentNode : src.target;
                    this.currentTarget = src.currentTarget;
                    this.relatedTarget = src.relatedTarget
                } else {
                    this.type = src
                }
                if (props) {
                    jQuery.extend(this, props)
                }
                this.timeStamp = src && src.timeStamp || jQuery.now();
                this[jQuery.expando] = true
            };
            jQuery.Event.prototype = {
                constructor: jQuery.Event,
                isDefaultPrevented: returnFalse,
                isPropagationStopped: returnFalse,
                isImmediatePropagationStopped: returnFalse,
                isSimulated: false,
                preventDefault: function() {
                    var e = this.originalEvent;
                    this.isDefaultPrevented = returnTrue;
                    if (e && !this.isSimulated) {
                        e.preventDefault()
                    }
                },
                stopPropagation: function() {
                    var e = this.originalEvent;
                    this.isPropagationStopped = returnTrue;
                    if (e && !this.isSimulated) {
                        e.stopPropagation()
                    }
                },
                stopImmediatePropagation: function() {
                    var e = this.originalEvent;
                    this.isImmediatePropagationStopped = returnTrue;
                    if (e && !this.isSimulated) {
                        e.stopImmediatePropagation()
                    }
                    this.stopPropagation()
                }
            };
            jQuery.each({
                altKey: true,
                bubbles: true,
                cancelable: true,
                changedTouches: true,
                ctrlKey: true,
                detail: true,
                eventPhase: true,
                metaKey: true,
                pageX: true,
                pageY: true,
                shiftKey: true,
                view: true,
                char: true,
                charCode: true,
                key: true,
                keyCode: true,
                button: true,
                buttons: true,
                clientX: true,
                clientY: true,
                offsetX: true,
                offsetY: true,
                pointerId: true,
                pointerType: true,
                screenX: true,
                screenY: true,
                targetTouches: true,
                toElement: true,
                touches: true,
                which: function(event) {
                    var button = event.button;
                    if (event.which == null && rkeyEvent.test(event.type)) {
                        return event.charCode != null ? event.charCode : event.keyCode
                    }
                    if (!event.which && button !== undefined && rmouseEvent.test(event.type)) {
                        if (button & 1) {
                            return 1
                        }
                        if (button & 2) {
                            return 3
                        }
                        if (button & 4) {
                            return 2
                        }
                        return 0
                    }
                    return event.which
                }
            }, jQuery.event.addProp);
            jQuery.each({
                mouseenter: "mouseover",
                mouseleave: "mouseout",
                pointerenter: "pointerover",
                pointerleave: "pointerout"
            }, function(orig, fix) {
                jQuery.event.special[orig] = {
                    delegateType: fix,
                    bindType: fix,
                    handle: function(event) {
                        var ret, target = this,
                            related = event.relatedTarget,
                            handleObj = event.handleObj;
                        if (!related || related !== target && !jQuery.contains(target, related)) {
                            event.type = handleObj.origType;
                            ret = handleObj.handler.apply(this, arguments);
                            event.type = fix
                        }
                        return ret
                    }
                }
            });
            jQuery.fn.extend({
                on: function(types, selector, data, fn) {
                    return on(this, types, selector, data, fn)
                },
                one: function(types, selector, data, fn) {
                    return on(this, types, selector, data, fn, 1)
                },
                off: function(types, selector, fn) {
                    var handleObj, type;
                    if (types && types.preventDefault && types.handleObj) {
                        handleObj = types.handleObj;
                        jQuery(types.delegateTarget).off(handleObj.namespace ? handleObj.origType + "." + handleObj.namespace : handleObj.origType, handleObj.selector, handleObj.handler);
                        return this
                    }
                    if (typeof types === "object") {
                        for (type in types) {
                            this.off(type, selector, types[type])
                        }
                        return this
                    }
                    if (selector === false || typeof selector === "function") {
                        fn = selector;
                        selector = undefined
                    }
                    if (fn === false) {
                        fn = returnFalse
                    }
                    return this.each(function() {
                        jQuery.event.remove(this, types, fn, selector)
                    })
                }
            });
            var rxhtmlTag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([a-z][^\/\0>\x20\t\r\n\f]*)[^>]*)\/>/gi,
                rnoInnerhtml = /<script|<style|<link/i,
                rchecked = /checked\s*(?:[^=]|=\s*.checked.)/i,
                rscriptTypeMasked = /^true\/(.*)/,
                rcleanScript = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g;

            function manipulationTarget(elem, content) {
                if (nodeName(elem, "table") && nodeName(content.nodeType !== 11 ? content : content.firstChild, "tr")) {
                    return jQuery(">tbody", elem)[0] || elem
                }
                return elem
            }

            function disableScript(elem) {
                elem.type = (elem.getAttribute("type") !== null) + "/" + elem.type;
                return elem
            }

            function restoreScript(elem) {
                var match = rscriptTypeMasked.exec(elem.type);
                if (match) {
                    elem.type = match[1]
                } else {
                    elem.removeAttribute("type")
                }
                return elem
            }

            function cloneCopyEvent(src, dest) {
                var i, l, type, pdataOld, pdataCur, udataOld, udataCur, events;
                if (dest.nodeType !== 1) {
                    return
                }
                if (dataPriv.hasData(src)) {
                    pdataOld = dataPriv.access(src);
                    pdataCur = dataPriv.set(dest, pdataOld);
                    events = pdataOld.events;
                    if (events) {
                        delete pdataCur.handle;
                        pdataCur.events = {};
                        for (type in events) {
                            for (i = 0, l = events[type].length; i < l; i++) {
                                jQuery.event.add(dest, type, events[type][i])
                            }
                        }
                    }
                }
                if (dataUser.hasData(src)) {
                    udataOld = dataUser.access(src);
                    udataCur = jQuery.extend({}, udataOld);
                    dataUser.set(dest, udataCur)
                }
            }

            function fixInput(src, dest) {
                var nodeName = dest.nodeName.toLowerCase();
                if (nodeName === "input" && rcheckableType.test(src.type)) {
                    dest.checked = src.checked
                } else if (nodeName === "input" || nodeName === "textarea") {
                    dest.defaultValue = src.defaultValue
                }
            }

            function domManip(collection, args, callback, ignored) {
                args = concat.apply([], args);
                var fragment, first, scripts, hasScripts, node, doc, i = 0,
                    l = collection.length,
                    iNoClone = l - 1,
                    value = args[0],
                    isFunction = jQuery.isFunction(value);
                if (isFunction || l > 1 && typeof value === "string" && !support.checkClone && rchecked.test(value)) {
                    return collection.each(function(index) {
                        var self = collection.eq(index);
                        if (isFunction) {
                            args[0] = value.call(this, index, self.html())
                        }
                        domManip(self, args, callback, ignored)
                    })
                }
                if (l) {
                    fragment = buildFragment(args, collection[0].ownerDocument, false, collection, ignored);
                    first = fragment.firstChild;
                    if (fragment.childNodes.length === 1) {
                        fragment = first
                    }
                    if (first || ignored) {
                        scripts = jQuery.map(getAll(fragment, "script"), disableScript);
                        hasScripts = scripts.length;
                        for (; i < l; i++) {
                            node = fragment;
                            if (i !== iNoClone) {
                                node = jQuery.clone(node, true, true);
                                if (hasScripts) {
                                    jQuery.merge(scripts, getAll(node, "script"))
                                }
                            }
                            callback.call(collection[i], node, i)
                        }
                        if (hasScripts) {
                            doc = scripts[scripts.length - 1].ownerDocument;
                            jQuery.map(scripts, restoreScript);
                            for (i = 0; i < hasScripts; i++) {
                                node = scripts[i];
                                if (rscriptType.test(node.type || "") && !dataPriv.access(node, "globalEval") && jQuery.contains(doc, node)) {
                                    if (node.src) {
                                        if (jQuery._evalUrl) {
                                            jQuery._evalUrl(node.src)
                                        }
                                    } else {
                                        DOMEval(node.textContent.replace(rcleanScript, ""), doc)
                                    }
                                }
                            }
                        }
                    }
                }
                return collection
            }

            function remove(elem, selector, keepData) {
                var node, nodes = selector ? jQuery.filter(selector, elem) : elem,
                    i = 0;
                for (;
                    (node = nodes[i]) != null; i++) {
                    if (!keepData && node.nodeType === 1) {
                        jQuery.cleanData(getAll(node))
                    }
                    if (node.parentNode) {
                        if (keepData && jQuery.contains(node.ownerDocument, node)) {
                            setGlobalEval(getAll(node, "script"))
                        }
                        node.parentNode.removeChild(node)
                    }
                }
                return elem
            }
            jQuery.extend({
                htmlPrefilter: function(html) {
                    return html.replace(rxhtmlTag, "<$1></$2>")
                },
                clone: function(elem, dataAndEvents, deepDataAndEvents) {
                    var i, l, srcElements, destElements, clone = elem.cloneNode(true),
                        inPage = jQuery.contains(elem.ownerDocument, elem);
                    if (!support.noCloneChecked && (elem.nodeType === 1 || elem.nodeType === 11) && !jQuery.isXMLDoc(elem)) {
                        destElements = getAll(clone);
                        srcElements = getAll(elem);
                        for (i = 0, l = srcElements.length; i < l; i++) {
                            fixInput(srcElements[i], destElements[i])
                        }
                    }
                    if (dataAndEvents) {
                        if (deepDataAndEvents) {
                            srcElements = srcElements || getAll(elem);
                            destElements = destElements || getAll(clone);
                            for (i = 0, l = srcElements.length; i < l; i++) {
                                cloneCopyEvent(srcElements[i], destElements[i])
                            }
                        } else {
                            cloneCopyEvent(elem, clone)
                        }
                    }
                    destElements = getAll(clone, "script");
                    if (destElements.length > 0) {
                        setGlobalEval(destElements, !inPage && getAll(elem, "script"))
                    }
                    return clone
                },
                cleanData: function(elems) {
                    var data, elem, type, special = jQuery.event.special,
                        i = 0;
                    for (;
                        (elem = elems[i]) !== undefined; i++) {
                        if (acceptData(elem)) {
                            if (data = elem[dataPriv.expando]) {
                                if (data.events) {
                                    for (type in data.events) {
                                        if (special[type]) {
                                            jQuery.event.remove(elem, type)
                                        } else {
                                            jQuery.removeEvent(elem, type, data.handle)
                                        }
                                    }
                                }
                                elem[dataPriv.expando] = undefined
                            }
                            if (elem[dataUser.expando]) {
                                elem[dataUser.expando] = undefined
                            }
                        }
                    }
                }
            });
            jQuery.fn.extend({
                detach: function(selector) {
                    return remove(this, selector, true)
                },
                remove: function(selector) {
                    return remove(this, selector)
                },
                text: function(value) {
                    return access(this, function(value) {
                        return value === undefined ? jQuery.text(this) : this.empty().each(function() {
                            if (this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9) {
                                this.textContent = value
                            }
                        })
                    }, null, value, arguments.length)
                },
                append: function() {
                    return domManip(this, arguments, function(elem) {
                        if (this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9) {
                            var target = manipulationTarget(this, elem);
                            target.appendChild(elem)
                        }
                    })
                },
                prepend: function() {
                    return domManip(this, arguments, function(elem) {
                        if (this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9) {
                            var target = manipulationTarget(this, elem);
                            target.insertBefore(elem, target.firstChild)
                        }
                    })
                },
                before: function() {
                    return domManip(this, arguments, function(elem) {
                        if (this.parentNode) {
                            this.parentNode.insertBefore(elem, this)
                        }
                    })
                },
                after: function() {
                    return domManip(this, arguments, function(elem) {
                        if (this.parentNode) {
                            this.parentNode.insertBefore(elem, this.nextSibling)
                        }
                    })
                },
                empty: function() {
                    var elem, i = 0;
                    for (;
                        (elem = this[i]) != null; i++) {
                        if (elem.nodeType === 1) {
                            jQuery.cleanData(getAll(elem, false));
                            elem.textContent = ""
                        }
                    }
                    return this
                },
                clone: function(dataAndEvents, deepDataAndEvents) {
                    dataAndEvents = dataAndEvents == null ? false : dataAndEvents;
                    deepDataAndEvents = deepDataAndEvents == null ? dataAndEvents : deepDataAndEvents;
                    return this.map(function() {
                        return jQuery.clone(this, dataAndEvents, deepDataAndEvents)
                    })
                },
                html: function(value) {
                    return access(this, function(value) {
                        var elem = this[0] || {},
                            i = 0,
                            l = this.length;
                        if (value === undefined && elem.nodeType === 1) {
                            return elem.innerHTML
                        }
                        if (typeof value === "string" && !rnoInnerhtml.test(value) && !wrapMap[(rtagName.exec(value) || ["", ""])[1].toLowerCase()]) {
                            value = jQuery.htmlPrefilter(value);
                            try {
                                for (; i < l; i++) {
                                    elem = this[i] || {};
                                    if (elem.nodeType === 1) {
                                        jQuery.cleanData(getAll(elem, false));
                                        elem.innerHTML = value
                                    }
                                }
                                elem = 0
                            } catch (e) {}
                        }
                        if (elem) {
                            this.empty().append(value)
                        }
                    }, null, value, arguments.length)
                },
                replaceWith: function() {
                    var ignored = [];
                    return domManip(this, arguments, function(elem) {
                        var parent = this.parentNode;
                        if (jQuery.inArray(this, ignored) < 0) {
                            jQuery.cleanData(getAll(this));
                            if (parent) {
                                parent.replaceChild(elem, this)
                            }
                        }
                    }, ignored)
                }
            });
            jQuery.each({
                appendTo: "append",
                prependTo: "prepend",
                insertBefore: "before",
                insertAfter: "after",
                replaceAll: "replaceWith"
            }, function(name, original) {
                jQuery.fn[name] = function(selector) {
                    var elems, ret = [],
                        insert = jQuery(selector),
                        last = insert.length - 1,
                        i = 0;
                    for (; i <= last; i++) {
                        elems = i === last ? this : this.clone(true);
                        jQuery(insert[i])[original](elems);
                        push.apply(ret, elems.get())
                    }
                    return this.pushStack(ret)
                }
            });
            var rmargin = /^margin/;
            var rnumnonpx = new RegExp("^(" + pnum + ")(?!px)[a-z%]+$", "i");
            var getStyles = function(elem) {
                var view = elem.ownerDocument.defaultView;
                if (!view || !view.opener) {
                    view = window
                }
                return view.getComputedStyle(elem)
            };
            (function() {
                function computeStyleTests() {
                    if (!div) {
                        return
                    }
                    div.style.cssText = "box-sizing:border-box;" + "position:relative;display:block;" + "margin:auto;border:1px;padding:1px;" + "top:1%;width:50%";
                    div.innerHTML = "";
                    documentElement.appendChild(container);
                    var divStyle = window.getComputedStyle(div);
                    pixelPositionVal = divStyle.top !== "1%";
                    reliableMarginLeftVal = divStyle.marginLeft === "2px";
                    boxSizingReliableVal = divStyle.width === "4px";
                    div.style.marginRight = "50%";
                    pixelMarginRightVal = divStyle.marginRight === "4px";
                    documentElement.removeChild(container);
                    div = null
                }
                var pixelPositionVal, boxSizingReliableVal, pixelMarginRightVal, reliableMarginLeftVal, container = document.createElement("div"),
                    div = document.createElement("div");
                if (!div.style) {
                    return
                }
                div.style.backgroundClip = "content-box";
                div.cloneNode(true).style.backgroundClip = "";
                support.clearCloneStyle = div.style.backgroundClip === "content-box";
                container.style.cssText = "border:0;width:8px;height:0;top:0;left:-9999px;" + "padding:0;margin-top:1px;position:absolute";
                container.appendChild(div);
                jQuery.extend(support, {
                    pixelPosition: function() {
                        computeStyleTests();
                        return pixelPositionVal
                    },
                    boxSizingReliable: function() {
                        computeStyleTests();
                        return boxSizingReliableVal
                    },
                    pixelMarginRight: function() {
                        computeStyleTests();
                        return pixelMarginRightVal
                    },
                    reliableMarginLeft: function() {
                        computeStyleTests();
                        return reliableMarginLeftVal
                    }
                })
            })();

            function curCSS(elem, name, computed) {
                var width, minWidth, maxWidth, ret, style = elem.style;
                computed = computed || getStyles(elem);
                if (computed) {
                    ret = computed.getPropertyValue(name) || computed[name];
                    if (ret === "" && !jQuery.contains(elem.ownerDocument, elem)) {
                        ret = jQuery.style(elem, name)
                    }
                    if (!support.pixelMarginRight() && rnumnonpx.test(ret) && rmargin.test(name)) {
                        width = style.width;
                        minWidth = style.minWidth;
                        maxWidth = style.maxWidth;
                        style.minWidth = style.maxWidth = style.width = ret;
                        ret = computed.width;
                        style.width = width;
                        style.minWidth = minWidth;
                        style.maxWidth = maxWidth
                    }
                }
                return ret !== undefined ? ret + "" : ret
            }

            function addGetHookIf(conditionFn, hookFn) {
                return {
                    get: function() {
                        if (conditionFn()) {
                            delete this.get;
                            return
                        }
                        return (this.get = hookFn).apply(this, arguments)
                    }
                }
            }
            var rdisplayswap = /^(none|table(?!-c[ea]).+)/,
                rcustomProp = /^--/,
                cssShow = {
                    position: "absolute",
                    visibility: "hidden",
                    display: "block"
                },
                cssNormalTransform = {
                    letterSpacing: "0",
                    fontWeight: "400"
                },
                cssPrefixes = ["Webkit", "Moz", "ms"],
                emptyStyle = document.createElement("div").style;

            function vendorPropName(name) {
                if (name in emptyStyle) {
                    return name
                }
                var capName = name[0].toUpperCase() + name.slice(1),
                    i = cssPrefixes.length;
                while (i--) {
                    name = cssPrefixes[i] + capName;
                    if (name in emptyStyle) {
                        return name
                    }
                }
            }

            function finalPropName(name) {
                var ret = jQuery.cssProps[name];
                if (!ret) {
                    ret = jQuery.cssProps[name] = vendorPropName(name) || name
                }
                return ret
            }

            function setPositiveNumber(elem, value, subtract) {
                var matches = rcssNum.exec(value);
                return matches ? Math.max(0, matches[2] - (subtract || 0)) + (matches[3] || "px") : value
            }

            function augmentWidthOrHeight(elem, name, extra, isBorderBox, styles) {
                var i, val = 0;
                if (extra === (isBorderBox ? "border" : "content")) {
                    i = 4
                } else {
                    i = name === "width" ? 1 : 0
                }
                for (; i < 4; i += 2) {
                    if (extra === "margin") {
                        val += jQuery.css(elem, extra + cssExpand[i], true, styles)
                    }
                    if (isBorderBox) {
                        if (extra === "content") {
                            val -= jQuery.css(elem, "padding" + cssExpand[i], true, styles)
                        }
                        if (extra !== "margin") {
                            val -= jQuery.css(elem, "border" + cssExpand[i] + "Width", true, styles)
                        }
                    } else {
                        val += jQuery.css(elem, "padding" + cssExpand[i], true, styles);
                        if (extra !== "padding") {
                            val += jQuery.css(elem, "border" + cssExpand[i] + "Width", true, styles)
                        }
                    }
                }
                return val
            }

            function getWidthOrHeight(elem, name, extra) {
                var valueIsBorderBox, styles = getStyles(elem),
                    val = curCSS(elem, name, styles),
                    isBorderBox = jQuery.css(elem, "boxSizing", false, styles) === "border-box";
                if (rnumnonpx.test(val)) {
                    return val
                }
                valueIsBorderBox = isBorderBox && (support.boxSizingReliable() || val === elem.style[name]);
                if (val === "auto") {
                    val = elem["offset" + name[0].toUpperCase() + name.slice(1)]
                }
                val = parseFloat(val) || 0;
                return val + augmentWidthOrHeight(elem, name, extra || (isBorderBox ? "border" : "content"), valueIsBorderBox, styles) + "px"
            }
            jQuery.extend({
                cssHooks: {
                    opacity: {
                        get: function(elem, computed) {
                            if (computed) {
                                var ret = curCSS(elem, "opacity");
                                return ret === "" ? "1" : ret
                            }
                        }
                    }
                },
                cssNumber: {
                    animationIterationCount: true,
                    columnCount: true,
                    fillOpacity: true,
                    flexGrow: true,
                    flexShrink: true,
                    fontWeight: true,
                    lineHeight: true,
                    opacity: true,
                    order: true,
                    orphans: true,
                    widows: true,
                    zIndex: true,
                    zoom: true
                },
                cssProps: {
                    float: "cssFloat"
                },
                style: function(elem, name, value, extra) {
                    if (!elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style) {
                        return
                    }
                    var ret, type, hooks, origName = jQuery.camelCase(name),
                        isCustomProp = rcustomProp.test(name),
                        style = elem.style;
                    if (!isCustomProp) {
                        name = finalPropName(origName)
                    }
                    hooks = jQuery.cssHooks[name] || jQuery.cssHooks[origName];
                    if (value !== undefined) {
                        type = typeof value;
                        if (type === "string" && (ret = rcssNum.exec(value)) && ret[1]) {
                            value = adjustCSS(elem, name, ret);
                            type = "number"
                        }
                        if (value == null || value !== value) {
                            return
                        }
                        if (type === "number") {
                            value += ret && ret[3] || (jQuery.cssNumber[origName] ? "" : "px")
                        }
                        if (!support.clearCloneStyle && value === "" && name.indexOf("background") === 0) {
                            style[name] = "inherit"
                        }
                        if (!hooks || !("set" in hooks) || (value = hooks.set(elem, value, extra)) !== undefined) {
                            if (isCustomProp) {
                                style.setProperty(name, value)
                            } else {
                                style[name] = value
                            }
                        }
                    } else {
                        if (hooks && "get" in hooks && (ret = hooks.get(elem, false, extra)) !== undefined) {
                            return ret
                        }
                        return style[name]
                    }
                },
                css: function(elem, name, extra, styles) {
                    var val, num, hooks, origName = jQuery.camelCase(name),
                        isCustomProp = rcustomProp.test(name);
                    if (!isCustomProp) {
                        name = finalPropName(origName)
                    }
                    hooks = jQuery.cssHooks[name] || jQuery.cssHooks[origName];
                    if (hooks && "get" in hooks) {
                        val = hooks.get(elem, true, extra)
                    }
                    if (val === undefined) {
                        val = curCSS(elem, name, styles)
                    }
                    if (val === "normal" && name in cssNormalTransform) {
                        val = cssNormalTransform[name]
                    }
                    if (extra === "" || extra) {
                        num = parseFloat(val);
                        return extra === true || isFinite(num) ? num || 0 : val
                    }
                    return val
                }
            });
            jQuery.each(["height", "width"], function(i, name) {
                jQuery.cssHooks[name] = {
                    get: function(elem, computed, extra) {
                        if (computed) {
                            return rdisplayswap.test(jQuery.css(elem, "display")) && (!elem.getClientRects().length || !elem.getBoundingClientRect().width) ? swap(elem, cssShow, function() {
                                return getWidthOrHeight(elem, name, extra)
                            }) : getWidthOrHeight(elem, name, extra)
                        }
                    },
                    set: function(elem, value, extra) {
                        var matches, styles = extra && getStyles(elem),
                            subtract = extra && augmentWidthOrHeight(elem, name, extra, jQuery.css(elem, "boxSizing", false, styles) === "border-box", styles);
                        if (subtract && (matches = rcssNum.exec(value)) && (matches[3] || "px") !== "px") {
                            elem.style[name] = value;
                            value = jQuery.css(elem, name)
                        }
                        return setPositiveNumber(elem, value, subtract)
                    }
                }
            });
            jQuery.cssHooks.marginLeft = addGetHookIf(support.reliableMarginLeft, function(elem, computed) {
                if (computed) {
                    return (parseFloat(curCSS(elem, "marginLeft")) || elem.getBoundingClientRect().left - swap(elem, {
                        marginLeft: 0
                    }, function() {
                        return elem.getBoundingClientRect().left
                    })) + "px"
                }
            });
            jQuery.each({
                margin: "",
                padding: "",
                border: "Width"
            }, function(prefix, suffix) {
                jQuery.cssHooks[prefix + suffix] = {
                    expand: function(value) {
                        var i = 0,
                            expanded = {},
                            parts = typeof value === "string" ? value.split(" ") : [value];
                        for (; i < 4; i++) {
                            expanded[prefix + cssExpand[i] + suffix] = parts[i] || parts[i - 2] || parts[0]
                        }
                        return expanded
                    }
                };
                if (!rmargin.test(prefix)) {
                    jQuery.cssHooks[prefix + suffix].set = setPositiveNumber
                }
            });
            jQuery.fn.extend({
                css: function(name, value) {
                    return access(this, function(elem, name, value) {
                        var styles, len, map = {},
                            i = 0;
                        if (Array.isArray(name)) {
                            styles = getStyles(elem);
                            len = name.length;
                            for (; i < len; i++) {
                                map[name[i]] = jQuery.css(elem, name[i], false, styles)
                            }
                            return map
                        }
                        return value !== undefined ? jQuery.style(elem, name, value) : jQuery.css(elem, name)
                    }, name, value, arguments.length > 1)
                }
            });

            function Tween(elem, options, prop, end, easing) {
                return new Tween.prototype.init(elem, options, prop, end, easing)
            }
            jQuery.Tween = Tween;
            Tween.prototype = {
                constructor: Tween,
                init: function(elem, options, prop, end, easing, unit) {
                    this.elem = elem;
                    this.prop = prop;
                    this.easing = easing || jQuery.easing._default;
                    this.options = options;
                    this.start = this.now = this.cur();
                    this.end = end;
                    this.unit = unit || (jQuery.cssNumber[prop] ? "" : "px")
                },
                cur: function() {
                    var hooks = Tween.propHooks[this.prop];
                    return hooks && hooks.get ? hooks.get(this) : Tween.propHooks._default.get(this)
                },
                run: function(percent) {
                    var eased, hooks = Tween.propHooks[this.prop];
                    if (this.options.duration) {
                        this.pos = eased = jQuery.easing[this.easing](percent, this.options.duration * percent, 0, 1, this.options.duration)
                    } else {
                        this.pos = eased = percent
                    }
                    this.now = (this.end - this.start) * eased + this.start;
                    if (this.options.step) {
                        this.options.step.call(this.elem, this.now, this)
                    }
                    if (hooks && hooks.set) {
                        hooks.set(this)
                    } else {
                        Tween.propHooks._default.set(this)
                    }
                    return this
                }
            };
            Tween.prototype.init.prototype = Tween.prototype;
            Tween.propHooks = {
                _default: {
                    get: function(tween) {
                        var result;
                        if (tween.elem.nodeType !== 1 || tween.elem[tween.prop] != null && tween.elem.style[tween.prop] == null) {
                            return tween.elem[tween.prop]
                        }
                        result = jQuery.css(tween.elem, tween.prop, "");
                        return !result || result === "auto" ? 0 : result
                    },
                    set: function(tween) {
                        if (jQuery.fx.step[tween.prop]) {
                            jQuery.fx.step[tween.prop](tween)
                        } else if (tween.elem.nodeType === 1 && (tween.elem.style[jQuery.cssProps[tween.prop]] != null || jQuery.cssHooks[tween.prop])) {
                            jQuery.style(tween.elem, tween.prop, tween.now + tween.unit)
                        } else {
                            tween.elem[tween.prop] = tween.now
                        }
                    }
                }
            };
            Tween.propHooks.scrollTop = Tween.propHooks.scrollLeft = {
                set: function(tween) {
                    if (tween.elem.nodeType && tween.elem.parentNode) {
                        tween.elem[tween.prop] = tween.now
                    }
                }
            };
            jQuery.easing = {
                linear: function(p) {
                    return p
                },
                swing: function(p) {
                    return .5 - Math.cos(p * Math.PI) / 2
                },
                _default: "swing"
            };
            jQuery.fx = Tween.prototype.init;
            jQuery.fx.step = {};
            var fxNow, inProgress, rfxtypes = /^(?:toggle|show|hide)$/,
                rrun = /queueHooks$/;

            function schedule() {
                if (inProgress) {
                    if (document.hidden === false && window.requestAnimationFrame) {
                        window.requestAnimationFrame(schedule)
                    } else {
                        window.setTimeout(schedule, jQuery.fx.interval)
                    }
                    jQuery.fx.tick()
                }
            }

            function createFxNow() {
                window.setTimeout(function() {
                    fxNow = undefined
                });
                return fxNow = jQuery.now()
            }

            function genFx(type, includeWidth) {
                var which, i = 0,
                    attrs = {
                        height: type
                    };
                includeWidth = includeWidth ? 1 : 0;
                for (; i < 4; i += 2 - includeWidth) {
                    which = cssExpand[i];
                    attrs["margin" + which] = attrs["padding" + which] = type
                }
                if (includeWidth) {
                    attrs.opacity = attrs.width = type
                }
                return attrs
            }

            function createTween(value, prop, animation) {
                var tween, collection = (Animation.tweeners[prop] || []).concat(Animation.tweeners["*"]),
                    index = 0,
                    length = collection.length;
                for (; index < length; index++) {
                    if (tween = collection[index].call(animation, prop, value)) {
                        return tween
                    }
                }
            }

            function defaultPrefilter(elem, props, opts) {
                var prop, value, toggle, hooks, oldfire, propTween, restoreDisplay, display, isBox = "width" in props || "height" in props,
                    anim = this,
                    orig = {},
                    style = elem.style,
                    hidden = elem.nodeType && isHiddenWithinTree(elem),
                    dataShow = dataPriv.get(elem, "fxshow");
                if (!opts.queue) {
                    hooks = jQuery._queueHooks(elem, "fx");
                    if (hooks.unqueued == null) {
                        hooks.unqueued = 0;
                        oldfire = hooks.empty.fire;
                        hooks.empty.fire = function() {
                            if (!hooks.unqueued) {
                                oldfire()
                            }
                        }
                    }
                    hooks.unqueued++;
                    anim.always(function() {
                        anim.always(function() {
                            hooks.unqueued--;
                            if (!jQuery.queue(elem, "fx").length) {
                                hooks.empty.fire()
                            }
                        })
                    })
                }
                for (prop in props) {
                    value = props[prop];
                    if (rfxtypes.test(value)) {
                        delete props[prop];
                        toggle = toggle || value === "toggle";
                        if (value === (hidden ? "hide" : "show")) {
                            if (value === "show" && dataShow && dataShow[prop] !== undefined) {
                                hidden = true
                            } else {
                                continue
                            }
                        }
                        orig[prop] = dataShow && dataShow[prop] || jQuery.style(elem, prop)
                    }
                }
                propTween = !jQuery.isEmptyObject(props);
                if (!propTween && jQuery.isEmptyObject(orig)) {
                    return
                }
                if (isBox && elem.nodeType === 1) {
                    opts.overflow = [style.overflow, style.overflowX, style.overflowY];
                    restoreDisplay = dataShow && dataShow.display;
                    if (restoreDisplay == null) {
                        restoreDisplay = dataPriv.get(elem, "display")
                    }
                    display = jQuery.css(elem, "display");
                    if (display === "none") {
                        if (restoreDisplay) {
                            display = restoreDisplay
                        } else {
                            showHide([elem], true);
                            restoreDisplay = elem.style.display || restoreDisplay;
                            display = jQuery.css(elem, "display");
                            showHide([elem])
                        }
                    }
                    if (display === "inline" || display === "inline-block" && restoreDisplay != null) {
                        if (jQuery.css(elem, "float") === "none") {
                            if (!propTween) {
                                anim.done(function() {
                                    style.display = restoreDisplay
                                });
                                if (restoreDisplay == null) {
                                    display = style.display;
                                    restoreDisplay = display === "none" ? "" : display
                                }
                            }
                            style.display = "inline-block"
                        }
                    }
                }
                if (opts.overflow) {
                    style.overflow = "hidden";
                    anim.always(function() {
                        style.overflow = opts.overflow[0];
                        style.overflowX = opts.overflow[1];
                        style.overflowY = opts.overflow[2]
                    })
                }
                propTween = false;
                for (prop in orig) {
                    if (!propTween) {
                        if (dataShow) {
                            if ("hidden" in dataShow) {
                                hidden = dataShow.hidden
                            }
                        } else {
                            dataShow = dataPriv.access(elem, "fxshow", {
                                display: restoreDisplay
                            })
                        }
                        if (toggle) {
                            dataShow.hidden = !hidden
                        }
                        if (hidden) {
                            showHide([elem], true)
                        }
                        anim.done(function() {
                            if (!hidden) {
                                showHide([elem])
                            }
                            dataPriv.remove(elem, "fxshow");
                            for (prop in orig) {
                                jQuery.style(elem, prop, orig[prop])
                            }
                        })
                    }
                    propTween = createTween(hidden ? dataShow[prop] : 0, prop, anim);
                    if (!(prop in dataShow)) {
                        dataShow[prop] = propTween.start;
                        if (hidden) {
                            propTween.end = propTween.start;
                            propTween.start = 0
                        }
                    }
                }
            }

            function propFilter(props, specialEasing) {
                var index, name, easing, value, hooks;
                for (index in props) {
                    name = jQuery.camelCase(index);
                    easing = specialEasing[name];
                    value = props[index];
                    if (Array.isArray(value)) {
                        easing = value[1];
                        value = props[index] = value[0]
                    }
                    if (index !== name) {
                        props[name] = value;
                        delete props[index]
                    }
                    hooks = jQuery.cssHooks[name];
                    if (hooks && "expand" in hooks) {
                        value = hooks.expand(value);
                        delete props[name];
                        for (index in value) {
                            if (!(index in props)) {
                                props[index] = value[index];
                                specialEasing[index] = easing
                            }
                        }
                    } else {
                        specialEasing[name] = easing
                    }
                }
            }

            function Animation(elem, properties, options) {
                var result, stopped, index = 0,
                    length = Animation.prefilters.length,
                    deferred = jQuery.Deferred().always(function() {
                        delete tick.elem
                    }),
                    tick = function() {
                        if (stopped) {
                            return false
                        }
                        var currentTime = fxNow || createFxNow(),
                            remaining = Math.max(0, animation.startTime + animation.duration - currentTime),
                            temp = remaining / animation.duration || 0,
                            percent = 1 - temp,
                            index = 0,
                            length = animation.tweens.length;
                        for (; index < length; index++) {
                            animation.tweens[index].run(percent)
                        }
                        deferred.notifyWith(elem, [animation, percent, remaining]);
                        if (percent < 1 && length) {
                            return remaining
                        }
                        if (!length) {
                            deferred.notifyWith(elem, [animation, 1, 0])
                        }
                        deferred.resolveWith(elem, [animation]);
                        return false
                    },
                    animation = deferred.promise({
                        elem: elem,
                        props: jQuery.extend({}, properties),
                        opts: jQuery.extend(true, {
                            specialEasing: {},
                            easing: jQuery.easing._default
                        }, options),
                        originalProperties: properties,
                        originalOptions: options,
                        startTime: fxNow || createFxNow(),
                        duration: options.duration,
                        tweens: [],
                        createTween: function(prop, end) {
                            var tween = jQuery.Tween(elem, animation.opts, prop, end, animation.opts.specialEasing[prop] || animation.opts.easing);
                            animation.tweens.push(tween);
                            return tween
                        },
                        stop: function(gotoEnd) {
                            var index = 0,
                                length = gotoEnd ? animation.tweens.length : 0;
                            if (stopped) {
                                return this
                            }
                            stopped = true;
                            for (; index < length; index++) {
                                animation.tweens[index].run(1)
                            }
                            if (gotoEnd) {
                                deferred.notifyWith(elem, [animation, 1, 0]);
                                deferred.resolveWith(elem, [animation, gotoEnd])
                            } else {
                                deferred.rejectWith(elem, [animation, gotoEnd])
                            }
                            return this
                        }
                    }),
                    props = animation.props;
                propFilter(props, animation.opts.specialEasing);
                for (; index < length; index++) {
                    result = Animation.prefilters[index].call(animation, elem, props, animation.opts);
                    if (result) {
                        if (jQuery.isFunction(result.stop)) {
                            jQuery._queueHooks(animation.elem, animation.opts.queue).stop = jQuery.proxy(result.stop, result)
                        }
                        return result
                    }
                }
                jQuery.map(props, createTween, animation);
                if (jQuery.isFunction(animation.opts.start)) {
                    animation.opts.start.call(elem, animation)
                }
                animation.progress(animation.opts.progress).done(animation.opts.done, animation.opts.complete).fail(animation.opts.fail).always(animation.opts.always);
                jQuery.fx.timer(jQuery.extend(tick, {
                    elem: elem,
                    anim: animation,
                    queue: animation.opts.queue
                }));
                return animation
            }
            jQuery.Animation = jQuery.extend(Animation, {
                tweeners: {
                    "*": [function(prop, value) {
                        var tween = this.createTween(prop, value);
                        adjustCSS(tween.elem, prop, rcssNum.exec(value), tween);
                        return tween
                    }]
                },
                tweener: function(props, callback) {
                    if (jQuery.isFunction(props)) {
                        callback = props;
                        props = ["*"]
                    } else {
                        props = props.match(rnothtmlwhite)
                    }
                    var prop, index = 0,
                        length = props.length;
                    for (; index < length; index++) {
                        prop = props[index];
                        Animation.tweeners[prop] = Animation.tweeners[prop] || [];
                        Animation.tweeners[prop].unshift(callback)
                    }
                },
                prefilters: [defaultPrefilter],
                prefilter: function(callback, prepend) {
                    if (prepend) {
                        Animation.prefilters.unshift(callback)
                    } else {
                        Animation.prefilters.push(callback)
                    }
                }
            });
            jQuery.speed = function(speed, easing, fn) {
                var opt = speed && typeof speed === "object" ? jQuery.extend({}, speed) : {
                    complete: fn || !fn && easing || jQuery.isFunction(speed) && speed,
                    duration: speed,
                    easing: fn && easing || easing && !jQuery.isFunction(easing) && easing
                };
                if (jQuery.fx.off) {
                    opt.duration = 0
                } else {
                    if (typeof opt.duration !== "number") {
                        if (opt.duration in jQuery.fx.speeds) {
                            opt.duration = jQuery.fx.speeds[opt.duration]
                        } else {
                            opt.duration = jQuery.fx.speeds._default
                        }
                    }
                }
                if (opt.queue == null || opt.queue === true) {
                    opt.queue = "fx"
                }
                opt.old = opt.complete;
                opt.complete = function() {
                    if (jQuery.isFunction(opt.old)) {
                        opt.old.call(this)
                    }
                    if (opt.queue) {
                        jQuery.dequeue(this, opt.queue)
                    }
                };
                return opt
            };
            jQuery.fn.extend({
                fadeTo: function(speed, to, easing, callback) {
                    return this.filter(isHiddenWithinTree).css("opacity", 0).show().end().animate({
                        opacity: to
                    }, speed, easing, callback)
                },
                animate: function(prop, speed, easing, callback) {
                    var empty = jQuery.isEmptyObject(prop),
                        optall = jQuery.speed(speed, easing, callback),
                        doAnimation = function() {
                            var anim = Animation(this, jQuery.extend({}, prop), optall);
                            if (empty || dataPriv.get(this, "finish")) {
                                anim.stop(true)
                            }
                        };
                    doAnimation.finish = doAnimation;
                    return empty || optall.queue === false ? this.each(doAnimation) : this.queue(optall.queue, doAnimation)
                },
                stop: function(type, clearQueue, gotoEnd) {
                    var stopQueue = function(hooks) {
                        var stop = hooks.stop;
                        delete hooks.stop;
                        stop(gotoEnd)
                    };
                    if (typeof type !== "string") {
                        gotoEnd = clearQueue;
                        clearQueue = type;
                        type = undefined
                    }
                    if (clearQueue && type !== false) {
                        this.queue(type || "fx", [])
                    }
                    return this.each(function() {
                        var dequeue = true,
                            index = type != null && type + "queueHooks",
                            timers = jQuery.timers,
                            data = dataPriv.get(this);
                        if (index) {
                            if (data[index] && data[index].stop) {
                                stopQueue(data[index])
                            }
                        } else {
                            for (index in data) {
                                if (data[index] && data[index].stop && rrun.test(index)) {
                                    stopQueue(data[index])
                                }
                            }
                        }
                        for (index = timers.length; index--;) {
                            if (timers[index].elem === this && (type == null || timers[index].queue === type)) {
                                timers[index].anim.stop(gotoEnd);
                                dequeue = false;
                                timers.splice(index, 1)
                            }
                        }
                        if (dequeue || !gotoEnd) {
                            jQuery.dequeue(this, type)
                        }
                    })
                },
                finish: function(type) {
                    if (type !== false) {
                        type = type || "fx"
                    }
                    return this.each(function() {
                        var index, data = dataPriv.get(this),
                            queue = data[type + "queue"],
                            hooks = data[type + "queueHooks"],
                            timers = jQuery.timers,
                            length = queue ? queue.length : 0;
                        data.finish = true;
                        jQuery.queue(this, type, []);
                        if (hooks && hooks.stop) {
                            hooks.stop.call(this, true)
                        }
                        for (index = timers.length; index--;) {
                            if (timers[index].elem === this && timers[index].queue === type) {
                                timers[index].anim.stop(true);
                                timers.splice(index, 1)
                            }
                        }
                        for (index = 0; index < length; index++) {
                            if (queue[index] && queue[index].finish) {
                                queue[index].finish.call(this)
                            }
                        }
                        delete data.finish
                    })
                }
            });
            jQuery.each(["toggle", "show", "hide"], function(i, name) {
                var cssFn = jQuery.fn[name];
                jQuery.fn[name] = function(speed, easing, callback) {
                    return speed == null || typeof speed === "boolean" ? cssFn.apply(this, arguments) : this.animate(genFx(name, true), speed, easing, callback)
                }
            });
            jQuery.each({
                slideDown: genFx("show"),
                slideUp: genFx("hide"),
                slideToggle: genFx("toggle"),
                fadeIn: {
                    opacity: "show"
                },
                fadeOut: {
                    opacity: "hide"
                },
                fadeToggle: {
                    opacity: "toggle"
                }
            }, function(name, props) {
                jQuery.fn[name] = function(speed, easing, callback) {
                    return this.animate(props, speed, easing, callback)
                }
            });
            jQuery.timers = [];
            jQuery.fx.tick = function() {
                var timer, i = 0,
                    timers = jQuery.timers;
                fxNow = jQuery.now();
                for (; i < timers.length; i++) {
                    timer = timers[i];
                    if (!timer() && timers[i] === timer) {
                        timers.splice(i--, 1)
                    }
                }
                if (!timers.length) {
                    jQuery.fx.stop()
                }
                fxNow = undefined
            };
            jQuery.fx.timer = function(timer) {
                jQuery.timers.push(timer);
                jQuery.fx.start()
            };
            jQuery.fx.interval = 13;
            jQuery.fx.start = function() {
                if (inProgress) {
                    return
                }
                inProgress = true;
                schedule()
            };
            jQuery.fx.stop = function() {
                inProgress = null
            };
            jQuery.fx.speeds = {
                slow: 600,
                fast: 200,
                _default: 400
            };
            jQuery.fn.delay = function(time, type) {
                time = jQuery.fx ? jQuery.fx.speeds[time] || time : time;
                type = type || "fx";
                return this.queue(type, function(next, hooks) {
                    var timeout = window.setTimeout(next, time);
                    hooks.stop = function() {
                        window.clearTimeout(timeout)
                    }
                })
            };
            (function() {
                var input = document.createElement("input"),
                    select = document.createElement("select"),
                    opt = select.appendChild(document.createElement("option"));
                input.type = "checkbox";
                support.checkOn = input.value !== "";
                support.optSelected = opt.selected;
                input = document.createElement("input");
                input.value = "t";
                input.type = "radio";
                support.radioValue = input.value === "t"
            })();
            var boolHook, attrHandle = jQuery.expr.attrHandle;
            jQuery.fn.extend({
                attr: function(name, value) {
                    return access(this, jQuery.attr, name, value, arguments.length > 1)
                },
                removeAttr: function(name) {
                    return this.each(function() {
                        jQuery.removeAttr(this, name)
                    })
                }
            });
            jQuery.extend({
                attr: function(elem, name, value) {
                    var ret, hooks, nType = elem.nodeType;
                    if (nType === 3 || nType === 8 || nType === 2) {
                        return
                    }
                    if (typeof elem.getAttribute === "undefined") {
                        return jQuery.prop(elem, name, value)
                    }
                    if (nType !== 1 || !jQuery.isXMLDoc(elem)) {
                        hooks = jQuery.attrHooks[name.toLowerCase()] || (jQuery.expr.match.bool.test(name) ? boolHook : undefined)
                    }
                    if (value !== undefined) {
                        if (value === null) {
                            jQuery.removeAttr(elem, name);
                            return
                        }
                        if (hooks && "set" in hooks && (ret = hooks.set(elem, value, name)) !== undefined) {
                            return ret
                        }
                        elem.setAttribute(name, value + "");
                        return value
                    }
                    if (hooks && "get" in hooks && (ret = hooks.get(elem, name)) !== null) {
                        return ret
                    }
                    ret = jQuery.find.attr(elem, name);
                    return ret == null ? undefined : ret
                },
                attrHooks: {
                    type: {
                        set: function(elem, value) {
                            if (!support.radioValue && value === "radio" && nodeName(elem, "input")) {
                                var val = elem.value;
                                elem.setAttribute("type", value);
                                if (val) {
                                    elem.value = val
                                }
                                return value
                            }
                        }
                    }
                },
                removeAttr: function(elem, value) {
                    var name, i = 0,
                        attrNames = value && value.match(rnothtmlwhite);
                    if (attrNames && elem.nodeType === 1) {
                        while (name = attrNames[i++]) {
                            elem.removeAttribute(name)
                        }
                    }
                }
            });
            boolHook = {
                set: function(elem, value, name) {
                    if (value === false) {
                        jQuery.removeAttr(elem, name)
                    } else {
                        elem.setAttribute(name, name)
                    }
                    return name
                }
            };
            jQuery.each(jQuery.expr.match.bool.source.match(/\w+/g), function(i, name) {
                var getter = attrHandle[name] || jQuery.find.attr;
                attrHandle[name] = function(elem, name, isXML) {
                    var ret, handle, lowercaseName = name.toLowerCase();
                    if (!isXML) {
                        handle = attrHandle[lowercaseName];
                        attrHandle[lowercaseName] = ret;
                        ret = getter(elem, name, isXML) != null ? lowercaseName : null;
                        attrHandle[lowercaseName] = handle
                    }
                    return ret
                }
            });
            var rfocusable = /^(?:input|select|textarea|button)$/i,
                rclickable = /^(?:a|area)$/i;
            jQuery.fn.extend({
                prop: function(name, value) {
                    return access(this, jQuery.prop, name, value, arguments.length > 1)
                },
                removeProp: function(name) {
                    return this.each(function() {
                        delete this[jQuery.propFix[name] || name]
                    })
                }
            });
            jQuery.extend({
                prop: function(elem, name, value) {
                    var ret, hooks, nType = elem.nodeType;
                    if (nType === 3 || nType === 8 || nType === 2) {
                        return
                    }
                    if (nType !== 1 || !jQuery.isXMLDoc(elem)) {
                        name = jQuery.propFix[name] || name;
                        hooks = jQuery.propHooks[name]
                    }
                    if (value !== undefined) {
                        if (hooks && "set" in hooks && (ret = hooks.set(elem, value, name)) !== undefined) {
                            return ret
                        }
                        return elem[name] = value
                    }
                    if (hooks && "get" in hooks && (ret = hooks.get(elem, name)) !== null) {
                        return ret
                    }
                    return elem[name]
                },
                propHooks: {
                    tabIndex: {
                        get: function(elem) {
                            var tabindex = jQuery.find.attr(elem, "tabindex");
                            if (tabindex) {
                                return parseInt(tabindex, 10)
                            }
                            if (rfocusable.test(elem.nodeName) || rclickable.test(elem.nodeName) && elem.href) {
                                return 0
                            }
                            return -1
                        }
                    }
                },
                propFix: {
                    for: "htmlFor",
                    class: "className"
                }
            });
            if (!support.optSelected) {
                jQuery.propHooks.selected = {
                    get: function(elem) {
                        var parent = elem.parentNode;
                        if (parent && parent.parentNode) {
                            parent.parentNode.selectedIndex
                        }
                        return null
                    },
                    set: function(elem) {
                        var parent = elem.parentNode;
                        if (parent) {
                            parent.selectedIndex;
                            if (parent.parentNode) {
                                parent.parentNode.selectedIndex
                            }
                        }
                    }
                }
            }
            jQuery.each(["tabIndex", "readOnly", "maxLength", "cellSpacing", "cellPadding", "rowSpan", "colSpan", "useMap", "frameBorder", "contentEditable"], function() {
                jQuery.propFix[this.toLowerCase()] = this
            });

            function stripAndCollapse(value) {
                var tokens = value.match(rnothtmlwhite) || [];
                return tokens.join(" ")
            }

            function getClass(elem) {
                return elem.getAttribute && elem.getAttribute("class") || ""
            }
            jQuery.fn.extend({
                addClass: function(value) {
                    var classes, elem, cur, curValue, clazz, j, finalValue, i = 0;
                    if (jQuery.isFunction(value)) {
                        return this.each(function(j) {
                            jQuery(this).addClass(value.call(this, j, getClass(this)))
                        })
                    }
                    if (typeof value === "string" && value) {
                        classes = value.match(rnothtmlwhite) || [];
                        while (elem = this[i++]) {
                            curValue = getClass(elem);
                            cur = elem.nodeType === 1 && " " + stripAndCollapse(curValue) + " ";
                            if (cur) {
                                j = 0;
                                while (clazz = classes[j++]) {
                                    if (cur.indexOf(" " + clazz + " ") < 0) {
                                        cur += clazz + " "
                                    }
                                }
                                finalValue = stripAndCollapse(cur);
                                if (curValue !== finalValue) {
                                    elem.setAttribute("class", finalValue)
                                }
                            }
                        }
                    }
                    return this
                },
                removeClass: function(value) {
                    var classes, elem, cur, curValue, clazz, j, finalValue, i = 0;
                    if (jQuery.isFunction(value)) {
                        return this.each(function(j) {
                            jQuery(this).removeClass(value.call(this, j, getClass(this)))
                        })
                    }
                    if (!arguments.length) {
                        return this.attr("class", "")
                    }
                    if (typeof value === "string" && value) {
                        classes = value.match(rnothtmlwhite) || [];
                        while (elem = this[i++]) {
                            curValue = getClass(elem);
                            cur = elem.nodeType === 1 && " " + stripAndCollapse(curValue) + " ";
                            if (cur) {
                                j = 0;
                                while (clazz = classes[j++]) {
                                    while (cur.indexOf(" " + clazz + " ") > -1) {
                                        cur = cur.replace(" " + clazz + " ", " ")
                                    }
                                }
                                finalValue = stripAndCollapse(cur);
                                if (curValue !== finalValue) {
                                    elem.setAttribute("class", finalValue)
                                }
                            }
                        }
                    }
                    return this
                },
                toggleClass: function(value, stateVal) {
                    var type = typeof value;
                    if (typeof stateVal === "boolean" && type === "string") {
                        return stateVal ? this.addClass(value) : this.removeClass(value)
                    }
                    if (jQuery.isFunction(value)) {
                        return this.each(function(i) {
                            jQuery(this).toggleClass(value.call(this, i, getClass(this), stateVal), stateVal)
                        })
                    }
                    return this.each(function() {
                        var className, i, self, classNames;
                        if (type === "string") {
                            i = 0;
                            self = jQuery(this);
                            classNames = value.match(rnothtmlwhite) || [];
                            while (className = classNames[i++]) {
                                if (self.hasClass(className)) {
                                    self.removeClass(className)
                                } else {
                                    self.addClass(className)
                                }
                            }
                        } else if (value === undefined || type === "boolean") {
                            className = getClass(this);
                            if (className) {
                                dataPriv.set(this, "__className__", className)
                            }
                            if (this.setAttribute) {
                                this.setAttribute("class", className || value === false ? "" : dataPriv.get(this, "__className__") || "")
                            }
                        }
                    })
                },
                hasClass: function(selector) {
                    var className, elem, i = 0;
                    className = " " + selector + " ";
                    while (elem = this[i++]) {
                        if (elem.nodeType === 1 && (" " + stripAndCollapse(getClass(elem)) + " ").indexOf(className) > -1) {
                            return true
                        }
                    }
                    return false
                }
            });
            var rreturn = /\r/g;
            jQuery.fn.extend({
                val: function(value) {
                    var hooks, ret, isFunction, elem = this[0];
                    if (!arguments.length) {
                        if (elem) {
                            hooks = jQuery.valHooks[elem.type] || jQuery.valHooks[elem.nodeName.toLowerCase()];
                            if (hooks && "get" in hooks && (ret = hooks.get(elem, "value")) !== undefined) {
                                return ret
                            }
                            ret = elem.value;
                            if (typeof ret === "string") {
                                return ret.replace(rreturn, "")
                            }
                            return ret == null ? "" : ret
                        }
                        return
                    }
                    isFunction = jQuery.isFunction(value);
                    return this.each(function(i) {
                        var val;
                        if (this.nodeType !== 1) {
                            return
                        }
                        if (isFunction) {
                            val = value.call(this, i, jQuery(this).val())
                        } else {
                            val = value
                        }
                        if (val == null) {
                            val = ""
                        } else if (typeof val === "number") {
                            val += ""
                        } else if (Array.isArray(val)) {
                            val = jQuery.map(val, function(value) {
                                return value == null ? "" : value + ""
                            })
                        }
                        hooks = jQuery.valHooks[this.type] || jQuery.valHooks[this.nodeName.toLowerCase()];
                        if (!hooks || !("set" in hooks) || hooks.set(this, val, "value") === undefined) {
                            this.value = val
                        }
                    })
                }
            });
            jQuery.extend({
                valHooks: {
                    option: {
                        get: function(elem) {
                            var val = jQuery.find.attr(elem, "value");
                            return val != null ? val : stripAndCollapse(jQuery.text(elem))
                        }
                    },
                    select: {
                        get: function(elem) {
                            var value, option, i, options = elem.options,
                                index = elem.selectedIndex,
                                one = elem.type === "select-one",
                                values = one ? null : [],
                                max = one ? index + 1 : options.length;
                            if (index < 0) {
                                i = max
                            } else {
                                i = one ? index : 0
                            }
                            for (; i < max; i++) {
                                option = options[i];
                                if ((option.selected || i === index) && !option.disabled && (!option.parentNode.disabled || !nodeName(option.parentNode, "optgroup"))) {
                                    value = jQuery(option).val();
                                    if (one) {
                                        return value
                                    }
                                    values.push(value)
                                }
                            }
                            return values
                        },
                        set: function(elem, value) {
                            var optionSet, option, options = elem.options,
                                values = jQuery.makeArray(value),
                                i = options.length;
                            while (i--) {
                                option = options[i];
                                if (option.selected = jQuery.inArray(jQuery.valHooks.option.get(option), values) > -1) {
                                    optionSet = true
                                }
                            }
                            if (!optionSet) {
                                elem.selectedIndex = -1
                            }
                            return values
                        }
                    }
                }
            });
            jQuery.each(["radio", "checkbox"], function() {
                jQuery.valHooks[this] = {
                    set: function(elem, value) {
                        if (Array.isArray(value)) {
                            return elem.checked = jQuery.inArray(jQuery(elem).val(), value) > -1
                        }
                    }
                };
                if (!support.checkOn) {
                    jQuery.valHooks[this].get = function(elem) {
                        return elem.getAttribute("value") === null ? "on" : elem.value
                    }
                }
            });
            var rfocusMorph = /^(?:focusinfocus|focusoutblur)$/;
            jQuery.extend(jQuery.event, {
                trigger: function(event, data, elem, onlyHandlers) {
                    var i, cur, tmp, bubbleType, ontype, handle, special, eventPath = [elem || document],
                        type = hasOwn.call(event, "type") ? event.type : event,
                        namespaces = hasOwn.call(event, "namespace") ? event.namespace.split(".") : [];
                    cur = tmp = elem = elem || document;
                    if (elem.nodeType === 3 || elem.nodeType === 8) {
                        return
                    }
                    if (rfocusMorph.test(type + jQuery.event.triggered)) {
                        return
                    }
                    if (type.indexOf(".") > -1) {
                        namespaces = type.split(".");
                        type = namespaces.shift();
                        namespaces.sort()
                    }
                    ontype = type.indexOf(":") < 0 && "on" + type;
                    event = event[jQuery.expando] ? event : new jQuery.Event(type, typeof event === "object" && event);
                    event.isTrigger = onlyHandlers ? 2 : 3;
                    event.namespace = namespaces.join(".");
                    event.rnamespace = event.namespace ? new RegExp("(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)") : null;
                    event.result = undefined;
                    if (!event.target) {
                        event.target = elem
                    }
                    data = data == null ? [event] : jQuery.makeArray(data, [event]);
                    special = jQuery.event.special[type] || {};
                    if (!onlyHandlers && special.trigger && special.trigger.apply(elem, data) === false) {
                        return
                    }
                    if (!onlyHandlers && !special.noBubble && !jQuery.isWindow(elem)) {
                        bubbleType = special.delegateType || type;
                        if (!rfocusMorph.test(bubbleType + type)) {
                            cur = cur.parentNode
                        }
                        for (; cur; cur = cur.parentNode) {
                            eventPath.push(cur);
                            tmp = cur
                        }
                        if (tmp === (elem.ownerDocument || document)) {
                            eventPath.push(tmp.defaultView || tmp.parentWindow || window)
                        }
                    }
                    i = 0;
                    while ((cur = eventPath[i++]) && !event.isPropagationStopped()) {
                        event.type = i > 1 ? bubbleType : special.bindType || type;
                        handle = (dataPriv.get(cur, "events") || {})[event.type] && dataPriv.get(cur, "handle");
                        if (handle) {
                            handle.apply(cur, data)
                        }
                        handle = ontype && cur[ontype];
                        if (handle && handle.apply && acceptData(cur)) {
                            event.result = handle.apply(cur, data);
                            if (event.result === false) {
                                event.preventDefault()
                            }
                        }
                    }
                    event.type = type;
                    if (!onlyHandlers && !event.isDefaultPrevented()) {
                        if ((!special._default || special._default.apply(eventPath.pop(), data) === false) && acceptData(elem)) {
                            if (ontype && jQuery.isFunction(elem[type]) && !jQuery.isWindow(elem)) {
                                tmp = elem[ontype];
                                if (tmp) {
                                    elem[ontype] = null
                                }
                                jQuery.event.triggered = type;
                                elem[type]();
                                jQuery.event.triggered = undefined;
                                if (tmp) {
                                    elem[ontype] = tmp
                                }
                            }
                        }
                    }
                    return event.result
                },
                simulate: function(type, elem, event) {
                    var e = jQuery.extend(new jQuery.Event, event, {
                        type: type,
                        isSimulated: true
                    });
                    jQuery.event.trigger(e, null, elem)
                }
            });
            jQuery.fn.extend({
                trigger: function(type, data) {
                    return this.each(function() {
                        jQuery.event.trigger(type, data, this)
                    })
                },
                triggerHandler: function(type, data) {
                    var elem = this[0];
                    if (elem) {
                        return jQuery.event.trigger(type, data, elem, true)
                    }
                }
            });
            jQuery.each(("blur focus focusin focusout resize scroll click dblclick " + "mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave " + "change select submit keydown keypress keyup contextmenu").split(" "), function(i, name) {
                jQuery.fn[name] = function(data, fn) {
                    return arguments.length > 0 ? this.on(name, null, data, fn) : this.trigger(name)
                }
            });
            jQuery.fn.extend({
                hover: function(fnOver, fnOut) {
                    return this.mouseenter(fnOver).mouseleave(fnOut || fnOver)
                }
            });
            support.focusin = "onfocusin" in window;
            if (!support.focusin) {
                jQuery.each({
                    focus: "focusin",
                    blur: "focusout"
                }, function(orig, fix) {
                    var handler = function(event) {
                        jQuery.event.simulate(fix, event.target, jQuery.event.fix(event))
                    };
                    jQuery.event.special[fix] = {
                        setup: function() {
                            var doc = this.ownerDocument || this,
                                attaches = dataPriv.access(doc, fix);
                            if (!attaches) {
                                doc.addEventListener(orig, handler, true)
                            }
                            dataPriv.access(doc, fix, (attaches || 0) + 1)
                        },
                        teardown: function() {
                            var doc = this.ownerDocument || this,
                                attaches = dataPriv.access(doc, fix) - 1;
                            if (!attaches) {
                                doc.removeEventListener(orig, handler, true);
                                dataPriv.remove(doc, fix)
                            } else {
                                dataPriv.access(doc, fix, attaches)
                            }
                        }
                    }
                })
            }
            var location = window.location;
            var nonce = jQuery.now();
            var rquery = /\?/;
            jQuery.parseXML = function(data) {
                var xml;
                if (!data || typeof data !== "string") {
                    return null
                }
                try {
                    xml = (new window.DOMParser).parseFromString(data, "text/xml")
                } catch (e) {
                    xml = undefined
                }
                if (!xml || xml.getElementsByTagName("parsererror").length) {
                    jQuery.error("Invalid XML: " + data)
                }
                return xml
            };
            var rbracket = /\[\]$/,
                rCRLF = /\r?\n/g,
                rsubmitterTypes = /^(?:submit|button|image|reset|file)$/i,
                rsubmittable = /^(?:input|select|textarea|keygen)/i;

            function buildParams(prefix, obj, traditional, add) {
                var name;
                if (Array.isArray(obj)) {
                    jQuery.each(obj, function(i, v) {
                        if (traditional || rbracket.test(prefix)) {
                            add(prefix, v)
                        } else {
                            buildParams(prefix + "[" + (typeof v === "object" && v != null ? i : "") + "]", v, traditional, add)
                        }
                    })
                } else if (!traditional && jQuery.type(obj) === "object") {
                    for (name in obj) {
                        buildParams(prefix + "[" + name + "]", obj[name], traditional, add)
                    }
                } else {
                    add(prefix, obj)
                }
            }
            jQuery.param = function(a, traditional) {
                var prefix, s = [],
                    add = function(key, valueOrFunction) {
                        var value = jQuery.isFunction(valueOrFunction) ? valueOrFunction() : valueOrFunction;
                        s[s.length] = encodeURIComponent(key) + "=" + encodeURIComponent(value == null ? "" : value)
                    };
                if (Array.isArray(a) || a.jquery && !jQuery.isPlainObject(a)) {
                    jQuery.each(a, function() {
                        add(this.name, this.value)
                    })
                } else {
                    for (prefix in a) {
                        buildParams(prefix, a[prefix], traditional, add)
                    }
                }
                return s.join("&")
            };
            jQuery.fn.extend({
                serialize: function() {
                    return jQuery.param(this.serializeArray())
                },
                serializeArray: function() {
                    return this.map(function() {
                        var elements = jQuery.prop(this, "elements");
                        return elements ? jQuery.makeArray(elements) : this
                    }).filter(function() {
                        var type = this.type;
                        return this.name && !jQuery(this).is(":disabled") && rsubmittable.test(this.nodeName) && !rsubmitterTypes.test(type) && (this.checked || !rcheckableType.test(type))
                    }).map(function(i, elem) {
                        var val = jQuery(this).val();
                        if (val == null) {
                            return null
                        }
                        if (Array.isArray(val)) {
                            return jQuery.map(val, function(val) {
                                return {
                                    name: elem.name,
                                    value: val.replace(rCRLF, "\r\n")
                                }
                            })
                        }
                        return {
                            name: elem.name,
                            value: val.replace(rCRLF, "\r\n")
                        }
                    }).get()
                }
            });
            var r20 = /%20/g,
                rhash = /#.*$/,
                rantiCache = /([?&])_=[^&]*/,
                rheaders = /^(.*?):[ \t]*([^\r\n]*)$/gm,
                rlocalProtocol = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/,
                rnoContent = /^(?:GET|HEAD)$/,
                rprotocol = /^\/\//,
                prefilters = {},
                transports = {},
                allTypes = "*/".concat("*"),
                originAnchor = document.createElement("a");
            originAnchor.href = location.href;

            function addToPrefiltersOrTransports(structure) {
                return function(dataTypeExpression, func) {
                    if (typeof dataTypeExpression !== "string") {
                        func = dataTypeExpression;
                        dataTypeExpression = "*"
                    }
                    var dataType, i = 0,
                        dataTypes = dataTypeExpression.toLowerCase().match(rnothtmlwhite) || [];
                    if (jQuery.isFunction(func)) {
                        while (dataType = dataTypes[i++]) {
                            if (dataType[0] === "+") {
                                dataType = dataType.slice(1) || "*";
                                (structure[dataType] = structure[dataType] || []).unshift(func)
                            } else {
                                (structure[dataType] = structure[dataType] || []).push(func)
                            }
                        }
                    }
                }
            }

            function inspectPrefiltersOrTransports(structure, options, originalOptions, jqXHR) {
                var inspected = {},
                    seekingTransport = structure === transports;

                function inspect(dataType) {
                    var selected;
                    inspected[dataType] = true;
                    jQuery.each(structure[dataType] || [], function(_, prefilterOrFactory) {
                        var dataTypeOrTransport = prefilterOrFactory(options, originalOptions, jqXHR);
                        if (typeof dataTypeOrTransport === "string" && !seekingTransport && !inspected[dataTypeOrTransport]) {
                            options.dataTypes.unshift(dataTypeOrTransport);
                            inspect(dataTypeOrTransport);
                            return false
                        } else if (seekingTransport) {
                            return !(selected = dataTypeOrTransport)
                        }
                    });
                    return selected
                }
                return inspect(options.dataTypes[0]) || !inspected["*"] && inspect("*")
            }

            function ajaxExtend(target, src) {
                var key, deep, flatOptions = jQuery.ajaxSettings.flatOptions || {};
                for (key in src) {
                    if (src[key] !== undefined) {
                        (flatOptions[key] ? target : deep || (deep = {}))[key] = src[key]
                    }
                }
                if (deep) {
                    jQuery.extend(true, target, deep)
                }
                return target
            }

            function ajaxHandleResponses(s, jqXHR, responses) {
                var ct, type, finalDataType, firstDataType, contents = s.contents,
                    dataTypes = s.dataTypes;
                while (dataTypes[0] === "*") {
                    dataTypes.shift();
                    if (ct === undefined) {
                        ct = s.mimeType || jqXHR.getResponseHeader("Content-Type")
                    }
                }
                if (ct) {
                    for (type in contents) {
                        if (contents[type] && contents[type].test(ct)) {
                            dataTypes.unshift(type);
                            break
                        }
                    }
                }
                if (dataTypes[0] in responses) {
                    finalDataType = dataTypes[0]
                } else {
                    for (type in responses) {
                        if (!dataTypes[0] || s.converters[type + " " + dataTypes[0]]) {
                            finalDataType = type;
                            break
                        }
                        if (!firstDataType) {
                            firstDataType = type
                        }
                    }
                    finalDataType = finalDataType || firstDataType
                }
                if (finalDataType) {
                    if (finalDataType !== dataTypes[0]) {
                        dataTypes.unshift(finalDataType)
                    }
                    return responses[finalDataType]
                }
            }

            function ajaxConvert(s, response, jqXHR, isSuccess) {
                var conv2, current, conv, tmp, prev, converters = {},
                    dataTypes = s.dataTypes.slice();
                if (dataTypes[1]) {
                    for (conv in s.converters) {
                        converters[conv.toLowerCase()] = s.converters[conv]
                    }
                }
                current = dataTypes.shift();
                while (current) {
                    if (s.responseFields[current]) {
                        jqXHR[s.responseFields[current]] = response
                    }
                    if (!prev && isSuccess && s.dataFilter) {
                        response = s.dataFilter(response, s.dataType)
                    }
                    prev = current;
                    current = dataTypes.shift();
                    if (current) {
                        if (current === "*") {
                            current = prev
                        } else if (prev !== "*" && prev !== current) {
                            conv = converters[prev + " " + current] || converters["* " + current];
                            if (!conv) {
                                for (conv2 in converters) {
                                    tmp = conv2.split(" ");
                                    if (tmp[1] === current) {
                                        conv = converters[prev + " " + tmp[0]] || converters["* " + tmp[0]];
                                        if (conv) {
                                            if (conv === true) {
                                                conv = converters[conv2]
                                            } else if (converters[conv2] !== true) {
                                                current = tmp[0];
                                                dataTypes.unshift(tmp[1])
                                            }
                                            break
                                        }
                                    }
                                }
                            }
                            if (conv !== true) {
                                if (conv && s.throws) {
                                    response = conv(response)
                                } else {
                                    try {
                                        response = conv(response)
                                    } catch (e) {
                                        return {
                                            state: "parsererror",
                                            error: conv ? e : "No conversion from " + prev + " to " + current
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                return {
                    state: "success",
                    data: response
                }
            }
            jQuery.extend({
                active: 0,
                lastModified: {},
                etag: {},
                ajaxSettings: {
                    url: location.href,
                    type: "GET",
                    isLocal: rlocalProtocol.test(location.protocol),
                    global: true,
                    processData: true,
                    async: true,
                    contentType: "application/x-www-form-urlencoded; charset=UTF-8",
                    accepts: {
                        "*": allTypes,
                        text: "text/plain",
                        html: "text/html",
                        xml: "application/xml, text/xml",
                        json: "application/json, text/javascript"
                    },
                    contents: {
                        xml: /\bxml\b/,
                        html: /\bhtml/,
                        json: /\bjson\b/
                    },
                    responseFields: {
                        xml: "responseXML",
                        text: "responseText",
                        json: "responseJSON"
                    },
                    converters: {
                        "* text": String,
                        "text html": true,
                        "text json": JSON.parse,
                        "text xml": jQuery.parseXML
                    },
                    flatOptions: {
                        url: true,
                        context: true
                    }
                },
                ajaxSetup: function(target, settings) {
                    return settings ? ajaxExtend(ajaxExtend(target, jQuery.ajaxSettings), settings) : ajaxExtend(jQuery.ajaxSettings, target)
                },
                ajaxPrefilter: addToPrefiltersOrTransports(prefilters),
                ajaxTransport: addToPrefiltersOrTransports(transports),
                ajax: function(url, options) {
                    if (typeof url === "object") {
                        options = url;
                        url = undefined
                    }
                    options = options || {};
                    var transport, cacheURL, responseHeadersString, responseHeaders, timeoutTimer, urlAnchor, completed, fireGlobals, i, uncached, s = jQuery.ajaxSetup({}, options),
                        callbackContext = s.context || s,
                        globalEventContext = s.context && (callbackContext.nodeType || callbackContext.jquery) ? jQuery(callbackContext) : jQuery.event,
                        deferred = jQuery.Deferred(),
                        completeDeferred = jQuery.Callbacks("once memory"),
                        statusCode = s.statusCode || {},
                        requestHeaders = {},
                        requestHeadersNames = {},
                        strAbort = "canceled",
                        jqXHR = {
                            readyState: 0,
                            getResponseHeader: function(key) {
                                var match;
                                if (completed) {
                                    if (!responseHeaders) {
                                        responseHeaders = {};
                                        while (match = rheaders.exec(responseHeadersString)) {
                                            responseHeaders[match[1].toLowerCase()] = match[2]
                                        }
                                    }
                                    match = responseHeaders[key.toLowerCase()]
                                }
                                return match == null ? null : match
                            },
                            getAllResponseHeaders: function() {
                                return completed ? responseHeadersString : null
                            },
                            setRequestHeader: function(name, value) {
                                if (completed == null) {
                                    name = requestHeadersNames[name.toLowerCase()] = requestHeadersNames[name.toLowerCase()] || name;
                                    requestHeaders[name] = value
                                }
                                return this
                            },
                            overrideMimeType: function(type) {
                                if (completed == null) {
                                    s.mimeType = type
                                }
                                return this
                            },
                            statusCode: function(map) {
                                var code;
                                if (map) {
                                    if (completed) {
                                        jqXHR.always(map[jqXHR.status])
                                    } else {
                                        for (code in map) {
                                            statusCode[code] = [statusCode[code], map[code]]
                                        }
                                    }
                                }
                                return this
                            },
                            abort: function(statusText) {
                                var finalText = statusText || strAbort;
                                if (transport) {
                                    transport.abort(finalText)
                                }
                                done(0, finalText);
                                return this
                            }
                        };
                    deferred.promise(jqXHR);
                    s.url = ((url || s.url || location.href) + "").replace(rprotocol, location.protocol + "//");
                    s.type = options.method || options.type || s.method || s.type;
                    s.dataTypes = (s.dataType || "*").toLowerCase().match(rnothtmlwhite) || [""];
                    if (s.crossDomain == null) {
                        urlAnchor = document.createElement("a");
                        try {
                            urlAnchor.href = s.url;
                            urlAnchor.href = urlAnchor.href;
                            s.crossDomain = originAnchor.protocol + "//" + originAnchor.host !== urlAnchor.protocol + "//" + urlAnchor.host
                        } catch (e) {
                            s.crossDomain = true
                        }
                    }
                    if (s.data && s.processData && typeof s.data !== "string") {
                        s.data = jQuery.param(s.data, s.traditional)
                    }
                    inspectPrefiltersOrTransports(prefilters, s, options, jqXHR);
                    if (completed) {
                        return jqXHR
                    }
                    fireGlobals = jQuery.event && s.global;
                    if (fireGlobals && jQuery.active++ === 0) {
                        jQuery.event.trigger("ajaxStart")
                    }
                    s.type = s.type.toUpperCase();
                    s.hasContent = !rnoContent.test(s.type);
                    cacheURL = s.url.replace(rhash, "");
                    if (!s.hasContent) {
                        uncached = s.url.slice(cacheURL.length);
                        if (s.data) {
                            cacheURL += (rquery.test(cacheURL) ? "&" : "?") + s.data;
                            delete s.data
                        }
                        if (s.cache === false) {
                            cacheURL = cacheURL.replace(rantiCache, "$1");
                            uncached = (rquery.test(cacheURL) ? "&" : "?") + "_=" + nonce++ + uncached
                        }
                        s.url = cacheURL + uncached
                    } else if (s.data && s.processData && (s.contentType || "").indexOf("application/x-www-form-urlencoded") === 0) {
                        s.data = s.data.replace(r20, "+")
                    }
                    if (s.ifModified) {
                        if (jQuery.lastModified[cacheURL]) {
                            jqXHR.setRequestHeader("If-Modified-Since", jQuery.lastModified[cacheURL])
                        }
                        if (jQuery.etag[cacheURL]) {
                            jqXHR.setRequestHeader("If-None-Match", jQuery.etag[cacheURL])
                        }
                    }
                    if (s.data && s.hasContent && s.contentType !== false || options.contentType) {
                        jqXHR.setRequestHeader("Content-Type", s.contentType)
                    }
                    jqXHR.setRequestHeader("Accept", s.dataTypes[0] && s.accepts[s.dataTypes[0]] ? s.accepts[s.dataTypes[0]] + (s.dataTypes[0] !== "*" ? ", " + allTypes + "; q=0.01" : "") : s.accepts["*"]);
                    for (i in s.headers) {
                        jqXHR.setRequestHeader(i, s.headers[i])
                    }
                    if (s.beforeSend && (s.beforeSend.call(callbackContext, jqXHR, s) === false || completed)) {
                        return jqXHR.abort()
                    }
                    strAbort = "abort";
                    completeDeferred.add(s.complete);
                    jqXHR.done(s.success);
                    jqXHR.fail(s.error);
                    transport = inspectPrefiltersOrTransports(transports, s, options, jqXHR);
                    if (!transport) {
                        done(-1, "No Transport")
                    } else {
                        jqXHR.readyState = 1;
                        if (fireGlobals) {
                            globalEventContext.trigger("ajaxSend", [jqXHR, s])
                        }
                        if (completed) {
                            return jqXHR
                        }
                        if (s.async && s.timeout > 0) {
                            timeoutTimer = window.setTimeout(function() {
                                jqXHR.abort("timeout")
                            }, s.timeout)
                        }
                        try {
                            completed = false;
                            transport.send(requestHeaders, done)
                        } catch (e) {
                            if (completed) {
                                throw e
                            }
                            done(-1, e)
                        }
                    }

                    function done(status, nativeStatusText, responses, headers) {
                        var isSuccess, success, error, response, modified, statusText = nativeStatusText;
                        if (completed) {
                            return
                        }
                        completed = true;
                        if (timeoutTimer) {
                            window.clearTimeout(timeoutTimer)
                        }
                        transport = undefined;
                        responseHeadersString = headers || "";
                        jqXHR.readyState = status > 0 ? 4 : 0;
                        isSuccess = status >= 200 && status < 300 || status === 304;
                        if (responses) {
                            response = ajaxHandleResponses(s, jqXHR, responses)
                        }
                        response = ajaxConvert(s, response, jqXHR, isSuccess);
                        if (isSuccess) {
                            if (s.ifModified) {
                                modified = jqXHR.getResponseHeader("Last-Modified");
                                if (modified) {
                                    jQuery.lastModified[cacheURL] = modified
                                }
                                modified = jqXHR.getResponseHeader("etag");
                                if (modified) {
                                    jQuery.etag[cacheURL] = modified
                                }
                            }
                            if (status === 204 || s.type === "HEAD") {
                                statusText = "nocontent"
                            } else if (status === 304) {
                                statusText = "notmodified"
                            } else {
                                statusText = response.state;
                                success = response.data;
                                error = response.error;
                                isSuccess = !error
                            }
                        } else {
                            error = statusText;
                            if (status || !statusText) {
                                statusText = "error";
                                if (status < 0) {
                                    status = 0
                                }
                            }
                        }
                        jqXHR.status = status;
                        jqXHR.statusText = (nativeStatusText || statusText) + "";
                        if (isSuccess) {
                            deferred.resolveWith(callbackContext, [success, statusText, jqXHR])
                        } else {
                            deferred.rejectWith(callbackContext, [jqXHR, statusText, error])
                        }
                        jqXHR.statusCode(statusCode);
                        statusCode = undefined;
                        if (fireGlobals) {
                            globalEventContext.trigger(isSuccess ? "ajaxSuccess" : "ajaxError", [jqXHR, s, isSuccess ? success : error])
                        }
                        completeDeferred.fireWith(callbackContext, [jqXHR, statusText]);
                        if (fireGlobals) {
                            globalEventContext.trigger("ajaxComplete", [jqXHR, s]);
                            if (!--jQuery.active) {
                                jQuery.event.trigger("ajaxStop")
                            }
                        }
                    }
                    return jqXHR
                },
                getJSON: function(url, data, callback) {
                    return jQuery.get(url, data, callback, "json")
                },
                getScript: function(url, callback) {
                    return jQuery.get(url, undefined, callback, "script")
                }
            });
            jQuery.each(["get", "post"], function(i, method) {
                jQuery[method] = function(url, data, callback, type) {
                    if (jQuery.isFunction(data)) {
                        type = type || callback;
                        callback = data;
                        data = undefined
                    }
                    return jQuery.ajax(jQuery.extend({
                        url: url,
                        type: method,
                        dataType: type,
                        data: data,
                        success: callback
                    }, jQuery.isPlainObject(url) && url))
                }
            });
            jQuery._evalUrl = function(url) {
                return jQuery.ajax({
                    url: url,
                    type: "GET",
                    dataType: "script",
                    cache: true,
                    async: false,
                    global: false,
                    throws: true
                })
            };
            jQuery.fn.extend({
                wrapAll: function(html) {
                    var wrap;
                    if (this[0]) {
                        if (jQuery.isFunction(html)) {
                            html = html.call(this[0])
                        }
                        wrap = jQuery(html, this[0].ownerDocument).eq(0).clone(true);
                        if (this[0].parentNode) {
                            wrap.insertBefore(this[0])
                        }
                        wrap.map(function() {
                            var elem = this;
                            while (elem.firstElementChild) {
                                elem = elem.firstElementChild
                            }
                            return elem
                        }).append(this)
                    }
                    return this
                },
                wrapInner: function(html) {
                    if (jQuery.isFunction(html)) {
                        return this.each(function(i) {
                            jQuery(this).wrapInner(html.call(this, i))
                        })
                    }
                    return this.each(function() {
                        var self = jQuery(this),
                            contents = self.contents();
                        if (contents.length) {
                            contents.wrapAll(html)
                        } else {
                            self.append(html)
                        }
                    })
                },
                wrap: function(html) {
                    var isFunction = jQuery.isFunction(html);
                    return this.each(function(i) {
                        jQuery(this).wrapAll(isFunction ? html.call(this, i) : html)
                    })
                },
                unwrap: function(selector) {
                    this.parent(selector).not("body").each(function() {
                        jQuery(this).replaceWith(this.childNodes)
                    });
                    return this
                }
            });
            jQuery.expr.pseudos.hidden = function(elem) {
                return !jQuery.expr.pseudos.visible(elem)
            };
            jQuery.expr.pseudos.visible = function(elem) {
                return !!(elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length)
            };
            jQuery.ajaxSettings.xhr = function() {
                try {
                    return new window.XMLHttpRequest
                } catch (e) {}
            };
            var xhrSuccessStatus = {
                    0: 200,
                    1223: 204
                },
                xhrSupported = jQuery.ajaxSettings.xhr();
            support.cors = !!xhrSupported && "withCredentials" in xhrSupported;
            support.ajax = xhrSupported = !!xhrSupported;
            jQuery.ajaxTransport(function(options) {
                var callback, errorCallback;
                if (support.cors || xhrSupported && !options.crossDomain) {
                    return {
                        send: function(headers, complete) {
                            var i, xhr = options.xhr();
                            xhr.open(options.type, options.url, options.async, options.username, options.password);
                            if (options.xhrFields) {
                                for (i in options.xhrFields) {
                                    xhr[i] = options.xhrFields[i]
                                }
                            }
                            if (options.mimeType && xhr.overrideMimeType) {
                                xhr.overrideMimeType(options.mimeType)
                            }
                            if (!options.crossDomain && !headers["X-Requested-With"]) {
                                headers["X-Requested-With"] = "XMLHttpRequest"
                            }
                            for (i in headers) {
                                xhr.setRequestHeader(i, headers[i])
                            }
                            callback = function(type) {
                                return function() {
                                    if (callback) {
                                        callback = errorCallback = xhr.onload = xhr.onerror = xhr.onabort = xhr.onreadystatechange = null;
                                        if (type === "abort") {
                                            xhr.abort()
                                        } else if (type === "error") {
                                            if (typeof xhr.status !== "number") {
                                                complete(0, "error")
                                            } else {
                                                complete(xhr.status, xhr.statusText)
                                            }
                                        } else {
                                            complete(xhrSuccessStatus[xhr.status] || xhr.status, xhr.statusText, (xhr.responseType || "text") !== "text" || typeof xhr.responseText !== "string" ? {
                                                binary: xhr.response
                                            } : {
                                                text: xhr.responseText
                                            }, xhr.getAllResponseHeaders())
                                        }
                                    }
                                }
                            };
                            xhr.onload = callback();
                            errorCallback = xhr.onerror = callback("error");
                            if (xhr.onabort !== undefined) {
                                xhr.onabort = errorCallback
                            } else {
                                xhr.onreadystatechange = function() {
                                    if (xhr.readyState === 4) {
                                        window.setTimeout(function() {
                                            if (callback) {
                                                errorCallback()
                                            }
                                        })
                                    }
                                }
                            }
                            callback = callback("abort");
                            try {
                                xhr.send(options.hasContent && options.data || null)
                            } catch (e) {
                                if (callback) {
                                    throw e
                                }
                            }
                        },
                        abort: function() {
                            if (callback) {
                                callback()
                            }
                        }
                    }
                }
            });
            jQuery.ajaxPrefilter(function(s) {
                if (s.crossDomain) {
                    s.contents.script = false
                }
            });
            jQuery.ajaxSetup({
                accepts: {
                    script: "text/javascript, application/javascript, " + "application/ecmascript, application/x-ecmascript"
                },
                contents: {
                    script: /\b(?:java|ecma)script\b/
                },
                converters: {
                    "text script": function(text) {
                        jQuery.globalEval(text);
                        return text
                    }
                }
            });
            jQuery.ajaxPrefilter("script", function(s) {
                if (s.cache === undefined) {
                    s.cache = false
                }
                if (s.crossDomain) {
                    s.type = "GET"
                }
            });
            jQuery.ajaxTransport("script", function(s) {
                if (s.crossDomain) {
                    var script, callback;
                    return {
                        send: function(_, complete) {
                            script = jQuery("<script>").prop({
                                charset: s.scriptCharset,
                                src: s.url
                            }).on("load error", callback = function(evt) {
                                script.remove();
                                callback = null;
                                if (evt) {
                                    complete(evt.type === "error" ? 404 : 200, evt.type)
                                }
                            });
                            document.head.appendChild(script[0])
                        },
                        abort: function() {
                            if (callback) {
                                callback()
                            }
                        }
                    }
                }
            });
            var oldCallbacks = [],
                rjsonp = /(=)\?(?=&|$)|\?\?/;
            jQuery.ajaxSetup({
                jsonp: "callback",
                jsonpCallback: function() {
                    var callback = oldCallbacks.pop() || jQuery.expando + "_" + nonce++;
                    this[callback] = true;
                    return callback
                }
            });
            jQuery.ajaxPrefilter("json jsonp", function(s, originalSettings, jqXHR) {
                var callbackName, overwritten, responseContainer, jsonProp = s.jsonp !== false && (rjsonp.test(s.url) ? "url" : typeof s.data === "string" && (s.contentType || "").indexOf("application/x-www-form-urlencoded") === 0 && rjsonp.test(s.data) && "data");
                if (jsonProp || s.dataTypes[0] === "jsonp") {
                    callbackName = s.jsonpCallback = jQuery.isFunction(s.jsonpCallback) ? s.jsonpCallback() : s.jsonpCallback;
                    if (jsonProp) {
                        s[jsonProp] = s[jsonProp].replace(rjsonp, "$1" + callbackName)
                    } else if (s.jsonp !== false) {
                        s.url += (rquery.test(s.url) ? "&" : "?") + s.jsonp + "=" + callbackName
                    }
                    s.converters["script json"] = function() {
                        if (!responseContainer) {
                            jQuery.error(callbackName + " was not called")
                        }
                        return responseContainer[0]
                    };
                    s.dataTypes[0] = "json";
                    overwritten = window[callbackName];
                    window[callbackName] = function() {
                        responseContainer = arguments
                    };
                    jqXHR.always(function() {
                        if (overwritten === undefined) {
                            jQuery(window).removeProp(callbackName)
                        } else {
                            window[callbackName] = overwritten
                        }
                        if (s[callbackName]) {
                            s.jsonpCallback = originalSettings.jsonpCallback;
                            oldCallbacks.push(callbackName)
                        }
                        if (responseContainer && jQuery.isFunction(overwritten)) {
                            overwritten(responseContainer[0])
                        }
                        responseContainer = overwritten = undefined
                    });
                    return "script"
                }
            });
            support.createHTMLDocument = function() {
                var body = document.implementation.createHTMLDocument("").body;
                body.innerHTML = "<form></form><form></form>";
                return body.childNodes.length === 2
            }();
            jQuery.parseHTML = function(data, context, keepScripts) {
                if (typeof data !== "string") {
                    return []
                }
                if (typeof context === "boolean") {
                    keepScripts = context;
                    context = false
                }
                var base, parsed, scripts;
                if (!context) {
                    if (support.createHTMLDocument) {
                        context = document.implementation.createHTMLDocument("");
                        base = context.createElement("base");
                        base.href = document.location.href;
                        context.head.appendChild(base)
                    } else {
                        context = document
                    }
                }
                parsed = rsingleTag.exec(data);
                scripts = !keepScripts && [];
                if (parsed) {
                    return [context.createElement(parsed[1])]
                }
                parsed = buildFragment([data], context, scripts);
                if (scripts && scripts.length) {
                    jQuery(scripts).remove()
                }
                return jQuery.merge([], parsed.childNodes)
            };
            jQuery.fn.load = function(url, params, callback) {
                var selector, type, response, self = this,
                    off = url.indexOf(" ");
                if (off > -1) {
                    selector = stripAndCollapse(url.slice(off));
                    url = url.slice(0, off)
                }
                if (jQuery.isFunction(params)) {
                    callback = params;
                    params = undefined
                } else if (params && typeof params === "object") {
                    type = "POST"
                }
                if (self.length > 0) {
                    jQuery.ajax({
                        url: url,
                        type: type || "GET",
                        dataType: "html",
                        data: params
                    }).done(function(responseText) {
                        response = arguments;
                        self.html(selector ? jQuery("<div>").append(jQuery.parseHTML(responseText)).find(selector) : responseText)
                    }).always(callback && function(jqXHR, status) {
                        self.each(function() {
                            callback.apply(this, response || [jqXHR.responseText, status, jqXHR])
                        })
                    })
                }
                return this
            };
            jQuery.each(["ajaxStart", "ajaxStop", "ajaxComplete", "ajaxError", "ajaxSuccess", "ajaxSend"], function(i, type) {
                jQuery.fn[type] = function(fn) {
                    return this.on(type, fn)
                }
            });
            jQuery.expr.pseudos.animated = function(elem) {
                return jQuery.grep(jQuery.timers, function(fn) {
                    return elem === fn.elem
                }).length
            };
            jQuery.offset = {
                setOffset: function(elem, options, i) {
                    var curPosition, curLeft, curCSSTop, curTop, curOffset, curCSSLeft, calculatePosition, position = jQuery.css(elem, "position"),
                        curElem = jQuery(elem),
                        props = {};
                    if (position === "static") {
                        elem.style.position = "relative"
                    }
                    curOffset = curElem.offset();
                    curCSSTop = jQuery.css(elem, "top");
                    curCSSLeft = jQuery.css(elem, "left");
                    calculatePosition = (position === "absolute" || position === "fixed") && (curCSSTop + curCSSLeft).indexOf("auto") > -1;
                    if (calculatePosition) {
                        curPosition = curElem.position();
                        curTop = curPosition.top;
                        curLeft = curPosition.left
                    } else {
                        curTop = parseFloat(curCSSTop) || 0;
                        curLeft = parseFloat(curCSSLeft) || 0
                    }
                    if (jQuery.isFunction(options)) {
                        options = options.call(elem, i, jQuery.extend({}, curOffset))
                    }
                    if (options.top != null) {
                        props.top = options.top - curOffset.top + curTop
                    }
                    if (options.left != null) {
                        props.left = options.left - curOffset.left + curLeft
                    }
                    if ("using" in options) {
                        options.using.call(elem, props)
                    } else {
                        curElem.css(props)
                    }
                }
            };
            jQuery.fn.extend({
                offset: function(options) {
                    if (arguments.length) {
                        return options === undefined ? this : this.each(function(i) {
                            jQuery.offset.setOffset(this, options, i)
                        })
                    }
                    var doc, docElem, rect, win, elem = this[0];
                    if (!elem) {
                        return
                    }
                    if (!elem.getClientRects().length) {
                        return {
                            top: 0,
                            left: 0
                        }
                    }
                    rect = elem.getBoundingClientRect();
                    doc = elem.ownerDocument;
                    docElem = doc.documentElement;
                    win = doc.defaultView;
                    return {
                        top: rect.top + win.pageYOffset - docElem.clientTop,
                        left: rect.left + win.pageXOffset - docElem.clientLeft
                    }
                },
                position: function() {
                    if (!this[0]) {
                        return
                    }
                    var offsetParent, offset, elem = this[0],
                        parentOffset = {
                            top: 0,
                            left: 0
                        };
                    if (jQuery.css(elem, "position") === "fixed") {
                        offset = elem.getBoundingClientRect()
                    } else {
                        offsetParent = this.offsetParent();
                        offset = this.offset();
                        if (!nodeName(offsetParent[0], "html")) {
                            parentOffset = offsetParent.offset()
                        }
                        parentOffset = {
                            top: parentOffset.top + jQuery.css(offsetParent[0], "borderTopWidth", true),
                            left: parentOffset.left + jQuery.css(offsetParent[0], "borderLeftWidth", true)
                        }
                    }
                    return {
                        top: offset.top - parentOffset.top - jQuery.css(elem, "marginTop", true),
                        left: offset.left - parentOffset.left - jQuery.css(elem, "marginLeft", true)
                    }
                },
                offsetParent: function() {
                    return this.map(function() {
                        var offsetParent = this.offsetParent;
                        while (offsetParent && jQuery.css(offsetParent, "position") === "static") {
                            offsetParent = offsetParent.offsetParent
                        }
                        return offsetParent || documentElement
                    })
                }
            });
            jQuery.each({
                scrollLeft: "pageXOffset",
                scrollTop: "pageYOffset"
            }, function(method, prop) {
                var top = "pageYOffset" === prop;
                jQuery.fn[method] = function(val) {
                    return access(this, function(elem, method, val) {
                        var win;
                        if (jQuery.isWindow(elem)) {
                            win = elem
                        } else if (elem.nodeType === 9) {
                            win = elem.defaultView
                        }
                        if (val === undefined) {
                            return win ? win[prop] : elem[method]
                        }
                        if (win) {
                            win.scrollTo(!top ? val : win.pageXOffset, top ? val : win.pageYOffset)
                        } else {
                            elem[method] = val
                        }
                    }, method, val, arguments.length)
                }
            });
            jQuery.each(["top", "left"], function(i, prop) {
                jQuery.cssHooks[prop] = addGetHookIf(support.pixelPosition, function(elem, computed) {
                    if (computed) {
                        computed = curCSS(elem, prop);
                        return rnumnonpx.test(computed) ? jQuery(elem).position()[prop] + "px" : computed
                    }
                })
            });
            jQuery.each({
                Height: "height",
                Width: "width"
            }, function(name, type) {
                jQuery.each({
                    padding: "inner" + name,
                    content: type,
                    "": "outer" + name
                }, function(defaultExtra, funcName) {
                    jQuery.fn[funcName] = function(margin, value) {
                        var chainable = arguments.length && (defaultExtra || typeof margin !== "boolean"),
                            extra = defaultExtra || (margin === true || value === true ? "margin" : "border");
                        return access(this, function(elem, type, value) {
                            var doc;
                            if (jQuery.isWindow(elem)) {
                                return funcName.indexOf("outer") === 0 ? elem["inner" + name] : elem.document.documentElement["client" + name]
                            }
                            if (elem.nodeType === 9) {
                                doc = elem.documentElement;
                                return Math.max(elem.body["scroll" + name], doc["scroll" + name], elem.body["offset" + name], doc["offset" + name], doc["client" + name])
                            }
                            return value === undefined ? jQuery.css(elem, type, extra) : jQuery.style(elem, type, value, extra)
                        }, type, chainable ? margin : undefined, chainable)
                    }
                })
            });
            jQuery.fn.extend({
                bind: function(types, data, fn) {
                    return this.on(types, null, data, fn)
                },
                unbind: function(types, fn) {
                    return this.off(types, null, fn)
                },
                delegate: function(selector, types, data, fn) {
                    return this.on(types, selector, data, fn)
                },
                undelegate: function(selector, types, fn) {
                    return arguments.length === 1 ? this.off(selector, "**") : this.off(types, selector || "**", fn)
                }
            });
            jQuery.holdReady = function(hold) {
                if (hold) {
                    jQuery.readyWait++
                } else {
                    jQuery.ready(true)
                }
            };
            jQuery.isArray = Array.isArray;
            jQuery.parseJSON = JSON.parse;
            jQuery.nodeName = nodeName;
            if (typeof define === "function" && define.amd) {
                define("jquery", [], function() {
                    return jQuery
                })
            }
            var _jQuery = window.jQuery,
                _$ = window.$;
            jQuery.noConflict = function(deep) {
                if (window.$ === jQuery) {
                    window.$ = _$
                }
                if (deep && window.jQuery === jQuery) {
                    window.jQuery = _jQuery
                }
                return jQuery
            };
            if (!noGlobal) {
                window.jQuery = window.$ = jQuery
            }
            return jQuery
        })
    }, {}],
    14: [function(require, module, exports) {
        (function(global, factory) {
            typeof exports === "object" && typeof module !== "undefined" ? module.exports = factory() : typeof define === "function" && define.amd ? define(factory) : global.moment = factory()
        })(this, function() {
            "use strict";
            var hookCallback;

            function hooks() {
                return hookCallback.apply(null, arguments)
            }

            function setHookCallback(callback) {
                hookCallback = callback
            }

            function isArray(input) {
                return input instanceof Array || Object.prototype.toString.call(input) === "[object Array]"
            }

            function isObject(input) {
                return input != null && Object.prototype.toString.call(input) === "[object Object]"
            }

            function isObjectEmpty(obj) {
                var k;
                for (k in obj) {
                    return false
                }
                return true
            }

            function isNumber(input) {
                return typeof input === "number" || Object.prototype.toString.call(input) === "[object Number]"
            }

            function isDate(input) {
                return input instanceof Date || Object.prototype.toString.call(input) === "[object Date]"
            }

            function map(arr, fn) {
                var res = [],
                    i;
                for (i = 0; i < arr.length; ++i) {
                    res.push(fn(arr[i], i))
                }
                return res
            }

            function hasOwnProp(a, b) {
                return Object.prototype.hasOwnProperty.call(a, b)
            }

            function extend(a, b) {
                for (var i in b) {
                    if (hasOwnProp(b, i)) {
                        a[i] = b[i]
                    }
                }
                if (hasOwnProp(b, "toString")) {
                    a.toString = b.toString
                }
                if (hasOwnProp(b, "valueOf")) {
                    a.valueOf = b.valueOf
                }
                return a
            }

            function createUTC(input, format, locale, strict) {
                return createLocalOrUTC(input, format, locale, strict, true).utc()
            }

            function defaultParsingFlags() {
                return {
                    empty: false,
                    unusedTokens: [],
                    unusedInput: [],
                    overflow: -2,
                    charsLeftOver: 0,
                    nullInput: false,
                    invalidMonth: null,
                    invalidFormat: false,
                    userInvalidated: false,
                    iso: false,
                    parsedDateParts: [],
                    meridiem: null
                }
            }

            function getParsingFlags(m) {
                if (m._pf == null) {
                    m._pf = defaultParsingFlags()
                }
                return m._pf
            }
            var some;
            if (Array.prototype.some) {
                some = Array.prototype.some
            } else {
                some = function(fun) {
                    var t = Object(this);
                    var len = t.length >>> 0;
                    for (var i = 0; i < len; i++) {
                        if (i in t && fun.call(this, t[i], i, t)) {
                            return true
                        }
                    }
                    return false
                }
            }
            var some$1 = some;

            function isValid(m) {
                if (m._isValid == null) {
                    var flags = getParsingFlags(m);
                    var parsedParts = some$1.call(flags.parsedDateParts, function(i) {
                        return i != null
                    });
                    var isNowValid = !isNaN(m._d.getTime()) && flags.overflow < 0 && !flags.empty && !flags.invalidMonth && !flags.invalidWeekday && !flags.nullInput && !flags.invalidFormat && !flags.userInvalidated && (!flags.meridiem || flags.meridiem && parsedParts);
                    if (m._strict) {
                        isNowValid = isNowValid && flags.charsLeftOver === 0 && flags.unusedTokens.length === 0 && flags.bigHour === undefined
                    }
                    if (Object.isFrozen == null || !Object.isFrozen(m)) {
                        m._isValid = isNowValid
                    } else {
                        return isNowValid
                    }
                }
                return m._isValid
            }

            function createInvalid(flags) {
                var m = createUTC(NaN);
                if (flags != null) {
                    extend(getParsingFlags(m), flags)
                } else {
                    getParsingFlags(m).userInvalidated = true
                }
                return m
            }

            function isUndefined(input) {
                return input === void 0
            }
            var momentProperties = hooks.momentProperties = [];

            function copyConfig(to, from) {
                var i, prop, val;
                if (!isUndefined(from._isAMomentObject)) {
                    to._isAMomentObject = from._isAMomentObject
                }
                if (!isUndefined(from._i)) {
                    to._i = from._i
                }
                if (!isUndefined(from._f)) {
                    to._f = from._f
                }
                if (!isUndefined(from._l)) {
                    to._l = from._l
                }
                if (!isUndefined(from._strict)) {
                    to._strict = from._strict
                }
                if (!isUndefined(from._tzm)) {
                    to._tzm = from._tzm
                }
                if (!isUndefined(from._isUTC)) {
                    to._isUTC = from._isUTC
                }
                if (!isUndefined(from._offset)) {
                    to._offset = from._offset
                }
                if (!isUndefined(from._pf)) {
                    to._pf = getParsingFlags(from)
                }
                if (!isUndefined(from._locale)) {
                    to._locale = from._locale
                }
                if (momentProperties.length > 0) {
                    for (i in momentProperties) {
                        prop = momentProperties[i];
                        val = from[prop];
                        if (!isUndefined(val)) {
                            to[prop] = val
                        }
                    }
                }
                return to
            }
            var updateInProgress = false;

            function Moment(config) {
                copyConfig(this, config);
                this._d = new Date(config._d != null ? config._d.getTime() : NaN);
                if (!this.isValid()) {
                    this._d = new Date(NaN)
                }
                if (updateInProgress === false) {
                    updateInProgress = true;
                    hooks.updateOffset(this);
                    updateInProgress = false
                }
            }

            function isMoment(obj) {
                return obj instanceof Moment || obj != null && obj._isAMomentObject != null
            }

            function absFloor(number) {
                if (number < 0) {
                    return Math.ceil(number) || 0
                } else {
                    return Math.floor(number)
                }
            }

            function toInt(argumentForCoercion) {
                var coercedNumber = +argumentForCoercion,
                    value = 0;
                if (coercedNumber !== 0 && isFinite(coercedNumber)) {
                    value = absFloor(coercedNumber)
                }
                return value
            }

            function compareArrays(array1, array2, dontConvert) {
                var len = Math.min(array1.length, array2.length),
                    lengthDiff = Math.abs(array1.length - array2.length),
                    diffs = 0,
                    i;
                for (i = 0; i < len; i++) {
                    if (dontConvert && array1[i] !== array2[i] || !dontConvert && toInt(array1[i]) !== toInt(array2[i])) {
                        diffs++
                    }
                }
                return diffs + lengthDiff
            }

            function warn(msg) {
                if (hooks.suppressDeprecationWarnings === false && typeof console !== "undefined" && console.warn) {
                    console.warn("Deprecation warning: " + msg)
                }
            }

            function deprecate(msg, fn) {
                var firstTime = true;
                return extend(function() {
                    if (hooks.deprecationHandler != null) {
                        hooks.deprecationHandler(null, msg)
                    }
                    if (firstTime) {
                        var args = [];
                        var arg;
                        for (var i = 0; i < arguments.length; i++) {
                            arg = "";
                            if (typeof arguments[i] === "object") {
                                arg += "\n[" + i + "] ";
                                for (var key in arguments[0]) {
                                    arg += key + ": " + arguments[0][key] + ", "
                                }
                                arg = arg.slice(0, -2)
                            } else {
                                arg = arguments[i]
                            }
                            args.push(arg)
                        }
                        warn(msg + "\nArguments: " + Array.prototype.slice.call(args).join("") + "\n" + (new Error).stack);
                        firstTime = false
                    }
                    return fn.apply(this, arguments)
                }, fn)
            }
            var deprecations = {};

            function deprecateSimple(name, msg) {
                if (hooks.deprecationHandler != null) {
                    hooks.deprecationHandler(name, msg)
                }
                if (!deprecations[name]) {
                    warn(msg);
                    deprecations[name] = true
                }
            }
            hooks.suppressDeprecationWarnings = false;
            hooks.deprecationHandler = null;

            function isFunction(input) {
                return input instanceof Function || Object.prototype.toString.call(input) === "[object Function]"
            }

            function set(config) {
                var prop, i;
                for (i in config) {
                    prop = config[i];
                    if (isFunction(prop)) {
                        this[i] = prop
                    } else {
                        this["_" + i] = prop
                    }
                }
                this._config = config;
                this._ordinalParseLenient = new RegExp(this._ordinalParse.source + "|" + /\d{1,2}/.source)
            }

            function mergeConfigs(parentConfig, childConfig) {
                var res = extend({}, parentConfig),
                    prop;
                for (prop in childConfig) {
                    if (hasOwnProp(childConfig, prop)) {
                        if (isObject(parentConfig[prop]) && isObject(childConfig[prop])) {
                            res[prop] = {};
                            extend(res[prop], parentConfig[prop]);
                            extend(res[prop], childConfig[prop])
                        } else if (childConfig[prop] != null) {
                            res[prop] = childConfig[prop]
                        } else {
                            delete res[prop]
                        }
                    }
                }
                for (prop in parentConfig) {
                    if (hasOwnProp(parentConfig, prop) && !hasOwnProp(childConfig, prop) && isObject(parentConfig[prop])) {
                        res[prop] = extend({}, res[prop])
                    }
                }
                return res
            }

            function Locale(config) {
                if (config != null) {
                    this.set(config)
                }
            }
            var keys;
            if (Object.keys) {
                keys = Object.keys
            } else {
                keys = function(obj) {
                    var i, res = [];
                    for (i in obj) {
                        if (hasOwnProp(obj, i)) {
                            res.push(i)
                        }
                    }
                    return res
                }
            }
            var keys$1 = keys;
            var defaultCalendar = {
                sameDay: "[Today at] LT",
                nextDay: "[Tomorrow at] LT",
                nextWeek: "dddd [at] LT",
                lastDay: "[Yesterday at] LT",
                lastWeek: "[Last] dddd [at] LT",
                sameElse: "L"
            };

            function calendar(key, mom, now) {
                var output = this._calendar[key] || this._calendar["sameElse"];
                return isFunction(output) ? output.call(mom, now) : output
            }
            var defaultLongDateFormat = {
                LTS: "h:mm:ss A",
                LT: "h:mm A",
                L: "MM/DD/YYYY",
                LL: "MMMM D, YYYY",
                LLL: "MMMM D, YYYY h:mm A",
                LLLL: "dddd, MMMM D, YYYY h:mm A"
            };

            function longDateFormat(key) {
                var format = this._longDateFormat[key],
                    formatUpper = this._longDateFormat[key.toUpperCase()];
                if (format || !formatUpper) {
                    return format
                }
                this._longDateFormat[key] = formatUpper.replace(/MMMM|MM|DD|dddd/g, function(val) {
                    return val.slice(1)
                });
                return this._longDateFormat[key]
            }
            var defaultInvalidDate = "Invalid date";

            function invalidDate() {
                return this._invalidDate
            }
            var defaultOrdinal = "%d";
            var defaultOrdinalParse = /\d{1,2}/;

            function ordinal(number) {
                return this._ordinal.replace("%d", number)
            }
            var defaultRelativeTime = {
                future: "in %s",
                past: "%s ago",
                s: "a few seconds",
                m: "a minute",
                mm: "%d minutes",
                h: "an hour",
                hh: "%d hours",
                d: "a day",
                dd: "%d days",
                M: "a month",
                MM: "%d months",
                y: "a year",
                yy: "%d years"
            };

            function relativeTime(number, withoutSuffix, string, isFuture) {
                var output = this._relativeTime[string];
                return isFunction(output) ? output(number, withoutSuffix, string, isFuture) : output.replace(/%d/i, number)
            }

            function pastFuture(diff, output) {
                var format = this._relativeTime[diff > 0 ? "future" : "past"];
                return isFunction(format) ? format(output) : format.replace(/%s/i, output)
            }
            var aliases = {};

            function addUnitAlias(unit, shorthand) {
                var lowerCase = unit.toLowerCase();
                aliases[lowerCase] = aliases[lowerCase + "s"] = aliases[shorthand] = unit
            }

            function normalizeUnits(units) {
                return typeof units === "string" ? aliases[units] || aliases[units.toLowerCase()] : undefined
            }

            function normalizeObjectUnits(inputObject) {
                var normalizedInput = {},
                    normalizedProp, prop;
                for (prop in inputObject) {
                    if (hasOwnProp(inputObject, prop)) {
                        normalizedProp = normalizeUnits(prop);
                        if (normalizedProp) {
                            normalizedInput[normalizedProp] = inputObject[prop]
                        }
                    }
                }
                return normalizedInput
            }
            var priorities = {};

            function addUnitPriority(unit, priority) {
                priorities[unit] = priority
            }

            function getPrioritizedUnits(unitsObj) {
                var units = [];
                for (var u in unitsObj) {
                    units.push({
                        unit: u,
                        priority: priorities[u]
                    })
                }
                units.sort(function(a, b) {
                    return a.priority - b.priority
                });
                return units
            }

            function makeGetSet(unit, keepTime) {
                return function(value) {
                    if (value != null) {
                        set$1(this, unit, value);
                        hooks.updateOffset(this, keepTime);
                        return this
                    } else {
                        return get(this, unit)
                    }
                }
            }

            function get(mom, unit) {
                return mom.isValid() ? mom._d["get" + (mom._isUTC ? "UTC" : "") + unit]() : NaN
            }

            function set$1(mom, unit, value) {
                if (mom.isValid()) {
                    mom._d["set" + (mom._isUTC ? "UTC" : "") + unit](value)
                }
            }

            function stringGet(units) {
                units = normalizeUnits(units);
                if (isFunction(this[units])) {
                    return this[units]()
                }
                return this
            }

            function stringSet(units, value) {
                if (typeof units === "object") {
                    units = normalizeObjectUnits(units);
                    var prioritized = getPrioritizedUnits(units);
                    for (var i = 0; i < prioritized.length; i++) {
                        this[prioritized[i].unit](units[prioritized[i].unit])
                    }
                } else {
                    units = normalizeUnits(units);
                    if (isFunction(this[units])) {
                        return this[units](value)
                    }
                }
                return this
            }

            function zeroFill(number, targetLength, forceSign) {
                var absNumber = "" + Math.abs(number),
                    zerosToFill = targetLength - absNumber.length,
                    sign = number >= 0;
                return (sign ? forceSign ? "+" : "" : "-") + Math.pow(10, Math.max(0, zerosToFill)).toString().substr(1) + absNumber
            }
            var formattingTokens = /(\[[^\[]*\])|(\\)?([Hh]mm(ss)?|Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Qo?|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|kk?|mm?|ss?|S{1,9}|x|X|zz?|ZZ?|.)/g;
            var localFormattingTokens = /(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g;
            var formatFunctions = {};
            var formatTokenFunctions = {};

            function addFormatToken(token, padded, ordinal, callback) {
                var func = callback;
                if (typeof callback === "string") {
                    func = function() {
                        return this[callback]()
                    }
                }
                if (token) {
                    formatTokenFunctions[token] = func
                }
                if (padded) {
                    formatTokenFunctions[padded[0]] = function() {
                        return zeroFill(func.apply(this, arguments), padded[1], padded[2])
                    }
                }
                if (ordinal) {
                    formatTokenFunctions[ordinal] = function() {
                        return this.localeData().ordinal(func.apply(this, arguments), token)
                    }
                }
            }

            function removeFormattingTokens(input) {
                if (input.match(/\[[\s\S]/)) {
                    return input.replace(/^\[|\]$/g, "")
                }
                return input.replace(/\\/g, "")
            }

            function makeFormatFunction(format) {
                var array = format.match(formattingTokens),
                    i, length;
                for (i = 0, length = array.length; i < length; i++) {
                    if (formatTokenFunctions[array[i]]) {
                        array[i] = formatTokenFunctions[array[i]]
                    } else {
                        array[i] = removeFormattingTokens(array[i])
                    }
                }
                return function(mom) {
                    var output = "",
                        i;
                    for (i = 0; i < length; i++) {
                        output += array[i] instanceof Function ? array[i].call(mom, format) : array[i]
                    }
                    return output
                }
            }

            function formatMoment(m, format) {
                if (!m.isValid()) {
                    return m.localeData().invalidDate()
                }
                format = expandFormat(format, m.localeData());
                formatFunctions[format] = formatFunctions[format] || makeFormatFunction(format);
                return formatFunctions[format](m)
            }

            function expandFormat(format, locale) {
                var i = 5;

                function replaceLongDateFormatTokens(input) {
                    return locale.longDateFormat(input) || input
                }
                localFormattingTokens.lastIndex = 0;
                while (i >= 0 && localFormattingTokens.test(format)) {
                    format = format.replace(localFormattingTokens, replaceLongDateFormatTokens);
                    localFormattingTokens.lastIndex = 0;
                    i -= 1
                }
                return format
            }
            var match1 = /\d/;
            var match2 = /\d\d/;
            var match3 = /\d{3}/;
            var match4 = /\d{4}/;
            var match6 = /[+-]?\d{6}/;
            var match1to2 = /\d\d?/;
            var match3to4 = /\d\d\d\d?/;
            var match5to6 = /\d\d\d\d\d\d?/;
            var match1to3 = /\d{1,3}/;
            var match1to4 = /\d{1,4}/;
            var match1to6 = /[+-]?\d{1,6}/;
            var matchUnsigned = /\d+/;
            var matchSigned = /[+-]?\d+/;
            var matchOffset = /Z|[+-]\d\d:?\d\d/gi;
            var matchShortOffset = /Z|[+-]\d\d(?::?\d\d)?/gi;
            var matchTimestamp = /[+-]?\d+(\.\d{1,3})?/;
            var matchWord = /[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i;
            var regexes = {};

            function addRegexToken(token, regex, strictRegex) {
                regexes[token] = isFunction(regex) ? regex : function(isStrict, localeData) {
                    return isStrict && strictRegex ? strictRegex : regex
                }
            }

            function getParseRegexForToken(token, config) {
                if (!hasOwnProp(regexes, token)) {
                    return new RegExp(unescapeFormat(token))
                }
                return regexes[token](config._strict, config._locale)
            }

            function unescapeFormat(s) {
                return regexEscape(s.replace("\\", "").replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function(matched, p1, p2, p3, p4) {
                    return p1 || p2 || p3 || p4
                }))
            }

            function regexEscape(s) {
                return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")
            }
            var tokens = {};

            function addParseToken(token, callback) {
                var i, func = callback;
                if (typeof token === "string") {
                    token = [token]
                }
                if (isNumber(callback)) {
                    func = function(input, array) {
                        array[callback] = toInt(input)
                    }
                }
                for (i = 0; i < token.length; i++) {
                    tokens[token[i]] = func
                }
            }

            function addWeekParseToken(token, callback) {
                addParseToken(token, function(input, array, config, token) {
                    config._w = config._w || {};
                    callback(input, config._w, config, token)
                })
            }

            function addTimeToArrayFromToken(token, input, config) {
                if (input != null && hasOwnProp(tokens, token)) {
                    tokens[token](input, config._a, config, token)
                }
            }
            var YEAR = 0;
            var MONTH = 1;
            var DATE = 2;
            var HOUR = 3;
            var MINUTE = 4;
            var SECOND = 5;
            var MILLISECOND = 6;
            var WEEK = 7;
            var WEEKDAY = 8;
            var indexOf;
            if (Array.prototype.indexOf) {
                indexOf = Array.prototype.indexOf
            } else {
                indexOf = function(o) {
                    var i;
                    for (i = 0; i < this.length; ++i) {
                        if (this[i] === o) {
                            return i
                        }
                    }
                    return -1
                }
            }
            var indexOf$1 = indexOf;

            function daysInMonth(year, month) {
                return new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
            }
            addFormatToken("M", ["MM", 2], "Mo", function() {
                return this.month() + 1
            });
            addFormatToken("MMM", 0, 0, function(format) {
                return this.localeData().monthsShort(this, format)
            });
            addFormatToken("MMMM", 0, 0, function(format) {
                return this.localeData().months(this, format)
            });
            addUnitAlias("month", "M");
            addUnitPriority("month", 8);
            addRegexToken("M", match1to2);
            addRegexToken("MM", match1to2, match2);
            addRegexToken("MMM", function(isStrict, locale) {
                return locale.monthsShortRegex(isStrict)
            });
            addRegexToken("MMMM", function(isStrict, locale) {
                return locale.monthsRegex(isStrict)
            });
            addParseToken(["M", "MM"], function(input, array) {
                array[MONTH] = toInt(input) - 1
            });
            addParseToken(["MMM", "MMMM"], function(input, array, config, token) {
                var month = config._locale.monthsParse(input, token, config._strict);
                if (month != null) {
                    array[MONTH] = month
                } else {
                    getParsingFlags(config).invalidMonth = input
                }
            });
            var MONTHS_IN_FORMAT = /D[oD]?(\[[^\[\]]*\]|\s)+MMMM?/;
            var defaultLocaleMonths = "January_February_March_April_May_June_July_August_September_October_November_December".split("_");

            function localeMonths(m, format) {
                if (!m) {
                    return this._months
                }
                return isArray(this._months) ? this._months[m.month()] : this._months[(this._months.isFormat || MONTHS_IN_FORMAT).test(format) ? "format" : "standalone"][m.month()]
            }
            var defaultLocaleMonthsShort = "Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_");

            function localeMonthsShort(m, format) {
                if (!m) {
                    return this._monthsShort
                }
                return isArray(this._monthsShort) ? this._monthsShort[m.month()] : this._monthsShort[MONTHS_IN_FORMAT.test(format) ? "format" : "standalone"][m.month()]
            }

            function handleStrictParse(monthName, format, strict) {
                var i, ii, mom, llc = monthName.toLocaleLowerCase();
                if (!this._monthsParse) {
                    this._monthsParse = [];
                    this._longMonthsParse = [];
                    this._shortMonthsParse = [];
                    for (i = 0; i < 12; ++i) {
                        mom = createUTC([2e3, i]);
                        this._shortMonthsParse[i] = this.monthsShort(mom, "").toLocaleLowerCase();
                        this._longMonthsParse[i] = this.months(mom, "").toLocaleLowerCase()
                    }
                }
                if (strict) {
                    if (format === "MMM") {
                        ii = indexOf$1.call(this._shortMonthsParse, llc);
                        return ii !== -1 ? ii : null
                    } else {
                        ii = indexOf$1.call(this._longMonthsParse, llc);
                        return ii !== -1 ? ii : null
                    }
                } else {
                    if (format === "MMM") {
                        ii = indexOf$1.call(this._shortMonthsParse, llc);
                        if (ii !== -1) {
                            return ii
                        }
                        ii = indexOf$1.call(this._longMonthsParse, llc);
                        return ii !== -1 ? ii : null
                    } else {
                        ii = indexOf$1.call(this._longMonthsParse, llc);
                        if (ii !== -1) {
                            return ii
                        }
                        ii = indexOf$1.call(this._shortMonthsParse, llc);
                        return ii !== -1 ? ii : null
                    }
                }
            }

            function localeMonthsParse(monthName, format, strict) {
                var i, mom, regex;
                if (this._monthsParseExact) {
                    return handleStrictParse.call(this, monthName, format, strict)
                }
                if (!this._monthsParse) {
                    this._monthsParse = [];
                    this._longMonthsParse = [];
                    this._shortMonthsParse = []
                }
                for (i = 0; i < 12; i++) {
                    mom = createUTC([2e3, i]);
                    if (strict && !this._longMonthsParse[i]) {
                        this._longMonthsParse[i] = new RegExp("^" + this.months(mom, "").replace(".", "") + "$", "i");
                        this._shortMonthsParse[i] = new RegExp("^" + this.monthsShort(mom, "").replace(".", "") + "$", "i")
                    }
                    if (!strict && !this._monthsParse[i]) {
                        regex = "^" + this.months(mom, "") + "|^" + this.monthsShort(mom, "");
                        this._monthsParse[i] = new RegExp(regex.replace(".", ""), "i")
                    }
                    if (strict && format === "MMMM" && this._longMonthsParse[i].test(monthName)) {
                        return i
                    } else if (strict && format === "MMM" && this._shortMonthsParse[i].test(monthName)) {
                        return i
                    } else if (!strict && this._monthsParse[i].test(monthName)) {
                        return i
                    }
                }
            }

            function setMonth(mom, value) {
                var dayOfMonth;
                if (!mom.isValid()) {
                    return mom
                }
                if (typeof value === "string") {
                    if (/^\d+$/.test(value)) {
                        value = toInt(value)
                    } else {
                        value = mom.localeData().monthsParse(value);
                        if (!isNumber(value)) {
                            return mom
                        }
                    }
                }
                dayOfMonth = Math.min(mom.date(), daysInMonth(mom.year(), value));
                mom._d["set" + (mom._isUTC ? "UTC" : "") + "Month"](value, dayOfMonth);
                return mom
            }

            function getSetMonth(value) {
                if (value != null) {
                    setMonth(this, value);
                    hooks.updateOffset(this, true);
                    return this
                } else {
                    return get(this, "Month")
                }
            }

            function getDaysInMonth() {
                return daysInMonth(this.year(), this.month())
            }
            var defaultMonthsShortRegex = matchWord;

            function monthsShortRegex(isStrict) {
                if (this._monthsParseExact) {
                    if (!hasOwnProp(this, "_monthsRegex")) {
                        computeMonthsParse.call(this)
                    }
                    if (isStrict) {
                        return this._monthsShortStrictRegex
                    } else {
                        return this._monthsShortRegex
                    }
                } else {
                    if (!hasOwnProp(this, "_monthsShortRegex")) {
                        this._monthsShortRegex = defaultMonthsShortRegex
                    }
                    return this._monthsShortStrictRegex && isStrict ? this._monthsShortStrictRegex : this._monthsShortRegex
                }
            }
            var defaultMonthsRegex = matchWord;

            function monthsRegex(isStrict) {
                if (this._monthsParseExact) {
                    if (!hasOwnProp(this, "_monthsRegex")) {
                        computeMonthsParse.call(this)
                    }
                    if (isStrict) {
                        return this._monthsStrictRegex
                    } else {
                        return this._monthsRegex
                    }
                } else {
                    if (!hasOwnProp(this, "_monthsRegex")) {
                        this._monthsRegex = defaultMonthsRegex
                    }
                    return this._monthsStrictRegex && isStrict ? this._monthsStrictRegex : this._monthsRegex
                }
            }

            function computeMonthsParse() {
                function cmpLenRev(a, b) {
                    return b.length - a.length
                }
                var shortPieces = [],
                    longPieces = [],
                    mixedPieces = [],
                    i, mom;
                for (i = 0; i < 12; i++) {
                    mom = createUTC([2e3, i]);
                    shortPieces.push(this.monthsShort(mom, ""));
                    longPieces.push(this.months(mom, ""));
                    mixedPieces.push(this.months(mom, ""));
                    mixedPieces.push(this.monthsShort(mom, ""))
                }
                shortPieces.sort(cmpLenRev);
                longPieces.sort(cmpLenRev);
                mixedPieces.sort(cmpLenRev);
                for (i = 0; i < 12; i++) {
                    shortPieces[i] = regexEscape(shortPieces[i]);
                    longPieces[i] = regexEscape(longPieces[i])
                }
                for (i = 0; i < 24; i++) {
                    mixedPieces[i] = regexEscape(mixedPieces[i])
                }
                this._monthsRegex = new RegExp("^(" + mixedPieces.join("|") + ")", "i");
                this._monthsShortRegex = this._monthsRegex;
                this._monthsStrictRegex = new RegExp("^(" + longPieces.join("|") + ")", "i");
                this._monthsShortStrictRegex = new RegExp("^(" + shortPieces.join("|") + ")", "i")
            }
            addFormatToken("Y", 0, 0, function() {
                var y = this.year();
                return y <= 9999 ? "" + y : "+" + y
            });
            addFormatToken(0, ["YY", 2], 0, function() {
                return this.year() % 100
            });
            addFormatToken(0, ["YYYY", 4], 0, "year");
            addFormatToken(0, ["YYYYY", 5], 0, "year");
            addFormatToken(0, ["YYYYYY", 6, true], 0, "year");
            addUnitAlias("year", "y");
            addUnitPriority("year", 1);
            addRegexToken("Y", matchSigned);
            addRegexToken("YY", match1to2, match2);
            addRegexToken("YYYY", match1to4, match4);
            addRegexToken("YYYYY", match1to6, match6);
            addRegexToken("YYYYYY", match1to6, match6);
            addParseToken(["YYYYY", "YYYYYY"], YEAR);
            addParseToken("YYYY", function(input, array) {
                array[YEAR] = input.length === 2 ? hooks.parseTwoDigitYear(input) : toInt(input)
            });
            addParseToken("YY", function(input, array) {
                array[YEAR] = hooks.parseTwoDigitYear(input)
            });
            addParseToken("Y", function(input, array) {
                array[YEAR] = parseInt(input, 10)
            });

            function daysInYear(year) {
                return isLeapYear(year) ? 366 : 365
            }

            function isLeapYear(year) {
                return year % 4 === 0 && year % 100 !== 0 || year % 400 === 0
            }
            hooks.parseTwoDigitYear = function(input) {
                return toInt(input) + (toInt(input) > 68 ? 1900 : 2e3)
            };
            var getSetYear = makeGetSet("FullYear", true);

            function getIsLeapYear() {
                return isLeapYear(this.year())
            }

            function createDate(y, m, d, h, M, s, ms) {
                var date = new Date(y, m, d, h, M, s, ms);
                if (y < 100 && y >= 0 && isFinite(date.getFullYear())) {
                    date.setFullYear(y)
                }
                return date
            }

            function createUTCDate(y) {
                var date = new Date(Date.UTC.apply(null, arguments));
                if (y < 100 && y >= 0 && isFinite(date.getUTCFullYear())) {
                    date.setUTCFullYear(y)
                }
                return date
            }

            function firstWeekOffset(year, dow, doy) {
                var fwd = 7 + dow - doy,
                    fwdlw = (7 + createUTCDate(year, 0, fwd).getUTCDay() - dow) % 7;
                return -fwdlw + fwd - 1
            }

            function dayOfYearFromWeeks(year, week, weekday, dow, doy) {
                var localWeekday = (7 + weekday - dow) % 7,
                    weekOffset = firstWeekOffset(year, dow, doy),
                    dayOfYear = 1 + 7 * (week - 1) + localWeekday + weekOffset,
                    resYear, resDayOfYear;
                if (dayOfYear <= 0) {
                    resYear = year - 1;
                    resDayOfYear = daysInYear(resYear) + dayOfYear
                } else if (dayOfYear > daysInYear(year)) {
                    resYear = year + 1;
                    resDayOfYear = dayOfYear - daysInYear(year)
                } else {
                    resYear = year;
                    resDayOfYear = dayOfYear
                }
                return {
                    year: resYear,
                    dayOfYear: resDayOfYear
                }
            }

            function weekOfYear(mom, dow, doy) {
                var weekOffset = firstWeekOffset(mom.year(), dow, doy),
                    week = Math.floor((mom.dayOfYear() - weekOffset - 1) / 7) + 1,
                    resWeek, resYear;
                if (week < 1) {
                    resYear = mom.year() - 1;
                    resWeek = week + weeksInYear(resYear, dow, doy)
                } else if (week > weeksInYear(mom.year(), dow, doy)) {
                    resWeek = week - weeksInYear(mom.year(), dow, doy);
                    resYear = mom.year() + 1
                } else {
                    resYear = mom.year();
                    resWeek = week
                }
                return {
                    week: resWeek,
                    year: resYear
                }
            }

            function weeksInYear(year, dow, doy) {
                var weekOffset = firstWeekOffset(year, dow, doy),
                    weekOffsetNext = firstWeekOffset(year + 1, dow, doy);
                return (daysInYear(year) - weekOffset + weekOffsetNext) / 7
            }
            addFormatToken("w", ["ww", 2], "wo", "week");
            addFormatToken("W", ["WW", 2], "Wo", "isoWeek");
            addUnitAlias("week", "w");
            addUnitAlias("isoWeek", "W");
            addUnitPriority("week", 5);
            addUnitPriority("isoWeek", 5);
            addRegexToken("w", match1to2);
            addRegexToken("ww", match1to2, match2);
            addRegexToken("W", match1to2);
            addRegexToken("WW", match1to2, match2);
            addWeekParseToken(["w", "ww", "W", "WW"], function(input, week, config, token) {
                week[token.substr(0, 1)] = toInt(input)
            });

            function localeWeek(mom) {
                return weekOfYear(mom, this._week.dow, this._week.doy).week
            }
            var defaultLocaleWeek = {
                dow: 0,
                doy: 6
            };

            function localeFirstDayOfWeek() {
                return this._week.dow
            }

            function localeFirstDayOfYear() {
                return this._week.doy
            }

            function getSetWeek(input) {
                var week = this.localeData().week(this);
                return input == null ? week : this.add((input - week) * 7, "d")
            }

            function getSetISOWeek(input) {
                var week = weekOfYear(this, 1, 4).week;
                return input == null ? week : this.add((input - week) * 7, "d")
            }
            addFormatToken("d", 0, "do", "day");
            addFormatToken("dd", 0, 0, function(format) {
                return this.localeData().weekdaysMin(this, format)
            });
            addFormatToken("ddd", 0, 0, function(format) {
                return this.localeData().weekdaysShort(this, format)
            });
            addFormatToken("dddd", 0, 0, function(format) {
                return this.localeData().weekdays(this, format)
            });
            addFormatToken("e", 0, 0, "weekday");
            addFormatToken("E", 0, 0, "isoWeekday");
            addUnitAlias("day", "d");
            addUnitAlias("weekday", "e");
            addUnitAlias("isoWeekday", "E");
            addUnitPriority("day", 11);
            addUnitPriority("weekday", 11);
            addUnitPriority("isoWeekday", 11);
            addRegexToken("d", match1to2);
            addRegexToken("e", match1to2);
            addRegexToken("E", match1to2);
            addRegexToken("dd", function(isStrict, locale) {
                return locale.weekdaysMinRegex(isStrict)
            });
            addRegexToken("ddd", function(isStrict, locale) {
                return locale.weekdaysShortRegex(isStrict)
            });
            addRegexToken("dddd", function(isStrict, locale) {
                return locale.weekdaysRegex(isStrict)
            });
            addWeekParseToken(["dd", "ddd", "dddd"], function(input, week, config, token) {
                var weekday = config._locale.weekdaysParse(input, token, config._strict);
                if (weekday != null) {
                    week.d = weekday
                } else {
                    getParsingFlags(config).invalidWeekday = input
                }
            });
            addWeekParseToken(["d", "e", "E"], function(input, week, config, token) {
                week[token] = toInt(input)
            });

            function parseWeekday(input, locale) {
                if (typeof input !== "string") {
                    return input
                }
                if (!isNaN(input)) {
                    return parseInt(input, 10)
                }
                input = locale.weekdaysParse(input);
                if (typeof input === "number") {
                    return input
                }
                return null
            }

            function parseIsoWeekday(input, locale) {
                if (typeof input === "string") {
                    return locale.weekdaysParse(input) % 7 || 7
                }
                return isNaN(input) ? null : input
            }
            var defaultLocaleWeekdays = "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_");

            function localeWeekdays(m, format) {
                if (!m) {
                    return this._weekdays
                }
                return isArray(this._weekdays) ? this._weekdays[m.day()] : this._weekdays[this._weekdays.isFormat.test(format) ? "format" : "standalone"][m.day()]
            }
            var defaultLocaleWeekdaysShort = "Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_");

            function localeWeekdaysShort(m) {
                return m ? this._weekdaysShort[m.day()] : this._weekdaysShort
            }
            var defaultLocaleWeekdaysMin = "Su_Mo_Tu_We_Th_Fr_Sa".split("_");

            function localeWeekdaysMin(m) {
                return m ? this._weekdaysMin[m.day()] : this._weekdaysMin
            }

            function handleStrictParse$1(weekdayName, format, strict) {
                var i, ii, mom, llc = weekdayName.toLocaleLowerCase();
                if (!this._weekdaysParse) {
                    this._weekdaysParse = [];
                    this._shortWeekdaysParse = [];
                    this._minWeekdaysParse = [];
                    for (i = 0; i < 7; ++i) {
                        mom = createUTC([2e3, 1]).day(i);
                        this._minWeekdaysParse[i] = this.weekdaysMin(mom, "").toLocaleLowerCase();
                        this._shortWeekdaysParse[i] = this.weekdaysShort(mom, "").toLocaleLowerCase();
                        this._weekdaysParse[i] = this.weekdays(mom, "").toLocaleLowerCase()
                    }
                }
                if (strict) {
                    if (format === "dddd") {
                        ii = indexOf$1.call(this._weekdaysParse, llc);
                        return ii !== -1 ? ii : null
                    } else if (format === "ddd") {
                        ii = indexOf$1.call(this._shortWeekdaysParse, llc);
                        return ii !== -1 ? ii : null
                    } else {
                        ii = indexOf$1.call(this._minWeekdaysParse, llc);
                        return ii !== -1 ? ii : null
                    }
                } else {
                    if (format === "dddd") {
                        ii = indexOf$1.call(this._weekdaysParse, llc);
                        if (ii !== -1) {
                            return ii
                        }
                        ii = indexOf$1.call(this._shortWeekdaysParse, llc);
                        if (ii !== -1) {
                            return ii
                        }
                        ii = indexOf$1.call(this._minWeekdaysParse, llc);
                        return ii !== -1 ? ii : null
                    } else if (format === "ddd") {
                        ii = indexOf$1.call(this._shortWeekdaysParse, llc);
                        if (ii !== -1) {
                            return ii
                        }
                        ii = indexOf$1.call(this._weekdaysParse, llc);
                        if (ii !== -1) {
                            return ii
                        }
                        ii = indexOf$1.call(this._minWeekdaysParse, llc);
                        return ii !== -1 ? ii : null
                    } else {
                        ii = indexOf$1.call(this._minWeekdaysParse, llc);
                        if (ii !== -1) {
                            return ii
                        }
                        ii = indexOf$1.call(this._weekdaysParse, llc);
                        if (ii !== -1) {
                            return ii
                        }
                        ii = indexOf$1.call(this._shortWeekdaysParse, llc);
                        return ii !== -1 ? ii : null
                    }
                }
            }

            function localeWeekdaysParse(weekdayName, format, strict) {
                var i, mom, regex;
                if (this._weekdaysParseExact) {
                    return handleStrictParse$1.call(this, weekdayName, format, strict)
                }
                if (!this._weekdaysParse) {
                    this._weekdaysParse = [];
                    this._minWeekdaysParse = [];
                    this._shortWeekdaysParse = [];
                    this._fullWeekdaysParse = []
                }
                for (i = 0; i < 7; i++) {
                    mom = createUTC([2e3, 1]).day(i);
                    if (strict && !this._fullWeekdaysParse[i]) {
                        this._fullWeekdaysParse[i] = new RegExp("^" + this.weekdays(mom, "").replace(".", ".?") + "$", "i");
                        this._shortWeekdaysParse[i] = new RegExp("^" + this.weekdaysShort(mom, "").replace(".", ".?") + "$", "i");
                        this._minWeekdaysParse[i] = new RegExp("^" + this.weekdaysMin(mom, "").replace(".", ".?") + "$", "i")
                    }
                    if (!this._weekdaysParse[i]) {
                        regex = "^" + this.weekdays(mom, "") + "|^" + this.weekdaysShort(mom, "") + "|^" + this.weekdaysMin(mom, "");
                        this._weekdaysParse[i] = new RegExp(regex.replace(".", ""), "i")
                    }
                    if (strict && format === "dddd" && this._fullWeekdaysParse[i].test(weekdayName)) {
                        return i
                    } else if (strict && format === "ddd" && this._shortWeekdaysParse[i].test(weekdayName)) {
                        return i
                    } else if (strict && format === "dd" && this._minWeekdaysParse[i].test(weekdayName)) {
                        return i
                    } else if (!strict && this._weekdaysParse[i].test(weekdayName)) {
                        return i
                    }
                }
            }

            function getSetDayOfWeek(input) {
                if (!this.isValid()) {
                    return input != null ? this : NaN
                }
                var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
                if (input != null) {
                    input = parseWeekday(input, this.localeData());
                    return this.add(input - day, "d")
                } else {
                    return day
                }
            }

            function getSetLocaleDayOfWeek(input) {
                if (!this.isValid()) {
                    return input != null ? this : NaN
                }
                var weekday = (this.day() + 7 - this.localeData()._week.dow) % 7;
                return input == null ? weekday : this.add(input - weekday, "d")
            }

            function getSetISODayOfWeek(input) {
                if (!this.isValid()) {
                    return input != null ? this : NaN
                }
                if (input != null) {
                    var weekday = parseIsoWeekday(input, this.localeData());
                    return this.day(this.day() % 7 ? weekday : weekday - 7)
                } else {
                    return this.day() || 7
                }
            }
            var defaultWeekdaysRegex = matchWord;

            function weekdaysRegex(isStrict) {
                if (this._weekdaysParseExact) {
                    if (!hasOwnProp(this, "_weekdaysRegex")) {
                        computeWeekdaysParse.call(this)
                    }
                    if (isStrict) {
                        return this._weekdaysStrictRegex
                    } else {
                        return this._weekdaysRegex
                    }
                } else {
                    if (!hasOwnProp(this, "_weekdaysRegex")) {
                        this._weekdaysRegex = defaultWeekdaysRegex
                    }
                    return this._weekdaysStrictRegex && isStrict ? this._weekdaysStrictRegex : this._weekdaysRegex
                }
            }
            var defaultWeekdaysShortRegex = matchWord;

            function weekdaysShortRegex(isStrict) {
                if (this._weekdaysParseExact) {
                    if (!hasOwnProp(this, "_weekdaysRegex")) {
                        computeWeekdaysParse.call(this)
                    }
                    if (isStrict) {
                        return this._weekdaysShortStrictRegex
                    } else {
                        return this._weekdaysShortRegex
                    }
                } else {
                    if (!hasOwnProp(this, "_weekdaysShortRegex")) {
                        this._weekdaysShortRegex = defaultWeekdaysShortRegex
                    }
                    return this._weekdaysShortStrictRegex && isStrict ? this._weekdaysShortStrictRegex : this._weekdaysShortRegex
                }
            }
            var defaultWeekdaysMinRegex = matchWord;

            function weekdaysMinRegex(isStrict) {
                if (this._weekdaysParseExact) {
                    if (!hasOwnProp(this, "_weekdaysRegex")) {
                        computeWeekdaysParse.call(this)
                    }
                    if (isStrict) {
                        return this._weekdaysMinStrictRegex
                    } else {
                        return this._weekdaysMinRegex
                    }
                } else {
                    if (!hasOwnProp(this, "_weekdaysMinRegex")) {
                        this._weekdaysMinRegex = defaultWeekdaysMinRegex
                    }
                    return this._weekdaysMinStrictRegex && isStrict ? this._weekdaysMinStrictRegex : this._weekdaysMinRegex
                }
            }

            function computeWeekdaysParse() {
                function cmpLenRev(a, b) {
                    return b.length - a.length
                }
                var minPieces = [],
                    shortPieces = [],
                    longPieces = [],
                    mixedPieces = [],
                    i, mom, minp, shortp, longp;
                for (i = 0; i < 7; i++) {
                    mom = createUTC([2e3, 1]).day(i);
                    minp = this.weekdaysMin(mom, "");
                    shortp = this.weekdaysShort(mom, "");
                    longp = this.weekdays(mom, "");
                    minPieces.push(minp);
                    shortPieces.push(shortp);
                    longPieces.push(longp);
                    mixedPieces.push(minp);
                    mixedPieces.push(shortp);
                    mixedPieces.push(longp)
                }
                minPieces.sort(cmpLenRev);
                shortPieces.sort(cmpLenRev);
                longPieces.sort(cmpLenRev);
                mixedPieces.sort(cmpLenRev);
                for (i = 0; i < 7; i++) {
                    shortPieces[i] = regexEscape(shortPieces[i]);
                    longPieces[i] = regexEscape(longPieces[i]);
                    mixedPieces[i] = regexEscape(mixedPieces[i])
                }
                this._weekdaysRegex = new RegExp("^(" + mixedPieces.join("|") + ")", "i");
                this._weekdaysShortRegex = this._weekdaysRegex;
                this._weekdaysMinRegex = this._weekdaysRegex;
                this._weekdaysStrictRegex = new RegExp("^(" + longPieces.join("|") + ")", "i");
                this._weekdaysShortStrictRegex = new RegExp("^(" + shortPieces.join("|") + ")", "i");
                this._weekdaysMinStrictRegex = new RegExp("^(" + minPieces.join("|") + ")", "i")
            }

            function hFormat() {
                return this.hours() % 12 || 12
            }

            function kFormat() {
                return this.hours() || 24
            }
            addFormatToken("H", ["HH", 2], 0, "hour");
            addFormatToken("h", ["hh", 2], 0, hFormat);
            addFormatToken("k", ["kk", 2], 0, kFormat);
            addFormatToken("hmm", 0, 0, function() {
                return "" + hFormat.apply(this) + zeroFill(this.minutes(), 2)
            });
            addFormatToken("hmmss", 0, 0, function() {
                return "" + hFormat.apply(this) + zeroFill(this.minutes(), 2) + zeroFill(this.seconds(), 2)
            });
            addFormatToken("Hmm", 0, 0, function() {
                return "" + this.hours() + zeroFill(this.minutes(), 2)
            });
            addFormatToken("Hmmss", 0, 0, function() {
                return "" + this.hours() + zeroFill(this.minutes(), 2) + zeroFill(this.seconds(), 2)
            });

            function meridiem(token, lowercase) {
                addFormatToken(token, 0, 0, function() {
                    return this.localeData().meridiem(this.hours(), this.minutes(), lowercase)
                })
            }
            meridiem("a", true);
            meridiem("A", false);
            addUnitAlias("hour", "h");
            addUnitPriority("hour", 13);

            function matchMeridiem(isStrict, locale) {
                return locale._meridiemParse
            }
            addRegexToken("a", matchMeridiem);
            addRegexToken("A", matchMeridiem);
            addRegexToken("H", match1to2);
            addRegexToken("h", match1to2);
            addRegexToken("HH", match1to2, match2);
            addRegexToken("hh", match1to2, match2);
            addRegexToken("hmm", match3to4);
            addRegexToken("hmmss", match5to6);
            addRegexToken("Hmm", match3to4);
            addRegexToken("Hmmss", match5to6);
            addParseToken(["H", "HH"], HOUR);
            addParseToken(["a", "A"], function(input, array, config) {
                config._isPm = config._locale.isPM(input);
                config._meridiem = input
            });
            addParseToken(["h", "hh"], function(input, array, config) {
                array[HOUR] = toInt(input);
                getParsingFlags(config).bigHour = true
            });
            addParseToken("hmm", function(input, array, config) {
                var pos = input.length - 2;
                array[HOUR] = toInt(input.substr(0, pos));
                array[MINUTE] = toInt(input.substr(pos));
                getParsingFlags(config).bigHour = true
            });
            addParseToken("hmmss", function(input, array, config) {
                var pos1 = input.length - 4;
                var pos2 = input.length - 2;
                array[HOUR] = toInt(input.substr(0, pos1));
                array[MINUTE] = toInt(input.substr(pos1, 2));
                array[SECOND] = toInt(input.substr(pos2));
                getParsingFlags(config).bigHour = true
            });
            addParseToken("Hmm", function(input, array, config) {
                var pos = input.length - 2;
                array[HOUR] = toInt(input.substr(0, pos));
                array[MINUTE] = toInt(input.substr(pos))
            });
            addParseToken("Hmmss", function(input, array, config) {
                var pos1 = input.length - 4;
                var pos2 = input.length - 2;
                array[HOUR] = toInt(input.substr(0, pos1));
                array[MINUTE] = toInt(input.substr(pos1, 2));
                array[SECOND] = toInt(input.substr(pos2))
            });

            function localeIsPM(input) {
                return (input + "").toLowerCase().charAt(0) === "p"
            }
            var defaultLocaleMeridiemParse = /[ap]\.?m?\.?/i;

            function localeMeridiem(hours, minutes, isLower) {
                if (hours > 11) {
                    return isLower ? "pm" : "PM"
                } else {
                    return isLower ? "am" : "AM"
                }
            }
            var getSetHour = makeGetSet("Hours", true);
            var baseConfig = {
                calendar: defaultCalendar,
                longDateFormat: defaultLongDateFormat,
                invalidDate: defaultInvalidDate,
                ordinal: defaultOrdinal,
                ordinalParse: defaultOrdinalParse,
                relativeTime: defaultRelativeTime,
                months: defaultLocaleMonths,
                monthsShort: defaultLocaleMonthsShort,
                week: defaultLocaleWeek,
                weekdays: defaultLocaleWeekdays,
                weekdaysMin: defaultLocaleWeekdaysMin,
                weekdaysShort: defaultLocaleWeekdaysShort,
                meridiemParse: defaultLocaleMeridiemParse
            };
            var locales = {};
            var localeFamilies = {};
            var globalLocale;

            function normalizeLocale(key) {
                return key ? key.toLowerCase().replace("_", "-") : key
            }

            function chooseLocale(names) {
                var i = 0,
                    j, next, locale, split;
                while (i < names.length) {
                    split = normalizeLocale(names[i]).split("-");
                    j = split.length;
                    next = normalizeLocale(names[i + 1]);
                    next = next ? next.split("-") : null;
                    while (j > 0) {
                        locale = loadLocale(split.slice(0, j).join("-"));
                        if (locale) {
                            return locale
                        }
                        if (next && next.length >= j && compareArrays(split, next, true) >= j - 1) {
                            break
                        }
                        j--
                    }
                    i++
                }
                return null
            }

            function loadLocale(name) {
                var oldLocale = null;
                if (!locales[name] && typeof module !== "undefined" && module && module.exports) {
                    try {
                        oldLocale = globalLocale._abbr;
                        require("./locale/" + name);
                        getSetGlobalLocale(oldLocale)
                    } catch (e) {}
                }
                return locales[name]
            }

            function getSetGlobalLocale(key, values) {
                var data;
                if (key) {
                    if (isUndefined(values)) {
                        data = getLocale(key)
                    } else {
                        data = defineLocale(key, values)
                    }
                    if (data) {
                        globalLocale = data
                    }
                }
                return globalLocale._abbr
            }

            function defineLocale(name, config) {
                if (config !== null) {
                    var parentConfig = baseConfig;
                    config.abbr = name;
                    if (locales[name] != null) {
                        deprecateSimple("defineLocaleOverride", "use moment.updateLocale(localeName, config) to change " + "an existing locale. moment.defineLocale(localeName, " + "config) should only be used for creating a new locale " + "See http://momentjs.com/guides/#/warnings/define-locale/ for more info.");
                        parentConfig = locales[name]._config
                    } else if (config.parentLocale != null) {
                        if (locales[config.parentLocale] != null) {
                            parentConfig = locales[config.parentLocale]._config
                        } else {
                            if (!localeFamilies[config.parentLocale]) {
                                localeFamilies[config.parentLocale] = []
                            }
                            localeFamilies[config.parentLocale].push({
                                name: name,
                                config: config
                            });
                            return null
                        }
                    }
                    locales[name] = new Locale(mergeConfigs(parentConfig, config));
                    if (localeFamilies[name]) {
                        localeFamilies[name].forEach(function(x) {
                            defineLocale(x.name, x.config)
                        })
                    }
                    getSetGlobalLocale(name);
                    return locales[name]
                } else {
                    delete locales[name];
                    return null
                }
            }

            function updateLocale(name, config) {
                if (config != null) {
                    var locale, parentConfig = baseConfig;
                    if (locales[name] != null) {
                        parentConfig = locales[name]._config
                    }
                    config = mergeConfigs(parentConfig, config);
                    locale = new Locale(config);
                    locale.parentLocale = locales[name];
                    locales[name] = locale;
                    getSetGlobalLocale(name)
                } else {
                    if (locales[name] != null) {
                        if (locales[name].parentLocale != null) {
                            locales[name] = locales[name].parentLocale
                        } else if (locales[name] != null) {
                            delete locales[name]
                        }
                    }
                }
                return locales[name]
            }

            function getLocale(key) {
                var locale;
                if (key && key._locale && key._locale._abbr) {
                    key = key._locale._abbr
                }
                if (!key) {
                    return globalLocale
                }
                if (!isArray(key)) {
                    locale = loadLocale(key);
                    if (locale) {
                        return locale
                    }
                    key = [key]
                }
                return chooseLocale(key)
            }

            function listLocales() {
                return keys$1(locales)
            }

            function checkOverflow(m) {
                var overflow;
                var a = m._a;
                if (a && getParsingFlags(m).overflow === -2) {
                    overflow = a[MONTH] < 0 || a[MONTH] > 11 ? MONTH : a[DATE] < 1 || a[DATE] > daysInMonth(a[YEAR], a[MONTH]) ? DATE : a[HOUR] < 0 || a[HOUR] > 24 || a[HOUR] === 24 && (a[MINUTE] !== 0 || a[SECOND] !== 0 || a[MILLISECOND] !== 0) ? HOUR : a[MINUTE] < 0 || a[MINUTE] > 59 ? MINUTE : a[SECOND] < 0 || a[SECOND] > 59 ? SECOND : a[MILLISECOND] < 0 || a[MILLISECOND] > 999 ? MILLISECOND : -1;
                    if (getParsingFlags(m)._overflowDayOfYear && (overflow < YEAR || overflow > DATE)) {
                        overflow = DATE
                    }
                    if (getParsingFlags(m)._overflowWeeks && overflow === -1) {
                        overflow = WEEK
                    }
                    if (getParsingFlags(m)._overflowWeekday && overflow === -1) {
                        overflow = WEEKDAY
                    }
                    getParsingFlags(m).overflow = overflow
                }
                return m
            }
            var extendedIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})-(?:\d\d-\d\d|W\d\d-\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?::\d\d(?::\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/;
            var basicIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})(?:\d\d\d\d|W\d\d\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?:\d\d(?:\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/;
            var tzRegex = /Z|[+-]\d\d(?::?\d\d)?/;
            var isoDates = [
                ["YYYYYY-MM-DD", /[+-]\d{6}-\d\d-\d\d/],
                ["YYYY-MM-DD", /\d{4}-\d\d-\d\d/],
                ["GGGG-[W]WW-E", /\d{4}-W\d\d-\d/],
                ["GGGG-[W]WW", /\d{4}-W\d\d/, false],
                ["YYYY-DDD", /\d{4}-\d{3}/],
                ["YYYY-MM", /\d{4}-\d\d/, false],
                ["YYYYYYMMDD", /[+-]\d{10}/],
                ["YYYYMMDD", /\d{8}/],
                ["GGGG[W]WWE", /\d{4}W\d{3}/],
                ["GGGG[W]WW", /\d{4}W\d{2}/, false],
                ["YYYYDDD", /\d{7}/]
            ];
            var isoTimes = [
                ["HH:mm:ss.SSSS", /\d\d:\d\d:\d\d\.\d+/],
                ["HH:mm:ss,SSSS", /\d\d:\d\d:\d\d,\d+/],
                ["HH:mm:ss", /\d\d:\d\d:\d\d/],
                ["HH:mm", /\d\d:\d\d/],
                ["HHmmss.SSSS", /\d\d\d\d\d\d\.\d+/],
                ["HHmmss,SSSS", /\d\d\d\d\d\d,\d+/],
                ["HHmmss", /\d\d\d\d\d\d/],
                ["HHmm", /\d\d\d\d/],
                ["HH", /\d\d/]
            ];
            var aspNetJsonRegex = /^\/?Date\((\-?\d+)/i;

            function configFromISO(config) {
                var i, l, string = config._i,
                    match = extendedIsoRegex.exec(string) || basicIsoRegex.exec(string),
                    allowTime, dateFormat, timeFormat, tzFormat;
                if (match) {
                    getParsingFlags(config).iso = true;
                    for (i = 0, l = isoDates.length; i < l; i++) {
                        if (isoDates[i][1].exec(match[1])) {
                            dateFormat = isoDates[i][0];
                            allowTime = isoDates[i][2] !== false;
                            break
                        }
                    }
                    if (dateFormat == null) {
                        config._isValid = false;
                        return
                    }
                    if (match[3]) {
                        for (i = 0, l = isoTimes.length; i < l; i++) {
                            if (isoTimes[i][1].exec(match[3])) {
                                timeFormat = (match[2] || " ") + isoTimes[i][0];
                                break
                            }
                        }
                        if (timeFormat == null) {
                            config._isValid = false;
                            return
                        }
                    }
                    if (!allowTime && timeFormat != null) {
                        config._isValid = false;
                        return
                    }
                    if (match[4]) {
                        if (tzRegex.exec(match[4])) {
                            tzFormat = "Z"
                        } else {
                            config._isValid = false;
                            return
                        }
                    }
                    config._f = dateFormat + (timeFormat || "") + (tzFormat || "");
                    configFromStringAndFormat(config)
                } else {
                    config._isValid = false
                }
            }

            function configFromString(config) {
                var matched = aspNetJsonRegex.exec(config._i);
                if (matched !== null) {
                    config._d = new Date(+matched[1]);
                    return
                }
                configFromISO(config);
                if (config._isValid === false) {
                    delete config._isValid;
                    hooks.createFromInputFallback(config)
                }
            }
            hooks.createFromInputFallback = deprecate("value provided is not in a recognized ISO format. moment construction falls back to js Date(), " + "which is not reliable across all browsers and versions. Non ISO date formats are " + "discouraged and will be removed in an upcoming major release. Please refer to " + "http://momentjs.com/guides/#/warnings/js-date/ for more info.", function(config) {
                config._d = new Date(config._i + (config._useUTC ? " UTC" : ""))
            });

            function defaults(a, b, c) {
                if (a != null) {
                    return a
                }
                if (b != null) {
                    return b
                }
                return c
            }

            function currentDateArray(config) {
                var nowValue = new Date(hooks.now());
                if (config._useUTC) {
                    return [nowValue.getUTCFullYear(), nowValue.getUTCMonth(), nowValue.getUTCDate()]
                }
                return [nowValue.getFullYear(), nowValue.getMonth(), nowValue.getDate()]
            }

            function configFromArray(config) {
                var i, date, input = [],
                    currentDate, yearToUse;
                if (config._d) {
                    return
                }
                currentDate = currentDateArray(config);
                if (config._w && config._a[DATE] == null && config._a[MONTH] == null) {
                    dayOfYearFromWeekInfo(config)
                }
                if (config._dayOfYear) {
                    yearToUse = defaults(config._a[YEAR], currentDate[YEAR]);
                    if (config._dayOfYear > daysInYear(yearToUse)) {
                        getParsingFlags(config)._overflowDayOfYear = true
                    }
                    date = createUTCDate(yearToUse, 0, config._dayOfYear);
                    config._a[MONTH] = date.getUTCMonth();
                    config._a[DATE] = date.getUTCDate()
                }
                for (i = 0; i < 3 && config._a[i] == null; ++i) {
                    config._a[i] = input[i] = currentDate[i]
                }
                for (; i < 7; i++) {
                    config._a[i] = input[i] = config._a[i] == null ? i === 2 ? 1 : 0 : config._a[i]
                }
                if (config._a[HOUR] === 24 && config._a[MINUTE] === 0 && config._a[SECOND] === 0 && config._a[MILLISECOND] === 0) {
                    config._nextDay = true;
                    config._a[HOUR] = 0
                }
                config._d = (config._useUTC ? createUTCDate : createDate).apply(null, input);
                if (config._tzm != null) {
                    config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm)
                }
                if (config._nextDay) {
                    config._a[HOUR] = 24
                }
            }

            function dayOfYearFromWeekInfo(config) {
                var w, weekYear, week, weekday, dow, doy, temp, weekdayOverflow;
                w = config._w;
                if (w.GG != null || w.W != null || w.E != null) {
                    dow = 1;
                    doy = 4;
                    weekYear = defaults(w.GG, config._a[YEAR], weekOfYear(createLocal(), 1, 4).year);
                    week = defaults(w.W, 1);
                    weekday = defaults(w.E, 1);
                    if (weekday < 1 || weekday > 7) {
                        weekdayOverflow = true
                    }
                } else {
                    dow = config._locale._week.dow;
                    doy = config._locale._week.doy;
                    var curWeek = weekOfYear(createLocal(), dow, doy);
                    weekYear = defaults(w.gg, config._a[YEAR], curWeek.year);
                    week = defaults(w.w, curWeek.week);
                    if (w.d != null) {
                        weekday = w.d;
                        if (weekday < 0 || weekday > 6) {
                            weekdayOverflow = true
                        }
                    } else if (w.e != null) {
                        weekday = w.e + dow;
                        if (w.e < 0 || w.e > 6) {
                            weekdayOverflow = true
                        }
                    } else {
                        weekday = dow
                    }
                }
                if (week < 1 || week > weeksInYear(weekYear, dow, doy)) {
                    getParsingFlags(config)._overflowWeeks = true
                } else if (weekdayOverflow != null) {
                    getParsingFlags(config)._overflowWeekday = true
                } else {
                    temp = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy);
                    config._a[YEAR] = temp.year;
                    config._dayOfYear = temp.dayOfYear
                }
            }
            hooks.ISO_8601 = function() {};

            function configFromStringAndFormat(config) {
                if (config._f === hooks.ISO_8601) {
                    configFromISO(config);
                    return
                }
                config._a = [];
                getParsingFlags(config).empty = true;
                var string = "" + config._i,
                    i, parsedInput, tokens, token, skipped, stringLength = string.length,
                    totalParsedInputLength = 0;
                tokens = expandFormat(config._f, config._locale).match(formattingTokens) || [];
                for (i = 0; i < tokens.length; i++) {
                    token = tokens[i];
                    parsedInput = (string.match(getParseRegexForToken(token, config)) || [])[0];
                    if (parsedInput) {
                        skipped = string.substr(0, string.indexOf(parsedInput));
                        if (skipped.length > 0) {
                            getParsingFlags(config).unusedInput.push(skipped)
                        }
                        string = string.slice(string.indexOf(parsedInput) + parsedInput.length);
                        totalParsedInputLength += parsedInput.length
                    }
                    if (formatTokenFunctions[token]) {
                        if (parsedInput) {
                            getParsingFlags(config).empty = false
                        } else {
                            getParsingFlags(config).unusedTokens.push(token)
                        }
                        addTimeToArrayFromToken(token, parsedInput, config)
                    } else if (config._strict && !parsedInput) {
                        getParsingFlags(config).unusedTokens.push(token)
                    }
                }
                getParsingFlags(config).charsLeftOver = stringLength - totalParsedInputLength;
                if (string.length > 0) {
                    getParsingFlags(config).unusedInput.push(string)
                }
                if (config._a[HOUR] <= 12 && getParsingFlags(config).bigHour === true && config._a[HOUR] > 0) {
                    getParsingFlags(config).bigHour = undefined
                }
                getParsingFlags(config).parsedDateParts = config._a.slice(0);
                getParsingFlags(config).meridiem = config._meridiem;
                config._a[HOUR] = meridiemFixWrap(config._locale, config._a[HOUR], config._meridiem);
                configFromArray(config);
                checkOverflow(config)
            }

            function meridiemFixWrap(locale, hour, meridiem) {
                var isPm;
                if (meridiem == null) {
                    return hour
                }
                if (locale.meridiemHour != null) {
                    return locale.meridiemHour(hour, meridiem)
                } else if (locale.isPM != null) {
                    isPm = locale.isPM(meridiem);
                    if (isPm && hour < 12) {
                        hour += 12
                    }
                    if (!isPm && hour === 12) {
                        hour = 0
                    }
                    return hour
                } else {
                    return hour
                }
            }

            function configFromStringAndArray(config) {
                var tempConfig, bestMoment, scoreToBeat, i, currentScore;
                if (config._f.length === 0) {
                    getParsingFlags(config).invalidFormat = true;
                    config._d = new Date(NaN);
                    return
                }
                for (i = 0; i < config._f.length; i++) {
                    currentScore = 0;
                    tempConfig = copyConfig({}, config);
                    if (config._useUTC != null) {
                        tempConfig._useUTC = config._useUTC
                    }
                    tempConfig._f = config._f[i];
                    configFromStringAndFormat(tempConfig);
                    if (!isValid(tempConfig)) {
                        continue
                    }
                    currentScore += getParsingFlags(tempConfig).charsLeftOver;
                    currentScore += getParsingFlags(tempConfig).unusedTokens.length * 10;
                    getParsingFlags(tempConfig).score = currentScore;
                    if (scoreToBeat == null || currentScore < scoreToBeat) {
                        scoreToBeat = currentScore;
                        bestMoment = tempConfig
                    }
                }
                extend(config, bestMoment || tempConfig)
            }

            function configFromObject(config) {
                if (config._d) {
                    return
                }
                var i = normalizeObjectUnits(config._i);
                config._a = map([i.year, i.month, i.day || i.date, i.hour, i.minute, i.second, i.millisecond], function(obj) {
                    return obj && parseInt(obj, 10)
                });
                configFromArray(config)
            }

            function createFromConfig(config) {
                var res = new Moment(checkOverflow(prepareConfig(config)));
                if (res._nextDay) {
                    res.add(1, "d");
                    res._nextDay = undefined
                }
                return res
            }

            function prepareConfig(config) {
                var input = config._i,
                    format = config._f;
                config._locale = config._locale || getLocale(config._l);
                if (input === null || format === undefined && input === "") {
                    return createInvalid({
                        nullInput: true
                    })
                }
                if (typeof input === "string") {
                    config._i = input = config._locale.preparse(input)
                }
                if (isMoment(input)) {
                    return new Moment(checkOverflow(input))
                } else if (isDate(input)) {
                    config._d = input
                } else if (isArray(format)) {
                    configFromStringAndArray(config)
                } else if (format) {
                    configFromStringAndFormat(config)
                } else {
                    configFromInput(config)
                }
                if (!isValid(config)) {
                    config._d = null
                }
                return config
            }

            function configFromInput(config) {
                var input = config._i;
                if (input === undefined) {
                    config._d = new Date(hooks.now())
                } else if (isDate(input)) {
                    config._d = new Date(input.valueOf())
                } else if (typeof input === "string") {
                    configFromString(config)
                } else if (isArray(input)) {
                    config._a = map(input.slice(0), function(obj) {
                        return parseInt(obj, 10)
                    });
                    configFromArray(config)
                } else if (typeof input === "object") {
                    configFromObject(config)
                } else if (isNumber(input)) {
                    config._d = new Date(input)
                } else {
                    hooks.createFromInputFallback(config)
                }
            }

            function createLocalOrUTC(input, format, locale, strict, isUTC) {
                var c = {};
                if (locale === true || locale === false) {
                    strict = locale;
                    locale = undefined
                }
                if (isObject(input) && isObjectEmpty(input) || isArray(input) && input.length === 0) {
                    input = undefined
                }
                c._isAMomentObject = true;
                c._useUTC = c._isUTC = isUTC;
                c._l = locale;
                c._i = input;
                c._f = format;
                c._strict = strict;
                return createFromConfig(c)
            }

            function createLocal(input, format, locale, strict) {
                return createLocalOrUTC(input, format, locale, strict, false)
            }
            var prototypeMin = deprecate("moment().min is deprecated, use moment.max instead. http://momentjs.com/guides/#/warnings/min-max/", function() {
                var other = createLocal.apply(null, arguments);
                if (this.isValid() && other.isValid()) {
                    return other < this ? this : other
                } else {
                    return createInvalid()
                }
            });
            var prototypeMax = deprecate("moment().max is deprecated, use moment.min instead. http://momentjs.com/guides/#/warnings/min-max/", function() {
                var other = createLocal.apply(null, arguments);
                if (this.isValid() && other.isValid()) {
                    return other > this ? this : other
                } else {
                    return createInvalid()
                }
            });

            function pickBy(fn, moments) {
                var res, i;
                if (moments.length === 1 && isArray(moments[0])) {
                    moments = moments[0]
                }
                if (!moments.length) {
                    return createLocal()
                }
                res = moments[0];
                for (i = 1; i < moments.length; ++i) {
                    if (!moments[i].isValid() || moments[i][fn](res)) {
                        res = moments[i]
                    }
                }
                return res
            }

            function min() {
                var args = [].slice.call(arguments, 0);
                return pickBy("isBefore", args)
            }

            function max() {
                var args = [].slice.call(arguments, 0);
                return pickBy("isAfter", args)
            }
            var now = function() {
                return Date.now ? Date.now() : +new Date
            };

            function Duration(duration) {
                var normalizedInput = normalizeObjectUnits(duration),
                    years = normalizedInput.year || 0,
                    quarters = normalizedInput.quarter || 0,
                    months = normalizedInput.month || 0,
                    weeks = normalizedInput.week || 0,
                    days = normalizedInput.day || 0,
                    hours = normalizedInput.hour || 0,
                    minutes = normalizedInput.minute || 0,
                    seconds = normalizedInput.second || 0,
                    milliseconds = normalizedInput.millisecond || 0;
                this._milliseconds = +milliseconds + seconds * 1e3 + minutes * 6e4 + hours * 1e3 * 60 * 60;
                this._days = +days + weeks * 7;
                this._months = +months + quarters * 3 + years * 12;
                this._data = {};
                this._locale = getLocale();
                this._bubble()
            }

            function isDuration(obj) {
                return obj instanceof Duration
            }

            function absRound(number) {
                if (number < 0) {
                    return Math.round(-1 * number) * -1
                } else {
                    return Math.round(number)
                }
            }

            function offset(token, separator) {
                addFormatToken(token, 0, 0, function() {
                    var offset = this.utcOffset();
                    var sign = "+";
                    if (offset < 0) {
                        offset = -offset;
                        sign = "-"
                    }
                    return sign + zeroFill(~~(offset / 60), 2) + separator + zeroFill(~~offset % 60, 2)
                })
            }
            offset("Z", ":");
            offset("ZZ", "");
            addRegexToken("Z", matchShortOffset);
            addRegexToken("ZZ", matchShortOffset);
            addParseToken(["Z", "ZZ"], function(input, array, config) {
                config._useUTC = true;
                config._tzm = offsetFromString(matchShortOffset, input)
            });
            var chunkOffset = /([\+\-]|\d\d)/gi;

            function offsetFromString(matcher, string) {
                var matches = (string || "").match(matcher);
                if (matches === null) {
                    return null
                }
                var chunk = matches[matches.length - 1] || [];
                var parts = (chunk + "").match(chunkOffset) || ["-", 0, 0];
                var minutes = +(parts[1] * 60) + toInt(parts[2]);
                return minutes === 0 ? 0 : parts[0] === "+" ? minutes : -minutes
            }

            function cloneWithOffset(input, model) {
                var res, diff;
                if (model._isUTC) {
                    res = model.clone();
                    diff = (isMoment(input) || isDate(input) ? input.valueOf() : createLocal(input).valueOf()) - res.valueOf();
                    res._d.setTime(res._d.valueOf() + diff);
                    hooks.updateOffset(res, false);
                    return res
                } else {
                    return createLocal(input).local()
                }
            }

            function getDateOffset(m) {
                return -Math.round(m._d.getTimezoneOffset() / 15) * 15
            }
            hooks.updateOffset = function() {};

            function getSetOffset(input, keepLocalTime) {
                var offset = this._offset || 0,
                    localAdjust;
                if (!this.isValid()) {
                    return input != null ? this : NaN
                }
                if (input != null) {
                    if (typeof input === "string") {
                        input = offsetFromString(matchShortOffset, input);
                        if (input === null) {
                            return this
                        }
                    } else if (Math.abs(input) < 16) {
                        input = input * 60
                    }
                    if (!this._isUTC && keepLocalTime) {
                        localAdjust = getDateOffset(this)
                    }
                    this._offset = input;
                    this._isUTC = true;
                    if (localAdjust != null) {
                        this.add(localAdjust, "m")
                    }
                    if (offset !== input) {
                        if (!keepLocalTime || this._changeInProgress) {
                            addSubtract(this, createDuration(input - offset, "m"), 1, false)
                        } else if (!this._changeInProgress) {
                            this._changeInProgress = true;
                            hooks.updateOffset(this, true);
                            this._changeInProgress = null
                        }
                    }
                    return this
                } else {
                    return this._isUTC ? offset : getDateOffset(this)
                }
            }

            function getSetZone(input, keepLocalTime) {
                if (input != null) {
                    if (typeof input !== "string") {
                        input = -input
                    }
                    this.utcOffset(input, keepLocalTime);
                    return this
                } else {
                    return -this.utcOffset()
                }
            }

            function setOffsetToUTC(keepLocalTime) {
                return this.utcOffset(0, keepLocalTime)
            }

            function setOffsetToLocal(keepLocalTime) {
                if (this._isUTC) {
                    this.utcOffset(0, keepLocalTime);
                    this._isUTC = false;
                    if (keepLocalTime) {
                        this.subtract(getDateOffset(this), "m")
                    }
                }
                return this
            }

            function setOffsetToParsedOffset() {
                if (this._tzm != null) {
                    this.utcOffset(this._tzm)
                } else if (typeof this._i === "string") {
                    var tZone = offsetFromString(matchOffset, this._i);
                    if (tZone != null) {
                        this.utcOffset(tZone)
                    } else {
                        this.utcOffset(0, true)
                    }
                }
                return this
            }

            function hasAlignedHourOffset(input) {
                if (!this.isValid()) {
                    return false
                }
                input = input ? createLocal(input).utcOffset() : 0;
                return (this.utcOffset() - input) % 60 === 0
            }

            function isDaylightSavingTime() {
                return this.utcOffset() > this.clone().month(0).utcOffset() || this.utcOffset() > this.clone().month(5).utcOffset()
            }

            function isDaylightSavingTimeShifted() {
                if (!isUndefined(this._isDSTShifted)) {
                    return this._isDSTShifted
                }
                var c = {};
                copyConfig(c, this);
                c = prepareConfig(c);
                if (c._a) {
                    var other = c._isUTC ? createUTC(c._a) : createLocal(c._a);
                    this._isDSTShifted = this.isValid() && compareArrays(c._a, other.toArray()) > 0
                } else {
                    this._isDSTShifted = false
                }
                return this._isDSTShifted
            }

            function isLocal() {
                return this.isValid() ? !this._isUTC : false
            }

            function isUtcOffset() {
                return this.isValid() ? this._isUTC : false
            }

            function isUtc() {
                return this.isValid() ? this._isUTC && this._offset === 0 : false
            }
            var aspNetRegex = /^(\-)?(?:(\d*)[. ])?(\d+)\:(\d+)(?:\:(\d+)(\.\d*)?)?$/;
            var isoRegex = /^(-)?P(?:(-?[0-9,.]*)Y)?(?:(-?[0-9,.]*)M)?(?:(-?[0-9,.]*)W)?(?:(-?[0-9,.]*)D)?(?:T(?:(-?[0-9,.]*)H)?(?:(-?[0-9,.]*)M)?(?:(-?[0-9,.]*)S)?)?$/;

            function createDuration(input, key) {
                var duration = input,
                    match = null,
                    sign, ret, diffRes;
                if (isDuration(input)) {
                    duration = {
                        ms: input._milliseconds,
                        d: input._days,
                        M: input._months
                    }
                } else if (isNumber(input)) {
                    duration = {};
                    if (key) {
                        duration[key] = input
                    } else {
                        duration.milliseconds = input
                    }
                } else if (!!(match = aspNetRegex.exec(input))) {
                    sign = match[1] === "-" ? -1 : 1;
                    duration = {
                        y: 0,
                        d: toInt(match[DATE]) * sign,
                        h: toInt(match[HOUR]) * sign,
                        m: toInt(match[MINUTE]) * sign,
                        s: toInt(match[SECOND]) * sign,
                        ms: toInt(absRound(match[MILLISECOND] * 1e3)) * sign
                    }
                } else if (!!(match = isoRegex.exec(input))) {
                    sign = match[1] === "-" ? -1 : 1;
                    duration = {
                        y: parseIso(match[2], sign),
                        M: parseIso(match[3], sign),
                        w: parseIso(match[4], sign),
                        d: parseIso(match[5], sign),
                        h: parseIso(match[6], sign),
                        m: parseIso(match[7], sign),
                        s: parseIso(match[8], sign)
                    }
                } else if (duration == null) {
                    duration = {}
                } else if (typeof duration === "object" && ("from" in duration || "to" in duration)) {
                    diffRes = momentsDifference(createLocal(duration.from), createLocal(duration.to));
                    duration = {};
                    duration.ms = diffRes.milliseconds;
                    duration.M = diffRes.months
                }
                ret = new Duration(duration);
                if (isDuration(input) && hasOwnProp(input, "_locale")) {
                    ret._locale = input._locale
                }
                return ret
            }
            createDuration.fn = Duration.prototype;

            function parseIso(inp, sign) {
                var res = inp && parseFloat(inp.replace(",", "."));
                return (isNaN(res) ? 0 : res) * sign
            }

            function positiveMomentsDifference(base, other) {
                var res = {
                    milliseconds: 0,
                    months: 0
                };
                res.months = other.month() - base.month() + (other.year() - base.year()) * 12;
                if (base.clone().add(res.months, "M").isAfter(other)) {
                    --res.months
                }
                res.milliseconds = +other - +base.clone().add(res.months, "M");
                return res
            }

            function momentsDifference(base, other) {
                var res;
                if (!(base.isValid() && other.isValid())) {
                    return {
                        milliseconds: 0,
                        months: 0
                    }
                }
                other = cloneWithOffset(other, base);
                if (base.isBefore(other)) {
                    res = positiveMomentsDifference(base, other)
                } else {
                    res = positiveMomentsDifference(other, base);
                    res.milliseconds = -res.milliseconds;
                    res.months = -res.months
                }
                return res
            }

            function createAdder(direction, name) {
                return function(val, period) {
                    var dur, tmp;
                    if (period !== null && !isNaN(+period)) {
                        deprecateSimple(name, "moment()." + name + "(period, number) is deprecated. Please use moment()." + name + "(number, period). " + "See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info.");
                        tmp = val;
                        val = period;
                        period = tmp
                    }
                    val = typeof val === "string" ? +val : val;
                    dur = createDuration(val, period);
                    addSubtract(this, dur, direction);
                    return this
                }
            }

            function addSubtract(mom, duration, isAdding, updateOffset) {
                var milliseconds = duration._milliseconds,
                    days = absRound(duration._days),
                    months = absRound(duration._months);
                if (!mom.isValid()) {
                    return
                }
                updateOffset = updateOffset == null ? true : updateOffset;
                if (milliseconds) {
                    mom._d.setTime(mom._d.valueOf() + milliseconds * isAdding)
                }
                if (days) {
                    set$1(mom, "Date", get(mom, "Date") + days * isAdding)
                }
                if (months) {
                    setMonth(mom, get(mom, "Month") + months * isAdding)
                }
                if (updateOffset) {
                    hooks.updateOffset(mom, days || months)
                }
            }
            var add = createAdder(1, "add");
            var subtract = createAdder(-1, "subtract");

            function getCalendarFormat(myMoment, now) {
                var diff = myMoment.diff(now, "days", true);
                return diff < -6 ? "sameElse" : diff < -1 ? "lastWeek" : diff < 0 ? "lastDay" : diff < 1 ? "sameDay" : diff < 2 ? "nextDay" : diff < 7 ? "nextWeek" : "sameElse"
            }

            function calendar$1(time, formats) {
                var now = time || createLocal(),
                    sod = cloneWithOffset(now, this).startOf("day"),
                    format = hooks.calendarFormat(this, sod) || "sameElse";
                var output = formats && (isFunction(formats[format]) ? formats[format].call(this, now) : formats[format]);
                return this.format(output || this.localeData().calendar(format, this, createLocal(now)))
            }

            function clone() {
                return new Moment(this)
            }

            function isAfter(input, units) {
                var localInput = isMoment(input) ? input : createLocal(input);
                if (!(this.isValid() && localInput.isValid())) {
                    return false
                }
                units = normalizeUnits(!isUndefined(units) ? units : "millisecond");
                if (units === "millisecond") {
                    return this.valueOf() > localInput.valueOf()
                } else {
                    return localInput.valueOf() < this.clone().startOf(units).valueOf()
                }
            }

            function isBefore(input, units) {
                var localInput = isMoment(input) ? input : createLocal(input);
                if (!(this.isValid() && localInput.isValid())) {
                    return false
                }
                units = normalizeUnits(!isUndefined(units) ? units : "millisecond");
                if (units === "millisecond") {
                    return this.valueOf() < localInput.valueOf()
                } else {
                    return this.clone().endOf(units).valueOf() < localInput.valueOf()
                }
            }

            function isBetween(from, to, units, inclusivity) {
                inclusivity = inclusivity || "()";
                return (inclusivity[0] === "(" ? this.isAfter(from, units) : !this.isBefore(from, units)) && (inclusivity[1] === ")" ? this.isBefore(to, units) : !this.isAfter(to, units))
            }

            function isSame(input, units) {
                var localInput = isMoment(input) ? input : createLocal(input),
                    inputMs;
                if (!(this.isValid() && localInput.isValid())) {
                    return false
                }
                units = normalizeUnits(units || "millisecond");
                if (units === "millisecond") {
                    return this.valueOf() === localInput.valueOf()
                } else {
                    inputMs = localInput.valueOf();
                    return this.clone().startOf(units).valueOf() <= inputMs && inputMs <= this.clone().endOf(units).valueOf()
                }
            }

            function isSameOrAfter(input, units) {
                return this.isSame(input, units) || this.isAfter(input, units)
            }

            function isSameOrBefore(input, units) {
                return this.isSame(input, units) || this.isBefore(input, units)
            }

            function diff(input, units, asFloat) {
                var that, zoneDelta, delta, output;
                if (!this.isValid()) {
                    return NaN
                }
                that = cloneWithOffset(input, this);
                if (!that.isValid()) {
                    return NaN
                }
                zoneDelta = (that.utcOffset() - this.utcOffset()) * 6e4;
                units = normalizeUnits(units);
                if (units === "year" || units === "month" || units === "quarter") {
                    output = monthDiff(this, that);
                    if (units === "quarter") {
                        output = output / 3
                    } else if (units === "year") {
                        output = output / 12
                    }
                } else {
                    delta = this - that;
                    output = units === "second" ? delta / 1e3 : units === "minute" ? delta / 6e4 : units === "hour" ? delta / 36e5 : units === "day" ? (delta - zoneDelta) / 864e5 : units === "week" ? (delta - zoneDelta) / 6048e5 : delta
                }
                return asFloat ? output : absFloor(output)
            }

            function monthDiff(a, b) {
                var wholeMonthDiff = (b.year() - a.year()) * 12 + (b.month() - a.month()),
                    anchor = a.clone().add(wholeMonthDiff, "months"),
                    anchor2, adjust;
                if (b - anchor < 0) {
                    anchor2 = a.clone().add(wholeMonthDiff - 1, "months");
                    adjust = (b - anchor) / (anchor - anchor2)
                } else {
                    anchor2 = a.clone().add(wholeMonthDiff + 1, "months");
                    adjust = (b - anchor) / (anchor2 - anchor)
                }
                return -(wholeMonthDiff + adjust) || 0
            }
            hooks.defaultFormat = "YYYY-MM-DDTHH:mm:ssZ";
            hooks.defaultFormatUtc = "YYYY-MM-DDTHH:mm:ss[Z]";

            function toString() {
                return this.clone().locale("en").format("ddd MMM DD YYYY HH:mm:ss [GMT]ZZ")
            }

            function toISOString() {
                var m = this.clone().utc();
                if (0 < m.year() && m.year() <= 9999) {
                    if (isFunction(Date.prototype.toISOString)) {
                        return this.toDate().toISOString()
                    } else {
                        return formatMoment(m, "YYYY-MM-DD[T]HH:mm:ss.SSS[Z]")
                    }
                } else {
                    return formatMoment(m, "YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]")
                }
            }

            function inspect() {
                if (!this.isValid()) {
                    return "moment.invalid(/* " + this._i + " */)"
                }
                var func = "moment";
                var zone = "";
                if (!this.isLocal()) {
                    func = this.utcOffset() === 0 ? "moment.utc" : "moment.parseZone";
                    zone = "Z"
                }
                var prefix = "[" + func + '("]';
                var year = 0 < this.year() && this.year() <= 9999 ? "YYYY" : "YYYYYY";
                var datetime = "-MM-DD[T]HH:mm:ss.SSS";
                var suffix = zone + '[")]';
                return this.format(prefix + year + datetime + suffix)
            }

            function format(inputString) {
                if (!inputString) {
                    inputString = this.isUtc() ? hooks.defaultFormatUtc : hooks.defaultFormat
                }
                var output = formatMoment(this, inputString);
                return this.localeData().postformat(output)
            }

            function from(time, withoutSuffix) {
                if (this.isValid() && (isMoment(time) && time.isValid() || createLocal(time).isValid())) {
                    return createDuration({
                        to: this,
                        from: time
                    }).locale(this.locale()).humanize(!withoutSuffix)
                } else {
                    return this.localeData().invalidDate()
                }
            }

            function fromNow(withoutSuffix) {
                return this.from(createLocal(), withoutSuffix)
            }

            function to(time, withoutSuffix) {
                if (this.isValid() && (isMoment(time) && time.isValid() || createLocal(time).isValid())) {
                    return createDuration({
                        from: this,
                        to: time
                    }).locale(this.locale()).humanize(!withoutSuffix)
                } else {
                    return this.localeData().invalidDate()
                }
            }

            function toNow(withoutSuffix) {
                return this.to(createLocal(), withoutSuffix)
            }

            function locale(key) {
                var newLocaleData;
                if (key === undefined) {
                    return this._locale._abbr
                } else {
                    newLocaleData = getLocale(key);
                    if (newLocaleData != null) {
                        this._locale = newLocaleData
                    }
                    return this
                }
            }
            var lang = deprecate("moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.", function(key) {
                if (key === undefined) {
                    return this.localeData()
                } else {
                    return this.locale(key)
                }
            });

            function localeData() {
                return this._locale
            }

            function startOf(units) {
                units = normalizeUnits(units);
                switch (units) {
                    case "year":
                        this.month(0);
                    case "quarter":
                    case "month":
                        this.date(1);
                    case "week":
                    case "isoWeek":
                    case "day":
                    case "date":
                        this.hours(0);
                    case "hour":
                        this.minutes(0);
                    case "minute":
                        this.seconds(0);
                    case "second":
                        this.milliseconds(0)
                }
                if (units === "week") {
                    this.weekday(0)
                }
                if (units === "isoWeek") {
                    this.isoWeekday(1)
                }
                if (units === "quarter") {
                    this.month(Math.floor(this.month() / 3) * 3)
                }
                return this
            }

            function endOf(units) {
                units = normalizeUnits(units);
                if (units === undefined || units === "millisecond") {
                    return this
                }
                if (units === "date") {
                    units = "day"
                }
                return this.startOf(units).add(1, units === "isoWeek" ? "week" : units).subtract(1, "ms")
            }

            function valueOf() {
                return this._d.valueOf() - (this._offset || 0) * 6e4
            }

            function unix() {
                return Math.floor(this.valueOf() / 1e3)
            }

            function toDate() {
                return new Date(this.valueOf())
            }

            function toArray() {
                var m = this;
                return [m.year(), m.month(), m.date(), m.hour(), m.minute(), m.second(), m.millisecond()]
            }

            function toObject() {
                var m = this;
                return {
                    years: m.year(),
                    months: m.month(),
                    date: m.date(),
                    hours: m.hours(),
                    minutes: m.minutes(),
                    seconds: m.seconds(),
                    milliseconds: m.milliseconds()
                }
            }

            function toJSON() {
                return this.isValid() ? this.toISOString() : null
            }

            function isValid$1() {
                return isValid(this)
            }

            function parsingFlags() {
                return extend({}, getParsingFlags(this))
            }

            function invalidAt() {
                return getParsingFlags(this).overflow
            }

            function creationData() {
                return {
                    input: this._i,
                    format: this._f,
                    locale: this._locale,
                    isUTC: this._isUTC,
                    strict: this._strict
                }
            }
            addFormatToken(0, ["gg", 2], 0, function() {
                return this.weekYear() % 100
            });
            addFormatToken(0, ["GG", 2], 0, function() {
                return this.isoWeekYear() % 100
            });

            function addWeekYearFormatToken(token, getter) {
                addFormatToken(0, [token, token.length], 0, getter)
            }
            addWeekYearFormatToken("gggg", "weekYear");
            addWeekYearFormatToken("ggggg", "weekYear");
            addWeekYearFormatToken("GGGG", "isoWeekYear");
            addWeekYearFormatToken("GGGGG", "isoWeekYear");
            addUnitAlias("weekYear", "gg");
            addUnitAlias("isoWeekYear", "GG");
            addUnitPriority("weekYear", 1);
            addUnitPriority("isoWeekYear", 1);
            addRegexToken("G", matchSigned);
            addRegexToken("g", matchSigned);
            addRegexToken("GG", match1to2, match2);
            addRegexToken("gg", match1to2, match2);
            addRegexToken("GGGG", match1to4, match4);
            addRegexToken("gggg", match1to4, match4);
            addRegexToken("GGGGG", match1to6, match6);
            addRegexToken("ggggg", match1to6, match6);
            addWeekParseToken(["gggg", "ggggg", "GGGG", "GGGGG"], function(input, week, config, token) {
                week[token.substr(0, 2)] = toInt(input)
            });
            addWeekParseToken(["gg", "GG"], function(input, week, config, token) {
                week[token] = hooks.parseTwoDigitYear(input)
            });

            function getSetWeekYear(input) {
                return getSetWeekYearHelper.call(this, input, this.week(), this.weekday(), this.localeData()._week.dow, this.localeData()._week.doy)
            }

            function getSetISOWeekYear(input) {
                return getSetWeekYearHelper.call(this, input, this.isoWeek(), this.isoWeekday(), 1, 4)
            }

            function getISOWeeksInYear() {
                return weeksInYear(this.year(), 1, 4)
            }

            function getWeeksInYear() {
                var weekInfo = this.localeData()._week;
                return weeksInYear(this.year(), weekInfo.dow, weekInfo.doy)
            }

            function getSetWeekYearHelper(input, week, weekday, dow, doy) {
                var weeksTarget;
                if (input == null) {
                    return weekOfYear(this, dow, doy).year
                } else {
                    weeksTarget = weeksInYear(input, dow, doy);
                    if (week > weeksTarget) {
                        week = weeksTarget
                    }
                    return setWeekAll.call(this, input, week, weekday, dow, doy)
                }
            }

            function setWeekAll(weekYear, week, weekday, dow, doy) {
                var dayOfYearData = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy),
                    date = createUTCDate(dayOfYearData.year, 0, dayOfYearData.dayOfYear);
                this.year(date.getUTCFullYear());
                this.month(date.getUTCMonth());
                this.date(date.getUTCDate());
                return this
            }
            addFormatToken("Q", 0, "Qo", "quarter");
            addUnitAlias("quarter", "Q");
            addUnitPriority("quarter", 7);
            addRegexToken("Q", match1);
            addParseToken("Q", function(input, array) {
                array[MONTH] = (toInt(input) - 1) * 3
            });

            function getSetQuarter(input) {
                return input == null ? Math.ceil((this.month() + 1) / 3) : this.month((input - 1) * 3 + this.month() % 3)
            }
            addFormatToken("D", ["DD", 2], "Do", "date");
            addUnitAlias("date", "D");
            addUnitPriority("date", 9);
            addRegexToken("D", match1to2);
            addRegexToken("DD", match1to2, match2);
            addRegexToken("Do", function(isStrict, locale) {
                return isStrict ? locale._ordinalParse : locale._ordinalParseLenient
            });
            addParseToken(["D", "DD"], DATE);
            addParseToken("Do", function(input, array) {
                array[DATE] = toInt(input.match(match1to2)[0], 10)
            });
            var getSetDayOfMonth = makeGetSet("Date", true);
            addFormatToken("DDD", ["DDDD", 3], "DDDo", "dayOfYear");
            addUnitAlias("dayOfYear", "DDD");
            addUnitPriority("dayOfYear", 4);
            addRegexToken("DDD", match1to3);
            addRegexToken("DDDD", match3);
            addParseToken(["DDD", "DDDD"], function(input, array, config) {
                config._dayOfYear = toInt(input)
            });

            function getSetDayOfYear(input) {
                var dayOfYear = Math.round((this.clone().startOf("day") - this.clone().startOf("year")) / 864e5) + 1;
                return input == null ? dayOfYear : this.add(input - dayOfYear, "d")
            }
            addFormatToken("m", ["mm", 2], 0, "minute");
            addUnitAlias("minute", "m");
            addUnitPriority("minute", 14);
            addRegexToken("m", match1to2);
            addRegexToken("mm", match1to2, match2);
            addParseToken(["m", "mm"], MINUTE);
            var getSetMinute = makeGetSet("Minutes", false);
            addFormatToken("s", ["ss", 2], 0, "second");
            addUnitAlias("second", "s");
            addUnitPriority("second", 15);
            addRegexToken("s", match1to2);
            addRegexToken("ss", match1to2, match2);
            addParseToken(["s", "ss"], SECOND);
            var getSetSecond = makeGetSet("Seconds", false);
            addFormatToken("S", 0, 0, function() {
                return ~~(this.millisecond() / 100)
            });
            addFormatToken(0, ["SS", 2], 0, function() {
                return ~~(this.millisecond() / 10)
            });
            addFormatToken(0, ["SSS", 3], 0, "millisecond");
            addFormatToken(0, ["SSSS", 4], 0, function() {
                return this.millisecond() * 10
            });
            addFormatToken(0, ["SSSSS", 5], 0, function() {
                return this.millisecond() * 100
            });
            addFormatToken(0, ["SSSSSS", 6], 0, function() {
                return this.millisecond() * 1e3
            });
            addFormatToken(0, ["SSSSSSS", 7], 0, function() {
                return this.millisecond() * 1e4
            });
            addFormatToken(0, ["SSSSSSSS", 8], 0, function() {
                return this.millisecond() * 1e5
            });
            addFormatToken(0, ["SSSSSSSSS", 9], 0, function() {
                return this.millisecond() * 1e6
            });
            addUnitAlias("millisecond", "ms");
            addUnitPriority("millisecond", 16);
            addRegexToken("S", match1to3, match1);
            addRegexToken("SS", match1to3, match2);
            addRegexToken("SSS", match1to3, match3);
            var token;
            for (token = "SSSS"; token.length <= 9; token += "S") {
                addRegexToken(token, matchUnsigned)
            }

            function parseMs(input, array) {
                array[MILLISECOND] = toInt(("0." + input) * 1e3)
            }
            for (token = "S"; token.length <= 9; token += "S") {
                addParseToken(token, parseMs)
            }
            var getSetMillisecond = makeGetSet("Milliseconds", false);
            addFormatToken("z", 0, 0, "zoneAbbr");
            addFormatToken("zz", 0, 0, "zoneName");

            function getZoneAbbr() {
                return this._isUTC ? "UTC" : ""
            }

            function getZoneName() {
                return this._isUTC ? "Coordinated Universal Time" : ""
            }
            var proto = Moment.prototype;
            proto.add = add;
            proto.calendar = calendar$1;
            proto.clone = clone;
            proto.diff = diff;
            proto.endOf = endOf;
            proto.format = format;
            proto.from = from;
            proto.fromNow = fromNow;
            proto.to = to;
            proto.toNow = toNow;
            proto.get = stringGet;
            proto.invalidAt = invalidAt;
            proto.isAfter = isAfter;
            proto.isBefore = isBefore;
            proto.isBetween = isBetween;
            proto.isSame = isSame;
            proto.isSameOrAfter = isSameOrAfter;
            proto.isSameOrBefore = isSameOrBefore;
            proto.isValid = isValid$1;
            proto.lang = lang;
            proto.locale = locale;
            proto.localeData = localeData;
            proto.max = prototypeMax;
            proto.min = prototypeMin;
            proto.parsingFlags = parsingFlags;
            proto.set = stringSet;
            proto.startOf = startOf;
            proto.subtract = subtract;
            proto.toArray = toArray;
            proto.toObject = toObject;
            proto.toDate = toDate;
            proto.toISOString = toISOString;
            proto.inspect = inspect;
            proto.toJSON = toJSON;
            proto.toString = toString;
            proto.unix = unix;
            proto.valueOf = valueOf;
            proto.creationData = creationData;
            proto.year = getSetYear;
            proto.isLeapYear = getIsLeapYear;
            proto.weekYear = getSetWeekYear;
            proto.isoWeekYear = getSetISOWeekYear;
            proto.quarter = proto.quarters = getSetQuarter;
            proto.month = getSetMonth;
            proto.daysInMonth = getDaysInMonth;
            proto.week = proto.weeks = getSetWeek;
            proto.isoWeek = proto.isoWeeks = getSetISOWeek;
            proto.weeksInYear = getWeeksInYear;
            proto.isoWeeksInYear = getISOWeeksInYear;
            proto.date = getSetDayOfMonth;
            proto.day = proto.days = getSetDayOfWeek;
            proto.weekday = getSetLocaleDayOfWeek;
            proto.isoWeekday = getSetISODayOfWeek;
            proto.dayOfYear = getSetDayOfYear;
            proto.hour = proto.hours = getSetHour;
            proto.minute = proto.minutes = getSetMinute;
            proto.second = proto.seconds = getSetSecond;
            proto.millisecond = proto.milliseconds = getSetMillisecond;
            proto.utcOffset = getSetOffset;
            proto.utc = setOffsetToUTC;
            proto.local = setOffsetToLocal;
            proto.parseZone = setOffsetToParsedOffset;
            proto.hasAlignedHourOffset = hasAlignedHourOffset;
            proto.isDST = isDaylightSavingTime;
            proto.isLocal = isLocal;
            proto.isUtcOffset = isUtcOffset;
            proto.isUtc = isUtc;
            proto.isUTC = isUtc;
            proto.zoneAbbr = getZoneAbbr;
            proto.zoneName = getZoneName;
            proto.dates = deprecate("dates accessor is deprecated. Use date instead.", getSetDayOfMonth);
            proto.months = deprecate("months accessor is deprecated. Use month instead", getSetMonth);
            proto.years = deprecate("years accessor is deprecated. Use year instead", getSetYear);
            proto.zone = deprecate("moment().zone is deprecated, use moment().utcOffset instead. http://momentjs.com/guides/#/warnings/zone/", getSetZone);
            proto.isDSTShifted = deprecate("isDSTShifted is deprecated. See http://momentjs.com/guides/#/warnings/dst-shifted/ for more information", isDaylightSavingTimeShifted);

            function createUnix(input) {
                return createLocal(input * 1e3)
            }

            function createInZone() {
                return createLocal.apply(null, arguments).parseZone()
            }

            function preParsePostFormat(string) {
                return string
            }
            var proto$1 = Locale.prototype;
            proto$1.calendar = calendar;
            proto$1.longDateFormat = longDateFormat;
            proto$1.invalidDate = invalidDate;
            proto$1.ordinal = ordinal;
            proto$1.preparse = preParsePostFormat;
            proto$1.postformat = preParsePostFormat;
            proto$1.relativeTime = relativeTime;
            proto$1.pastFuture = pastFuture;
            proto$1.set = set;
            proto$1.months = localeMonths;
            proto$1.monthsShort = localeMonthsShort;
            proto$1.monthsParse = localeMonthsParse;
            proto$1.monthsRegex = monthsRegex;
            proto$1.monthsShortRegex = monthsShortRegex;
            proto$1.week = localeWeek;
            proto$1.firstDayOfYear = localeFirstDayOfYear;
            proto$1.firstDayOfWeek = localeFirstDayOfWeek;
            proto$1.weekdays = localeWeekdays;
            proto$1.weekdaysMin = localeWeekdaysMin;
            proto$1.weekdaysShort = localeWeekdaysShort;
            proto$1.weekdaysParse = localeWeekdaysParse;
            proto$1.weekdaysRegex = weekdaysRegex;
            proto$1.weekdaysShortRegex = weekdaysShortRegex;
            proto$1.weekdaysMinRegex = weekdaysMinRegex;
            proto$1.isPM = localeIsPM;
            proto$1.meridiem = localeMeridiem;

            function get$1(format, index, field, setter) {
                var locale = getLocale();
                var utc = createUTC().set(setter, index);
                return locale[field](utc, format)
            }

            function listMonthsImpl(format, index, field) {
                if (isNumber(format)) {
                    index = format;
                    format = undefined
                }
                format = format || "";
                if (index != null) {
                    return get$1(format, index, field, "month")
                }
                var i;
                var out = [];
                for (i = 0; i < 12; i++) {
                    out[i] = get$1(format, i, field, "month")
                }
                return out
            }

            function listWeekdaysImpl(localeSorted, format, index, field) {
                if (typeof localeSorted === "boolean") {
                    if (isNumber(format)) {
                        index = format;
                        format = undefined
                    }
                    format = format || ""
                } else {
                    format = localeSorted;
                    index = format;
                    localeSorted = false;
                    if (isNumber(format)) {
                        index = format;
                        format = undefined
                    }
                    format = format || ""
                }
                var locale = getLocale(),
                    shift = localeSorted ? locale._week.dow : 0;
                if (index != null) {
                    return get$1(format, (index + shift) % 7, field, "day")
                }
                var i;
                var out = [];
                for (i = 0; i < 7; i++) {
                    out[i] = get$1(format, (i + shift) % 7, field, "day")
                }
                return out
            }

            function listMonths(format, index) {
                return listMonthsImpl(format, index, "months")
            }

            function listMonthsShort(format, index) {
                return listMonthsImpl(format, index, "monthsShort")
            }

            function listWeekdays(localeSorted, format, index) {
                return listWeekdaysImpl(localeSorted, format, index, "weekdays")
            }

            function listWeekdaysShort(localeSorted, format, index) {
                return listWeekdaysImpl(localeSorted, format, index, "weekdaysShort")
            }

            function listWeekdaysMin(localeSorted, format, index) {
                return listWeekdaysImpl(localeSorted, format, index, "weekdaysMin")
            }
            getSetGlobalLocale("en", {
                ordinalParse: /\d{1,2}(th|st|nd|rd)/,
                ordinal: function(number) {
                    var b = number % 10,
                        output = toInt(number % 100 / 10) === 1 ? "th" : b === 1 ? "st" : b === 2 ? "nd" : b === 3 ? "rd" : "th";
                    return number + output
                }
            });
            hooks.lang = deprecate("moment.lang is deprecated. Use moment.locale instead.", getSetGlobalLocale);
            hooks.langData = deprecate("moment.langData is deprecated. Use moment.localeData instead.", getLocale);
            var mathAbs = Math.abs;

            function abs() {
                var data = this._data;
                this._milliseconds = mathAbs(this._milliseconds);
                this._days = mathAbs(this._days);
                this._months = mathAbs(this._months);
                data.milliseconds = mathAbs(data.milliseconds);
                data.seconds = mathAbs(data.seconds);
                data.minutes = mathAbs(data.minutes);
                data.hours = mathAbs(data.hours);
                data.months = mathAbs(data.months);
                data.years = mathAbs(data.years);
                return this
            }

            function addSubtract$1(duration, input, value, direction) {
                var other = createDuration(input, value);
                duration._milliseconds += direction * other._milliseconds;
                duration._days += direction * other._days;
                duration._months += direction * other._months;
                return duration._bubble()
            }

            function add$1(input, value) {
                return addSubtract$1(this, input, value, 1)
            }

            function subtract$1(input, value) {
                return addSubtract$1(this, input, value, -1)
            }

            function absCeil(number) {
                if (number < 0) {
                    return Math.floor(number)
                } else {
                    return Math.ceil(number)
                }
            }

            function bubble() {
                var milliseconds = this._milliseconds;
                var days = this._days;
                var months = this._months;
                var data = this._data;
                var seconds, minutes, hours, years, monthsFromDays;
                if (!(milliseconds >= 0 && days >= 0 && months >= 0 || milliseconds <= 0 && days <= 0 && months <= 0)) {
                    milliseconds += absCeil(monthsToDays(months) + days) * 864e5;
                    days = 0;
                    months = 0
                }
                data.milliseconds = milliseconds % 1e3;
                seconds = absFloor(milliseconds / 1e3);
                data.seconds = seconds % 60;
                minutes = absFloor(seconds / 60);
                data.minutes = minutes % 60;
                hours = absFloor(minutes / 60);
                data.hours = hours % 24;
                days += absFloor(hours / 24);
                monthsFromDays = absFloor(daysToMonths(days));
                months += monthsFromDays;
                days -= absCeil(monthsToDays(monthsFromDays));
                years = absFloor(months / 12);
                months %= 12;
                data.days = days;
                data.months = months;
                data.years = years;
                return this
            }

            function daysToMonths(days) {
                return days * 4800 / 146097
            }

            function monthsToDays(months) {
                return months * 146097 / 4800
            }

            function as(units) {
                var days;
                var months;
                var milliseconds = this._milliseconds;
                units = normalizeUnits(units);
                if (units === "month" || units === "year") {
                    days = this._days + milliseconds / 864e5;
                    months = this._months + daysToMonths(days);
                    return units === "month" ? months : months / 12
                } else {
                    days = this._days + Math.round(monthsToDays(this._months));
                    switch (units) {
                        case "week":
                            return days / 7 + milliseconds / 6048e5;
                        case "day":
                            return days + milliseconds / 864e5;
                        case "hour":
                            return days * 24 + milliseconds / 36e5;
                        case "minute":
                            return days * 1440 + milliseconds / 6e4;
                        case "second":
                            return days * 86400 + milliseconds / 1e3;
                        case "millisecond":
                            return Math.floor(days * 864e5) + milliseconds;
                        default:
                            throw new Error("Unknown unit " + units)
                    }
                }
            }

            function valueOf$1() {
                return this._milliseconds + this._days * 864e5 + this._months % 12 * 2592e6 + toInt(this._months / 12) * 31536e6
            }

            function makeAs(alias) {
                return function() {
                    return this.as(alias)
                }
            }
            var asMilliseconds = makeAs("ms");
            var asSeconds = makeAs("s");
            var asMinutes = makeAs("m");
            var asHours = makeAs("h");
            var asDays = makeAs("d");
            var asWeeks = makeAs("w");
            var asMonths = makeAs("M");
            var asYears = makeAs("y");

            function get$2(units) {
                units = normalizeUnits(units);
                return this[units + "s"]()
            }

            function makeGetter(name) {
                return function() {
                    return this._data[name]
                }
            }
            var milliseconds = makeGetter("milliseconds");
            var seconds = makeGetter("seconds");
            var minutes = makeGetter("minutes");
            var hours = makeGetter("hours");
            var days = makeGetter("days");
            var months = makeGetter("months");
            var years = makeGetter("years");

            function weeks() {
                return absFloor(this.days() / 7)
            }
            var round = Math.round;
            var thresholds = {
                s: 45,
                m: 45,
                h: 22,
                d: 26,
                M: 11
            };

            function substituteTimeAgo(string, number, withoutSuffix, isFuture, locale) {
                return locale.relativeTime(number || 1, !!withoutSuffix, string, isFuture)
            }

            function relativeTime$1(posNegDuration, withoutSuffix, locale) {
                var duration = createDuration(posNegDuration).abs();
                var seconds = round(duration.as("s"));
                var minutes = round(duration.as("m"));
                var hours = round(duration.as("h"));
                var days = round(duration.as("d"));
                var months = round(duration.as("M"));
                var years = round(duration.as("y"));
                var a = seconds < thresholds.s && ["s", seconds] || minutes <= 1 && ["m"] || minutes < thresholds.m && ["mm", minutes] || hours <= 1 && ["h"] || hours < thresholds.h && ["hh", hours] || days <= 1 && ["d"] || days < thresholds.d && ["dd", days] || months <= 1 && ["M"] || months < thresholds.M && ["MM", months] || years <= 1 && ["y"] || ["yy", years];
                a[2] = withoutSuffix;
                a[3] = +posNegDuration > 0;
                a[4] = locale;
                return substituteTimeAgo.apply(null, a)
            }

            function getSetRelativeTimeRounding(roundingFunction) {
                if (roundingFunction === undefined) {
                    return round
                }
                if (typeof roundingFunction === "function") {
                    round = roundingFunction;
                    return true
                }
                return false
            }

            function getSetRelativeTimeThreshold(threshold, limit) {
                if (thresholds[threshold] === undefined) {
                    return false
                }
                if (limit === undefined) {
                    return thresholds[threshold]
                }
                thresholds[threshold] = limit;
                return true
            }

            function humanize(withSuffix) {
                var locale = this.localeData();
                var output = relativeTime$1(this, !withSuffix, locale);
                if (withSuffix) {
                    output = locale.pastFuture(+this, output)
                }
                return locale.postformat(output)
            }
            var abs$1 = Math.abs;

            function toISOString$1() {
                var seconds = abs$1(this._milliseconds) / 1e3;
                var days = abs$1(this._days);
                var months = abs$1(this._months);
                var minutes, hours, years;
                minutes = absFloor(seconds / 60);
                hours = absFloor(minutes / 60);
                seconds %= 60;
                minutes %= 60;
                years = absFloor(months / 12);
                months %= 12;
                var Y = years;
                var M = months;
                var D = days;
                var h = hours;
                var m = minutes;
                var s = seconds;
                var total = this.asSeconds();
                if (!total) {
                    return "P0D"
                }
                return (total < 0 ? "-" : "") + "P" + (Y ? Y + "Y" : "") + (M ? M + "M" : "") + (D ? D + "D" : "") + (h || m || s ? "T" : "") + (h ? h + "H" : "") + (m ? m + "M" : "") + (s ? s + "S" : "")
            }
            var proto$2 = Duration.prototype;
            proto$2.abs = abs;
            proto$2.add = add$1;
            proto$2.subtract = subtract$1;
            proto$2.as = as;
            proto$2.asMilliseconds = asMilliseconds;
            proto$2.asSeconds = asSeconds;
            proto$2.asMinutes = asMinutes;
            proto$2.asHours = asHours;
            proto$2.asDays = asDays;
            proto$2.asWeeks = asWeeks;
            proto$2.asMonths = asMonths;
            proto$2.asYears = asYears;
            proto$2.valueOf = valueOf$1;
            proto$2._bubble = bubble;
            proto$2.get = get$2;
            proto$2.milliseconds = milliseconds;
            proto$2.seconds = seconds;
            proto$2.minutes = minutes;
            proto$2.hours = hours;
            proto$2.days = days;
            proto$2.weeks = weeks;
            proto$2.months = months;
            proto$2.years = years;
            proto$2.humanize = humanize;
            proto$2.toISOString = toISOString$1;
            proto$2.toString = toISOString$1;
            proto$2.toJSON = toISOString$1;
            proto$2.locale = locale;
            proto$2.localeData = localeData;
            proto$2.toIsoString = deprecate("toIsoString() is deprecated. Please use toISOString() instead (notice the capitals)", toISOString$1);
            proto$2.lang = lang;
            addFormatToken("X", 0, 0, "unix");
            addFormatToken("x", 0, 0, "valueOf");
            addRegexToken("x", matchSigned);
            addRegexToken("X", matchTimestamp);
            addParseToken("X", function(input, array, config) {
                config._d = new Date(parseFloat(input, 10) * 1e3)
            });
            addParseToken("x", function(input, array, config) {
                config._d = new Date(toInt(input))
            });
            hooks.version = "2.17.1";
            setHookCallback(createLocal);
            hooks.fn = proto;
            hooks.min = min;
            hooks.max = max;
            hooks.now = now;
            hooks.utc = createUTC;
            hooks.unix = createUnix;
            hooks.months = listMonths;
            hooks.isDate = isDate;
            hooks.locale = getSetGlobalLocale;
            hooks.invalid = createInvalid;
            hooks.duration = createDuration;
            hooks.isMoment = isMoment;
            hooks.weekdays = listWeekdays;
            hooks.parseZone = createInZone;
            hooks.localeData = getLocale;
            hooks.isDuration = isDuration;
            hooks.monthsShort = listMonthsShort;
            hooks.weekdaysMin = listWeekdaysMin;
            hooks.defineLocale = defineLocale;
            hooks.updateLocale = updateLocale;
            hooks.locales = listLocales;
            hooks.weekdaysShort = listWeekdaysShort;
            hooks.normalizeUnits = normalizeUnits;
            hooks.relativeTimeRounding = getSetRelativeTimeRounding;
            hooks.relativeTimeThreshold = getSetRelativeTimeThreshold;
            hooks.calendarFormat = getCalendarFormat;
            hooks.prototype = proto;
            return hooks
        })
    }, {}],
    15: [function(require, module, exports) {
        "use strict";
        module.exports = require("./src/js/adaptor/jquery")
    }, {
        "./src/js/adaptor/jquery": 16
    }],
    16: [function(require, module, exports) {
        "use strict";
        var ps = require("../main"),
            psInstances = require("../plugin/instances");

        function mountJQuery(jQuery) {
            jQuery.fn.perfectScrollbar = function(settingOrCommand) {
                return this.each(function() {
                    if (typeof settingOrCommand === "object" || typeof settingOrCommand === "undefined") {
                        var settings = settingOrCommand;
                        if (!psInstances.get(this)) {
                            ps.initialize(this, settings)
                        }
                    } else {
                        var command = settingOrCommand;
                        if (command === "update") {
                            ps.update(this)
                        } else if (command === "destroy") {
                            ps.destroy(this)
                        }
                    }
                    return jQuery(this)
                })
            }
        }
        if (typeof define === "function" && define.amd) {
            define(["jquery"], mountJQuery)
        } else {
            var jq = window.jQuery ? window.jQuery : window.$;
            if (typeof jq !== "undefined") {
                mountJQuery(jq)
            }
        }
        module.exports = mountJQuery
    }, {
        "../main": 22,
        "../plugin/instances": 33
    }],
    17: [function(require, module, exports) {
        "use strict";

        function oldAdd(element, className) {
            var classes = element.className.split(" ");
            if (classes.indexOf(className) < 0) {
                classes.push(className)
            }
            element.className = classes.join(" ")
        }

        function oldRemove(element, className) {
            var classes = element.className.split(" ");
            var idx = classes.indexOf(className);
            if (idx >= 0) {
                classes.splice(idx, 1)
            }
            element.className = classes.join(" ")
        }
        exports.add = function(element, className) {
            if (element.classList) {
                element.classList.add(className)
            } else {
                oldAdd(element, className)
            }
        };
        exports.remove = function(element, className) {
            if (element.classList) {
                element.classList.remove(className)
            } else {
                oldRemove(element, className)
            }
        };
        exports.list = function(element) {
            if (element.classList) {
                return element.classList
            } else {
                return element.className.split(" ")
            }
        }
    }, {}],
    18: [function(require, module, exports) {
        "use strict";
        exports.e = function(tagName, className) {
            var element = document.createElement(tagName);
            element.className = className;
            return element
        };
        exports.appendTo = function(child, parent) {
            parent.appendChild(child);
            return child
        };

        function cssGet(element, styleName) {
            return window.getComputedStyle(element)[styleName]
        }

        function cssSet(element, styleName, styleValue) {
            if (typeof styleValue === "number") {
                styleValue = styleValue.toString() + "px"
            }
            element.style[styleName] = styleValue;
            return element
        }

        function cssMultiSet(element, obj) {
            for (var key in obj) {
                var val = obj[key];
                if (typeof val === "number") {
                    val = val.toString() + "px"
                }
                element.style[key] = val
            }
            return element
        }
        exports.css = function(element, styleNameOrObject, styleValue) {
            if (typeof styleNameOrObject === "object") {
                return cssMultiSet(element, styleNameOrObject)
            } else {
                if (typeof styleValue === "undefined") {
                    return cssGet(element, styleNameOrObject)
                } else {
                    return cssSet(element, styleNameOrObject, styleValue)
                }
            }
        };
        exports.matches = function(element, query) {
            if (typeof element.matches !== "undefined") {
                return element.matches(query)
            } else {
                if (typeof element.matchesSelector !== "undefined") {
                    return element.matchesSelector(query)
                } else if (typeof element.webkitMatchesSelector !== "undefined") {
                    return element.webkitMatchesSelector(query)
                } else if (typeof element.mozMatchesSelector !== "undefined") {
                    return element.mozMatchesSelector(query)
                } else if (typeof element.msMatchesSelector !== "undefined") {
                    return element.msMatchesSelector(query)
                }
            }
        };
        exports.remove = function(element) {
            if (typeof element.remove !== "undefined") {
                element.remove()
            } else {
                if (element.parentNode) {
                    element.parentNode.removeChild(element)
                }
            }
        }
    }, {}],
    19: [function(require, module, exports) {
        "use strict";
        var EventElement = function(element) {
            this.element = element;
            this.events = {}
        };
        EventElement.prototype.bind = function(eventName, handler) {
            if (typeof this.events[eventName] === "undefined") {
                this.events[eventName] = []
            }
            this.events[eventName].push(handler);
            this.element.addEventListener(eventName, handler, false)
        };
        EventElement.prototype.unbind = function(eventName, handler) {
            var isHandlerProvided = typeof handler !== "undefined";
            this.events[eventName] = this.events[eventName].filter(function(hdlr) {
                if (isHandlerProvided && hdlr !== handler) {
                    return true
                }
                this.element.removeEventListener(eventName, hdlr, false);
                return false
            }, this)
        };
        EventElement.prototype.unbindAll = function() {
            for (var name in this.events) {
                this.unbind(name)
            }
        };
        var EventManager = function() {
            this.eventElements = []
        };
        EventManager.prototype.eventElement = function(element) {
            var ee = this.eventElements.filter(function(eventElement) {
                return eventElement.element === element
            })[0];
            if (typeof ee === "undefined") {
                ee = new EventElement(element);
                this.eventElements.push(ee)
            }
            return ee
        };
        EventManager.prototype.bind = function(element, eventName, handler) {
            this.eventElement(element).bind(eventName, handler)
        };
        EventManager.prototype.unbind = function(element, eventName, handler) {
            this.eventElement(element).unbind(eventName, handler)
        };
        EventManager.prototype.unbindAll = function() {
            for (var i = 0; i < this.eventElements.length; i++) {
                this.eventElements[i].unbindAll()
            }
        };
        EventManager.prototype.once = function(element, eventName, handler) {
            var ee = this.eventElement(element);
            var onceHandler = function(e) {
                ee.unbind(eventName, onceHandler);
                handler(e)
            };
            ee.bind(eventName, onceHandler)
        };
        module.exports = EventManager
    }, {}],
    20: [function(require, module, exports) {
        "use strict";
        module.exports = function() {
            function s4() {
                return Math.floor((1 + Math.random()) * 65536).toString(16).substring(1)
            }
            return function() {
                return s4() + s4() + "-" + s4() + "-" + s4() + "-" + s4() + "-" + s4() + s4() + s4()
            }
        }()
    }, {}],
    21: [function(require, module, exports) {
        "use strict";
        var cls = require("./class"),
            d = require("./dom");
        exports.toInt = function(x) {
            return parseInt(x, 10) || 0
        };
        exports.clone = function(obj) {
            if (obj === null) {
                return null
            } else if (typeof obj === "object") {
                var result = {};
                for (var key in obj) {
                    result[key] = this.clone(obj[key])
                }
                return result
            } else {
                return obj
            }
        };
        exports.extend = function(original, source) {
            var result = this.clone(original);
            for (var key in source) {
                result[key] = this.clone(source[key])
            }
            return result
        };
        exports.isEditable = function(el) {
            return d.matches(el, "input,[contenteditable]") || d.matches(el, "select,[contenteditable]") || d.matches(el, "textarea,[contenteditable]") || d.matches(el, "button,[contenteditable]")
        };
        exports.removePsClasses = function(element) {
            var clsList = cls.list(element);
            for (var i = 0; i < clsList.length; i++) {
                var className = clsList[i];
                if (className.indexOf("ps-") === 0) {
                    cls.remove(element, className)
                }
            }
        };
        exports.outerWidth = function(element) {
            return this.toInt(d.css(element, "width")) + this.toInt(d.css(element, "paddingLeft")) + this.toInt(d.css(element, "paddingRight")) + this.toInt(d.css(element, "borderLeftWidth")) + this.toInt(d.css(element, "borderRightWidth"))
        };
        exports.startScrolling = function(element, axis) {
            cls.add(element, "ps-in-scrolling");
            if (typeof axis !== "undefined") {
                cls.add(element, "ps-" + axis)
            } else {
                cls.add(element, "ps-x");
                cls.add(element, "ps-y")
            }
        };
        exports.stopScrolling = function(element, axis) {
            cls.remove(element, "ps-in-scrolling");
            if (typeof axis !== "undefined") {
                cls.remove(element, "ps-" + axis)
            } else {
                cls.remove(element, "ps-x");
                cls.remove(element, "ps-y")
            }
        };
        exports.env = {
            isWebKit: "WebkitAppearance" in document.documentElement.style,
            supportsTouch: "ontouchstart" in window || window.DocumentTouch && document instanceof window.DocumentTouch,
            supportsIePointer: window.navigator.msMaxTouchPoints !== null
        }
    }, {
        "./class": 17,
        "./dom": 18
    }],
    22: [function(require, module, exports) {
        "use strict";
        var destroy = require("./plugin/destroy"),
            initialize = require("./plugin/initialize"),
            update = require("./plugin/update");
        module.exports = {
            initialize: initialize,
            update: update,
            destroy: destroy
        }
    }, {
        "./plugin/destroy": 24,
        "./plugin/initialize": 32,
        "./plugin/update": 35
    }],
    23: [function(require, module, exports) {
        "use strict";
        module.exports = {
            wheelSpeed: 1,
            wheelPropagation: false,
            swipePropagation: true,
            minScrollbarLength: null,
            maxScrollbarLength: null,
            useBothWheelAxes: false,
            useKeyboard: true,
            suppressScrollX: false,
            suppressScrollY: false,
            scrollXMarginOffset: 0,
            scrollYMarginOffset: 0
        }
    }, {}],
    24: [function(require, module, exports) {
        "use strict";
        var d = require("../lib/dom"),
            h = require("../lib/helper"),
            instances = require("./instances");
        module.exports = function(element) {
            var i = instances.get(element);
            i.event.unbindAll();
            d.remove(i.scrollbarX);
            d.remove(i.scrollbarY);
            d.remove(i.scrollbarXRail);
            d.remove(i.scrollbarYRail);
            h.removePsClasses(element);
            instances.remove(element)
        }
    }, {
        "../lib/dom": 18,
        "../lib/helper": 21,
        "./instances": 33
    }],
    25: [function(require, module, exports) {
        "use strict";
        var h = require("../../lib/helper"),
            instances = require("../instances"),
            updateGeometry = require("../update-geometry");

        function bindClickRailHandler(element, i) {
            function pageOffset(el) {
                return el.getBoundingClientRect()
            }
            var stopPropagation = window.Event.prototype.stopPropagation.bind;
            i.event.bind(i.scrollbarY, "click", stopPropagation);
            i.event.bind(i.scrollbarYRail, "click", function(e) {
                var halfOfScrollbarLength = h.toInt(i.scrollbarYHeight / 2);
                var positionTop = i.railYRatio * (e.pageY - window.scrollY - pageOffset(i.scrollbarYRail).top - halfOfScrollbarLength);
                var maxPositionTop = i.railYRatio * (i.railYHeight - i.scrollbarYHeight);
                var positionRatio = positionTop / maxPositionTop;
                if (positionRatio < 0) {
                    positionRatio = 0
                } else if (positionRatio > 1) {
                    positionRatio = 1
                }
                element.scrollTop = (i.contentHeight - i.containerHeight) * positionRatio;
                updateGeometry(element);
                e.stopPropagation()
            });
            i.event.bind(i.scrollbarX, "click", stopPropagation);
            i.event.bind(i.scrollbarXRail, "click", function(e) {
                var halfOfScrollbarLength = h.toInt(i.scrollbarXWidth / 2);
                var positionLeft = i.railXRatio * (e.pageX - window.scrollX - pageOffset(i.scrollbarXRail).left - halfOfScrollbarLength);
                var maxPositionLeft = i.railXRatio * (i.railXWidth - i.scrollbarXWidth);
                var positionRatio = positionLeft / maxPositionLeft;
                if (positionRatio < 0) {
                    positionRatio = 0
                } else if (positionRatio > 1) {
                    positionRatio = 1
                }
                element.scrollLeft = (i.contentWidth - i.containerWidth) * positionRatio;
                updateGeometry(element);
                e.stopPropagation()
            })
        }
        module.exports = function(element) {
            var i = instances.get(element);
            bindClickRailHandler(element, i)
        }
    }, {
        "../../lib/helper": 21,
        "../instances": 33,
        "../update-geometry": 34
    }],
    26: [function(require, module, exports) {
        "use strict";
        var d = require("../../lib/dom"),
            h = require("../../lib/helper"),
            instances = require("../instances"),
            updateGeometry = require("../update-geometry");

        function bindMouseScrollXHandler(element, i) {
            var currentLeft = null;
            var currentPageX = null;

            function updateScrollLeft(deltaX) {
                var newLeft = currentLeft + deltaX * i.railXRatio;
                var maxLeft = i.scrollbarXRail.getBoundingClientRect().left + i.railXRatio * (i.railXWidth - i.scrollbarXWidth);
                if (newLeft < 0) {
                    i.scrollbarXLeft = 0
                } else if (newLeft > maxLeft) {
                    i.scrollbarXLeft = maxLeft
                } else {
                    i.scrollbarXLeft = newLeft
                }
                var scrollLeft = h.toInt(i.scrollbarXLeft * (i.contentWidth - i.containerWidth) / (i.containerWidth - i.railXRatio * i.scrollbarXWidth));
                element.scrollLeft = scrollLeft
            }
            var mouseMoveHandler = function(e) {
                updateScrollLeft(e.pageX - currentPageX);
                updateGeometry(element);
                e.stopPropagation();
                e.preventDefault()
            };
            var mouseUpHandler = function() {
                h.stopScrolling(element, "x");
                i.event.unbind(i.ownerDocument, "mousemove", mouseMoveHandler)
            };
            i.event.bind(i.scrollbarX, "mousedown", function(e) {
                currentPageX = e.pageX;
                currentLeft = h.toInt(d.css(i.scrollbarX, "left")) * i.railXRatio;
                h.startScrolling(element, "x");
                i.event.bind(i.ownerDocument, "mousemove", mouseMoveHandler);
                i.event.once(i.ownerDocument, "mouseup", mouseUpHandler);
                e.stopPropagation();
                e.preventDefault()
            })
        }

        function bindMouseScrollYHandler(element, i) {
            var currentTop = null;
            var currentPageY = null;

            function updateScrollTop(deltaY) {
                var newTop = currentTop + deltaY * i.railYRatio;
                var maxTop = i.scrollbarYRail.getBoundingClientRect().top + i.railYRatio * (i.railYHeight - i.scrollbarYHeight);
                if (newTop < 0) {
                    i.scrollbarYTop = 0
                } else if (newTop > maxTop) {
                    i.scrollbarYTop = maxTop
                } else {
                    i.scrollbarYTop = newTop
                }
                var scrollTop = h.toInt(i.scrollbarYTop * (i.contentHeight - i.containerHeight) / (i.containerHeight - i.railYRatio * i.scrollbarYHeight));
                element.scrollTop = scrollTop
            }
            var mouseMoveHandler = function(e) {
                updateScrollTop(e.pageY - currentPageY);
                updateGeometry(element);
                e.stopPropagation();
                e.preventDefault()
            };
            var mouseUpHandler = function() {
                h.stopScrolling(element, "y");
                i.event.unbind(i.ownerDocument, "mousemove", mouseMoveHandler)
            };
            i.event.bind(i.scrollbarY, "mousedown", function(e) {
                currentPageY = e.pageY;
                currentTop = h.toInt(d.css(i.scrollbarY, "top")) * i.railYRatio;
                h.startScrolling(element, "y");
                i.event.bind(i.ownerDocument, "mousemove", mouseMoveHandler);
                i.event.once(i.ownerDocument, "mouseup", mouseUpHandler);
                e.stopPropagation();
                e.preventDefault()
            })
        }
        module.exports = function(element) {
            var i = instances.get(element);
            bindMouseScrollXHandler(element, i);
            bindMouseScrollYHandler(element, i)
        }
    }, {
        "../../lib/dom": 18,
        "../../lib/helper": 21,
        "../instances": 33,
        "../update-geometry": 34
    }],
    27: [function(require, module, exports) {
        "use strict";
        var h = require("../../lib/helper"),
            instances = require("../instances"),
            updateGeometry = require("../update-geometry");

        function bindKeyboardHandler(element, i) {
            var hovered = false;
            i.event.bind(element, "mouseenter", function() {
                hovered = true
            });
            i.event.bind(element, "mouseleave", function() {
                hovered = false
            });
            var shouldPrevent = false;

            function shouldPreventDefault(deltaX, deltaY) {
                var scrollTop = element.scrollTop;
                if (deltaX === 0) {
                    if (!i.scrollbarYActive) {
                        return false
                    }
                    if (scrollTop === 0 && deltaY > 0 || scrollTop >= i.contentHeight - i.containerHeight && deltaY < 0) {
                        return !i.settings.wheelPropagation
                    }
                }
                var scrollLeft = element.scrollLeft;
                if (deltaY === 0) {
                    if (!i.scrollbarXActive) {
                        return false
                    }
                    if (scrollLeft === 0 && deltaX < 0 || scrollLeft >= i.contentWidth - i.containerWidth && deltaX > 0) {
                        return !i.settings.wheelPropagation
                    }
                }
                return true
            }
            i.event.bind(i.ownerDocument, "keydown", function(e) {
                if (e.isDefaultPrevented && e.isDefaultPrevented()) {
                    return
                }
                if (!hovered) {
                    return
                }
                var activeElement = document.activeElement ? document.activeElement : i.ownerDocument.activeElement;
                if (activeElement) {
                    while (activeElement.shadowRoot) {
                        activeElement = activeElement.shadowRoot.activeElement
                    }
                    if (h.isEditable(activeElement)) {
                        return
                    }
                }
                var deltaX = 0;
                var deltaY = 0;
                switch (e.which) {
                    case 37:
                        deltaX = -30;
                        break;
                    case 38:
                        deltaY = 30;
                        break;
                    case 39:
                        deltaX = 30;
                        break;
                    case 40:
                        deltaY = -30;
                        break;
                    case 33:
                        deltaY = 90;
                        break;
                    case 32:
                    case 34:
                        deltaY = -90;
                        break;
                    case 35:
                        if (e.ctrlKey) {
                            deltaY = -i.contentHeight
                        } else {
                            deltaY = -i.containerHeight
                        }
                        break;
                    case 36:
                        if (e.ctrlKey) {
                            deltaY = element.scrollTop
                        } else {
                            deltaY = i.containerHeight
                        }
                        break;
                    default:
                        return
                }
                element.scrollTop = element.scrollTop - deltaY;
                element.scrollLeft = element.scrollLeft + deltaX;
                updateGeometry(element);
                shouldPrevent = shouldPreventDefault(deltaX, deltaY);
                if (shouldPrevent) {
                    e.preventDefault()
                }
            })
        }
        module.exports = function(element) {
            var i = instances.get(element);
            bindKeyboardHandler(element, i)
        }
    }, {
        "../../lib/helper": 21,
        "../instances": 33,
        "../update-geometry": 34
    }],
    28: [function(require, module, exports) {
        "use strict";
        var h = require("../../lib/helper"),
            instances = require("../instances"),
            updateGeometry = require("../update-geometry");

        function bindMouseWheelHandler(element, i) {
            var shouldPrevent = false;

            function shouldPreventDefault(deltaX, deltaY) {
                var scrollTop = element.scrollTop;
                if (deltaX === 0) {
                    if (!i.scrollbarYActive) {
                        return false
                    }
                    if (scrollTop === 0 && deltaY > 0 || scrollTop >= i.contentHeight - i.containerHeight && deltaY < 0) {
                        return !i.settings.wheelPropagation
                    }
                }
                var scrollLeft = element.scrollLeft;
                if (deltaY === 0) {
                    if (!i.scrollbarXActive) {
                        return false
                    }
                    if (scrollLeft === 0 && deltaX < 0 || scrollLeft >= i.contentWidth - i.containerWidth && deltaX > 0) {
                        return !i.settings.wheelPropagation
                    }
                }
                return true
            }

            function getDeltaFromEvent(e) {
                var deltaX = e.deltaX;
                var deltaY = -1 * e.deltaY;
                if (typeof deltaX === "undefined" || typeof deltaY === "undefined") {
                    deltaX = -1 * e.wheelDeltaX / 6;
                    deltaY = e.wheelDeltaY / 6
                }
                if (e.deltaMode && e.deltaMode === 1) {
                    deltaX *= 10;
                    deltaY *= 10
                }
                if (deltaX !== deltaX && deltaY !== deltaY) {
                    deltaX = 0;
                    deltaY = e.wheelDelta
                }
                return [deltaX, deltaY]
            }

            function shouldBeConsumedByTextarea(deltaX, deltaY) {
                var hoveredTextarea = element.querySelector("textarea:hover");
                if (hoveredTextarea) {
                    var maxScrollTop = hoveredTextarea.scrollHeight - hoveredTextarea.clientHeight;
                    if (maxScrollTop > 0) {
                        if (!(hoveredTextarea.scrollTop === 0 && deltaY > 0) && !(hoveredTextarea.scrollTop === maxScrollTop && deltaY < 0)) {
                            return true
                        }
                    }
                    var maxScrollLeft = hoveredTextarea.scrollLeft - hoveredTextarea.clientWidth;
                    if (maxScrollLeft > 0) {
                        if (!(hoveredTextarea.scrollLeft === 0 && deltaX < 0) && !(hoveredTextarea.scrollLeft === maxScrollLeft && deltaX > 0)) {
                            return true
                        }
                    }
                }
                return false
            }

            function mousewheelHandler(e) {
                if (!h.env.isWebKit && element.querySelector("select:focus")) {
                    return
                }
                var delta = getDeltaFromEvent(e);
                var deltaX = delta[0];
                var deltaY = delta[1];
                if (shouldBeConsumedByTextarea(deltaX, deltaY)) {
                    return
                }
                shouldPrevent = false;
                if (!i.settings.useBothWheelAxes) {
                    element.scrollTop = element.scrollTop - deltaY * i.settings.wheelSpeed;
                    element.scrollLeft = element.scrollLeft + deltaX * i.settings.wheelSpeed
                } else if (i.scrollbarYActive && !i.scrollbarXActive) {
                    if (deltaY) {
                        element.scrollTop = element.scrollTop - deltaY * i.settings.wheelSpeed
                    } else {
                        element.scrollTop = element.scrollTop + deltaX * i.settings.wheelSpeed
                    }
                    shouldPrevent = true
                } else if (i.scrollbarXActive && !i.scrollbarYActive) {
                    if (deltaX) {
                        element.scrollLeft = element.scrollLeft + deltaX * i.settings.wheelSpeed
                    } else {
                        element.scrollLeft = element.scrollLeft - deltaY * i.settings.wheelSpeed
                    }
                    shouldPrevent = true
                }
                updateGeometry(element);
                shouldPrevent = shouldPrevent || shouldPreventDefault(deltaX, deltaY);
                if (shouldPrevent) {
                    e.stopPropagation();
                    e.preventDefault()
                }
            }
            if (typeof window.onwheel !== "undefined") {
                i.event.bind(element, "wheel", mousewheelHandler)
            } else if (typeof window.onmousewheel !== "undefined") {
                i.event.bind(element, "mousewheel", mousewheelHandler)
            }
        }
        module.exports = function(element) {
            var i = instances.get(element);
            bindMouseWheelHandler(element, i)
        }
    }, {
        "../../lib/helper": 21,
        "../instances": 33,
        "../update-geometry": 34
    }],
    29: [function(require, module, exports) {
        "use strict";
        var instances = require("../instances"),
            updateGeometry = require("../update-geometry");

        function bindNativeScrollHandler(element, i) {
            i.event.bind(element, "scroll", function() {
                updateGeometry(element)
            })
        }
        module.exports = function(element) {
            var i = instances.get(element);
            bindNativeScrollHandler(element, i)
        }
    }, {
        "../instances": 33,
        "../update-geometry": 34
    }],
    30: [function(require, module, exports) {
        "use strict";
        var h = require("../../lib/helper"),
            instances = require("../instances"),
            updateGeometry = require("../update-geometry");

        function bindSelectionHandler(element, i) {
            function getRangeNode() {
                var selection = window.getSelection ? window.getSelection() : document.getSelection ? document.getSelection() : "";
                if (selection.toString().length === 0) {
                    return null
                } else {
                    return selection.getRangeAt(0).commonAncestorContainer
                }
            }
            var scrollingLoop = null;
            var scrollDiff = {
                top: 0,
                left: 0
            };

            function startScrolling() {
                if (!scrollingLoop) {
                    scrollingLoop = setInterval(function() {
                        if (!instances.get(element)) {
                            clearInterval(scrollingLoop);
                            return
                        }
                        element.scrollTop = element.scrollTop + scrollDiff.top;
                        element.scrollLeft = element.scrollLeft + scrollDiff.left;
                        updateGeometry(element)
                    }, 50)
                }
            }

            function stopScrolling() {
                if (scrollingLoop) {
                    clearInterval(scrollingLoop);
                    scrollingLoop = null
                }
                h.stopScrolling(element)
            }
            var isSelected = false;
            i.event.bind(i.ownerDocument, "selectionchange", function() {
                if (element.contains(getRangeNode())) {
                    isSelected = true
                } else {
                    isSelected = false;
                    stopScrolling()
                }
            });
            i.event.bind(window, "mouseup", function() {
                if (isSelected) {
                    isSelected = false;
                    stopScrolling()
                }
            });
            i.event.bind(window, "mousemove", function(e) {
                if (isSelected) {
                    var mousePosition = {
                        x: e.pageX,
                        y: e.pageY
                    };
                    var containerGeometry = {
                        left: element.offsetLeft,
                        right: element.offsetLeft + element.offsetWidth,
                        top: element.offsetTop,
                        bottom: element.offsetTop + element.offsetHeight
                    };
                    if (mousePosition.x < containerGeometry.left + 3) {
                        scrollDiff.left = -5;
                        h.startScrolling(element, "x")
                    } else if (mousePosition.x > containerGeometry.right - 3) {
                        scrollDiff.left = 5;
                        h.startScrolling(element, "x")
                    } else {
                        scrollDiff.left = 0
                    }
                    if (mousePosition.y < containerGeometry.top + 3) {
                        if (containerGeometry.top + 3 - mousePosition.y < 5) {
                            scrollDiff.top = -5
                        } else {
                            scrollDiff.top = -20
                        }
                        h.startScrolling(element, "y")
                    } else if (mousePosition.y > containerGeometry.bottom - 3) {
                        if (mousePosition.y - containerGeometry.bottom + 3 < 5) {
                            scrollDiff.top = 5
                        } else {
                            scrollDiff.top = 20
                        }
                        h.startScrolling(element, "y")
                    } else {
                        scrollDiff.top = 0
                    }
                    if (scrollDiff.top === 0 && scrollDiff.left === 0) {
                        stopScrolling()
                    } else {
                        startScrolling()
                    }
                }
            })
        }
        module.exports = function(element) {
            var i = instances.get(element);
            bindSelectionHandler(element, i)
        }
    }, {
        "../../lib/helper": 21,
        "../instances": 33,
        "../update-geometry": 34
    }],
    31: [function(require, module, exports) {
        "use strict";
        var instances = require("../instances"),
            updateGeometry = require("../update-geometry");

        function bindTouchHandler(element, i, supportsTouch, supportsIePointer) {
            function shouldPreventDefault(deltaX, deltaY) {
                var scrollTop = element.scrollTop;
                var scrollLeft = element.scrollLeft;
                var magnitudeX = Math.abs(deltaX);
                var magnitudeY = Math.abs(deltaY);
                if (magnitudeY > magnitudeX) {
                    if (deltaY < 0 && scrollTop === i.contentHeight - i.containerHeight || deltaY > 0 && scrollTop === 0) {
                        return !i.settings.swipePropagation
                    }
                } else if (magnitudeX > magnitudeY) {
                    if (deltaX < 0 && scrollLeft === i.contentWidth - i.containerWidth || deltaX > 0 && scrollLeft === 0) {
                        return !i.settings.swipePropagation
                    }
                }
                return true
            }

            function applyTouchMove(differenceX, differenceY) {
                element.scrollTop = element.scrollTop - differenceY;
                element.scrollLeft = element.scrollLeft - differenceX;
                updateGeometry(element)
            }
            var startOffset = {};
            var startTime = 0;
            var speed = {};
            var easingLoop = null;
            var inGlobalTouch = false;
            var inLocalTouch = false;

            function globalTouchStart() {
                inGlobalTouch = true
            }

            function globalTouchEnd() {
                inGlobalTouch = false
            }

            function getTouch(e) {
                if (e.targetTouches) {
                    return e.targetTouches[0]
                } else {
                    return e
                }
            }

            function shouldHandle(e) {
                if (e.targetTouches && e.targetTouches.length === 1) {
                    return true
                }
                if (e.pointerType && e.pointerType !== "mouse" && e.pointerType !== e.MSPOINTER_TYPE_MOUSE) {
                    return true
                }
                return false
            }

            function touchStart(e) {
                if (shouldHandle(e)) {
                    inLocalTouch = true;
                    var touch = getTouch(e);
                    startOffset.pageX = touch.pageX;
                    startOffset.pageY = touch.pageY;
                    startTime = (new Date).getTime();
                    if (easingLoop !== null) {
                        clearInterval(easingLoop)
                    }
                    e.stopPropagation()
                }
            }

            function touchMove(e) {
                if (!inGlobalTouch && inLocalTouch && shouldHandle(e)) {
                    var touch = getTouch(e);
                    var currentOffset = {
                        pageX: touch.pageX,
                        pageY: touch.pageY
                    };
                    var differenceX = currentOffset.pageX - startOffset.pageX;
                    var differenceY = currentOffset.pageY - startOffset.pageY;
                    applyTouchMove(differenceX, differenceY);
                    startOffset = currentOffset;
                    var currentTime = (new Date).getTime();
                    var timeGap = currentTime - startTime;
                    if (timeGap > 0) {
                        speed.x = differenceX / timeGap;
                        speed.y = differenceY / timeGap;
                        startTime = currentTime
                    }
                    if (shouldPreventDefault(differenceX, differenceY)) {
                        e.stopPropagation();
                        e.preventDefault()
                    }
                }
            }

            function touchEnd() {
                if (!inGlobalTouch && inLocalTouch) {
                    inLocalTouch = false;
                    clearInterval(easingLoop);
                    easingLoop = setInterval(function() {
                        if (!instances.get(element)) {
                            clearInterval(easingLoop);
                            return
                        }
                        if (Math.abs(speed.x) < .01 && Math.abs(speed.y) < .01) {
                            clearInterval(easingLoop);
                            return
                        }
                        applyTouchMove(speed.x * 30, speed.y * 30);
                        speed.x *= .8;
                        speed.y *= .8
                    }, 10)
                }
            }
            if (supportsTouch) {
                i.event.bind(window, "touchstart", globalTouchStart);
                i.event.bind(window, "touchend", globalTouchEnd);
                i.event.bind(element, "touchstart", touchStart);
                i.event.bind(element, "touchmove", touchMove);
                i.event.bind(element, "touchend", touchEnd)
            }
            if (supportsIePointer) {
                if (window.PointerEvent) {
                    i.event.bind(window, "pointerdown", globalTouchStart);
                    i.event.bind(window, "pointerup", globalTouchEnd);
                    i.event.bind(element, "pointerdown", touchStart);
                    i.event.bind(element, "pointermove", touchMove);
                    i.event.bind(element, "pointerup", touchEnd)
                } else if (window.MSPointerEvent) {
                    i.event.bind(window, "MSPointerDown", globalTouchStart);
                    i.event.bind(window, "MSPointerUp", globalTouchEnd);
                    i.event.bind(element, "MSPointerDown", touchStart);
                    i.event.bind(element, "MSPointerMove", touchMove);
                    i.event.bind(element, "MSPointerUp", touchEnd)
                }
            }
        }
        module.exports = function(element, supportsTouch, supportsIePointer) {
            var i = instances.get(element);
            bindTouchHandler(element, i, supportsTouch, supportsIePointer)
        }
    }, {
        "../instances": 33,
        "../update-geometry": 34
    }],
    32: [function(require, module, exports) {
        "use strict";
        var cls = require("../lib/class"),
            h = require("../lib/helper"),
            instances = require("./instances"),
            updateGeometry = require("./update-geometry");
        var clickRailHandler = require("./handler/click-rail"),
            dragScrollbarHandler = require("./handler/drag-scrollbar"),
            keyboardHandler = require("./handler/keyboard"),
            mouseWheelHandler = require("./handler/mouse-wheel"),
            nativeScrollHandler = require("./handler/native-scroll"),
            selectionHandler = require("./handler/selection"),
            touchHandler = require("./handler/touch");
        module.exports = function(element, userSettings) {
            userSettings = typeof userSettings === "object" ? userSettings : {};
            cls.add(element, "ps-container");
            var i = instances.add(element);
            i.settings = h.extend(i.settings, userSettings);
            clickRailHandler(element);
            dragScrollbarHandler(element);
            mouseWheelHandler(element);
            nativeScrollHandler(element);
            selectionHandler(element);
            if (h.env.supportsTouch || h.env.supportsIePointer) {
                touchHandler(element, h.env.supportsTouch, h.env.supportsIePointer)
            }
            if (i.settings.useKeyboard) {
                keyboardHandler(element)
            }
            updateGeometry(element)
        }
    }, {
        "../lib/class": 17,
        "../lib/helper": 21,
        "./handler/click-rail": 25,
        "./handler/drag-scrollbar": 26,
        "./handler/keyboard": 27,
        "./handler/mouse-wheel": 28,
        "./handler/native-scroll": 29,
        "./handler/selection": 30,
        "./handler/touch": 31,
        "./instances": 33,
        "./update-geometry": 34
    }],
    33: [function(require, module, exports) {
        "use strict";
        var d = require("../lib/dom"),
            defaultSettings = require("./default-setting"),
            EventManager = require("../lib/event-manager"),
            guid = require("../lib/guid"),
            h = require("../lib/helper");
        var instances = {};

        function Instance(element) {
            var i = this;
            i.settings = h.clone(defaultSettings);
            i.containerWidth = null;
            i.containerHeight = null;
            i.contentWidth = null;
            i.contentHeight = null;
            i.isRtl = d.css(element, "direction") === "rtl";
            i.event = new EventManager;
            i.ownerDocument = element.ownerDocument || document;
            i.scrollbarXRail = d.appendTo(d.e("div", "ps-scrollbar-x-rail"), element);
            i.scrollbarX = d.appendTo(d.e("div", "ps-scrollbar-x"), i.scrollbarXRail);
            i.scrollbarXActive = null;
            i.scrollbarXWidth = null;
            i.scrollbarXLeft = null;
            i.scrollbarXBottom = h.toInt(d.css(i.scrollbarXRail, "bottom"));
            i.isScrollbarXUsingBottom = i.scrollbarXBottom === i.scrollbarXBottom;
            i.scrollbarXTop = i.isScrollbarXUsingBottom ? null : h.toInt(d.css(i.scrollbarXRail, "top"));
            i.railBorderXWidth = h.toInt(d.css(i.scrollbarXRail, "borderLeftWidth")) + h.toInt(d.css(i.scrollbarXRail, "borderRightWidth"));
            d.css(i.scrollbarXRail, "display", "block");
            i.railXMarginWidth = h.toInt(d.css(i.scrollbarXRail, "marginLeft")) + h.toInt(d.css(i.scrollbarXRail, "marginRight"));
            d.css(i.scrollbarXRail, "display", "");
            i.railXWidth = null;
            i.railXRatio = null;
            i.scrollbarYRail = d.appendTo(d.e("div", "ps-scrollbar-y-rail"), element);
            i.scrollbarY = d.appendTo(d.e("div", "ps-scrollbar-y"), i.scrollbarYRail);
            i.scrollbarYActive = null;
            i.scrollbarYHeight = null;
            i.scrollbarYTop = null;
            i.scrollbarYRight = h.toInt(d.css(i.scrollbarYRail, "right"));
            i.isScrollbarYUsingRight = i.scrollbarYRight === i.scrollbarYRight;
            i.scrollbarYLeft = i.isScrollbarYUsingRight ? null : h.toInt(d.css(i.scrollbarYRail, "left"));
            i.scrollbarYOuterWidth = i.isRtl ? h.outerWidth(i.scrollbarY) : null;
            i.railBorderYWidth = h.toInt(d.css(i.scrollbarYRail, "borderTopWidth")) + h.toInt(d.css(i.scrollbarYRail, "borderBottomWidth"));
            d.css(i.scrollbarYRail, "display", "block");
            i.railYMarginHeight = h.toInt(d.css(i.scrollbarYRail, "marginTop")) + h.toInt(d.css(i.scrollbarYRail, "marginBottom"));
            d.css(i.scrollbarYRail, "display", "");
            i.railYHeight = null;
            i.railYRatio = null
        }

        function getId(element) {
            if (typeof element.dataset === "undefined") {
                return element.getAttribute("data-ps-id")
            } else {
                return element.dataset.psId
            }
        }

        function setId(element, id) {
            if (typeof element.dataset === "undefined") {
                element.setAttribute("data-ps-id", id)
            } else {
                element.dataset.psId = id
            }
        }

        function removeId(element) {
            if (typeof element.dataset === "undefined") {
                element.removeAttribute("data-ps-id")
            } else {
                delete element.dataset.psId
            }
        }
        exports.add = function(element) {
            var newId = guid();
            setId(element, newId);
            instances[newId] = new Instance(element);
            return instances[newId]
        };
        exports.remove = function(element) {
            delete instances[getId(element)];
            removeId(element)
        };
        exports.get = function(element) {
            return instances[getId(element)]
        }
    }, {
        "../lib/dom": 18,
        "../lib/event-manager": 19,
        "../lib/guid": 20,
        "../lib/helper": 21,
        "./default-setting": 23
    }],
    34: [function(require, module, exports) {
        "use strict";
        var cls = require("../lib/class"),
            d = require("../lib/dom"),
            h = require("../lib/helper"),
            instances = require("./instances");

        function getThumbSize(i, thumbSize) {
            if (i.settings.minScrollbarLength) {
                thumbSize = Math.max(thumbSize, i.settings.minScrollbarLength)
            }
            if (i.settings.maxScrollbarLength) {
                thumbSize = Math.min(thumbSize, i.settings.maxScrollbarLength)
            }
            return thumbSize
        }

        function updateCss(element, i) {
            var xRailOffset = {
                width: i.railXWidth
            };
            if (i.isRtl) {
                xRailOffset.left = element.scrollLeft + i.containerWidth - i.contentWidth
            } else {
                xRailOffset.left = element.scrollLeft
            }
            if (i.isScrollbarXUsingBottom) {
                xRailOffset.bottom = i.scrollbarXBottom - element.scrollTop
            } else {
                xRailOffset.top = i.scrollbarXTop + element.scrollTop
            }
            d.css(i.scrollbarXRail, xRailOffset);
            var yRailOffset = {
                top: element.scrollTop,
                height: i.railYHeight
            };
            if (i.isScrollbarYUsingRight) {
                if (i.isRtl) {
                    yRailOffset.right = i.contentWidth - element.scrollLeft - i.scrollbarYRight - i.scrollbarYOuterWidth
                } else {
                    yRailOffset.right = i.scrollbarYRight - element.scrollLeft
                }
            } else {
                if (i.isRtl) {
                    yRailOffset.left = element.scrollLeft + i.containerWidth * 2 - i.contentWidth - i.scrollbarYLeft - i.scrollbarYOuterWidth
                } else {
                    yRailOffset.left = i.scrollbarYLeft + element.scrollLeft
                }
            }
            d.css(i.scrollbarYRail, yRailOffset);
            d.css(i.scrollbarX, {
                left: i.scrollbarXLeft,
                width: i.scrollbarXWidth - i.railBorderXWidth
            });
            d.css(i.scrollbarY, {
                top: i.scrollbarYTop,
                height: i.scrollbarYHeight - i.railBorderYWidth
            })
        }
        module.exports = function(element) {
            var i = instances.get(element);
            i.containerWidth = element.clientWidth;
            i.containerHeight = element.clientHeight;
            i.contentWidth = element.scrollWidth;
            i.contentHeight = element.scrollHeight;
            if (!element.contains(i.scrollbarXRail)) {
                d.appendTo(i.scrollbarXRail, element)
            }
            if (!element.contains(i.scrollbarYRail)) {
                d.appendTo(i.scrollbarYRail, element)
            }
            if (!i.settings.suppressScrollX && i.containerWidth + i.settings.scrollXMarginOffset < i.contentWidth) {
                i.scrollbarXActive = true;
                i.railXWidth = i.containerWidth - i.railXMarginWidth;
                i.railXRatio = i.containerWidth / i.railXWidth;
                i.scrollbarXWidth = getThumbSize(i, h.toInt(i.railXWidth * i.containerWidth / i.contentWidth));
                i.scrollbarXLeft = h.toInt(element.scrollLeft * (i.railXWidth - i.scrollbarXWidth) / (i.contentWidth - i.containerWidth))
            } else {
                i.scrollbarXActive = false;
                i.scrollbarXWidth = 0;
                i.scrollbarXLeft = 0;
                element.scrollLeft = 0
            }
            if (!i.settings.suppressScrollY && i.containerHeight + i.settings.scrollYMarginOffset < i.contentHeight) {
                i.scrollbarYActive = true;
                i.railYHeight = i.containerHeight - i.railYMarginHeight;
                i.railYRatio = i.containerHeight / i.railYHeight;
                i.scrollbarYHeight = getThumbSize(i, h.toInt(i.railYHeight * i.containerHeight / i.contentHeight));
                i.scrollbarYTop = h.toInt(element.scrollTop * (i.railYHeight - i.scrollbarYHeight) / (i.contentHeight - i.containerHeight))
            } else {
                i.scrollbarYActive = false;
                i.scrollbarYHeight = 0;
                i.scrollbarYTop = 0;
                element.scrollTop = 0
            }
            if (i.scrollbarXLeft >= i.railXWidth - i.scrollbarXWidth) {
                i.scrollbarXLeft = i.railXWidth - i.scrollbarXWidth
            }
            if (i.scrollbarYTop >= i.railYHeight - i.scrollbarYHeight) {
                i.scrollbarYTop = i.railYHeight - i.scrollbarYHeight
            }
            updateCss(element, i);
            cls[i.scrollbarXActive ? "add" : "remove"](element, "ps-active-x");
            cls[i.scrollbarYActive ? "add" : "remove"](element, "ps-active-y")
        }
    }, {
        "../lib/class": 17,
        "../lib/dom": 18,
        "../lib/helper": 21,
        "./instances": 33
    }],
    35: [function(require, module, exports) {
        "use strict";
        var d = require("../lib/dom"),
            h = require("../lib/helper"),
            instances = require("./instances"),
            updateGeometry = require("./update-geometry");
        module.exports = function(element) {
            var i = instances.get(element);
            d.css(i.scrollbarXRail, "display", "block");
            d.css(i.scrollbarYRail, "display", "block");
            i.railXMarginWidth = h.toInt(d.css(i.scrollbarXRail, "marginLeft")) + h.toInt(d.css(i.scrollbarXRail, "marginRight"));
            i.railYMarginHeight = h.toInt(d.css(i.scrollbarYRail, "marginTop")) + h.toInt(d.css(i.scrollbarYRail, "marginBottom"));
            d.css(i.scrollbarXRail, "display", "none");
            d.css(i.scrollbarYRail, "display", "none");
            updateGeometry(element);
            d.css(i.scrollbarXRail, "display", "");
            d.css(i.scrollbarYRail, "display", "")
        }
    }, {
        "../lib/dom": 18,
        "../lib/helper": 21,
        "./instances": 33,
        "./update-geometry": 34
    }],
    36: [function(require, module, exports) {
        (function() {
            var root = this;
            var previousUnderscore = root._;
            var ArrayProto = Array.prototype,
                ObjProto = Object.prototype,
                FuncProto = Function.prototype;
            var push = ArrayProto.push,
                slice = ArrayProto.slice,
                toString = ObjProto.toString,
                hasOwnProperty = ObjProto.hasOwnProperty;
            var nativeIsArray = Array.isArray,
                nativeKeys = Object.keys,
                nativeBind = FuncProto.bind,
                nativeCreate = Object.create;
            var Ctor = function() {};
            var _ = function(obj) {
                if (obj instanceof _) return obj;
                if (!(this instanceof _)) return new _(obj);
                this._wrapped = obj
            };
            if (typeof exports !== "undefined") {
                if (typeof module !== "undefined" && module.exports) {
                    exports = module.exports = _
                }
                exports._ = _
            } else {
                root._ = _
            }
            _.VERSION = "1.8.3";
            var optimizeCb = function(func, context, argCount) {
                if (context === void 0) return func;
                switch (argCount == null ? 3 : argCount) {
                    case 1:
                        return function(value) {
                            return func.call(context, value)
                        };
                    case 2:
                        return function(value, other) {
                            return func.call(context, value, other)
                        };
                    case 3:
                        return function(value, index, collection) {
                            return func.call(context, value, index, collection)
                        };
                    case 4:
                        return function(accumulator, value, index, collection) {
                            return func.call(context, accumulator, value, index, collection)
                        }
                }
                return function() {
                    return func.apply(context, arguments)
                }
            };
            var cb = function(value, context, argCount) {
                if (value == null) return _.identity;
                if (_.isFunction(value)) return optimizeCb(value, context, argCount);
                if (_.isObject(value)) return _.matcher(value);
                return _.property(value)
            };
            _.iteratee = function(value, context) {
                return cb(value, context, Infinity)
            };
            var createAssigner = function(keysFunc, undefinedOnly) {
                return function(obj) {
                    var length = arguments.length;
                    if (length < 2 || obj == null) return obj;
                    for (var index = 1; index < length; index++) {
                        var source = arguments[index],
                            keys = keysFunc(source),
                            l = keys.length;
                        for (var i = 0; i < l; i++) {
                            var key = keys[i];
                            if (!undefinedOnly || obj[key] === void 0) obj[key] = source[key]
                        }
                    }
                    return obj
                }
            };
            var baseCreate = function(prototype) {
                if (!_.isObject(prototype)) return {};
                if (nativeCreate) return nativeCreate(prototype);
                Ctor.prototype = prototype;
                var result = new Ctor;
                Ctor.prototype = null;
                return result
            };
            var property = function(key) {
                return function(obj) {
                    return obj == null ? void 0 : obj[key]
                }
            };
            var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
            var getLength = property("length");
            var isArrayLike = function(collection) {
                var length = getLength(collection);
                return typeof length == "number" && length >= 0 && length <= MAX_ARRAY_INDEX
            };
            _.each = _.forEach = function(obj, iteratee, context) {
                iteratee = optimizeCb(iteratee, context);
                var i, length;
                if (isArrayLike(obj)) {
                    for (i = 0, length = obj.length; i < length; i++) {
                        iteratee(obj[i], i, obj)
                    }
                } else {
                    var keys = _.keys(obj);
                    for (i = 0, length = keys.length; i < length; i++) {
                        iteratee(obj[keys[i]], keys[i], obj)
                    }
                }
                return obj
            };
            _.map = _.collect = function(obj, iteratee, context) {
                iteratee = cb(iteratee, context);
                var keys = !isArrayLike(obj) && _.keys(obj),
                    length = (keys || obj).length,
                    results = Array(length);
                for (var index = 0; index < length; index++) {
                    var currentKey = keys ? keys[index] : index;
                    results[index] = iteratee(obj[currentKey], currentKey, obj)
                }
                return results
            };

            function createReduce(dir) {
                function iterator(obj, iteratee, memo, keys, index, length) {
                    for (; index >= 0 && index < length; index += dir) {
                        var currentKey = keys ? keys[index] : index;
                        memo = iteratee(memo, obj[currentKey], currentKey, obj)
                    }
                    return memo
                }
                return function(obj, iteratee, memo, context) {
                    iteratee = optimizeCb(iteratee, context, 4);
                    var keys = !isArrayLike(obj) && _.keys(obj),
                        length = (keys || obj).length,
                        index = dir > 0 ? 0 : length - 1;
                    if (arguments.length < 3) {
                        memo = obj[keys ? keys[index] : index];
                        index += dir
                    }
                    return iterator(obj, iteratee, memo, keys, index, length)
                }
            }
            _.reduce = _.foldl = _.inject = createReduce(1);
            _.reduceRight = _.foldr = createReduce(-1);
            _.find = _.detect = function(obj, predicate, context) {
                var key;
                if (isArrayLike(obj)) {
                    key = _.findIndex(obj, predicate, context)
                } else {
                    key = _.findKey(obj, predicate, context)
                }
                if (key !== void 0 && key !== -1) return obj[key]
            };
            _.filter = _.select = function(obj, predicate, context) {
                var results = [];
                predicate = cb(predicate, context);
                _.each(obj, function(value, index, list) {
                    if (predicate(value, index, list)) results.push(value)
                });
                return results
            };
            _.reject = function(obj, predicate, context) {
                return _.filter(obj, _.negate(cb(predicate)), context)
            };
            _.every = _.all = function(obj, predicate, context) {
                predicate = cb(predicate, context);
                var keys = !isArrayLike(obj) && _.keys(obj),
                    length = (keys || obj).length;
                for (var index = 0; index < length; index++) {
                    var currentKey = keys ? keys[index] : index;
                    if (!predicate(obj[currentKey], currentKey, obj)) return false
                }
                return true
            };
            _.some = _.any = function(obj, predicate, context) {
                predicate = cb(predicate, context);
                var keys = !isArrayLike(obj) && _.keys(obj),
                    length = (keys || obj).length;
                for (var index = 0; index < length; index++) {
                    var currentKey = keys ? keys[index] : index;
                    if (predicate(obj[currentKey], currentKey, obj)) return true
                }
                return false
            };
            _.contains = _.includes = _.include = function(obj, item, fromIndex, guard) {
                if (!isArrayLike(obj)) obj = _.values(obj);
                if (typeof fromIndex != "number" || guard) fromIndex = 0;
                return _.indexOf(obj, item, fromIndex) >= 0
            };
            _.invoke = function(obj, method) {
                var args = slice.call(arguments, 2);
                var isFunc = _.isFunction(method);
                return _.map(obj, function(value) {
                    var func = isFunc ? method : value[method];
                    return func == null ? func : func.apply(value, args)
                })
            };
            _.pluck = function(obj, key) {
                return _.map(obj, _.property(key))
            };
            _.where = function(obj, attrs) {
                return _.filter(obj, _.matcher(attrs))
            };
            _.findWhere = function(obj, attrs) {
                return _.find(obj, _.matcher(attrs))
            };
            _.max = function(obj, iteratee, context) {
                var result = -Infinity,
                    lastComputed = -Infinity,
                    value, computed;
                if (iteratee == null && obj != null) {
                    obj = isArrayLike(obj) ? obj : _.values(obj);
                    for (var i = 0, length = obj.length; i < length; i++) {
                        value = obj[i];
                        if (value > result) {
                            result = value
                        }
                    }
                } else {
                    iteratee = cb(iteratee, context);
                    _.each(obj, function(value, index, list) {
                        computed = iteratee(value, index, list);
                        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
                            result = value;
                            lastComputed = computed
                        }
                    })
                }
                return result
            };
            _.min = function(obj, iteratee, context) {
                var result = Infinity,
                    lastComputed = Infinity,
                    value, computed;
                if (iteratee == null && obj != null) {
                    obj = isArrayLike(obj) ? obj : _.values(obj);
                    for (var i = 0, length = obj.length; i < length; i++) {
                        value = obj[i];
                        if (value < result) {
                            result = value
                        }
                    }
                } else {
                    iteratee = cb(iteratee, context);
                    _.each(obj, function(value, index, list) {
                        computed = iteratee(value, index, list);
                        if (computed < lastComputed || computed === Infinity && result === Infinity) {
                            result = value;
                            lastComputed = computed
                        }
                    })
                }
                return result
            };
            _.shuffle = function(obj) {
                var set = isArrayLike(obj) ? obj : _.values(obj);
                var length = set.length;
                var shuffled = Array(length);
                for (var index = 0, rand; index < length; index++) {
                    rand = _.random(0, index);
                    if (rand !== index) shuffled[index] = shuffled[rand];
                    shuffled[rand] = set[index]
                }
                return shuffled
            };
            _.sample = function(obj, n, guard) {
                if (n == null || guard) {
                    if (!isArrayLike(obj)) obj = _.values(obj);
                    return obj[_.random(obj.length - 1)]
                }
                return _.shuffle(obj).slice(0, Math.max(0, n))
            };
            _.sortBy = function(obj, iteratee, context) {
                iteratee = cb(iteratee, context);
                return _.pluck(_.map(obj, function(value, index, list) {
                    return {
                        value: value,
                        index: index,
                        criteria: iteratee(value, index, list)
                    }
                }).sort(function(left, right) {
                    var a = left.criteria;
                    var b = right.criteria;
                    if (a !== b) {
                        if (a > b || a === void 0) return 1;
                        if (a < b || b === void 0) return -1
                    }
                    return left.index - right.index
                }), "value")
            };
            var group = function(behavior) {
                return function(obj, iteratee, context) {
                    var result = {};
                    iteratee = cb(iteratee, context);
                    _.each(obj, function(value, index) {
                        var key = iteratee(value, index, obj);
                        behavior(result, value, key)
                    });
                    return result
                }
            };
            _.groupBy = group(function(result, value, key) {
                if (_.has(result, key)) result[key].push(value);
                else result[key] = [value]
            });
            _.indexBy = group(function(result, value, key) {
                result[key] = value
            });
            _.countBy = group(function(result, value, key) {
                if (_.has(result, key)) result[key]++;
                else result[key] = 1
            });
            _.toArray = function(obj) {
                if (!obj) return [];
                if (_.isArray(obj)) return slice.call(obj);
                if (isArrayLike(obj)) return _.map(obj, _.identity);
                return _.values(obj)
            };
            _.size = function(obj) {
                if (obj == null) return 0;
                return isArrayLike(obj) ? obj.length : _.keys(obj).length
            };
            _.partition = function(obj, predicate, context) {
                predicate = cb(predicate, context);
                var pass = [],
                    fail = [];
                _.each(obj, function(value, key, obj) {
                    (predicate(value, key, obj) ? pass : fail).push(value)
                });
                return [pass, fail]
            };
            _.first = _.head = _.take = function(array, n, guard) {
                if (array == null) return void 0;
                if (n == null || guard) return array[0];
                return _.initial(array, array.length - n)
            };
            _.initial = function(array, n, guard) {
                return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)))
            };
            _.last = function(array, n, guard) {
                if (array == null) return void 0;
                if (n == null || guard) return array[array.length - 1];
                return _.rest(array, Math.max(0, array.length - n))
            };
            _.rest = _.tail = _.drop = function(array, n, guard) {
                return slice.call(array, n == null || guard ? 1 : n)
            };
            _.compact = function(array) {
                return _.filter(array, _.identity)
            };
            var flatten = function(input, shallow, strict, startIndex) {
                var output = [],
                    idx = 0;
                for (var i = startIndex || 0, length = getLength(input); i < length; i++) {
                    var value = input[i];
                    if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
                        if (!shallow) value = flatten(value, shallow, strict);
                        var j = 0,
                            len = value.length;
                        output.length += len;
                        while (j < len) {
                            output[idx++] = value[j++]
                        }
                    } else if (!strict) {
                        output[idx++] = value
                    }
                }
                return output
            };
            _.flatten = function(array, shallow) {
                return flatten(array, shallow, false)
            };
            _.without = function(array) {
                return _.difference(array, slice.call(arguments, 1))
            };
            _.uniq = _.unique = function(array, isSorted, iteratee, context) {
                if (!_.isBoolean(isSorted)) {
                    context = iteratee;
                    iteratee = isSorted;
                    isSorted = false
                }
                if (iteratee != null) iteratee = cb(iteratee, context);
                var result = [];
                var seen = [];
                for (var i = 0, length = getLength(array); i < length; i++) {
                    var value = array[i],
                        computed = iteratee ? iteratee(value, i, array) : value;
                    if (isSorted) {
                        if (!i || seen !== computed) result.push(value);
                        seen = computed
                    } else if (iteratee) {
                        if (!_.contains(seen, computed)) {
                            seen.push(computed);
                            result.push(value)
                        }
                    } else if (!_.contains(result, value)) {
                        result.push(value)
                    }
                }
                return result
            };
            _.union = function() {
                return _.uniq(flatten(arguments, true, true))
            };
            _.intersection = function(array) {
                var result = [];
                var argsLength = arguments.length;
                for (var i = 0, length = getLength(array); i < length; i++) {
                    var item = array[i];
                    if (_.contains(result, item)) continue;
                    for (var j = 1; j < argsLength; j++) {
                        if (!_.contains(arguments[j], item)) break
                    }
                    if (j === argsLength) result.push(item)
                }
                return result
            };
            _.difference = function(array) {
                var rest = flatten(arguments, true, true, 1);
                return _.filter(array, function(value) {
                    return !_.contains(rest, value)
                })
            };
            _.zip = function() {
                return _.unzip(arguments)
            };
            _.unzip = function(array) {
                var length = array && _.max(array, getLength).length || 0;
                var result = Array(length);
                for (var index = 0; index < length; index++) {
                    result[index] = _.pluck(array, index)
                }
                return result
            };
            _.object = function(list, values) {
                var result = {};
                for (var i = 0, length = getLength(list); i < length; i++) {
                    if (values) {
                        result[list[i]] = values[i]
                    } else {
                        result[list[i][0]] = list[i][1]
                    }
                }
                return result
            };

            function createPredicateIndexFinder(dir) {
                return function(array, predicate, context) {
                    predicate = cb(predicate, context);
                    var length = getLength(array);
                    var index = dir > 0 ? 0 : length - 1;
                    for (; index >= 0 && index < length; index += dir) {
                        if (predicate(array[index], index, array)) return index
                    }
                    return -1
                }
            }
            _.findIndex = createPredicateIndexFinder(1);
            _.findLastIndex = createPredicateIndexFinder(-1);
            _.sortedIndex = function(array, obj, iteratee, context) {
                iteratee = cb(iteratee, context, 1);
                var value = iteratee(obj);
                var low = 0,
                    high = getLength(array);
                while (low < high) {
                    var mid = Math.floor((low + high) / 2);
                    if (iteratee(array[mid]) < value) low = mid + 1;
                    else high = mid
                }
                return low
            };

            function createIndexFinder(dir, predicateFind, sortedIndex) {
                return function(array, item, idx) {
                    var i = 0,
                        length = getLength(array);
                    if (typeof idx == "number") {
                        if (dir > 0) {
                            i = idx >= 0 ? idx : Math.max(idx + length, i)
                        } else {
                            length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1
                        }
                    } else if (sortedIndex && idx && length) {
                        idx = sortedIndex(array, item);
                        return array[idx] === item ? idx : -1
                    }
                    if (item !== item) {
                        idx = predicateFind(slice.call(array, i, length), _.isNaN);
                        return idx >= 0 ? idx + i : -1
                    }
                    for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
                        if (array[idx] === item) return idx
                    }
                    return -1
                }
            }
            _.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex);
            _.lastIndexOf = createIndexFinder(-1, _.findLastIndex);
            _.range = function(start, stop, step) {
                if (stop == null) {
                    stop = start || 0;
                    start = 0
                }
                step = step || 1;
                var length = Math.max(Math.ceil((stop - start) / step), 0);
                var range = Array(length);
                for (var idx = 0; idx < length; idx++, start += step) {
                    range[idx] = start
                }
                return range
            };
            var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
                if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
                var self = baseCreate(sourceFunc.prototype);
                var result = sourceFunc.apply(self, args);
                if (_.isObject(result)) return result;
                return self
            };
            _.bind = function(func, context) {
                if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
                if (!_.isFunction(func)) throw new TypeError("Bind must be called on a function");
                var args = slice.call(arguments, 2);
                var bound = function() {
                    return executeBound(func, bound, context, this, args.concat(slice.call(arguments)))
                };
                return bound
            };
            _.partial = function(func) {
                var boundArgs = slice.call(arguments, 1);
                var bound = function() {
                    var position = 0,
                        length = boundArgs.length;
                    var args = Array(length);
                    for (var i = 0; i < length; i++) {
                        args[i] = boundArgs[i] === _ ? arguments[position++] : boundArgs[i]
                    }
                    while (position < arguments.length) args.push(arguments[position++]);
                    return executeBound(func, bound, this, this, args)
                };
                return bound
            };
            _.bindAll = function(obj) {
                var i, length = arguments.length,
                    key;
                if (length <= 1) throw new Error("bindAll must be passed function names");
                for (i = 1; i < length; i++) {
                    key = arguments[i];
                    obj[key] = _.bind(obj[key], obj)
                }
                return obj
            };
            _.memoize = function(func, hasher) {
                var memoize = function(key) {
                    var cache = memoize.cache;
                    var address = "" + (hasher ? hasher.apply(this, arguments) : key);
                    if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
                    return cache[address]
                };
                memoize.cache = {};
                return memoize
            };
            _.delay = function(func, wait) {
                var args = slice.call(arguments, 2);
                return setTimeout(function() {
                    return func.apply(null, args)
                }, wait)
            };
            _.defer = _.partial(_.delay, _, 1);
            _.throttle = function(func, wait, options) {
                var context, args, result;
                var timeout = null;
                var previous = 0;
                if (!options) options = {};
                var later = function() {
                    previous = options.leading === false ? 0 : _.now();
                    timeout = null;
                    result = func.apply(context, args);
                    if (!timeout) context = args = null
                };
                return function() {
                    var now = _.now();
                    if (!previous && options.leading === false) previous = now;
                    var remaining = wait - (now - previous);
                    context = this;
                    args = arguments;
                    if (remaining <= 0 || remaining > wait) {
                        if (timeout) {
                            clearTimeout(timeout);
                            timeout = null
                        }
                        previous = now;
                        result = func.apply(context, args);
                        if (!timeout) context = args = null
                    } else if (!timeout && options.trailing !== false) {
                        timeout = setTimeout(later, remaining)
                    }
                    return result
                }
            };
            _.debounce = function(func, wait, immediate) {
                var timeout, args, context, timestamp, result;
                var later = function() {
                    var last = _.now() - timestamp;
                    if (last < wait && last >= 0) {
                        timeout = setTimeout(later, wait - last)
                    } else {
                        timeout = null;
                        if (!immediate) {
                            result = func.apply(context, args);
                            if (!timeout) context = args = null
                        }
                    }
                };
                return function() {
                    context = this;
                    args = arguments;
                    timestamp = _.now();
                    var callNow = immediate && !timeout;
                    if (!timeout) timeout = setTimeout(later, wait);
                    if (callNow) {
                        result = func.apply(context, args);
                        context = args = null
                    }
                    return result
                }
            };
            _.wrap = function(func, wrapper) {
                return _.partial(wrapper, func)
            };
            _.negate = function(predicate) {
                return function() {
                    return !predicate.apply(this, arguments)
                }
            };
            _.compose = function() {
                var args = arguments;
                var start = args.length - 1;
                return function() {
                    var i = start;
                    var result = args[start].apply(this, arguments);
                    while (i--) result = args[i].call(this, result);
                    return result
                }
            };
            _.after = function(times, func) {
                return function() {
                    if (--times < 1) {
                        return func.apply(this, arguments)
                    }
                }
            };
            _.before = function(times, func) {
                var memo;
                return function() {
                    if (--times > 0) {
                        memo = func.apply(this, arguments)
                    }
                    if (times <= 1) func = null;
                    return memo
                }
            };
            _.once = _.partial(_.before, 2);
            var hasEnumBug = !{
                toString: null
            }.propertyIsEnumerable("toString");
            var nonEnumerableProps = ["valueOf", "isPrototypeOf", "toString", "propertyIsEnumerable", "hasOwnProperty", "toLocaleString"];

            function collectNonEnumProps(obj, keys) {
                var nonEnumIdx = nonEnumerableProps.length;
                var constructor = obj.constructor;
                var proto = _.isFunction(constructor) && constructor.prototype || ObjProto;
                var prop = "constructor";
                if (_.has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);
                while (nonEnumIdx--) {
                    prop = nonEnumerableProps[nonEnumIdx];
                    if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
                        keys.push(prop)
                    }
                }
            }
            _.keys = function(obj) {
                if (!_.isObject(obj)) return [];
                if (nativeKeys) return nativeKeys(obj);
                var keys = [];
                for (var key in obj)
                    if (_.has(obj, key)) keys.push(key);
                if (hasEnumBug) collectNonEnumProps(obj, keys);
                return keys
            };
            _.allKeys = function(obj) {
                if (!_.isObject(obj)) return [];
                var keys = [];
                for (var key in obj) keys.push(key);
                if (hasEnumBug) collectNonEnumProps(obj, keys);
                return keys
            };
            _.values = function(obj) {
                var keys = _.keys(obj);
                var length = keys.length;
                var values = Array(length);
                for (var i = 0; i < length; i++) {
                    values[i] = obj[keys[i]]
                }
                return values
            };
            _.mapObject = function(obj, iteratee, context) {
                iteratee = cb(iteratee, context);
                var keys = _.keys(obj),
                    length = keys.length,
                    results = {},
                    currentKey;
                for (var index = 0; index < length; index++) {
                    currentKey = keys[index];
                    results[currentKey] = iteratee(obj[currentKey], currentKey, obj)
                }
                return results
            };
            _.pairs = function(obj) {
                var keys = _.keys(obj);
                var length = keys.length;
                var pairs = Array(length);
                for (var i = 0; i < length; i++) {
                    pairs[i] = [keys[i], obj[keys[i]]]
                }
                return pairs
            };
            _.invert = function(obj) {
                var result = {};
                var keys = _.keys(obj);
                for (var i = 0, length = keys.length; i < length; i++) {
                    result[obj[keys[i]]] = keys[i]
                }
                return result
            };
            _.functions = _.methods = function(obj) {
                var names = [];
                for (var key in obj) {
                    if (_.isFunction(obj[key])) names.push(key)
                }
                return names.sort()
            };
            _.extend = createAssigner(_.allKeys);
            _.extendOwn = _.assign = createAssigner(_.keys);
            _.findKey = function(obj, predicate, context) {
                predicate = cb(predicate, context);
                var keys = _.keys(obj),
                    key;
                for (var i = 0, length = keys.length; i < length; i++) {
                    key = keys[i];
                    if (predicate(obj[key], key, obj)) return key
                }
            };
            _.pick = function(object, oiteratee, context) {
                var result = {},
                    obj = object,
                    iteratee, keys;
                if (obj == null) return result;
                if (_.isFunction(oiteratee)) {
                    keys = _.allKeys(obj);
                    iteratee = optimizeCb(oiteratee, context)
                } else {
                    keys = flatten(arguments, false, false, 1);
                    iteratee = function(value, key, obj) {
                        return key in obj
                    };
                    obj = Object(obj)
                }
                for (var i = 0, length = keys.length; i < length; i++) {
                    var key = keys[i];
                    var value = obj[key];
                    if (iteratee(value, key, obj)) result[key] = value
                }
                return result
            };
            _.omit = function(obj, iteratee, context) {
                if (_.isFunction(iteratee)) {
                    iteratee = _.negate(iteratee)
                } else {
                    var keys = _.map(flatten(arguments, false, false, 1), String);
                    iteratee = function(value, key) {
                        return !_.contains(keys, key)
                    }
                }
                return _.pick(obj, iteratee, context)
            };
            _.defaults = createAssigner(_.allKeys, true);
            _.create = function(prototype, props) {
                var result = baseCreate(prototype);
                if (props) _.extendOwn(result, props);
                return result
            };
            _.clone = function(obj) {
                if (!_.isObject(obj)) return obj;
                return _.isArray(obj) ? obj.slice() : _.extend({}, obj)
            };
            _.tap = function(obj, interceptor) {
                interceptor(obj);
                return obj
            };
            _.isMatch = function(object, attrs) {
                var keys = _.keys(attrs),
                    length = keys.length;
                if (object == null) return !length;
                var obj = Object(object);
                for (var i = 0; i < length; i++) {
                    var key = keys[i];
                    if (attrs[key] !== obj[key] || !(key in obj)) return false
                }
                return true
            };
            var eq = function(a, b, aStack, bStack) {
                if (a === b) return a !== 0 || 1 / a === 1 / b;
                if (a == null || b == null) return a === b;
                if (a instanceof _) a = a._wrapped;
                if (b instanceof _) b = b._wrapped;
                var className = toString.call(a);
                if (className !== toString.call(b)) return false;
                switch (className) {
                    case "[object RegExp]":
                    case "[object String]":
                        return "" + a === "" + b;
                    case "[object Number]":
                        if (+a !== +a) return +b !== +b;
                        return +a === 0 ? 1 / +a === 1 / b : +a === +b;
                    case "[object Date]":
                    case "[object Boolean]":
                        return +a === +b
                }
                var areArrays = className === "[object Array]";
                if (!areArrays) {
                    if (typeof a != "object" || typeof b != "object") return false;
                    var aCtor = a.constructor,
                        bCtor = b.constructor;
                    if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor && _.isFunction(bCtor) && bCtor instanceof bCtor) && ("constructor" in a && "constructor" in b)) {
                        return false
                    }
                }
                aStack = aStack || [];
                bStack = bStack || [];
                var length = aStack.length;
                while (length--) {
                    if (aStack[length] === a) return bStack[length] === b
                }
                aStack.push(a);
                bStack.push(b);
                if (areArrays) {
                    length = a.length;
                    if (length !== b.length) return false;
                    while (length--) {
                        if (!eq(a[length], b[length], aStack, bStack)) return false
                    }
                } else {
                    var keys = _.keys(a),
                        key;
                    length = keys.length;
                    if (_.keys(b).length !== length) return false;
                    while (length--) {
                        key = keys[length];
                        if (!(_.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false
                    }
                }
                aStack.pop();
                bStack.pop();
                return true
            };
            _.isEqual = function(a, b) {
                return eq(a, b)
            };
            _.isEmpty = function(obj) {
                if (obj == null) return true;
                if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;
                return _.keys(obj).length === 0
            };
            _.isElement = function(obj) {
                return !!(obj && obj.nodeType === 1)
            };
            _.isArray = nativeIsArray || function(obj) {
                return toString.call(obj) === "[object Array]"
            };
            _.isObject = function(obj) {
                var type = typeof obj;
                return type === "function" || type === "object" && !!obj
            };
            _.each(["Arguments", "Function", "String", "Number", "Date", "RegExp", "Error"], function(name) {
                _["is" + name] = function(obj) {
                    return toString.call(obj) === "[object " + name + "]"
                }
            });
            if (!_.isArguments(arguments)) {
                _.isArguments = function(obj) {
                    return _.has(obj, "callee")
                }
            }
            if (typeof /./ != "function" && typeof Int8Array != "object") {
                _.isFunction = function(obj) {
                    return typeof obj == "function" || false
                }
            }
            _.isFinite = function(obj) {
                return isFinite(obj) && !isNaN(parseFloat(obj))
            };
            _.isNaN = function(obj) {
                return _.isNumber(obj) && obj !== +obj
            };
            _.isBoolean = function(obj) {
                return obj === true || obj === false || toString.call(obj) === "[object Boolean]"
            };
            _.isNull = function(obj) {
                return obj === null
            };
            _.isUndefined = function(obj) {
                return obj === void 0
            };
            _.has = function(obj, key) {
                return obj != null && hasOwnProperty.call(obj, key)
            };
            _.noConflict = function() {
                root._ = previousUnderscore;
                return this
            };
            _.identity = function(value) {
                return value
            };
            _.constant = function(value) {
                return function() {
                    return value
                }
            };
            _.noop = function() {};
            _.property = property;
            _.propertyOf = function(obj) {
                return obj == null ? function() {} : function(key) {
                    return obj[key]
                }
            };
            _.matcher = _.matches = function(attrs) {
                attrs = _.extendOwn({}, attrs);
                return function(obj) {
                    return _.isMatch(obj, attrs)
                }
            };
            _.times = function(n, iteratee, context) {
                var accum = Array(Math.max(0, n));
                iteratee = optimizeCb(iteratee, context, 1);
                for (var i = 0; i < n; i++) accum[i] = iteratee(i);
                return accum
            };
            _.random = function(min, max) {
                if (max == null) {
                    max = min;
                    min = 0
                }
                return min + Math.floor(Math.random() * (max - min + 1))
            };
            _.now = Date.now || function() {
                return (new Date).getTime()
            };
            var escapeMap = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#x27;",
                "`": "&#x60;"
            };
            var unescapeMap = _.invert(escapeMap);
            var createEscaper = function(map) {
                var escaper = function(match) {
                    return map[match]
                };
                var source = "(?:" + _.keys(map).join("|") + ")";
                var testRegexp = RegExp(source);
                var replaceRegexp = RegExp(source, "g");
                return function(string) {
                    string = string == null ? "" : "" + string;
                    return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string
                }
            };
            _.escape = createEscaper(escapeMap);
            _.unescape = createEscaper(unescapeMap);
            _.result = function(object, property, fallback) {
                var value = object == null ? void 0 : object[property];
                if (value === void 0) {
                    value = fallback
                }
                return _.isFunction(value) ? value.call(object) : value
            };
            var idCounter = 0;
            _.uniqueId = function(prefix) {
                var id = ++idCounter + "";
                return prefix ? prefix + id : id
            };
            _.templateSettings = {
                evaluate: /<%([\s\S]+?)%>/g,
                interpolate: /<%=([\s\S]+?)%>/g,
                escape: /<%-([\s\S]+?)%>/g
            };
            var noMatch = /(.)^/;
            var escapes = {
                "'": "'",
                "\\": "\\",
                "\r": "r",
                "\n": "n",
                "\u2028": "u2028",
                "\u2029": "u2029"
            };
            var escaper = /\\|'|\r|\n|\u2028|\u2029/g;
            var escapeChar = function(match) {
                return "\\" + escapes[match]
            };
            _.template = function(text, settings, oldSettings) {
                if (!settings && oldSettings) settings = oldSettings;
                settings = _.defaults({}, settings, _.templateSettings);
                var matcher = RegExp([(settings.escape || noMatch).source, (settings.interpolate || noMatch).source, (settings.evaluate || noMatch).source].join("|") + "|$", "g");
                var index = 0;
                var source = "__p+='";
                text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
                    source += text.slice(index, offset).replace(escaper, escapeChar);
                    index = offset + match.length;
                    if (escape) {
                        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'"
                    } else if (interpolate) {
                        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'"
                    } else if (evaluate) {
                        source += "';\n" + evaluate + "\n__p+='"
                    }
                    return match
                });
                source += "';\n";
                if (!settings.variable) source = "with(obj||{}){\n" + source + "}\n";
                source = "var __t,__p='',__j=Array.prototype.join," + "print=function(){__p+=__j.call(arguments,'');};\n" + source + "return __p;\n";
                try {
                    var render = new Function(settings.variable || "obj", "_", source)
                } catch (e) {
                    e.source = source;
                    throw e
                }
                var template = function(data) {
                    return render.call(this, data, _)
                };
                var argument = settings.variable || "obj";
                template.source = "function(" + argument + "){\n" + source + "}";
                return template
            };
            _.chain = function(obj) {
                var instance = _(obj);
                instance._chain = true;
                return instance
            };
            var result = function(instance, obj) {
                return instance._chain ? _(obj).chain() : obj
            };
            _.mixin = function(obj) {
                _.each(_.functions(obj), function(name) {
                    var func = _[name] = obj[name];
                    _.prototype[name] = function() {
                        var args = [this._wrapped];
                        push.apply(args, arguments);
                        return result(this, func.apply(_, args))
                    }
                })
            };
            _.mixin(_);
            _.each(["pop", "push", "reverse", "shift", "sort", "splice", "unshift"], function(name) {
                var method = ArrayProto[name];
                _.prototype[name] = function() {
                    var obj = this._wrapped;
                    method.apply(obj, arguments);
                    if ((name === "shift" || name === "splice") && obj.length === 0) delete obj[0];
                    return result(this, obj)
                }
            });
            _.each(["concat", "join", "slice"], function(name) {
                var method = ArrayProto[name];
                _.prototype[name] = function() {
                    return result(this, method.apply(this._wrapped, arguments))
                }
            });
            _.prototype.value = function() {
                return this._wrapped
            };
            _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;
            _.prototype.toString = function() {
                return "" + this._wrapped
            };
            if (typeof define === "function" && define.amd) {
                define("underscore", [], function() {
                    return _
                })
            }
        }).call(this)
    }, {}],
    37: [function(require, module, exports) {
        var $ = require("jquery");
        var accordion = require("aria-accordion");
        var A11yDialog = require("a11y-dialog");
        var datefilter = require("./modules/date-filter");
        var dropdown = require("./modules/dropdowns");

        function KeywordModal() {
            this.elm = document.querySelector(".js-keyword-modal");
            this.$elm = $(this.elm);
            this.dialog = new A11yDialog(this.elm)
        }
        $(".js-accordion").each(function() {
            var contentPrefix = $(this).data("content-prefix") || "accordion";
            var openFirst = $(this).data("open-first") || false;
            var opts = {
                contentPrefix: contentPrefix,
                openFirst: openFirst
            };
            new accordion.Accordion({}, opts)
        });
        $(".js-dropdown").each(function() {
            new dropdown.Dropdown(this)
        });
        if ($(".js-keyword-modal").length > 0) {
            new KeywordModal
        }
        if ($(".js-date-range").length > 0) {
            new datefilter.DateFilter
        }
    }, {
        "./modules/date-filter": 38,
        "./modules/dropdowns": 39,
        "a11y-dialog": 1,
        "aria-accordion": 2,
        jquery: 13
    }],
    38: [function(require, module, exports) {
        "use strict";
        var $ = require("jquery");
        var moment = require("moment");
        require("jquery.inputmask");
        require("jquery.inputmask/dist/inputmask/inputmask.date.extensions");

        function DateFilter() {
            this.$elm = $(".js-filter");
            this.validateInput = this.$elm.data("validate") || false;
            this.$range = this.$elm.find(".js-date-range");
            this.$grid = this.$elm.find(".js-date-grid");
            this.$minDate = this.$elm.find(".js-min-date");
            this.$maxDate = this.$elm.find(".js-max-date");
            this.$submit = this.$elm.find("button");
            this.$minDate.inputmask("mm/dd/yyyy", {
                oncomplete: this.validate.bind(this)
            });
            this.$maxDate.inputmask("mm/dd/yyyy", {
                oncomplete: this.validate.bind(this)
            });
            this.$elm.find("select").on("change", this.handleInputChange.bind(this));
            this.fields = ["min_" + this.name, "max_" + this.name];
            this.$minDate.on("focus", this.handleMinDateSelect.bind(this));
            this.$maxDate.on("focus", this.handleMaxDateSelect.bind(this));
            this.$elm.on("click", ".date-range__grid li", this.handleGridItemSelect.bind(this));
            this.handleInputChange()
        }
        DateFilter.prototype.validate = function() {
            if (!this.validateInput) {
                return
            }
            var years = [this.minYear, this.maxYear];
            var minDateYear = this.$minDate.val() ? parseInt(this.$minDate.val().split("/")[2]) : this.minYear;
            var maxDateYear = this.$maxDate.val() ? parseInt(this.$maxDate.val().split("/")[2]) : this.maxYear;
            if (years.indexOf(minDateYear) > -1 && years.indexOf(maxDateYear) > -1) {
                this.hideWarning();
                this.$elm.trigger("filters:validation", [{
                    isValid: true
                }])
            } else {
                this.showWarning();
                this.$elm.trigger("filters:validation", [{
                    isValid: false
                }])
            }
        };
        DateFilter.prototype.setValue = function(value) {
            this.$minDate.val(value[0]).change();
            this.$maxDate.val(value[1]).change()
        };
        DateFilter.prototype.handleInputChange = function(e, opts) {
            var today = new Date;
            this.maxYear = parseInt($("option:selected").text().split("–"));
            this.minYear = this.maxYear - 1;
            this.$minDate.val("01/01/" + this.minYear.toString()).change();
            if (this.maxYear === today.getFullYear()) {
                today = moment(today).format("MM/DD/YYYY");
                this.$maxDate.val(today).change()
            } else {
                this.$maxDate.val("12/31/" + this.maxYear.toString()).change()
            }
            this.validate();
            this.setupDateGrid()
        };
        DateFilter.prototype.setupDateGrid = function() {
            var dateBegin = this.$minDate.val().split("/");
            var dateEnd = this.$maxDate.val().split("/");
            var dateRangeFirst = this.$grid.find(".date-range__row").eq(0);
            var dateRangeSecond = this.$grid.find(".date-range__row").eq(1);
            var minDateMonth = dateBegin[0];
            var minDateYear = dateBegin[2];
            var maxDateMonth = dateEnd[0];
            var maxDateYear = dateEnd[2];
            var $dateBegin;
            var $dateEnd;
            dateRangeFirst.find(".date-range__year").html(this.minYear);
            dateRangeFirst.find("ul").attr("data-year", this.minYear);
            dateRangeSecond.find(".date-range__year").html(this.maxYear);
            dateRangeSecond.find("ul").attr("data-year", this.maxYear);
            $dateBegin = this.$grid.find('ul[data-year="' + minDateYear + '"] ' + 'li[data-month="' + minDateMonth + '"]');
            $dateEnd = this.$grid.find('ul[data-year="' + maxDateYear + '"] ' + 'li[data-month="' + maxDateMonth + '"]');
            this.handleDateGridRange($dateBegin, $dateEnd)
        };
        DateFilter.prototype.handleDateGridRange = function($dateBegin, $dateEnd) {
            this.$grid.find("li").removeClass();
            $dateBegin.addClass("selected month--begin");
            $dateEnd.addClass("selected month--end");
            if (!$dateBegin.is($dateEnd)) {
                $dateBegin.nextUntil(".month--end").addClass("selected");
                $dateEnd.prevUntil(".month--begin").addClass("selected")
            }
        };
        DateFilter.prototype.handleMinDateSelect = function() {
            var self = this;
            var $dateBegin = this.$grid.find(".month--begin");
            var $dateEnd = this.$grid.find(".month--end");
            this.$grid.show().removeClass("pick-max").addClass("pick-min");
            this.$grid.find(".is-active").removeClass("is-active");
            $dateBegin.addClass("is-active");
            this.$grid.find("li").hover(function() {
                var dateBeginNum = parseInt($(this).parent().attr("data-year") + $(this).attr("data-month"));
                var dateEndNum = parseInt($dateEnd.parent().attr("data-year") + $dateEnd.attr("data-month"));
                if (dateBeginNum <= dateEndNum) {
                    self.$grid.removeClass("is-invalid");
                    self.handleDateGridRange($(this), $dateEnd)
                } else {
                    self.$grid.addClass("is-invalid")
                }
            }, function() {
                self.handleDateGridRange($dateBegin, $dateEnd);
                $dateBegin.addClass("is-active")
            })
        };
        DateFilter.prototype.handleMaxDateSelect = function() {
            var self = this;
            var $dateBegin = this.$grid.find(".month--begin");
            var $dateEnd = this.$grid.find(".month--end");
            this.$grid.show().removeClass("pick-min").addClass("pick-max");
            this.$grid.find(".is-active").removeClass("is-active");
            $dateEnd.addClass("is-active");
            this.$grid.find("li").hover(function() {
                var dateBeginNum = parseInt($dateBegin.parent().attr("data-year") + $dateBegin.attr("data-month"));
                var dateEndNum = parseInt($(this).parent().attr("data-year") + $(this).attr("data-month"));
                if (dateBeginNum <= dateEndNum) {
                    self.$grid.removeClass("is-invalid");
                    self.handleDateGridRange($dateBegin, $(this))
                } else {
                    self.$grid.addClass("is-invalid")
                }
            }, function() {
                self.handleDateGridRange($dateBegin, $dateEnd);
                $dateEnd.addClass("is-active")
            })
        };
        DateFilter.prototype.handleGridItemSelect = function(e) {
            var value = [];
            var $selectDate = $(e.target).parent();
            var selectDateMonth = $selectDate.data("month");
            var selectDateYear = $selectDate.parent().attr("data-year");
            if ($(e.target).hasClass("selected")) {
                $selectDate = $(e.target)
            }
            if (this.$grid.hasClass("pick-min")) {
                value[0] = selectDateMonth + "/01/" + selectDateYear;
                value[1] = this.$maxDate.val()
            } else {
                var lastDay = new Date(selectDateYear, selectDateMonth, 0);
                lastDay = lastDay.getDate();
                value[0] = this.$minDate.val();
                value[1] = selectDateMonth + "/" + lastDay + "/" + selectDateYear
            }
            if (!this.$grid.hasClass("is-invalid")) {
                var $nextItem = this.$grid.hasClass("pick-min") ? this.$maxDate : this.$submit;
                this.$grid.removeClass("pick-min pick-max");
                this.$grid.find("li").unbind("mouseenter mouseleave");
                this.setValue(value);
                this.$grid.addClass("is-invalid");
                $nextItem.focus()
            }
        };
        DateFilter.prototype.showWarning = function() {
            if (!this.showingWarning) {
                var warning = '<div class="message message--error message--small">' + "You entered a date that's outside the two-year time period. " + "Please enter a receipt date from " + "<strong>" + this.minYear + "-" + this.maxYear + "</strong>" + "</div>";
                this.$range.after(warning);
                this.showingWarning = true;
                this.$grid.hide()
            }
        };
        DateFilter.prototype.hideWarning = function() {
            if (this.showingWarning) {
                this.$elm.find(".message").remove();
                this.showingWarning = false
            }
        };
        module.exports = {
            DateFilter: DateFilter
        }
    }, {
        jquery: 13,
        "jquery.inputmask": 12,
        "jquery.inputmask/dist/inputmask/inputmask.date.extensions": 4,
        moment: 14
    }],
    39: [function(require, module, exports) {
        "use strict";
        var $ = require("jquery");
        require("perfect-scrollbar/jquery")($);
        var listeners = require("./listeners");
        var KEYCODE_ESC = 27;
        var KEYCODE_ENTER = 13;
        var defaultOpts = {
            checkboxes: true
        };

        function Dropdown(selector, opts) {
            this.opts = $.extend({}, defaultOpts, opts);
            this.isOpen = false;
            this.$body = $(selector);
            this.$button = this.$body.find(".dropdown__button");
            this.$panel = this.$body.find(".dropdown__panel");
            if (this.opts.checkboxes) {
                this.$selected = this.$body.find(".dropdown__selected");
                this.$panel.on("keyup", 'input[type="checkbox"]', this.handleCheckKeyup.bind(this));
                this.$panel.on("change", 'input[type="checkbox"]', this.handleCheck.bind(this));
                this.$panel.on("click", ".dropdown__item--selected", this.handleDropdownItemClick.bind(this));
                this.$selected.on("click", 'input[type="checkbox"]', this.handleSelectedInputClick.bind(this));
                this.$selected.on("click", ".dropdown__remove", this.handleRemoveClick.bind(this));
                if (this.isEmpty()) {
                    this.removePanel()
                }
            }
            $(document.body).on("tag:removeAll", this.handleClearFilters.bind(this));
            this.$button.on("click", this.toggle.bind(this));
            this.events = new listeners.Listeners;
            this.events.on(document.body, "click", this.handleClickAway.bind(this));
            this.events.on(document.body, "focusin", this.handleFocusAway.bind(this));
            this.events.on(document.body, "keyup", this.handleKeyup.bind(this));
            this.$button.attr("aria-haspopup", "true");
            this.$panel.attr("aria-label", "More options")
        }
        Dropdown.prototype.toggle = function(e) {
            e.preventDefault();
            var method = this.isOpen ? this.hide : this.show;
            method.apply(this);
            return false
        };
        Dropdown.prototype.show = function() {
            this.$panel.attr("aria-hidden", "false");
            this.$panel.perfectScrollbar({
                suppressScrollX: true
            });
            this.$panel.find('input[type="checkbox"]:first').focus();
            this.$button.addClass("is-active");
            this.isOpen = true
        };
        Dropdown.prototype.hide = function() {
            this.$panel.attr("aria-hidden", "true");
            this.$button.removeClass("is-active");
            this.isOpen = false
        };
        Dropdown.prototype.handleClickAway = function(e) {
            var $target = $(e.target);
            if (!this.$body.has($target).length) {
                this.hide()
            }
        };
        Dropdown.prototype.handleFocusAway = function(e) {
            var $target = $(e.target);
            if (this.isOpen && !this.$panel.has($target).length && !this.$panel.is($target) && !$target.is(this.$button)) {
                this.hide()
            }
        };
        Dropdown.prototype.handleKeyup = function(e) {
            if (e.keyCode === KEYCODE_ESC) {
                if (this.isOpen) {
                    this.hide();
                    this.$button.focus()
                }
            }
        };
        Dropdown.prototype.handleCheckKeyup = function(e) {
            if (e.keyCode === KEYCODE_ENTER) {
                $(e.target).prop("checked", true).change()
            }
        };
        Dropdown.prototype.handleCheck = function(e) {
            var $input = $(e.target);
            if ($input.is(":checked")) {
                this.selectItem($input)
            }
        };
        Dropdown.prototype.handleDropdownItemClick = function(e) {
            var $button = $(e.target);
            var $input = this.$selected.find("#" + $button.data("label"));
            if (!$button.hasClass("is-checked")) {
                $input.click()
            }
        };
        Dropdown.prototype.handleSelectedInputClick = function(e) {
            var $button = this.$panel.find("button[data-label=" + e.target.id + "]");
            $button.toggleClass("is-checked")
        };
        Dropdown.prototype.handleCheckboxRemoval = function($input) {
            var $item = $input.parent();
            var $label = $input.parent().find("label");
            var $button = this.$panel.find('button[data-label="' + $input.attr("id") + '"]');
            if ($button.length > 0) {
                $button.parent().append($input);
                $button.parent().append($label);
                $button.remove();
                $item.remove()
            }
        };
        Dropdown.prototype.handleRemoveClick = function(e, opts) {
            var $input = $(e.target).parent().find("input");
            if (opts) {
                $input = this.$selected.find("#" + opts.key)
            }
            this.handleCheckboxRemoval($input)
        };
        Dropdown.prototype.handleClearFilters = function() {
            var self = this;
            if (this.$selected) {
                this.$selected.find("input:checkbox:not(:checked)").each(function() {
                    self.handleCheckboxRemoval($(this))
                })
            }
        };
        Dropdown.prototype.selectItem = function($input) {
            var $item = $input.parent(".dropdown__item");
            var $label = $item.find("label");
            var prev = $item.prevAll(".dropdown__item");
            var next = $item.nextAll(".dropdown__item");
            $item.after('<li class="dropdown__item">' + '<button class="dropdown__item--selected is-checked"' + ' data-label="' + $label.attr("for") + '" >' + $label.text() + "</button></li>");
            this.$selected.append($item);
            $item.append('<button class="dropdown__remove">' + '<span class="u-visually-hidden">Remove</span></button>');
            if (!this.isEmpty()) {
                if (next.length) {
                    $(next[0]).find('input[type="checkbox"]').focus()
                } else if (prev.length) {
                    $(prev[0]).find('input[type="checkbox"]').focus()
                }
            } else {
                this.removePanel();
                this.$selected.find('input[type="checkbox"]').focus()
            }
        };
        Dropdown.prototype.removePanel = function() {
            this.$panel.remove();
            this.$button.remove()
        };
        Dropdown.prototype.isEmpty = function() {
            return this.$panel.find("input").length === 0
        };
        Dropdown.prototype.destroy = function() {
            this.events.clear()
        };
        module.exports = {
            Dropdown: Dropdown
        }
    }, {
        "./listeners": 40,
        jquery: 13,
        "perfect-scrollbar/jquery": 15
    }],
    40: [function(require, module, exports) {
        "use strict";
        var $ = require("jquery");
        var _ = require("underscore");

        function Listeners() {
            this.listeners = []
        }
        Listeners.prototype.on = function(elm) {
            var $elm = $(elm);
            var args = _.toArray(arguments).slice(1);
            this.listeners = this._listeners || [];
            this.listeners.push({
                $elm: $elm,
                args: args
            });
            $elm.on.apply($elm, args)
        };
        Listeners.prototype.clear = function() {
            this.listeners.forEach(function(listener) {
                var $elm = listener.$elm;
                var args = listener.args;
                $elm.off.apply($elm, args)
            })
        };
        module.exports = {
            Listeners: Listeners
        }
    }, {
        jquery: 13,
        underscore: 36
    }]
}, {}, [37]);