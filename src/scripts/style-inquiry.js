/* Carry a published style reference into the existing inquiry form. */
(function () {
  'use strict';
  var form = document.querySelector('[data-form="inquiry"]');
  if (!form) return;
  var styles = form.querySelector('[name="Style reference"]');
  if (!styles) return;
  var preview = form.querySelector('[data-style-preview]');
  var picture = form.querySelector('[data-style-image]');
  var imageField = form.querySelector('[name="Reference image"]');
  var product = form.querySelector('[name="Product"]');
  function update() {
    var option = styles.options[styles.selectedIndex];
    var selected = option && option.value && option.dataset.image;
    preview.hidden = !selected;
    imageField.value = selected ? option.dataset.image : '';
    if (selected) {
      picture.src = option.dataset.image;
      picture.alt = option.value;
      form.querySelector('[data-style-code]').textContent = option.value;
      var line = Number(option.dataset.line) - 1;
      if (product && line >= 0 && line < 3) product.selectedIndex = line;
    } else {
      picture.removeAttribute('src');
      picture.alt = '';
      form.querySelector('[data-style-code]').textContent = '';
    }
  }
  var requested = new URLSearchParams(window.location.search).get('style');
  // Only accept a reference from the published catalogue, not arbitrary URL content.
  if (requested && Array.from(styles.options).some(function (o) { return o.value === requested; })) {
    styles.value = requested;
  }
  update();
  styles.addEventListener('change', update);
  if (product) product.addEventListener('change', function () {
    var option = styles.options[styles.selectedIndex];
    if (option.value && Number(option.dataset.line) - 1 !== product.selectedIndex) {
      styles.value = '';
      update();
    }
  });
  form.addEventListener('reset', function () { setTimeout(update, 0); });
})();
