// Variant navigation uses Shopify-rendered HTML, so prices, stock, quantity
// rules, and accelerated checkout all remain in the current market context.
class NaraProduct extends HTMLElement {
  connectedCallback() {
    this.controller?.abort();
    this.controller = new AbortController();
    const { signal } = this.controller;
    this.querySelector('[data-variant-select]')?.addEventListener('change', (event) => {
      const url = new URL(window.location.href);
      url.searchParams.set('variant', event.target.value);
      url.searchParams.delete('option_values');
      window.location.assign(url);
    }, { signal });
    this.querySelectorAll('[data-gallery-image]').forEach((link) => {
      link.addEventListener('click', (event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const image = this.querySelector('.product-featured-image img');
        if (!image) return;
        event.preventDefault();
        image.removeAttribute('srcset');
        image.src = link.href;
        image.alt = link.querySelector('img').alt;
        this.querySelectorAll('[data-gallery-image]').forEach((item) => item.removeAttribute('aria-current'));
        link.setAttribute('aria-current', 'true');
      }, { signal });
    });
  }
  disconnectedCallback() { this.controller?.abort(); }
}
if (!customElements.get('nara-product')) customElements.define('nara-product', NaraProduct);
