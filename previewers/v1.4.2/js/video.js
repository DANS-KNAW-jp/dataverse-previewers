$(document).ready(function() {
    startPreview(false);
});

function translateBaseHtmlPage() {
    var videoPreviewText = $.i18n( "videoPreviewText" );
    $( '.videoPreviewText' ).text( videoPreviewText );
}

function writeContent(fileUrl, file, title, authors) {
    addStandardPreviewHeader(file, title, authors);
    const subtitles = new Map([
        ["de", "https://raw.githubusercontent.com/DANS-KNAW-jp/html5-video-webvtt-example/refs/heads/master/MIB2-subtitles-de-BR.vtt"],
        ["pt", "https://raw.githubusercontent.com/DANS-KNAW-jp/html5-video-webvtt-example/refs/heads/master/MIB2-subtitles-pt-BR.vtt"],
    ]);

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
