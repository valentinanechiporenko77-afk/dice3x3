if(window.__diag)window.__diag('JS: app-1');
// ==== Платформенные SDK: VK + Яндекс ====
var VK_APP_ID='54874968'; // app_id VK-приложения
var VK_BRIDGE=(typeof window.vkbridge!=='undefined');
var YSDK=null;
function isVK(){ return VK_BRIDGE || (navigator.userAgent && navigator.userAgent.indexOf('VK_')!==-1); }
function initSDK(){
  if(isVK()){
    // на платформе VK — VK Bridge уже есть
    goToMenu();
  } else if(window.YaGames){
    window.YaGames.init().then(function(ys){
      YSDK=ys;
      applySDKLanguage();
      goToMenu();
    }).catch(function(){ goToMenu(); });
  } else {
    goToMenu();
  }
}
function initYaGames(){
  if(window.YaGames){
    window.YaGames.init().then(function(ys){
      YSDK=ys;
      // подтягиваем язык игрока из SDK Яндекс Игр
      applySDKLanguage();
      // показать кнопку «продолжить» после загрузки
      goToMenu();
    }).catch(function(){ goToMenu(); });
  } else {
    // запуск вне Яндекс Игр — сразу меню
    goToMenu();
  }
}
function applySDKLanguage(){
  try{
    if(YSDK && YSDK.environment && YSDK.environment.i18n && YSDK.environment.i18n.lang){
      var l=YSDK.environment.i18n.lang; // 'ru' | 'en' | ...
      // язык игры пока фиксирован русский; при 'en' можно добавить перевод позже
      document.documentElement.lang = (l==='en') ? 'en' : 'ru';
    }
  }catch(e){}
}
function goToMenu(){
  showScreen('screen-menu');
}
// лидерборд: сохранить результат
function submitScore(val){
  if(YSDK && YSDK.getLeaderboards){
    try{
      YSDK.getLeaderboards().then(function(lb){ lb.setLeaderboardScore('top', val); }).catch(function(){});
    }catch(e){}
  }
}

var boardP1 = [];
var boardP2 = [];
var turn = 'p1';
var currentDice = null;
var busy = false;
var gameScore = 0;
var mode = 'player';

function getCoins(){ return parseInt(localStorage.getItem('dice_coins')||'0',10); }
function addCoins(n){ var v=Math.max(0,getCoins()+n); localStorage.setItem('dice_coins',String(v)); return v; }

// ==== Музыка за монеты (через Web Audio API, без внешних треков) ====
var audioCtx=null, musicPlaying=false, musicTimer=null;
var MUSIC_COST=20; // монет за включение музыки
function ensureAudio(){
  if(!audioCtx){
    try{ audioCtx=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){}
  }
  return audioCtx;
}
function playNote(freq, time, dur){
  var ctx=ensureAudio(); if(!ctx) return;
  var o=ctx.createOscillator(), g=ctx.createGain();
  o.type='sine'; o.frequency.value=freq;
  g.gain.setValueAtTime(0, ctx.currentTime+time);
  g.gain.linearRampToValueAtTime(0.18, ctx.currentTime+time+0.05);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+time+dur);
  o.connect(g); g.connect(ctx.destination);
  o.start(ctx.currentTime+time);
  o.stop(ctx.currentTime+time+dur);
}
function playMelody(){
  // весёлая простая мелодия (минорная гамма)
  var notes=[[523,0.0],[659,0.3],[784,0.6],[1047,0.9],[784,1.2],[880,1.5]];
  notes.forEach(function(nx){ playNote(nx[0], nx[1], 0.4); });
}
function toggleMusic(){
  if(musicPlaying){
    // выключить
    stopMusic();
    return;
  }
  if(getCoins()<MUSIC_COST){ alert('Не хватает монет! Музыка стоит '+MUSIC_COST+' монет. Заработай их за победы.'); return; }
  addCoins(-MUSIC_COST);
  document.getElementById('coinVal').textContent=getCoins();
  musicPlaying=true;
  document.getElementById('musicBtn').classList.add('playing');
  document.getElementById('diceLabel').textContent='🎵 Музыка играет! (стоит '+MUSIC_COST+' монет)';
  // играет 20 секунд, потом сама выключается
  playMelody();
  var repeat=setInterval(function(){ if(musicPlaying) playMelody(); }, 2200);
  musicTimer=setTimeout(function(){ clearInterval(repeat); stopMusic(); }, 20000);
}
function stopMusic(){
  musicPlaying=false;
  document.getElementById('musicBtn').classList.remove('playing');
  if(musicTimer){ clearTimeout(musicTimer); musicTimer=null; }
  document.getElementById('diceLabel').textContent='Твой ход: брось кость';
}

function showScreen(id){
  var screens=document.querySelectorAll('.screen');
  for(var i=0;i<screens.length;i++) screens[i].classList.remove('active');
  document.getElementById(id).classList.add('active');
}