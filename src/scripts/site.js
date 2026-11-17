const menuToggle = document.querySelector('[data-menu-toggle]');
const primaryNav = document.querySelector('[data-primary-nav]');

if (menuToggle && primaryNav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!isOpen));
    primaryNav.classList.toggle('is-open', !isOpen);
    menuToggle.querySelector('.sr-only').textContent = isOpen ? 'Открыть меню' : 'Закрыть меню';
  });

  primaryNav.addEventListener('click', (event) => {
    if (event.target.closest('a') && window.matchMedia('(max-width: 760px)').matches) {
      menuToggle.setAttribute('aria-expanded', 'false');
      primaryNav.classList.remove('is-open');
      menuToggle.querySelector('.sr-only').textContent = 'Открыть меню';
    }
  });
}

const notice = document.querySelector('[data-notice]');
let noticeTimer;
function showNotice(message) {
  if (!notice) return;
  notice.textContent = message;
  notice.hidden = false;
  window.clearTimeout(noticeTimer);
  noticeTimer = window.setTimeout(() => { notice.hidden = true; }, 3600);
}

const selectionKey = 'luma-kids-selected-models';
function getSelectedModels() {
  try { return JSON.parse(sessionStorage.getItem(selectionKey) || '[]'); }
  catch { return []; }
}
function saveSelectedModels(models) {
  sessionStorage.setItem(selectionKey, JSON.stringify([...new Set(models)]));
  document.dispatchEvent(new CustomEvent('models:changed', { detail: { models: getSelectedModels() } }));
}

function refreshModelButtons() {
  const selectedModels = getSelectedModels();
  document.querySelectorAll('[data-select-model]').forEach((button) => {
    const selected = selectedModels.includes(button.dataset.selectModel);
    button.setAttribute('aria-pressed', String(selected));
    button.classList.toggle('is-selected', selected);
    button.innerHTML = selected ? 'Добавлено <img class="icon-inline" src="/icons/checkmark.svg" alt="" aria-hidden="true">' : 'Добавить в запрос <img class="icon-inline" src="/icons/plus.svg" alt="" aria-hidden="true">';
  });
}

document.addEventListener('models:changed', refreshModelButtons);
refreshModelButtons();

document.querySelectorAll('[data-select-model]').forEach((button) => {
  const model = button.dataset.selectModel;
  button.addEventListener('click', () => {
    const models = getSelectedModels();
    const wasSelected = models.includes(model);
    saveSelectedModels(wasSelected ? models.filter((item) => item !== model) : [...models, model]);
    const nowSelected = !wasSelected;
    showNotice(nowSelected ? `${model} добавлена в запрос` : `${model} удалена из запроса`);
  });
});

document.querySelectorAll('[data-open-model-details]').forEach((trigger) => {
  const dialog = document.getElementById(trigger.dataset.openModelDetails);
  if (!dialog) return;
  trigger.addEventListener('click', () => dialog.showModal());
  dialog.querySelector('[data-close-model-details]')?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
});

const catalogSearch = document.querySelector('[data-catalog-search]');
const modelCards = [...document.querySelectorAll('[data-model-card]')];
const resultCount = document.querySelector('[data-result-count]');
const emptyState = document.querySelector('[data-empty-state]');
const selectionBar = document.querySelector('[data-selection-bar]');
const selectionCount = document.querySelector('[data-selection-count]');
const selectedLinks = document.querySelectorAll('[data-selected-models-link]');

function refreshCatalog() {
  if (!modelCards.length) return;
  const term = (catalogSearch?.value || '').trim().toLowerCase();
  let visible = 0;
  modelCards.forEach((card) => {
    const matches = !term || card.dataset.model.includes(term);
    card.hidden = !matches;
    if (matches) visible += 1;
  });
  if (resultCount) {
    const plural = new Intl.PluralRules('ru').select(visible);
    const label = { one: 'модель', few: 'модели', many: 'моделей', other: 'модели' }[plural];
    resultCount.textContent = `${visible} ${label}`;
  }
  if (emptyState) emptyState.hidden = visible !== 0;
}

function refreshSelection() {
  const models = getSelectedModels();
  if (selectionCount) selectionCount.textContent = String(models.length);
  if (selectionBar) selectionBar.hidden = models.length === 0;
  selectedLinks.forEach((link) => {
    link.href = `/wholesale/?models=${encodeURIComponent(models.join(','))}#request`;
  });
}

catalogSearch?.addEventListener('input', refreshCatalog);
document.addEventListener('models:changed', refreshSelection);
refreshCatalog();
refreshSelection();

const selectedModelsOutput = document.querySelector('[data-selected-models]');
if (selectedModelsOutput) {
  const params = new URLSearchParams(window.location.search);
  const fromUrl = (params.get('models') || '').split(',').filter(Boolean);
  if (fromUrl.length) saveSelectedModels([...getSelectedModels(), ...fromUrl]);
  const selected = getSelectedModels();
  selectedModelsOutput.textContent = selected.length ? selected.join(', ') : 'Пока модели не выбраны';
  refreshSelection();
}

const requestForm = document.querySelector('[data-request-form]');
if (requestForm) {
  const nameField = requestForm.querySelector('#name');
  const contactField = requestForm.querySelector('#contact');
  const commentField = requestForm.querySelector('#comment');
  const messageField = requestForm.querySelector('[data-request-message]');
  const output = requestForm.querySelector('[data-request-output]');
  const copyButton = requestForm.querySelector('[data-copy-request]');

  requestForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = nameField.value.trim();
    const contact = contactField.value.trim();
    const selected = getSelectedModels();
    const invalid = [];
    if (!name) invalid.push([nameField, requestForm.querySelector('[data-error-name]'), 'Укажите имя']);
    if (!contact) invalid.push([contactField, requestForm.querySelector('[data-error-contact]'), 'Укажите телефон или Telegram']);

    requestForm.querySelectorAll('[aria-invalid="true"]').forEach((field) => field.removeAttribute('aria-invalid'));
    requestForm.querySelectorAll('[data-field-error]').forEach((node) => { node.hidden = true; node.textContent = ''; });
    if (invalid.length) {
      invalid.forEach(([field, error, text]) => {
        field.setAttribute('aria-invalid', 'true');
        error.textContent = text;
        error.hidden = false;
      });
      invalid[0][0].focus();
      return;
    }

    const lines = [
      'Запрос для оптового отдела Luma Kids',
      `Имя: ${name}`,
      `Контакт: ${contact}`,
      `Модели: ${selected.length ? selected.join(', ') : 'не выбраны'}`,
      `Комментарий: ${commentField.value.trim() || 'не указан'}`,
    ];
    output.value = lines.join('\n');
    output.hidden = false;
    copyButton.hidden = false;
    messageField.textContent = 'Запрос подготовлен в этом браузере — он не отправлен. Скопируйте текст и передайте менеджеру после добавления реального контакта.';
    output.focus();
  });

  copyButton?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(output.value);
      messageField.textContent = 'Текст запроса скопирован. Автоматическая отправка не подключена.';
    } catch {
      output.focus();
      output.select();
      messageField.textContent = 'Не удалось скопировать автоматически. Выделите текст и скопируйте его вручную.';
    }
  });
}
