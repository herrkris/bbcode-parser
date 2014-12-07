class MonospaceTag extends SimpleTag
  tag: "m"
  name: "monospace"

  html: (content) ->
    content = content.replace(/\<br\>/gi, "")
    "<span class=\"inline-code\">%content%</span>".replace("%content%", content)