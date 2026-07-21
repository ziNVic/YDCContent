type KimiIssue = {
  category?: string;
  severity?: string;
  quote?: string;
  title?: string;
  suggestion?: string;
  feedback?: string;
  paragraph?: number;
};

const systemPrompt = `你是易得康市场部的中文新媒体内容初审助手。审核文章时只输出能够精确定位到原文具体词语或完整句子的反馈。

重点检查：错别字、漏字、多字、同音字、重复字词、数字和量词、她/他指代、词语搭配、专业术语、病句、主谓关系、前后时间/人物/数据/因果矛盾、模糊描述、过强形容词与外部人物职务风险。涉及疾病的客户，称谓应使用“患者”，不称为“病人”。

严格要求：
1. paragraph 必须为文章中带方括号标出的段落编号。quote 必须是该段中连续出现的原样片段，长度 2-80 字，并且在该段只出现一次；如片段重复，请扩展 quote 直到可以唯一定位。无法精确定位则不要输出。
2. 不要给“全文检查”或泛泛而谈的建议；宁可少报，也不要臆测。
3. 固定事实、外部人物职务、数据、政策和夸大性表述使用“人工核验”；明确错别字、漏字、多字、病句使用“需处理”；可读性和语气使用“建议优化”。
4. 请用克制、可执行的中文反馈；不要改写整篇文章。
5. 仅返回 JSON，不要使用 Markdown。

返回格式：
{"issues":[{"paragraph":1,"category":"文字准确性|文章逻辑|表达|用词准确性|合规与事实","severity":"需处理|建议优化|人工核验","quote":"原文精确片段","title":"不超过22字","suggestion":"具体修改或核验方向","feedback":"可直接复制给投稿人的完整反馈"}]}`;

function parseIssues(content: string): KimiIssue[] {
  const json = content.replace(/^```json\s*|\s*```$/g, "").trim();
  const parsed = JSON.parse(json) as { issues?: KimiIssue[] };
  return Array.isArray(parsed.issues) ? parsed.issues : [];
}

export async function POST(request: Request) {
  const { text } = await request.json<{ text?: string }>();
  if (!text?.trim()) return Response.json({ error: "文章内容不能为空。" }, { status: 400 });
  const paragraphs = text.split(/\r?\n/).filter((paragraph) => paragraph.trim());

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return Response.json({ error: "未读取到线上 OpenAI API Key。请联系管理员配置。" }, { status: 503 });

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-5.5",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `请审核以下文章。每段前的编号用于返回 paragraph，不属于文章内容：\n\n${paragraphs.map((paragraph, index) => `[第${index + 1}段] ${paragraph}`).join("\n\n")}` },
      ],
      reasoning_effort: "none",
      response_format: { type: "json_object" },
      max_completion_tokens: 2200,
    }),
  });

  if (!response.ok) {
    const providerMessage = (await response.text()).replace(/\s+/g, " ").slice(0, 500);
    console.error(`OpenAI API request failed: HTTP ${response.status} ${providerMessage}`);
    return Response.json({ error: "OpenAI 审核请求失败，请稍后重试。" }, { status: 502 });
  }

  try {
    const result = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = result.choices?.[0]?.message?.content ?? "";
    const issues = parseIssues(content).filter((issue) => {
      const paragraph = issue.paragraph;
      const paragraphText = typeof paragraph === "number" ? paragraphs[paragraph - 1] : undefined;
      const quoteCount = paragraphText && issue.quote ? paragraphText.split(issue.quote).length - 1 : 0;
      return Number.isInteger(paragraph)
        && paragraph! >= 1
        && paragraph! <= paragraphs.length
        && issue.quote
        && quoteCount === 1
        && issue.title
        && issue.suggestion
        && issue.feedback;
    });
    return Response.json({ issues });
  } catch {
    return Response.json({ error: "模型返回内容无法解析，请重新提交。" }, { status: 502 });
  }
}
