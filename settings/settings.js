// Vision Key - Settings Script

console.log('Settings page loaded');

// DOM elements
const apiKeyInput = document.getElementById('apiKey');
const toggleKeyBtn = document.getElementById('toggleKeyBtn');
const defaultModeRadios = document.getElementsByName('defaultMode');
const languageSelect = document.getElementById('language');
const modelSelect = document.getElementById('model');
const changeShortcutBtn = document.getElementById('changeShortcutBtn');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const saveBtn = document.getElementById('saveBtn');
const resetBtn = document.getElementById('resetBtn');
const statusDiv = document.getElementById('status');
const importFileInput = document.getElementById('importFileInput');

// Load settings on init
loadSettings();

// Event listeners
toggleKeyBtn.addEventListener('click', toggleApiKeyVisibility);
changeShortcutBtn.addEventListener('click', openShortcutSettings);
exportBtn.addEventListener('click', exportSettings);
importBtn.addEventListener('click', () => importFileInput.click());
importFileInput.addEventListener('change', importSettings);
clearHistoryBtn.addEventListener('click', clearHistory);
saveBtn.addEventListener('click', saveSettings);
resetBtn.addEventListener('click', resetSettings);

// Functions

function loadSettings() {
  chrome.storage.sync.get([
    'apiKey',
    'answerMode',
    'language',
    'model'
  ], (result) => {
    console.log('Loaded settings:', result);

    if (result.apiKey) {
      apiKeyInput.value = result.apiKey;
    }

    if (result.answerMode) {
      const radio = document.querySelector(`input[value="${result.answerMode}"]`);
      if (radio) radio.checked = true;
    }

    if (result.language) {
      languageSelect.value = result.language;
    } else {
      languageSelect.value = 'vi'; // Default
    }

    if (result.model) {
      modelSelect.value = result.model;
    } else {
      modelSelect.value = 'gemini-2.0-flash-exp'; // Default
    }
  });
}

function saveSettings() {
  const selectedMode = document.querySelector('input[name="defaultMode"]:checked').value;

  const settings = {
    apiKey: apiKeyInput.value.trim(),
    answerMode: selectedMode,
    language: languageSelect.value,
    model: modelSelect.value
  };

  // Validate API key
  if (settings.apiKey && !settings.apiKey.startsWith('AIza')) {
    showStatus('Invalid API key format. Should start with "AIza"', 'error');
    return;
  }

  chrome.storage.sync.set(settings, () => {
    console.log('Settings saved:', settings);
    showStatus('Settings saved successfully! ✓', 'success');
  });
}

function resetSettings() {
  if (!confirm('Are you sure you want to reset all settings to default?')) {
    return;
  }

  const defaultSettings = {
    apiKey: '',
    answerMode: 'tracNghiem',
    language: 'vi',
    model: 'gemini-2.0-flash-exp',
    expertContext: ''
  };

  chrome.storage.sync.set(defaultSettings, () => {
    loadSettings();
    showStatus('Settings reset to default ✓', 'success');
  });
}

function toggleApiKeyVisibility() {
  const isPassword = apiKeyInput.type === 'password';
  apiKeyInput.type = isPassword ? 'text' : 'password';

  // Update icon based on state
  if (isPassword) {
    // Show closed eye (representing Hide) or Open Lock
    toggleKeyBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';
    toggleKeyBtn.title = 'Hide API Key';
  } else {
    // Show open eye
    toggleKeyBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
    toggleKeyBtn.title = 'Show API Key';
  }
}

function openShortcutSettings() {
  // Open Chrome shortcuts settings
  chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
}

function exportSettings() {
  chrome.storage.sync.get(null, (settings) => {
    // Remove sensitive data before export (optional)
    const exportData = { ...settings };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vision-key-settings-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showStatus('Settings exported! ✓', 'success');
  });
}

function importSettings() {
  const file = importFileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const settings = JSON.parse(e.target.result);

      chrome.storage.sync.set(settings, () => {
        loadSettings();
        showStatus('Settings imported! ✓', 'success');
      });
    } catch (error) {
      showStatus('Failed to import: Invalid file format', 'error');
    }
  };
  reader.readAsText(file);

  // Reset file input
  importFileInput.value = '';
}

function clearHistory() {
  if (!confirm('Are you sure you want to clear all history?')) {
    return;
  }

  chrome.storage.local.clear(() => {
    showStatus('Local history cleared!', 'success');
  });
}

function showStatus(message, type = 'success') {
  statusDiv.textContent = message;
  statusDiv.className = `status-toast ${type} show`;

  // Auto-hide after 3 seconds
  setTimeout(() => {
    statusDiv.classList.remove('show');
  }, 3000);
}

console.log('Settings page initialized');
