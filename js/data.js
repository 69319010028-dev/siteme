/**
 * Default sample data for Pakawat Portfolio & Worksheet Hub
 */

const DEFAULT_WORKSHEETS = [
  {
    id: "work-1",
    title: "ใบงานที่ 1: การออกแบบและพัฒนาเว็บไซต์ด้วย HTML5 & CSS3",
    workshopNum: "Workshop 1",
    subject: "วิทยาการคำนวณ & การพัฒนาเว็บ",
    category: "web",
    date: "15 พฤศจิกายน 2024",
    status: "reviewed", // 'reviewed' | 'done' | 'pending'
    statusText: "ตรวจแล้ว (10/10)",
    score: "10 / 10",
    grade: "A",
    image: "assets/images/work1.jpg",
    description: "ศึกษาและลงมือสร้างโครงสร้างหน้าเว็บเชิงความหมาย (Semantic Web) พร้อมประยุกต์ใช้ Flexbox, Grid Layout และ CSS Modern Variables ในการออกแบบเว็บไซต์ที่รองรับ Responsive Design",
    objectives: [
      "เข้าใจการจัดโครงสร้าง HTML5 Semantic Tags",
      "ประยุกต์ใช้ CSS Grid และ Flexbox ในการจัดวางเลย์เอาต์",
      "ทดสอบการแสดงผลบนอุปกรณ์ขนาดหน้าจอต่าง ๆ (Responsive)"
    ],
    tools: ["HTML5", "CSS3", "VS Code", "Chrome DevTools"],
    instructorComment: "โครงสร้างโค้ดสะอาด เป็นระเบียบ การจัดเลย์เอาต์สวยงามและรองรับมือถือได้ดีมาก",
    fileLink: "#",
    isFeatured: true
  },
  {
    id: "work-2",
    title: "ใบงานที่ 2: การออกแบบ User Interface & Wireframe แอปพลิเคชันมือถือ",
    workshopNum: "Workshop 2",
    subject: "การออกแบบและเทคโนโลยี",
    category: "design",
    date: "28 พฤศจิกายน 2024",
    status: "reviewed",
    statusText: "ตรวจแล้ว (20/20)",
    score: "20 / 20",
    grade: "A",
    image: "assets/images/work2.jpg",
    description: "ออกแบบ Wireframe, Mood board และสร้าง Interactive Prototype สำหรับแอปพลิเคชันจัดการการเรียนและการส่งการบ้าน โดยเน้นหลักการ User-Centered Design (UCD)",
    objectives: [
      "วิเคราะห์ปัญหาและ User Persona ของนักเรียน",
      "ออกแบบ Low-fidelity และ High-fidelity Wireframe",
      "สร้าง Design System และ Color Harmony"
    ],
    tools: ["Figma", "Adobe Illustrator", "Design Thinking"],
    instructorComment: "การเลือกโทนสีและการจัดลำดับความสำคัญของข้อมูลบนหน้าจอทำได้ยอดเยี่ยม",
    fileLink: "#",
    isFeatured: true
  },
  {
    id: "work-3",
    title: "ใบงานที่ 3: ระบบตรวจวัดอุณหภูมิและความชื้น IoT ด้วย ESP32",
    workshopNum: "Workshop 3",
    subject: "โครงงานคอมพิวเตอร์และ IoT",
    category: "tech",
    date: "12 ธันวาคม 2024",
    status: "reviewed",
    statusText: "ตรวจแล้ว (19/20)",
    score: "19 / 20",
    grade: "A",
    image: "assets/images/work3.jpg",
    description: "ต่อวงจรเซนเซอร์ DHT22 ร่วมกับบอร์ดไมโครคอนโทรลเลอร์ ESP32 เพื่อส่งค่าข้อมูลอุณหภูมิไปยัง Web Dashboard แบบ Real-time ผ่านโปรโตคอล MQTT และจัดเก็บข้อมูล",
    objectives: [
      "ต่อวงจรและเขียนโปรแกรมควบคุมไมโครคอนโทรลเลอร์",
      "เชื่อมต่อระบบเครือข่าย Wi-Fi และส่งข้อมูลผ่าน MQTT",
      "สร้าง Dashboard แสดงผลกราฟข้อมูลย้อนหลัง"
    ],
    tools: ["ESP32", "Arduino C++", "MQTT", "Node-RED"],
    instructorComment: "ฮาร์ดแวร์ทำงานเสถียร แสดงผลบนแดชบอร์ดได้แม่นยำมาก ขอชมเชย",
    fileLink: "#",
    isFeatured: true
  }
];

const DEFAULT_PROFILE = {
  siteTitle: "Pakawat Srirat | พอร์ตโฟลิโอ & คลังเก็บใบงาน",
  siteFavicon: "assets/images/OIP.webp",
  brandBadge: "",
  brandLogoImage: "assets/images/OIP.webp",
  brandTitle: "Pakawat",
  brandSubtitle: "Srirat",
  name: "ภควัต ศรีรัตน์",
  fullname: "นายภควัต ศรีรัตน์",
  nickname: "ซัง",
  role: "นักศึกษา ปวส. สาขาเทคโนโลยีสารสนเทศ คอมพิวเตอร์",
  bio: "มีความชื่นชอบและหลงใหลในการเรียนรู้สิ่งใหม่ ๆ ด้านคอมพิวเตอร์ การเขียนโปรแกรม และการพัฒนาเว็บไซต์ มุ่งมั่นสร้างสรรค์ผลงานคุณภาพในทุกใบงาน",
  school: "วิทยาลัยเทคนิคนครศรีธรรมราช",
  level: "ประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)",
  email: "69319010028@tnk.ac.th",
  phone: "099-436-2677",
  location: "นครศรีธรรมราช, ประเทศไทย",
  gpa: "3.88",
  academicYear: "2567 - 2568",
  // Hero Banner Section Defaults
  heroTag: "คลังเก็บผลงานและใบงานออนไลน์",
  heroGreeting: "สวัสดีครับ, ผม",
  heroName: "ภควัต",
  heroSubtitle: "ยินดีต้อนรับสู่พื้นที่รวมงาน",
  heroDesc: "เว็บไซต์นี้สร้างขึ้นเพื่อรวบรวมและนำเสนอผลงาน ใบงาน การบ้าน และโปรเจกต์ต่าง ๆ ตลอดการศึกษา พร้อมประวัติและทักษะความสามารถ เพื่อเป็นบันทึกการเรียนรู้และการพัฒนาตนเองอย่างต่อเนื่อง",
  avatarImage: "assets/images/avatar.jpg",
  heroBannerImage: "assets/images/858979244_1774317823827162_4518473138288594674_n.jpg",
  heroBannerBg: "",
  heroBannerOverlay: "70",
  heroBannerHeight: "",
  heroBannerFit: "cover",
  heroAvatarSize: "300",
  heroAvatarZoom: "100",
  heroAvatarPosY: "50",
  heroMajorIcon: "💻",
  heroMajorLabel: "สาขาเทคโนโลยีสารสนเทศ",
  heroMajorVal: "คอมพิวเตอร์",
  heroGpa: "3.88",
  heroGpaLabel: "เกรดเฉลี่ยสะสม (GPA)",
  heroCommitment: "100%",
  heroCommitmentLabel: "ความตั้งใจและส่งตรงเวลา",
  // Profile Bio Card Defaults
  profileCardBg: "",
  profileCardBannerImage: "",
  profileCardOverlay: "70",
  profileCardFit: "cover",
  profileCardAvatarSize: "140",
  profileCardAvatarZoom: "",
  profileCardAvatarPosY: "",
  profileCardSyncWithHero: true,
  skills: [
    { name: "HTML5 / CSS3 / JavaScript", level: 90 },
    { name: "Python / Data Science เบื้องต้น", level: 75 },
    { name: "UI/UX Design (Figma, Canva)", level: 85 },
    { name: "Internet of Things & Microcontrollers", level: 70 },
    { name: "การนำเสนอและการจัดทำรายงานวิชาการ", level: 92 }
  ],
  education: [
    {
      id: "edu-junior",
      period: "2561 - 2563",
      title: "ระดับมัธยมศึกษาตอนต้น",
      sub: "โรงเรียนตัวอย่างวิทยาคม",
      desc: "สำเร็จการศึกษาระดับมัธยมศึกษาตอนต้น ด้วยผลการเรียนดีเด่น และร่วมกิจกรรมวิชาการ",
      logo: "assets/images/logo_school_junior.svg",
      image: "assets/images/logo_school_junior.svg"
    },
    {
      id: "edu-high",
      period: "2564 - 2566",
      title: "ระดับมัธยมศึกษาตอนปลาย",
      sub: "โรงเรียนตัวอย่างวิทยาคม",
      desc: "แผนการเรียนวิทยาศาสตร์-คณิตศาสตร์-คอมพิวเตอร์ เน้นโครงงานนวัตกรรมดิจิทัล",
      logo: "assets/images/logo_school_high.svg",
      image: "assets/images/logo_school_high.svg"
    },
    {
      id: "edu-vocational",
      period: "2567 - ปัจจุบัน",
      title: "ระดับประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)",
      sub: "วิทยาลัยเทคนิคนครศรีธรรมราช",
      desc: "แผนกวิชาเทคโนโลยีสารสนเทศ / คอมพิวเตอร์ มุ่งเน้นการพัฒนาเว็บไซต์ เครือข่าย และระบบดิจิทัล",
      logo: "assets/images/OIP.webp",
      image: "assets/images/OIP.webp"
    }
  ]
};

// Helper: Convert hex or color string to rgba
function hexToRgba(hexOrColor, opacity) {
  if (!hexOrColor) return `rgba(20, 14, 10, ${opacity})`;
  const trimmed = String(hexOrColor).trim();
  if (trimmed.startsWith('#')) {
    let c = trimmed.substring(1);
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    if (c.length === 6) {
      const num = parseInt(c, 16);
      if (!isNaN(num)) {
        const r = (num >> 16) & 255;
        const g = (num >> 8) & 255;
        const b = num & 255;
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
      }
    }
  } else if (trimmed.startsWith('rgb')) {
    return trimmed;
  }
  return `rgba(20, 14, 10, ${opacity})`;
}

// Helper: Apply hero card background image, background color, gradient overlay, min-height, and image fit
function applyHeroCardBackground(el, imgUrl, bgColor, overlayPercent, minHeight, bgFit) {
  if (!el) return;
  const opacityVal = (overlayPercent !== undefined && overlayPercent !== null && overlayPercent !== '')
    ? Math.max(0, Math.min(100, parseInt(overlayPercent, 10))) / 100
    : 0.70;

  if (minHeight && parseInt(minHeight, 10) > 0) {
    el.style.minHeight = `${parseInt(minHeight, 10)}px`;
  } else {
    el.style.minHeight = '';
  }

  const fitVal = (bgFit && String(bgFit).trim()) || 'cover';

  if (imgUrl) {
    el.classList.add('has-bg-image');
    const topOverlay = hexToRgba(bgColor || '#140e0a', Math.max(0.18, opacityVal - 0.12));
    const bottomOverlay = hexToRgba(bgColor || '#140e0a', Math.min(0.98, opacityVal + 0.15));
    el.style.backgroundImage = `linear-gradient(${topOverlay}, ${bottomOverlay}), url('${imgUrl}')`;
    el.style.backgroundSize = fitVal;
    el.style.backgroundPosition = 'center';
    el.style.backgroundRepeat = 'no-repeat';
    if (bgColor) el.style.backgroundColor = bgColor;
  } else if (bgColor) {
    el.classList.remove('has-bg-image');
    el.style.backgroundImage = 'none';
    el.style.backgroundColor = bgColor;
    el.style.backgroundSize = '';
    el.style.backgroundPosition = '';
    el.style.backgroundRepeat = '';
  } else {
    el.classList.remove('has-bg-image');
    el.style.backgroundImage = '';
    el.style.backgroundColor = '';
    el.style.backgroundSize = '';
    el.style.backgroundPosition = '';
    el.style.backgroundRepeat = '';
  }
}

// Helper: Apply avatar frame sizing, internal image zoom, and vertical focus position
function applyAvatarStyles(wrapperEl, imgEl, size, zoom, posY, isPreview = false) {
  if (wrapperEl) {
    if (size && parseInt(size, 10) > 0) {
      const parsedSize = parseInt(size, 10);
      const actualSize = isPreview ? Math.round(parsedSize * 0.62) : parsedSize;
      wrapperEl.style.width = `${actualSize}px`;
      wrapperEl.style.height = `${actualSize}px`;
    } else {
      wrapperEl.style.width = '';
      wrapperEl.style.height = '';
    }
  }

  if (imgEl) {
    const scaleVal = (zoom && parseInt(zoom, 10) > 0) ? parseInt(zoom, 10) / 100 : 1;
    imgEl.style.transform = scaleVal !== 1 ? `scale(${scaleVal})` : '';
    const posVal = (posY !== undefined && posY !== null && posY !== '') ? parseInt(posY, 10) : 50;
    imgEl.style.objectPosition = `center ${posVal}%`;
  }
}

// Helper: Apply profile card styling (background image, color, gradient overlay, and fit)
function applyProfileCardBackground(el, imgUrl, bgColor, overlayPercent, bgFit) {
  if (!el) return;
  const opacityVal = (overlayPercent !== undefined && overlayPercent !== null && overlayPercent !== '')
    ? Math.max(0, Math.min(100, parseInt(overlayPercent, 10))) / 100
    : 0.70;
  const fitVal = (bgFit && String(bgFit).trim()) || 'cover';

  if (imgUrl) {
    el.classList.add('has-bg-image');
    const topOverlay = hexToRgba(bgColor || '#140e0a', Math.max(0.20, opacityVal - 0.15));
    const bottomOverlay = hexToRgba(bgColor || '#140e0a', Math.min(0.98, opacityVal + 0.15));
    el.style.backgroundImage = `linear-gradient(${topOverlay}, ${bottomOverlay}), url('${imgUrl}')`;
    el.style.backgroundSize = fitVal;
    el.style.backgroundPosition = 'center';
    el.style.backgroundRepeat = 'no-repeat';
    if (bgColor) el.style.backgroundColor = bgColor;
  } else if (bgColor) {
    el.classList.remove('has-bg-image');
    el.style.backgroundImage = 'none';
    el.style.backgroundColor = bgColor;
    el.style.backgroundSize = '';
    el.style.backgroundPosition = '';
    el.style.backgroundRepeat = '';
  } else {
    el.classList.remove('has-bg-image');
    el.style.backgroundImage = '';
    el.style.backgroundColor = '';
    el.style.backgroundSize = '';
    el.style.backgroundPosition = '';
    el.style.backgroundRepeat = '';
  }
}
