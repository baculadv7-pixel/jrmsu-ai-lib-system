import React from "react";
import { Progress } from "@/components/ui/progress";

interface NavigationProgressProps {
  currentStep: number;
  totalSteps: number;
}

export const NavigationProgress: React.FC<NavigationProgressProps> = ({
  currentStep,
  totalSteps,
}) => {
  const progressValue = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground">
          Phase {currentStep} of {totalSteps}
        </span>
        <span className="text-sm text-muted-foreground">
          {Math.round(progressValue)}% Complete
        </span>
      </div>
      <Progress value={progressValue} className="w-full h-2" />
    </div>
  );
};