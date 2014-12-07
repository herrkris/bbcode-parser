class ListItemTag extends Tag
  constructor: ->
    super
    @initialize("*", "listitem")
    @setInvalidStartRecovery(Tag.RECOVERY_CLOSE)
    @setInvalidEndRecovery(Tag.RECOVERY_CLOSE)

  html = (content) ->
    if content.replace("<br>", "").trim().length is 0
      return ""
    else
      "<li>#{content}</li>"