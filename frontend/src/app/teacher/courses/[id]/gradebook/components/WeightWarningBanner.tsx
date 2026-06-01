import { AlertCircle } from "lucide-react";

interface WeightWarningBannerProps {
  totalWeight: number;
}

export default function WeightWarningBanner({ totalWeight }: WeightWarningBannerProps) {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8 flex items-start gap-3">
      <AlertCircle className="text-yellow-600 mt-0.5 flex-shrink-0" size={20} />
      <div>
        <h3 className="font-semibold text-yellow-900">Category Weights Incomplete</h3>
        <p className="text-yellow-800 text-sm mt-1">
          Category weights total {totalWeight}%. Final scores are being calculated but the score sheet is incomplete.
          Consider adding more categories or adjusting weights to reach 100%.
        </p>
      </div>
    </div>
  );
}
