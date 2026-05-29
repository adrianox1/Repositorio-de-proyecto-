<?php
ini_set('display_errors', '0');
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../includes/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $especie = $_GET['especie'] ?? '';
        $genero  = $_GET['genero']  ?? '';
        $edad    = $_GET['edad']    ?? '';
        $estado  = $_GET['estado']  ?? '';

        $where = ['1=1'];

        if ($especie && in_array($especie, ['perro', 'gato', 'otro'])) {
            $where[] = "especie = '" . $conexion->real_escape_string($especie) . "'";
        }

        if ($genero && in_array($genero, ['macho', 'hembra'])) {
            $where[] = "genero = '" . $conexion->real_escape_string($genero) . "'";
        }

        if ($estado && in_array($estado, ['evaluacion', 'tratamiento', 'recuperacion', 'disponible'])) {
            $where[] = "estado = '" . $conexion->real_escape_string($estado) . "'";
        }

        if ($edad === 'cachorro') {
            $where[] = 'edad_meses < 12';
        } elseif ($edad === 'joven') {
            $where[] = 'edad_meses BETWEEN 12 AND 36';
        } elseif ($edad === 'adulto') {
            $where[] = 'edad_meses > 36';
        }

        $sql = 'SELECT * FROM mascotas WHERE ' . implode(' AND ', $where) . ' ORDER BY id ASC';
        $result = $conexion->query($sql);

        if (!$result) {
            throw new Exception("Error en la consulta: " . $conexion->error);
        }

        $mascotas = [];
        while ($row = $result->fetch_assoc()) {
            $row['id']         = (int)$row['id'];
            $row['edad_meses'] = (int)$row['edad_meses'];
            $row['disponible'] = (bool)$row['disponible'];
            $mascotas[]        = $row;
        }

        echo json_encode([
            "success" => true,
            "message" => "Mascotas cargadas correctamente",
            "data" => $mascotas
        ], JSON_UNESCAPED_UNICODE);
        exit;

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "No se pudieron cargar las mascotas"
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
} elseif ($method === 'POST') {
    try {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);

        if (!$data) {
            throw new Exception("Datos de entrada no válidos");
        }

        $nombre        = $data['nombre'] ?? 'Rescatado';
        $especie       = $data['especie'] ?? 'otro';
        $genero        = $data['genero'] ?? 'macho';
        $raza          = $data['raza'] ?? 'Mestizo';
        $edad_meses    = isset($data['edad_meses']) ? (int)$data['edad_meses'] : 6;
        $descripcion   = $data['descripcion'] ?? '';
        $condicion     = $data['condicion'] ?? '';
        $responsable   = $data['responsable'] ?? '';
        $lugar_rescate = $data['lugar_rescate'] ?? '';
        $foto_url      = $data['foto_url'] ?? '';

        if (!in_array($especie, ['perro', 'gato', 'otro'])) $especie = 'otro';
        if (!in_array($genero, ['macho', 'hembra'])) $genero = 'macho';

        $sql = "INSERT INTO mascotas (nombre, especie, genero, raza, edad_meses, descripcion, condicion, responsable, lugar_rescate, foto_url, estado, disponible) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'evaluacion', 1)";

        $stmt = $conexion->prepare($sql);
        if (!$stmt) {
            throw new Exception("Error al preparar inserción: " . $conexion->error);
        }

        $stmt->bind_param("ssssisssss", $nombre, $especie, $genero, $raza, $edad_meses, $descripcion, $condicion, $responsable, $lugar_rescate, $foto_url);
        
        if (!$stmt->execute()) {
            throw new Exception("Error al insertar mascota: " . $stmt->error);
        }

        $mascota_id = $stmt->insert_id;

        echo json_encode([
            "success" => true,
            "message" => "Mascota registrada exitosamente",
            "mascota_id" => $mascota_id
        ], JSON_UNESCAPED_UNICODE);
        exit;

    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Error al registrar la mascota: " . $e->getMessage()
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
