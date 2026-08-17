import { useTheme } from "../context/ThemeContext";

export default function LogoImage({ className = "h-10" }: { className?: string }) {
  const { theme } = useTheme();

  // اختيار الصورة المناسبة حسب المظهر الحالي
  const logoSrc = theme === "dark" ? "/logo-dark.png" : "/logo-light.png";

  return (
    <img
      src={logoSrc}
      alt="شعار منصة قدرة اللفظي"
      className={`${className} w-auto object-contain filter drop-shadow-md transition-all duration-300`}
    />
  );
}