class SimpleTag extends Tag
  constructor: ->
    super

    if @allowed
      @initializeWithAllowedTags(@tag, @name, @allowed)
    else
      @initialize(@tag, @name)

  initialize: (tag, name) ->
    super
    @setInvalidStartRecovery(BBCodeTag.RECOVERY_CLOSE)
    @setInvalidEndRecovery(BBCodeTag.RECOVERY_REOPEN)

  initializeWithAllowedTags: (tag, name, allowed) ->
    super
    @setInvalidStartRecovery(BBCodeTag.RECOVERY_CLOSE)
    @setInvalidEndRecovery(BBCodeTag.RECOVERY_REOPEN)

  html: (content) ->
    if @format
      return @format.replace(/%content%/, content)
    else
      return ""