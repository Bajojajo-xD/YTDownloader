const { ipcRenderer } = require("electron");

document.getElementById('settings').src="images/settings.png"

document.getElementById('settings').addEventListener('click', () => {
  ipcRenderer.invoke('browserWindow', __dirname + '/settings/settings.html', 430, 600, false, true)
})

function opensite(site) {
  require("electron").shell.openExternal(site)
}