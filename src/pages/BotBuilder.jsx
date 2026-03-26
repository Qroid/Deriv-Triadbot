import { useState, useRef } from 'react';
import { ReactBlockly, useBlocklyWorkspace } from 'react-blockly';
import { Toolbox } from '@/components/bot-builder/Toolbox';
import '@/components/bot-builder/generators';
import { Button } from '@/components/ui/button';
import { useBotRunner } from '@/hooks/useBotRunner';

export default function BotBuilder() {
  const [xml, setXml] = useState('<xml xmlns="https://developers.google.com/blockly/xml"></xml>');
  const fileInputRef = useRef(null);
  const { workspace } = useBlocklyWorkspace();
  const { isRunning, log, run } = useBotRunner();

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setXml(e.target.result);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="h-full w-full flex flex-col">
      <div className="p-2 border-b flex items-center gap-2">
        <Button onClick={() => fileInputRef.current.click()}>Load Bot</Button>
        <Button onClick={() => run(workspace)} disabled={isRunning}>
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
      <div className="flex-grow h-full w-full relative">
        <ReactBlockly
          toolboxCategories={Toolbox}
          initialXml={xml}
          wrapperDivClassName="h-full w-full"
          workspaceConfiguration={{
            grid: {
              spacing: 20,
              length: 3,
              colour: '#ccc',
              snap: true,
            },
          }}
          onXmlChange={setXml}
        />
        {log.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white p-2 font-mono text-xs max-h-48 overflow-y-auto">
            {log.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
