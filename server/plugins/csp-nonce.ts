// Gives every <script> tag of a rendered page the nonce of this request's CSP header
// (set in server/middleware/security.ts, production only). Pages are rendered per request
// and never cached by the server, so the nonce in the HTML always matches the header.
const SCRIPT_TAG = /<script(?![^>]*\snonce=)(?=[\s>])/g

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('render:html', (html, { event }) => {
    const nonce = event.context.cspNonce as string | undefined
    if (!nonce) return
    const add = (chunks: string[]) => chunks.map((c) => c.replace(SCRIPT_TAG, `<script nonce="${nonce}"`))
    html.head = add(html.head)
    html.bodyPrepend = add(html.bodyPrepend)
    html.body = add(html.body)
    html.bodyAppend = add(html.bodyAppend)
  })
})
