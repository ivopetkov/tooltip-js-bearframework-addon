<?php

/*
 * Tooltip JS package for Bear Framework
 * https://github.com/ivopetkov/tooltip-js-bearframework-addon
 * Copyright (c) Ivo Petkov
 * Free to use under the MIT license.
 */

use \BearFramework\App;

$app = App::get();
$context = $app->contexts->get(__DIR__);

$app->clientPackages
    ->add('tooltip', function (IvoPetkov\BearFrameworkAddons\ClientPackage $package) use ($context) {
        $package->addJSCode(include $context->dir . '/assets/tooltip.min.js.php');
        //$package->addJSCode(file_get_contents($context->dir . '/dev/tooltip.js'));
        $package->embedPackage('escapeKey');
        $package->get = 'return ivoPetkov.bearFrameworkAddons.tooltip';
    });
