import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { BookOpen, School, User, ClipboardList, BarChart2, Save, CheckCircle, ArrowRight, LayoutDashboard, PenTool } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';

// --- 1. Firebase Configuration (ใส่ข้อมูลของคุณเรียบร้อยแล้ว) ---
const firebaseConfig = {
  apiKey: "AIzaSyA9VW55z3E8XI9-BBoj_5AKauG2rdxKiR4",
  authDomain: "smart-observation-angthong.firebaseapp.com",
  projectId: "smart-observation-angthong",
  storageBucket: "smart-observation-angthong.firebasestorage.app",
  messagingSenderId: "94348164666",
  appId: "1:94348164666:web:05361a2f28c11929f93f03",
  measurementId: "G-CRXF740SR8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Data Constants ---
const SUPERVISORS = [
  "1. นางสาวศิริรัตน์ สุคันธพฤกษ์", "2. นางวรรณี คงทอง", "3. นายจารึก นิลศรี", "4. นายวศิน ชูชาติ",
  "5. นางสาวศิริจรรยา ทันศรี", "6. นายธนัญญ์กาญจ์ โพธิ์เจริญ", "7. นางสาวธนัญญา ปัทมโรจน์", "8. นางสาวณัฐชยา นันตะเสนีย์"
];

const SUBJECTS = [
  "คณิตศาสตร์", "วิทยาศาสตร์ และเทคโนโลยี", "ภาษาไทย", "ภาษาอังกฤษ", 
  "สังคมศึกษา", "สุขศึกษา และพละศึกษา", "การงานอาชีพ", "ศิลปะ", "แนะแนว"
];

const GRADES = [
  "อนุบาล 1", "อนุบาล 2", "อนุบาล 3", 
  "ประถมศึกษาปีที่ 1", "ประถมศึกษาปีที่ 2", "ประถมศึกษาปีที่ 3", "ประถมศึกษาปีที่ 4", "ประถมศึกษาปีที่ 5", "ประถมศึกษาปีที่ 6",
  "มัธยมศึกษาปีที่ 1", "มัธยมศึกษาปีที่ 2", "มัธยมศึกษาปีที่ 3"
];

const SCHOOL_DATA = {
  "1. กลุ่มโรงเรียนเมืองทองสัมพันธ์": ["วัดโคศุภราช (รัฐราษบำรุง)", "วัดโบสถ์ (ประภาสวิทยาคาร)", "วัดโพธิวงษ์", "วัดไทรย์ (เกษมจริยคุณ)", "วัดไผ่ล้อม (มีเพิ่มพิทยาภูมิ)", "วัดจันทร์นิรมิตร", "วัดจำปาหล่อ ธรรมะวิทยาทาน", "วัดปลดสัตว์ (เรือไทยสงเคราะห์ 2)", "วัดมหาดไทย (ผลประมุขวิทยา)", "วัดลิ้นทอง (จอมวิสิษฐ์ราษฎร์บำรุง)"],
  "2. กลุ่มโรงเรียนศูนย์เจ้าพระยา": ["กระทุ่มราย (วิบูลย์วิทยาคม)", "บ้านน้ำผึ้ง", "วัดเซิงหวาย (ประชารัฐอุทิศ)", "วัดตาลเจ็ดช่อ (หมอมี-เพิ่ม เกษมสุวรรณ)", "วัดบ้านอิฐ (รัฐประชานุกูล)", "วัดราชปักษี", "วัดรุ้ง (วิบูลย์วิทยาคาร)", "วัดอรัญญิกาวาส", "อนุบาลเมืองอ่างทอง (วัดท้องคุ้งตั้งตรงจิตร ๓)", "อนุบาลวัดอ่างทอง"],
  "3. กลุ่มโรงเรียนแสวงหาพัฒนา": ["ประสิทธิวิทยาฯ", "พวงทองอุปถัมภ์", "วัดทองเลื่อน", "วัดบ้านเพชร", "วัดบ้านพราน", "วัดยาง", "วัดรัตนาราม", "วัดหัวสะแกตก", "อนุบาลแสวงหา"],
  "4. กลุ่มโรงเรียนบ้านนายแท่น": ["ชุมชนวัดริ้วหว้า", "บ้านดอนกร่าง (ฉากราษฎร์บำรุง)", "วัดแก้วกระจ่าง", "วัดจันทร์มณี", "วัดบ้านแก", "วัดรางฉนวนมิตรภาพที่ 202", "วัดวังน้ำเย็น", "วัดสีบัวทอง", "วัดหนองยาง", "วัดหมื่นเกลา"],
  "5. กลุ่มโรงเรียนขุนอินทร์": ["ชุมชนวัดท่าอิฐ", "ชุมชนวัดศีลขันธาราม (วิทยาคม)", "วัดโพธิ์เกรียบ", "วัดข่อย", "วัดท่าโขลง มิตรภาพที่ 135", "วัดท่าตลาด", "วัดน้ำอาบ", "วัดบุญเกิด", "วัดป่ามุนี", "วัดสว่าง"],
  "6. กลุ่มโรงเรียนพระตำหนัก": ["วัดโพธิ์เอน", "วัดโพธิ์ทอง (วิศิษฐ์ประชานุเคราะห์)", "วัดไตรรัตนาราม", "วัดคำหยาด", "วัดงิ้วราย", "วัดจันทราราม", "วัดทางพระ", "วัดม่วงคัน", "วัดยางช้าย", "วัดลั่นทม", "วัดศรีกุญชร", "วัดสนธิธรรม"],
  "7. กลุ่มโรงเรียนเกษไชโย": ["วัดเจ้าบุญเกิด", "วัดเยื้องคงคาราม", "วัดไชโย (เพิ่ม เกษมสุวรรณ 4)", "วัดมหานาม", "วัดละมุด (ละมุดวิทยาคาร)", "วัดวงษ์ภาศน์"],
  "8. กลุ่มโรงเรียนไชโยบูรพา": ["บ้านชะไว (ชวลิตวิทยาคาร)", "วัดไทรย์นิโครธาราม", "วัดกำแพง", "วัดชัยสิทธาราม", "วัดนางเล่ว", "วัดบ้านป่า", "วัดมะขาม (วิบูลย์อุปถัมภ์)", "อนุบาลวัดสระเกษ (หลวงพ่อโต๊ะอุปถัมภ์)"],
  "9. กลุ่มโรงเรียนป่าโมก": ["ชุมชนวัดปราสาท (นรสิงห์ประชาสรรค์)", "ชุมชนวัดพายทอง", "วัดเอกราช (ประชารัฐนุกูล)", "วัดถนน", "วัดพิจารณ์โสภณ (โศภนมิ่งขวัญราษฎร์อุปถัมภ์)", "วัดลาดเค้า (ประชารัฐวิทยา)", "วัดศรีมหาโพธิ", "อนุบาลป่าโมก (วัดโบสถ์สายทอง)"],
  "10. กลุ่มโรงเรียนดอกแก้ว": ["ชุมชนวัดวิเศษชัยชาญ", "วัดแปดแก้ว (สพันธ์พุ่มระชัฏกุล)", "วัดขุมทอง (เจริญราษฎร์นุกูล)", "วัดทำนบ", "วัดราชสกุณา (ราษฎร์รังสฤษฎ์)", "วัดวันอุทิศ (สิริกมลฉ่ำราษฎร์บำรุง)", "วัดหัวตะพาน (ประชาบำรุง)"],
  "11. กลุ่มโรงเรียนพัฒนมิตร": ["ชุมชนวัดน้ำพุ (น้ำพุพิทยาคาร)", "วัดโพธิ์ศรี (ประชารังสรรค์)", "วัดใหม่ทางข้าม", "วัดไผ่วง (ศุกรเสพย์วิทยาคาร)", "วัดคลองสำโรง", "วัดต้นทอง", "วัดนางชำ (ประชารัฐรังสฤษฏ์)", "วัดบางจักร (แพสิริประชาสรรค์)", "วัดลานช้าง (รัตนราษฎร์รังสรรค์)", "วัดสิทธาราม", "วัดสี่ร้อย (ราษฎร์สามัคคีบำรุง)", "วัดหลักแก้ว"],
  "12. กลุ่มโรงเรียนวิเศษเมืองทอง": ["บ้านไผ่หมูขวิด (พงษ์ผลประสาทวิทยา)", "บ้านห้วยคล้า", "วัดตลาดใหม่ (อินทประชาสรรค์)", "วัดน้อย (วิบูลประชาสรรค์)", "วัดมะนาวหวาน (ราษฎร์วิริยะบำรุง)", "วัดยางมณี (ชวนประชาสรรค์)", "วัดศาลาดิน (วิศิษฐ์ราษฎร์รังสรรค์)", "วัดหลวง (วิทยาประชาสรรค์)", "วัดห้วยโรง (สำนักงานสลากกินแบ่งรัฐบาลสงเคราะห์ 160)", "วัดห้วยคันแหลน (ประชารัฐรังสรรค์)", "วัดอบทม (อบทมวิทยาประชานุกูล)", "อนุบาลวัดนางใน (ละเอียดอุปถัมภ์)"],
  "13. กลุ่มโรงเรียนจินดามณี": ["วัดโคกพุทรา (อดุลราษฎร์บำรุง)", "วัดโบสถ์ (ประชานุกูล)", "วัดโพธิ์ราษฎร์", "วัดทองกลาง (ประชากรอุปถัมภ์)", "วัดท่าสามัคคี (สามัคคีประชาสรรค์)", "วัดบ้านสร้าง", "วัดยางทอง", "วัดสามประชุม (วันครู 2504)", "วัดสุวรรณราชหงส์"],
  "14. กลุ่มโรงเรียนสามโก้": ["บ้านดอนตาวง", "บ้านหนองถ้ำ", "วัดเกษทอง", "วัดโบสถ์ (ราษฎร์รังสฤษฏ์)", "วัดท่าชุมนุม", "วัดมงคลธรรมนิมิต", "วัดสามโก้", "วัดสามขาว", "วัดหนองกร่าง", "อนุบาลบ้านลำสนุ่น"]
};

const CRITERIA = [
  "1. ครูใช้คำถามกระตุ้นความสนใจ/ท้าทาย",
  "2. ครูเชื่อมโยงบทเรียนเข้ากับชีวิตจริง",
  "3. ครูเป็น 'ผู้อำนวยความสะดวก' (Facilitator)",
  "4. ผู้เรียนได้ 'ลงมือปฏิบัติ' (Active Learning)",
  "5. ผู้เรียนได้ 'ทำงานร่วมกันเป็นกลุ่ม' (Collaboration)",
  "6. ครูใช้ 'คำถามคิดขั้นสูง' (ทำไม/อย่างไร)",
  "7. ผู้เรียนสรุปองค์ความรู้ด้วยตนเอง",
  "8. ผู้เรียนสะท้อนผลการเรียนรู้ (Reflection)"
];

// --- Colors (Pastel Theme) ---
const COLORS = {
  primary: '#A0C4FF', // Blue
  secondary: '#BDB2FF', // Purple
  accent: '#FFADAD', // Red/Pink
  success: '#CAFFBF', // Green
  warning: '#FDFFB6', // Yellow
  background: '#FDFBF7', // Cream
  text: '#4A4E69',
  chartColors: ['#FFADAD', '#FFD6A5', '#FDFFB6', '#CAFFBF', '#9BF6FF', '#A0C4FF', '#BDB2FF', '#FFC6FF']
};

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('form'); // 'form' or 'dashboard'
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- 2. Authentication & Data Loading ---
  useEffect(() => {
    // เข้าสู่ระบบแบบ Anonymous (ไม่ต้องใช้ Token พิเศษแล้ว เพราะเป็นโปรเจกต์จริง)
    signInAnonymously(auth).catch((error) => {
      console.error("Auth Error:", error);
    });

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    
    // --- 3. Path การดึงข้อมูล (ใช้ 'observations' โดยตรง) ---
    const q = query(collection(db, 'observations'));
    
    const unsubscribeData = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setData(docs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching data:", error);
      // กรณี error อาจเกิดจาก Security Rules ยังไม่เปิด หรือ Index ยังไม่สร้าง
      setLoading(false);
    });

    return () => unsubscribeData();
  }, [user]);

  const toggleView = () => setView(view === 'form' ? 'dashboard' : 'form');

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: COLORS.background, color: COLORS.text }}>
      {/* Navbar */}
      <nav className="sticky top-0 z-50 shadow-sm backdrop-blur-md bg-white/80 border-b border-purple-100">
        <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-purple-100 p-2 rounded-xl text-purple-600">
              <BookOpen size={24} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-700 leading-tight">Smart Observation</h1>
              <p className="text-xs text-slate-500">สพป.อ่างทอง</p>
            </div>
          </div>
          
          <button
            onClick={toggleView}
            className="flex items-center gap-2 px-4 py-2 rounded-full transition-all shadow-sm hover:shadow-md active:scale-95 font-medium text-sm text-white"
            style={{ backgroundColor: view === 'form' ? COLORS.primary : COLORS.accent }}
          >
            {view === 'form' ? (
              <>
                <BarChart2 size={18} /> ดูรายงานผล
              </>
            ) : (
              <>
                <PenTool size={18} /> ไปหน้าประเมิน
              </>
            )}
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <>
            {view === 'form' ? (
              <ObservationForm user={user} />
            ) : (
              <Dashboard data={data} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// --- Component: Form ---
function ObservationForm({ user }) {
  const [formData, setFormData] = useState({
    supervisor: '',
    group: '',
    school: '',
    teacher: '',
    subject: '',
    grade: '',
    studentCount: '',
    scores: {},
    comment: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleGroupChange = (e) => {
    setFormData({ ...formData, group: e.target.value, school: '' }); // Reset school when group changes
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleScoreChange = (index, value) => {
    setFormData(prev => ({
      ...prev,
      scores: { ...prev.scores, [`q${index}`]: parseInt(value) }
    }));
  };

  const calculateTotal = () => {
    return Object.values(formData.scores).reduce((a, b) => a + b, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    // Validation
    if (Object.keys(formData.scores).length < 8 || !formData.supervisor || !formData.school || !formData.teacher) {
      alert('กรุณากรอกข้อมูลและให้คะแนนให้ครบทุกข้อครับ');
      return;
    }

    setIsSubmitting(true);
    const totalScore = calculateTotal();
    const percent = (totalScore / 24) * 100;
    let quality = 'ปรับปรุง';
    if (percent >= 80) quality = 'ดีมาก';
    else if (percent >= 60) quality = 'ดี';

    try {
      // --- 4. Path การบันทึกข้อมูล (ใช้ 'observations' โดยตรง) ---
      await addDoc(collection(db, 'observations'), {
        ...formData,
        totalScore,
        percent,
        quality,
        timestamp: serverTimestamp(),
        userId: user.uid
      });

      setShowSuccess(true);
      setFormData({
        supervisor: '', group: '', school: '', teacher: '', subject: '', grade: '', studentCount: '', scores: {}, comment: ''
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setShowSuccess(false), 3000);

    } catch (error) {
      console.error("Error adding document: ", error);
      alert('เกิดข้อผิดพลาดในการบันทึก: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in-up">
      {showSuccess && (
        <div className="mb-6 p-4 bg-green-100 border border-green-200 text-green-700 rounded-xl flex items-center gap-3 shadow-sm animate-bounce-in">
          <CheckCircle size={24} />
          <span className="font-semibold">บันทึกข้อมูลสำเร็จ! ขอบคุณสำหรับการนิเทศครับ</span>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-xl border border-purple-50 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-100 to-blue-50 px-6 py-4 border-b border-purple-100">
          <h2 className="text-xl font-bold text-purple-800 flex items-center gap-2">
            <ClipboardList /> แบบฟอร์มสังเกตพฤติกรรม
          </h2>
          <p className="text-sm text-purple-600 mt-1">กรุณากรอกข้อมูลให้ครบถ้วนเพื่อการประมวลผลที่แม่นยำ</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Section 1: General Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputSelect label="ผู้สังเกต" value={formData.supervisor} onChange={(e) => handleChange('supervisor', e.target.value)} options={SUPERVISORS} icon={<User size={16}/>} />
            
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-600 ml-1">กลุ่มโรงเรียน</label>
              <select 
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all"
                value={formData.group}
                onChange={handleGroupChange}
                required
              >
                <option value="">-- เลือกกลุ่มโรงเรียน --</option>
                {Object.keys(SCHOOL_DATA).map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-600 ml-1">โรงเรียน</label>
              <select 
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all"
                value={formData.school}
                onChange={(e) => handleChange('school', e.target.value)}
                disabled={!formData.group}
                required
              >
                <option value="">-- เลือกโรงเรียน --</option>
                {formData.group && SCHOOL_DATA[formData.group].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="space-y-1">
               <label className="text-sm font-semibold text-slate-600 ml-1">ชื่อครูผู้สอน</label>
               <div className="relative">
                 <input 
                   type="text" 
                   className="w-full p-3 pl-10 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all"
                   value={formData.teacher}
                   onChange={(e) => handleChange('teacher', e.target.value)}
                   placeholder="ระบุชื่อ-นามสกุล"
                   required
                 />
                 <User className="absolute left-3 top-3.5 text-slate-400" size={18} />
               </div>
            </div>

            <InputSelect label="วิชา" value={formData.subject} onChange={(e) => handleChange('subject', e.target.value)} options={SUBJECTS} />
            <InputSelect label="ระดับชั้น" value={formData.grade} onChange={(e) => handleChange('grade', e.target.value)} options={GRADES} />
            
            <div className="space-y-1">
               <label className="text-sm font-semibold text-slate-600 ml-1">จำนวนนักเรียน (คน)</label>
               <input 
                 type="number" 
                 className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all"
                 value={formData.studentCount}
                 onChange={(e) => handleChange('studentCount', e.target.value)}
                 placeholder="0"
               />
            </div>
          </div>

          <hr className="border-slate-100 my-4" />

          {/* Section 2: Scoring */}
          <div>
            <h3 className="text-lg font-bold text-slate-700 mb-4 bg-green-100 inline-block px-3 py-1 rounded-lg text-green-700">
              เกณฑ์การประเมิน (1=ปรับปรุง, 2=ดี, 3=ดีมาก)
            </h3>
            <div className="space-y-4">
              {CRITERIA.map((criterion, index) => (
                <div key={index} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="text-slate-700 font-medium">{criterion}</div>
                  <div className="flex gap-2 shrink-0">
                    {[1, 2, 3].map((score) => (
                      <button
                        key={score}
                        type="button"
                        onClick={() => handleScoreChange(index + 1, score)}
                        className={`w-12 h-12 rounded-full font-bold text-lg transition-all flex items-center justify-center border-2 ${
                          formData.scores[`q${index+1}`] === score 
                            ? 'bg-purple-500 text-white border-purple-500 scale-110 shadow-lg' 
                            : 'bg-white text-slate-400 border-slate-200 hover:border-purple-300 hover:bg-purple-50'
                        }`}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Comment */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-600 ml-1">ข้อเสนอแนะเพิ่มเติม</label>
            <textarea 
              className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all h-32"
              value={formData.comment}
              onChange={(e) => handleChange('comment', e.target.value)}
              placeholder="พิมพ์ข้อเสนอแนะเพื่อการพัฒนา..."
            ></textarea>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white p-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isSubmitting ? 'กำลังบันทึก...' : <><Save /> บันทึกผลการนิเทศ</>}
          </button>
        </form>
      </div>
    </div>
  );
}

// --- Component: Dashboard ---
function Dashboard({ data }) {
  const stats = useMemo(() => {
    if (data.length === 0) return null;

    const totalObs = data.length;
    const avgScore = data.reduce((acc, curr) => acc + (curr.totalScore || 0), 0) / totalObs;
    
    // Calculate score per criteria
    const criteriaScores = Array(8).fill(0);
    data.forEach(d => {
      if(d.scores) {
        Object.keys(d.scores).forEach(key => { // key is q1, q2...
          const idx = parseInt(key.replace('q', '')) - 1;
          if(idx >= 0 && idx < 8) criteriaScores[idx] += d.scores[key];
        });
      }
    });
    const avgCriteriaScores = criteriaScores.map((s, i) => ({
      subject: `ข้อ ${i+1}`,
      A: (s / totalObs).toFixed(2),
      fullMark: 3
    }));

    // Quality Distribution
    const qualityCount = data.reduce((acc, curr) => {
      acc[curr.quality] = (acc[curr.quality] || 0) + 1;
      return acc;
    }, {});
    const pieData = Object.keys(qualityCount).map(k => ({ name: k, value: qualityCount[k] }));

    // Group Stats
    const groupCount = data.reduce((acc, curr) => {
       acc[curr.group.split('.')[0]] = (acc[curr.group.split('.')[0]] || 0) + 1; // Take only "1", "2" etc prefix
       return acc;
    }, {});
    const barData = Object.keys(groupCount).map(k => ({ name: `กลุ่ม ${k}`, count: groupCount[k] }));

    return { totalObs, avgScore, avgCriteriaScores, pieData, barData };
  }, [data]);

  if (data.length === 0) return (
    <div className="text-center py-20 bg-white rounded-3xl shadow-sm">
      <div className="bg-slate-100 p-6 rounded-full inline-block mb-4 text-slate-400">
        <BarChart2 size={48} />
      </div>
      <h3 className="text-xl font-bold text-slate-600">ยังไม่มีข้อมูลการนิเทศ</h3>
      <p className="text-slate-400">เริ่มบันทึกข้อมูลเพื่อดูรายงานผลที่นี่</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          title="จำนวนการนิเทศทั้งหมด" 
          value={stats.totalObs} 
          unit="ครั้ง" 
          color="bg-blue-100" 
          textColor="text-blue-600" 
          icon={<BookOpen />} 
        />
        <StatCard 
          title="คะแนนเฉลี่ยรวม" 
          value={stats.avgScore.toFixed(2)} 
          unit="/ 24" 
          color="bg-purple-100" 
          textColor="text-purple-600" 
          icon={<LayoutDashboard />} 
        />
        <StatCard 
          title="ระดับคุณภาพส่วนใหญ่" 
          value={stats.pieData.sort((a,b) => b.value - a.value)[0]?.name || '-'} 
          unit="" 
          color="bg-green-100" 
          textColor="text-green-600" 
          icon={<CheckCircle />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><User size={20} className="text-purple-500"/> จุดแข็ง-จุดอ่อน (เฉลี่ย 8 ด้าน)</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={stats.avgCriteriaScores}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 3]} />
                <Radar name="Average" dataKey="A" stroke={COLORS.secondary} fill={COLORS.secondary} fillOpacity={0.6} />
                <RechartsTooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><CheckCircle size={20} className="text-green-500"/> สัดส่วนระดับคุณภาพ</h3>
          <div className="h-72 w-full flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS.chartColors[index % COLORS.chartColors.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bar Chart - School Groups */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><School size={20} className="text-blue-500"/> จำนวนการนิเทศแยกตามกลุ่มโรงเรียน</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.barData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{fontSize: 12}} />
              <YAxis allowDecimals={false} />
              <RechartsTooltip cursor={{fill: '#f9f9f9'}} />
              <Bar dataKey="count" fill={COLORS.primary} radius={[6, 6, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Recent Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
          <h3 className="font-bold text-slate-700">ประวัติการนิเทศล่าสุด</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500">
            <thead className="text-xs text-slate-700 uppercase bg-slate-100">
              <tr>
                <th className="px-6 py-3">โรงเรียน</th>
                <th className="px-6 py-3">ครูผู้สอน</th>
                <th className="px-6 py-3">ผู้สังเกต</th>
                <th className="px-6 py-3 text-center">คุณภาพ</th>
                <th className="px-6 py-3 text-right">คะแนน</th>
              </tr>
            </thead>
            <tbody>
              {data.sort((a,b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)).slice(0, 10).map((item) => (
                <tr key={item.id} className="bg-white border-b hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{item.school}</td>
                  <td className="px-6 py-4">{item.teacher}</td>
                  <td className="px-6 py-4">{item.supervisor.split(' ')[1]} {item.supervisor.split(' ')[2]}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      item.quality === 'ดีมาก' ? 'bg-green-100 text-green-800' : 
                      item.quality === 'ดี' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {item.quality}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-purple-600">{item.totalScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// --- Helper Components ---
function InputSelect({ label, value, onChange, options, icon }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-semibold text-slate-600 ml-1">{label}</label>
      <div className="relative">
        <select 
          className="w-full p-3 pl-10 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all appearance-none"
          value={value}
          onChange={onChange}
          required
        >
          <option value="">-- เลือก{label} --</option>
          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <div className="absolute left-3 top-3.5 text-slate-400">
          {icon || <ArrowRight size={18} />}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, unit, color, textColor, icon }) {
  return (
    <div className={`${color} p-6 rounded-3xl flex items-center justify-between shadow-sm hover:scale-105 transition-transform`}>
      <div>
        <p className={`text-sm font-medium ${textColor} opacity-80`}>{title}</p>
        <h3 className={`text-3xl font-bold ${textColor} mt-1`}>{value} <span className="text-sm font-normal">{unit}</span></h3>
      </div>
      <div className={`p-3 bg-white bg-opacity-40 rounded-2xl ${textColor}`}>
        {icon}
      </div>
    </div>
  );
}