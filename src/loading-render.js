setTimeout(() => {
  if(navigator.onLine) {
    document.getElementById('mainText').innerHTML = "💫 Checking for updates...";
    document.getElementById('mainText').style.color = "yellow";

    
  } 
  else {
    document.getElementById('mainText').innerHTML = "❌ Status: offline";
    document.getElementById('mainText').style.color = "red";
  } 
}, 800);
