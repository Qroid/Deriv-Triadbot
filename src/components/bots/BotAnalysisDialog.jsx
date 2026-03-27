import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bot, 
  Info, 
  AlertTriangle, 
  Cpu, 
  Activity, 
  Layers, 
  EyeOff,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { motion } from "framer-motion";

export default function BotAnalysisDialog({ open, onOpenChange, analysis, onConfirm }) {
  if (!analysis) return null;

  const { detected, ignored, indicators, logicComplexity, warnings } = analysis;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black">Bot Strategy Analysis</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Deep inspection of your XML strategy</p>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-2">
          <div className="space-y-6 py-4">
            {/* Detected Strategy & Asset */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-secondary/50 border border-border/50">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="h-4 w-4 text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Market & Strategy</span>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Asset</p>
                    <p className="text-sm font-black">{detected.asset}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Base Strategy</p>
                    <p className="text-sm font-black text-primary">{detected.strategy}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-secondary/50 border border-border/50">
                <div className="flex items-center gap-2 mb-3">
                  <Cpu className="h-4 w-4 text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Logic & Indicators</span>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Complexity</p>
                    <Badge variant="outline" className="mt-1 font-black uppercase text-[9px] border-primary/20 text-primary bg-primary/5">
                      {logicComplexity}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Detected Indicators</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {indicators.length > 0 ? (
                        indicators.map((ind, i) => (
                          <Badge key={i} variant="secondary" className="text-[8px] font-bold py-0">{ind}</Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground font-medium italic">None detected</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Potential Issues</span>
                </div>
                <div className="space-y-2">
                  {warnings.map((warning, i) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      transition={{ delay: i * 0.1 }}
                      key={i} 
                      className="flex items-start gap-3 p-3 rounded-xl bg-warning/5 border border-warning/10"
                    >
                      <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                      <p className="text-xs font-bold text-warning/80">{warning}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Ignored/Unsupported Blocks */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <EyeOff className="h-4 w-4 text-muted-foreground" />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ignored / Unsupported Components</span>
              </div>
              <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50">
                {ignored.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                      The following components were found in the XML but are <span className="text-foreground font-bold underline decoration-primary/30">not supported</span> by this dashboard. They will be ignored:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {ignored.map((type, i) => (
                        <code key={i} className="text-[9px] px-2 py-0.5 bg-background border border-border rounded-md font-mono text-muted-foreground">
                          {type}
                        </code>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle2 className="h-4 w-4" />
                    <p className="text-xs font-bold">Perfect match! All blocks are supported.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Summary List */}
            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="h-4 w-4 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Final Compiled Parameters</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-[9px] text-muted-foreground uppercase font-bold">Stake</p>
                  <p className="text-xs font-black font-mono">${detected.initial_stake}</p>
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground uppercase font-bold">Duration</p>
                  <p className="text-xs font-black font-mono">{detected.duration} Ticks</p>
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground uppercase font-bold">Contract</p>
                  <p className="text-xs font-black">{detected.contract_type}</p>
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground uppercase font-bold">Prediction</p>
                  <p className="text-xs font-black">{detected.prediction}</p>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 pt-2 flex sm:justify-between items-center gap-3 bg-secondary/20 border-t border-border/50">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
          <Button 
            onClick={() => onConfirm(detected)}
            className="bg-primary text-white hover:bg-primary/90 px-8 rounded-xl font-black uppercase text-xs tracking-widest"
          >
            Confirm & Create Bot
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
