<?php
require_once __DIR__ . '/../includes/helpers.php';
require_once __DIR__ . '/../includes/db.php';

requiereAuth();
$usuario = sesionActual();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body      = bodyJSON();
    $mascotaId = (int)($body['mascota_id'] ?? 0);
    $mensaje   = trim($body['mensaje'] ?? '');

    if (!$mascotaId) error('ID de mascota requerido');
    if (!$mensaje)   error('El mensaje no puede estar vacío');

    $m = $conexion->prepare('SELECT id, nombre FROM mascotas WHERE id = ? AND disponible = 1');
    $m->bind_param('i', $mascotaId);
    $m->execute();
    $mascota = $m->get_result()->fetch_assoc();
    if (!$mascota) error('Mascota no encontrada o no disponible');

    $dup = $conexion->prepare('SELECT id FROM solicitudes WHERE mascota_id = ? AND usuario_id = ? AND estado = "pendiente" LIMIT 1');
    $dup->bind_param('ii', $mascotaId, $usuario['id']);
    $dup->execute();
    if ($dup->get_result()->fetch_assoc()) error('Ya tienes una solicitud pendiente para esta mascota');

    $ins = $conexion->prepare('INSERT INTO solicitudes (mascota_id, usuario_id, mensaje) VALUES (?, ?, ?)');
    $ins->bind_param('iis', $mascotaId, $usuario['id'], $mensaje);
    $ins->execute();

    ok([
        'solicitud_id'   => $conexion->insert_id,
        'mascota_nombre' => $mascota['nombre'],
        'mensaje'        => 'Solicitud enviada con éxito',
    ]);

} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $conexion->prepare(
        'SELECT s.id, s.mensaje, s.estado, s.creado_en,
                m.nombre AS mascota_nombre, m.especie, m.foto_url
         FROM solicitudes s
         JOIN mascotas m ON m.id = s.mascota_id
         WHERE s.usuario_id = ?
         ORDER BY s.creado_en DESC'
    );
    $stmt->bind_param('i', $usuario['id']);
    $stmt->execute();
    $result      = $stmt->get_result();
    $solicitudes = [];
    while ($row = $result->fetch_assoc()) {
        $solicitudes[] = $row;
    }
    ok(['solicitudes' => $solicitudes]);

} else {
    error('Método no permitido', 405);
}
?>
