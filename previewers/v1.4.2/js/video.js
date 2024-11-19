$(document).ready(function() {
    startPreview(false);
});

function translateBaseHtmlPage() {
    var videoPreviewText = $.i18n( "videoPreviewText" );
    $( '.videoPreviewText' ).text( videoPreviewText );
}

function writeContent(fileUrl, file, title, authors) {
    addStandardPreviewHeader(file, title, authors);

    const queryParams = new URLSearchParams(window.location.search.substring(1));
    const id = queryParams.get("datasetid");
    const siteUrl = queryParams.get("siteUrl");
    const versionUrl = `${siteUrl}/api/datasets/${id}/versions/`
        + queryParams.get("datasetversion");
    const videoId =queryParams.get("fileid") * 1; // converted to number
    const userLanguages = [...navigator.languages];
    const locale = queryParams.get("locale");
    if (!userLanguages.includes(locale)) {
        userLanguages.unshift(locale); // add as first element
    }

    $.ajax({
        type: 'GET',
        dataType: 'json',
        crosssite: true,
        url: versionUrl,
        success: function(data, status) {
            appendVideoElements(fileUrl, videoId, data.data.files, siteUrl, userLanguages);
        },
        error: function(request, status, error) {
            reportFailure(
                "Unable to retrieve file.",
                status);
        }
    });
}

function appendVideoElements(fileUrl, videoId, files, siteUrl, userLanguages) {

    const baseName = files
        .filter(item => item.dataFile.id === videoId)[0]
        .label.replace(/\.[a-z0-9]+$/i,'');
    const regex = new RegExp(`${baseName}(\\.([-a-z]+))?\\.vtt$`, 'i')

    const subtitles = files
        .filter(item => regex.test(item.label))
        .reduce((map, item) => {
            const lang = item.label.match(regex)[2];
            const url = `${siteUrl}/api/access/datafile/${item.dataFile.id}?gbrecs=true&amp;key=93423e09-848c-47cb-a979-219dafcfa4da`;
            map.set(url, lang);
            return map;
    }, new Map());

    const trackLanguages = [...subtitles.values()]
        .filter(value => value !== undefined)
        .sort((a, b) => {
            if (a.includes(b)) return -1;
            if (b.includes(a)) return 1;
            return a.localeCompare(b);
        });
    const firstMatch = userLanguages.find(lang => trackLanguages.includes(lang) || trackLanguages.includes(lang.replace(/-.*/, '')));

    const videoElement = $("<video/>")
        .prop("controls", true)
        .append($('<source/>').attr("src", fileUrl));

    subtitles.forEach((trackLang, url) => {
        const trackElement = $('<track/>')
            .attr("kind", "subtitles")
            .attr("src", url);
        if (trackLang) {
            trackElement
                .attr("label", trackLang)
                .attr("srclang", trackLang);
        }
        if (firstMatch.includes(trackLang)) {
            trackElement.attr("default", true);
        }
        videoElement.append(trackElement);
    });

    $(".preview").append(videoElement);
}
