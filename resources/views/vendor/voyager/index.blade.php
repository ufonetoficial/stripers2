@extends('voyager::master')

@section('page_header')
    <h1 class="page-title">
        <i class="voyager-dashboard"></i> {{__("Platform statistics")}}
    </h1>
@stop

@section('content')
    <div class="page-content">
        @include('voyager::alerts')
        @include('voyager::dimmers')
        <div class="analytics-container">

            @php
                $adminNotifications = [
                    'id_checks' => \App\Model\UserVerify::where('status', 'pending')->count(),
                    'withdrawals' => \App\Model\Withdrawal::where('status', 'requested')->count(),
                    'deposits' => \App\Model\PaymentRequest::where('status', 'pending')->count(),
                ];
                $hasNotifications = array_filter($adminNotifications, function($value) {
                    return $value >= 1;
                });
                $hasNotifications = !empty($hasNotifications);
            @endphp

            @if($hasNotifications)
                <!-- Info Alert with Close Button -->
                <div class="tab-additional-info alert alert-info alert-dismissible mb-4 pb-3" role="alert">
                    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                    <div class="info-label mb-0"><div class="icon voyager-info-circled"></div> There are new events that require your attention.
                    <span class="secondary-info">Please review them at:</span>
                    </div>
                    <ul class="mt-2">
                        @if($adminNotifications['id_checks'])
                            <li><a class="text-white" href="admin/user-verifies">User ID Checks <span class="font-weight-bolder">({{$adminNotifications['id_checks']}})</span></a></li>
                        @endif
                        @if($adminNotifications['withdrawals'])
                            <li><a class="text-white" href="admin/withdrawals">Withdrawals <span class="font-weight-bolder">({{$adminNotifications['withdrawals']}})</span></a></li>
                        @endif
                        @if($adminNotifications['deposits'])
                            <li><a class="text-white" href="admin/payment-requests">Offline Payment Deposits <span class="font-weight-bolder">({{$adminNotifications['deposits']}})</span></a></li>
                        @endif
                    </ul>
                </div>
            @endif

            @if(!checkMysqlndForPDO() || !checkForMysqlND())
                <div class="storage-incorrect-bucket-config tab-additional-info mb-4">
                    <div class="alert alert-warning alert-dismissible mb-1">
                        <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                        <div class="info-label"><div class="icon voyager-info-circled"></div><strong>{{__("Warning!")}}</strong></div>
                        <div class=""> {{__("Your PHP's pdo_mysql extension is not using mysqlnd driver. ")}} {{__('This might cause different UI related issues.')}}
                            <div class="mt-05">{{__("Please contact your hosting provider and check if they can enable mysqlnd for pdo_mysql as default driver. Alternatively, you can check if the other PHP versions act the same. ")}}</div>
                            <div class="mt-05">
                                <ul>
                                    <li>{{__("Mysqlnd loaded:")}} <strong>{{checkForMysqlND() ? __('True') : __('False')}}</strong></li>
                                    <li>{{__("Mysqlnd for PDO:")}} <strong>{{checkMysqlndForPDO()  ? __('True') : __('False')}}</strong></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            @endif

            @include('elements.admin.metrics')

            <div class="row">
                <div class="mb-4 col-md-4">
                    <div class="card shadow rounded p-5">
                        <div class="card-body text-muted font-weight-medium">
                            <a href="https://codecanyon.net/item/justfans-premium-content-creators-saas-platform/35154898" target="_blank">
                                <div class="d-flex align-items-center">
                                    <div class="d-flex align-items-center justify-content-center info-category-bg">
                                        <div class="icon voyager-world info-category-icon"></div>
                                    </div>
                                    <div class="ml-4 d-flex align-items-center">
                                        <div>
                                            <div class="text-muted font-weight-bolder">{{__("Website")}}</div>
                                            <p class="m-0 text-muted">{{__("Visit the official product page")}}</p>
                                        </div>
                                    </div>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>

                <div class="mb-4 col-md-4">
                    <div class="card shadow rounded p-5">
                        <div class="card-body text-muted font-weight-medium">
                            <a href="https://docs.qdev.tech/justfans/" target="_blank">
                                <div class="d-flex align-items-center">
                                    <div class="d-flex align-items-center justify-content-center info-category-bg">
                                        <div class="icon voyager-book info-category-icon"></div>
                                    </div>
                                    <div class="ml-4 d-flex align-items-center">
                                        <div>
                                            <div class="text-muted font-weight-bolder">{{__("Documentation")}}</div>
                                            <p class="m-0 text-muted">{{__("Visit the official product docs")}}</p>
                                        </div>
                                    </div>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>

                <div class="mb-4 col-md-4">
                    <div class="card shadow rounded p-5">
                        <div class="card-body text-muted font-weight-medium">
                            <a href="https://changelogs.qdev.tech/products/fans" target="_blank">
                                <div class="d-flex align-items-center">
                                    <div class="d-flex align-items-center justify-content-center  info-category-bg">
                                        <div class="icon voyager-file-code info-category-icon"></div>
                                    </div>
                                    <div class="ml-4 d-flex align-items-center">
                                        <div>
                                            <div class="text-muted font-weight-bolder">{{__("Changelog")}}</div>
                                            <p class="m-0 text-muted">{{__("Visit the official product changelog")}}</p>
                                        </div>
                                    </div>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>

            </div>

        </div>

    </div>
@stop
