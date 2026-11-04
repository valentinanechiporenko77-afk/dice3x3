if(window.__diag)window.__diag('JS: app-2');
function emptyBoard(){ return [null,null,null,null,null,null,null,null,null]; }

function startGame(m){
  mode=m||'player';
  boardP1=emptyBoard(); boardP2=emptyBoard();
  turn='p1'; currentDice=null; busy=false; gameScore=0;
  document.getElementById('result').textContent='';
  document.getElementById('coinVal').textContent=getCoins();
  document.getElementById('scoreVal').textContent=gameScore;
  renderBoards();
  document.getElementById('dice').textContent='—';
  document.getElementById('rollBtn').disabled=false;
  document.getElementById('diceLabel').textContent='Твой ход: брось кость';
  document.getElementById('insertBtn').style.display='none';
  showScreen('screen-game');
}

function renderBoards(){
  // верхний — мой (P1)
  var b1=document.getElementById('boardP1');
  b1.innerHTML='';
  for(var i=0;i<9;i++){ b1.appendChild(makeCell(boardP1[i], i, 'p1')); }
  // нижний — противника (P2)
  var b2=document.getElementById('boardP2');
  b2.innerHTML='';
  for(var j=0;j<9;j++){ b2.appendChild(makeCell(boardP2[j], j, 'p2')); }
  document.getElementById('p1Sum').textContent=sumOf(boardP1);
  document.getElementById('p2Sum').textContent=sumOf(boardP2);
}

function dicePips(n){
  // карта позиций точек на белой кости (индексы 0..8 в сетке 3x3)
  var map={1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]};
  var html='<span class="pdie">';
  (map[n]||[]).forEach(function(idx){
    var col=(idx%3)+1, row=Math.floor(idx/3)+1;
    html+='<i style="grid-column:'+col+';grid-row:'+row+'"></i>';
  });
  html+='</span>';
  return html;
}
function diceGlyph(n){
  return dicePips(n);
}
function makeCell(c, idx, owner){
  var div=document.createElement('div');
  div.className='cell '+(owner==='p1'?'p1f':'p2f');
  div.setAttribute('data-place', owner);
  div.setAttribute('data-index', idx);
  if(c){
    div.innerHTML='<span class="dg">'+diceGlyph(c.v)+'</span>';
    if(c.dup>1){ div.innerHTML='<span class="dg">'+diceGlyph(c.v)+'</span><span class="dup">×'+c.dup+'</span>'; }
    div.style.pointerEvents='none';
  }
  // клик по клетке — ставит кубик в столбец (свой квадрат)
  if(!c){
    (function(){ div.onclick=function(){ insertIntoColumn(owner, idx%3); }; })();
  }
  return div;
}
// вставка кубика в столбец своего квадрата
function ownArr(owner){ return owner==='p1' ? boardP1 : boardP2; }
function foeArrOf(owner){ return owner==='p1' ? boardP2 : boardP1; }
function insertIntoColumn(owner, col){
  if(busy) return;
  if(currentDice===null){ alert('Сначала брось кость!'); return; }
  // ходит только владелец своего квадрата
  if(owner!==turn){ alert('Ход '+(turn==='p1'?'Игрока 1':'Игрока 2')); return; }
  var n=currentDice;
  var arr=ownArr(owner), foe=foeArrOf(owner);
  // вставляем кубик в первую свободную клетку выбранного столбца
  var placed=-1;
  for(var j=col;j<9;j+=3){
    if(arr[j]===null){ arr[j]={v:n, dup:1}; placed=j; break; }
  }
  if(placed<0){ alert('В этом столбце нет свободных клеток'); return; }
  // дубль: если в столбце уже есть такое же число
  var c=placed%3, existing=false;
  for(var q=c;q<9;q+=3){ if(q!==placed && arr[q] && arr[q].v===n) existing=true; }
  if(existing) arr[placed].dup+=1;
  // стирание у противника в том же столбце
  var bonus=0;
  for(var i3=c;i3<9;i3+=3){
    if(foe[i3] && foe[i3].v===n){ foe[i3]=null; bonus+=5; }
  }
  currentDice=null;
  if(bonus>0){ gameScore+=bonus; document.getElementById('scoreVal').textContent=gameScore; }
  renderBoards();
  document.getElementById('insertBtn').style.display='none';
  var myFree = owner==='p1' ? myFreeCells() : foeFreeCells();
  if(myFree.length===0){ endGame(); return; }
  if(mode==='bot'){
    document.getElementById('rollBtn').disabled=true;
    setTimeout(botTurn, 700);
  } else {
    turn = turn==='p1' ? 'p2' : 'p1';
    document.getElementById('diceLabel').textContent=(turn==='p1'?'Игрок 1':'Игрок 2')+': брось кость';
    document.getElementById('rollBtn').disabled=false;
  }
}
// заглушка (кнопка больше не нужна)
function insertColumn(){ insertIntoColumn(turn, 0); }

function sumOf(arr){
  var s=0;
  for(var i=0;i<9;i++){ if(arr[i]) s+=arr[i].v*arr[i].dup; }
  return s;
}

function myFreeCells(){
  var out=[];
  for(var i=0;i<9;i++) if(!boardP1[i]) out.push(i);
  return out;
}

function rollDice(){
  if(busy) return;
  busy=true;
  var d=document.getElementById('dice');
  d.textContent='?';
  var n=1+Math.floor(Math.random()*6);
  setTimeout(function(){
    d.innerHTML=diceGlyph(n);
    currentDice=n;
    busy=false;
    document.getElementById('diceLabel').textContent='Выпало '+n+'. Кликни по столбцу своего квадрата';
  },250);
}