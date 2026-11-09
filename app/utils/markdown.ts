/**
 * Tiny, safe markdown → HTML for assistant replies.
 * Escapes everything first, then supports: **bold**, *italic*, `code`, ```code blocks```,
 * # headings, - / 1. lists, [links](https://…) and line breaks. No raw HTML passes through.
 */
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function inline(s: string) {
  return s
    .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-(--ui-bg-accented) text-[0.85em]">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline">$1</a>')
}

export function renderMarkdown(src: string) {
  const blocks = esc(src).split(/```/)
  return blocks.map((block, i) => {
    if (i % 2) return `<pre class="my-2 p-3 rounded-lg bg-(--ui-bg-accented) overflow-x-auto text-sm"><code>${block.replace(/^\w*\n/, '')}</code></pre>`
    const out: string[] = []
    let list: 'ul' | 'ol' | null = null
    const close = () => { if (list) { out.push(`</${list}>`); list = null } }
    for (const line of block.split('\n')) {
      const ul = line.match(/^\s*[-*]\s+(.*)/), ol = line.match(/^\s*\d+[.)]\s+(.*)/), h = line.match(/^(#{1,3})\s+(.*)/)
      if (ul || ol) {
        const want = ul ? 'ul' : 'ol'
        if (list !== want) { close(); list = want; out.push(want === 'ul' ? '<ul class="list-disc pl-5 my-1 space-y-0.5">' : '<ol class="list-decimal pl-5 my-1 space-y-0.5">') }
        out.push(`<li>${inline((ul ?? ol)![1]!)}</li>`)
      } else {
        close()
        if (h) out.push(`<p class="font-semibold mt-2">${inline(h[2]!)}</p>`)
        else if (line.trim()) out.push(`<p>${inline(line)}</p>`)
        else out.push('<div class="h-2"></div>')
      }
    }
    close()
    return out.join('')
  }).join('')
}
