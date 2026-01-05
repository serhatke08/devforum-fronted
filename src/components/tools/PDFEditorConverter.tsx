'use client';

import { ArrowLeft, FileText, Upload, Download, ArrowRight, RefreshCw, CheckCircle, ChevronDown, ChevronUp, X, Plus, FileImage, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import { useState, useRef } from 'react';
import jsPDF from 'jspdf';

interface PDFEditorConverterProps {
  onBack: () => void;
}

const supportedFormats = [
  { id: 'jpeg', name: 'JPEG', extension: '.jpg', color: 'bg-blue-500' },
  { id: 'jpg', name: 'JPG', extension: '.jpg', color: 'bg-blue-500' },
  { id: 'png', name: 'PNG', extension: '.png', color: 'bg-green-500' },
  { id: 'svg', name: 'SVG', extension: '.svg', color: 'bg-purple-500' },
  { id: 'pdf', name: 'PDF', extension: '.pdf', color: 'bg-red-500' },
  { id: 'webp', name: 'WebP', extension: '.webp', color: 'bg-orange-500' },
  { id: 'gif', name: 'GIF', extension: '.gif', color: 'bg-pink-500' },
  { id: 'bmp', name: 'BMP', extension: '.bmp', color: 'bg-gray-500' },
  { id: 'tiff', name: 'TIFF', extension: '.tiff', color: 'bg-indigo-500' },
  { id: 'ico', name: 'ICO', extension: '.ico', color: 'bg-yellow-500' }
];

interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  pageOrder?: number;
}

export function PDFEditorConverter({ onBack }: PDFEditorConverterProps) {
  const [sourceFormat, setSourceFormat] = useState<string>('');
  const [targetFormat, setTargetFormat] = useState<string>('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConverted, setIsConverted] = useState(false);
  const [convertedFileName, setConvertedFileName] = useState<string>('');
  const [isSourceOpen, setIsSourceOpen] = useState(false);
  const [isTargetOpen, setIsTargetOpen] = useState(false);
  const [mergeToPdf, setMergeToPdf] = useState(false);
  const [hoveredFile, setHoveredFile] = useState<UploadedFile | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newFiles: UploadedFile[] = [];
      
      Array.from(files).forEach((file, index) => {
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        const selectedSourceFormat = supportedFormats.find(f => f.id === fileExtension);
        
        if (selectedSourceFormat) {
          const fileId = Math.random().toString(36).substr(2, 9);
          const uploadedFile: UploadedFile = {
            id: fileId,
            file: file,
            preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
            pageOrder: uploadedFiles.length + index + 1
          };
          newFiles.push(uploadedFile);
        }
      });
      
      if (newFiles.length > 0) {
        setUploadedFiles(prev => [...prev, ...newFiles]);
        if (!sourceFormat && newFiles.length > 0) {
          const firstFileExtension = newFiles[0].file.name.split('.').pop()?.toLowerCase();
          const selectedSourceFormat = supportedFormats.find(f => f.id === firstFileExtension);
          if (selectedSourceFormat) {
            setSourceFormat(selectedSourceFormat.id);
          }
        }
      } else {
        alert('Desteklenmeyen dosya formatı. Lütfen desteklenen formatlardan birini seçin.');
      }
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => {
      const updatedFiles = prev.filter(f => f.id !== fileId);
      if (updatedFiles.length === 0) {
        setSourceFormat('');
        setTargetFormat('');
        setIsConverted(false);
      }
      return updatedFiles;
    });
  };

  const clearAllFiles = () => {
    setUploadedFiles([]);
    setSourceFormat('');
    setTargetFormat('');
    setIsConverted(false);
    setConvertedFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const moveFileUp = (fileId: string) => {
    setUploadedFiles(prev => {
      const currentIndex = prev.findIndex(f => f.id === fileId);
      if (currentIndex > 0) {
        const newFiles = [...prev];
        [newFiles[currentIndex], newFiles[currentIndex - 1]] = [newFiles[currentIndex - 1], newFiles[currentIndex]];
        return newFiles.map((file, index) => ({ ...file, pageOrder: index + 1 }));
      }
      return prev;
    });
  };

  const moveFileDown = (fileId: string) => {
    setUploadedFiles(prev => {
      const currentIndex = prev.findIndex(f => f.id === fileId);
      if (currentIndex < prev.length - 1) {
        const newFiles = [...prev];
        [newFiles[currentIndex], newFiles[currentIndex + 1]] = [newFiles[currentIndex + 1], newFiles[currentIndex]];
        return newFiles.map((file, index) => ({ ...file, pageOrder: index + 1 }));
      }
      return prev;
    });
  };

  const sortedFiles = [...uploadedFiles].sort((a, b) => (a.pageOrder || 0) - (b.pageOrder || 0));

  const handleMouseEnter = (file: UploadedFile, event: React.MouseEvent) => {
    setHoveredFile(file);
    setHoverPosition({ x: event.clientX, y: event.clientY });
  };

  const handleMouseLeave = () => {
    setHoveredFile(null);
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    setHoverPosition({ x: event.clientX, y: event.clientY });
  };

  const handleConvert = async () => {
    if (!sourceFormat || !targetFormat || uploadedFiles.length === 0) {
      alert('Lütfen kaynak format, hedef format seçin ve dosya yükleyin.');
      return;
    }

    if (sourceFormat === targetFormat) {
      alert('Kaynak ve hedef format aynı olamaz.');
      return;
    }

    setIsProcessing(true);
    
    try {
      if (targetFormat === 'pdf' && mergeToPdf) {
        // PDF birleştirme
        await createMergedPDF();
      } else {
        // Tek dosya dönüştürme
        await convertSingleFile();
      }
    } catch (error) {
      console.error('Dönüştürme hatası:', error);
      alert('Dönüştürme sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsProcessing(false);
    }
  };

  const createMergedPDF = async () => {
    return new Promise<void>((resolve) => {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pageWidth - (margin * 2);
      const contentHeight = pageHeight - (margin * 2);

      let currentPage = 0;
      let processedImages = 0;

      const processImage = (file: UploadedFile, index: number) => {
        return new Promise<void>((imageResolve) => {
          if (file.preview) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
              // Resim boyutlarını hesapla
              const imgAspectRatio = img.width / img.height;
              const contentAspectRatio = contentWidth / contentHeight;
              
              let imgWidth, imgHeight, imgX, imgY;
              
              if (imgAspectRatio > contentAspectRatio) {
                // Resim daha geniş
                imgWidth = contentWidth;
                imgHeight = contentWidth / imgAspectRatio;
                imgX = margin;
                imgY = margin + (contentHeight - imgHeight) / 2;
              } else {
                // Resim daha yüksek
                imgHeight = contentHeight;
                imgWidth = contentHeight * imgAspectRatio;
                imgX = margin + (contentWidth - imgWidth) / 2;
                imgY = margin;
              }

              // Yeni sayfa ekle (ilk resim hariç)
              if (index > 0) {
                pdf.addPage();
                currentPage++;
              }

              // Resmi PDF'e ekle
              pdf.addImage(img, 'JPEG', imgX, imgY, imgWidth, imgHeight);
              
              // Sayfa numarası ekle
              pdf.setFontSize(10);
              pdf.setTextColor(100, 100, 100);
              pdf.text(`Sayfa ${index + 1}`, margin, pageHeight - 5);
              
              processedImages++;
              
              // Tüm resimler işlendiyse PDF'i indir
              if (processedImages === sortedFiles.length) {
                const pdfBlob = pdf.output('blob');
                const url = URL.createObjectURL(pdfBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'merged_document.pdf';
                link.click();
                URL.revokeObjectURL(url);
                
                setIsConverted(true);
                setConvertedFileName('merged_document.pdf');
                resolve();
              }
              
              imageResolve();
            };
            
            img.onerror = () => {
              console.error('Resim yüklenemedi:', file.file.name);
              processedImages++;
              
              if (processedImages === sortedFiles.length) {
                const pdfBlob = pdf.output('blob');
                const url = URL.createObjectURL(pdfBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'merged_document.pdf';
                link.click();
                URL.revokeObjectURL(url);
                
                setIsConverted(true);
                setConvertedFileName('merged_document.pdf');
                resolve();
              }
              
              imageResolve();
            };
            
            img.src = file.preview;
          } else {
            processedImages++;
            if (processedImages === sortedFiles.length) {
              const pdfBlob = pdf.output('blob');
              const url = URL.createObjectURL(pdfBlob);
              const link = document.createElement('a');
              link.href = url;
              link.download = 'merged_document.pdf';
              link.click();
              URL.revokeObjectURL(url);
              
              setIsConverted(true);
              setConvertedFileName('merged_document.pdf');
              resolve();
            }
            imageResolve();
          }
        });
      };

      // Tüm resimleri işle
      const processAllImages = async () => {
        for (let i = 0; i < sortedFiles.length; i++) {
          await processImage(sortedFiles[i], i);
        }
      };

      processAllImages();
    });
  };

  const convertSingleFile = async () => {
    // Tek dosya dönüştürme simülasyonu
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const baseName = uploadedFiles[0].file.name.split('.')[0];
    const targetFormatData = supportedFormats.find(f => f.id === targetFormat);
    setConvertedFileName(`${baseName}${targetFormatData?.extension || '.converted'}`);
    setIsConverted(true);
  };

  const handleDownload = () => {
    if (uploadedFiles.length > 0 && isConverted) {
      // Simulate download - in real app, this would be the converted file
      const link = document.createElement('a');
      link.href = URL.createObjectURL(uploadedFiles[0].file);
      link.download = convertedFileName;
      link.click();
    }
  };

  const handleReset = () => {
    setSourceFormat('');
    setTargetFormat('');
    setUploadedFiles([]);
    setIsProcessing(false);
    setIsConverted(false);
    setConvertedFileName('');
    setIsSourceOpen(false);
    setIsTargetOpen(false);
    setMergeToPdf(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSourceFormatSelect = (formatId: string) => {
    setSourceFormat(formatId);
    setTargetFormat(''); // Hedef formatı sıfırla
    setUploadedFiles([]);
    setIsConverted(false);
    setConvertedFileName('');
    setMergeToPdf(false);
    setIsTargetOpen(true); // Hedef kısmını aç
  };

  const getAcceptedTypes = () => {
    if (!sourceFormat) return '*/*';
    const format = supportedFormats.find(f => f.id === sourceFormat);
    return format ? `image/${format.id},application/pdf` : '*/*';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 py-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="p-2 bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] rounded-lg flex-shrink-0">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-2xl font-black text-gray-900 truncate">Format Dönüştürücü</h1>
                <p className="text-xs sm:text-base text-gray-600 truncate">Tüm dosya formatlarınızı kolayca dönüştürün</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Uygulama Logosu */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Format Dönüştürücü</h1>
          <p className="text-xl text-gray-600">Tüm dosya formatlarınızı kolayca dönüştürün</p>
        </div>

        {/* Ana İçerik - İki Kısımlı Format Dönüştürücü */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] mb-4">
                <RefreshCw className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Format Dönüştürücü</h2>
              <p className="text-gray-600 mb-6">
                Dosyalarınızı farklı formatlara dönüştürün
              </p>
            </div>

            {/* Sol-Orta-Sağ Düzeni */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Sol Kısım - 1. Kaynak Format */}
              <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-lg">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-[#9c6cfe] to-[#8b5cf6] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold text-2xl">1</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Kaynak Format</h3>
                  <p className="text-gray-600 text-sm">
                    {sourceFormat ? `${sourceFormat.toUpperCase()} seçildi` : 'Dönüştürmek istediğiniz formatı seçin'}
                  </p>
                </div>

                {/* Format Seçimi */}
                <div className="space-y-3">
                  {supportedFormats.map((format) => (
                    <button
                      key={format.id}
                      onClick={() => handleSourceFormatSelect(format.id)}
                      className={`w-full p-4 rounded-xl border-2 transition-all duration-200 ${
                        sourceFormat === format.id
                          ? 'border-[#9c6cfe] bg-[#9c6cfe]/10 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl ${format.color} flex items-center justify-center shadow-sm`}>
                          <span className="text-white text-sm font-bold">{format.name.charAt(0)}</span>
                        </div>
                        <span className="font-semibold text-gray-900">{format.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Orta Kısım - Dosya Girişi ve Çıkışı */}
              <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-lg">
                {/* Üst Kısım - Dosya Girişi */}
                <div className="mb-8">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Dosya Girişi</h3>
                    <p className="text-gray-600 text-sm">Dönüştürülecek dosyaları yükleyin</p>
                  </div>

                  {sourceFormat ? (
                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-[#9c6cfe] transition-colors">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept={getAcceptedTypes()}
                          onChange={handleFileUpload}
                          multiple
                          className="hidden"
                          id="file-upload"
                        />
                        <label
                          htmlFor="file-upload"
                          className="cursor-pointer flex flex-col items-center"
                        >
                          <Upload className="w-12 h-12 text-gray-400 mb-3" />
                          <span className="font-semibold text-gray-700 mb-1">
                            {sourceFormat.toUpperCase()} Dosyaları Seçin
                          </span>
                          <span className="text-sm text-gray-500">
                            Birden fazla dosya seçebilirsiniz
                          </span>
                        </label>
                      </div>

                      {/* PDF Birleştirme Seçeneği */}
                      {sourceFormat !== 'pdf' && targetFormat === 'pdf' && uploadedFiles.length > 1 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              id="mergeToPdf"
                              checked={mergeToPdf}
                              onChange={(e) => setMergeToPdf(e.target.checked)}
                              className="w-4 h-4 text-blue-600 rounded"
                            />
                            <label htmlFor="mergeToPdf" className="text-sm font-medium text-blue-900">
                              Tüm dosyaları tek PDF'e birleştir
                            </label>
                          </div>
                          <p className="text-xs text-blue-700 mt-1">
                            {uploadedFiles.length} dosya tek PDF belgesi olarak birleştirilecek
                          </p>
                        </div>
                      )}

                      {/* Yüklenen Dosyalar */}
                      {uploadedFiles.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-gray-900">
                              PDF Sayfa Sıralaması ({uploadedFiles.length} sayfa)
                            </h4>
                            <button
                              onClick={clearAllFiles}
                              className="text-sm text-red-600 hover:text-red-800 font-medium"
                            >
                              Temizle
                            </button>
                          </div>
                          
                          <div className="max-h-48 overflow-y-auto space-y-2">
                            {sortedFiles.map((uploadedFile, index) => (
                              <div
                                key={uploadedFile.id}
                                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer"
                                onMouseEnter={(e) => handleMouseEnter(uploadedFile, e)}
                                onMouseLeave={handleMouseLeave}
                                onMouseMove={handleMouseMove}
                              >
                                {/* Sayfa Numarası */}
                                <div className="w-8 h-8 bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-white font-bold text-sm">
                                    {uploadedFile.pageOrder || index + 1}
                                  </span>
                                </div>

                                {/* Dosya Önizleme */}
                                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                                  {uploadedFile.preview ? (
                                    <img
                                      src={uploadedFile.preview}
                                      alt="Preview"
                                      className="w-full h-full object-cover rounded-lg"
                                    />
                                  ) : (
                                    <FileImage className="w-6 h-6 text-gray-500" />
                                  )}
                                </div>

                                {/* Dosya Bilgisi */}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 text-sm truncate">
                                    {uploadedFile.file.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                </div>

                                {/* Sıralama Butonları */}
                                <div className="flex flex-col gap-1">
                                  <button
                                    onClick={() => moveFileUp(uploadedFile.id)}
                                    disabled={index === 0}
                                    className="p-1 hover:bg-gray-200 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                  >
                                    <ArrowUp className="w-3 h-3 text-gray-600" />
                                  </button>
                                  <button
                                    onClick={() => moveFileDown(uploadedFile.id)}
                                    disabled={index === sortedFiles.length - 1}
                                    className="p-1 hover:bg-gray-200 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                  >
                                    <ArrowDown className="w-3 h-3 text-gray-600" />
                                  </button>
                                </div>

                                {/* Silme Butonu */}
                                <button
                                  onClick={() => removeFile(uploadedFile.id)}
                                  className="p-1 hover:bg-red-100 rounded-lg transition-colors"
                                >
                                  <X className="w-4 h-4 text-red-500" />
                                </button>
                              </div>
                            ))}
                          </div>

                          {/* Sıralama Bilgisi */}
                          {mergeToPdf && uploadedFiles.length > 1 && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <div className="flex items-center gap-2">
                                <GripVertical className="w-4 h-4 text-blue-600" />
                                <p className="text-sm text-blue-800">
                                  Dosyaları yukarı/aşağı oklarla sıralayın. PDF'de bu sırayla birleştirilecek.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-gray-400 text-2xl">📁</span>
                      </div>
                      <p className="text-gray-500 font-medium">Önce kaynak format seçin</p>
                    </div>
                  )}
                </div>

                {/* Alt Kısım - Dosya Çıkışı */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Dosya Çıkışı</h3>
                    <p className="text-gray-600 text-sm">Dönüştürülen dosyaları indirin</p>
                  </div>

                  {/* Dönüştürme İkonu ve Butonu */}
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                      {isProcessing ? (
                        <RefreshCw className="w-10 h-10 text-white animate-spin" />
                      ) : (
                        <ArrowRight className="w-10 h-10 text-white" />
                      )}
                    </div>

                    {/* Dönüştürme Butonu */}
                    {sourceFormat && targetFormat && uploadedFiles.length > 0 && !isConverted && (
                      <button
                        onClick={handleConvert}
                        disabled={isProcessing}
                        className="px-6 py-3 bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                      >
                        {isProcessing ? (
                          <>
                            <RefreshCw className="w-5 h-5 animate-spin" />
                            Dönüştürülüyor...
                          </>
                        ) : (
                          <>
                            <ArrowRight className="w-5 h-5" />
                            Dönüştür
                          </>
                        )}
                      </button>
                    )}

                    {/* Dönüştürme Sonucu */}
                    {isConverted && (
                      <div className="mt-4">
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                          <CheckCircle className="w-6 h-6 text-white" />
                        </div>
                        <p className="font-semibold text-green-900 mb-2">Tamamlandı!</p>
                        <p className="text-sm text-gray-600 mb-3">{convertedFileName}</p>
                        <button
                          onClick={handleDownload}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2 mx-auto"
                        >
                          <Download className="w-4 h-4" />
                          İndir
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sağ Kısım - 2. Hedef Format */}
              <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-lg">
                <div className="text-center mb-6">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                    !sourceFormat ? 'bg-gray-400' : 'bg-gradient-to-r from-[#0ad2dd] to-[#06b6d4]'
                  }`}>
                    <span className="text-white font-bold text-2xl">2</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Hedef Format</h3>
                  <p className="text-gray-600 text-sm">
                    {!sourceFormat 
                      ? 'Önce kaynak format seçin' 
                      : targetFormat 
                        ? `${targetFormat.toUpperCase()} seçildi` 
                        : 'Dönüştürülecek formatı seçin'
                    }
                  </p>
                </div>

                {/* Hedef Format Seçimi */}
                {sourceFormat ? (
                  <div className="space-y-3">
                    {supportedFormats.map((format) => (
                      <button
                        key={format.id}
                        onClick={() => setTargetFormat(format.id)}
                        disabled={format.id === sourceFormat}
                        className={`w-full p-4 rounded-xl border-2 transition-all duration-200 ${
                          targetFormat === format.id
                            ? 'border-[#0ad2dd] bg-[#0ad2dd]/10 shadow-md'
                            : format.id === sourceFormat
                            ? 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-50'
                            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl ${format.color} flex items-center justify-center shadow-sm`}>
                            <span className="text-white text-sm font-bold">{format.name.charAt(0)}</span>
                          </div>
                          <span className="font-semibold text-gray-900">{format.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-gray-400 text-2xl">⏳</span>
                    </div>
                    <p className="text-gray-500 font-medium">Kaynak format seçin</p>
                  </div>
                )}
              </div>
            </div>

            {/* Reset Butonu */}
            {(sourceFormat || targetFormat || uploadedFiles.length > 0) && (
              <div className="mt-8 text-center">
                <button
                  onClick={handleReset}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Sıfırla
                </button>
              </div>
            )}

            {/* Hover Preview Modal */}
            {hoveredFile && (
              <div
                className="fixed z-50 pointer-events-none"
                style={{
                  left: `${hoverPosition.x - 400}px`,
                  top: `${hoverPosition.y - 20}px`,
                  transform: 'translateY(-50%)'
                }}
              >
                <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 max-w-sm">
                  {/* Sayfa Numarası */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {hoveredFile.pageOrder || 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        Sayfa {hoveredFile.pageOrder || 1}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(hoveredFile.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>

                  {/* Büyük Önizleme */}
                  <div className="w-80 h-96 bg-gray-100 rounded-lg overflow-hidden mb-3">
                    {hoveredFile.preview ? (
                      <img
                        src={hoveredFile.preview}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileImage className="w-20 h-20 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Dosya Adı */}
                  <p className="font-medium text-gray-900 text-sm truncate">
                    {hoveredFile.file.name}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Özellikler */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <RefreshCw className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Çoklu Format Desteği</h3>
            <p className="text-gray-600 text-sm">
              JPEG, PNG, SVG, PDF, WebP ve daha fazla format arasında dönüştürme yapın.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <ArrowRight className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Kolay Dönüştürme</h3>
            <p className="text-gray-600 text-sm">
              Sadece kaynak ve hedef formatı seçin, dosyayı yükleyin ve dönüştürün.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Download className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Hızlı İndirme</h3>
            <p className="text-gray-600 text-sm">
              Dönüştürülen dosyalarınızı anında indirin ve kullanmaya başlayın.
            </p>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">Evrensel Format Dönüştürücü</h3>
            <p className="text-white/90 mb-6">
              Tüm dosya formatlarınızı kolayca dönüştürün. 
              Güvenli ve hızlı işlemler için tasarlandı.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <span className="bg-white/20 px-3 py-1 rounded-full">JPEG/PNG</span>
              <span className="bg-white/20 px-3 py-1 rounded-full">PDF/SVG</span>
              <span className="bg-white/20 px-3 py-1 rounded-full">WebP/GIF</span>
              <span className="bg-white/20 px-3 py-1 rounded-full">Güvenli İşlem</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
