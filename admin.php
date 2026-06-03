<?php
session_start();

// --- CONFIGURATION ---
// Set your admin password here
$ADMIN_PASSWORD = 'admin';
$dbPath = __DIR__ . '/database/portfolio.sqlite';

// --- AUTHENTICATION ---
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['password'])) {
    if ($_POST['password'] === $ADMIN_PASSWORD) {
        $_SESSION['admin_logged_in'] = true;
        header("Location: admin.php");
        exit;
    } else {
        $login_error = "Invalid password.";
    }
}

if (isset($_GET['logout'])) {
    session_destroy();
    header("Location: admin.php");
    exit;
}

$is_logged_in = isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true;

// --- DATABASE CONNECTION & ACTIONS ---
$bookings = [];
if ($is_logged_in) {
    try {
        $pdo = new PDO('sqlite:' . $dbPath);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        // Ensure table exists just in case admin is loaded before first booking
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

        // Handle Status Update
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

        // Fetch Bookings
        $stmt = $pdo->query("SELECT * FROM bookings ORDER BY created_at DESC");
        $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);

    } catch (PDOException $e) {
        $db_error = "Database Error: " . $e->getMessage();
    }
}
?>
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard | Portfolio</title>
    <!-- Use existing styles -->
    <link rel="stylesheet" href="css/style.css">
    <style>
        body { background-color: var(--bg-primary); padding: 40px 20px; }
        .admin-container { max-width: 1000px; margin: 0 auto; }
        .login-card { max-width: 400px; margin: 100px auto; padding: 40px; text-align: center; }
        
        .dashboard-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .dashboard-title { font-family: var(--font-heading); font-size: 2rem; }
        
        .data-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .data-table th, .data-table td { padding: 15px; text-align: left; border-bottom: 1px solid var(--border-glass); }
        .data-table th { font-weight: 600; color: var(--text-secondary); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; }
        .data-table tr:hover { background: rgba(255, 255, 255, 0.02); }
        
        .badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
        .badge-pending { background: rgba(245, 158, 11, 0.1); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.2); }
        .badge-completed { background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); }
        
        .action-btns { display: flex; gap: 8px; }
        .btn-sm { padding: 6px 12px; font-size: 0.75rem; border-radius: 4px; border: none; cursor: pointer; font-weight: 600; transition: all 0.2s; }
        .btn-success { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .btn-success:hover { background: rgba(16, 185, 129, 0.2); }
        .btn-danger { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
        .btn-danger:hover { background: rgba(239, 68, 68, 0.2); }
        
        .empty-state { text-align: center; padding: 60px 20px; color: var(--text-secondary); }
    </style>
</head>
<body>

<div class="admin-container">
    <?php if (!$is_logged_in): ?>
        <!-- LOGIN SCREEN -->
        <div class="login-card glass">
            <h2 class="modal-title" style="margin-bottom: 10px;">Admin Login</h2>
            <p class="modal-subtitle" style="margin-bottom: 25px;">Enter your password to access the dashboard.</p>
            
            <?php if (isset($login_error)): ?>
                <p style="color: #ef4444; font-size: 0.85rem; margin-bottom: 15px;"><?php echo htmlspecialchars($login_error); ?></p>
            <?php endif; ?>
            
            <form method="POST" action="">
                <input type="password" name="password" class="form-input" placeholder="Password" required style="margin-bottom: 20px;">
                <button type="submit" name="login" class="btn btn-primary" style="width: 100%;">Login</button>
            </form>
        </div>
    <?php else: ?>
        <!-- DASHBOARD -->
        <div class="dashboard-header">
            <div>
                <h1 class="dashboard-title">Bookings Dashboard</h1>
                <p style="color: var(--text-secondary); margin-top: 5px;">Manage your scheduled alignment sessions.</p>
            </div>
            <a href="admin.php?logout=true" class="btn btn-secondary" style="padding: 8px 16px; font-size: 0.85rem;">Logout</a>
        </div>

        <?php if (isset($db_error)): ?>
            <div class="glass" style="padding: 20px; border-color: #ef4444; color: #ef4444; margin-bottom: 20px;">
                <?php echo htmlspecialchars($db_error); ?>
            </div>
        <?php endif; ?>

        <div class="glass" style="overflow-x: auto; border-radius: var(--radius-lg);">
            <?php if (empty($bookings)): ?>
                <div class="empty-state">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 15px; opacity: 0.5;">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <h3>No bookings yet</h3>
                    <p>When clients schedule a free call, they will appear here.</p>
                </div>
            <?php else: ?>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Client Details</th>
                            <th>Meeting Slot</th>
                            <th>Project Notes</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($bookings as $b): ?>
                            <tr>
                                <td>
                                    <strong style="color: var(--text-primary); display: block; margin-bottom: 4px;"><?php echo htmlspecialchars($b['name']); ?></strong>
                                    <a href="mailto:<?php echo htmlspecialchars($b['email']); ?>" style="color: var(--accent-primary); font-size: 0.85rem; text-decoration: none;"><?php echo htmlspecialchars($b['email']); ?></a>
                                </td>
                                <td>
                                    <strong style="color: var(--text-primary); display: block; margin-bottom: 4px;"><?php echo htmlspecialchars($b['booking_date']); ?></strong>
                                    <span style="color: var(--text-secondary); font-size: 0.85rem;"><?php echo htmlspecialchars($b['booking_time']); ?></span>
                                </td>
                                <td style="max-width: 250px;">
                                    <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4; margin: 0; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;"><?php echo nl2br(htmlspecialchars($b['notes'])); ?></p>
                                </td>
                                <td>
                                    <?php if ($b['status'] === 'Completed'): ?>
                                        <span class="badge badge-completed">Completed</span>
                                    <?php else: ?>
                                        <span class="badge badge-pending">Pending</span>
                                    <?php endif; ?>
                                </td>
                                <td>
                                    <form method="POST" action="" class="action-btns">
                                        <input type="hidden" name="id" value="<?php echo $b['id']; ?>">
                                        <?php if ($b['status'] !== 'Completed'): ?>
                                            <button type="submit" name="action" value="complete" class="btn-sm btn-success" title="Mark Completed">✓</button>
                                        <?php endif; ?>
                                        <button type="submit" name="action" value="delete" class="btn-sm btn-danger" onclick="return confirm('Are you sure you want to delete this booking?');" title="Delete">✕</button>
                                    </form>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>
        </div>
    <?php endif; ?>
</div>

</body>
</html>
