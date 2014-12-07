class QuoteTag extends SimpleTag
  tag: "quote"
  name: "quote"

  html: (content, args) ->
    if args.length is 3
      return "<blockquote data-thread-id=\"#{args[0]}\" data-post-id=\"#{args[1]}\" data-author=\"#{args[2]}\">#{content}</blockquote>"
    else
      return "<blockquote>#{content}</blockquote>"