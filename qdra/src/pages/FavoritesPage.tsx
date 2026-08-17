import { useAppData } from "../context/AppDataContext";
import ReviewList from "../components/ReviewList";

export default function FavoritesPage() {
  const { state, removeFavorite } = useAppData();

  return (
    <div className="animate-fade-in-up flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink-50 md:text-3xl">المفضلة</h1>
        <p className="mt-1 text-sm text-ink-300">الأسئلة التي حفظتها للرجوع إليها لاحقًا</p>
      </div>

      <ReviewList
        items={state.favorites}
        emptyTitle="لا توجد أسئلة مفضلة"
        emptyDescription="اضغط على أيقونة النجمة ⭐ أثناء حل أي سؤال لإضافته إلى المفضلة."
        onRemove={removeFavorite}
        removeLabel="إزالة من المفضلة"
      />
    </div>
  );
}
