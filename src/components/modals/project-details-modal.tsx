'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  ChevronLeft, 
  Image as ImageIcon,
  FileText,
  User,
  Layers,
  Layout
} from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
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

  // وظيفة الإغلاق مع التأكد من إعادة تفعيل الصفحة
  const handleClose = () => {
    onClose();
    // تأمين عودة التفاعل للصفحة
    setTimeout(() => {
      document.body.style.pointerEvents = 'auto';
      document.body.style.overflow = 'auto';
    }, 100);
  };

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

    const projectRef = doc(db, "projects", project.id);
    await updateDoc(projectRef, {
      steps: updatedSteps,
      progress: newProgress,
      status: newProgress === 100 ? 'مكتمل' : 'قيد التنفيذ'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent 
        className="sm:max-w-[900px] w-[95vw] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden bg-white max-h-[90vh] flex flex-col" 
        dir="rtl"
      >
        {/* Header ثابت */}
        <div className="bg-primary p-6 text-primary-foreground shrink-0 z-20 shadow-md">
          <DialogHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                  <Briefcase className="h-6 w-6" />
                </div>
                <div className="text-right">
                  <DialogTitle className="text-2xl font-black">{project.name}</DialogTitle>
                  <DialogDescription className="text-primary-foreground/80 font-bold flex items-center gap-2 mt-1">
                    <User className="h-4 w-4" /> العميل: {project.clientName}
                  </DialogDescription>
                </div>
              </div>
              <div className="bg-white/10 px-4 py-2 rounded-2xl border border-white/20">
                <span className="text-[10px] font-black uppercase opacity-60 block">الحالة</span>
                <span className="text-sm font-black">{project.status}</span>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* جسم النافذة القابل للتمرير */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-slate-50/30">
          
          {/* معرض الصور */}
          {project.images && project.images.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-black text-slate-800 text-xl flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" /> واجهات النظام
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {project.images.map((img, idx) => (
                  <div key={idx} className="aspect-video rounded-2xl overflow-hidden border-2 border-white shadow-sm hover:shadow-md transition-shadow">
                    <img src={img} className="w-full h-full object-cover" alt="" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* المتطلبات والمراحل */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* المتطلبات */}
            <div className="lg:col-span-5 space-y-4">
              <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> المتطلبات
              </h3>
              <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm min-h-[150px]">
                <p className="text-slate-600 font-bold leading-relaxed text-sm whitespace-pre-line">
                  {project.requirements || 'لا توجد متطلبات محددة.'}
                </p>
              </div>
            </div>

            {/* مراحل التنفيذ */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" /> مراحل التنفيذ
              </h3>
              
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-black opacity-50 block uppercase">نسبة الإنجاز</span>
                    <span className="text-3xl font-black text-accent">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2 w-32 rounded-full bg-white/10" />
                </div>

                <div className="p-4 space-y-2">
                  {localSteps.map((step) => (
                    <div 
                      key={step.id} 
                      onClick={() => handleToggleStep(step.id)}
                      className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all border-2 ${
                        step.completed ? 'bg-green-50 border-green-100' : 'bg-white border-slate-50 hover:border-primary/20'
                      }`}
                    >
                      <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${
                        step.completed ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {step.completed ? <CheckCircle2 className="h-5 w-5" /> : <div className="h-2 w-2 rounded-full bg-current" />}
                      </div>
                      <span className={`font-black text-sm flex-1 ${step.completed ? 'text-green-700' : 'text-slate-700'}`}>
                        {step.title}
                      </span>
                      {step.completed && <span className="text-[10px] font-black text-green-600 bg-green-100 px-2 py-1 rounded-lg">تم</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* زر الإغلاق النهائي بداخل السكرول */}
          <div className="pt-8 pb-4">
            <Button 
              onClick={handleClose}
              className="w-full h-16 rounded-2xl font-black text-xl shadow-xl hover:scale-[1.01] active:scale-95 transition-all bg-primary text-white gap-3"
            >
              إغلاق ومعاودة العمل
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <p className="text-center text-slate-400 font-bold text-xs mt-4 flex items-center justify-center gap-2">
              <Clock className="h-3 w-3" /> يتم حفظ تقدمك تلقائياً
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
