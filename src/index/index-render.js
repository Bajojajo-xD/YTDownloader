const { ipcRenderer } = require('electron')
const path = require('path');

const isDarkmode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
if (isDarkmode){
  document.getElementById('toggle-dark-mode').src="../images/moon.png"
}
else {
  document.getElementById('toggle-dark-mode').src="../images/sun.png"
}

document.getElementById('toggle-dark-mode').addEventListener('click', async () => {
  const isDarkMode = await ipcRenderer.invoke('dark-mode:toggle')
  document.getElementById('toggle-dark-mode').src = isDarkMode ? '../images/moon.png' : '../images/sun.png'
})


document.getElementById('versions-list').addEventListener('click', () => {
  ipcRenderer.invoke('browserWindow', path.join(__dirname, '../', 'engines/','engines.html'), 555, 600, false, false)
})

document.getElementById('update-btn').addEventListener('click', () => {
  ipcRenderer.invoke('browserWindow', path.join(__dirname, '../', 'updater/','updater.html'), 500, 600, false, false)
})