<?php
/**
 * Professional SaaS Booking & Consultation API Handler
 * Manages booking creation, sqlite storage, and status verification.
 */

error_reporting(0);
ini_set('display_errors', 0);

header('Content-Type: application/json; charset=UTF-8');

$recipient_email = "contact@ranantesh.in";
$dbPath = __DIR__ . '/database/portfolio.sqlite';

// Ensure Database Directory Exists
if (!file_exists(__DIR__ . '/database')) {
    mkdir(__DIR__ . '/database', 0755, true);
}

try {
    $pdo = new PDO('sqlite:' . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Initialize Schema with all required SaaS booking fields
    $pdo->exec("CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_ref TEXT UNIQUE,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        service_category TEXT DEFAULT 'Website Development',
        package_tier TEXT DEFAULT 'Custom Scope',
        estimated_cost TEXT DEFAULT 'Custom Quote',
        selected_addons TEXT DEFAULT '',
        booking_date TEXT NOT NULL,
        booking_time TEXT NOT NULL,
        notes TEXT,
        status TEXT DEFAULT 'Pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    // Auto-migrate schema for existing SQLite databases missing newer columns
    $columns = $pdo->query("PRAGMA table_info(bookings)")->fetchAll(PDO::FETCH_ASSOC);
    $colNames = array_column($columns, 'name');

    if (!in_array('booking_ref', $colNames)) {
        $pdo->exec("ALTER TABLE bookings ADD COLUMN booking_ref TEXT");
    }
    if (!in_array('phone', $colNames)) {
        $pdo->exec("ALTER TABLE bookings ADD COLUMN phone TEXT");
    }
    if (!in_array('service_category', $colNames)) {
        $pdo->exec("ALTER TABLE bookings ADD COLUMN service_category TEXT DEFAULT 'Website Development'");
    }
    if (!in_array('package_tier', $colNames)) {
        $pdo->exec("ALTER TABLE bookings ADD COLUMN package_tier TEXT DEFAULT 'Custom Scope'");
    }
    if (!in_array('estimated_cost', $colNames)) {
        $pdo->exec("ALTER TABLE bookings ADD COLUMN estimated_cost TEXT DEFAULT 'Custom Quote'");
    }
    if (!in_array('selected_addons', $colNames)) {
        $pdo->exec("ALTER TABLE bookings ADD COLUMN selected_addons TEXT DEFAULT ''");
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database initialization error: ' . $e->getMessage()
    ]);
    exit;
}

// -------------------------------------------------------------
// GET Request: Lookup Booking Status by Reference or Email
// -------------------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = isset($_GET['action']) ? trim($_GET['action']) : '';
    $query = isset($_GET['ref']) ? trim($_GET['ref']) : '';

    if ($action === 'lookup' && !empty($query)) {
        try {
            $stmt = $pdo->prepare("SELECT booking_ref, name, service_category, package_tier, estimated_cost, selected_addons, booking_date, booking_time, status, created_at FROM bookings WHERE booking_ref = :query OR email = :query ORDER BY id DESC LIMIT 1");
            $stmt->execute([':query' => $query]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($result) {
                echo json_encode([
                    'status' => 'success',
                    'booking' => $result
                ]);
            } else {
                http_response_code(404);
                echo json_encode([
                    'status' => 'error',
                    'message' => 'No booking found matching reference or email.'
                ]);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Lookup query failed.']);
        }
        exit;
    }

    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid GET request.']);
    exit;
}

// -------------------------------------------------------------
// POST Request: Save New SaaS Booking
// -------------------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'status' => 'error',
        'message' => 'Method Not Allowed.'
    ]);
    exit;
}

// Retrieve & Sanitize Inputs
$name = isset($_POST['name']) ? strip_tags(trim($_POST['name'])) : '';
$email = isset($_POST['email']) ? filter_var(trim($_POST['email']), FILTER_SANITIZE_EMAIL) : '';
$phone = isset($_POST['phone']) ? strip_tags(trim($_POST['phone'])) : '';
$service_category = isset($_POST['service_category']) ? strip_tags(trim($_POST['service_category'])) : 'Website Development';
$package_tier = isset($_POST['package_tier']) ? strip_tags(trim($_POST['package_tier'])) : 'Custom Scope';
$estimated_cost = isset($_POST['estimated_cost']) ? strip_tags(trim($_POST['estimated_cost'])) : 'Custom Quote';
$selected_addons = isset($_POST['selected_addons']) ? strip_tags(trim($_POST['selected_addons'])) : '';
$date = isset($_POST['date']) ? strip_tags(trim($_POST['date'])) : '';
$time = isset($_POST['time']) ? strip_tags(trim($_POST['time'])) : '';
$notes = isset($_POST['notes']) ? strip_tags(trim($_POST['notes'])) : '';

// Generate Booking Ref ID (e.g. REF-84920)
$booking_ref = 'REF-' . strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 6));

// Validation
if (empty($name) || empty($email) || empty($date) || empty($time)) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Required fields (Name, Email, Date, Time) cannot be empty.'
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

// Save to SQLite
try {
    $stmt = $pdo->prepare("INSERT INTO bookings (
        booking_ref, name, email, phone, service_category, package_tier, estimated_cost, selected_addons, booking_date, booking_time, notes, status
    ) VALUES (
        :booking_ref, :name, :email, :phone, :service_category, :package_tier, :estimated_cost, :selected_addons, :date, :time, :notes, 'Pending'
    )");

    $stmt->execute([
        ':booking_ref' => $booking_ref,
        ':name' => $name,
        ':email' => $email,
        ':phone' => $phone,
        ':service_category' => $service_category,
        ':package_tier' => $package_tier,
        ':estimated_cost' => $estimated_cost,
        ':selected_addons' => $selected_addons,
        ':date' => $date,
        ':time' => $time,
        ':notes' => $notes
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to persist booking in database. Details: ' . $e->getMessage()
    ]);
    exit;
}

// Send Success Payload
echo json_encode([
    'status' => 'success',
    'message' => 'Your service consultation has been confirmed!',
    'booking_ref' => $booking_ref,
    'service' => $service_category,
    'package' => $package_tier,
    'cost' => $estimated_cost,
    'datetime' => $date . ' at ' . $time
]);
exit;
