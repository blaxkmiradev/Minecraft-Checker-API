<?php

$apiUrl = 'http://localhost:3000';

if (!isset($argv[1])) {
    echo "Usage: php php.php <username>\n";
    exit(1);
}

$username = $argv[1];
$url = $apiUrl . '/api/check/' . urlencode($username);

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 10,
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    $data = json_decode($response, true);
    echo "Player: {$username}\n";
    print_r($data);
} else {
    echo "Error checking {$username} (HTTP {$httpCode})\n";
    echo $response . "\n";
}