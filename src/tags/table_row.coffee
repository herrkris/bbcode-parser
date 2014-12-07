class TableRowTag extends Tag
  constructor: ->
    super
    @initializeWithAllowedTags("--", "tablerow", "||")
    @setInvalidStartRecovery(Tag.RECOVERY_ADD)
    @setInvalidEndRecovery(Tag.RECOVERY_CLOSE)
    @setInvalidStringRecovery(Tag.RECOVERY_ADD)

  html: (content) ->
    "<tr>#{content}</tr>"