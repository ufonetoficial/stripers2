<div class="px-0">
    <div class="d-flex justify-content-center align-items-center">
        <div class="w-100">
            <div class="w-100 locked-media position-relative {{AttachmentHelper::hasBlurredPreview($post->attachments[0]) ? '' : 'bg-contain svg-locked-post'}}" style="background-image: url('{{AttachmentHelper::hasBlurredPreview($post->attachments[0]) ? $post->attachments[0]->BlurredPreview : asset('/img/post-locked.svg')}}');">
                @if(AttachmentHelper::hasBlurredPreview($post->attachments[0]))
                    @include('elements.feed.locked-post-actions')
                @endif
            </div>
            <div class="non-blur-locked-actions">
                @if(!AttachmentHelper::hasBlurredPreview($post->attachments[0]))
                    @include('elements.feed.locked-post-actions')
                @endif
            </div>
        </div>
    </div>
</div>
