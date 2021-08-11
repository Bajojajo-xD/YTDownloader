const { ipcRenderer } = require("electron");
const ytdl = require("ytdl-core");

const yturl = document.getElementById('yt-url')

document.getElementById('settings').src="images/settings.png"

document.getElementById('settings').addEventListener('click', () => {
  ipcRenderer.invoke('browserWindow', __dirname + '/settings/settings.html', 430, 600, false, true)
})

yturl.addEventListener('input', () => {
  const valid = ytdl.validateURL(yturl.value)
  if (valid) {
    document.getElementById('ifvalid').innerHTML = '✅ YEAH'
  } else {
    document.getElementById('ifvalid').innerHTML = '❌ NOPE'
  }
})

function opensite(site) {
  require("electron").shell.openExternal(site)
}