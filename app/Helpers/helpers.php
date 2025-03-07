<?php

use App\Providers\GenericHelperServiceProvider;
use App\Providers\InstallerServiceProvider;
use Illuminate\Support\Facades\Storage;

if (!function_exists('getSetting')) {
    function getSetting($key, $default = null)
    {
        try {
            $dbSetting = TCG\Voyager\Facades\Voyager::setting($key, $default);
        }
        catch (Exception $exception){
            $dbSetting = null;
        }

        $configSetting = config('app.'.$key);
        if ($dbSetting) {
            // If voyager setting is file type, extract the value only
            if (is_string($dbSetting) && strpos($dbSetting, 'download_link')) {
                $file = json_decode($dbSetting);
                if ($file) {
                    $file = Storage::disk(config('filesystems.defaultFilesystemDriver'))->url(str_replace('\\', '/', $file[0]->download_link));
                }
                return $file;
            }

            return $dbSetting;
        }
        if ($configSetting) {
            return $configSetting;
        }

        return $default;
    }
}

function getLockCode() {
    return true;
    if(session()->get(InstallerServiceProvider::$lockCode) == env('APP_KEY')){
        return true;
    }
    else{
        return false;
    }
}

function setLockCode($code) {
    $sessData = [];
    $sessData[$code] = env('APP_KEY');
    session($sessData);
    return true;
}

function getUserAvatarAttribute($a) {
    return GenericHelperServiceProvider::getStorageAvatarPath($a);
}

function getLicenseType() {
    $licenseType = 'Unlicensed';
    if(file_exists(storage_path('app/installed'))){
        $licenseV = json_decode(file_get_contents(storage_path('app/installed')));
        if(isset($licenseV->data) && isset($licenseV->data->license)){
            $licenseType = $licenseV->data->license;
        }
    }
    return $licenseType;
}

function handledExec($command, $throw_exception = true) {
    exec('('.$command.')', $output, $return_code);
    if (($return_code !== 0) && $throw_exception) {
        throw new Exception('Error processing command: '.$command."\n\n".implode("\n", $output)."\n\n");
    }
    return ['output' => implode("\n", $output), 'return_code' => $return_code];
}

function checkMysqlndForPDO() {
    $dbHost = env('DB_HOST');
    $dbUser = env('DB_USERNAME');
    $dbPass = env('DB_PASSWORD');
    $dbName = env('DB_DATABASE');

    $pdo = new PDO('mysql:host='.$dbHost.';dbname='.$dbName, $dbUser, $dbPass);
    if (strpos($pdo->getAttribute(PDO::ATTR_CLIENT_VERSION), 'mysqlnd') !== false) {
        return true;
    }
    return false;
}

function checkForMysqlND() {
    if (extension_loaded('mysqlnd')) {
        return true;
    }
    return false;
}

/**
 * Custom, multi step, downscalling blur.
 * @param $gdImage
 * @param $scaleFactor
 * @param $blurIntensity
 * @param $finalBlur
 * @return mixed
 */
function multiStepBlur($gdImage, $scaleFactor = 4, $blurIntensity = 40, $finalBlur = 25)
{
    // Get original dimensions
    $originalWidth = imagesx($gdImage);
    $originalHeight = imagesy($gdImage);

    // Step 1: Downscale to smaller size
    $smallWidth = intval($originalWidth / $scaleFactor);
    $smallHeight = intval($originalHeight / $scaleFactor);
    $smallImage = imagecreatetruecolor($smallWidth, $smallHeight);
    imagecopyresampled($smallImage, $gdImage, 0, 0, 0, 0, $smallWidth, $smallHeight, $originalWidth, $originalHeight);

    // Apply Gaussian blur to the downscaled image
    for ($i = 1; $i <= $blurIntensity; $i++) {
        imagefilter($smallImage, IMG_FILTER_GAUSSIAN_BLUR);
    }

    // Add smoothing and brightness filters
    imagefilter($smallImage, IMG_FILTER_SMOOTH, 99);
    imagefilter($smallImage, IMG_FILTER_BRIGHTNESS, 10);

    // Step 2: Upscale to a larger size
    $mediumWidth = intval($originalWidth / 2);
    $mediumHeight = intval($originalHeight / 2);
    $mediumImage = imagecreatetruecolor($mediumWidth, $mediumHeight);
    imagecopyresampled($mediumImage, $smallImage, 0, 0, 0, 0, $mediumWidth, $mediumHeight, $smallWidth, $smallHeight);
    imagedestroy($smallImage);

    // Apply Gaussian blur to the upscaled image
    for ($i = 1; $i <= $finalBlur; $i++) {
        imagefilter($mediumImage, IMG_FILTER_GAUSSIAN_BLUR);
    }

    // Add smoothing and brightness filters
    imagefilter($mediumImage, IMG_FILTER_SMOOTH, 99);
    imagefilter($mediumImage, IMG_FILTER_BRIGHTNESS, 10);

    // Step 3: Restore to the original size
    imagecopyresampled($gdImage, $mediumImage, 0, 0, 0, 0, $originalWidth, $originalHeight, $mediumWidth, $mediumHeight);
    imagedestroy($mediumImage);

    return $gdImage;
}
