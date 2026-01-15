import React, { useState, useEffect, useRef } from "react";
import {
  Database,
  FileText,
  ShoppingCart,
  Clock,
  UserPlus,
  ChevronDown,
  ChevronUp,
  StickyNote,
  Trash2,
  GraduationCap,
  Truck,
  Edit,
  BookOpen,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Calendar as CalendarIcon,
  Printer,
  CheckSquare,
  Square,
  Users,
  DollarSign,
  BellRing,
  List,
  Save,
  X,
  CreditCard,
  BarChart,
  ArrowRight,
  TrendingUp,
  Book,
  LayoutDashboard,
  Filter,
  MapPin,
} from "lucide-react";

// Recharts
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Firebase
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  collection,
  query,
  serverTimestamp,
} from "firebase/firestore";

// --- Firebase Config ---
const firebaseConfig = {
  apiKey: "AIzaSyDJTsqw6jG0ffN9ED-3I3XE2AHPA3izT1k",
  authDomain: "mpm-systam.firebaseapp.com",
  projectId: "mpm-systam",
  storageBucket: "mpm-systam.firebasestorage.app",
  messagingSenderId: "247233962324",
  appId: "1:247233962324:web:8ed9b154837cfcacb6e8c1",
  measurementId: "G-PKRWR53Q1E",
};

const appId = "mpm-system-v1";
let app, db, auth;
let isFirebaseAvailable = false;
if (firebaseConfig && firebaseConfig.apiKey) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    isFirebaseAvailable = true;
  } catch (error) {
    console.error("Firebase Init Failed", error);
  }
}

const COLORS = {
  PRIMARY: "bg-[#C0AD92]",
  ACCENT: "bg-[#D6C7B7]",
  HOVER: "hover:bg-[#C9BBA9]",
  BACKGROUND: "bg-[#F9F7F5]",
  CARD_BG: "bg-white",
  DANGER: "text-red-600",
  LOW_STOCK_BG: "bg-[#F5E6CC]",
  GRADE_BUTTON: "bg-[#E0D7CC] hover:bg-[#D4C8BC] text-[#333333]",
  TEXT_COLOR: "text-[#333333]",
  BORDER_COLOR: "border-[#D6C7B7]",
  LOG_LESSON_BUTTON: "bg-[#7E8B8B]",
  LOG_LESSON_HOVER: "hover:bg-[#6A7575]",
  REPLENISH_BUTTON: "bg-[#9BB899]",
  REPLENISH_HOVER: "hover:bg-[#8AA588]",
  MEMO_BUTTON: "bg-[#E6C9A8] hover:bg-[#D9B996]",
  BACKUP_BUTTON: "bg-[#8FBC8F] hover:bg-[#7BAA7B]",
  REPORT_BUTTON: "bg-[#7D9D9C] hover:bg-[#688887]",
  TUITION_BUTTON: "bg-[#D4A5A5] hover:bg-[#C39494]",
  EDIT_BUTTON: "bg-[#98C1C8]",
};

// --- Helpers ---
const getTaiwanDateYYYYMMDD = () => {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "Asia/Taipei",
    }).format(new Date());
  } catch (e) {
    return new Date().toISOString().split("T")[0];
  }
};
const getStudentsCollectionPath = () =>
  `/artifacts/${appId}/public/data/students`;
const getLogCollectionPath = () =>
  `/artifacts/${appId}/public/data/transaction_log`;

// --- Logic ---
const getNextWorkbookInfo = (currentId, step = 1) => {
  if (!currentId || currentId.length < 5)
    return { nextId: "錯誤", setJump: false };
  try {
    const version = currentId.substring(0, currentId.length - 3);
    const grade = parseInt(currentId[currentId.length - 3], 10);
    let bookNum = parseInt(currentId.slice(-2), 10);
    if (isNaN(grade) || isNaN(bookNum))
      return { nextId: "格式錯誤", setJump: false };
    if (currentId === `${version}696`)
      return { nextId: "畢業", setJump: false };
    const nextBookNum = bookNum + step;
    let nextGrade = grade;
    let setJump = false;
    let newBookNum = nextBookNum;
    if (grade >= 1 && grade <= 6) {
      if (bookNum <= 40 && nextBookNum > 40 && nextBookNum <= 80) {
        newBookNum = nextBookNum - 40 + 80;
        setJump = true;
      } else if (bookNum <= 88 && bookNum >= 81 && nextBookNum > 88) {
        newBookNum = 41 + (nextBookNum - 89);
        setJump = true;
      } else if (
        bookNum <= 80 &&
        bookNum >= 41 &&
        nextBookNum > 80 &&
        nextBookNum <= 88
      ) {
        newBookNum = 89 + (nextBookNum - 81);
        setJump = true;
      } else if (bookNum <= 96 && bookNum >= 89 && nextBookNum > 96) {
        nextGrade = grade + 1;
        newBookNum = 1 + (nextBookNum - 97);
        setJump = true;
        if (nextGrade > 6) return { nextId: "畢業", setJump: true };
      } else if (grade === 6 && nextBookNum > 96)
        return { nextId: "畢業", setJump: true };
    }
    if (nextBookNum <= 0) {
      if (grade > 1) {
        nextGrade = grade - 1;
        newBookNum = 96 + nextBookNum;
        setJump = true;
      } else newBookNum = 1;
    }
    const nextNumToUse = setJump ? newBookNum : nextBookNum;
    return {
      nextId: `${version}${nextGrade}${String(nextNumToUse).padStart(2, "0")}`,
      setJump,
    };
  } catch (e) {
    return { nextId: "計算錯誤", setJump: false };
  }
};
const getSkippedId = (currentId, skipCount) => {
  let tempId = currentId;
  const step = skipCount > 0 ? 1 : -1;
  const count = Math.abs(skipCount);
  for (let i = 0; i < count; i++) {
    const result = getNextWorkbookInfo(tempId, step);
    tempId = result.nextId;
    if (["錯誤", "畢業", "格式錯誤"].includes(tempId)) break;
  }
  return tempId;
};

// --- Modals ---

// 1. 新增學生 (支援 GKA, 排課)
const AddStudentForm = ({ onAddStudent, onClose, showToast }) => {
  const [name, setName] = useState("");
  const [grade, setGrade] = useState(1);
  const [version, setVersion] = useState("GK");
  const [startingId, setStartingId] = useState("GK101");
  const [initialStock, setInitialStock] = useState("");
  const [initialLessons, setInitialLessons] = useState(24);
  const [classDays, setClassDays] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];
  useEffect(() => {
    setStartingId(`${version}${grade}01`);
  }, [grade, version]);
  const toggleDay = (idx) =>
    setClassDays((prev) =>
      prev.includes(idx) ? prev.filter((d) => d !== idx) : [...prev, idx].sort()
    );
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !startingId) return setError("請填寫完整");
    if (!/^[A-Z]{2,3}\d{3}$/.test(startingId)) return setError("編號格式錯誤");
    setIsLoading(true);
    try {
      await onAddStudent({
        name,
        grade,
        version,
        classDays,
        currentWorkbookId: startingId,
        totalBooksInStock: parseInt(initialStock) || 0,
        lessonsRemaining: parseInt(initialLessons) || 24,
        workbookHistory: [],
        paymentHistory: [],
        memos: [],
        tuitionOwed: false,
        createdAt: serverTimestamp(),
      });
      showToast(`已新增 ${name}`);
      onClose();
    } catch (e) {
      setError("失敗: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="p-6 bg-white rounded-xl shadow-2xl">
      <h3 className="text-xl font-bold mb-4 border-b pb-2">新增學生</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <input
          type="text"
          placeholder="學生姓名"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border rounded-lg"
          required
        />
        <div>
          <label className="block text-sm font-bold text-gray-600 mb-1">
            上課時段
          </label>
          <div className="flex justify-between gap-1">
            {weekDays.map((d, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggleDay(i)}
                className={`w-9 h-9 rounded-full text-xs font-bold ${
                  classDays.includes(i)
                    ? "bg-[#C0AD92] text-white"
                    : "bg-gray-100"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={grade}
            onChange={(e) => setGrade(parseInt(e.target.value))}
            className="flex-1 p-2 border rounded-lg"
          >
            {[1, 2, 3, 4, 5, 6].map((g) => (
              <option key={g} value={g}>
                {g}年級
              </option>
            ))}
          </select>
          <select
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            className="flex-1 p-2 border rounded-lg"
          >
            <option value="GK">GK</option>
            <option value="GKA">GKA</option>
          </select>
        </div>
        <input
          type="text"
          placeholder="起始教材編號"
          value={startingId}
          onChange={(e) => setStartingId(e.target.value.toUpperCase())}
          className="w-full p-2 border rounded-lg"
          required
        />
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="庫存(本)"
            value={initialStock}
            onChange={(e) => setInitialStock(e.target.value)}
            className="flex-1 p-2 border rounded-lg"
            required
          />
          <input
            type="number"
            placeholder="堂數"
            value={initialLessons}
            onChange={(e) => setInitialLessons(e.target.value)}
            className="flex-1 p-2 border rounded-lg"
            required
          />
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-400"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-[#C0AD92] text-white font-bold rounded-lg"
          >
            確認新增
          </button>
        </div>
      </form>
    </div>
  );
};

// 2. 登錄上課
const LogLessonModal = ({
  student,
  onUpdate,
  onClose,
  logTransaction,
  showToast,
}) => {
  const [date, setDate] = useState(getTaiwanDateYYYYMMDD());
  const [booksUsed, setBooksUsed] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const sortedHistory = (student?.workbookHistory || []).sort(
    (a, b) => (b.timestamp || 0) - (a.timestamp || 0)
  );
  const recentDates = sortedHistory.slice(0, 5).map((h) => h.date);
  const isDuplicateDate = recentDates.includes(date);

  const handleConfirm = async () => {
    if (
      isDuplicateDate &&
      !window.confirm(`⚠️ ${date} 已經有紀錄，確定要重複登錄嗎？`)
    )
      return;
    setIsLoading(true);
    try {
      const { nextId } = getNextWorkbookInfo(
        student.currentWorkbookId,
        booksUsed
      );
      const sessionEndId =
        booksUsed > 1
          ? getNextWorkbookInfo(student.currentWorkbookId, booksUsed - 1).nextId
          : student.currentWorkbookId;
      const historyEntry = {
        date,
        booksUsed,
        startId: student.currentWorkbookId,
        endId: sessionEndId,
        timestamp: Date.now(),
      };
      await onUpdate(student.id, {
        currentWorkbookId: nextId,
        totalBooksInStock: (student.totalBooksInStock || 0) - booksUsed,
        lessonsRemaining: (student.lessonsRemaining || 0) - booksUsed,
        workbookHistory: [historyEntry, ...(student.workbookHistory || [])],
      });
      if (logTransaction)
        logTransaction("LogLesson", student.name, {
          prevId: student.currentWorkbookId,
          nextId,
          booksUsed,
          date,
        });
      showToast("打卡成功！");
      onClose();
    } catch (e) {
      showToast("錯誤", "error");
    } finally {
      setIsLoading(false);
    }
  };
  const handleDeleteLog = async (record) => {
    const isLatest =
      sortedHistory[0] && record.timestamp === sortedHistory[0].timestamp;
    if (
      !window.confirm(
        `確定刪除 ${record.date} 紀錄並還原數值嗎？${
          isLatest ? "\n⏪ 進度將自動倒帶" : ""
        }`
      )
    )
      return;
    setIsLoading(true);
    try {
      const updates = {
        totalBooksInStock: student.totalBooksInStock + record.booksUsed,
        lessonsRemaining: student.lessonsRemaining + record.booksUsed,
        workbookHistory: student.workbookHistory.filter(
          (h) => h.timestamp !== record.timestamp
        ),
      };
      if (isLatest) updates.currentWorkbookId = record.startId;
      await onUpdate(student.id, updates);
      showToast("已還原紀錄");
    } catch (e) {
      showToast("失敗", "error");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="p-6 bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
      <h3 className="text-xl font-bold mb-4 border-b pb-2 flex items-center">
        <GraduationCap className="mr-2" /> 登錄上課
      </h3>
      <div className="space-y-4">
        <label className="block text-sm font-bold">上課日期</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={`w-full p-2 border rounded-lg ${
            isDuplicateDate ? "border-red-500 bg-red-50" : ""
          }`}
        />
        {isDuplicateDate && (
          <p className="text-xs text-red-600 font-bold animate-pulse">
            此日期已有紀錄！
          </p>
        )}
        <label className="block text-sm font-bold">今日完成本數</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <button
              key={n}
              onClick={() => setBooksUsed(n)}
              className={`flex-1 py-2 rounded-lg font-bold ${
                booksUsed === n
                  ? "bg-[#7E8B8B] text-white shadow-md"
                  : "bg-gray-100"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="bg-[#F9F7F5] p-3 rounded-xl border border-[#D6C7B7] text-sm">
          <div className="flex justify-between">
            <span>預計範圍</span>
            <span className="font-bold">
              {student.currentWorkbookId} ~{" "}
              {booksUsed > 1
                ? getNextWorkbookInfo(student.currentWorkbookId, booksUsed - 1)
                    .nextId
                : student.currentWorkbookId}
            </span>
          </div>
          <div className="flex justify-between border-t mt-2 pt-2">
            <span>堂數變化</span>
            <span className="font-bold">
              {student.lessonsRemaining} →{" "}
              {student.lessonsRemaining - booksUsed}
            </span>
          </div>
        </div>
        <div className="flex justify-end gap-3 border-b pb-4">
          <button onClick={onClose} className="px-4 py-2 text-gray-500">
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="px-6 py-2 bg-[#7E8B8B] text-white font-bold rounded-lg shadow-md disabled:opacity-50"
          >
            {isDuplicateDate ? "確認重複" : "確認登錄"}
          </button>
        </div>
        <div className="mt-4">
          <h4 className="text-xs font-bold text-gray-400 mb-2">
            最近紀錄 (可刪除)
          </h4>
          <div className="space-y-2">
            {sortedHistory.slice(0, 3).map((r, i) => (
              <div
                key={i}
                className="flex justify-between items-center bg-gray-50 p-2 rounded border text-xs"
              >
                <span>
                  <b>{r.date}</b>: {r.startId} ({r.booksUsed}本)
                </span>
                <button
                  onClick={() => handleDeleteLog(r)}
                  className="text-red-400"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// 3. 編輯進度 (修正：智慧前綴)
const EditProgressModal = ({ student, onUpdate, onClose, showToast }) => {
  const [newVersion, setNewVersion] = useState(student.version || "GK");
  const [newGrade, setNewGrade] = useState(student.grade || 1);
  const [newId, setNewId] = useState(student.currentWorkbookId);
  const [newStock, setNewStock] = useState(student.totalBooksInStock);
  const [newLessons, setNewLessons] = useState(student.lessonsRemaining);
  const [classDays, setClassDays] = useState(student.classDays || []);
  const [isTuitionOwed, setIsTuitionOwed] = useState(
    student.tuitionOwed || false
  );
  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

  // 當版本或年級改變時，自動更新 ID 前綴
  useEffect(() => {
    const prefix = `${newVersion}${newGrade}`;
    // 如果目前 ID 不符合新的前綴，就幫使用者換掉前綴但保留數字 (或是直接重置)
    // 這裡採簡單策略：直接設為前綴，讓使用者自己打數字
    setNewId(prefix);
  }, [newVersion, newGrade]);

  const toggleDay = (idx) =>
    setClassDays((prev) =>
      prev.includes(idx) ? prev.filter((d) => d !== idx) : [...prev, idx].sort()
    );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!/^[A-Z]+\d{3}$/.test(newId)) return alert("編號格式錯誤 (例: GKA101)");
    await onUpdate(student.id, {
      currentWorkbookId: newId,
      totalBooksInStock: parseInt(newStock),
      lessonsRemaining: parseInt(newLessons),
      classDays,
      tuitionOwed: isTuitionOwed,
      version: newVersion,
      grade: parseInt(newGrade),
    });
    showToast("修改成功");
    onClose();
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-2xl">
      <h3 className="text-xl font-bold mb-4">手動編輯資料</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm font-bold text-gray-600">
          上課時段
        </label>
        <div className="flex justify-between gap-1">
          {weekDays.map((d, i) => (
            <button
              key={i}
              type="button"
              onClick={() => toggleDay(i)}
              className={`w-8 h-8 rounded-full text-xs font-bold ${
                classDays.includes(i)
                  ? "bg-[#7E8B8B] text-white"
                  : "bg-gray-100"
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <label className="flex-1">
            版本{" "}
            <select
              value={newVersion}
              onChange={(e) => setNewVersion(e.target.value)}
              className="border p-2 rounded w-full mt-1"
            >
              <option value="GK">GK</option>
              <option value="GKA">GKA</option>
            </select>
          </label>
          <label className="flex-1">
            年級{" "}
            <select
              value={newGrade}
              onChange={(e) => setNewGrade(parseInt(e.target.value))}
              className="border p-2 rounded w-full mt-1"
            >
              {[1, 2, 3, 4, 5, 6].map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          目前進度 (自動產生前綴){" "}
          <input
            value={newId}
            onChange={(e) => setNewId(e.target.value.toUpperCase())}
            className="border p-2 rounded w-full mt-1 font-mono text-lg font-bold"
          />
        </label>

        <div className="flex gap-2">
          <label className="flex-1">
            庫存{" "}
            <input
              type="number"
              value={newStock}
              onChange={(e) => setNewStock(e.target.value)}
              className="border p-2 rounded w-full mt-1"
            />
          </label>
          <label className="flex-1">
            堂數{" "}
            <input
              type="number"
              value={newLessons}
              onChange={(e) => setNewLessons(e.target.value)}
              className="border p-2 rounded w-full mt-1"
            />
          </label>
        </div>
        <label className="flex items-center bg-red-50 p-3 rounded border border-red-100 text-red-800 font-bold cursor-pointer">
          <input
            type="checkbox"
            checked={isTuitionOwed}
            onChange={(e) => setIsTuitionOwed(e.target.checked)}
            className="mr-2 w-4 h-4"
          />{" "}
          標記為欠費
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 rounded"
          >
            取消
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            儲存
          </button>
        </div>
      </form>
    </div>
  );
};

// 4. 繳費登記 (修正：增加編輯/刪除與連動)
const PaymentModal = ({ student, onUpdate, onClose, showToast }) => {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(getTaiwanDateYYYYMMDD());
  const [method, setMethod] = useState("現金");
  const [note, setNote] = useState("");
  const [cycle, setCycle] = useState(student.chargeCycle || 24);
  const [addLessons, setAddLessons] = useState(true);
  const [editingId, setEditingId] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      // 更新模式
      const updated = student.paymentHistory.map((p) =>
        p.id === editingId
          ? { ...p, date, amount: parseInt(amount), method, note }
          : p
      );
      await onUpdate(student.id, { paymentHistory: updated });
      showToast("紀錄已更新");
      setEditingId(null);
    } else {
      // 新增模式
      const newRecord = {
        id: Date.now(),
        date,
        amount: parseInt(amount),
        method,
        note,
      };
      const updates = {
        paymentHistory: [newRecord, ...(student.paymentHistory || [])],
        tuitionOwed: false,
        lastPaymentDate: date,
        lastPaymentAmount: parseInt(amount),
        chargeCycle: parseInt(cycle),
      };
      if (addLessons)
        updates.lessonsRemaining =
          (student.lessonsRemaining || 0) + parseInt(cycle);
      await onUpdate(student.id, updates);
      showToast("繳費登記成功");
      onClose();
    }
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setAmount(p.amount);
    setDate(p.date);
    setMethod(p.method);
    setNote(p.note || "");
  };
  const cancelEdit = () => {
    setEditingId(null);
    setAmount("");
    setDate(getTaiwanDateYYYYMMDD());
    setNote("");
  };

  const deletePayment = async (pid) => {
    if (!window.confirm("確定刪除此紀錄？")) return;
    const shouldDeduct = window.confirm(
      "是否要同時扣回對應的堂數 (例如 -24 堂)？"
    );
    let updates = {
      paymentHistory: student.paymentHistory.filter((p) => p.id !== pid),
    };
    if (shouldDeduct)
      updates.lessonsRemaining = (student.lessonsRemaining || 0) - cycle;
    await onUpdate(student.id, updates);
    showToast("已刪除紀錄");
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
      <h3 className="text-xl font-bold mb-4">
        {editingId ? "編輯繳費紀錄" : `登記繳費 - ${student.name}`}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <label>
            日期{" "}
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border p-2 rounded"
            />
          </label>
          <label>
            金額{" "}
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border p-2 rounded"
              placeholder="$"
              required
            />
          </label>
        </div>
        <div className="flex gap-4">
          {["現金", "轉帳"].map((m) => (
            <label key={m} className="flex items-center cursor-pointer">
              <input
                type="radio"
                checked={method === m}
                onChange={() => setMethod(m)}
                className="mr-1"
              />
              {m}
            </label>
          ))}
        </div>
        {!editingId && (
          <div className="bg-blue-50 p-3 rounded border border-blue-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold text-blue-800">
                收費標準 (堂/期)
              </span>
              <input
                type="number"
                value={cycle}
                onChange={(e) => setCycle(e.target.value)}
                className="w-16 p-1 border rounded text-center"
              />
            </div>
            <label className="flex items-center text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={addLessons}
                onChange={(e) => setAddLessons(e.target.checked)}
                className="mr-2"
              />{" "}
              繳費後增加堂數 (+{cycle})
            </label>
          </div>
        )}
        <input
          placeholder="備註 (選填)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full border p-2 rounded"
        />
        <div className="flex gap-2">
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="flex-1 bg-gray-200 py-2 rounded"
            >
              取消
            </button>
          )}
          <button
            type="submit"
            className="flex-1 bg-[#D4A5A5] text-white py-2 rounded font-bold hover:bg-[#c39494]"
          >
            {editingId ? "儲存變更" : "確認登記"}
          </button>
        </div>
      </form>
      <div className="mt-4 border-t pt-2">
        <h4 className="text-xs font-bold text-gray-400 mb-2">
          最近繳費紀錄 (可修改/刪除)
        </h4>
        <div className="space-y-1 text-sm">
          {(student.paymentHistory || []).slice(0, 5).map((p) => (
            <div
              key={p.id}
              className="flex justify-between bg-gray-50 p-2 rounded items-center"
            >
              <span>
                {p.date} (${p.amount}){" "}
                <span className="text-xs text-gray-400">{p.method}</span>
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(p)}
                  className="text-blue-400"
                >
                  <Edit className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => deletePayment(p.id)}
                  className="text-red-400"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 5. 缺席
const AttendanceModal = ({ student, onUpdate, onClose, showToast }) => {
  const [type, setType] = useState("病假");
  const [date, setDate] = useState(getTaiwanDateYYYYMMDD());
  const [note, setNote] = useState("");
  const handleSubmit = async () => {
    const id = Date.now();
    const record = { id, date, type, note };
    const memo = { id, date, text: `[缺席] ${date} ${type} ${note}` };
    await onUpdate(student.id, {
      attendanceHistory: [record, ...(student.attendanceHistory || [])],
      memos: [memo, ...(student.memos || [])],
    });
    showToast("已登記並同步至備忘");
    onClose();
  };
  return (
    <div className="p-6 bg-white rounded-xl shadow-2xl">
      <h3 className="text-xl font-bold mb-4 flex items-center text-orange-600">
        <Clock className="mr-2" /> 登記缺席
      </h3>
      <div className="space-y-3">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full border p-2 rounded"
        />
        <div className="flex gap-2">
          {["病假", "事假", "無故"].map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`flex-1 py-2 border rounded ${
                type === t ? "bg-orange-100 border-orange-500 font-bold" : ""
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <input
          placeholder="備註..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full border p-2 rounded"
        />
        <button
          onClick={handleSubmit}
          className="w-full bg-orange-500 text-white py-2 rounded font-bold"
        >
          確認
        </button>
      </div>
    </div>
  );
};

// 6. 備忘錄 (修正：即時編輯與顯示)
const MemoModal = ({
  student,
  onUpdate,
  onClose,
  showToast,
  triggerConfirm,
}) => {
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  const addMemo = async () => {
    if (!text) return;
    await onUpdate(student.id, {
      memos: [
        { id: Date.now(), date: getTaiwanDateYYYYMMDD(), text },
        ...(student.memos || []),
      ],
    });
    setText("");
    showToast("已新增");
  };

  const startEdit = (m) => {
    setEditingId(m.id);
    setEditText(m.text);
  };
  const saveEdit = async () => {
    const updated = student.memos.map((m) =>
      m.id === editingId ? { ...m, text: editText } : m
    );
    await onUpdate(student.id, { memos: updated });
    setEditingId(null);
    showToast("已更新");
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-2xl h-[500px] flex flex-col">
      <h3 className="font-bold mb-2">備忘錄 - {student.name}</h3>
      <div className="flex gap-2 mb-4">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 border p-2 rounded"
          placeholder="記事..."
        />
        <button
          onClick={addMemo}
          className="bg-[#E6C9A8] text-white px-4 rounded"
        >
          新增
        </button>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2">
        {(student.memos || []).map((m) => (
          <div
            key={m.id}
            className="bg-gray-50 p-2 rounded text-sm relative group"
          >
            {editingId === m.id ? (
              <div className="flex gap-2">
                <input
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="flex-1 border rounded px-1"
                />
                <button onClick={saveEdit} className="text-green-600">
                  <Save className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <p className="whitespace-pre-wrap">{m.text}</p>
                <span className="text-xs text-gray-400">{m.date}</span>
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => startEdit(m)}
                    className="text-blue-400"
                  >
                    <Edit className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm("刪除?"))
                        onUpdate(student.id, {
                          memos: student.memos.filter((x) => x.id !== m.id),
                        });
                    }}
                    className="text-red-300 hover:text-red-500"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      <button onClick={onClose} className="mt-2 text-gray-500">
        關閉
      </button>
    </div>
  );
};

const HistoryModal = ({ student, onClose }) => (
  <div className="p-6 bg-white rounded-xl shadow-2xl max-h-[80vh] overflow-y-auto">
    <h3 className="font-bold mb-4">歷史紀錄</h3>
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-gray-100">
          <th className="p-2 text-left">日期</th>
          <th className="p-2 text-left">內容</th>
          <th className="p-2 text-left">數值</th>
        </tr>
      </thead>
      <tbody>
        {(student.workbookHistory || []).map((h, i) => (
          <tr key={i} className="border-b">
            <td className="p-2">{h.date}</td>
            <td className="p-2 font-mono">
              上課 (
              {h.booksUsed > 1 && h.endId && h.endId !== h.startId
                ? `${h.startId}~${h.endId}`
                : h.startId}
              )
            </td>
            <td className="p-2">{h.booksUsed}本</td>
          </tr>
        ))}
        {(student.paymentHistory || []).map((p, i) => (
          <tr key={i} className="border-b text-blue-600">
            <td className="p-2">{p.date}</td>
            <td className="p-2">繳費 ({p.method})</td>
            <td className="p-2">${p.amount}</td>
          </tr>
        ))}
        {(student.attendanceHistory || []).map((a, i) => (
          <tr key={i} className="border-b text-orange-600">
            <td className="p-2">{a.date}</td>
            <td className="p-2">缺席 ({a.type})</td>
            <td className="p-2 text-xs">{a.note}</td>
          </tr>
        ))}
      </tbody>
    </table>
    <button onClick={onClose} className="mt-4 w-full bg-gray-100 py-2 rounded">
      關閉
    </button>
  </div>
);

// 7. 學習報告 (修正：美化版 UI)
const ReportModal = ({ student, onClose }) => {
  const [includeMemos, setIncludeMemos] = useState(false);
  const handlePrintWindow = () => {
    const printWindow = window.open("", "", "height=800,width=1000");
    if (!printWindow) return alert("請允許彈出視窗");
    const historyRows = (student.workbookHistory || [])
      .slice(0, 25)
      .map((h) => {
        const range =
          h.booksUsed > 1 && h.endId && h.endId !== h.startId
            ? `${h.startId} ~ ${h.endId}`
            : h.startId;
        return `<tr><td>${h.date}</td><td style="font-weight:bold;">${range}</td><td>${h.booksUsed}本</td></tr>`;
      })
      .join("");
    let memoHtml = "";
    if (includeMemos && student.memos && student.memos.length > 0) {
      memoHtml = `<h3>備忘錄</h3><ul>${student.memos
        .map((m) => `<li><b>${m.date}</b>: ${m.text}</li>`)
        .join("")}</ul><div class="page-break"></div>`;
    }
    const content = `<html><head><title>${student.name}學習報告</title><style>body{font-family:sans-serif;padding:30px;color:#333;max-width:800px;margin:0 auto;}h1{text-align:center;border-bottom:3px solid #C0AD92;padding-bottom:15px;margin-bottom:20px;color:#5E5140;}p.info{text-align:center;background:#F9F7F5;padding:10px;border-radius:8px;font-weight:bold;margin-bottom:30px;}table{width:100%;border-collapse:collapse;margin-top:20px;font-size:14px;}th,td{border:1px solid #ddd;padding:12px;text-align:left;}th{background-color:#E0D7CC;color:#5E5140;}tr:nth-child(even){background-color:#f9f9f9;}ul{line-height:1.8;}@media print{.page-break{page-break-after:always;}}</style></head><body><h1>${student.name} 學習旅程報告</h1><p class="info">目前進度: ${student.currentWorkbookId} &nbsp;|&nbsp; 庫存: ${student.totalBooksInStock}本 &nbsp;|&nbsp; 堂數: ${student.lessonsRemaining}</p><h3>📚 上課紀錄 (最近25筆)</h3><table><thead><tr><th>日期</th><th>完成範圍</th><th>本數</th></tr></thead><tbody>${historyRows}</tbody></table>${memoHtml}<script>window.onload=function(){window.print();}</script></body></html>`;
    printWindow.document.write(content);
    printWindow.document.close();
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-2xl text-center max-w-sm w-full">
      <h3 className="font-bold mb-4 text-xl flex items-center justify-center text-[#5E5140]">
        <FileText className="mr-2" /> 學習報告預覽
      </h3>
      <div className="text-left bg-[#F9F7F5] p-4 rounded-lg mb-4 text-sm max-h-48 overflow-y-auto border border-[#E0D7CC]">
        <div className="flex justify-between items-center mb-2 border-b pb-2">
          <span className="font-bold text-gray-500">最近上課紀錄</span>
          <span className="text-xs text-gray-400">預覽</span>
        </div>
        {(student.workbookHistory || []).slice(0, 5).map((h, i) => (
          <div
            key={i}
            className="flex justify-between py-1.5 border-b border-dashed border-gray-200 last:border-0"
          >
            <span className="text-gray-600">{h.date}</span>
            <span className="font-bold text-[#70956E]">
              {h.booksUsed > 1 && h.endId
                ? `${h.startId}~${h.endId}`
                : h.startId}
            </span>
          </div>
        ))}
      </div>
      <label className="flex items-center justify-center gap-2 mb-4 cursor-pointer bg-blue-50 p-2 rounded border border-blue-100 hover:bg-blue-100 transition">
        <input
          type="checkbox"
          checked={includeMemos}
          onChange={(e) => setIncludeMemos(e.target.checked)}
        />
        <span className="text-sm font-bold text-blue-800">同時列印備忘錄</span>
      </label>
      <div className="flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 py-2 bg-gray-100 rounded text-gray-600"
        >
          取消
        </button>
        <button
          onClick={handlePrintWindow}
          className="flex-1 py-2 bg-[#7D9D9C] text-white rounded shadow font-bold hover:opacity-90"
        >
          確認列印
        </button>
      </div>
    </div>
  );
};

const BackupModal = ({
  students,
  onRestore,
  onClose,
  showToast,
  triggerConfirm,
}) => {
  const fileRef = useRef();
  const handleBackup = () => {
    const data =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(students));
    const a = document.createElement("a");
    a.href = data;
    a.download = `backup_${getTaiwanDateYYYYMMDD()}.json`;
    a.click();
  };
  const handleRestoreFile = (e) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = JSON.parse(ev.target.result);
      triggerConfirm(
        "確認還原",
        `覆蓋現有 ${data.length} 筆資料？`,
        () => {
          onRestore(data);
          showToast("還原成功");
          onClose();
        },
        true
      );
    };
    reader.readAsText(e.target.files[0]);
  };
  return (
    <div className="p-6 bg-white rounded-xl shadow-2xl text-center">
      <h3 className="font-bold mb-4">備份與還原</h3>
      <div className="flex gap-4 justify-center mb-4">
        <button
          onClick={handleBackup}
          className="px-6 py-3 bg-[#8FBC8F] text-white rounded shadow flex items-center"
        >
          <Download className="mr-2 w-4 h-4" />
          下載備份
        </button>
        <button
          onClick={() => fileRef.current.click()}
          className="px-6 py-3 bg-orange-400 text-white rounded shadow flex items-center"
        >
          <Upload className="mr-2 w-4 h-4" />
          上傳還原
        </button>
        <input type="file" ref={fileRef} hidden onChange={handleRestoreFile} />
      </div>
      <button onClick={onClose} className="text-gray-500">
        關閉
      </button>
    </div>
  );
};

// 8. 操作紀錄 (修正：分類按鈕)
const TransactionLogModal = ({
  isOpen,
  onClose,
  logData,
  filter,
  setFilter,
}) => {
  if (!isOpen) return null;
  const logs = logData
    .filter((l) => filter === "All" || l.type === filter)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 100);
  const types = [
    "All",
    "LogLesson",
    "Replenish",
    "ManualEdit",
    "AddStudent",
    "DeleteStudent",
  ];
  const labels = {
    All: "全部",
    LogLesson: "上課",
    Replenish: "補貨",
    ManualEdit: "編輯",
    AddStudent: "新增",
    DeleteStudent: "刪除",
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 rounded-xl w-full max-w-lg max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-bold mb-4">操作紀錄</h3>
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                filter === t
                  ? "bg-[#C0AD92] text-white shadow"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {labels[t] || t}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {logs.map((l) => (
            <div key={l.id} className="text-xs p-2 bg-gray-50 border rounded">
              <span className="font-bold text-[#5E5140]">
                {labels[l.type] || l.type}
              </span>{" "}
              - {l.studentName}{" "}
              <span className="text-gray-400 float-right">
                {new Date(l.timestamp?.toDate()).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full py-2 bg-gray-100 rounded"
        >
          關閉
        </button>
      </div>
    </div>
  );
};

const ResetDateModal = ({ student, onClose }) => (
  <div className="p-6 bg-white rounded-xl shadow-2xl text-center">
    <h3 className="font-bold mb-2">上次重置</h3>
    <p className="text-2xl text-green-600 font-black">
      {student?.lastResetDate || "無"}
    </p>
    <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-100 rounded">
      關閉
    </button>
  </div>
);
const Toast = ({ message, type = "success", onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  if (!message) return null;
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 ${
        type === "success" ? "bg-[#70956E]" : "bg-red-500"
      } text-white px-6 py-3 rounded-full shadow-2xl z-[10000] flex items-center gap-2`}
    >
      {type === "success" ? (
        <CheckCircle className="w-5 h-5" />
      ) : (
        <XCircle className="w-5 h-5" />
      )}
      <span className="font-bold">{message}</span>
    </div>
  );
};
const Modal = ({ children, isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};
const CustomConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  isDestructive = false,
}) => {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[9999]"
      onClick={onClose}
    >
      <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl">
        <h3
          className={`text-xl font-bold mb-3 ${
            isDestructive ? "text-red-600" : "text-gray-800"
          }`}
        >
          {title}
        </h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 rounded-lg"
          >
            取消
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-white font-bold rounded-lg ${
              isDestructive ? "bg-red-500" : "bg-[#70956E]"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
// --- Tabs Components ---

const DashboardTab = ({ students, onReplenish }) => {
  const getRevenueData = () => {
    const data = [];
    const today = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      data.push({
        name: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        income: 0,
      });
    }
    students.forEach((s) =>
      s.paymentHistory?.forEach((p) => {
        const target = data.find((d) => d.name === p.date?.slice(0, 7));
        if (target) target.income += parseInt(p.amount || 0);
      })
    );
    return data;
  };
  const revenueData = getRevenueData();
  const lowStockStudents = students
    .filter((s) => (s.totalBooksInStock || 0) < 5)
    .sort((a, b) => a.totalBooksInStock - b.totalBooksInStock);
  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-extrabold text-gray-800 flex items-center border-b pb-2">
        <LayoutDashboard className="mr-2" /> 統計圖表
      </h2>
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
        <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center">
          <DollarSign className="text-green-600 mr-2" /> 近12個月收入
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart
              data={revenueData}
              margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={60}
                tick={{ fontSize: 11 }}
                interval={0}
              />
              <YAxis />
              <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
              <Bar
                dataKey="income"
                name="收入"
                fill="#C0AD92"
                radius={[4, 4, 0, 0]}
                label={{ position: "top", fill: "#666", fontSize: 10 }}
              />
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
        <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center text-red-600">
          <AlertTriangle className="mr-2" /> 庫存預警 (低於5本)
        </h3>
        {lowStockStudents.length === 0 ? (
          <p className="text-center text-gray-400">庫存充足</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-red-50 text-red-800">
                <tr>
                  <th className="p-3">姓名</th>
                  <th className="p-3">進度</th>
                  <th className="p-3">庫存</th>
                  <th className="p-3">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {lowStockStudents.map((s) => (
                  <tr key={s.id}>
                    <td className="p-3 font-bold">{s.name}</td>
                    <td className="p-3 font-mono">{s.currentWorkbookId}</td>
                    <td className="p-3 text-red-600 font-bold">
                      {s.totalBooksInStock}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => onReplenish(s)}
                        className="bg-green-500 text-white px-3 py-1 rounded-full text-xs"
                      >
                        補貨
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const ReportTab = ({ students }) => {
  const [filter, setFilter] = useState("month");
  const [startDate, setStartDate] = useState(getTaiwanDateYYYYMMDD());
  const [endDate, setEndDate] = useState(getTaiwanDateYYYYMMDD());
  const getFilteredLogs = () => {
    const allLogs = students
      .flatMap((s) =>
        (s.workbookHistory || []).map((h) => ({
          ...h,
          studentName: s.name,
          grade: s.grade,
          dateObj: new Date(h.date || 0),
        }))
      )
      .sort((a, b) => b.dateObj - a.dateObj);
    if (filter === "all") return allLogs;
    if (filter === "custom")
      return allLogs.filter((l) => l.date >= startDate && l.date <= endDate);
    return allLogs.filter((l) => {
      const diff = Math.ceil(Math.abs(new Date() - l.dateObj) / 86400000);
      return filter === "week" ? diff <= 7 : diff <= 30;
    });
  };
  const logs = getFilteredLogs();
  const totalLessons = logs.length;
  const totalBooks = logs.reduce((sum, l) => sum + (l.booksUsed || 0), 0);
  const studentCounts = logs.reduce((acc, l) => {
    acc[l.studentName] = (acc[l.studentName] || 0) + 1;
    return acc;
  }, {});
  const topStudent =
    Object.entries(studentCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";
  return (
    <div className="p-4 space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4 border-b pb-4">
        <h2 className="text-2xl font-extrabold text-gray-800 flex items-center">
          <TrendingUp className="mr-2 text-[#7D9D9C]" /> 報表統計
        </h2>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {["week", "month", "all", "custom"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 text-sm font-bold rounded-lg ${
                filter === f ? "bg-white shadow" : "text-gray-500"
              }`}
            >
              {f === "week"
                ? "本週"
                : f === "month"
                ? "本月"
                : f === "all"
                ? "全部"
                : "📅 自定義"}
            </button>
          ))}
        </div>
      </div>
      {filter === "custom" && (
        <div className="bg-white p-4 rounded-xl border flex gap-4 items-center animate-fade-in">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border p-1 rounded"
          />
          <span className="text-gray-400">~</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border p-1 rounded"
          />
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border flex items-center">
          <div className="bg-blue-50 p-3 rounded-xl mr-4">
            <Users className="text-blue-500" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold">總人次</p>
            <p className="text-2xl font-black">{totalLessons}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border flex items-center">
          <div className="bg-green-50 p-3 rounded-xl mr-4">
            <Book className="text-green-500" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold">完成本數</p>
            <p className="text-2xl font-black">{totalBooks}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border flex items-center">
          <div className="bg-orange-50 p-3 rounded-xl mr-4">
            <CheckCircle className="text-orange-500" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold">勤學王</p>
            <p className="text-xl font-black truncate">{topStudent}</p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">日期</th>
              <th className="p-3 text-left">學生</th>
              <th className="p-3 text-left">範圍</th>
              <th className="p-3 text-center">本數</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {logs.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-8 text-gray-400">
                  無紀錄
                </td>
              </tr>
            ) : (
              logs.map((l, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="p-3 text-gray-600">{l.date}</td>
                  <td className="p-3 font-bold">{l.studentName}</td>
                  <td className="p-3 font-mono flex items-center gap-2">
                    <span className="bg-gray-100 px-2 rounded">
                      {l.startId}
                    </span>
                    {l.booksUsed > 1 && (
                      <>
                        <ArrowRight className="w-3 h-3 text-gray-300" />
                        <span className="bg-gray-100 px-2 rounded">
                          {l.endId}
                        </span>
                      </>
                    )}
                  </td>
                  <td className="p-3 text-center font-black text-green-600">
                    {l.booksUsed}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const OverviewTab = ({ students, onReplenish }) => (
  <div className="p-4">
    <h2 className="text-xl font-bold mb-4">教材總覽</h2>
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <table className="min-w-full text-sm">
        <thead className="bg-[#E0D7CC]">
          <tr>
            <th className="p-3 text-left">學生</th>
            <th className="p-3 text-center">剩餘庫存</th>
            <th className="p-3 text-left">下套建議</th>
            <th className="p-3 text-left">上次補貨</th>
            <th className="p-3">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {students.map((s) => {
            const isLow = s.totalBooksInStock <= 4;
            const nextStart = getSkippedId(
              s.currentWorkbookId,
              s.totalBooksInStock
            );
            const nextEnd = getNextWorkbookInfo(nextStart, 7).nextId;
            return (
              <tr key={s.id} className={isLow ? "bg-red-50" : ""}>
                <td className="p-3 font-bold">
                  {s.name}{" "}
                  <span className="text-xs text-gray-400">({s.version})</span>
                </td>
                <td
                  className={`p-3 text-center font-black text-lg ${
                    isLow ? "text-red-600" : "text-green-700"
                  }`}
                >
                  {s.totalBooksInStock}
                </td>
                <td className="p-3 font-mono text-gray-600">
                  {nextStart} ~ {nextEnd}
                </td>
                <td className="p-3 text-gray-500 text-xs">
                  {s.lastReplenishDate || "-"}
                </td>
                <td className="p-3">
                  {isLow ? (
                    <button
                      onClick={() => onReplenish(s)}
                      className="bg-green-500 text-white px-3 py-1 rounded-full text-xs hover:bg-green-600"
                    >
                      補貨
                    </button>
                  ) : (
                    <span className="text-gray-300 text-xs">充足</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

const TuitionTab = ({ students, onOpenPaymentModal }) => (
  <div className="p-4">
    <h2 className="text-xl font-bold mb-4 flex items-center">
      <DollarSign className="mr-2" /> 繳費管理
    </h2>
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <table className="min-w-full text-sm">
        <thead className="bg-[#D4A5A5] text-white">
          <tr>
            <th className="p-3 text-left">學生</th>
            <th className="p-3 text-left">剩餘堂數</th>
            <th className="p-3 text-left">上次繳費</th>
            <th className="p-3 text-left">狀態</th>
            <th className="p-3">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {students.map((s) => {
            const isDue = s.lessonsRemaining < 3 || s.tuitionOwed;
            return (
              <tr key={s.id} className={isDue ? "bg-red-50" : ""}>
                <td className="p-3 font-bold">{s.name}</td>
                <td
                  className={`p-3 font-black text-lg ${
                    s.lessonsRemaining < 0 ? "text-red-600" : ""
                  }`}
                >
                  {s.lessonsRemaining}
                </td>
                <td className="p-3 text-gray-500">
                  {s.lastPaymentDate || "-"}
                </td>
                <td className="p-3">
                  {isDue ? (
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-bold animate-pulse flex w-fit items-center">
                      <BellRing className="w-3 h-3 mr-1" />
                      {s.tuitionOwed ? "欠費" : "該繳費"}
                    </span>
                  ) : (
                    <span className="text-green-600 text-xs font-bold">
                      正常
                    </span>
                  )}
                </td>
                <td className="p-3">
                  <button
                    onClick={() => onOpenPaymentModal(s)}
                    className="border border-blue-300 text-blue-600 px-3 py-1 rounded hover:bg-blue-50 text-xs font-bold"
                  >
                    登記
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

const MemoOverviewTab = ({ students, onUpdate, triggerConfirm, showToast }) => {
  const list = students.filter((s) => s.memos?.length > 0);
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <List className="mr-2" /> 備忘總覽
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.length === 0 ? (
          <p className="text-gray-400 col-span-full text-center py-10">
            無備忘資料
          </p>
        ) : (
          list.map((s) => (
            <div
              key={s.id}
              className="bg-white p-4 rounded-xl shadow-sm border"
            >
              <h3 className="font-bold text-gray-700 mb-2">{s.name}</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {s.memos.map((m) => (
                  <div
                    key={m.id}
                    className="bg-gray-50 p-2 rounded text-sm relative group"
                  >
                    <p className="text-gray-800">{m.text}</p>
                    <span className="text-xs text-gray-400">{m.date}</span>
                    <button
                      onClick={() =>
                        triggerConfirm(
                          "刪除",
                          "確定刪除?",
                          async () => {
                            await onUpdate(s.id, {
                              memos: s.memos.filter((x) => x.id !== m.id),
                            });
                            showToast("已刪除");
                          },
                          true
                        )
                      }
                      className="absolute top-2 right-2 text-red-300 opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const FinancialReportTab = ({ students }) => {
  const [view, setView] = useState("month");
  const [date, setDate] = useState(getTaiwanDateYYYYMMDD().slice(0, 7));
  const list = students
    .flatMap((s) =>
      (s.paymentHistory || []).map((p) => ({ ...p, name: s.name }))
    )
    .filter((p) =>
      view === "month"
        ? p.date.startsWith(date)
        : p.date.startsWith(date.slice(0, 4))
    )
    .sort((a, b) => (b.date > a.date ? 1 : -1));
  const total = list.reduce((sum, p) => sum + (p.amount || 0), 0);
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold flex items-center">
          <BarChart className="mr-2" /> 繳費報表
        </h2>
        <div className="flex gap-2">
          <input
            type={view === "month" ? "month" : "number"}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border p-1 rounded"
          />
          <button
            onClick={() => setView(view === "month" ? "year" : "month")}
            className="bg-gray-200 px-3 py-1 rounded text-sm"
          >
            {view === "month" ? "切換年報" : "切換月報"}
          </button>
        </div>
      </div>
      <div className="bg-green-50 p-4 rounded-xl border border-green-200 mb-4 text-center">
        <p className="text-green-800 font-bold text-sm">總收入</p>
        <p className="text-3xl font-black text-green-700">
          ${total.toLocaleString()}
        </p>
      </div>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">日期</th>
              <th className="p-3 text-left">學生</th>
              <th className="p-3 text-left">金額</th>
              <th className="p-3 text-left">方式</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {list.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-4 text-gray-400">
                  無資料
                </td>
              </tr>
            ) : (
              list.map((p, i) => (
                <tr key={i}>
                  <td className="p-3">{p.date}</td>
                  <td className="p-3 font-bold">{p.name}</td>
                  <td className="p-3 font-bold text-green-600">${p.amount}</td>
                  <td className="p-3 text-xs bg-gray-50 rounded">{p.method}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// 學生卡片 (補上：上次補貨時間)
const StudentCard = ({
  student,
  onLogLesson,
  onEditProgress,
  onReplenish,
  onDeleteStudent,
  setHistoryStudent,
  setResetDateStudent,
  onOpenMemo,
  onGenerateReport,
  onOpenAttendance,
  isBatchMode,
  isSelected,
  onToggleSelect,
  onOpenPaymentModal,
}) => {
  const lastId = student.workbookHistory?.[0]?.endId || "無";
  const isDue = student.tuitionOwed || student.lessonsRemaining < 3;
  return (
    <div
      className={`relative bg-white p-4 shadow-lg rounded-xl border-l-8 ${
        student.lessonsRemaining < 3 ? "border-red-400" : "border-[#D6C7B7]"
      } transition-all ${isSelected ? "ring-2 ring-blue-500" : ""}`}
    >
      {isBatchMode && (
        <div
          className="absolute -left-10 top-1/2 -translate-y-1/2"
          onClick={() => onToggleSelect(student.id)}
        >
          {isSelected ? (
            <CheckSquare className="text-blue-600 w-8 h-8" />
          ) : (
            <Square className="text-gray-300 w-8 h-8" />
          )}
        </div>
      )}
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-extrabold text-gray-800">
              {student.name}
            </h2>
            <button
              onClick={() => onOpenMemo(student)}
              className="bg-[#E6C9A8] text-white text-xs px-2 py-1 rounded-full"
            >
              備忘
            </button>
            <button
              onClick={() => onOpenPaymentModal(student)}
              className={`text-xs px-2 py-1 rounded-full text-white ${
                isDue ? "bg-red-400 animate-pulse" : "bg-[#D4A5A5]"
              }`}
            >
              {isDue ? "繳費!" : "繳費"}
            </button>
          </div>
          <p className="text-xs text-gray-500">
            {student.version} | {student.grade}年級
          </p>
        </div>
        <div className="text-right">
          <button
            onClick={() => onDeleteStudent(student)}
            className="text-gray-300 hover:text-red-500 mb-1"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <div
            onClick={() => setResetDateStudent(student)}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-xl cursor-pointer ${
              student.lessonsRemaining < 3
                ? "bg-red-500"
                : student.lessonsRemaining < 6
                ? "bg-orange-400"
                : "bg-[#70956E]"
            }`}
          >
            {student.lessonsRemaining}
          </div>
          {isDue && (
            <p className="text-[10px] text-red-500 font-bold mt-1">
              該發學費袋
            </p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="col-span-2 bg-gray-50 p-2 rounded border flex flex-col justify-center">
          <div className="flex justify-between text-[10px] text-gray-400 uppercase px-1">
            <span>上次</span>
            <span>下次</span>
          </div>
          <div className="flex justify-between items-center px-1">
            <span className="font-bold text-gray-500">{lastId}</span>
            <ArrowRight className="w-4 h-4 text-gray-300" />
            <span className="font-black text-lg text-[#70956E]">
              {student.currentWorkbookId}
            </span>
          </div>
        </div>
        <div
          className={`p-2 rounded border text-center flex flex-col justify-center ${
            student.totalBooksInStock <= 4
              ? "bg-red-50 border-red-200"
              : "bg-gray-50"
          }`}
        >
          <p className="text-[10px] text-gray-400">
            庫存 (上次:{student.lastReplenishDate || "-"})
          </p>
          <p
            className={`font-black text-lg ${
              student.totalBooksInStock <= 4 ? "text-red-600" : "text-gray-700"
            }`}
          >
            {student.totalBooksInStock}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 pt-3 border-t">
        <button
          onClick={() => onLogLesson(student)}
          className="col-span-3 bg-[#7E8B8B] text-white py-3 rounded-lg font-black shadow flex items-center justify-center text-lg hover:bg-[#6A7575]"
        >
          <GraduationCap className="mr-2" /> 登錄上課
        </button>
        <button
          onClick={() => onOpenAttendance(student)}
          className="col-span-1 bg-orange-50 text-orange-600 py-2 rounded-lg text-xs font-bold flex flex-col items-center justify-center hover:bg-orange-100"
        >
          <Clock className="w-4 h-4 mb-1" />
          請假
        </button>
        <button
          onClick={() => onReplenish(student)}
          className="col-span-2 bg-[#9BB899] text-white py-2 rounded shadow text-xs font-bold hover:bg-[#8AA588]"
        >
          補貨 (+8)
        </button>
        <button
          onClick={() => onEditProgress(student)}
          className="bg-[#98C1C8] text-white py-2 rounded shadow text-xs flex justify-center items-center"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button
          onClick={() => setHistoryStudent(student)}
          className="bg-gray-100 text-gray-600 py-2 rounded shadow text-xs flex justify-center items-center"
        >
          <BookOpen className="w-4 h-4" />
        </button>
        <button
          onClick={() => onGenerateReport(student)}
          className="col-span-4 bg-[#7D9D9C] text-white py-2 rounded shadow text-xs font-bold flex justify-center items-center"
        >
          <FileText className="w-4 h-4 mr-2" /> 學習報告
        </button>
      </div>
    </div>
  );
};

const Header = ({
  searchTerm,
  setSearchTerm,
  activeTab,
  onSetActiveTab,
  onOpenBackup,
  onDownloadPDF,
  setLogModalOpen,
}) => {
  const ORDER_URL = "https://class.mpmmath.com.tw/MPMCR/Order2018/index.jsp";
  return (
    <header
      className={`${COLORS.PRIMARY} shadow-lg sticky top-0 z-40 text-[#333]`}
    >
      <div className="p-4 flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-lg font-black tracking-tighter">時代MPM管理系統</h1>
        <div className="relative flex-1 max-w-xs">
          <input
            type="text"
            placeholder="搜尋..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-4 py-1.5 rounded-full border-none bg-white/80 text-sm"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2" />
        </div>
        <div className="flex gap-2">
          <button
            onClick={onOpenBackup}
            className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold flex items-center hover:bg-white hover:text-black transition-colors"
          >
            <Database className="w-3 h-3 mr-1" />
            備份
          </button>
          <button
            onClick={onDownloadPDF}
            className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold flex items-center hover:bg-white hover:text-black transition-colors"
          >
            <Download className="w-3 h-3 mr-1" />
            總表
          </button>
          <button
            onClick={setLogModalOpen}
            className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold flex items-center hover:bg-white hover:text-black transition-colors"
          >
            <Clock className="w-3 h-3 mr-1" />
            紀錄
          </button>
          <a
            href={ORDER_URL}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold flex items-center hover:bg-white hover:text-black transition-colors no-underline text-[#333]"
          >
            <ShoppingCart className="w-3 h-3 mr-1" />
            請領
          </a>
        </div>
      </div>
      <div className="flex border-t border-black/5 overflow-x-auto no-scrollbar bg-white/10">
        {[
          "統計圖表",
          "學生名單",
          "教材總覽",
          "報表統計",
          "繳費管理",
          "備忘總覽",
          "繳費報表",
        ].map((tab) => (
          <button
            key={tab}
            onClick={() => onSetActiveTab(tab)}
            className={`px-4 py-3 text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === tab
                ? "bg-white/90 text-gray-800"
                : "text-gray-700 hover:bg-white/20"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
    </header>
  );
};

const App = () => {
  const [students, setStudents] = useState([]);
  const [logData, setLogData] = useState([]);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [resetDateStudent, setResetDateStudent] = useState(null);
  const [activeTab, setActiveTab] = useState("統計圖表");
  const [logFilter, setLogFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [dayFilter, setDayFilter] = useState(new Date().getDay());
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState(new Set());
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [confirmation, setConfirmation] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    isDestructive: false,
  });

  const showToast = (message, type = "success") => setToast({ message, type });
  const triggerConfirm = (title, message, onConfirm, isDestructive = false) =>
    setConfirmation({ isOpen: true, title, message, onConfirm, isDestructive });

  useEffect(() => {
    if (!isFirebaseAvailable) {
      setIsAuthReady(true);
      return;
    }
    onAuthStateChanged(auth, async (user) => {
      if (!user) await signInAnonymously(auth);
      setUserId(user ? user.uid : null);
      setIsAuthReady(true);
    });
  }, []);

  useEffect(() => {
    if (!isAuthReady || !userId) return;
    const unsubStudents = onSnapshot(
      query(collection(db, getStudentsCollectionPath())),
      (snap) => {
        const list = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
        setStudents(
          list.sort((a, b) => a.grade - b.grade || a.name.localeCompare(b.name))
        );
        if (selectedStudent)
          setSelectedStudent(list.find((s) => s.id === selectedStudent.id));
      }
    );
    const unsubLogs = onSnapshot(
      query(collection(db, getLogCollectionPath())),
      (snap) => {
        setLogData(
          snap.docs.map((d) => ({
            ...d.data(),
            id: d.id,
            timestamp: d.data().timestamp,
          }))
        );
      }
    );
    return () => {
      unsubStudents();
      unsubLogs();
    };
  }, [isAuthReady, userId]);

  const handleAdd = async (s) => {
    if (isFirebaseAvailable) {
      await addDoc(collection(db, getStudentsCollectionPath()), s);
      logToFirestore("AddStudent", s.name, {});
    }
  };
  const handleUpdate = async (id, data) => {
    if (isFirebaseAvailable)
      await updateDoc(doc(db, getStudentsCollectionPath(), id), data);
  };
  const handleReplenish = async (s) => {
    const start = getSkippedId(s.currentWorkbookId, s.totalBooksInStock);
    const end = getNextWorkbookInfo(start, 7).nextId;
    await updateDoc(doc(db, getStudentsCollectionPath(), s.id), {
      totalBooksInStock: (s.totalBooksInStock || 0) + 8,
      lastReplenishDate: getTaiwanDateYYYYMMDD(),
      lastReplenishRange: `${start}~${end}`,
    });
    logToFirestore("Replenish", s.name, { amount: 8 });
    showToast("補貨成功");
  };
  const logToFirestore = async (type, name, det) => {
    if (isFirebaseAvailable)
      await addDoc(collection(db, getLogCollectionPath()), {
        timestamp: serverTimestamp(),
        type,
        studentName: name,
        ...det,
      });
  };

  const handleDownloadPDF = () => {
    const printWindow = window.open("", "", "height=800,width=1000");
    if (!printWindow) return alert("請允許彈出視窗");
    const rows = students
      .map((s) => {
        let nextRange = "N/A";
        try {
          const start = getSkippedId(s.currentWorkbookId, s.totalBooksInStock);
          const end = getNextWorkbookInfo(start, 7).nextId;
          nextRange = `${start}~${end}`;
        } catch (e) {}
        return `<tr><td>${s.name}</td><td>${s.grade}</td><td>${s.version}</td><td>${s.currentWorkbookId}</td><td>${s.totalBooksInStock}</td><td>${s.lessonsRemaining}</td><td>${nextRange}</td></tr>`;
      })
      .join("");
    printWindow.document.write(
      `<html><head><title>總表</title><style>table{width:100%;border-collapse:collapse;}th,td{border:1px solid #ccc;padding:5px;}</style></head><body><h1>學生總表</h1><table><thead><tr><th>姓名</th><th>年級</th><th>版本</th><th>進度</th><th>庫存</th><th>堂數</th><th>下套建議</th></tr></thead><tbody>${rows}</tbody></table><script>window.print()</script></body></html>`
    );
    printWindow.document.close();
  };

  const renderStudentList = () => {
    const weekDays = ["日", "一", "二", "三", "四", "五", "六"];
    const filtered = students.filter((s) => {
      const matchSearch =
        s.name.includes(searchTerm) ||
        s.currentWorkbookId.includes(searchTerm.toUpperCase());
      return searchTerm
        ? matchSearch
        : dayFilter === "all" || s.classDays?.includes(dayFilter);
    });
    const grouped = filtered.reduce((acc, s) => {
      (acc[s.grade] = acc[s.grade] || []).push(s);
      return acc;
    }, {});

    return (
      <div className="p-4 space-y-4">
        <div className="bg-white p-3 rounded-xl shadow-sm border overflow-x-auto">
          <div className="flex gap-2 min-w-max items-center">
            <button
              onClick={() => setDayFilter("all")}
              className={`px-4 py-2 rounded-lg text-xs font-bold ${
                dayFilter === "all" ? "bg-gray-800 text-white" : "bg-gray-100"
              }`}
            >
              全部
            </button>
            <div className="w-[1px] h-6 bg-gray-200 mx-1" />
            {weekDays.map((d, i) => (
              <button
                key={i}
                onClick={() => setDayFilter(i)}
                className={`w-10 py-2 rounded-lg text-xs font-bold flex flex-col items-center ${
                  dayFilter === i
                    ? "bg-[#C0AD92] text-white shadow-md scale-110"
                    : i === new Date().getDay()
                    ? "bg-yellow-50 text-yellow-600 border border-yellow-200"
                    : "bg-gray-50 text-gray-400"
                }`}
              >
                <span>{d}</span>
                {i === new Date().getDay() && (
                  <span className="text-[8px] mt-0.5">今日</span>
                )}
              </button>
            ))}
          </div>
          <div className="mt-3 pt-2 border-t flex justify-between items-center text-xs text-gray-400 font-bold">
            <span>* 點選「全部」或搜尋姓名</span>
            <span className="bg-gray-100 px-2 py-1 rounded-full text-gray-600">
              目前: {filtered.length} / 總共: {students.length}
            </span>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {[1, 2, 3, 4, 5, 6].map((g) => (
              <button
                key={g}
                onClick={() =>
                  document
                    .getElementById(`grade-${g}`)
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="px-3 py-1 bg-[#E0D7CC] rounded-full text-xs font-bold whitespace-nowrap"
              >
                {g}年級
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsBatchMode(!isBatchMode)}
              className={`p-2 rounded-lg border ${
                isBatchMode
                  ? "bg-blue-600 text-white"
                  : "bg-white text-blue-600"
              }`}
            >
              <Users className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveModal("add")}
              className="p-2 bg-[#C0AD92] text-white rounded-lg shadow"
            >
              <UserPlus className="w-4 h-4" />
            </button>
          </div>
        </div>
        {isBatchMode && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-white px-6 py-3 rounded-full shadow-2xl z-50 flex items-center gap-4 border border-blue-100 animate-bounce-in">
            <span className="font-bold text-blue-800">
              已選 {selectedStudentIds.size} 人
            </span>
            <button
              onClick={() => {
                if (selectedStudentIds.size > 0)
                  triggerConfirm(
                    "批量補貨",
                    `幫 ${selectedStudentIds.size} 人補貨？`,
                    async () => {
                      const today = getTaiwanDateYYYYMMDD();
                      await Promise.all(
                        [...selectedStudentIds].map((id) => {
                          const s = students.find((x) => x.id === id);
                          const start = getSkippedId(
                            s.currentWorkbookId,
                            s.totalBooksInStock
                          );
                          const end = getNextWorkbookInfo(start, 7).nextId;
                          return updateDoc(
                            doc(db, getStudentsCollectionPath(), id),
                            {
                              totalBooksInStock: s.totalBooksInStock + 8,
                              lastReplenishDate: today,
                              lastReplenishRange: `${start}~${end}`,
                            }
                          );
                        })
                      );
                      showToast("批量完成");
                      setIsBatchMode(false);
                      setSelectedStudentIds(new Set());
                    },
                    true
                  );
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-bold shadow"
            >
              統一補貨 (+8)
            </button>
          </div>
        )}
        <div className="space-y-8">
          {Object.keys(grouped)
            .sort()
            .map((g) => (
              <div key={g} id={`grade-${g}`}>
                <h3 className="text-sm font-black text-gray-400 mb-3 pl-1 sticky top-32 z-10 bg-[#F9F7F5] py-2">
                  --- {g} 年級 ({grouped[g].length} 人) ---
                </h3>
                <div className="space-y-4">
                  {grouped[g].map((s) => (
                    <StudentCard
                      key={s.id}
                      student={s}
                      onLogLesson={() => {
                        setSelectedStudent(s);
                        setActiveModal("logLesson");
                      }}
                      onReplenish={() => handleReplenish(s)}
                      onOpenMemo={() => {
                        setSelectedStudent(s);
                        setActiveModal("memo");
                      }}
                      onOpenPaymentModal={() => {
                        setSelectedStudent(s);
                        setActiveModal("payment");
                      }}
                      onGenerateReport={() => {
                        setSelectedStudent(s);
                        setActiveModal("report");
                      }}
                      onOpenAttendance={() => {
                        setSelectedStudent(s);
                        setActiveModal("attendance");
                      }}
                      isBatchMode={isBatchMode}
                      isSelected={selectedStudentIds.has(s.id)}
                      onToggleSelect={(id) => {
                        const n = new Set(selectedStudentIds);
                        if (n.has(id)) n.delete(id);
                        else n.add(id);
                        setSelectedStudentIds(n);
                      }}
                      onDeleteStudent={() =>
                        triggerConfirm(
                          "刪除",
                          `刪除 ${s.name}?`,
                          async () => {
                            await deleteDoc(
                              doc(db, getStudentsCollectionPath(), s.id)
                            );
                            showToast("已刪除");
                          },
                          true
                        )
                      }
                      onEditProgress={() => {
                        setSelectedStudent(s);
                        setActiveModal("edit");
                      }}
                      setHistoryStudent={() => {
                        setSelectedStudent(s);
                        setActiveModal("history");
                      }}
                      setResetDateStudent={() => setResetDateStudent(s)}
                    />
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  };

  if (!isAuthReady)
    return (
      <div className="p-20 text-center font-bold text-gray-400">
        系統載入中...
      </div>
    );

  return (
    <div className={`min-h-screen ${COLORS.BACKGROUND} pb-24`}>
      <Header
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        activeTab={activeTab}
        onSetActiveTab={setActiveTab}
        onOpenBackup={() => setActiveModal("backup")}
        onDownloadPDF={handleDownloadPDF}
        setLogModalOpen={() => setActiveModal("logs")}
      />

      <main className="max-w-4xl mx-auto">
        {activeTab === "統計圖表" && (
          <DashboardTab students={students} onReplenish={handleReplenish} />
        )}
        {activeTab === "學生名單" && renderStudentList()}
        {activeTab === "教材總覽" && (
          <OverviewTab students={students} onReplenish={handleReplenish} />
        )}
        {activeTab === "報表統計" && <ReportTab students={students} />}
        {activeTab === "繳費管理" && (
          <TuitionTab
            students={students}
            onOpenPaymentModal={(s) => {
              setSelectedStudent(s);
              setActiveModal("payment");
            }}
          />
        )}
        {activeTab === "備忘總覽" && (
          <MemoOverviewTab
            students={students}
            onUpdate={handleUpdate}
            triggerConfirm={triggerConfirm}
            showToast={showToast}
          />
        )}
        {activeTab === "繳費報表" && <FinancialReportTab students={students} />}
      </main>

      <Modal
        isOpen={activeModal === "add"}
        onClose={() => setActiveModal(null)}
      >
        <AddStudentForm
          onAddStudent={handleAdd}
          onClose={() => setActiveModal(null)}
          showToast={showToast}
        />
      </Modal>
      <Modal
        isOpen={activeModal === "logLesson"}
        onClose={() => setActiveModal(null)}
      >
        <LogLessonModal
          student={selectedStudent}
          onUpdate={handleUpdate}
          onClose={() => setActiveModal(null)}
          showToast={showToast}
          logTransaction={logToFirestore}
        />
      </Modal>
      <Modal
        isOpen={activeModal === "edit"}
        onClose={() => setActiveModal(null)}
      >
        <EditProgressModal
          student={selectedStudent}
          onUpdate={handleUpdate}
          onClose={() => setActiveModal(null)}
          showToast={showToast}
        />
      </Modal>
      <Modal
        isOpen={activeModal === "memo"}
        onClose={() => setActiveModal(null)}
      >
        <MemoModal
          student={selectedStudent}
          onUpdate={handleUpdate}
          onClose={() => setActiveModal(null)}
          showToast={showToast}
          triggerConfirm={triggerConfirm}
        />
      </Modal>
      <Modal
        isOpen={activeModal === "payment"}
        onClose={() => setActiveModal(null)}
      >
        <PaymentModal
          student={selectedStudent}
          onUpdate={handleUpdate}
          onClose={() => setActiveModal(null)}
          showToast={showToast}
        />
      </Modal>
      <Modal
        isOpen={activeModal === "attendance"}
        onClose={() => setActiveModal(null)}
      >
        <AttendanceModal
          student={selectedStudent}
          onUpdate={handleUpdate}
          onClose={() => setActiveModal(null)}
          showToast={showToast}
        />
      </Modal>
      <Modal
        isOpen={activeModal === "history"}
        onClose={() => setActiveModal(null)}
      >
        <HistoryModal
          student={selectedStudent}
          onClose={() => setActiveModal(null)}
        />
      </Modal>
      <Modal
        isOpen={activeModal === "report"}
        onClose={() => setActiveModal(null)}
      >
        <ReportModal
          student={selectedStudent}
          onClose={() => setActiveModal(null)}
        />
      </Modal>
      <Modal
        isOpen={activeModal === "backup"}
        onClose={() => setActiveModal(null)}
      >
        <BackupModal
          students={students}
          onRestore={async (d) => {
            for (const s of d)
              await addDoc(collection(db, getStudentsCollectionPath()), s);
          }}
          onClose={() => setActiveModal(null)}
          triggerConfirm={triggerConfirm}
          showToast={showToast}
        />
      </Modal>
      <Modal
        isOpen={activeModal === "logs"}
        onClose={() => setActiveModal(null)}
      >
        <TransactionLogModal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          logData={logData}
          filter={logFilter}
          setFilter={setLogFilter}
        />
      </Modal>
      <Modal
        isOpen={resetDateStudent !== null}
        onClose={() => setResetDateStudent(null)}
      >
        <ResetDateModal
          student={resetDateStudent}
          onClose={() => setResetDateStudent(null)}
        />
      </Modal>

      <CustomConfirmModal
        isOpen={confirmation.isOpen}
        onClose={() => setConfirmation({ ...confirmation, isOpen: false })}
        {...confirmation}
        confirmText={confirmation.isDestructive ? "確認刪除" : "確認"}
      />
      <Toast {...toast} onClose={() => setToast({ ...toast, message: "" })} />
    </div>
  );
};

export default App;
