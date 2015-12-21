function vectLeng(v) {
  return Math.sqrt(Math.pow(v[0], 2) + Math.pow(v[1], 2));
}

function vectAngle(v1, v2) {
  return Math.acos((v1[0]*v2[0] + v1[1] * v2[1]) / (vectLeng(v1) * vectLeng(v2)));
}

function vectDist(v1, v2) {
  return vectLeng([Math.abs(v1[0] - v2[0]), Math.abs(v1[1] - v2[1])]);
}

function timeToAng(minutes) {
  return minutes/30 * Math.PI;
}

function timeAngToVect(ang) {
  return [-Math.sin(ang), Math.cos(ang)];
}

function roundToDigits(val, digits) {
  return Math.round(val * Math.pow(10, digits)) / Math.pow(10, digits);
}

function makeToDisplayString(val) {   
  return (val < 10 ? "0" : "") + Math.floor(val);   
}

var ctx = null;
var clockcanvas = null;
var currentTime = 15 * 60;
var nextUpdateHandle = null;

var primaryDark = "#212121";
var primaryLight = "#F44336";
var alarmSound = new Audio('gong.wav');
var radius = 1000;
var center = [radius + 50, radius + 50];
  

function setShadow() {
  ctx.shadowColor = primaryDark;
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 5;
}

function setOrthogonalShadow(ang) {
  ctx.shadowColor = "black";
  ctx.shadowBlur = 20;
  ctx.shadowOffsetX = timeAngToVect(ang - Math.PI * 1/4)[0] * 10;
  ctx.shadowOffsetY = timeAngToVect(ang - Math.PI * 1/4)[1] * 10;
}


function drawTicks() {
  ctx.save();
  var ang;
  ctx.fillStyle = primaryDark;

  for (var i = 0; i < 60; ++i) {
    ang = timeToAng(i);
    ctx.save();
    ctx.translate(center[0] + Math.sin(ang) * radius, center[1] - Math.cos(ang) * radius);
    ctx.rotate(ang);
    setShadow();
    ctx.fillRect(0, 0, 10, 100);
    ctx.restore();
  }
  ctx.restore();
}

function drawBack() {
  ctx.save();

  ctx.strokeStyle = primaryDark;
  ctx.beginPath();
  ctx.arc(center[0], center[1], radius, 0, Math.PI * 2);
  ctx.lineWidth = 10;
  ctx.fillStyle = "white"
  setShadow();
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.stroke();

  ctx.restore();
}

function drawTime(minutes) {
  ctx.save();
  var ang = timeToAng(minutes);
  var angOffset = 1.5 * Math.PI;

  ctx.beginPath();
  ctx.moveTo(center[0], center[1]);
  ctx.lineTo(center[0], center[1] - radius * 0.95);

  ctx.arc(center[0], center[1], radius * 0.95, angOffset, angOffset - Math.min(ang, Math.PI * 2), true);
  ctx.closePath();

  ctx.fillStyle = primaryLight;
  setShadow();
  ctx.fill();
  
  ctx.beginPath();
  ctx.moveTo(center[0], center[1]);

  ctx.lineTo(center[0] + timeAngToVect(ang)[0] * radius * 0.95, 
             center[1] - timeAngToVect(ang)[1] * radius * 0.95);
  ctx.lineWidth = 5;
  ctx.strokeStyle = primaryDark;
  setOrthogonalShadow(ang);
  ctx.stroke();

  ctx.restore();
}

function drawClock(time) {
  drawBack();
  drawTime(time/60);
  drawTicks();
}


function setDisplay(time) {
  var hours = makeToDisplayString(time / 3600);
  var minutes = makeToDisplayString(time / 60 % 60);
  var seconds = makeToDisplayString(time % 60);

  document.querySelector("#timedisplay > h1").innerHTML = hours + ":" + minutes + ":" + seconds;
}

function updateTime() {
  drawClock(currentTime);
  setDisplay(currentTime);

  if(nextUpdateHandle !== null) {
    clearTimeout(nextUpdateHandle);
  }

  if(currentTime > 0) {
    nextUpdateHandle = setTimeout(function () {
      currentTime -= 1;  
      updateTime();
    }, 1000);
  } else {
    currentTime = 0;
    alarmSound.play();
    drawClock(currentTime);
    setDisplay(currentTime);
  }
}


function plusOne() {
  currentTime = Math.min(60 * 5 * 60, currentTime + 60);
  updateTime();
}

function minusOne() {
  currentTime = Math.max(0, currentTime - 60);
  updateTime();
}

function resetTime() {
  currentTime = 0;
  updateTime();
}

function changeColor() {
  var newColor = document.getElementById("colorpicker").value;
  console.log(newColor);

  document.querySelector('.page-content').style.color = newColor;
  var btns = document.querySelectorAll('.timebtn');
  for (i = 0; i < btns.length; i++) {
      btns[i].style.backgroundColor = newColor;
  }
  primaryLight = newColor;
  updateTime();
}

function offset(element){
    var body = document.body,
        win = document.defaultView,
        docElem = document.documentElement,
        box = document.createElement('div');
    box.style.paddingLeft = box.style.width = "1px";
    body.appendChild(box);
    var isBoxModel = box.offsetWidth == 2;
    body.removeChild(box);
    box = element.getBoundingClientRect();
    var clientTop  = docElem.clientTop  || body.clientTop  || 0,
        clientLeft = docElem.clientLeft || body.clientLeft || 0,
        scrollTop  = win.pageYOffset || isBoxModel && docElem.scrollTop  || body.scrollTop,
        scrollLeft = win.pageXOffset || isBoxModel && docElem.scrollLeft || body.scrollLeft;
    return {
        top : box.top  + scrollTop  - clientTop,
        left: box.left + scrollLeft - clientLeft};
}

function calcNewTime(ev) {
//  ev.srcEvent.preventDefault();

  // Cross browser pageX
  e = ev.srcEvent || window.event;
  var pageX = e.pageX;
  var pageY = e.pageY;
  if (pageX === undefined) {
      if(e.clientX === undefined) {
        e.clientX = e.changedTouches[0].clientX;
        e.clientY = e.changedTouches[0].clientY;
      }
      
      pageX = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
      pageY = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
  }

  timeInMinutes = currentTime/60;

  var pointerVect = [2 * ((pageX - offset(clockcanvas).left) / clockcanvas.clientWidth - 0.5), 
                    -2 * ((pageY - offset(clockcanvas).top) / clockcanvas.clientHeight - 0.5)];

  var indVect = [timeAngToVect(timeToAng(timeInMinutes))[0], timeAngToVect(timeToAng(timeInMinutes))[1]];

  var angleRadians = vectAngle(pointerVect, indVect);


  var addTime = roundToDigits(timeInMinutes + angleRadians * 30 / Math.PI, 2);
  var addVect = [timeAngToVect(timeToAng(addTime))[0], timeAngToVect(timeToAng(addTime))[1]];
  var subTime = roundToDigits(timeInMinutes - angleRadians * 30 / Math.PI, 2);
  var subVect = [timeAngToVect(timeToAng(subTime))[0], timeAngToVect(timeToAng(subTime))[1]];

  if(vectDist(addVect, pointerVect) < vectDist(subVect, pointerVect)) {
    currentTime = Math.min(5 * 60 * 60, addTime * 60);    
  } else if(vectDist(addVect, pointerVect) > vectDist(subVect, pointerVect)) {
    currentTime = Math.max(0, subTime * 60);
  }

  updateTime();
}

function setupHammer() {
  var canvas = document.getElementById('clockcanvas');
  ctx = canvas.getContext("2d");
  clockcanvas = document.getElementById("clockcanvas");
  var hammertime = new Hammer(clockcanvas);

  hammertime.get('pan').set({ direction: Hammer.DIRECTION_ALL });
  
  hammertime.on('panmove', function(ev) {
    calcNewTime(ev);
  });
  hammertime.on('tap', function(ev) {
    calcNewTime(ev);
  });

  updateTime();
}