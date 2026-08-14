const CARDS=window.CARDS;
const STORE="nihongo_hub_v3";
let state=JSON.parse(localStorage.getItem(STORE)||"null")||{
  learned:{}, attempts:0, correct:0, streak:0, favorites:[], theme:"light",
  modes:{flash:0,type:0,stroke:0,listen:0,quiz:0,conv:0}, user:null
};
const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
const save=()=>localStorage.setItem(STORE,JSON.stringify(state));
function toast(t){const x=$("#toast");x.textContent=t;x.classList.add("show");setTimeout(()=>x.classList.remove("show"),1800)}
let speechQueue=[];let speechBusy=false;
function speak(text, options={}){
  if(!("speechSynthesis" in window))return Promise.resolve();
  return new Promise(resolve=>{speechQueue.push({text,options,resolve});processSpeechQueue();});
}
function processSpeechQueue(){
  if(speechBusy||!speechQueue.length)return;
  const item=speechQueue.shift();speechBusy=true;
  const u=new SpeechSynthesisUtterance(item.text);u.lang=item.options.lang||"ja-JP";u.rate=item.options.rate||.88;u.pitch=item.options.pitch||1;
  u.onend=()=>{speechBusy=false;item.resolve();processSpeechQueue()};u.onerror=()=>{speechBusy=false;item.resolve();processSpeechQueue()};speechSynthesis.speak(u);
}
function stopSpeechQueue(){speechQueue.forEach(x=>x.resolve());speechQueue=[];if("speechSynthesis"in window)speechSynthesis.cancel();speechBusy=false;}
function record(mode,correct,card){
  state.modes[mode]=(state.modes[mode]||0)+1;state.attempts++;
  if(correct){state.correct++;state.streak++;}else state.streak=0;
  if(card)state.learned[card.level+"|"+card.word]=correct?"known":"hard";save();renderProfile();
}
function renderProfile(){
  const levels=["N5","N4"];
  levels.forEach(l=>{
    const done=Object.keys(state.learned).filter(k=>k.startsWith(l+"|")&&state.learned[k]==="known").length;
    const kanji=Object.keys(state.learned).filter(k=>k.startsWith(l+"|")&&/[\u3400-\u9fff]/.test(k.split("|")[1])).length;
    $(`#${l.toLowerCase()}Words`).textContent=done;
    $(`#${l.toLowerCase()}Kanji`).textContent=kanji;
    $(`#${l.toLowerCase()}Sent`).textContent=Math.min(done, CARDS.filter(c=>c.level===l).length);
  });
  $("#profileAccuracy").textContent=(state.attempts?Math.round(state.correct/state.attempts*100):0)+"%";
  Object.entries(state.modes).forEach(([k,v])=>{const el=$(`#stat${k[0].toUpperCase()+k.slice(1)}`);if(el)el.textContent=v});
  if(state.user){$("#profileName").textContent=state.user.name;$("#profileEmail").textContent=state.user.email;$("#avatar").textContent=(state.user.name||"A")[0].toUpperCase();$("#googleLogin").classList.add("hidden");$("#logout").classList.remove("hidden")}
  else{$("#profileName").textContent="Guest Learner";$("#profileEmail").textContent="Belum login";$("#avatar").textContent="A";$("#googleLogin").classList.remove("hidden");$("#logout").classList.add("hidden")}
}
function setupNav(){
  function go(){let id=location.hash.slice(1)||"home";if(!$("#"+id))id="home";$$(".page").forEach(x=>x.classList.toggle("active",x.id===id));$$("[data-page]").forEach(x=>x.classList.toggle("active-link",x.dataset.page===id));$("#nav").classList.remove("open");}
  window.addEventListener("hashchange",go);go();$("#menuBtn").onclick=()=>$("#nav").classList.toggle("open");
}
let fcDeck=[],fcIndex=0,fcFlipped=false;
function fcBuild(){const lv=$("#fcLevel").value,q=$("#fcSearch").value.toLowerCase();fcDeck=CARDS.filter(c=>(lv==="ALL"||c.level===lv)&&(!q||[c.word,c.reading,c.meaning].join(" ").toLowerCase().includes(q)));fcIndex=Math.min(fcIndex,Math.max(0,fcDeck.length-1));fcRender()}
function fcRender(){
  if(!fcDeck.length)return;
  const c=fcDeck[fcIndex];fcFlipped=false;$("#fcCard").classList.remove("flipped");
  $("#fcCat").textContent=c.level+" · "+c.category;$("#fcWord").textContent=c.word;$("#fcReading").textContent=c.reading;$("#fcMeaning").textContent=c.meaning;$("#fcSentence").textContent=c.sentence;$("#fcSentenceReading").textContent=c.sentenceReading;$("#fcTranslation").textContent=c.translation;$("#fcProgress").style.width=((fcIndex+1)/fcDeck.length*100)+"%";$("#fcFav").textContent=state.favorites.includes(c.level+"|"+c.word)?"★":"☆";
}
function fcMark(ok){const c=fcDeck[fcIndex];record("flash",ok,c);fcNext()}
function fcNext(){fcIndex=(fcIndex+1)%fcDeck.length;fcRender()}function fcPrev(){fcIndex=(fcIndex-1+fcDeck.length)%fcDeck.length;fcRender()}
$("#fcCard").onclick=()=>{$("#fcCard").classList.toggle("flipped");fcFlipped=!fcFlipped};
$("#fcFlip").onclick=()=>$("#fcCard").click();$("#fcNext").onclick=fcNext;$("#fcPrev").onclick=fcPrev;$("#fcKnow").onclick=()=>fcMark(true);$("#fcHard").onclick=()=>fcMark(false);
$("#fcLevel").onchange=fcBuild;$("#fcSearch").oninput=fcBuild;$("#fcFav").onclick=()=>{const c=fcDeck[fcIndex],k=c.level+"|"+c.word,i=state.favorites.indexOf(k);i>=0?state.favorites.splice(i,1):state.favorites.push(k);save();fcRender()};

const hiraMap={a:"あ",i:"い",u:"う",e:"え",o:"お",ka:"か",ki:"き",ku:"く",ke:"け",ko:"こ",sa:"さ",shi:"し",si:"し",su:"す",se:"せ",so:"そ",ta:"た",chi:"ち",ti:"ち",tsu:"つ",tu:"つ",te:"て",to:"と",na:"な",ni:"に",nu:"ぬ",ne:"ね",no:"の",ha:"は",hi:"ひ",fu:"ふ",hu:"ふ",he:"へ",ho:"ほ",ma:"ま",mi:"み",mu:"む",me:"め",mo:"も",ya:"や",yu:"ゆ",yo:"よ",ra:"ら",ri:"り",ru:"る",re:"れ",ro:"ろ",wa:"わ",wo:"を",n:"ん",ga:"が",gi:"ぎ",gu:"ぐ",ge:"げ",go:"ご",za:"ざ",ji:"じ",zi:"じ",zu:"ず",ze:"ぜ",zo:"ぞ",da:"だ",di:"ぢ",du:"づ",de:"で",do:"ど",ba:"ば",bi:"び",bu:"ぶ",be:"べ",bo:"ぼ",pa:"ぱ",pi:"ぴ",pu:"ぷ",pe:"ぺ",po:"ぽ",kya:"きゃ",kyu:"きゅ",kyo:"きょ",sha:"しゃ",shu:"しゅ",sho:"しょ",cha:"ちゃ",chu:"ちゅ",cho:"ちょ",nya:"にゃ",nyu:"にゅ",nyo:"にょ",hya:"ひゃ",hyu:"ひゅ",hyo:"ひょ",mya:"みゃ",myu:"みゅ",myo:"みょ",rya:"りゃ",ryu:"りゅ",ryo:"りょ",gya:"ぎゃ",gyu:"ぎゅ",gyo:"ぎょ",ja:"じゃ",ju:"じゅ",jo:"じょ",bya:"びゃ",byu:"びゅ",byo:"びょ",pya:"ぴゃ",pyu:"ぴゅ",pyo:"ぴょ",fa:"ふぁ",fi:"ふぃ",fe:"ふぇ",fo:"ふぉ"};
const hiraToKata=s=>s.replace(/[\u3041-\u3096]/g,c=>String.fromCharCode(c.charCodeAt(0)+0x60));
function romajiToKana(input,script="hira"){
 let s=input.toLowerCase().replace(/[^a-z]/g,""),out="",i=0;
 const keys=Object.keys(hiraMap).sort((a,b)=>b.length-a.length);
 while(i<s.length){if(i+1<s.length&&s[i]===s[i+1]&&!"aeiou".includes(s[i])){out+="っ";i++;continue}
  let found=null;for(const k of keys){if(s.startsWith(k,i)){found=k;break}}
  if(found){out+=hiraMap[found];i+=found.length}else{out+=s[i];i++}
 }
 return script==="kata"?hiraToKata(out):out;
}
let typeScript="hira",typeCard=null;
function newType(){typeCard=CARDS[Math.floor(Math.random()*CARDS.length)];$("#typeTarget").textContent=typeCard.reading;$("#typeMeaning").textContent=typeCard.meaning;$("#romajiInput").value="";$("#typedOutput").textContent="—";$("#typeResult").textContent=""}
$("#romajiInput").oninput=e=>$("#typedOutput").textContent=romajiToKana(e.target.value,typeScript)||"—";
$$("[data-script]").forEach(b=>b.onclick=()=>{$$("[data-script]").forEach(x=>x.classList.remove("active"));b.classList.add("active");typeScript=b.dataset.script;$("#romajiInput").dispatchEvent(new Event("input"))});
$("#typeCheck").onclick=()=>{const got=romajiToKana($("#romajiInput").value,typeScript),want=typeScript==="kata"?hiraToKata(typeCard.reading):typeCard.reading,ok=got===want;$("#typeResult").textContent=ok?"Benar! 🎉":"Belum tepat. Jawaban: "+want;record("type",ok,typeCard);if(ok)speak(want)};
$("#typeNext").onclick=newType;

const kanjiPool=CARDS.filter(c=>/[\u3400-\u9fff]/.test(c.word)).slice(0,30);let strokeCard=null,strokes=[],drawing=false;
function newStroke(){strokeCard=kanjiPool[Math.floor(Math.random()*kanjiPool.length)];$("#strokeKanji").textContent=strokeCard.word.match(/[\u3400-\u9fff]/)?.[0]||"水";$("#strokeReading").textContent=strokeCard.reading;$("#strokeMeaning").textContent=strokeCard.meaning;$("#targetStrokes").textContent=estimateStrokeCount($("#strokeKanji").textContent);$("#strokeCounter").textContent=Object.keys(state.learned).filter(k=>k.includes("|"+strokeCard.word)).length+1;clearCanvas()}
function estimateStrokeCount(k){const common={"一":1,"二":2,"三":3,"人":2,"大":3,"小":3,"山":3,"川":3,"水":4,"木":4,"本":5,"日":4,"月":4,"火":4,"中":4,"文":4,"学":8,"校":10,"語":14,"食":9,"飲":12,"見":7,"行":6,"来":7,"車":7,"電":13,"空":8,"海":9,"友":4,"父":4,"母":5,"男":7,"女":3,"子":3,"手":4,"足":7};return common[k]||Math.max(2,Math.min(12,k.length*3))}
const canvas=$("#kanjiCanvas"),ctx=canvas.getContext("2d");ctx.lineWidth=10;ctx.lineCap="round";ctx.lineJoin="round";
function pos(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*canvas.width/r.width,y:(e.clientY-r.top)*canvas.height/r.height}}
function start(e){drawing=true;const p=pos(e);strokes.push([p]);ctx.beginPath();ctx.moveTo(p.x,p.y)}
function move(e){if(!drawing)return;const p=pos(e),s=strokes[strokes.length-1];s.push(p);ctx.lineTo(p.x,p.y);ctx.stroke()}
function end(){if(drawing){drawing=false;ctx.closePath()}}
canvas.addEventListener("pointerdown",start);canvas.addEventListener("pointermove",move);canvas.addEventListener("pointerup",end);canvas.addEventListener("pointerleave",end);
function clearCanvas(){ctx.clearRect(0,0,canvas.width,canvas.height);strokes=[];$("#strokeResult").textContent=""}
$("#clearCanvas").onclick=clearCanvas;
$("#finishStroke").onclick=()=>{if(!strokes.length){toast("Tulis kanji dulu.");return}const target=+$("#targetStrokes").textContent,diff=Math.abs(strokes.length-target),countScore=Math.max(0,100-diff*18);const total=strokes.reduce((a,s)=>a+s.length,0);const density=Math.min(100,Math.round(total/18));const score=Math.round(countScore*.75+density*.25);const ok=score>=65;$("#strokeResult").textContent=`${ok?"✓ Cukup cocok":"△ Perlu latihan"} — akurasi estimasi ${score}%`;record("stroke",ok,strokeCard);setTimeout(newStroke,1100)};

let listenCard=null;
function newListen(){listenCard=CARDS[Math.floor(Math.random()*CARDS.length)];$("#listenHint").textContent="???";$("#listenResult").textContent="";const others=CARDS.filter(c=>c.word!==listenCard.word).sort(()=>Math.random()-.5).slice(0,3);const opts=[listenCard,...others].sort(()=>Math.random()-.5);$("#listenOptions").innerHTML=opts.map(c=>`<button class="option" data-key="${c.level}|${c.word}">${c.meaning}</button>`).join("");$$("#listenOptions .option").forEach(b=>b.onclick=()=>{const ok=b.dataset.key===listenCard.level+"|"+listenCard.word;$$("#listenOptions .option").forEach(x=>{if(x.dataset.key===listenCard.level+"|"+listenCard.word)x.classList.add("correct")});if(!ok)b.classList.add("wrong");$("#listenResult").textContent=ok?"Benar!":"Jawaban: "+listenCard.meaning;record("listen",ok,listenCard)})}
$("#listenPlay").onclick=()=>speak(listenCard.reading);$("#listenNext").onclick=newListen;

let quizCard=null,quizDone=false;
function newQuiz(){quizCard=CARDS[Math.floor(Math.random()*CARDS.length)];quizDone=false;$("#quizWord").textContent=quizCard.word;$("#quizResult").textContent="";const others=CARDS.filter(c=>c.word!==quizCard.word).sort(()=>Math.random()-.5).slice(0,3),opts=[quizCard,...others].sort(()=>Math.random()-.5);$("#quizOptions").innerHTML=opts.map(c=>`<button class="option" data-key="${c.level}|${c.word}">${c.meaning}</button>`).join("");$$("#quizOptions .option").forEach(b=>b.onclick=()=>answerQuiz(b))}
function answerQuiz(b){if(quizDone)return;quizDone=true;const ok=b.dataset.key===quizCard.level+"|"+quizCard.word;$$("#quizOptions .option").forEach(x=>{if(x.dataset.key===quizCard.level+"|"+quizCard.word)x.classList.add("correct")});if(!ok)b.classList.add("wrong");$("#quizResult").textContent=ok?"Benar! 🎉 "+quizCard.reading:"Belum tepat. Jawaban: "+quizCard.meaning;record("quiz",ok,quizCard);if(ok)speak(quizCard.reading)}
$("#quizNext").onclick=newQuiz;

const dialogues=[[["A","こんにちは。","Halo."],["B","こんにちは。元気ですか。","Halo. Apa kabar?"],["A","はい、元気です。","Ya, saya baik."]],[["A","これは何ですか。","Ini apa?"],["B","それは水です。","Itu air."],["A","ありがとうございます。","Terima kasih."]]];
let dIndex=0;
function renderDialogue(){const d=dialogues[dIndex];$("#dialogue").innerHTML=d.map(x=>`<div class="dialog-line"><b>${x[0]}</b> <span class="jp">${x[1]}</span><div class="muted">${x[2]}</div></div>`).join("")}
$("#dialoguePlay").onclick=async()=>{stopSpeechQueue();for(const x of dialogues[dIndex])await speak(x[1],{rate:.9});};$("#dialogueNext").onclick=()=>{dIndex=(dIndex+1)%dialogues.length;renderDialogue();record("conv",true,null)};

$("#googleLogin").onclick=()=>{toast("Untuk login Google sungguhan, masukkan Google Client ID/Firebase. Demo profile tetap bisa dipakai.");const name=prompt("Nama profil (mode demo):");if(name){state.user={name,email:"demo@google.local"};save();renderProfile()}};
$("#logout").onclick=()=>{state.user=null;save();renderProfile();toast("Logout berhasil")};
$("#contactSend").onclick=()=>{if(!$("#contactName").value||!$("#contactMsg").value){toast("Isi nama dan pesan dulu.");return}toast("Pesan siap dikirim.");};
$("#themeBtn").onclick=()=>{state.theme=state.theme==="dark"?"light":"dark";document.body.classList.toggle("dark",state.theme==="dark");$("#themeBtn").textContent=state.theme==="dark"?"☀":"☾";save()};

setupNav();fcBuild();newType();newStroke();newListen();newQuiz();renderDialogue();renderProfile();
document.body.classList.toggle("dark",state.theme==="dark");$("#themeBtn").textContent=state.theme==="dark"?"☀":"☾";
document.addEventListener("keydown",e=>{if(e.key==="Escape")speechSynthesis?.cancel()});

/* ===== v4 EXTENSIONS ===== */
const LOANWORDS = window.LOANWORDS || [];
const KANJI_INFO = window.KANJI_INFO || [];
state.modes = Object.assign({flash:0,type:0,stroke:0,listen:0,quiz:0,conv:0,speak:0,kanji:0}, state.modes||{});
save();

function setModeStat(mode){ state.modes[mode]=(state.modes[mode]||0)+1; save(); renderProfile(); }

/* More practical conversations */
dialogues.push(
  [["A","おはようございます。","Selamat pagi."],["B","おはようございます。今日は何をしますか。","Selamat pagi. Hari ini mau melakukan apa?"],["A","学校で日本語を勉強します。","Saya belajar bahasa Jepang di sekolah."]],
  [["A","週末は何をしましたか。","Apa yang kamu lakukan akhir pekan?"],["B","友達と映画を見ました。","Saya menonton film dengan teman."],["A","映画はどうでしたか。","Bagaimana filmnya?"],["B","とても面白かったです。","Sangat menarik."]],
  [["A","すみません。駅はどこですか。","Permisi. Stasiun di mana?"],["B","まっすぐ行って、右です。","Jalan lurus, lalu ke kanan."],["A","ありがとうございます。","Terima kasih."],["B","どういたしまして。","Sama-sama."]],
  [["A","何を食べたいですか。","Mau makan apa?"],["B","ラーメンを食べたいです。","Saya ingin makan ramen."],["A","じゃあ、一緒に行きましょう。","Kalau begitu, ayo pergi bersama."]],
  [["A","日本語の勉強はどうですか。","Bagaimana belajar bahasa Jepang?"],["B","難しいですが、楽しいです。","Sulit, tetapi menyenangkan."],["A","毎日少しずつ勉強しましょう。","Mari belajar sedikit demi sedikit setiap hari."]]
);
renderDialogue();

/* Kana typing: Katakana becomes a loanword exercise */
let loanCard = null;
const loanExact = Object.fromEntries(LOANWORDS.map(x=>[x.romaji.toLowerCase(),x.word]));
function pickLoan(){ loanCard=LOANWORDS[Math.floor(Math.random()*LOANWORDS.length)]; return loanCard; }
function renderTypeV4(){
  if(typeScript==="kata"){
    const l=pickLoan();
    $("#typeTarget").textContent=l.word; $("#typeMeaning").textContent=l.meaning+" · kata serapan";
    $("#typeResult").textContent=""; $("#romajiInput").value=""; $("#typedOutput").textContent="—";
  } else {
    newType();
  }
}
$$("[data-script]").forEach(b=>{
  b.onclick=()=>{
    $$("[data-script]").forEach(x=>x.classList.remove("active")); b.classList.add("active");
    typeScript=b.dataset.script; renderTypeV4();
  };
});
$("#romajiInput").oninput=e=>{
  const raw=e.target.value.toLowerCase().trim();
  if(typeScript==="kata" && loanExact[raw]) $("#typedOutput").textContent=loanExact[raw];
  else $("#typedOutput").textContent=romajiToKana(raw,typeScript)||"—";
};
$("#typeCheck").onclick=()=>{
  const raw=$("#romajiInput").value.toLowerCase().trim();
  let want, card;
  if(typeScript==="kata"){
    card=loanCard || pickLoan(); want=card.word;
  } else {
    card=typeCard; want=card.reading;
  }
  const got=typeScript==="kata" ? (loanExact[raw] || romajiToKana(raw,"kata")) : romajiToKana(raw,"hira");
  const ok=got===want;
  $("#typeResult").textContent=ok ? "Benar! 🎉" : "Belum tepat. Jawaban: "+want;
  record("type",ok, typeScript==="kata" ? {level:"N5",word:card.word} : card);
  if(ok) speak(want);
};
$("#typeNext").onclick=()=>renderTypeV4();

/* Kanji information for stroke mode */
let currentStrokeInfo=null;
function getStrokeInfo(){
  const k=$("#strokeKanji").textContent.trim();
  return KANJI_INFO.find(x=>x.kanji===k) || KANJI_INFO.find(x=>/[\u3400-\u9fff]/.test(x.kanji));
}
function newStrokeV4(){
  currentStrokeInfo=KANJI_INFO[Math.floor(Math.random()*KANJI_INFO.length)];
  $("#strokeKanji").textContent=currentStrokeInfo.kanji;
  $("#strokeReading").textContent=currentStrokeInfo.kun!=="—" ? currentStrokeInfo.kun : currentStrokeInfo.on;
  $("#strokeMeaning").textContent=currentStrokeInfo.meaning;
  $("#targetStrokes").textContent=estimateStrokeCount(currentStrokeInfo.kanji);
  $("#strokeCounter").textContent=Object.keys(state.learned).filter(k=>k.includes("|"+currentStrokeInfo.kanji)).length+1;
  let info=$("#strokeInfo");
  if(!info){ info=document.createElement("div"); info.id="strokeInfo"; info.className="kanji-mini-info"; $(".stroke-target").appendChild(info); }
  info.innerHTML=`<span><b>Level:</b> ${currentStrokeInfo.level}</span><span><b>Kun-yomi:</b> <span class="jp">${currentStrokeInfo.kun}</span></span><span><b>On-yomi:</b> <span class="jp">${currentStrokeInfo.on}</span></span><span><b>Arti:</b> ${currentStrokeInfo.meaning}</span><span><b>Penggunaan:</b> ${currentStrokeInfo.usage}</span>`;
  clearCanvas();
}
$("#finishStroke").onclick=()=>{
  if(!strokes.length){toast("Tulis kanji dulu.");return}
  const target=+$("#targetStrokes").textContent, diff=Math.abs(strokes.length-target);
  const countScore=Math.max(0,100-diff*18), total=strokes.reduce((a,s)=>a+s.length,0), density=Math.min(100,Math.round(total/18));
  const score=Math.round(countScore*.75+density*.25), ok=score>=65;
  $("#strokeResult").textContent=`${ok?"✓ Cukup cocok":"△ Perlu latihan"} — akurasi estimasi ${score}%`;
  record("stroke",ok,{level:currentStrokeInfo.level,word:currentStrokeInfo.kanji});
  setTimeout(newStrokeV4,1000);
};
newStrokeV4();

/* Kanji explorer */
function renderKanji(){
  const lv=$("#kanjiLevel").value, q=$("#kanjiSearch").value.toLowerCase();
  const arr=KANJI_INFO.filter(k=>k.level===lv && (!q || [k.kanji,k.kun,k.on,k.meaning,k.usage].join(" ").toLowerCase().includes(q)));
  $("#kanjiGrid").innerHTML=arr.map((k,i)=>`<button class="kanji-card" data-i="${KANJI_INFO.indexOf(k)}"><span class="kanji-card-level">${k.level}</span><span class="jp kanji-char">${k.kanji}</span><span class="jp">${k.kun==="—"?k.on:k.kun}</span><b>${k.meaning}</b></button>`).join("");
  $$("#kanjiGrid .kanji-card").forEach(b=>b.onclick=()=>{
    const k=KANJI_INFO[+b.dataset.i];
    $("#kanjiDetail").classList.remove("hidden");
    $("#kanjiDetail").innerHTML=`<div class="detail-head"><span class="jp detail-kanji">${k.kanji}</span><div><span class="eyebrow">${k.level}</span><h3>${k.meaning}</h3></div></div>
    <div class="detail-grid"><div><small>Kun-yomi</small><b class="jp">${k.kun}</b></div><div><small>On-yomi</small><b class="jp">${k.on}</b></div></div>
    <p><b>Dipakai untuk:</b> ${k.usage}</p>
    <button class="btn" onclick="document.querySelector('#kanjiDetail').classList.add('hidden')">Tutup</button>`;
    setModeStat("kanji");
    $("#kanjiDetail").scrollIntoView({behavior:"smooth",block:"nearest"});
  });
}
$("#kanjiLevel").onchange=renderKanji; $("#kanjiSearch").oninput=renderKanji; renderKanji();

/* Speech conversation for max 5 minutes */
let speakTimerId=null, speakSeconds=300, recognition=null, speakingActive=false;
const SpeechRec=window.SpeechRecognition||window.webkitSpeechRecognition;
function formatTime(sec){return String(Math.floor(sec/60)).padStart(2,"0")+":"+String(sec%60).padStart(2,"0")}
function aiReply(text){
  const t=text.toLowerCase();
  if(t.includes("名前")||t.includes("なまえ")) return "私はNihongo AIです。あなたの名前は何ですか。";
  if(t.includes("学生")||t.includes("学校")) return "そうですか。学校で何を勉強していますか。";
  if(t.includes("日本語")) return "いいですね。日本語の勉強で一番好きなのは何ですか。";
  if(t.includes("好き")) return "私も好きです。どうして好きですか。";
  if(t.includes("ありがとう")) return "どういたしまして。次の質問です。週末は何をしますか。";
  if(t.includes("こんにちは")||t.includes("こんばんは")) return "こんにちは！今日は元気ですか。";
  if(t.includes("はい")||t.includes("いいえ")) return "わかりました。もう少し詳しく話してみてください。";
  return "なるほど。もう少し日本語で話してみてください。";
}
function addSpeakBubble(who,text){
  const div=document.createElement("div");div.className=who==="AI"?"ai-bubble":"user-bubble";div.innerHTML=`<b>${who}:</b> ${text}`;
  $("#speakLog").appendChild(div);$("#speakLog").scrollTop=$("#speakLog").scrollHeight;
}
function startSpeak(){
  if(speakingActive)return;
  stopSpeechQueue();
  speakingActive=true;speakSeconds=300;$("#speakTimer").textContent="05:00";$("#speakStatus").textContent="Aktif";$("#speakLog").innerHTML="";
  addSpeakBubble("AI","こんにちは！日本語で話してみましょう。名前は何ですか。"); speak("こんにちは。日本語で話してみましょう。名前は何ですか。");
  speakTimerId=setInterval(()=>{speakSeconds--;$("#speakTimer").textContent=formatTime(speakSeconds);if(speakSeconds<=0)stopSpeak("Waktu 5 menit selesai.");},1000);
  if(SpeechRec){
    recognition=new SpeechRec();recognition.lang="ja-JP";recognition.interimResults=false;recognition.continuous=false;
    recognition.onstart=()=>$("#speakStatus").textContent="Mendengarkan...";
    recognition.onresult=e=>{
      const text=e.results[0][0].transcript;$("#speakTranscript").textContent=text;addSpeakBubble("Kamu",text);
      const reply=aiReply(text);addSpeakBubble("AI",reply);speak(reply,{rate:.88}).then(()=>{$("#speakStatus").textContent="Aktif"});setModeStat("speak");
      $("#speakStatus").textContent="AI berbicara...";
    };
    recognition.onerror=()=>{$("#speakStatus").textContent="Coba bicara lagi";};
    recognition.onend=()=>{if(speakingActive)$("#speakStatus").textContent="Aktif"};
  } else $("#speakStatus").textContent="Browser tidak mendukung Speech Recognition";
}
function micSpeak(){if(!speakingActive){toast("Mulai sesi 5 menit dulu.");return}if(!recognition){toast("Browser ini tidak mendukung pengenalan suara.");return}try{recognition.start()}catch(e){}}
function stopSpeak(msg="Sesi dihentikan."){speakingActive=false;if(speakTimerId)clearInterval(speakTimerId);speakTimerId=null;if(recognition){try{recognition.stop()}catch(e){}}$("#speakStatus").textContent="Selesai";$("#speakTranscript").textContent=msg}
$("#speakStart").onclick=startSpeak;$("#speakMic").onclick=micSpeak;$("#speakStop").onclick=()=>stopSpeak();


/* ===== v5: Profile reset/edit ===== */
function resetProfile(){
  if(!confirm("Reset profile dan semua progress belajar? Data yang tersimpan di browser akan dihapus."))return;
  state={learned:{},attempts:0,correct:0,streak:0,favorites:[],theme:state.theme,modes:{flash:0,type:0,stroke:0,listen:0,quiz:0,conv:0,speak:0,kanji:0},user:null,srs:{},daily:{date:new Date().toISOString().slice(0,10),count:0},achievements:{},testRuns:0,reviewCount:0};save();renderProfile();fcBuild();renderSRS?.();buildReview?.();renderDashboard?.();renderAchievements?.();toast("Profile dan progress sudah di-reset.");
}
$("#resetProfile").onclick=resetProfile;
$("#editProfile").onclick=()=>{
  const old=state.user?.name||"Guest Learner";const name=prompt("Nama profile:",old);if(name===null)return;const email=prompt("Email profile:",state.user?.email||"");state.user={name:name.trim()||"Guest Learner",email:email.trim()||""};save();renderProfile();toast("Profile diperbarui.");
};

/* ===== v6: TKA bank berbasis 3 dokumen pengguna =====
   Soal TKA disusun ulang/parafrase dari tiga dokumen latihan TKA
   yang diunggah pengguna: A1 Dokkai, A1 N5 20 soal, dan A1 PGK.
*/

const TESTS = {
  "JLPT-N5":[
    {q:"「水」 dibaca…",o:["みず","みせ","みち","みみ"],a:0},
    {q:"「学校」 artinya…",o:["rumah sakit","sekolah","stasiun","kantor"],a:1},
    {q:"わたしは 毎日 七時___ 起きます。",o:["に","を","で","が"],a:0},
    {q:"「昨日」 artinya…",o:["hari ini","besok","kemarin","minggu depan"],a:2},
    {q:"「食べます」 bentuk kamusnya adalah…",o:["食べる","食べた","食べない","食べて"],a:0},
    {q:"「三人」 dibaca…",o:["さんにん","さんじん","みんさん","さんほん"],a:0},
    {q:"「これは何ですか。」 artinya…",o:["Siapa ini?","Ini apa?","Di mana ini?","Kapan ini?"],a:1},
    {q:"「高い」 dapat berarti…",o:["murah","rendah","tinggi/mahal","baru"],a:2},
    {q:"「午前」 berhubungan dengan…",o:["pagi/sebelum siang","malam","kemarin","minggu"],a:0},
    {q:"「日本語を勉強します。」 artinya…",o:["Saya mengajar bahasa Jepang.","Saya belajar bahasa Jepang.","Saya membaca bahasa Jepang.","Saya menulis bahasa Jepang."],a:1}
  ],
  "JLPT-N4":[
    {q:"「必要」 artinya…",o:["perlu/diperlukan","berbahaya","berbeda","sederhana"],a:0},
    {q:"「経験」 artinya…",o:["pengalaman","penjelasan","rencana","peraturan"],a:0},
    {q:"雨が降った___、試合は中止になりました。",o:["ので","まで","しか","でも"],a:0},
    {q:"「最近」 artinya…",o:["dulu","akhir-akhir ini","besok","selamanya"],a:1},
    {q:"「説明」 berarti…",o:["penjelasan","perjalanan","undangan","perubahan"],a:0},
    {q:"「始める」 artinya…",o:["mengakhiri","memulai","mengirim","menjawab"],a:1},
    {q:"「考える」 berarti…",o:["berpikir","bergerak","membawa","menutup"],a:0},
    {q:"日本へ行く___、日本語を勉強しています。",o:["ために","だけ","しか","までに"],a:0},
    {q:"「場合」 paling dekat artinya…",o:["kasus/ketika","jawaban","orang","tempat"],a:0},
    {q:"「将来」 artinya…",o:["masa depan","masa lalu","hari ini","waktu makan"],a:0}
  ],
  "TKA":[
    {q:"Sebuah jadwal menunjukkan seseorang berangkat ke sekolah pada pukul 08.00. Kalimat yang paling sesuai adalah…",o:["8じに がっこうへ いきます。","7じに うちへ かえります。","9じに ねます。","6じに あさごはんを たべません。"],a:0,skill:"Pemahaman Literal"},
    {q:"Teks: 「まいにち 7じに おきます。それから あさごはんを たべます。8じに がっこうへ いきます。」 Kapan ia pergi ke sekolah?",o:["6じ","7じ","8じ","9じ"],a:2,skill:"Pemahaman Literal"},
    {q:"Pengumuman menyebut kegiatan klub berlangsung 16.00–17.00 dan peserta bertemu di としょかん. Lokasinya adalah…",o:["きょうしつ","としょかん","たいいくかん","うち"],a:1,skill:"Pemahaman Literal"},
    {q:"Dalam dialog tentang hobi, seseorang mengatakan ia setiap hari mendengarkan rock dan pop. Kata yang paling tepat adalah…",o:["おんがく","ほん","えいが","スポーツ"],a:0,skill:"Kosakata"},
    {q:"Pesan menyebut 「9じに がっこうの まえで 待っています。」 Lokasi yang dimaksud adalah…",o:["di dalam kelas","di depan sekolah","di rumah","di perpustakaan"],a:1,skill:"Pemahaman Literal"},
    {q:"Susunan yang paling alami untuk 'Saya pergi ke sekolah pukul 7' adalah…",o:["わたしは 7じに がっこうへ いきます。","がっこうへ わたしは いきます 7じに。","いきます わたしは 7じに がっこうへ。","7じに いきます がっこうへ わたしは。"],a:0,skill:"Reorganisasi"},
    {q:"Susunan yang paling tepat untuk 'Saya makan sarapan di rumah pukul 7' adalah…",o:["わたしは 7じに うちで あさごはんを たべます。","あさごはんを たべます わたしは うちで 7じに。","うちで わたしは たべます あさごはんを 7じに。","7じに たべます あさごはんを わたしは うちで。"],a:0,skill:"Reorganisasi"},
    {q:"Teks: 「きのうは にちようびでした。どこへも いきませんでした。うちで ほんを よみました。」 Kesimpulan paling tepat adalah…",o:["berbelanja seharian","menghabiskan hari libur di rumah","belajar di sekolah","wisata ke luar kota"],a:1,skill:"Pemahaman Inferensial"},
    {q:"A mengajak menonton film besok. B menjawab bahwa besok ada ujian. Respons yang paling masuk akal adalah…",o:["いきましょう","いきません","いきました","みました"],a:1,skill:"Pemahaman Inferensial"},
    {q:"Jika kejadian terjadi kemarin dan menggunakan bentuk lampau dari 起きる, pilihan yang tepat adalah…",o:["きのう 6じに おきました。","きょう 6じに おきます。","あした 6じに おきます。","まいにち 6じに おきません。"],a:0,skill:"Tata Bahasa"},
    {q:"「おきます」 pada 「まいあさ 6じに おきます」 ditulis dengan kanji…",o:["起きます","行きます","見ます","食べます"],a:0,skill:"Kanji"},
    {q:"わたしは まいにち バス ___ がっこうへ いきます。",o:["で","に","を","へ"],a:0,skill:"Partikel"},
    {q:"「いま 何時ですか。」 「___ 8時です。」 Kata yang paling tepat adalah…",o:["ちょうどの","ちょうど","ごろに","からまで"],a:1,skill:"Kosakata"},
    {q:"Seseorang pergi ke department store, membeli シャツ, lalu makan di restoran. Makanan yang dimakan adalah…",o:["シャツ","ラーメン","パン","何も食べません"],a:1,skill:"Dokkai"},
    {q:"Kalimat yang tata bahasanya paling tepat adalah…",o:["わたしは きょうしつで にほんごを べんきょうします。","わたしは にほんごを きょうしつに べんきょうします。","わたしは きょうしつへ にほんごで べんきょうします。","わたしは べんきょうします にほんごを きょうしつで。"],a:0,skill:"Tata Bahasa"},
    {q:"Sebuah tes berlangsung dari 10.00 sampai 11.30. Berapa lama durasinya?",o:["60 menit","90 menit","100 menit","120 menit"],a:1,skill:"Waktu"},
    {q:"Sebuah ruangan tidak memiliki AC dan terasa panas. Kata yang paling tepat adalah…",o:["あつい","すずしい","さむい","つめたい"],a:0,skill:"Kosakata"},
    {q:"Untuk menanyakan keadaan cuaca kemarin seperti 「いい てんきでした」, bentuk pertanyaan yang tepat adalah…",o:["どうでしたか","どんなでしたか","なんでしたか","どこでしたか"],a:0,skill:"Tata Bahasa"},
    {q:"Penghitung untuk tiga buku adalah…",o:["さんさつ","さんまい","さんほん","さんこ"],a:0,skill:"Josuushi"},
    {q:"「あした 一緒に えいがを ___か。」 Ajakan sopan yang tepat adalah…",o:["見ませんか","見ました","見ません","見て"],a:0,skill:"Tata Bahasa"},
    {type:"pgk",q:"Kalender latihan: hari ini Rabu tanggal 6 Mei, besok tanggal 7, dan kemarin tanggal 5. Tentukan setiap pernyataan.",statements:[["きょうは 水曜日です。",true],["あしたは 5月7日です。",true],["きのうは 5月5日です。",true]],skill:"Pemahaman Inferensial"},
    {type:"pgk",q:"Daftar harga latihan: ramen ¥600, curry ¥500, teh ¥100, onigiri ¥150.",statements:[["ラーメンは カレーより たかいです。",true],["おにぎりは 100円です。",false],["カレーと おちゃは 600円です。",true]],skill:"Pemahaman Literal"},
    {type:"pgk",q:"Jadwal Tanaka: Senin belajar bahasa Jepang; Rabu olahraga pukul 13.00; Jumat kerja paruh waktu 16.00–19.00.",statements:[["月曜日に 日本語を べんきょうします。",true],["水曜日の スポーツは 午前です。",false],["金曜日の アルバイトは 3時間です。",true]],skill:"Pemahaman Literal"},
    {type:"pgk",q:"Rutinitas pagi: bangun pukul 6, mencuci muka, sarapan, keluar rumah pukul 7, lalu ke sekolah.",statements:[["あさごはんを たべるまえに、顔を あらいます。",true],["6じに うちを 出ます。",false],["おきてから あさごはんを たべます。",true]],skill:"Reorganisasi"},
    {type:"pgk",q:"Keluarga terdiri dari ayah, ibu, kakak perempuan, dan pembicara. Ayah pegawai perusahaan, ibu guru, kakak perempuan bekerja di bank.",statements:[["家族は 全部で 4人です。",true],["お母さんは 銀行員です。",false],["お姉さんは 銀行で はたらいています。",true]],skill:"Pemahaman Literal"},
    {type:"pgk",q:"Dalam pesan, Ken menolak bermain sepak bola karena sedang demam.",statements:[["ケンさんは きょう サッカーを しません。",true],["ケンさんは からだの 調子が わるいです。",true],["二人は いっしょに サッカーを します。",false]],skill:"Pemahaman Inferensial"},
    {type:"pgk",q:"Kamar berisi meja dan tempat tidur. Komputer berada di atas meja, sedangkan rak buku berada di sebelah meja.",statements:[["パソコンは つくえの 下に あります。",false],["本棚は つくえの となりに あります。",true],["へやに ベッドが あります。",true]],skill:"Pemahaman Literal"},
    {type:"pgk",q:"Catatan kemarin: hujan sejak pagi, sehingga tidak pergi ke taman dan menonton film di rumah.",statements:[["きのうは いい てんきでした。",false],["雨が ふったので、公園へ 行きませんでした。",true],["きのう うちで えいがを 見ました。",true]],skill:"Pemahaman Inferensial"},
    {type:"pgk",q:"Pengumuman perpustakaan: buka Senin–Jumat pukul 09.00–17.00; Sabtu-Minggu tutup; maksimal meminjam 3 buku.",statements:[["日曜日に としょかんで 本を よむことが できます。",false],["一度に 4冊の 本を かりることは できません。",true],["平日の 午後3時に としょかんは あいています。",true]],skill:"Pemahaman Literal"},
    {type:"pgk",q:"Surat menceritakan Ali pergi ke Yogyakarta bersama keluarga, melihat Borobudur, merasa senang, dan ingin pergi lagi.",statements:[["アリさんは ひとりで ジョグジャカルタへ 行きました。",false],["アリさんは 旅行を たのしみました。",true],["アリさんは また ジョグジャカルタへ 行きたいです。",true]],skill:"Pemahaman Inferensial"}
  ]
};
let testMode="JLPT-N5",testActive=false,testSeconds=1200,testTimerId=null,testAnswers={};
function getTestQuestions(){return TESTS[testMode]||TESTS["JLPT-N5"]}
function testLabel(){return testMode==="TKA"?"TKA Bahasa Jepang":testMode.replace("JLPT-","JLPT ")}
function renderTestSetup(){
 const a=getTestQuestions();
 if($("#testTitle"))$("#testTitle").textContent=testLabel();
 if($("#testDescription"))$("#testDescription").textContent=testMode==="TKA"?"Bank latihan TKA Jepang dari materi tiga dokumen latihan yang kamu berikan, dengan pilihan ganda dan PGK.":`Latihan ${testLabel()} untuk kosakata, kanji, partikel, tata bahasa, dan pemahaman.`;
 if($("#testCount"))$("#testCount").textContent=a.length;
 $("#testSetup")?.classList.remove("hidden");$("#testRunning")?.classList.add("hidden");$("#testResult")?.classList.add("hidden");
}
function updateTestProgress(){
 const a=getTestQuestions(),n=Object.keys(testAnswers).filter(k=>testAnswers[k]!=null).length;
 if($("#runningProgressText"))$("#runningProgressText").textContent=`${n} / ${a.length}`;
 if($("#testProgress"))$("#testProgress").style.width=(n/a.length*100)+"%";
}
function startTest(){
 if(testActive)return;
 testActive=true;testAnswers={};testSeconds=1200;
 $("#testSetup")?.classList.add("hidden");$("#testRunning")?.classList.remove("hidden");$("#testResult")?.classList.add("hidden");
 if($("#runningTestLabel"))$("#runningTestLabel").textContent=testLabel();
 const a=getTestQuestions();
 $("#testArea").innerHTML=a.map((x,i)=>{
  if(x.type==="pgk")return `<article class="test-question" id="testQ${i}"><div class="question-head"><span class="q-number">${i+1}</span><div><h3>${x.q}</h3><small class="skill-tag">${x.skill||""}</small></div></div><div class="pgk-grid">${x.statements.map((s,j)=>`<div class="pgk-row"><div class="pgk-statement"><b>${String.fromCharCode(65+j)}.</b> ${s[0]}</div><label><input type="radio" name="tq${i}_${j}" value="true"> Benar</label><label><input type="radio" name="tq${i}_${j}" value="false"> Salah</label></div>`).join("")}</div></article>`;
  return `<article class="test-question" id="testQ${i}"><div class="question-head"><span class="q-number">${i+1}</span><div><h3>${x.q}</h3><small class="skill-tag">${x.skill||""}</small></div></div><div class="test-options">${x.o.map((o,j)=>`<label><input type="radio" name="tq${i}" value="${j}"><span>${o}</span></label>`).join("")}</div></article>`;
 }).join("");
 $("#testArea").querySelectorAll("input").forEach(el=>el.addEventListener("change",()=>{testAnswers[el.name]=el.value;updateTestProgress()}));
 updateTestProgress();
 if(testTimerId)clearInterval(testTimerId);
 testTimerId=setInterval(()=>{testSeconds--;if($("#testTimer"))$("#testTimer").textContent=formatTime(testSeconds);if(testSeconds<=0)submitTest(true)},1000);
 window.scrollTo({top:0,behavior:"smooth"});
}
function collectTest(){
 const a=getTestQuestions();
 return a.map((x,i)=>{
  if(x.type==="pgk"){
   let ok=true,answered=0,given=[];
   x.statements.forEach((s,j)=>{const el=document.querySelector(`input[name="tq${i}_${j}"]:checked`);const v=el?el.value:null;given.push(v);if(v!==null)answered++;if(v!==String(s[1]))ok=false});
   return {ok:ok&&answered===x.statements.length,answered,given};
  }
  const el=document.querySelector(`input[name="tq${i}"]:checked`);
  return {ok:!!el&&+el.value===x.a,answered:!!el,given:el?el.value:null};
 });
}
function submitTest(auto=false){
 if(!testActive)return;
 testActive=false;if(testTimerId)clearInterval(testTimerId);testTimerId=null;
 const a=getTestQuestions(),r=collectTest(),score=r.filter(x=>x.ok).length,pct=Math.round(score/a.length*100);
 state.testRuns=(state.testRuns||0)+1;state.attempts=(state.attempts||0)+a.length;state.correct=(state.correct||0)+score;
 state.daily=state.daily||{date:new Date().toISOString().slice(0,10),count:0};state.daily.count+=a.length;save();
 $("#testRunning")?.classList.add("hidden");$("#testSetup")?.classList.remove("hidden");$("#testResult")?.classList.remove("hidden");
 $("#testResult").innerHTML=`<div class="result-hero"><span class="eyebrow">${auto?"WAKTU HABIS · ":""}${testLabel().toUpperCase()}</span><div class="score-number">${pct}%</div><h2>${score} / ${a.length} benar</h2><p>${pct>=90?"🏆 Luar biasa!":pct>=80?"🔥 Sangat bagus!":pct>=60?"👍 Lumayan, ulangi yang salah.":"💪 Gunakan pembahasan untuk belajar lagi."}</p></div>
 <div class="review-answer-list">${a.map((x,i)=>{const z=r[i];let correct,your;if(x.type==="pgk"){correct=x.statements.map((s,j)=>`${String.fromCharCode(65+j)} ${s[1]?"Benar":"Salah"}`).join(" · ");your=z.given.map((v,j)=>`${String.fromCharCode(65+j)} ${v==null?"—":v==="true"?"Benar":"Salah"}`).join(" · ")}else{correct=x.o[x.a];your=z.given==null?"Belum dijawab":x.o[+z.given]}return `<article class="answer-review ${z.ok?"correct":"wrong"}"><div class="answer-review-top"><b>Soal ${i+1}</b><span>${z.ok?"✓ Benar":"✕ Salah"}</span></div><p>${x.q}</p><div><b>Jawaban benar:</b> ${correct}</div><div><b>Jawaban kamu:</b> ${your}</div><div class="explanation"><b>💡 Pembahasan:</b> ${x.e||"Cocokkan kata kunci pada stimulus dengan pilihan jawaban."}</div></article>`}).join("")}</div>
 <button type="button" class="btn primary" id="retakeTest">🔄 Ulangi ${testLabel()}</button>`;
 $("#retakeTest").onclick=startTest;
 if(typeof renderDashboard==="function")renderDashboard();if(typeof renderAchievements==="function")renderAchievements();if(typeof renderProfile==="function")renderProfile();
 window.scrollTo({top:document.body.scrollHeight,behavior:"smooth"});
}
document.querySelectorAll(".v8-test-tabs button").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".v8-test-tabs button").forEach(x=>x.classList.remove("active"));b.classList.add("active");testMode=b.dataset.test;renderTestSetup()}));
$("#startTest")?.addEventListener("click",startTest);$("#submitTest")?.addEventListener("click",()=>submitTest(false));renderTestSetup();

/* ===== v7: SRS + Dashboard + Dictionary + Achievements + Speaking Tutor + Stroke Order ===== */
state.srs = state.srs || {};
state.daily = state.daily || {date:"",count:0};
state.achievements = state.achievements || {};
const todayKey = new Date().toISOString().slice(0,10);
if(state.daily.date!==todayKey){state.daily={date:todayKey,count:0};save()}

function srsKey(c){return c.level+"|"+c.word}
function getSRS(c){
  const k=srsKey(c);
  if(!state.srs[k]) state.srs[k]={box:0,due:Date.now(),seen:0};
  return state.srs[k]
}
function srsDue(c){return getSRS(c).due<=Date.now()}
function srsAnswer(c,quality){
  const s=getSRS(c);s.seen++;
  const days={again:.02,hard:1,good:3,easy:7};
  if(quality==="again"){s.box=0;s.due=Date.now()+30*60*1000}
  else if(quality==="hard"){s.box=Math.max(1,s.box);s.due=Date.now()+24*60*60*1000}
  else if(quality==="good"){s.box=Math.min(5,s.box+1);s.due=Date.now()+days.good*24*60*60*1000}
  else{s.box=Math.min(6,s.box+2);s.due=Date.now()+days.easy*24*60*60*1000}
  state.daily.count++;save();renderSRS();renderDashboard();renderAchievements()
}
let reviewDeck=[],reviewIndex=0;
function buildReview(){
  const lv=$("#reviewLevel")?.value||"ALL";
  reviewDeck=CARDS.filter(c=>(lv==="ALL"||c.level===lv)&&srsDue(c));
  if(!reviewDeck.length){
    reviewDeck=CARDS.filter(c=>lv==="ALL"||c.level===lv).sort((a,b)=>getSRS(a).due-getSRS(b).due).slice(0,20)
  }
  reviewIndex=0;renderReview()
}
function renderReview(){
  const c=reviewDeck[reviewIndex];
  if(!c){$("#reviewWord").textContent="Belum ada kartu";$("#reviewReading").textContent="";$("#reviewMeaning").textContent="";return}
  const s=getSRS(c);
  $("#reviewWord").textContent=c.word;$("#reviewReading").textContent=c.reading;$("#reviewMeaning").textContent=c.meaning;$("#reviewSentence").textContent=c.sentence;
  $("#reviewMeta").textContent=`${c.level} · ${c.category} · Box ${s.box} · ${s.due<=Date.now()?"siap direview":"terjadwal"}`
}
function reviewRate(q){
  const c=reviewDeck[reviewIndex];if(!c)return;
  srsAnswer(c,q);reviewIndex=(reviewIndex+1)%Math.max(1,reviewDeck.length);renderReview()
}
function renderSRS(){
  const due=CARDS.filter(srsDue).length;
  const learning=CARDS.filter(c=>{const s=getSRS(c);return s.seen>0&&s.box<3}).length;
  const mastered=CARDS.filter(c=>getSRS(c).box>=5).length;
  if($("#srsDue"))$("#srsDue").textContent=due;
  if($("#srsLearning"))$("#srsLearning").textContent=learning;
  if($("#srsMastered"))$("#srsMastered").textContent=mastered;
}
function renderDashboard(){
  const known=Object.values(state.learned).filter(x=>x==="known").length;
  const acc=state.attempts?Math.round(state.correct/state.attempts*100):0;
  $("#dashStreak") && ($("#dashStreak").textContent=state.streak+" hari");
  $("#dashLearned") && ($("#dashLearned").textContent=known);
  $("#dashAccuracy") && ($("#dashAccuracy").textContent=acc+"%");
  $("#dashDue") && ($("#dashDue").textContent=CARDS.filter(srsDue).length);
  ["N5","N4"].forEach(l=>{
    const total=CARDS.filter(c=>c.level===l).length;
    const done=CARDS.filter(c=>c.level===l&&state.learned[srsKey(c)]==="known").length;
    const pct=total?Math.round(done/total*100):0;
    const bar=$("#dash"+l),text=$("#dash"+l+"Text");
    if(bar)bar.style.width=pct+"%";if(text)text.textContent=pct+"%";
  });
  const goal=Math.min(20,state.daily.count);
  $("#goalText") && ($("#goalText").textContent=`${goal} / 20 aktivitas`);
  $("#goalBar") && ($("#goalBar").style.width=(goal/20*100)+"%");
}
const ACH=[
  ["first","🌱","Langkah Pertama","Menyelesaikan 1 aktivitas"],
  ["ten","📚","10 Aktivitas","Menyelesaikan 10 aktivitas"],
  ["words100","💯","100 Kotoba","Mencapai 100 kotoba hafal"],
  ["kanji50","漢","Kanji 50","Mencapai 50 kanji"],
  ["streak7","🔥","7 Hari","Streak mencapai 7"],
  ["accuracy90","🎯","Akurat","Akurasi minimal 90% dengan 20+ jawaban"],
  ["test","📝","Test Pertama","Menyelesaikan test"],
  ["review","🧠","Review Pintar","Menyelesaikan 20 review"]
];
function achievementUnlocked(id){
  const attempts=state.attempts,known=Object.values(state.learned).filter(x=>x==="known").length;
  const kanji=Object.keys(state.learned).filter(k=>/[\u3400-\u9fff]/.test(k.split("|")[1])&&state.learned[k]==="known").length;
  return ({first:attempts>=1,ten:attempts>=10,words100:known>=100,kanji50:kanji>=50,streak7:state.streak>=7,accuracy90:attempts>=20&&state.correct/attempts>=.9,test:(state.testRuns||0)>=1,review:(state.reviewCount||0)>=20})[id];
}
function renderAchievements(){
  if(!$("#achievementGrid"))return;
  let unlocked=0;
  $("#achievementGrid").innerHTML=ACH.map(a=>{
    const ok=achievementUnlocked(a[0]);if(ok)unlocked++;
    return `<div class="achievement ${ok?"unlocked":""}"><div class="icon">${a[1]}</div><b>${a[2]}</b><div class="muted">${a[3]}</div>${ok?"<small>✓ Terbuka</small>":""}</div>`
  }).join("");
  $("#achievementCount").textContent=`${unlocked} / ${ACH.length}`
}
function renderDictionary(){
  const q=($("#dictSearch")?.value||"").toLowerCase().trim(),lv=$("#dictLevel")?.value||"ALL";
  const arr=CARDS.filter(c=>(lv==="ALL"||c.level===lv)&&(!q||[c.word,c.reading,c.meaning,c.sentence].join(" ").toLowerCase().includes(q))).slice(0,60);
  $("#dictResults").innerHTML=arr.map(c=>`<article class="dict-item" data-dict="${srsKey(c)}"><div class="jp">${c.word}</div><div class="reading">${c.reading}</div><b>${c.meaning}</b><small>${c.level} · ${c.category}</small></article>`).join("")||"<div class='panel'>Tidak ditemukan.</div>";
  $$("#dictResults .dict-item").forEach(el=>el.onclick=()=>{
    const c=CARDS.find(x=>srsKey(x)===el.dataset.dict);if(!c)return;
    $("#dictDetail").classList.remove("hidden");
    $("#dictDetail").innerHTML=`<div class="eyebrow">${c.level} · ${c.category}</div><h2 class="jp">${c.word}</h2><div class="reading">${c.reading}</div><h3>${c.meaning}</h3><p class="jp">${c.sentence}</p><p>${c.translation}</p><button class="btn primary" id="dictSpeak">🔊 Dengarkan</button>`;
    $("#dictSpeak").onclick=()=>speak(c.reading);
    $("#dictDetail").scrollIntoView({behavior:"smooth",block:"center"});
    setModeStat("kanji");
  });
}
$("#reviewLevel")?.addEventListener("change",buildReview);
$("#reviewAgain")?.addEventListener("click",()=>{state.reviewCount=(state.reviewCount||0)+1;reviewRate("again")});
$("#reviewHard")?.addEventListener("click",()=>{state.reviewCount=(state.reviewCount||0)+1;reviewRate("hard")});
$("#reviewGood")?.addEventListener("click",()=>{state.reviewCount=(state.reviewCount||0)+1;reviewRate("good")});
$("#reviewEasy")?.addEventListener("click",()=>{state.reviewCount=(state.reviewCount||0)+1;reviewRate("easy")});
$("#dictSearch")?.addEventListener("input",renderDictionary);$("#dictLevel")?.addEventListener("change",renderDictionary);

function enhanceStrokeTrainer(){
  if(!$("#strokeOrderInfo"))return;
  const k=()=>$("#strokeKanji")?.textContent||"";
  const info={一:["いち","—",1],二:["に","—",2],三:["さん","—",3],人:["ひと","ジン/ニン",2],水:["みず","スイ",4],木:["き","モク/ボク",4],日:["ひ","ニチ/ジツ",4],月:["つき","ゲツ/ガツ",4],火:["ひ","カ",4],山:["やま","サン",3],川:["かわ","セン",3],学:["まなぶ","ガク",8],校:["—","コウ",10],語:["かたる","ゴ",14],食:["たべる","ショク",9],飲:["のむ","イン",12],見:["みる","ケン",7],行:["いく","コウ/ギョウ",6],来:["くる","ライ",7]};
  const x=info[k()];$("#strokeOrderInfo").innerHTML=x?`<b>Kun-yomi:</b> ${x[0]} · <b>On-yomi:</b> ${x[1]} · <b>Level:</b> ${strokeCard?.level||"N5"} · <b>Target strokes:</b> ${x[2]}`:`<b>Kanji:</b> ${k()} · gunakan latihan gores untuk melihat perkiraan jumlah goresan.`;
}
const oldNewStroke=newStroke;
newStroke=function(){oldNewStroke();enhanceStrokeTrainer()};

function setupV7SpeakingHTML(){
  if($("#speaking")&&!$("#speakLog")) {
    const sec=$("#speaking");
    sec.querySelector(".panel")?.insertAdjacentHTML("afterbegin",'<div class="panel"><div class="eyebrow">LOCAL AI TUTOR</div><h3>🗣️ Tutor Jepang 5 Menit</h3><p class="muted">Gunakan mikrofon. Tutor ini memakai Speech Recognition + respons kontekstual di browser, jadi belum membutuhkan API key.</p><div id="speakLog" class="conversation-log"><div class="dialog-line tutor"><b>AI</b><span class="jp">こんにちは！5分間、日本語で話してみましょう。</span></div></div><div class="study-actions"><button id="speakStart" class="btn primary">🎙️ Bicara</button><button id="speakClear" class="btn">Bersihkan</button></div></div>');
  }
}
function setupV7StrokeHTML(){
  if($("#stroke")&&!$("#strokeOrderInfo")){
    const detail=$("#stroke").querySelector(".panel");
    if(detail)detail.insertAdjacentHTML("beforeend",'<div id="strokeOrderInfo" class="panel" style="margin-top:12px"></div>');
  }
}
setupV7SpeakingHTML();setupV7StrokeHTML();initSpeakingTutor();
renderSRS();buildReview();renderDashboard();renderDictionary();renderAchievements();

;

/* Add daily activity to existing record flow without changing its scoring behavior */
const oldRecord=record;
record=function(mode,correct,card){
  oldRecord(mode,correct,card);
  state.daily.count=(state.daily.count||0)+1;
  if(card){
    const s=getSRS(card);
    s.seen++;
    if(correct){s.box=Math.min(6,s.box+1);s.due=Date.now()+(s.box>=5?7:3)*86400000}
    else{s.box=0;s.due=Date.now()+30*60000}
  }
  save();renderSRS();renderDashboard();renderAchievements();
};
renderSRS();renderDashboard();renderAchievements();
