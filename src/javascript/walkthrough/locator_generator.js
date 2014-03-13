(function ($, Walkhub, window) {
  "use strict";

  Walkhub.LocatorGenerator = function () {
    this.locatorGenerators = [];
  };

  Walkhub.LocatorGenerator.prototype.addGenerator = function (generator) {
    this.locatorGenerators.push(generator);
    return this;
  };

  Walkhub.LocatorGenerator.prototype.generate = function (element) {
    for (var i in this.locatorGenerators) {
      if (!this.locatorGenerators.hasOwnProperty(i)) {
        continue;
      }

      var locator = this.locatorGenerators[i](element);
      if (!locator) {
        continue;
      }

      if (Walkhub.LocatorGenerator.isLocatorUnique(locator)) {
        return locator;
      }
    }

    return null;
  };

  Walkhub.LocatorGenerator.isLocatorUnique = function (locator) {
    var translated = Walkhub.Translator.instance().translate(locator);
    return translated && translated.length === 1;
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
    ;

    return this.instanceObject;
  };

  Walkhub.LocatorGenerator.linkGenerator = function (element) {
    var proptagname = element.prop('tagName');
    if (!proptagname) {
      return false;
    }

    if (proptagname.toLowerCase() !== 'a') {
      return false;
    }

    if (element.html() !== element.text()) { // No html tags
      return false;
    }

    return 'link=' + element.text();
  };

  Walkhub.LocatorGenerator.idGenerator = function (element) {
    var id = element.attr('id');
    if (!id) {
      return false;
    }

    if (Walkhub.LocatorGenerator.hashiness(id)) {
      return false;
    }

    return 'id=' + id;
  };

  Walkhub.LocatorGenerator.nameGenerator = function (element) {
    var name = element.attr('name');
    if (!name) {
      return false;
    }

    if (Walkhub.LocatorGenerator.hashiness(name)) {
      return false;
    }

    return 'name=' + name;
  };

  Walkhub.LocatorGenerator.hashiness = function (str) {
    var hashlengths = [32, 40, 64, 128, 256, 512];

    for (var i in hashlengths) {
      if (!hashlengths.hasOwnProperty(i)) {
        continue;
      }

      if (str.match(new RegExp('[0-9a-f]{' + hashlengths[i] + '}', 'gi'))) {
        return true;
      }
    }

    return false;
  };

})(jqWalkhub, Walkhub, window);
