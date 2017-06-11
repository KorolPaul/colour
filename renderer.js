const ipc = require('electron').ipcRenderer,
      fs = require('fs');

const explorerTrigger = document.getElementById('explorer-trigger'),
      addPopupTrigger = document.getElementById('add-popup-trigger'),
      modeTrigger = document.getElementById('mode-trigger'),
      menuTrigger = document.getElementById('menu-trigger'),
      menuPopup = document.getElementById('menu-popup'),
      addPopup = document.getElementById('add-popup'),
      addColorTrigger = document.getElementById('add-color'),
      colorsHolder = document.getElementById('colors-holder'),
      tagsHolder = document.getElementById('tags-holder'),
      triggersHolder = document.getElementById('triggers-holder'),
      colorInput = document.getElementById('color-code'),
      contextMenu = document.getElementById('context'),
      tagInput = document.getElementById('tag-input'),
      tagsList = document.getElementById('tags-list');

let colorsJSON = [],
    selectedColor = 0;

function init() {
    menuTrigger.addEventListener('click', function () {
        menuPopup.classList.toggle('popup__visible');
    });

    addPopupTrigger.addEventListener('click', function () {
        addPopup.classList.toggle('popup__visible');
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

    loadColors();
}



function renderColor(colorCode) {
    let el = document.createElement('div');
    el.classList.add('color');
    el.style.background = colorCode;
    el.addEventListener('contextmenu', showContextMenu);

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
    let children = el.parentNode.childNodes;
    
    for (let i = 0; i < children.length; i++) {
        if (children[i] === el) {
            return i;
        }
    }

    return -1;
}

init();
