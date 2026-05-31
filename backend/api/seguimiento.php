<?php
require_once __DIR__ . '/../includes/helpers.php';
require_once __DIR__ . '/../includes/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') error('Método no permitido', 405);

$mascotaId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
if (!$mascotaId) error('ID de mascota requerido');

// Query mascota
$mStmt = $conexion->prepare('SELECT * FROM mascotas WHERE id = ? LIMIT 1');
$mStmt->bind_param('i', $mascotaId);
$mStmt->execute();
$mascota = $mStmt->get_result()->fetch_assoc();

if (!$mascota) error('Mascota no encontrada');

$mascota['id']         = (int)$mascota['id'];
$mascota['edad_meses'] = (int)$mascota['edad_meses'];
$mascota['disponible'] = (bool)$mascota['disponible'];

// Query seguimientos
$sStmt = $conexion->prepare('SELECT id, titulo, descripcion, estado, fecha FROM seguimientos WHERE mascota_id = ? ORDER BY fecha DESC, id DESC');
$sStmt->bind_param('i', $mascotaId);
$sStmt->execute();
$res = $sStmt->get_result();
$seguimientos = [];
while ($row = $res->fetch_assoc()) {
    $row['id'] = (int)$row['id'];
    $seguimientos[] = $row;
}

ok([
    'mascota' => $mascota,
    'seguimientos' => $seguimientos
]);
?>
