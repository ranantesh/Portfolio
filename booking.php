<?php
/**
 * Professional PHP Booking Handler for Portfolio Website
 * Handles secure, AJAX-based free call booking requests.
 */

// Suppress warnings to ensure valid JSON response
error_reporting(0);
ini_set('display_errors', 0);

// Set JSON header response
header('Content-Type: application/json; charset=UTF-8');

// Target recipient email address
$recipient_email = "contact@ranantesh.in";

// Verify Request Method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'status' => 'error',
        'message' => 'Method Not Allowed.'
    ]);
    exit;
}

// 1. Retrieve and Sanitize Form Inputs
$name  = isset($_POST['name']) ? strip_tags(trim($_POST['name'])) : '';
$email = isset($_POST['email']) ? filter_var(trim($_POST['email']), FILTER_SANITIZE_EMAIL) : '';
$date  = isset($_POST['date']) ? strip_tags(trim($_POST['date'])) : '';
$time  = isset($_POST['time']) ? strip_tags(trim($_POST['time'])) : '';
$notes = isset($_POST['notes']) ? strip_tags(trim($_POST['notes'])) : '';

// 2. Validation
if (empty($name) || empty($email) || empty($date) || empty($time) || empty($notes)) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'All fields (Name, Email, Date, Time, Project details) are required.'
    ]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Please provide a valid email address.'
    ]);
    exit;
}

// 3. Store Booking in Database (SQLite)
try {
    $dbPath = __DIR__ . '/database/portfolio.sqlite';
    $pdo = new PDO('sqlite:' . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Create table if it doesn't exist
    $pdo->exec("CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        booking_date TEXT NOT NULL,
        booking_time TEXT NOT NULL,
        notes TEXT,
        status TEXT DEFAULT 'Pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");
    
    // Insert new booking securely using prepared statements
    $stmt = $pdo->prepare("INSERT INTO bookings (name, email, booking_date, booking_time, notes) VALUES (:name, :email, :date, :time, :notes)");
    $stmt->execute([
        ':name' => $name,
        ':email' => $email,
        ':date' => $date,
        ':time' => $time,
        ':notes' => $notes
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'System error saving booking. Please try again later.'
    ]);
    exit;
}

echo json_encode([
    'status' => 'success',
    'message' => 'Booking received successfully!',
    'datetime' => $date . ' at ' . $time
]);
exit;
