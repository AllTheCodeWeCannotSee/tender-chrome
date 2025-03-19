import OpenAI from "openai";

const PROMPT =
  "Please rewrite the following text, preserving its original meaning and all factual information without adding any new content, while removing any negative emotional tone. Only return the portions of the text that have been modified. If no modifications are necessary, return false. Do not include any default messages or additional explanations. Original text:";
const KEY = "your-key"; // 请替换为你的实际 API 密钥

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "API_REQUEST" && message.data) {
    tenderCallback(message.data)
      .then((result) => {
        sendResponse({ success: true, data: result });
      })
      .catch((error) => {
        console.error("API 调用错误：", error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // 表示将异步响应
  }
});

async function tenderCallback(text) {
  const client = new OpenAI({
    apiKey: KEY, // 请替换为你的实际 API 密钥
    baseURL: "https://api.x.ai/v1",
    dangerouslyAllowBrowser: true,
  });

  const completion = await client.chat.completions.create({
    model: "grok-2-latest",
    messages: [
      {
        role: "user",
        content: PROMPT + text,
      },
    ],
  });
  if (completion.choices[0].message.content === "false") {
    return text;
  } else {
    return "😄" + completion.choices[0].message.content;
  }
}
