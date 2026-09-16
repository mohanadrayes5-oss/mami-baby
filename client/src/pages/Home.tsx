import { useMemo, useState } from "react";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  Baby, Bell, CalendarDays, ChevronLeft, CircleUserRound, Droplets, HeartPulse, Home as HomeIcon,
  LogOut, Menu, Milk, Plus, ShieldCheck, Sparkles, Syringe, UserRound, WalletCards, X, Baby as BabyIcon,
} from "lucide-react";
import { toast } from "sonner";

const navItems = [
  { id: "dashboard", label: "الرئيسية", icon: HomeIcon },
  { id: "feeding", label: "التغذية", icon: Milk },
  { id: "medical", label: "الطبي", icon: Syringe },
  { id: "diapers", label: "الحفاضات", icon: Droplets },
  { id: "settings", label: "المزيد", icon: Menu },
];

type Screen = "dashboard" | "feeding" | "diapers" | "medical" | "profile" | "settings" | "plans";

function formatTime(date?: Date | string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
}

function LoginView() {
  return (
    <main className="auth-page">
      <div className="brand-mark large"><Baby className="h-12 w-12" /></div>
      <p className="eyebrow">رفيقك الهادئ في رحلة الأمومة</p>
      <h1 className="auth-title">Mami <span>Baby</span></h1>
      <p className="auth-copy">احفظي تفاصيل طفلك، تابعي يومه، واطمئني أكثر مع مساحة مصممة لكِ.</p>
      <div className="auth-card">
        <div className="auth-card-icon"><ShieldCheck className="h-5 w-5" /></div>
        <h2>ابدئي رحلتك بأمان</h2>
        <p>تسجيل الدخول يحفظ بياناتك الخاصة في حسابك فقط.</p>
        <button className="primary-button w-full" onClick={() => startLogin()}>
          تسجيل الدخول أو إنشاء حساب <ChevronLeft className="h-4 w-4" />
        </button>
        <small>سنستخدم تسجيل الدخول الآمن من Manus ولن نطلب كلمة مرور داخل التطبيق.</small>
      </div>
      <div className="auth-features"><span>خصوصية أولاً</span><span>RTL عربي</span><span>متابعة يومية</span></div>
    </main>
  );
}

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [activeChildId, setActiveChildId] = useState<number | null>(null);
  const [showChildModal, setShowChildModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const childrenQuery = trpc.children.list.useQuery(undefined, { enabled: isAuthenticated });
  const children = childrenQuery.data ?? [];
  const activeChild = useMemo(() => children.find(child => child.id === activeChildId) ?? children[0], [children, activeChildId]);
  const resolvedChildId = activeChild?.id ?? 0;
  const dashboardQuery = trpc.dashboard.useQuery({ childId: resolvedChildId }, { enabled: isAuthenticated && resolvedChildId > 0 });
  const profileQuery = trpc.profile.get.useQuery(undefined, { enabled: isAuthenticated });
  const utils = trpc.useUtils();
  const addChild = trpc.children.create.useMutation({
    onSuccess: async () => { await utils.children.list.invalidate(); setShowChildModal(false); toast.success("تم حفظ ملف الطفل"); },
    onError: error => toast.error(error.message),
  });
  const addFeeding = trpc.feeding.add.useMutation({
    onSuccess: async () => { await utils.feeding.list.invalidate({ childId: resolvedChildId }); await utils.dashboard.invalidate({ childId: resolvedChildId }); toast.success("تم تسجيل الرضعة"); },
    onError: error => toast.error(error.message),
  });
  const addDiaper = trpc.diapers.add.useMutation({
    onSuccess: async () => { await utils.diapers.list.invalidate({ childId: resolvedChildId }); await utils.dashboard.invalidate({ childId: resolvedChildId }); toast.success("تم حفظ تغيير الحفاض"); },
    onError: error => toast.error(error.message),
  });

  if (loading) return <div className="loading-page"><div className="spinner" /><span>نجهّز مساحتك الخاصة...</span></div>;
  if (!isAuthenticated || !user) return <LoginView />;

  const dashboard = dashboardQuery.data;
  const lastFeeding = dashboard?.feedings?.[0];
  const lastDiaper = dashboard?.diapers?.[0];

  const go = (next: Screen) => { setScreen(next); setShowMenu(false); };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-brand"><div className="brand-mark"><Baby className="h-5 w-5" /></div><div><span>مرحباً بالأم الرائعة</span><strong>Mami Baby</strong></div></div>
        <div className="header-actions">
          <button className="child-switcher" onClick={() => setShowChildModal(true)}><BabyIcon className="h-4 w-4" /><span>{activeChild?.name ?? "أضيفي طفلك"}</span><ChevronLeft className="h-3 w-3" /></button>
          <button className="icon-button" aria-label="الإشعارات"><Bell className="h-4 w-4" /><i /></button>
        </div>
      </header>

      <main className="app-content">
        {screen === "dashboard" && <DashboardScreen userName={user.name ?? "سارة"} child={activeChild} lastFeeding={lastFeeding} lastDiaper={lastDiaper} onGo={go} />}
        {screen === "feeding" && <FeedingScreen childId={resolvedChildId} logs={dashboard?.feedings ?? []} onAdd={(data) => addFeeding.mutate({ childId: resolvedChildId, ...data })} pending={addFeeding.isPending} />}
        {screen === "diapers" && <DiaperScreen childId={resolvedChildId} logs={dashboard?.diapers ?? []} onAdd={(data) => addDiaper.mutate({ childId: resolvedChildId, ...data })} pending={addDiaper.isPending} />}
        {screen === "medical" && <MedicalScreen events={dashboard?.medical ?? []} />}
        {screen === "profile" && <ProfileScreen profile={profileQuery.data} onSaved={() => profileQuery.refetch()} />}
        {screen === "plans" && <PlansScreen />}
        {screen === "settings" && <SettingsScreen user={user} onGo={go} onLogout={() => logout()} />}
      </main>

      <nav className="bottom-nav">
        {navItems.map(item => { const Icon = item.icon; const active = item.id === screen; return <button key={item.id} className={active ? "active" : ""} onClick={() => go(item.id as Screen)}><Icon className="h-5 w-5" /><span>{item.label}</span></button>; })}
      </nav>

      {showChildModal && <ChildModal children={children} activeId={resolvedChildId} onSelect={(id) => { setActiveChildId(id); setShowChildModal(false); }} onClose={() => setShowChildModal(false)} onAdd={(data) => addChild.mutate(data)} pending={addChild.isPending} />}
    </div>
  );
}

function DashboardScreen({ userName, child, lastFeeding, lastDiaper, onGo }: { userName: string; child?: any; lastFeeding?: any; lastDiaper?: any; onGo: (screen: Screen) => void }) {
  const childAge = child?.ageMonths ? `${Math.floor(child.ageMonths / 12) ? `${Math.floor(child.ageMonths / 12)} سنة و` : ""} ${child.ageMonths % 12} شهر` : "لم يحدد بعد";
  return <div className="screen-stack">
    <section className="hero-card"><div className="hero-glow" /><div className="hero-top"><div><span className="pill pink"><Sparkles className="h-3 w-3" /> يوم سعيد يا {userName.split(" ")[0]}</span><h1>{child ? `${child.name} هادئ وبصحة ممتازة` : "رحلة هادئة مع طفلك"}</h1><p>{child ? `العمر: ${childAge}` : "أضيفي ملف طفلك لنبدأ المتابعة"} <span>•</span> اليوم {new Intl.DateTimeFormat("ar-SA", { day: "numeric", month: "long" }).format(new Date())}</p></div><div className="hero-baby">👶</div></div><div className="hero-stats"><div><span>الوزن الأخير</span><strong>{child?.weightKg ? `${child.weightKg} كغ` : "—"}</strong></div><div><span>ساعات النوم</span><strong>—</strong></div><div><span>مزاج الطفل</span><strong className="green">مبتسم 😊</strong></div></div></section>
    <section><div className="section-heading"><h2>ملخص الرعاية الحالية</h2><span>تُحفظ تلقائياً</span></div><div className="care-list">
      <button className="care-card" onClick={() => onGo("feeding")}><div className="care-icon amber"><Milk /></div><div className="care-copy"><b>آخر رضعة</b><span>{lastFeeding ? `${formatTime(lastFeeding.loggedAt)} • ${lastFeeding.durationMinutes ?? "—"} دقيقة` : "سجلي أول رضعة اليوم"}</span></div><div className="care-side"><strong>{lastFeeding ? "تم الحفظ" : "ابدئي الآن"}</strong><ChevronLeft /></div></button>
      <button className="care-card" onClick={() => onGo("diapers")}><div className="care-icon purple"><Droplets /></div><div className="care-copy"><b>آخر تغيير حفاض</b><span>{lastDiaper ? `${lastDiaper.diaperType === "pee" ? "بول" : lastDiaper.diaperType === "poop" ? "براز" : "بول + براز"} • ${formatTime(lastDiaper.loggedAt)}` : "سجلي التغيير لمتابعة النمط"}</span></div><div className="care-side purple-text"><strong>{lastDiaper ? "تم الحفظ" : "ابدئي الآن"}</strong><ChevronLeft /></div></button>
      <button className="care-card" onClick={() => onGo("medical")}><div className="care-icon green"><Syringe /></div><div className="care-copy"><b>المتابعة الطبية</b><span>التطعيمات والمواعيد في مكان واحد</span></div><div className="care-side green-text"><strong>عرض الكل</strong><ChevronLeft /></div></button>
    </div></section>
    <section><div className="section-heading"><h2>إجراءات سريعة</h2></div><div className="quick-grid"><button onClick={() => onGo("feeding")}><div className="quick-icon pink-bg"><Milk /></div><b>تسجيل رضعة</b><span>مؤقت ويدوي</span></button><button onClick={() => onGo("diapers")}><div className="quick-icon blue-bg"><Droplets /></div><b>تغيير حفاض</b><span>بول أو براز</span></button><button onClick={() => onGo("medical")}><div className="quick-icon green-bg"><CalendarDays /></div><b>موعد طبي</b><span>تطعيم أو زيارة</span></button></div></section>
    {!child && <button className="empty-cta" onClick={() => onGo("profile")}><CircleUserRound /><span><b>أكملي ملفك الشخصي</b><small>أضيفي معلومات الأم والطفل لتحصلي على ملخص أدق</small></span><ChevronLeft /></button>}
  </div>;
}

function FeedingScreen({ childId, logs, onAdd, pending }: { childId: number; logs: any[]; onAdd: (data: any) => void; pending: boolean }) {
  const [type, setType] = useState<"breast" | "formula" | "mixed">("breast");
  const [side, setSide] = useState<"right" | "left">("right");
  const [duration, setDuration] = useState(15);
  const [amount, setAmount] = useState(120);
  const [note, setNote] = useState("");
  const [mode, setMode] = useState<"manual" | "auto">("manual");
  const submit = () => onAdd({ feedingType: type, breastSide: type === "formula" ? undefined : side, amountMl: type === "breast" ? undefined : amount, durationMinutes: duration, note: note || undefined });
  return <div className="screen-stack"><ScreenTitle icon={<Milk />} title="التغذية" subtitle="سجلي الرضعات وتابعي النمط اليومي" /><div className="segmented"><button className={mode === "manual" ? "selected" : ""} onClick={() => setMode("manual")}>النظام اليدوي</button><button className={mode === "auto" ? "selected" : ""} onClick={() => setMode("auto")}>النظام الآلي</button></div>{mode === "auto" && <div className="info-card blue-info"><Sparkles /><span><b>جدولة ذكية</b><small>سيتم اقتراح موعد كل 3 ساعات نهاراً و6 ساعات ليلاً بعد تسجيل نمط طفلك.</small></span></div>}<section className="form-card"><h3>نوع التغذية</h3><div className="choice-grid three"><Choice selected={type === "breast"} onClick={() => setType("breast")} icon="🤱" label="طبيعي" /><Choice selected={type === "formula"} onClick={() => setType("formula")} icon="🍼" label="صناعي" /><Choice selected={type === "mixed"} onClick={() => setType("mixed")} icon="💗" label="مختلط" /></div>{type !== "formula" && <><h3>جهة الرضاعة</h3><div className="choice-grid two"><Choice selected={side === "right"} onClick={() => setSide("right")} icon="◐" label="الثدي الأيمن" /><Choice selected={side === "left"} onClick={() => setSide("left")} icon="◑" label="الثدي الأيسر" /></div></>}{type !== "breast" && <><h3>كمية الحليب الصناعي <span className="muted-inline">بالمل</span></h3><div className="amount-row"><input type="range" min="30" max="300" step="10" value={amount} onChange={e => setAmount(Number(e.target.value))} /><strong>{amount} مل</strong></div></>}<h3>مدة الرضعة <span className="muted-inline">بالدقائق</span></h3><div className="amount-row"><button className="round-button" onClick={() => setDuration(Math.max(1, duration - 1))}>−</button><strong>{duration} دقيقة</strong><button className="round-button" onClick={() => setDuration(duration + 1)}>+</button></div><label className="field-label">ملاحظة سريعة (اختياري)<input value={note} onChange={e => setNote(e.target.value)} placeholder="مثال: نام أثناء الرضاعة" /></label><button className="primary-button w-full" disabled={pending || childId === 0} onClick={submit}>{pending ? "جارٍ الحفظ..." : "حفظ الرضعة"}<ChevronLeft /></button></section><Timeline title="سجل رضعات اليوم" items={logs.map(log => ({ icon: "🍼", title: log.feedingType === "breast" ? `طبيعي (${log.breastSide === "left" ? "يسار" : "يمين"})` : log.feedingType === "formula" ? `صناعي • ${log.amountMl ?? "—"} مل` : "مختلط", time: formatTime(log.loggedAt), note: log.note }))} empty="لا توجد رضعات محفوظة بعد" /></div>;
}

function DiaperScreen({ childId, logs, onAdd, pending }: { childId: number; logs: any[]; onAdd: (data: any) => void; pending: boolean }) {
  const [type, setType] = useState<"pee" | "poop" | "mixed">("pee"); const [peeColor, setPeeColor] = useState("أصفر طبيعي"); const [poopColor, setPoopColor] = useState("أصفر ذهبي"); const [texture, setTexture] = useState("رخو / طبيعي"); const [amount, setAmount] = useState(3);
  return <div className="screen-stack"><ScreenTitle icon={<Droplets />} title="متابعة الحفاضات" subtitle="سجلي التفاصيل الصغيرة التي تطمئنك" /><section className="form-card"><h3>ما الذي تم تغييره؟</h3><div className="choice-grid three"><Choice selected={type === "pee"} onClick={() => setType("pee")} icon="💧" label="بول" /><Choice selected={type === "poop"} onClick={() => setType("poop")} icon="💩" label="براز" /><Choice selected={type === "mixed"} onClick={() => setType("mixed")} icon="💧💩" label="مختلط" /></div>{type !== "poop" && <OptionChips title="لون البول" options={["شفاف", "أصفر طبيعي", "أصفر داكن", "كهرماني"]} value={peeColor} onChange={setPeeColor} />}{type !== "pee" && <><OptionChips title="لون البراز" options={["تحذيري", "مائل للأخضر", "بني فاتح", "أصفر ذهبي"]} value={poopColor} onChange={setPoopColor} /><OptionChips title="قوام البراز" options={["مائي / إسهال", "متماسك قليلاً", "رخو / طبيعي"]} value={texture} onChange={setTexture} /></>}<h3>الكمية التقريبية</h3><div className="amount-row"><input type="range" min="1" max="5" value={amount} onChange={e => setAmount(Number(e.target.value))} /><strong>{["قليل جداً", "قليل", "متوسط", "كثير", "كثير جداً"][amount - 1]}</strong></div><button className="primary-button blue-button w-full" disabled={pending || childId === 0} onClick={() => onAdd({ diaperType: type, peeColor: type === "poop" ? undefined : peeColor, poopColor: type === "pee" ? undefined : poopColor, poopTexture: type === "pee" ? undefined : texture, amount })}>{pending ? "جارٍ الحفظ..." : "حفظ تسجيل الحفاض"}<ChevronLeft /></button></section><Timeline title="السجل الزمني" items={logs.map(log => ({ icon: log.diaperType === "pee" ? "💧" : log.diaperType === "poop" ? "💩" : "💧💩", title: log.diaperType === "pee" ? "بول" : log.diaperType === "poop" ? "براز" : "تغيير مختلط", time: formatTime(log.loggedAt), note: log.diaperType === "poop" ? `${log.poopColor ?? ""} • ${log.poopTexture ?? ""}` : log.peeColor ?? "" }))} empty="لا توجد تغييرات محفوظة بعد" /></div>;
}

function MedicalScreen({ events }: { events: any[] }) { return <div className="screen-stack"><ScreenTitle icon={<Syringe />} title="المتابعة الطبية" subtitle="التطعيمات، الزيارات، والملفات الطبية" /><div className="medical-banner"><div><span className="pill green">موعد قادم</span><h2>تطعيمات عمر 6 أشهر</h2><p>الثلاثي البكتيري + شلل الأطفال</p></div><div className="date-badge"><b>28</b><span>أكتوبر</span></div></div><div className="section-heading"><h2>أقسام المتابعة</h2></div><div className="medical-grid"><button><Syringe /><b>التطعيمات</b><span>المواعيد والتذكير</span></button><button><HeartPulse /><b>زيارات الطبيب</b><span>تاريخ المتابعات</span></button><button><CalendarDays /><b>ملفات طبية</b><span>صور ونتائج تحاليل</span></button></div><Timeline title="المواعيد المسجلة" items={events.map(event => ({ icon: event.kind === "vaccine" ? "💉" : "🩺", title: event.title, time: new Date(event.eventDate).toLocaleDateString("ar-SA"), note: event.clinic ?? "" }))} empty="ستظهر مواعيدك هنا" /></div>; }

function ProfileScreen({ profile, onSaved }: { profile: any; onSaved: () => void }) { const [form, setForm] = useState({ age: profile?.age ?? 30, childrenCount: profile?.childrenCount ?? 1, marriageYears: profile?.marriageYears ?? 3, weightKg: profile?.weightKg ?? "", healthStatus: profile?.healthStatus ?? "" }); const save = trpc.profile.save.useMutation({ onSuccess: () => { onSaved(); toast.success("تم حفظ ملف الأم"); }, onError: e => toast.error(e.message) }); return <div className="screen-stack"><ScreenTitle icon={<UserRound />} title="ملف الأم" subtitle="معلوماتك محفوظة بشكل خاص لحسابك" /><section className="form-card"><div className="profile-avatar"><CircleUserRound /></div><Field label="العمر" type="number" value={form.age} onChange={v => setForm({ ...form, age: Number(v) })} /><Field label="عدد الأطفال" type="number" value={form.childrenCount} onChange={v => setForm({ ...form, childrenCount: Number(v) })} /><Field label="مدة الزواج بالسنوات" type="number" value={form.marriageYears} onChange={v => setForm({ ...form, marriageYears: Number(v) })} /><Field label="الوزن الحالي" value={form.weightKg} onChange={v => setForm({ ...form, weightKg: v })} placeholder="مثال: 64 كغ" /><label className="field-label">الحالة الصحية<textarea value={form.healthStatus} onChange={e => setForm({ ...form, healthStatus: e.target.value })} placeholder="اذكري أي ملاحظات صحية مهمة" /></label><button className="primary-button w-full" onClick={() => save.mutate(form)} disabled={save.isPending}>{save.isPending ? "جارٍ الحفظ..." : "حفظ التغييرات"}</button></section></div>; }

function SettingsScreen({ user, onGo, onLogout }: { user: any; onGo: (screen: Screen) => void; onLogout: () => void }) { return <div className="screen-stack"><ScreenTitle icon={<Menu />} title="المزيد" subtitle="الإعدادات والاشتراك والخصوصية" /><div className="settings-card"><div className="user-row"><div className="avatar">{user.name?.[0] ?? "م"}</div><div><b>{user.name ?? "حسابي"}</b><span>{user.email ?? "حساب Manus"}</span></div></div><button onClick={() => onGo("profile")}><UserRound /> ملف الأم <ChevronLeft /></button><button onClick={() => onGo("plans")}><WalletCards /> الاشتراك والباقات <ChevronLeft /></button><button onClick={() => toast.info("التنبيهات المحلية ستُفعّل في نسخة الهاتف") }><Bell /> التنبيهات <ChevronLeft /></button><button onClick={() => toast.info("العربية مفعلة حالياً مع اتجاه RTL") }><Sparkles /> اللغة والمظهر <span className="setting-value">العربية</span></button></div><div className="privacy-note"><ShieldCheck /><span><b>بياناتك لكِ</b><small>تُحفظ السجلات داخل حسابك ولا تظهر لمستخدمين آخرين.</small></span></div><button className="logout-button" onClick={onLogout}><LogOut /> تسجيل الخروج</button></div>; }

function PlansScreen() { const plans = [{ name: "مجاني", price: "0", copy: "طفل واحد", active: true }, { name: "عادي", price: "19", copy: "حتى 5 أطفال + 500MB", active: false }, { name: "مميز", price: "39", copy: "تخزين يتجاوز 10GB", active: false }]; return <div className="screen-stack"><ScreenTitle icon={<WalletCards />} title="الاشتراك" subtitle="اختاري المساحة التي تناسب عائلتك" /><div className="stripe-notice"><WalletCards /><span><b>الدفع الآمن عبر Stripe</b><small>ستظهر صفحة الدفع بعد إضافة مفاتيح Stripe من إعدادات المشروع. لا نخزن بيانات البطاقات داخل التطبيق.</small></span></div><div className="plans-list">{plans.map(plan => <div className={`plan-card ${plan.name === "عادي" ? "featured" : ""}`} key={plan.name}>{plan.name === "عادي" && <span className="popular">الأكثر اختياراً</span>}<h3>{plan.name}</h3><div className="plan-price"><b>{plan.price}</b><span>ر.س / شهرياً</span></div><p>{plan.copy}</p><button className={plan.active ? "secondary-button" : "primary-button"} onClick={() => plan.active ? toast.info("أنتِ على الباقة المجانية") : toast.info("Stripe غير مفعّل بعد — أضيفي STRIPE_SECRET_KEY و VITE_STRIPE_PUBLISHABLE_KEY لتفعيل Checkout")}>{plan.active ? "الباقة الحالية" : "اختيار الباقة"}</button></div>)}</div></div>; }

function ChildModal({ children, activeId, onSelect, onClose, onAdd, pending }: { children: any[]; activeId: number; onSelect: (id: number) => void; onClose: () => void; onAdd: (data: any) => void; pending: boolean }) { const [name, setName] = useState(""); const [ageMonths, setAgeMonths] = useState(6); const [showForm, setShowForm] = useState(false); return <div className="modal-backdrop"><div className="modal-card"><div className="modal-head"><div><span className="eyebrow">ملفات العائلة</span><h2>اختاري ملف الطفل</h2></div><button className="icon-button" onClick={onClose}><X /></button></div><div className="children-list">{children.map(child => <button key={child.id} className={child.id === activeId ? "child-row active" : "child-row"} onClick={() => onSelect(child.id)}><div className="child-avatar">👶</div><span><b>{child.name}</b><small>{child.ageMonths ? `${child.ageMonths} شهر` : "ملف جديد"}</small></span><ChevronLeft /></button>)}</div>{showForm ? <div className="mini-form"><Field label="اسم الطفل" value={name} onChange={setName} placeholder="مثال: عمر" /><Field label="العمر بالأشهر" type="number" value={ageMonths} onChange={v => setAgeMonths(Number(v))} /><button className="primary-button w-full" disabled={pending} onClick={() => onAdd({ name, ageMonths, birthStatus: "born", gender: "unknown", deliveryType: "unknown" })}>{pending ? "جارٍ الحفظ..." : "حفظ ملف الطفل"}</button></div> : <button className="add-child-button" onClick={() => setShowForm(true)}><Plus /> إضافة طفل جديد</button>}</div></div>; }

function ScreenTitle({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) { return <div className="screen-title"><div className="screen-title-icon">{icon}</div><div><h1>{title}</h1><p>{subtitle}</p></div></div>; }
function Choice({ selected, onClick, icon, label }: { selected: boolean; onClick: () => void; icon: string; label: string }) { return <button className={selected ? "choice selected" : "choice"} onClick={onClick}><span>{icon}</span><b>{label}</b></button>; }
function OptionChips({ title, options, value, onChange }: { title: string; options: string[]; value: string; onChange: (value: string) => void }) { return <div className="option-group"><h3>{title}</h3><div className="chips">{options.map(option => <button key={option} className={value === option ? "chip selected" : "chip"} onClick={() => onChange(option)}>{option}</button>)}</div></div>; }
function Field({ label, value, onChange, type = "text", placeholder }: { label: string; value: string | number; onChange: (value: string) => void; type?: string; placeholder?: string }) { return <label className="field-label">{label}<input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} /></label>; }
function Timeline({ title, items, empty }: { title: string; items: { icon: string; title: string; time: string; note?: string }[]; empty: string }) { return <section className="timeline-section"><div className="section-heading"><h2>{title}</h2><span>{items.length} سجل</span></div>{items.length === 0 ? <div className="empty-state"><span>✦</span><p>{empty}</p></div> : <div className="timeline">{items.map((item, index) => <div className="timeline-item" key={`${item.time}-${index}`}><div className="timeline-dot">{item.icon}</div><div><b>{item.title}</b><span>{item.note || "تم الحفظ في السجل"}</span></div><time>{item.time}</time></div>)}</div>}</section>; }
