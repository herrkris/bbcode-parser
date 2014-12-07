class Token
  @TYPE_STRING: 0
  @TYPE_OPEN: 1
  @TYPE_CLOSE: 2

  constructor: ->
    @type = null
    @text = null
    @tag = null
    @args = null

  initialize: (type, text) ->
    @type = type
    if @type is Token.TYPE_STRING
      @text = text
    else
      @tag = text

      if @type is Token.TYPE_OPEN
        @text = "[#{@tag}]"

      if @type is Token.TYPE_CLOSE
        @text = "[/#{@tag}]"


  initializeWithTag: (type, tag, text) ->
    @type = type
    @tag = tag
    @text = text

  initializeWithArguments: (type, tag, text, args) ->
    @type = type
    @tag = tag
    @text = text
    @args = args