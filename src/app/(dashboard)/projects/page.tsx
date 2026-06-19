
"use client";

import * as React from "react";
import Image from "next/image";
import { 
  ImagePlus, 
  ExternalLink, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  MoreVertical,
  LayoutGrid,
  List,
  Upload
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const projects = [
  {
    id: "p1",
    name: "Zenith CRM Mobile",
    client: "Ahmed Khalil",
    type: "Android App",
    progress: 85,
    status: "In Development",
    images: ["https://picsum.photos/seed/p1/400/250", "https://picsum.photos/seed/p1-2/400/250"],
    lastUpdate: "2h ago",
  },
  {
    id: "p2",
    name: "Eco-Ecomm Platform",
    client: "Sarah Johnson",
    type: "Web Application",
    progress: 100,
    status: "Completed",
    images: ["https://picsum.photos/seed/p2/400/250"],
    lastUpdate: "1d ago",
  },
  {
    id: "p3",
    name: "Health Tracker Pro",
    client: "Omar Zayed",
    type: "Android App",
    progress: 35,
    status: "Requirement Gathering",
    images: [],
    lastUpdate: "5m ago",
  },
];

export default function ProjectsPage() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-headline font-bold">Project Library</h2>
          <p className="text-muted-foreground text-sm">Manage your development lifecycle and project assets.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><LayoutGrid className="h-4 w-4 mr-2" /> Gallery</Button>
          <Button variant="outline"><List className="h-4 w-4 mr-2" /> List View</Button>
          <Button><Upload className="h-4 w-4 mr-2" /> New Project</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Card key={project.id} className="overflow-hidden border-none shadow-sm group hover:shadow-md transition-all">
            <div className="relative aspect-video bg-muted overflow-hidden">
              {project.images.length > 0 ? (
                <Image 
                  src={project.images[0]} 
                  alt={project.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                  <ImagePlus className="h-10 w-10 mb-2 opacity-20" />
                  <p className="text-xs">No project images yet. Upload to ImgBB.</p>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                <Button variant="secondary" size="sm" className="w-full bg-white/90 backdrop-blur">
                  <ExternalLink className="h-4 w-4 mr-2" /> View Asset Gallery
                </Button>
              </div>
              <Badge 
                className={`absolute top-3 right-3 border-none ${
                  project.status === "Completed" ? "bg-emerald-500" : "bg-primary"
                }`}
              >
                {project.status === "Completed" ? <CheckCircle className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                {project.status}
              </Badge>
            </div>
            
            <CardHeader className="p-4 pb-0">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg font-headline">{project.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">{project.type} for {project.client}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-bold">Completion</span>
                  <span className="text-muted-foreground">{project.progress}%</span>
                </div>
                <Progress value={project.progress} className="h-1.5" />
              </div>
            </CardContent>
            
            <CardFooter className="p-4 pt-0 border-t mt-auto flex justify-between items-center bg-muted/20">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Updated {project.lastUpdate}</span>
              <div className="flex -space-x-2">
                {[1, 2].map((u) => (
                  <div key={u} className="h-6 w-6 rounded-full border-2 border-background overflow-hidden bg-muted">
                    <img src={`https://picsum.photos/seed/u${u}/40/40`} alt="user" />
                  </div>
                ))}
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
