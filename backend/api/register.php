<?php
ini_set('display_errors', '0');
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../includes/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Método no permitido"
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $raw = file_get_contents('php://input');
    $body = json_decode($raw, true);

    if (!$body) {
        throw new Exception("Datos de entrada no válidos.");
    }

    $nombre = trim($body['nombre'] ?? '');
    $correo = trim(strtolower($body['correo'] ?? ''));
    $contrasena = $body['contrasena'] ?? '';

    if (empty($nombre)) {
        throw new Exception("El nombre es obligatorio.");
    }
    if (empty($correo)) {
        throw new Exception("El correo es obligatorio.");
    }
    if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
        throw new Exception("El formato del correo no es válido.");
    }
    if (empty($contrasena)) {
        throw new Exception("La contraseña es obligatoria.");
    }
    if (strlen($contrasena) < 6) {
        throw new Exception("La contraseña debe tener al menos 6 caracteres.");
    }

    // Verificar si el correo ya existe
    $sqlCheck = "SELECT id FROM usuarios WHERE correo = '" . $conexion->real_escape_string($correo) . "' LIMIT 1";
    $resCheck = $conexion->query($sqlCheck);
    if ($resCheck && $resCheck->num_rows > 0) {
        throw new Exception("Este correo ya está registrado.");
    }

    // Insertar en la tabla usuarios en texto plano
    $sqlIns = "INSERT INTO usuarios (nombre, correo, contrasena, rol) VALUES (?, ?, ?, 'usuario')";
    $stmt = $conexion->prepare($sqlIns);
    if (!$stmt) {
        throw new Exception("Error al preparar el registro del usuario.");
    }

    $stmt->bind_param("sss", $nombre, $correo, $contrasena);
    if (!$stmt->execute()) {
        throw new Exception("Error al guardar el usuario en la base de datos.");
    }

    echo json_encode([
        "success" => true,
        "message" => "Usuario registrado correctamente"
    ], JSON_UNESCAPED_UNICODE);
    exit;

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
