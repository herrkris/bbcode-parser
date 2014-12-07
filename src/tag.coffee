class Tag
  @RECOVERY_NONE: 0
  @RECOVERY_STRING: 1
  @RECOVERY_CLOSE: 2
  @RECOVERY_REOPEN: 3
  @RECOVERY_ADD: 4

  constructor: ->
    @invalidEndRecovery = Tag.RECOVERY_STRING
    @invalidStringRecovery = Tag.RECOVERY_NONE
    @invalidStartRecovery = Tag.RECOVERY_STRING
    @invalidRecoveryAddTag = ""
    @tag = null
    @description = ""
    @allowedTags = []
    @text = ""

  initialize: (tag, name) ->
    @tag = tag
    @name = name
    @allowTags(Parser.getAllTags())

  initializeWithAllowedTags: (tag, name, allowed) ->
    @tag = tag
    @name = name
    @allowTags(allowed)

  setInvalidStartRecovery: (recovery) ->
    @invalidStartRecovery = recovery

  setInvalidEndRecovery: (recovery) ->
    @invalidEndRecovery = recovery

  setInvalidStringRecovery: (recovery) ->
    @invalidStringRecovery = recovery

  setInvalidRecoveryTag: (tag) ->
    @invalidRecoveryAddTag = tag

  html: (content, args) ->
    console.error("You have to implement an html method")

  allowTags: (tags) ->
    @allowedTags = (tag.replace(" ", "") for tag in tags.split(","))