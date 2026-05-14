<?php
require_once __DIR__ . '/../includes/helpers.php';
require_once __DIR__ . '/../includes/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') error('Método no permitido', 405);

$body   = bodyJSON();
$correo = trim(strtolower($body['correo'] ?? ''));
$contra = $body['contrasena'] ?? '';

if (!$correo || !$contra) error('Correo y contraseña son requeridos');

$stmt = $conexion->prepare('SELECT * FROM usuarios WHERE correo = ? LIMIT 1');
$stmt->bind_param('s', $correo);
$stmt->execute();
$user = $stmt->get_result()->fetch_assoc();

if (!$user || $user['contrasena'] !== $contra) {
    error('Correo o contraseña incorrectos');
}

$_SESSION['usuario'] = [
    'id'     => $user['id'],
    'nombre' => $user['nombre'],
    'correo' => $user['correo'],
    'rol'    => $user['rol'],
];

ok(['usuario' => $_SESSION['usuario']]);
?>
