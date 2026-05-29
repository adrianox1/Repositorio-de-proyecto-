<?php
$server = "localhost";
$user   = "root";
$pass   = "diego123";
$db     = "waupiura";

$conexion = new mysqli($server, $user, $pass, $db);

if ($conexion->connect_errno) {
    die(json_encode(['ok' => false, 'error' => 'Conexion Fallida: ' . $conexion->connect_errno]));
}

$conexion->set_charset("utf8mb4");
?>
