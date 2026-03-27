import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bot, 
  AlertTriangle, 
  Cpu, 
  Activity, 
  Layers, 
  EyeOff,
  CheckCircle2,
  ShieldCheck,
  Zap,
  BarChart3
} from "lucide-react";
import { motion } from "framer-motion";

export default function BotAnalysisDialog({ open, onOpenChange, analysis, onConfirm }) {
  if (!analysis) return null;

  const { detected, ignored, indicators, logicComplexity, warnings, impactAssessment, compatibilityScore } = analysis;

  const getImpactColor = (status) => {
    if (status === "preserved") return "text-success";
    if (status === "partial") return "text-warning";
    return "text-primary";
  };

  const getScoreColor = (score) => {
    if (score >= 90) return "text-success";
    if (score >= 70) return "text-warning";
    return "text-primary";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black">Strategy Prototype Analysis</DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Assessing behavioral integrity & compatibility</p>
              </div>
            </div>
            <div className="text-right mr-4">
              <p className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">Compatibility</p>
              <p className={`text-2xl font-black ${getScoreColor(compatibilityScore)}`}>{compatibilityScore}%</p>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-2">
          <div className="space-y-6 py-4">
            
            {/* Strategy Impact Assessment */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Behavioral Impact Assessment</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(impactAssessment).map(([key, impact], i) => (
                  <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-background border border-border/50">
                        {key === 'logic' ? <Cpu className="h-3.5 w-3.5" /> : key === 'money' ? <Zap className="h-3.5 w-3.5" /> : <BarChart3 className="h-3.5 w-3.5" />}
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground leading-none mb-1">{key}</p>
                        <p className="text-xs font-bold leading-tight">{impact.detail}</p>
                      </div>
                    </div>
                    <Badge variant="ghost" className={`text-[9px] font-black uppercase ${getImpactColor(impact.status)}`}>
                      {impact.status.replace('-', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Core Parameters vs Prototype */}
            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
              <div className="flex items-center gap-2 mb-4">
                <Layers className="h-4 w-4 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Prototype Configuration</span>
              </div>
              <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                <div className="flex justify-between border-b border-primary/10 pb-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Market</span>
                  <span className="text-xs font-black">{detected.asset}</span>
                </div>
                <div className="flex justify-between border-b border-primary/10 pb-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Strategy</span>
                  <span className="text-xs font-black">{detected.strategy}</span>
                </div>
                <div className="flex justify-between border-b border-primary/10 pb-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Stake</span>
                  <span className="text-xs font-black font-mono">${detected.initial_stake}</span>
                </div>
                <div className="flex justify-between border-b border-primary/10 pb-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Contract</span>
                  <span className="text-xs font-black">{detected.contract_type}</span>
                </div>
              </div>
            </div>

            {/* Warnings & Ignored Blocks */}
            {(warnings.length > 0 || ignored.length > 0) && (
              <div className="space-y-4">
                {warnings.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 px-1">
                      <AlertTriangle className="h-4 w-4 text-warning" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Critical Warnings</span>
                    </div>
                    {warnings.map((warning, i) => (
                      <div key={i} className="p-3 rounded-xl bg-warning/5 border border-warning/10 flex gap-3">
                        <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                        <p className="text-xs font-bold text-warning/80">{warning}</p>
                      </div>
                    ))}
                  </div>
                )}

                {ignored.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 px-1">
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Blocks Ignored in Prototype</span>
                    </div>
                    <div className="p-4 rounded-xl bg-secondary/20 border border-border/50">
                      <p className="text-[10px] font-bold text-muted-foreground mb-3 uppercase tracking-tight">
                        These blocks will be excluded from the generated prototype:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {ignored.map((type, i) => (
                          <code key={i} className="text-[9px] px-2 py-0.5 bg-background border border-border rounded-md font-mono text-muted-foreground">
                            {type}
                          </code>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 pt-2 flex sm:justify-between items-center gap-3 bg-secondary/20 border-t border-border/50">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            Abort Import
          </Button>
          <Button 
            onClick={() => onConfirm(detected)}
            className="bg-primary text-white hover:bg-primary/90 px-8 rounded-xl font-black uppercase text-xs tracking-widest"
          >
            Compile Prototype
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
