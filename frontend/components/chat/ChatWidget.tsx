import React, { useState, useRef } from 'react';
import mermaid from 'mermaid';

// You can place these SVG icons in a separate file if you wish
const BackIcon = () => (
  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M15 18l-6-6 6-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const DownloadIcon = () => (
  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 16v-8M8 12l4 4 4-4M4 20h16" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const ZoomInIcon = () => (
  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="11" cy="11" r="8" stroke="#fff" strokeWidth="2"/>
    <path d="M11 8v6M8 11h6" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
    <path d="M21 21l-4.35-4.35" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const ZoomOutIcon = () => (
  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="11" cy="11" r="8" stroke="#fff" strokeWidth="2"/>
    <path d="M8 11h6" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
    <path d="M21 21l-4.35-4.35" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const MaximizeIcon = () => (
  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="4" y="4" width="16" height="16" rx="2" stroke="#fff" strokeWidth="2"/>
    <path d="M8 8h8v8" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const RestoreIcon = () => (
  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="6" y="6" width="12" height="12" rx="2" stroke="#fff" strokeWidth="2"/>
    <path d="M10 10h4v4" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

type ChatWidgetProps = {
  response: string;
};

function parseMermaidFromResponse(response: string): string {
  const classSet = new Set<string>();
  const classRegex = /`([\w]+)`/g;
  let match;
  while ((match = classRegex.exec(response)) !== null) {
    classSet.add(match[1]);
  }
  const relationshipRegex = /`([\w]+)`.*(?:depends on|via)\s*`([\w]+)`/gi;
  const relationships: Array<{ from: string; to: string }> = [];
  let relMatch;
  while ((relMatch = relationshipRegex.exec(response)) !== null) {
    relationships.push({ from: relMatch[1], to: relMatch[2] });
    classSet.add(relMatch[1]);
    classSet.add(relMatch[2]);
  }
  let mermaidCode = 'classDiagram\n';
  classSet.forEach(className => {
    mermaidCode += `    class ${className}\n`;
  });
  relationships.forEach(rel => {
    mermaidCode += `    ${rel.from} --> ${rel.to} : depends on\n`;
  });
  if (relationships.length === 0 && classSet.size > 0) {
    mermaidCode += '    %% No explicit relationships found\n';
  }
  return mermaidCode;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ response }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showFlip, setShowFlip] = useState(false);
  const [svgCode, setSvgCode] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [maximized, setMaximized] = useState(false);
  const [splitView, setSplitView] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [cliPage, setCliPage] = useState<'text' | 'cli'>('cli');
  const menuRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Download response as a text file
  const handleDownload = () => {
    const blob = new Blob([response], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chat-response.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    setMenuOpen(false);
  };

  // Convert response to Mermaid class diagram code and download
  const handleConvertToMermaid = () => {
    const mermaidCode = `\`\`\`mermaid\n${parseMermaidFromResponse(response)}\n\`\`\``;
    const blob = new Blob([mermaidCode], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'class-diagram.mmd.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    setMenuOpen(false);
  };

  // Generate Mermaid SVG and show as flip page
  const handleShowMermaidSVG = async () => {
    const mermaidCode = parseMermaidFromResponse(response);
    try {
      mermaid.initialize({ startOnLoad: false });
      const uniqueId = 'mermaid-svg-' + Math.random().toString(36).substr(2, 9);
      const { svg } = await mermaid.render(uniqueId, mermaidCode);
      setSvgCode(svg);
      setShowFlip(true);
      setMenuOpen(false);
      setZoom(1);
      // Do NOT reset maximized here, preserve current state
      setSplitView(false); // Ensure split view is disabled
    } catch (err) {
      setSvgCode('<svg><text x="10" y="20">Error rendering diagram</text></svg>');
      setShowFlip(true);
      setMenuOpen(false);
      setZoom(1);
      // Do NOT reset maximized here, preserve current state
      setSplitView(false); // Ensure split view is disabled
    }
  };

  // CLI instructions generator
  const getCliInstructions = () => {
    const mermaidCode = parseMermaidFromResponse(response);
    return [
      'To generate a class diagram SVG using Mermaid CLI:',
      '',
      '1. Save the following code to a file, e.g., class-diagram.mmd:',
      '',
      mermaidCode,
      '',
      '2. Run the following command in your terminal:',
      '',
      '   mmdc -i class-diagram.mmd -o class-diagram.svg',
      '',
      'You need to have Mermaid CLI installed: https://github.com/mermaid-js/mermaid-cli',
    ].join('\n');
  };

  // Generate Mermaid class diagram SVG using Mermaid CLI instructions
  const handleGenerateMermaidSVG = () => {
    const mermaidCode = parseMermaidFromResponse(response);
    const cliInstructions = [
      'To generate a class diagram SVG using Mermaid CLI:',
      '',
      '1. Save the following code to a file, e.g., class-diagram.mmd:',
      '',
      mermaidCode,
      '',
      '2. Run the following command in your terminal:',
      '',
      '   mmdc -i class-diagram.mmd -o class-diagram.svg',
      '',
      'You need to have Mermaid CLI installed: https://github.com/mermaid-js/mermaid-cli',
    ].join('\n');
    const blob = new Blob([cliInstructions], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mermaid-cli-instructions.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    setMenuOpen(false);
  };

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  // Ensure image is generated when splitView is activated
  React.useEffect(() => {
    if (splitView && showFlip && !svgCode) {
      const mermaidCode = parseMermaidFromResponse(response);
      mermaid.initialize({ startOnLoad: false });
      const uniqueId = 'mermaid-svg-' + Math.random().toString(36).substr(2, 9);
      mermaid.render(uniqueId, mermaidCode)
        .then(({ svg }) => setSvgCode(svg))
        .catch(() => setSvgCode('<svg><text x="10" y="20">Error rendering diagram</text></svg>'));
    }
  }, [splitView, showFlip, svgCode, response]);

  // Update flipStyles so the widget never exceeds its parent (chat window) width when maximized
  const flipStyles = {
    perspective: '1000px',
    position: 'relative',
    width: '100%', // always 100% of parent
    maxWidth: '100%', // never exceed parent width
    left: maximized ? 0 : undefined,
    top: maximized ? 0 : undefined,
    zIndex: maximized ? 50 : undefined,
    background: maximized ? 'rgba(255,255,255,0.98)' : undefined,
    minHeight: maximized ? '70vh' : undefined,
    maxHeight: maximized ? '80vh' : undefined,
    boxShadow: maximized ? '0 0 0 9999px rgba(0,0,0,0.2)' : undefined,
    overflow: maximized ? 'hidden' : undefined,
  };
  const cardStyles = {
    transition: 'transform 0.6s',
    transformStyle: 'preserve-3d' as const,
    position: 'relative' as const,
    width: '100%',
  };
  const frontStyles = {
    backfaceVisibility: 'hidden' as const,
    position: showFlip ? 'absolute' as const : 'relative' as const,
    width: '100%',
    top: 0,
    left: 0,
    display: showFlip ? 'none' : 'block',
  };
  // Update backStyles to also respect parent width
  const backStyles = {
    backfaceVisibility: 'hidden' as const,
    position: showFlip ? 'relative' as const : 'absolute' as const,
    width: '100%',
    top: 0,
    left: 0,
    transform: showFlip ? 'rotateY(0deg)' : 'rotateY(180deg)',
    background: '#fff',
    borderRadius: '0.5rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    padding: '1rem',
    zIndex: 2,
    display: showFlip ? 'block' : 'none',
    minHeight: maximized ? '60vh' : undefined,
    maxHeight: maximized ? '75vh' : undefined,
    overflow: maximized ? 'auto' : undefined,
  };

  // Handler functions for drag-to-scroll
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    if (imageContainerRef.current) {
      imageContainerRef.current.style.cursor = 'grabbing';
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
    if (imageContainerRef.current) {
      imageContainerRef.current.style.cursor = 'grab';
    }
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setDragStart(null);
    if (imageContainerRef.current) {
      imageContainerRef.current.style.cursor = 'grab';
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging && dragStart && imageContainerRef.current) {
      imageContainerRef.current.scrollLeft -= e.clientX - dragStart.x;
      imageContainerRef.current.scrollTop -= e.clientY - dragStart.y;
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  return (
    <div className="relative bg-blue-50 border border-blue-200 rounded-lg shadow p-4 mb-4" style={flipStyles}>
      {/* Menu element with only three dots menu */}
      <menu className="absolute top-3 right-3 z-10" ref={menuRef}>
        <button
          className="p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-700 hover:bg-blue-100"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Show options"
          aria-haspopup="true"
          aria-expanded={menuOpen}
          style={{ zIndex: 100 }}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
            <circle cx="5" cy="11" r="2" fill="#2563eb" />
            <circle cx="11" cy="11" r="2" fill="#2563eb" />
            <circle cx="17" cy="11" r="2" fill="#2563eb" />
          </svg>
        </button>
        {menuOpen && (
          <div
            className="absolute right-0 mt-2 w-64 bg-white border border-blue-200 rounded-lg shadow-lg"
            role="menu"
            aria-label="Chat widget options"
            style={{ zIndex: 101 }}
          >
            <button
              className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 rounded-lg focus:outline-none focus:bg-blue-100"
              onClick={handleDownload}
              role="menuitem"
            >
              <DownloadIcon /> Download as text
            </button>
            <button
              className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 rounded-lg focus:outline-none focus:bg-blue-100"
              onClick={handleConvertToMermaid}
              role="menuitem"
            >
              <DownloadIcon /> Mermaid Class Diagram code
            </button>
            <button
              className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 rounded-lg focus:outline-none focus:bg-blue-100"
              onClick={handleGenerateMermaidSVG}
              role="menuitem"
            >
              <DownloadIcon /> CLI Instructions
            </button>
            <button
              className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 rounded-lg focus:outline-none focus:bg-blue-100"
              onClick={handleShowMermaidSVG}
              role="menuitem"
            >
              <MaximizeIcon /> Show Class Diagram
            </button>
            <button
              className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 rounded-lg focus:outline-none focus:bg-blue-100"
              onClick={() => { setSplitView(true); setShowFlip(true); setMenuOpen(false); /* do not change maximized */ }}
              role="menuitem"
            >
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3" y="3" width="8" height="18" rx="2" fill="#2563eb" />
                <rect x="13" y="3" width="8" height="18" rx="2" fill="#2563eb" />
              </svg>
              Split CLI & Diagram
            </button>
          </div>
        )}
      </menu>
      {/* Add top margin so content starts below the menu */}
      <div style={{ ...cardStyles, marginTop: '3.5rem' }}>
        {/* Front side: text response */}
        <div style={frontStyles}>
          {!showFlip && (
            <div
              className="text-gray-900 whitespace-pre-wrap font-mono text-base"
              aria-live="polite"
              tabIndex={0}
            >
              {response}
            </div>
          )}
        </div>
        {/* Back side: SVG diagram or split view */}
        <div style={{
          ...backStyles,
          minWidth: maximized ? '80vw' : '600px',
          maxWidth: maximized ? 'calc(100vw - 6rem)' : '1000px',
        }}>
          {showFlip && !splitView && (
            <div>
              <div className="flex flex-wrap justify-between items-center mb-2 gap-2">
                <button
                  className="px-3 py-1 bg-blue-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-700 flex items-center gap-1"
                  onClick={() => {
                    setShowFlip(false);
                    setMaximized(false);
                    setSplitView(false);
                  }}
                  title="Back to Text"
                >
                  <BackIcon /> 
                </button>
                <button
                  className="px-3 py-1 bg-blue-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-700 flex items-center gap-1"
                  onClick={() => {
                    if (!svgCode) return;
                    const blob = new Blob([svgCode], { type: 'image/svg+xml' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'class-diagram.svg';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                  }}
                  title="Download Image"
                >
                  <DownloadIcon />
                </button>
                <button
                  className="px-3 py-1 bg-blue-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-700 flex items-center gap-1"
                  onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
                  disabled={zoom <= 0.5}
                  title="Zoom Out"
                >
                  <ZoomOutIcon />
                </button>
                <span className="px-2 font-mono text-blue-700">{Math.round(zoom * 100)}%</span>
                <button
                  className="px-3 py-1 bg-blue-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-700 flex items-center gap-1"
                  onClick={() => setZoom(z => Math.min(3, z + 0.25))}
                  disabled={zoom >= 3}
                  title="Zoom In"
                >
                  <ZoomInIcon />
                </button>
                <button
                  className="px-3 py-1 bg-blue-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-700 flex items-center gap-1"
                  onClick={() => setMaximized(m => !m)}
                  title={maximized ? "Restore" : "Maximize"}
                >
                  {maximized ? <RestoreIcon /> : <MaximizeIcon />}
                </button>
              </div>
              <div
                ref={imageContainerRef}
                className="overflow-auto flex justify-center items-center"
                aria-label="Mermaid Class Diagram"
                style={{
                  minHeight: maximized ? 350 : 350,
                  maxHeight: maximized ? '65vh' : 600,
                  background: '#fff',
                  borderRadius: '0.5rem',
                  boxShadow: maximized ? '0 2px 16px rgba(0,0,0,0.18)' : undefined,
                  padding: maximized ? '2rem' : undefined,
                  minWidth: maximized ? '60vw' : '600px',
                  maxWidth: '100%', // never exceed widget width
                  width: '100%',
                  cursor: 'grab',
                  userSelect: 'none',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onMouseMove={handleMouseMove}
                tabIndex={0}
              >
                <div
                  style={{
                    width: '100%',
                    maxWidth: maximized ? '90vw' : 1000,
                    minWidth: maximized ? 600 : 600,
                    minHeight: maximized ? 350 : 350,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    transform: `scale(${zoom})`,
                    transformOrigin: 'top center',
                    pointerEvents: 'none',
                  }}
                  dangerouslySetInnerHTML={{ __html: svgCode || '' }}
                />
              </div>
            </div>
          )}
          {showFlip && splitView && (
            <div className="flex flex-col md:flex-row gap-4 relative">
              {/* CLI Instructions & Original Text Side with Pagination */}
              <div
                className="bg-gray-100 rounded p-3 font-mono text-xs overflow-auto"
                style={{
                  flex: 1,
                  minWidth: 0,
                  minHeight: maximized ? 350 : 350,
                  maxHeight: maximized ? '60vh' : 400,
                  height: maximized ? '60vh' : 400,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Pagination Controls */}
                <div className="flex gap-2 mb-2">
                  <button
                    className={`px-3 py-1 rounded ${cliPage === 'text' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-700'}`}
                    onClick={() => setCliPage('text')}
                  >
                    Original Text
                  </button>
                  <button
                    className={`px-3 py-1 rounded ${cliPage === 'cli' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-700'}`}
                    onClick={() => setCliPage('cli')}
                  >
                    CLI Instructions
                  </button>
                </div>
                {/* Page Content */}
                <div style={{ flex: 1, overflow: 'auto' }}>
                  {cliPage === 'text' ? (
                    <div className="whitespace-pre-wrap font-mono text-base text-gray-900">{response}</div>
                  ) : (
                    <>
                      <div className="font-bold mb-2 text-blue-700">CLI Instructions</div>
                      <pre style={{ whiteSpace: 'pre-wrap' }}>{getCliInstructions()}</pre>
                    </>
                  )}
                </div>
              </div>
              {/* Diagram Side */}
              <div
                className="overflow-auto flex flex-col items-center bg-white rounded p-3"
                aria-label="Mermaid Class Diagram"
                style={{
                  flex: 1,
                  minWidth: 0,
                  minHeight: maximized ? 350 : 350,
                  maxHeight: maximized ? '60vh' : 400,
                  height: maximized ? '60vh' : 400,
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Top right controls: Back, Zoom (when maximized), Maximize/Restore */}
                <div className="flex gap-2 w-full justify-end absolute top-2 right-2 z-20 items-center">
                  <button
                    className="px-3 py-1 bg-blue-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-700 flex items-center gap-1"
                    onClick={() => {
                      setShowFlip(false);
                      setMaximized(false);
                      setSplitView(false);
                    }}
                    title="Back to Text"
                  >
                    <BackIcon />
                  </button>
                  {maximized && (
                    <>
                      <button
                        className="px-3 py-1 bg-blue-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-700 flex items-center gap-1"
                        onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
                        disabled={zoom <= 0.5}
                        title="Zoom Out"
                      >
                        <ZoomOutIcon />
                      </button>
                      <span className="px-2 font-mono text-blue-700">{Math.round(zoom * 100)}%</span>
                      <button
                        className="px-3 py-1 bg-blue-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-700 flex items-center gap-1"
                        onClick={() => setZoom(z => Math.min(3, z + 0.25))}
                        disabled={zoom >= 3}
                        title="Zoom In"
                      >
                        <ZoomInIcon />
                      </button>
                    </>
                  )}
                  <button
                    className="px-3 py-1 bg-blue-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-700 flex items-center gap-1"
                    onClick={() => setMaximized(m => !m)}
                    title={maximized ? "Restore" : "Maximize"}
                  >
                    {maximized ? <RestoreIcon /> : <MaximizeIcon />}
                  </button>
                </div>
                {/* Add top padding so icons do not overlap diagram */}
                <div style={{ paddingTop: '3rem', width: '100%', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div
                    ref={imageContainerRef}
                    className="overflow-auto"
                    style={{
                      width: '100%',
                      maxWidth: maximized ? '100%' : 1000,
                      minWidth: maximized ? 600 : 350,
                      minHeight: maximized ? 350 : 350,
                      maxHeight: '100%',
                      height: '100%',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      cursor: 'grab',
                      userSelect: 'none',
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    onMouseMove={handleMouseMove}
                    tabIndex={0}
                  >
                    <div
                      style={{
                        width: '100%',
                        transform: maximized ? `scale(${zoom})` : 'none',
                        transformOrigin: 'top center',
                        pointerEvents: 'none', // prevent SVG from capturing mouse events
                      }}
                      dangerouslySetInnerHTML={{ __html: svgCode || '' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatWidget;