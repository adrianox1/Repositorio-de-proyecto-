<?php
require_once __DIR__ . '/../includes/helpers.php';
require_once __DIR__ . '/../includes/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') error('Método no permitido', 405);

$body   = bodyJSON();
$nombre = trim($body['nombre'] ?? '');
$correo = trim(strtolower($body['correo'] ?? ''));
$contra = $body['contrasena'] ?? '';

if (strlen($nombre) < 3) error('El nombre debe tener al menos 3 caracteres');
if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) error('Correo no válido');
if (strlen($contra) < 6) error('La contraseña debe tener al menos 6 caracteres');

$check = $conexion->prepare('SELECT id FROM usuarios WHERE correo = ? LIMIT 1');
$check->bind_param('s', $correo);
$check->execute();
if ($check->get_result()->fetch_assoc()) error('Ya existe una cuenta con ese correo');

$ins = $conexion->prepare('INSERT INTO usuarios (nombre, correo, contrasena) VALUES (?, ?, ?)');
$ins->bind_param('sss', $nombre, $correo, $contra);
$ins->execute();
$id = $conexion->insert_id;

$_SESSION['usuario'] = [
    'id'     => $id,
    'nombre' => $nombre,
    'correo' => $correo,
    'rol'    => 'usuario',
];

ok(['usuario' => $_SESSION['usuario']]);
?>
