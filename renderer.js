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
      triggersHolder = document.getElementById('triggers-holder'),
      colorInput = document.getElementById('color-code');

let colorsJSON = [];

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

    ipc.on('selected-directory', function (event, path) {
        document.getElementById('selected-file').innerHTML = `You selected: ${path}`
    })

    loadColors();
}



function renderColor(colorCode) {
    let el = document.createElement('div');
    el.classList.add('color');
    el.style.background = colorCode;
    
    colorsHolder.appendChild(el);
}

function renderTag(color) {
    let el = document.createElement('div');
    el.classList.add('tag');
    el.style.background = color.color;
    
    tagsHolder.appendChild(el);
}

function saveColor(colorCode) {
    let colorObj = {
        color: colorCode,
        tags: 'test'
    }

    colorsJSON.push(colorObj);
    
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
            renderTag(el);
        });
        
    });
}

init();
