<?php
require_once __DIR__ . '/../includes/helpers.php';
require_once __DIR__ . '/../includes/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') error('Método no permitido', 405);

$especie = $_GET['especie'] ?? '';
$genero  = $_GET['genero']  ?? '';
$edad    = $_GET['edad']    ?? '';
$estado  = $_GET['estado']  ?? '';

$where  = ['1=1']; // Cambiado a 1=1 para permitir listar todas las mascotas (incluidas las que no están 'disponibles' pero están en evaluación/tratamiento para seguimiento)
$params = [];
$types  = '';

if ($especie && in_array($especie, ['perro', 'gato', 'otro'])) {
    $where[]  = 'especie = ?';
    $params[] = $especie;
    $types   .= 's';
}

if ($genero && in_array($genero, ['macho', 'hembra'])) {
    $where[]  = 'genero = ?';
    $params[] = $genero;
    $types   .= 's';
}

if ($estado && in_array($estado, ['evaluacion', 'tratamiento', 'recuperacion', 'disponible'])) {
    $where[]  = 'estado = ?';
    $params[] = $estado;
    $types   .= 's';
}

if ($edad === 'cachorro') {
    $where[] = 'edad_meses < 12';
} elseif ($edad === 'joven') {
    $where[] = 'edad_meses BETWEEN 12 AND 36';
} elseif ($edad === 'adulto') {
    $where[] = 'edad_meses > 36';
}

$sql  = 'SELECT * FROM mascotas WHERE ' . implode(' AND ', $where) . ' ORDER BY id ASC';
$stmt = $conexion->prepare($sql);

if ($params) {
    $stmt->bind_param($types, ...$params);
}

$stmt->execute();
$result   = $stmt->get_result();
$mascotas = [];

while ($row = $result->fetch_assoc()) {
    $row['id']         = (int)$row['id'];
    $row['edad_meses'] = (int)$row['edad_meses'];
    $row['disponible'] = (bool)$row['disponible'];
    $mascotas[]        = $row;
}

ok(['mascotas' => $mascotas, 'total' => count($mascotas)]);
?>
