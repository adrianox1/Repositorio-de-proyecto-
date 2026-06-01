<?php
ini_set('display_errors', '0');
error_reporting(E_ALL);

require_once __DIR__ . '/../includes/helpers.php';
require_once __DIR__ . '/../includes/db.php';

header('Content-Type: application/json; charset=utf-8');

// Validar sesión
$usuario = sesionActual();
if (!$usuario) {
    http_response_code(401);
    echo json_encode([
        "success" => false,
        "message" => "Debes iniciar sesión para solicitar una adopción."
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    try {
        $body      = bodyJSON();
        $mascotaId = (int)($body['mascota_id'] ?? 0);
        $mensaje   = trim($body['mensaje'] ?? '');

        if (!$mascotaId) {
            throw new Exception("ID de mascota requerido");
        }
        if (!$mensaje) {
            throw new Exception("El mensaje no puede estar vacío");
        }

        // Verificar existencia y disponibilidad de la mascota
        $sqlMascota = "SELECT id, nombre FROM mascotas WHERE id = " . (int)$mascotaId . " AND disponible = 1";
        $resMascota = $conexion->query($sqlMascota);
        if (!$resMascota || $resMascota->num_rows === 0) {
            throw new Exception("Mascota no encontrada o no disponible");
        }
        $mascota = $resMascota->fetch_assoc();

        // Verificar duplicados
        $sqlDup = "SELECT id FROM solicitudes WHERE mascota_id = " . (int)$mascotaId . " 
                   AND usuario_id = " . (int)$usuario['id'] . " AND estado = 'pendiente' LIMIT 1";
        $resDup = $conexion->query($sqlDup);
        if ($resDup && $resDup->num_rows > 0) {
            throw new Exception("Ya tienes una solicitud pendiente para esta mascota");
        }

        // Insertar la solicitud
        $sqlIns = "INSERT INTO solicitudes (mascota_id, usuario_id, mensaje, estado) 
                   VALUES (?, ?, ?, 'pendiente')";
        $stmt = $conexion->prepare($sqlIns);
        if (!$stmt) {
            throw new Exception("Error al preparar la inserción de solicitud");
        }

        $stmt->bind_param("iis", $mascotaId, $usuario['id'], $mensaje);
        if (!$stmt->execute()) {
            throw new Exception("Error al guardar la solicitud en la base de datos");
        }

        echo json_encode([
            "success" => true,
            "message" => "Solicitud de adopción enviada correctamente",
            "solicitud_id" => $conexion->insert_id,
            "mascota_nombre" => $mascota['nombre']
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
} elseif ($method === 'GET') {
    try {
        $sql = "SELECT s.id, s.mensaje, s.estado, s.creado_en,
                       m.nombre AS mascota_nombre, m.especie, m.foto_url
                FROM solicitudes s
                JOIN mascotas m ON m.id = s.mascota_id
                WHERE s.usuario_id = " . (int)$usuario['id'] . "
                ORDER BY s.creado_en DESC";
        
        $result = $conexion->query($sql);
        if (!$result) {
            throw new Exception("Error al consultar solicitudes: " . $conexion->error);
        }

        $solicitudes = [];
        while ($row = $result->fetch_assoc()) {
            $solicitudes[] = $row;
        }

        echo json_encode([
            "success" => true,
            "message" => "Solicitudes cargadas correctamente",
            "data" => $solicitudes
        ], JSON_UNESCAPED_UNICODE);
        exit;

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
} else {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Método no permitido"
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
