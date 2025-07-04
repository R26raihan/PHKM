<?php
$host = "localhost";
$user = "root";
$pass = "";
$db_name = "PHKM_DB";

$conn = new mysqli($host, $user, $pass, $db_name);

if ($conn->connect_error) {
    die("Koneksi gagal: " . $conn->connect_error);
}
?>
