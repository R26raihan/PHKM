<?php
header("Access-Control-Allow-Origin: *"); // Ubah ke port frontend jika perlu
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

include "db.php";

$data = json_decode(file_get_contents("php://input"), true);

if (isset($data["email"], $data["password"])) {
    $email = $data["email"];
    $password = $data["password"];

    $sql = "SELECT * FROM users WHERE email = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();

    if ($user && password_verify($password, $user["password"])) {
        echo json_encode([
            "success" => true,
            "message" => "Login berhasil!",
            "user" => $user
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Email atau password salah!"
        ]);
    }
    $stmt->close();
} else {
    echo json_encode([
        "success" => false,
        "message" => "Data tidak lengkap!"
    ]);
}

$conn->close();
?>