import { toPng } from 'html-to-image';
import { Download } from 'lucide-react';
import { useState } from 'react';

export function ExportButton() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    const node = document.getElementById('calendar-export-node');
    if (!node) return;

    try {
      setIsExporting(true);
      
      // We give it a small delay relative to the UI state changes
      await new Promise(r => setTimeout(r, 100));

      const dataUrl = await toPng(node, {
        quality: 1,
        backgroundColor: '#ffffff',
        // Scaling to improve text quality
        pixelRatio: 2,
      });

      const link = document.createElement('a');
      link.download = 'minha-grade-cinsync.png';
      link.href = dataUrl;
      link.click();
      
    } catch (err) {
      console.error('Failed to export calendar', err);
      alert('Houve um erro ao exportar o calendário.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className={`flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors ${
        isExporting ? 'opacity-70 cursor-wait' : ''
      }`}
    >
      <Download size={18} />
      {isExporting ? 'Exportando...' : 'Exportar Grade'}
    </button>
  );
}
