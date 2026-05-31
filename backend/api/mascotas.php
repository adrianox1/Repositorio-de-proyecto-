<?php
ini_set('display_errors', '0');
error_reporting(E_ALL);

require_once __DIR__ . '/../includes/helpers.php';
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
        header('Content-Type: application/json; charset=utf-8');

        // Validar si el usuario está logueado en la sesión
        $usuario = sesionActual();
        if (!$usuario) {
            http_response_code(200); // Retornar 200 con success: false para compatibilidad directa con AJAX
            echo json_encode([
                "success" => false,
                "message" => "Debes iniciar sesión para reportar una mascota."
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        // Obtener el nombre del responsable de la sesión activa
        $responsable = $usuario['nombre'] ?? 'Usuario WauPiura';

        $raw = file_get_contents('php://input');
        $body = json_decode($raw, true);

        if (!$body) {
            echo json_encode([
                "success" => false,
                "message" => "Completa los campos obligatorios."
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $nombre        = trim($body['nombre'] ?? '');
        $especie       = trim(strtolower($body['especie'] ?? ''));
        $genero        = trim(strtolower($body['genero'] ?? ''));
        $lugar_rescate = trim($body['lugar_rescate'] ?? '');
        $estado        = trim(strtolower($body['estado'] ?? ''));
        $condicion     = trim($body['condicion'] ?? '');
        $descripcion   = trim($body['descripcion'] ?? '');

        // Campos obligatorios requeridos
        if (empty($nombre) || empty($especie) || empty($genero) || empty($lugar_rescate) || empty($estado) || empty($condicion) || empty($descripcion)) {
            echo json_encode([
                "success" => false,
                "message" => "Completa los campos obligatorios."
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        // Convalidar valores admitidos
        if (!in_array($especie, ['perro', 'gato', 'otro'])) {
            $especie = 'otro';
        }
        if (!in_array($genero, ['macho', 'hembra'])) {
            $genero = 'macho';
        }
        if (!in_array($estado, ['evaluacion', 'tratamiento', 'recuperacion', 'disponible'])) {
            $estado = 'evaluacion';
        }

        // Asignar opcionales y valores por defecto
        $raza = trim($body['raza'] ?? '');
        if ($raza === '') {
            $raza = 'No especificada';
        }

        $edad_meses = isset($body['edad_meses']) && $body['edad_meses'] !== '' ? (int)$body['edad_meses'] : 0;
        if ($edad_meses < 0) {
            $edad_meses = 0;
        }

        $foto_url = trim($body['foto_url'] ?? '');
        if ($foto_url === '') {
            $foto_url = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&h=280&fit=crop';
        }

        // Insertar en la tabla mascotas
        $sql = "INSERT INTO mascotas (nombre, especie, genero, raza, edad_meses, descripcion, condicion, responsable, lugar_rescate, foto_url, estado, disponible) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)";

        $stmt = $conexion->prepare($sql);
        if (!$stmt) {
            throw new Exception("Error al preparar la base de datos.");
        }

        $stmt->bind_param("ssssissssss", $nombre, $especie, $genero, $raza, $edad_meses, $descripcion, $condicion, $responsable, $lugar_rescate, $foto_url, $estado);
        
        if (!$stmt->execute()) {
            throw new Exception("Error al guardar en la base de datos.");
        }

        $mascota_id = $stmt->insert_id;

        // Crear automáticamente el seguimiento inicial
        $sqlSeg = "INSERT INTO seguimientos (mascota_id, titulo, descripcion, estado, fecha) VALUES (?, 'Caso registrado', ?, ?, CURRENT_TIMESTAMP)";
        $stmtSeg = $conexion->prepare($sqlSeg);
        if (!$stmtSeg) {
            throw new Exception("Error al preparar el historial clínico.");
        }
        $stmtSeg->bind_param("iss", $mascota_id, $descripcion, $estado);
        if (!$stmtSeg->execute()) {
            throw new Exception("Error al guardar el historial clínico.");
        }

        // Responder JSON de éxito
        echo json_encode([
            "success" => true,
            "message" => "Mascota registrada correctamente",
            "data" => [
                "id" => $mascota_id
            ]
        ], JSON_UNESCAPED_UNICODE);
        exit;

    } catch (Exception $e) {
        http_response_code(200);
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
