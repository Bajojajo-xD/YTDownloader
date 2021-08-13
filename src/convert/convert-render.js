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

function buttons (hide) {
  if (hide === true) {
    mp4button.classList.remove('button')
    mp4button.classList.add('hidden')
    mp3button.classList.remove('button')
    mp3button.classList.add('hidden')
    mp4quality.classList.remove('options')
    mp4quality.classList.add('hidden')
    mp4quality.setAttribute('disabled', 'true')
  }
  else {
    mp3button.classList.remove('hidden')
    mp4button.classList.remove('hidden')
    mp3button.classList.add('button')
    mp4button.classList.add('button')
    mp4quality.classList.remove('hidden')
    mp4quality.classList.add('options')
    mp4quality.removeAttribute('disabled')
  }
}

let yturl, videoinfo, loc, ffmpegProcess
ipcRenderer.on('from-other-renderer', async (a, yt) => {
  yturl = yt 

  const error = function(err) {
    document.getElementById('video-img').src='../images/error.png'
    document.getElementById('video-title').innerHTML='Error, cannot parse video'
    document.getElementById('video-length').innerHTML='Not available'
    console.log(err)
    return;
  }

  try {
    const parseerror = setTimeout(() => {
      error()
    }, 10000);
    const video = await ytdl.getInfo(yt)
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
      document.getElementById('mp4-quality').appendChild(opt)
      if (format.includes('1080p')) {
        opt.setAttribute('selected', true)
      }
    }

    buttons()
    clearTimeout(parseerror);
  } 
  catch (err) {
    error(err)
  }
})

mp3button.addEventListener('click', () => {
  if (mp3button.classList.contains('hidden')) return;
  downloadvideo('audio')
})

mp4button.addEventListener('click', () => {
  if (mp3button.classList.contains('hidden')) return;
  downloadvideo('video', document.getElementById('mp4-quality').value, document.getElementById('mp4-quality').innerHTML, 'ultrafast')
})

async function downloadvideo (format, quality, res, encodespeed) {

  loc = await ipcRenderer.invoke('askForDownload', `${videoinfo.title}${format === 'audio' ? '.mp3' : '.mkv'}`, format === 'audio' ? [{name: 'MP3 File (recommended)', extensions: ['mp3']}, {name: 'M4A File', extensions: ['m4a']}, {name: 'WAV File (huge size)', extensions: ['wav']}, {name: 'Any File (unsupported)', extensions: ['*']}] : [{name: 'MKV File (recommended)', extensions: ['mkv']}, {name: 'MP4 File', extensions: ['mp4']}, {name: 'AVI File (mkv => avi)', extensions: ['avi']}, {name: 'Any File (unsupported)', extensions: ['*']}])

  if (loc.canceled) return;
  mp3speed.removeAttribute('style')
  buttons(true)
    
  const fileName = loc.filePath.split('.')[0]
  const fileExt = `.${loc.filePath.split('.')[1]}`
  let avi, tracker, showProgress, progressbarHandle = null, audio, video, ffmpegoptions

  if (fileExt === '.avi') avi = true;

  const tempfolder = await ipcRenderer.invoke('tempFolder')

  const ffmpegoptionsaudio = [
    // Remove ffmpeg's console spamming
    '-loglevel', '0', '-hide_banner',
    // Set inputs
    '-i', 'pipe:3',
    // Define output file
    `${tempfolder}/temp${avi ? '.mkv' : fileExt}`
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
    '-preset', encodespeed, '-tune', 'fastdecode',
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
  if (format === 'audio') {
    tracker = {
      start: Date.now(),
      audio: { downloaded: 0, total: 0 },
    }
    showProgress = () => {
      const toMB = i => (i / 1024 / 1024).toFixed(2);
      mp3speed.innerHTML = `Audio  | ${(tracker.audio.downloaded / tracker.audio.total * 100).toFixed(2)}% processed (${toMB(tracker.audio.downloaded)}MB of ${toMB(tracker.audio.total)}MB)`;
    };
    
    audio = ytdl(yturl, { filter: 'audioonly', quality: 'highestaudio' })
      .on('progress', (_, downloaded, total) => {
        if (!ffmpegProcess) {
          ffmpegstart()
        }
        tracker.audio = { downloaded, total };
      });
      
    ffmpegoptions = ffmpegoptionsaudio
   }
  else {
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

    audio = ytdl(yturl, { filter: 'audioonly', quality: 'highestaudio' })
      .on('progress', (_, downloaded, total) => {
        tracker.audio = { downloaded, total };
        if (!ffmpegProcess) {
          ffmpegstart()
        }
      });

    video = ytdl(yturl, { quality: quality })
      .on('progress', (_, downloaded, total) => {
        tracker.video = { downloaded, total };
      });
      
    if (highRes.some(x => res.includes(x)) || (fileExt !== '.mp4' && fileExt !== '.mkv' && !avi)) {
      ffmpegoptions = ffmpegoptionsvideoencode
    } else {
      ffmpegoptions = ffmpegoptionsvideo
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
    if (format === 'video') {
      video.pipe(ffmpegProcess.stdio[4]);
    }
  
    ffmpegProcess.on('close', async () => {
      // Cleanup
      clearInterval(progressbarHandle);
      try {
        await ffmpegProcess.kill()
      } catch (err) {}
      try {
        fs.copyFileSync(`${tempfolder}/temp${avi ? '.mkv' : fileExt}`, fileName + fileExt)
        fs.unlinkSync(`${tempfolder}/temp${avi ? '.mkv' : fileExt}`)
      } catch (err) {
        ipcRenderer.invoke('errorDialog', 'Save error', 'Can\'t save, unsupported format')
  
        mp3speed.innerHTML = '';
        mp4speed.innerHTML = '';
        buttons()
        return;
      }
  
      mp3speed.innerHTML = format === 'video' ? 'Video ready' : 'Audio ready';
      mp3speed.setAttribute('style', 'color: greenyellow; cursor: pointer')
      mp4speed.innerHTML = '';
  
      buttons()
    });
  }
}

const highRes = [
  '4320',
  '2160',
]

document.getElementById('help').addEventListener('click', async () => {
  require('electron').shell.openExternal('https://github.com/Bajojajo-xD/YTDownloader/blob/main/HELP.md#-downloader')
})

mp3speed.addEventListener('click', async () => {
  if (mp3speed.innerHTML !== 'Video ready' && mp3speed.innerHTML !== 'Audio ready') return;
  try {
    require('electron').shell.openPath(loc.filePath)
  } catch (err) {}
})

document.getElementById('exit').addEventListener('click', async () => {
  try {
    await ffmpegProcess.kill()
    ipcRenderer.invoke('destroyWindow')
  } catch (err) {
    ipcRenderer.invoke('destroyWindow')
  }
})

process.on('exit', () => {
  ffmpegProcess.kill()
})