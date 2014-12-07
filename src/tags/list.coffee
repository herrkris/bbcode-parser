class ListTag extends Tag
  constructor: ->
    super
    @initializeWithAllowedTags("list", "list", "*")
    @setInvalidStartRecovery(Tag.RECOVERY_ADD)
    @setInvalidEndRecovery(Tag.RECOVERY_CLOSE)
    @setInvalidStringRecovery(Tag.RECOVERY_ADD)
    @setInvalidRecoveryTag("*")

  html: (content) ->
    "<ul>#{content}</ul>"