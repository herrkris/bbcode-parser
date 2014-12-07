class TableCellTag extends Tag
  constructor: ->
    super
    @initialize("||", "tablecol")
    @setInvalidStartRecovery(Tag.RECOVERY_CLOSE)
    @setInvalidEndRecovery(Tag.RECOVERY_CLOSE)

  html: (content) ->
    "<td>#{content}</td>"