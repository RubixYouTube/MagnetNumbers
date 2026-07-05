// MagnetNum.JS, is a number library that goes up to f_w^2(10), designed for Incrementals, Computing, Calculating or whatever you think of.
// Usages
// So basically you can use this for bigger numbers, i made this because ExpantaNum.js is starting to feel overused and not big so this Number library is actually bigger this time.

var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER;
var NUMBER_MAX = Number.MAX_VALUE;
var NUMBER_MIN = Number.MIN_VALUE;
var LOG10_MAX = Math.log10(NUMBER_MAX);
var LN10 = Math.LN10;
var LOG2E = Math.LOG2E;
var PI = Math.PI;
var E = Math.E;
var MAX_POW_LAYERS_DEFAULT = 5;
var MAX_TETR_LAYERS_DEFAULT = 5;
var MAX_ARROW_ENTRIES_DEFAULT = 5;
var MAX_TO_SCI_N_DEFAULT = 1e15;
var MAX_U64 = Math.pow(2, 64) - 1;

var MagnetNum = (function () {

  function MN(input) {
    if (!(this instanceof MN)) return new MN(input);
    this.sign = 1;
    this.layer = 0;
    this.array = [0];
    if (input === undefined || input === null) {
      this.array = [0];
    } else if (typeof input === "number") {
      this.fromNumber(input);
    } else if (typeof input === "string") {
      this.fromString(input);
    } else if (input instanceof MN) {
      this.sign = input.sign;
      this.layer = input.layer;
      this.array = input.array.slice();
    } else if (Array.isArray(input)) {
      this.fromArray(input);
    } else if (typeof input === "object") {
      this.sign = input.sign || 1;
      this.layer = input.layer || 0;
      this.array = (input.array || [0]).slice();
    }
  }

  MN.config = {
    maxToSciN: MAX_TO_SCI_N_DEFAULT,
    maxPowLayers: MAX_POW_LAYERS_DEFAULT,
    maxTetrLayers: MAX_TETR_LAYERS_DEFAULT,
    maxArrowEntries: MAX_ARROW_ENTRIES_DEFAULT,
    maxBracketsShown: 3,
    maxArrowEntriesShown: 3,
    precision: 3
  };

  MN.ZERO = null;
  MN.ONE = null;
  MN.TWO = null;
  MN.THREE = null;
  MN.TEN = null;
  MN.NEG_ONE = null;
  MN.INFINITY = null;
  MN.NEG_INFINITY = null;
  MN.NAN = null;

  MN.init = function () {
    MN.ZERO = new MN(0);
    MN.ONE = new MN(1);
    MN.TWO = new MN(2);
    MN.THREE = new MN(3);
    MN.TEN = new MN(10);
    MN.NEG_ONE = new MN(-1);
    MN.INFINITY = new MN(Infinity);
    MN.NEG_INFINITY = new MN(-Infinity);
    MN.NAN = MN.fromComponents(0, 9, [NaN]);
  };

  MN.fromComponents = function (sign, layer, array) {
    var r = new MN(0);
    r.sign = sign;
    r.layer = layer;
    r.array = array.slice();
    return r.normalize();
  };

  MN.fromSignMag = function (sign, mag) {
    if (mag instanceof MN) {
      var r = mag.clone();
      r.sign = sign;
      return r.normalize();
    }
    var r = new MN(mag);
    r.sign = sign;
    return r.normalize();
  };

  MN.tetrate10 = function (height, top) {
    if (height < 0) return new MN(0);
    if (height === 0) return new MN(top !== undefined ? top : 1);
    if (height === 1) return new MN(top !== undefined ? Math.pow(10, top) : 10);
    var tip = top !== undefined ? top : 1;
    if (height === 2) {
      var v2 = Math.pow(10, Math.pow(10, tip));
      if (isFinite(v2)) return new MN(v2);
    }
    if (height === 3) {
      var v3 = Math.pow(10, tip);
      if (isFinite(v3)) {
        var v3b = Math.pow(10, v3);
        if (isFinite(v3b)) {
          var v3c = Math.pow(10, v3b);
          if (isFinite(v3c)) return new MN(v3c);
        }
      }
    }
    if (height < MN.config.maxPowLayers) {
      var r = new MN(0);
      r.sign = 1;
      r.layer = 2;
      r.array = [tip, height];
      return r.normalize();
    }
    var r2 = new MN(0);
    r2.sign = 1;
    r2.layer = 3;
    r2.array = [tip, height];
    return r2.normalize();
  };

  MN.arrow10 = function (arrows, value, top) {
    if (!isFinite(arrows)) {
      var r = new MN(0);
      r.sign = 1;
      r.layer = 10;
      r.array = [top !== undefined ? top : 1, value, Infinity];
      return r.normalize();
    }
    if (arrows <= 0) return new MN(top !== undefined ? top * Math.pow(10, value) : Math.pow(10, value));
    if (arrows === 1) {
      var h = value;
      return MN.tetrate10(h, top);
    }
    if (arrows <= 5) {
      var r2 = new MN(0);
      r2.sign = 1;
      r2.layer = 2 + arrows;
      r2.array = [top !== undefined ? top : 1, value];
      return r2.normalize();
    }
    var r3 = new MN(0);
    r3.sign = 1;
    r3.layer = 10;
    r3.array = [top !== undefined ? top : 1, value, arrows];
    return r3.normalize();
  };

  MN.bracket = function (bracketCount, innerValue, top) {
    if (!isFinite(bracketCount)) {
      var r = new MN(0);
      r.sign = 1;
      r.layer = 10;
      r.array = [top !== undefined ? top : 1, innerValue !== undefined ? innerValue : 1, Infinity];
      return r.normalize();
    }
    var bc = Math.abs(bracketCount);
    var r = new MN(0);
    r.sign = 1;
    r.layer = 10;
    r.array = [top !== undefined ? top : 1, innerValue, bc];
    return r.normalize();
  };

  MN.tieredBracket = function (tierLevel, bracketCount, innerValue, top) {
    var r = new MN(0);
    r.sign = 1;
    r.layer = 11;
    r.array = [top !== undefined ? top : 1, innerValue, bracketCount, tierLevel];
    return r.normalize();
  };

  MN.omega = function (depth) {
    var r = new MN(0);
    r.sign = 1;
    r.layer = 12;
    r.array = [1, depth || 1];
    return r;
  };

  MN.fgh = function (ordinal, input) {
    if (ordinal === 0) return new MN(input + 1);
    if (ordinal === 1) return new MN(input * 2);
    if (ordinal === 2) return new MN(input * Math.pow(2, input));
    if (ordinal === 3) return MN.tetrate10(input, 1);
    var r = new MN(0);
    r.sign = 1;
    r.layer = 12 + ordinal;
    r.array = [1, input];
    return r;
  };

  MN.fw2_10 = function () {
    var r = new MN(0);
    r.sign = 1;
    r.layer = 100;
    r.array = [1, 10, 2];
    return r;
  };

  MN.prototype.fromNumber = function (n) {
    if (isNaN(n)) {
      this.sign = 0;
      this.layer = 9;
      this.array = [NaN];
      return this;
    }
    if (!isFinite(n)) {
      this.sign = n > 0 ? 1 : -1;
      this.layer = 9;
      this.array = [Infinity];
      return this;
    }
    if (n === 0) {
      this.sign = 1;
      this.layer = 0;
      this.array = [0];
      return this;
    }
    if (n < 0) {
      this.sign = -1;
      n = -n;
    } else {
      this.sign = 1;
    }
    if (n < MN.config.maxToSciN) {
      this.layer = 0;
      this.array = [n];
    } else {
      var e = Math.floor(Math.log10(n));
      var m = n / Math.pow(10, e);
      this.layer = 1;
      this.array = [m, e];
    }
    return this;
  };

  MN.prototype.fromArray = function (arr) {
    if (arr.length === 0) {
      this.sign = 1;
      this.layer = 0;
      this.array = [0];
      return this;
    }
    if (arr.length === 1) {
      return this.fromNumber(arr[0]);
    }
    var sign = 1;
    if (arr[0] < 0) {
      sign = -1;
      arr = arr.slice();
      arr[0] = -arr[0];
    }
    this.sign = sign;
    this.layer = arr.length - 1;
    this.array = arr.slice();
    return this.normalize();
  };

  MN.prototype.fromString = function (s) {
    s = s.trim();
    if (s === "Infinity" || s === "+Infinity") {
      this.sign = 1;
      this.layer = 9;
      this.array = [Infinity];
      return this;
    }
    if (s === "-Infinity") {
      this.sign = -1;
      this.layer = 9;
      this.array = [Infinity];
      return this;
    }
    if (s === "NaN") {
      this.sign = 0;
      this.layer = 9;
      this.array = [NaN];
      return this;
    }
    var neg = false;
    if (s.charAt(0) === "-") {
      neg = true;
      s = s.substring(1);
    }
    if (s.charAt(0) === "+") {
      s = s.substring(1);
    }
    var bracketMatch = s.match(/^10\{(\d+)\}\^(\d+)\s+(.+)$/);
    if (bracketMatch) {
      var bc = parseInt(bracketMatch[1]);
      var tl = parseInt(bracketMatch[2]);
      var inner = parseFloat(bracketMatch[3]);
      this.sign = neg ? -1 : 1;
      this.layer = 11;
      this.array = [inner, 1, bc, tl];
      return this.normalize();
    }
    var bracketMatch2 = s.match(/^10\{(\d+)\}(.+)$/);
    if (bracketMatch2) {
      var bc2 = parseInt(bracketMatch2[1]);
      var inner2 = parseFloat(bracketMatch2[2]);
      this.sign = neg ? -1 : 1;
      this.layer = 10;
      this.array = [inner2, 1, bc2];
      return this.normalize();
    }
    var arrowMatch = s.match(/^10(\^+)(.+)$/);
    if (arrowMatch) {
      var arrows = arrowMatch[1].length;
      var val = parseFloat(arrowMatch[2]);
      if (arrows >= 3) {
        this.sign = neg ? -1 : 1;
        this.layer = 3 + (arrows - 2);
        this.array = [val, 1];
        return this.normalize();
      }
      if (arrows === 2) {
        this.sign = neg ? -1 : 1;
        var h = Math.floor(val);
        var frac = val - h;
        this.layer = 3;
        this.array = [Math.pow(10, frac), h];
        return this.normalize();
      }
    }
    var towerMatch = s.match(/^(10\^)+(.+)$/);
    if (towerMatch) {
      var layers = (s.match(/10\^/g) || []).length;
      var topVal = parseFloat(s.replace(/^(10\^)+/, "").replace(/\*10\^.+$/, ""));
      if (layers >= 2) {
        this.sign = neg ? -1 : 1;
        this.layer = 2;
        this.array = [topVal, layers];
        return this.normalize();
      }
    }
    var sciMatch = s.match(/^(\d+\.?\d*)\s*\*?\s*10\^(\d+\.?\d*)$/);
    if (sciMatch) {
      var m = parseFloat(sciMatch[1]);
      var e = parseFloat(sciMatch[2]);
      this.sign = neg ? -1 : 1;
      this.layer = 1;
      this.array = [m, e];
      return this.normalize();
    }
    var num = parseFloat(s);
    if (neg) num = -num;
    return this.fromNumber(num);
  };

  MN.prototype.normalize = function () {
    if (this.layer === 9) return this;
    if (this.layer >= 100) return this;
    if (this.layer === 0) {
      var v = this.array[0];
      if (isNaN(v)) {
        this.sign = 0;
        this.layer = 9;
        this.array = [NaN];
        return this;
      }
      if (!isFinite(v)) {
        this.sign = v > 0 ? this.sign : -this.sign;
        this.layer = 9;
        this.array = [Infinity];
        return this;
      }
      if (v < 0) {
        this.sign = -this.sign;
        v = -v;
        this.array[0] = v;
      }
      if (v === 0) {
        this.sign = 1;
        this.array = [0];
        return this;
      }
      if (v >= MN.config.maxToSciN) {
        var e = Math.floor(Math.log10(v));
        var m = v / Math.pow(10, e);
        this.layer = 1;
        this.array = [m, e];
        return this.normalize();
      }
      return this;
    }
    if (this.layer === 1) {
      var m1 = this.array[0];
      var e1 = this.array[1];
      if (isNaN(m1) || isNaN(e1)) {
        this.sign = 0;
        this.layer = 9;
        this.array = [NaN];
        return this;
      }
      if (!isFinite(e1)) {
        this.layer = 9;
        this.array = [Infinity];
        return this;
      }
      if (m1 === 0 || e1 === -Infinity) {
        this.layer = 0;
        this.array = [0];
        this.sign = 1;
        return this;
      }
      if (m1 < 0) {
        this.sign = -this.sign;
        m1 = -m1;
      }
      while (m1 >= 10 && e1 < MAX_U64) {
        m1 /= 10;
        e1 += 1;
      }
      while (m1 < 1 && m1 > 0) {
        m1 *= 10;
        e1 -= 1;
      }
      if (e1 < 0) {
        this.layer = 0;
        this.array = [m1 * Math.pow(10, e1)];
        return this.normalize();
      }
      if (e1 < Math.log10(MN.config.maxToSciN)) {
        this.layer = 0;
        this.array = [m1 * Math.pow(10, e1)];
        return this.normalize();
      }
      this.array = [m1, e1];
      if (e1 >= MAX_U64) {
        this.layer = 2;
        var e1Log = Math.log10(e1);
        var e1Mant = e1 / Math.pow(10, Math.floor(e1Log));
        this.array = [m1, e1Mant, Math.floor(e1Log)];
        return this.normalize();
      }
      return this;
    }
    if (this.layer === 2) {
      var a = this.array;
      while (a.length > 2 && a[a.length - 1] === 0) a.pop();
      if (a.length === 2) {
        if (a[1] < MN.config.maxPowLayers && a[1] < 15) {
          var result = a[0];
          for (var i = 0; i < Math.floor(a[1]); i++) {
            result = Math.pow(10, result);
            if (!isFinite(result)) break;
          }
          if (isFinite(result) && result < MN.config.maxToSciN) {
            this.layer = 0;
            this.array = [result];
            return this.normalize();
          }
          if (isFinite(result)) {
            var ee = Math.floor(Math.log10(result));
            this.layer = 1;
            this.array = [result / Math.pow(10, ee), ee];
            return this.normalize();
          }
        }
        var totalLayers = Math.floor(a[1]) + 1;
        if (totalLayers >= MN.config.maxPowLayers) {
          this.layer = 3;
          this.array = [a[0], Math.floor(a[1])];
          return this.normalize();
        }
      }
      if (a.length > 2) {
        var powLayers = a.length - 1;
        if (powLayers >= MN.config.maxPowLayers) {
          this.layer = 3;
          this.array = [a[0], powLayers];
          return this.normalize();
        }
      }
      return this;
    }
    if (this.layer === 3) {
      var top3 = this.array[0];
      var height3 = this.array[1];
      if (height3 < 2) {
        var r3 = top3;
        if (height3 === 1) r3 = Math.pow(10, r3);
        if (isFinite(r3)) {
          return new MN(r3 * this.sign);
        }
      }
      return this;
    }
    if (this.layer >= 4 && this.layer < 10) {
      var topH = this.array[0];
      var valH = this.array[1];
      if (valH < 2) {
        var arrowsH = this.layer - 2;
        if (arrowsH <= 1) {
          this.layer = 3;
          this.array = [topH, Math.max(1, Math.floor(valH))];
          return this.normalize();
        }
        this.layer -= 1;
        this.array = [topH, Math.max(2, Math.floor(valH))];
        return this.normalize();
      }
      return this;
    }
    if (this.layer === 10) {
      return this;
    }
    if (this.layer === 11) {
      var top11 = this.array[0];
      var inner11 = this.array[1];
      var bc11 = this.array[2];
      var tl11 = this.array[3];
      if (!isFinite(bc11)) {
        this.layer = 12;
        this.array = [top11, 1, 1, tl11];
        return this.normalize();
      }
      if (!isFinite(tl11) || tl11 > 10) {
        this.layer = 12;
        this.array = [top11, inner11, bc11, tl11];
        return this.normalize();
      }
      return this;
    }
    return this;
  };

  MN.prototype.clone = function () {
    var r = new MN(0);
    r.sign = this.sign;
    r.layer = this.layer;
    r.array = this.array.slice();
    return r;
  };

  MN.prototype.toNumber = function () {
    if (this.layer === 9) {
      if (this.sign === 0) return NaN;
      return this.sign * Infinity;
    }
    if (this.layer === 0) return this.sign * this.array[0];
    if (this.layer === 1) {
      var v = this.array[0] * Math.pow(10, this.array[1]);
      return this.sign * v;
    }
    if (this.sign < 0) return -Infinity;
    return Infinity;
  };

  MN.prototype.toExponential = function (digits) {
    digits = digits || MN.config.precision;
    if (this.layer === 9) {
      if (this.sign === 0) return "NaN";
      return (this.sign < 0 ? "-" : "") + "Infinity";
    }
    if (this.layer === 0) {
      return (this.sign < 0 ? "-" : "") + this.array[0].toExponential(digits);
    }
    if (this.layer === 1) {
      return (this.sign < 0 ? "-" : "") + this.array[0].toFixed(digits) + " * 10^" + this.array[1].toFixed(0);
    }
    return this.toString();
  };

  MN.prototype.toString = function () {
    var cfg = MN.config;
    var prec = cfg.precision;
    var prefix = this.sign < 0 ? "-" : "";

    if (this.layer === 9) {
      if (this.sign === 0) return "NaN";
      return prefix + "Infinity";
    }

    if (this.layer === 0) {
      var v0 = this.array[0];
      if (v0 < cfg.maxToSciN) {
        if (Number.isInteger(v0) && v0 < 1e16) return prefix + v0.toString();
        return prefix + v0.toFixed(prec);
      }
      var e0 = Math.floor(Math.log10(v0));
      var m0 = v0 / Math.pow(10, e0);
      return prefix + m0.toFixed(prec) + " * 10^" + e0;
    }

    if (this.layer === 1) {
      var m1 = this.array[0];
      var e1 = this.array[1];
      if (e1 < MAX_U64) {
        return prefix + m1.toFixed(prec) + " * 10^" + e1.toFixed(0);
      }
      var eLog = Math.log10(e1);
      var eFloor = Math.floor(eLog);
      var eMant = e1 / Math.pow(10, eFloor);
      return prefix + "10^" + eMant.toFixed(prec) + " * 10^" + eFloor;
    }

    if (this.layer === 2) {
      var a2 = this.array;
      if (a2.length === 2) {
        var numPow = Math.floor(a2[1]);
        var s2 = prefix;
        for (var i2 = 0; i2 < numPow; i2++) s2 += "10^";
        s2 += a2[0].toFixed(prec);
        return s2;
      }
      var numPowLayers = a2.length - 1;
      var s2b = prefix;
      for (var j2 = 0; j2 < numPowLayers; j2++) s2b += "10^";
      s2b += a2[0].toFixed(prec);
      return s2b;
    }

    if (this.layer === 3) {
      var top3 = this.array[0];
      var height3 = this.array[1];
      var shown3 = Math.min(height3, cfg.maxArrowEntriesShown);
      var s3 = prefix;
      for (var i3 = 0; i3 < shown3; i3++) s3 += "10^^";
      s3 += top3.toFixed(prec);
      return s3;
    }

    if (this.layer >= 4 && this.layer < 10) {
      var arrows = this.layer - 1;
      var topA = this.array[0];
      var valA = this.array[1];
      var arrowStr = "";
      for (var iA = 0; iA < arrows; iA++) arrowStr += "^";
      var shown = Math.min(valA, cfg.maxArrowEntriesShown);
      var sA = prefix;
      for (var jA = 0; jA < shown; jA++) sA += "10" + arrowStr;
      sA += topA.toFixed(prec);
      return sA;
    }

    if (this.layer === 10) {
      var top10 = this.array[0];
      var inner10 = this.array[1];
      var bc10 = this.array[2];
      var bcStr = new MN(bc10).toString();
      return prefix + "10{" + bcStr + "}" + top10.toFixed(prec);
    }

    if (this.layer === 11) {
      var top11 = this.array[0];
      var inner11 = this.array[1];
      var bc11 = this.array[2];
      var tl11 = this.array[3];
      if (!isFinite(tl11) || tl11 > 10) {
        this.layer = 12;
        this.array = [top11, inner11, bc11, tl11];
        return this.toString();
      }
      var bcStr11 = new MN(bc11).toString();
      return prefix + "10{" + bcStr11 + "}^" + tl11 + " " + top11.toFixed(prec);
    }

    if (this.layer === 12) {
      var top12 = this.array[0];
      var depth12 = this.array[1];
      if (!isFinite(depth12)) {
        return prefix + "f_w^2(" + top12.toFixed(prec) + ")";
      }
      if (depth12 <= 10) {
        return prefix + "f_" + depth12 + "(" + top12.toFixed(prec) + ")";
      }
      return prefix + "f_w(" + top12.toFixed(prec) + ")";
    }

    if (this.layer > 12 && this.layer < 100) {
      var ord = this.layer - 10;
      var topOrd = this.array[0];
      var valOrd = this.array[1];
      if (ord <= 20) {
        return prefix + "f_w+" + ord + "(" + topOrd.toFixed(prec) + ")";
      }
      return prefix + "f_w^2(" + valOrd.toFixed(prec) + ")";
    }

    if (this.layer >= 100) {
      return prefix + "f_w^2(10)";
    }

    return prefix + "Unknown(" + this.layer + ")";
  };

  MN.prototype.valueOf = function () {
    return this.toNumber();
  };

  MN.prototype.toJSON = function () {
    return { sign: this.sign, layer: this.layer, array: this.array, str: this.toString() };
  };

  MN.prototype.isNaN = function () {
    return this.layer === 9 && this.sign === 0;
  };

  MN.prototype.isFinite = function () {
    return this.layer < 9;
  };

  MN.prototype.isZero = function () {
    return this.layer === 0 && this.array[0] === 0;
  };

  MN.prototype.isOne = function () {
    return this.layer === 0 && this.array[0] === 1 && this.sign === 1;
  };

  MN.prototype.isNeg = function () {
    return this.sign < 0 && !this.isZero();
  };

  MN.prototype.isPos = function () {
    return this.sign > 0 && !this.isZero();
  };

  MN.prototype.isInt = function () {
    if (this.layer > 1) return true;
    if (this.layer === 1) return false;
    return Number.isInteger(this.array[0]);
  };

  MN.prototype.isEven = function () {
    if (this.layer > 0) return true;
    return this.array[0] % 2 === 0;
  };

  MN.prototype.isOdd = function () {
    if (this.layer > 0) return false;
    return this.array[0] % 2 === 1;
  };

  MN.prototype.sgn = function () {
    if (this.isZero()) return new MN(0);
    return new MN(this.sign);
  };

  MN.prototype.signFn = function () {
    return this.sgn();
  };

  MN.prototype.cmp = function (other) {
    other = MN.ensure(other);
    if (this.isNaN() || other.isNaN()) return NaN;
    var a = this;
    var b = other;
    if (a.sign !== b.sign) {
      if (a.isZero() && b.isZero()) return 0;
      return a.sign > b.sign ? 1 : -1;
    }
    if (a.sign === 0 && b.sign === 0) return 0;
    var result = MN.cmpMag(a, b);
    return a.sign < 0 ? -result : result;
  };

  MN.cmpMag = function (a, b) {
    if (a.layer !== b.layer) return a.layer > b.layer ? 1 : -1;
    if (a.layer === 0) {
      if (a.array[0] > b.array[0]) return 1;
      if (a.array[0] < b.array[0]) return -1;
      return 0;
    }
    if (a.layer === 1) {
      if (a.array[1] > b.array[1]) return 1;
      if (a.array[1] < b.array[1]) return -1;
      if (a.array[0] > b.array[0]) return 1;
      if (a.array[0] < b.array[0]) return -1;
      return 0;
    }
    if (a.layer === 2) {
      if (a.array.length !== b.array.length) return a.array.length > b.array.length ? 1 : -1;
      for (var i = a.array.length - 1; i >= 0; i--) {
        if (a.array[i] > b.array[i]) return 1;
        if (a.array[i] < b.array[i]) return -1;
      }
      return 0;
    }
    if (a.array.length !== b.array.length) return a.array.length > b.array.length ? 1 : -1;
    for (var j = a.array.length - 1; j >= 0; j--) {
      if (a.array[j] > b.array[j]) return 1;
      if (a.array[j] < b.array[j]) return -1;
    }
    return 0;
  };

  MN.prototype.eq = function (other) { return this.cmp(other) === 0; };
  MN.prototype.neq = function (other) { return this.cmp(other) !== 0; };
  MN.prototype.lt = function (other) { return this.cmp(other) < 0; };
  MN.prototype.lte = function (other) { return this.cmp(other) <= 0; };
  MN.prototype.gt = function (other) { return this.cmp(other) > 0; };
  MN.prototype.gte = function (other) { return this.cmp(other) >= 0; };

  MN.prototype.min = function (other) {
    other = MN.ensure(other);
    return this.lte(other) ? this.clone() : other.clone();
  };

  MN.prototype.max = function (other) {
    other = MN.ensure(other);
    return this.gte(other) ? this.clone() : other.clone();
  };

  MN.prototype.clamp = function (lo, hi) {
    lo = MN.ensure(lo);
    hi = MN.ensure(hi);
    return this.max(lo).min(hi);
  };

  MN.prototype.abs = function () {
    var r = this.clone();
    r.sign = 1;
    return r;
  };

  MN.prototype.neg = function () {
    var r = this.clone();
    r.sign = -r.sign;
    return r;
  };

  MN.prototype.recip = function () {
    if (this.isZero()) return new MN(Infinity);
    if (this.layer === 0) return new MN(1 / (this.sign * this.array[0]));
    if (this.layer === 1) {
      var r = this.clone();
      r.array = [1 / r.array[0], -r.array[1]];
      return r.normalize();
    }
    return new MN(0);
  };

  MN.prototype.floor = function () {
    if (this.layer > 1) return this.clone();
    if (this.layer === 1) return this.clone();
    return new MN(Math.floor(this.sign * this.array[0]));
  };

  MN.prototype.ceil = function () {
    if (this.layer > 1) return this.clone();
    if (this.layer === 1) return this.clone();
    return new MN(Math.ceil(this.sign * this.array[0]));
  };

  MN.prototype.round = function () {
    if (this.layer > 1) return this.clone();
    if (this.layer === 1) return this.clone();
    return new MN(Math.round(this.sign * this.array[0]));
  };

  MN.prototype.trunc = function () {
    if (this.layer > 1) return this.clone();
    if (this.layer === 1) return this.clone();
    return new MN(Math.trunc(this.sign * this.array[0]));
  };

  MN.prototype.normalizeFn = function () {
    return this.clone().normalize();
  };

  MN.prototype.add = function (other) {
    other = MN.ensure(other);
    if (this.isNaN() || other.isNaN()) return new MN(NaN);
    if (this.layer === 9 && other.layer === 9) {
      if (this.sign === other.sign) return this.clone();
      return new MN(NaN);
    }
    if (this.layer === 9) return this.clone();
    if (other.layer === 9) return other.clone();
    if (this.isZero()) return other.clone();
    if (other.isZero()) return this.clone();
    if (this.sign === other.sign) {
      var magSum = MN.addMag(this, other);
      magSum.sign = this.sign;
      return magSum;
    }
    var c = MN.cmpMag(this, other);
    if (c === 0) return new MN(0);
    if (c > 0) {
      var diff = MN.subMag(this, other);
      diff.sign = this.sign;
      return diff;
    }
    var diff2 = MN.subMag(other, this);
    diff2.sign = other.sign;
    return diff2;
  };

  MN.addMag = function (a, b) {
    if (a.layer > b.layer + 2) return a.clone();
    if (b.layer > a.layer + 2) return b.clone();
    if (a.layer === 0 && b.layer === 0) {
      return new MN(a.array[0] + b.array[0]);
    }
    if (a.layer === 1 && b.layer <= 1) {
      var aVal = a.array[0] * Math.pow(10, a.array[1]);
      var bVal = b.layer === 0 ? b.array[0] : b.array[0] * Math.pow(10, b.array[1]);
      var sum = aVal + bVal;
      return new MN(sum);
    }
    if (a.layer === 1 && b.layer === 1) {
      var diff = a.array[1] - b.array[1];
      if (diff > 15) return a.clone();
      if (diff < -15) return b.clone();
      var aM = a.array[0];
      var bM = b.array[0] * Math.pow(10, -diff);
      var total = aM + bM;
      var r = new MN(0);
      r.sign = 1;
      r.layer = 1;
      r.array = [total, a.array[1]];
      return r.normalize();
    }
    if (a.layer >= 2) {
      if (MN.cmpMag(a, b) >= 0) return a.clone();
      return b.clone();
    }
    return a.clone();
  };

  MN.subMag = function (a, b) {
    if (a.layer > b.layer + 2) return a.clone();
    if (b.layer > a.layer + 2) return b.clone();
    if (a.layer === 0 && b.layer === 0) {
      return new MN(Math.abs(a.array[0] - b.array[0]));
    }
    if (a.layer === 1 && b.layer <= 1) {
      var aVal = a.array[0] * Math.pow(10, a.array[1]);
      var bVal = b.layer === 0 ? b.array[0] : b.array[0] * Math.pow(10, b.array[1]);
      return new MN(Math.abs(aVal - bVal));
    }
    if (a.layer === 1 && b.layer === 1) {
      var diff = a.array[1] - b.array[1];
      if (diff > 15) return a.clone();
      var aM = a.array[0];
      var bM = b.array[0] * Math.pow(10, -diff);
      var total = aM - bM;
      if (total < 0) total = -total;
      var r = new MN(0);
      r.sign = 1;
      r.layer = 1;
      r.array = [total, a.array[1]];
      return r.normalize();
    }
    return a.clone();
  };

  MN.prototype.sub = function (other) {
    return this.add(MN.ensure(other).neg());
  };

  MN.prototype.mul = function (other) {
    other = MN.ensure(other);
    if (this.isNaN() || other.isNaN()) return new MN(NaN);
    if (this.isZero()) {
      if (other.layer === 9) return new MN(NaN);
      return new MN(0);
    }
    if (other.isZero()) {
      if (this.layer === 9) return new MN(NaN);
      return new MN(0);
    }
    if (this.layer === 9 || other.layer === 9) {
      var s = this.sign * other.sign;
      if (s === 0) return new MN(NaN);
      return new MN(s * Infinity);
    }
    var sign = this.sign * other.sign;
    if (this.layer === 0 && other.layer === 0) {
      var r = new MN(this.array[0] * other.array[0]);
      r.sign = sign;
      return r;
    }
    if (this.layer <= 1 && other.layer <= 1) {
      var aM = this.layer === 0 ? this.array[0] : this.array[0];
      var aE = this.layer === 0 ? 0 : this.array[1];
      var bM = other.layer === 0 ? other.array[0] : other.array[0];
      var bE = other.layer === 0 ? 0 : other.array[1];
      var mProd = aM * bM;
      var eSum = aE + bE;
      var result = new MN(0);
      result.sign = sign;
      result.layer = 1;
      result.array = [mProd, eSum];
      return result.normalize();
    }
    if (this.layer === 1 && other.layer === 1) {
      var m1 = this.array[0] * other.array[0];
      var e1 = this.array[1] + other.array[1];
      var result2 = new MN(0);
      result2.sign = sign;
      result2.layer = 1;
      result2.array = [m1, e1];
      return result2.normalize();
    }
    if (this.layer === 2 || other.layer === 2) {
      var big = this.layer >= other.layer ? this : other;
      return big.clone();
    }
    if (this.layer >= 3) return this.clone();
    return this.clone();
  };

  MN.prototype.div = function (other) {
    other = MN.ensure(other);
    if (this.isNaN() || other.isNaN()) return new MN(NaN);
    if (other.isZero()) {
      if (this.isZero()) return new MN(NaN);
      return new MN(this.sign * Infinity);
    }
    if (this.isZero()) {
      if (other.layer === 9) return new MN(NaN);
      return new MN(0);
    }
    if (this.layer === 9 && other.layer === 9) {
      return new MN(NaN);
    }
    if (other.layer === 9 && other.sign !== 0) {
      return new MN(0);
    }
    var sign = this.sign * other.sign;
    if (this.layer === 0 && other.layer === 0) {
      var r = new MN(this.array[0] / other.array[0]);
      r.sign = sign;
      return r;
    }
    if (this.layer <= 1 && other.layer <= 1) {
      var aM = this.layer === 0 ? this.array[0] : this.array[0];
      var aE = this.layer === 0 ? 0 : this.array[1];
      var bM = other.layer === 0 ? other.array[0] : other.array[0];
      var bE = other.layer === 0 ? 0 : other.array[1];
      var mQ = aM / bM;
      var eQ = aE - bE;
      var result = new MN(0);
      result.sign = sign;
      result.layer = 1;
      result.array = [mQ, eQ];
      return result.normalize();
    }
    if (MN.cmpMag(this, other) > 2) return this.clone();
    if (MN.cmpMag(other, this) > 2) return new MN(0);
    return new MN(1 * sign);
  };

  MN.prototype.mod = function (other) {
    other = MN.ensure(other);
    if (other.isZero()) return new MN(NaN);
    if (this.layer > 1 || other.layer > 1) return new MN(0);
    if (this.layer === 0 && other.layer === 0) {
      return new MN((this.sign * this.array[0]) % (other.sign * other.array[0]));
    }
    return new MN(0);
  };

  MN.prototype.pow = function (other) {
    other = MN.ensure(other);
    if (this.isNaN() || other.isNaN()) return new MN(NaN);
    if (other.isZero()) return new MN(1);
    if (other.isOne()) return this.clone();
    if (this.isZero()) return new MN(0);
    if (this.isOne()) return new MN(1);
    if (this.layer === 0 && other.layer === 0) {
      var base = this.sign * this.array[0];
      var exp = other.sign * other.array[0];
      var result = Math.pow(base, exp);
      if (isFinite(result)) return new MN(result);
    }
    if (this.layer === 0 && other.layer === 1) {
      var logBase = Math.log10(Math.abs(this.array[0]));
      if (logBase > 0) {
        var newE = other.array[1] + Math.log10(logBase);
        var r = new MN(0);
        r.sign = this.sign < 0 && other.array[0] % 2 !== 0 ? -1 : 1;
        r.layer = 1;
        r.array = [Math.pow(10, newE - Math.floor(newE)), Math.floor(newE)];
        return r.normalize();
      }
    }
    if (this.layer === 1 && other.layer === 0) {
      var expN = other.array[0] * other.sign;
      var newM = Math.pow(this.array[0], expN);
      var newE2 = this.array[1] * expN;
      var r2 = new MN(0);
      r2.sign = 1;
      r2.layer = 1;
      r2.array = [newM, newE2];
      return r2.normalize();
    }
    if (this.layer === 1 && other.layer === 1) {
      var r3 = new MN(0);
      r3.sign = 1;
      r3.layer = 2;
      r3.array = [this.array[0], this.array[1] * other.array[0] * Math.pow(10, other.array[1] - Math.floor(other.array[1]))];
      return r3.normalize();
    }
    if (this.layer >= 2) {
      if (other.layer >= 1) {
        var r4 = this.clone();
        r4.layer += 1;
        return r4;
      }
      return this.clone();
    }
    return new MN(Math.pow(this.toNumber(), other.toNumber()));
  };

  MN.prototype.sqrt = function () {
    return this.pow(new MN(0.5));
  };

  MN.prototype.cbrt = function () {
    return this.pow(new MN(1 / 3));
  };

  MN.prototype.root = function (n) {
    n = MN.ensure(n);
    return this.pow(n.recip());
  };

  MN.prototype.log = function (base) {
    base = base !== undefined ? MN.ensure(base) : new MN(E);
    if (this.isZero() || this.isNeg()) return new MN(NaN);
    if (this.layer === 0) {
      var v = Math.log(this.array[0]);
      if (base.layer === 0) v /= Math.log(base.array[0]);
      return new MN(v);
    }
    if (this.layer === 1) {
      var logVal = this.array[1] + Math.log10(this.array[0]);
      if (base.layer === 0 && base.array[0] === E) {
        return new MN(logVal * LN10);
      }
      if (base.layer === 0 && base.array[0] === 10) {
        return new MN(logVal);
      }
      if (base.layer === 0) {
        return new MN(logVal / Math.log10(base.array[0]));
      }
      return new MN(logVal);
    }
    if (this.layer === 2) {
      var r = new MN(0);
      r.sign = 1;
      r.layer = 1;
      r.array = [this.array[0], this.array.length - 2];
      return r.normalize();
    }
    if (this.layer === 3) {
      return new MN(this.array[1]);
    }
    if (this.layer >= 4) {
      var r2 = this.clone();
      r2.layer -= 1;
      return r2;
    }
    return new MN(0);
  };

  MN.prototype.log2 = function () {
    return this.log(new MN(2));
  };

  MN.prototype.log10 = function () {
    return this.log(new MN(10));
  };

  MN.prototype.logBase = function (base) {
    return this.log(base);
  };

  MN.prototype.exp = function () {
    if (this.layer === 0) {
      var v = Math.exp(this.sign * this.array[0]);
      return new MN(v);
    }
    if (this.layer === 1) {
      var r = new MN(0);
      r.sign = 1;
      r.layer = 1;
      r.array = [this.array[0] * Math.LOG10E, this.array[1]];
      return r.normalize();
    }
    var r2 = this.clone();
    r2.layer += 1;
    return r2;
  };

  MN.prototype.exp2 = function () {
    return new MN(2).pow(this);
  };

  MN.prototype.exp10 = function () {
    return new MN(10).pow(this);
  };

  MN.prototype.pow10 = function () {
    return this.exp10();
  };

  MN.prototype.hypot = function (other) {
    other = MN.ensure(other);
    return this.mul(this).add(other.mul(other)).sqrt();
  };

  MN.prototype.sin = function () {
    if (this.layer > 0) return new MN(NaN);
    return new MN(Math.sin(this.sign * this.array[0]));
  };

  MN.prototype.cos = function () {
    if (this.layer > 0) return new MN(NaN);
    return new MN(Math.cos(this.sign * this.array[0]));
  };

  MN.prototype.tan = function () {
    if (this.layer > 0) return new MN(NaN);
    return new MN(Math.tan(this.sign * this.array[0]));
  };

  MN.prototype.asin = function () {
    if (this.layer > 0) return new MN(NaN);
    return new MN(Math.asin(this.sign * this.array[0]));
  };

  MN.prototype.acos = function () {
    if (this.layer > 0) return new MN(NaN);
    return new MN(Math.acos(this.sign * this.array[0]));
  };

  MN.prototype.atan = function () {
    if (this.layer > 0) return new MN(PI / 2 * this.sign);
    return new MN(Math.atan(this.sign * this.array[0]));
  };

  MN.prototype.sinh = function () {
    if (this.layer > 0) return this.exp().div(new MN(2));
    var v = this.sign * this.array[0];
    return new MN(Math.sinh(v));
  };

  MN.prototype.cosh = function () {
    if (this.layer > 0) return this.exp().div(new MN(2));
    var v = this.sign * this.array[0];
    return new MN(Math.cosh(v));
  };

  MN.prototype.tanh = function () {
    if (this.layer > 0) return new MN(this.sign);
    var v = this.sign * this.array[0];
    return new MN(Math.tanh(v));
  };

  MN.prototype.asinh = function () {
    if (this.layer > 1) return this.log();
    if (this.layer === 1) return this.log();
    var v = this.sign * this.array[0];
    return new MN(Math.asinh(v));
  };

  MN.prototype.acosh = function () {
    if (this.layer > 1) return this.log();
    if (this.layer === 1) return this.log();
    var v = this.sign * this.array[0];
    return new MN(Math.acosh(v));
  };

  MN.prototype.atanh = function () {
    if (this.layer > 0) return new MN(NaN);
    var v = this.sign * this.array[0];
    return new MN(Math.atanh(v));
  };

  MN.prototype.sinc = function () {
    if (this.isZero()) return new MN(1);
    return this.sin().div(this);
  };

  MN.prototype.versin = function () {
    return new MN(1).sub(this.cos());
  };

  MN.prototype.coversin = function () {
    return new MN(1).sub(this.sin());
  };

  MN.prototype.exsec = function () {
    return this.cos().recip().sub(new MN(1));
  };

  MN.prototype.crd = function () {
    return this.div(new MN(2)).sin().mul(new MN(2));
  };

  MN.prototype.atan2 = function (other) {
    other = MN.ensure(other);
    if (this.layer > 0 || other.layer > 0) {
      if (this.gt(other)) return new MN(PI / 2);
      return new MN(0);
    }
    return new MN(Math.atan2(this.sign * this.array[0], other.sign * other.array[0]));
  };

  MN.prototype.phase = function () {
    return new MN(this.sign < 0 ? PI : 0);
  };

  MN.prototype.factorial = function () {
    if (this.layer > 1) return this;
    if (this.layer === 1) {
      var r = this.mul(this.log());
      return r;
    }
    var n = this.toNumber();
    if (n < 0 || !Number.isInteger(n)) return this.gamma();
    if (n <= 170) {
      var result = 1;
      for (var i = 2; i <= n; i++) result *= i;
      return new MN(result);
    }
    return this.gamma();
  };

  MN.prototype.doubleFactorial = function () {
    if (this.layer > 0) return this.factorial().sqrt();
    var n = this.toNumber();
    if (n < 0 || !Number.isInteger(n)) return new MN(NaN);
    var result = 1;
    for (var i = n; i > 0; i -= 2) result *= i;
    return new MN(result);
  };

  MN.prototype.subfactorial = function () {
    if (this.layer > 0) return this.factorial().div(new MN(E));
    var n = Math.floor(this.toNumber());
    if (n < 0) return new MN(NaN);
    if (n === 0) return new MN(1);
    if (n === 1) return new MN(0);
    var result = Math.round(MN.factorialStatic(n) / E);
    return new MN(result);
  };

  MN.factorialStatic = function (n) {
    var r = 1;
    for (var i = 2; i <= n; i++) r *= i;
    return r;
  };

  MN.prototype.primorial = function () {
    if (this.layer > 0) return this.factorial();
    var n = Math.floor(this.toNumber());
    var result = 1;
    for (var i = 2; i <= n; i++) {
      if (MN.isPrime(i)) result *= i;
    }
    return new MN(result);
  };

  MN.isPrime = function (n) {
    if (n < 2) return false;
    if (n < 4) return true;
    if (n % 2 === 0 || n % 3 === 0) return false;
    for (var i = 5; i * i <= n; i += 6) {
      if (n % i === 0 || n % (i + 2) === 0) return false;
    }
    return true;
  };

  MN.prototype.gamma = function () {
    if (this.layer > 0) return this.factorial();
    var n = this.toNumber();
    if (n < 0.5) {
      return new MN(PI / Math.sin(PI * n)).div(new MN(1 - n).gamma());
    }
    n -= 1;
    var g = 7;
    var c = [
      0.99999999999980993, 676.5203681218851, -1259.1392167224028,
      771.32342877765313, -176.61502916214059, 12.507343278686905,
      -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7
    ];
    var x = c[0];
    for (var i = 1; i < g + 2; i++) {
      x += c[i] / (n + i);
    }
    var t = n + g + 0.5;
    var result = Math.sqrt(2 * PI) * Math.pow(t, n + 0.5) * Math.exp(-t) * x;
    return new MN(result);
  };

  MN.prototype.beta = function (other) {
    other = MN.ensure(other);
    return this.gamma().mul(other.gamma()).div(this.add(other).gamma());
  };

  MN.prototype.erf = function () {
    if (this.layer > 0) return new MN(this.sign);
    var x = this.sign * this.array[0];
    var t = 1 / (1 + 0.3275911 * Math.abs(x));
    var poly = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
    var result = 1 - poly * Math.exp(-x * x);
    return new MN(x < 0 ? -result : result);
  };

  MN.prototype.erfc = function () {
    return new MN(1).sub(this.erf());
  };

  MN.prototype.digamma = function () {
    if (this.layer > 0) return this.log();
    var x = this.toNumber();
    if (x <= 0 && Number.isInteger(x)) return new MN(NaN);
    var result = 0;
    while (x < 6) {
      result -= 1 / x;
      x += 1;
    }
    result += Math.log(x) - 1 / (2 * x) - 1 / (12 * x * x) + 1 / (120 * x * x * x * x);
    return new MN(result);
  };

  MN.prototype.polygamma = function (n) {
    n = n || 0;
    if (n === 0) return this.digamma();
    if (this.layer > 0) return new MN(0);
    var x = this.toNumber();
    var result = 0;
    var sign = n % 2 === 0 ? -1 : 1;
    for (var k = 0; k < 100; k++) {
      result += 1 / Math.pow(x + k, n + 1);
    }
    return new MN(sign * MN.factorialStatic(n) * result);
  };

  MN.prototype.zeta = function () {
    if (this.layer > 0) return new MN(1);
    var s = this.toNumber();
    if (s === 1) return new MN(Infinity);
    var result = 0;
    for (var n = 1; n <= 1000; n++) {
      result += 1 / Math.pow(n, s);
    }
    return new MN(result);
  };

  MN.prototype.eta = function () {
    if (this.layer > 0) return new MN(1);
    var s = this.toNumber();
    var result = 0;
    for (var n = 1; n <= 1000; n++) {
      result += Math.pow(-1, n + 1) / Math.pow(n, s);
    }
    return new MN(result);
  };

  MN.prototype.lambda = function () {
    if (this.layer > 0) return new MN(1);
    var s = this.toNumber();
    var result = 0;
    for (var n = 0; n < 500; n++) {
      result += 1 / Math.pow(2 * n + 1, s);
    }
    return new MN(result);
  };

  MN.prototype.mu = function () {
    if (this.layer > 0) return new MN(0);
    var n = Math.floor(this.toNumber());
    if (n < 1) return new MN(0);
    var primes = 0;
    var temp = n;
    for (var i = 2; i * i <= temp; i++) {
      if (temp % i === 0) {
        temp /= i;
        if (temp % i === 0) return new MN(0);
        primes++;
      }
    }
    if (temp > 1) primes++;
    return new MN(primes % 2 === 0 ? 1 : -1);
  };

  MN.prototype.binomial = function (k) {
    k = MN.ensure(k);
    var n = this.toNumber();
    var kv = k.toNumber();
    if (kv < 0 || kv > n) return new MN(0);
    if (this.layer > 0) return this.pow(k).div(k.factorial());
    var result = 1;
    for (var i = 0; i < kv; i++) {
      result *= (n - i) / (i + 1);
    }
    return new MN(result);
  };

  MN.prototype.permutation = function (k) {
    k = MN.ensure(k);
    if (this.layer > 0 || k.layer > 0) return this.factorial().div(this.sub(k).factorial());
    var n = this.toNumber();
    var kv = k.toNumber();
    var result = 1;
    for (var i = 0; i < kv; i++) result *= (n - i);
    return new MN(result);
  };

  MN.prototype.combination = function (k) {
    return this.binomial(k);
  };

  MN.prototype.catalan = function () {
    var n = this.toNumber();
    if (this.layer > 0) return new MN(4).pow(this).div(this.sqrt().mul(new MN(Math.sqrt(PI))));
    return new MN(2 * n).binomial(new MN(n)).div(new MN(n + 1));
  };

  MN.prototype.fibonacci = function () {
    if (this.layer > 0) {
      var phi = (1 + Math.sqrt(5)) / 2;
      return new MN(phi).pow(this).div(new MN(Math.sqrt(5)));
    }
    var n = Math.floor(this.toNumber());
    if (n <= 0) return new MN(0);
    if (n === 1) return new MN(1);
    var a = 0, b = 1;
    for (var i = 2; i <= n; i++) {
      var t = a + b;
      a = b;
      b = t;
    }
    return new MN(b);
  };

  MN.prototype.lucas = function () {
    if (this.layer > 0) {
      var phi = (1 + Math.sqrt(5)) / 2;
      return new MN(phi).pow(this);
    }
    var n = Math.floor(this.toNumber());
    if (n === 0) return new MN(2);
    if (n === 1) return new MN(1);
    var a = 2, b = 1;
    for (var i = 2; i <= n; i++) {
      var t = a + b;
      a = b;
      b = t;
    }
    return new MN(b);
  };

  MN.ensure = function (v) {
    if (v instanceof MN) return v;
    return new MN(v);
  };

  MN.prototype.tetrate = function (height, payload) {
    height = height !== undefined ? MN.ensure(height).toNumber() : 2;
    payload = payload !== undefined ? MN.ensure(payload) : new MN(1);
    if (height <= 0) return payload.clone();
    if (this.layer === 0 && this.array[0] === 10) {
      return MN.tetrate10(height, payload.toNumber());
    }
    var r = payload.clone();
    for (var i = 0; i < height; i++) {
      r = this.pow(r);
    }
    return r;
  };

  MN.prototype.superRoot = function (degree) {
    degree = degree !== undefined ? MN.ensure(degree).toNumber() : 2;
    if (this.layer === 0) {
      var n = this.toNumber();
      if (degree === 2) {
        var lo = 1, hi = n;
        for (var i = 0; i < 100; i++) {
          var mid = (lo + hi) / 2;
          if (Math.pow(mid, mid) < n) lo = mid;
          else hi = mid;
        }
        return new MN((lo + hi) / 2);
      }
    }
    if (this.layer === 3) {
      return new MN(this.array[0]);
    }
    if (this.layer > 3) {
      var r = this.clone();
      r.layer -= 1;
      return r;
    }
    return this.sqrt();
  };

  MN.prototype.superLog = function (base) {
    base = base !== undefined ? MN.ensure(base) : new MN(10);
    if (this.layer === 0) {
      var n = this.toNumber();
      var b = base.toNumber();
      var count = 0;
      while (n > 1) {
        n = Math.log(n) / Math.log(b);
        count++;
        if (count > 1e6) break;
      }
      return new MN(count);
    }
    if (this.layer === 3) {
      return new MN(this.array[1]);
    }
    if (this.layer > 3) {
      var r = this.clone();
      r.layer -= 1;
      return r;
    }
    return this.log(base);
  };

  MN.prototype.pentate = function (height, payload) {
    height = height !== undefined ? MN.ensure(height).toNumber() : 2;
    payload = payload !== undefined ? MN.ensure(payload) : new MN(1);
    if (height <= 0) return payload.clone();
    var r = payload.clone();
    for (var i = 0; i < height; i++) {
      r = this.tetrate(r.toNumber());
    }
    return r;
  };

  MN.prototype.hexate = function (height, payload) {
    height = height !== undefined ? MN.ensure(height).toNumber() : 2;
    payload = payload !== undefined ? MN.ensure(payload) : new MN(1);
    if (height <= 0) return payload.clone();
    var r = payload.clone();
    for (var i = 0; i < height; i++) {
      r = this.pentate(r.toNumber());
    }
    return r;
  };

  MN.prototype.heptate = function (height, payload) {
    height = height !== undefined ? MN.ensure(height).toNumber() : 2;
    payload = payload !== undefined ? MN.ensure(payload) : new MN(1);
    if (height <= 0) return payload.clone();
    var r = payload.clone();
    for (var i = 0; i < height; i++) {
      r = this.hexate(r.toNumber());
    }
    return r;
  };

  MN.prototype.hyper = function (n, b) {
    n = MN.ensure(n).toNumber();
    b = MN.ensure(b);
    if (n === 0) return b.add(new MN(1));
    if (n === 1) return this.add(b);
    if (n === 2) return this.mul(b);
    if (n === 3) return this.pow(b);
    if (n === 4) return this.tetrate(b.toNumber());
    if (n === 5) return this.pentate(b.toNumber());
    if (n === 6) return this.hexate(b.toNumber());
    if (n === 7) return this.heptate(b.toNumber());
    var r = b.clone();
    for (var i = 0; i < b.toNumber(); i++) {
      r = this.hyper(n - 1, r);
    }
    return r;
  };

  MN.prototype.ackermann = function (n) {
    n = MN.ensure(n).toNumber();
    var m = this.toNumber();
    if (m === 0) return new MN(n + 1);
    if (n === 0) return new MN(m - 1).ackermann(new MN(1));
    if (m === 1) return new MN(n + 2);
    if (m === 2) return new MN(2 * n + 3);
    if (m === 3) return new MN(Math.pow(2, n + 3) - 3);
    if (m === 4) return MN.tetrate10(n + 3, 1).sub(new MN(3));
    return MN.arrow10(m - 2, n + 3, 1);
  };

  MN.prototype.arrow = function (arrows, value) {
    arrows = MN.ensure(arrows).toNumber();
    value = MN.ensure(value);
    return MN.arrow10(arrows, value.toNumber(), this.toNumber());
  };

  MN.prototype.bracket = function (bracketCount, innerValue) {
    bracketCount = MN.ensure(bracketCount).toNumber();
    innerValue = innerValue !== undefined ? MN.ensure(innerValue).toNumber() : 1;
    return MN.bracket(bracketCount, innerValue, this.toNumber());
  };

  MN.prototype.tierOp = function (tierLevel, bracketCount, innerValue) {
    tierLevel = MN.ensure(tierLevel).toNumber();
    bracketCount = bracketCount !== undefined ? MN.ensure(bracketCount).toNumber() : 1;
    innerValue = innerValue !== undefined ? MN.ensure(innerValue).toNumber() : 1;
    return MN.tieredBracket(tierLevel, bracketCount, innerValue, this.toNumber());
  };

  MN.prototype.arrowAdd = function (other) {
    other = MN.ensure(other);
    if (this.layer >= 4 && other.layer >= 4) {
      var r = this.clone();
      r.array[1] += other.array[1];
      return r.normalize();
    }
    return this.add(other);
  };

  MN.prototype.arrowMul = function (other) {
    other = MN.ensure(other);
    if (this.layer >= 4 && other.layer >= 4) {
      var r = this.clone();
      r.array[1] *= other.array[1];
      return r.normalize();
    }
    return this.mul(other);
  };

  MN.prototype.arrowPow = function (other) {
    other = MN.ensure(other);
    if (this.layer >= 4 && other.layer >= 4) {
      var r = this.clone();
      r.array[1] = Math.pow(r.array[1], other.array[1]);
      return r.normalize();
    }
    return this.pow(other);
  };

  MN.prototype.bracketAdd = function (other) {
    other = MN.ensure(other);
    if (this.layer >= 10 && other.layer >= 10) {
      var r = this.clone();
      r.array[2] += other.array[2];
      return r.normalize();
    }
    return this.add(other);
  };

  MN.prototype.bracketMul = function (other) {
    other = MN.ensure(other);
    if (this.layer >= 10 && other.layer >= 10) {
      var r = this.clone();
      r.array[2] *= other.array[2];
      return r.normalize();
    }
    return this.mul(other);
  };

  MN.prototype.bracketPow = function (other) {
    other = MN.ensure(other);
    if (this.layer >= 10 && other.layer >= 10) {
      var r = this.clone();
      r.array[2] = Math.pow(r.array[2], other.array[2]);
      return r.normalize();
    }
    return this.pow(other);
  };

  MN.prototype.tierAdd = function (other) {
    other = MN.ensure(other);
    if (this.layer >= 11 && other.layer >= 11) {
      var r = this.clone();
      r.array[3] += other.array[3];
      return r.normalize();
    }
    return this.add(other);
  };

  MN.prototype.tierMul = function (other) {
    other = MN.ensure(other);
    if (this.layer >= 11 && other.layer >= 11) {
      var r = this.clone();
      r.array[3] *= other.array[3];
      return r.normalize();
    }
    return this.mul(other);
  };

  MN.prototype.tierPow = function (other) {
    other = MN.ensure(other);
    if (this.layer >= 11 && other.layer >= 11) {
      var r = this.clone();
      r.array[3] = Math.pow(r.array[3], other.array[3]);
      return r.normalize();
    }
    return this.pow(other);
  };

  MN.prototype.collapse = function () {
    if (this.layer <= 1) return this.clone();
    if (this.layer === 2) {
      return new MN(this.array[0]);
    }
    if (this.layer === 3) {
      return new MN(this.array[0]);
    }
    var r = this.clone();
    r.layer = Math.max(0, r.layer - 1);
    return r.normalize();
  };

  MN.prototype.expand = function () {
    var r = this.clone();
    r.layer += 1;
    return r.normalize();
  };

  MN.prototype.halfExp = function () {
    if (this.layer === 0) {
      return new MN(Math.pow(this.array[0], 0.5) * Math.exp(this.array[0] * 0.5));
    }
    if (this.layer === 1) {
      var r = this.clone();
      r.array[1] *= 0.5;
      return r.normalize();
    }
    return this.clone();
  };

  MN.prototype.iterate = function (fn, times) {
    times = MN.ensure(times).toNumber();
    var r = this.clone();
    for (var i = 0; i < times; i++) {
      r = fn(r);
    }
    return r;
  };

  MN.prototype.goodstein = function (base) {
    base = base !== undefined ? MN.ensure(base).toNumber() : 2;
    if (this.layer > 0) return MN.arrow10(3, this.array[0], 1);
    var n = this.toNumber();
    var b = base;
    var steps = 0;
    while (n > 0 && steps < 1e6) {
      var digits = [];
      var temp = n;
      while (temp > 0) {
        digits.push(temp % b);
        temp = Math.floor(temp / b);
      }
      b++;
      n = 0;
      for (var i = digits.length - 1; i >= 0; i--) {
        n = n * b + digits[i];
      }
      n--;
      steps++;
    }
    return new MN(steps);
  };

  MN.prototype.grahamBound = function () {
    var r = new MN(3);
    for (var i = 0; i < 64; i++) {
      r = r.arrow(r.toNumber(), new MN(3));
    }
    return r;
  };

  MN.prototype.treeFunc = function () {
    if (this.layer > 0) return MN.fw2_10();
    var n = this.toNumber();
    if (n <= 1) return new MN(n + 1);
    if (n === 2) return MN.tetrate10(10, 1);
    if (n === 3) {
      var r = new MN(0);
      r.sign = 1;
      r.layer = 14;
      r.array = [1, 10, 10];
      return r;
    }
    return MN.fw2_10();
  };

  MN.prototype.loaderNum = function () {
    return MN.fw2_10();
  };

  MN.prototype.friedman = function () {
    if (this.layer > 0) return MN.fw2_10();
    var n = this.toNumber();
    return MN.arrow10(n, n, 1);
  };

  MN.prototype.bash = function () {
    if (this.layer > 0) return MN.fw2_10();
    var n = this.toNumber();
    var r = new MN(n);
    for (var i = 0; i < n; i++) {
      r = r.tetrate(n);
    }
    return r;
  };

  MN.prototype.chainArrow = function (chain) {
    if (!Array.isArray(chain)) chain = [chain];
    var arr = chain.map(function (x) { return MN.ensure(x).toNumber(); });
    if (arr.length === 1) return new MN(arr[0]);
    if (arr.length === 2) return new MN(arr[0]).pow(new MN(arr[1]));
    if (arr.length === 3) return new MN(arr[0]).arrow(arr[2], new MN(arr[1]));
    var last = arr[arr.length - 1];
    var arrow = arr[arr.length - 2];
    var rest = arr.slice(0, arr.length - 2);
    var r = new MN(rest[rest.length - 1]);
    for (var i = 0; i < last; i++) {
      r = new MN(rest[0]).chainArrow(rest.slice(1).concat([arrow, r.toNumber()]));
    }
    return r;
  };

  MN.prototype.conwayChain = function (chain) {
    return this.chainArrow(chain);
  };

  MN.prototype.birdArray = function (arr) {
    if (!Array.isArray(arr)) return this.arrow(arr, new MN(3));
    if (arr.length <= 2) return this.chainArrow(arr);
    return MN.fw2_10();
  };

  MN.prototype.fastGrow = function (ordinal) {
    ordinal = MN.ensure(ordinal).toNumber();
    return MN.fgh(ordinal, this.toNumber());
  };

  MN.prototype.omegaTier = function (depth) {
    depth = depth !== undefined ? MN.ensure(depth).toNumber() : 1;
    return MN.omega(depth);
  };

  MN.prototype.iterateExp = function (times) {
    times = MN.ensure(times).toNumber();
    var r = this.clone();
    for (var i = 0; i < times; i++) {
      r = r.exp10();
    }
    return r;
  };

  MN.prototype.tetrationHeight = function () {
    if (this.layer < 3) return new MN(0);
    if (this.layer === 3) return new MN(this.array[1]);
    return new MN(Infinity);
  };

  MN.prototype.arrowCount = function () {
    if (this.layer < 4) return new MN(0);
    if (this.layer < 10) return new MN(this.layer - 2);
    if (this.layer === 10) return new MN(this.array[2]);
    return new MN(Infinity);
  };

  MN.prototype.bracketDepth = function () {
    if (this.layer < 10) return new MN(0);
    if (this.layer === 10) return new MN(1);
    if (this.layer === 11) return new MN(this.array[3]);
    return new MN(Infinity);
  };

  MN.prototype.tierLevel = function () {
    if (this.layer < 11) return new MN(0);
    if (this.layer === 11) return new MN(this.array[3]);
    return new MN(this.layer - 10);
  };

  MN.prototype.layerDepth = function () {
    return new MN(this.layer);
  };

  MN.prototype.approximate = function (target) {
    target = MN.ensure(target);
    if (this.layer === target.layer) return this.clone();
    var r = this.clone();
    r.layer = target.layer;
    return r.normalize();
  };

  MN.prototype.lerp = function (other, t) {
    other = MN.ensure(other);
    t = MN.ensure(t);
    return this.mul(new MN(1).sub(t)).add(other.mul(t));
  };

  MN.prototype.smoothstep = function (edge0, edge1) {
    edge0 = MN.ensure(edge0);
    edge1 = MN.ensure(edge1);
    var t = this.sub(edge0).div(edge1.sub(edge0)).clamp(new MN(0), new MN(1));
    return t.mul(t).mul(new MN(3).sub(t.mul(new MN(2))));
  };

  MN.prototype.map = function (inMin, inMax, outMin, outMax) {
    inMin = MN.ensure(inMin);
    inMax = MN.ensure(inMax);
    outMin = MN.ensure(outMin);
    outMax = MN.ensure(outMax);
    return this.sub(inMin).div(inMax.sub(inMin)).mul(outMax.sub(outMin)).add(outMin);
  };

  MN.prototype.avg = function (other) {
    other = MN.ensure(other);
    return this.add(other).div(new MN(2));
  };

  MN.prototype.geometricMean = function (other) {
    other = MN.ensure(other);
    return this.mul(other).sqrt();
  };

  MN.prototype.harmonicMean = function (other) {
    other = MN.ensure(other);
    return new MN(2).div(this.recip().add(other.recip()));
  };

  MN.prototype.rms = function (other) {
    other = MN.ensure(other);
    return this.mul(this).add(other.mul(other)).div(new MN(2)).sqrt();
  };

  MN.prototype.ln = function () {
    return this.log(new MN(E));
  };

  MN.prototype.logGamma = function () {
    if (this.layer > 0) return this.mul(this.log());
    var x = this.toNumber();
    if (x <= 0) return new MN(Infinity);
    return this.gamma().log();
  };

  MN.prototype.pochhammer = function (n) {
    n = MN.ensure(n).toNumber();
    var r = new MN(1);
    var x = this.clone();
    for (var i = 0; i < n; i++) {
      r = r.mul(x);
      x = x.add(new MN(1));
    }
    return r;
  };

  MN.prototype.hurwitzZeta = function (a) {
    a = MN.ensure(a);
    if (this.layer > 0) return new MN(1);
    var s = this.toNumber();
    var av = a.toNumber();
    var result = 0;
    for (var n = 0; n < 1000; n++) {
      result += 1 / Math.pow(n + av, s);
    }
    return new MN(result);
  };

  MN.prototype.lerchPhi = function (z, a) {
    z = MN.ensure(z);
    a = MN.ensure(a);
    if (this.layer > 0) return new MN(0);
    var s = this.toNumber();
    var zv = z.toNumber();
    var av = a.toNumber();
    var result = 0;
    for (var n = 0; n < 1000; n++) {
      result += Math.pow(zv, n) / Math.pow(n + av, s);
    }
    return new MN(result);
  };

  MN.prototype.li = function () {
    if (this.layer > 0) return this.div(this.log());
    var x = this.toNumber();
    if (x <= 1) return new MN(0);
    var result = 0;
    var dt = 0.01;
    for (var t = 2; t < x; t += dt) {
      result += dt / Math.log(t);
    }
    return new MN(result);
  };

  MN.prototype.piApprox = function () {
    if (this.layer > 0) return this.div(this.log());
    return this.li();
  };

  MN.prototype.softMax = function (other) {
    other = MN.ensure(other);
    var a = this.exp();
    var b = other.exp();
    var s = a.add(b);
    return a.div(s);
  };

  MN.prototype.sigmoid = function () {
    return new MN(1).div(new MN(1).add(this.neg().exp()));
  };

  MN.prototype.relu = function () {
    return this.max(new MN(0));
  };

  MN.prototype.leakyRelu = function (alpha) {
    alpha = alpha !== undefined ? MN.ensure(alpha).toNumber() : 0.01;
    if (this.gt(new MN(0))) return this.clone();
    return this.mul(new MN(alpha));
  };

  MN.init();

  return MN;
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = MagnetNum;
}
if (typeof window !== "undefined") {
  window.MagnetNum = MagnetNum;
  window.MN = MagnetNum;
}
