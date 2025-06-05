<?php
// proxy.php
$source = file_get_contents('https://shoof.alkass.net/live?ch=one');

// استخراج رابط .m3u8 من الصفحة (مثلاً باستخدام regex)
preg_match('/https:\/\/.*?\.m3u8.*?"/', $source, $matches);

if (isset($matches[0])) {
    $url = rtrim($matches[0], '"'); // إزالة " من النهاية
    header("Location: $url");
    exit;
}
