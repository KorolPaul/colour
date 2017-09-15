const ipc = require('electron').ipcRenderer,
      clipboard = require('electron').clipboard,
      fs = require('fs'),
      { dialog } = require('electron').remote;

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

    addPopupTrigger.addEventListener('click', function (e) {
        hidePopups();
        addPopup.classList.toggle('popup__visible');
    });

    settingsPopupTrigger.addEventListener('click', function (e) {
        hidePopups();
        settingsPopup.classList.toggle('popup__visible');
    });

    addColorTrigger.addEventListener('click', function () {
        renderColor(colorInput.value);
        saveColor(colorInput.value);

        hidePopups();
        addPopup.classList.toggle('popup__visible');    
    });

    modeTrigger.addEventListener('click', function () {
        modeTrigger.classList.toggle('menu_icon__colors');
        document.querySelectorAll('.mode-section').forEach(function (el) {
            el.classList.toggle('visible');
        });
    });

    explorerTrigger.addEventListener('click', function (event) {
        let file = dialog.showOpenDialog({ properties: ['openFile'] })[0];

        fs.readFile(file, 'utf-8', (err, data) => {
            if (err) {
                alert('File format isn\'t right');
                console.log("An error ocurred reading the file :" + err.message);
                return;
            }
            colorsHolder.innerHTML = '';
            tagsHolder.innerHTML = '';

            fs.writeFile('colors.json', data, (err) => {
                if (err) {
                    console.log("An error ocurred creating the file " + err.message);
                }
            });
    
            loadColors();
        });

    })

    document.body.addEventListener('click', hideContextMenu);
    document.body.addEventListener('click', hidePopups);    
    document.querySelectorAll('.popup').forEach((el) => {
        el.addEventListener('click', (e) => {
            e.stopImmediatePropagation();
        })
    });


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
    el.classList.add('loading');
    el.addEventListener('contextmenu', showContextMenu);
    el.addEventListener('click', copyToClipBoard);

    if (colorCode.indexOf('svg') != -1) {
        el.style.background = convertToCSS(colorCode);
    } else {
        el.style.background = colorCode;
    }

    if (colorCode.indexOf('gradient') != -1 || colorCode.indexOf('stop-color') != -1) {
        el.classList.add('color__gradient');
    }

    colorsHolder.appendChild(el);

    setTimeout(() => {
        el.classList.remove('loading');
    }, 200);
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
        
        try {
            colorsJSON = JSON.parse(data);
           
            colorsJSON.forEach(function (el, i) {
                setTimeout(function() {
                    renderColor(el.color);
                }, i * 15);
            });

            loadTags();
        } catch (err) {
            console.log(err);
        }
        
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

    let contextWidth = contextMenu.getBoundingClientRect().width,
        contextHeight = contextMenu.getBoundingClientRect().height,
        pageHeight = Math.max(document.body.scrollHeight, document.body.offsetHeight, document.documentElement.clientHeight,
                        document.documentElement.scrollHeight, document.documentElement.offsetHeight),
        offcet = 15;
    
    if (e.target.offsetLeft + e.target.offsetWidth + contextWidth < window.innerWidth - offcet) {
        contextMenu.style.left = e.target.offsetLeft + e.target.offsetWidth - offcet + 'px';
    } else {
        contextMenu.style.left = window.innerWidth - contextWidth - offcet + 'px';        
    }

    if (e.target.offsetTop + e.target.offsetHeight + contextHeight < pageHeight - offcet) {
        contextMenu.style.top = e.target.offsetTop + e.target.offsetHeight - offcet + 'px';
    } else {
        contextMenu.style.top = pageHeight - contextHeight - offcet + 'px';        
    }

    
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
    colorsJSON.forEach(function (el, i) {    
        if (el.color.indexOf(e.target.value) != -1) {
            setTimeout(function() {
                renderColor(el.color);
            }, i * 15);
        }
        
        if (el.color.indexOf('svg') === -1 && el.color.indexOf('gradient') === -1) {
            let rgbString = convertToRGB(el.color),
                rgb = rgbString.substring(rgbString.indexOf('(') + 1, rgbString.indexOf(')')).split(',');

            let HSL = convertToHSL(+rgb[0], +rgb[1], +rgb[2])[0],
                hue, color;

            if (HSL <= 19 || HSL > 340) {
                color = 'red';
            } else if (HSL > 19 && HSL <= 45) {
                color = 'orange';
            } else if (HSL > 45 && HSL <= 68) {
                color = 'yellow';
            } else if (HSL > 68 && HSL <= 160) {
                color = 'green';
            } else if (HSL > 160 && HSL <= 260) {
                color = 'purple';
            } else if (HSL > 160 && HSL <= 260) {
                color = 'purple';
            }

            if (color === e.target.value) {
                setTimeout(function() {
                    renderColor(el.color);
                }, i * 15);
            }
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

    let rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
    
    return rgb ? 'rgb(' + parseInt(rgb[1], 16) + ',' + parseInt(rgb[2], 16) + ',' + parseInt(rgb[3], 16) + ')' : null;
}

function convertToHSL(r, g, b) {
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if(max == min){
        h = s = 0; // achromatic
    }else{
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max){
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
  
    return [h * 360 , s, l];
}

function convertToSVG(color) {
    let colors = color.match(/(rgba?\(.+?\))|(#\w{3,6})/g),
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

        let svg = `<svg width="131px" height="122px" viewBox="229 164 131 122" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                        <defs>
                            <linearGradient ` + gradientDirection + ` id="linearGradient-1">` + colorsString + `</linearGradient>
                        </defs>
                        <rect id="Rectangle" stroke="none" fill="url(#linearGradient-1)" fill-rule="evenodd" x="229" y="164" width="131" height="122"></rect>
                    </svg>`;

        return svg;
    } else {
        return color;
    }
    
}

function convertToCSS(color) {
    let colors = color.match(/(rgba?\(.+?\))|(#[0-9a-f]{3,6})/igm),
        colorsString = 'linear-gradient(',
        gradientDirection = '';
    

    if (colors) {
        if (color.indexOf('x1="0%" y1="0%" x2="100%" y2="0%"') !== -1) {
            gradientDirection = 'to left';
        } else if (color.indexOf('x1="100%" y1="0%" x2="0%" y2="0%"') !== -1) {
            gradientDirection = 'to right';
        } else if (color.indexOf('x1="0%" y1="100%" x2="0%" y2="0%"') !== -1) {
            gradientDirection = 'to top';
        } else {
            gradientDirection = 'to bottom';
        }

        colorsString += gradientDirection;
        for (let i = 0; i < colors.length; i++) {
            colorsString += ', ' +  colors[i] + ' ' + (i === 0 ? 0 : i * (100/i)) + '%';
        }
        colorsString += ')';

        return colorsString;
    } else {
        return color;
    }
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

function hidePopups(e) {
    try {
        if (e.target === menuTrigger || e.target.classList.contains('popup_item')) {
            return
        }
    } catch (err) {
        console.log(err)
    }
    
    document.querySelectorAll('.popup').forEach(function (el) {
        el.classList.remove('popup__visible');
    });
}

init();