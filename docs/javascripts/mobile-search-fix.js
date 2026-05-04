document.addEventListener("click", function(e) {
  const link = e.target.closest(".md-search-result__link");
  if (!link) return;

  const targetUrl = new URL(link.href, window.location.origin);
  const currentUrl = new URL(window.location.href);

  // Only trigger if it is a same-page link
  if (targetUrl.pathname === currentUrl.pathname && targetUrl.hash) {
    
    // DO NOT prevent default. DO NOT manually close the menu.
    // Let the Material framework handle all its internal state normally.
    
    // Wait 400ms. This gives Material enough time to fade out the overlay 
    // and remove the CSS scroll locks from the background.
    setTimeout(() => {
      const targetId = decodeURIComponent(targetUrl.hash.substring(1));
      const targetElement = document.getElementById(targetId);
      
      if (targetElement) {
        // Read the native MkDocs margin offset so we don't hide the title under the blue bar
        const style = window.getComputedStyle(targetElement);
        const scrollMarginTop = parseInt(style.scrollMarginTop, 10) || 0;
        
        // Calculate exact target Y coordinate
        const y = targetElement.getBoundingClientRect().top + window.scrollY - scrollMarginTop;
        
        // Use native window scrolling. The RxJS state manager tracks this naturally,
        // preventing the blue header from glitching or permanently vanishing.
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 200); 
  }
}, true); // Use capture phase to ensure we see the click before any framework swallows it
