(function () {
  try {
    var shareButton = document.querySelector('[data-share-button]') || document.getElementById('share-button');
    if (!shareButton) return;

    shareButton.addEventListener('click', function () {
      try {
        var url = shareButton.getAttribute('data-share-url') || window.location.href;
        var title = shareButton.getAttribute('data-share-title') || document.title;

        if (navigator.share) {
          navigator.share({ title: title, url: url }).catch(function () {});
        } else if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).catch(function () {});
        }
      } catch (e) {}
    });
  } catch (e) {}
})();
