const { ipcRenderer } = require("electron");

const isDarkmode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

if (isDarkmode) document.getElementById('nodejs-img').src="../images/nodejs-light.png";
else document.getElementById('nodejs-img').src="../images/nodejs-dark.png";
document.getElementById('nodejs').innerHTML=process.versions.node

document.getElementById('electron-img').src="../images/electron.png"
document.getElementById('electron').innerHTML=process.versions.electron

document.getElementById('chromium-img').src="../images/chromium.png"
document.getElementById('chromium').innerHTML=process.versions.chrome

function opensite(site) {
  require("electron").shell.openExternal(site)
}

document.getElementById('exit').addEventListener('click', () => {
  ipcRenderer.invoke('destroyWindow')
})
