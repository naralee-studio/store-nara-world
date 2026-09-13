// Small independent fallback: React removes this listener once enhancement succeeds.
// Option IDs stay separate from the variant ID submitted to Shopify.
function installProductFallback(root) {
  if (root.dataset.fallbackReady) return;
  root.dataset.fallbackReady = 'true';
  root.addEventListener('change', event => {
    if (root.dataset.enhanced || !event.target.matches('[data-option-position]')) return;
    const selected = event.target.selectedOptions[0];
    const url = new URL(selected.dataset.productUrl || window.location.href, window.location.origin);
    for (const [key, value] of new URLSearchParams(location.search)) if (!['variant', 'option_values', 'section_id'].includes(key)) url.searchParams.set(key, value);
    const localeRoot = root.dataset.localeRoot || '/';
    if (localeRoot !== '/' && url.pathname.startsWith('/products/')) url.pathname = localeRoot.replace(/\/$/, '') + url.pathname;
    url.searchParams.delete('variant');
    url.searchParams.set('option_values', [...root.querySelectorAll('[data-option-position]')].map(input => input.value).join(','));
    window.location.assign(url);
  });
}
function installFallbacks(scope) { scope.querySelectorAll('[data-product-experience]').forEach(installProductFallback); }
installFallbacks(document);
document.addEventListener('shopify:section:load', event => installFallbacks(event.target));
