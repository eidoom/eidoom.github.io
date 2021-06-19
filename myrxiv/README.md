# [myrxiv](https://gitlab.com/eidoom/myrxiv)

The static web app is live [here](https://eidoom.gitlab.io/myrxiv/).

[Companion post](https://computing-blog.netlify.app/post/myrxiv/).

## Story

arXiv provides the [`myarticles` JavaScript widget](https://arxiv.org/help/myarticles) to show articles associated with an [arXiv author identification](https://arxiv.org/help/author_identifiers) on other websites.
However, it uses [JSONP](https://en.wikipedia.org/wiki/JSONP) at `https://arxiv.org/a/yourauthorid.js` to provide the data, which is not secure.
Basically, a `js` file is constructed that calls a function which has as its argument the data in `json` format.
The function is defined on our end by including the script `https://arxiv.org/js/myarticles.js`.
I don't wish to run arbitrary `js` from another server, though.

The pure `json` is available at `https://arxiv.org/a/yourauthorid.json`, and similarly for `atom` at `https://arxiv.org/a/yourauthorid.atom2`, but their servers are [not configured to allow access](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS/Errors/CORSMissingAllowOrigin) to these files from other websites.
The problem is that both the client and server in the request, where the machines are on different domains, must be set up with the appropriate [Cross-Origin Resource Sharing](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) [(CORS)](https://en.wikipedia.org/wiki/Cross-origin_resource_sharing) policy.
(A deprecated way to get around this was JSONP; the modern way is setting CORS headers.)

I've filed a bug report about this with arXiv and they've contacted me to say they'll fix it.
In the meantime, I'll instead use the [arXiv API](https://arxiv.org/help/api) to get my list.

As described in the [API documentation](https://arxiv.org/help/api/user-manual), [queries](https://arxiv.org/help/api/user-manual#query_details) can be made to the arXiv database.
An advantage of the API over the widget is that we can query multiple authors simultaneously.
Sadly, the `Moodie, R` author notation which is so handy in the arXiv web interface doesn't seem to work with the API.
I set up this project so that full names are set in [`index.html`](./index.html) and some [`js` code](./myrxiv.js) generates possible incarnations of the name to be searched: `Ryan Iain Moodie => [Ryan I. Moodie, R. I. Moodie, Ryan Moodie, R. Moodie`.
It currently only supports Latin characters and names of length two or three.

I [used](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) to handle the query request.
The query [returns](https://developer.mozilla.org/en-US/docs/Web/API/Response#body_interface_methods) in the [`atom` format](https://en.wikipedia.org/wiki/Atom_%28Web_standard%29), which I [resolved as text](https://developer.mozilla.org/en-US/docs/Web/API/Body/text).
Then I [parsed](https://developer.mozilla.org/en-US/docs/Web/API/DOMParser#domxrefdomparser.parsefromstring_1) this to [XML](https://en.wikipedia.org/wiki/XML).
In this format, it was then a simple matter of extracting the [fields](https://arxiv.org/help/api/user-manual#_details_of_atom_results_returned) I wanted [by their tag names](https://developer.mozilla.org/en-US/docs/Web/API/Element/getElementsByTagName) and injecting the values into some `html` to generate a simple feed display. 
I used the [performant](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleDateString#performance) [`Intl.DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat) to format [dates and times](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Date).

The [styling](./style.css) is inspired by the `myarticles` arXiv widget.

## Usage

All variables in the `<script>` in [`index.html`](./index.html) must be defined.
If you don't wish to filter your query to the arXiv by either `categories` or `authors`, set that variable to the empty list `[]`.
