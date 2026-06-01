<?php
session_start();

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function responder($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function error($msg, $code = 400) {
    responder(['ok' => false, 'error' => $msg], $code);
}

function ok($data = []) {
    responder(array_merge(['ok' => true], $data));
}

function sesionActual() {
    return $_SESSION['usuario'] ?? null;
}

function requiereAuth() {
    if (!sesionActual()) {
        error('No autenticado', 401);
    }
}

function bodyJSON() {
    $raw = file_get_contents('php://input');
    if (!$raw) return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}
?>
