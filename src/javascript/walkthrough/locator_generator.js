(function ($, Walkhub, window) {
  "use strict";

  var ELEMENT_NODE_TYPE = 1;

  Walkhub.LocatorGenerator = function () {
    this.locatorGenerators = [];
  };

  Walkhub.LocatorGenerator.prototype.addGenerator = function (generator) {
    this.locatorGenerators.push(generator);
    return this;
  };

  Walkhub.LocatorGenerator.prototype.generate = function (element) {
    for (var i in this.locatorGenerators) {
      if (this.locatorGenerators.hasOwnProperty(i)) {
        var locator = this.locatorGenerators[i](element);
        if (!locator) {
          continue;
        }

        if (Walkhub.LocatorGenerator.isLocatorUnique(locator)) {
          return locator;
        }
      }
    }

    return null;
  };

  Walkhub.LocatorGenerator.isLocatorUnique = function (locator) {
    var translated = Walkhub.Translator.instance().translate(locator);
    return translated && translated.length === 1;
  };

  Walkhub.LocatorGenerator.isLocatorEquals = function (locator, element) {
    var jqElement = $(element);
    var translated = Walkhub.Translator.instance().translate(locator);
    return jqElement.is(translated) && Walkhub.LocatorGenerator.isLocatorUnique(locator);
  };

  Walkhub.LocatorGenerator.instance = function () {
    if (this.instanceObject) {
      return this.instanceObject;
    }

    this.instanceObject = new Walkhub.LocatorGenerator();

    this.instanceObject
      .addGenerator(Walkhub.LocatorGenerator.linkGenerator)
      .addGenerator(Walkhub.LocatorGenerator.idGenerator)
      .addGenerator(Walkhub.LocatorGenerator.nameGenerator)
      .addGenerator(Walkhub.LocatorGenerator.prefixWrapper("css", Walkhub.LocatorGenerator.cssGenerator))
      .addGenerator(Walkhub.LocatorGenerator.prefixWrapper("xpath", Walkhub.LocatorGenerator.htmlXpathGenerator))
      .addGenerator(Walkhub.LocatorGenerator.prefixWrapper("xpath", Walkhub.LocatorGenerator.fullXpathGenerator));

    return this.instanceObject;
  };

  Walkhub.LocatorGenerator.linkGenerator = function (element) {
    var proptagname = element.prop("tagName");
    if (!proptagname) {
      return false;
    }

    if (proptagname.toLowerCase() !== "a") {
      return false;
    }

    if (element.html() !== element.text()) { // No html tags
      return false;
    }

    return "link=" + element.text();
  };

  Walkhub.LocatorGenerator.idGenerator = function (element) {
    var id = element.attr("id");
    if (!id) {
      return false;
    }

    if (Walkhub.LocatorGenerator.hashiness(id)) {
      return false;
    }

    return "id=" + id;
  };

  Walkhub.LocatorGenerator.nameGenerator = function (element) {
    var name = element.attr("name");
    if (!name) {
      return false;
    }

    if (Walkhub.LocatorGenerator.hashiness(name)) {
      return false;
    }

    return "name=" + name;
  };

  Walkhub.LocatorGenerator.prefixWrapper = function (prefix, callback) {
    return function (element) {
      var result = callback(element);

      if (result) {
        return prefix + "=" + result;
      }

      return result;
    };
  };

  // https://github.com/sebuilder/se-builder/blob/v2.2.2/seleniumbuilder/chrome/content/html/js/builder/locator.js

  Walkhub.LocatorGenerator.cssGenerator = function (element) {
    var node = element.get(0);
    var current = node;
    var subPath = Walkhub.LocatorGenerator.getCSSSubpath(node);
    while (!Walkhub.LocatorGenerator.isLocatorEquals("css=" + subPath, node) && current.nodeName.toLowerCase() !== "html") {
      subPath = Walkhub.LocatorGenerator.getCSSSubpath(current.parentNode) + " > " + subPath;
      current = current.parentNode;
    }

    if (Walkhub.LocatorGenerator.isLocatorEquals("css=" + subPath, node)) {
      return subPath;
    }

    return false;
  };


  Walkhub.LocatorGenerator.getCSSSubpath = function (node) {
    var cssAttributes = ["id", "name", "class", "type", "alt", "title", "value"];
    for (var i in cssAttributes) {
      if (cssAttributes.hasOwnProperty(i)) {
        var attr = cssAttributes[i];
        var value = node.getAttribute(attr);
        if (value && value.indexOf("walkthrough") === -1) {
          if (attr === "id" && !Walkhub.LocatorGenerator.hashiness(value)) {
            return "#" + value;
          }
          if (attr === "class") {
            var classes = value.trim().split(/\s+/);
            var classstring = "";
            for (var c in classes) {
              if (classes.hasOwnProperty(c) && classes[c] && !Walkhub.LocatorGenerator.hashiness(classes[c])) {
                classstring += "." + classes[c];
              }
            }

            if (classstring) {
              return node.nodeName.toLowerCase() + classstring;
            }
          }

          return node.nodeName.toLowerCase() + "[" + attr + "=\"" + value + "\"]";
        }
      }
    }

    var nodeNumber = Walkhub.LocatorGenerator.getNodeNumber(node);
    if (nodeNumber) {
      return node.nodeName.toLowerCase() + ":nth-of-type(" + nodeNumber + ")";
    }

    return node.nodeName.toLowerCase();
  };

  Walkhub.LocatorGenerator.getNodeNumber = function (current) {
    var childNodes = current.parentNode.childNodes;
    var total = 0;
    var index = -1;

    for (var i = 0; i < total; i++) {
      var child = childNodes[i];
      if (child.nodeName === current.nodeName) {
        if (child === current) {
          index = total;
        }
        total++;
      }
    }

    return index;
  };

  Walkhub.LocatorGenerator.htmlXpathGenerator = function (element) {
    var node = element.get(0);
    var nodeName = node.nodeName.toLowerCase();

    if (nodeName === "html") {
      return "//html";
    }

    var parent = Walkhub.LocatorGenerator.getXpath(node.parentNode);

    if (parent.indexOf("\"]") > -1) {
      var text = node.textContent.replace(/[']/gm, "&quot;");
      if (text && text.length < 32) {
        var attempt = parent.substr(0, parent.indexOf("\"]") + 2) + "//" + nodeName;

        if (Walkhub.LocatorGenerator.hasNonstandardWhitespace(attempt)) {
          attempt += "[normalize-space(.)=\"" +
            Walkhub.LocatorGenerator.normalizeWhitespace(text) + "\"]";
        } else {
          attempt += "[.=\"" + text + "\"]";
        }

        if (Walkhub.LocatorGenerator.isLocatorEquals("xpath=" + attempt, node)) {
          return attempt;
        }
      }
    }

    return parent + "/" + Walkhub.LocatorGenerator.getChildSelector(node);
  };

  Walkhub.LocatorGenerator.hasNonstandardWhitespace = function (text) {
    return !(/^[ \S]*$/.test(text));
  };

  Walkhub.LocatorGenerator.normalizeWhitespace = function (text) {
    return text.replace(/\s+/g, " ").trim();
  };

  Walkhub.LocatorGenerator.fullXpathGenerator = function (element) {
    var node = element.get(0);
    return Walkhub.LocatorGenerator.getFullXpath(node);
  };

  Walkhub.LocatorGenerator.getXpath = function (node) {
    var nodeName = node.nodeName.toLowerCase();

    if (node.id && document.getElementById(node.id) === node) {
      return "//" + nodeName + "[@id=\"" + node.id + "\"]";
    }

    var className = node.className;
    if (className && className.indexOf(" ") === -1 && document.getElementsByClassName(className).length === 1 && !Walkhub.LocatorGenerator.hashiness(className)) {
      return "//" + nodeName + "[@class=\"" + className + "]\"";
    }

    if (nodeName === "label" && node.hasAttribute("for")) {
      return "//label[@for=\"" + node.getAttribute("for") + "\"]";
    }

    if (Walkhub.LocatorGenerator.isTopReached(node)) {
      return "//" + Walkhub.LocatorGenerator.getChildSelector(node);
    }

    return Walkhub.LocatorGenerator.getXpath(node.parentNode) + "/" + Walkhub.LocatorGenerator.getChildSelector(node);
  };

  Walkhub.LocatorGenerator.getFullXpath = function (node) {
    if (Walkhub.LocatorGenerator.isTopReached(node)) {
      return "//" + Walkhub.LocatorGenerator.getChildSelector(node);
    } else {
      return Walkhub.LocatorGenerator.getFullXpath(node.parentNode) + "/" + Walkhub.LocatorGenerator.getChildSelector(node);
    }
  };

  Walkhub.LocatorGenerator.isTopReached = function (node) {
    return node.nodeName === "body" || node.nodeName === "html" || !node.parentNode || node.parentNode.nodeName.toLowerCase() === "body";
  };

  Walkhub.LocatorGenerator.getChildSelector = function (node) {
    var count = 1;
    var sibling = node.previousSibling;
    while (sibling) {
      if (sibling.nodeType === ELEMENT_NODE_TYPE && sibling.nodeName === node.nodeName) {
        count++;
      }
      sibling = sibling.previousSibling;
    }

    if (count === 1) {
      var onlyNode = true;
      sibling = node.nextSibling;
      while (sibling) {
        if (sibling.nodeType === ELEMENT_NODE_TYPE && sibling.nodeName === node.nodeName) {
          onlyNode = false;
          break;
        }
        sibling = sibling.nextSibling;
      }
      if (onlyNode) {
        return node.nodeName.toLowerCase();
      }
    }

    return node.nodeName.toLowerCase() + "[" + count + "]";
  };

  Walkhub.LocatorGenerator.hashiness = function (str) {
    var hashlengths = [32, 40, 64, 128, 256, 512];

    if (str.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi)) {
      return true;
    }

    for (var i in hashlengths) {
      if (hashlengths.hasOwnProperty(i)) {
        if (str.match(new RegExp("[0-9a-f]{" + hashlengths[i] + "}", "gi"))) {
          return true;
        }
      }
    }

    for (var id in Walkhub.LocatorGenerator.customIDs) {
      if (Walkhub.LocatorGenerator.customIDs.hasOwnProperty(id)) {
        if (str.match(Walkhub.LocatorGenerator.customIDs[id])) {
          return true;
        }
      }
    }

    return false;
  };

  Walkhub.LocatorGenerator.customIDs = {
    DrupalNodeID: /^node-[\d]+$/gi
  };

})(jqWalkhub, Walkhub, window);
