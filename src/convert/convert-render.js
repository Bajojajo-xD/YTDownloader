const { ipcRenderer } = require("electron");
const prettyMilliseconds = require("pretty-ms");
const ytdl = require("ytdl-core");
const fs = require('fs')

ipcRenderer.on('from-other-renderer', async (a, yturl) => {
  const videoinfo = await ytdl.getInfo(yturl)
  document.getElementById('video-img').src=videoinfo.videoDetails.thumbnails[0].url
  document.getElementById('video-title').innerHTML=videoinfo.videoDetails.title
  document.getElementById('video-length').innerHTML=prettyMilliseconds(videoinfo.videoDetails.lengthSeconds * 1000)

  ipcRenderer.invoke('askForDownload', `${videoinfo.videoDetails.title}.mp4`).then(location => {
    if (location.canceled) return;
    ytdl(yturl, {quality: 'highest'}).pipe(fs.createWriteStream(location.filePath))
  })
})

