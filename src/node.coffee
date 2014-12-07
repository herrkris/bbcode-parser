class Node
  constructor: ->
    @children = []
    @parent = null
    @tag = null
    @text = null
    @args = null
    @rawStart = null
    @rawEnd = null
    @invalid = no

  initialize: (text) ->
    @text = text

  initializeWithRaw: (type, args, raw) ->
    @tag = type
    @args = args
    @rawStart = raw

  close: (raw) ->
    if raw
      @rawEnd = raw
    else
      @rawEnd = "[/#{@tag.tag}]"

    @parent

  hasTag: ->
    @tag != null

  isRoot: ->
    @tag == null and @text == null

  isString: ->
    @text != null

  isInvalid: ->
    @invalid

  toString: ->
    return @text if @isString()

    res = (n.toString() for n in @children).join("")

    return res if @isRoot()
    return res if res is ""
    return @rawStart + res + @rawEnd if @isInvalid()
    return @tag.html(res, @args)