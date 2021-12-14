const { ipcRenderer } = require("electron");

const updaterinfo = document.getElementById('updater-info')
const updaterimg = document.getElementById('updater-img')
const downloadbtn = document.getElementById('download-btn')
const restartbtn = document.getElementById('restart-btn')

ipcRenderer.invoke('app_version').then(version => {
  document.getElementById('current-version').innerHTML = version;
})

updaterinfo.innerText = '✴️ Checking for updates';
updaterimg.src='../images/checking-for-update.gif';

ipcRenderer.invoke('check-for-updates')

ipcRenderer.on('update_error', (a, err) => {
  updaterinfo.innerText = '❌ Error checking for updates';
  updaterimg.src='../images/update-error.png';
});

ipcRenderer.on('update_not_available', () => {
  updaterinfo.innerText = "✅ You're up to date";
  updaterimg.src='../images/update-up-to-date.png';
});

let version
ipcRenderer.on('update_available', (a, info) => {
  version = info.version
  updaterinfo.innerText = "🌐 Update " + info.version + ", click to download";
  updaterimg.src='../images/update-download.png';
  downloadbtn.classList.add('btn')
  downloadbtn.classList.remove('hidden');
});

ipcRenderer.on('update_progress', (a, info, progress) => {
  updaterinfo.innerText = progress.percent > 0 ? `🔰 Update ${info.version} downloading: ${Math.round(progress.percent)}%` : `💮 Update ${info.version} initializing...`
  updaterimg.src='../images/update-download.png';
});

ipcRenderer.on('update_ready', (a, info) => {
  updaterinfo.innerText = "🌀 Update " + info.version + " is ready to be installed";
  updaterimg.src='../images/update-ready.png';
  restartbtn.classList.add('btn')
  restartbtn.classList.remove('hidden');
});

restartbtn.addEventListener('click', () => {
  if (restartbtn.classList.contains('hidden')) return;
  ipcRenderer.invoke('restart_and_update');
})

downloadbtn.addEventListener('click', () => {
  if (downloadbtn.classList.contains('hidden')) return;
  ipcRenderer.invoke('download_updates')
  document.getElementById('updater-info').innerText = `💮 Update ${version} initializing...`;
  document.getElementById('updater-img').src='../images/update-download.png';
  downloadbtn.classList.add('hidden');
  downloadbtn.classList.remove('btn');
})  

document.getElementById('exit').addEventListener('click', () => {
  ipcRenderer.invoke('destroyWindow')
})