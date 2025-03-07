/**
 *
 * Main App Component
 *
 */
"use strict";
/* global app, mediaSettings, Dropzone, trans, launchToast */

// Disable dropzone uploader auto loading globally as we will instantiate it manually
Dropzone.autoDiscover = false;

var FileUpload = {

    attachaments: [],
    myDropzone : null,
    isLoading: false,
    isTranscodingVideo: false,
    state: {},

    /**
     * Instantiates the media uploader plugin
     * @param selector
     * @param url
     */
    initDropZone:function (selector,url, isChunkUpload = false) {

        // Prepping chunk uploads, if enabled by admin
        let chunkSize = 1024;
        if(isChunkUpload){
            chunkSize = mediaSettings.upload_chunk_size * 1000000;
            url = url.replace('/upload/','/uploadChunked/');
        }

        FileUpload.myDropzone = new Dropzone(selector, {
            paramName: "file", // The name that will be used to transfer the file
            previewTemplate: document.querySelector('#tpl').innerHTML,
            url: app.baseUrl + url,
            headers: {
                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
            },
            clickable:['.file-upload-button'],
            previewsContainer: ".dropzone-previews",
            maxFilesize: mediaSettings.max_file_upload_size, // MB
            addRemoveLinks: true,
            dictRemoveFile: "x",
            acceptedFiles: mediaSettings.allowed_file_extensions,
            chunking: isChunkUpload,
            forceChunking: isChunkUpload,
            chunkSize: chunkSize,
            parallelChunkUploads: false,
            retryChunks: false,
            retryChunksLimit: 2,
            init: function() {
                // FileUpload.attachaments
                FileUpload.attachaments.map((element)=>{
                    var mockFile = { name: element.attachmentID, upload:{attachmentID:element.attachmentID} , type:element.type, thumbnail: element.thumbnail};
                    this.emit("addedfile", mockFile);
                    this.emit("thumbnail", mockFile, element.thumbnail);
                    this.emit("complete", mockFile);
                    FileUpload.updatePreviewElement(mockFile, false, element);
                });
                var _this = this;
                $(".draft-clear-button").on("click", function() {
                    _this.removeAllFiles(true);
                });
            },
            dictInvalidFileType: trans("You can't upload files of this type."),
        });

        FileUpload.myDropzone.on("addedfile", file => {
            FileUpload.updatePreviewElement(file, true);
            FileUpload.isLoading = true;
        });

        FileUpload.myDropzone.on("success", (file, response) => {
            if(response.coconut_id !== null){
                FileUpload.isTranscodingVideo = true;
            }
            if(response.success){
                file.upload.attachmentID = response.attachmentID;
                FileUpload.attachaments.push({attachmentID: response.attachmentID, path: response.path, type:response.type, thumbnail:response.thumbnail});
                // If received file is a converted video
                switch (file.type) {
                case 'video/mp4':
                case 'video/avi':
                case 'video/quicktime':
                case 'video/x-m4v':
                case 'video/mpeg':
                case 'video/wmw':
                case 'video/x-matroska':
                case 'video/x-ms-asf':
                case 'video/x-ms-wmv':
                case 'video/x-ms-wmx':
                case 'video/x-ms-wvx':
                case 'video':
                    FileUpload.updatePreviewElement(file, false, response);
                    break;
                }
            }
            FileUpload.isLoading = false;
        });

        FileUpload.myDropzone.on("removedfile", function(file) {
            FileUpload.attachaments = FileUpload.attachaments.filter((attachment)=>{
                if(attachment.attachmentID !== file.upload.attachmentID){
                    return attachment;
                }
                else{
                    FileUpload.removeAttachment(attachment);
                }
            });
        });

        FileUpload.myDropzone.on("error", (file, errorMessage) => {
            if(typeof errorMessage.errors !== 'undefined'){
                launchToast('danger',trans('Error'),errorMessage.message);
                // launchToast('danger',trans('Error'),errorMessage.errors.file)
                // $.each(errorMessage.errors,function (field,error) {
                //     launchToast('danger',trans('Error'),error);
                // });
            }
            else{
                if(typeof errorMessage.message !== 'undefined'){
                    launchToast('danger',trans('Error'),errorMessage.message);
                }
                else{
                    launchToast('danger',trans('Error'),errorMessage);
                }
            }
            FileUpload.myDropzone.removeFile(file);
            FileUpload.isLoading = false;
        });
    },

    /**
     * Updates the preview template based on uploaded file
     * @param file
     * @param localFile
     * @param attachment
     */
    updatePreviewElement:function (file,localFile, attachment = false) {
        let filePreview = $(file.previewElement);
        filePreview.find('.dz-image').remove();
        switch (file.type) {
        case 'video/mp4':
        case 'video/avi':
        case 'video/quicktime':
        case 'video/x-m4v':
        case 'video/mpeg':
        case 'video/wmw':
        case 'video/x-matroska':
        case 'video/x-ms-asf':
        case 'video/x-ms-wmv':
        case 'video/x-ms-wmx':
        case 'video/x-ms-wvx':
        case 'video':
            filePreview.find('.video-preview-item').remove();
            filePreview.prepend(videoPreview());
            var videoPreviewEl = filePreview.find('video').get(0);
            if(localFile){
                FileUpload.setMediaSourceForPreviewByElementAndFile(videoPreviewEl, file);
            }
            else{
                FileUpload.setPreviewSource(videoPreviewEl, file, attachment);
            }
            break;
        case 'audio/mpeg':
        case 'audio/ogg':
        case 'audio':
            filePreview.prepend(audioPreview());
            filePreview.addClass("w-100");
            filePreview.find('audio').addClass("w-100");
            filePreview.find(".audio-preview-item").addClass("w-100");
            var audioPreviewEl = filePreview.find('audio').get(0);
            filePreview.addClass("w-100");
            if(localFile){
                FileUpload.setMediaSourceForPreviewByElementAndFile(audioPreviewEl, file);
            }
            else{
                FileUpload.setPreviewSource(audioPreviewEl, file, attachment);
            }
            break;
        case 'application/vnd.ms-excel':
        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
            filePreview.prepend(excelPreview());
            break;
        case 'application/pdf':
            filePreview.prepend(pdfPreview());
            break;
        default:
            filePreview.prepend(imagePreview());
            if(!localFile){
                let previewElement = filePreview.find('img').get(0);
                FileUpload.setPreviewSource(previewElement, file, attachment);
            }
            break;
        }
    },

    /**
     * Sets up the media src for the uploaded file type
     * @param element
     * @param file
     * @returns {boolean}
     */
    setMediaSourceForPreviewByElementAndFile: function (element, file) {
        if(typeof element === 'undefined'){ return false;}
        if (element.canPlayType(file.type).length && element.canPlayType(file.type) !== "no") {
            const fileURL = window.URL.createObjectURL(file);
            $(element).on('loadeddata', function () {
                window.URL.revokeObjectURL(fileURL);
            });
            $(element).attr('src', fileURL);
            $(element).attr('type',file.type);
        }
        else{
            $(element).attr('src', app.baseUrl+'/img/video-loading-spinner.mp4');
            $(element).attr('loop', true);
        }
    },

    /**
     * Sets media source | Thumbnail
     * @param element
     * @param file
     * @param attachment
     */
    setPreviewSource: function (element, file, attachment) {
        if(attachment.coconut_id !== null && attachment.path.indexOf('videos/tmp/') >= 0){
            // TODO: Use some different video loop for the transcoding pahse
            $(element).attr('src', app.baseUrl+'/img/video-loading-spinner.mp4');
        }
        else{
            let fileSrc = attachment.path;
            if(attachment.type === 'image'){
                fileSrc = typeof attachment.thumbnail !== 'undefined' ? attachment.thumbnail : attachment.path;
            }
            $(element).attr('src', fileSrc);

        }
    },

    /**
     * Removes an attached file
     * @param attachmentID
     */
    removeAttachment: function (attachmentID) {
        $.ajax({
            type: 'POST',
            data: {
                'attachmentId': attachmentID,
            },
            url: app.baseUrl+'/attachment/remove',
            success: function () {
                launchToast('success',trans('Success'), trans('Attachment removed.'));
            },
            error: function () {
                launchToast('danger',trans('Error'), trans('Failed to remove the attachment.'));
            }
        });
    },

};

/**
 * Video preview Component
 * @returns {string}
 */
function videoPreview() {
    return `<div class="video-preview-item shadow">
                <span data-dz-name></span>
                <span data-dz-size></span>
            <video class="video-preview" controls autoplay muted loop></video>
        </div>`;
}

/**
 * Image preview Component
 * @returns {string}
 */
function imagePreview() {
    return `<div class="dz-image shadow">
            <img data-dz-thumbnail/>
        </div>
        <div class="dz-details">
            <div class="dz-filename"><span data-dz-name></span></div>
            <div class="dz-size" data-dz-size></div>
        </div>`;
}

/**
 * Audio preview Component
 * @returns {string}
 */
function audioPreview() {
    return `<div class="audio-preview-item">
                    <span data-dz-name></span>
                    <span data-dz-size></span>
                <audio id="audio-preview" controls type="audio/mpeg" autoplay muted></audio>
        </div>`;
}

/**
 * Pdf document preview Component
 * @returns {string}
 */
function pdfPreview() {
    return `<div class="pdf-preview-item">
                    <div class="dz-image shadow p-4">
                        <img data-dz-thumbnail src="${mediaSettings.manual_payments_pdf_icon}"/>
                    </div>
                    <span data-dz-name></span>
                    <span data-dz-size></span>
        </div>`;
}

/**
 * Excel document preview Component
 * @returns {string}
 */
function excelPreview() {
    return `<div class="xls-preview-item">
                    <div class="dz-image shadow p-4">
                        <img data-dz-thumbnail src="${mediaSettings.manual_payments_excel_icon}"/>
                    </div>
                    <span data-dz-name></span>
                    <span data-dz-size></span>
        </div>`;
}
