class CodeTag extends SimpleTag
  tag: "code"
  name: "code"

  html: (content) ->
    content = content.replace(/\<br\>/gi, "")
    "<div class=\"code\">%content%</div>".replace("%content%", content)