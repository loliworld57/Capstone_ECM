interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "success";
}

export default function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  const styles = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700",
    outline:
      "border border-gray-300 bg-white hover:bg-gray-50",
    success:
      "bg-green-600 text-white hover:bg-green-700",
  };

  return (
    <button
      {...props}
      className={`px-4 py-2 rounded-md transition flex items-center ${styles[variant]} ${className}`}
    />
  );
}