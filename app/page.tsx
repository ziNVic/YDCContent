"use client";

import { FormEvent, useMemo, useRef, useState } from "react";

type ReviewType = "需处理" | "建议优化" | "人工核验";

type ReviewItem = {
  id: string;
  type: ReviewType;
  title: string;
  source: string;
  suggestion: string;
  feedback: string;
  position?: number;
  paragraph?: number;
};

type KimiIssue = {
  category?: string;
  severity?: string;
  quote?: string;
  title?: string;
  suggestion?: string;
  feedback?: string;
  paragraph?: number;
};

const executiveTitles = [
  ["谢韫之", "联合创始人兼首席执行官"],
  ["王硕", "联席首席执行官"],
  ["莫珏慧", "集团副总裁"],
  ["李燕", "集团副总裁"],
  ["王俊", "大区总经理"],
  ["赵伟", "大区总经理"],
  ["徐姣姣", "大区总经理"],
  ["袁涛", "大区总经理"],
];

const proofreadingRules = [
  {
    wrong: "这仅位",
    right: "这位",
    reason: "疑似多输入“仅”字",
  },
  {
    wrong: "每三位",
    right: "每一位",
    reason: "量词搭配疑似误写",
  },
  {
    wrong: "西心",
    right: "细心",
    reason: "常见形近字误写",
  },
  {
    wrong: "五十多岁岁的",
    right: "五十多岁",
    reason: "年龄表述中“岁”字重复",
  },
];

const genderByName: Record<string, "男" | "女"> = {
  谢韫之: "女", 王硕: "男", 莫珏慧: "女", 李燕: "女", 王俊: "男", 赵伟: "男", 徐姣姣: "女", 袁涛: "男",
};

const cityNames = ["北京", "上海", "天津", "重庆", "杭州", "南京", "郑州", "成都", "昆明", "宁波", "绍兴", "台州", "兰州", "广州", "苏州", "杭州", "开封"];

const demoText = `以专业守护，为长者添暖｜杭州易得康走进社区开展长护险政策宣讲

7月20日，杭州易得康走进滨江区社区，为老人及家属讲解长护险政策和申请流程。活动现场，工作人员通过案例说明服务内容，并为居民提供咨询。

易得康联合创始人谢韫之走访现场时表示，将持续以专业服务守护每一位服务对象。未来，我们将全面覆盖更多社区，让更多家庭享受优质服务。`;

function buildReview(text: string): ReviewItem[] {
  const items: ReviewItem[] = [];
  const add = (item: Omit<ReviewItem, "id">) =>
    items.push({ ...item, id: `${items.length + 1}` });

  proofreadingRules.forEach(({ wrong, right, reason }) => {
    if (text.includes(wrong)) {
      add({
        type: "需处理",
        title: "文字校对：疑似错别字或误输入",
        source: wrong,
        suggestion: right,
        feedback: `文中“${wrong}”建议修改为“${right}”，原因：${reason}。`,
      });
    }
  });

  if (/长护险/.test(text) && !/长期护理保险（以下简称[“"]长护险[”"]）/.test(text)) {
    add({
      type: "需处理",
      title: "长护险首次出现建议补全全称",
      source: "长护险",
      suggestion: "长期护理保险（以下简称“长护险”）",
      feedback: "文中“长护险”首次出现，建议修改为“长期护理保险（以下简称‘长护险’）”，以符合统一口径。",
    });
  }

  if (/老人/.test(text)) {
    add({
      type: "建议优化",
      title: "服务对象称谓可更贴合品牌表达",
      source: "老人",
      suggestion: "可结合语境改为“长者”或“被照护者”",
      feedback: "文中出现“老人”，可结合当地服务对象范围与上下文，酌情调整为“长者”或“被照护者”，使称谓更审慎、统一。",
    });
  }

  if (/病人/.test(text)) {
    add({
      type: "需处理",
      title: "服务对象称谓建议统一",
      source: "病人",
      suggestion: "患者",
      feedback: "文中“病人”建议修改为“患者”。涉及疾病的客户，统一使用“患者”称谓，使表达更准确、规范。",
    });
  }

  if (/慰问/.test(text)) {
    add({
      type: "建议优化",
      title: "“慰问”建议使用更中性的服务表达",
      source: "慰问",
      suggestion: "上门关爱、探访或走访",
      feedback: "文中“慰问”建议结合实际场景修改为“上门关爱”“探访”或“走访”等表述，避免产生不必要的语义偏差。",
    });
  }

  if (/按摩|康复/.test(text)) {
    add({
      type: "人工核验",
      title: "服务项目表述需结合当地目录核验",
      source: text.match(/按摩|康复/)?.[0] ?? "服务项目",
      suggestion: "请核对当地医保部门公布的服务项目及规范名称",
      feedback: "文中涉及服务项目相关表述，建议与当地长期护理保险服务目录核对后再发布；如需保留，请补充可核验的官方依据。",
    });
  }

  if (/凯翎|CareLinx/.test(text) && !/易得康自研CareLinx凯瓴数字化运营监管系统/.test(text)) {
    add({
      type: "需处理",
      title: "CareLinx凯瓴名称建议使用全称",
      source: text.match(/凯翎|CareLinx/)?.[0] ?? "系统名称",
      suggestion: "易得康自研CareLinx凯瓴数字化运营监管系统",
      feedback: "文中系统名称建议统一为“易得康自研CareLinx凯瓴数字化运营监管系统”，以保证品牌表述一致。",
    });
  }

  if (/全国|首个|唯一|首批|全面覆盖|全部/.test(text)) {
    add({
      type: "人工核验",
      title: "绝对化或范围性表述建议补充依据",
      source: text.match(/全国|首个|唯一|首批|全面覆盖|全部/)?.[0] ?? "范围性表述",
      suggestion: "保留前请核对发布日期、统计口径与官方或书面证明",
      feedback: "文中存在“首个／全国／全面覆盖”等范围性表述。建议核对时间点和统计口径；若暂无明确依据，可调整为更审慎的事实性表达。",
    });
  }

  executiveTitles.forEach(([name, title]) => {
    if (text.includes(name)) {
      add({
        type: "人工核验",
        title: "内部高管 title 请按名单复核",
        source: name,
        suggestion: `${name}：${title}`,
        feedback: `文中出现“${name}”，建议根据内部高管 title 名单核对称谓及职务；当前标准职务为“${title}”。`,
      });
    }
  });

  const repeatedPhrases = text.match(/([\u4e00-\u9fff]{2,6})\1/g) ?? [];
  [...new Set(repeatedPhrases)].forEach((phrase) => add({
    type: "需处理",
    title: "文字校对：疑似重复词语",
    source: phrase,
    suggestion: "请删除重复部分后复核语意",
    feedback: `文中“${phrase}”疑似存在重复词语，建议删除重复部分并复核语意。`,
  }));

  const quantityPhrases = text.match(/每[二三四五六七八九十两]位/g) ?? [];
  [...new Set(quantityPhrases)].forEach((phrase) => add({
    type: "人工核验",
    title: "建议人工核验检查：数量与量词表达",
    source: phrase,
    suggestion: "请核对是否应为“每一位”，或补充明确的数量对象",
    feedback: `建议人工核验检查：文中“${phrase}”的数量与量词表达可能不符合原意，请结合上下文确认。`,
  }));

  const vagueMatches = text.match(/相关领导|有关领导|相关负责人|某部门负责人|相关部门|有关部门/g) ?? [];
  [...new Set(vagueMatches)].forEach((phrase) => add({
    type: "人工核验",
    title: "建议人工核验检查：人物或机构描述较模糊",
    source: phrase,
    suggestion: "如可公开，建议明确姓名、机构、部门与职务；如不可公开，请确认模糊表述是否合适",
    feedback: `建议人工核验检查：文中“${phrase}”指向较模糊，请确认是否需要补充人物或机构的准确信息。`,
  }));

  const externalRoles = text.match(/副?局长|主任|书记|处长|科长|主席|会长/g) ?? [];
  [...new Set(externalRoles)].forEach((role) => add({
    type: "人工核验",
    title: "建议人工核验检查：外部人物 title",
    source: role,
    suggestion: "请通过官方渠道或对接方书面确认姓名、机构及现任职务",
    feedback: `建议人工核验检查：文中涉及外部人物“${role}”title，请通过官方渠道或对接方确认后再发布。`,
  }));

  Object.entries(genderByName).forEach(([name, gender]) => {
    const mismatch = gender === "女" ? "他" : "她";
    const nameAt = text.indexOf(name);
    const pronounAt = text.indexOf(mismatch, nameAt);
    if (nameAt >= 0 && pronounAt >= nameAt && pronounAt - nameAt < 80) add({
      type: "需处理",
      title: "文字校对：人物代词可能不一致",
      source: mismatch,
      suggestion: gender === "女" ? "她" : "他",
      feedback: `文中“${name}”后出现“${mismatch}”，与内部名单中的称谓信息可能不一致，建议复核人物代词。`,
    });
  });

  const exaggerated = text.match(/最专业|顶级|领先|卓越|一流|显著提升|大幅提升|极大缓解|全面覆盖|全方位/g) ?? [];
  [...new Set(exaggerated)].forEach((phrase) => add({
    type: "人工核验",
    title: "建议人工核验检查：形容词或效果表述较强",
    source: phrase,
    suggestion: "请补充事实或数据依据；如无充分依据，建议改为更审慎的描述",
    feedback: `建议人工核验检查：文中“${phrase}”属于较强的形容或效果表述，请核对是否有事实、数据或书面依据支撑。`,
  }));

  const phone = text.match(/(?<!\d)1[3-9]\d{9}(?!\d)/)?.[0];
  if (phone) add({ type: "需处理", title: "隐私检查：疑似手机号", source: phone, suggestion: "删除、脱敏或确认已取得公开授权", feedback: "文中疑似包含手机号，发布前请删除、脱敏或确认已取得公开授权。" });
  const idNumber = text.match(/\d{17}[\dXx]/)?.[0];
  if (idNumber) add({ type: "需处理", title: "隐私检查：疑似身份证号", source: idNumber, suggestion: "删除或脱敏处理", feedback: "文中疑似包含身份证号码，请删除或进行脱敏处理后再发布。" });

  if (/[，。！？]{2,}/.test(text) || ((text.match(/“/g)?.length ?? 0) !== (text.match(/”/g)?.length ?? 0))) add({
    type: "需处理",
    title: "文字校对：标点符号可能不规范",
    source: "标点符号",
    suggestion: "请核对连续标点或引号是否成对使用",
    feedback: "文中存在连续标点或引号数量不一致的情况，建议逐处核对。",
  });

  const cities = cityNames.filter((city) => text.includes(city));
  if (new Set(cities).size >= 2) add({
    type: "人工核验",
    title: "建议人工核验检查：城市或地域信息",
    source: "城市信息",
    suggestion: "请核对活动地点、服务主体、政策口径是否属于同一城市／区域",
    feedback: "建议人工核验检查：文章同时出现多个城市／区域名称，请核对活动地点、服务主体和政策口径是否准确一致。",
  });

  if (text.length < 320) {
    add({
      type: "建议优化",
      title: "正文信息量可再充实",
      source: "全文",
      suggestion: "可补充事件背景、具体行动或服务对象视角",
      feedback: "文章篇幅较短。可结合内容类型补充具体事实、服务场景或活动成果，增强信息完整性；无需刻意拉长篇幅。",
    });
  }

  if (!/未来|后续|将持续|下一步/.test(text)) {
    add({
      type: "建议优化",
      title: "结尾可考虑回扣服务价值或后续行动",
      source: "结尾段",
      suggestion: "按实际情况补充后续安排或服务价值",
      feedback: "如文章内容适用，可在结尾简要回扣活动意义、服务价值或后续行动，使全文收束更完整。",
    });
  }

  return items;
}

type ParagraphInfo = { number: number; value: string; start: number };

function getParagraphs(text: string): ParagraphInfo[] {
  const paragraphs: ParagraphInfo[] = [];
  const lines = /[^\r\n]+/g;
  let match: RegExpExecArray | null;
  while ((match = lines.exec(text)) !== null) {
    if (match[0].trim()) paragraphs.push({ number: paragraphs.length + 1, value: match[0], start: match.index });
  }
  return paragraphs;
}

function locationsForSource(paragraphs: ParagraphInfo[], source: string) {
  if (!source || ["全文", "结尾段", "标点符号", "城市信息"].includes(source)) return [];
  return paragraphs.flatMap((paragraph) => {
    const locations: Array<{ paragraph: number; position: number }> = [];
    let offset = paragraph.value.indexOf(source);
    while (offset >= 0) {
      locations.push({ paragraph: paragraph.number, position: paragraph.start + offset });
      offset = paragraph.value.indexOf(source, offset + source.length);
    }
    return locations;
  });
}

function locateAndSort(text: string, items: ReviewItem[]) {
  const paragraphs = getParagraphs(text);
  const located = items.flatMap((item) => {
    const hintedParagraph = item.paragraph ? paragraphs.find((paragraph) => paragraph.number === item.paragraph) : undefined;
    const hintedOffset = hintedParagraph?.value.indexOf(item.source) ?? -1;
    const locations = hintedParagraph && hintedOffset >= 0
      ? [{ paragraph: hintedParagraph.number, position: hintedParagraph.start + hintedOffset }]
      : locationsForSource(paragraphs, item.source);
    return locations.map((location, index) => ({ ...item, id: locations.length > 1 ? `${item.id}-${index + 1}` : item.id, ...location }));
  });
  const seen = new Set<string>();
  return located
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || b.source.length - a.source.length)
    .filter((item) => {
      const key = `${item.paragraph}|${item.position}|${item.source}|${item.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function TypePill({ type }: { type: ReviewType }) {
  return <span className={`type-pill ${type === "需处理" ? "critical" : type === "人工核验" ? "verify" : "suggestion"}`}>{type}</span>;
}

function AnnotatedParagraph({ paragraph, reviews }: { paragraph: string; reviews: ReviewItem[] }) {
  const sources = [...new Set(reviews.map((item) => item.source).filter((source) => !["全文", "结尾段"].includes(source) && paragraph.includes(source)))].sort((a, b) => b.length - a.length);
  if (!sources.length) return <>{paragraph}</>;
  const pattern = new RegExp(`(${sources.map((source) => source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "g");
  return <>{paragraph.split(pattern).map((part, index) => sources.includes(part) ? <span key={`${part}-${index}`}><span className="inline-warning" title="此处有审核反馈">⚠️</span><mark>{part}</mark></span> : <span key={`${part}-${index}`}>{part}</span>)}</>;
}

export default function Home() {
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [flashingParagraph, setFlashingParagraph] = useState<number | null>(null);
  const [aiReviews, setAiReviews] = useState<ReviewItem[]>([]);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const resultsRef = useRef<HTMLElement>(null);
  const reviews = useMemo(() => (submitted ? locateAndSort(text, [...aiReviews, ...buildReview(text)]) : []), [submitted, text, aiReviews]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!text.trim()) return;
    setIsReviewing(true);
    setReviewError(null);
    setAiReviews([]);
    try {
      const response = await fetch("/api/review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
      const data = await response.json() as { error?: string; issues?: KimiIssue[] };
      if (!response.ok) throw new Error(data.error ?? "模型审核暂不可用。");
      setAiReviews((data.issues ?? []).map((issue, index) => ({
        id: `ai-${index + 1}`,
        type: issue.severity === "需处理" || issue.severity === "人工核验" ? issue.severity : "建议优化",
        title: `${issue.category ?? "内容审核"}：${issue.title ?? "建议复核"}`,
        source: issue.quote ?? "",
        suggestion: issue.suggestion ?? "请结合原文复核",
        feedback: issue.feedback ?? "请结合原文复核。",
        paragraph: issue.paragraph,
      })));
      setSubmitted(true);
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : "模型审核暂不可用。");
      setSubmitted(true);
    } finally {
      setIsReviewing(false);
      window.setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    }
  };

  const copyFeedback = async (item: ReviewItem) => {
    try {
      await navigator.clipboard.writeText(item.feedback);
      setCopied(item.id);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied(null);
    }
  };

  const locateParagraph = (paragraph?: number) => {
    if (!paragraph) return;
    document.getElementById(`paragraph-${paragraph}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    setFlashingParagraph(paragraph);
    window.setTimeout(() => setFlashingParagraph(null), 1500);
  };

  return (
    <main>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand"><img className="brand-logo" src="/易得康LOGO横版.png" alt="易得康" /><span className="platform-name">易得康内容初审平台</span><em>市场推广中心</em></div>
          <span className="topbar-note">版本：v1.03.260721</span>
        </div>
      </header>

      <section className="hero">
        <div className="hero-inner">
          <div className="eyebrow">REGIONAL CONTENT REVIEW</div>
          <h1>让每一次对外发布更专业、更一致。</h1>
        </div>
      </section>

      <section className="review-form-wrap" aria-labelledby="submit-title">
        <div className="section-heading">
          <div><span className="step">01</span><h2 id="submit-title">提交文章</h2></div>
          <span className="required">* 仅粘贴纯文本</span>
        </div>
        <div className="guide">
          <strong>使用说明</strong>
          <ol><li>粘贴待审核文章的标题及正文，点击“提交审核”。</li><li>平台将针对可定位的问题生成初审反馈，供修改与自检。</li><li>本平台仅用于发布前自检；发布前仍请发送至审核群，完成人工终审。</li></ol>
        </div>
        <form onSubmit={submit}>
          <label className="sr-only" htmlFor="article">文章正文</label>
          <textarea id="article" value={text} onChange={(event) => { setText(event.target.value); setSubmitted(false); setAiReviews([]); setReviewError(null); }} placeholder="请粘贴文章标题和正文…" />
          <div className="form-actions">
            <button type="button" className="text-button" onClick={() => { setText(demoText); setSubmitted(false); }}>加载示例</button>
            <div><span className="count">{text.length} 字</span><button className="primary-button" type="submit" disabled={!text.trim() || isReviewing}>{isReviewing ? "文章审核中" : <>提交审核 <span>→</span></>}</button></div>
          </div>
        </form>
      </section>

      {submitted && <section className="results" ref={resultsRef} aria-labelledby="result-title">
        <div className="results-head">
          <div><span className="step">02</span><h2 id="result-title">初审反馈</h2></div>
          <p>共识别 <strong>{reviews.length}</strong> 项，请逐条判断并处理。</p>
        </div>
        {reviewError && <p className="review-error">模型审核未完成：{reviewError}；已展示本地规则反馈。</p>}
        <div className="legend"><TypePill type="需处理" /><span>统一口径或明确规范</span><TypePill type="人工核验" /><span>需人工确认事实依据</span><TypePill type="建议优化" /><span>可酌情采纳</span></div>
        <div className="review-grid">
          <article className="original-panel">
            <div className="panel-title"><span>原文</span><small>提交内容</small></div>
            <div className="article-copy">{getParagraphs(text).map((paragraph) => <p id={`paragraph-${paragraph.number}`} className={flashingParagraph === paragraph.number ? "flash" : ""} key={`${paragraph.start}-${paragraph.number}`}><b>{String(paragraph.number).padStart(2, "0")}</b><span><AnnotatedParagraph paragraph={paragraph.value} reviews={reviews.filter((item) => item.paragraph === paragraph.number)} /></span></p>)}</div>
          </article>
          <aside className="feedback-panel">
            <div className="panel-title"><span>反馈标注</span><small>按优先级处理</small></div>
            <div className="feedback-list">
              {reviews.length === 0 ? <p className="no-feedback">未识别到可精确定位的审核问题。</p> : reviews.map((item, index) => <article className="feedback-card" key={item.id}>
                <div className="feedback-meta"><span className="index">{String(index + 1).padStart(2, "0")}</span><span className="feedback-location">第 {item.paragraph} 段</span><TypePill type={item.type} /></div>
                <h3>{item.title}</h3>
                <dl><div><dt>原文定位</dt><dd>“{item.source}”</dd></div><div><dt>建议方向</dt><dd>{item.suggestion}</dd></div></dl>
                <div className="feedback-actions">{item.paragraph && <button className="locate-button" type="button" onClick={() => locateParagraph(item.paragraph)}>定位原文</button>}<button className="copy-button" type="button" onClick={() => copyFeedback(item)}>{copied === item.id ? "已复制" : "复制反馈"}</button></div>
              </article>)}
            </div>
          </aside>
        </div>
      </section>}

      <footer>易得康市场推广中心 · 内容初审平台 v1.03.260721</footer>
    </main>
  );
}
