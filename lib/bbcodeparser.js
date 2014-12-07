(function(root, factory) {
  if (typeof define === "function" && define.amd) {
    return define(['xregexp'], function(XRegExp) {
      return root.BBCodeParser = factory(root, XRegExp);
    });
  } else if (typeof exports !== "undefined") {
    return module.exports = factory(root, XRegExp);
  } else {
    return root.BBCodeParser = factory(root, root.XRegExp);
  }
})(this, function(root, XRegExp) {
  var BBCodeParser, parser;
  BBCodeParser = {};
  BBCodeParser.VERSION = "0.1.4";
  var Parser;
  
  Parser = (function() {
    function Parser() {
      this.argsPattern = new RegExp("([^,\"]+)|(\"[^\"]+\")", "ig");
      this.regExSkeleton = "(.*?)((\\[\\s*(%tags%)\\s*([= ]((\\s*((\"[^\"]+?\")|" + "([^,\\]\"]+?))\\s*,)*(\\s*((\"[^\"]+?\")|([^,\"\\]]+?))\\s*)))?\\])|" + "(\\[\\/\\s*((%tags%))\\s*\\]))";
      this.tags = {};
    }
  
    Parser.getAllTags = function() {
      return "string, b, u, s, i, mod, spoiler, code, img, quote, url, list, table, m, tex";
    };
  
    Parser.prototype.registerTag = function(tag) {
      return this.tags[tag.tag] = tag;
    };
  
    Parser.prototype.generatePattern = function() {
      var name, tag, tags;
      tags = ((function() {
        var _ref, _results;
        _ref = this.tags;
        _results = [];
        for (name in _ref) {
          tag = _ref[name];
          _results.push(XRegExp.escape(name));
        }
        return _results;
      }).call(this)).join("|");
      return XRegExp(this.regExSkeleton.replace(/%tags%/gi, tags, "gi"), "imsg");
    };
  
    Parser.prototype.parse = function(input) {
      var args, argsMatch, beginning, current, e, end, endBBCode, lastMatched, match, pattern, pos, recovery, root, startBBCode, t, token, tokens;
      lastMatched = 0;
      tokens = [];
      startBBCode = input.indexOf("[");
      endBBCode = input.lastIndexOf("]");
      beginning = "";
      end = "";
      try {
        beginning = this.stringToHTML(input.substr(0, startBBCode));
        end = this.stringToHTML(input.substr(endBBCode + 1));
        input = input.substr(startBBCode, endBBCode + 1);
      } catch (_error) {
  
      }
      root = new Node();
      current = root;
      pattern = this.generatePattern();
      pos = 0;
      while (match = XRegExp.exec(input, pattern, pos, "sticky")) {
        pos = match.index + match[0].length;
        if (match[1].length > 0) {
          t = new Token;
          t.initialize(Token.TYPE_STRING, this.stringToHTML(match[1]));
          tokens.push(t);
        }
        if (match[2].indexOf("[/") > -1) {
          t = new Token;
          t.initializeWithTag(Token.TYPE_CLOSE, match[16].toLowerCase(), match[2]);
          tokens.push(t);
        } else {
          args = [];
          if (match[6] && match[6].length > 0) {
            while (argsMatch = this.argsPattern.exec(match[6])) {
              args.push(argsMatch[0].replace(/\"/, ""));
            }
          }
          t = new Token;
          t.initializeWithArguments(Token.TYPE_OPEN, match[4].toLowerCase(), match[2], args);
          tokens.push(t);
        }
        lastMatched = pos;
      }
      if (input.substr(lastMatched).length > 0) {
        t = new Token(Token.TYPE_STRING, this.stringToHTML(input.substr(lastMatched)));
        tokens.push(t);
      }
      while (tokens.length > 0) {
        if (tokens[0].type === Token.TYPE_STRING) {
          try {
            current = this.addString(current, tokens[0].text);
          } catch (_error) {
            e = _error;
            switch (current.tag.invalidStringRecovery) {
              case Tag.RECOVERY_ADD:
                t = new Token;
                t.initialize(Token.TYPE_OPEN, current.tag.invalidRecoveryAddTag);
                tokens.unshift(t);
                break;
              default:
                throw new Error("Unknown error");
            }
            continue;
          }
        }
        if (tokens[0].type === Token.TYPE_OPEN) {
          try {
            token = tokens[0];
            current = this.addStart(current, token.tag, token.args, token.text);
          } catch (_error) {
            e = _error;
            if (!this.isAllowedAnywhere(current, tokens[0].tag) && current.tag.invalidStartRecovery !== Tag.RECOVERY_ADD) {
              recovery = Tag.RECOVERY_STRING;
            } else {
              recovery = current.tag.invalidStartRecovery;
            }
            if (this.isAllowedAnywhere(current, tokens[0].tag) && current.tag.invalidStartRecovery === Tag.RECOVERY_ADD) {
              recovery = Tag.RECOVERY_CLOSE;
            }
            switch (recovery) {
              case Tag.RECOVERY_ADD:
                t = new Token;
                t.initialize(Token.TYPE_OPEN, current.tag.invalidRecoveryAddTag);
                tokens.unshift(t);
                break;
              case Tag.RECOVERY_CLOSE:
                t = new Token;
                t.initialize(Token.TYPE_CLOSE, current.tag.tag);
                tokens.unshift(t);
                break;
              case Tag.RECOVERY_STRING:
                tokens[0].type = Token.TYPE_STRING;
                break;
              default:
                throw new Error("Unkown Error");
            }
            continue;
          }
        }
        if (tokens[0].type === Token.TYPE_CLOSE) {
          try {
            token = tokens[0];
            current = this.addEnd(current, token.tag, token.text);
          } catch (_error) {
            e = _error;
            if (!this.isOpen(current, tokens[0].tag)) {
              recovery = Tag.RECOVERY_STRING;
            } else {
              recovery = current.tag.invalidEndRecovery;
            }
            switch (recovery) {
              case Tag.RECOVERY_REOPEN:
                t = new Token;
                t.initialize(Token.TYPE_CLOSE, current.tag.tag);
                tokens.unshift(t);
                t = new Token;
                t.initialize(Token.TYPE_OPEN, current.tag.tag);
                tokens.splice(2, 0, t);
                break;
              case Tag.RECOVERY_CLOSE:
                t = new Token;
                t.initialize(Token.TYPE_CLOSE, current.tag.tag);
                tokens.unshift(t);
                break;
              case Tag.RECOVERY_STRING:
                tokens[0].type = Token.TYPE_STRING;
                break;
              default:
                throw new Error("Unkown Error");
            }
            continue;
          }
        }
        tokens.shift();
      }
      return beginning + root.toString() + end;
    };
  
    Parser.prototype.addString = function(current, string) {
      var newNode;
      if (!current.isRoot() && current.tag.allowedTags.indexOf("string") === -1) {
        throw new InvalidTokenException;
      }
      newNode = new Node;
      newNode.initialize(string);
      newNode.parent = current;
      current.children.push(newNode);
      return current;
    };
  
    Parser.prototype.addStart = function(current, tagString, args, raw) {
      var newNode, tag;
      if (!current.isRoot() && current.tag.allowedTags.indexOf(tagString) === -1) {
        throw new InvalidTokenException;
      }
      tag = this.tags[tagString];
      newNode = new Node;
      newNode.initializeWithRaw(tag, args, raw);
      newNode.parent = current;
      current.children.push(newNode);
      return newNode;
    };
  
    Parser.prototype.addEnd = function(current, tagString, raw) {
      if (current.isRoot() || tagString !== current.tag.tag) {
        throw new InvalidTokenException;
      }
      return current.close(raw);
    };
  
    Parser.prototype.isOpen = function(current, tagString) {
      if (current.isRoot()) {
        return false;
      }
      if (current.tag.tag === tagString) {
        return true;
      } else {
        return this.isOpen(current.parent, tagString);
      }
    };
  
    Parser.prototype.isAllowedAnywhere = function(current, tagString) {
      if (current.isRoot()) {
        return false;
      }
      if (current.tag.allowedTags.indexOf(tagString) !== -1) {
        return true;
      } else {
        return this.isAllowedAnywhere(current.parent, tagString);
      }
    };
  
    Parser.prototype.stringToHTML = function(input) {
      input = input.replace(/</g, "&lt;");
      input = input.replace(/>/g, "&gt;");
      return input.replace(/\n/g, "<br>\n");
    };
  
    return Parser;
  
  })();
  

  var Tag;
  
  Tag = (function() {
    Tag.RECOVERY_NONE = 0;
  
    Tag.RECOVERY_STRING = 1;
  
    Tag.RECOVERY_CLOSE = 2;
  
    Tag.RECOVERY_REOPEN = 3;
  
    Tag.RECOVERY_ADD = 4;
  
    function Tag() {
      this.invalidEndRecovery = Tag.RECOVERY_STRING;
      this.invalidStringRecovery = Tag.RECOVERY_NONE;
      this.invalidStartRecovery = Tag.RECOVERY_STRING;
      this.invalidRecoveryAddTag = "";
      this.tag = this.tag || null;
      this.description = this.description || "";
      this.allowedTags = this.allowedTags || [];
      this.text = this.text || "";
    }
  
    Tag.prototype.initialize = function(tag, name) {
      this.tag = tag;
      this.name = name;
      return this.allowTags(Parser.getAllTags());
    };
  
    Tag.prototype.initializeWithAllowedTags = function(tag, name, allowed) {
      this.tag = tag;
      this.name = name;
      return this.allowTags(allowed);
    };
  
    Tag.prototype.setInvalidStartRecovery = function(recovery) {
      return this.invalidStartRecovery = recovery;
    };
  
    Tag.prototype.setInvalidEndRecovery = function(recovery) {
      return this.invalidEndRecovery = recovery;
    };
  
    Tag.prototype.setInvalidStringRecovery = function(recovery) {
      return this.invalidStringRecovery = recovery;
    };
  
    Tag.prototype.setInvalidRecoveryTag = function(tag) {
      return this.invalidRecoveryAddTag = tag;
    };
  
    Tag.prototype.html = function(content, args) {
      return console.error("You have to implement an html method");
    };
  
    Tag.prototype.allowTags = function(tags) {
      var tag;
      return this.allowedTags = (function() {
        var _i, _len, _ref, _results;
        _ref = tags.split(",");
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          tag = _ref[_i];
          _results.push(tag.replace(" ", ""));
        }
        return _results;
      })();
    };
  
    return Tag;
  
  })();
  
  var Token;
  
  Token = (function() {
    Token.TYPE_STRING = 0;
  
    Token.TYPE_OPEN = 1;
  
    Token.TYPE_CLOSE = 2;
  
    function Token() {
      this.type = null;
      this.text = null;
      this.tag = null;
      this.args = null;
    }
  
    Token.prototype.initialize = function(type, text) {
      this.type = type;
      if (this.type === Token.TYPE_STRING) {
        return this.text = text;
      } else {
        this.tag = text;
        if (this.type === Token.TYPE_OPEN) {
          this.text = "[" + this.tag + "]";
        }
        if (this.type === Token.TYPE_CLOSE) {
          return this.text = "[/" + this.tag + "]";
        }
      }
    };
  
    Token.prototype.initializeWithTag = function(type, tag, text) {
      this.type = type;
      this.tag = tag;
      return this.text = text;
    };
  
    Token.prototype.initializeWithArguments = function(type, tag, text, args) {
      this.type = type;
      this.tag = tag;
      this.text = text;
      return this.args = args;
    };
  
    return Token;
  
  })();
  
  var Node;
  
  Node = (function() {
    function Node() {
      this.children = [];
      this.parent = null;
      this.tag = null;
      this.text = null;
      this.args = null;
      this.rawStart = null;
      this.rawEnd = null;
      this.invalid = false;
    }
  
    Node.prototype.initialize = function(text) {
      return this.text = text;
    };
  
    Node.prototype.initializeWithRaw = function(type, args, raw) {
      this.tag = type;
      this.args = args;
      return this.rawStart = raw;
    };
  
    Node.prototype.close = function(raw) {
      if (raw) {
        this.rawEnd = raw;
      } else {
        this.rawEnd = "[/" + this.tag.tag + "]";
      }
      return this.parent;
    };
  
    Node.prototype.hasTag = function() {
      return this.tag !== null;
    };
  
    Node.prototype.isRoot = function() {
      return this.tag === null && this.text === null;
    };
  
    Node.prototype.isString = function() {
      return this.text !== null;
    };
  
    Node.prototype.isInvalid = function() {
      return this.invalid;
    };
  
    Node.prototype.toString = function() {
      var n, res;
      if (this.isString()) {
        return this.text;
      }
      res = ((function() {
        var _i, _len, _ref, _results;
        _ref = this.children;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          n = _ref[_i];
          _results.push(n.toString());
        }
        return _results;
      }).call(this)).join("");
      if (this.isRoot()) {
        return res;
      }
      if (res === "") {
        return res;
      }
      if (this.isInvalid()) {
        return this.rawStart + res + this.rawEnd;
      }
      return this.tag.html(res, this.args);
    };
  
    return Node;
  
  })();
  

  var SimpleTag,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };
  
  SimpleTag = (function(_super) {
    __extends(SimpleTag, _super);
  
    function SimpleTag() {
      SimpleTag.__super__.constructor.apply(this, arguments);
      if (this.allowed) {
        this.initializeWithAllowedTags(this.tag, this.name, this.allowed);
      } else {
        this.initialize(this.tag, this.name);
      }
    }
  
    SimpleTag.prototype.initialize = function(tag, name) {
      SimpleTag.__super__.initialize.apply(this, arguments);
      this.setInvalidStartRecovery(Tag.RECOVERY_CLOSE);
      return this.setInvalidEndRecovery(Tag.RECOVERY_REOPEN);
    };
  
    SimpleTag.prototype.initializeWithAllowedTags = function(tag, name, allowed) {
      SimpleTag.__super__.initializeWithAllowedTags.apply(this, arguments);
      this.setInvalidStartRecovery(Tag.RECOVERY_CLOSE);
      return this.setInvalidEndRecovery(Tag.RECOVERY_REOPEN);
    };
  
    SimpleTag.prototype.html = function(content) {
      if (this.format) {
        return this.format.replace(/%content%/, content);
      } else {
        return "";
      }
    };
  
    return SimpleTag;
  
  })(Tag);
  

  var BoldTag,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };
  
  BoldTag = (function(_super) {
    __extends(BoldTag, _super);
  
    function BoldTag() {
      return BoldTag.__super__.constructor.apply(this, arguments);
    }
  
    BoldTag.prototype.tag = "b";
  
    BoldTag.prototype.name = "bold";
  
    BoldTag.prototype.format = "<strong>%content%</strong>";
  
    return BoldTag;
  
  })(SimpleTag);
  
  var ItalicTag,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };
  
  ItalicTag = (function(_super) {
    __extends(ItalicTag, _super);
  
    function ItalicTag() {
      return ItalicTag.__super__.constructor.apply(this, arguments);
    }
  
    ItalicTag.prototype.tag = "i";
  
    ItalicTag.prototype.name = "italic";
  
    ItalicTag.prototype.format = "<em>%content%</em>";
  
    return ItalicTag;
  
  })(SimpleTag);
  
  var StrikeTag,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };
  
  StrikeTag = (function(_super) {
    __extends(StrikeTag, _super);
  
    function StrikeTag() {
      return StrikeTag.__super__.constructor.apply(this, arguments);
    }
  
    StrikeTag.prototype.tag = "s";
  
    StrikeTag.prototype.name = "strike";
  
    StrikeTag.prototype.format = "<del>%content%</del>";
  
    return StrikeTag;
  
  })(SimpleTag);
  
  var UnderlineTag,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };
  
  UnderlineTag = (function(_super) {
    __extends(UnderlineTag, _super);
  
    function UnderlineTag() {
      return UnderlineTag.__super__.constructor.apply(this, arguments);
    }
  
    UnderlineTag.prototype.tag = "u";
  
    UnderlineTag.prototype.name = "underline";
  
    UnderlineTag.prototype.format = "<u>%content%</u>";
  
    return UnderlineTag;
  
  })(SimpleTag);
  

  var ModTag,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };
  
  ModTag = (function(_super) {
    __extends(ModTag, _super);
  
    function ModTag() {
      return ModTag.__super__.constructor.apply(this, arguments);
    }
  
    ModTag.prototype.tag = "mod";
  
    ModTag.prototype.name = "mod";
  
    ModTag.prototype.format = "<span class=\"mod\">%content%</span>";
  
    return ModTag;
  
  })(SimpleTag);
  
  var TriggerTag,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };
  
  TriggerTag = (function(_super) {
    __extends(TriggerTag, _super);
  
    function TriggerTag() {
      return TriggerTag.__super__.constructor.apply(this, arguments);
    }
  
    TriggerTag.prototype.tag = "trigger";
  
    TriggerTag.prototype.name = "trigger";
  
    TriggerTag.prototype.format = "<span class=\"trigger\">%content%</span>";
  
    return TriggerTag;
  
  })(SimpleTag);
  
  var SpoilerTag,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };
  
  SpoilerTag = (function(_super) {
    __extends(SpoilerTag, _super);
  
    function SpoilerTag() {
      return SpoilerTag.__super__.constructor.apply(this, arguments);
    }
  
    SpoilerTag.prototype.tag = "spoiler";
  
    SpoilerTag.prototype.name = "spoiler";
  
    SpoilerTag.prototype.format = "<div class=\"spoiler\"><div>%content%</div></div>";
  
    return SpoilerTag;
  
  })(SimpleTag);
  

  var CodeTag,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };
  
  CodeTag = (function(_super) {
    __extends(CodeTag, _super);
  
    function CodeTag() {
      return CodeTag.__super__.constructor.apply(this, arguments);
    }
  
    CodeTag.prototype.tag = "code";
  
    CodeTag.prototype.name = "code";
  
    CodeTag.prototype.html = function(content) {
      content = content.replace(/\<br\>/gi, "");
      return "<div class=\"code\">%content%</div>".replace("%content%", content);
    };
  
    return CodeTag;
  
  })(SimpleTag);
  
  var MonospaceTag,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };
  
  MonospaceTag = (function(_super) {
    __extends(MonospaceTag, _super);
  
    function MonospaceTag() {
      return MonospaceTag.__super__.constructor.apply(this, arguments);
    }
  
    MonospaceTag.prototype.tag = "m";
  
    MonospaceTag.prototype.name = "monospace";
  
    MonospaceTag.prototype.html = function(content) {
      content = content.replace(/\<br\>/gi, "");
      return "<span class=\"inline-code\">%content%</span>".replace("%content%", content);
    };
  
    return MonospaceTag;
  
  })(SimpleTag);
  

  var LinkTag,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };
  
  LinkTag = (function(_super) {
    __extends(LinkTag, _super);
  
    function LinkTag() {
      return LinkTag.__super__.constructor.apply(this, arguments);
    }
  
    LinkTag.prototype.tag = "url";
  
    LinkTag.prototype.name = "link";
  
    LinkTag.prototype.allowed = "string, b, u, s, i, mod, img, url, list, table, m";
  
    LinkTag.prototype.html = function(content, args) {
      var url;
      url = content;
      if (args.length > 0) {
        url = args[0];
      }
      if (url.substr(0, 4) !== "http") {
        url = "http://" + url;
      }
      return "<a href=\"" + url + "\">" + content + "</a>";
    };
  
    return LinkTag;
  
  })(SimpleTag);
  
  var ImageTag,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };
  
  ImageTag = (function(_super) {
    __extends(ImageTag, _super);
  
    function ImageTag() {
      return ImageTag.__super__.constructor.apply(this, arguments);
    }
  
    ImageTag.prototype.tag = "img";
  
    ImageTag.prototype.name = "image";
  
    ImageTag.prototype.allowed = "string";
  
    ImageTag.prototype.format = "<div class=\"image not-loaded\" data-image=\"%content%\"></div>";
  
    return ImageTag;
  
  })(SimpleTag);
  
  var VideoTag,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };
  
  VideoTag = (function(_super) {
    __extends(VideoTag, _super);
  
    function VideoTag() {
      return VideoTag.__super__.constructor.apply(this, arguments);
    }
  
    VideoTag.prototype.tag = "video";
  
    VideoTag.prototype.name = "video";
  
    VideoTag.prototype.allowed = "string";
  
    VideoTag.prototype.html = function(content) {
      if (content.match(/youtu\.?be/)) {
        return "<div class=\"video youtube\" data-video=\"" + content + "\"></div>";
      } else {
        return "<div class=\"video\" data-video=\"" + content + "\"></div>";
      }
    };
  
    return VideoTag;
  
  })(SimpleTag);
  
  var QuoteTag,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };
  
  QuoteTag = (function(_super) {
    __extends(QuoteTag, _super);
  
    function QuoteTag() {
      return QuoteTag.__super__.constructor.apply(this, arguments);
    }
  
    QuoteTag.prototype.tag = "quote";
  
    QuoteTag.prototype.name = "quote";
  
    QuoteTag.prototype.html = function(content, args) {
      if (args.length === 3) {
        return "<blockquote data-thread-id=\"" + args[0] + "\" data-post-id=\"" + args[1] + "\" data-author=\"" + args[2] + "\">" + content + "</blockquote>";
      } else {
        return "<blockquote>" + content + "</blockquote>";
      }
    };
  
    return QuoteTag;
  
  })(SimpleTag);
  

  var ListTag,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };
  
  ListTag = (function(_super) {
    __extends(ListTag, _super);
  
    function ListTag() {
      ListTag.__super__.constructor.apply(this, arguments);
      this.initializeWithAllowedTags("list", "list", "*");
      this.setInvalidStartRecovery(Tag.RECOVERY_ADD);
      this.setInvalidEndRecovery(Tag.RECOVERY_CLOSE);
      this.setInvalidStringRecovery(Tag.RECOVERY_ADD);
      this.setInvalidRecoveryTag("*");
    }
  
    ListTag.prototype.html = function(content) {
      return "<ul>" + content + "</ul>";
    };
  
    return ListTag;
  
  })(Tag);
  
  var ListItemTag,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };
  
  ListItemTag = (function(_super) {
    __extends(ListItemTag, _super);
  
    function ListItemTag() {
      ListItemTag.__super__.constructor.apply(this, arguments);
      this.initialize("*", "listitem");
      this.setInvalidStartRecovery(Tag.RECOVERY_CLOSE);
      this.setInvalidEndRecovery(Tag.RECOVERY_CLOSE);
    }
  
    ListItemTag.prototype.html = function(content) {
      if (content.replace("<br>", "").trim().length === 0) {
        return "";
      } else {
        return "<li>" + content + "</li>";
      }
    };
  
    return ListItemTag;
  
  })(Tag);
  

  var TableTag,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };
  
  TableTag = (function(_super) {
    __extends(TableTag, _super);
  
    function TableTag() {
      TableTag.__super__.constructor.apply(this, arguments);
      this.initializeWithAllowedTags("table", "table", "--");
      this.setInvalidStartRecovery(Tag.RECOVERY_ADD);
      this.setInvalidEndRecovery(Tag.RECOVERY_CLOSE);
      this.setInvalidStringRecovery(Tag.RECOVERY_ADD);
      this.setInvalidRecoveryTag("--");
    }
  
    TableTag.prototype.html = function(content) {
      return "<table>" + content + "</table>";
    };
  
    return TableTag;
  
  })(Tag);
  
  var TableRowTag,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };
  
  TableRowTag = (function(_super) {
    __extends(TableRowTag, _super);
  
    function TableRowTag() {
      TableRowTag.__super__.constructor.apply(this, arguments);
      this.initializeWithAllowedTags("--", "tablerow", "||");
      this.setInvalidStartRecovery(Tag.RECOVERY_ADD);
      this.setInvalidEndRecovery(Tag.RECOVERY_CLOSE);
      this.setInvalidStringRecovery(Tag.RECOVERY_ADD);
      this.setInvalidRecoveryTag("||");
    }
  
    TableRowTag.prototype.html = function(content) {
      return "<tr>" + content + "</tr>";
    };
  
    return TableRowTag;
  
  })(Tag);
  
  var TableCellTag,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };
  
  TableCellTag = (function(_super) {
    __extends(TableCellTag, _super);
  
    function TableCellTag() {
      TableCellTag.__super__.constructor.apply(this, arguments);
      this.initialize("||", "tablecol");
      this.setInvalidStartRecovery(Tag.RECOVERY_CLOSE);
      this.setInvalidEndRecovery(Tag.RECOVERY_CLOSE);
    }
  
    TableCellTag.prototype.html = function(content) {
      return "<td>" + content + "</td>";
    };
  
    return TableCellTag;
  
  })(Tag);
  
  ;
  parser = new Parser;
  parser.registerTag(new BoldTag);
  parser.registerTag(new MonospaceTag);
  parser.registerTag(new UnderlineTag);
  parser.registerTag(new StrikeTag);
  parser.registerTag(new ItalicTag);
  parser.registerTag(new CodeTag);
  parser.registerTag(new SpoilerTag);
  parser.registerTag(new ModTag);
  parser.registerTag(new TriggerTag);
  parser.registerTag(new LinkTag);
  parser.registerTag(new ImageTag);
  parser.registerTag(new VideoTag);
  parser.registerTag(new QuoteTag);
  parser.registerTag(new ListTag);
  parser.registerTag(new ListItemTag);
  parser.registerTag(new TableTag);
  parser.registerTag(new TableRowTag);
  parser.registerTag(new TableCellTag);
  return parser;
});
