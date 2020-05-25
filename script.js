const inputTitleId = 'input-title';
const inputLanguageId = 'input-language';
const formEl = document.querySelector('form');
const resultEl = document.querySelector('#result');
const inputTitleEl = document.getElementById(inputTitleId);
const inputLanguageEl = document.getElementById(inputLanguageId);
const rtlScripts = ['he', 'ar', 'fa', 'arz', 'azb', 'ur'];

//#region language functions
function setTextDirection(inputLanguageVal) {
    document.documentElement.style.direction = rtlScripts.indexOf(inputLanguageVal) > -1 ? 'rtl' : 'ltr';
}
//#endregion

//#region form and results functions
function getFormValue(inputId) {
    return formEl.elements[inputId].value;
}

function getFetchUrl(languageId, text) {
    const baseUrl = 'https://' + languageId + '.wikipedia.org/w/api.php';
    const queryString = 'action=parse&page=' + text + '&prop=sections&format=json&origin=*';
    return baseUrl + '?' + queryString;
}

function fetchResults() {
    const inputTitleVal = getFormValue(inputTitleId);
    const inputLanguageVal = getFormValue(inputLanguageId);
    resultEl.innerHTML = 'Fetching results';

    fetch(getFetchUrl(inputLanguageVal, inputTitleVal))
        .then(function (response) {
            return response.json()
        })
        .then(function (response) {
            if (!response.parse || !response.parse.sections || !response.parse.sections.length) {
                resultEl.innerText = 'No results found';
                return;
            }
            resultEl.innerText = '';

            // Get data from text
            const pageId = response.parse.pageid;
            const reformattedSections = reformatSections(response.parse.sections);

            // Create list
            const sectionGroupEl = document.createElement('ul');
            reformattedSections.forEach(function (section) {
                sectionGroupEl.appendChild(createSectionLink(section, inputLanguageVal, pageId));
            });
            resultEl.appendChild(sectionGroupEl);
        });
}

function reformatSections(sections) {
    const result = [];

    sections.forEach(function (section) {
        let targetLocation = result;

        // If the toc level is more than 1, it doesn't belong in the top level anymore
        // we need to traverse down the list and find the right children array that this item belongs to
        if (section.toclevel > 1) {
            for (let step = 1; step < section.toclevel; step++) {
                targetLocation = targetLocation[targetLocation.length - 1].children;
            }
        }

        targetLocation.push({
            anchor: section.anchor,
            line: section.line,
            number: section.number,
            children: []
        });
    });

    return result;
}

function createSectionLink(section, inputLanguageVal, pageId) {
    const sectionItemEl = document.createElement('li');
    const sectionItemLink = document.createElement('a');
    sectionItemLink.innerHTML = section.number + ' ' + section.line;
    sectionItemLink.setAttribute('href',
        'https://' + inputLanguageVal + '.wikipedia.org/?curid=' + pageId + '#' + section.anchor);
    sectionItemLink.setAttribute('target', '_blank');
    sectionItemEl.appendChild(sectionItemLink);
    if (section.children.length > 0) {
        const subsectionGroupEl = document.createElement('ul');
        section.children.forEach(function (s) {
            subsectionGroupEl.appendChild(createSectionLink(s, inputLanguageVal, pageId));
        });
        sectionItemEl.appendChild(subsectionGroupEl);
    }
    return sectionItemEl;
}
//#endregion

//#region set up
setTextDirection(inputLanguageEl.value);

inputLanguageEl.addEventListener('change', function (e) {
    setTextDirection(e.target.value);
    if (resultEl.innerHTML !== '' && getFormValue(inputTitleId) !== '') {
        fetchResults();
    }
    if (getFormValue(inputTitleId) === '') {
        resultEl.innerHTML = '';
    }
});

formEl.addEventListener('submit', function (e) {
    fetchResults();
    e.preventDefault();
})
//#endregion