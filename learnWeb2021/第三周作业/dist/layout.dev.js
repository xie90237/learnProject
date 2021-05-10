"use strict";

function getStyle(element) {
  if (!element.style) element.style = {};
  var p = element.computedStyle.value;

  for (var prop in element.computedStyle) {
    element.style[prop] = element.computedStyle[prop].value;

    if (element.style[prop].toString().match(/px$/)) {
      element.style[prop] = parseInt(element.style[prop]);
    }

    if (element.style[prop].toString().match(/^[0-9\.]+$/)) {
      element.style[prop] = parseInt(element.style[prop]);
    }
  }

  return element.style;
}

function layout(element) {
  if (!element.computedStyle) return;
  var elementStyle = getStyle(element);
  if (elementStyle.display != 'flex') return;
  var items = element.children.filter(function (item) {
    return item.type == 'element';
  });
  items.sort(function (a, b) {
    return (a.order || 0) - (b.order || 0);
  });
  var style = elementStyle;
  ["width", "height"].forEach(function (item) {
    if (style[item] === "auto" || style[item] === "") {
      style[item] = null;
    }
  });
  if (!style.flexDirection || style.flexDirection == "auto") style.flexDirection = "row";
  if (!style.alignItem || style.alignItem == "auto") style.alignItem = "strecth";
  if (!style.justifyContent || style.justifyContent == "auto") style.justifyContent = "flex-start";
  if (!style.flexWrap || style.flexWrap == "auto") style.flexWrap = "nowrap";
  if (!style.alignContent || style.alignContent == "auto") style.alignContent = "strecth";
  var mainSize, mainStart, mainEnd, mainSign, mainBase, crossSize, crossStart, crossEnd, crossSign, crossBase;

  if (style.flexDirection == "row") {
    mainSize = "width";
    mainStart = "left";
    mainEnd = "right";
    mainSign = +1;
    mainBase = 0;
    crossSize = "height";
    crossStart = "top";
    crossEnd = "bottom";
  }

  if (style.flexDirection == "row-reverse") {
    mainSize = "width";
    mainStart = "right";
    mainEnd = "left";
    mainSign = -1;
    mainBase = style.width;
    crossSize = "height";
    crossStart = "top";
    crossEnd = "bottom";
  }

  if (style.flexDirection == "column") {
    mainSize = "height";
    mainStart = "top";
    mainEnd = "bottom";
    mainSign = +1;
    mainBase = 0;
    crossSize = "width";
    crossStart = "left";
    crossEnd = "right";
  }

  if (style.flexDirection == "column-reverse") {
    mainSize = "height";
    mainStart = "bottom";
    mainEnd = "top";
    mainSign = -1;
    mainBase = style.height;
    crossSize = "width";
    crossStart = "left";
    crossEnd = "right";
  }

  if (style.flexWrap == "wrap-reverse") {
    var _ref = [crossEnd, crossStart];
    crossStart = _ref[0];
    crossEnd = _ref[1];
    crossSign = -1;
  } else {
    crossBase = 0;
    crossSign = +1;
  }

  var isAutoMainSize = false;

  if (!style[mainSize]) {
    elementStyle[mainSize] = 0;

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var itemStyle = getStyle(item);

      if (itemStyle[mainSize] != null || itemStyle[mainSize] != void 0) {
        elementStyle[mainSize] = elementStyle[mainSize] + itemStyle[mainSize];
      }

      isAutoMainSize = true;
    }
  }

  var flexLine = [];
  var flexLines = [flexLine];
  var mainSpace = elementStyle[mainSize];
  var crossSpace = 0;

  for (var _i = 0; _i < items.length; _i++) {
    var _item = items[_i];

    var _itemStyle = getStyle(_item);

    if (_itemStyle[mainSize] === null) {
      _itemStyle[mainSize] = 0;
    }

    if (_itemStyle.flex) {
      flexLine.push(_item);
    } else if (style.flexWrap === "nowrap" && isAutoMainSize) {
      mainSpace -= _itemStyle[mainSize];

      if (_itemStyle[crossSize] != null && _itemStyle[crossSize] != void 0) {
        crossSpace = Math.max(crossSpace, _itemStyle[crossSize]);
      }

      flexLine.push(_item);
    } else {
      if (_itemStyle[mainSize] > style[mainSize]) _itemStyle[mainSize] = style[mainSize];

      if (mainSpace < _itemStyle[mainSize]) {
        flexLine.mainSpace = mainSpace;
        flexLine.crossSpace = crossSpace;
        flexLine = [_item];
        flexLines.push(flexLine);
        mainSpace = style[mainSize];
        crossSpace = 0;
      } else {
        flexLine.push(_item);
      }

      if (_itemStyle[crossSize] != null && _itemStyle[crossSize] != void 0) {
        crossSpace = Math.max(crossSpace, _itemStyle[crossSize]);
      }

      mainSpace -= _itemStyle[mainSize];
    }
  }

  flexLine.mainSpace = mainSpace;

  if (style.flexWrap === "nowrap" || isAutoMainSize) {
    flexLine.crossSpace = style[crossSize] !== void 0 ? style[crossSize] : crossSpace;
  } else {
    flexLine.crossSpace = crossSpace;
  }

  if (mainSpace < 0) {
    var scale = style[mainSize] / (style[mainSize] - mainSpace);
    var currentMain = mainBase;

    for (var _i2 = 0; _i2 < items.length; _i2++) {
      var _item2 = items[_i2];

      var _itemStyle2 = getStyle(_item2);

      if (_itemStyle2.flex) {
        _itemStyle2[mainSize] = 0;
      }

      _itemStyle2[mainSize] *= scale;
      _itemStyle2[mainStart] = currentMain;
      _itemStyle2[mainEnd] = _itemStyle2[mainStart] + mainSign * _itemStyle2[mainSize];
      currentMain = _itemStyle2[mainEnd];
    }
  } else {
    flexLines.forEach(function (items) {
      var mainSpace = items.mainSpace;
      var flexTotal = 0;

      for (var _i3 = 0; _i3 < items.length; _i3++) {
        var _item3 = items[_i3];

        var _itemStyle3 = getStyle(_item3);

        if (_itemStyle3.flex != null && _itemStyle3.flex != void 0) {
          flexTotal += _itemStyle3.flex;
        }
      }

      if (flexTotal > 0) {
        var _currentMain = mainBase;

        for (var _i4 = 0; _i4 < items.length; _i4++) {
          var _item4 = items[_i4];

          var _itemStyle4 = getStyle(_item4);

          if (_itemStyle4.flex) {
            _itemStyle4[mainSize] = mainSpace / flexTotal * _itemStyle4.flex;
          }

          _itemStyle4[mainStart] = _currentMain;
          _itemStyle4[mainEnd] = _itemStyle4[mainStart] + mainSign * _itemStyle4[mainSize];
          _currentMain = _itemStyle4[mainEnd];
        }
      } else {
        var _currentMain2 = mainBase,
            _step = 0;

        switch (style.justifyContent) {
          case "flex-start":
            {}
            break;

          case "flex-end":
            {
              _currentMain2 = mainSpace * mainSign + mainBase;
            }
            break;

          case "center":
            {
              _currentMain2 = mainSpace / 2 * mainSign + mainBase;
            }
            break;

          case "space-between":
            {
              _step = mainSpace / (items.length - 1) * mainSign;
            }
            break;

          case "space-around":
            {
              _step = mainSpace / items.length * mainSign;
              _currentMain2 = _step / 2 + mainBase;
            }
            break;
        }

        for (var _i5 = 0; _i5 < items.length; _i5++) {
          var _item5 = items[_i5];

          var _itemStyle5 = getStyle(_item5);

          _itemStyle5[mainStart] = _currentMain2;
          _itemStyle5[mainEnd] = _itemStyle5[mainStart] + mainSign * _itemStyle5[mainSize];
          _currentMain2 = _itemStyle5[mainEnd] + _step;
        }
      }
    });
  }

  var crossSpace;

  if (!style[crossSize]) {
    crossSpace = 0;
    elementStyle[crossSize] = 0;

    for (var _i6 = 0; _i6 < flexLines.length; _i6++) {
      elementStyle[crossSize] = elementStyle[crossSize] + flexLines[_i6].crossSpace;
    }
  } else {
    crossSpace = style[crossSize];

    for (var _i7 = 0; _i7 < flexLines.length; _i7++) {
      crossSpace -= flexLines[_i7].crossSpace;
    }
  }

  crossBase = 0;

  if (style.flexWrap === "wrap-reverse") {
    crossBase = style[crossSize];
  }

  var lineSize = style[crossSize] / flexLines.length;
  var step = 0;

  switch (style.alignContent) {
    case "flex-start":
      {
        crossBase += 0;
      }
      break;

    case "flex-end":
      {
        crossBase += crossSign * crossSpace;
      }
      break;

    case "center":
      {
        crossBase += crossSign * crossSpace / 2;
      }
      break;

    case "space-between":
      {
        crossBase += 0;
        step = crossSpace / (flexLines.length - 1);
      }
      break;

    case "space-around":
      {
        step = crossSpace / flexLines.length;
        crossBase += crossSign * step / 2;
      }
      break;

    case "stretch":
      {
        step = 0;
        crossBase += 0;
      }
      break;
  }

  flexLines.forEach(function (items) {
    var lineCrossSize = style.alignContent === "stretch" ? items.crossSpace + crossSpace / flexLines.length : items.crossSpace;

    for (var _i8 = 0; _i8 < items.length; _i8++) {
      var _item6 = items[_i8];

      var _itemStyle6 = getStyle(_item6);

      var align = _itemStyle6.alignSelf || style.alignItems;
      if (_itemStyle6[crossSize] === null) _itemStyle6[crossSize] = align === 'stretch' ? lineCrossSize : 0;

      switch (align) {
        case "flex-start":
          {
            _itemStyle6[crossStart] = crossBase;
            _itemStyle6[crossEnd] = _itemStyle6[crossStart] + crossSign * _itemStyle6[crossSize];
          }
          break;

        case "flex-end":
          {
            _itemStyle6[crossEnd] = crossBase + crossSign * lineCrossSize;
            _itemStyle6[crossStart] = _itemStyle6[crossStart] - crossSign * _itemStyle6[crossSize];
            ;
          }
          break;

        case "center":
          {
            _itemStyle6[crossStart] = crossBase + crossSign * (lineCrossSize - _itemStyle6[crossSize]) / 2;
            _itemStyle6[crossEnd] = _itemStyle6[crossStart] + crossSign * _itemStyle6[crossSize];
          }
          break;

        case "stretch":
          {
            _itemStyle6[crossStart] = crossBase;
            _itemStyle6[crossEnd] = crossBase + crossSign * (_itemStyle6[crossSize] !== null && _itemStyle6[crossSize] !== void 0 ? _itemStyle6[crossSize] : lineCrossSize);
            _itemStyle6[crossSize] = crossSign * (_itemStyle6[crossEnd] - _itemStyle6[crossStart]);
          }
          break;
      }
    }

    crossBase += crossSign * (lineCrossSize + step);
  });
}

module.exports = layout;