/**
 * CANVAS CANVAS - Main Application Script
 * Neo-Brutalist Pixel Art & SVG Editor
 */

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================================================
    // APPLICATION STATE
    // ==========================================================================
    // let untuk variable yang bisa diubah valuenya
    // const untuk variable yang tidak bisa diubah valuenya
    // var untuk variable yang bisa diubah valuenya tapi scope nya global
    // src : https://adityaputraprat.medium.com/memahami-penggunaan-var-let-const-dalam-javascript-1efb2f46feac

    let gridSize = 16; //untuk jumlah gridnya, dihitung dari 0 sampai dengan 15
    let activeTool = 'draw'; // 'draw', 'fill', 'eraser', 'picker'
    let activeColor = '#FF007A';
    let isDrawing = false;

    // Frames array. Each frame is a flat array of size (gridSize * gridSize)
    let frames = [];
    let activeFrameIndex = 0;

    // Undo/Redo stacks for the active frame
    let undoStack = [];
    let redoStack = [];
    const MAX_HISTORY = 50;

    // Animation preview player variables
    let animationInterval = null;
    let previewFrameIndex = 0;
    let isPlaying = true;
    let fps = 6;

    // ==========================================================================
    // DOM ELEMENTS
    // ==========================================================================
    //document.getElementById gunanya itu untuk mengambil value dari inputan yang memiliki id
    //src : https://www.kursuswebsite.org/mengenal-fungsi-document-getelementbyid-di-javascript/
    const pixelGrid = document.getElementById('pixel-grid');
    const colorPreview = document.getElementById('color-preview');
    const colorHexText = document.getElementById('color-hex-text');
    const colorPickerInput = document.getElementById('color-picker-input');
    const swatchContainer = document.getElementById('palette-swatches');
    const coordDisplay = document.getElementById('coord-display');

    // Tool buttons
    const toolBtns = {
        draw: document.getElementById('tool-draw'),
        fill: document.getElementById('tool-fill'),
        eraser: document.getElementById('tool-eraser'),
        picker: document.getElementById('tool-picker')
    };

    // Action buttons
    const btnUndo = document.getElementById('action-undo');
    const btnRedo = document.getElementById('action-redo');
    const btnGridToggle = document.getElementById('action-grid-toggle');
    const btnFillAll = document.getElementById('action-fill-all');
    const btnClear = document.getElementById('action-clear');

    // Presets
    const sizeButtons = document.querySelectorAll('.size-btn');

    // Animation elements
    const timelineContainer = document.getElementById('timeline-frames');
    const btnAddFrame = document.getElementById('frame-add');
    const btnDuplicateFrame = document.getElementById('frame-duplicate');
    const btnDeleteFrame = document.getElementById('frame-delete');

    const previewCanvas = document.getElementById('animation-preview-canvas');
    const previewCtx = previewCanvas.getContext('2d');
    const btnPlayPause = document.getElementById('btn-play-pause');
    const fpsSlider = document.getElementById('fps-slider');
    const fpsVal = document.getElementById('fps-val');

    // Export elements
    const btnExportPng = document.getElementById('btn-export-png');
    const btnExportSvg = document.getElementById('btn-export-svg');
    const btnExportCss = document.getElementById('btn-export-css');

    // Modal elements
    const exportModal = document.getElementById('export-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalCodeTextarea = document.getElementById('modal-code-textarea');
    const modalClose = document.getElementById('modal-close');
    const modalCopyBtn = document.getElementById('modal-copy-btn');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    // Ruler containers
    const rulerX = document.getElementById('ruler-x');
    const rulerY = document.getElementById('ruler-y');

    // ==========================================================================
    // INITIALIZATION
    // ==========================================================================
    function init() {
        // Initialize frames with a single blank frame
        createNewTimeline();

        // Setup Grid
        setupGrid();

        // Setup Event Listeners
        setupEventListeners();

        // Setup Lucide Icons
        if (window.lucide) {
            window.lucide.createIcons();
        }

        // Start Animation Preview
        startAnimationLoop();
        updateTimeline();
        updateUndoRedoButtons();
    }

    // Creates clean first frame
    function createNewTimeline() {
        frames = [createEmptyFrame()];
        activeFrameIndex = 0;
        undoStack = [];
        redoStack = [];
    }

    function createEmptyFrame() {
        return Array(gridSize * gridSize).fill('');
    }

    // ==========================================================================
    // GRID GENERATION & RENDER
    // ==========================================================================
    function setupGrid() {
        // Update CSS custom property for grid sizing
        document.documentElement.style.setProperty('--grid-size', gridSize);

        // Clear current grid
        pixelGrid.innerHTML = '';

        // Populate cells
        const frameData = frames[activeFrameIndex];

        for (let i = 0; i < gridSize * gridSize; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.index = i;
            cell.dataset.x = i % gridSize;
            cell.dataset.y = Math.floor(i / gridSize);

            // Set background if color exists
            if (frameData[i]) {
                cell.style.backgroundColor = frameData[i];
            }

            pixelGrid.appendChild(cell);
        }

        // Setup Rulers
        setupRulers();
    }

    function setupRulers() {
        rulerX.innerHTML = '';
        rulerY.innerHTML = '';

        const cellWidth = pixelGrid.clientWidth / gridSize;

        for (let i = 0; i < gridSize; i++) {
            // Horizontal Ruler
            if (i % 2 === 0 || gridSize <= 16) {
                const tickX = document.createElement('div');
                tickX.className = 'ruler-tick';
                tickX.style.width = `${cellWidth}px`;
                tickX.textContent = i;
                rulerX.appendChild(tickX);
            } else {
                const spacer = document.createElement('div');
                spacer.style.width = `${cellWidth}px`;
                rulerX.appendChild(spacer);
            }

            // Vertical Ruler
            const tickY = document.createElement('div');
            tickY.className = 'ruler-tick';
            tickY.style.height = `${cellWidth}px`;
            tickY.textContent = i;
            rulerY.appendChild(tickY);
        }
    }

    function syncGridFromState() {
        const frameData = frames[activeFrameIndex];
        const cells = pixelGrid.querySelectorAll('.grid-cell');
        cells.forEach(cell => {
            const idx = parseInt(cell.dataset.index);
            cell.style.backgroundColor = frameData[idx] || '';
        });

        // Also update thumbnail preview
        updateFrameThumbnail(activeFrameIndex);
    }

    // ==========================================================================
    // HISTORY (UNDO / REDO)
    // ==========================================================================
    function saveHistoryState() {
        // Push deep copy of active frame data
        undoStack.push([...frames[activeFrameIndex]]);
        if (undoStack.length > MAX_HISTORY) {
            undoStack.shift();
        }
        // Clear redo stack on new action
        redoStack = [];
        updateUndoRedoButtons();
    }

    function undo() {
        if (undoStack.length === 0) return;

        redoStack.push([...frames[activeFrameIndex]]);
        frames[activeFrameIndex] = undoStack.pop();

        syncGridFromState();
        updateUndoRedoButtons();
        showToast('Undo action');
    }

    function redo() {
        if (redoStack.length === 0) return;

        undoStack.push([...frames[activeFrameIndex]]);
        frames[activeFrameIndex] = redoStack.pop();

        syncGridFromState();
        updateUndoRedoButtons();
        showToast('Redo action');
    }

    function updateUndoRedoButtons() {
        btnUndo.disabled = undoStack.length === 0;
        btnRedo.disabled = redoStack.length === 0;
    }

    // ==========================================================================
    // DRAWING LOGIC & EVENT HANDLERS
    // ==========================================================================
    function handleCellInteraction(cell) {
        const index = parseInt(cell.dataset.index);
        const frameData = frames[activeFrameIndex];

        if (activeTool === 'draw') {
            if (frameData[index] !== activeColor) {
                frameData[index] = activeColor;
                cell.style.backgroundColor = activeColor;
                updateFrameThumbnail(activeFrameIndex);
            }
        } else if (activeTool === 'eraser') {
            if (frameData[index] !== '') {
                frameData[index] = '';
                cell.style.backgroundColor = '';
                updateFrameThumbnail(activeFrameIndex);
            }
        } else if (activeTool === 'picker') {
            if (frameData[index]) {
                updateActiveColor(frameData[index]);
            }
            // Switch back to draw tool after picking
            switchTool('draw');
        } else if (activeTool === 'fill') {
            // Flood Fill
            const targetColor = frameData[index];
            if (targetColor !== activeColor) {
                floodFill(index, targetColor, activeColor);
                syncGridFromState();
            }
        }
    }

    // Queue-based Flood Fill Algorithm
    function floodFill(startIndex, targetColor, replacementColor) {
        const frameData = frames[activeFrameIndex];

        // If the start pixel is already the replacement color, return
        if (targetColor === replacementColor) return;

        const queue = [startIndex];
        const visited = new Set();

        while (queue.length > 0) {
            const curr = queue.shift();

            if (visited.has(curr)) continue;
            visited.add(curr);

            if (frameData[curr] === targetColor) {
                frameData[curr] = replacementColor;

                // Get coordinates
                const x = curr % gridSize;
                const y = Math.floor(curr / gridSize);

                // Neighbors
                if (x > 0) queue.push(curr - 1); // Left
                if (x < gridSize - 1) queue.push(curr + 1); // Right
                if (y > 0) queue.push(curr - gridSize); // Up
                if (y < gridSize - 1) queue.push(curr + gridSize); // Down
            }
        }
    }

    function setupEventListeners() {
        // Event delegation on the pixel grid for drawing
        pixelGrid.addEventListener('mousedown', (e) => {
            const cell = e.target.closest('.grid-cell');
            if (cell) {
                saveHistoryState();
                isDrawing = true;
                handleCellInteraction(cell);
            }
        });

        pixelGrid.addEventListener('mousemove', (e) => {
            const cell = e.target.closest('.grid-cell');
            if (cell) {
                // Coordinate display
                coordDisplay.textContent = `X: ${cell.dataset.x}, Y: ${cell.dataset.y}`;

                if (isDrawing && (activeTool === 'draw' || activeTool === 'eraser')) {
                    handleCellInteraction(cell);
                }
            }
        });

        // Global mouseup to stop drawing
        window.addEventListener('mouseup', () => {
            isDrawing = false;
        });

        // Touch drawing support
        pixelGrid.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            const target = document.elementFromPoint(touch.clientX, touch.clientY);
            const cell = target ? target.closest('.grid-cell') : null;

            if (cell) {
                e.preventDefault();
                saveHistoryState();
                isDrawing = true;
                handleCellInteraction(cell);
            }
        }, { passive: false });

        pixelGrid.addEventListener('touchmove', (e) => {
            if (!isDrawing) return;
            e.preventDefault();
            const touch = e.touches[0];
            const target = document.elementFromPoint(touch.clientX, touch.clientY);
            const cell = target ? target.closest('.grid-cell') : null;

            if (cell && (activeTool === 'draw' || activeTool === 'eraser')) {
                handleCellInteraction(cell);
            }
        }, { passive: false });

        pixelGrid.addEventListener('touchend', () => {
            isDrawing = false;
        });

        // Tool Selection
        Object.keys(toolBtns).forEach(tool => {
            toolBtns[tool].addEventListener('click', () => switchTool(tool));
        });

        // Actions
        btnUndo.addEventListener('click', undo);
        btnRedo.addEventListener('click', redo);

        btnGridToggle.addEventListener('click', () => {
            pixelGrid.classList.toggle('no-grid-lines');
            btnGridToggle.classList.toggle('active');
            showToast(pixelGrid.classList.contains('no-grid-lines') ? 'Grid lines hidden' : 'Grid lines visible');
        });

        btnFillAll.addEventListener('click', () => {
            saveHistoryState();
            frames[activeFrameIndex].fill(activeColor);
            syncGridFromState();
            showToast('Filled canvas with active color');
        });

        btnClear.addEventListener('click', () => {
            saveHistoryState();
            frames[activeFrameIndex].fill('');
            syncGridFromState();
            showToast('Cleared canvas');
        });

        // Grid presets
        sizeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const newSize = parseInt(btn.dataset.size);
                if (newSize !== gridSize) {
                    if (confirm(`Changing grid size to ${newSize}x${newSize} will clear your current timeline frames. Proceed?`)) {
                        gridSize = newSize;
                        sizeButtons.forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        createNewTimeline();
                        setupGrid();
                        updateTimeline();
                        updateUndoRedoButtons();
                        showToast(`Resized to ${newSize}x${newSize}`);
                    }
                }
            });
        });

        // Color palette choices
        swatchContainer.addEventListener('click', (e) => {
            const swatch = e.target.closest('.swatch');
            if (swatch) {
                const color = swatch.dataset.color;
                updateActiveColor(color);
            }
        });

        colorPickerInput.addEventListener('input', (e) => {
            updateActiveColor(e.target.value);
        });

        // Timeline management
        btnAddFrame.addEventListener('click', () => {
            frames.push(createEmptyFrame());
            activeFrameIndex = frames.length - 1;
            undoStack = [];
            redoStack = [];
            setupGrid();
            updateTimeline();
            updateUndoRedoButtons();
            scrollToActiveFrame();
            showToast('Frame added');
        });

        btnDuplicateFrame.addEventListener('click', () => {
            const duplicate = [...frames[activeFrameIndex]];
            frames.splice(activeFrameIndex + 1, 0, duplicate);
            activeFrameIndex += 1;
            undoStack = [];
            redoStack = [];
            setupGrid();
            updateTimeline();
            updateUndoRedoButtons();
            scrollToActiveFrame();
            showToast('Frame duplicated');
        });

        btnDeleteFrame.addEventListener('click', () => {
            if (frames.length <= 1) return;

            frames.splice(activeFrameIndex, 1);
            if (activeFrameIndex >= frames.length) {
                activeFrameIndex = frames.length - 1;
            }
            undoStack = [];
            redoStack = [];
            setupGrid();
            updateTimeline();
            updateUndoRedoButtons();
            showToast('Frame deleted');
        });

        // Keyboard shortcuts
        window.addEventListener('keydown', (e) => {
            // Ignore if user typing in a textbox
            if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
                return;
            }

            const key = e.key.toLowerCase();

            if (key === 'd' || key === '1') switchTool('draw');
            else if (key === 'f' || key === '2') switchTool('fill');
            else if (key === 'e' || key === '3') switchTool('eraser');
            else if (key === 'p' || key === '4') switchTool('picker');
            else if (key === 'g') btnGridToggle.click();
            else if (key === ' ' || key === 'spacebar') {
                e.preventDefault();
                btnPlayPause.click();
            } else if (e.ctrlKey && key === 'z') {
                e.preventDefault();
                undo();
            } else if (e.ctrlKey && key === 'y') {
                e.preventDefault();
                redo();
            }
        });

        // Animation preview controls
        btnPlayPause.addEventListener('click', () => {
            isPlaying = !isPlaying;
            if (isPlaying) {
                btnPlayPause.classList.add('active');
                btnPlayPause.innerHTML = '<i data-lucide="pause"></i>';
                startAnimationLoop();
                showToast('Animation playing');
            } else {
                btnPlayPause.classList.remove('active');
                btnPlayPause.innerHTML = '<i data-lucide="play"></i>';
                stopAnimationLoop();
                showToast('Animation paused');
            }
            if (window.lucide) window.lucide.createIcons();
        });

        fpsSlider.addEventListener('input', (e) => {
            fps = parseInt(e.target.value);
            fpsVal.textContent = fps;
            if (isPlaying) {
                stopAnimationLoop();
                startAnimationLoop();
            }
        });

        // Modal triggers
        btnExportPng.addEventListener('click', exportPNG);
        btnExportSvg.addEventListener('click', openSVGModal);
        btnExportCss.addEventListener('click', openCSSModal);

        modalClose.addEventListener('click', () => {
            exportModal.classList.remove('active');
        });

        exportModal.addEventListener('click', (e) => {
            if (e.target === exportModal) {
                exportModal.classList.remove('active');
            }
        });

        modalCopyBtn.addEventListener('click', () => {
            modalCodeTextarea.select();
            document.execCommand('copy');
            showToast('Code copied to clipboard!');
        });
    }

    function switchTool(tool) {
        activeTool = tool;
        Object.keys(toolBtns).forEach(t => {
            toolBtns[t].classList.toggle('active', t === tool);
        });
        showToast(`Tool: ${tool.toUpperCase()}`);
    }

    function updateActiveColor(color) {
        activeColor = color;
        colorPreview.style.backgroundColor = color;
        colorHexText.textContent = color.toUpperCase();
        colorPickerInput.value = color;

        // Visual selection indicator on swatches
        const swatches = swatchContainer.querySelectorAll('.swatch');
        swatches.forEach(swatch => {
            const swatchColor = swatch.dataset.color.toUpperCase();
            swatch.classList.toggle('active', swatchColor === color.toUpperCase());
        });
    }

    // ==========================================================================
    // FRAME TIMELINE RENDER
    // ==========================================================================
    function updateTimeline() {
        timelineContainer.innerHTML = '';

        frames.forEach((frame, idx) => {
            const frameCard = document.createElement('div');
            frameCard.className = `frame-card ${idx === activeFrameIndex ? 'active' : ''}`;
            frameCard.dataset.index = idx;

            // Frame thumbnail canvas
            const thumbCanvas = document.createElement('canvas');
            thumbCanvas.className = 'frame-thumbnail';
            thumbCanvas.width = 64;
            thumbCanvas.height = 64;

            const frameNumber = document.createElement('span');
            frameNumber.className = 'frame-number';
            frameNumber.textContent = idx + 1;

            frameCard.appendChild(thumbCanvas);
            frameCard.appendChild(frameNumber);
            timelineContainer.appendChild(frameCard);

            // Render thumbnail content
            renderThumbnail(idx, thumbCanvas);

            // Click to activate
            frameCard.addEventListener('click', () => {
                activeFrameIndex = idx;
                undoStack = [];
                redoStack = [];
                setupGrid();
                updateTimeline();
                updateUndoRedoButtons();
            });
        });

        // Disable/enable delete button based on frame counts
        btnDeleteFrame.disabled = frames.length <= 1;
    }

    function updateFrameThumbnail(index) {
        const card = timelineContainer.querySelector(`.frame-card[data-index="${index}"]`);
        if (card) {
            const thumbCanvas = card.querySelector('.frame-thumbnail');
            if (thumbCanvas) {
                renderThumbnail(index, thumbCanvas);
            }
        }
    }

    function renderThumbnail(frameIndex, canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const frameData = frames[frameIndex];
        const cellSize = canvas.width / gridSize;

        for (let i = 0; i < gridSize * gridSize; i++) {
            if (frameData[i]) {
                const x = i % gridSize;
                const y = Math.floor(i / gridSize);
                ctx.fillStyle = frameData[i];
                ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
            }
        }
    }

    function scrollToActiveFrame() {
        const activeCard = timelineContainer.querySelector('.frame-card.active');
        if (activeCard) {
            activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }

    // ==========================================================================
    // ANIMATION PLAYBACK
    // ==========================================================================
    function startAnimationLoop() {
        if (animationInterval) clearInterval(animationInterval);

        const intervalMs = 1000 / fps;

        animationInterval = setInterval(() => {
            renderPreviewFrame();
            // Advance frame
            previewFrameIndex = (previewFrameIndex + 1) % frames.length;
        }, intervalMs);
    }

    function stopAnimationLoop() {
        if (animationInterval) {
            clearInterval(animationInterval);
            animationInterval = null;
        }
    }

    function renderPreviewFrame() {
        previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

        // Safeguard index
        if (previewFrameIndex >= frames.length) {
            previewFrameIndex = 0;
        }

        const frameData = frames[previewFrameIndex];
        const pixelSize = previewCanvas.width / gridSize;

        for (let i = 0; i < gridSize * gridSize; i++) {
            if (frameData[i]) {
                const x = i % gridSize;
                const y = Math.floor(i / gridSize);
                previewCtx.fillStyle = frameData[i];
                previewCtx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
            }
        }
    }

    // ==========================================================================
    // EXPORT FUNCTIONS
    // ==========================================================================
    function generateSVGString() {
        const frameData = frames[activeFrameIndex];
        let rects = '';

        for (let i = 0; i < gridSize * gridSize; i++) {
            if (frameData[i]) {
                const x = i % gridSize;
                const y = Math.floor(i / gridSize);
                rects += `  <rect x="${x}" y="${y}" width="1" height="1" fill="${frameData[i]}" />\n`;
            }
        }

        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${gridSize} ${gridSize}" width="512" height="512" shape-rendering="crispEdges">\n` +
            rects +
            `</svg>`;
    }

    function generateCSSString() {
        const frameData = frames[activeFrameIndex];
        let shadows = [];

        const pixelSize = 10; // 10px per pixel in target display

        for (let i = 0; i < gridSize * gridSize; i++) {
            if (frameData[i]) {
                const x = (i % gridSize) * pixelSize;
                const y = Math.floor(i / gridSize) * pixelSize;
                shadows.push(`${x}px ${y}px 0 ${frameData[i]}`);
            }
        }

        const shadowValue = shadows.join(',\n    ');

        return `/* HTML Structure:\n<div class="pixel-art"></div>\n*/\n\n` +
            `.pixel-art {\n` +
            `  display: inline-block;\n` +
            `  width: ${pixelSize}px;\n` +
            `  height: ${pixelSize}px;\n` +
            `  background: transparent;\n` +
            `  box-shadow:\n    ${shadowValue};\n` +
            `}`;
    }

    function exportPNG() {
        const frameData = frames[activeFrameIndex];

        // High resolution sizing
        const exportCanvas = document.createElement('canvas');
        const exportSize = 512;
        exportCanvas.width = exportSize;
        exportCanvas.height = exportSize;
        const ctx = exportCanvas.getContext('2d');

        // Ensure crisp drawing
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, exportSize, exportSize);

        const pixelSize = exportSize / gridSize;

        for (let i = 0; i < gridSize * gridSize; i++) {
            if (frameData[i]) {
                const x = i % gridSize;
                const y = Math.floor(i / gridSize);
                ctx.fillStyle = frameData[i];
                ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
            }
        }

        // Download anchor
        const link = document.createElement('a');
        link.download = `pixel-art-${gridSize}x${gridSize}-${Date.now()}.png`;
        link.href = exportCanvas.toDataURL('image/png');
        link.click();

        showToast('PNG Downloaded!');
    }

    function openSVGModal() {
        const svgCode = generateSVGString();
        modalTitle.textContent = 'SVG Export Code';
        modalCodeTextarea.value = svgCode;
        exportModal.classList.add('active');
    }

    function openCSSModal() {
        const cssCode = generateCSSString();
        modalTitle.textContent = 'CSS Box-Shadow Code';
        modalCodeTextarea.value = cssCode;
        exportModal.classList.add('active');
    }

    // ==========================================================================
    // UTILITY SYSTEMS
    // ==========================================================================
    function showToast(message) {
        toastMessage.textContent = message;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 2200);
    }

    // Run app
    init();
});
