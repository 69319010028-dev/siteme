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
  },
  {
    id: "work-4",
    title: "ใบงานที่ 4: การวิเคราะห์ข้อมูลสถิติคะแนนสอบด้วย Python & Pandas",
    workshopNum: "Workshop 4",
    subject: "วิทยาศาสตร์ข้อมูลเบื้องต้น",
    category: "code",
    date: "05 มกราคม 2025",
    status: "done",
    statusText: "ส่งแล้ว (รอผลตรวจ)",
    score: "กำลังตรวจ",
    grade: "-",
    image: "assets/images/work1.jpg",
    description: "ทำความสะอาดข้อมูล (Data Cleaning) และวิเคราะห์สถิติเชิงพรรณนา พร้อมสร้าง Data Visualization เช่น Boxplot, Histogram เพื่อหา Insight จากคะแนนสอบจำลอง",
    objectives: [
      "ประมวลผลข้อมูล Missing Values ด้วย Pandas",
      "สร้างกราฟสถิติด้วย Matplotlib และ Seaborn",
      "สรุปผลการวิเคราะห์ในรูปแบบรายงานสรุป"
    ],
    tools: ["Python", "Pandas", "Matplotlib", "Jupyter Notebook"],
    instructorComment: "รอประกาศผลการประเมินจากอาจารย์ผู้สอน",
    fileLink: "#",
    isFeatured: false
  },
  {
    id: "work-5",
    title: "ใบงานที่ 5: ออกแบบสื่อโปสเตอร์อินโฟกราฟิก รณรงค์การรู้เท่าทันไซเบอร์",
    workshopNum: "Workshop 5",
    subject: "การสื่อสารและสารสนเทศ",
    category: "design",
    date: "20 มกราคม 2025",
    status: "reviewed",
    statusText: "ตรวจแล้ว (10/10)",
    score: "10 / 10",
    grade: "A",
    image: "assets/images/work2.jpg",
    description: "สรุปเนื้อหาภัยคุกคามทางไซเบอร์ เช่น Phishing, Social Engineering และรหัสผ่านที่ปลอดภัย มานำเสนอในรูปแบบภาพโปสเตอร์ที่เข้าใจง่าย น่าดึงดูดสำหรับเยาวชน",
    objectives: [
      "สรุปข้อมูลที่ซับซ้อนให้กระชับและตรงจุด",
      "จัดวาง Visual Hierarchy และ Typography",
      "เผยแพร่สู่ชุมชนโรงเรียน"
    ],
    tools: ["Canva Pro", "Photoshop", "Infographic Design"],
    instructorComment: "สื่อสารเนื้อหาได้กระชับ รูปแบบเข้าใจง่าย เหมาะแก่การนำไปติดบอร์ดประชาสัมพันธ์",
    fileLink: "#",
    isFeatured: false
  }
];

const DEFAULT_PROFILE = {
  brandBadge: "P",
  brandTitle: "ภควัต",
  brandSubtitle: "Portfolio",
  name: "ภควัต ศรีรัตน์",
  fullname: "นายภควัต ศรีรัตน์",
  nickname: "ซัง",
  role: "นักศึกษา ปวส. เทคโนโลยีสารสนเทศ",
  bio: "มีความชื่นชอบและหลงใหลในการเรียนรู้สิ่งใหม่ ๆ ด้านคอมพิวเตอร์ การเขียนโปรแกรม และการพัฒนาเว็บไซต์ มุ่งมั่นสร้างสรรค์ผลงานคุณภาพในทุกใบงาน",
  school: "วิทยาลัยเทคนิคนครศรีธรรมราช",
  level: "ประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)",
  email: "69319010028@tnk.ac.th",
  phone: "099-436-2677",
  location: "นครศรีธรรมราช, ประเทศไทย",
  gpa: "3.85",
  academicYear: "2567 - 2568",
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
      logo: "assets/images/logo_school_vocational.svg",
      image: "assets/images/logo_school_vocational.svg"
    }
  ]
};
