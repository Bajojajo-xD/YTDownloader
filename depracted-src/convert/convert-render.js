// Buildin with nodejs
const cp = require('child_process');
const fs = require('fs')

// External modules
const { ipcRenderer } = require("electron");
const prettyMilliseconds = require("pretty-ms");
const ytdl = require("ytdl-core");
const ffmpeg = require('ffmpeg-static').replace('app.asar','app.asar.unpacked');

const mp3button = document.getElementById('audio')
const mp4button = document.getElementById('video')
const mp4quality = document.getElementById('mp4-quality')
const mp3speed = document.getElementById('mp3-download')
const mp4speed = document.getElementById('mp4-download')
const playlisthowmany = document.getElementById('playlist-download')
const vidformat = document.getElementById('video-format')
const audformat = document.getElementById('audio-format')

let yt, cache, dwnldloc, videoinfo
const saveDirRegex = /[/\\?%*:|"<>]/g

function buttons(hide) {
  if (hide === true) {
    mp4button.classList.remove('button')
    mp4button.classList.add('hidden')
    mp3button.classList.remove('button')
    mp3button.classList.add('hidden')
    mp4quality.classList.remove('options')
    mp4quality.classList.add('hidden')
    mp4quality.setAttribute('disabled', 'true')
    vidformat.setAttribute('disabled', 'true')
    audformat.setAttribute('disabled', 'true')
  }
  else {
    mp3button.classList.remove('hidden')
    mp4button.classList.remove('hidden')
    mp3button.classList.add('button')
    mp4button.classList.add('button')
    mp4quality.classList.remove('hidden')
    mp4quality.classList.add('options')
    mp4quality.removeAttribute('disabled')
    vidformat.removeAttribute('disabled')
    audformat.removeAttribute('disabled')
  }
}

ipcRenderer.on('from-other-renderer', async (a, yta) => {
  yt = yta
  cache = [...yt.videos];
  if (!yt.playlist && yt.videos[0] !== "fb") {
    try {
      const video = await ytdl.getInfo(yt.videos[0])
      const videoFormats = ytdl.filterFormats(video.formats, 'videoonly');
      let allformats = []
      for (const videoformat of videoFormats) {
        allformats.push(videoformat.qualityLabel)
      }
      const formats = Array.from(new Set(allformats))
      videoinfo = video.videoDetails
      document.getElementById('video-img').src=videoinfo.thumbnails[0].url
      document.getElementById('video-title').innerHTML=videoinfo.title
      document.getElementById('video-length').innerHTML=`Length: ${prettyMilliseconds(videoinfo.lengthSeconds * 1000)}`

      for (const format of formats) {
        const opt = document.createElement('option')
        opt.value = videoFormats.find(x => x.qualityLabel === format).itag
        opt.innerHTML = format
        opt.classList.add('vidformat')
        mp4quality.appendChild(opt)
        if (format.includes('1080p')) {
          opt.setAttribute('selected', true)
        }
      }

      buttons()
    }
    catch (err) {
      document.getElementById('video-img').src='../images/error.png'
      document.getElementById('video-title').innerHTML='Error, cannot parse video'
      document.getElementById('video-length').innerHTML='Not available'
      return;
    }
  } 
  else if (yt.playlist) { 
    document.getElementById('video-img').src=yt.playlist.img ? yt.playlist.img : (yt.playlist.type === 'spotify' ? '../images/spotify.png' : '../images/youtube.png')
    document.getElementById('video-title').innerHTML=yt.playlist.title
    document.getElementById('video-length').innerHTML=`Tracks: ${yt.videos.length}`
    const high = document.createElement('option')
    const low = document.createElement('option')
    high.value = 'highestvideo'
    high.innerHTML = 'Highest'
    mp4quality.appendChild(high)
    low.value = 'lowestvideo'
    low.innerHTML = 'Lowest'
    mp4quality.appendChild(low)
    buttons()
  }
  else {
    document.getElementById('video-img').src='../images/facebook.png'
    document.getElementById('video-title').innerHTML='Facebook videos not supported YET'
    document.getElementById('video-length').innerHTML=`¯\\_(ツ)_/¯`
    return;
  }
})

mp3button.addEventListener('click', async () => {
  if (mp3button.classList.contains('hidden')) return;
  format = audformat.value
  if (!yt.playlist) {
    dwnldloc = await ipcRenderer.invoke('askForDownload', `${videoinfo.title}.${format}`.replace(saveDirRegex, '-'), [{name: format, extensions: [format]}])
  } 
  else {
    dwnldloc = await ipcRenderer.invoke('askForDownload', yt.playlist.title)
  }

  if (dwnldloc.canceled) return;

  savelocation = dwnldloc.filePath
  streamtype = 'audio'
  dwnld()
})

mp4button.addEventListener('click', async () => {
  if (mp4button.classList.contains('hidden')) return;
  format = vidformat.value
  if (!yt.playlist) {
    dwnldloc = await ipcRenderer.invoke('askForDownload', `${videoinfo.title}.${format}`.replace(saveDirRegex, '-'), [{name: format, extensions: [format]}])
  } 
  else {
    dwnldloc = await ipcRenderer.invoke('askForDownload', yt.playlist.title)
  }

  if (dwnldloc.canceled) return;

  savelocation = dwnldloc.filePath
  streamtype = 'video'
  quality = mp4quality.value
  dwnld()
})

let savelocation, format, streamtype, quality
async function dwnld() {
  playlisthowmany.innerHTML = ''
  if (!cache) {
    playlisthowmany.innerHTML = 'Playlist ready';
    buttons()
    return;
  }
  let avi, tracker, showProgress, ffmpegoptions, fileName, progressbarHandle, audio, video, ffmpegProcess
  buttons(true)
  fileName = savelocation.split('.')[0]
  const fileExt = `.${format}`
  if (yt.playlist) {
    playlisthowmany.innerHTML = `Downloaded ${yt.videos.length - cache.length}/${yt.videos.length}`
  }
  const highRes = [
    '4320',
    '2160',
  ]
  if (fileExt === '.avi') avi = true;
  const tempfolder = await ipcRenderer.invoke('tempFolder')

  const ffmpegoptionsaudio = [
    // Remove ffmpeg's console spamming
    '-loglevel', '0', '-hide_banner',
    // Set inputs
    '-i', 'pipe:3',
    // Define output file
    `${tempfolder}/temp${fileExt}`
  ]
    
  const ffmpegoptionsvideoencode = [
    // Remove ffmpeg's console spamming
    '-loglevel', '8', '-hide_banner',
    // Set inputs
    '-i', 'pipe:3',
    '-i', 'pipe:4',
    // Map audio & video from streams
    '-map', '0:a',
    '-map', '1:v',
    // Keep encoding
    '-preset', 'ultrafast', '-tune', 'fastdecode',
    // Define output file
    `${tempfolder}/temp${avi ? '.mkv' : fileExt}`
  ]
    
  const ffmpegoptionsvideo = [
    // Remove ffmpeg's console spamming
    '-loglevel', '8', '-hide_banner',
    // Set inputs
    '-i', 'pipe:3',
    '-i', 'pipe:4',
    // Map audio & video from streams
    '-map', '0:a',
    '-map', '1:v',
    // Keep encoding
    '-c:v', 'copy',
    // Define output file
    `${tempfolder}/temp${avi ? '.mkv' : fileExt}`
  ]

  const progressbarInterval = 1000

  if (streamtype === 'audio') {

    ffmpegoptions = ffmpegoptionsaudio

    tracker = {
      start: Date.now(),
      audio: { downloaded: 0, total: 0 },
    };
    showProgress = () => {
      const toMB = i => (i / 1024 / 1024).toFixed(2);
      mp3speed.innerHTML = `Audio  | ${(tracker.audio.downloaded / tracker.audio.total * 100).toFixed(2)}% processed (${toMB(tracker.audio.downloaded)}MB of ${toMB(tracker.audio.total)}MB)`;
    };

    try {
      audio = ytdl(cache[0], { quality: 'highestaudio' })
        .on('progress', (_, downloaded, total) => {
          tracker.audio = { downloaded, total };
          if (!ffmpegProcess) {
            ffmpegstart()
          }
        });
    } catch (err) {
      dwnld()
    }
  }
  else {

    highRes.some(x => mp4quality.innerHTML.includes(x)) ? ffmpegoptions = ffmpegoptionsvideoencode :  ffmpegoptions = ffmpegoptionsvideo

    tracker = {
      start: Date.now(),
      audio: { downloaded: 0, total: 0 },
      video: { downloaded: 0, total: 0 },
    };
    showProgress = () => {
      const toMB = i => (i / 1024 / 1024).toFixed(2);
      mp3speed.innerHTML = `Audio  | ${(tracker.audio.downloaded / tracker.audio.total * 100).toFixed(2)}% processed (${toMB(tracker.audio.downloaded)}MB of ${toMB(tracker.audio.total)}MB)`;
      mp4speed.innerHTML = `Video  | ${(tracker.video.downloaded / tracker.video.total * 100).toFixed(2)}% processed (${toMB(tracker.video.downloaded)}MB of ${toMB(tracker.video.total)}MB)`;
       // process.stdout.write(`running for: ${((Date.now() - tracker.start) / 1000 / 60).toFixed(2)} Minutes.`);
    };

    try {
      audio = ytdl(cache[0], { quality: 'highestaudio' })
        .on('progress', (_, downloaded, total) => {
          tracker.audio = { downloaded, total };
          if (!ffmpegProcess) {
            ffmpegstart()
          }
        });

      video = ytdl(cache[0], { quality: quality })
        .on('progress', (_, downloaded, total) => {
          tracker.video = { downloaded, total };
          if (!ffmpegProcess) {
            ffmpegstart()
          }
        });
    } catch (err) {
      dwnld()
    }
  }

  progressbarHandle = setInterval(showProgress, progressbarInterval);

  const ffmpegstart = function () {
    try {
      fs.unlinkSync(`${tempfolder}/temp${avi ? '.mkv' : fileExt}`)
    } catch (err) {}
    ffmpegProcess = cp.spawn(ffmpeg, ffmpegoptions, {
      windowsHide: true,
      stdio: [
        // Standard: stdin, stdout, stderr 
        'inherit', 'inherit', 'inherit',
        // Custom: pipe:3
        'pipe', 'pipe'
      ],
    })
    // Link streams
    // FFmpeg creates the transformer streams and we just have to insert / read data
    audio.pipe(ffmpegProcess.stdio[3]);
    if (streamtype === 'video') {
      video.pipe(ffmpegProcess.stdio[4]);
    }

    ffmpegProcess.on('close', async () => {
      clearInterval(progressbarHandle)
      // Cleanup
      if (yt.playlist) {
        try {fs.mkdirSync(fileName)} catch (err) {} 
        fileName = savelocation.split('.')[0] + '/' + `${yt.videos.length - cache.length + 1}. ${(await ytdl.getBasicInfo(cache[0])).videoDetails.title.replace(saveDirRegex, '-')}`
      }
      fs.copyFileSync(`${tempfolder}/temp${avi ? '.mkv' : fileExt}`, fileName + fileExt)
      fs.unlinkSync(`${tempfolder}/temp${avi ? '.mkv' : fileExt}`)
      mp3speed.innerHTML = '';
      mp4speed.innerHTML = '';
  
      if (!yt.playlist) {
        playlisthowmany.innerHTML = streamtype === 'video' ? 'Video ready' : 'Audio ready';
        playlisthowmany.setAttribute('style', 'color: greenyellow; cursor: pointer')
        buttons()
        return;
      }    
      cache.shift()
      return dwnld()
    });
  }
}

document.getElementById('help').addEventListener('click', async () => {
  require('electron').shell.openExternal('https://github.com/Bajojajo-xD/YTDownloader/blob/main/HELP.md#-downloader')
})

playlisthowmany.addEventListener('click', async () => {
  if (!playlisthowmany.getAttribute('style')) return;
  try {
    require('electron').shell.openPath(dwnldloc.filePath)
  } catch (err) {}
})

document.getElementById('exit').addEventListener('click', async () => {
  ipcRenderer.invoke('destroyWindow')
})