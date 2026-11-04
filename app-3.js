if(window.__diag)window.__diag('JS: app-3');
// ==== Drag-and-drop кубика ====
function setupDiceDrag(){
  var d=document.getElementById('dice');
  d.addEventListener('pointerdown', function(e){
    if(busy) return;
    if(currentDice===null) return;
    e.preventDefault();
    d.classList.add('dragging');
    d.style.left=e.clientX+'px';
    d.style.top=e.clientY+'px';
    d.style.transform='translate(-50%,-50%)';
    var move=function(ev){
      if(!d.classList.contains('dragging')) return;
      d.style.left=ev.clientX+'px';
      d.style.top=ev.clientY+'px';
      highlightTarget(ev.clientX, ev.clientY);
    };
    var up=function(ev){
      d.classList.remove('dragging');
      d.style.position=''; d.style.left=''; d.style.top=''; d.style.transform=''; d.style.margin='0 auto 10px';
      clearTargets();
      if(ev){
        var cell=hitCell(ev.clientX, ev.clientY);
        if(cell){
          var idx=parseInt(cell.getAttribute('data-index'),10);
          var place=cell.getAttribute('data-place');
          // в режиме бота можно ставить только в свой (верхний) квадрат
          if(mode==='bot'){
            if(place==='p1') clickMyCell(idx);
            else alert('Перетаскивай на свою (верхнюю) клетку');
          } else {
            // режим двух игроков: ставим в квадрат текущего игрока
            if(place===turn) clickAnyCell(turn, idx);
            else alert('Ход '+ (turn==='p1'?'Игрока 1':'Игрока 2'));
          }
        }
      }
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
  });
}
function highlightTarget(x,y){
  var targetPlace = mode==='bot' ? 'p1' : turn;
  document.querySelectorAll('.cell').forEach(function(cell){
    var r=cell.getBoundingClientRect();
    if(cell.getAttribute('data-place')===targetPlace && x>=r.left && x<=r.right && y>=r.top && y<=r.bottom) cell.classList.add('drop-target');
    else cell.classList.remove('drop-target');
  });
}
function clearTargets(){ document.querySelectorAll('.cell.drop-target').forEach(function(c){ c.classList.remove('drop-target'); }); }
function hitCell(x,y){
  var cells=document.querySelectorAll('.cell');
  for(var i=0;i<cells.length;i++){
    var r=cells[i].getBoundingClientRect();
    if(x>=r.left && x<=r.right && y>=r.top && y<=r.bottom){ return cells[i]; }
  }
  return null;
}

function clickMyCell(i){
  if(busy||gameOver) return;
  if(currentDice===null){ alert('Сначала брось кость!'); return; }
  var n=currentDice;
  var r=Math.floor(i/3), c=i%3;
  // дубль: если в этом же ряду/столбце УЖЕ есть такое же число n на моей клетке — это дубль (добавляет +1 копию/очки)
  var existingInLine=false;
  for(var q=r*3;q<r*3+3;q++){ if(boardP1[q] && boardP1[q].v===n) existingInLine=true; }
  for(var w=c;w<9;w+=3){ if(boardP1[w] && boardP1[w].v===n) existingInLine=true; }
  // ставим в свою клетку
  if(!boardP1[i]){
    boardP1[i]={v:n, dup:1};
  } else {
    var cell=boardP1[i];
    if(cell.v===n){ cell.dup+=1; }
    else { boardP1[i]={v:n, dup:1}; }
  }
  // если в линии уже было такое число — это дубль: начисляем бонус/копию
  if(existingInLine && boardP1[i]){
    boardP1[i].dup+=1; // дубль даёт доп. очки за копию
  }
  // стирание у противника: только в том СТОЛБЦЕ, где стоит новая кость, и только цифры n
  var bonus=0;
  for(var i3=c;i3<9;i3+=3){
    if(boardP2[i3] && boardP2[i3].v===n){ boardP2[i3]=null; bonus+=5; }
  }
  currentDice=null;
  if(bonus>0){ gameScore+=bonus; document.getElementById('scoreVal').textContent=gameScore; }
  renderBoards();
  // игра заканчивается, как только любой квадрат заполнен первым
  if(myFreeCells().length===0 || anyBoardFull()){ endGame(); return; }
  // переход хода
  if(mode==='bot'){
    document.getElementById('rollBtn').disabled=true;
    setTimeout(botTurn, 700);
  } else {
    turn = turn==='p1' ? 'p2' : 'p1';
    document.getElementById('diceLabel').textContent=(turn==='p1'?'Игрок 1':'Игрок 2')+': брось кость';
    document.getElementById('rollBtn').disabled=false;
  }
}

function clickAnyCell(owner, idx){
  if(busy||gameOver) return;
  if(currentDice===null){ alert('Сначала брось кость!'); return; }
  // может ходить только текущий игрок
  if(owner!==turn){ alert('Ход '+ (turn==='p1'?'Игрока 1':'Игрока 2')); return; }
  var n=currentDice;
  var myArr = owner==='p1' ? boardP1 : boardP2;
  var foeArr = owner==='p1' ? boardP2 : boardP1;
  if(!myArr[idx]) myArr[idx]={v:n, dup:1};
  else { var c=myArr[idx]; if(c.v===n)c.dup+=1; else myArr[idx]={v:n, dup:1}; }
  // дубль: если в этом столбце уже есть такое же число
  var cc=idx%3, hasOther=false;
  for(var qq=cc;qq<9;qq+=3){ if(qq!==idx && myArr[qq] && myArr[qq].v===n) hasOther=true; }
  if(hasOther && myArr[idx]) myArr[idx].dup+=1;
  // стирание у противника: только в том столбце, где стоит новая кость, и только цифры n
  var c=idx%3;
  var bonus=0;
  for(var i3=c;i3<9;i3+=3){
    if(foeArr[i3] && foeArr[i3].v===n){ foeArr[i3]=null; bonus+=5; }
  }
  currentDice=null;
  if(bonus>0){ gameScore+=bonus; document.getElementById('scoreVal').textContent=gameScore; }
  renderBoards();
  // когда любой из квадратов заполнен — окончание
  var myFree = owner==='p1' ? myFreeCells() : foeFreeCells();
  if(myFree.length===0 || anyBoardFull()){ endGame(); return; }
  turn = turn==='p1' ? 'p2' : 'p1';
  document.getElementById('rollBtn').disabled=false;
  document.getElementById('diceLabel').textContent=(turn==='p1'?'Игрок 1':'Игрок 2')+': брось кость';
}