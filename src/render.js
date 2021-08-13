const { ipcRenderer } = require("electron");
const ytdl = require("ytdl-core");
const ytsearch = require('youtube-sr').default
const sul = require('spotify-url-info')

const yturl = document.getElementById('yt-url')

document.getElementById('settings').src="images/settings.png"

document.getElementById('settings').addEventListener('click', () => {
  ipcRenderer.invoke('browserWindow', __dirname + '/settings/settings.html', 430, 600, false, true)
})

const searchbtn = document.getElementById('search')

yturl.addEventListener('input', () => {
  if (yturl.value) {
    searchbtn.innerHTML = '🔍 Search'
  } 
  else {
    searchbtn.innerHTML = '🎲 Random'
  }
})

yturl.addEventListener('keydown', async (e) => {
  if (e.key !== "Enter") return;
  searchbtn.click()
})

searchbtn.addEventListener('click', async () => {
  yturl.setAttribute('readonly', true)
  document.getElementById('wait').classList.remove('hidden')

  const type = checktype(yturl.value)

  let urltoprov
  if (type === 'random') {
    const videos = (await ytsearch.homepage()).map(x => x)
    urltoprov = videos[Math.floor(Math.random()*videos.length)].url
  }
  else if (type === 'video') {
    urltoprov = yturl.value
  }
  else if (type === 'spot-song') {
    const spotinfo = await sul.getData(yturl.value)
    urltoprov = (await ytsearch.searchOne(spotinfo.name + ' - ' + spotinfo.artists[0].name, "video", true)).url
  }
  else if (type === 'playlist') {
    urltoprov = null
  }
  else if (type === 'spot-list') {
    urltoprov = null
  }
  else if (type === 'search') {
    urltoprov = (await ytsearch.searchOne(yturl.value, "video", true)).url
  }

  yturl.removeAttribute('readonly')
  document.getElementById('wait').classList.add('hidden')
  await ipcRenderer.invoke('browserWindow', __dirname + '/convert/convert.html', 650, 480, false, false, urltoprov)
})

function checktype(check) {
  const spotifysong = /^(?:spotify:|(?:https?:\/\/(?:open|play)\.spotify\.com\/))(?:embed)?\/?(album|track)(?::|\/)((?:[0-9a-zA-Z]){22})/
  const spotplaylist = /^(?:spotify:|(?:https?:\/\/(?:open|play)\.spotify\.com\/))(?:embed)?\/?(playlist)(?::|\/)((?:[0-9a-zA-Z]){22})/

  if (!check) return 'random';
  else if (ytsearch.validate(check, 'VIDEO_ID') || ytsearch.validate(check, 'VIDEO')) return 'video';
  else if (ytsearch.validate(check, 'PLAYLIST') || ytsearch.validate(check, 'PLAYLIST_ID')) return 'playlist';
  else if (spotifysong.test(check)) return 'spot-song';
  else if (spotplaylist.test(check)) return 'spot-list';
  return 'search';
}

function opensite(site) {
  require("electron").shell.openExternal(site)
}