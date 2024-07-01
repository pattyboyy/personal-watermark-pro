const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let currentImage = null;
let watermarks = JSON.parse(localStorage.getItem('watermarks')) || [];
let savedSettings = JSON.parse(localStorage.getItem('savedSettings')) || [];

function updatePreview() {
    if (!currentImage) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(currentImage, 0, 0, canvas.width, canvas.height);
    watermarks.forEach(applyWatermarkFromSettings);
}

function applyWatermarkFromSettings(watermark) {
    const settings = {
        text: document.getElementById(`watermarkText_${watermark.id}`).value,
        font: document.getElementById(`watermarkFont_${watermark.id}`).value,
        color: document.getElementById(`watermarkColor_${watermark.id}`).value,
        opacity: parseFloat(document.getElementById(`watermarkOpacity_${watermark.id}`).value),
        size: parseInt(document.getElementById(`watermarkSize_${watermark.id}`).value),
        position: document.getElementById(`watermarkPosition_${watermark.id}`).value,
        rotation: parseInt(document.getElementById(`watermarkRotation_${watermark.id}`).value),
        effect: document.getElementById(`watermarkEffect_${watermark.id}`).value,
        enablePattern: document.getElementById(`enablePattern_${watermark.id}`).checked,
        patternSpacing: parseInt(document.getElementById(`patternSpacing_${watermark.id}`).value),
        patternAngle: parseInt(document.getElementById(`patternAngle_${watermark.id}`).value)
    };

    ctx.save();
    ctx.globalAlpha = settings.opacity;
    ctx.fillStyle = settings.color;
    ctx.font = `${settings.size}px ${settings.font}`;

    const metrics = ctx.measureText(settings.text);
    const textWidth = metrics.width;
    const textHeight = parseInt(settings.size, 10);

    let x, y;
    if (settings.position === 'custom') {
        x = parseInt(document.getElementById(`watermarkX_${watermark.id}`).value || 0);
        y = parseInt(document.getElementById(`watermarkY_${watermark.id}`).value || 0);
    } else {
        const positions = {
            topLeft: [10, textHeight + 10],
            topRight: [canvas.width - textWidth - 10, textHeight + 10],
            bottomLeft: [10, canvas.height - 10],
            bottomRight: [canvas.width - textWidth - 10, canvas.height - 10],
            center: [(canvas.width - textWidth) / 2, (canvas.height + textHeight) / 2]
        };
        [x, y] = positions[settings.position] || positions.topLeft;
    }

    if (settings.enablePattern) {
        for (let i = -canvas.width; i < canvas.width * 2; i += settings.patternSpacing) {
            for (let j = -canvas.height; j < canvas.height * 2; j += settings.patternSpacing) {
                ctx.save();
                ctx.translate(i, j);
                ctx.rotate(settings.patternAngle * Math.PI / 180);
                applyWatermarkText(settings.text, 0, 0, settings.rotation, settings.effect);
                ctx.restore();
            }
        }
    } else {
        applyWatermarkText(settings.text, x, y, settings.rotation, settings.effect);
    }

    ctx.restore();
}

function applyWatermarkText(text, x, y, rotation, effect) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation * Math.PI / 180);

    switch (effect) {
        case 'outline':
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.strokeText(text, 0, 0);
            break;
        case 'shadow':
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 5;
            ctx.shadowOffsetX = 3;
            ctx.shadowOffsetY = 3;
            break;
        case 'emboss':
            ctx.shadowColor = 'white';
            ctx.shadowBlur = 1;
            ctx.shadowOffsetX = -1;
            ctx.shadowOffsetY = -1;
            ctx.fillText(text, 0, 0);
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            break;
        case 'neon':
            ctx.shadowColor = ctx.fillStyle;
            ctx.shadowBlur = 10;
            ctx.strokeStyle = ctx.fillStyle;
            ctx.lineWidth = 2;
            ctx.strokeText(text, 0, 0);
            break;
    }

    ctx.fillText(text, 0, 0);
    ctx.restore();
}

document.getElementById('imageUpload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
        currentImage = new Image();
        currentImage.onload = () => {
            canvas.width = currentImage.width;
            canvas.height = currentImage.height;
            updatePreview();
        };
        currentImage.src = event.target.result;
    };

    reader.readAsDataURL(file);
});

document.getElementById('addWatermark').addEventListener('click', () => {
    const watermarkId = Date.now();
    const watermarkControl = createWatermarkControl(watermarkId);
    document.getElementById('watermarkControls').appendChild(watermarkControl);
    watermarks.push({ id: watermarkId });
    updatePreview();
    saveWatermarksToLocalStorage();
});

function createWatermarkControl(watermarkId) {
    const div = document.createElement('div');
    div.className = 'bg-gray-100 p-4 rounded-lg mb-4';
    div.innerHTML = `
        <input type="text" id="watermarkText_${watermarkId}" placeholder="Watermark text" class="w-full border rounded p-2 mb-2">
        <select id="watermarkFont_${watermarkId}" class="w-full border rounded p-2 mb-2">
            <option value="Arial">Arial</option>
            <option value="Verdana">Verdana</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Courier">Courier</option>
            <option value="Georgia">Georgia</option>
        </select>
        <input type="color" id="watermarkColor_${watermarkId}" class="w-full h-10 mb-2">
        <input type="range" id="watermarkOpacity_${watermarkId}" min="0" max="1" step="0.1" value="0.5" class="w-full mb-2">
        <input type="range" id="watermarkSize_${watermarkId}" min="10" max="100" value="48" class="w-full mb-2">
        <select id="watermarkPosition_${watermarkId}" class="w-full border rounded p-2 mb-2">
            <option value="topLeft">Top Left</option>
            <option value="topRight">Top Right</option>
            <option value="bottomLeft">Bottom Left</option>
            <option value="bottomRight">Bottom Right</option>
            <option value="center">Center</option>
            <option value="custom">Custom</option>
        </select>
        <div id="customPosition_${watermarkId}" style="display:none;">
            <input type="number" id="watermarkX_${watermarkId}" placeholder="X" class="w-1/2 border rounded p-2 mb-2">
            <input type="number" id="watermarkY_${watermarkId}" placeholder="Y" class="w-1/2 border rounded p-2 mb-2">
        </div>
        <input type="range" id="watermarkRotation_${watermarkId}" min="0" max="360" value="0" class="w-full mb-2">
        <select id="watermarkEffect_${watermarkId}" class="w-full border rounded p-2 mb-2">
            <option value="none">None</option>
            <option value="outline">Outline</option>
            <option value="shadow">Shadow</option>
            <option value="emboss">Emboss</option>
            <option value="neon">Neon</option>
        </select>
        <label>
            <input type="checkbox" id="enablePattern_${watermarkId}"> Enable Pattern
        </label>
        <div id="patternOptions_${watermarkId}" style="display:none;">
            <input type="range" id="patternSpacing_${watermarkId}" min="50" max="300" value="100" class="w-full mb-2">
            <input type="range" id="patternAngle_${watermarkId}" min="0" max="360" value="0" class="w-full mb-2">
        </div>
        <button class="removeWatermark bg-red-500 text-white px-4 py-2 rounded mt-2">Remove Watermark</button>
    `;

    div.querySelectorAll('input, select').forEach(element => {
        element.addEventListener('input', () => {
            updatePreview();
            saveWatermarksToLocalStorage();
        });
    });

    const positionSelect = div.querySelector(`#watermarkPosition_${watermarkId}`);
    const customPosition = div.querySelector(`#customPosition_${watermarkId}`);
    positionSelect.addEventListener('change', () => {
        customPosition.style.display = positionSelect.value === 'custom' ? 'block' : 'none';
        updatePreview();
        saveWatermarksToLocalStorage();
    });

    const enablePatternCheckbox = div.querySelector(`#enablePattern_${watermarkId}`);
    const patternOptions = div.querySelector(`#patternOptions_${watermarkId}`);
    enablePatternCheckbox.addEventListener('change', () => {
        patternOptions.style.display = enablePatternCheckbox.checked ? 'block' : 'none';
        updatePreview();
        saveWatermarksToLocalStorage();
    });

    div.querySelector('.removeWatermark').addEventListener('click', () => {
        div.remove();
        watermarks = watermarks.filter(w => w.id !== watermarkId);
        updatePreview();
        saveWatermarksToLocalStorage();
    });

    return div;
}

function saveWatermarksToLocalStorage() {
    localStorage.setItem('watermarks', JSON.stringify(watermarks));
}

function saveSettingsToLocalStorage() {
    localStorage.setItem('savedSettings', JSON.stringify(savedSettings));
}

function saveWatermarkSettings(watermarkId) {
    const settingName = prompt("Enter a name for these watermark settings:");
    if (!settingName) return;

    const settings = {
        name: settingName,
        id: watermarkId,
        text: document.getElementById(`watermarkText_${watermarkId}`).value,
        font: document.getElementById(`watermarkFont_${watermarkId}`).value,
        color: document.getElementById(`watermarkColor_${watermarkId}`).value,
        opacity: document.getElementById(`watermarkOpacity_${watermarkId}`).value,
        size: document.getElementById(`watermarkSize_${watermarkId}`).value,
        position: document.getElementById(`watermarkPosition_${watermarkId}`).value,
        rotation: document.getElementById(`watermarkRotation_${watermarkId}`).value,
        effect: document.getElementById(`watermarkEffect_${watermarkId}`).value,
        enablePattern: document.getElementById(`enablePattern_${watermarkId}`).checked,
        patternSpacing: document.getElementById(`patternSpacing_${watermarkId}`).value,
        patternAngle: document.getElementById(`patternAngle_${watermarkId}`).value
    };

    if (settings.position === 'custom') {
        settings.customX = document.getElementById(`watermarkX_${watermarkId}`).value;
        settings.customY = document.getElementById(`watermarkY_${watermarkId}`).value;
    }

    savedSettings.push(settings);
    updateSavedSettingsBox();
    saveSettingsToLocalStorage();
}

function updateSavedSettingsBox() {
    const savedSettingsBox = document.getElementById('savedSettingsBox');
    savedSettingsBox.innerHTML = '<h3 class="text-lg font-semibold mb-2">Saved Watermark Settings</h3>';

    if (savedSettings.length === 0) {
        savedSettingsBox.innerHTML += '<p>No saved settings yet.</p>';
        return;
    }

    const ul = document.createElement('ul');
    ul.className = 'space-y-2';

    savedSettings.forEach((setting, index) => {
        const li = document.createElement('li');
        li.className = 'flex justify-between items-center bg-gray-100 p-2 rounded';
        li.innerHTML = `
            <span>${setting.name}</span>
            <button class="applySetting bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-sm" data-index="${index}">
                Apply
            </button>
        `;
        ul.appendChild(li);
    });

    savedSettingsBox.appendChild(ul);

    document.querySelectorAll('.applySetting').forEach(button => {
        button.addEventListener('click', (e) => {
            const index = e.target.dataset.index;
            applyWatermarkSetting(savedSettings[index]);
        });
    });
}

function applyWatermarkSetting(setting) {
    if (watermarks.length === 0) {
        document.getElementById('addWatermark').click();
    }
    
    const watermarkId = watermarks[0].id;
    
    document.getElementById(`watermarkText_${watermarkId}`).value = setting.text;
    document.getElementById(`watermarkFont_${watermarkId}`).value = setting.font;
    document.getElementById(`watermarkColor_${watermarkId}`).value = setting.color;
    document.getElementById(`watermarkOpacity_${watermarkId}`).value = setting.opacity;
    document.getElementById(`watermarkSize_${watermarkId}`).value = setting.size;
    document.getElementById(`watermarkPosition_${watermarkId}`).value = setting.position;
    document.getElementById(`watermarkRotation_${watermarkId}`).value = setting.rotation;
    document.getElementById(`watermarkEffect_${watermarkId}`).value = setting.effect;
    document.getElementById(`enablePattern_${watermarkId}`).checked = setting.enablePattern;
    document.getElementById(`patternSpacing_${watermarkId}`).value = setting.patternSpacing;
    document.getElementById(`patternAngle_${watermarkId}`).value = setting.patternAngle;

    if (setting.position === 'custom') {
        document.getElementById(`watermarkX_${watermarkId}`).value = setting.customX;
        document.getElementById(`watermarkY_${watermarkId}`).value = setting.customY;
        document.getElementById(`customPosition_${watermarkId}`).style.display = 'block';
    } else {
        document.getElementById(`customPosition_${watermarkId}`).style.display = 'none';
    }

    document.getElementById(`patternOptions_${watermarkId}`).style.display = setting.enablePattern ? 'block' : 'none';

    updatePreview();
    saveWatermarksToLocalStorage();
}

function saveImage() {
    if (!currentImage) return;

    const library = document.getElementById('imageLibrary');
    const container = document.createElement('div');
    container.className = 'image-container border p-2 rounded bg-gray-100 flex flex-col items-center cursor-pointer';

    const originalImage = new Image();
    originalImage.src = currentImage.src;
    originalImage.className = 'original-image w-full h-auto mb-2';
    originalImage.style.maxWidth = '200px';

    const watermarkedImage = new Image();
    watermarkedImage.src = canvas.toDataURL();
    watermarkedImage.className = 'watermarked-image w-full h-auto';
    watermarkedImage.style.maxWidth = '200px';

    container.appendChild(originalImage);
    container.appendChild(watermarkedImage);
    library.appendChild(container);

    attachImageContainerListeners(); // Attach listeners after adding new images
    saveImageLibraryToLocalStorage();
}

function saveImageLibraryToLocalStorage() {
    const library = document.getElementById('imageLibrary').innerHTML;
    localStorage.setItem('imageLibrary', library);
}

function loadImageLibraryFromLocalStorage() {
    const library = localStorage.getItem('imageLibrary');
    if (library) {
        document.getElementById('imageLibrary').innerHTML = library;
        attachImageContainerListeners();
    }
}

function attachImageContainerListeners() {
    document.querySelectorAll('#imageLibrary .image-container').forEach(container => {
        const originalImage = container.querySelector('.original-image');
        const watermarkedImage = container.querySelector('.watermarked-image');
        container.addEventListener('click', () => openModal(originalImage.src, watermarkedImage.src));
    });
}

function openModal(originalSrc, watermarkedSrc) {
    console.log('Opening modal with:', { originalSrc, watermarkedSrc });
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const toggleButton = document.getElementById('toggleImage');

    modalImage.src = watermarkedSrc;
    modalImage.dataset.originalSrc = originalSrc;
    modalImage.dataset.watermarkedSrc = watermarkedSrc;

    toggleButton.textContent = 'Show Original';
    toggleButton.dataset.showingWatermarked = 'true';

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    console.log('Modal classes:', modal.className);
}

function closeModal() {
    const modal = document.getElementById('imageModal');
    modal.classList.remove('flex');
    modal.classList.add('hidden');
}

document.getElementById('saveImage').addEventListener('click', saveImage);

document.getElementById('downloadImage').addEventListener('click', () => {
    if (!currentImage) return;
    const link = document.createElement('a');
    link.download = 'watermarked-image.png';
    link.href = canvas.toDataURL();
    link.click();
});

document.getElementById('closeModal').addEventListener('click', closeModal);

document.getElementById('toggleImage').addEventListener('click', (e) => {
    const modalImage = document.getElementById('modalImage');
    const isShowingWatermarked = e.target.dataset.showingWatermarked === 'true';

    if (isShowingWatermarked) {
        modalImage.src = modalImage.dataset.originalSrc;
        e.target.textContent = 'Show Watermarked';
        e.target.dataset.showingWatermarked = 'false';
    } else {
        modalImage.src = modalImage.dataset.watermarkedSrc;
        e.target.textContent = 'Show Original';
        e.target.dataset.showingWatermarked = 'true';
    }
});

document.getElementById('downloadModalImage').addEventListener('click', () => {
    const modalImage = document.getElementById('modalImage');
    const link = document.createElement('a');
    link.href = modalImage.src;
    link.download = 'image.png';
    link.click();
});

document.getElementById('imageModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('imageModal')) {
        closeModal();
    }
});

function init() {
    updateSavedSettingsBox();
    loadImageLibraryFromLocalStorage();
    attachImageContainerListeners(); // Ensure listeners are attached on init
    
    // Load existing watermarks
    watermarks.forEach(watermark => {
        const watermarkControl = createWatermarkControl(watermark.id);
        document.getElementById('watermarkControls').appendChild(watermarkControl);
    });
    
    updatePreview();
}

init();