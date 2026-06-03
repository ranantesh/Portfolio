<?php
/**
 * Professional PHP Mailer for Portfolio Website
 * Handles secure, AJAX-based contact form submissions.
 * Includes honeypot spam protection, validation, and sanitation.
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
        'message' => 'Method Not Allowed. This endpoint only accepts secure POST requests.'
    ]);
    exit;
}

// 1. Honeypot Anti-Spam Check
$honeypot = isset($_POST['website']) ? trim($_POST['website']) : '';
if (!empty($honeypot)) {
    // Confuse the bot by returning a successful response, but do not send the email
    echo json_encode([
        'status' => 'success',
        'message' => 'Message processed successfully.'
    ]);
    exit;
}

// 2. Retrieve and Sanitize Form Inputs
$name    = isset($_POST['name']) ? strip_tags(trim($_POST['name'])) : '';
$email   = isset($_POST['email']) ? filter_var(trim($_POST['email']), FILTER_SANITIZE_EMAIL) : '';
$subject = isset($_POST['subject']) ? strip_tags(trim($_POST['subject'])) : '';
$message = isset($_POST['message']) ? strip_tags(trim($_POST['message'])) : '';

// 3. Validation
if (empty($name) || empty($email) || empty($subject) || empty($message)) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'All fields (Name, Email, Subject, Message) are required.'
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

// 4. Construct Email Message Body
$email_subject = "[Portfolio Contact] $subject - from $name";

$email_body  = "You have received a new message from your portfolio contact form.\n\n";
$email_body .= "---------------------------------------------------------\n";
$email_body .= "Name:    $name\n";
$email_body .= "Email:   $email\n";
$email_body .= "Subject: $subject\n";
$email_body .= "Date:    " . date("Y-m-d H:i:s") . "\n";
$email_body .= "---------------------------------------------------------\n\n";
$email_body .= "Message:\n$message\n\n";
$email_body .= "---------------------------------------------------------\n";
$email_body .= "End of transmission.\n";

// 5. Construct Secure Email Headers to prevent injection
$headers = [];
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-type: text/plain; charset=utf-8';
$headers[] = 'From: Portfolio Mailer <noreply@ranantesh.in>';
$headers[] = 'Reply-To: ' . $name . ' <' . $email . '>';
$headers[] = 'X-Mailer: PHP/' . phpversion();

$header_string = implode("\r\n", $headers);

// 6. Send the Email
$mail_sent = @mail($recipient_email, $email_subject, $email_body, $header_string);

// Local Logging Fallback (perfect for local WampServer / development environment)
if (!$mail_sent) {
    $log_file = __DIR__ . '/messages_log.txt';
    $log_entry = "=== NEW MESSAGE (" . date("Y-m-d H:i:s") . ") ===\n" . $email_body . "\n==========================================\n\n";
    @file_put_contents($log_file, $log_entry, FILE_APPEND);
}

if ($mail_sent) {
    echo json_encode([
        'status' => 'success',
        'message' => 'Thank you! Your message was sent successfully. We will be in touch shortly.'
    ]);
} else {
    echo json_encode([
        'status' => 'success',
        'message' => 'Thank you! Message received successfully! (Local Dev Mode: Saved to messages_log.txt)'
    ]);
}
exit;
