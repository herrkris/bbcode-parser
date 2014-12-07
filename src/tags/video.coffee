class VideoTag extends SimpleTag
  tag: "video"
  name: "video"
  allowed: "string"

  html: (content) ->
    if content.match(/youtu\.?be/)
      "<div class=\"video youtube\" data-video=\"#{content}\"></div>"
    else
      "<div class=\"video\" data-video=\"#{content}\"></div>"