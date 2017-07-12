const ipc = require('electron').ipcRenderer,
      clipboard = require('electron').clipboard,
      fs = require('fs');

const explorerTrigger = document.getElementById('explorer-trigger'),
      addPopupTrigger = document.getElementById('add-popup-trigger'),
      settingsPopupTrigger = document.getElementById('settings-trigger'),
      modeTrigger = document.getElementById('mode-trigger'),
      menuTrigger = document.getElementById('menu-trigger'),
      themeTrigger = document.getElementById('theme-trigger'),
      menuPopup = document.getElementById('menu-popup'),
      addPopup = document.getElementById('add-popup'),
      settingsPopup = document.getElementById('settings-popup'),
      addColorTrigger = document.getElementById('add-color'),
      colorsHolder = document.getElementById('colors-holder'),
      gradientsHolder = document.getElementById('gradients-holder'),
      tagsHolder = document.getElementById('tags-holder'),
      triggersHolder = document.getElementById('triggers-holder'),
      colorInput = document.getElementById('color-code'),
      contextMenu = document.getElementById('context'),
      tagInput = document.getElementById('tag-input'),
      tagsList = document.getElementById('tags-list'),
      searchColorsInput = document.getElementById('search-colors'),
      searchTagsInput = document.getElementById('search-tags'),
      tabsLinks = document.querySelectorAll('.tabs_link'),
      colorFormatCheckbox = document.getElementById('color-format'),
      gradientFormatCheckbox = document.getElementById('gradient-format');

let colorsJSON = [],
    selectedColor = 0,
    options = {
        colorFormat: 'hex',
        gradientFormat: 'svg'
    };

function init() {
    menuTrigger.addEventListener('click', function () {
        menuPopup.classList.toggle('popup__visible');
    });

    themeTrigger.addEventListener('click', function () {
        changeTheme();
    });

    addPopupTrigger.addEventListener('click', function () {
        addPopup.classList.toggle('popup__visible');
    });

    settingsPopupTrigger.addEventListener('click', function () {
        settingsPopup.classList.toggle('popup__visible');
    });

    addColorTrigger.addEventListener('click', function () {
        renderColor(colorInput.value);
        saveColor(colorInput.value);

        addPopup.classList.toggle('popup__visible');    
    });

    modeTrigger.addEventListener('click', function () {
        modeTrigger.classList.toggle('menu_icon__colors');
        document.querySelectorAll('.mode-section').forEach(function (el) {
            el.classList.toggle('visible');
        });
    });

    explorerTrigger.addEventListener('click', function (event) {
        ipc.send('open-file-dialog')
    })

    document.body.addEventListener('click', hideContextMenu);    

    ipc.on('selected-directory', function (event, path) {
        document.getElementById('selected-file').innerHTML = `You selected: ${path}`
    })

    tagInput.addEventListener('keyup', saveTag);

    searchColorsInput.addEventListener('input', searchColor);
    searchTagsInput.addEventListener('input', searchTags);

    tabsLinks.forEach(function (el) {
        el.addEventListener('click', function (e) {
            tabsLinks.forEach(function (link) {
                link.classList.remove('tabs_link__active');
            });
            el.classList.add('tabs_link__active');

            colorsHolder.classList.remove('tabs_content__gradient');            
            if (getIndex(el) === 1) {
                colorsHolder.classList.add('tabs_content__gradient');
            }
        })
    });

    colorFormatCheckbox.addEventListener('change', saveOptions);
    gradientFormatCheckbox.addEventListener('change', saveOptions);

    loadColors();
    loadOptions();
    setTheme();
}



function renderColor(colorCode) {
    let el = document.createElement('div');
    el.classList.add('color');
    el.style.background = colorCode;
    el.addEventListener('contextmenu', showContextMenu);
    el.addEventListener('click', copyToClipBoard);

    if (colorCode.indexOf('gradient') != -1) {
        el.classList.add('color__gradient');
    }

    colorsHolder.appendChild(el);
}

function saveColor(colorCode) {
    let colorObj = {
        color: colorCode,
        tags: []
    }

    colorsJSON.push(colorObj);
    
    saveJSON();
}

function saveJSON() {
    fs.writeFile('colors.json', JSON.stringify(colorsJSON), (err) => {
        if (err) {
            console.log("An error ocurred creating the file " + err.message);
        }
    });
}

function loadColors(file) {
    fs.readFile('colors.json', 'utf-8', (err, data) => {
        if(err){
            console.log("An error ocurred reading the file :" + err.message);
            return;
        }

        colorsJSON = JSON.parse(data);

        colorsJSON.forEach(function (el) {
            renderColor(el.color);
        });

        loadTags();
    });
}

function showContextMenu(e) {
    hideContextMenu(e);

    selectedColor = getIndex(e.target)

    tagsList.innerHTML = '';
    colorsJSON[selectedColor].tags.forEach(function (el) {
        let tag = document.createElement('span');
        tag.classList.add('tag');
        tag.innerText = el;

        tagsList.appendChild(tag);
    });

    contextMenu.style.left = e.target.offsetLeft + e.target.offsetWidth - 15 + 'px';
    contextMenu.style.top = e.target.offsetTop + e.target.offsetHeight - 15 + 'px';
    contextMenu.classList.add('visible');
}

function hideContextMenu(e) {
    if (!e.target.matches('#context ,#context *')) {
        contextMenu.classList.remove('visible');
    }
}

function saveTag(e) {
    if (e.code == 'Enter') {
        let tag = document.createElement('span');
        tag.classList.add('tags-list_item');
        tag.innerText = e.target.value;

        tagsList.appendChild(tag);

        colorsJSON[selectedColor].tags.push(e.target.value)
        saveJSON();
    }
}

function loadTags() {
    let tagsNames = [];

    colorsJSON.forEach(function (el) {
        el.tags.forEach(function (el) {
            if (tagsNames.indexOf(el) === -1) {
                tagsNames.push(el);
                renderTag(el);
            }
        });
    });
}

function renderTag(tagName) {
    let tag = document.createElement('div');
    tag.classList.add('tag');

    let tagTitle = document.createElement('p');
    tagTitle.classList.add('tag_title');
    tagTitle.innerText = tagName;

    let tagColors = document.createElement('div');
    tagColors.classList.add('tag_colors');

    colorsJSON.forEach(function (el) {
        for (let i = 0; i < el.tags.length; i++) {
            if (el.tags[i] === tagName) {
                let tagColor = document.createElement('div');
                tagColor.style.backgroundColor = el.color;
                tagColors.appendChild(tagColor);
            }
        }
    });

    tag.appendChild(tagTitle);
    tag.appendChild(tagColors);
    tagsHolder.appendChild(tag);
}

function getIndex(el) {
    let children = [];

    el.parentNode.childNodes.forEach(function (node) {
        if (node.nodeName === el.nodeName) {
            children.push(node)
        }
    });
    
    for (let i = 0; i < children.length; i++) {
        if (children[i] === el) {
            
            return i;
        }
    }

    return -1;
}

function searchColor(e) {
    colorsHolder.innerHTML = '';
    colorsJSON.forEach(function (el) {
        if (el.color.indexOf(e.target.value) != -1) {            
            renderColor(el.color);
        }
    });
}

function searchTags(e) {
    let tagsNames = [];
    
    tagsHolder.innerHTML = '';
    colorsJSON.forEach(function (el) {
        for (let i = 0; i < el.tags.length; i++) {
            if (el.tags[i].indexOf(e.target.value) != -1 && tagsNames.indexOf(el.tags[i]) === -1) {            
                renderTag(el.tags[i]);
                tagsNames.push(el.tags[i]);
            }
        }
    });
}

function saveOptions() {
    if (colorFormatCheckbox.checked) {
        options.colorFormat = 'rgb';
        localStorage.colorFormat = 'rgb';
    } else {
        options.colorFormat = 'hex';
        localStorage.colorFormat = 'hex';
    }

    if (gradientFormatCheckbox.checked) {
        options.gradientFormat = 'css';
        localStorage.gradientFormat = 'css';
    } else {
        options.gradientFormat = 'svg';
        localStorage.gradientFormat = 'svg';
    }
}

function loadOptions() {
    options.colorFormat = localStorage.colorFormat;
    options.gradientFormat = localStorage.gradientFormat;

    if (options.colorFormat === 'rgb') {
        colorFormatCheckbox.checked = true;
    }
    if (options.gradientFormat === 'css') {
        gradientFormatCheckbox.checked = true;
    }
}

function copyToClipBoard(e) {
    if (!e.target.classList.contains('color__gradient')) {
        if (options.colorFormat === 'hex') {
            clipboard.writeText(convertToHEX(e.target.style.background));
        } else {
            clipboard.writeText(convertToRGB(e.target.style.background));
        }
    } else {
        if (options.gradientFormat === 'svg') {
            clipboard.writeText(convertToSVG(e.target.style.background));
        } else {
            clipboard.writeText(convertToCSS(e.target.style.background));
        }
    }
    
}

function convertToHEX(color) {
    if (color.indexOf('rgb') === -1) {
        return color;
    }

    rgb = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    function hex(x) {
        return ("0" + parseInt(x).toString(16)).slice(-2);
    }
    return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
}

function convertToRGB(color) {
    if (color.indexOf('#') === -1) {
        return color;
    }

    let rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(rgb[1], 16),
        g: parseInt(rgb[2], 16),
        b: parseInt(rgb[3], 16)
    } : null;
}

function convertToSVG(color) {
    //linear-gradient(rgb(30, 87, 153) 0%, rgb(125, 185, 232) 100%)
    let colors = color.match(/(rgba?\(.+?\))|(#w{3,6}})/g),
        colorsString = '',
        gradientDirection = '';
    
    
    if (colors) {
        for (let i = 0; i < colors.length; i++) {
            colorsString += '<stop stop-color="' + colors[i] + '" offset="'+ (i === 0 ? 0 : i * (100/i)) + '%"></stop>';
        }

        if (color.indexOf('to left') !== -1) {
            gradientDirection = 'x1="0%" y1="0%" x2="100%" y2="0%"';
        } else if (color.indexOf('to right') !== -1) {
            gradientDirection = 'x1="100%" y1="0%" x2="0%" y2="0%"';
        } else if (color.indexOf('to top') !== -1) {
            gradientDirection = 'x1="0%" y1="100%" x2="0%" y2="0%"';
        } else {
            gradientDirection = 'x1="0%" y1="0%" x2="0%" y2="100%"';
        }

        let svg = '<svg width="131px" height="122px" viewBox="229 164 131 122" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><linearGradient ' + gradientDirection + ' id="linearGradient-1">' + colorsString + '</linearGradient></defs><rect id="Rectangle" stroke="none" fill="url(#linearGradient-1)" fill-rule="evenodd" x="229" y="164" width="131" height="122"></rect></svg>';

        return svg;
    }
    
}

function convertToCSS(color) {
    
}

function changeTheme() {
    if (localStorage.theme === 'dark') {
        localStorage.theme = 'white';
    } else {
        localStorage.theme = 'dark';
    }
    setTheme();
}

function setTheme() {
    if (localStorage.theme === 'dark') {
        document.body.classList.add('dark');
    } else {
        document.body.classList.remove('dark');
    }
}

init();
/*
<svg width="131px" height="122px" viewBox="229 164 131 122" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- Generator: Sketch 42 (36781) - http://www.bohemiancoding.com/sketch -->
    <desc>Created with Sketch.</desc>
    <defs>
        <linearGradient x1="50%" y1="0%" x2="50%" y2="100%" id="linearGradient-1">
            <stop stop-color="#FFFFFF" offset="0%"></stop>
            <stop stop-color="#000000" offset="100%"></stop>
        </linearGradient>
    </defs>
    <rect id="Rectangle" stroke="none" fill="url(#linearGradient-1)" fill-rule="evenodd" x="229" y="164" width="131" height="122"></rect>
</svg>
*/