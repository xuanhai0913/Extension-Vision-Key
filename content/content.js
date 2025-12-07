{
  // Verify if we are running in the correct context
  console.log('Vision Key Content Script initializing...');

  let isSelecting = false;
  let startX = 0;
  let startY = 0;
  let selectionBox = null;
  let overlay = null;
  let dimensionLabel = null;
  let instructionsEl = null;

  // Get device pixel ratio for accurate cropping
  function getDevicePixelRatio() {
    return window.devicePixelRatio || 1;
  }

  // Initialize overlay
  function initOverlay() {
    // Remove existing overlay if any
    cleanupOverlay();

    // Create overlay div (dark background)
    overlay = document.createElement('div');
    overlay.id = 'vision-key-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.3);
      z-index: 2147483640;
      cursor: crosshair;
      display: block;
    `;

    // Create selection box
    selectionBox = document.createElement('div');
    selectionBox.id = 'vision-key-selection';
    selectionBox.style.cssText = `
      position: fixed;
      border: 2px solid #00d4ff;
      background: transparent;
      display: none;
      z-index: 2147483645;
      pointer-events: none;
      box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
    `;

    // Create dimension label
    dimensionLabel = document.createElement('div');
    dimensionLabel.id = 'vision-key-dimensions';
    dimensionLabel.style.cssText = `
      position: fixed;
      background: rgba(0, 0, 0, 0.85);
      color: #00d4ff;
      padding: 4px 10px;
      border-radius: 4px;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 12px;
      font-weight: bold;
      z-index: 2147483647;
      pointer-events: none;
      display: none;
    `;

    // Create instructions
    instructionsEl = document.createElement('div');
    instructionsEl.id = 'vision-key-instructions';
    instructionsEl.innerHTML = '✂️ Kéo để chọn vùng • <kbd>ESC</kbd> để hủy';
    instructionsEl.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px 24px;
      border-radius: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      z-index: 2147483647;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
      pointer-events: none;
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(selectionBox);
    document.body.appendChild(dimensionLabel);
    document.body.appendChild(instructionsEl);

    // Add event listeners
    overlay.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleKeyDown);

    // Reset state
    isSelecting = false;

    console.log('Vision Key overlay initialized');
  }

  // Cleanup all overlay elements
  function cleanupOverlay() {
    const elementsToRemove = [
      'vision-key-overlay',
      'vision-key-selection',
      'vision-key-dimensions',
      'vision-key-instructions'
    ];

    elementsToRemove.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });

    overlay = null;
    selectionBox = null;
    dimensionLabel = null;
    instructionsEl = null;
  }

  // Show overlay
  function showOverlay() {
    initOverlay();
  }

  // Hide overlay
  function hideOverlay() {
    cleanupOverlay();
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('keydown', handleKeyDown);
    isSelecting = false;
    console.log('Vision Key overlay removed');
  }

  // Mouse down - start selection
  function handleMouseDown(e) {
    e.preventDefault();
    isSelecting = true;
    startX = e.clientX;
    startY = e.clientY;

    selectionBox.style.left = startX + 'px';
    selectionBox.style.top = startY + 'px';
    selectionBox.style.width = '0px';
    selectionBox.style.height = '0px';
    selectionBox.style.display = 'block';

    dimensionLabel.style.display = 'block';

    console.log('Selection started:', { x: startX, y: startY });
  }

  // Mouse move - update selection
  function handleMouseMove(e) {
    if (!isSelecting) return;

    e.preventDefault();
    const currentX = e.clientX;
    const currentY = e.clientY;

    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);
    const left = Math.min(currentX, startX);
    const top = Math.min(currentY, startY);

    selectionBox.style.left = left + 'px';
    selectionBox.style.top = top + 'px';
    selectionBox.style.width = width + 'px';
    selectionBox.style.height = height + 'px';

    // Update dimension label
    dimensionLabel.textContent = `${width} × ${height}`;
    dimensionLabel.style.left = (left + width + 10) + 'px';
    dimensionLabel.style.top = (top - 25) + 'px';

    // Keep label in viewport
    if (left + width + 100 > window.innerWidth) {
      dimensionLabel.style.left = (left - 80) + 'px';
    }
    if (top < 30) {
      dimensionLabel.style.top = (top + height + 10) + 'px';
    }
  }

  // Mouse up - finish selection and capture immediately
  function handleMouseUp(e) {
    if (!isSelecting) return;

    e.preventDefault();
    isSelecting = false;

    const width = parseInt(selectionBox.style.width);
    const height = parseInt(selectionBox.style.height);
    const left = parseInt(selectionBox.style.left);
    const top = parseInt(selectionBox.style.top);

    console.log('Selection complete:', { left, top, width, height });

    // Validate selection (minimum 10x10 pixels)
    if (width < 10 || height < 10) {
      console.log('Selection too small, cancelled');
      hideOverlay();
      return;
    }

    // Calculate rect with devicePixelRatio adjustment
    const dpr = getDevicePixelRatio();
    const rect = {
      x: Math.round(left * dpr),
      y: Math.round(top * dpr),
      width: Math.round(width * dpr),
      height: Math.round(height * dpr)
    };

    console.log('Rect with DPR adjustment:', rect, 'DPR:', dpr);

    // Hide overlay BEFORE capturing
    hideOverlay();

    // Small delay to ensure overlay is hidden, then send to background
    setTimeout(() => {
      chrome.runtime.sendMessage({
        action: 'selectionComplete',
        rect: rect,
        devicePixelRatio: dpr
      });
    }, 30);
  }

  // ESC to cancel
  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      console.log('Selection cancelled by user');
      hideOverlay();
      chrome.runtime.sendMessage({ action: 'selectionCancelled', reason: 'user_cancel' });
    }
  }

  // Listen for messages from popup/background
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Content script received message:', message);

    if (message.action === 'startSelection') {
      showOverlay();
      sendResponse({ success: true });
    } else if (message.action === 'cancelSelection') {
      hideOverlay();
      sendResponse({ success: true });
    } else if (message.action === 'ping') {
      sendResponse({ status: 'pong' });
    }

    return true;
  });
}
