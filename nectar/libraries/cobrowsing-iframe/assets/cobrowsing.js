function getIframeListeners(currentIframeSelector) {
    return `
      <script id="shr-cobrowsing-script">
        var html;
        var isAddingListeners;
        var latestKnownScrollX = 0;
        var latestKnownScrollY = 0;
        var ticking = false;
        var avoidAgentEvents = false;
        
        function getSelector(node) {
          var id = node.getAttribute('id');
          if (id) return '#' + id;
          var path = '';
          while (node && node.localName && node.parentNode) {
            var name = node.localName;
            var parent = node.parentNode;
            var nodeId = node.getAttribute('id');
            if (nodeId) {
              path = '#' + nodeId + ' > ' + path;
              break;
            }

            if (name.includes('hx')) {
              var className = node.getAttribute('class');
              if (className) {
                path = '.' + className.replace(' ', '.') + ' > ' + path;
                node = parent;
                continue;
              }
            }

            var sameTagSiblings = [];
            var children = parent.childNodes;
            children = Array.prototype.slice.call(children);
            children.forEach(function(child) {
              if (child.localName === name) sameTagSiblings.push(child);
            });

            // if there are more than one children of that type use nth-of-type
            if (sameTagSiblings.length > 1) {
              var index = sameTagSiblings.indexOf(node);
              name += ':nth-of-type(' + (index + 1) + ')';
            }

            if (path) path = name + ' > ' + path;
            else path = name;
            node = parent;
          }

          return path;
        }

        window.addEventListener("click", function(event) {
          if (avoidAgentEvents) return;
          var path = getSelector(event.composedPath()[0]);
          if (path && path.includes('shr-co-browsing-advise')) return;
          var clickEvent = {
            type: 'IFRAME_EVENT',
            selector: '${currentIframeSelector}',
            event: {
                type: 'CLICK',
                data: {
                x: event.x,
                y: event.y,
                path: path,
                pageX: event.pageX,
                pageY: event.pageY,
                clientX: event.clientX,
                clientY: event.clientY,
                offsetX: event.offsetX,
                offsetY: event.offsetY,
                }
            }
          };
          window.top.postMessage(clickEvent, '*');
        });

        window.addEventListener("mousemove", function(event) {
          if (avoidAgentEvents) return;
          var moveEvent = {
            type: 'IFRAME_EVENT',
            selector: '${currentIframeSelector}',
            event: {
                type: 'MOUSE_MOVE',
                data: { top: event.y, left: event.x }
            }
          };
          window.top.postMessage(moveEvent, '*');
        });
        
        window.addEventListener("scroll", function(event) {
          var scrollTop = event.target.scrollTop;
          var scrollLeft = event.target.scrollLeft;
          var scrollingElement = event.target;
          if (event.target === document) {
            scrollTop = event.target.scrollingElement.scrollTop;
            scrollLeft = event.target.scrollingElement.scrollLeft;
            scrollingElement = event.target.scrollingElement;
          }
        
          latestKnownScrollX = 0;
          latestKnownScrollY = 0;
          if (scrollTop) latestKnownScrollY = scrollTop;
          if (scrollLeft) latestKnownScrollX = scrollLeft;
          if (!ticking) {
            window.requestAnimationFrame(function () {
              ticking = false;
              var scrollEvent = {
                type: 'IFRAME_EVENT',
                selector: '${currentIframeSelector}',
                event: {
                    type: "SCROLL",
                    data: {
                        path: getSelector(scrollingElement),
                        value: { x: latestKnownScrollX || 0, y: latestKnownScrollY || 0 }
                    }
                }
              };
              window.top.postMessage(scrollEvent, '*');
            });
          }

          ticking = true;
        }, true);

        window.addEventListener("input", function(e) {
            var input = e.composedPath()[0];
            var selector = getSelector(input);
            let keyEvent = {
                type: 'IFRAME_EVENT',
                selector: '${currentIframeSelector}',
                event: {
                    type: "VALUE_CHANGE",
                    data: {
                        element: input.outerHTML,
                        path: selector,
                        value: input.value,
                    }
                }
            }
            window.top.postMessage(keyEvent, '*');
        });

      </script>
    `;
}

module.exports = { getIframeListeners };