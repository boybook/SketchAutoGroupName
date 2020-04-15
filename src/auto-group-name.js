import sketch from 'sketch'

export default function() {

  const doc = sketch.getSelectedDocument()
  const selectedLayers = doc.selectedLayers

  let suc = 0;
  selectedLayers.forEach(function (g) {
    if (g.type === 'Group') {
      renameGroup(g)
      suc++;
    }
  })

  if (suc > 0) {
    sketch.UI.message("成功对 " + suc + " 个组进行重命名")
  } else {
    sketch.UI.message("未选中任何编组")
  }

}

export function onGroup(context) {

  const doc = sketch.getSelectedDocument()
  const selectedLayers = doc.selectedLayers

  let group = null;

  selectedLayers.forEach(function (g) {
    group = g
  })

  renameGroup(group)

}

export function onTextChanged(context) {
  let suc = 0;

  getParentGroups(context.actionContext.layer).forEach(function (group) {
    if (group.name.endsWith(" ")) {
      renameGroup(group)
      suc++
    }
  })

  sketch.UI.message("成功对 " + suc + " 个组进行重命名")

  function getParentGroups(layer) {
    let groups = [];
    while ((layer = layer.parent) != null) {
      if (layer.type === 'Group') {
        groups.push(layer);
      }
    }
    return groups;
  }
}

function renameGroup(group) {

  const Rectangle = require('sketch/dom').Rectangle;

  let texts = findTextsFromGroup(group)

  let sameSize = isAllSameFontSize(texts);
  let sameY = isAllSameY(texts);
  //sketch.UI.message("sameSize=" + sameSize + " sameY=" + sameY)
  //return;

  if (sameSize && sameY) {
    let joins = [];
    texts.forEach(function (layer) {
      joins.push(layer.name)
    })
    //sketch.UI.message(joins.join("、"))
    group.name = joins.join("、")
  } else {
    let best = null;

    if (!sameSize) {
      //看哪个字号大
      texts.forEach(function (layer) {
        if (best === null) {
          best = layer
        } else if (layer.style.fontSize > best.style.fontSize) {
          best = layer
        }
      })
    } else if (!sameY) {
      //看那个在上
      texts.forEach(function (layer) {
        const rootRect = getRootPos(layer)
        if (best === null) {
          best = layer;
        } else {
          const bestRect = getRootPos(best)
          if (rootRect.y < bestRect.y) {
            best = layer;
          }
        }
      })
    }

    if (best != null) {
      //sketch.UI.message(best.text)
      group.name = best.name
    } else {
      sketch.UI.message("未匹配到")
    }
  }

  /*
  let debug = "";
  texts.forEach(function (layer) {
    debug = debug + " " + layer.name + "=" + getRootPos(layer) + "(" + layer.style.fontSize + ")"
  })
  sketch.UI.message(debug)*/

  function findTextsFromGroup(group) {
    let texts = [];
    group.layers.forEach(function (layer) {
      if (layer.type === 'Text') {
        texts.push(layer)
      } else if (layer.type === 'Group') {
        texts = texts.concat(findTextsFromGroup(layer))
      }
    })
    return texts;
  }

  function getRootPos(layer) {
    let rect = new Rectangle(layer.frame)
    while ((layer = layer.parent) != null) {
      if (layer.type === 'Artboard') {
        return rect;
      } else {
        rect = rect.offset(layer.frame.x, layer.frame.y)
      }
    }
    return rect
  }

  function isAllSameFontSize(layers) {
    let last = null;
    for (let i = 0; i < layers.length; i++) {
      let layer = layers[i]
      if (last != null && layer.style.fontSize !== last) return false;
      last = layer.style.fontSize
    }
    return true;
  }

  function isAllSameY(layers) {
    let last = null;
    for (let i = 0; i < layers.length; i++) {
      let layer = layers[i]
      const pos = getRootPos(layer);
      if (last != null && pos.y !== last) return false;
      last = pos.y;
    }
    return true;
  }

}