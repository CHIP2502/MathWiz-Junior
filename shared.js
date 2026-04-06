/* ═══════════════════════════════════════════
   SHARED.JS — dùng chung cho tất cả đề
   Mỗi file de*.html chỉ cần khai báo:
     CURRENT_DE  (số đề, VD: 1)
     STEPS       (mảng id các bước, VD: ['q1','q2',...])
   rồi gọi initShared() sau khi khai báo xong
═══════════════════════════════════════════ */

/* ─── HELPER ─── */
function shuffle(arr){
    const a=[...arr];
    for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
    return a;
}
function toLabel(i){return String.fromCharCode(65+i);}
function norm(s){return s.trim().toLowerCase().replace(/\s+/g,' ');}

/* ─── PROGRESS ─── */
function updateProgress(activeQ){
    const strip=document.getElementById('progress-strip');
    if(!strip)return;
    strip.style.display='flex';
    const idx=STEPS.indexOf(activeQ);
    STEPS.forEach((q,i)=>{
        const el=document.getElementById('ps'+(i+1));
        if(!el)return;
        el.classList.remove('done','active');
        if(i<idx)el.classList.add('done');
        if(i===idx)el.classList.add('active');
    });
}

/* ─── SCREEN ─── */
function showScreen(id){
    document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    window.scrollTo({top:0,behavior:'smooth'});
    const qMap={};
    STEPS.forEach(q=>{qMap['screen-'+q]=q;});
    if(qMap[id])updateProgress(qMap[id]);
    if(id==='screen-result'){
        const strip=document.getElementById('progress-strip');
        if(strip)strip.style.display='none';
    }
}

/* ─── FEEDBACK ─── */
function showFeedback(q,ok,msg){
    const box=document.getElementById('box-'+q);
    if(box){box.classList.remove('correct','wrong');box.classList.add(ok?'correct':'wrong');}
    const el=document.getElementById('msg-'+q);
    if(el){el.className='feedback-msg '+(ok?'text-success':'text-danger');el.innerText=msg;}
}
function advanceBtn(btnId,label,nextFn){
    const btn=document.getElementById(btnId);
    if(!btn)return;
    btn.innerText=label;btn.classList.add('btn-success');btn.onclick=nextFn;
}

/* ─── START ─── */
function startQuiz(){
    const name=document.getElementById('studentName').value.trim();
    const cls=document.getElementById('studentClass').value.trim();
    if(!name){alert('Con hãy nhập Họ Tên nhé! 😊');return;}
    if(!cls){alert('Con hãy nhập Lớp nhé! 😊');return;}
    document.getElementById('resName').innerText=name;
    document.getElementById('resClass').innerText=cls.toUpperCase();
    if(typeof buildAll==='function')buildAll();
    showScreen('screen-'+STEPS[0]);
}

/* ─── FINISH ─── */
function finishQuiz(){
    const scores=Object.values(window.state.scores);
    let total=scores.reduce((a,b)=>a+b,0);
    total=Math.round(total*10)/10;
    total=Math.min(total,10);
    const pct=(total/10)*100;
    document.getElementById('resTotal').innerText=total;
    document.getElementById('resPerfect').innerText=window.state.perfectCount;
    const fb=document.getElementById('resFeedback');
    if(pct>=90){fb.innerText='⭐ Xuất sắc!';fb.style.background='#FFE500';fb.style.color='#000';}
    else if(pct>=70){fb.innerText='👍 Tốt lắm!';fb.style.background='#00C853';fb.style.color='#fff';}
    else if(pct>=50){fb.innerText='💪 Cần luyện thêm!';fb.style.background='#FF6D00';fb.style.color='#fff';}
    else{fb.innerText='📖 Xem lại bài nhé!';fb.style.background='#FF1744';fb.style.color='#fff';}
    showScreen('screen-result');
    initNextBtn();
}

/* ─── NÚT ĐỀ TIẾP THEO ─── */
async function initNextBtn(){
    const btn=document.getElementById('btn-next-de');
    if(!btn)return;
    try{
        const res=await fetch('de-list.json');
        const list=await res.json();
        const ready=list.filter(d=>d.trang_thai==='san_sang');
        const idx=ready.findIndex(d=>d.so===CURRENT_DE);
        if(idx>=0&&idx<ready.length-1){
            btn.href=ready[idx+1].file;
            btn.innerHTML='📖 Đề tiếp theo →';
            btn.style.background='#2979FF';
            btn.style.color='#fff';
        } else {
            btn.href='index.html';
            btn.innerHTML='🔄 Làm lại từ đầu';
            btn.style.background='#FF6D00';
            btn.style.color='#fff';
        }
    } catch(e){
        btn.href='de'+(CURRENT_DE+1)+'.html';
        btn.innerHTML='📖 Đề tiếp theo →';
        btn.style.background='#2979FF';
        btn.style.color='#fff';
    }
}

/* ─── MATCH ENGINE (de5 style) ─── */
const matchStates={};
function matchInit(quizId){matchStates[quizId]={selectedLeft:null,pairs:{}};}
function matchRedraw(quizId){
    const svg=document.getElementById('match-svg-'+quizId);
    const area=document.getElementById('match-area-'+quizId);
    if(!svg||!area)return;
    svg.innerHTML='';
    const areaRect=area.getBoundingClientRect();
    svg.style.width=areaRect.width+'px';svg.style.height=areaRect.height+'px';
    svg.setAttribute('width',areaRect.width);svg.setAttribute('height',areaRect.height);
    const pairs=(matchStates[quizId]||{}).pairs||{};
    Object.entries(pairs).forEach(([lKey,rVal])=>{
        const lEl=document.getElementById('L-'+lKey);
        const rId='R-'+rVal.replace(/[,\.]/g,'_');
        const rEl=document.getElementById(rId);
        if(!lEl||!rEl)return;
        const lr=lEl.getBoundingClientRect(),rr=rEl.getBoundingClientRect();
        const x1=lr.right-areaRect.left,y1=lr.top-areaRect.top+lr.height/2;
        const x2=rr.left-areaRect.left,y2=rr.top-areaRect.top+rr.height/2;
        const line=document.createElementNS('http://www.w3.org/2000/svg','line');
        line.setAttribute('x1',x1);line.setAttribute('y1',y1);
        line.setAttribute('x2',x2);line.setAttribute('y2',y2);
        line.setAttribute('stroke','#FF3CAC');line.setAttribute('stroke-width','3.5');
        line.setAttribute('stroke-linecap','round');
        svg.appendChild(line);
    });
}
function matchClickLeft(quizId,lKey){
    if(!matchStates[quizId])matchInit(quizId);
    const ms=matchStates[quizId];
    if(ms.pairs[lKey]){
        const oldR=ms.pairs[lKey];
        delete ms.pairs[lKey];
        document.getElementById('L-'+lKey).classList.remove('matched','selected');
        const rEl=document.getElementById('R-'+oldR.replace(/[,\.]/g,'_'));
        if(rEl)rEl.classList.remove('used');
        ms.selectedLeft=null;matchRedraw(quizId);return;
    }
    if(ms.selectedLeft){const prev=document.getElementById('L-'+ms.selectedLeft);if(prev)prev.classList.remove('selected');}
    ms.selectedLeft=lKey;
    document.getElementById('L-'+lKey).classList.add('selected');
}
function matchClickRight(quizId,rVal){
    if(!matchStates[quizId])matchInit(quizId);
    const ms=matchStates[quizId];
    const existingLeft=Object.keys(ms.pairs).find(k=>ms.pairs[k]===rVal);
    if(existingLeft){
        delete ms.pairs[existingLeft];
        document.getElementById('L-'+existingLeft).classList.remove('matched');
        const rEl=document.getElementById('R-'+rVal.replace(/[,\.]/g,'_'));
        if(rEl)rEl.classList.remove('used');
        matchRedraw(quizId);return;
    }
    if(!ms.selectedLeft)return;
    const lKey=ms.selectedLeft;
    ms.pairs[lKey]=rVal;
    document.getElementById('L-'+lKey).classList.remove('selected');
    document.getElementById('L-'+lKey).classList.add('matched');
    const rEl=document.getElementById('R-'+rVal.replace(/[,\.]/g,'_'));
    if(rEl)rEl.classList.add('used');
    ms.selectedLeft=null;matchRedraw(quizId);
}
function matchReset(quizId){
    matchStates[quizId]={selectedLeft:null,pairs:{}};
    document.querySelectorAll(`#match-area-${quizId} .match-btn`).forEach(el=>{
        el.classList.remove('selected','matched','used');
    });
    const svg=document.getElementById('match-svg-'+quizId);
    if(svg)svg.innerHTML='';
    const box=document.getElementById('box-'+quizId);
    if(box)box.classList.remove('correct','wrong');
    const msg=document.getElementById('msg-'+quizId);
    if(msg)msg.innerText='';
}
window.addEventListener('resize',()=>{Object.keys(matchStates).forEach(id=>matchRedraw(id));},{passive:true});
window.addEventListener('scroll',()=>{Object.keys(matchStates).forEach(id=>matchRedraw(id));},{passive:true});