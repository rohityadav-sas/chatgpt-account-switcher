const { test } = require('node:test')
const assert = require('node:assert/strict')
const vm = require('node:vm')
const fs = require('node:fs')
const path = require('node:path')
const root = path.join(__dirname, '..')
function background(options = {}) {
  const calls = { removed: [], set: [], reload: [], update: [], scripts: [] }
  const chrome = {
    runtime: { onMessage: { addListener() {} } },
    cookies: {
      getAll(filter, cb) { cb(options.cookies || []) },
      remove(details, cb) { calls.removed.push(details); cb({}) },
      set(details, cb) { calls.set.push(details); if (options.failSet) chrome.runtime.lastError = { message: 'Denied' }; cb(options.failSet ? null : details); delete chrome.runtime.lastError }
    },
    tabs: {
      query: async () => [{ id: 1, url: options.url || 'https://chatgpt.com/' }],
      reload: async id => calls.reload.push(id),
      update: async (id, data) => calls.update.push(data),
      create: async data => calls.update.push(data)
    },
    scripting: { executeScript: async data => calls.scripts.push(data) }
  }
  const context = vm.createContext({ chrome, console })
  vm.runInContext(fs.readFileSync(path.join(root, 'background/background.js'), 'utf8') + '\nglobalThis.instance = chatGPTSwitcherBackground', context)
  return { instance: context.instance, calls }
}
const cookie = { name: '__Host-session', value: 'test-only', domain: 'chatgpt.com', path: '/', secure: true, httpOnly: true, hostOnly: true, storeId: '0' }
const account = { username: 'test@example.invalid', cookies: [cookie], storages: { local: {}, session: {} } }
test('switch restores host-only cookies, storage, and reloads', async () => {
  const { instance, calls } = background({ cookies: [cookie] })
  assert.equal(await instance.switchAccount(account), true)
  assert.equal(calls.set[0].domain, undefined)
  assert.equal(calls.set[0].storeId, '0')
  assert.equal(calls.scripts.length, 1)
  assert.equal(calls.reload.length, 1)
})
test('cookie errors are reported and prevent a success reload', async () => {
  const { instance, calls } = background({ failSet: true })
  await assert.rejects(instance.switchAccount(account), /Denied/)
  assert.equal(calls.reload.length, 0)
})
test('lookalike hosts are rejected before cookie changes', async () => {
  const { instance, calls } = background({ url: 'https://chatgpt.com.evil.invalid/' })
  await assert.rejects(instance.switchAccount(account), /navigate/)
  assert.equal(calls.set.length, 0)
})
test('new login removes only ChatGPT cookies, using original domain and partition', async () => {
  const { instance, calls } = background({ cookies: [cookie, { ...cookie, domain: '.auth.chatgpt.com', partitionKey: { topLevelSite: 'https://chatgpt.com' } }, { ...cookie, domain: 'example.invalid' }] })
  await instance.addNewAccount()
  assert.equal(calls.removed.length, 2)
  assert.equal(calls.removed[1].url, 'https://auth.chatgpt.com/')
  assert.ok(calls.removed[1].partitionKey)
  assert.equal(calls.update[0].url, 'https://chatgpt.com/auth/login')
})
test('content reinjection installs one listener and session email takes priority', async () => {
  let listeners = 0
  const context = vm.createContext({ window: {}, document: { addEventListener() {} }, chrome: { runtime: { onMessage: { addListener() { listeners++ } } } }, fetch: async () => ({ ok: true, json: async () => ({ user: { email: 'session@example.invalid' } }) }), AbortSignal, console })
  const script = fs.readFileSync(path.join(root, 'content/content.js'), 'utf8')
  vm.runInContext(script, context)
  vm.runInContext(script, context)
  assert.equal(listeners, 1)
  assert.equal(await context.window.chatGPTSwitcher.getUserEmail(), 'session@example.invalid')
})
test('popup shows background errors instead of claiming success', async () => {
  let notification
  const context = vm.createContext({ chrome: { runtime: { sendMessage: async () => ({ success: false, error: 'Cookie denied' }) } }, document: { addEventListener() {} }, showLoading() {}, hideLoading() {}, showNotification: (...args) => { notification = args }, console })
  const source = fs.readFileSync(path.join(root, 'popup/popup.js'), 'utf8').replace(/^import .*$/gm, '')
  vm.runInContext(source + '\nglobalThis.Popup = ChatGPTSwitcher', context)
  const popup = Object.create(context.Popup.prototype)
  popup.accounts = [account]
  await popup.switchAccount(0)
  assert.deepEqual(notification, ['Cookie denied', 'error'])
})
test('manifest references existing scripts, popup, and icons', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json')))
  for (const file of [manifest.background.service_worker, manifest.action.default_popup, ...Object.values(manifest.icons), ...manifest.content_scripts.flatMap(s => s.js)]) assert.ok(fs.existsSync(path.join(root, file)), file)
})
