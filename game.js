const app = document.getElementById('app');

// 教育用の簡易モデル
// 何もしなかった場合の仮想線量と、正解1問あたりの低減量です。
// 実災害の線量予測には使用できません。
const DOSE_MODEL = {
  baselineDoseMsV: 100.0,
  reductionPerCorrectMsV: 9.5
};

const stages = [
  {
    title: 'あなたのスマホに自治体から防災情報が届きました',
    notice: '原子力施設で異常が発生しました。現段階で放射性物質の放出はありません。落ち着いて、今後の情報に注意してください。',
    q: 'もっと情報がほしいあなたは、何を確認しますか？',
    choices: [
      ['A', '自治体ウェブサイトの防災情報ページ、公式SNSアカウント', 1],
      ['B', '投稿日時が新しく、再生回数も多い有名人が発信する動画', 0],
      ['C', '現在の原子力発電所の現地の様子（自ら見に行く）', 0]
    ],
    good: '事故初期は、自治体、国、報道機関など、根拠が確認できる情報源から正確な情報を得ることが大切です。',
    bad: 'デマ・うわさに注意して、出所が不確かな情報だけで判断したり、施設の様子を見に行ったりせず、公的機関や報道機関の情報を確認しましょう。',
    label: '正確な情報の入手'
  },
  {
    title: '続いて、自治体から次の防災情報が届きました',
    notice: '放射性物質の放出は起こっていませんが、原子力施設の状況が悪化しています。今後、屋内退避をお願いする可能性があります。自宅で屋内退避できない方は近隣の屋内退避ビルへ移動してください。',
    q: '幹線道路を見ると、避難している人もいるようです。あなたは何をしますか？',
    choices: [
      ['A', '備蓄状況や家族との連絡手順を確認', 1],
      ['B', '早めに自家用車で避難を開始する', 0],
      ['C', '安定ヨウ素剤を服用する', 0]
    ],
    good: '今後の屋内退避に備え、生活物資、家族との連絡方法、自治体からの情報を受け取る手段を確認しておきましょう。',
    bad: 'この段階では、指示に従って屋内退避の準備と情報収集を進めましょう。無計画な避難は大変危険です。また、安定ヨウ素剤はこの段階では効果がありません。',
    label: '屋内退避の準備'
  },
  {
    title: '屋内退避のお知らせが届きました',
    notice: '国より原子力緊急事態宣言が発出されました。放射性物質の放出のおそれがあります。対象地域の皆さんは、自宅などの建物内で屋内退避を行ってください。',
    q: '道路情報によると、現在、渋滞はないようです。どう行動しますか？',
    choices: [
      ['A', '避難先は出発後に決めるとして、とにかく遠くへ避難しておく', 0],
      ['B', '自宅に留まる', 1]
    ],
    good: '屋内退避の指示が出ている間は、建物内に留まり、自治体からの続報を確認します。',
    bad: '道路が空いていても、避難先や経路を決めずに移動すると、交通混乱や避難の難航など、被ばく低減につながらないばかりか健康リスク増大のおそれがあります。',
    label: '無計画な避難の回避'
  },
  {
    title: '引き続き、緊急事態です',
    notice: '現在、原子力施設の事態収束に向けた取組みが行われています。UPZ内住民の皆さんは屋内退避を継続してください。',
    q: '屋内退避中、家の中であなたはどのように過ごしますか？',
    choices: [
      ['A', '外の様子が見えるよう、窓際にいる', 0],
      ['B', '窓を開け、室内の換気をよくしておく', 0],
      ['C', '窓を閉め、部屋の中央付近にいる', 1]
    ],
    good: '屋内退避では、窓を閉め、部屋の中央付近にいることが最も被ばく低減に有効です。',
    bad: '窓を開けると外気が流入し、放射性物質が入ってきてしまいます。また、窓際（壁側）にいると、外部被ばくが大きくなってしまいます。',
    label: '避難経路等の確認'
  },
  {
    title: '屋内退避を続けています',
    notice: '現在、放射性物質の放出のおそれがあるため、屋内退避が指示されています。対象地域の皆さんは、自宅などの建物内で屋内退避を継続してください。',
    q: '屋内退避が長引き、生活物資が不足してきましたが、近くで供給が行われているようです。どう行動しますか？',
    choices: [
      ['A', '解除の指示があるまで何があっても外出しない', 0],
      ['B', '生活に最低限必要なもののみ受け取りに出かける', 1],
      ['C', '息抜きも必要なので、すぐに戻れないような遠くまで出かける', 0]
    ],
    good: '屋内退避中でも、生活を維持するための必要最低限の外出は可能です。ただし、外出を控える旨の連絡があったらすぐに建物内に戻れるようにします。',
    bad: '建物内に留まることは重要ですが、生活や生命の維持に必要な行動まで一律に止めるものではありません。',
    label: '屋内退避中の生活維持'
  },
  {
    title: 'プルーム放出の情報が届きました',
    notice: '放射線モニタリングにより、現在、放射性物質の放出が確認されています。外出を控え、屋内退避を継続してください。',
    q: '屋内退避で防ぐことができる被ばくは次のどれでしょうか？',
    choices: [
      ['A', '外部被ばくのみ', 0],
      ['B', '内部被ばくのみ', 0],
      ['C', '外部被ばくと内部被ばくの両方', 1]
    ],
    good: '建物には放射線を遮る効果があり、外部被ばくを低減できます。また、外気の流入を抑えることで、放射性物質の吸入による内部被ばくも低減できます。',
    bad: '屋内退避は、建物による遮へいと外気の流入抑制により、外部被ばくと内部被ばくの両方を低減します。',
    label: '屋内退避による被ばく低減'
  },
  {
    title: 'プルーム放出の続報が届きました',
    notice: '現在、追加的な放射性物質の放出のおそれはない状況ですが、必要に応じて避難指示を出しますので、引き続き屋内退避を継続してください。',
    q: 'あなたはどのように行動しますか？',
    choices: [
      ['A', '避難指示を待たずにすぐに避難を開始する', 0],
      ['B', '外の様子を見て、異常がなければ避難する', 0],
      ['C', '屋内退避しつつ、避難準備を進める', 1]
    ],
    good: '原子力施設が落ち着いても、大気中に放射性物質が滞留している可能性があります。屋内退避を継続しながら、次の指示に備えます。',
    bad: '放射性物質は目で確認できません。自己判断で屋外へ移動せず、屋内退避を続けて自治体からの情報を確認しましょう。',
    label: '放出中の屋内退避'
  },
  {
    title: '避難（一時移転）の指示がありました',
    notice: 'この地区では無用な被ばくを避けるため、一週間以内をめどに一時移転を行います。今後、避難経路等を指示しますので、落ち着いて行動してください。',
    q: 'あなたはどのように行動しますか？',
    choices: [
      ['A', '詳細な指示を待たずに避難を開始する', 0],
      ['B', '外の様子を見て、異常がなければ避難しない', 0],
      ['C', '指示に従って避難する', 1]
    ],
    good: '対象地域、避難先、避難経路などの案内を確認し、自治体の指示に従って計画的に移動します。',
    bad: '一時移転では対象地域と移動方法が示されます。自己判断ではなく、自治体の指示を確認しましょう。',
    label: '計画的な一時移転'
  },
  {
    title: '避難（一時移転）することになり、次の案内を受けました',
    notice: '〇〇市の△△公民館に避難してください。避難に当たっては、国道XX号沿いに避難退域時検査場所を用意していますので、途中でお立ち寄りください。検査場所では係の案内に従ってください。',
    q: '親戚からは、避難してきてよいと言われている。あなたはどうしますか？',
    choices: [
      ['A', '逆方向だが、案内を無視して親戚がいる実家に避難する', 0],
      ['B', '指示に従って指定されたルートで避難する', 1],
      ['C', '案内を無視して原子力発電所から遠ざかるように避難する', 0]
    ],
    good: '指定された経路で移動し、避難退域時検査場所に立ち寄って、係員の案内に従います。',
    bad: '自己判断で経路や避難先を変更せず、指定された経路で避難し、避難退域時検査を受けましょう。',
    label: '避難退域時検査の受検'
  },
  {
    title: 'いよいよ避難（一時移転）を開始します',
    notice: '自治体から示された避難経路と避難先を確認し、移動を始めます。',
    q: '服装・持ち物はどのようにしますか？',
    choices: [
      ['A', '着の身着のまま、急ぐことを最優先する', 0],
      ['B', 'できるだけ身軽にするため、半そでの服にし、荷物はできるだけ持たない', 0],
      ['C', 'レインコート・マスクで肌を覆い、着替えや生活必需品も持っていく', 1]
    ],
    good: '肌の露出を少なくし、必要な生活用品、常備薬、着替えなどを準備して移動します。',
    bad: '避難では速さだけを優先せず、肌の露出を抑え、必要な生活用品や常備薬などを準備しましょう。',
    label: '避難時の服装・持ち物'
  },
];

let idx = 0;
let answers = Array(stages.length).fill(null);

function shell(body) {
  app.innerHTML = `<div class="wrap">${body}</div>`;
}

function start() {
  idx = 0;
  answers = Array(stages.length).fill(null);
  renderQ();
}

function home() {
  shell(`<section class="hero">
    <div class="tag">原子力災害時の住民行動を学ぼう（UPZ版）</div>
    <h1>もしものとき、<br>あなたはどうする？</h1>
    <p>あなたは原子力発電所から5～30kmの地区に住むUPZ内住民です。<br>原子力災害に関わる防災情報を読み、そのときの行動を選んでください。</p>
    <div class="goals">原子力災害時の行動目的<br>❤ 命を守ること　×　☘ 被ばくを減らすこと</div>
    <button class="btn" onclick="start()">ゲームをはじめる</button>
    <div class="small">実際の災害の進展は異なる場合があります。</div>
  </section>`);
}

function prog() {
  return `<div class="progress">${stages.map((_, i) => `<div class="dot ${i <= idx ? 'on' : ''}"></div>`).join('')}</div>`;
}

function renderQ() {
  const s = stages[idx];
  shell(`<section class="card">
    ${prog()}
    <div class="tag">${idx + 1} / ${stages.length}</div>
    <h2>${s.title}</h2>
    <div class="notice">「${s.notice}」</div>
    <div class="question">${s.q}</div>
    ${s.choices.map(c => `<button class="choice" onclick="choose('${c[0]}', ${c[2]})"><b>${c[0]}</b>　${c[1]}</button>`).join('')}
    <div class="small">選択肢から選んでください。</div>
  </section>`);
}

function choose(letter, ok) {
  const reduction = ok ? DOSE_MODEL.reductionPerCorrectMsV : 0;
  answers[idx] = { letter, ok, reduction };
  const s = stages[idx];

  shell(`<section class="card feedback ${ok ? 'good' : 'bad'}">
    ${prog()}
    <div class="judge">${ok ? 'GOOD' : 'CHECK'}</div>
    <h2>${s.label}　被ばく低減 －${reduction.toFixed(1)}ミリシーベルト</h2>
    <p style="font-size:20px">${ok ? s.good : s.bad}</p>
    <div class="notice">あなたの選択：${letter}　${s.choices.find(c => c[0] === letter)[1]}</div>
    <button class="btn" onclick="back()">設問に戻る</button>
    <button class="btn" onclick="next()">${idx === stages.length - 1 ? '最終結果へ' : '次へ'}</button>
  </section>`);
}

function back() {
  renderQ();
}

function next() {
  if (idx < stages.length - 1) {
    idx++;
    renderQ();
  } else {
    result();
  }
}

function result() {
  const correctCount = answers.filter(a => a?.ok).length;
  const totalReductionMsV = correctCount * DOSE_MODEL.reductionPerCorrectMsV;
  const estimatedDoseMsV = Math.max(0, DOSE_MODEL.baselineDoseMsV - totalReductionMsV);
  const reductionPercent = Math.round((totalReductionMsV / DOSE_MODEL.baselineDoseMsV) * 100);

  shell(`<section class="card">
    <h1 class="score">被ばく低減の目安</h1>
    <div class="resultgrid">
      <div class="resultbox">
        <h2>あなたの行動による低減量</h2>
        <div class="score">${totalReductionMsV.toFixed(1)} mSv</div>
        <p>何もしなかった場合の仮想線量 ${DOSE_MODEL.baselineDoseMsV.toFixed(1)} mSv</p>
        <p>あなたの行動後の仮想線量 ${estimatedDoseMsV.toFixed(1)} mSv</p>
        <p>低減率 ${reductionPercent}%</p>
      </div>
      <div class="resultbox">
        <h2>行動別の結果</h2>
        ${stages.map((s, i) => `<div class="row"><span>${answers[i]?.ok ? '✓' : '△'} ${s.label}</span><b>＋${(answers[i]?.reduction || 0).toFixed(1)} mSv</b></div>`).join('')}
      </div>
    </div>
    <br>
    <button class="btn" onclick="home()">もう一度挑戦</button>
    <div class="small">被ばく線量は演出上の仮想的な値です。詳細な計算に基づくものではありません。</div>
  </section>`);
}

home();
