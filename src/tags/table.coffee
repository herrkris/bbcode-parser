class TableTag extends Tag
  constructor: ->
    super
    @initializeWithAllowedTags("table", "table", "--")
    @setInvalidStartRecovery(Tag.RECOVERY_ADD)
    @setInvalidEndRecovery(Tag.RECOVERY_CLOSE)
    @setInvalidStringRecovery(Tag.RECOVERY_ADD)
    @setInvalidRecoveryTag("--")

  html: (content) ->
    "<table>#{content}</table>"