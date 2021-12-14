const { ipcRenderer } = require("electron");
const ytpl = require('ytpl')
const ytdl = require('ytdl-core')
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
  if (yturl.getAttribute('readonly')) return;
  yturl.setAttribute('readonly', true)
  document.getElementById('wait').classList.remove('hidden')

  const type = checktype(yturl.value)
  const info = document.getElementById('waitinfo')

  let urltoprov, isPlaylist
  if (type === 'random') {
    info.innerHTML = 'Type: RANDOM, Initializing search...'
    const videos = (await ytsearch.homepage()).map(x => x)
    urltoprov = [videos[Math.floor(Math.random()*videos.length)].url]
  }
  else if (type === 'video') {
    info.innerHTML = 'Type: VIDEO, Found'
    urltoprov = [yturl.value]
  }
  else if (type === 'spot-song') {
    info.innerHTML = 'Type: SPOTIFY SONG, Getting data...'
    const spotinfo = await sul.getData(yturl.value)
    urltoprov = [(await ytsearch.searchOne(spotinfo.name + ' - ' + spotinfo.artists[0].name, "video", true)).url]
  }
  else if (type === 'playlist') {
    info.innerHTML = 'Type: YOUTUBE PLAYLIST, Getting data... '
    const yttracks = await ytpl(yturl.value)
    isPlaylist = { 'img': yttracks.thumbnail, 'title': yttracks.title, 'type': 'youtube' }
    let tracks = []
    for (const yttrack of yttracks.items) {
      const track = yttrack.url
      tracks.push(track)
    }
    urltoprov = tracks
  }
  else if (type === 'spot-list') {
    info.innerHTML = 'Type: SPOTIFY PLAYLIST, Searching... '
    const spottracks = await sul.getTracks(yturl.value)
    isPlaylist = { 'title': `Spotify ${spottracks.length} items playlist`, 'type': 'spotify' }
    let tracks = [], cache = spottracks.length
    for (const spottrack of spottracks) {
      info.innerHTML = `Type: SPOTIFY PLAYLIST, Searching... ${spottracks.length - cache}/${spottracks.length}`
      const track = (await ytsearch.searchOne(spottrack.name + ' - ' + spottrack.artists[0].name, "video", true)).url
      tracks.push(track)
      cache = cache - 1
    }
    urltoprov = tracks
  }
  else if (type === 'fb-vid') {
    info.innerHTML = 'Type: FACEBOOK VIDEO, Getting data...'
    urltoprov = ["fb"]
  }
  else if (type === 'search') {
    info.innerHTML = 'Type: YOUTUBE SEARCH, Searching... '
    const urltoprovtemp = (await ytsearch.searchOne(yturl.value, "video", true))
    if (urltoprovtemp) {
      urltoprov = [urltoprovtemp.url]
    } else {
      info.innerHTML = 'NOT FOUND'
      yturl.removeAttribute('readonly')
      document.getElementById('wait').classList.add('hidden')
      return;
    }
  }

  yturl.removeAttribute('readonly')
  document.getElementById('wait').classList.add('hidden')
  info.innerHTML = ''
  await ipcRenderer.invoke('browserWindow', __dirname + '/convert/convert.html', 750, 480, false, true, {'videos': urltoprov, 'playlist': isPlaylist})
})

function checktype(check) {
  const spotifysong = /^(?:spotify:|(?:https?:\/\/(?:open|play)\.spotify\.com\/))(?:embed)?\/?(album|track)(?::|\/)((?:[0-9a-zA-Z]){22})/
  const spotplaylist = /^(?:spotify:|(?:https?:\/\/(?:open|play)\.spotify\.com\/))(?:embed)?\/?(playlist)(?::|\/)((?:[0-9a-zA-Z]){22})/
  const facebookvideo = /^https?:\/\/www\.facebook\.com.*\/(video(s)?|watch|story)(\.php?|\/).+$/gm

  if (!check) return 'random';
  else if (ytpl.validateID(check)) return 'playlist';
  else if (ytdl.validateID(check) || ytdl.validateURL(check)) return 'video';
  else if (spotifysong.test(check)) return 'spot-song';
  else if (spotplaylist.test(check)) return 'spot-list';
  else if (facebookvideo.test(check)) return 'fb-vid';
  return 'search';
}

function opensite(site) {
  require("electron").shell.openExternal(site)
}