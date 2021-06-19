// only supports names of length 2 or 3
const nameArranges = author => {
    let names = [author.replaceAll(' ', '+')];
    const each = author.split(' ');
    if (each.length === 3) {
        names.push(each[0] + '+' + each[1][0] + '.+' + each[2]);
        names.push(each[0][0] + '.+' + each[1][0] + '.+' + each[2]);
        names.push(each[0] + '+' + each[2]);
        names.push(each[0][0] + '.+' + each[2]);
    } else if (each.length === 2) {
        names.push(each[0][0] + '.+' + each[1]);
    }
    return names;
};

const buildQuery = (maxEntries_, authors_, categories_) => {
    let queryString = 'https://export.arxiv.org/api/query?sortBy=submittedDate&sortOrder=descending&start=0'

    queryString += `&max_results=${maxEntries_}`

    queryString += '&search_query=('

    if (authors_.length !== 0) {
        const names = authors_.flatMap(author => nameArranges(author));
        for (let i = 0; i < names.length; i++) {
            queryString += `au:"${names[i]}"${i === names.length - 1 ? '' : ' OR '}`;
        };
        if (categories_.length !== 0) {
            queryString += ') AND (';
        }
    }

    if (categories_.length !== 0) {
        for (let i = 0; i < categories_.length; i++) {
            queryString += `cat:"${categories_[i]}"${i === categories_.length - 1 ? '' : ' OR '}`;
        };
    }

    queryString += ')';

    return queryString;
}

const child = (entry, tagName) => entry.getElementsByTagName(tagName)[0].textContent;

const getDate = entry => {
    const date = new Date(child(entry, 'published'));
    return new Intl.DateTimeFormat('en-GB', {
        dateStyle: 'medium'
    }).format(date);
};

const getAuthors = entry => {
    let html = "";
    const authorList = entry.getElementsByTagName('author');
    for (let i = 0; i < authorList.length; i++) {
        html += child(authorList[i], 'name') + (i === authorList.length - 1 ? '' : ', ');
    };
    return html;
}

const getCategories = entry => {
    let html = "";
    const primary = entry.getElementsByTagName('arxiv:primary_category')[0].getAttribute('term');
    const categoryList = entry.getElementsByTagName('category');
    const num = categoryList.length

    html += '<b>' + primary + '</b>' + (1 === num ? ' ' : ', ');

    for (let i = 0; i < num; i++) {
        const term = categoryList[i].getAttribute('term');
        if (term !== primary) {
            html += term + (i === num - 1 ? '' : ', ');
        }
    };

    return html;
}

const arxivID = entry => child(entry, 'id');

const totalResults = xml => child(xml, 'opensearch:totalResults');

const time = xml => {
    const date = new Date(child(xml, 'updated'));
    return new Intl.DateTimeFormat('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(date);
};

const buildHTML = (xml, entries) => {
    let html = "";
    for (let entry of xml.getElementsByTagName('entry')) {
        const url = arxivID(entry);
        html += `
                <dl class='list-item'>
                    <dt class='list-title'>
                        <a href='${url}'>${child(entry, 'title')}</a> <span class="nobr">[ <a href='${url.replace(/abs/,'pdf')}'>pdf</a> ]</span>
                    </dt>
                    <dd class='list-body'>`
        if (showAuthors) {
            html += `<div class='list-body-field list-authors'>${getAuthors(entry)}</div>`;
        }
        if (showCategories) {
            html += `<div class='list-body-field list-subjects'>${getCategories(entry)}</div>`;
        }
        if (showDate) {
            html += `<div class='list-body-field list-date'>${getDate(entry)}</div>`;
        }
        html += `</dd>
                </dl>
                `;
    };
    const tot = totalResults(xml);
    html += `<div class='list-footer'>[ <span>Showing ${Math.min(entries, tot)} of ${tot} total entries from ${time(xml)}</span> | <span class="nobr">Powered by <a href="https://gitlab.com/eidoom/myrxiv">myrxiv</a></span> ]</div>`;
    return html;
}

const arxivQuery = buildQuery(maxEntries, authors, categories);

fetch(arxivQuery)
    .then(response => response.text())
    .then(str => {
        const parser = new DOMParser();
        const xml = parser.parseFromString(str, 'text/xml');
        const html = buildHTML(xml, maxEntries);
        document.getElementById('arxiv').innerHTML = html;
    });
