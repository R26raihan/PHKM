<?php
header("Access-Control-Allow-Origin: *"); 
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

include "db.php";

$data = json_decode(file_get_contents("php://input"), true);

if (isset($data["name"], $data["email"], $data["password"])) {
    $name = $data["name"];
    $email = $data["email"];
    $password = password_hash($data["password"], PASSWORD_BCRYPT);

    $sql_check = "SELECT * FROM users WHERE email = ?";
    $stmt_check = $conn->prepare($sql_check);
    $stmt_check->bind_param("s", $email);
    $stmt_check->execute();
    $result_check = $stmt_check->get_result();

    if ($result_check->num_rows > 0) {
        echo json_encode(["success" => false, "message" => "Email sudah digunakan!"]);
    } else {
        $sql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sss", $name, $email, $password);

        if ($stmt->execute()) {
            http_response_code(201);
            echo json_encode(["success" => true, "message" => "Registrasi berhasil!"]);
        } else {
            echo json_encode(["success" => false, "message" => "Gagal mendaftar!"]);
        }
        $stmt->close();
    }
    $stmt_check->close();
} else {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Data tidak lengkap!"]);
}

$conn->close();
?>