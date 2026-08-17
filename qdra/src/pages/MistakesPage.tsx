import { useAppData } from "../context/AppDataContext";
import ReviewList from "../components/ReviewList";

export default function MistakesPage() {
  const { state, removeMistake } = useAppData();

  return (
    <div className="animate-fade-in-up flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink-50 md:text-3xl">أخطائي</h1>
        <p className="mt-1 text-sm text-ink-300">جميع الأسئلة التي أخطأت فيها سابقًا، يمكنك مراجعتها وإعادة حلها</p>
      </div>

      <ReviewList
        items={state.mistakes}
        emptyTitle="لا توجد أخطاء مسجلة"
        emptyDescription="كل الأسئلة التي تخطئ فيها أثناء الحل ستظهر هنا تلقائيًا لتتمكن من مراجعتها."
        onRemove={removeMistake}
        removeLabel="حذف من الأخطاء"
      />
    </div>
  );
}
