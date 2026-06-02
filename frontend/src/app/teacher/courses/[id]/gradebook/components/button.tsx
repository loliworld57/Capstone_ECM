interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "success" | "excel";
}

export default function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  const styles = {
    primary:
      "flex items-center gap-2 bg-[var(--color-main)] border-2 border-[var(--color-main)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--color-soft-white)] hover:text-[var(--color-main)] transition",
    outline:
      "border border-gray-300 bg-white hover:bg-gray-50",
    success:
      "bg-green-600 text-white hover:bg-green-700",
    excel:
      "flex items-center gap-2 bg-[var(--color-positive)] border-2 border-[var(--color-positive)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--color-soft-white)] hover:text-[var(--color-positive)] transition",
  };

  return (
    <button
      {...props}
      className={`px-4 py-2 rounded-md transition flex items-center ${styles[variant]} ${className}`}
    />
  );
}