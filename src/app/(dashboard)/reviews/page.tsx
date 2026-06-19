
"use client";

import * as React from "react";
import { Star, MessageSquare, ThumbsUp, Quote } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "@/components/language-provider";

const reviews = [
  { id: 1, client: "Ahmed Khalil", project: "Zenith CRM", rating: 5, comment: "Exceptional work! The team exceeded our expectations in both design and functionality.", date: "2024-02-15" },
  { id: 2, client: "Sarah Johnson", project: "EcoMobile", rating: 4, comment: "Very professional. Minor delays during the testing phase but the final product is solid.", date: "2024-01-20" },
  { id: 3, client: "Omar Zayed", project: "HealthTracker", rating: 5, comment: "The AI features are game-changing. Truly high-performance agency.", date: "2024-03-01" },
];

export default function ReviewsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-primary text-primary-foreground">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <h4 className="text-lg font-bold uppercase mb-2">{t('satisfaction')}</h4>
            <div className="text-5xl font-bold font-headline mb-2">98%</div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="h-4 w-4 fill-accent text-accent" />)}
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm col-span-2">
          <CardContent className="p-6">
            <h4 className="font-bold text-sm mb-4 uppercase tracking-wider">Rating Distribution</h4>
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((stars) => (
                <div key={stars} className="flex items-center gap-4">
                  <span className="text-xs font-bold w-12">{stars} Stars</span>
                  <Progress value={stars === 5 ? 85 : stars === 4 ? 12 : 3} className="h-2" />
                  <span className="text-xs text-muted-foreground w-8">{stars === 5 ? '85%' : stars === 4 ? '12%' : '3%'}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {reviews.map((rev) => (
          <Card key={rev.id} className="border-none shadow-sm group">
            <CardContent className="p-6">
              <Quote className="h-8 w-8 text-primary/10 mb-4 group-hover:text-accent transition-colors" />
              <p className="italic text-muted-foreground mb-6">"{rev.comment}"</p>
              <div className="flex items-center justify-between border-t pt-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border">
                    <AvatarImage src={`https://picsum.photos/seed/${rev.id}/100/100`} />
                    <AvatarFallback>{rev.client[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h5 className="font-bold text-sm">{rev.client}</h5>
                    <p className="text-[10px] text-muted-foreground">{rev.project}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex gap-0.5 mb-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-3 w-3 ${i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-muted'}`} />
                    ))}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{rev.date}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
