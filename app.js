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

const SOURCE_TKA={
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

/* ===== v8.5 Exam Center: 90-minute, 4-section tests ===== */
const V8_BANK={
N5:{
  "Kosakata":[
    ['「水」 dibaca…',['みず','みせ','みち','みみ'],0,'水（みず） berarti air.'],['「学校」 artinya…',['rumah sakit','sekolah','stasiun','kantor'],1,'学校（がっこう） berarti sekolah.'],['「昨日」 artinya…',['hari ini','besok','kemarin','minggu depan'],2,'昨日（きのう） berarti kemarin.'],['「午前」 berarti…',['AM/sebelum siang','PM','tengah malam','minggu depan'],0,'午前（ごぜん） berarti AM atau sebelum siang.'],['「先生」 berarti…',['murid','guru','dokter','teman'],1,'先生（せんせい） berarti guru.'],['「駅」 berarti…',['stasiun','taman','rumah','sekolah'],0,'駅（えき） berarti stasiun.'],['「大きい」 lawannya…',['あたらしい','ちいさい','たかい','おもしろい'],1,'大きい（おおきい） = besar, lawannya 小さい（ちいさい） = kecil.'],['「安い」 berarti…',['mahal','murah','jauh','sibuk'],1,'安い（やすい） berarti murah.'],['「来週」 berarti…',['minggu ini','minggu lalu','minggu depan','bulan depan'],2,'来週（らいしゅう） berarti minggu depan.'],['「家族」 berarti…',['keluarga','kelas','perusahaan','tetangga'],0,'家族（かぞく） berarti keluarga.'],['「食べる」 berarti…',['minum','makan','tidur','membeli'],1,'食べる（たべる） berarti makan.'],['「飲む」 berarti…',['membaca','minum','menulis','berjalan'],1,'飲む（のむ） berarti minum.'],['「新しい」 berarti…',['lama','baru','tinggi','cepat'],1,'新しい（あたらしい） berarti baru.'],['「天気」 berarti…',['cuaca','waktu','uang','kamar'],0,'天気（てんき） berarti cuaca.'],['「毎日」 berarti…',['setiap hari','setiap minggu','kemarin','malam ini'],0,'毎日（まいにち） berarti setiap hari.'],['「名前」 berarti…',['nama','umur','alamat','nomor'],0,'名前（なまえ） berarti nama.'],['「友達」 berarti…',['saudara','teman','guru','tetangga'],1,'友達（ともだち） berarti teman.'],['「時間」 berarti…',['jam/waktu','uang','cuaca','jalan'],0,'時間（じかん） berarti waktu/durasi.'],['「右」 berarti…',['kiri','kanan','atas','bawah'],1,'右（みぎ） berarti kanan.'],['「左」 berarti…',['kiri','kanan','depan','belakang'],0,'左（ひだり） berarti kiri.']
  ],
  "Tata Bahasa":[
    ['わたしは 毎日 七時___ 起きます。',['に','を','で','が'],0,'に dipakai untuk waktu tertentu: 七時に.'],['学校___ 日本語を 勉強します。',['で','に','を','へ'],0,'で menunjukkan tempat berlangsungnya aktivitas.'],['水___ 飲みます。',['が','を','で','に'],1,'を menandai objek langsung: 水を飲みます.'],['毎朝 パン___ 食べます。',['を','に','で','へ'],0,'パン adalah objek yang dimakan, jadi memakai を.'],['田中さん___ 学生です。',['は','を','で','に'],0,'は menandai topik: 田中さんは.'],['七時___ 八時まで 勉強します。',['から','で','を','へ'],0,'から berarti mulai dari; pola から～まで.'],['これは だれ___ 本ですか。',['の','を','に','で'],0,'の menghubungkan kepemilikan: だれの本.'],['日曜日___ 休みます。',['に','を','が','で'],0,'Hari/tanggal tertentu memakai に.'],['バス___ 学校へ 行きます。',['で','を','に','が'],0,'で menunjukkan alat/transportasi.'],['りんごが 三つ___ あります。',['が','を','に','で'],0,'Pola keberadaan: りんごが三つあります.'],['ここ___ 本を 読みます。',['で','に','を','が'],0,'Aktivitas membaca dilakukan di tempat: で.'],['日本語___ わかります。',['が','を','で','へ'],0,'わかります lazim memakai が untuk hal yang dipahami.'],['コーヒー___ 飲みません。',['を','に','で','が'],0,'Objek minum memakai を.'],['「いっしょに 行きませんか。」 respons yang cocok…',['はい、行きましょう。','いいえ、行きました。','はい、行きません。','行きましたか。'],0,'～ませんか adalah ajakan; respons positif: 行きましょう.'],['きのう 本を___。',['読みました','読みます','読むです','読んでいます'],0,'きのう menunjukkan lampau, jadi 読みました.'],['これは わたし___ かばんです。',['の','を','へ','で'],0,'の menyatakan kepunyaan: tas saya.'],['教室に 先生___ います。',['が','を','で','へ'],0,'Orang yang berada di suatu tempat ditandai が.'],['机の 上___ 本が あります。',['に','を','で','へ'],0,'に menunjukkan lokasi keberadaan benda.'],['毎日 日本語を___。',['勉強します','勉強でした','勉強するです','勉強しませんでした'],0,'毎日 menunjukkan kebiasaan; bentuk sopan non-lampau: 勉強します.'],['「何時ですか。」 「___ 八時です。」',['ちょうど','まで','しか','から'],0,'ちょうど berarti tepat/pas.']
  ],
  "Membaca":[
    ['Teks: 「まいにち 7じに おきます。それから あさごはんを たべます。8じに がっこうへ いきます。」 Kapan pergi ke sekolah?',['6じ','7じ','8じ','9じ'],2,'Teks menyebut 8じに がっこうへ いきます.'],['Teks: 「きょうは にちようびです。デパートへ いきません。うちで ほんを よみます。」 Apa yang dilakukan di rumah?',['menonton film','membaca buku','belajar di sekolah','memasak'],1,'Kalimat ほんを よみます berarti membaca buku.'],['Teks: 「田中さんは 会社員です。月曜日から 金曜日まで はたらきます。」 Kapan bekerja?',['Senin–Jumat','Sabtu saja','Minggu saja','setiap malam'],0,'月曜日から金曜日まで berarti Senin sampai Jumat.'],['Teks: 「駅は ここから みぎです。銀行の となりです。」 Lokasi stasiun?',['di kiri bank','di sebelah bank','di belakang rumah','di dalam sekolah'],1,'銀行のとなり berarti di sebelah bank.'],['Teks: 「あした 友達と 公園へ いきます。おにぎりを たべます。」 Dengan siapa pergi?',['guru','keluarga','teman','sendiri'],2,'友達と berarti bersama teman.'],['Teks: 「きのうは 雨でした。どこへも いきませんでした。」 Mengapa tidak pergi?',['karena hujan','karena sakit','karena ujian','karena bekerja'],0,'Stimulus menyebut kemarin hujan dan tidak pergi ke mana pun.'],['Teks: 「わたしの へやに つくえと ベッドが あります。パソコンは つくえの うえです。」 Komputer berada…',['di bawah meja','di atas meja','di tempat tidur','di luar kamar'],1,'つくえのうえ berarti di atas meja.'],['Teks: 「母は 先生です。父は 会社員です。」 Pekerjaan ibu?',['dokter','guru','pegawai bank','murid'],1,'先生 berarti guru.'],['Teks: 「土曜日は 10じに おきます。朝ごはんを たべてから スーパーへ いきます。」 Setelah sarapan ia…',['tidur','ke supermarket','ke sekolah','bekerja'],1,'たべてから berarti setelah makan/sarapan.'],['Teks: 「この かばんは 5000円です。あの かばんは 3000円です。」 Tas mana lebih murah?',['yang ini','yang itu','keduanya sama','tidak diketahui'],1,'3000円 lebih murah daripada 5000円.'],['Teks: 「図書館は 9じから 5じまでです。」 Jam buka perpustakaan?',['7–9','9–5','10–6','8–4'],1,'Dari 9 sampai 5.'],['Teks: 「わたしは 毎晩 11じに ねます。日曜日だけ 12じに ねます。」 Kapan tidur pukul 12?',['Senin','Sabtu','Minggu','setiap hari'],2,'日曜日だけ berarti hanya hari Minggu.'],['Teks: 「スーパーで 牛乳と パンを かいました。りんごは かいませんでした。」 Apa yang tidak dibeli?',['susu','roti','apel','semuanya'],2,'りんごは かいませんでした = tidak membeli apel.'],['Teks: 「山田さんは 日本語を 勉強しています。英語も 少し わかります。」 Bahasa apa yang sedang dipelajari?',['Inggris','Jepang','Korea','Indonesia'],1,'日本語を勉強しています.'],['Teks: 「駅まで バスで 20分です。歩くと 40分です。」 Dengan bus berapa menit?',['10','20','30','40'],1,'Bus membutuhkan 20 menit.'],['Teks: 「今日は さむいです。コートを きます。」 Mengapa memakai mantel?',['karena panas','karena dingin','karena hujan','karena sakit'],1,'さむい berarti dingin.'],['Teks: 「姉は 毎朝 コーヒーを 飲みます。わたしは お茶を 飲みます。」 Apa yang diminum pembicara?',['kopi','teh','air','susu'],1,'お茶 berarti teh.'],['Teks: 「日曜日に 京都へ 行きました。お寺を 見ました。」 Ke mana pergi?',['Tokyo','Kyoto','Osaka','Nara'],1,'京都（きょうと） disebut langsung.'],['Teks: 「8じに うちを でて、8じ半に 学校へ つきました。」 Berapa lama perjalanan?',['15 menit','30 menit','45 menit','1 jam'],1,'8:00 ke 8:30 = 30 menit.'],['Teks: 「この 店は 月曜日が 休みです。火曜日は あいています。」 Kapan toko tutup?',['Senin','Selasa','Rabu','Minggu'],0,'月曜日が休み berarti Senin libur/tutup.']
  ],
  "Mendengarkan":[
    ['Audio: 「みずを おねがいします。」 Apa yang diminta?',['air','kopi','roti','teh'],0,'みず berarti air.'],['Audio: 「あした 7じに おきます。」 Kapan bangun?',['6','7','8','9'],1,'7じに berarti pukul 7.'],['Audio: 「でんしゃで いきます。」 Transportasinya?',['bus','kereta','sepeda','jalan kaki'],1,'でんしゃ berarti kereta.'],['Audio: 「きょうは さむいですね。」 Keadaannya?',['panas','dingin','sibuk','ramai'],1,'さむい berarti dingin.'],['Audio: 「りんごを 三つ ください。」 Berapa apel?',['1','2','3','4'],2,'三つ berarti tiga buah.'],['Audio: 「学校は 8じからです。」 Sekolah mulai…',['7','8','9','10'],1,'8じから = mulai pukul 8.'],['Audio: 「日曜日に うちで べんきょうします。」 Belajar di mana?',['sekolah','rumah','perpustakaan','taman'],1,'うち berarti rumah.'],['Audio: 「きのう えいがを みました。」 Apa yang dilakukan?',['membaca buku','menonton film','makan','belanja'],1,'えいがをみました berarti menonton film.'],['Audio: 「おとうさんは 会社員です。」 Pekerjaan ayah?',['guru','pegawai perusahaan','dokter','murid'],1,'会社員 berarti pegawai perusahaan.'],['Audio: 「コーヒーは いくらですか。300円です。」 Harga kopi?',['100','200','300','400'],2,'Jawaban audio: 300円です.'],['Audio: 「駅は どこですか。あそこです。」 Apa yang ditanyakan?',['waktu','harga','lokasi stasiun','nama'],2,'どこですか menanyakan lokasi.'],['Audio: 「毎朝 パンを たべます。」 Kebiasaan apa?',['sarapan roti','minum kopi','tidur','berlari'],0,'毎朝パンをたべます = setiap pagi makan roti.'],['Audio: 「田中さんは きません。」 Siapa yang tidak datang?',['Yamada','Tanaka','Suzuki','Sato'],1,'Nama yang disebut adalah Tanaka.'],['Audio: 「本を 5さつ かりました。」 Berapa buku dipinjam?',['3','4','5','6'],2,'5さつ berarti lima buku.'],['Audio: 「あしたは 雨です。」 Cuaca besok?',['cerah','hujan','bersalju','berawan'],1,'雨 berarti hujan.'],['Audio: 「スーパーは 10じまでです。」 Toko buka sampai…',['8','9','10','11'],2,'10じまで = sampai pukul 10.'],['Audio: 「いっしょに ごはんを たべませんか。」 Apa maksud pembicara?',['mengajak makan','menolak makan','bertanya harga','meminta arah'],0,'～ませんか dipakai untuk mengajak.'],['Audio: 「わたしは 20さいです。」 Umurnya?',['18','19','20','21'],2,'20さい berarti berumur 20 tahun.'],['Audio: 「きょうは 金曜日です。」 Hari ini?',['Kamis','Jumat','Sabtu','Minggu'],1,'金曜日 berarti Jumat.'],['Audio: 「この かさは 1000円です。」 Harga payung?',['500','800','1000','1500'],2,'1000円 disebut langsung.']
  ]
},
N4:{
  "Kosakata":[
    ['「必要」 artinya…',['perlu/diperlukan','berbahaya','berbeda','sederhana'],0,'必要（ひつよう） berarti perlu/diperlukan.'],['「経験」 artinya…',['pengalaman','penjelasan','rencana','peraturan'],0,'経験（けいけん） berarti pengalaman.'],['「最近」 berarti…',['dulu','akhir-akhir ini','besok','selamanya'],1,'最近（さいきん） berarti akhir-akhir ini.'],['「説明」 berarti…',['penjelasan','perjalanan','undangan','perubahan'],0,'説明（せつめい） berarti penjelasan.'],['「将来」 berarti…',['masa depan','masa lalu','hari ini','waktu makan'],0,'将来（しょうらい） berarti masa depan.'],['「場合」 paling dekat artinya…',['keadaan/kasus','jawaban','orang','tempat'],0,'場合（ばあい） berarti keadaan atau kasus.'],['「準備」 berarti…',['persiapan','pembayaran','perjalanan','pertengkaran'],0,'準備（じゅんび） berarti persiapan.'],['「連絡」 berarti…',['menghubungi/kontak','mencuci','menyimpan','meminjam'],0,'連絡（れんらく） berarti menghubungi/kontak.'],['「約束」 berarti…',['janji','musim','cuaca','aturan sekolah'],0,'約束（やくそく） berarti janji.'],['「途中」 berarti…',['tengah/perjalanan berlangsung','awal','akhir','luar'],0,'途中（とちゅう） berarti di tengah/perjalanan berlangsung.'],['「参加」 berarti…',['berpartisipasi','menghilang','mengganti','memperbaiki'],0,'参加（さんか） berarti berpartisipasi.'],['「決める」 berarti…',['memutuskan','menghapus','meminjam','menjelaskan'],0,'決める（きめる） berarti memutuskan.'],['「続ける」 berarti…',['melanjutkan','menghentikan','menjual','menutup'],0,'続ける（つづける） berarti melanjutkan.'],['「比べる」 berarti…',['membandingkan','menghafal','menggambar','mengirim'],0,'比べる（くらべる） berarti membandingkan.'],['「増える」 berarti…',['bertambah','berkurang','berubah warna','berhenti'],0,'増える（ふえる） berarti bertambah.'],['「減る」 berarti…',['berkurang','bertambah','berpindah','berputar'],0,'減る（へる） berarti berkurang.'],['「危険」 berarti…',['berbahaya','aman','tenang','mudah'],0,'危険（きけん） berarti berbahaya.'],['「特別」 berarti…',['khusus','biasa','lambat','murah'],0,'特別（とくべつ） berarti khusus.'],['「自由」 berarti…',['bebas','sibuk','terlambat','terbatas'],0,'自由（じゆう） berarti bebas.'],['「普通」 berarti…',['biasa/umum','istimewa','sulit','berisik'],0,'普通（ふつう） berarti biasa/umum.']
  ],
  "Tata Bahasa":[
    ['雨が降った___、試合は中止になりました。',['ので','まで','しか','でも'],0,'ので menunjukkan alasan.'],['日本へ行く___、日本語を勉強しています。',['ために','だけ','しか','までに'],0,'ために menunjukkan tujuan.'],['宿題をして___、テレビを見ました。',['から','まで','しか','ほど'],0,'～てから berarti setelah melakukan.'],['この本は 子ども___ 読めます。',['でも','しか','ほど','だけで'],0,'でも dapat berarti bahkan/untuk menekankan kemungkinan: anak-anak pun bisa membaca.'],['駅に着い___、電話してください。',['たら','ても','ながら','しか'],0,'～たら menyatakan kondisi setelah tiba.'],['毎日練習すれば、上手に___と思います。',['なる','なった','ならないで','なって'],0,'～ば menyatakan kondisi; なると思います.'],['日本語が話せる___なりました。',['ように','ために','そうに','ほど'],0,'～ようになる menunjukkan perubahan kemampuan/kebiasaan.'],['忘れない___、メモしてください。',['ように','ので','しか','ながら'],0,'～ように menunjukkan tujuan agar sesuatu tidak terjadi.'],['電車は バス___ 速いです。',['より','ほど','しか','まで'],0,'より dipakai untuk perbandingan.'],['この問題は 思った___ 難しくありません。',['ほど','しか','まで','だけ'],0,'～ほど…ない = tidak sesulit yang dibayangkan.'],['学生の___、勉強を一生懸命しました。',['とき','ため','しか','ので'],0,'～とき berarti ketika.'],['食べ___ ながら、テレビを見ます。',['ながら','ので','ても','ばかり'],0,'～ながら berarti sambil.'],['彼は まだ 来て___。',['いません','ありません','しません','なりません'],0,'まだ + negatif: belum datang.'],['この店は 安い___、おいしいです。',['し','ので','まで','しか'],0,'～し dapat menghubungkan beberapa alasan/sifat.'],['明日は 雨___ かもしれません。',['かも','では','だけ','ほど'],0,'～かもしれません berarti mungkin.'],['先生に 本を 貸して___ました。',['いただき','くれ','あげ','もらい'],0,'～ていただきました adalah menerima bantuan secara sopan.'],['友達に 手伝って___。',['もらいました','あげました','くれません','なりました'],0,'～てもらいました berarti saya menerima bantuan.'],['忙しい___、毎日運動しています。',['のに','ので','ため','から'],0,'のに menunjukkan kontras: meskipun sibuk.'],['この薬を飲む___、少し休んでください。',['まえに','ながら','しか','ほど'],0,'～まえに berarti sebelum.'],['日本に来て___、日本語が好きになりました。',['から','まで','しか','だけ'],0,'～てから berarti sejak/setelah datang.']
  ],
  "Membaca":[
    ['Teks: 「最近、毎朝ジョギングをしています。最初は10分でしたが、今は30分続けられます。」 Sekarang berapa lama jogging?',['10 menit','20 menit','30 menit','60 menit'],2,'今は30分と disebut langsung.'],['Teks: 「雨が降ったので、試合は来週に延期されました。」 Mengapa pertandingan ditunda?',['peserta sakit','hujan','lapangan rusak','guru tidak datang'],1,'雨が降ったので = karena hujan.'],['Teks: 「旅行の前にホテルを予約しました。しかし、電車の切符はまだ買っていません。」 Apa yang belum dilakukan?',['memesan hotel','membeli tiket kereta','berangkat','makan'],1,'まだ買っていません berarti belum membeli.'],['Teks: 「この町では春になると桜がたくさん咲きます。毎年多くの人が見に来ます。」 Mengapa banyak orang datang?',['untuk melihat sakura','untuk bekerja','untuk berbelanja','untuk belajar'],0,'Mereka datang untuk melihat 桜.'],['Teks: 「山田さんは約束の時間より20分早く来ました。」 Bagaimana Yamada datang?',['20 menit terlambat','tepat waktu','20 menit lebih awal','1 jam lebih awal'],2,'より20分早く = 20 menit lebih awal.'],['Teks: 「健康のために、毎日野菜を食べて、夜は早く寝るようにしています。」 Apa yang dilakukan untuk kesehatan?',['sering begadang','makan sayur dan tidur cepat','tidak makan','berlari hanya Minggu'],1,'Stimulus menyebut makan sayur dan tidur lebih awal.'],['Teks: 「図書館は午後5時までです。ただし、金曜日は午後7時まで開いています。」 Jumat tutup pukul…',['5','6','7','8'],2,'金曜日は午後7時まで.'],['Teks: 「仕事が終わったら、駅前のレストランで友達と会う予定です。」 Apa rencananya?',['bertemu teman di restoran dekat stasiun','pulang langsung','belajar di perpustakaan','belanja di stasiun'],0,'駅前のレストランで友達と会う予定.'],['Teks: 「日本語の試験のために、毎晩1時間漢字を復習しています。」 Mengapa mengulang kanji?',['untuk ujian Jepang','untuk perjalanan','untuk pekerjaan paruh waktu','untuk olahraga'],0,'日本語の試験のために = untuk ujian bahasa Jepang.'],['Teks: 「電車が遅れたため、会議に10分遅れてしまいました。」 Mengapa terlambat?',['sakit','kereta terlambat','lupa waktu','macet'],1,'電車が遅れたため = karena kereta terlambat.'],['Teks: 「この店では現金だけでなく、カードも使えます。」 Selain uang tunai, apa yang bisa digunakan?',['cek','kartu','kupon','ponsel saja'],1,'カードも使えます.'],['Teks: 「来月から新しい仕事を始めるので、今月は準備をしています。」 Kapan mulai pekerjaan baru?',['bulan lalu','bulan ini','bulan depan','tahun depan'],2,'来月から = mulai bulan depan.'],['Teks: 「弟は料理が好きで、週末になると家族のために夕食を作ります。」 Kapan memasak?',['setiap pagi','hari kerja','akhir pekan','setiap malam'],2,'週末になると = ketika akhir pekan.'],['Teks: 「この薬は食事のあとに飲んでください。一日に三回です。」 Kapan minum obat?',['sebelum makan','setelah makan','saat tidur','sekali seminggu'],1,'食事のあと = setelah makan.'],['Teks: 「駅まで歩けば15分ですが、自転車なら5分です。」 Berapa menit dengan sepeda?',['5','10','15','20'],0,'自転車なら5分.'],['Teks: 「先生は、試験では辞書を使ってはいけないと言いました。」 Apa yang dilarang?',['menggunakan kamus','menulis','membaca','datang terlambat'],0,'使ってはいけない = tidak boleh menggunakan.'],['Teks: 「彼は忙しいのに、友達の引っ越しを手伝いました。」 Apa yang dilakukan meskipun sibuk?',['pindah rumah sendiri','membantu pindahan teman','pergi berlibur','belajar'],1,'友達の引っ越しを手伝いました.'],['Teks: 「明日のイベントは雨の場合、中止になります。」 Kapan acara dibatalkan?',['jika hujan','jika cerah','jika terlambat','jika peserta sedikit'],0,'雨の場合 = dalam keadaan hujan.'],['Teks: 「新しい駅ができてから、この町は前より便利になりました。」 Apa yang menjadi lebih nyaman?',['sekolah','kota/daerah ini','rumah','pekerjaan'],1,'この町は…便利になりました.'],['Teks: 「宿題が終わってから、ゲームをすることにしました。」 Kapan bermain game?',['sebelum tugas','setelah tugas selesai','saat pelajaran','besok pagi'],1,'宿題が終わってから = setelah PR selesai.']
  ],
  "Mendengarkan":[
    ['Audio: 「雨が降ったので、今日は試合がありません。」 Apa yang terjadi?',['pertandingan tetap berjalan','pertandingan dibatalkan/tidak ada','pertandingan dipercepat','latihan dipindah besok'],1,'Karena hujan, hari ini tidak ada pertandingan.'],['Audio: 「駅で友達に会ってから、一緒に映画を見ました。」 Apa urutannya?',['film lalu bertemu','bertemu teman lalu menonton film','pulang lalu bertemu','makan lalu tidur'],1,'会ってから menunjukkan bertemu dahulu, lalu menonton.'],['Audio: 「明日は午後から雨かもしれません。」 Kapan mungkin hujan?',['pagi','siang setelahnya','tengah malam saja','tidak diketahui sama sekali'],1,'午後から = mulai sore/siang setelahnya.'],['Audio: 「健康のために、毎朝30分歩くようにしています。」 Apa kebiasaannya?',['berlari 1 jam','berjalan 30 menit setiap pagi','tidur pagi','bersepeda malam'],1,'毎朝30分歩く.'],['Audio: 「この電車は新宿に止まりますか。いいえ、次の電車です。」 Kereta ini berhenti di Shinjuku?',['ya','tidak','hanya malam','tidak disebut'],1,'Jawabannya いいえ.'],['Audio: 「会議は3時ではなく、4時からです。」 Rapat mulai kapan?',['2','3','4','5'],2,'3時ではなく4時 = bukan jam 3, tetapi jam 4.'],['Audio: 「忘れないように、スマホにメモしました。」 Mengapa membuat catatan?',['agar tidak lupa','agar cepat tidur','agar bisa menjual','agar tidak pergi'],0,'忘れないように = agar tidak lupa.'],['Audio: 「仕事が終わったら、スーパーに寄って帰ります。」 Setelah kerja akan…',['langsung tidur','mampir ke supermarket lalu pulang','ke sekolah','berolahraga'],1,'スーパーに寄って帰ります.'],['Audio: 「この店は安いし、おいしいし、よく来ます。」 Mengapa sering datang?',['murah dan enak','jauh dan mahal','tutup cepat','hanya dekat rumah'],0,'安いし、おいしいし memberi dua alasan.'],['Audio: 「旅行にはパスポートが必要です。」 Apa yang diperlukan?',['paspor','kamus','payung','sepeda'],0,'パスポートが必要.'],['Audio: 「来週の月曜日までにレポートを出してください。」 Batas waktu?',['hari ini','Senin minggu depan','Jumat ini','bulan depan'],1,'月曜日までに = paling lambat Senin.'],['Audio: 「電車よりバスのほうが安いです。」 Mana lebih murah?',['kereta','bus','keduanya sama','tidak diketahui'],1,'バスのほうが安い.'],['Audio: 「先生に質問したところ、すぐ説明してくれました。」 Apa yang dilakukan guru?',['memberi penjelasan','pergi','menolak','meminjam buku'],0,'説明してくれました = guru menjelaskan kepada pembicara.'],['Audio: 「まだ宿題が終わっていません。」 Kondisi PR?',['sudah selesai','belum selesai','tidak ada PR','sudah dikumpulkan'],1,'まだ…終わっていません = belum selesai.'],['Audio: 「日本に来てから、毎日日本語を使っています。」 Sejak kapan memakai Jepang?',['sebelum datang','sejak datang ke Jepang','tahun depan','hanya kemarin'],1,'来てから = sejak/setelah datang.'],['Audio: 「この薬を飲めば、よくなると思います。」 Apa yang diperkirakan?',['akan membaik','akan memburuk','tidak berubah','harus pergi'],0,'よくなると思います = diperkirakan membaik.'],['Audio: 「電車が遅れたので、10分遅刻しました。」 Berapa terlambat?',['5','10','20','30'],1,'10分遅刻.'],['Audio: 「週末は家でゆっくりすることにしました。」 Apa rencana akhir pekan?',['bepergian','bersantai di rumah','bekerja','belajar di sekolah'],1,'家でゆっくりする.'],['Audio: 「会議の途中で電話が鳴りました。」 Kapan telepon berbunyi?',['sebelum rapat','di tengah rapat','setelah rapat','besok'],1,'途中 = di tengah.'],['Audio: 「参加したい人は、名前を書いてください。」 Siapa yang harus menulis nama?',['yang ingin ikut','yang tidak ikut','guru saja','semua orang yang pulang'],0,'参加したい人 = orang yang ingin berpartisipasi.']
  ]
}
};

function makeQ(row,section,id){return {id,section,q:row[0],o:row[1],a:row[2],e:row[3],skill:section,type:'mc'};}
function rotate(arr,n){return arr.slice(n).concat(arr.slice(0,n));}
function buildJLPT(level,testNo){
  const bank=V8_BANK[level],out=[];
  Object.keys(bank).forEach(section=>{
    const rows=rotate(bank[section],(testNo-1)*3%bank[section].length).slice(0,10);
    rows.forEach((r,i)=>out.push(makeQ(r,section,`${level}-${testNo}-${section}-${i}`)));
  });
  return out;
}
function buildTKA(testNo){
  const raw=SOURCE_TKA.TKA||[];
  const rows=rotate(raw,(testNo-1)*2%Math.max(1,raw.length));
  const out=[];
  rows.forEach((x,i)=>{
    if(x.type==='pgk') out.push({...x,id:`TKA-${testNo}-${i}`,section:i%2?'Membaca':'Pemahaman'});
    else out.push({...x,id:`TKA-${testNo}-${i}`,section:['Kosakata','Tata bahasa','Membaca','Mendengarkan'][i%4],type:'mc'});
  });
  // Always give TKA a balanced 40-question session; repeat/rotate source items when the source bank is smaller.
  const base=out.slice(); while(out.length<40) out.push({...base[out.length%base.length],id:`TKA-${testNo}-extra-${out.length}`});
  return out.slice(0,40);
}
function questionsFor(level,testNo){return level==='TKA'?buildTKA(testNo):buildJLPT(level,testNo)}
const TEST_CATALOG={N5:20,N4:20,TKA:10};
let selectedTestLevel='N5',selectedTestNo=1,testActive=false,testSeconds=5400,testTimerId=null,testAnswers={};
function levelTitle(l){return l==='TKA'?'TKA Bahasa Jepang':`JLPT ${l}`}
function sectionCounts(qs){return ['Kosakata','Tata bahasa','Membaca','Mendengarkan'].map(s=>[s,qs.filter(q=>q.section===s).length])}
function renderCatalog(){
 const el=$('#testCatalog'); if(!el)return;
 el.innerHTML=`<div class="catalog-head"><div><b>${TEST_CATALOG[selectedTestLevel]} test ditemukan</b><small>Setiap test · 90 menit · 4 sesi</small></div><div class="catalog-filter"><span>Urutan: Test 1 →</span></div></div><div class="test-grid">${Array.from({length:TEST_CATALOG[selectedTestLevel]},(_,i)=>{const n=i+1,qs=questionsFor(selectedTestLevel,n),pct=Number(localStorage.getItem(`nh_progress_${selectedTestLevel}_${n}`)||0),locked=n>3&&selectedTestLevel!=='TKA';return `<article class="test-card ${locked?'locked':''}"><div class="test-card-top"><h3>Test ${n}</h3><span>${locked?'🔒':'○'} </span></div><div class="test-card-line">📣 Titik lulus: <b>80 poin</b></div><div class="test-card-line">◷ Waktu: <b>90 menit</b></div><div class="test-card-line">◔ Kemajuan <b>${pct}%</b></div><div class="test-card-sections">${sectionCounts(qs).map(x=>`<span>${x[0]} ${x[1]}</span>`).join('')}</div><button class="test-card-detail" data-test-open="${n}">› Rincian</button></article>`}).join('')}</div>`;
 el.querySelectorAll('[data-test-open]').forEach(b=>b.onclick=()=>openTestDetail(+b.dataset.testOpen));
}
function openTestDetail(n){
 selectedTestNo=n; const qs=questionsFor(selectedTestLevel,n),el=$('#testDetail'); if(!el)return;
 el.classList.remove('hidden');
 el.innerHTML=`<div class="detail-head"><div><span class="eyebrow">${levelTitle(selectedTestLevel)}</span><h2>Test ${n}</h2><p>80 poin · 90 menit · ${qs.length} soal</p></div><button class="btn primary" id="beginSelectedTest">▶ Mulai Test ${n}</button></div><div class="section-stat-grid">${sectionCounts(qs).map(([s,c])=>`<div><b>${s}</b><strong>${c}</strong><small>soal</small></div>`).join('')}</div><div class="detail-note">📌 Setelah selesai, hasil akan dibagi menjadi <b>Kosakata · Tata bahasa · Membaca · Mendengarkan</b>, lengkap dengan analisis benar/salah dan pembahasan.</div>`;
 $('#beginSelectedTest').onclick=startTest;
 el.scrollIntoView({behavior:'smooth',block:'start'});
}
function updateTestProgress(){
 const qs=questionsFor(selectedTestLevel,selectedTestNo),keys=new Set(Object.keys(testAnswers));
 if($('#runningProgressText'))$('#runningProgressText').textContent=`${keys.size} / ${qs.length}`;
 if($('#testProgress'))$('#testProgress').style.width=(keys.size/qs.length*100)+'%';
}
function speakJP(text){if(!('speechSynthesis' in window))return;const u=new SpeechSynthesisUtterance(text.replace(/^Audio:\s*/,'').replace(/「|」/g,''));u.lang='ja-JP';u.rate=.86;window.speechSynthesis.cancel();window.speechSynthesis.speak(u)}
function renderQuestion(q,i){
 const audio=q.section==='Mendengarkan'?`<button type="button" class="audio-question" data-speak="${encodeURIComponent(q.q.replace(/^Audio:\s*/,''))}">🔊 Putar audio</button>`:'';
 if(q.type==='pgk')return `<article class="test-question" id="testQ${i}"><div class="question-head"><span class="q-number">${i+1}</span><div><small class="section-chip">${q.section}</small><h3>${q.q}</h3>${audio}</div></div>${q.statements.map((s,j)=>`<div class="pgk-row"><div><b>${String.fromCharCode(65+j)}.</b> ${s[0]}</div><label><input type="radio" name="tq${i}_${j}" value="true"> Benar</label><label><input type="radio" name="tq${i}_${j}" value="false"> Salah</label></div>`).join('')}</article>`;
 return `<article class="test-question" id="testQ${i}"><div class="question-head"><span class="q-number">${i+1}</span><div><small class="section-chip">${q.section}</small><h3>${q.q}</h3>${audio}</div></div><div class="test-options">${q.o.map((o,j)=>`<label><input type="radio" name="tq${i}" value="${j}"><span>${o}</span></label>`).join('')}</div></article>`;
}
function startTest(){
 if(testActive)return; testActive=true;testAnswers={};testSeconds=5400;
 $('#testCatalog')?.classList.add('hidden');$('#testDetail')?.classList.add('hidden');$('#testRunning')?.classList.remove('hidden');$('#testResult')?.classList.add('hidden');
 $('#runningTestLabel').textContent=`${levelTitle(selectedTestLevel)} · Test ${selectedTestNo}`;$('#testTimer').textContent='90:00';
 const qs=questionsFor(selectedTestLevel,selectedTestNo);$('#testArea').innerHTML=qs.map(renderQuestion).join('');
 $('#testArea').querySelectorAll('input').forEach(el=>el.addEventListener('change',()=>{testAnswers[el.name]=el.value;updateTestProgress()}));
 $('#testArea').querySelectorAll('.audio-question').forEach(b=>b.onclick=()=>speakJP(decodeURIComponent(b.dataset.speak)));
 updateTestProgress(); if(testTimerId)clearInterval(testTimerId);testTimerId=setInterval(()=>{testSeconds--;$('#testTimer').textContent=formatTime(testSeconds);if(testSeconds<=0)submitTest(true)},1000);window.scrollTo({top:0,behavior:'smooth'});
}
function collectTest(){
 const qs=questionsFor(selectedTestLevel,selectedTestNo);return qs.map((q,i)=>{
  if(q.type==='pgk'){let ok=true,answered=0,given=[];q.statements.forEach((s,j)=>{const el=document.querySelector(`input[name="tq${i}_${j}"]:checked`);const v=el?el.value:null;given.push(v);if(v!==null)answered++;if(v!==String(s[1]))ok=false});return {ok:ok&&answered===q.statements.length,answered,given}}
  const el=document.querySelector(`input[name="tq${i}"]:checked`);return {ok:!!el&&+el.value===q.a,answered:!!el,given:el?el.value:null};
 });
}
function renderResult(qs,res,auto){
 const section=['Kosakata','Tata bahasa','Membaca','Mendengarkan'];const rows=section.map(s=>{const ix=qs.map((q,i)=>q.section===s?i:-1).filter(i=>i>=0),ok=ix.filter(i=>res[i].ok).length;return [s,ok,ix.length,Math.round(ok/ix.length*100)]});
 const total=res.filter(x=>x.ok).length,pct=Math.round(total/qs.length*100);
 return `<div class="result-cover"><div><span class="eyebrow">${auto?'WAKTU HABIS · ':''}${levelTitle(selectedTestLevel).toUpperCase()}</span><h2>Test ${selectedTestNo} · Hasil</h2><p>Test Date ${new Date().toLocaleDateString('id-ID',{year:'numeric',month:'long',day:'2-digit'})}</p></div><div class="result-total"><b>${pct}</b><span>Poin / 100</span><small>${total}/${qs.length} soal benar</small></div></div><div class="result-sections">${rows.map(r=>`<div class="result-section-card"><div class="result-section-head"><div><b>${r[0]}</b><span>Benar ${r[1]}/${r[2]}</span></div><strong>${r[3]}%</strong></div><div class="mini-bar"><i style="width:${r[3]}%"></i></div><button class="detail-jump" data-section="${r[0]}">Rincian</button></div>`).join('')}</div><div class="result-tabs"><button class="active" data-filter="Semua">Semua</button><button data-filter="Salah">Salah</button><button data-filter="Benar">Benar</button></div><div id="resultReviews" class="result-reviews"></div><div class="result-actions"><button class="btn primary" id="backToCatalog">← Kembali ke daftar test</button><button class="btn" id="retryCurrent">🔄 Ulangi Test ${selectedTestNo}</button></div>`;
}
function renderReviews(filter='Semua',section='Semua'){
 const qs=questionsFor(selectedTestLevel,selectedTestNo),res=window._lastTestResults||[],el=$('#resultReviews');if(!el)return;
 el.innerHTML=qs.map((q,i)=>({q,i,r:res[i]})).filter(x=>(filter==='Semua'||(filter==='Benar'?x.r.ok:!x.r.ok))&&(section==='Semua'||x.q.section===section)).map(x=>{const q=x.q,r=x.r;let correct,your;if(q.type==='pgk'){correct=q.statements.map((s,j)=>`${String.fromCharCode(65+j)} ${s[1]?'Benar':'Salah'}`).join(' · ');your=r.given.map((v,j)=>`${String.fromCharCode(65+j)} ${v==null?'—':v==='true'?'Benar':'Salah'}`).join(' · ')}else{correct=q.o[q.a];your=r.given==null?'Belum dijawab':q.o[+r.given]};return `<article class="answer-review ${r.ok?'correct':'wrong'}"><div class="answer-review-top"><div><b>Soal ${x.i+1}</b><span class="section-chip">${q.section}</span></div><span>${r.ok?'✓ Benar':'✕ Salah'}</span></div><p>${q.q}</p><div><b>Jawaban benar:</b> ${correct}</div><div><b>Jawaban kamu:</b> ${your}</div><div class="explanation"><b>Jelaskan:</b><br>${q.e||'Periksa kembali kata kunci dan konteks soal.'}</div></article>`}).join('')||'<p class="muted">Tidak ada soal pada filter ini.</p>';
}
function submitTest(auto=false){
 if(!testActive)return;testActive=false;if(testTimerId)clearInterval(testTimerId);testTimerId=null;
 const qs=questionsFor(selectedTestLevel,selectedTestNo),res=collectTest(),score=res.filter(x=>x.ok).length,pct=Math.round(score/qs.length*100);window._lastTestResults=res;
 localStorage.setItem(`nh_progress_${selectedTestLevel}_${selectedTestNo}`,String(pct));
 state.testRuns=(state.testRuns||0)+1;state.attempts=(state.attempts||0)+qs.length;state.correct=(state.correct||0)+score;save();
 $('#testRunning').classList.add('hidden');$('#testResult').classList.remove('hidden');$('#testResult').innerHTML=renderResult(qs,res,auto);renderReviews();
 document.querySelectorAll('.result-tabs button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.result-tabs button').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderReviews(b.dataset.filter)});
 document.querySelectorAll('.detail-jump').forEach(b=>b.onclick=()=>renderReviews('Semua',b.dataset.section));
 $('#backToCatalog').onclick=()=>{renderCatalog();$('#testResult').classList.add('hidden');$('#testCatalog').classList.remove('hidden');window.scrollTo({top:0,behavior:'smooth'})};
 $('#retryCurrent').onclick=startTest;renderCatalog();if(typeof renderDashboard==='function')renderDashboard();if(typeof renderAchievements==='function')renderAchievements();
 window.scrollTo({top:0,behavior:'smooth'});
}
document.querySelectorAll('.test-level-tabs button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.test-level-tabs button').forEach(x=>x.classList.remove('active'));b.classList.add('active');selectedTestLevel=b.dataset.level;$('#testDetail')?.classList.add('hidden');$('#testResult')?.classList.add('hidden');$('#testRunning')?.classList.add('hidden');$('#testCatalog')?.classList.remove('hidden');renderCatalog()});
$('#submitTest')?.addEventListener('click',()=>submitTest(false));renderCatalog();

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
const VERB_TYPES={
  "食べる":"ichidan","見る":"ichidan","寝る":"ichidan","起きる":"ichidan","始める":"ichidan","終わる":"godan","続ける":"ichidan","決める":"ichidan","考える":"ichidan","調べる":"ichidan","忘れる":"ichidan","覚える":"ichidan","比べる":"ichidan","変える":"ichidan","来る":"kuru","勉強する":"suru","参加する":"suru",
  "飲む":"godan","読む":"godan","書く":"godan","行く":"iku","帰る":"godan","買う":"godan","話す":"godan","会う":"godan","聞く":"godan","使う":"godan","選ぶ":"godan","戻る":"godan","決まる":"godan"
};
const GODAN={"う":{i:"い",a:"わ",e:"え",o:"お",te:"って",past:"った"},"つ":{i:"ち",a:"た",e:"て",o:"と",te:"って",past:"った"},"る":{i:"り",a:"ら",e:"れ",o:"ろ",te:"って",past:"った"},"む":{i:"み",a:"ま",e:"め",o:"も",te:"んで",past:"んだ"},"ぶ":{i:"び",a:"ば",e:"べ",o:"ぼ",te:"んで",past:"んだ"},"ぬ":{i:"に",a:"な",e:"ね",o:"の",te:"んで",past:"んだ"},"く":{i:"き",a:"か",e:"け",o:"こ",te:"いて",past:"いた"},"ぐ":{i:"ぎ",a:"が",e:"げ",o:"ご",te:"いで",past:"いだ"},"す":{i:"し",a:"さ",e:"せ",o:"そ",te:"して",past:"した"}};
function verbType(c){return VERB_TYPES[c.word]||VERB_TYPES[c.word.replace(/\s/g,'')]||null}
function conjugateVerb(c){
 const w=c.word, type=verbType(c), stem=w.slice(0,-1), last=w.slice(-1), g=GODAN[last];
 if(!type)return null;
 if(type==='ichidan'){
  const s=stem;return {dictionary:w,polite:s+'ます',negative:s+'ない',politeNegative:s+'ません',past:s+'た',politePast:s+'ました',te:s+'て',progressive:s+'ています',progressiveNegative:s+'ていません',potential:s+'られる',potentialPolite:s+'られます',potentialNegative:s+'られない',passive:s+'られる',passivePolite:s+'られます',causative:s+'させる',causativePolite:s+'させます',causativePassive:s+'させられる',volitional:s+'よう',volitionalPolite:s+'ましょう',imperative:s+'ろ',conditionalBa:s+'れば',conditionalTara:s+'たら',desire:s+'たい',desireNegative:s+'たくない'};
 }
 if(type==='suru'){
  const base=w.slice(0,-2),s=base+'し';return {dictionary:w,polite:s+'ます',negative:s+'ない',politeNegative:s+'ません',past:s+'た',politePast:s+'ました',te:s+'て',progressive:s+'ています',progressiveNegative:s+'ていません',potential:base+'できる',potentialPolite:base+'できます',potentialNegative:base+'できない',passive:s+'られる',passivePolite:s+'られます',causative:s+'させる',causativePolite:s+'させます',causativePassive:s+'させられる',volitional:s+'よう',volitionalPolite:s+'ましょう',imperative:s+'ろ',conditionalBa:s+'れば',conditionalTara:s+'たら',desire:s+'たい',desireNegative:s+'たくない'};
 }
 if(type==='kuru'){
  return {dictionary:w,polite:'来ます',negative:'来ない',politeNegative:'来ません',past:'来た',politePast:'来ました',te:'来て',progressive:'来ています',progressiveNegative:'来ていません',potential:'来られる',potentialPolite:'来られます',potentialNegative:'来られない',passive:'来られる',passivePolite:'来られます',causative:'来させる',causativePolite:'来させます',causativePassive:'来させられる',volitional:'来よう',volitionalPolite:'来ましょう',imperative:'来い',conditionalBa:'来れば',conditionalTara:'来たら',desire:'来たい',desireNegative:'来たくない'};
 }
 if(type==='iku'){
  return {dictionary:w,polite:'行きます',negative:'行かない',politeNegative:'行きません',past:'行った',politePast:'行きました',te:'行って',progressive:'行っています',progressiveNegative:'行っていません',potential:'行ける',potentialPolite:'行けます',potentialNegative:'行けない',passive:'行かれる',passivePolite:'行かれます',causative:'行かせる',causativePolite:'行かせます',causativePassive:'行かせられる',volitional:'行こう',volitionalPolite:'行きましょう',imperative:'行け',conditionalBa:'行けば',conditionalTara:'行ったら',desire:'行きたい',desireNegative:'行きたくない'};
 }
 return {dictionary:w,polite:w.slice(0,-1)+g.i,negative:w.slice(0,-1)+g.a+'ない',politeNegative:w.slice(0,-1)+g.i+'ません',past:w.slice(0,-1)+g.past,politePast:w.slice(0,-1)+g.i+'ました',te:w.slice(0,-1)+g.te,progressive:w.slice(0,-1)+g.te+'います',progressiveNegative:w.slice(0,-1)+g.te+'いません',potential:w.slice(0,-1)+g.e+'る',potentialPolite:w.slice(0,-1)+g.e+'ます',potentialNegative:w.slice(0,-1)+g.e+'ない',passive:w.slice(0,-1)+g.a+'れる',passivePolite:w.slice(0,-1)+g.a+'れます',causative:w.slice(0,-1)+g.a+'せる',causativePolite:w.slice(0,-1)+g.a+'せます',causativePassive:w.slice(0,-1)+g.a+'せられる',volitional:w.slice(0,-1)+g.o+'う',volitionalPolite:w.slice(0,-1)+g.i+'ましょう',imperative:w.slice(0,-1)+g.e,conditionalBa:w.slice(0,-1)+g.e+'ば',conditionalTara:w.slice(0,-1)+g.past+'ら',desire:w.slice(0,-1)+g.i+'たい',desireNegative:w.slice(0,-1)+g.i+'たくない'};
}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function verbDetail(c){
 const v=conjugateVerb(c);if(!v)return '';
 const rows=[
 ['Bentuk kamus · informal positif',v.dictionary,'Untuk menyatakan kebiasaan/fakta secara kasual.','私はご飯を '+v.dictionary+'。'],
 ['ます形 · formal positif',v.polite,'Sopan; umum dipakai saat berbicara dengan guru/orang yang belum akrab.','私はご飯を '+v.polite+'。'],
 ['ない形 · informal negatif',v.negative,'Menyatakan tidak melakukan.','今日はご飯を '+v.negative+'。'],
 ['ません · formal negatif',v.politeNegative,'Versi sopan dari negatif.','今日はご飯を '+v.politeNegative+'。'],
 ['た形 · informal lampau',v.past,'Menyatakan sudah melakukan.','昨日、ご飯を '+v.past+'。'],
 ['ました · formal lampau',v.politePast,'Versi sopan lampau.','昨日、ご飯を '+v.politePast+'。'],
 ['て形',v.te,'Menghubungkan aksi, permintaan, atau menjadi dasar beberapa pola.','ご飯を '+v.te+'ください。'],
 ['～ています · sedang/keadaan berlangsung',v.progressive,'Menunjukkan aktivitas yang sedang berlangsung atau keadaan yang masih berlaku.','今、ご飯を '+v.progressive+'。'],
 ['～ていません · sedang tidak',v.progressiveNegative,'Menyatakan belum/tidak sedang melakukan.','今、ご飯を '+v.progressiveNegative+'。'],
 ['Potential · kemampuan',v.potential,'Menyatakan bisa/mampu melakukan.','私は日本語で '+v.potential+'。'],
 ['Potential formal',v.potentialPolite,'Versi sopan kemampuan.','私は日本語で '+v.potentialPolite+'。'],
 ['Potential negatif',v.potentialNegative,'Menyatakan tidak bisa.','今日は '+v.potentialNegative+'。'],
 ['Passive · pasif',v.passive,'Subjek menerima tindakan.','私は先生に '+v.passive+'。'],
 ['Passive formal',v.passivePolite,'Versi sopan pasif.','私は先生に '+v.passivePolite+'。'],
 ['Causative · menyuruh/membiarkan',v.causative,'Membuat atau membiarkan seseorang melakukan.','先生は学生に '+v.causative+'。'],
 ['Causative formal',v.causativePolite,'Versi sopan kausatif.','先生は学生に '+v.causativePolite+'。'],
 ['Causative-passive · dipaksa',v.causativePassive,'Menyatakan dipaksa melakukan sesuatu.','私は先生に '+v.causativePassive+'。'],
 ['Volitional · mari/akan',v.volitional,'Niat atau ajakan dalam gaya informal.','一緒に '+v.volitional+'。'],
 ['Volitional formal',v.volitionalPolite,'Ajakan sopan.','一緒に '+v.volitionalPolite+'。'],
 ['Imperative · perintah',v.imperative,'Perintah langsung; terasa tegas, jadi gunakan sesuai situasi.','早く '+v.imperative+'！'],
 ['～ば · jika',v.conditionalBa,'Kondisional dengan ～ば.','時間があれば、'+v.conditionalBa+'。'],
 ['～たら · jika/setelah',v.conditionalTara,'Kondisional atau setelah suatu kejadian.','時間があったら、'+v.conditionalTara+'。'],
 ['～たい · ingin',v.desire,'Menyatakan keinginan pembicara untuk melakukan sesuatu.','私は日本へ '+v.desire+'。'],
 ['～たくない · tidak ingin',v.desireNegative,'Menyatakan tidak ingin melakukan.','今日は '+v.desireNegative+'。']
 ];
 const typeLabel=verbType(c)==='ichidan'?'一段動詞 · Ichidan':verbType(c)==='godan'?'五段動詞 · Godan':verbType(c)==='suru'?'する動詞 · Irregular': '不規則 · Irregular';
 return `<div class="dict-hero"><div><span class="dict-badge">${esc(c.level)} · ${esc(typeLabel)}</span><div class="dict-word jp">${esc(c.word)}</div><div class="dict-reading">${esc(c.reading)}</div><h3>${esc(c.meaning)}</h3><p>${esc(c.category)} · Bentuk dasar: <b>${esc(c.word)}</b></p></div><div class="dict-toolbar"><button id="dictSpeakWord">🔊 Dengarkan</button></div></div><div class="grammar-card"><h3>📐 Pola kalimat utama</h3><p><code>Topik は + objek を + kata kerja</code></p><div class="example-box"><b>Contoh:</b><br><span class="jp">私はご飯を${esc(v.polite)}。</span><br>Artinya: Saya ${esc(c.meaning)}.</div></div><div class="verb-table-wrap"><table class="verb-table"><thead><tr><th>Bentuk</th><th>Konjugasi</th><th>Kapan digunakan</th><th>Contoh pola</th></tr></thead><tbody>${rows.map(r=>`<tr><td><b>${esc(r[0])}</b></td><td><span class="verb-form jp">${esc(r[1])}</span></td><td>${esc(r[2])}</td><td><span class="jp">${esc(r[3])}</span></td></tr>`).join('')}</tbody></table></div><div class="grammar-card"><h3>🧠 Catatan belajar</h3><p>Gunakan bentuk <b>ます/ました/ません</b> saat membutuhkan gaya sopan. Bentuk kamus, ない, た, dan て lebih umum dalam pola informal dan tata bahasa.</p><p><b>Catatan:</b> bentuk pasif, kausatif, dan kausatif-pasif memiliki nuansa makna yang bergantung konteks.</p></div>`;
}
function renderDictionary(){
 const q=($('#dictSearch')?.value||'').toLowerCase().trim(),lv=$('#dictLevel')?.value||'ALL',cat=$('#dictCategory')?.value||'Semua kategori';
 const arr=CARDS.filter(c=>(lv==='ALL'||c.level===lv)&&(cat==='Semua kategori'||c.category===cat)&&(!q||[c.word,c.reading,c.meaning,c.sentence].join(' ').toLowerCase().includes(q))).slice(0,80);
 $('#dictResults').innerHTML=arr.map(c=>`<article class="dict-item" data-dict="${esc(srsKey(c))}"><div class="jp">${esc(c.word)}</div><div class="reading">${esc(c.reading)}</div><b>${esc(c.meaning)}</b><small>${esc(c.level)} · ${esc(c.category)}${verbType(c)?' · Konjugasi lengkap':''}</small></article>`).join('')||"<div class='panel'>Tidak ditemukan.</div>";
 $$('#dictResults .dict-item').forEach(el=>el.onclick=()=>{const c=CARDS.find(x=>srsKey(x)===el.dataset.dict);if(!c)return;$('#dictDetail').classList.remove('hidden');if(verbType(c))$('#dictDetail').innerHTML=verbDetail(c);else $('#dictDetail').innerHTML=`<div class="dict-hero"><div><span class="dict-badge">${esc(c.level)} · ${esc(c.category)}</span><div class="dict-word jp">${esc(c.word)}</div><div class="dict-reading">${esc(c.reading)}</div><h3>${esc(c.meaning)}</h3></div></div><div class="grammar-card"><h3>Contoh kalimat</h3><p class="jp">${esc(c.sentence)}</p><p>${esc(c.translation)}</p><button class="btn primary" id="dictSpeak">🔊 Dengarkan</button></div>`;$('#dictSpeakWord')?.addEventListener('click',()=>speak(c.reading));$('#dictSpeak')?.addEventListener('click',()=>speak(c.reading));$('#dictDetail').scrollIntoView({behavior:'smooth',block:'start'});setModeStat('kanji')});
}
$('#reviewLevel')?.addEventListener('change',buildReview);
$('#reviewAgain')?.addEventListener('click',()=>{state.reviewCount=(state.reviewCount||0)+1;reviewRate('again')});
$('#reviewHard')?.addEventListener('click',()=>{state.reviewCount=(state.reviewCount||0)+1;reviewRate('hard')});
$('#reviewGood')?.addEventListener('click',()=>{state.reviewCount=(state.reviewCount||0)+1;reviewRate('good')});
$('#reviewEasy')?.addEventListener('click',()=>{state.reviewCount=(state.reviewCount||0)+1;reviewRate('easy')});
$('#dictSearch')?.addEventListener('input',renderDictionary);$('#dictLevel')?.addEventListener('change',renderDictionary);$('#dictCategory')?.addEventListener('change',renderDictionary);

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
