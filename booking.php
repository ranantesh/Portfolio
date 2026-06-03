<?php
/**
 * Professional PHP Booking Handler for Portfolio Website
 * Handles secure, AJAX-based free call booking requests.
 */

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

// 3. Construct Email Message Body
$email_subject = "[Free Call Booking] Alignment Session with $name";

$email_body  = "You have received a new free call booking request from your portfolio.\n\n";
$email_body .= "---------------------------------------------------------\n";
$email_body .= "Client Name:  $name\n";
$email_body .= "Client Email: $email\n";
$email_body .= "Meeting Date: $date\n";
$email_body .= "Meeting Time: $time\n";
$email_body .= "Booking Date: " . date("Y-m-d H:i:s") . "\n";
$email_body .= "---------------------------------------------------------\n\n";
$email_body .= "Project & Brand Notes:\n$notes\n\n";
$email_body .= "---------------------------------------------------------\n";
$email_body .= "End of transmission.\n";

// 4. Construct Secure Email Headers to prevent injection
$headers = [];
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-type: text/plain; charset=utf-8';
$headers[] = 'From: Portfolio Booking <noreply@ranantesh.in>';
$headers[] = 'Reply-To: ' . $name . ' <' . $email . '>';
$headers[] = 'X-Mailer: PHP/' . phpversion();

$header_string = implode("\r\n", $headers);

// 5. Send the Email
$mail_sent = @mail($recipient_email, $email_subject, $email_body, $header_string);

// Local Logging Fallback
$log_file = __DIR__ . '/bookings_log.txt';
$log_entry = "=== NEW BOOKING (" . date("Y-m-d H:i:s") . ") ===\n" . $email_body . "\n==========================================\n\n";
@file_put_contents($log_file, $log_entry, FILE_APPEND);

echo json_encode([
    'status' => 'success',
    'message' => 'Booking received successfully!',
    'datetime' => $date . ' at ' . $time
]);
exit;
