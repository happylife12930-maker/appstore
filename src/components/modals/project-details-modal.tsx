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
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  ChevronLeft, 
  Image as ImageIcon,
  FileText,
  User,
  Layout,
  Layers
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

  // حل مشكلة الفريز عند الإغلاق
  const handleClose = () => {
    onClose();
    setTimeout(() => {
      document.body.style.pointerEvents = 'auto';
      document.body.classList.remove('modal-open');
    }, 300);
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
      <DialogContent className="sm:max-w-[900px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white max-h-[90vh] flex flex-col" dir="rtl">
        {/* Header - Fixed */}
        <div className="bg-primary p-8 text-primary-foreground shrink-0">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                  <Briefcase className="h-7 w-7" />
                </div>
                <div>
                  <DialogTitle className="text-3xl font-black mb-1">{project.name}</DialogTitle>
                  <DialogDescription className="text-primary-foreground/90 font-bold flex items-center gap-2 text-lg">
                    <User className="h-5 w-5" /> العميل: {project.clientName}
                  </DialogDescription>
                </div>
              </div>
              <div className="hidden md:block bg-white/10 p-4 rounded-3xl border border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <Layout className="h-4 w-4" />
                  <span className="text-xs font-black uppercase tracking-wider">الحالة الحالية</span>
                </div>
                <div className="text-xl font-black">{project.status}</div>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Content - Scrollable */}
        <ScrollArea className="flex-1">
          <div className="p-8 space-y-10">
            {/* Project Images Gallery */}
            {project.images && project.images.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-black text-slate-800 text-xl flex items-center gap-3 pr-2">
                  <div className="h-8 w-1.5 bg-primary rounded-full" />
                  <ImageIcon className="h-6 w-6 text-primary" /> صور واجهات التطبيق
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {project.images.map((img, idx) => (
                    <div key={idx} className="group relative aspect-video rounded-[2rem] overflow-hidden border-4 border-slate-50 shadow-md hover:shadow-xl transition-all">
                      <img 
                        src={img} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                        alt={`Project visual ${idx + 1}`} 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
              {/* Technical Requirements Section */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="font-black text-slate-800 text-xl flex items-center gap-3 pr-2">
                  <div className="h-8 w-1.5 bg-primary rounded-full" />
                  <FileText className="h-6 w-6 text-primary" /> ملف المتطلبات
                </h3>
                <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 min-h-[300px] shadow-inner">
                  <p className="text-slate-600 font-bold leading-relaxed whitespace-pre-line text-base italic">
                    {project.requirements || 'لا توجد تفاصيل متطلبات محددة لهذا المشروع حالياً.'}
                  </p>
                </div>
              </div>

              {/* Execution Steps & Progress Section */}
              <div className="lg:col-span-3 space-y-4">
                <h3 className="font-black text-slate-800 text-xl flex items-center gap-3 pr-2">
                  <div className="h-8 w-1.5 bg-primary rounded-full" />
                  <Layers className="h-6 w-6 text-primary" /> مراحل التنفيذ والتقدم
                </h3>
                <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
                  {/* Progress Indicator */}
                  <div className="bg-slate-50 p-6 rounded-3xl space-y-3">
                    <div className="flex justify-between items-end">
                      <span className="text-sm font-black text-slate-500 uppercase tracking-widest">إجمالي الإنجاز</span>
                      <span className="text-4xl font-black text-primary">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-4 rounded-full bg-slate-200" />
                  </div>

                  {/* Steps List */}
                  <div className="space-y-3">
                    {localSteps.map((step) => (
                      <div 
                        key={step.id} 
                        onClick={() => handleToggleStep(step.id)}
                        className={`group flex items-center gap-4 p-5 rounded-2xl transition-all cursor-pointer border-2 ${
                          step.completed 
                            ? 'bg-green-50/50 border-green-100 shadow-sm' 
                            : 'bg-white border-slate-100 hover:border-primary/30 hover:shadow-md'
                        }`}
                      >
                        <div className={`h-8 w-8 rounded-xl flex items-center justify-center transition-colors ${
                          step.completed ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-primary/10'
                        }`}>
                          {step.completed ? <CheckCircle2 className="h-5 w-5" /> : <div className="h-2 w-2 rounded-full bg-current" />}
                        </div>
                        <span className={`flex-1 font-black text-lg ${step.completed ? 'text-green-700 line-through opacity-60' : 'text-slate-700'}`}>
                          {step.title}
                        </span>
                        {step.completed && <div className="text-[10px] font-black bg-green-200 text-green-800 px-3 py-1 rounded-full uppercase">تم الإنجاز</div>}
                      </div>
                    ))}
                  </div>

                  {/* Main Action Button - End of Steps */}
                  <div className="pt-6">
                    <Button 
                      onClick={handleClose}
                      className="w-full h-20 rounded-[2rem] font-black text-2xl shadow-2xl hover:scale-[1.02] transition-all bg-slate-900 text-white gap-4 group"
                    >
                      إغلاق ومعاودة العمل 
                      <ChevronLeft className="h-8 w-8 group-hover:-translate-x-2 transition-transform" />
                    </Button>
                    <p className="text-center text-slate-400 font-bold mt-4 text-sm flex items-center justify-center gap-2">
                      <Clock className="h-4 w-4" /> يتم حفظ كافة التغييرات تلقائياً في قاعدة البيانات
                    </p>
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
