do (root = this, factory = (root, XRegExp) ->
  BBCodeParser = {}

  BBCodeParser.VERSION = "<%= version %>"

  `// @include ../parser.js

  // @include ../tag.js
  // @include ../token.js
  // @include ../node.js

  // @include ../tags/simple.js

  // @include ../tags/bold.js
  // @include ../tags/italic.js
  // @include ../tags/strike.js
  // @include ../tags/underline.js

  // @include ../tags/mod.js
  // @include ../tags/trigger.js
  // @include ../tags/spoiler.js

  // @include ../tags/code.js
  // @include ../tags/monospace.js

  // @include ../tags/link.js
  // @include ../tags/image.js
  // @include ../tags/video.js
  // @include ../tags/quote.js

  // @include ../tags/list.js
  // @include ../tags/list_item.js

  // @include ../tags/table.js
  // @include ../tags/table_row.js
  // @include ../tags/table_cell.js
  `

  parser = new Parser

  parser.registerTag(new BoldTag)
  parser.registerTag(new MonospaceTag)
  parser.registerTag(new UnderlineTag)
  parser.registerTag(new StrikeTag)
  parser.registerTag(new ItalicTag)
  parser.registerTag(new CodeTag)
  parser.registerTag(new SpoilerTag)
  parser.registerTag(new ModTag)
  parser.registerTag(new TriggerTag)
  parser.registerTag(new LinkTag)
  parser.registerTag(new ImageTag)
  parser.registerTag(new VideoTag)
  parser.registerTag(new QuoteTag)
  parser.registerTag(new ListTag)
  parser.registerTag(new ListItemTag)
  parser.registerTag(new TableTag)
  parser.registerTag(new TableRowTag)
  parser.registerTag(new TableCellTag)

  parser
) ->
  if typeof define is "function" and define.amd
    define ['xregexp'], (XRegExp) ->
      root.BBCodeParser = factory(root, XRegExp)
  else if typeof exports isnt "undefined"
    module.exports = factory(root, XRegExp)
  else
    root.BBCodeParser = factory(root, root.XRegExp)