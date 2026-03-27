import { useState, useRef, useEffect } from 'react';
import * as Blockly from 'blockly';
import { Toolbox } from '@/components/bot-builder/Toolbox';
import '@/components/bot-builder/generators';
import { Button } from '@/components/ui/button';
import { useBotRunner } from '@/hooks/useBotRunner';

export default function BotBuilder() {
  const [xml, setXml] = useState('<xml xmlns="https://developers.google.com/blockly/xml"></xml>');
  const blocklyDiv = useRef(null);
  const workspaceRef = useRef(null);
  const fileInputRef = useRef(null);
  const { isRunning, log, run } = useBotRunner();

  useEffect(() => {
    if (blocklyDiv.current && !workspaceRef.current) {
      workspaceRef.current = Blockly.inject(blocklyDiv.current, {
        toolbox: Toolbox,
        grid: { spacing: 20, length: 3, colour: '#ccc', snap: true },
        trashcan: true,
        zoom: { controls: true, wheel: true, startScale: 1.0, maxScale: 3, minScale: 0.3, scaleSpeed: 1.2 }
      });

      workspaceRef.current.addChangeListener(() => {
        const newXml = Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(workspaceRef.current));
        setXml(newXml);
      });
    }

    return () => {
      if (workspaceRef.current) {
        workspaceRef.current.dispose();
        workspaceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (workspaceRef.current && xml) {
      const currentXml = Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(workspaceRef.current));
      if (xml !== currentXml) {
        workspaceRef.current.clear();
        try {
          const dom = Blockly.utils.xml.textToDom(xml);
          Blockly.Xml.domToWorkspace(dom, workspaceRef.current);
        } catch (e) {
          console.error("Error loading XML to workspace", e);
        }
      }
    }
  }, [xml]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        let content = e.target.result;
        if (typeof content === 'string') {
          // Pre-process XML to fix "Sabotaged" namespaces and malformed characters
          // 1. Remove backticks from xmlns attributes (common in sabotaged bots)
          content = content.replace(/xmlns\s*=\s*"`([^`]+)`"/g, 'xmlns="$1"');
          // 2. Fix spaces in xmlns if any
          content = content.replace(/xmlns\s*=\s*"\s+([^"]+)\s+"/g, 'xmlns="$1"');
          // 3. Remove other common sabotage patterns
          content = content.replace(/`http:\/\/www\.w3\.org\/1999\/xhtml`/g, 'http://www.w3.org/1999/xhtml');
          
          setXml(content);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="h-[calc(100vh-64px-80px)] lg:h-[calc(100vh-64px)] w-full flex flex-col bg-background overflow-hidden">
      <div className="p-2 border-b flex items-center gap-2 bg-card shadow-sm z-10 shrink-0">
        <Button size="sm" onClick={() => fileInputRef.current.click()}>Load Bot</Button>
        <Button size="sm" variant="success" onClick={() => run(workspaceRef.current)} disabled={isRunning}>
          {isRunning ? 'Running...' : 'Run Bot'}
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
          accept=".xml"
        />
      </div>
      <div className="flex-grow w-full relative overflow-hidden">
        <div ref={blocklyDiv} className="absolute inset-0 w-full h-full" />
        {log.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/90 text-white p-3 font-mono text-[10px] max-h-48 overflow-y-auto border-t border-white/10 z-20">
            <div className="flex justify-between items-center mb-2 border-b border-white/10 pb-1">
              <span className="text-white/50 uppercase tracking-widest">Bot Execution Log</span>
              <button onClick={() => window.location.reload()} className="text-white/30 hover:text-white">Clear</button>
            </div>
            {log.map((line, i) => (
              <div key={i} className="py-0.5"><span className="text-success/50 mr-2">›</span>{line}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
