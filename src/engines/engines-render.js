const { ipcRenderer } = require("electron");

const isDarkmode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

if (isDarkmode){
  document.getElementById('nodejs-img').src="../images/nodejs-light.png"
}
else {
  document.getElementById('nodejs-img').src="../images/nodejs-dark.png"
}
document.getElementById('nodejs').innerHTML=process.versions.node
document.getElementById('nodejs-img').addEventListener('click', () => {
  require("electron").shell.openExternal("https://nodejs.org")
})

document.getElementById('electron-img').src="../images/electron.png"
document.getElementById('electron').innerHTML=process.versions.electron
document.getElementById('electron-img').addEventListener('click', () => {
  require("electron").shell.openExternal("https://www.electronjs.org/")
})

document.getElementById('chromium-img').src="../images/chromium.png"
document.getElementById('chromium').innerHTML=process.versions.chrome
document.getElementById('chromium-img').addEventListener('click', () => {
  require("electron").shell.openExternal("https://www.chromium.org/Home")
})

document.getElementById('exit').addEventListener('click', () => {
  ipcRenderer.invoke('destroyWindow')
})
