<div class="modal fade" id="globalModal" tabindex="-1" role="dialog" aria-labelledby="globalModalLabel" aria-hidden="true">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="globalModalLabel">{{__("Incomplete update")}}</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <p>{{__("Your update procedure is not complete. The code is update but database is outdated.")}}</p>
                <p>{{"Please click the button below and finish the update procedure before using the admin panel any further."}}</p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-default pull-left" data-dismiss="modal">{{__("Close")}}</button>
                <a href="{{route('installer.update')}}">
                    <button type="button" class="btn btn-primary pull-right" id="primaryAction">{{__("Update")}}</button>
                </a>
            </div>
        </div>
    </div>
</div>
