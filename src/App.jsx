import { useState, useEffect, useMemo } from "react";
import Login from "./Login";
import { supabase } from "./supabase";
import {
  LayoutDashboard,
  Armchair,
  BookOpen,
  Users,
  LogOut,
  Settings,
  Bell,
  Library,
  Clock,
  CheckCircle2,
  Search,
  Plus,
  X,
  Book,
  UserRound,
  ClipboardList,
  RotateCcw,
  CalendarDays,
  UserPlus,
  Mail,
  Phone,
  Trash2,
  ArrowLeft,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  Filter,
  Download,
  IndianRupee,
  Printer,
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend as ChartLegend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const CHART_COLORS = [
  "#22d3ee",
  "#a78bfa",
  "#34d399",
  "#fb923c",
  "#f472b6",
  "#facc15",
  "#60a5fa",
  "#f87171",
];

// ================= DATE HELPERS =================

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const FINE_PER_DAY = 50;

function getDaysOverdue(dueDate, today = getLocalDateString()) {
  if (!dueDate || dueDate >= today) return 0;

  const [year1, month1, day1] = dueDate.split("-").map(Number);
  const [year2, month2, day2] = today.split("-").map(Number);

  const due = Date.UTC(year1, month1 - 1, day1);
  const current = Date.UTC(year2, month2 - 1, day2);

  return Math.max(0, Math.floor((current - due) / 86400000));
}

function getFineDays(record, today = getLocalDateString()) {
  const endDate =
    record.status === "returned" && record.return_date
      ? record.return_date
      : today;

  return getDaysOverdue(record.due_date, endDate);
}

function calculateFine(record, today = getLocalDateString()) {
  return getFineDays(record, today) * FINE_PER_DAY;
}

function formatCurrency(amount) {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}

function getPendingFine(record, today = getLocalDateString()) {
  return Math.max(
    0,
    calculateFine(record, today) - Number(record.fine_paid || 0)
  );
}

function formatDate(dateString) {
  if (!dateString) return "—";

  const [year, month, day] = dateString.split("-").map(Number);

  if (!year || !month || !day) return dateString;

  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}


function exportToCSV(filename, rows) {
  if (!rows || rows.length === 0) {
    alert("No data available to export.");
    return;
  }

  const headers = Object.keys(rows[0]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) =>
          `"${String(row[header] ?? "").replace(/"/g, '""')}"`
        )
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}


export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activePage, setActivePage] = useState("Dashboard");
  const [dashboardSearch, setDashboardSearch] = useState("");
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);

  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);

  const [books, setBooks] = useState([]);
  const [booksLoading, setBooksLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [bookCategoryFilter, setBookCategoryFilter] = useState("All Categories");
  const [showAddBook, setShowAddBook] = useState(false);

  const [newBook, setNewBook] = useState({
    title: "",
    author: "",
    category: "",
    isbn: "",
    total_copies: 1,
  });

  const [borrowRecords, setBorrowRecords] = useState([]);
  const [borrowLoading, setBorrowLoading] = useState(false);
  const [showIssueBook, setShowIssueBook] = useState(false);
  const [issueLoading, setIssueLoading] = useState(false);

  const [newIssue, setNewIssue] = useState({
    book_id: "",
    student_id: "",
    due_date: "",
  });

  // ================= STUDENT MANAGEMENT =================

  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [studentLoading, setStudentLoading] = useState(false);
  const [selectedStudentProfile, setSelectedStudentProfile] = useState(null);
  
const dashboardSearchResults = useMemo(() => {
  const query = dashboardSearch.trim().toLowerCase();

  if (!query) return [];

  const matchedBooks = books
    .filter(
      (book) =>
        book.title?.toLowerCase().includes(query) ||
        book.author?.toLowerCase().includes(query)
    )
    .slice(0, 5)
    .map((book) => ({
      id: `book-${book.id}`,
      type: "Book",
      title: book.title,
      subtitle: book.author || "Unknown Author",
      action: () => setActivePage("Book Catalogue"),
    }));

  const matchedStudents = students
    .filter(
      (student) =>
        student.name?.toLowerCase().includes(query) ||
        student.email?.toLowerCase().includes(query)
    )
    .slice(0, 5)
    .map((student) => ({
      id: `student-${student.id}`,
      type: "Student",
      title: student.name,
      subtitle: student.email || "Registered Student",
      action: () => {
        setActivePage("Students");
        setSelectedStudentProfile(student);
      },
    }));

  return [...matchedBooks, ...matchedStudents].slice(0, 8);
}, [dashboardSearch, books, students]);


  const [newStudent, setNewStudent] = useState({
    student_id: "",
    full_name: "",
    email: "",
    phone: "",
    course: "B.Tech",
    branch: "",
    year: "1",
  });

  useEffect(() => {
    fetchSeats();
    fetchBooks();
    fetchBorrowRecords();
    fetchStudents();
  }, []);

  useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    setUser(session?.user ?? null);
    setAuthLoading(false);
  });

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user ?? null);
    setAuthLoading(false);
  });

  return () => subscription.unsubscribe();
}, []);

  // ================= FETCH DATA =================

  async function fetchSeats() {
    const { data, error } = await supabase
      .from("seats")
      .select("*")
      .order("id", { ascending: true });

    if (!error && data) {
      setSeats(data);
    } else if (error) {
      console.error("Seat fetch error:", error.message);
    }

    setLoading(false);
  }

  async function fetchBooks() {
    setBooksLoading(true);

    const { data, error } = await supabase
      .from("books")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setBooks(data);
    } else if (error) {
      console.error("Book fetch error:", error.message);
    }

    setBooksLoading(false);
  }

  async function fetchBorrowRecords() {
    setBorrowLoading(true);

    const { data, error } = await supabase
      .from("borrow_records")
      .select("*, books(title, author)")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setBorrowRecords(data);
    } else if (error) {
      console.error("Borrow records error:", error.message);
    }

    setBorrowLoading(false);
  }

  async function fetchStudents() {
    setStudentsLoading(true);

    const { data, error } = await supabase
      .from("students")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setStudents(data);
    } else if (error) {
      console.error("Student fetch error:", error.message);
    }

    setStudentsLoading(false);
  }

  // ================= SEAT RESERVATION =================

  async function reserveSeat(seat) {
  if (seat.status === "occupied" || seat.status === "reserved") {
    alert("This seat is not available.");
    return;
  }

  const name = prompt("Enter your name to reserve this seat:");
  if (!name || !name.trim()) return;

  const { error } = await supabase
    .from("seats")
    .update({
      status: "reserved",
    })
    .eq("id", seat.id)
    .eq("status", "available");

  if (error) {
    alert("Unable to reserve seat: " + error.message);
  } else {
    alert("Seat reserved successfully!");
    fetchSeats();
  }
}

  async function cancelReservation(seat) {
  const confirmCancel = window.confirm(
    `Are you sure you want to cancel reservation for seat ${
      seat.seat_number || seat.id
    }?`
  );

  if (!confirmCancel) return;

  const { error } = await supabase
    .from("seats")
    .update({
  status: "available",
})
    .eq("id", seat.id)
    .eq("status", "reserved");

  if (error) {
    alert("Unable to cancel reservation: " + error.message);
  } else {
    alert("Reservation cancelled successfully!");
    fetchSeats();
  }
}

  // ================= ADD BOOK =================

  async function addBook(e) {
    e.preventDefault();

    const total = Number(newBook.total_copies);

    if (
      !newBook.title.trim() ||
      !newBook.author.trim() ||
      !Number.isInteger(total) ||
      total < 1
    ) {
      alert("Please enter valid book details. Copies must be at least 1.");
      return;
    }

    const { error } = await supabase.from("books").insert([
      {
        title: newBook.title.trim(),
        author: newBook.author.trim(),
        category: newBook.category.trim() || "General",
        isbn: newBook.isbn.trim() || null,
        total_copies: total,
        available_copies: total,
      },
    ]);

    if (error) {
      alert("Error adding book: " + error.message);
      return;
    }

    alert("Book added successfully!");

    setNewBook({
      title: "",
      author: "",
      category: "",
      isbn: "",
      total_copies: 1,
    });

    setShowAddBook(false);
    fetchBooks();
  }

  // ================= ADD STUDENT =================

  async function addStudent(e) {
    e.preventDefault();

    if (!newStudent.student_id.trim() || !newStudent.full_name.trim()) {
      alert("Roll number and full name are required.");
      return;
    }

    setStudentLoading(true);

    const { error } = await supabase.from("students").insert([
      {
        student_id: newStudent.student_id.trim(),
        name: newStudent.full_name.trim(),
        full_name: newStudent.full_name.trim(),
        email: newStudent.email.trim() || null,
        phone: newStudent.phone.trim() || null,
        course: newStudent.course.trim() || null,
        branch: newStudent.branch.trim() || null,
        year: newStudent.year ? Number(newStudent.year) : null,
      },
    ]);

    setStudentLoading(false);

    if (error) {
      alert(
        error.code === "23505"
          ? "This roll number already exists."
          : "Error adding student: " + error.message
      );
      return;
    }

    alert("Student registered successfully!");

    setNewStudent({
      student_id: "",
      full_name: "",
      email: "",
      phone: "",
      course: "B.Tech",
      branch: "",
      year: "1",
    });

    setShowAddStudent(false);
    fetchStudents();
  }

  // ================= DELETE STUDENT =================

  async function deleteStudent(student) {
    const confirmed = confirm(
      `Are you sure you want to delete ${
        student.full_name || student.name
      }?`
    );

    if (!confirmed) return;

    const { data, error } = await supabase
  .from("students")
  .delete()
  .eq("id", student.id)
  .select();

    if (error) {
  alert("Unable to delete student: " + error.message);
  return;
}

if (!data || data.length === 0) {
  alert("Student was not deleted. Check Supabase permissions.");
  return;
}

alert("Student deleted successfully.");

    if (
      selectedStudentProfile &&
      String(selectedStudentProfile.id) === String(student.id)
    ) {
      setSelectedStudentProfile(null);
    }

    fetchStudents();
  }

  // ================= ISSUE BOOK =================

  async function issueBook(e) {
    e.preventDefault();

    if (!newIssue.book_id || !newIssue.student_id || !newIssue.due_date) {
      alert("Please fill all required fields.");
      return;
    }

    const selectedBook = books.find(
      (book) => String(book.id) === String(newIssue.book_id)
    );

    const selectedStudent = students.find(
      (student) => String(student.id) === String(newIssue.student_id)
    );

    if (!selectedBook || !selectedStudent) {
      alert("Please select a valid book and registered student.");
      return;
    }

    if (Number(selectedBook.available_copies) <= 0) {
      alert("This book is currently unavailable.");
      return;
    }

    setIssueLoading(true);

    const { data: insertedRecord, error: issueError } = await supabase
      .from("borrow_records")
      .insert([
        {
          book_id: selectedBook.id,
          student_name: selectedStudent.full_name || selectedStudent.name,
          student_id: selectedStudent.student_id,
          due_date: newIssue.due_date,
          status: "issued",
        },
      ])
      .select()
      .single();

    if (issueError) {
      setIssueLoading(false);
      alert("Error issuing book: " + issueError.message);
      return;
    }

    const { data: updatedBook, error: stockError } = await supabase
      .from("books")
      .update({
        available_copies: Number(selectedBook.available_copies) - 1,
      })
      .eq("id", selectedBook.id)
      .gt("available_copies", 0)
      .select();

    if (stockError || !updatedBook?.length) {
      await supabase
        .from("borrow_records")
        .delete()
        .eq("id", insertedRecord.id);

      setIssueLoading(false);
      alert("Could not update book stock. Please try again.");
      return;
    }

    setIssueLoading(false);
    setShowIssueBook(false);

    setNewIssue({
      book_id: "",
      student_id: "",
      due_date: "",
    });

    alert("Book issued successfully!");

    fetchBooks();
    fetchBorrowRecords();
  }

  // ================= RETURN BOOK =================
  async function markFinePaid(record) {
  const totalFine = calculateFine(record);
  const alreadyPaid = Number(record.fine_paid || 0);
  const pendingAmount = Math.max(0, totalFine - alreadyPaid);

  if (pendingAmount <= 0) {
    alert("No pending fine for this book.");
    return;
  }

  const confirmPayment = window.confirm(
    `Confirm fine payment of ${formatCurrency(pendingAmount)}?`
  );

  if (!confirmPayment) return;

  const { error } = await supabase
    .from("borrow_records")
    .update({
      fine_amount: totalFine,
      fine_paid: totalFine,
      fine_status: "paid",
    })
    .eq("id", record.id);

  if (error) {
    alert("Failed to update fine payment: " + error.message);
    return;
  }

  await fetchBorrowRecords();
  alert("Fine marked as paid successfully!");
}
    
async function returnBook(record) {
  const confirmed = window.confirm(
    `Confirm return of "${record.books?.title || "this book"}"?`
  );

  if (!confirmed) return;

  const returnDate = getLocalDateString();
  const finalFine = calculateFine(record, returnDate);
  const alreadyPaid = Number(record.fine_paid || 0);

  const { data: updatedRecord, error } = await supabase
    .from("borrow_records")
    .update({
      status: "returned",
      return_date: returnDate,
      fine_amount: finalFine,
      fine_status: finalFine <= alreadyPaid ? "paid" : "unpaid",
    })
    .eq("id", record.id)
    .eq("status", "issued")
    .select();

  if (error) {
    alert("Error returning book: " + error.message);
    return;
  }

  if (!updatedRecord?.length) {
    alert("This book has already been returned.");
    fetchBorrowRecords();
    return;
  }

  const book = books.find(
    (item) => String(item.id) === String(record.book_id)
  );

  if (book) {
    const { error: stockError } = await supabase
      .from("books")
      .update({
        available_copies: Math.min(
          Number(book.total_copies),
          Number(book.available_copies) + 1
        ),
      })
      .eq("id", book.id);

    if (stockError) {
      alert(
        "Return recorded, but stock could not be updated. Please refresh."
      );
    }
  }

  fetchBooks();
  fetchBorrowRecords();
}

  // ================= GENERAL DATA =================

  const today = getLocalDateString();

  const availableSeats = seats.filter(
    (seat) => seat.status === "available"
  ).length;

  const occupiedSeats = seats.filter(
    (seat) => seat.status === "occupied"
  ).length;

  const reservedSeats = seats.filter(
    (seat) => seat.status === "reserved"
  ).length;

  // ================= BOOK SEARCH & FILTER =================

  const bookCategories = useMemo(() => {
    const categories = books
      .map((book) => (book.category || "General").trim())
      .filter(Boolean);

    return ["All Categories", ...new Set(categories)].sort((a, b) => {
      if (a === "All Categories") return -1;
      if (b === "All Categories") return 1;
      return a.localeCompare(b);
    });
  }, [books]);

  const filteredBooks = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return books.filter((book) => {
      const matchesSearch =
        !term ||
        String(book.title || "").toLowerCase().includes(term) ||
        String(book.author || "").toLowerCase().includes(term) ||
        String(book.category || "General").toLowerCase().includes(term) ||
        String(book.isbn || "").toLowerCase().includes(term);

      const category = (book.category || "General").trim();

      const matchesCategory =
        bookCategoryFilter === "All Categories" ||
        category === bookCategoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [books, searchTerm, bookCategoryFilter]);

  const filteredStudents = students.filter((student) => {
    const term = studentSearch.toLowerCase().trim();

    const fullName = (student.full_name || student.name || "").toLowerCase();
    const studentId = String(student.student_id || "").toLowerCase();
    const email = String(student.email || "").toLowerCase();
    const branch = String(student.branch || "").toLowerCase();

    return (
      fullName.includes(term) ||
      studentId.includes(term) ||
      email.includes(term) ||
      branch.includes(term)
    );
  });

  const issuedRecords = borrowRecords.filter(
    (record) => record.status === "issued"
  );

  const returnedRecords = borrowRecords.filter(
    (record) => record.status === "returned"
  );

  const issuedCount = issuedRecords.length;
  const returnedCount = returnedRecords.length;

  const overdueCount = issuedRecords.filter(
    (record) => record.due_date < today
  ).length;

  
const totalPendingFines = borrowRecords.reduce(
  (sum, record) => {
    const totalFine = calculateFine(record, today);
    const finePaid = Number(record.fine_paid || 0);

    return sum + Math.max(0, totalFine - finePaid);
  },
  0
);


  // ================= DASHBOARD ANALYTICS =================

  const monthlyAnalytics = useMemo(() => {
    const months = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setDate(1);
      date.setMonth(date.getMonth() - i);

      const year = date.getFullYear();
      const month = date.getMonth();

      months.push({
        key: `${year}-${String(month + 1).padStart(2, "0")}`,
        month: date.toLocaleDateString("en-US", {
          month: "short",
          year: "2-digit",
        }),
        issued: 0,
        returned: 0,
      });
    }

    borrowRecords.forEach((record) => {
      if (record.issue_date) {
        const issueMonth = record.issue_date.slice(0, 7);
        const target = months.find((item) => item.key === issueMonth);

        if (target) target.issued += 1;
      }

      if (record.return_date) {
        const returnMonth = record.return_date.slice(0, 7);
        const target = months.find((item) => item.key === returnMonth);

        if (target) target.returned += 1;
      }
    });

    return months;
  }, [borrowRecords]);

  const topBorrowedBooks = useMemo(() => {
    const counts = {};

    borrowRecords.forEach((record) => {
      const title = record.books?.title || "Unknown Book";

      counts[title] = (counts[title] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([title, count]) => ({ title, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [borrowRecords]);

  const categoryAnalytics = useMemo(() => {
    const counts = {};

    books.forEach((book) => {
      const category = book.category?.trim() || "General";

      counts[category] =
        (counts[category] || 0) + Number(book.total_copies || 0);
    });

    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
    }));
  }, [books]);

  const totalCopies = books.reduce(
    (sum, book) => sum + Number(book.total_copies || 0),
    0
  );

  if (authLoading) {
  return (
    <div className="min-h-screen bg-[#070d18] flex items-center justify-center text-cyan-400">
      Loading LibraSmart...
    </div>
  );
}

if (!user) {
  return <Login onLogin={setUser} />;
}

  
const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Seat Reservation", icon: Armchair },
  { name: "Book Catalogue", icon: BookOpen },
  { name: "Issue & Return", icon: ClipboardList },
  { name: "Students", icon: Users },
  { name: "Reports", icon: BarChart3 },
  { name: "Settings", icon: Settings },
];


  return (
    <div className="min-h-screen bg-[#070d18] text-slate-200 flex flex-col md:flex-row">
      {/* ================= SIDEBAR ================= */}

      <aside className="hidden md:flex md:w-64 md:flex-shrink-0 bg-[#050914] border-r border-white/10 flex-col min-h-screen">
        <div className="px-6 py-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 flex items-center justify-center">
            <Library className="text-cyan-400" size={22} />
          </div>

          <div>
            <h1 className="font-bold text-lg text-white">LibraSmart</h1>
            <p className="text-xs text-slate-500">Library Management</p>
          </div>
        </div>

        <nav className="px-3 mt-5 flex-1">
          <p className="text-xs uppercase tracking-widest text-slate-600 px-3 mb-3">
            Main Menu
          </p>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = activePage === item.name;

            return (
              <button
                key={item.name}
                onClick={() => {
                  setActivePage(item.name);
                  setSelectedStudentProfile(null);
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl mb-1 text-sm transition ${
                  active
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={18} />
                {item.name}
              </button>
            );
          })}
        </nav>

        <div className="p-4 m-3 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="flex items-center gap-2 text-cyan-400 mb-2">
            <Clock size={15} />
            <span className="text-xs font-semibold">Library Hours</span>
          </div>
          <p className="text-xs text-slate-400">8:00 AM – 10:00 PM</p>
        </div>

        <div className="px-6 py-4 border-t border-white/10 text-xs text-slate-600">
          LibraSmart © 2026
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}

      <main className="flex-1 min-w-0">
        
<header className="min-h-20 border-b border-white/10 flex items-center justify-between px-4 sm:px-6 md:px-8 gap-3">
  <div className="min-w-0">
    <h2 className="text-lg sm:text-xl font-semibold text-white truncate">
      {selectedStudentProfile ? "Student Profile" : activePage}
    </h2>
    <p className="text-xs text-slate-500 mt-1">
      Library Management System
    </p>
  </div>

  {/* Mobile Page Navigation */}
  <div className="flex items-center gap-2 md:hidden">
    <select
      value={activePage}
      onChange={(e) => {
        setActivePage(e.target.value);
        setSelectedStudentProfile(null);
      }}
      className="bg-[#0c1626] text-cyan-400 border border-cyan-500/30 rounded-lg px-2 py-2 text-xs max-w-[130px]"
    >
      {menuItems.map((item) => (
        <option key={item.name} value={item.name}>
          {item.name}
        </option>
      ))}
    </select>
  </div>

  <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
    <button
      onClick={() => setShowNotificationCenter(true)}
      className="relative p-2 text-slate-400 hover:text-white transition-colors"
    >
      <Bell size={19} />
      <span className="absolute top-1 right-1 w-2 h-2 bg-cyan-400 rounded-full" />
    </button>

      
    <div className="w-9 h-9 rounded-full bg-cyan-500/20 border border-cyan-500/20 flex items-center justify-center text-cyan-300 font-semibold">
  H
</div>

    <button
  onClick={async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert(error.message);
    }
  }}
  className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition text-sm"
  title="Logout"
>
  <LogOut size={18} />
  <span className="hidden sm:inline">Logout</span>
</button>
  </div>
</header>


        
{/* ================= NOTIFICATIONS CENTER ================= */}

{showNotificationCenter && (
  <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
    <div className="w-full max-w-md h-full bg-[#0c1626] border-l border-white/10 shadow-2xl overflow-y-auto">

      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <div>
          <h2 className="text-xl font-bold text-white">
            Notifications
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Library activity and alerts
          </p>
        </div>

        <button
          onClick={() => setShowNotificationCenter(false)}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
        >
          <X size={20} />
        </button>
      </div>

      {/* Notification Content */}
      <div className="p-5 space-y-4">

        {/* Overdue Books */}
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-3 mb-2">
            <Clock size={18} className="text-red-400" />
            <h3 className="text-sm font-semibold text-red-400">
              Overdue Books
            </h3>
          </div>

          <p className="text-2xl font-bold text-white">
            {overdueCount}
          </p>

          <p className="text-xs text-slate-400 mt-1">
            Books are past their due date.
          </p>
        </div>

        {/* Pending Fines */}
        <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
          <div className="flex items-center gap-3 mb-2">
            <IndianRupee size={18} className="text-orange-400" />
            <h3 className="text-sm font-semibold text-orange-400">
              Pending Fine Collection
            </h3>
          </div>

          <p className="text-2xl font-bold text-white">
            {formatCurrency(totalPendingFines)}
          </p>

          <p className="text-xs text-slate-400 mt-1">
            Outstanding fines to be collected.
          </p>
        </div>

        {/* Currently Issued */}
        <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen size={18} className="text-cyan-400" />
            <h3 className="text-sm font-semibold text-cyan-400">
              Currently Issued
            </h3>
          </div>

          <p className="text-2xl font-bold text-white">
            {issuedRecords.length}
          </p>

          <p className="text-xs text-slate-400 mt-1">
            Books currently borrowed by students.
          </p>
        </div>

        {/* Seat Reservations */}
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
          <div className="flex items-center gap-3 mb-2">
            <Armchair size={18} className="text-green-400" />
            <h3 className="text-sm font-semibold text-green-400">
              Seat Availability
            </h3>
          </div>

          <p className="text-2xl font-bold text-white">
            {availableSeats}
          </p>

          <p className="text-xs text-slate-400 mt-1">
            Seats currently available in the library.
          </p>
        </div>

      </div>
    </div>
  </div>
)}


        <div className="p-8">
          {/* ================= DASHBOARD ================= */}

          {activePage === "Dashboard" && (    
          <div>
{/* ================= DASHBOARD GLOBAL SEARCH ================= */}

<div className="relative mb-6">
  <Search
    size={20}
    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
  />

  <input
    type="text"
    value={dashboardSearch}
    onChange={(e) => setDashboardSearch(e.target.value)}
    placeholder="Search books, students, or borrowing records..."
    className="w-full bg-[#0c1626] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white text-sm outline-none focus:border-cyan-500/50 transition-all"
  />
</div>


{/* ================= DASHBOARD SEARCH RESULTS ================= */}

{dashboardSearch.trim() && (
  <div className="bg-[#0c1626] border border-white/5 rounded-xl p-4 mb-6">
    <p className="text-xs text-slate-500 mb-3">
      Search Results ({dashboardSearchResults.length})
    </p>

    {dashboardSearchResults.length > 0 ? (
      <div className="space-y-2">
        {dashboardSearchResults.map((result) => (
          <button
            key={result.id}
            onClick={result.action}
            className="w-full flex items-center justify-between gap-3 p-3 rounded-lg bg-[#111f32] hover:bg-[#172940] transition-all text-left"
          >
            <div className="min-w-0">
              <p className="text-sm text-white font-medium truncate">
                {result.title}
              </p>
              <p className="text-xs text-slate-500 mt-1 truncate">
                {result.subtitle}
              </p>
            </div>

            <span className="text-xs text-cyan-400 shrink-0">
              {result.type}
            </span>
          </button>
        ))}
      </div>
    ) : (
      <p className="text-sm text-slate-500 py-3">
        No books or students found.
      </p>
    )}
  </div>
)}




{/* ================= QUICK ACTIONS ================= */}

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

  <button
    onClick={() => {
  setActivePage("Book Catalogue");
  setShowAddBook(true);
}}
    className="flex items-center gap-3 p-4 bg-[#0c1626] border border-white/5 rounded-xl hover:border-cyan-500/40 hover:bg-[#111f32] transition-all"
  >
    <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-lg">
      <BookOpen size={20} />
    </div>
    <div className="text-left">
      <p className="text-sm font-semibold text-white">Add New Book</p>
      <p className="text-xs text-slate-500">Manage catalogue</p>
    </div>
  </button>

  <button
    onClick={() => {
  setActivePage("Students");
  setShowAddStudent(true);
}}
    className="flex items-center gap-3 p-4 bg-[#0c1626] border border-white/5 rounded-xl hover:border-purple-500/40 hover:bg-[#111f32] transition-all"
  >
    <div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg">
      <UserPlus size={20} />
    </div>
    <div className="text-left">
      <p className="text-sm font-semibold text-white">Register Student</p>
      <p className="text-xs text-slate-500">Manage students</p>
    </div>
  </button>

  <button
    onClick={() => {
  setActivePage("Issue & Return");
  setShowIssueBook(true);
}}
    className="flex items-center gap-3 p-4 bg-[#0c1626] border border-white/5 rounded-xl hover:border-orange-500/40 hover:bg-[#111f32] transition-all"
  >
    <div className="p-3 bg-orange-500/10 text-orange-400 rounded-lg">
      <ClipboardList size={20} />
    </div>
    <div className="text-left">
      <p className="text-sm font-semibold text-white">Issue a Book</p>
      <p className="text-xs text-slate-500">Issue & return books</p>
    </div>
  </button>

  <button
    onClick={() => setActivePage("Seat Reservation")}
    className="flex items-center gap-3 p-4 bg-[#0c1626] border border-white/5 rounded-xl hover:border-green-500/40 hover:bg-[#111f32] transition-all"
  >
    <div className="p-3 bg-green-500/10 text-green-400 rounded-lg">
      <Armchair size={20} />
    </div>
    <div className="text-left">
      <p className="text-sm font-semibold text-white">Reserve a Seat</p>
      <p className="text-xs text-slate-500">Manage seat booking</p>
    </div>
  </button>

</div>

              
<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
  <StatCard
    title="Total Seats"
    value={seats.length}
    icon={Armchair}
    color="cyan"
  />

  <StatCard
    title="Available Seats"
    value={availableSeats}
    icon={CheckCircle2}
    color="green"
  />

  <StatCard
    title="Books in Catalogue"
    value={books.length}
    icon={BookOpen}
    color="purple"
  />

  <StatCard
    title="Currently Issued"
    value={issuedCount}
    icon={ClipboardList}
    color="orange"
  />

  <StatCard
    title="Registered Students"
    value={students.length}
    icon={Users}
    color="cyan"
  />

  <StatCard
    title="Overdue Books"
    value={overdueCount}
    icon={Clock}
    color="red"
  />

  
  <StatCard
    title="Pending Fines"
    value={formatCurrency(totalPendingFines)}
    icon={IndianRupee}
    color="red"
  />
</div>


              {/* Monthly Issue & Return Chart */}

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mt-8">
                <div className="bg-[#0c1626] border border-white/5 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-cyan-400/10 flex items-center justify-center">
                      <TrendingUp size={20} className="text-cyan-400" />
                    </div>

                    <div>
                      <h3 className="font-semibold text-white">
                        Monthly Issue & Return Trends
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Activity over the last 6 months
                      </p>
                    </div>
                  </div>

                  {borrowLoading ? (
                    <p className="text-slate-400 py-12 text-center">
                      Loading analytics...
                    </p>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={monthlyAnalytics}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis
                          dataKey="month"
                          stroke="#64748b"
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis
                          stroke="#64748b"
                          allowDecimals={false}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0c1626",
                            border: "1px solid #334155",
                            borderRadius: "10px",
                            color: "#e2e8f0",
                          }}
                        />
                        <ChartLegend />

                        <Bar
                          dataKey="issued"
                          name="Issued"
                          fill="#22d3ee"
                          radius={[4, 4, 0, 0]}
                        />

                        <Bar
                          dataKey="returned"
                          name="Returned"
                          fill="#34d399"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Category Distribution Chart */}

                <div className="bg-[#0c1626] border border-white/5 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-purple-400/10 flex items-center justify-center">
                      <PieChartIcon size={20} className="text-purple-400" />
                    </div>

                    <div>
                      <h3 className="font-semibold text-white">
                        Book Category Distribution
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Catalogue copies by category
                      </p>
                    </div>
                  </div>

                  {categoryAnalytics.length === 0 ? (
                    <p className="text-slate-500 py-12 text-center">
                      Add books to see category analytics.
                    </p>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center">
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={categoryAnalytics}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={90}
                            innerRadius={48}
                            paddingAngle={3}
                          >
                            {categoryAnalytics.map((entry, index) => (
                              <Cell
                                key={entry.name}
                                fill={CHART_COLORS[index % CHART_COLORS.length]}
                              />
                            ))}
                          </Pie>

                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#0c1626",
                              border: "1px solid #334155",
                              borderRadius: "10px",
                              color: "#e2e8f0",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  <div className="flex flex-wrap justify-center gap-3 mt-3">
                    {categoryAnalytics.map((entry, index) => (
                      <div
                        key={entry.name}
                        className="flex items-center gap-2 text-xs"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{
                            backgroundColor:
                              CHART_COLORS[index % CHART_COLORS.length],
                          }}
                        />
                        <span className="text-slate-400">
                          {entry.name} ({entry.value})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Most Borrowed Books */}

              <div className="bg-[#0c1626] border border-white/5 rounded-2xl p-3 sm:p-6 mt-5 w-full min-w-0 overflow-hidden">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-orange-400/10 flex items-center justify-center">
                    <BarChart3 size={20} className="text-orange-400" />
                  </div>

                  <div>
                    <h3 className="font-semibold text-white">
                      Most Borrowed Books
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Top 5 books based on borrowing records
                    </p>
                  </div>
                </div>

                {topBorrowedBooks.length === 0 ? (
                  <p className="text-slate-500 py-8 text-center">
                    No borrowing activity yet. Issue books to see rankings.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart
                      data={topBorrowedBooks}
                      layout="vertical"
                      margin={{ left: 10, right: 25 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis
                        type="number"
                        stroke="#64748b"
                        allowDecimals={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="title"
                        stroke="#64748b"
                        width={window.innerWidth < 640 ? 100 : 150}
                        tick={{ fontSize: window.innerWidth < 640 ? 10 : 11 }}
                        interval={0}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0c1626",
                          border: "1px solid #334155",
                          borderRadius: "10px",
                          color: "#e2e8f0",
                        }}
                      />
                      <Bar
                        dataKey="count"
                        name="Times Borrowed"
                        fill="#a78bfa"
                        radius={[0, 5, 5, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Seat Overview and Library Summary */}

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mt-8">
                <div className="bg-[#0c1626] border border-white/5 rounded-2xl p-6">
                  <h3 className="font-semibold text-white mb-5">Seat Overview</h3>

                  <div className="flex flex-wrap gap-5 text-sm">
                    <Legend
                      color="bg-green-400"
                      label={`Available (${availableSeats})`}
                    />

                    <Legend
                      color="bg-red-400"
                      label={`Occupied (${occupiedSeats})`}
                    />

                    <Legend
                      color="bg-yellow-400"
                      label={`Reserved (${reservedSeats})`}
                    />
                  </div>

                  <div className="mt-6 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 sm:gap-3">
                    {seats.map((seat) => (
                      <div
                        key={seat.id}
                        title={`Seat ${seat.seat_number || seat.id}: ${seat.status}`}
                        className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium ${
                          seat.status === "available"
                            ? "bg-green-400/10 text-green-400 border border-green-400/20"
                            : seat.status === "occupied"
                            ? "bg-red-400/10 text-red-400 border border-red-400/20"
                            : "bg-yellow-400/10 text-yellow-400 border border-yellow-400/20"
                        }`}
                      >
                        {seat.seat_number || seat.id}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#0c1626] border border-white/5 rounded-2xl p-4 sm:p-6 min-w-0 overflow-hidden">
                  <h3 className="font-semibold text-white mb-5">Library Summary</h3>

                  <div className="space-y-4">
                    <SummaryRow label="Registered Students" value={students.length} />
                    <SummaryRow label="Total Book Titles" value={books.length} />
                    <SummaryRow label="Total Book Copies" value={totalCopies} />
                    <SummaryRow label="Books Issued" value={issuedCount} />
                    <SummaryRow label="Books Returned" value={returnedCount} />
                    <SummaryRow label="Overdue Books" value={overdueCount} />
                  </div>
                </div>
              </div>
            </div>
          )}

          
{/* ================= RECENT BORROWING ACTIVITY ================= */}

<div className="bg-[#0c1626] border border-white/5 rounded-2xl p-6 mb-6">
  <div className="flex items-center justify-between mb-5">
    <h3 className="text-lg font-semibold text-white">
      Recent Borrowing Activity
    </h3>

    <span className="text-xs text-slate-500">
      Latest 5 activities
    </span>
  </div>

  {(() => {
    const recentActivities = borrowRecords
      .flatMap((record) => {
        const student = students.find(
          (s) => String(s.id) === String(record.student_id)
        );

        const book = books.find(
          (b) => String(b.id) === String(record.book_id)
        );

        const activities = [
          {
            id: `${record.id}-issued`,
            type: "Issued",
            date: record.issue_date,
            studentName: student?.name || "Unknown Student",
            bookTitle: book?.title || "Unknown Book",
          },
        ];

        if (
          record.status === "returned" &&
          record.return_date
        ) {
          activities.push({
            id: `${record.id}-returned`,
            type: "Returned",
            date: record.return_date,
            studentName: student?.name || "Unknown Student",
            bookTitle: book?.title || "Unknown Book",
          });
        }

        return activities;
      })
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);

    return recentActivities.length > 0 ? (
      <div className="space-y-3">
        {recentActivities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-center justify-between gap-4 p-4 bg-[#111f32] rounded-xl border border-white/5"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`p-2 rounded-lg ${
                  activity.type === "Issued"
                    ? "bg-blue-500/10 text-blue-400"
                    : "bg-green-500/10 text-green-400"
                }`}
              >
                {activity.type === "Issued" ? (
                  <BookOpen size={18} />
                ) : (
                  <CheckCircle2 size={18} />
                )}
              </div>

              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {activity.bookTitle}
                </p>

                <p className="text-xs text-slate-400 mt-1">
                  {activity.studentName}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span
                className={`text-xs font-medium ${
                  activity.type === "Issued"
                    ? "text-blue-400"
                    : "text-green-400"
                }`}
              >
                {activity.type}
              </span>

              <p className="text-xs text-slate-500 mt-1">
                {activity.date
                  ? new Date(activity.date + "T00:00:00").toLocaleDateString(
                      "en-IN",
                      {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }
                    )
                  : "Date unavailable"}
              </p>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="text-center py-8 text-slate-500 text-sm">
        No borrowing activity available yet.
      </div>
    );
  })()}
</div>


          {/* ================= SEAT RESERVATION ================= */}

          {activePage === "Seat Reservation" && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">Seat Reservation</h2>
                <p className="text-slate-400 mt-2">
                  Select an available seat to reserve it.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <StatCard
                  title="Available"
                  value={availableSeats}
                  icon={CheckCircle2}
                  color="green"
                />

                <StatCard
                  title="Occupied"
                  value={occupiedSeats}
                  icon={Armchair}
                  color="red"
                />

                <StatCard
                  title="Reserved"
                  value={reservedSeats}
                  icon={Clock}
                  color="orange"
                />
              </div>

              <div className="bg-[#0c1626] border border-white/5 rounded-2xl p-6">
                <div className="flex flex-wrap gap-5 mb-6 text-sm">
                  <Legend color="bg-green-400" label="Available" />
                  <Legend color="bg-red-400" label="Occupied" />
                  <Legend color="bg-yellow-400" label="Reserved" />
                </div>

                {loading ? (
                  <p className="text-slate-400">Loading seats...</p>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-12 gap-3">
                    {seats.map((seat) => (
                      <button
                        key={seat.id}
                        disabled={seat.status === "occupied"}
                        onClick={() => {
                          if (seat.status === "reserved") {
                            cancelReservation(seat);
                          } else {
                            reserveSeat(seat);
                          }
                        }}
                        title={`Seat ${seat.seat_number || seat.id} - ${seat.status}`}
                        className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-semibold border transition ${
                          seat.status === "available"
                            ? "bg-green-400/10 border-green-400/20 text-green-400 hover:bg-green-400/20 cursor-pointer"
                            : seat.status === "occupied"
                            ? "bg-red-400/10 border-red-400/20 text-red-400 cursor-not-allowed"
                            : "bg-yellow-400/10 border-yellow-400/20 text-yellow-400 cursor-not-allowed"
                        }`}
                      >
                        <Armchair size={17} />
                        <span className="mt-1">
                          {seat.seat_number || seat.id}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= BOOK CATALOGUE ================= */}

          {activePage === "Book Catalogue" && (
            <div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Book Catalogue</h2>
                  <p className="text-slate-400 mt-2">
                    Browse and manage the library's collection.
                  </p>
                </div>

                <button
                  onClick={() => setShowAddBook(true)}
                  className="flex items-center gap-2 px-4 py-3 bg-cyan-500 hover:bg-cyan-400 text-[#07111d] rounded-xl font-semibold text-sm"
                >
                  <Plus size={17} /> Add New Book
                </button>
              </div>

              {/* SEARCH AND FILTER PANEL */}

              <div className="bg-[#0c1626] border border-white/5 rounded-2xl p-5 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-4">
                  <div className="relative w-full">
                  <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                  size={18}
                 />

                    <input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search title, author, category, or ISBN..."
                      style={{ paddingLeft: "45px" }}
                      className="form-input"
                    />
                  </div>

                  <div className="relative">
                    <Filter
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                      size={18}
                    />

                    <select
                      value={bookCategoryFilter}
                      onChange={(e) => setBookCategoryFilter(e.target.value)}
                      style={{ paddingLeft: "45px" }}
                      className="form-input appearance-none cursor-pointer"
                    >
                      {bookCategories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
                  <p className="text-sm text-slate-400">
                    Showing{" "}
                    <span className="text-cyan-400 font-semibold">
                      {filteredBooks.length}
                    </span>{" "}
                    of{" "}
                    <span className="text-white font-semibold">{books.length}</span>{" "}
                    books
                  </p>

                  {(searchTerm || bookCategoryFilter !== "All Categories") && (
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setBookCategoryFilter("All Categories");
                      }}
                      className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                      <X size={14} /> Clear filters
                    </button>
                  )}
                </div>
              </div>

              {booksLoading ? (
                <p className="text-slate-400">Loading books...</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredBooks.map((book) => (
                    <div
                      key={book.id}
                      className="bg-[#0c1626] border border-white/5 rounded-2xl p-4 sm:p-6 hover:border-cyan-500/20 transition min-w-0"
                    >
                      <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
                        <Book className="text-purple-400" size={23} />
                      </div>

                      <h3 className="font-semibold text-white text-base sm:text-lg break-words">
                        {book.title}
                      </h3>

                      <p className="text-sm text-slate-400 mt-1">{book.author}</p>

                      {book.isbn && (
                        <p className="text-xs text-slate-500 mt-2">
                          ISBN: {book.isbn}
                        </p>
                      )}

                      <div className="flex flex-wrap justify-between items-center mt-5 gap-2">
                        <span className="text-xs px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 max-w-full break-words">
                          {book.category || "General"}
                        </span>

                        <span
                          className={`text-xs sm:text-sm font-semibold text-right whitespace-nowrap ${
                            Number(book.available_copies) > 0
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {book.available_copies}/{book.total_copies} available
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!booksLoading && filteredBooks.length === 0 && (
                <div className="bg-[#0c1626] border border-white/5 rounded-2xl text-center py-12 text-slate-500">
                  <BookOpen size={36} className="mx-auto mb-3 opacity-40" />
                  <p className="font-medium text-slate-300">No books found</p>
                  <p className="text-sm mt-2">
                    Try another search term or choose a different category.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ================= ISSUE & RETURN ================= */}

          {activePage === "Issue & Return" && (
            <div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Issue & Return Books
                  </h2>
                  <p className="text-slate-400 mt-2">
                    Track issued books and manage returns.
                  </p>
                </div>

                <button
                  onClick={() => {
                    if (students.length === 0) {
                      alert(
                        "Please register a student in Student Management first."
                      );
                      setActivePage("Students");
                      return;
                    }

                    setShowIssueBook(true);
                  }}
                  className="flex items-center gap-2 px-4 py-3 bg-cyan-500 hover:bg-cyan-400 text-[#07111d] rounded-xl font-semibold text-sm"
                >
                  <Plus size={17} /> Issue a Book
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <StatCard
                  title="Currently Issued"
                  value={issuedCount}
                  icon={ClipboardList}
                  color="orange"
                />

                <StatCard
                  title="Returned"
                  value={returnedCount}
                  icon={RotateCcw}
                  color="green"
                />

                <StatCard
                  title="Overdue"
                  value={overdueCount}
                  icon={CalendarDays}
                  color="red"
                />
              </div>

              <div className="bg-[#0c1626] border border-white/5 rounded-2xl overflow-hidden">
                {borrowLoading ? (
                  <p className="p-6 text-slate-400">Loading records...</p>
                ) : borrowRecords.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <ClipboardList size={35} className="mx-auto mb-3 opacity-40" />
                    No issue records found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs uppercase tracking-wider text-slate-500 bg-white/[0.02]">
                        <tr>
                          <th className="px-5 py-4">Book</th>
                          <th className="px-5 py-4">Student</th>
                          <th className="px-5 py-4">Issue Date</th>
                          <th className="px-5 py-4">Due Date</th>
                          <th className="px-5 py-4">Status</th>
                          <th className="px-5 py-4">Action</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-white/5">
                        {borrowRecords.map((record) => {
                          const overdue =
                            record.status === "issued" &&
                            record.due_date < today;

                          const daysOverdue = getDaysOverdue(
                            record.due_date,
                            today
                          );

                          return (
                            <tr
                              key={record.id}
                              className="hover:bg-white/[0.02]"
                            >
                              <td className="px-5 py-4">
                                <p className="font-medium text-white">
                                  {record.books?.title || "Unknown Book"}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                  {record.books?.author}
                                </p>
                              </td>

                              <td className="px-5 py-4">
                                <p className="text-slate-200">
                                  {record.student_name}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                  {record.student_id}
                                </p>
                              </td>

                              <td className="px-5 py-4 text-slate-400">
                                {formatDate(record.issue_date)}
                              </td>

                              <td
                                className={`px-5 py-4 ${
                                  overdue ? "text-red-400" : "text-slate-400"
                                }`}
                              >
                                {formatDate(record.due_date)}
                                {overdue && (
                                  <p className="text-xs mt-1">
                                    {daysOverdue} day
                                    {daysOverdue === 1 ? "" : "s"} overdue
                                  </p>
                                )}
                              </td>

                              <td className="px-5 py-4">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs ${
                                    record.status === "returned"
                                      ? "bg-green-400/10 text-green-400"
                                      : overdue
                                      ? "bg-red-400/10 text-red-400"
                                      : "bg-orange-400/10 text-orange-400"
                                  }`}
                                >
                                  {record.status === "returned"
                                    ? "Returned"
                                    : overdue
                                    ? "Overdue"
                                    : "Issued"}
                                </span>
                              </td>

                              <td className="px-5 py-4">
                                {record.status === "issued" && (
                                  <button
                                    onClick={() => returnBook(record)}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-400/10 text-green-400 hover:bg-green-400/20 text-xs font-semibold"
                                  >
                                    <RotateCcw size={14} /> Return
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= STUDENTS ================= */}

          {activePage === "Students" && (
            <div>
              {selectedStudentProfile ? (
                <StudentProfile
                  student={selectedStudentProfile}
                  borrowRecords={borrowRecords}
                  borrowLoading={borrowLoading}
                  today={today}
                  onBack={() => setSelectedStudentProfile(null)}
                  onReturnBook={returnBook}
                  onMarkFinePaid={markFinePaid}
                />
              ) : (
                <>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        Student Management
                      </h2>
                      <p className="text-slate-400 mt-2">
                        Register and manage library members.
                      </p>
                    </div>

                    <button
                      onClick={() => setShowAddStudent(true)}
                      className="flex items-center gap-2 px-4 py-3 bg-cyan-500 hover:bg-cyan-400 text-[#07111d] rounded-xl font-semibold text-sm"
                    >
                      <UserPlus size={17} /> Add Student
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <StatCard
                      title="Total Students"
                      value={students.length}
                      icon={Users}
                      color="cyan"
                    />

                    <StatCard
                      title="Books Issued"
                      value={issuedCount}
                      icon={BookOpen}
                      color="orange"
                    />

                    <StatCard
                      title="Overdue Books"
                      value={overdueCount}
                      icon={CalendarDays}
                      color="red"
                    />
                  </div>

                  <div className="bg-[#0c1626] border border-white/5 rounded-2xl p-5 mb-6">
                    <div className="relative">
                      <Search
                        className="absolute left-3 top-3 text-slate-500"
                        size={18}
                      />

                      <input
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        placeholder="Search by name, roll number, email, or branch..."
                        style={{ paddingLeft: "15px", paddingRight: "15px" }}
                        className="form-input search-input"
                      />
                    </div>
                  </div>

                  <div className="bg-[#0c1626] border border-white/5 rounded-2xl overflow-hidden">
                    {studentsLoading ? (
                      <p className="p-6 text-slate-400">Loading students...</p>
                    ) : filteredStudents.length === 0 ? (
                      <div className="text-center py-12 text-slate-500">
                        <Users size={35} className="mx-auto mb-3 opacity-40" />
                        No students found. Add your first student!
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead className="text-xs uppercase tracking-wider text-slate-500 bg-white/[0.02]">
                            <tr>
                              <th className="px-3 sm:px-5 py-3 sm:py-4">Roll Number</th>
                              <th className="px-3 sm:px-5 py-3 sm:py-4">Student Name</th>
                              <th className="px-3 sm:px-5 py-3 sm:py-4">Course / Branch</th>
                              <th className="px-3 sm:px-5 py-3 sm:py-4">Year</th>
                              <th className="px-3 sm:px-5 py-3 sm:py-4">Contact</th>
                              <th className="px-3 sm:px-5 py-3 sm:py-4">Action</th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-white/5">
                            {filteredStudents.map((student) => (
                              <tr
                                key={student.id}
                                className="hover:bg-white/[0.02]"
                              >
                                <td className="px-3 sm:px-5 py-3 sm:py-4 font-medium text-cyan-400 whitespace-nowrap">
                                  {student.student_id}
                                </td>

                                <td className="px-3 sm:px-5 py-3 sm:py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                                      <UserRound size={16} />
                                    </div>

                                    <button
                                      onClick={() =>
                                        setSelectedStudentProfile(student)
                                      }
                                      className="font-medium text-white hover:text-cyan-400 transition text-left"
                                    >
                                      {student.full_name || student.name}
                                    </button>
                                  </div>
                                </td>

                                <td className="px-3 sm:px-5 py-3 sm:py-4">
                                  <p className="text-slate-200">
                                    {student.course || "—"}
                                  </p>
                                  <p className="text-xs text-slate-500 mt-1">
                                    {student.branch || "—"}
                                  </p>
                                </td>

                                <td className="px-3 sm:px-5 py-3 sm:py-4 text-slate-400 whitespace-nowrap">
                                  {student.year ? `Year ${student.year}` : "—"}
                                </td>

                                <td className="px-3 sm:px-5 py-3 sm:py-4">
                                  {student.email && (
                                    <p className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                                      <Mail size={13} /> {student.email}
                                    </p>
                                  )}

                                  {student.phone && (
                                    <p className="flex items-center gap-2 text-slate-400 text-xs">
                                      <Phone size={13} /> {student.phone}
                                    </p>
                                  )}

                                  {!student.email && !student.phone && "—"}
                                </td>

                                <td className="px-3 sm:px-5 py-3 sm:py-4">
                                  <button
                                    onClick={() => deleteStudent(student)}
                                    className="p-2 rounded-lg text-red-400 hover:bg-red-400/10"
                                    title="Delete student"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}


{/* ================= REPORTS ================= */}

{activePage === "Reports" && (
  <div className="space-y-6">

    {/* Page Heading */}
    <div>
      <h2 className="text-2xl font-bold text-white">
        Library Reports
      </h2>
      <p className="text-slate-400 mt-2">
        Overview of library performance and borrowing records.
      </p>
    </div>

{/* Print Report Button */}
<div className="flex justify-start sm:justify-end mb-3">
  <button
    onClick={() => window.print()}
    className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-medium transition flex items-center gap-2"
  >
    <Printer size={16} />
    Print / Save as PDF
  </button>
</div>

    {/* CSV Export Buttons */}
<div className="flex flex-wrap gap-3">
  <button
    onClick={() =>
      exportToCSV(
        "LibraSmart_Books.csv",
        books.map((book) => ({
          ID: book.id,
          Title: book.title,
          Author: book.author,
          Category: book.category,
          Quantity: book.quantity,
        }))
      )
    }
    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition flex items-center gap-2"
  >
    <Download size={16} />
    Export Books
  </button>

  <button
    onClick={() =>
      exportToCSV(
        "LibraSmart_Students.csv",
        students.map((student) => ({
          ID: student.id,
          Name: student.name,
          Email: student.email,
        }))
      )
    }
    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition flex items-center gap-2"
  >
    <Download size={16} />
    Export Students
  </button>

  <button
    onClick={() =>
      exportToCSV(
        "LibraSmart_Borrowing_Records.csv",
        borrowRecords.map((record) => ({
          Student:
            students.find(
              (student) =>
                String(student.id) === String(record.student_id)
            )?.name || "Unknown Student",

          Book:
            books.find(
              (book) =>
                String(book.id) === String(record.book_id)
            )?.title || "Unknown Book",

          Issue_Date: record.issue_date,
          Due_Date: record.due_date,
          Return_Date: record.return_date || "Not Returned",
          Status: record.status,
          Fine: calculateFine(record, today),
          Fine_Paid: Number(record.fine_paid || 0),
          Pending_Fine: getPendingFine(record, today),
        }))
      )
    }
    className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium transition flex items-center gap-2"
  >
    <Download size={16} />
    Export Borrowing Records
  </button>
</div>

    {/* Statistics */}
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">

      <StatCard
        title="Total Book Titles"
        value={books.length}
        icon={BookOpen}
        color="purple"
      />

      <StatCard
        title="Total Book Copies"
        value={books.reduce(
          (sum, book) => sum + Number(book.quantity || 0),
          0
        )}
        icon={Library}
        color="cyan"
      />

      <StatCard
        title="Registered Students"
        value={students.length}
        icon={Users}
        color="green"
      />

      <StatCard
        title="Currently Issued"
        value={issuedRecords.length}
        icon={ClipboardList}
        color="orange"
      />

      <StatCard
        title="Overdue Books"
        value={overdueCount}
        icon={Clock}
        color="red"
      />

      <StatCard
        title="Pending Fine Collection"
        value={formatCurrency(totalPendingFines)}
        icon={IndianRupee}
        color="red"
      />

    </div>

    {/* Borrowing Summary */}
    <div className="bg-[#0c1626] border border-white/5 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        Borrowing Summary
      </h3>

      <div className="space-y-3">

        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Total Borrowing Records</span>
          <span className="text-white font-medium">
            {borrowRecords.length}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Books Currently Issued</span>
          <span className="text-white font-medium">
            {issuedRecords.length}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Books Returned</span>
          <span className="text-white font-medium">
            {borrowRecords.filter(
              (record) => record.status === "returned"
            ).length}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Total Fine Generated</span>
          <span className="text-white font-medium">
            {formatCurrency(
              borrowRecords.reduce(
                (sum, record) => sum + calculateFine(record, today),
                0
              )
            )}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Total Fine Collected</span>
          <span className="text-green-400 font-medium">
            {formatCurrency(
              borrowRecords.reduce(
                (sum, record) => sum + Number(record.fine_paid || 0),
                0
              )
            )}
          </span>
        </div>

      </div>
    </div>

  </div>
)}


          {/* ================= SETTINGS ================= */}

          {activePage === "Settings" && (
            <PlaceholderPage
              icon={Settings}
              title="Settings"
              description="Library configuration and preferences will be available here."
            />
          )}
        </div>
      </main>

      {/* ================= ADD BOOK MODAL ================= */}

      {showAddBook && (
        <Modal title="Add New Book" onClose={() => setShowAddBook(false)}>
          <form onSubmit={addBook} className="space-y-4">
            <FormField
              label="Book Title *"
              value={newBook.title}
              onChange={(value) => setNewBook({ ...newBook, title: value })}
              placeholder="Enter book title"
              required
            />

            <FormField
              label="Author *"
              value={newBook.author}
              onChange={(value) => setNewBook({ ...newBook, author: value })}
              placeholder="Enter author name"
              required
            />

            <FormField
              label="Category"
              value={newBook.category}
              onChange={(value) => setNewBook({ ...newBook, category: value })}
              placeholder="e.g. Computer Science"
            />

            <FormField
              label="ISBN"
              value={newBook.isbn}
              onChange={(value) => setNewBook({ ...newBook, isbn: value })}
              placeholder="Enter ISBN"
            />

            <FormField
              label="Total Copies *"
              type="number"
              value={newBook.total_copies}
              onChange={(value) =>
                setNewBook({ ...newBook, total_copies: value })
              }
              required
            />

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#07111d] font-semibold"
            >
              Add Book
            </button>
          </form>
        </Modal>
      )}

      {/* ================= ADD STUDENT MODAL ================= */}

      {showAddStudent && (
        <Modal
          title="Register New Student"
          onClose={() => setShowAddStudent(false)}
        >
          <form onSubmit={addStudent} className="space-y-4">
            <FormField
              label="Roll Number / Student ID *"
              value={newStudent.student_id}
              onChange={(value) =>
                setNewStudent({ ...newStudent, student_id: value })
              }
              placeholder="e.g. BTU2026001"
              required
            />

            <FormField
              label="Full Name *"
              value={newStudent.full_name}
              onChange={(value) =>
                setNewStudent({ ...newStudent, full_name: value })
              }
              placeholder="Enter student's full name"
              required
            />

            <FormField
              label="Email"
              type="email"
              value={newStudent.email}
              onChange={(value) =>
                setNewStudent({ ...newStudent, email: value })
              }
              placeholder="student@example.com"
            />

            <FormField
              label="Phone Number"
              type="tel"
              value={newStudent.phone}
              onChange={(value) =>
                setNewStudent({ ...newStudent, phone: value })
              }
              placeholder="Enter phone number"
            />

            <FormField
              label="Course"
              value={newStudent.course}
              onChange={(value) =>
                setNewStudent({ ...newStudent, course: value })
              }
              placeholder="e.g. B.Tech"
            />

            <FormField
              label="Branch"
              value={newStudent.branch}
              onChange={(value) =>
                setNewStudent({ ...newStudent, branch: value })
              }
              placeholder="e.g. AI & Data Science"
            />

            <FormField
              label="Year"
              type="number"
              value={newStudent.year}
              onChange={(value) =>
                setNewStudent({ ...newStudent, year: value })
              }
              placeholder="1"
            />

            <button
              type="submit"
              disabled={studentLoading}
              className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-[#07111d] font-semibold"
            >
              {studentLoading ? "Registering..." : "Register Student"}
            </button>
          </form>
        </Modal>
      )}

      {/* ================= ISSUE BOOK MODAL ================= */}

      {showIssueBook && (
        <Modal title="Issue a Book" onClose={() => setShowIssueBook(false)}>
          <form onSubmit={issueBook} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Select Book *
              </label>

              <select
                value={newIssue.book_id}
                onChange={(e) =>
                  setNewIssue({ ...newIssue, book_id: e.target.value })
                }
                className="form-input"
                required
              >
                <option value="">Choose a book</option>

                {books
                  .filter((book) => Number(book.available_copies) > 0)
                  .map((book) => (
                    <option key={book.id} value={book.id}>
                      {book.title} ({book.available_copies} available)
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Select Registered Student *
              </label>

              <select
                value={newIssue.student_id}
                onChange={(e) =>
                  setNewIssue({ ...newIssue, student_id: e.target.value })
                }
                className="form-input"
                required
              >
                <option value="">Choose a student</option>

                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.full_name || student.name} — {student.student_id}
                  </option>
                ))}
              </select>
            </div>

            <FormField
              label="Due Date *"
              type="date"
              value={newIssue.due_date}
              onChange={(value) =>
                setNewIssue({ ...newIssue, due_date: value })
              }
              required
            />

            <button
              type="submit"
              disabled={issueLoading}
              className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-[#07111d] font-semibold"
            >
              {issueLoading ? "Issuing..." : "Issue Book"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}


 // ================= STUDENT PROFILE 2.0 =================

function StudentProfile({
  student,
  borrowRecords,
  borrowLoading,
  today,
  onBack,
  onReturnBook,
  onMarkFinePaid,
}) {
  const studentRecords = borrowRecords.filter(
  (record) =>
    String(record.student_id) === String(student.student_id)
);

  const totalFine = studentRecords.reduce(
    (sum, record) => sum + calculateFine(record, today),
    0
  );

  const totalFinePaid = studentRecords.reduce(
    (sum, record) => sum + Number(record.fine_paid || 0),
    0
  );

  const pendingFine = Math.max(0, totalFine - totalFinePaid);

  const currentlyIssued = studentRecords.filter(
    (record) => record.status === "issued"
  );

  const previouslyReturned = studentRecords.filter(
    (record) => record.status === "returned"
  );

  const overdueBooks = currentlyIssued.filter(
    (record) => getDaysOverdue(record.due_date, today) > 0
  );

  const totalBorrowings = studentRecords.length;

  return (
    <div>
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 mb-6 text-sm text-cyan-400 hover:text-cyan-300"
      >
        <ArrowLeft size={16} />
        Back to Students
      </button>

      {/* Student Information */}
      <div className="bg-[#0c1626] border border-white/5 rounded-2xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
            <UserRound size={30} />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white">
              {student.full_name || student.name}
            </h2>

            <p className="text-cyan-400 text-sm mt-1">
              Roll Number: {student.student_id || "—"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <ProfileDetail label="Course" value={student.course} />
          <ProfileDetail label="Branch" value={student.branch} />

          <ProfileDetail
            label="Year"
            value={student.year ? `Year ${student.year}` : null}
          />

          <ProfileDetail label="Email" value={student.email} />
          <ProfileDetail label="Phone" value={student.phone} />
          <ProfileDetail label="Student ID" value={student.student_id} />
        </div>
      </div>

      {/* Fine Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Total Fine"
          value={formatCurrency(totalFine)}
          icon={IndianRupee}
          color="orange"
        />

        <StatCard
          title="Fine Paid"
          value={formatCurrency(totalFinePaid)}
          icon={CheckCircle2}
          color="green"
        />

        <StatCard
          title="Pending Fine"
          value={formatCurrency(pendingFine)}
          icon={Clock}
          color="red"
        />
      </div>

      {/* Student Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Currently Issued"
          value={currentlyIssued.length}
          icon={BookOpen}
          color="orange"
        />

        <StatCard
          title="Previously Returned"
          value={previouslyReturned.length}
          icon={RotateCcw}
          color="green"
        />

        <StatCard
          title="Overdue Books"
          value={overdueBooks.length}
          icon={CalendarDays}
          color="red"
        />

        <StatCard
          title="Total Borrowings"
          value={totalBorrowings}
          icon={ClipboardList}
          color="cyan"
        />
      </div>

      {/* Currently Issued Books */}
      <div className="bg-[#0c1626] border border-white/5 rounded-2xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <h3 className="text-lg font-semibold text-white">
            Currently Issued Books
          </h3>

          <span className="text-xs text-slate-500">
            {currentlyIssued.length} active
          </span>
        </div>

        {borrowLoading ? (
          <p className="text-slate-400 text-sm py-4">
            Refreshing borrowing history...
          </p>
        ) : currentlyIssued.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen size={32} className="mx-auto mb-3 text-slate-600" />

            <p className="text-slate-500 text-sm">
              This student has no currently issued books.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 pr-4">Book</th>
                  <th className="py-3 pr-4">Issue Date</th>
                  <th className="py-3 pr-4">Due Date</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Fine</th>
                  <th className="py-3">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">
                {currentlyIssued.map((record) => {
                  const daysOverdue = getDaysOverdue(record.due_date, today);
                  const overdue = daysOverdue > 0;
                  const fine = calculateFine(record, today);
                  const paid = Number(record.fine_paid || 0);
                  const pending = Math.max(0, fine - paid);

                  return (
                    <tr key={record.id} className="hover:bg-white/[0.02]">
                      {/* Book Details */}
                      <td className="py-4 pr-4">
                        <p className="text-white font-medium">
                          {record.books?.title || "Unknown Book"}
                        </p>

                        <p className="text-xs text-slate-500 mt-1">
                          {record.books?.author}
                        </p>
                      </td>

                      {/* Issue Date */}
                      <td className="py-4 pr-4 text-slate-400">
                        {formatDate(record.issue_date)}
                      </td>

                      {/* Due Date */}
                      <td
                        className={`py-4 pr-4 ${
                          overdue ? "text-red-400" : "text-slate-400"
                        }`}
                      >
                        {formatDate(record.due_date)}

                        {overdue && (
                          <p className="text-xs mt-1">
                            {daysOverdue} day
                            {daysOverdue === 1 ? "" : "s"} overdue
                          </p>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 pr-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs ${
                            overdue
                              ? "bg-red-400/10 text-red-400"
                              : "bg-orange-400/10 text-orange-400"
                          }`}
                        >
                          {overdue ? "Overdue" : "Issued"}
                        </span>
                      </td>

                      {/* Fine */}
                      <td className="py-4 pr-4">
                        <div className="text-red-400 font-medium">
                          {formatCurrency(fine)}
                        </div>

                        {pending > 0 && (
                          <div className="text-xs text-slate-500 mt-1">
                            Pending: {formatCurrency(pending)}
                          </div>
                        )}

                        {paid > 0 && pending === 0 && (
                          <div className="text-xs text-emerald-400 mt-1">
                            Paid
                          </div>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-4">
                        <div className="flex flex-col gap-2">
                          {pending > 0 && (
                            <button
                              onClick={() => onMarkFinePaid(record)}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-400/10 text-cyan-400 hover:bg-cyan-400/20 text-xs font-semibold"
                            >
                              <CheckCircle2 size={14} />
                              Mark Fine Paid
                            </button>
                          )}

                          <button
                            onClick={() => onReturnBook(record)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-400/10 text-green-400 hover:bg-green-400/20 text-xs font-semibold"
                          >
                            <RotateCcw size={14} />
                            Return
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Previously Returned Books */}
      <div className="bg-[#0c1626] border border-white/5 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <h3 className="text-lg font-semibold text-white">
            Previously Returned Books
          </h3>

          <span className="text-xs text-slate-500">
            {previouslyReturned.length} returned
          </span>
        </div>

        {borrowLoading ? (
          <p className="text-slate-400 text-sm py-4">
            Refreshing borrowing history...
          </p>
        ) : previouslyReturned.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen size={32} className="mx-auto mb-3 text-slate-600" />

            <p className="text-slate-500 text-sm">
              No books have been returned by this student yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-sm text-left">
              <thead className="text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 pr-4">Book</th>
                  <th className="py-3 pr-4">Issue Date</th>
                  <th className="py-3 pr-4">Due Date</th>
                  <th className="py-3 pr-4">Return Date</th>
                  <th className="py-3 pr-4">Total Fine</th>
                  <th className="py-3 pr-4">Fine Paid</th>
                  <th className="py-3 pr-4">Pending</th>
                  <th className="py-3">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">
                {previouslyReturned.map((record) => {
                  const fine = calculateFine(record, today);
                  const paid = Number(record.fine_paid || 0);
                  const pending = Math.max(0, fine - paid);

                  return (
                    <tr key={record.id} className="hover:bg-white/[0.02]">
                      {/* Book Details */}
                      <td className="py-4 pr-4">
                        <p className="text-white font-medium">
                          {record.books?.title || "Unknown Book"}
                        </p>

                        <p className="text-xs text-slate-500 mt-1">
                          {record.books?.author}
                        </p>
                      </td>

                      {/* Issue Date */}
                      <td className="py-4 pr-4 text-slate-400">
                        {formatDate(record.issue_date)}
                      </td>

                      {/* Due Date */}
                      <td className="py-4 pr-4 text-slate-400">
                        {formatDate(record.due_date)}
                      </td>

                      {/* Return Date */}
                      <td className="py-4 pr-4 text-slate-400">
                        {formatDate(record.return_date)}
                      </td>

                      {/* Total Fine */}
                      <td className="py-4 pr-4 text-red-400 font-medium">
                        {formatCurrency(fine)}
                      </td>

                      {/* Fine Paid */}
                      <td className="py-4 pr-4 text-emerald-400">
                        {formatCurrency(paid)}
                      </td>

                      {/* Pending Fine */}
                      <td className="py-4 pr-4">
                        <span
                          className={
                            pending > 0
                              ? "text-red-400"
                              : "text-emerald-400"
                          }
                        >
                          {formatCurrency(pending)}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-4">
                        {pending > 0 && (
                          <button
                            onClick={() => onMarkFinePaid(record)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-400/10 text-cyan-400 hover:bg-cyan-400/20 text-xs font-semibold"
                          >
                            <CheckCircle2 size={14} />
                            Mark Fine Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


// ================= REUSABLE COMPONENTS =================

function ProfileDetail({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-sm text-slate-200 break-words">{value || "—"}</p>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  const colors = {
    cyan: "text-cyan-400 bg-cyan-400/10",
    green: "text-green-400 bg-green-400/10",
    purple: "text-purple-400 bg-purple-400/10",
    orange: "text-orange-400 bg-orange-400/10",
    red: "text-red-400 bg-red-400/10",
  };

  return (
    <div className="bg-[#0c1626] border border-white/5 rounded-2xl p-5">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <p className="text-3xl font-bold text-white mt-3">{value}</p>
        </div>

        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center ${colors[color]}`}
        >
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
      <span className="text-slate-400">{label}</span>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}) {
  return (
    <div>
      <label className="block text-sm text-slate-400 mb-2">{label}</label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        min={type === "number" ? 1 : undefined}
        className="form-input"
      />
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#0c1626] border border-white/10 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">{title}</h2>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

function PlaceholderPage({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24">
      <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-5">
        <Icon size={28} className="text-cyan-400" />
      </div>

      <h2 className="text-2xl font-bold text-white">{title}</h2>
      <p className="text-slate-400 mt-2 max-w-md">{description}</p>
    </div>
  );
}