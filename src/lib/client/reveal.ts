// Fades an element up once it scrolls into view. app.html only adds the
// `reveal` class when the visitor allows motion, and without it this does
// nothing and the element simply shows.

let observer: IntersectionObserver | undefined

function getObserver() {
  observer ??= new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting)
        continue

      entry.target.classList.add('revealed')
      observer?.unobserve(entry.target)
    }
  }, { rootMargin: '0px 0px -32px 0px' })

  return observer
}

export function observeReveal(element: Element) {
  if (!document.documentElement.classList.contains('reveal'))
    return

  getObserver().observe(element)
}

// Svelte action for elements that come and go, like filtered gallery tiles
export function reveal(node: HTMLElement) {
  observeReveal(node)

  return {
    destroy: () => observer?.unobserve(node),
  }
}
