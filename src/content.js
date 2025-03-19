function walker(root) {
  const treeWalker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function (node) {
        if (
          node.parentNode &&
          (node.parentNode.nodeName === "STYLE" ||
            node.parentNode.nodeName === "SCRIPT")
        ) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    },
    false
  );

  while (treeWalker.nextNode()) {
    const node = treeWalker.currentNode;

    if (node.nodeValue.trim().length > 0) {
      console.log("原文本:", node.nodeValue);
      chrome.runtime.sendMessage(
        { type: "API_REQUEST", data: node.nodeValue },
        (response) => {
          if (response && response.success && response.data) {
            console.log("修改后:", response.data);
            node.nodeValue = response.data;
          } else if (response && !response.success) {
            console.error("脚本错误:", response.error);
          }
        }
      );
    }
  }
}

window.addEventListener("DOMContentLoaded", () => {
  const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
      if (mutation.type === "childList") {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            walker(node);
          }
        });
      }
    }
  });

  // 此时 document.body 已经存在，可以安全调用 observer.observe
  observer.observe(document.body, { childList: true, subtree: true });

  // 初始调用一次 walker
  walker(document.body);
});
