<?php
require_once __DIR__ . '/../includes/helpers.php';

$usuario = sesionActual();
ok(['usuario' => $usuario]);
?>
