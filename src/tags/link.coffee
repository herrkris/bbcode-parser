class LinkTag extends SimpleTag
  tag: "url"
  name: "link"
  allowed: "string, b, u, s, i, mod, img, url, list, table, m"

  html: (content, args) ->
    url = content

    if args.length > 0
      url = args[0]

    if url.substr(0, 4) isnt "http"
      url = "http://#{url}"

    "<a href=\"#{url}\">#{content}</a>"