/*
 * Tooltip JS package for Bear Framework
 * https://github.com/ivopetkov/tooltip-js-bearframework-addon
 * Copyright (c) Ivo Petkov
 * Free to use under the MIT license.
 */

/* global clientPackages */

var ivoPetkov = ivoPetkov || {};
ivoPetkov.bearFrameworkAddons = ivoPetkov.bearFrameworkAddons || {};
ivoPetkov.bearFrameworkAddons.tooltip = ivoPetkov.bearFrameworkAddons.tooltip || (function () {

    var idCounter = 0;
    var windowSpacing = 5;

    var elements = {};

    var escapeKey = null;
    clientPackages.get('escapeKey').then(function (escapeKeyObject) {
        escapeKey = escapeKeyObject;
    });

    var generateID = function () {
        idCounter++;
        return 'tt' + idCounter;
    };

    var updatePosition = function (id) {
        if (!isVisible(id)) {
            return;
        }

        var elementData = elements[id];
        var target = elementData[0];
        var element = elementData[1];
        var options = elementData[3];
        var fixedParent = elementData[4];

        var align = options.align;
        //var showArrow = options.showArrow; // DEPRECATED
        var contentSpacing = options.contentSpacing;
        var arrowSize = options.arrowSize;
        var arrowColor = element.style.backgroundColor;
        var preferedPositions = options.preferedPositions;

        element.style.top = '-1000vh';
        element.style.left = '-1000vw';

        var container = element.parentNode;
        var windowWidth = window.innerWidth;
        var windowHeight = window.innerHeight;
        var targetRect = target.getBoundingClientRect();
        var elementRect = element.getBoundingClientRect();
        var containerRect = container.getBoundingClientRect();
        var targetLeft = targetRect.left;
        var targetTop = targetRect.top;
        var targetWidth = targetRect.width;
        var targetHeight = targetRect.height;
        var contentWidth = elementRect.width;
        var contentHeight = elementRect.height;

        var parentsWithScroll = getParentsWithScroll(target);
        for (var i = -1; i < parentsWithScroll.length; i++) {
            if (i === -1) {
                var parentTop = 0;
                var parentLeft = 0;
                var parentWidth = windowWidth;
                var parentHeight = windowHeight;
            } else {
                var parentWithScroll = parentsWithScroll[i];
                var parentWithScrollRect = parentWithScroll.getBoundingClientRect();
                var parentTop = parentWithScrollRect.top;
                var parentLeft = parentWithScrollRect.left;
                var parentWidth = parentWithScrollRect.width;
                var parentHeight = parentWithScrollRect.height;
            }
            if (parentTop > targetTop + targetHeight || parentTop + parentHeight < targetTop || parentLeft > parentLeft + targetWidth || parentLeft + parentWidth < parentLeft) {
                hide(id);
                return;
            }
        }

        // Calculate positions relevance, 2 = perfect, 1 = not perfect, not set = not prefered
        var positionRelevance = {};
        for (var k in preferedPositions) {
            var preferedPosition = preferedPositions[k];
            var requiredSpace = (preferedPosition === 'top' || preferedPosition === 'bottom' ? contentHeight + contentSpacing : contentWidth + contentSpacing) + windowSpacing;
            if (requiredSpace < 1) {
                requiredSpace = 1;
            }
            var availableSpace = 0;
            if (preferedPosition === 'top') {
                availableSpace = targetTop;
            } else if (preferedPosition === 'bottom') {
                availableSpace = windowHeight - targetTop - targetHeight;
            } else if (preferedPosition === 'left') {
                availableSpace = targetLeft;
            } else if (preferedPosition === 'right') {
                availableSpace = windowWidth - targetLeft - targetWidth;
            }
            positionRelevance[preferedPosition] = requiredSpace < availableSpace ? 2 : 1 + availableSpace / requiredSpace;
        }

        // Find the most relevant position
        var selectedPosition = null;
        var selectedPositionRelevance = 0;
        for (var k in preferedPositions) {
            var preferedPosition = preferedPositions[k];
            if (positionRelevance[preferedPosition] > selectedPositionRelevance) {
                selectedPositionRelevance = positionRelevance[preferedPosition];
                selectedPosition = preferedPosition;
            }
        }

        var notEnoughWidth = false;
        var notEnoughHeight = false;
        if (selectedPositionRelevance > 0 && selectedPositionRelevance < 2) {
            if (selectedPosition === 'top' || selectedPosition === 'bottom') {
                notEnoughHeight = true;
            } else if (selectedPosition === 'left' || selectedPosition === 'right') {
                notEnoughWidth = true;
            }
        }

        var top = 0;
        var left = 0;
        if (selectedPosition === 'top') {
            top = targetTop - contentHeight - contentSpacing;
            left = targetLeft;
        } else if (selectedPosition === 'bottom') {
            top = targetTop + targetHeight + contentSpacing;
            left = targetLeft;
        } else if (selectedPosition === 'left') {
            top = targetTop;
            left = targetLeft - contentWidth - contentSpacing;
        } else if (selectedPosition === 'right') {
            top = targetTop;
            left = targetLeft + targetWidth + contentSpacing;
        }

        if (selectedPosition === 'top' || selectedPosition === 'bottom') {
            if (align === 'center') {
                left -= Math.floor((contentWidth - targetWidth) / 2);
            } else if (align === 'end') {
                left -= contentWidth - targetWidth;
            }
            if (left + contentWidth + 2 > windowWidth) {
                left = windowWidth - 2 - contentWidth;
            }
        } else if (selectedPosition === 'left' || selectedPosition === 'right') {
            if (align === 'center') {
                top -= Math.floor((contentHeight - targetHeight) / 2);
            } else if (align === 'end') {
                top -= contentHeight - targetHeight;
            }
            if (top + contentHeight + 2 > windowHeight) {
                top = windowHeight - 2 - contentHeight;
            }
        }

        if (left < windowSpacing) {
            left = windowSpacing;
        }
        if (left + contentWidth > windowWidth - windowSpacing) {
            left = windowWidth - windowSpacing - contentWidth;
        }
        if (top < windowSpacing) {
            top = windowSpacing;
        }

        if (top + contentHeight > windowHeight - windowSpacing) {
            top = windowHeight - windowSpacing - contentHeight;
        }

        if (arrowSize > 0) {
            var arrowLeft = null;
            var arrowTop = null;
            if (!notEnoughWidth && !notEnoughHeight) {
                if (selectedPosition === 'top' || selectedPosition === 'bottom') {
                    arrowLeft = targetLeft - left + (targetWidth - arrowSize * 2) / 2;
                    arrowTop = selectedPosition === 'top' ? contentHeight : -(arrowSize * 2);
                    if (arrowLeft < 0 || arrowLeft > contentWidth - arrowSize * 2) {
                        arrowLeft = null;
                    }
                } else if (selectedPosition === 'left' || selectedPosition === 'right') {
                    arrowLeft = selectedPosition === 'left' ? contentWidth : -(arrowSize * 2);
                    arrowTop = targetTop - top + (targetHeight - arrowSize * 2) / 2;
                    if (arrowTop < 0 || arrowTop > contentHeight - arrowSize * 2) {
                        arrowTop = null;
                    }
                }
            }

            if (arrowLeft !== null && arrowTop !== null) {
                var colors = {
                    'top': arrowColor + ' transparent transparent transparent',
                    'bottom': 'transparent transparent ' + arrowColor + ' transparent',
                    'left': 'transparent transparent transparent ' + arrowColor,
                    'right': 'transparent ' + arrowColor + ' transparent transparent',
                };
                element.style.setProperty('--tooltip-internal-arrow-size', arrowSize + 'px');
                element.style.setProperty('--tooltip-internal-arrow-colors', colors[selectedPosition]);
                element.style.setProperty('--tooltip-internal-arrow-display', 'block');
                element.style.setProperty('--tooltip-internal-arrow-left', arrowLeft + 'px');
                element.style.setProperty('--tooltip-internal-arrow-top', arrowTop + 'px');
            } else {
                element.style.removeProperty('--tooltip-internal-arrow-display');
                element.style.removeProperty('--tooltip-internal-arrow-left');
                element.style.removeProperty('--tooltip-internal-arrow-top');
            }
        }

        if (fixedParent === null) {
            top -= containerRect.top;
            left -= containerRect.left;
        }

        element.style.top = top + 'px';
        element.style.left = left + 'px';
    };

    var updatePositionAll = function () {
        for (var id in elements) {
            updatePosition(id);
        }
    };

    var show = function (id, target, content, options) {
        if (isVisible(id)) {
            hide(id);
        }

        if (typeof options === 'undefined') {
            options = {};
        }
        if (typeof options.align === 'undefined') { // start, center, end
            options.align = 'center';
        }
        if (typeof options.showArrow !== 'undefined' && options.showArrow === false) { // true, false // DEPRECATED
            options.arrowSize = 0;
        }
        if (typeof options.preferedPositions === 'undefined') {
            options.preferedPositions = ['bottom', 'top', 'left', 'right'];
        }
        if (typeof options.onHide === 'undefined') {
            options.onHide = null;
        }
        if (typeof options.hideOnWindowWidthChange === 'undefined') {
            options.hideOnWindowWidthChange = false;
        }
        if (typeof options.hideOnClick === 'undefined') {
            options.hideOnClick = false;
        }
        if (typeof options.hideOnKeyDown === 'undefined') {
            options.hideOnKeyDown = false;
        }

        var escapeKeyHandler = function () {
            if (isVisible(id)) {
                hide(id);
                return true;
            }
        };

        var contentContainer = document.body;
        if (typeof options.contentContainer !== 'undefined') {
            contentContainer = options.contentContainer;
            var contentContainerPosition = getComputedStyle(contentContainer).position;
            if (['relative', 'absolute', 'fixed'].indexOf(contentContainerPosition) === -1) {
                contentContainer.style.setProperty('position', 'relative');
            }
        }
        var fixedParent = contentContainer === document.body ? getFixedParent(target) : null;
        var parentZIndex = getParentZIndex(target);
        var element = document.createElement('div');
        element.setAttribute('data-tooltip', '');
        element.setAttribute('role', 'tooltip');
        element.style.position = fixedParent !== null ? 'fixed' : 'absolute';
        element.style.zIndex = (parentZIndex !== null ? parentZIndex : 0) + 10;
        if (typeof options.attributes !== 'undefined') {
            var customAttributes = options.attributes;
            for (var customAttributeName in customAttributes) {
                element.setAttribute(customAttributeName, customAttributes[customAttributeName]);
            }
        }
        if (typeof content === 'string') {
            element.innerHTML = content;
        } else {
            element.appendChild(content);
        }
        contentContainer.appendChild(element);
        var elementStyle = getComputedStyle(element);
        var getStyleValue = function (name, defaultValue) {
            var value = elementStyle.getPropertyValue(name);
            if (value !== '') {
                return value;
            }
            return defaultValue;
        };
        var promiseToWait = null;
        if (typeof options.onBeforeShow !== 'undefined') {
            try {
                var result = options.onBeforeShow(element);
                if (typeof result === 'object' && typeof result.then === 'function') {
                    promiseToWait = result;
                }
            } catch (e) {

            }
        }

        var continueShow = function () {
            if (typeof options.contentSpacing === 'undefined') {
                options.contentSpacing = parseInt(getStyleValue('--tooltip-content-spacing', '12px').replace('px', ''));
            }
            if (typeof options.arrowSize === 'undefined') {
                options.arrowSize = parseInt(getStyleValue('--tooltip-arrow-size', '8px').replace('px', ''));
            }
            if (typeof options.maxWidth === 'undefined') {
                options.maxWidth = getStyleValue('--tooltip-max-width', null);
            }
            if (options.maxWidth !== null) {
                element.style.maxWidth = options.maxWidth;
            }
            elements[id] = [target, element, escapeKeyHandler, options, fixedParent];
            // a style might be added in onBeforeShow
            element.style.backgroundColor = getStyleValue('--tooltip-background-color', '#eee');
            element.style.border = getStyleValue('--tooltip-border');
            element.style.borderRadius = getStyleValue('--tooltip-border-radius');
            updatePosition(id);

            addParentsOnScroll(target);

            // var r = document.createElement('div');
            // r.setAttribute('role', 'alert');
            // r.setAttribute('aria-live', 'assertive');
            // r.setAttribute('aria-atomic', 'true');
            // contentContainer.appendChild(r);
            // r.innerHTML = 'TEST FOR NARATOR';

            escapeKey.addHandler(escapeKeyHandler);

            if (typeof options.onShow !== 'undefined') {
                try {
                    options.onShow(element);
                } catch (e) {

                }
            }
        };
        if (promiseToWait !== null) {
            promiseToWait.then(continueShow);
        } else {
            continueShow();
        }
    };

    var hide = function (id) {
        if (isVisible(id)) {
            var childrenIDs = getChildrenTooltips(id);
            for (var i = 0; i < childrenIDs.length; i++) {
                hide(childrenIDs[i]);
            }
            var elementData = elements[id];
            var element = elementData[1];
            var options = getElementOptions(id);
            escapeKey.removeHandler(elementData[2]);
            element.parentNode.removeChild(element);
            delete elements[id];
            if (options.onHide !== null) {
                try {
                    options.onHide();
                } catch (e) {

                }
            }
        }
    };

    var hideAll = function () {
        for (var id in elements) {
            hide(id);
        }
    };

    var toggle = function (id, target, content, options) {
        if (isVisible(id)) {
            hide(id);
        } else {
            show(id, target, content, options);
        }
    };

    var isVisible = function (id) {
        return typeof elements[id] !== 'undefined';
    };

    var hasVisible = function () {
        for (var id in elements) {
            return true;
        }
        return false;
    };

    var isElementInsideTarget = function (id, element) {
        if (typeof elements[id] !== 'undefined') {
            var elementData = elements[id];
            if (elementData[0].contains(element)) {
                return true;
            }
        }
        return false;
    };

    var isElementInsideTooltip = function (id, element) {
        if (typeof elements[id] !== 'undefined') {
            var elementData = elements[id];
            if (elementData[1].contains(element)) {
                return true;
            }
        }
        return false;
    };

    var getParentTooltips = function (id) {
        var result = [];
        if (typeof elements[id] !== 'undefined') {
            var elementData = elements[id];
            for (var otherID in elements) {
                if (otherID === id) {
                    continue;
                }
                if (isElementInsideTooltip(otherID, elementData[0])) {
                    result.push(otherID);
                    result = result.concat(getParentTooltips(otherID));
                }
            }
        }
        return getArrayUniqueValues(result);
    };

    var getFixedParent = function (element) {
        while (element.parentNode !== null) {
            if (element === document.body) {
                break;
            }
            var contentContainerPosition = getComputedStyle(element).position;
            if (contentContainerPosition === 'fixed') {
                return element;
            }
            element = element.parentNode;
        }
        return null;
    };

    var getParentZIndex = function (element) {
        while (element.parentNode !== null) {
            if (element === document.body) {
                break;
            }
            var zIndex = getComputedStyle(element).zIndex;
            if (zIndex !== null && !isNaN(zIndex)) {
                return zIndex;
            }
            element = element.parentNode;
        }
        return null;
    };

    var getParentsWithScroll = function (element) {
        var result = [];
        while (element !== null) {
            if (element === document.body) {
                break;
            }
            if (element.scrollTop > 0 || element.scrollLeft > 0) {
                result.push(element)
            }
            element = element.parentNode;
        }
        return result;
    };

    var elementWithAddedScroll = [];
    var addParentsOnScroll = function (element) {
        while (element.parentNode !== null) {
            if (element === document.body) {
                break;
            }
            if (elementWithAddedScroll.indexOf(element) === -1) {
                element.addEventListener('scroll', updatePositionOnAnimationFrame);
                elementWithAddedScroll.push(element);
            }
            element = element.parentNode;
        }
    };

    var getChildrenTooltips = function (id) {
        var result = [];
        if (typeof elements[id] !== 'undefined') {
            for (var otherID in elements) {
                if (otherID === id) {
                    continue;
                }
                if (isElementInsideTooltip(id, elements[otherID][0])) {
                    result.push(otherID);
                    result = result.concat(getChildrenTooltips(otherID));
                }
            }
        }
        return getArrayUniqueValues(result);
    };

    var getArrayUniqueValues = (array) => {
        return array.filter((value, index, array) => {
            return array.indexOf(value) === index;;
        });
    };

    var requestAnimationFrameFunction = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function (callback) {
        window.setTimeout(callback, 1000 / 60);
    };

    var runUpdatePositionRequest = null;
    var updatePositionOnAnimationFrame = function () {
        runUpdatePositionRequest = true;
    };
    var checkUpdatePosition = function () {
        if (runUpdatePositionRequest !== null) {
            updatePositionAll();
            runUpdatePositionRequest = null;
        }
        requestAnimationFrameFunction(checkUpdatePosition);
    };
    checkUpdatePosition();

    var currentWindowWidth = window.innerWidth;
    var checkHideOnWindowWidthChange = function () {
        if (currentWindowWidth !== window.innerWidth) {
            for (var id in elements) {
                if (getElementOptions(id).hideOnWindowWidthChange) {
                    hide(id);
                }
            }
            currentWindowWidth = window.innerWidth;
        }
    };

    var getElementOptions = function (id) {
        return typeof elements[id] !== 'undefined' ? elements[id][3] : null;
    };

    var initialized = false;
    var initialize = function () {
        if (!initialized && document.body !== null) {
            initialized = true;
            document.body.addEventListener('mousedown', function (event) {
                var eventTarget = event.target;
                var elementsToKeep = [];
                for (var id in elements) {
                    var options = getElementOptions(id);
                    if (options.hideOnClick) {
                        continue;
                    }
                    if (isElementInsideTarget(id, eventTarget) || isElementInsideTooltip(id, eventTarget)) {
                        elementsToKeep.push(id);
                        elementsToKeep = elementsToKeep.concat(getParentTooltips(id));
                    }
                }
                elementsToKeep = getArrayUniqueValues(elementsToKeep);
                for (var id in elements) {
                    if (elementsToKeep.indexOf(id) === -1) {
                        hide(id);
                    }
                }
            });
            document.body.addEventListener('keydown', function () {
                for (var id in elements) {
                    var options = getElementOptions(id);
                    if (options.hideOnKeyDown) {
                        hide(id);
                    }
                }
            });
            window.addEventListener('resize', checkHideOnWindowWidthChange);
            document.addEventListener('scroll', updatePositionOnAnimationFrame);
            window.addEventListener('resize', updatePositionOnAnimationFrame);
            window.addEventListener('orientationchange', updatePositionOnAnimationFrame);

            var style = document.createElement('style');
            var content = '[data-tooltip]{position:relative;box-sizing:border-box;max-width:calc(100vw - ' + (2 * windowSpacing) + 'px);max-height:calc(100vh - ' + (2 * windowSpacing) + 'px);}';
            content += '[data-tooltip]:before{content:"";top:0;left:0;display:block;width:0;height:0;border-color:var(--tooltip-internal-arrow-colors);border-width:var(--tooltip-internal-arrow-size,0);border-style:solid;z-index:1;position:absolute;transform:rotate(0);display:var(--tooltip-internal-arrow-display,none);top:var(--tooltip-internal-arrow-top,0);left:var(--tooltip-internal-arrow-left,0);}';
            style.innerHTML = content;
            document.head.appendChild(style);

            if (typeof MutationObserver !== "undefined") {
                (new MutationObserver(function () {
                    for (var id in elements) {
                        if (!document.body.contains(elements[id][0])) {
                            hide(id);
                        }
                    }
                })).observe(document.body, { attributes: true, childList: true, subtree: true });
            }
        }
    };

    document.addEventListener('readystatechange', () => { // interactive or complete
        initialize();
    });
    initialize();

    var addClickListener = function (target, callback, options) {
        if (typeof options === 'undefined') {
            options = {};
        }
        var preventDefault = typeof options.preventDefault !== 'undefined' ? options.preventDefault : false; // prevents hrefs if behind the target
        var stopPropagation = typeof options.stopPropagation !== 'undefined' ? options.stopPropagation : false; // prevents event from bubbling
        target.addEventListener('click', function (event) {
            if (preventDefault) {
                event.preventDefault();
            }
            if (stopPropagation) {
                event.stopPropagation();
            }
            callback();
        });
    };

    return {
        'generateID': generateID,
        'show': show,
        'hide': hide,
        'hideAll': hideAll,
        'toggle': toggle,
        'isVisible': isVisible,
        'hasVisible': hasVisible,
        'addClickListener': addClickListener
    };
}());