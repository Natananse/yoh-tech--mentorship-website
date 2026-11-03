// Netlify inserts a newline before its hosting comment. React cannot hydrate that
// unexpected head text node. Keep the comment and badge, and remove only its gap
// before React starts. The script is a no-op on other hosts.
export const netlifyHeadCompatibilityScript = `(function(){var head=document.head;if(!head)return;for(var node=head.firstChild;node;){var next=node.nextSibling;if(node.nodeType===3&&!node.textContent.trim()&&next&&next.nodeType===8&&next.textContent.indexOf('This site is hosted on Netlify.')!==-1)head.removeChild(node);node=next;}})();`;
