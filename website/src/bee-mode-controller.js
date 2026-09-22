export function createBeeModeController({ t }) {
  let beeModeEnabled = false;

  function updateButton() {
    const button = document.getElementById('bee-mode-toggle');
    const labelKey = beeModeEnabled ? 'beeModeDisable' : 'beeModeEnable';

    button.classList.toggle('is-active', beeModeEnabled);
    button.setAttribute('aria-pressed', String(beeModeEnabled));
    button.setAttribute('aria-label', t(labelKey));
    button.setAttribute('title', t(labelKey));
  }

  function setBeeMode(enabled) {
    beeModeEnabled = enabled;
    document.documentElement.classList.toggle('bee-mode', beeModeEnabled);
    updateButton();
  }

  function bindUi() {
    document
      .getElementById('bee-mode-toggle')
      .addEventListener('click', () => setBeeMode(!beeModeEnabled));
    updateButton();
  }

  return {
    bindUi,
    refreshLanguage: updateButton,
  };
}
