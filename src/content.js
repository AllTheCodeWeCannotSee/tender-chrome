// 存储待处理的节点信息和唯一 ID 映射
let pendingNodes = {};
const nodeIdMap = new WeakMap();
let uniqueIdCounter = 0;
const processedNodes = new WeakSet();
let debounceTimer = null;

function addTextNodes(root) {
  const treeWalker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        if (
          node.parentNode &&
          (node.parentNode.nodeName === "STYLE" ||
            node.parentNode.nodeName === "SCRIPT")
        ) {
          return NodeFilter.FILTER_REJECT;
        }
        if (processedNodes.has(node)) return NodeFilter.FILTER_REJECT;
        return node.nodeValue.trim().length > 0
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      },
    },
    false
  );

  let node;
  while ((node = treeWalker.nextNode())) {
    if (!nodeIdMap.has(node)) {
      const id = `node_${uniqueIdCounter++}`;
      nodeIdMap.set(node, id);
      pendingNodes[id] = { node, text: node.nodeValue.trim() };
    }
  }
}

function processPendingNodes() {
  const entries = Object.entries(pendingNodes);
  if (!entries.length) return;
  pendingNodes = {};

  const payload = JSON.stringify(
    entries.reduce((acc, [id, { text }]) => {
      acc[id] = text;
      return acc;
    }, {})
  );

  chrome.runtime.sendMessage(
    { type: "API_REQUEST", data: payload },
    (response) => {
      if (response && response.success && response.data) {
        try {
          let responseText = response.data;
          if (responseText.startsWith("```")) {
            responseText = responseText
              .replace(/^```(?:json)?\s*/, "")
              .replace(/\s*```$/, "");
          }
          const updatedMapping = JSON.parse(responseText);
          entries.forEach(([id, { node }]) => {
            if (updatedMapping.hasOwnProperty(id)) {
              node.nodeValue = "😄" + updatedMapping[id];
              processedNodes.add(node);
            } else {
              console.error("Missing updated node for:", id);
            }
          });
        } catch (e) {
          console.error("JSON parse error:", e);
        }
      } else if (response && !response.success) {
        console.error("API request failed:", response.error);
      }
    }
  );
}

function scheduleProcessing() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    processPendingNodes();
    debounceTimer = null;
  }, 1); // 1 秒延迟
}

window.addEventListener("DOMContentLoaded", () => {
  addTextNodes(document.body);
  scheduleProcessing();

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "childList") {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) addTextNodes(node);
        });
        scheduleProcessing();
      }
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
});
