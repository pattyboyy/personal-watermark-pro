const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let currentImage = null;
let watermarks = JSON.parse(localStorage.getItem('watermarks')) || [];
let savedSettings = JSON.parse(localStorage.getItem('savedSettings')) || [];

function updatePreview() {
    if (!currentImage) {
        console.warn('No image loaded, skipping preview update');
        return;
    }

    console.log('Updating preview');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(currentImage, 0, 0, canvas.width, canvas.height);

    if (watermarks.length === 0) {
        console.warn('No watermarks defined, skipping watermark application');
        return;
    }

    watermarks.forEach(watermark => {
        applyWatermarkFromSettings(watermark);
    });
}

function applyWatermarkFromSettings(watermark) {
    const elements = {
        text: document.getElementById(`watermarkText_${watermark.id}`),
        font: document.getElementById(`watermarkFont_${watermark.id}`),
        color: document.getElementById(`watermarkColor_${watermark.id}`),
        opacity: document.getElementById(`watermarkOpacity_${watermark.id}`),
        size: document.getElementById(`watermarkSize_${watermark.id}`),
        position: document.getElementById(`watermarkPosition_${watermark.id}`),
        rotation: document.getElementById(`watermarkRotation_${watermark.id}`),
        effect: document.getElementById(`watermarkEffect_${watermark.id}`),
        enablePattern: document.getElementById(`enablePattern_${watermark.id}`),
        patternSpacing: document.getElementById(`patternSpacing_${watermark.id}`),
        patternAngle: document.getElementById(`patternAngle_${watermark.id}`)
    };

    // Check if all elements exist
    for (const [key, element] of Object.entries(elements)) {
        if (!element) {
            console.error(`Element not found: ${key}_${watermark.id}`);
            return; // Exit the function if any element is missing
        }
    }

    const settings = {
        text: elements.text.value,
        font: elements.font.value,
        color: elements.color.value,
        opacity: parseFloat(elements.opacity.value),
        size: parseInt(elements.size.value),
        position: elements.position.value,
        rotation: parseInt(elements.rotation.value),
        effect: elements.effect.value,
        enablePattern: elements.enablePattern.checked,
        patternSpacing: parseInt(elements.patternSpacing.value),
        patternAngle: parseInt(elements.patternAngle.value)
    };

    console.log('Applying watermark with settings:', settings);

    if (!settings.text) {
        console.warn('No watermark text provided');
        return;
    }

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
        switch (settings.position) {
            case 'topLeft':
                x = 10;
                y = textHeight + 10;
                break;
            case 'topRight':
                x = canvas.width - textWidth - 10;
                y = textHeight + 10;
                break;
            case 'bottomLeft':
                x = 10;
                y = canvas.height - 10;
                break;
            case 'bottomRight':
                x = canvas.width - textWidth - 10;
                y = canvas.height - 10;
                break;
            case 'center':
                x = (canvas.width - textWidth) / 2;
                y = (canvas.height + textHeight) / 2;
                break;
            default:
                console.warn('Invalid position, defaulting to top left');
                x = 10;
                y = textHeight + 10;
        }
    }

    console.log('Watermark position:', { x, y });

    if (settings.enablePattern) {
        for (let i = -canvas.width; i < canvas.width * 2; i += settings.patternSpacing) {
            for (let j = -canvas.height; j < canvas.height * 2; j += settings.patternSpacing) {
                ctx.save();
                ctx.translate(i, j);
                ctx.rotate(settings.patternAngle * Math.PI / 180);
                applyWatermark(settings.text, 0, 0, settings.rotation, settings.effect);
                ctx.restore();
            }
        }
    } else {
        applyWatermark(settings.text, x, y, settings.rotation, settings.effect);
    }

    ctx.restore();
    console.log('Watermark applied');
}

function applyWatermark(text, x, y, rotation, effect) {
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
        const img = new Image();
        img.onload = () => {
            const maxWidth = 800;
            const maxHeight = 600;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width *= maxHeight / height;
                    height = maxHeight;
                }
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            currentImage = img;
            updatePreview();
        };
        img.src = event.target.result;
    };

    reader.readAsDataURL(file);
});

document.getElementById('addWatermark').addEventListener('click', () => {
    const watermarkId = Date.now();
    const watermarkControl = document.createElement('div');
    watermarkControl.className = 'bg-gray-100 p-4 rounded-lg mb-4';
    watermarkControl.innerHTML = `
        <div class="grid grid-cols-1 gap-4">
            <div>
                <label class="block mb-2">Watermark Text</label>
                <input type="text" id="watermarkText_${watermarkId}" placeholder="Enter text" class="w-full border rounded p-2">
            </div>
            <div>
                <label class="block mb-2">Font</label>
                <select id="watermarkFont_${watermarkId}" class="w-full border rounded p-2">
                    <option value="Arial">Arial</option>
                    <option value="Verdana">Verdana</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Courier">Courier</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Palatino">Palatino</option>
                    <option value="Garamond">Garamond</option>
                    <option value="Bookman">Bookman</option>
                    <option value="Comic Sans MS">Comic Sans MS</option>
                    <option value="Trebuchet MS">Trebuchet MS</option>
                    <option value="Arial Black">Arial Black</option>
                </select>
            </div>
            <div>
                <label class="block mb-2">Color</label>
                <input type="color" id="watermarkColor_${watermarkId}" class="w-full h-10">
            </div>
            <div>
                <label class="block mb-2">Opacity</label>
                <input type="range" id="watermarkOpacitySlider_${watermarkId}" min="0" max="1" step="0.01" value="0.5" class="w-full">
                <input type="number" id="watermarkOpacity_${watermarkId}" min="0" max="1" step="0.01" value="0.5" class="w-full border rounded p-2 mt-2">
            </div>
            <div>
                <label class="block mb-2">Size</label>
                <input type="range" id="watermarkSize_${watermarkId}" min="10" max="100" value="48" class="w-full">
            </div>
            <div>
                <label class="block mb-2">Position</label>
                <select id="watermarkPosition_${watermarkId}" class="w-full border rounded p-2">
                    <option value="topLeft">Top Left</option>
                    <option value="topRight">Top Right</option>
                    <option value="bottomLeft">Bottom Left</option>
                    <option value="bottomRight">Bottom Right</option>
                    <option value="center">Center</option>
                    <option value="custom">Custom</option>
                </select>
            </div>
            <div id="customPosition_${watermarkId}" style="display:none;">
                <label class="block mb-2">Custom X</label>
                <input type="number" id="watermarkX_${watermarkId}" class="w-full border rounded p-2" value="0">
                <label class="block mb-2">Custom Y</label>
                <input type="number" id="watermarkY_${watermarkId}" class="w-full border rounded p-2" value="0">
            </div>
            <div>
                <label class="block mb-2">Rotation</label>
                <input type="range" id="watermarkRotation_${watermarkId}" min="0" max="360" value="0" class="w-full">
            </div>
            <div>
                <label class="block mb-2">Text Effect</label>
                <select id="watermarkEffect_${watermarkId}" class="w-full border rounded p-2">
                    <option value="none">None</option>
                    <option value="outline">Outline</option>
                    <option value="shadow">Shadow</option>
                    <option value="emboss">Emboss</option>
                    <option value="neon">Neon</option>
                </select>
            </div>
            <div>
                <label class="block mb-2">
                    <input type="checkbox" id="enablePattern_${watermarkId}"> Enable Pattern
                </label>
            </div>
            <div id="patternOptions_${watermarkId}" style="display:none;">
                <div>
                    <label class="block mb-2">Pattern Spacing</label>
                    <input type="range" id="patternSpacing_${watermarkId}" min="50" max="300" value="100" class="w-full">
                </div>
                <div>
                    <label class="block mb-2">Pattern Angle</label>
                    <input type="range" id="patternAngle_${watermarkId}" min="0" max="360" value="0" class="w-full">
                </div>
            </div>
        </div>
        <button class="removeWatermark mt-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition duration-300 ease-in-out">
            <i class="fas fa-trash mr-2"></i> Remove Watermark
        </button>
        <button class="saveSettings mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition duration-300 ease-in-out ml-2">
            <i class="fas fa-save mr-2"></i> Save Settings
        </button>
    `;
    document.getElementById('watermarkControls').appendChild(watermarkControl);

    watermarkControl.querySelector('.removeWatermark').addEventListener('click', () => {
        watermarkControl.remove();
        watermarks = watermarks.filter(w => w.id !== watermarkId);
        updatePreview();
        saveWatermarksToLocalStorage();
    });

    watermarkControl.querySelector('.saveSettings').addEventListener('click', () => {
        saveWatermarkSettings(watermarkId);
    });

    const positionSelect = watermarkControl.querySelector(`#watermarkPosition_${watermarkId}`);
    const customPosition = watermarkControl.querySelector(`#customPosition_${watermarkId}`);
    positionSelect.addEventListener('change', (e) => {
        if (e.target.value === 'custom') {
            customPosition.style.display = 'block';
        } else {
            customPosition.style.display = 'none';
        }
        updatePreview();
        saveWatermarksToLocalStorage();
    });

    const enablePatternCheckbox = watermarkControl.querySelector(`#enablePattern_${watermarkId}`);
    const patternOptions = watermarkControl.querySelector(`#patternOptions_${watermarkId}`);
    enablePatternCheckbox.addEventListener('change', (e) => {
        patternOptions.style.display = e.target.checked ? 'block' : 'none';
        updatePreview();
        saveWatermarksToLocalStorage();
    });

    const opacitySlider = watermarkControl.querySelector(`#watermarkOpacitySlider_${watermarkId}`);
    const opacityInput = watermarkControl.querySelector(`#watermarkOpacity_${watermarkId}`);
    opacitySlider.addEventListener('input', (e) => {
        opacityInput.value = e.target.value;
        updatePreview();
        saveWatermarksToLocalStorage();
    });
    opacityInput.addEventListener('input', (e) => {
        opacitySlider.value = e.target.value;
        updatePreview();
        saveWatermarksToLocalStorage();
    });

    watermarkControl.querySelectorAll('input, select').forEach(element => {
        element.addEventListener('input', () => {
            updatePreview();
            saveWatermarksToLocalStorage();
        });
    });

    watermarks.push({ id: watermarkId });
    updatePreview();
    saveWatermarksToLocalStorage();
});

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
    alert('Watermark settings saved!');
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
    document.getElementById(`watermarkOpacitySlider_${watermarkId}`).value = setting.opacity;
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
    container.className = 'border p-2 rounded bg-gray-100 flex flex-col items-center';

    const originalImage = new Image();
    originalImage.src = currentImage.src;
    originalImage.className = 'w-full h-auto mb-2';
    originalImage.style.maxWidth = '200px';

    const watermarkedImage = new Image();
    watermarkedImage.src = canvas.toDataURL();
    watermarkedImage.className = 'w-full h-auto';
    watermarkedImage.style.maxWidth = '200px';

    container.appendChild(originalImage);
    container.appendChild(watermarkedImage);
    library.appendChild(container);

    container.addEventListener('click', () => openModal(originalImage.src, watermarkedImage.src));
    saveImageLibraryToLocalStorage();
}

function openModal(originalSrc, watermarkedSrc) {
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
}

function closeModal() {
    const modal = document.getElementById('imageModal');
    modal.classList.remove('flex');
    modal.classList.add('hidden');
}

function saveWatermarksToLocalStorage() {
    localStorage.setItem('watermarks', JSON.stringify(watermarks));
}

function saveSettingsToLocalStorage() {
    localStorage.setItem('savedSettings', JSON.stringify(savedSettings));
}

function saveImageLibraryToLocalStorage() {
    const library = document.getElementById('imageLibrary').innerHTML;
    localStorage.setItem('imageLibrary', library);
}

function loadImageLibraryFromLocalStorage() {
    const library = localStorage.getItem('imageLibrary');
    if (library) {
        document.getElementById('imageLibrary').innerHTML = library;
        document.querySelectorAll('#imageLibrary > div').forEach(container => {
            const originalImage = container.querySelector('img:first-child');
            const watermarkedImage = container.querySelector('img:last-child');
            container.addEventListener('click', () => openModal(originalImage.src, watermarkedImage.src));
        });
    }
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
    updatePreview();
    loadImageLibraryFromLocalStorage();
}

init();