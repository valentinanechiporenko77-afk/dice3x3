if(window.__diag)window.__diag('JS: app-4');
function foeFreeCells(){
  var out=[];
  for(var i=0;i<9;i++) if(!boardP2[i]) out.push(i);
  return out;
}

function botTurn(){
  if(gameOver) return;
  if(anyBoardFull()){ endGame(); return; }
  var d=document.getElementById('dice');
  d.textContent='?';
  document.getElementById('diceLabel').textContent='Бот бросает…';
  var n=1+Math.floor(Math.random()*6);
  setTimeout(function(){
    d.innerHTML=diceGlyph(n);
    // бот ставит в свой (нижний) квадрат — в столбец, где уже есть такое число (для дубля), иначе случайно
    var free=foeFreeCells();
    var idx=-1;
    if(free.length>0){
      // ищем столбец с дублем
      var dupCol=-1;
      for(var cc=0;cc<3 && dupCol<0;cc++){
        var hasDup=false;
        for(var jj=cc;jj<9;jj+=3){ if(boardP2[jj] && boardP2[jj].v===n) hasDup=true; }
        // в этом столбце уже есть n и есть хотя бы одна свободная клетка
        if(hasDup){ for(var kk=cc;kk<9;kk+=3){ if(boardP2[kk]===null){ dupCol=cc; break; } } }
      }
      if(dupCol>=0){
        for(var j2=dupCol;j2<9;j2+=3){ if(boardP2[j2]===null){ idx=j2; break; } }
      } else {
        idx=free[Math.floor(Math.random()*free.length)];
      }
      if(!boardP2[idx]) boardP2[idx]={v:n, dup:1};
      else { var c=boardP2[idx]; if(c.v===n)c.dup+=1; else boardP2[idx]={v:n, dup:1}; }
      // если в столбце уже было такое число — дубль даёт ещё копию
      var bc=idx%3, hasOther=false;
      for(var qq=bc;qq<9;qq+=3){ if(qq!==idx && boardP2[qq] && boardP2[qq].v===n) hasOther=true; }
      if(hasOther && boardP2[idx]) boardP2[idx].dup+=1;
    }
    // стирание у тебя (верхний): только в том столбце, куда бот поставил кость, и только цифры n
    if(idx>=0){
      var bc2=idx%3;
      for(var i3=bc2;i3<9;i3+=3){
        if(boardP1[i3] && boardP1[i3].v===n){
          var lost=boardP1[i3].v*boardP1[i3].dup;
          gameScore=Math.max(0, gameScore-lost);
          boardP1[i3]=null;
        }
      }
    }
    renderBoards();
    // игра заканчивается, как только любой квадрат заполнен первым
    if(anyBoardFull()){ endGame(); return; }
    turn='p1';
    document.getElementById('rollBtn').disabled=false;
    document.getElementById('diceLabel').textContent='Твой ход: брось кость';
  },800);
}

function endGame(){
  if(gameOver) return;
  gameOver=true;
  // подсчёт очков: сумма чисел своего квадрата + накопленные бонусы за стирания
  var s1=sumOf(boardP1), s2=sumOf(boardP2);
  var name1 = mode==='player' ? 'Игрок 1' : 'Ты';
  var name2 = mode==='player' ? 'Игрок 2' : 'Противник';
  var res=document.getElementById('result');
  var silP1=document.getElementById('silP1'), silP2=document.getElementById('silP2');
  var stP1=document.getElementById('silP1State'), stP2=document.getElementById('silP2State');
  // сброс анимаций
  silP1.classList.remove('win','lose');
  silP2.classList.remove('win','lose');
  stP1.textContent='игрок'; stP2.textContent='игрок';
  document.getElementById('rollBtn').disabled=true;
  if(s1>s2){
    res.className='result win';
    res.textContent='🎉 '+name1+' победил! Сумма '+s1+' > '+s2+'. Очки: '+gameScore;
    addCoins(3);
    silP1.classList.add('win'); stP1.textContent='танцует 💃';
    silP2.classList.add('lose'); stP2.textContent='плачет 😭';
  }
  else if(s2>s1){
    res.className='result lose';
    res.textContent='😭 '+name2+' победил! Сумма '+s2+' > '+s1+'. Очки: '+gameScore;
    silP1.classList.add('lose'); stP1.textContent='плачет 😭';
    silP2.classList.add('win'); stP2.textContent='танцует 💃';
  }
  else {
    res.className='result';
    res.textContent='🤝 Ничья! Сумма '+s1+' = '+s2+'. Очки: '+gameScore;
  }
  document.getElementById('scoreVal').textContent=gameScore;
  document.getElementById('coinVal').textContent=getCoins();
  document.getElementById('diceLabel').textContent='Игра окончена. Нажми Завершить.';
  // отправить результат в лидерборд Яндекс Игр
  if(gameScore>0) submitScore(gameScore);
}

// старт: определяем платформу (VK / Яндекс / обычный браузер)
try{
  if(window.vkBridge && vkBridge.send){
    vkBridge.send('VKWebAppInit').then(function(){
      VK_BRIDGE=true;
      try{ vkBridge.send('VKWebAppSetViewSettings',{status_bar_style:'dark',action_bar_color:'#1a0e20'}); }catch(e){}
    }).catch(function(){});
  }
}catch(e){}
initSDK();
if(window.__diag)window.__diag('JS: готово');
setTimeout(function(){
  var l=document.getElementById('screen-load');
  if(l && l.classList.contains('active')){ goToMenu(); }
}, 1200);