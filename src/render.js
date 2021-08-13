const { ipcRenderer } = require("electron");
const ytdl = require("ytdl-core");
const ytsearch = require('youtube-sr').default

const yturl = document.getElementById('yt-url')

document.getElementById('settings').src="images/settings.png"

document.getElementById('settings').addEventListener('click', () => {
  ipcRenderer.invoke('browserWindow', __dirname + '/settings/settings.html', 430, 600, false, true)
})

const ifvalid = document.getElementById('ifvalid')

yturl.addEventListener('input', () => {
  const valid = ytdl.validateURL(yturl.value)
  if (valid) {
    ifvalid.innerHTML = '🔮 Found'
    ifvalid.classList.add('btn')
    ifvalid.classList.remove('hidden-btn')
    ifvalid.classList.remove('find')
  } else if (yturl.value) {
    ifvalid.innerHTML = '🔍 Find'
    ifvalid.classList.add('btn')
    ifvalid.classList.add('find')
    ifvalid.classList.remove('hidden-btn')
  } else {
    ifvalid.innerHTML = '❌ NOPE'
    ifvalid.classList.add('hidden-btn')
    ifvalid.classList.remove('btn')
    ifvalid.classList.remove('find')
  }
})

yturl.addEventListener('keydown', async (e) => {
  if (e.key !== "Enter") return;
  ifvalid.click()
})

ifvalid.addEventListener('click', async () => {
  if (ifvalid.classList.contains('hidden-btn')) return;
  let urltoprov = yturl.value
  if (ifvalid.classList.contains('find')) {
    yturl.setAttribute('readonly', true)
    document.getElementById('yt-search').classList.remove('hidden')
    urltoprov = (await ytsearch.searchOne(yturl.value, "video", true)).url
    yturl.removeAttribute('readonly')
    document.getElementById('yt-search').classList.add('hidden')
  }
  ipcRenderer.invoke('browserWindow', __dirname + '/convert/convert.html', 650, 480, false, true, urltoprov)
})

function opensite(site) {
  require("electron").shell.openExternal(site)
}