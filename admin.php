<?php
session_start();

$ADMIN_PASSWORD = 'admin';
$dbPath = __DIR__ . '/database/portfolio.sqlite';

// Authentication
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['password'])) {
    if ($_POST['password'] === $ADMIN_PASSWORD) {
        $_SESSION['admin_logged_in'] = true;
        header("Location: admin.php");
        exit;
    } else {
        $login_error = "Invalid administrator password.";
    }
}

if (isset($_GET['logout'])) {
    session_destroy();
    header("Location: admin.php");
    exit;
}

$is_logged_in = isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true;

$bookings = [];
$stats = [
    'total' => 0,
    'pending' => 0,
    'completed' => 0,
    'categories' => []
];

if ($is_logged_in) {
    try {
        $pdo = new PDO('sqlite:' . $dbPath);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        // Ensure Table & Schema Columns Exist
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

        // Actions: Complete or Delete
        if (isset($_POST['action']) && isset($_POST['id'])) {
            $id = (int)$_POST['id'];
            if ($_POST['action'] === 'complete') {
                $stmt = $pdo->prepare("UPDATE bookings SET status = 'Completed' WHERE id = :id");
                $stmt->execute([':id' => $id]);
            } elseif ($_POST['action'] === 'delete') {
                $stmt = $pdo->prepare("DELETE FROM bookings WHERE id = :id");
                $stmt->execute([':id' => $id]);
            }
            header("Location: admin.php");
            exit;
        }

        // Fetch Stats
        $stats['total'] = $pdo->query("SELECT COUNT(*) FROM bookings")->fetchColumn();
        $stats['pending'] = $pdo->query("SELECT COUNT(*) FROM bookings WHERE status = 'Pending'")->fetchColumn();
        $stats['completed'] = $pdo->query("SELECT COUNT(*) FROM bookings WHERE status = 'Completed'")->fetchColumn();

        // Fetch All Bookings
        $stmt = $pdo->query("SELECT * FROM bookings ORDER BY created_at DESC");
        $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);

    } catch (PDOException $e) {
        $db_error = "Database Connection Error: " . $e->getMessage();
    }
}
?>
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SaaS Control Center | Ranantesh Solutions</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/style.css">
    <style>
        body { background: #080c14; color: #f1f5f9; font-family: 'Inter', sans-serif; padding: 30px 15px; }
        .admin-wrapper { max-width: 1200px; margin: 0 auto; }
        .glass-card { background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255,255,255,0.08); backdrop-filter: blur(16px); border-radius: 16px; padding: 25px; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
        .login-box { max-width: 420px; margin: 100px auto; text-align: center; }
        .admin-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 20px; }
        .admin-title { font-family: 'Outfit', sans-serif; font-size: 1.8rem; font-weight: 700; background: linear-gradient(135deg, #a855f7, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric-card { background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(255,255,255,0.06); padding: 20px; border-radius: 12px; }
        .metric-val { font-size: 2.2rem; font-family: 'Outfit', sans-serif; font-weight: 800; color: #60a5fa; margin-top: 5px; }
        .metric-label { font-size: 0.85rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
        
        .controls-row { display: flex; gap: 15px; flex-wrap: wrap; margin-bottom: 20px; justify-content: space-between; align-items: center; }
        .search-input { background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 10px 16px; border-radius: 8px; font-size: 0.9rem; width: 100%; max-width: 320px; }
        .search-input:focus { outline: none; border-color: #8b5cf6; }

        .table-responsive { overflow-x: auto; }
        .admin-table { width: 100%; border-collapse: collapse; text-align: left; }
        .admin-table th, .admin-table td { padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 0.9rem; }
        .admin-table th { font-family: 'Outfit', sans-serif; color: #94a3b8; font-weight: 600; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; background: rgba(15, 23, 42, 0.8); }
        .admin-table tr:hover { background: rgba(255,255,255,0.02); }

        .badge-ref { font-family: monospace; font-size: 0.82rem; background: rgba(139, 92, 246, 0.15); color: #c084fc; border: 1px solid rgba(139, 92, 246, 0.3); padding: 3px 8px; border-radius: 4px; display: inline-block; }
        .badge-status { padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
        .status-pending { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }
        .status-completed { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }

        .btn-action { padding: 6px 12px; font-size: 0.8rem; border-radius: 6px; border: none; cursor: pointer; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s; }
        .btn-wa { background: rgba(37, 211, 102, 0.15); color: #25d366; border: 1px solid rgba(37, 211, 102, 0.3); }
        .btn-wa:hover { background: #25d366; color: #000; }
        .btn-done { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
        .btn-done:hover { background: #10b981; color: #fff; }
        .btn-del { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
        .btn-del:hover { background: #ef4444; color: #fff; }
    </style>
</head>
<body>

<div class="admin-wrapper">
    <?php if (!$is_logged_in): ?>
        <div class="glass-card login-box">
            <h2 style="font-family:'Outfit'; margin-bottom: 10px;">SaaS Control Access</h2>
            <p style="color: #94a3b8; font-size: 0.9rem; margin-bottom: 25px;">Enter administrator security code to access booking leads & management portal.</p>
            
            <?php if (isset($login_error)): ?>
                <div style="background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #f87171; padding: 10px; border-radius: 8px; font-size: 0.85rem; margin-bottom: 20px;">
                    <?php echo htmlspecialchars($login_error); ?>
                </div>
            <?php endif; ?>

            <form method="POST" action="admin.php">
                <input type="password" name="password" placeholder="Enter Admin Password" required class="search-input" style="max-width: 100%; margin-bottom: 15px;">
                <button type="submit" class="btn btn-primary" style="width: 100%; padding: 12px;">Authenticate Control Portal</button>
            </form>
        </div>
    <?php else: ?>

        <div class="admin-header">
            <div>
                <h1 class="admin-title">SaaS Booking Management Console</h1>
                <p style="color:#94a3b8; font-size:0.9rem; margin-top:4px;">Real-time consultation inquiries & service scope requests</p>
            </div>
            <a href="admin.php?logout=1" class="btn-action btn-del" style="padding: 10px 16px;">Logout Console</a>
        </div>

        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-label">Total Booking Leads</div>
                <div class="metric-val"><?php echo $stats['total']; ?></div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Pending Reviews</div>
                <div class="metric-val" style="color: #fbbf24;"><?php echo $stats['pending']; ?></div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Confirmed & Completed</div>
                <div class="metric-val" style="color: #34d399;"><?php echo $stats['completed']; ?></div>
            </div>
        </div>

        <div class="glass-card">
            <div class="controls-row">
                <h3 style="font-family: 'Outfit'; font-size: 1.2rem;">Service Consultation Bookings</h3>
                <input type="text" id="adminSearch" class="search-input" placeholder="Search reference, client, email..." onkeyup="filterAdminTable()">
            </div>

            <div class="table-responsive">
                <table class="admin-table" id="bookingsTable">
                    <thead>
                        <tr>
                            <th>Ref Code</th>
                            <th>Client & Contact</th>
                            <th>Service Category</th>
                            <th>Package / Scope</th>
                            <th>Cost Est.</th>
                            <th>Scheduled Date & Time</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if (empty($bookings)): ?>
                            <tr>
                                <td colspan="8" style="text-align: center; color: #94a3b8; padding: 30px;">
                                    No booking requests found in the database yet.
                                </td>
                            </tr>
                        <?php else: ?>
                            <?php foreach ($bookings as $b): ?>
                                <tr>
                                    <td>
                                        <span class="badge-ref"><?php echo htmlspecialchars($b['booking_ref'] ?? 'REF-'. $b['id']); ?></span>
                                        <div style="font-size: 0.7rem; color: #64748b; margin-top: 4px;"><?php echo htmlspecialchars(substr($b['created_at'], 0, 10)); ?></div>
                                    </td>
                                    <td>
                                        <strong style="color: #f8fafc; font-size: 0.95rem;"><?php echo htmlspecialchars($b['name']); ?></strong>
                                        <div style="color: #94a3b8; font-size: 0.8rem;"><?php echo htmlspecialchars($b['email']); ?></div>
                                        <?php if (!empty($b['phone'])): ?>
                                            <div style="color: #38bdf8; font-size: 0.8rem; margin-top: 2px;">📱 <?php echo htmlspecialchars($b['phone']); ?></div>
                                        <?php endif; ?>
                                    </td>
                                    <td>
                                        <span style="color: #a855f7; font-weight: 600;"><?php echo htmlspecialchars($b['service_category'] ?? 'Website Development'); ?></span>
                                    </td>
                                    <td>
                                        <div><?php echo htmlspecialchars($b['package_tier'] ?? 'Custom Scope'); ?></div>
                                        <?php if (!empty($b['selected_addons'])): ?>
                                            <div style="font-size: 0.75rem; color: #94a3b8; max-width: 180px;">+ <?php echo htmlspecialchars($b['selected_addons']); ?></div>
                                        <?php endif; ?>
                                    </td>
                                    <td>
                                        <strong style="color: #34d399;"><?php echo htmlspecialchars($b['estimated_cost'] ?? 'Custom'); ?></strong>
                                    </td>
                                    <td>
                                        <div style="color: #f1f5f9; font-weight: 500;"><?php echo htmlspecialchars($b['booking_date']); ?></div>
                                        <div style="color: #94a3b8; font-size: 0.8rem;"><?php echo htmlspecialchars($b['booking_time']); ?></div>
                                    </td>
                                    <td>
                                        <?php if ($b['status'] === 'Completed'): ?>
                                            <span class="badge-status status-completed">Completed</span>
                                        <?php else: ?>
                                            <span class="badge-status status-pending">Pending</span>
                                        <?php endif; ?>
                                    </td>
                                    <td>
                                        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                                            <?php 
                                                $cleanPhone = preg_replace('/[^0-9]/', '', $b['phone'] ?? '');
                                                if (empty($cleanPhone)) $cleanPhone = '918170982777';
                                                $waText = rawurlencode("Hi " . $b['name'] . ", thanks for booking " . ($b['service_category'] ?? 'service consultation') . " (Ref: " . ($b['booking_ref'] ?? '') . "). Let's discuss your project!");
                                            ?>
                                            <a href="https://wa.me/<?php echo $cleanPhone; ?>?text=<?php echo $waText; ?>" target="_blank" class="btn-action btn-wa" title="Message on WhatsApp">
                                                WhatsApp
                                            </a>

                                            <?php if ($b['status'] !== 'Completed'): ?>
                                                <form method="POST" action="admin.php" style="display:inline;">
                                                    <input type="hidden" name="id" value="<?php echo $b['id']; ?>">
                                                    <input type="hidden" name="action" value="complete">
                                                    <button type="submit" class="btn-action btn-done" title="Mark Completed">Done</button>
                                                </form>
                                            <?php endif; ?>

                                            <form method="POST" action="admin.php" style="display:inline;" onsubmit="return confirm('Delete this booking?');">
                                                <input type="hidden" name="id" value="<?php echo $b['id']; ?>">
                                                <input type="hidden" name="action" value="delete">
                                                <button type="submit" class="btn-action btn-del" title="Delete Booking">Del</button>
                                            </form>
                                        </div>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>

    <?php endif; ?>
</div>

<script>
function filterAdminTable() {
    let input = document.getElementById('adminSearch').value.toLowerCase();
    let rows = document.querySelectorAll('#bookingsTable tbody tr');
    
    rows.forEach(row => {
        let text = row.innerText.toLowerCase();
        row.style.display = text.includes(input) ? '' : 'none';
    });
}
</script>

</body>
</html>
