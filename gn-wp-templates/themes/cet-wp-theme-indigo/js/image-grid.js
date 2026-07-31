document.addEventListener('DOMContentLoaded', function () {

  const imageGridBlocks = document.querySelectorAll('.is-style-image-grid');

  imageGridBlocks.forEach(function (block) {

    const grid = block.querySelector('.wp-block-group-is-layout-grid');
    if (!grid) return;

    // All cards inside this grid
    const cards = Array.from(grid.querySelectorAll('.wp-block-cover'));
    if (cards.length === 0) return;

    // Make a Show More button
    const showMoreBtn = document.createElement('button');
    showMoreBtn.type = 'button';
    showMoreBtn.className = 'image-grid-show-more';
    showMoreBtn.textContent = 'Show more';

    // Insert it after the grid
    grid.insertAdjacentElement('afterend', showMoreBtn);

    let expanded = false;

    function updateLayout() {
      const width = window.innerWidth;

      let visibleCount;

      if (expanded) {
        visibleCount = cards.length; 
      } else if (width < 768) {
        visibleCount = 4;
      } else if (width >= 768 && width <= 1024) {
        visibleCount = 6; 
      } else {
        visibleCount = cards.length;
      }

      // Show/hide cards
      cards.forEach((card, index) => {
        card.style.display = index < visibleCount ? '' : 'none';
      });

      // Button shows ONLY if hidden cards exist AND not desktop AND not expanded
      const hasHidden = cards.length > visibleCount;
      const isDesktop = width > 1024;

      showMoreBtn.style.display = (!expanded && hasHidden && !isDesktop) ? '' : 'none';
    }

    // Expand button
    showMoreBtn.addEventListener('click', function () {
      expanded = true;
      updateLayout();
    });

    // Initial + responsive updates
    updateLayout();
    window.addEventListener('resize', updateLayout);
  });
});
