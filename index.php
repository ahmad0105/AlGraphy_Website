<?php
/**
 * AlGraphy Studio — Dynamic Gateway
 * 
 * TABLE OF CONTENTS:
 * 1. INITIALIZATION & DATA FETCHING
 * 2. HEADER & NAVIGATION (Hamburger & Auth)
 * 3. HERO SECTION (Dynamic Video & Title)
 * 4. SERVICES SECTION (Tabs & Dynamic Cards)
 * 5. PORTFOLIO SECTION (Cinematic Project Reveal)
 * 6. CONTACT SECTION (Interactive Form)
 * 7. FOOTER SECTION (Database-driven Links)
 * 8. MODALS & OVERLAYS (Project, Gallery, Contact)
 * 9. CLIENT-SIDE ARCHITECTURE (API, GSAP, Lenis)
 */

require_once 'algraphybackend/src/Database.php';
$config = require 'algraphybackend/src/config.php';

try {
    // Correctly pass 4 separate arguments from the config array
    $db = new AlGraphy\Database(
        $config['db_host'],
        $config['db_name'],
        $config['db_user'],
        $config['db_pass']
    );
    $pdo = $db->connect();

    // Fetch Hero Data
    $stmt = $pdo->prepare("SELECT * FROM site_hero WHERE id = 1");
    $stmt->execute();
    $hero = $stmt->fetch(PDO::FETCH_ASSOC);

    // Fetch Total Project Count for Hero Stats
    $projCountStmt = $pdo->query("SELECT COUNT(*) FROM site_projects");
    $totalProjects = $projCountStmt->fetchColumn();

    // Fetch Total Clients Count for Hero Stats
    $clientCountStmt = $pdo->query("SELECT COUNT(*) FROM clients");
    $totalClients = $clientCountStmt->fetchColumn();

    // Calculate Years of Experience from earliest Project Start Date
    $earliestProjStmt = $pdo->query("SELECT MIN(Start_Date) FROM site_projects");
    $earliestDate = $earliestProjStmt->fetchColumn();
    
    if ($earliestDate) {
        $startDate = new DateTime($earliestDate);
        $today = new DateTime();
        $interval = $startDate->diff($today);
        $yearsOfExp = $interval->y;
        
        // Rule: If less than a month (or effectively 0 years), default to 1
        if ($yearsOfExp < 1) {
            $yearsOfExp = 1;
        }
    } else {
        $yearsOfExp = 3; // Fallback if no projects exist
    }
} catch (Exception $e) {
    // Fallback: If DB fails, $hero will be false and template will use defaults below
    $hero = false;
    error_log("Landing Page DB Error: " . $e->getMessage());
}

// Fallbacks if database is empty
$heroSubtitle = $hero['subtitle'] ?? 'STRATEGIC DESIGN STUDIO';
$heroTitle = $hero['title'] ?? 'WE CRAFT DIGITAL : EXPERIENCES.';
$bgVideo = $hero['bg_video_url'] ?? 'Assets/video/heroVideo.mp4';
$srVideo = $hero['showreel_video_url'] ?? 'Assets/video/heroVideo.mp4';

// Helper to format title (convert : to <br>)
function formatHeroTitle($text)
{
    return str_replace([':', "\n"], '<br>', htmlspecialchars_decode($text));
}
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AlGraphy Studio | Digital Experience</title>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/cursor.css">
</head>

<body>


    <div class="scroll-progress-bar"></div>

    <!-- ========== 2. LOADER: Shown until page fully loads ========== -->
    <div id="loader" class="loader">
        <img loading="lazy" src="Assets/image/Logo_algraphy-White.png" alt="AlGraphy Logo" width="120" height="auto">
        <div class="loader-text">
            ALGRAPHY <span style="color: var(--primary);">Studio</span>
        </div>
    </div>

    <!-- ========== 3. MENU OVERLAY: Full-screen navigation ========== -->
    <div class="menu-overlay">
        <div class="menu-links">
            <a href="#home">Home</a>
            <a href="#services">Services</a>
            <a href="#portfolio">Portfolio</a>
            <a href="#contact">Contact</a>
        </div>
        <div class="menu-auth-divider"></div>
        <div class="menu-auth-group">
            <!-- Shown for Gest -->
            <a href="auth" class="menu-auth-link" id="menuLoginBtn">Login / Signup</a>
            <!-- Shown for Logged users -->
            <a href="dashboard" class="menu-auth-link hidden auth-user-only"
                id="menuDashboardBtn">Dashboard</a>
            <a href="dashboard/profile" class="menu-auth-link hidden auth-user-only" id="menuProfileBtn">My Profile</a>
        </div>
    </div>

    <!-- ========== 4. NAVIGATION BAR ========== -->
    <nav class="nav-bar">
        <a href="#home" class="logo-container" style="text-decoration: none; color: inherit;">
            <img loading="lazy" src="Assets/image/Logo_algraphy-White.png" alt="AlGraphy Logo" class="nav-logo">
            <div class="logo">AlGraphy Studio</div>
        </a>
        <div class="nav-actions">
            <!-- Guests: Login & Signup -->
            <a href="auth" class="nav-auth-btn login-btn auth-guest-only" id="guestLoginBtn">Login</a>
            <a href="auth#signup" class="nav-auth-btn signup-btn auth-guest-only" id="guestSignupBtn">Sign Up</a>

            <!-- Authorized: Dashboard & Profile -->
            <a href="dashboard" class="nav-auth-btn auth-user-only" id="userDashboardBtn">Dashboard</a>

            <div id="userHeaderProfile" class="header-profile auth-user-only"
                onclick="window.location.href='dashboard/profile'">
                <span id="userHeaderName">...</span>
                <img id="userHeaderAvatar" src="Assets/image/default_avatar.png" alt="User Profile">
            </div>
        </div>
        <div class="menu-icon">
            <span class="line"></span>
            <span class="line"></span>
        </div>
    </nav>

    <!-- ========== 5. HERO SECTION ========== -->
    <header id="home" class="hero-section">
        <video class="hero-bg-video" id="mainHeroVideo" autoplay loop muted playsinline width="100%" height="100%">
            <source src="<?php echo $bgVideo; ?>" type="video/mp4">
        </video>
        <div class="container hero-container">
            <span class="hero-subtitle" id="heroSubtitleText"><?php echo $heroSubtitle; ?></span>
            <h1 class="hero-title" id="heroTitleText"><?php echo formatHeroTitle($heroTitle); ?></h1>
            <button class="cta-button">
                <span class="play-icon"></span> Watch Showreel
            </button>

            <!-- Hero Stats -->
            <div class="hero-stats">
                <div class="stat-item">
                    <span class="stat-number" data-target="<?php echo $totalProjects ?? 50; ?>">0</span><span class="stat-suffix">+</span>
                    <span class="stat-label">Projects Delivered</span>
                </div>
                <div class="stat-divider"></div>
                <div class="stat-item">
                    <span class="stat-number" data-target="<?php echo $yearsOfExp ?? 3; ?>">0</span><span class="stat-suffix"> Years</span>
                    <span class="stat-label">Of Experience</span>
                </div>
                <div class="stat-divider"></div>
                <div class="stat-item">
                    <span class="stat-number" data-target="<?php echo $totalClients ?? 25; ?>">0</span><span class="stat-suffix">+</span>
                    <span class="stat-label">Happy Clients</span>
                </div>
            </div>

            <!-- Video Modal (Showreel Popup) -->
            <div class="video-modal">
                <div class="video-overlay"></div>
                <div class="video-container">
                    <button class="close-video">×</button>
                    <video class="showreel-video" id="mainShowreelVideo" controls>
                        <source src="<?php echo $srVideo; ?>" type="video/mp4">
                    </video>
                </div>
            </div>

        </div>
    </header>

    <?php
    // --- Fetch Services Data ---
    $catStmt = $pdo->query("SELECT * FROM service_categories ORDER BY display_order ASC");
    $categories = $catStmt->fetchAll(PDO::FETCH_ASSOC);

    $svcStmt = $pdo->query("SELECT * FROM site_services ORDER BY category_id, display_order ASC");
    $allServices = $svcStmt->fetchAll(PDO::FETCH_ASSOC);

    // Map services to categories carefully
    $finalStructure = [];
    foreach ($categories as $cat) {
        $catId = $cat['id'];
        $cat['services'] = array_values(array_filter($allServices, fn($s) => (int) $s['category_id'] === (int) $catId));
        $finalStructure[] = $cat;
    }
    ?>

    <!-- ========== 6. SERVICES SECTION (FULLY DYNAMIC) ========== -->
    <section id="services" class="services-section">
        <div class="container">

            <!-- Dynamic Tabs -->
            <div class="services-tabs">
                <?php foreach ($finalStructure as $index => $cat): ?>
                    <button class="tab-btn <?php echo $index === 0 ? 'active' : ''; ?>"
                        data-tab="<?php echo $cat['slug']; ?>">
                        <?php echo htmlspecialchars($cat['name']); ?>
                    </button>
                <?php endforeach; ?>
            </div>

            <?php foreach ($finalStructure as $index => $cat): ?>
                <!-- <?php echo $cat['name']; ?> Grid -->
                <div class="services-grid <?php echo $index === 0 ? 'active' : 'hidden'; ?>"
                    id="tab-<?php echo $cat['slug']; ?>">

                    <?php foreach ($cat['services'] as $svc): ?>
                        <!-- Card: <?php echo $svc['Service_Name']; ?> -->
                        <div class="service-card">
                            <div class="card-image-bg"
                                style="background-image: url('<?php echo $svc['image_url'] ?: 'Assets/GIF/strategy.gif'; ?>');">
                            </div>
                            <div class="card-icon">
                                <?php if ($svc['icon_svg']): ?>
                                    <?php echo $svc['icon_svg']; ?>
                                <?php else: ?>
                                    <!-- Default Placeholder Icon -->
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                        stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                    </svg>
                                <?php endif; ?>
                            </div>
                            <div class="card-content">
                                <h3><?php echo htmlspecialchars($svc['Service_Name']); ?></h3>
                                <div class="card-meta">
                                    <span>From <?php echo htmlspecialchars($svc['Base_Price']); ?></span>
                                    <span class="dot">•</span>
                                    <span><?php echo htmlspecialchars($svc['Delivery_Time']); ?></span>
                                </div>
                                <p class="description"><?php echo htmlspecialchars($svc['description']); ?></p>

                                <ul class="card-includes">
                                    <?php
                                    $includes = json_decode($svc['Service_Includes'] ?? '[]', true);
                                    if (!is_array($includes))
                                        $includes = [];
                                    foreach ($includes as $item):
                                        if (trim($item)):
                                            ?>
                                            <li><?php echo htmlspecialchars(trim($item)); ?></li>
                                        <?php endif; endforeach; ?>
                                </ul>

                                <div class="card-tech">
                                    <?php
                                    $techs = json_decode($svc['Technology_Stack'] ?? '[]', true);
                                    if (!is_array($techs))
                                        $techs = [];
                                    foreach ($techs as $t):
                                        if (trim($t)):
                                            ?>
                                            <span><?php echo htmlspecialchars(trim($t)); ?></span>
                                        <?php endif; endforeach; ?>
                                </div>
                                <button class="card-contact-btn">LET'S TALK</button>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php endforeach; ?>
        </div>
    </section>

    <!-- ========== 7. PORTFOLIO SECTION ========== -->
    <?php
    $settingsStmt = $pdo->prepare("SELECT setting_value FROM site_settings WHERE setting_key = 'projects_section_title'");
    $settingsStmt->execute();
    $titleResult = $settingsStmt->fetch(PDO::FETCH_ASSOC);
    $sectionTitle = $titleResult['setting_value'] ?? 'PORTFOLIO';

    $projStmt = $pdo->query("SELECT * FROM site_projects ORDER BY ID ASC");
    $projects = $projStmt->fetchAll(PDO::FETCH_ASSOC);

    // Fetch All Gallery Images
    $galStmt = $pdo->query("SELECT * FROM project_gallery");
    $galleryImages = $galStmt->fetchAll(PDO::FETCH_ASSOC);
    $galleryMap = [];
    
    foreach ($galleryImages as $img) {
        $galleryMap[$img['project_id']][] = $img['Image_URL'];
    }

    // Merge gallery into projects array
    foreach ($projects as &$p) {
        $p['gallery'] = $galleryMap[$p['ID']] ?? [];
    }
    ?>
    <section id="portfolio" class="portfolio-section">
        <div class="container">
            <h2 class="section-header"><?php echo htmlspecialchars($sectionTitle); ?></h2>

            <?php
            $i = 0;
            foreach ($projects as $proj):
                $i++;
                // Check if odd (1, 3, 5...) or even (2, 4, 6...)
                if ($i % 2 !== 0) {
                    $sideClass = 'magnetic-project-right';
                    $svgX = '-300';
                } else {
                    $sideClass = 'magnetic-project-left';
                    $svgX = '-80';
                }
                ?>
                <div class="project-item">
                    <svg class="project-rect-svg" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                        <rect class="project-rect" x="<?php echo $svgX; ?>" y="-25" width="calc(100% + 375px)"
                            height="calc(100% + 50px)" rx="50" ry="50" stroke="var(--primary)" stroke-width="2" />
                    </svg>
                    <div class="project-image"
                        style="background-image: url('<?php echo htmlspecialchars($proj['Main_Image'] ?? 'Assets/image/Aura.png'); ?>');">
                    </div>
                    <div class="project-text">
                        <div class="project-tags">
                            <span
                                class="project-tag"><?php echo htmlspecialchars($proj['Service_Category'] ?? ''); ?></span>
                        </div>
                        <h3><?php echo htmlspecialchars($proj['Project_name'] ?? ''); ?></h3>
                        <p><?php echo htmlspecialchars($proj['Description'] ?? ''); ?></p>
                    </div>
                    <div class="<?php echo $sideClass; ?>">
                        <button class="magnetic-project-btn" data-project-id="<?php echo $proj['ID']; ?>">VIEW <br>
                            PROJECT</button>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    </section>


    <!-- ========== 8. FOOTER SECTION ========== -->
    <footer id="contact" class="footer-section">
        <!-- Background video -->
        <video class="footer-bg-video" autoplay loop muted playsinline>
            <source src="Assets/video/white-on-black-topographical-map-clean.mp4" type="video/mp4">
        </video>

        <div class="container">
            <!-- CTA Area: Headline + Magnetic Button -->
            <div class="footer-content">
                <div class="footer-glass-bg"></div>
                <svg class="footer-rect-svg" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <rect class="footer-rect" x="-300" y="2" width="calc(100% + 130px)" height="calc(100% + 89px)"
                        rx="50" ry="50" stroke="var(--primary)" stroke-width="2" />
                </svg>
                <div class="footer-headline">
                    <h2>READY TO START <br> A PROJECT?</h2>
                </div>

                <div class="magnetic-wrap">
                    <button class="magnetic-btn">LET'S <br> TALK</button>
                </div>
            </div>

            <!-- Footer Bottom: Copyright + Links -->
            <div class="footer-bottom">
                <div class="logo-container">
                    <a href="#home" class="logo-container" style="text-decoration: none; color: inherit;">
                        <img loading="lazy" src="Assets/image/Logo_algraphy-White.png" alt="AlGraphy Logo"
                            class="nav-logo" width="40" height="40">
                        <div class="logo">© 2026 AlGraphy Studio</div>
                    </a>
                </div>
                <div class="footer-links-group">
                    <?php
                    $groupedFooter = ['CONTACT' => [], 'SOCIAL' => []];
                    try {
                        $footerPdo = $db->connect();
                        $footerLinks = $footerPdo->query("SELECT * FROM site_footer_links ORDER BY category DESC, order_index ASC")->fetchAll();
                        foreach ($footerLinks as $fl) {
                            $groupedFooter[$fl['category']][] = $fl;
                        }
                    } catch (Exception $e) {
                         // Fallback defaults if DB fails
                         $groupedFooter['CONTACT'][] = ['title' => 'Contact Us', 'url' => '#'];
                         $groupedFooter['SOCIAL'][] = ['title' => 'LinkedIn', 'url' => '#'];
                    }

                    foreach ($groupedFooter as $cat => $links): ?>
                        <div class="footer-links-column">
                            <h4><?php echo htmlspecialchars($cat); ?></h4>
                            <?php foreach ($links as $link): 
                                $url = trim($link['url'] ?? '');
                                $isLink = (!empty($url) && $url !== '#');
                                ?>
                                <?php if ($isLink): ?>
                                    <a href="<?php echo htmlspecialchars($url); ?>">
                                        <?php echo htmlspecialchars($link['title']); ?>
                                    </a>
                                <?php else: ?>
                                    <span class="footer-static-text">
                                        <?php echo htmlspecialchars($link['title']); ?>
                                    </span>
                                <?php endif; ?>
                            <?php endforeach; ?>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>
        </div>
    </footer>

    <!-- ========== 9. PROJECT DETAILS MODAL ========== -->
    <div class="project-modal">
        <div class="project-overlay"></div>
        <button class="close-project">×</button>
        <div class="project-modal-container" data-lenis-prevent="true">
            <!-- Modal Content Layout -->
            <div class="project-modal-content" id="project-modal-content">
                <!-- Data will be injected here via JavaScript -->
            </div>
        </div>
    </div>

    <!-- ========== 10. CONTACT MODAL ========== -->
    <div class="contact-modal">
        <div class="contact-overlay"></div>
        <button class="close-contact">×</button>
        <div class="contact-container">
            <h2>Start a Project</h2>
            <form class="contact-form">
                <div class="form-group">
                    <h3>Name</h3>
                    <input type="text" id="name" required placeholder="Name">
                </div>
                <div class="form-group">
                    <h3>Phone Number</h3>
                    <input type="tel" id="phone" required placeholder="Phone Number">
                </div>
                <div class="form-group">
                    <h3>Email Address</h3>
                    <input type="email" id="email" required placeholder="Email Address">
                </div>
                <!-- Date & Time Row -->
                <div class="form-row">
                    <div class="form-group">
                        <h3>Date</h3>
                        <input type="date" id="date" required>
                    </div>
                    <div class="form-group">
                        <h3>Time</h3>
                        <select id="time" required>
                            <option value="" disabled selected>Preferred Time</option>
                            <option value="Morning (9AM - 12PM)">Morning (9AM - 12PM)</option>
                            <option value="Evening (1PM - 5PM)">Evening (1PM - 5PM)</option>
                        </select>
                    </div>
                </div>
                <button type="submit" class="submit-btn" id="contact-submit-btn">SEND REQUEST</button>
            </form>
        </div>
    </div>

    <!-- ========== DYNAMIC GUIDING LINE (Hero to Portfolio) ========== -->
    <svg id="global-line-svg">
        <path id="dynamic-path"></path>
    </svg>

    <!-- ========== CUSTOM ALERT MODAL ========== -->
    <div class="custom-alert-overlay" id="customAlertOverlay"></div>
    <div class="custom-alert" id="customAlert">
        <i class="fa fa-paper-plane alert-icon"></i>
        <h2 id="customAlertTitle">Message Title</h2>
        <p id="customAlertMessage">Thank you for your message!</p>
        <button class="close-alert-btn" id="closeAlertBtn">Got it</button>
    </div>

    <!-- ========== SCRIPTS ========== -->
    <script defer src="js/config.js"></script>
    <script defer src="js/api-service.js"></script>
    <script defer src="js/utils.js"></script>
    <script defer src="https://cdn.jsdelivr.net/gh/studio-freight/lenis@1.0.29/bundled/lenis.min.js"></script>
    <script defer src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
    <script defer src="js/ui-classes.js"></script>
    <script>
        // Inject database payload for the JS Modal rendering
        window.algraphyProjects = <?php echo json_encode($projects); ?>;
    </script>
    <script defer src="js/script.js"></script>

    <script defer src="js/cursor-loader.js"></script>
</body>

</html>