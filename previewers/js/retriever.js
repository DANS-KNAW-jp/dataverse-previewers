var queryParams = null;
var datasetUrl = null;
var version = null;
var fileDownloadUrl = null;
var previewMode = false;

function startPreview(retrieveFile) {
	// Retrieve tool launch parameters from URL
        var i18n = $.i18n();
	i18n.locale="en";
	queryParams = new URLSearchParams(window.location.search.substring(1));
	var fileUrl = queryParams.get("siteUrl") + "/api/access/datafile/"
			+ queryParams.get("fileid") + "?gbrecs=true";
	fileDownloadUrl = queryParams.get("siteUrl") + "/api/access/datafile/"
			+ queryParams.get("fileid") + "?gbrecs=false";
	var versionUrl = queryParams.get("siteUrl") + "/api/datasets/"
			+ queryParams.get("datasetid") + "/versions/"
			+ queryParams.get("datasetversion");
	var apiKey = queryParams.get("key");
	// Hide header and citation to embed on Dataverse file landing page.
	previewMode = queryParams.get("preview");
	if (apiKey != null) {
		fileUrl = fileUrl + "&key=" + apiKey;
		versionUrl = versionUrl + "?key=" + apiKey;
	}
	// Get metadata for dataset/version/file
	$
			.ajax({
				dataType : "json",
				url : versionUrl,
				// headers: { 'X-Dataverse-key': apiKey },
				crossite : true,
				success : function(json, status) {
					var mdFields = json.data.metadataBlocks.citation.fields;

					var title = "";
					var authors = "";
					datasetUrl = json.data.storageIdentifier;
					datasetUrl = datasetUrl
							.substring(datasetUrl.indexOf("//") + 2);
					version = queryParams.get("datasetversion");
					if (version === ":draft") {
						version = "DRAFT";
					}

					for ( var field in mdFields) {
						if (mdFields[field].typeName === "title") {
							title = mdFields[field].value;
						}
						if (mdFields[field].typeName === "author") {
							var authorFields = mdFields[field].value;
							for ( var author in authorFields) {
								if (authors.length > 0) {
									authors = authors + "; ";
								}
								authors = authors
										+ authorFields[author].authorName.value;
							}
						}
					}
					var datafiles = json.data.files;
					var fileIndex = 0;
					for ( var entry in datafiles) {
						if (JSON.stringify(datafiles[entry].dataFile.id) === queryParams
								.get("fileid")) {
							fileIndex = entry;
							if (retrieveFile) {
								$.ajax({
									type : 'GET',
									dataType : 'text',
									// headers: { 'X-Dataverse-key': apiKey},
									crosssite : true,
									url : fileUrl,
									success : function(data, status) {
										writeContentAndData(data, fileUrl,
												datafiles[fileIndex].dataFile,
												title, authors);
									},
									error : function(request, status, error) {
										reportFailure(
												"Unable to retrieve file.",
												status);
									}
								});

							} else {
								writeContent(fileUrl,
										datafiles[entry].dataFile, title,
										authors);
							}
						}
					}
				},
				error : function(jqXHR, textStatus, errorThrown) {
					reportFailure("Unable to retrieve metadata.", textStatus);

				}
			});
}

var filePageUrl = null;
function addStandardPreviewHeader(file, title, authors) {
	// Add favicon from source Dataverse
	$('head')
			.append(
					$('<link/>')
							.attr('type', 'image/png')
							.attr('rel', 'icon')
							.attr(
									'href',
									queryParams.get("siteUrl")
											+ '/javax.faces.resource/images/favicondataverse.png.xhtml'));
	// Add logo from source Dataverse or use a local one
	$('#logo')
			.attr('src', queryParams.get("siteUrl") + '/logos/preview_logo.png')
			.attr(
					'onerror',
					'this.onerror=null;this.src="/dataverse-previewers/previewers/images/logo_placeholder.png";');
	//Footer
    $('body').append($('<div/>').html("Previewers originally developed by <a href='https://qdr.syr.edu'>QDR</a> and maintained at <a href='https://github.com/QualitativeDataRepository/dataverse-previewers'>https://github.com/QualitativeDataRepository/dataverse-previewers</a>. Feedback and contributions welcome.").attr('id','footer'));
    var i18n = $.i18n();
    var filenameText = $.i18n( "filenameText" );
    var inText = $.i18n( "inText" );
    var byText = $.i18n( "byText" );
    var downloadFileText = $.i18n( "downloadFileText" );
    var closePreviewText = $.i18n( "closePreviewText" );
    var versionText = $.i18n( "versionText" );
    var descriptionText = $.i18n( "descriptionText" );
	
    filePageUrl = queryParams.get("siteUrl") + "/file.xhtml?";
	if (file.persistentId.length == 0) {
		filePageUrl = filePageUrl + "fileId=" + file.id;
	} else {
		filePageUrl = filePageUrl + "persistentId=" + file.persistentId;
	}
	filePageUrl = filePageUrl + "&version=" + version;
	var header = $('.preview-header').append($('<div/>'));
	header.append($("<div/>").append($("<span/>").attr('class', "filenameText").text(filenameText)).append(
			$('<a/>').attr('href', filePageUrl).text(file.filename)).attr('id',
			'filename'));
	if ((file.description != null) && (file.description.length > 0)) {
		header.append($('<div/>').html("<span class=\"descriptionText\">" + descriptionText + "</span>" + file.description));
	}
	header.append($('<div/>').append($("<span/>").attr('class', "inText").text(inText)).append(
			$('<span/>').attr('id', 'dataset').append(
					$('<a/>').attr(
							'href',
							queryParams.get("siteUrl")
									+ "/dataset.xhtml?persistentId=doi:"
									+ datasetUrl + "&version=" + version).text(
							title))).append(
			$('<span/>').html(" (<span class=\"versionText\">" + versionText + "</span> " + version + ")").attr('id', 'version')).append(
			$('<span/>').text(byText).attr('class', 'byText')).append(
			$('<span/>').text(authors).attr('id', 'authors')));
	header.append($("<div/>").addClass("btn btn-default").html(
			"<a class='downloadFileText' href='" + fileDownloadUrl + "'>" + downloadFileText + "</a>"));
	header.append($("<div/>").addClass("btn btn-default").html(
			"<a class=\"closePreviewText\" href=\"javascript:window.close();\">" + closePreviewText + "</a>"));
	if(file.creationDate != null) {
		header.append($("<div/>").addClass("preview-note").text(
			"File uploaded on " + file.creationDate));
	}
	if (previewMode === 'true') {
		$('#logo').hide();
		$('.page-title').hide();
		$('.preview-header').hide();
	}
}

function reportFailure(msg, statusCode) {
	var preview = $(".preview");
	preview.addClass("alert alert-danger");
	preview
			.text(msg
					+ " If problem persists (has your login timed out?), report error code: "
					+ statusCode + " to the repository administrator.");
}
