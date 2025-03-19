import OpenAI from "openai";

const PROMPT =
  '请将下面的 JSON 对象中的每个文本段落进行温和化处理，保持原意不变，只去除负面情绪。请严格返回一个 JSON 对象，其键与输入相同，值为修改后的文本。不要添加任何额外的内容、注释或 Markdown 标记。输入的 JSON 对象格式如下：\n{"node_0": "文本1", "node_1": "文本2", ...}';

const KEY = ""; // 请替换为实际 API 密钥

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "API_REQUEST" && message.data) {
    processCombinedText(message.data)
      .then((result) => sendResponse({ success: true, data: result }))
      .catch((error) => {
        console.error("API 调用错误：", error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
});

async function processCombinedText(jsonText) {
  const client = new OpenAI({
    apiKey: KEY,
    baseURL: "https://api.x.ai/v1",
    dangerouslyAllowBrowser: true,
  });

  const fullPrompt = `${PROMPT}\n${jsonText}`;
  const completion = await client.chat.completions.create({
    model: "grok-2-latest",
    messages: [{ role: "user", content: fullPrompt }],
  });
  return completion.choices[0].message.content;
}
