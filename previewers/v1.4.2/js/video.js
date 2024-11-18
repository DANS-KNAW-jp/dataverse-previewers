$(document).ready(function() {
    startPreview(false);
});

function translateBaseHtmlPage() {
    var videoPreviewText = $.i18n( "videoPreviewText" );
    $( '.videoPreviewText' ).text( videoPreviewText );
}

function writeContent(fileUrl, file, title, authors) {

    queryParams = new URLSearchParams(window.location.search.substring(1));
    var versionUrl = queryParams.get("siteUrl") + "/api/datasets/"
        + queryParams.get("datasetid") + "/versions/"
        + queryParams.get("datasetversion");

    $.ajax({
        type: 'GET',
        dataType: 'json',
        crosssite: true,
        url: versionUrl,
        success: function(data, status) {
            writeContentAndFiles(fileUrl, file, title, authors, data.data.files, queryParams.get("siteUrl"));
        },
        error: function(request, status, error) {
            reportFailure(
                "Unable to retrieve file.",
                status);
        }
    });
}

function writeContentAndFiles(fileUrl, file, title, authors, files, siteUrl) {
    addStandardPreviewHeader(file, title, authors);

    const regex = /\.([a-z]+)\.vtt$/i
    const subtitles = files
        .filter(item => regex.test(item.label))
        .reduce((map, item) => {
            const lang = item.label.match(regex)[1];
            map.set(lang, `${siteUrl}/api/access/datafile/${item.dataFile.id}?gbrecs=true&amp;key=93423e09-848c-47cb-a979-219dafcfa4da`);
            return map;
    }, new Map());

    const videoElement = $("<video/>").prop("controls", true)
        .append($('<source/>').attr("src", fileUrl));

    let isFirst = true;
    subtitles.forEach((url, lang) => {
        const trackElement = $('<track/>').attr("label", lang)
                                          .attr("kind", "subtitles")
                                          .attr("srclang", lang)
                                          .attr("src", url);
        if (isFirst) {
            trackElement.attr("default", true);
            isFirst = false;
        }
        videoElement.append(trackElement);
    });

    $(".preview").append(videoElement);
}
