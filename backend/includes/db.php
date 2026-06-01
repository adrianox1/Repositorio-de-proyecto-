<?php
// Cargar variables de entorno desde el archivo .env si existe en la raíz
$envFile = __DIR__ . '/../../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $trimmedLine = trim($line);
        // Omitir comentarios
        if (strpos($trimmedLine, '#') === 0 || strpos($trimmedLine, ';') === 0) {
            continue;
        }
        
        // Extraer clave y valor
        if (strpos($trimmedLine, '=') !== false) {
            list($name, $value) = explode('=', $trimmedLine, 2);
            $name = trim($name);
            $value = trim($value);
            
            // Remover comillas opcionales de los extremos
            $value = trim($value, '"\'');
            
            putenv("{$name}={$value}");
            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
        }
    }
}

// Obtener parámetros de conexión, usando los valores por defecto del sistema si no están definidos
$host    = getenv('DB_HOST')     !== false ? getenv('DB_HOST')     : 'localhost';
$port    = getenv('DB_PORT')     !== false ? getenv('DB_PORT')     : '3306';
$user    = getenv('DB_USER')     !== false ? getenv('DB_USER')     : 'root';
$pass    = getenv('DB_PASSWORD') !== false ? getenv('DB_PASSWORD') : 'diego123';
$db      = getenv('DB_NAME')     !== false ? getenv('DB_NAME')     : 'waupiura';
$charset = getenv('DB_CHARSET')  !== false ? getenv('DB_CHARSET')  : 'utf8mb4';

// Crear la instancia de conexión con mysqli suprimiendo warnings para manejo de excepciones personalizado
$conexion = @new mysqli($host, $user, $pass, $db, (int)$port);

// Validar error de conexión
if ($conexion->connect_errno) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'ok'    => false,
        'error' => 'Conexion Fallida: ' . $conexion->connect_error
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$conexion->set_charset($charset);
?>
