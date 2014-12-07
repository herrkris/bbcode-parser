class Parser
  constructor: ->
    @argsPattern = new RegExp("([^,\"]+)|(\"[^\"]+\")", "ig")
    @regExSkeleton =
      "(.*?)((\\[\\s*(%tags%)\\s*([= ]((\\s*((\"[^\"]+?\")|" +
      "([^,\\]\"]+?))\\s*,)*(\\s*((\"[^\"]+?\")|([^,\"\\]]+?))\\s*)))?\\])|" +
      "(\\[\\/\\s*((%tags%))\\s*\\]))"
    @tags = {}

  @getAllTags: ->
    "string, b, u, s, i, mod, spoiler, code, img, quote, url, list, table, m, tex"

  registerTag: (tag) ->
    @tags[tag.tag] = tag

  generatePattern: ->
    tags = (XRegExp.escape(name) for name, tag of @tags).join("|")
    XRegExp((@regExSkeleton.replace(/%tags%/gi, tags, "gi")), "imsg")

  parse: (input) ->
    lastMatched = 0
    tokens = []

    startBBCode = input.indexOf("[")
    endBBCode = input.lastIndexOf("]")

    beginning = ""
    end = ""

    try
      beginning = @stringToHTML(input.substr(0, startBBCode))
      end = @stringToHTML(input.substr(endBBCode + 1))
      input = input.substr(startBBCode, endBBCode + 1)
    catch

    root = new Node()
    current = root

    pattern = @generatePattern()
    pos = 0
    while match = XRegExp.exec(input, pattern, pos, "sticky")
      pos = match.index + match[0].length

      if match[1].length > 0
        t = new Token
        t.initialize(Token.TYPE_STRING, @stringToHTML(match[1]))
        tokens.push(t)

      if match[2].indexOf("[/") > -1
        t = new Token
        t.initializeWithTag Token.TYPE_CLOSE, match[16].toLowerCase(),
          match[2]
        tokens.push(t)
      else
        args = []
        if match[6] and match[6].length > 0
          while argsMatch = @argsPattern.exec(match[6])
            args.push(argsMatch[0].replace(/\"/, ""))

        t = new Token
        t.initializeWithArguments Token.TYPE_OPEN, match[4].toLowerCase(),
          match[2], args
        tokens.push(t)

      lastMatched = pos

    if input.substr(lastMatched).length > 0
      t = new Token(Token.TYPE_STRING, @stringToHTML(input.substr(lastMatched)))
      tokens.push(t)

    while tokens.length > 0
      if tokens[0].type is Token.TYPE_STRING
        try
          current = @addString(current, tokens[0].text)
        catch e
          switch current.tag.invalidStringRecovery
            when Tag.RECOVERY_ADD
              t = new Token
              t.initialize(Token.TYPE_OPEN, current.tag.invalidRecoveryAddTag)
              tokens.unshift(t)
            else
              throw new Error("Unknown error")

          continue

      if tokens[0].type is Token.TYPE_OPEN
        try
          token = tokens[0]
          current = @addStart(current, token.tag, token.args, token.text)
        catch e
          if @isAllowedAnywhere(current, tokens[0].tag) and
             current.tag.invalidStartRecovery isnt Tag.RECOVERY_ADD
            recovery = Tag.RECOVERY_STRING
          else
            recovery = current.tag.invalidStartRecovery

          if @isAllowedAnywhere(current, tokens[0].tag) and
             current.tag.invalidStartRecovery isnt Tag.RECOVERY_ADD
            recovery = Tag.RECOVERY_STRING

          switch recovery
            when Tag.RECOVERY_ADD
              t = new Token
              t.initialize(Token.TYPE_OPEN, current.tag.invalidRecoveryAddTag)
              tokens.unshift(t)
            when Tag.RECOVERY_CLOSE
              t = new Token
              t.initialize(Token.TYPE_CLOSE, current.tag.tag)
              tokens.unshift(t)
            when Tag.RECOVERY_STRING
              tokens[0].type = Token.TYPE_STRING
            else
              throw new Error("Unkown Error")

          continue

      if tokens[0].type is Token.TYPE_CLOSE
        try
          token = tokens[0]
          current = @addEnd(current, token.tag, token.text)
        catch e
          if not @isOpen(current, tokens[0].tag)
            recovery = Tag.RECOVERY_STRING
          else
            recovery = current.tag.invalidEndRecovery

          switch recovery
            when Tag.RECOVERY_REOPEN
              t = new Token
              t.initialize(Token.TYPE_CLOSE, current.tag.tag)
              tokens.unshift(t)

              t = new Token
              t.initialize(Token.TYPE_OPEN, current.tag.tag)
              tokens.splice(2, 0, t)
            when Tag.RECOVERY_CLOSE
              t = new Token
              t.initialize(Token.TYPE_CLOSE, current.tag.tag)
              tokens.unshift(t)
            when Tag.RECOVERY_STRING
              tokens[0].type = Token.TYPE_STRING
            else
              throw new Error("Unkown Error")

          continue

      tokens.shift()

    beginning + root.toString() + end

  addString: (current, string) ->
    if not current.isRoot() and current.tag.allowedTags.indexOf("string") is -1
      throw new InvalidTokenException

    newNode = new Node
    newNode.initialize(string)
    newNode.parent = current
    current.children.push(newNode)

    current

  addStart: (current, tagString, args, raw) ->
    if not current.isRoot() and current.tag.allowedTags.indexOf(tagString) is -1
      throw new InvalidTokenException

    tag = @tags[tagString]

    newNode = new Node
    newNode.initializeWithRaw(tag, args, raw)
    newNode.parent = current
    current.children.push(newNode)

    newNode

  addEnd: (current, tagString, raw) ->
    if current.isRoot() or tagString isnt current.tag.tag
      throw new InvalidTokenException

    current.close(raw)

  isOpen: (current, tagString) ->
    return no if current.isRoot()

    if current.tag.tag is tagString
      return yes
    else
      return @isOpen(current.parent, tagString)

  isAllowedAnywhere: (current, tagString) ->
    return no if current.isRoot()

    if current.tag.allowedTags.indexOf(tagString) isnt -1
      return yes
    else
      @isAllowedAnywhere(current.parent, tagString)

  stringToHTML: (input) ->
    input = input.replace(/</g, "&lt;")
    input = input.replace(/>/g, "&gt;")
    input.replace(/\n/g, "<br>\n")