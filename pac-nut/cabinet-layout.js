// Refit the canvas when the cabinet changes size, including host navigation and
// mobile browser chrome changes that do not dispatch a window resize event.
new ResizeObserver(() => fitBoard()).observe(document.querySelector('.screen'));
