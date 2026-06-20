'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  ChevronLeft, 
  Image as ImageIcon,
  X,
  FileText,
  User
} from 'lucide-react';
import { doc, updateDoc, Firestore } from 'firebase/firestore';
import { ProjectData } from './project-modal';

interface ProjectDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectData | null;
  db: any;
}

export function ProjectDetailsModal({ isOpen, onClose, project, db }: ProjectDetailsModalProps) {
  const [localSteps, setLocalSteps] = useState(project?.steps || []);
  const [progress, setProgress] = useState(project?.progress || 0);

  useEffect(() => {
    if (project) {
      setLocalSteps(project.steps || []);
      setProgress(project.progress || 0);
    }
  }, [project]);

  if (!project) return null;

  const handleToggleStep = async (stepId: number) => {
    if (!db || !project.id) return;

    const updatedSteps = localSteps.map(step => 
      step.id === stepId ? { ...step, completed: !step.completed } : step
    );

    const completedCount = updatedSteps.filter(s => s.completed).length;
    const newProgress = Math.round((completedCount / updatedSteps.length) * 100);

    setLocalSteps(updatedSteps);
    setProgress(newProgress);

    // تحديث لحظي في فيربيز
    const projectRef = doc(db, "projects", project.id);
    await updateDoc(projectRef, {
      steps: updatedSteps,
      progress: newProgress,
      status: newProgress === 100 ? 'مكتمل' : 'قيد التنفيذ'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white" dir="rtl">
        <div className="bg-primary p-8 text-primary-foreground relative">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/10 rounded-xl">
                <Briefcase className="h-6 w-6" />
              </div>
              <DialogTitle className="text-2xl font-black">{project.name}</DialogTitle>
            </div>
            <DialogDescription className="text-primary-foreground/80 font-bold flex items-center gap-2">
              <User className="h-4 w-4" /> العميل: {project.clientName}
            </DialogDescription>
          </DialogHeader>
        </div>

        <ScrollArea className="max-h-[80vh]">
          <div className="p-8 space-y-8">
            {/* معرض الصور */}
            {project.images && project.images.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-black text-slate-800 flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-primary" /> صور المشروع
                </h3>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                  {project.images.map((img, idx) => (
                    <img 
                      key={idx} 
                      src={img} 
                      className="h-40 w-64 object-cover rounded-[2rem] shadow-md border-2 border-slate-50 flex-shrink-0"
                      alt=""
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* المتطلبات */}
              <div className="space-y-4">
                <h3 className="font-black text-slate-800 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" /> المتطلبات التقنية
                </h3>
                <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 min-h-[200px]">
                  <p className="text-slate-600 font-bold leading-relaxed whitespace-pre-line">
                    {project.requirements || 'لا توجد تفاصيل متطلبات محددة لهذا المشروع حالياً.'}
                  </p>
                </div>
              </div>

              {/* مراحل التنفيذ */}
              <div className="space-y-4">
                <h3 className="font-black text-slate-800 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" /> مراحل التنفيذ
                </h3>
                <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-black">
                      <span className="text-slate-500 uppercase">التقدم الإجمالي</span>
                      <span className="text-primary">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-3 rounded-full" />
                  </div>

                  <div className="space-y-3">
                    {localSteps.map((step) => (
                      <div 
                        key={step.id} 
                        className={`flex items-center gap-3 p-4 rounded-2xl transition-all cursor-pointer ${
                          step.completed ? 'bg-green-50 border-green-100' : 'bg-white border-slate-200'
                        } border`}
                        onClick={() => handleToggleStep(step.id)}
                      >
                        <Checkbox 
                          checked={step.completed} 
                          onCheckedChange={() => handleToggleStep(step.id)}
                          className="h-5 w-5 rounded-lg border-2"
                        />
                        <span className={`font-black text-sm ${step.completed ? 'text-green-700 line-through opacity-70' : 'text-slate-700'}`}>
                          {step.title}
                        </span>
                        {step.completed && <CheckCircle2 className="h-4 w-4 text-green-600 mr-auto" />}
                      </div>
                    ))}
                  </div>

                  {/* الزر المطلوب في نهاية القائمة */}
                  <Button 
                    onClick={onClose}
                    className="w-full h-16 rounded-[1.5rem] font-black text-xl shadow-xl hover:scale-[1.02] transition-all bg-slate-900 text-white gap-2 mt-4"
                  >
                    إغلاق ومعاودة العمل <ChevronLeft className="h-6 w-6" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
