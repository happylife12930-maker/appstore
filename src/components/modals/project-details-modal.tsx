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
import { ScrollArea } from '@/components/ui/scroll-area';
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

  // حل مشكلة الفريز عند الإغلاق بشكل قاطع
  const handleClose = () => {
    onClose();
    setTimeout(() => {
      document.body.style.pointerEvents = 'auto';
      document.body.style.overflow = 'auto';
    }, 200);
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
        className="sm:max-w-[1000px] w-[95vw] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white max-h-[92vh] flex flex-col focus:outline-none" 
        dir="rtl"
      >
        {/* Header - ثابت في الأعلى */}
        <div className="bg-primary p-8 text-primary-foreground shrink-0 border-b border-white/10 shadow-lg z-20">
          <DialogHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-white/20 rounded-[1.5rem] backdrop-blur-xl shadow-inner">
                  <Briefcase className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <DialogTitle className="text-3xl font-black tracking-tight">{project.name}</DialogTitle>
                  <DialogDescription className="text-primary-foreground/90 font-bold flex items-center gap-2 text-lg">
                    <User className="h-5 w-5 text-accent" /> العميل: {project.clientName}
                  </DialogDescription>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white/10 p-4 rounded-3xl border border-white/20 backdrop-blur-md">
                <div className="h-10 w-10 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Layout className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 block">حالة المشروع</span>
                  <span className="text-lg font-black">{project.status}</span>
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Content - قابل للتمرير */}
        <ScrollArea className="flex-1 w-full bg-slate-50/30">
          <div className="p-6 md:p-10 space-y-12 pb-24">
            
            {/* معرض الصور - Gallery */}
            {project.images && project.images.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-1.5 bg-primary rounded-full" />
                  <h3 className="font-black text-slate-800 text-2xl flex items-center gap-3">
                    <ImageIcon className="h-7 w-7 text-primary" /> واجهات النظام
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {project.images.map((img, idx) => (
                    <div key={idx} className="group relative aspect-video rounded-[2.5rem] overflow-hidden border-4 border-white shadow-xl hover:shadow-2xl transition-all duration-500">
                      <img 
                        src={img} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        alt={`Interface ${idx + 1}`} 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6">
                        <span className="text-white font-black text-sm">عرض بالحجم الكامل</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* تفاصيل المشروع والخطوات - Two Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* العمود الأول: المتطلبات */}
              <div className="lg:col-span-5 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-1.5 bg-primary rounded-full" />
                  <h3 className="font-black text-slate-800 text-xl flex items-center gap-3">
                    <FileText className="h-6 w-6 text-primary" /> تفاصيل المتطلبات
                  </h3>
                </div>
                <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm min-h-[300px] relative">
                  <div className="absolute top-4 left-4 opacity-5">
                    <FileText className="h-32 w-32" />
                  </div>
                  <p className="text-slate-600 font-bold leading-relaxed whitespace-pre-line text-lg italic relative z-10">
                    {project.requirements || 'لا توجد تفاصيل متطلبات محددة لهذا المشروع حالياً.'}
                  </p>
                </div>
              </div>

              {/* العمود الثاني: التقدم والخطوات */}
              <div className="lg:col-span-7 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-1.5 bg-primary rounded-full" />
                  <h3 className="font-black text-slate-800 text-xl flex items-center gap-3">
                    <Layers className="h-6 w-6 text-primary" /> مراحل التنفيذ والتقدم
                  </h3>
                </div>
                
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                  {/* شريط التقدم */}
                  <div className="p-8 bg-slate-900 text-white space-y-4">
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50">نسبة الإنجاز الإجمالية</span>
                        <div className="text-5xl font-black text-accent">{progress}%</div>
                      </div>
                      <CheckCircle2 className={`h-16 w-16 ${progress === 100 ? 'text-green-400' : 'text-white/10'}`} />
                    </div>
                    <Progress value={progress} className="h-3 rounded-full bg-white/10" />
                  </div>

                  {/* قائمة الخطوات */}
                  <div className="p-8 space-y-4">
                    {localSteps.map((step) => (
                      <div 
                        key={step.id} 
                        onClick={() => handleToggleStep(step.id)}
                        className={`group flex items-center gap-5 p-5 rounded-2xl transition-all cursor-pointer border-2 shadow-sm hover:translate-x-[-4px] active:scale-[0.98] ${
                          step.completed 
                            ? 'bg-green-50/40 border-green-200' 
                            : 'bg-white border-slate-100 hover:border-primary/40'
                        }`}
                      >
                        <div className={`h-10 w-10 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                          step.completed 
                            ? 'bg-green-500 text-white shadow-lg rotate-[360deg]' 
                            : 'bg-slate-100 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary'
                        }`}>
                          {step.completed ? <CheckCircle2 className="h-6 w-6" /> : <div className="h-2.5 w-2.5 rounded-full bg-current" />}
                        </div>
                        <div className="flex-1">
                          <span className={`block font-black text-lg transition-all ${step.completed ? 'text-green-700 line-through opacity-50' : 'text-slate-700'}`}>
                            {step.title}
                          </span>
                        </div>
                        {step.completed && (
                          <div className="bg-green-100 text-green-700 text-[10px] font-black px-4 py-1.5 rounded-full shadow-sm">
                            تم التنفيذ
                          </div>
                        )}
                      </div>
                    ))}

                    {/* زر الإغلاق الضخم - داخل السكرول أسفل الخطوات */}
                    <div className="pt-10">
                      <Button 
                        onClick={handleClose}
                        className="w-full h-20 rounded-[2rem] font-black text-2xl shadow-2xl hover:scale-[1.02] active:scale-95 transition-all bg-primary text-white gap-4 group overflow-hidden relative"
                      >
                        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        <span className="relative z-10">إغلاق ومعاودة العمل</span>
                        <ChevronLeft className="h-8 w-8 group-hover:-translate-x-2 transition-transform relative z-10" />
                      </Button>
                      <div className="flex items-center justify-center gap-2 mt-6 text-slate-400 font-bold text-sm">
                        <Clock className="h-4 w-4" />
                        <span>يتم حفظ تقدمك تلقائياً في السحابة</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}