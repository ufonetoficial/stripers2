/**
 * Admin panel JS functions
 */
"use strict";
/* global toastr, site_settings, appUrl, Pickr */

$(function () {
    const location = window.location.href;
    // Settings page overrides
    if(location.indexOf('admin/settings') >= 0){
        // Default inits/binds
        Admin.settingsPageInit();
        Admin.initActiveTabOnSaveEvents();
        Admin.setCustomSettingsTabEvents();
        Admin.initThemeColorPickers();

        // Driver/Dropdown driver selector inits
        Admin.emailsDriverSwitch(site_settings["emails.driver"]);
        Admin.storageDriverSwitch(site_settings["storage.driver"]);
        Admin.socketsDriverSwitch(site_settings["websockets.driver"]);
        Admin.transcodingDriverSwitch(site_settings["transcoding.driver"]);
        Admin.captchaDriverSwitch(site_settings["security.captcha_driver"]);

        // Sub-categories switch
        Admin.paymentsSettingsSubTabSwitch('general');
        Admin.mediaSettingsSubTabSwitch('general');
        Admin.securitySettingsSubTabSwitch('general');
        Admin.feedSettingsSubTabSwitch('general');
        Admin.socialSettingsSubTabSwitch('login');

        // CTRL+S Override
        $(document).keydown(function(e) {
            var key = e.which || e.keyCode; // Use e.which if available, otherwise fallback to e.keyCode
            if (key && (key === 83 || key === 115) && (e.ctrlKey || e.metaKey) && !e.altKey) {
                e.preventDefault();
                $('.save-settings-form').submit();
                return false;
            }
            return true;
        });

    }

    // Withdrawal page overrides
    if(location.indexOf('admin/withdrawals') >= 0) {
        Admin.processWithdrawalApproval();
    }

    // Login page overrides
    if(location.indexOf('admin/login') >= 0){
        var btn = document.querySelector('button[type="submit"]');
        var form = document.forms[0];
        var email = document.querySelector('[name="email"]');
        var password = document.querySelector('[name="password"]');
        btn.addEventListener('click', function(ev){
            if (form.checkValidity()) {
                btn.querySelector('.signingin').className = 'signingin';
                btn.querySelector('.signin').className = 'signin hidden';
            } else {
                ev.preventDefault();
            }
        });
        email.focus();
        document.getElementById('emailGroup').classList.add("focused");
        // Focus events for email and password fields
        email.addEventListener('focusin', function(){
            document.getElementById('emailGroup').classList.add("focused");
        });
        email.addEventListener('focusout', function(){
            document.getElementById('emailGroup').classList.remove("focused");
        });
        password.addEventListener('focusin', function(){
            document.getElementById('passwordGroup').classList.add("focused");
        });
        password.addEventListener('focusout', function(){
            document.getElementById('passwordGroup').classList.remove("focused");
        });
    }

});

var Admin = {

    approveWithdrawalId: '',
    activeSettingsTab : '',
    themeColors: {
        theme_color_code: '#cb0c9f',
        theme_gradient_from: '#7928CA',
        theme_gradient_to: '#FF0080'
    },

    initActiveTabOnSaveEvents: function(){
        $('.save-settings-form').on('submit',function(evt){
            if(Admin.activeSettingsTab === 'payments-processors' || Admin.activeSettingsTab === 'payments-general' || Admin.activeSettingsTab === 'payments-invoices' || Admin.activeSettingsTab === 'payments-withdrawals') {
                $('.setting_tab').val('Payments');
            }
            if(Admin.activeSettingsTab === 'media-general' || Admin.activeSettingsTab === 'media-videos') {
                $('.setting_tab').val('Media');
            }
            if(Admin.activeSettingsTab === 'security-general' || Admin.activeSettingsTab === 'security-captcha') {
                $('.setting_tab').val('Security');
            }
            if(Admin.activeSettingsTab === 'feed-general' || Admin.activeSettingsTab === 'feed-widgets') {
                $('.setting_tab').val('Feed');
            }
            if(Admin.activeSettingsTab === 'social-login' || Admin.activeSettingsTab === 'social-links') {
                $('.setting_tab').val('Social');
            }
            if(Admin.activeSettingsTab === 'colors'){
                evt.preventDefault();
                Admin.generateTheme();
            }
            if(Admin.activeSettingsTab === 'license'){
                evt.preventDefault();
                Admin.saveLicense();
            }
            if(!Admin.validateSettingFields()){
                evt.preventDefault(); // Maybe launch a toast
            }
        });
    },

    setCustomSettingsTabEvents: function(){
        $('.settings  .nav a').on('click',function () {
            const tab = $(this).attr('href').replace('#','');
            Admin.activeSettingsTab = tab;
        });
    },

    /**
     * Binds few setting field custom events
     */
    settingsPageInit: function(){
        // $('.settings-menu-site').click(); // Avoiding settings mess up bug
        $('select[name="emails.driver"]').on('change',function () {
            Admin.emailsDriverSwitch($(this).val());
        });
        $('select[name="storage.driver"]').on('change',function () {
            Admin.storageDriverSwitch($(this).val());
        });
        $('select[name="websockets.driver"]').on('change',function () {
            Admin.socketsDriverSwitch($(this).val());
        });
        $('select[name="payments.driver"]').on('change',function () {
            Admin.paymentsDriverSwitch($(this).val());
        });
        $('select[name="media.transcoding_driver"]').on('change',function () {
            Admin.transcodingDriverSwitch($(this).val());
        });
        $('select[name="security.captcha_driver"]').on('change',function () {
            Admin.captchaDriverSwitch($(this).val());
        });
        $('select[name="feed.widget"]').on('change',function () {
            Admin.widgetDriverSwitch($(this).val());
        });
        Admin.settingsHide();
    },

    /**
     * Validates setting fields manually, as Voyager doesn't apply rules on setting fields.
     * @returns {boolean}
     */
    validateSettingFields: function() {
        let error = 'Please fill in all the fields';

        if (Admin.activeSettingsTab === 'storage') {
            let storageDriver = $('select[name="storage.driver"]').val();

            // Mapping of storage drivers to their required fields
            let requiredFields = {
                's3': [
                    'storage.aws_access_key',
                    'storage.aws_secret_key',
                    'storage.aws_region',
                    'storage.aws_bucket_name'
                ],
                'wasabi': [
                    'storage.was_access_key',
                    'storage.was_secret_key',
                    'storage.was_region',
                    'storage.was_bucket_name'
                ],
                'do_spaces': [
                    'storage.do_access_key',
                    'storage.do_secret_key',
                    'storage.do_region',
                    'storage.do_bucket_name'
                ],
                'minio': [
                    'storage.minio_access_key',
                    'storage.minio_secret_key',
                    'storage.minio_region',
                    'storage.minio_endpoint',
                    'storage.minio_bucket_name'
                ],
                'pushr': [
                    'storage.pushr_access_key',
                    'storage.pushr_secret_key',
                    'storage.pushr_endpoint',
                    'storage.pushr_bucket_name'
                ]
            };

            let fields = requiredFields[storageDriver];

            if (fields) {
                let allFieldsFilled = fields.every(function(fieldName) {
                    let fieldValue = $('input[name="' + fieldName + '"]').val();
                    return fieldValue && fieldValue.trim().length > 0;
                });

                if (allFieldsFilled) {
                    return true;
                } else {
                    toastr.error(error);
                    return false;
                }
            }
        }

        // Return true if no validation is needed
        return true;
    },

    /**
     * Filters email settings based on the selected driver type.
     * @param {string} type - The selected email driver type.
     */
    emailsDriverSwitch: function(type) {
        // Hide all email settings
        Admin.settingsHide('emails');
        // Show settings that match the selected type
        $('.setting-row[class*="' + type + '"]').show();
    },

    /**
     * Switches the payments driver settings based on the selected type.
     * @param {string} type - The selected payments driver.
     */
    paymentsDriverSwitch: function(type) {
        // Hide all payments settings
        Admin.settingsHide('payments');

        if (type === 'offline') {
            // Show all payment subcategory info
            Admin.togglePaymentsSubCategoryInfo('all');

            // Show specific settings for 'offline' payments by matching class substrings
            $('.setting-row[class*="payments.allow_manual_payments"], .setting-row[class*="payments.offline_payments"]').show();
        } else {
            // Toggle the payments subcategory for the selected type
            Admin.togglePaymentsSubCategory(type);
        }

        // Set the payments driver value
        $('#payments.driver').val(type);
    },

    /**
     * Parses all payment settings and only shows those matching the pattern.
     * @param {string} pattern - The payment subcategory pattern to match.
     */
    togglePaymentsSubCategory: function(pattern) {
        // Show settings that match the pattern
        var selector = '.setting-row[class*="payments.' + pattern + '"]';
        $(selector).show();

        // Update the payments subcategory info
        Admin.togglePaymentsSubCategoryInfo(pattern);
    },

    /**
     * Shows media settings fields based on the provided pattern.
     * @param {string} pattern - The pattern to match in the media settings.
     */
    toggleMediaSubCategory: function(pattern) {
        // Hide all media settings
        // $('.setting-row[class*="media."]').hide();

        // Show settings that match the pattern
        var selector = '.setting-row[class*="media.' + pattern + '"]';
        $(selector).show();
    },

    /**
     * Shows security settings fields based on the provided pattern.
     * @param {string} pattern - The pattern to match in the security settings.
     */
    toggleSecuritySubCategory: function(pattern) {
        // Hide all security settings
        // $('.setting-row[class*="security."]').hide();

        // Show settings that match the pattern
        var selector = '.setting-row[class*="security.' + pattern + '"]';
        $(selector).show();
    },

    /**
     * Shows feed settings fields based on the provided pattern.
     * @param {string} pattern - The pattern to match in the security settings.
     */
    toggleFeedSubCategory: function(pattern) {
        var selector = ""; // Initialize selector variable

        switch (pattern) {
        case "suggestions":
            // Classes related to "suggestions"
            var suggestionsClasses = [
                "feed.hide_suggestions_slider",
                "feed.suggestions_skip_empty_profiles",
                "feed.suggestions_skip_unverified_profiles",
                "feed.suggestions_use_featured_users_list",
                "feed.feed_suggestions_autoplay",
                "feed.feed_suggestions_total_cards",
                "feed.feed_suggestions_total_cards",
                "feed.feed_suggestions_card_per_page",

            ];
            selector = suggestionsClasses.map(cls => '.setting-row[class*="' + cls + '"]').join(",");
            break;

        case "expired-subs":
            // Classes related to "expired-subs"
            var expiredSubsClasses = [
                "feed.expired_subs_widget_autoplay",
                "feed.expired_subs_widget_card_per_page",
                "feed.expired_subs_widget_total_cards",
                "feed.expired_subs_widget_hide"
            ];
            selector = expiredSubsClasses.map(cls => '.setting-row[class*="' + cls + '"]').join(",");
            break;

        case "search":
            // Classes related to "search"
            var searchClasses = [
                "feed.default_search_widget_filter",
                "feed.search_widget_hide",
            ];
            selector = searchClasses.map(cls => '.setting-row[class*="' + cls + '"]').join(",");
            break;

        default:
            // Default case for unmatched patterns
            selector = '.setting-row[class*="feed.' + pattern + '"]';
            break;
        }

        // Hide all rows and then show only the matched ones
        // $('.setting-row').hide();
        $(selector).show();
    },



    /**
     * Hide/show payments info box
     * @param pattern
     */
    togglePaymentsSubCategoryInfo: function(pattern){
        // Hide/show info box
        let tabs = [
            'payments-info-paypal',
            'payments-info-stripe',
            'payments-info-coinbase',
            'payments-info-ccbill',
            'payments-info-paystack',
            'payments-info-mercado',
            'payments-info-nowpayments',
        ];
        for(let i = 0; i < tabs.length; i++){
            $('.'+tabs[i]).addClass('d-none');
        }
        $('.payments-info-'+pattern).removeClass('d-none');
    },

    /**
     * Switches sockets settings tabs.
     * @param {string} type - The sockets driver type (e.g., 'pusher', 'some_other_driver').
     */
    socketsDriverSwitch: function(type = 'pusher') {
        // Hide all sockets settings
        Admin.settingsHide('sockets');
        // Show settings that match the driver type
        var selector = '.setting-row[class*="' + type + '"]';
        $(selector).show();
    },

    /**
     * Filters storage settings based on a dropdown value.
     * @param {string} type - The selected storage type.
     */
    storageDriverSwitch: function(type) {
        Admin.settingsHide('storage');

        // Mapping of storage types to their corresponding class substrings
        var classMap = {
            's3': ['aws', 'cdn_domain_name'],
            'wasabi': ['was'],
            'do_spaces': ['do_'],
            'minio': ['minio_'],
            'pushr': ['pushr_']
        };

        var substringsToMatch = classMap[type];

        if (substringsToMatch) {
            // Create a selector string that matches elements whose class attribute contains the substring
            var selector = substringsToMatch.map(function(substring) {
                return '.setting-row[class*="' + substring + '"]';
            }).join(', ');

            // Show the selected elements
            $(selector).show();
        }
    },

    /**
     * Hides some settings fields by default
     * May keep some general fields available in multiple sub-tabs
     * @param prefix
     */
    settingsHide: function (prefix, hideAll = false) {
        $('.setting-row').each(function(key,element) {
            if($(element).attr('class').indexOf(prefix+'.') >= 0){
                let settingName = $(element).data('settingkey');
                switch (prefix) {
                case 'emails':
                    if(settingName !== 'emails.driver' && settingName !== 'emails.from_name' && settingName !== 'emails.from_address'){
                        $(element).hide();
                    }
                    break;
                case 'storage':
                    if(settingName !== 'storage.driver'){
                        $(element).hide();
                    }
                    break;
                case 'social':
                    if(hideAll){
                        $(element).hide();
                    }
                    break;
                case 'sockets':
                    if(settingName !== 'websockets.driver'){
                        $(element).hide();
                    }
                    break;
                case 'payments':
                    if(hideAll){
                        $(element).hide();
                    }
                    else{
                        if(!['payments.driver','payments.currency_code','payments.currency_symbol','payments.default_subscription_price','payments.min_tip_value','payments.max_tip_value','payments.maximum_subscription_price','payments.minimum_subscription_price', 'payments.disable_local_wallet_for_subscriptions'].includes(settingName)){
                            $(element).hide();
                        }
                    }
                    break;
                case 'media':
                    if(hideAll){
                        $(element).hide();
                    }
                    else{
                        if(![
                            'media.allowed_file_extensions',
                            'media.max_file_upload_size',
                            'media.use_chunked_uploads',
                            'media.upload_chunk_size',
                            'media.apply_watermark',
                            'media.watermark_image',
                            'media.use_url_watermark',
                            'media.users_covers_size',
                            'media.users_avatars_size',
                            'media.max_avatar_cover_file_size',
                            'media.disable_media_right_click',
                            'media.use_blurred_previews_for_locked_posts'
                        ].includes(settingName)){
                            $(element).hide();
                        }
                    }
                    break;
                case 'security':
                    if(hideAll){
                        $(element).hide();
                    }
                    else{
                        if([
                            'security.allow_geo_blocking',
                            'security.abstract_api_key',
                            'security.enforce_email_valid_check',
                            'security.email_abstract_api_key',
                            'security.enable_2fa',
                            'security.default_2fa_on_register',
                            'security.allow_users_2fa_switch',
                            'security.enforce_app_ssl',
                            'security.recaptcha_enabled',
                            'security.recaptcha_site_key',
                            'security.recaptcha_site_secret_key',
                            'security.hcaptcha_site_key',
                            'security.hcaptcha_site_secret_key',
                            'security.turnstile_site_key',
                            'security.turnstile_site_secret_key',
                        ].includes(settingName)){
                            $(element).hide();
                        }
                    }
                    break;
                case 'feed':
                    if(hideAll){
                        $(element).hide();
                    }
                    else{
                        if([
                            'security.allow_geo_blocking',
                            'security.abstract_api_key',
                            'security.enforce_email_valid_check',
                            'security.email_abstract_api_key',
                            'security.enable_2fa',
                            'security.default_2fa_on_register',
                            'security.allow_users_2fa_switch',
                            'security.enforce_app_ssl',
                        ].includes(settingName)){
                            $(element).hide();
                        }
                    }
                    break;
                }
            }
        });
    },

    /**
     * Hides some settings fields by default
     * @param prefix
     */
    /**
     * Updates the payments settings view based on the selected sub-tab.
     * @param {string} prefix - The selected sub-tab prefix.
     */
    paymentsSettingsSubTabSwitch: function (prefix) {
        // Hide all payments settings
        Admin.settingsHide('payments', true);
        // Reset withdrawal stripe connect info
        Admin.toggleWithdrawalsStripeConnectInfo(false);

        var selectors = [];
        var settingKeysToShow = [];

        switch (prefix) {
        case 'general':
            Admin.togglePaymentsSubCategoryInfo('all');
            settingKeysToShow = [
                'payments.deposit_min_amount',
                'payments.deposit_max_amount',
                'payments.currency_code',
                'payments.currency_symbol',
                'payments.currency_position',
                'payments.default_subscription_price',
                'payments.min_tip_value',
                'payments.max_tip_value',
                'payments.maximum_subscription_price',
                'payments.minimum_subscription_price',
                'payments.min_posts_until_creator',
                'payments.min_ppv_post_price',
                'payments.max_ppv_post_price',
                'payments.min_ppv_message_price',
                'payments.max_ppv_message_price',
                'payments.min_ppv_stream_price',
                'payments.max_ppv_stream_price',
                'payments.disable_local_wallet_for_subscriptions'
            ];
            // Create selectors for the settings to show
            selectors = settingKeysToShow.map(function(key) {
                return '.setting-row[data-settingkey="' + key + '"]';
            });
            break;

        case 'processors':
            // Initialize payments settings for 'stripe'
            Admin.paymentsDriverSwitch('stripe');
            // Show the 'payments.driver' setting
            selectors = ['.setting-row[data-settingkey="payments.driver"]'];
            break;

        case 'invoices':
            Admin.togglePaymentsSubCategoryInfo('all');
            // Select settings where data-settingkey starts with 'payments.invoices_'
            selectors = ['.setting-row[data-settingkey^="payments.invoices_"]'];
            break;

        case 'withdrawals':
            Admin.togglePaymentsSubCategoryInfo('all');
            Admin.toggleWithdrawalsStripeConnectInfo(true);
            // Select settings where data-settingkey starts with 'payments.withdrawal_'
            selectors = ['.setting-row[data-settingkey^="payments.withdrawal_"]'];
            break;

        default:
            // Handle unexpected prefixes if necessary
            // console.warn('Unknown prefix:', prefix);
            break;
        }

        if (selectors.length > 0) {
            // Combine selectors into a single selector string
            var selectorString = selectors.join(', ');
            // Show the selected settings
            $(selectorString).show();
        }
    },

    /**
     * Switches the media settings sub-tab based on the provided prefix.
     * @param {string} prefix - The selected sub-tab prefix ('general' or 'videos').
     */
    mediaSettingsSubTabSwitch: function (prefix) {
        // Hide all media settings
        Admin.settingsHide('media', true);
        // Hide coconut info
        $('.coconut-info').addClass('d-none');

        if (prefix === 'general') {
            // Settings to show in the 'general' sub-tab
            var settingsToShow = [
                'media.allowed_file_extensions',
                'media.max_file_upload_size',
                'media.use_chunked_uploads',
                'media.upload_chunk_size',
                'media.apply_watermark',
                'media.watermark_image',
                'media.use_url_watermark',
                'media.users_covers_size',
                'media.users_avatars_size',
                'media.max_avatar_cover_file_size',
                'media.disable_media_right_click',
                'media.use_blurred_previews_for_locked_posts'
            ];

            // Create a selector for the settings to show
            var selector = settingsToShow.map(function(settingKey) {
                return '.setting-row[data-settingkey="' + settingKey + '"]';
            }).join(', ');

            // Show the selected settings
            $(selector).show();
        } else if (prefix === 'videos') {
            // Get the current transcoding driver value
            var transcodingDriver = $('*[name="media.transcoding_driver"]').val();
            // Switch the videos settings based on the transcoding driver
            Admin.transcodingDriverSwitch(transcodingDriver);
        }
    },

    /**
     * Switches the security settings sub-tab based on the provided prefix.
     * @param {string} prefix - The selected sub-tab prefix ('general' or 'captcha').
     */
    securitySettingsSubTabSwitch: function (prefix) {
        // Hide all security settings
        Admin.settingsHide('security', true);

        if (prefix === 'general') {
            // Settings to show in the 'general' sub-tab
            var settingsToShow = [
                'security.allow_geo_blocking',
                'security.abstract_api_key',
                'security.enforce_email_valid_check',
                'security.email_abstract_api_key',
                'security.enable_2fa',
                'security.default_2fa_on_register',
                'security.allow_users_2fa_switch',
                'security.enforce_app_ssl',
            ];

            // Create a selector for the settings to show
            var selector = settingsToShow.map(function(settingName) {
                return '.setting-row[data-settingkey="' + settingName + '"]';
            }).join(', ');

            // Show the selected settings
            $(selector).show();
        } else if (prefix === 'captcha') {
            // Call the securitySettingsSwitch function with the current captcha driver value
            var captchaDriver = $('*[name="security.captcha_driver"]').val();
            Admin.captchaDriverSwitch(captchaDriver);
        }
    },

    /**
     * Switches the security settings sub-tab based on the provided prefix.
     * @param {string} prefix - The selected sub-tab prefix ('general' or 'captcha').
     */
    socialSettingsSubTabSwitch: function (prefix) {
        // Hide all security settings
        Admin.settingsHide('social', true);
        let settingsToShow = [];
        if (prefix === 'login') {
            $('.social-login-info').show();
            // Settings to show in the 'general' sub-tab
            settingsToShow = [
                'social.facebook_client_id',
                'social.facebook_secret',
                'social.twitter_client_id',
                'social.twitter_secret',
                'social.google_client_id',
                'social.google_secret',
            ];

        } else if (prefix === 'links') {
            $('.social-login-info').hide();
            // Settings to show in the 'general' sub-tab
            settingsToShow = [
                'social.facebook_url',
                'social.instagram_url',
                'social.twitter_url',
                'social.whatsapp_url',
                'social.tiktok_url',
                'social.youtube_url',
                'social.telegram_link',
                'social.reddit_url',
            ];

        }
        // Create a selector for the settings to show
        var selector = settingsToShow.map(function(settingName) {
            return '.setting-row[data-settingkey="' + settingName + '"]';
        }).join(', ');
        $(selector).show();

    },

    /**
     * Switches the security settings sub-tab based on the provided prefix.
     * @param {string} prefix - The selected sub-tab prefix ('general' or 'captcha').
     */
    feedSettingsSubTabSwitch: function (prefix) {
        // Hide all security settings
        Admin.settingsHide('feed', true);

        if (prefix === 'general') {
            // Settings to show in the 'general' sub-tab
            var settingsToShow = [
                'feed.feed_posts_per_page',
                'feed.min_post_description',
                'feed.post_box_max_height',
                'feed.allow_post_scheduling',
                'feed.allow_post_polls',
                'feed.enable_post_description_excerpts',
                'feed.disable_posts_text_preview',
                'feed.allow_gallery_zoom',
            ];

            // Create a selector for the settings to show
            var selector = settingsToShow.map(function(settingName) {
                return '.setting-row[data-settingkey="' + settingName + '"]';
            }).join(', ');

            // Show the selected settings
            $(selector).show();
        } else if (prefix === 'widgets') {
            // Call the securitySettingsSwitch function with the current captcha driver value
            var widgetSelector = $('*[name="feed.widget"]').val();
            Admin.widgetDriverSwitch(widgetSelector);
        }
    },

    /**
     * Switches the transcoding driver settings based on the selected type.
     * @param {string} type - The selected transcoding driver ('ffmpeg' or 'coconut').
     */
    transcodingDriverSwitch: function(type) {
        // Hide all media settings
        Admin.settingsHide('media');
        // Hide coconut info
        $('.coconut-info').addClass('d-none');

        if (type === 'ffmpeg') {
            // Show ffmpeg media settings
            Admin.toggleMediaSubCategory('ffmpeg');
            // Show specific settings for ffmpeg
            $('.setting-row[class*="media.ffprobe_path"], .setting-row[class*="media.enforce_mp4_conversion"]').show();
        } else if (type === 'coconut') {
            // Show coconut info
            $('.coconut-info').removeClass('d-none');
            // Show coconut media settings
            Admin.toggleMediaSubCategory('coconut');
        }

        // Show transcoding driver setting
        $('.setting-row[class*="media.transcoding_driver"]').show();

        // Set the media driver value
        $('#media.driver').val(type);
    },

    /**
     * Switches the captcha driver settings based on the selected type.
     * @param {string} type - The selected captcha driver ('recaptcha', 'turnstile', 'hcaptcha').
     */
    captchaDriverSwitch: function(type) {
        // Hide all security settings
        Admin.settingsHide('security');

        // Toggle the security subcategory based on the captcha driver type
        Admin.toggleSecuritySubCategory(type);

        // Show the captcha driver setting
        $('.setting-row[class*="security.captcha_driver"]').show();

        // Set the security driver value
        $('#security.driver').val(type);
    },

    /**
     * Switches the widget selector settings based on the selected type.
     * @param {string} type - The selected captcha driver ('suggestions', 'expired', 'search').
     */
    widgetDriverSwitch: function(type) {
        // Hide all security settings
        Admin.settingsHide('feed', true);

        // Toggle the security subcategory based on the widget driver type
        Admin.toggleFeedSubCategory(type);

        // Show the widget driver setting
        $('.setting-row[class*="feed.widget"]').show();

        // Set the security driver value
        $('#feed.widget').val(type);
    },


    /**
     * Inits the color pickers
     */
    initThemeColorPickers: function(){

        if(site_settings['colors.theme_color_code']){
            Admin.themeColors.theme_color_code = '#' + site_settings['colors.theme_color_code'];
        }

        if(site_settings['colors.theme_gradient_from']){
            Admin.themeColors.theme_gradient_from = '#' + site_settings['colors.theme_gradient_from'];
        }

        if(site_settings['colors.theme_gradient_to']){
            Admin.themeColors.theme_gradient_to = '#' + site_settings['colors.theme_gradient_to'];
        }

        const defaultColors = [
            'rgb(244, 67, 54)',
            'rgb(233, 30, 99)',
            'rgb(156, 39, 176)',
            'rgb(103, 58, 183)',
            'rgb(63, 81, 181)',
            'rgb(33, 150, 243)',
            'rgb(3, 169, 244)',
            'rgb(0, 188, 212)',
            'rgb(0, 150, 136)',
            'rgb(76, 175, 80)',
            'rgb(139, 195, 74)',
            'rgb(205, 220, 57)',
            'rgb(255, 235, 59)',
            'rgb(255, 193, 7)'
        ];

        // eslint-disable-next-line no-unused-vars
        const theme_color_code_pickr = Pickr.create({
            el: '#theme_color_code',
            theme: 'nano', // or 'monolith', or 'nano'
            default: Admin.themeColors.theme_color_code,
            defaultRepresentation: 'HEX',
            swatches: defaultColors,
            position: 'right-end',
            components: {
                // Main components
                preview: true,
                opacity: false,
                hue: false,
                // Input / output Options
                interaction: {
                    // hex: true,
                    input: true,
                }
            }
            // eslint-disable-next-line no-unused-vars
        }).on('change', (color, instance) => {
            Admin.themeColors.theme_color_code = color.toHEXA().toString();
            $('.setting-theme_color_code .pickr button').attr('style','background-color:'+color.toHEXA().toString());
        });

        // eslint-disable-next-line no-unused-vars
        const theme_gradient_from_pickr = Pickr.create({
            el: '#theme_gradient_from',
            theme: 'nano', // or 'monolith', or 'nano'
            default: Admin.themeColors.theme_gradient_from,
            defaultRepresentation: 'HEX',
            swatches: defaultColors,
            position: 'right-end',
            components: {
                // Main components
                preview: true,
                opacity: false,
                hue: false,
                // Input / output Options
                interaction: {
                    input: true,
                }
            }
            // eslint-disable-next-line no-unused-vars
        }).on('change', (color, instance) => {
            Admin.themeColors.theme_gradient_from = color.toHEXA().toString();
            $('.setting-theme_gradient_from .pickr button').attr('style','background-color:'+color.toHEXA().toString());
        });

        // eslint-disable-next-line no-unused-vars
        const theme_gradient_to_pickr = Pickr.create({
            el: '#theme_gradient_to',
            theme: 'nano', // or 'monolith', or 'nano'
            default: Admin.themeColors.theme_gradient_to,
            defaultRepresentation: 'HEX',
            swatches: defaultColors,
            position: 'right-end',
            components: {
                // Main components
                preview: true,
                opacity: false,
                hue: false,
                // Input / output Options
                interaction: {
                    input: true,
                }
            }
            // eslint-disable-next-line no-unused-vars
        }).on('change', (color, instance) => {
            Admin.themeColors.theme_gradient_to = color.toHEXA().toString();
            $('.setting-theme_gradient_to .pickr button').attr('style','background-color:'+color.toHEXA().toString());
        });
    },

    /**
     * Approve withdrawal
     */
    approveWithdrawal: function(){
        $('#approve-withdrawal').modal('hide');
        $('#voyager-loader').fadeIn();
        $.ajax({
            type: 'POST',
            url: appUrl + '/admin/withdrawals/' + Admin.approveWithdrawalId + '/approve',
            success: function (result) {
                $('#voyager-loader').fadeOut();
                Admin.hideWithdrawalExtraButtons(Admin.approveWithdrawalId);
                toastr.success(result.message);
            },
            error: function (result) {
                $('#voyager-loader').fadeOut();
                toastr.error(result.responseJSON.error);
            }
        });
    },

    /**
     * Reject withdrawal
     */
    rejectWithdrawal: function(withdrawalId){
        $('#voyager-loader').fadeIn();
        $.ajax({
            type: 'POST',
            url: appUrl + '/admin/withdrawals/' + withdrawalId + '/reject',
            success: function (result) {
                $('#voyager-loader').fadeOut();
                Admin.hideWithdrawalExtraButtons(withdrawalId);
                toastr.success(result.message);
            },
            error: function (result) {
                $('#voyager-loader').fadeOut();
                toastr.error(result.responseJSON.error);
            }
        });
    },

    processWithdrawalApproval: function() {
        $('.approve-withdrawal-button').on('click',function(){
            Admin.approveWithdrawalId = $(this).data('value');
        });
    },

    hideWithdrawalExtraButtons: function(withdrawalId) {
        $('.approve-button-' + withdrawalId).addClass('d-none');
        $('.reject-button-' + withdrawalId).addClass('d-none');
        $('.dropdown-toggle-' + withdrawalId).addClass('d-none');
    },

    toggleWithdrawalsStripeConnectInfo: function(toggle) {
        if(toggle) {
            $('.payments-info-stripeConnect').removeClass('d-none');
        } else {
            $('.payments-info-stripeConnect').addClass('d-none');
        }
    },

    /**
     * Theme generator function
     */
    generateTheme: function(){
        const data = {
            'product' :'fans',
            'skip_rtl' : $('*[name="theme_skip_rtl"]').is(':checked') ? false : true,
            'color_code' : Admin.themeColors.theme_color_code.replace('#',''),
            'gradient_from' : Admin.themeColors.theme_gradient_from.replace('#',''),
            'gradient_to' : Admin.themeColors.theme_gradient_to.replace('#',''),
            'code' : $('*[name="license_product_license_key"]').val(),
        };

        $('#voyager-loader').fadeIn();
        $.ajax({
            type: 'POST',
            data: data,
            url: appUrl + '/admin/theme/generate',
            success: function (result) {
                $('#voyager-loader').fadeOut();
                toastr.success(result.message);
                if(result.data.doBrowserRedirect){
                    window.location="https://themes-v2.qdev.tech/"+result.data.path;
                }
            },
            error: function (result) {
                $('#voyager-loader').fadeOut();
                toastr.error(result.responseJSON.error);
            }
        });
    },

    /**
     * Saves license data
     */
    saveLicense: function(){
        $('#voyager-loader').fadeIn();
        $.ajax({
            type: 'POST',
            data: {
                'product_license_key' : $('.license_product_license_key').val()
            },
            url: appUrl + '/admin/license/save',
            success: function (result) {
                $('#voyager-loader').fadeOut();
                toastr.success(result.message);
            },
            error: function (result) {
                $('#voyager-loader').fadeOut();
                toastr.error(result.responseJSON.error);
            }
        });
    },

};
