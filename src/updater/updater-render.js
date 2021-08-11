const { ipcRenderer } = require("electron");

ipcRenderer.invoke('app_version').then(version => {
  document.getElementById('current-version').innerHTML = version;
})

document.getElementById('updater-info').innerText = 'Checking for updates';
document.getElementById('updater-img').src='../images/checking-for-update.gif';

ipcRenderer.invoke('check-for-updates')

ipcRenderer.on('update_error', (a, err) => {
  document.getElementById('updater-info').innerText = 'Error checking for updates: ' + err;
  document.getElementById('updater-img').src='../images/update-error.png';
});

ipcRenderer.on('update_not_available', () => {
  document.getElementById('updater-info').innerText = "You're up to date";
  document.getElementById('updater-img').src='../images/update-up-to-date.png';
});

let version
ipcRenderer.on('update_available', (a, info) => {
  version = info.version
  document.getElementById('updater-info').innerText = "Update " + info.version + ", click to download";
  document.getElementById('updater-img').src='../images/update-download.png';
  document.getElementById('download').classList.remove('hidden');
});

ipcRenderer.on('update_progress', (a, info, progress) => {
  document.getElementById('updater-info').innerText = parseInt(progress) ? `Update ${info.version} downloading: ${Math.round(progress.percent)}%` : `Update ${info.version} initializing...`
  document.getElementById('updater-img').src='../images/update-download.png';
  document.getElementById('download').classList.add('hidden');
});

ipcRenderer.on('update_ready', (a, info) => {
  document.getElementById('updater-info').innerText = "Update " + info.version + " is ready to be installed";
  document.getElementById('updater-img').src='../images/update-ready.png';
  document.getElementById('restart').classList.remove('hidden');
});

function restartApp() {
  ipcRenderer.invoke('restart_and_update');
}

document.getElementById('download-updates').addEventListener('click', () => {
  ipcRenderer.invoke('download_updates')
  document.getElementById('updater-info').innerText = `Update ${version} initializing...`;
  document.getElementById('updater-img').src='../images/update-download.png';
  document.getElementById('download').classList.add('hidden');
})  

document.getElementById('exit').addEventListener('click', () => {
  ipcRenderer.invoke('destroyWindow')
})