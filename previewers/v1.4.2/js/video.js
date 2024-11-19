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
    const videoId =queryParams.get("fileid") * 1; // convert to number

    $.ajax({
        type: 'GET',
        dataType: 'json',
        crosssite: true,
        url: versionUrl,
        success: function(data, status) {
            appendVideoElements(fileUrl, videoId, data.data.files, siteUrl);
        },
        error: function(request, status, error) {
            reportFailure(
                "Unable to retrieve file.",
                status);
        }
    });
}

function appendVideoElements(fileUrl, videoId, files, siteUrl) {

    const baseName = files
        .filter(item => item.dataFile.id === videoId)[0]
        .label.replace(/\.[a-z0-9]+$/i,'');
    const regex = new RegExp(`${baseName}(\\.[a-z]+)?\\.vtt$`, 'i')

    const subtitles = files
        .filter(item => regex.test(item.label))
        .reduce((map, item) => {
            const lang = item.label.match(regex)[1];
            const url = `${siteUrl}/api/access/datafile/${item.dataFile.id}?gbrecs=true&amp;key=93423e09-848c-47cb-a979-219dafcfa4da`;
            map.set(url, lang);
            return map;
    }, new Map());

    const videoElement = $("<video/>").prop("controls", true)
        .append($('<source/>').attr("src", fileUrl));

    let isFirst = true;
    subtitles.forEach((lang, url) => {
        const trackElement = $('<track/>')
            .attr("kind", "subtitles")
            .attr("src", url);
        if (lang) {
            trackElement
                .attr("label", lang)
                .attr("srclang", lang);
        }
        if (isFirst) {
            trackElement.attr("default", true);
            isFirst = false;
        }
        videoElement.append(trackElement);
    });

    $(".preview").append(videoElement);
}
